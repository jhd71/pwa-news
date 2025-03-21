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
        this.banDetails = null;
		this.localMessages = []; // Cache local des messages
        this.maxCachedMessages = 50; // Nombre maximum de messages en cache
    }
	async setCurrentUserForRLS() {
        try {
            if (!this.pseudo) return false;
            
            console.log(`Définition de l'utilisateur courant pour RLS: ${this.pseudo}`);
            const { error } = await this.supabase.rpc('set_current_user', { 
                user_pseudo: this.pseudo 
            });
            
            if (error) {
                console.error('Erreur définition utilisateur RLS:', error);
                return false;
            }
            
            console.log('Utilisateur RLS défini avec succès');
            return true;
        } catch (error) {
            console.error('Erreur RLS:', error);
            return false;
        }
    }
	
    async init() {
        try {
			const cachedMessages = localStorage.getItem('chatMessages');
        if (cachedMessages) {
            try {
                this.localMessages = JSON.parse(cachedMessages);
            } catch (e) {
                console.warn('Erreur lors du chargement du cache local des messages:', e);
                this.localMessages = [];
            }
        }
            await this.loadBannedWords();
            
            // Vérification de bannissement par IP réelle
            const clientIP = await this.getClientIP();
            if (clientIP && clientIP !== 'anonymous') {
                const isBannedByIP = await this.checkBannedIP(clientIP);
                if (isBannedByIP) {
                    // Forcer la déconnexion
                    this.pseudo = null;
                    this.isAdmin = false;
                    localStorage.removeItem('chatPseudo');
                    localStorage.removeItem('isAdmin');
                    this.showNotification(`Vous êtes banni du chat: ${this.banDetails?.reason || ''}`, 'error');
                    
                    // Stocker dans localStorage pour empêcher les tentatives répétées
                    localStorage.setItem('chatBanned', 'true');
                    localStorage.setItem('chatBanReason', this.banDetails?.reason || '');
                    localStorage.setItem('chatBanExpires', this.banDetails?.expiresAt || '');
                }
            }
            
            // Si l'utilisateur est marqué comme banni dans localStorage, bloquer immédiatement
            if (localStorage.getItem('chatBanned') === 'true') {
                const banExpires = localStorage.getItem('chatBanExpires');
                if (!banExpires || new Date(banExpires) > new Date()) {
                    this.pseudo = null;
                    this.isAdmin = false;
                    this.showNotification(`Vous êtes banni du chat: ${localStorage.getItem('chatBanReason') || ''}`, 'error');
                } else {
                    // Bannissement expiré, nettoyer le localStorage
                    localStorage.removeItem('chatBanned');
                    localStorage.removeItem('chatBanReason');
                    localStorage.removeItem('chatBanExpires');
                }
            }
            
            // Vérifier si l'utilisateur est banni par son pseudo
            if (this.pseudo) {
                const isBanned = await this.checkBannedIP(this.pseudo);
                if (isBanned) {
                    // Forcer la déconnexion
                    this.pseudo = null;
                    this.isAdmin = false;
                    localStorage.removeItem('chatPseudo');
                    localStorage.removeItem('isAdmin');
                    this.showNotification(`Vous êtes banni du chat: ${this.banDetails?.reason || ''}`, 'error');
                    
                    // Stocker dans localStorage pour empêcher les tentatives répétées
                    localStorage.setItem('chatBanned', 'true');
                    localStorage.setItem('chatBanReason', this.banDetails?.reason || '');
                    localStorage.setItem('chatBanExpires', this.banDetails?.expiresAt || '');
                } else {
                    // Seulement si l'utilisateur n'est pas banni
                    await this.setCurrentUserForRLS();
                }
            }
            
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
            
            // Pour gérer spécifiquement les problèmes de PWA
            if (/Mobi|Android/i.test(navigator.userAgent)) {
                // Détecter si nous sommes dans une PWA
                const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                             window.navigator.standalone;
                             
                if (isPWA) {
                    console.log("Mode PWA détecté - Activation des ajustements spécifiques");
                    
                    // Ajouter le bouton d'accès à la zone de saisie
                    this.accessButton = this.addInputAccessButton();
                    
                    // Gérer la visibilité du clavier
                    this.handleKeyboardVisibility();
                    
                    // Observer les changements d'orientation
                    window.addEventListener('orientationchange', () => {
                        setTimeout(() => {
                            this.ensureChatInputVisible();
                        }, 500);
                    });
                }
            }

            if (this.pseudo) {
                this.setupBanChecker();
                this.startBanMonitoring();
            }

            // AJOUTEZ L'ÉCOUTEUR DE THÈME ICI
            // Écouter les changements de thème
            const themeObserver = new MutationObserver(() => {
                this.updateUnreadBadgeAndBubble();
            });

            // Observer les changements de classe sur le body et l'élément html
            themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
            themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

            // Optimisations pour appareils à performances limitées
            if (/Mobi|Android|iPad|tablet/i.test(navigator.userAgent)) {
                this.optimizeForLowEndDevices();
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
                // Réinitialisation du compteur
                this.unreadCount = 0;
                localStorage.setItem('unreadCount', '0');
                
                // Mettre à jour le badge ET l'info-bulle
                this.updateUnreadBadgeAndBubble();
                
                this.scrollToBottom();
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
        
        // Ajouter la détection de défilement pour optimiser le rendu
        const messagesContainer = this.container.querySelector('.chat-messages');
        if (messagesContainer) {
            let scrollTimeout;
            
            messagesContainer.addEventListener('scroll', () => {
                // Ajouter une classe pendant le défilement
                messagesContainer.classList.add('scrolling');
                
                // Nettoyer le timeout précédent
                clearTimeout(scrollTimeout);
                
                // Définir un nouveau timeout
                scrollTimeout = setTimeout(() => {
                    messagesContainer.classList.remove('scrolling');
                }, 150); // Attendre que le défilement s'arrête
            }, { passive: true });
        }
        
        // Détection du clavier virtuel sur tablette
        if (this.isTablet()) {
            const textarea = this.container.querySelector('.chat-input textarea');
            if (textarea && chatContainer) {
                textarea.addEventListener('focus', () => {
                    chatContainer.classList.add('keyboard-open');
                });
                
                textarea.addEventListener('blur', () => {
                    setTimeout(() => {
                        chatContainer.classList.remove('keyboard-open');
                    }, 300);
                });
            }
        }
        
        const chatMessages = this.container.querySelector('.chat-messages');
        if (chatMessages) {
            // Utiliser une approche différente qui permet le défilement normal du chat
            chatMessages.addEventListener('touchmove', (e) => {
                // Ne pas stopper la propagation - permettre le défilement normal
                e.stopPropagation(); // Ceci empêche l'événement de remonter à la page principale
            }, { passive: true });
            
            // Empêcher le rebond aux extrémités qui cause souvent le défilement de la page
            chatMessages.addEventListener('scroll', () => {
                const scrollTop = chatMessages.scrollTop;
                const scrollHeight = chatMessages.scrollHeight;
                const clientHeight = chatMessages.clientHeight;
                
                // Ajuster légèrement les valeurs pour éviter les problèmes de "bounce"
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
                
                // NOUVELLE PARTIE: Vérifier d'abord si l'utilisateur est banni
                // Vérification 1: Bannissement stocké localement
                if (localStorage.getItem('chatBanned') === 'true') {
                    const banExpires = localStorage.getItem('chatBanExpires');
                    if (!banExpires || new Date(banExpires) > new Date()) {
                        this.showNotification(`Vous êtes banni du chat: ${localStorage.getItem('chatBanReason') || ''}`, 'error');
                        this.playSound('error');
                        return;
                    } else {
                        // Bannissement expiré, nettoyer le localStorage
                        localStorage.removeItem('chatBanned');
                        localStorage.removeItem('chatBanReason');
                        localStorage.removeItem('chatBanExpires');
                    }
                }
                
                // Vérification 2: Vérifier le bannissement dans la base de données
                const isBanned = await this.checkBannedIP(pseudo);
                if (isBanned) {
                    this.showNotification(`Ce pseudo est banni: ${this.banDetails?.reason || ''}`, 'error');
                    this.playSound('error');
                    
                    // Stocker le ban dans localStorage
                    localStorage.setItem('chatBanned', 'true');
                    localStorage.setItem('chatBanReason', this.banDetails?.reason || '');
                    localStorage.setItem('chatBanExpires', this.banDetails?.expiresAt || '');
                    return;
                }

                try {
                    // Cas administrateur
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

                    // Vérifier si l'utilisateur existe déjà
                    const { data: existingUser, error: queryError } = await this.supabase
                        .from('users')
                        .select('*')
                        .eq('pseudo', pseudo)
                        .single();
                    
                    console.log('Résultat recherche utilisateur:', existingUser, queryError);
                    
                    // Si l'utilisateur n'existe pas ou erreur "not found", le créer
                    if (!existingUser || (queryError && queryError.code === 'PGRST116')) {
                        console.log('Création d\'un nouvel utilisateur');
                        
                        // Insérer directement dans users
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

                    // Définir les variables de session
                    this.pseudo = pseudo;
                    this.isAdmin = isAdmin;
                    localStorage.setItem('chatPseudo', pseudo);
                    localStorage.setItem('isAdmin', isAdmin);
                    this.startBanMonitoring();

                    // Actualiser l'interface
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

                        // Désactiver le scroll global quand le chat est ouvert
                        document.body.classList.add('no-scroll');

                        // Réactiver le scroll global quand le chat se ferme
                        chatContainer.addEventListener('touchend', () => {
                            document.body.classList.remove('no-scroll');
                        });
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
            if (this.banMonitorInterval) {
                clearInterval(this.banMonitorInterval);
            }
            if (this.banCheckInterval) {
                clearInterval(this.banCheckInterval);
            }
            
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
    
    setupChatListeners() {
        const input = this.container.querySelector('.chat-input textarea');
        const sendBtn = this.container.querySelector('.send-btn');
        const emojiBtn = this.container.querySelector('.emoji-btn');

        if (input && sendBtn) {
            const sendMessage = async () => {
                const content = input.value.trim();
                if (content) {
                    input.blur();
                    const messageContent = content;
                    input.value = '';
                    
                    const success = await this.sendMessage(messageContent);
                    
                    if (success) {
                        this.playSound('message');
                        if (this.accessButton) {
                            this.accessButton.style.display = 'block';
                            setTimeout(() => {
                                this.accessButton.style.display = 'none';
                            }, 5000);
                        }
                        this.ensureChatInputVisible();
                        [300, 800, 1500, 3000].forEach(delay => {
                            setTimeout(() => {
                                this.ensureChatInputVisible();
                            }, delay);
                        });
                    } else {
                        this.playSound('error');
                    }
                }
            };

            if (/Mobi|Android/i.test(navigator.userAgent)) {
                sendBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    sendMessage();
                });
            } else {
                sendBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    sendMessage();
                });
            }

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
            // Quelques emojis pour l'exemple (ajoutez plus comme dans votre code original)
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
                    if (!/Mobi|Android/i.test(navigator.userAgent)) {
                        textarea.focus();
                    }
                }
                this.playSound('click');
            });
            panel.appendChild(span);
        });
        
        const chatContainer = this.container.querySelector('.chat-container');
        chatContainer.appendChild(panel);
        
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) &&
                e.target !== this.container.querySelector('.emoji-btn') &&
                !this.container.querySelector('.emoji-btn').contains(e.target)) {
                panel.remove();
            }
        }, { once: true });
    }
    
    setupRealtimeSubscription() {
        const channel = this.supabase.channel('public:changes');
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
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'banned_ips' },
                async (payload) => {
                    console.log('Changement dans les bannissements:', payload);
                    if (this.pseudo && payload.new && payload.new.ip === this.pseudo) {
                        console.log('Vous avez été banni du chat');
                        this.showNotification('Vous avez été banni du chat', 'error');
                        await this.logout();
                    }
                }
            )
            .subscribe((status) => {
                console.log('Statut de la souscription temps réel:', status);
            });
    }
	async checkBannedIP(pseudo) {
        try {
            if (!pseudo) return false;
            
            console.log(`Vérification bannissement pour: ${pseudo}`);
            
            const { data, error } = await this.supabase
                .from('banned_ips')
                .select('*')
                .or(`ip.eq.${pseudo},pseudo.eq.${pseudo}`)
                .maybeSingle();

            if (error) {
                console.error('Erreur vérification bannissement:', error);
                return false;
            }
            
            if (!data) {
                return false;
            }
            
            // Vérifier si le bannissement est expiré
            if (data.expires_at && new Date(data.expires_at) < new Date()) {
                console.log(`Bannissement expiré pour: ${pseudo}`);
                await this.supabase
                    .from('banned_ips')
                    .delete()
                    .eq('id', data.id);
                return false;
            }
            
            console.log(`Utilisateur ${pseudo} est banni!`);
            
            this.banDetails = {
                reason: data.reason || "Raison non spécifiée",
                expiresAt: data.expires_at,
                bannedBy: data.banned_by
            };
            
            return true;
        } catch (error) {
            console.error('Erreur vérification bannissement:', error);
            return false;
        }
    }

    async getClientIP() {
    try {
        // Essayer plusieurs services pour obtenir l'IP
        try {
            const response = await fetch('https://api.ipify.org?format=json', { 
                timeout: 5000,
                mode: 'cors'
            });
            if (response.ok) {
                const data = await response.json();
                return data.ip;
            }
        } catch (err) {
            console.warn('Service IP primaire non disponible, essai du service secondaire');
        }
        
        try {
            const backupResponse = await fetch('https://api.db-ip.com/v2/free/self', { 
                timeout: 5000 
            });
            if (backupResponse.ok) {
                const backupData = await backupResponse.json();
                return backupData.ipAddress;
            }
        } catch (err) {
            console.warn('Service IP secondaire non disponible');
        }
        
        // Si aucun service ne répond, utiliser le pseudo comme identifiant unique
        return this.pseudo || 'anonymous';
    } catch (error) {
        console.warn('Erreur récupération IP:', error);
        return this.pseudo || 'anonymous';
    }
}

    startBanMonitoring() {
        console.log(`Démarrage de la surveillance des bannissements pour ${this.pseudo}`);
        
        this.checkBannedStatus();
        
        this.banMonitorInterval = setInterval(() => {
            this.checkBannedStatus();
        }, 30000);
        
        this.setupBanSubscription();
    }

    async checkBannedStatus() {
        if (!this.pseudo) return;
        
        try {
            const clientIP = await this.getClientIP();
            
            const isBannedByPseudo = await this.checkBannedIP(this.pseudo);
            const isBannedByIP = clientIP !== 'anonymous' && await this.checkBannedIP(clientIP);
            
            if (isBannedByPseudo || isBannedByIP) {
                console.log(`Bannissement détecté pour ${this.pseudo}, déconnexion...`);
                this.showNotification(`Vous avez été banni du chat: ${this.banDetails?.reason || ''}`, 'error');
                
                localStorage.setItem('chatBanned', 'true');
                localStorage.setItem('chatBanReason', this.banDetails?.reason || '');
                localStorage.setItem('chatBanExpires', this.banDetails?.expiresAt || '');
                
                if (this.banMonitorInterval) {
                    clearInterval(this.banMonitorInterval);
                }
                
                await this.logout();
            }
        } catch (error) {
            console.error('Erreur vérification de bannissement:', error);
        }
    }

    setupBanChecker() {
        this.banCheckInterval = setInterval(async () => {
            if (this.pseudo) {
                const isBanned = await this.checkBannedIP(this.pseudo);
                if (isBanned) {
                    console.log('Bannissement détecté, déconnexion...');
                    this.showNotification('Vous avez été banni du chat', 'error');
                    clearInterval(this.banCheckInterval);
                    await this.logout();
                }
            }
        }, 30000);
    }

    setupBanSubscription() {
        const banChannel = this.supabase.channel('public:banned_ips');
        
        banChannel
            .on('postgres_changes', 
                { event: 'INSERT', schema: 'public', table: 'banned_ips' },
                this.handleBanChange.bind(this)
            )
            .on('postgres_changes', 
                { event: 'UPDATE', schema: 'public', table: 'banned_ips' },
                this.handleBanChange.bind(this)
            )
            .subscribe();
    }

    async handleBanChange(payload) {
        try {
            console.log('Changement détecté dans les bannissements:', payload);
            
            const banData = payload.new;
            if (!banData) return;
            
            const clientIP = await this.getClientIP();
            
            if (
                (banData.ip === this.pseudo) || 
                (banData.pseudo === this.pseudo) ||
                (clientIP !== 'anonymous' && banData.ip === clientIP)
            ) {
                console.log('Ban détecté qui concerne cet utilisateur!');
                
                this.banDetails = {
                    reason: banData.reason || "Raison non spécifiée",
                    expiresAt: banData.expires_at,
                    bannedBy: banData.banned_by
                };
                
                this.showNotification(`Vous avez été banni du chat: ${this.banDetails.reason}`, 'error');
                
                localStorage.setItem('chatBanned', 'true');
                localStorage.setItem('chatBanReason', this.banDetails.reason);
                localStorage.setItem('chatBanExpires', this.banDetails.expiresAt || '');
                
                if (this.banMonitorInterval) {
                    clearInterval(this.banMonitorInterval);
                }
                
                await this.logout();
            }
        } catch (error) {
            console.error('Erreur traitement bannissement:', error);
        }
    }
	async handleNewMessage(message) {
    if (!message) return;
    
    const chatContainer = this.container.querySelector('.chat-container');
    const chatOpen = chatContainer && chatContainer.classList.contains('open');
    
    const messagesContainer = this.container.querySelector('.chat-messages');
    if (!messagesContainer) return;
    
    const existingMessage = messagesContainer.querySelector(`[data-message-id="${message.id}"]`);
    if (existingMessage) return;
    
    const messageElement = this.createMessageElement(message);
    messagesContainer.appendChild(messageElement);
    this.scrollToBottom();

    // 🔹 Ajouter le message au cache local
    this.localMessages.push(message);

    // 🔹 Limiter la taille du cache
    if (this.localMessages.length > this.maxCachedMessages) {
        this.localMessages = this.localMessages.slice(-this.maxCachedMessages);
    }

    // 🔹 Sauvegarder dans le localStorage
    localStorage.setItem('chatMessages', JSON.stringify(this.localMessages));

    if (message.pseudo !== this.pseudo) {
        this.playSound('message');

        if (!chatOpen) {
            this.unreadCount++;
            localStorage.setItem('unreadCount', this.unreadCount.toString());

            if (this.notificationsEnabled) {
                try {
                    const notificationResult = await this.sendNotificationToUser(message);
                    if (!notificationResult?.success) {
                        console.warn('Notification non envoyée:', notificationResult?.error || 'Raison inconnue');
                    }
                } catch (error) {
                    console.warn('Erreur notification ignorée:', error.message);
                }
            }

            this.updateUnreadBadgeAndBubble();
        }
    }
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
	async loadExistingMessages() {
        try {
            const rlsSuccess = await this.setCurrentUserForRLS();
            if (!rlsSuccess) {
                console.warn('Échec de la définition de l\'utilisateur pour RLS');
            }
            
            const { data: bannedUsers, error: bannedError } = await this.supabase
                .from('banned_ips')
                .select('ip, expires_at');
                
            const now = new Date();
            const bannedUsersList = bannedUsers 
                ? bannedUsers
                    .filter(ban => !ban.expires_at || new Date(ban.expires_at) > now)
                    .map(ban => ban.ip)
                : [];
                
            console.log('Utilisateurs bannis:', bannedUsersList);
            
            const { data: messages, error } = await this.supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;

            const container = this.container.querySelector('.chat-messages');
            if (container && messages) {
                container.innerHTML = '';
                
                messages.forEach(msg => {
                    const pseudoFromIP = msg.ip.split('-')[0];
                    
                    if (!bannedUsersList.includes(pseudoFromIP) && !bannedUsersList.includes(msg.pseudo)) {
                        container.appendChild(this.createMessageElement(msg));
                    } else {
                        console.log(`Message de l'utilisateur banni ${msg.pseudo} ignoré`);
                    }
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
            const isBanned = await this.checkBannedIP(this.pseudo);
            
            if (isBanned) {
                console.log(`Message rejeté - utilisateur banni: ${this.pseudo}`);
                this.showNotification('Vous êtes banni du chat', 'error');
                await this.logout();
                return false;
            }
            
            const containsBannedWord = await this.checkForBannedWords(content);
            if (containsBannedWord) {
                this.showNotification('Votre message contient des mots interdits', 'error');
                return false;
            }
            
            const rlsSuccess = await this.setCurrentUserForRLS();
            if (!rlsSuccess) {
                console.error("Échec de la définition de l'utilisateur pour RLS");
                this.showNotification('Erreur d\'authentification', 'error');
                return false;
            }
            
            const messageIp = `${this.pseudo}-${Date.now()}`;
            
            const message = {
                pseudo: this.pseudo,
                content: content,
                ip: messageIp,
                created_at: new Date().toISOString()
            };
            
			// Ajouter le message localement AVANT l'envoi au serveur
        const messageIp = `${this.pseudo}-${Date.now()}`;
        const message = {
            id: `local-${Date.now()}`, // ID temporaire
            pseudo: this.pseudo,
            content: content,
            ip: messageIp,
            created_at: new Date().toISOString()
        };
        
        // Afficher localement immédiatement
        this.handleNewMessage(message);
        
        // Ensuite envoyer au serveur
        const { data: messageData, error } = await this.supabase
            .from('messages')
            .insert({
                pseudo: this.pseudo,
                content: content,
                ip: messageIp,
                created_at: new Date().toISOString()
            })
            .select()
            .single();
                
            if (error) throw error;
            
            try {
                const response = await fetch("/api/sendPush", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: content,
                        fromUser: this.pseudo,
                        toUser: "all"
                    })
                });
                
                if (!response.ok) {
                    console.warn("Erreur API:", response.status, response.statusText);
                    return true;
                }
                
                const responseText = await response.text();
                
                try {
                    const data = JSON.parse(responseText);
                    console.log("✅ Notification envoyée :", data);
                } catch (jsonError) {
                    console.error("❌ Erreur JSON:", responseText);
                }
            } catch (notifError) {
                console.error("❌ Erreur lors de l'envoi de la notification :", notifError);
            }
            
            return true;
            
        } catch (error) {
            console.error('Erreur sendMessage:', error);
            return false;
        }
    }
	async checkForBannedWords(content) {
        try {
            if (this.bannedWords.size === 0) {
                await this.loadBannedWords();
            }
            
            const normalizedContent = content.toLowerCase()
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
                .replace(/\s+/g, ' ');
            
            for (const bannedWord of this.bannedWords) {
                if (normalizedContent.includes(bannedWord.toLowerCase())) {
                    console.log(`Mot banni détecté: "${bannedWord}" dans "${content}"`);
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('Erreur vérification mots bannis:', error);
            return false;
        }
    }

    // Améliorez votre fonction showAdminPanel pour inclure la gestion des bannissements

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
            <div class="panel-tabs">
                <button class="tab-btn active" data-tab="banned-words">Mots bannis</button>
                <button class="tab-btn" data-tab="banned-users">Utilisateurs bannis</button>
            </div>
            
            <div class="tab-content active" id="banned-words-tab">
                <div class="section">
                    <h4>Mots bannis</h4>
                    <div class="add-word">
                        <input type="text" placeholder="Nouveau mot à bannir">
                        <button class="add-word-btn">Ajouter</button>
                    </div>
                    <div class="banned-words-list"></div>
                </div>
            </div>
            
            <div class="tab-content" id="banned-users-tab">
                <div class="section">
                    <h4>Utilisateurs bannis</h4>
                    <div class="banned-users-controls">
                        <input type="text" id="ban-user-input" placeholder="Pseudo à bannir">
                        <select id="ban-duration">
                            <option value="">Ban permanent</option>
                            <option value="3600000">1 heure</option>
                            <option value="86400000">24 heures</option>
                            <option value="604800000">1 semaine</option>
                        </select>
                        <input type="text" id="ban-reason" placeholder="Raison du ban">
                        <button id="manual-ban-btn">Bannir</button>
                    </div>
                    <div class="banned-users-list">
                        <div class="loading-spinner">Chargement...</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(panel);
    
    // Charger les mots bannis
    this.loadBannedWords();
    
    // Ajouter les gestionnaires d'événements pour les onglets
    const tabBtns = panel.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Désactiver tous les onglets et leur contenu
            tabBtns.forEach(b => b.classList.remove('active'));
            panel.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            
            // Activer l'onglet cliqué
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab') + '-tab';
            panel.querySelector(`#${tabId}`).classList.add('active');
            
            // Charger les données spécifiques à l'onglet
            if (tabId === 'banned-users-tab') {
                this.loadBannedUsers();
            }
        });
    });
    
    // Gestionnaire pour les mots bannis
    const addWordBtn = panel.querySelector('.add-word-btn');
    const wordInput = panel.querySelector('.add-word input');

    if (addWordBtn && wordInput) {
        addWordBtn.addEventListener('click', async () => {
            const word = wordInput.value.trim().toLowerCase();
            if (word) {
                await this.addBannedWord(word);
                wordInput.value = '';
                await this.loadBannedWords();
            }
        });
    }
    
    // Gestionnaire pour bannir un utilisateur manuellement
    const manualBanBtn = panel.querySelector('#manual-ban-btn');
    if (manualBanBtn) {
        manualBanBtn.addEventListener('click', async () => {
            const pseudo = panel.querySelector('#ban-user-input').value.trim();
            const duration = panel.querySelector('#ban-duration').value;
            const reason = panel.querySelector('#ban-reason').value.trim();
            
            if (!pseudo) {
                this.showNotification('Veuillez saisir un pseudo', 'error');
                return;
            }
            
            await this.banUser(pseudo, reason, duration);
            panel.querySelector('#ban-user-input').value = '';
            panel.querySelector('#ban-reason').value = '';
            this.loadBannedUsers();
        });
    }

    panel.querySelector('.close-panel').addEventListener('click', () => panel.remove());
}

// Ajouter cette méthode pour charger les utilisateurs bannis
async loadBannedUsers() {
    try {
        const panel = document.querySelector('.admin-panel');
        if (!panel) return;
        
        const listContainer = panel.querySelector('.banned-users-list');
        if (!listContainer) return;
        
        // Afficher le chargement
        listContainer.innerHTML = '<div class="loading-spinner">Chargement...</div>';
        
        // Définir l'utilisateur courant pour RLS
        await this.setCurrentUserForRLS();
        
        // Charger les utilisateurs bannis
        const { data: bannedUsers, error } = await this.supabase
            .from('banned_ips')
            .select('*')
            .order('banned_at', { ascending: false });
            
        if (error) throw error;
        
        if (!bannedUsers || bannedUsers.length === 0) {
            listContainer.innerHTML = '<div class="no-items">Aucun utilisateur banni</div>';
            return;
        }
        
        // Formater la liste
        const now = new Date();
        const usersList = bannedUsers.map(ban => {
            const isExpired = ban.expires_at && new Date(ban.expires_at) < now;
            const expiryText = !ban.expires_at ? 'Permanent' :
                               isExpired ? 'Expiré' :
                               this.formatRemainingTime(new Date(ban.expires_at) - now);
            
            return `
                <div class="banned-user ${isExpired ? 'expired' : ''}">
                    <div class="ban-info">
                        <div class="ban-user">${ban.pseudo || ban.ip}</div>
                        <div class="ban-details">
                            <span class="ban-reason">${ban.reason || 'Aucune raison spécifiée'}</span>
                            <span class="ban-by">par ${ban.banned_by || 'Admin'}</span>
                            <span class="ban-date">${this.formatDate(ban.banned_at)}</span>
                        </div>
                    </div>
                    <div class="ban-status">
                        <span class="ban-expires">${expiryText}</span>
                        <button class="unban-btn" data-ban-id="${ban.id}">
                            <span class="material-icons">delete</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        listContainer.innerHTML = usersList;
        
        // Ajouter des écouteurs pour les boutons de débannissement
        const unbanBtns = listContainer.querySelectorAll('.unban-btn');
        unbanBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                const banId = btn.getAttribute('data-ban-id');
                await this.unbanUser(banId);
                this.loadBannedUsers();
            });
        });
        
    } catch (error) {
        console.error('Erreur chargement utilisateurs bannis:', error);
        const listContainer = document.querySelector('.admin-panel .banned-users-list');
        if (listContainer) {
            listContainer.innerHTML = '<div class="error">Erreur lors du chargement des utilisateurs bannis</div>';
        }
    }
}

// Méthode pour débannir un utilisateur
async unbanUser(banId) {
    try {
        // Définir l'utilisateur courant pour RLS
        await this.setCurrentUserForRLS();
        
        const { error } = await this.supabase
            .from('banned_ips')
            .delete()
            .eq('id', banId);
            
        if (error) throw error;
        
        this.showNotification('Utilisateur débanni avec succès', 'success');
        return true;
    } catch (error) {
        console.error('Erreur débannissement:', error);
        this.showNotification('Erreur lors du débannissement', 'error');
        return false;
    }
}

// Méthodes utilitaires pour le formatage
formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

formatRemainingTime(milliseconds) {
    if (milliseconds <= 0) return 'Expiré';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days} jour${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `${hours} heure${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
        return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
    }
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
        
        // Supprimer tout menu existant
        document.querySelectorAll('.message-options').forEach(el => el.remove());

        const options = document.createElement('div');
        options.className = 'message-options';
        
        // Détection du mobile
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

        // Ajustement de la position
        let posX = x;
        let posY = y;
        
        // Positionnement amélioré sur mobile
        if (isMobile) {
            // Centrer horizontalement
            posX = chatBounds.left + (chatBounds.width / 2) - (optionsRect.width / 2);
            
            // Positionner plus haut dans la zone visible
            posY = chatBounds.top + (chatBounds.height * 0.3);
        } else {
            // Ajustements pour écran de bureau
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

        // Protection contre les événements indésirables
        const preventPropagation = (e) => {
            e.stopPropagation();
        };
        
        // Appliquer à tous les types d'événements
        options.addEventListener('click', preventPropagation);
        options.addEventListener('touchstart', preventPropagation);
        options.addEventListener('touchend', preventPropagation);
        options.addEventListener('touchmove', preventPropagation);

        // Gestionnaire pour supprimer un message
        options.querySelector('.delete-option')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.deleteMessage(message.id);
            options.remove();
        });

        // Gestionnaire pour bannir un utilisateur
        options.querySelector('.ban-option')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showBanDialog(message);
            options.remove();
        });

        // Fermer le menu si on clique ailleurs, avec un délai
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
        }, 300); // Délai plus long pour éviter la fermeture accidentelle
    }

    async deleteMessage(messageId) {
        try {
            // Définir l'utilisateur courant pour les vérifications RLS
            await this.supabase.rpc('set_current_user', { user_pseudo: this.pseudo });
            
            // Ensuite effectuer la suppression
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
            // Définir l'utilisateur courant pour RLS
            await this.setCurrentUserForRLS();
            
            // Extraire le pseudo de l'IP (format actuel: pseudo-timestamp)
            const pseudo = ip.split('-')[0];
            
            const expiresAt = duration ? new Date(Date.now() + parseInt(duration)).toISOString() : null;
            
            // Obtenir l'IP réelle si possible, sinon utiliser le pseudo
            const clientIP = await this.getClientIP();
            const ipToUse = clientIP !== 'anonymous' ? clientIP : pseudo;
            
            // Vérifier d'abord si l'utilisateur est déjà banni
            const { data: existingBan } = await this.supabase
                .from('banned_ips')
                .select('*')
                .eq('ip', ipToUse)
                .maybeSingle();
                
            if (existingBan) {
                console.log('Utilisateur déjà banni, mise à jour du bannissement');
                
                // Mettre à jour le bannissement existant
                const { error: updateError } = await this.supabase
                    .from('banned_ips')
                    .update({
                        expires_at: expiresAt,
                        reason: reason || existingBan.reason,
                        banned_by: this.pseudo
                    })
                    .eq('id', existingBan.id);
                    
                if (updateError) throw updateError;
            } else {
                // Créer un nouveau bannissement
                const banData = {
                    ip: ipToUse,
                    pseudo: pseudo,
                    reason: reason,
                    expires_at: expiresAt,
                    banned_by: this.pseudo
                };
                
                console.log('Bannissement de l\'utilisateur avec données:', banData);
                
                const { error: insertError } = await this.supabase
                    .from('banned_ips')
                    .insert(banData);
                    
                if (insertError) throw insertError;
            }

            this.showNotification(`Utilisateur "${pseudo}" banni avec succès`, 'success');
            this.playSound('success');
            
            // Actualiser immédiatement les messages
            await this.loadExistingMessages();
            
            return true;
        } catch (error) {
            console.error('Erreur bannissement:', error);
            this.showNotification('Erreur lors du bannissement', 'error');
            return false;
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
        // On récupère le bouton de chat via son ID
        const chatToggleBtn = document.getElementById('chatToggleBtn');
        if (chatToggleBtn) {
            // Met à jour le badge de notification
            const badge = chatToggleBtn.querySelector('.chat-notification-badge');
            if (badge) {
                badge.textContent = this.unreadCount || '';
                badge.classList.toggle('hidden', this.unreadCount === 0);
            }
            
            // Supprimer toute bulle existante dans le document pour éviter les doublons
            const existingBubbles = document.querySelectorAll('.info-bubble');
            existingBubbles.forEach(bubble => bubble.remove());
            
            // Si le chat est ouvert ou s'il n'y a pas de messages non lus, on ne crée pas de bulle
            if (this.isOpen || this.unreadCount === 0) {
                return;
            }
            
            // Déterminer le thème actuel
            const isDarkTheme = document.body.classList.contains('dark-theme') || 
                              document.documentElement.classList.contains('dark-theme') ||
                              document.body.getAttribute('data-theme') === 'dark';
            
            // Créer une nouvelle bulle
            const bubble = document.createElement('div');
            bubble.className = 'info-bubble show';
            bubble.innerHTML = `<div style="font-weight: bold;">${this.unreadCount} nouveau(x) message(s)</div>`;
            
            // Sur mobile, on attache la bulle au body pour un positionnement absolu
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile) {
                // Utiliser la classe CSS de base
                bubble.className = 'info-bubble info-bubble-mobile show';
                
                // Appliquer les styles en fonction du thème
                if (isDarkTheme) {
                    bubble.style.background = 'linear-gradient(135deg, #222232 0%, #444464 100%)';
                    bubble.style.color = '#f0f0f0';
                    bubble.style.border = '2px solid rgba(100, 100, 255, 0.3)';
                } else {
                    bubble.style.background = 'linear-gradient(135deg, #8a40b8 0%, #c066ff 100%)';
                    bubble.style.color = 'white';
                    bubble.style.border = '2px solid rgba(255, 255, 255, 0.5)';
                }
                
                // Ajouter au body
                document.body.appendChild(bubble);
                
                // Ajouter un gestionnaire de clic pour ouvrir le chat
                bubble.addEventListener('click', () => {
                    this.isOpen = true;
                    localStorage.setItem('chatOpen', 'true');
                    const chatContainer = this.container.querySelector('.chat-container');
                    if (chatContainer) {
                        chatContainer.classList.add('open');
                    }
                    this.unreadCount = 0;
                    localStorage.setItem('unreadCount', '0');
                    this.updateUnreadBadgeAndBubble();
                    this.scrollToBottom();
                    this.playSound('click');
                    bubble.remove();
                });
            } else {
                // Comportement normal sur desktop
                chatToggleBtn.appendChild(bubble);
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

    scrollToBottom() {
        const messagesContainer = this.container.querySelector('.chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    ensureChatInputVisible() {
        if (/Mobi|Android/i.test(navigator.userAgent)) {
            // Obtenir les éléments nécessaires
            const chatContainer = this.container.querySelector('.chat-container');
            const chatInput = this.container.querySelector('.chat-input');
            const messagesContainer = this.container.querySelector('.chat-messages');
            
            if (chatInput && chatContainer) {
                console.log("Tentative de rendre la zone de saisie visible");
                
                // 1. D'abord, assurer que le conteneur du chat est à sa hauteur maximale
                chatContainer.style.height = '80vh';
                
                // 2. Repositionner les messages pour qu'ils laissent de la place pour l'input
                if (messagesContainer) {
                    messagesContainer.style.maxHeight = 'calc(100% - 80px)';
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
                
                // 3. Forcer le conteneur à se redessiner (redraw)
                chatContainer.style.opacity = '0.99';
                setTimeout(() => {
                    chatContainer.style.opacity = '1';
                    
                    // 4. Forcer le scroll tout en bas
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    
                    // 5. Technique spéciale pour les PWA sur Android
                    if (window.matchMedia('(display-mode: standalone)').matches) {
                        // Fixer la position de la zone d'entrée
                        chatInput.style.position = 'sticky';
                        chatInput.style.bottom = '0';
                        chatInput.style.zIndex = '1000';
                        
                        // Scroll doux vers la zone d'entrée
                        chatInput.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    }
                    
                    console.log("Ajustement de visibilité effectué");
                }, 50);
            }
        }
    }

    handleKeyboardVisibility() {
        if (!/Mobi|Android|iPad|tablet/i.test(navigator.userAgent)) return;
        
        const chatContainer = this.container.querySelector('.chat-container');
        const chatInput = this.container.querySelector('.chat-input');
        const textarea = chatInput?.querySelector('textarea');
        const messagesContainer = this.container.querySelector('.chat-messages');
        
        if (!chatContainer || !chatInput || !textarea) return;
        
        // Détecter si c'est une tablette
        const isTablet = this.isTablet();

        // Détecter l'ouverture du clavier virtuel
        textarea.addEventListener('focus', () => {
            console.log("Clavier virtuel ouvert");
            
            if (isTablet) {
                // Sur tablette, réduire davantage la hauteur pour laisser plus de place au clavier
                chatContainer.style.height = '40vh';
                chatContainer.style.maxHeight = '40vh';
                
                // Réduire la hauteur des messages pour laisser plus de place à l'input
                if (messagesContainer) {
                    messagesContainer.style.maxHeight = 'calc(40vh - 90px)';
                }
                
                // Déplacer le chat plus haut
                chatContainer.style.bottom = '50vh';
            } else {
                // Sur smartphone, ajustements standards
                chatContainer.style.height = '50vh';
                chatContainer.style.maxHeight = '50vh';
            }
            
            // S'assurer que la zone de saisie reste visible
            setTimeout(() => {
                textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
        
        // Détecter la fermeture du clavier virtuel
        textarea.addEventListener('blur', () => {
            console.log("Clavier virtuel fermé");
            
            // Restaurer la hauteur normale
            setTimeout(() => {
                if (isTablet) {
                    chatContainer.style.height = '65vh';
                    chatContainer.style.maxHeight = '65vh';
                    chatContainer.style.bottom = '20vh';
                    
                    if (messagesContainer) {
                        messagesContainer.style.maxHeight = 'calc(65vh - 90px)';
                    }
                } else {
                    chatContainer.style.height = '65vh';
                    chatContainer.style.maxHeight = '65vh';
                }
                
                // S'assurer que la zone de saisie est visible
                chatInput.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 300);
        });
    }

    addInputAccessButton() {
        // Ne l'ajouter que sur mobile
        if (!/Mobi|Android/i.test(navigator.userAgent)) return;
        
        // Vérifier si on est dans une PWA
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                     window.navigator.standalone;
        
        if (!isPWA) return;
        
        // Supprimer le bouton existant s'il y en a un
        const existingButton = document.getElementById('chat-input-access');
        if (existingButton) existingButton.remove();
        
        // Créer le bouton d'accès
        const accessButton = document.createElement('button');
        accessButton.id = 'chat-input-access';
        accessButton.textContent = '⬆️ Zone de saisie';
        accessButton.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--chat-success, #4CAF50);
            color: white;
            border: none;
            border-radius: 20px;
            padding: 8px 15px;
            z-index: 2000;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            display: none;
        `;
        
        document.body.appendChild(accessButton);
        
        // Afficher le bouton après l'envoi d'un message
        accessButton.addEventListener('click', () => {
            const chatInput = this.container.querySelector('.chat-input');
            if (chatInput) {
                // Fermer le clavier s'il est ouvert
                document.activeElement?.blur();
                
                // Attendre que le clavier se ferme
                setTimeout(() => {
                    // Ajuster la position du chat container
                    const chatContainer = this.container.querySelector('.chat-container');
                    if (chatContainer) {
                        chatContainer.style.height = '65vh';
                        chatContainer.style.bottom = '15vh';
                    }
                    
                    // Faire défiler jusqu'à la zone de saisie
                    chatInput.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    
                    // Cacher le bouton après utilisation
                    accessButton.style.display = 'none';
                }, 300);
            }
        });
        
        // Montrer le bouton après l'envoi d'un message
        return accessButton;
    }

    isTablet() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent);
        const isIPad = /ipad/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        return isTablet || isIPad || (window.innerWidth >= 600 && window.innerWidth <= 1024);
    }

    optimizeForLowEndDevices() {
        // Détecter si l'appareil est une tablette peu puissante
        const isLowPerfDevice = this.isTablet() && (navigator.hardwareConcurrency <= 4 || !navigator.hardwareConcurrency);
        
        if (isLowPerfDevice) {
            console.log("Optimisations pour appareil à performances limitées activées");
            
            // Simplifier les animations
            document.documentElement.style.setProperty('--chat-animation-duration', '0.2s');
            
            // Limiter le nombre de messages affichés
            const messagesContainer = this.container.querySelector('.chat-messages');
            if (messagesContainer && messagesContainer.children.length > 30) {
                // Garder seulement les 30 derniers messages
                while (messagesContainer.children.length > 30) {
                    messagesContainer.removeChild(messagesContainer.firstChild);
                }
            }
            
            // Simplifier les gradients
            const elements = this.container.querySelectorAll('.chat-container, .message, .chat-header, .chat-input');
            elements.forEach(el => {
                if (el) {
                    el.style.backgroundImage = 'none';
                }
            });
        }
    }

    async setupPushNotifications() {
        try {
            // Demander d'abord la permission des notifications
            const permissionGranted = await this.requestNotificationPermission();
            if (!permissionGranted) {
                return false;
            }
            
            // Définir l'utilisateur courant pour les vérifications RLS
            await this.supabase.rpc('set_current_user', { user_pseudo: this.pseudo });
            
            const registration = await navigator.serviceWorker.ready;
            
            // Vérifier les souscriptions existantes
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

            // Créer une nouvelle souscription
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array('BLpaDhsC7NWdMacPN0mRpqZlsaOrOEV1AwgPyqs7D2q3HBZaQqGSMH8zTnmwzZrFKjjO2JvDonicGOl2zX9Jsck')
            });

            // Enregistrer la nouvelle souscription
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
            
            // Afficher une notification de test
            this.showNotification('Notifications activées!', 'success');
            
            // Envoyer une notification de test
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
            // Vérifier si les notifications sont supportées
            if (!('Notification' in window)) return;
            
            // Créer une notification de test
            new Notification('Notification de test', {
                body: 'Les notifications fonctionnent correctement!',
                icon: '/icons/icon-192x192.png' // Remplacez par le chemin de votre icône
            });
        } catch (error) {
            console.error('Erreur notification test:', error);
        }
    }

    async requestNotificationPermission() {
        try {
            // Vérifier si les notifications sont supportées
            if (!('Notification' in window)) {
                this.showNotification('Les notifications ne sont pas supportées par ce navigateur', 'error');
                return false;
            }
            
            // Demander la permission
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
            
            // Supprimer l'ancienne souscription
            const oldSubscription = await registration.pushManager.getSubscription();
            if (oldSubscription) {
                await oldSubscription.unsubscribe();
                
                // Supprimer l'ancienne souscription de Supabase
                await this.supabase
                    .from('push_subscriptions')
                    .delete()
                    .match({ 
                        pseudo: this.pseudo,
                        subscription: JSON.stringify(oldSubscription)
                    });
            }

            // Créer une nouvelle souscription - utiliser la même clé que dans setupPushNotifications()
            const newSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array('BLpaDhsC7NWdMacPN0mRpqZlsaOrOEV1AwgPyqs7D2q3HBZaQqGSMH8zTnmwzZrFKjjO2JvDonicGOl2zX9Jsck')
            });

            // Sauvegarder la nouvelle souscription
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

    async unsubscribeFromPushNotifications() {
        try {
            // Définir l'utilisateur courant pour les vérifications RLS
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
            
            // Créer un contrôleur d'abandon avec un timeout plus long
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes
            
            const response = await fetch("/api/sendPush", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: message.content,
                    fromUser: message.pseudo,
                    toUser: this.pseudo
                }),
                signal: controller.signal // Ajouter le signal d'abandon
            });
            
            // Annuler le timeout une fois la réponse reçue
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const text = await response.text();
                console.warn('Réponse API erreur:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: text
                });
                
                // Ne pas bloquer l'interface utilisateur avec une erreur de notification
                return { success: false, error: text };
            }
            
            const result = await response.json();
            console.log('Réponse API succès:', result);
            return result;
        } catch (error) {
            // Gérer spécifiquement les erreurs d'abandon
            if (error.name === 'AbortError') {
                console.warn('La requête de notification a été abandonnée (timeout)');
                return { success: false, error: 'timeout' };
            }
            
            // Pour les autres erreurs, on log mais on ne propage pas l'erreur
            console.warn('Erreur envoi notification:', error.message);
            return { success: false, error: error.message };
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
