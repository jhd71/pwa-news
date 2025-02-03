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
            
            console.log('HTML généré:', this.container.innerHTML);
            document.body.appendChild(this.container);

            await this.loadSounds();

            // Nouvelle initialisation des notifications
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
        notificationsEnabled: this.notificationsEnabled,
        pushManagerReady: !!this.pushManager?.subscription
    });

    const messagesContainer = this.container.querySelector('.chat-messages');
    if (!messagesContainer) return;

    const existingMessage = messagesContainer.querySelector(`[data-message-id="${message.id}"]`);
    if (existingMessage) return;

    const messageElement = this.createMessageElement(message);
    messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
    
    // Si le message vient d'un autre utilisateur
    if (message.pseudo !== this.pseudo) {
        this.playSound('message');
        
        // Si le chat n'est pas ouvert
        if (!chatOpen) {
            this.unreadCount++;
            localStorage.setItem('unreadCount', this.unreadCount.toString());
            
            // Mise à jour visuelle
            const badge = this.container.querySelector('.notification-badge');
            if (badge) {
                badge.textContent = this.unreadCount;
                badge.classList.remove('hidden');
            }
            
            this.updateUnreadBadgeAndBubble();

            // Envoi de la notification push
            if (this.notificationsEnabled && this.pushManager) {
                try {
                    console.log('Tentative envoi notification push');
                    await this.pushManager.sendMessageNotification({
                        title: 'Nouveau message',
                        body: `${message.pseudo}: ${message.content}`,
                        from: message.pseudo
                    });
                } catch (error) {
                    console.error('Erreur envoi notification:', error);
                }
            }
        }
    } else {
        this.playSound('sent');
    }
    
    this.isOpen = chatOpen;
}

 updateUnreadBadgeAndBubble() {
    console.log('Début updateUnreadBadgeAndBubble:', {
        unreadCount: this.unreadCount,
        isOpen: this.isOpen,
        messages: this.unreadMessages
    });

    // Mise à jour du badge
    const badge = this.container.querySelector('.notification-badge');
    if (badge) {
        badge.textContent = this.unreadCount > 0 ? this.unreadCount : '';
        badge.classList.toggle('hidden', this.unreadCount === 0);
        console.log('Badge mis à jour:', badge.outerHTML);
    }

    // Mise à jour de l'info-bulle
    const chatToggle = this.container.querySelector('.chat-toggle');
    const existingBubble = chatToggle.querySelector('.info-bubble');

    if (existingBubble) {
        console.log('Suppression ancienne bulle');
        existingBubble.remove();
    }
      console.log('Vérification de la condition !this.isOpen : ', !this.isOpen);
    if (!this.isOpen && this.unreadCount > 0 ) {
        console.log('Création nouvelle bulle');
        const bubble = document.createElement('div');
        bubble.className = 'info-bubble show';

        const header = document.createElement('div');
        header.style.fontWeight = 'bold';
        header.textContent = `${this.unreadCount} nouveau(x) message(s)`;
        bubble.appendChild(header);

        chatToggle.appendChild(bubble);
        console.log('Bulle créée:', bubble.outerHTML);
    } else if (this.isOpen){
     console.log('Le chat est ouvert, pas de bulle');
    } else {
       console.log('Pas de bulle à afficher');
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
        // Clic droit sur PC
        div.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showMessageOptions(message, e.clientX, e.clientY);
        });

        // Toucher long sur mobile
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

   async loadSounds() {
    const soundFiles = {
        'message': '/sounds/message.mp3',
        'sent': '/sounds/sent.mp3',  // Ajoutez ce son si ce n'est pas déjà fait
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
            // Réinitialiser les compteurs et notifications
            this.unreadCount = 0;
            this.unreadMessages = [];
            localStorage.setItem('unreadCount', '0');
            localStorage.setItem('unreadMessages', JSON.stringify([]));
            
            // Mise à jour du badge
            const badge = this.container.querySelector('.notification-badge');
            if (badge) {
                badge.textContent = '0';
                badge.classList.add('hidden');
            }
            
            // Mise à jour de l'info-bulle
            this.updateUnreadBadgeAndBubble();
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
	
   async loadBannedWords() {
    try {
        const { data: words, error } = await this.supabase
            .from('banned_words')
            .select('*')
            .order('added_at', { ascending: true });

        if (!error && words) {
            // Stocker les mots bannis dans un Set
            this.bannedWords = new Set(words.map(w => w.word.toLowerCase()));

            // Mettre à jour la liste HTML si elle existe
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

   async checkForBannedWords(content) {
    console.log('Vérification des mots bannis...');
    // Recharger la liste à jour des mots bannis
    const { data: bannedWordsData, error } = await this.supabase
        .from('banned_words')
        .select('word');
    
    if (error) {
        console.error('Erreur chargement mots bannis:', error);
        return false;
    }

    // Mettre à jour le Set avec les mots bannis
    this.bannedWords = new Set(bannedWordsData.map(item => item.word.toLowerCase()));
    
    const words = content.toLowerCase().split(/\s+/);
    const foundBannedWord = words.some(word => this.bannedWords.has(word));
    
    console.log('Mots bannis actuels:', [...this.bannedWords]);
    console.log('Mot interdit trouvé:', foundBannedWord);
    
    return foundBannedWord;
}
   async setupPushNotifications() {
    try {
        console.log('Début setup notifications');
        if (!('Notification' in window)) {
            console.log('Notifications non supportées');
            throw new Error('Les notifications ne sont pas supportées');
        }

        let permission = Notification.permission;
        console.log('Permission actuelle:', permission);

        if (permission === 'default') {
            console.log('Demande permission...');
            permission = await Notification.requestPermission();
            console.log('Nouvelle permission:', permission);
        }

        if (permission !== 'granted') {
            console.log('Permission refusée');
            throw new Error('Permission refusée pour les notifications');
        }

        console.log('Tentative souscription...');
        const success = await this.pushManager.subscribe();
        console.log('Résultat souscription:', success);

        if (success) {
            this.notificationsEnabled = true;
            localStorage.setItem('notificationsEnabled', 'true');
            this.updateNotificationButton();
            this.showNotification('Notifications activées', 'success');
            this.playSound('success');
        }
    } catch (error) {
        console.error('Erreur notifications:', error);
        this.showNotification(error.message, 'error');
        this.playSound('error');
        return false;
    }
}

   async unsubscribeFromPushNotifications() {
    try {
        const success = await this.pushManager.unsubscribe();
        if (success) {
            this.notificationsEnabled = false;
            localStorage.setItem('notificationsEnabled', 'false');
            this.updateNotificationButton();
            this.showNotification('Notifications désactivées', 'success');
            this.playSound('success');
        }
        return success;
    } catch (error) {
        console.error('Erreur désactivation notifications:', error);
        this.showNotification('Erreur de désactivation', 'error');
        return false;
    }
}

    updateNotificationButton() {
    const notifBtn = this.container.querySelector('.notifications-btn');
    if (notifBtn) {
        notifBtn.classList.toggle('enabled', this.notificationsEnabled);
        notifBtn.querySelector('.material-icons').textContent =
            this.notificationsEnabled ? 'notifications_active' : 'notifications_off';

        // Ajouter une animation manuellement si nécessaire
        if (this.notificationsEnabled) {
            notifBtn.querySelector('.material-icons').classList.add('animate');
            setTimeout(() => {
                notifBtn.querySelector('.material-icons').classList.remove('animate');
            }, 1000); // Durée de l’animation (1s ici)
        }
    }
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

async loadBannedList() {
    try {
        const { data: bannedIPs, error } = await this.supabase
            .from('banned_ips')
            .select('*')
            .order('banned_at', { ascending: false });

        if (error) throw error;

        const bannedIPsList = document.querySelector('.banned-ips-list');
        if (bannedIPsList && bannedIPs) {
            bannedIPsList.innerHTML = bannedIPs.map(ban => `
                <div class="banned-ip-item">
                    <div class="ip-info">
                        <div class="ip">${ban.ip}</div>
                        <div class="reason">${ban.reason || 'Aucune raison'}</div>
                        <div class="banned-by">Par ${ban.banned_by}</div>
                        <div class="date">Le ${new Date(ban.banned_at).toLocaleString()}</div>
                    </div>
                    <button class="unban-btn" data-ip="${ban.ip}">Débannir</button>
                </div>
            `).join('');
        }

        // Ajouter les gestionnaires d'événements pour les boutons de débannissement
        bannedIPsList?.querySelectorAll('.unban-btn').forEach(btn => {
            btn.addEventListener('click', () => this.unbanIP(btn.dataset.ip));
        });
    } catch (error) {
        console.error('Erreur chargement liste bannis:', error);
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

        // Envoyer une notification push à tous les autres utilisateurs
        try {
            const notificationPayload = {
                type: 'chat_message',
                from: this.pseudo,
                content: content
            };

            await this.supabase.rpc('send_push_notification_to_all', {
                payload: JSON.stringify(notificationPayload),
                exclude_pseudo: this.pseudo // Ne pas envoyer à l'expéditeur
            });
        } catch (notifError) {
            console.error('Erreur envoi notification:', notifError);
        }

        return true;
    } catch (error) {
        console.error('Erreur sendMessage:', error);
        return false;
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

    async deleteMessage(messageId) {
		console.log('deleteMessage appelé:', messageId);
    try {
        const { error } = await this.supabase
            .from('messages')
            .delete()
            .eq('id', messageId);

        if (error) {
            console.error('Erreur SQL:', error);
            throw error;
        }

        // Suppression de l'élément DOM
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

showMessageOptions(message, x, y) {
   console.log('showMessageOptions appelé:', message);
   document.querySelectorAll('.message-options').forEach(el => el.remove());

   const options = document.createElement('div');
   options.className = 'message-options';
   
   let posX = x;
   let posY = y;
   
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

   options.style.left = `${posX}px`;
   options.style.top = `${posY}px`;

   // Ajout des événements pour les boutons
   options.querySelector('.delete-option')?.addEventListener('click', async () => {
       console.log('Delete clicked:', message.id);
       await this.deleteMessage(message.id);
       options.remove();
   });

   options.querySelector('.ban-option')?.addEventListener('click', () => {
       console.log('Ban clicked:', message);
       this.showBanDialog(message);
       options.remove();
   });

   // Gestion de la fermeture
   const closeMenu = (e) => {
       if (!options.contains(e.target)) {
           options.remove();
           document.removeEventListener('click', closeMenu);
       }
   };

   setTimeout(() => {
       document.addEventListener('click', closeMenu);
   }, 0);
}

    showBanDialog(message) {
    console.log('showBanDialog starting');
    
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
		console.log('banUser appelé:', { ip, reason, duration });
        try {
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

    async unbanIP(ip) {
        try {
            const { error } = await this.supabase
                .from('banned_ips')
                .delete()
                .eq('ip', ip);

            if (error) throw error;

            this.showNotification('IP débannie avec succès', 'success');
            this.playSound('success');
            return true;
        } catch (error) {
            console.error('Erreur débannissement:', error);
            this.showNotification('Erreur lors du débannissement', 'error');
            return false;
        }
    }

    async getClientIP() {
    try {
        // Au lieu d'utiliser ipify, on retourne simplement une chaîne unique
        return `${this.pseudo}-${Date.now()}`;
    } catch {
        return 'unknown';
    }
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
             }   // Nouvelle méthode ici, avant la dernière accolade de la classe
async testNotification() {
        try {
            console.log('Début du test de notification...');
            if (!this.pushManager) {
                throw new Error('PushManager non initialisé');
            }
            // D'abord s'assurer qu'on est souscrit
            if (!this.notificationsEnabled) {
                console.log('Souscription aux notifications...');
                await this.setupPushNotifications();
            }
            console.log('Envoi notification test...');
            const success = await this.pushManager.sendTestPushMessage();
            
            if (success) {
                this.showNotification('Test notification envoyé', 'success');
                this.playSound('success');
            } else {
                throw new Error('Échec envoi notification');
            }
        } catch (error) {
            console.error('Erreur test notification:', error);
            this.showNotification('Erreur: ' + error.message, 'error');
            this.playSound('error');
        }
    }

    // Ajouter la nouvelle méthode ici, avant la dernière accolade
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