// Importer directement le gestionnaire de sons
import soundManager from '/js/sounds.js';

class ChatManager {
    constructor() {
        this.supabase = supabase.createClient(
            'https://aqedqlzsguvkopucyqbb.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZWRxbHpzZ3V2a29wdWN5cWJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1MDAxNzUsImV4cCI6MjA1MjA3NjE3NX0.tjdnqCIW0dgmzn3VYx0ugCrISLPFMLhOQJBnnC5cfoo'
        );
    
        this.initialized = false;
        this.container = null;
        this.pseudo = localStorage.getItem('chatPseudo');
        this.isAdmin = localStorage.getItem('isAdmin') === 'true';
        this.lastMessageId = 0;
        this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        this.sounds = new Map();
        this.bannedWords = new Set();
        this.notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
        this.subscription = null;
        this.adminPanelOpen = false;
        this.isOpen = localStorage.getItem('chatOpen') === 'true';
        this.unreadCount = parseInt(localStorage.getItem('unreadCount') || '0');
    }

    async init() {
        try {
            await this.loadBannedWords();
            
            this.container = document.createElement('div');
            this.container.className = 'chat-widget';

            if (this.pseudo) {
                this.container.innerHTML = this.getChatHTML();
                console.log('HTML du chat pour utilisateur connecté:', this.container.innerHTML);
            } else {
                this.container.innerHTML = this.getPseudoHTML();
                console.log('HTML du chat pour connexion:', this.container.innerHTML);
            }

            const chatContainer = this.container.querySelector('.chat-container');
            console.log('État initial:', {
                isOpen: this.isOpen,
                chatContainerExists: !!chatContainer,
                materialIconsVisible: !!this.container.querySelector('.material-icons')
            });
            
            if (this.isOpen && chatContainer) {
                chatContainer.classList.add('open');
            }
            
            document.body.appendChild(this.container);

            await this.loadSounds();

            if ('serviceWorker' in navigator && 'PushManager' in window) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    const subscription = await registration.pushManager.getSubscription();
                    if (subscription) {
                        this.subscription = subscription;
                        this.notificationsEnabled = true;
                        console.log('Notifications push déjà activées');
                    }
                } catch (error) {
                    console.error('Erreur initialisation push notifications:', error);
                }
            }

            this.setupListeners();
            this.setupRealtimeSubscription();

            if (this.pseudo) {
                await this.loadExistingMessages();
                this.updateUnreadBadgeAndBubble();
            }

            this.initialized = true;
            console.log("Chat initialisé avec succès");
        } catch (error) {
            console.error('Erreur initialisation:', error);
            if (!document.querySelector('.chat-widget')) {
                document.body.appendChild(this.container);
            }
        }
    }

    async loadBannedWords() {
        try {
            const { data: words, error } = await this.supabase
                .from('banned_words')
                .select('*')
                .order('added_at', { ascending: true });

            if (!error && words) {
                this.bannedWords = new Set(words.map(w => w.word.toLowerCase()));
                const list = document.querySelector('.banned-words-list');
                if (list) {
                    list.innerHTML = words.map(w => `
                        <div class="banned-word">
                            ${w.word}
                            <button class="remove-word" data-word="${w.word}">×</button>
                        </div>
                    `).join('');

                    list.querySelectorAll('.remove-word').forEach(btn => {
                        btn.addEventListener('click', () => this.removeBannedWord(btn.dataset.word));
                    });
                }
            }
        } catch (error) {
            console.error('Erreur loadBannedWords:', error);
            this.bannedWords = new Set();
        }
    }
	getPseudoHTML() {
        return `
            <button class="chat-toggle" title="Ouvrir le chat">
                <i class="material-icons">chat</i>
                <span class="notification-badge hidden">${this.unreadCount}</span>
            </button>
            <div class="chat-container">
                <div class="chat-header">
                    <div class="header-title">Connexion au chat</div>
                    <div class="header-buttons">
                        <button class="sound-btn ${this.soundEnabled ? 'enabled' : ''}" title="Son">
                            <span class="material-icons">${this.soundEnabled ? 'volume_up' : 'volume_off'}</span>
                        </button>
                        <button class="close-chat" title="Fermer">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                </div>
                <div class="chat-login">
                    <input type="text" 
                           id="pseudoInput" 
                           placeholder="Entrez votre pseudo (3-20 caractères)" 
                           maxlength="20">
                    <input type="password" 
                           id="adminPassword" 
                           placeholder="Mot de passe admin (jhd71)" 
                           style="display: none;">
                    <div class="login-buttons">
                        <button id="confirmPseudo">Confirmer</button>
                    </div>
                </div>
            </div>
        `;
    }

    getChatHTML() {
        return `
            <button class="chat-toggle" title="Ouvrir le chat">
                <span class="material-icons">chat</span>
                <span class="notification-badge hidden">${this.unreadCount}</span>
            </button>
            <div class="chat-container">
                <div class="chat-header">
                    <div class="header-title">Chat - ${this.pseudo}</div>
                    <div class="header-buttons">
                        ${this.isAdmin ? `
                            <button class="admin-panel-btn" title="Panel Admin">
                                <span class="material-icons">admin_panel_settings</span>
                            </button>
                        ` : ''}
                        <button class="notifications-btn ${this.notificationsEnabled ? 'enabled' : ''}" title="Notifications">
                            <span class="material-icons">${this.notificationsEnabled ? 'notifications_active' : 'notifications_off'}</span>
                        </button>
                        <button class="sound-btn ${this.soundEnabled ? 'enabled' : ''}" title="Son">
                            <span class="material-icons">${this.soundEnabled ? 'volume_up' : 'volume_off'}</span>
                        </button>
                        <button class="close-chat" title="Fermer">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                </div>
                <div class="chat-messages"></div>
                <div class="chat-input">
                    <input type="text" 
                           placeholder="Votre message..." 
                           maxlength="500">
                    <button title="Envoyer">
                        <span class="material-icons">send</span>
                    </button>
                </div>
            </div>
        `;
    }

    setupListeners() {
        const toggle = this.container.querySelector('.chat-toggle');
        const closeBtn = this.container.querySelector('.close-chat');
        const chatContainer = this.container.querySelector('.chat-container');
        const soundBtn = this.container.querySelector('.sound-btn');
        const notificationsBtn = this.container.querySelector('.notifications-btn');
        const adminBtn = this.container.querySelector('.admin-panel-btn');

        if (toggle) {
            toggle.addEventListener('click', () => {
                const chatContainer = this.container.querySelector('.chat-container');
                this.isOpen = !this.isOpen;
                
                if (this.isOpen) {
                    chatContainer?.classList.add('open');
                    this.unreadCount = 0;
                    localStorage.setItem('unreadCount', '0');
                    
                    const badge = this.container.querySelector('.notification-badge');
                    if (badge) {
                        badge.textContent = '0';
                        badge.classList.add('hidden');
                    }
                    
                    const chatToggle = this.container.querySelector('.chat-toggle');
                    const existingBubble = chatToggle?.querySelector('.info-bubble');
                    if (existingBubble) {
                        existingBubble.remove();
                    }
                    
                    this.scrollToBottom();
                } else {
                    chatContainer?.classList.remove('open');
                }
                
                localStorage.setItem('chatOpen', this.isOpen);
                this.playSound('click');
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.isOpen = false;
                localStorage.setItem('chatOpen', 'false');
                chatContainer?.classList.remove('open');
                this.playSound('click');
            });
        }

        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                this.soundEnabled = !this.soundEnabled;
                localStorage.setItem('soundEnabled', this.soundEnabled);
                soundBtn.classList.toggle('enabled', this.soundEnabled);
                if (this.soundEnabled) {
                    soundBtn.querySelector('.material-icons').textContent = 'volume_up';
                    this.playSound('click');
                } else {
                    soundBtn.querySelector('.material-icons').textContent = 'volume_off';
                }
            });
        }

        if (notificationsBtn) {
            notificationsBtn.addEventListener('click', async () => {
                try {
                    if (this.notificationsEnabled) {
                        await this.unsubscribeFromPushNotifications();
                    } else {
                        await this.setupPushNotifications();
                    }
                    this.playSound('click');
                } catch (error) {
                    console.error('Erreur gestion notifications:', error);
                    this.showNotification('Erreur avec les notifications', 'error');
                }
            });
        }

        if (adminBtn && this.isAdmin) {
            adminBtn.addEventListener('click', () => {
                this.showAdminPanel();
                this.playSound('click');
            });
        }

        if (!this.pseudo) {
            this.setupAuthListeners();
        } else {
            this.setupChatListeners();
        }
    }

    setupAuthListeners() {
        const pseudoInput = this.container.querySelector('#pseudoInput');
        const adminPasswordInput = this.container.querySelector('#adminPassword');
        const confirmButton = this.container.querySelector('#confirmPseudo');

        if (pseudoInput) {
            pseudoInput.addEventListener('input', () => {
                if (pseudoInput.value.trim() === 'jhd71') {
                    adminPasswordInput.style.display = 'block';
                } else {
                    adminPasswordInput.style.display = 'none';
                    adminPasswordInput.value = '';
                }
            });
        }

        if (confirmButton) {
            confirmButton.addEventListener('click', async () => {
                const pseudo = pseudoInput?.value.trim();
                const adminPassword = adminPasswordInput?.value;

                if (!pseudo || pseudo.length < 3) {
                    this.showNotification('Le pseudo doit faire au moins 3 caractères', 'error');
                    this.playSound('error');
                    return;
                }

                if (pseudo === 'jhd71' && adminPassword === 'admin2024') {
                    this.isAdmin = true;
                } else {
                    this.isAdmin = false;
                }

                this.pseudo = pseudo;
                localStorage.setItem('chatPseudo', pseudo);
                localStorage.setItem('isAdmin', this.isAdmin);

                this.container.innerHTML = this.getChatHTML();
                const chatContainer = this.container.querySelector('.chat-container');
                if (chatContainer) {
                    chatContainer.classList.add('open');
                    this.isOpen = true;
                    localStorage.setItem('chatOpen', 'true');
                }
                this.setupListeners();
                await this.loadExistingMessages();
                this.playSound('success');
            });
        }
    }

    setupChatListeners() {
        const input = this.container.querySelector('.chat-input input');
        const sendBtn = this.container.querySelector('.chat-input button');

        if (input && sendBtn) {
            const sendMessage = async () => {
                const content = input.value.trim();
                if (content) {
                    if (await this.checkForBannedWords(content)) {
                        this.showNotification('Message contient des mots interdits', 'error');
                        this.playSound('error');
                        return;
                    }

                    const success = await this.sendMessage(content);
                    if (success) {
                        input.value = '';
                        input.focus();
                        this.playSound('message');
                    } else {
                        this.playSound('error');
                    }
                }
            };

            sendBtn.addEventListener('click', sendMessage);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }
    }
	setupRealtimeSubscription() {
        const channel = this.supabase.channel('messages');
        channel
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    console.log('Nouveau message:', payload);
                    this.handleNewMessage(payload.new);
                }
            )
            .on('postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'messages' },
                (payload) => {
                    console.log('Message supprimé:', payload);
                    const messageElement = this.container.querySelector(`[data-message-id="${payload.old.id}"]`);
                    if (messageElement) messageElement.remove();
                }
            )
            .subscribe();
    }

    async handleNewMessage(message) {
        if (!message) return;
        
        const chatContainer = this.container.querySelector('.chat-container');
        const chatOpen = chatContainer && chatContainer.classList.contains('open');
        
        console.log('État initial du message:', {
            chatOpen,
            isOpen: this.isOpen,
            messageFrom: message.pseudo,
            myPseudo: this.pseudo,
            notificationsEnabled: this.notificationsEnabled
        });

        const messagesContainer = this.container.querySelector('.chat-messages');
        if (!messagesContainer) return;

        const existingMessage = messagesContainer.querySelector(`[data-message-id="${message.id}"]`);
        if (existingMessage) return;

        const messageElement = this.createMessageElement(message);
        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
        
        if (message.pseudo !== this.pseudo) {
            this.playSound('message');
            
            if (!chatOpen) {
                this.unreadCount++;
                localStorage.setItem('unreadCount', this.unreadCount.toString());
                
                if (this.notificationsEnabled) {
                    try {
                        await this.sendNotificationToUser(message);
                    } catch (error) {
                        console.error('Erreur notification:', error);
                    }
                }
                
                this.updateUnreadBadgeAndBubble();
            }
        }
    }

    createMessageElement(message) {
        const div = document.createElement('div');
        div.className = `message ${message.pseudo === this.pseudo ? 'sent' : 'received'}`;
        div.dataset.messageId = message.id;

        div.innerHTML = `
            <div class="message-author">${message.pseudo}</div>
            <div class="message-content">${this.escapeHtml(message.content)}</div>
            <div class="message-time">${new Date(message.created_at).toLocaleTimeString()}</div>
        `;

        if (this.isAdmin || message.pseudo === this.pseudo) {
            div.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showMessageOptions(message, e.clientX, e.clientY);
            });

            let touchTimeout;
            div.addEventListener('touchstart', (e) => {
                touchTimeout = setTimeout(() => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    this.showMessageOptions(message, touch.clientX, touch.clientY);
                }, 500);
            });

            div.addEventListener('touchend', () => {
                clearTimeout(touchTimeout);
            });

            div.addEventListener('touchmove', () => {
                clearTimeout(touchTimeout);
            });
        }

        return div;
    }

    async loadExistingMessages() {
        try {
            const { data: messages, error } = await this.supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;

            const container = this.container.querySelector('.chat-messages');
            if (container && messages) {
                container.innerHTML = '';
                messages.forEach(msg => {
                    container.appendChild(this.createMessageElement(msg));
                });
                this.scrollToBottom();
            }
        } catch (error) {
            console.error('Erreur chargement messages:', error);
            this.showNotification('Erreur chargement messages', 'error');
        }
    }

    async sendMessage(content) {
        try {
            const ip = await this.getClientIP();
            const isBanned = await this.checkBannedIP(ip);
            
            if (isBanned) {
                this.showNotification('Vous êtes banni du chat', 'error');
                return false;
            }

            const message = {
                pseudo: this.pseudo,
                content: content,
                ip: ip,
                created_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('messages')
                .insert(message)
                .select()
                .single();

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erreur sendMessage:', error);
            return false;
        }
    }

    async setupPushNotifications() {
        try {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                throw new Error('Les notifications push ne sont pas supportées');
            }

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error('Permission refusée pour les notifications');
            }

            const registration = await navigator.serviceWorker.register('/service-worker.js');
            await navigator.serviceWorker.ready;

            let subscription = await registration.pushManager.getSubscription();
            
            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array('BLpaDhsC7NWdMacPN0mRpqZlsaOrOEV1AwgPyqs7D2q3HBZaQqGSMH8zTnmwzZrFKjjO2JvDonicGOl2zX9Jsck')
                });
            }

            const { error } = await this.supabase
                .from('push_subscriptions')
                .upsert({
                    pseudo: this.pseudo,
                    subscription: JSON.stringify(subscription)
                });

            if (error) throw error;

            this.notificationsEnabled = true;
            localStorage.setItem('notificationsEnabled', 'true');
            this.updateNotificationButton();
            this.showNotification('Notifications activées', 'success');
            this.playSound('success');
            
            return true;
        } catch (error) {
            console.error('Erreur activation notifications:', error);
            this.showNotification(
                'Erreur : ' + (error.message || 'Activation impossible'), 
                'error'
            );
            this.playSound('error');
            throw error;
        }
    }

    async sendNotificationToUser(message) {
        try {
            const response = await fetch('/api/sendPush', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message.content,
                    fromUser: message.pseudo,
                    toUser: this.pseudo
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur envoi notification');
            }

            return await response.json();
        } catch (error) {
            console.error('Erreur envoi notification:', error);
            throw error;
        }
    }
	async loadSounds() {
        const soundFiles = {
            'message': '/sounds/message.mp3',
            'sent': '/sounds/sent.mp3',
            'notification': '/sounds/notification.mp3',
            'click': '/sounds/click.mp3',
            'error': '/sounds/erreur.mp3',
            'success': '/sounds/success.mp3'
        };

        for (const [name, path] of Object.entries(soundFiles)) {
            try {
                console.log(`Chargement du son: ${name} depuis ${path}`);
                const audio = new Audio(path);
                await audio.load();
                this.sounds.set(name, audio);
                console.log(`Son ${name} chargé avec succès`);
            } catch (error) {
                console.error(`Erreur chargement son ${name}:`, error);
            }
        }
    }

    playSound(soundName) {
        if (this.soundEnabled && this.sounds.has(soundName)) {
            try {
                const sound = this.sounds.get(soundName).cloneNode();
                sound.volume = 0.5;
                const playPromise = sound.play();
                
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        if (error.name !== 'NotAllowedError') {
                            console.warn(`Erreur lecture son ${soundName}:`, error);
                        }
                    });
                }
            } catch (error) {
                // Ignore silently
            }
        }
    }

    async checkBannedIP(ip) {
        const { data, error } = await this.supabase
            .from('banned_ips')
            .select('*')
            .eq('ip', ip)
            .maybeSingle();

        if (error) {
            console.error('Erreur vérification IP:', error);
            return false;
        }

        if (data) {
            if (!data.expires_at || new Date(data.expires_at) > new Date()) {
                return true;
            }
        }
        return false;
    }

    async getClientIP() {
        try {
            return `${this.pseudo}-${Date.now()}`;
        } catch {
            return 'unknown';
        }
    }

    async checkForBannedWords(content) {
        console.log('Vérification des mots bannis...');
        const { data: bannedWordsData, error } = await this.supabase
            .from('banned_words')
            .select('word');
        
        if (error) {
            console.error('Erreur chargement mots bannis:', error);
            return false;
        }

        this.bannedWords = new Set(bannedWordsData.map(item => item.word.toLowerCase()));
        const words = content.toLowerCase().split(/\s+/);
        const foundBannedWord = words.some(word => this.bannedWords.has(word));
        
        console.log('Mots bannis actuels:', [...this.bannedWords]);
        console.log('Mot interdit trouvé:', foundBannedWord);
        
        return foundBannedWord;
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification-popup ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    updateNotificationButton() {
        const notifBtn = this.container.querySelector('.notifications-btn');
        if (notifBtn) {
            notifBtn.classList.toggle('enabled', this.notificationsEnabled);
            notifBtn.querySelector('.material-icons').textContent =
                this.notificationsEnabled ? 'notifications_active' : 'notifications_off';

            if (this.notificationsEnabled) {
                notifBtn.querySelector('.material-icons').classList.add('animate');
                setTimeout(() => {
                    notifBtn.querySelector('.material-icons').classList.remove('animate');
                }, 1000);
            }
        }
    }

    updateUnreadBadgeAndBubble() {
        const badge = this.container.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = this.unreadCount || '';
            badge.classList.toggle('hidden', this.unreadCount === 0);
        }

        const chatToggle = this.container.querySelector('.chat-toggle');
        const existingBubble = chatToggle.querySelector('.info-bubble');
        if (existingBubble) {
            existingBubble.remove();
        }

        if (!this.isOpen && this.unreadCount > 0) {
            const bubble = document.createElement('div');
            bubble.className = 'info-bubble show';
            bubble.innerHTML = `<div style="font-weight: bold;">${this.unreadCount} nouveau(x) message(s)</div>`;
            chatToggle.appendChild(bubble);
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    scrollToBottom() {
        const messagesContainer = this.container.querySelector('.chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    async checkNotificationStatus() {
        console.log('État des notifications:', {
            permission: Notification.permission,
            serviceWorkerRegistered: !!await navigator.serviceWorker.getRegistration(),
            pushManagerSupported: 'PushManager' in window,
            notificationsEnabled: this.notificationsEnabled,
            pushManagerSubscribed: !!(await (await navigator.serviceWorker.ready).pushManager.getSubscription())
        });
    }
}

export default ChatManager;
