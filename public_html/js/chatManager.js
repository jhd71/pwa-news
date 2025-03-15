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

            // Vérifier l'état d'authentification
            const isAuthenticated = await this.checkAuthState();

            // Vérifier si on utilise le bouton de la barre de navigation
            const useNavButton = document.getElementById('chatToggleBtn') !== null;

            if (isAuthenticated && this.pseudo) {
                this.container.innerHTML = useNavButton ? this.getChatHTMLWithoutToggle() : this.getChatHTML();
            } else {
                this.container.innerHTML = useNavButton ? this.getPseudoHTMLWithoutToggle() : this.getPseudoHTML();
            }

            const chatContainer = this.container.querySelector('.chat-container');
            if (this.isOpen && chatContainer) {
                chatContainer.classList.add('open');
            }
            
            document.body.appendChild(this.container);
            await this.loadSounds();

            // Gestion des notifications push
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    const subscription = await registration.pushManager.getSubscription();
                    
                    if (subscription) {
                        this.subscription = subscription;
                        this.notificationsEnabled = true;
                        console.log('Notifications push déjà activées');

                        // Vérification périodique de la souscription
                        setInterval(async () => {
                            try {
                                const currentSubscription = await registration.pushManager.getSubscription();
                                if (!currentSubscription) {
                                    console.log('Renouvellement de la souscription nécessaire');
                                    await this.renewPushSubscription();
                                }
                            } catch (error) {
                                console.error('Erreur vérification souscription:', error);
                            }
                        }, 3600000); // Vérification toutes les heures
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

    getPseudoHTMLWithoutToggle() {
        return `
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
                    <button class="emoji-btn" title="Emojis">
                        <span class="material-icons">emoji_emotions</span>
                    </button>
                    <button class="notifications-btn ${this.notificationsEnabled ? 'enabled' : ''}" title="Notifications">
                        <span class="material-icons">${this.notificationsEnabled ? 'notifications_active' : 'notifications_off'}</span>
                    </button>
                    <button class="sound-btn ${this.soundEnabled ? 'enabled' : ''}" title="Son">
                        <span class="material-icons">${this.soundEnabled ? 'volume_up' : 'volume_off'}</span>
                    </button>
                    <button class="logout-btn" title="Déconnexion">
                        <span class="material-icons">logout</span>
                    </button>
                    <button class="close-chat" title="Fermer">
                        <span class="material-icons">close</span>
                    </button>
                </div>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input">
                <textarea 
                    placeholder="Votre message..." 
                    maxlength="500" 
                    rows="2"></textarea>
                <button class="send-btn" title="Envoyer">
                    <span class="material-icons">send</span>
                </button>
            </div>
        </div>
    `;
    }

    getChatHTMLWithoutToggle() {
        return `
        <div class="chat-container">
            <div class="chat-header">
                <div class="header-title">Chat - ${this.pseudo}</div>
                <div class="header-buttons">
                    ${this.isAdmin ? `
                        <button class="admin-panel-btn" title="Panel Admin">
                            <span class="material-icons">admin_panel_settings</span>
                        </button>
                    ` : ''}
                    <button class="emoji-btn" title="Emojis">
                        <span class="material-icons">emoji_emotions</span>
                    </button>
                    <button class="notifications-btn ${this.notificationsEnabled ? 'enabled' : ''}" title="Notifications">
                        <span class="material-icons">${this.notificationsEnabled ? 'notifications_active' : 'notifications_off'}</span>
                    </button>
                    <button class="sound-btn ${this.soundEnabled ? 'enabled' : ''}" title="Son">
                        <span class="material-icons">${this.soundEnabled ? 'volume_up' : 'volume_off'}</span>
                    </button>
                    <button class="logout-btn" title="Déconnexion">
                        <span class="material-icons">logout</span>
                    </button>
                    <button class="close-chat" title="Fermer">
                        <span class="material-icons">close</span>
                    </button>
                </div>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input">
                <textarea 
                    placeholder="Votre message..." 
                    maxlength="500" 
                    rows="2"></textarea>              
                <button class="send-btn" title="Envoyer">
                    <span class="material-icons">send</span>
                </button>
            </div>
        </div>
    `;
    }

    setupListeners() {
        const chatToggleBtn = document.getElementById('chatToggleBtn');
        const closeBtn = this.container.querySelector('.close-chat');
        const chatContainer = this.container.querySelector('.chat-container');
        const toggle = this.container.querySelector('.chat-toggle');
        const soundBtn = this.container.querySelector('.sound-btn');
        const notificationsBtn = this.container.querySelector('.notifications-btn');
        const adminBtn = this.container.querySelector('.admin-panel-btn');
        const logoutBtn = this.container.querySelector('.logout-btn');

        // Fonction réutilisable pour basculer l'état du chat
        const toggleChat = () => {
            this.isOpen = !this.isOpen;
            
            if (this.isOpen) {
                chatContainer?.classList.add('open');
                this.unreadCount = 0;
                localStorage.setItem('unreadCount', '0');
                
                const badge = chatToggleBtn?.querySelector('.chat-notification-badge');
                if (badge) {
                    badge.textContent = '0';
                    badge.classList.add('hidden');
                }
                
                this.scrollToBottom();
                // Remettre le focus sur la zone de saisie après ouverture
                setTimeout(() => {
                    const inputField = this.container.querySelector('.chat-input textarea');
                    if (inputField) {
                        inputField.focus();
                    }
                }, 100);
            } else {
                chatContainer?.classList.remove('open');
            }
            
            localStorage.setItem('chatOpen', this.isOpen);
            this.playSound('click');
        };

        if (chatToggleBtn) {
            // Supprimer les anciens écouteurs d'événements pour éviter les duplications
            const newChatToggleBtn = chatToggleBtn.cloneNode(true);
            chatToggleBtn.parentNode.replaceChild(newChatToggleBtn, chatToggleBtn);
            
            // Ajouter le nouvel écouteur
            newChatToggleBtn.addEventListener('click', toggleChat);
        }

        if (toggle) {
            toggle.addEventListener('click', toggleChat);
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

        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await this.logout();
                this.playSound('click');
            });
        }

        if (!this.pseudo) {
            this.setupAuthListeners();
        } else {
            this.setupChatListeners();
        }

        // Empêcher le scroll de traverser sur les appareils tactiles
        const chatMessages = this.container.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.addEventListener('touchmove', (e) => {
                e.stopPropagation();
            }, { passive: true });
            
            chatMessages.addEventListener('scroll', () => {
                const scrollTop = chatMessages.scrollTop;
                const scrollHeight = chatMessages.scrollHeight;
                const clientHeight = chatMessages.clientHeight;
                
                if (scrollTop <= 1) {
                    chatMessages.scrollTop = 1;
                } else if (scrollTop + clientHeight >= scrollHeight - 1) {
                    chatMessages.scrollTop = scrollHeight - clientHeight - 1;
                }
            }, { passive: true });
        }
    }  

    setupAuthListeners() {
        const pseudoInput = this.container.querySelector('#pseudoInput');
        const adminPasswordInput = this.container.querySelector('#adminPassword');
        const confirmButton = this.container.querySelector('#confirmPseudo');

        if (pseudoInput) {
            pseudoInput.addEventListener('input', () => {
                console.log('Pseudo input:', pseudoInput.value.trim());
                if (pseudoInput.value.trim() === 'jhd71') {
                    console.log('Affichage du champ mot de passe admin');
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

                console.log('Tentative de connexion avec pseudo:', pseudo);

                if (!pseudo || pseudo.length < 3) {
                    this.showNotification('Le pseudo doit faire au moins 3 caractères', 'error');
                    this.playSound('error');
                    return;
                }

                try {
                    let isAdmin = false;
                    if (pseudo === 'jhd71') {
                        console.log('Tentative connexion admin');
                        
                        if (adminPassword !== 'admin2024') {
                            this.showNotification('Mot de passe administrateur incorrect', 'error');
                            this.playSound('error');
                            return;
                        }
                        
                        isAdmin = true;
                    } else {
                        console.log('Tentative connexion utilisateur normal');
                    }

                    const { data: existingUser, error: queryError } = await this.supabase
                        .from('users')
                        .select('*')
                        .eq('pseudo', pseudo)
                        .single();
                    
                    console.log('Résultat recherche utilisateur:', existingUser, queryError);
                    
                    if (!existingUser || (queryError && queryError.code === 'PGRST116')) {
                        console.log('Création d\'un nouvel utilisateur');
                        
                        const { data: newUser, error: insertError } = await this.supabase
                            .from('users')
                            .insert([
                                { 
                                    pseudo: pseudo,
                                    last_active: new Date().toISOString(),
                                    is_admin: isAdmin,
                                    requires_password: true
                                }
                            ])
                            .select();
                        
                        if (insertError) {
                            console.error('Erreur création utilisateur:', insertError);
                            throw insertError;
                        }
                        
                        console.log('Utilisateur créé avec succès:', newUser);
                    }

                    this.pseudo = pseudo;
                    this.isAdmin = isAdmin;
                    localStorage.setItem('chatPseudo', pseudo);
                    localStorage.setItem('isAdmin', isAdmin);

                    if (document.getElementById('chatToggleBtn')) {
                        this.container.innerHTML = this.getChatHTMLWithoutToggle();
                    } else {
                        this.container.innerHTML = this.getChatHTML();
                    }
                    
                    const chatContainer = this.container.querySelector('.chat-container');
                    if (chatContainer) {
                        chatContainer.classList.add('open');
                        this.isOpen = true;
                        localStorage.setItem('chatOpen', 'true');
                    }
                    
                    this.setupListeners();
                    await this.loadExistingMessages();
                    this.playSound('success');
                    
                } catch (error) {
                    console.error('Erreur d\'authentification:', error);
                    this.showNotification('Erreur lors de la connexion: ' + error.message, 'error');
                    this.playSound('error');
                }
            });
        }
    }

    async registerUser(pseudo, password, isAdmin = false) {
        try {
            console.log('Tentative d\'inscription de l\'utilisateur:', pseudo, 'admin:', isAdmin);
            
            const { data, error: insertError } = await this.supabase
                .from('users')
                .insert([
                    { 
                        pseudo: pseudo,
                        last_active: new Date().toISOString(),
                        is_admin: isAdmin,
                        requires_password: true
                    }
                ])
                .select();
            
            if (insertError) {
                console.error('Erreur insertion table users:', insertError);
                throw insertError;
            }
            
            console.log('Utilisateur enregistré avec succès:', pseudo);
            this.showNotification('Inscription réussie!', 'success');
            return { success: true, user: data?.[0] };
        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            this.showNotification('Erreur lors de l\'inscription: ' + error.message, 'error');
            throw error;
        }
    }

    async checkAuthState() {
        try {
            if (this.pseudo) {
                const { data: userData, error } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('pseudo', this.pseudo)
                    .single();
                
                if (error && error.code !== 'PGRST116') {
                    throw error;
                }
                
                if (userData) {
                    this.isAdmin = userData.is_admin || false;
                    localStorage.setItem('isAdmin', this.isAdmin);
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('Erreur vérification auth:', error);
            return false;
        }
    }

    async logout() {
        try {
            this.pseudo = null;
            this.isAdmin = false;
            localStorage.removeItem('chatPseudo');
            localStorage.removeItem('isAdmin');
            
            if (document.getElementById('chatToggleBtn')) {
                this.container.innerHTML = this.getPseudoHTMLWithoutToggle();
            } else {
                this.container.innerHTML = this.getPseudoHTML();
            }
            
            this.setupListeners();
            this.showNotification('Déconnexion réussie', 'success');
            return true;
        } catch (error) {
            console.error('Erreur déconnexion:', error);
            this.showNotification('Erreur lors de la déconnexion', 'error');
            return false;
        }
    }

    extractPseudoFromEmail(email) {
        return email.split('@')[0];
    }

    setupChatListeners() {
    const input = this.container.querySelector('.chat-input textarea');
    const sendBtn = this.container.querySelector('.send-btn');
    const emojiBtn = this.container.querySelector('.emoji-btn');

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
                    // Sur mobile, on ne redonne pas automatiquement le focus pour éviter que la fenêtre se baisse
                    if (!/Mobi|Android/i.test(navigator.userAgent)) {
                        input.focus();
                    }
                    this.playSound('message');
                } else {
                    this.playSound('error');
                }
            }
        };

        // Ajout de preventDefault et stopPropagation pour éviter des comportements indésirables sur mobile
        sendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            sendMessage();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    if (emojiBtn) {
        emojiBtn.addEventListener('click', () => {
            this.toggleEmojiPanel();
        });
    }
}

    // Utilise le cache this.bannedWords au lieu de refaire une requête
    async checkForBannedWords(content) {
        console.log('Vérification des mots bannis...');
        const words = content.toLowerCase().split(/\s+/);
        const foundBannedWord = words.some(word => this.bannedWords.has(word));
        console.log('Mots bannis actuels:', [...this.bannedWords]);
        console.log('Mot interdit trouvé:', foundBannedWord);
        return foundBannedWord;
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

            // Optimisation : utiliser returning minimal pour accélérer l'insertion
            const { error } = await this.supabase
                .from('messages')
                .insert(message, { returning: 'minimal' });

            if (error) throw error;

            // Envoi de la notification en asynchrone sans attendre
            fetch("/api/sendPush.js", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: content,
                    fromUser: this.pseudo,
                    toUser: "all"
                })
            })
            .catch(err => console.error("❌ Erreur lors de l'envoi de la notification :", err));

            return true;
        } catch (error) {
            console.error('Erreur sendMessage:', error);
            return false;
        }
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

    createMessageElement(message) {
        const div = document.createElement('div');
        div.className = `message ${message.pseudo === this.pseudo ? 'sent' : 'received'}`;
        div.dataset.messageId = message.id;

        div.innerHTML = `
            <div class="message-author">${message.pseudo}</div>
            <div class="message-content">${this.escapeHtml(message.content)}</div>
            <div class="message-time">${this.formatMessageTime(message.created_at)}</div>
        `;

        if (this.isAdmin || message.pseudo === this.pseudo) {
            let touchTimer;
            let longPressActive = false;
            let lastTouchEnd = 0;
            
            div.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showMessageOptions(message, e.clientX, e.clientY);
            });

            div.addEventListener('touchstart', (e) => {
                if (Date.now() - lastTouchEnd < 1000) {
                    return;
                }
                
                touchTimer = setTimeout(() => {
                    longPressActive = true;
                    const touch = e.touches[0];
                    this.showMessageOptions(message, touch.clientX, touch.clientY);
                    
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                }, 800);
            });
            
            div.addEventListener('touchmove', () => {
                clearTimeout(touchTimer);
            });
            
            div.addEventListener('touchend', (e) => {
                clearTimeout(touchTimer);
                if (longPressActive) {
                    e.preventDefault();
                    e.stopPropagation();
                    longPressActive = false;
                    lastTouchEnd = Date.now();
                }
            });
            
            div.addEventListener('touchcancel', () => {
                clearTimeout(touchTimer);
                longPressActive = false;
            });
        }

        return div;
    }

    formatMessageTime(timestamp) {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const time = date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        let dateText, icon;
        
        if (date.toDateString() === today.toDateString()) {
            dateText = "Aujourd'hui";
            icon = "today";
        }
        else if (date.toDateString() === yesterday.toDateString()) {
            dateText = "Hier";
            icon = "history";
        }
        else {
            dateText = date.toLocaleDateString('fr-FR');
            icon = "calendar_today";
        }

        return `
            <span class="material-icons">${icon}</span>
            <span class="date">${dateText}</span>
            <span class="time">${time}</span>
        `;
    }

    scrollToBottom() {
        const messagesContainer = this.container.querySelector('.chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    toggleEmojiPanel() {
        let panel = this.container.querySelector('.emoji-panel');
        
        if (panel) {
            panel.remove();
            return;
        }
        
        panel = document.createElement('div');
        panel.className = 'emoji-panel';
        
        const emojis = [
          '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', 
          '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '😝', 
          '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', 
          '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', 
          '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', 
          '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', 
          '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', 
          '👋', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👍', '👎', '✊', 
          '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪', '❤️', '🧡', 
          '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💓', '💔', '💕', '💖', '💗',
          '🥹', '🫠', '🫡', '🫣', '🫤', '😇', '🥴', '😵‍💫', '🫥', '🤩', '🫨', '🫧',
          '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', 
          '🐷', '🐸', '🐵', '🦄', '🐝', '🦋', '🐞', '🐢', '🐍', '🦖', '🦕', '🦀', 
          '🐡', '🐬', '🐳', '🐊', '🦆', '🦉', '🐓', '🦜', '🦢', '🦩', '🦚',
          '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🥭', '🍍', 
          '🥥', '🥑', '🍔', '🍟', '🌭', '🍕', '🥪', '🍜', '🍣', '🍩', '🍪', '🎂',
          '🎮', '🕹️', '🎲', '♟️', '🎯', '🎳', '🏀', '⚽', '🏈', '🎾', '🏐', '🏉', 
          '🎼', '🎸', '🎷', '🎺', '🥁', '🎻', '📸', '🎥', '📺', '📱', '💻', '🖥️',
          '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚜', '🛴', '🚲', 
          '🛵', '🏍️', '🚂', '🚆', '✈️', '🚀', '🛸', '🚢', '🛳️', '⛵',
          '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '🎗️', '🔮', '💎', '📿', '💰', '💵', 
          '💳', '💡', '🛑', '🚧', '⚠️', '❗', '❓', '💢', '🔥', '✨', '🎉', '🎊',
          '🏳️‍🌈', '🇫🇷', '🇧🇪', '🇨🇭', '🇨🇦', '🇪🇺', '🌍', '🌎', '🌏', '🏴‍☠️', '🏳️‍🌈', 
          '🎌', '⚜️', '☮️', '💟', '♻️', '✅', '❌', '➕', '➖', '➗', '✖️', '➰',
          '⬆️', '⬇️', '⬅️', '➡️', '↗️', '↘️', '↙️', '↖️', '🔄', '🔃', '🔙', '🔛', 
          '🔝', '🔜', '↩️', '↪️', '⤴️', '⤵️', '🔼', '🔽', '⏫', '⏬', '⏪', '⏩',
          '🅰️', '🅱️', '🆎', '🆑', '🆒', '🆓', 'ℹ️', '🆔', 'Ⓜ️', '🆕', '🆖', '🅾️', 
          '🆗', '🅿️', '🆘', '🆙', '🆚', '🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', 
          '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹', '🇺', 
          '🇻', '🇼', '🇽', '🇾', '🇿', 
          '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', 
          '0️⃣', '🔢', '🔠', '🔡'
        ];
        
        emojis.forEach(emoji => {
            const span = document.createElement('span');
            span.textContent = emoji;
            span.addEventListener('click', () => {
                const textarea = this.container.querySelector('.chat-input textarea');
                if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const text = textarea.value;
                    textarea.value = text.substring(0, start) + emoji + text.substring(end);
                    textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
                    textarea.focus();
                }
                panel.remove();
                this.playSound('click');
            });
            panel.appendChild(span);
        });
        
        const chatContainer = this.container.querySelector('.chat-container');
        chatContainer.appendChild(panel);
        
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && e.target !== this.container.querySelector('.emoji-btn') && !this.container.querySelector('.emoji-btn').contains(e.target)) {
                panel.remove();
            }
        }, { once: true });
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

    async setupPushNotifications() {
        try {
            const permissionGranted = await this.requestNotificationPermission();
            if (!permissionGranted) {
                return false;
            }
            
            await this.supabase.rpc('set_current_user', { user_pseudo: this.pseudo });
            
            const registration = await navigator.serviceWorker.ready;
            
            const oldSubscription = await registration.pushManager.getSubscription();
            if (oldSubscription) {
                await oldSubscription.unsubscribe();
                await this.supabase
                    .from('push_subscriptions')
                    .delete()
                    .match({ 
                        pseudo: this.pseudo,
                        subscription: JSON.stringify(oldSubscription)
                    });
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array('BLpaDhsC7NWdMacPN0mRpqZlsaOrOEV1AwgPyqs7D2q3HBZaQqGSMH8zTnmwzZrFKjjO2JvDonicGOl2zX9Jsck')
            });

            const { error } = await this.supabase
                .from('push_subscriptions')
                .insert({
                    pseudo: this.pseudo,
                    subscription: JSON.stringify(subscription),
                    device_type: this.getDeviceType(),
                    active: true,
                    last_updated: new Date().toISOString()
                });

            if (error) throw error;

            this.notificationsEnabled = true;
            localStorage.setItem('notificationsEnabled', 'true');
            this.updateNotificationButton();
            
            this.showNotification('Notifications activées!', 'success');
            this.sendTestNotification();
            
            return true;
        } catch (error) {
            console.error('Erreur activation notifications:', error);
            this.showNotification('Erreur: ' + error.message, 'error');
            return false;
        }
    }

    async sendTestNotification() {
        try {
            if (!('Notification' in window)) return;
            
            new Notification('Notification de test', {
                body: 'Les notifications fonctionnent correctement!',
                icon: '/icons/icon-192x192.png'
            });
        } catch (error) {
            console.error('Erreur notification test:', error);
        }
    }

    async requestNotificationPermission() {
        try {
            if (!('Notification' in window)) {
                this.showNotification('Les notifications ne sont pas supportées par ce navigateur', 'error');
                return false;
            }
            
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                this.showNotification('Notifications activées avec succès!', 'success');
                this.notificationsEnabled = true;
                localStorage.setItem('notificationsEnabled', 'true');
                this.updateNotificationButton();
                return true;
            } else {
                this.showNotification('Permission de notification refusée', 'error');
                return false;
            }
        } catch (error) {
            console.error('Erreur lors de la demande de permission:', error);
            this.showNotification('Erreur lors de l\'activation des notifications', 'error');
            return false;
        }
    }

    async renewPushSubscription() {
        try {
            const registration = await navigator.serviceWorker.ready;
            
            const oldSubscription = await registration.pushManager.getSubscription();
            if (oldSubscription) {
                await oldSubscription.unsubscribe();
                
                await this.supabase
                    .from('push_subscriptions')
                    .delete()
                    .match({ 
                        pseudo: this.pseudo,
                        subscription: JSON.stringify(oldSubscription)
                    });
            }

            const newSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array('BLpaDhsC7NWdMacPN0mRpqZlsaOrOEV1AwgPyqs7D2q3HBZaQqGSMH8zTnmwzZrFKjjO2JvDonicGOl2zX9Jsck')
            });

            await this.supabase
                .from('push_subscriptions')
                .insert({
                    pseudo: this.pseudo,
                    subscription: JSON.stringify(newSubscription),
                    device_type: this.getDeviceType(),
                    active: true,
                    last_updated: new Date().toISOString()
                });

            console.log('Souscription push renouvelée avec succès');
            return true;
        } catch (error) {
            console.error('Erreur renouvellement souscription:', error);
            return false;
        }
    }

    getDeviceType() {
        const ua = navigator.userAgent;
        if (/android/i.test(ua)) {
            return 'android';
        } else if (/iPad|iPhone|iPod/.test(ua)) {
            return 'ios';
        } else {
            return 'desktop';
        }
    }

    async unsubscribeFromPushNotifications() {
        try {
            await this.supabase.rpc('set_current_user', { user_pseudo: this.pseudo });
            
            const registration = await navigator.serviceWorker.getRegistration();
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
                await subscription.unsubscribe();
                await this.supabase
                    .from('push_subscriptions')
                    .delete()
                    .eq('pseudo', this.pseudo);
            }
            
            this.notificationsEnabled = false;
            localStorage.setItem('notificationsEnabled', 'false');
            this.updateNotificationButton();
            this.showNotification('Notifications désactivées', 'success');
            return true;
        } catch (error) {
            console.error('Erreur désactivation notifications:', error);
            this.showNotification('Erreur de désactivation', 'error');
            return false;
        }
    }

    async sendNotificationToUser(message) {
        try {
            console.log('Envoi notification à:', message);
            
            const response = await fetch("/api/sendPush.js", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: message.content,
                    fromUser: message.pseudo,
                    toUser: this.pseudo
                })
            });

            if (!response.ok) {
                const text = await response.text();
                console.error('Réponse API erreur:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: text
                });
                throw new Error(`Erreur API: ${response.status} ${text}`);
            }

            const result = await response.json();
            console.log('Réponse API succès:', result);
            return result;
        } catch (error) {
            console.error('Erreur envoi notification:', error);
            console.error('Stack trace:', error.stack);
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
                // Ignorer silencieusement
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
        const chatToggleBtn = document.getElementById('chatToggleBtn');
        if (chatToggleBtn) {
            const badge = chatToggleBtn.querySelector('.chat-notification-badge');
            if (badge) {
                badge.textContent = this.unreadCount || '';
                badge.classList.toggle('hidden', this.unreadCount === 0);
            }
        }

        if (!this.isOpen && this.unreadCount > 0) {
            const chatToggle = this.container.querySelector('.chat-toggle');
            const existingBubble = chatToggle?.querySelector('.info-bubble');
            if (existingBubble) {
                existingBubble.remove();
            }

            if (chatToggle) {
                const bubble = document.createElement('div');
                bubble.className = 'info-bubble show';
                bubble.innerHTML = `<div style="font-weight: bold;">${this.unreadCount} nouveau(x) message(s)</div>`;
                chatToggle.appendChild(bubble);
            }
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

    showAdminPanel() {
        if (!this.isAdmin) return;

        const existingPanel = document.querySelector('.admin-panel');
        if (existingPanel) {
            existingPanel.remove();
            return;
        }

        const panel = document.createElement('div');
        panel.className = 'admin-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <h3>Panel Admin</h3>
                <button class="close-panel">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <div class="panel-content">
                <div class="section">
                    <h4>Mots bannis</h4>
                    <div class="add-word">
                        <input type="text" placeholder="Nouveau mot à bannir">
                        <button class="add-word-btn">Ajouter</button>
                    </div>
                    <div class="banned-words-list"></div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        this.loadBannedWords();

        const addWordBtn = panel.querySelector('.add-word-btn');
        const wordInput = panel.querySelector('.add-word input');

        addWordBtn.addEventListener('click', async () => {
            const word = wordInput.value.trim().toLowerCase();
            if (word) {
                await this.addBannedWord(word);
                wordInput.value = '';
                await this.loadBannedWords();
            }
        });

        panel.querySelector('.close-panel').addEventListener('click', () => panel.remove());
    }

    async addBannedWord(word) {
        const { error } = await this.supabase
            .from('banned_words')
            .insert({ word: word });

        if (!error) {
            this.bannedWords.add(word);
            this.showNotification('Mot ajouté avec succès', 'success');
        }
    }

    async removeBannedWord(word) {
        const { error } = await this.supabase
            .from('banned_words')
            .delete()
            .eq('word', word);

        if (!error) {
            this.bannedWords.delete(word);
            this.showNotification('Mot supprimé avec succès', 'success');
            await this.loadBannedWords();
        }
    }

    showMessageOptions(message, x, y) {
        console.log('showMessageOptions appelé:', message);
        
        document.querySelectorAll('.message-options').forEach(el => el.remove());

        const options = document.createElement('div');
        options.className = 'message-options';
        
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
            options.classList.add('mobile-options');
        }
        
        options.innerHTML = `
            <div class="options-content">
                <button class="delete-option">
                    <span class="material-icons">delete</span> Supprimer
                </button>
                ${this.isAdmin ? `
                    <button class="ban-option">
                        <span class="material-icons">block</span> Bannir IP
                    </button>
                ` : ''}
            </div>
        `;

        document.body.appendChild(options);

        const chatContainer = this.container.querySelector('.chat-container');
        const chatBounds = chatContainer.getBoundingClientRect();
        const optionsRect = options.getBoundingClientRect();

        let posX = x;
        let posY = y;
        
        if (isMobile) {
            posX = chatBounds.left + (chatBounds.width / 2) - (optionsRect.width / 2);
            posY = chatBounds.top + (chatBounds.height * 0.3);
        } else {
            if (posX + optionsRect.width > chatBounds.right) {
                posX = chatBounds.right - optionsRect.width - 10;
            }
            if (posX < chatBounds.left) {
                posX = chatBounds.left + 10;
            }
            if (posY + optionsRect.height > chatBounds.bottom) {
                posY = chatBounds.bottom - optionsRect.height - 10;
            }
            if (posY < chatBounds.top) {
                posY = chatBounds.top + 10;
            }
        }

        options.style.left = `${posX}px`;
        options.style.top = `${posY}px`;

        const preventPropagation = (e) => {
            e.stopPropagation();
        };
        
        options.addEventListener('click', preventPropagation);
        options.addEventListener('touchstart', preventPropagation);
        options.addEventListener('touchend', preventPropagation);
        options.addEventListener('touchmove', preventPropagation);

        options.querySelector('.delete-option')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.deleteMessage(message.id);
            options.remove();
        });

        options.querySelector('.ban-option')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showBanDialog(message);
            options.remove();
        });

        setTimeout(() => {
            const closeHandler = (e) => {
                if (!options.contains(e.target)) {
                    options.remove();
                    document.removeEventListener('click', closeHandler);
                    document.removeEventListener('touchstart', closeHandler);
                }
            };
            
            document.addEventListener('click', closeHandler);
            document.addEventListener('touchstart', closeHandler);
        }, 300);
    }

    async deleteMessage(messageId) {
        try {
            await this.supabase.rpc('set_current_user', { user_pseudo: this.pseudo });
            
            const { error } = await this.supabase
                .from('messages')
                .delete()
                .eq('id', messageId);

            if (error) throw error;

            const messageElement = this.container.querySelector(`[data-message-id="${messageId}"]`);
            if (messageElement) {
                messageElement.classList.add('fade-out');
                setTimeout(() => messageElement.remove(), 300);
                this.showNotification('Message supprimé', 'success');
            }
        } catch (error) {
            console.error('Erreur suppression:', error);
            this.showNotification('Erreur lors de la suppression', 'error');
        }
    }

    showBanDialog(message) {
        const dialogHTML = `
            <div class="ban-dialog" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1200;">
                <div class="ban-content" style="background: var(--chat-gradient); padding: 20px; border-radius: 12px; width: 90%; max-width: 400px; color: white;">
                    <h3>Bannir ${message.pseudo}</h3>
                    <p>IP: ${message.ip}</p>
                    <input type="text" class="ban-reason" placeholder="Raison du ban" style="width: 100%; padding: 10px; margin: 10px 0; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white;">
                    <select class="ban-duration" style="width: 100%; padding: 10px; margin: 10px 0; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white;">
                        <option value="">Ban permanent</option>
                        <option value="3600000">1 heure</option>
                        <option value="86400000">24 heures</option>
                        <option value="604800000">1 semaine</option>
                    </select>
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button class="confirm-ban" style="flex: 1; padding: 10px; border-radius: 8px; border: none; cursor: pointer; background: var(--chat-error); color: white;">Bannir</button>
                        <button class="cancel-ban" style="flex: 1; padding: 10px; border-radius: 8px; border: none; cursor: pointer; background: rgba(255,255,255,0.2); color: white;">Annuler</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', dialogHTML);
        
        const dialog = document.querySelector('.ban-dialog');
        dialog.querySelector('.confirm-ban').addEventListener('click', async () => {
            const reason = dialog.querySelector('.ban-reason').value;
            const duration = dialog.querySelector('.ban-duration').value;
            await this.banUser(message.ip, reason, duration ? parseInt(duration) : null);
            dialog.remove();
        });

        dialog.querySelector('.cancel-ban').addEventListener('click', () => {
            dialog.remove();
        });
    }

    async banUser(ip, reason = '', duration = null) {
        try {
            await this.supabase.rpc('set_current_user', { user_pseudo: this.pseudo });
            
            const expiresAt = duration ? new Date(Date.now() + duration).toISOString() : null;
            
            const { error } = await this.supabase
                .from('banned_ips')
                .insert({
                    ip: ip,
                    banned_by: this.pseudo,
                    reason: reason,
                    banned_at: new Date().toISOString(),
                    expires_at: expiresAt
                });

            if (error) throw error;

            this.showNotification('IP bannie avec succès', 'success');
            this.playSound('success');
            return true;
        } catch (error) {
            console.error('Erreur bannissement:', error);
            this.showNotification('Erreur lors du bannissement', 'error');
            return false;
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