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

async setCurrentUserForRLS() {
        try {
            if (!this.pseudo) return false;

            console.log(Définition de l'utilisateur courant pour RLS: ${this.pseudo});
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
        await this.loadBannedWords();

        // Vérifier si l'utilisateur est banni avant de continuer
        if (this.pseudo) {
            const isBanned = await this.checkBannedIP(this.pseudo);
            if (isBanned) {
                // Forcer la déconnexion si l'utilisateur est banni
                this.pseudo = null;
                this.isAdmin = false;
                localStorage.removeItem('chatPseudo');
                localStorage.removeItem('isAdmin');
                this.showNotification('Vous êtes banni du chat', 'error');
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
        } // <-- CETTE ACCOLADE MANQUAIT

        if (this.pseudo) {
            this.setupBanChecker();
        }
        if (this.pseudo) {
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
                    list.innerHTML = words.map(w => 
                        <div class="banned-word">
                            ${w.word}
                            <button class="remove-word" data-word="${w.word}">×</button>
                        </div>
                    ).join('');

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
    return 
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
    ;
}

getPseudoHTMLWithoutToggle() {
    return 
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
    ;
}

getChatHTML() {
    return 
        <button class="chat-toggle" title="Ouvrir le chat">
            <span class="material-icons">chat</span>
            <span class="notification-badge hidden">${this.unreadCount}</span>
        </button>
        <div class="chat-container">
            <div class="chat-header">
                <div class="header-title">Chat - ${this.pseudo}</div>
                <div class="header-buttons">
                    ${this.isAdmin ? 
                        <button class="admin-panel-btn" title="Panel Admin">
                            <span class="material-icons">admin_panel_settings</span>
                        </button>
                     : ''}
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
    ;
}

getChatHTMLWithoutToggle() {
    return 
        <div class="chat-container">
            <div class="chat-header">
                <div class="header-title">Chat - ${this.pseudo}</div>
                <div class="header-buttons">
                    ${this.isAdmin ? 
                        <button class="admin-panel-btn" title="Panel Admin">
                            <span class="material-icons">admin_panel_settings</span>
                        </button>
                     : ''}
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
    ;
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

    // Le reste de votre code pour setupListeners reste inchangé...
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
// Ajoutez ici le code pour le bouton de déconnexion
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
    // Remplacer le code existant par celui-ci
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
async registerUser(pseudo, password, isAdmin = false) {
    try {
        console.log('Tentative d\'inscription de l\'utilisateur:', pseudo, 'admin:', isAdmin);

        // Insérer directement dans votre table users
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
        // Vérifier si le pseudo est stocké localement
        if (this.pseudo) {
            // Vérifier si l'utilisateur existe dans la base de données
            const { data: userData, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('pseudo', this.pseudo)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            // Si l'utilisateur existe, mettre à jour les informations
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
        // Nettoyer l'intervalle de vérification des bannissements
        if (this.banCheckInterval) {
            clearInterval(this.banCheckInterval);
        }

        // Nettoyer les données locales
        this.pseudo = null;
        this.isAdmin = false;
        localStorage.removeItem('chatPseudo');
        localStorage.removeItem('isAdmin');

        // Actualiser l'interface
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
        // Vérification et autre code...

        // Fermer le clavier immédiatement
        input.blur();

        // Stocker et vider l'input
        const messageContent = content;
        input.value = '';

        // Envoyer le message
        const success = await this.sendMessage(messageContent);

        if (success) {
            this.playSound('message');
            // Montrer le bouton d'accès après l'envoi
        if (this.accessButton) {
            this.accessButton.style.display = 'block';

            // Le cacher automatiquement après 5 secondes
            setTimeout(() => {
                this.accessButton.style.display = 'none';
            }, 5000);
        }
            // Appels multiples pour s'assurer que la zone de saisie reste visible
            this.ensureChatInputVisible(); // Immédiatement

            // Répéter avec différents délais
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

    // Ajout du gestionnaire pour le bouton emoji
    if (emojiBtn) {
        emojiBtn.addEventListener('click', () => {
            this.toggleEmojiPanel();
        });
    }
}

// Nouvelle méthode pour gérer le panneau d'emojis
toggleEmojiPanel() {
    let panel = this.container.querySelector('.emoji-panel');

    // Si le panneau existe déjà, on le ferme en cliquant sur l'icône
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

  // 🎭 Expressions et visages supplémentaires
  '🥹', '🫠', '🫡', '🫣', '🫤', '😇', '🥴', '😵‍💫', '🫥', '🤩', '🫨', '🫧',

  // 🐶 Animaux et nature
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', 
  '🐷', '🐸', '🐵', '🦄', '🐝', '🦋', '🐞', '🐢', '🐍', '🦖', '🦕', '🦀', 
  '🐡', '🐬', '🐳', '🐊', '🦆', '🦉', '🐓', '🦜', '🦢', '🦩', '🦚',

  // 🍔 Nourriture et boissons
  '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🥭', '🍍', 
  '🥥', '🥑', '🍔', '🍟', '🌭', '🍕', '🥪', '🍜', '🍣', '🍩', '🍪', '🎂',

  // 🎮 Objets et loisirs
  '🎮', '🕹️', '🎲', '♟️', '🎯', '🎳', '🏀', '⚽', '🏈', '🎾', '🏐', '🏉', 
  '🎼', '🎸', '🎷', '🎺', '🥁', '🎻', '📸', '🎥', '📺', '📱', '💻', '🖥️',

  // 🚀 Transport et voyage
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚜', '🛴', '🚲', 
  '🛵', '🏍️', '🚂', '🚆', '✈️', '🚀', '🛸', '🚢', '🛳️', '⛵',

  // 🏆 Récompenses et symboles
  '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '🎗️', '🔮', '💎', '📿', '💰', '💵', 
  '💳', '💡', '🛑', '🚧', '⚠️', '❗', '❓', '💢', '🔥', '✨', '🎉', '🎊',

  // 🏳️‍🌈 Drapeaux et symboles
  '🇫🇷', '🇧🇪', '🇨🇭', '🇨🇦', '🇪🇺', '🌍', '🌎', '🌏', '🏴‍☠️', '🏳️‍🌈', 
  '🎌', '⚜️', '☮️', '💟', '♻️', '✅', '❌', '➕', '➖', '➗', '✖️', '➰',

  // 🔄 Flèches et directions
  '⬆️', '⬇️', '⬅️', '➡️', '↗️', '↘️', '↙️', '↖️', '🔄', '🔃', '🔙', '🔛', 
  '🔝', '🔜', '↩️', '↪️', '⤴️', '⤵️', '🔼', '🔽', '⏫', '⏬', '⏪', '⏩',

  // 🔠 Lettres en emojis (correction)
  '🅰️', '🅱️', '🆎', '🆑', '🆒', '🆓', 'ℹ️', '🆔', 'Ⓜ️', '🆕', '🆖', '🅾️', 
  '🆗', '🅿️', '🆘', '🆙', '🆚', '🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', 
  '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹', '🇺', 
  '🇻', '🇼', '🇽', '🇾', '🇿', 

 // 🔢 Chiffres en emoji
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
                // Ne pas redonner le focus sur mobile pour éviter l'ouverture du clavier
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
                const messageElement = this.container.querySelector([data-message-id="${payload.old.id}"]);
                if (messageElement) messageElement.remove();
            }
        )
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'banned_ips' },
            async (payload) => {
                console.log('Changement dans les bannissements:', payload);
                // Si l'utilisateur courant est banni, le déconnecter
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

setupBanChecker() {
    // Vérifier le bannissement toutes les 30 secondes
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

    const existingMessage = messagesContainer.querySelector([data-message-id="${message.id}"]);
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
                    // Utiliser le résultat mais ne pas propager d'erreur
                    const notificationResult = await this.sendNotificationToUser(message);
                    if (!notificationResult?.success) {
                        console.warn('Notification non envoyée:', notificationResult?.error || 'Raison inconnue');
                    }
                } catch (error) {
                    // En cas d'erreur, simplement logger mais ne pas interrompre
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

    // Format de l'heure
    const time = date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    let dateText, icon;

    // Si c'est aujourd'hui
    if (date.toDateString() === today.toDateString()) {
        dateText = "Aujourd'hui";
        icon = "today";
    }
    // Si c'est hier
    else if (date.toDateString() === yesterday.toDateString()) {
        dateText = "Hier";
        icon = "history";
    }
    // Pour les autres jours
    else {
        dateText = date.toLocaleDateString('fr-FR');
        icon = "calendar_today";
    }

    return 
        <span class="material-icons">${icon}</span>
        <span class="date">${dateText}</span>
        <span class="time">${time}</span>
    ;
}

createMessageElement(message) {
    const div = document.createElement('div');
    div.className = message ${message.pseudo === this.pseudo ? 'sent' : 'received'};
    div.dataset.messageId = message.id;

    div.innerHTML = 
        <div class="message-author">${message.pseudo}</div>
        <div class="message-content">${this.escapeHtml(message.content)}</div>
        <div class="message-time">${this.formatMessageTime(message.created_at)}</div>
    ;

    if (this.isAdmin || message.pseudo === this.pseudo) {
        // Variables pour gérer l'appui long et prévenir les actions indésirables
        let touchTimer;
        let longPressActive = false;
        let lastTouchEnd = 0;

        // Gestion du clic droit sur PC
        div.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showMessageOptions(message, e.clientX, e.clientY);
        });

        // Gérer le toucher qui commence (touchstart)
        div.addEventListener('touchstart', (e) => {
            // Ne pas démarrer un nouveau timer si un appui long a été récemment détecté
            if (Date.now() - lastTouchEnd < 1000) {
                return;
            }

            // Démarrer le timer pour l'appui long
            touchTimer = setTimeout(() => {
                longPressActive = true;
                const touch = e.touches[0];
                this.showMessageOptions(message, touch.clientX, touch.clientY);

                // Ajouter une vibration si disponible
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }, 800);
        });

        // Annuler l'appui long si le doigt bouge
        div.addEventListener('touchmove', () => {
            clearTimeout(touchTimer);
        });

        // Gérer la fin du toucher
        div.addEventListener('touchend', (e) => {
            clearTimeout(touchTimer);

            // Si c'était un appui long, empêcher toute autre action
            if (longPressActive) {
                e.preventDefault();
                e.stopPropagation();
                longPressActive = false;

                // Enregistrer le moment où l'appui long s'est terminé
                lastTouchEnd = Date.now();
            }
        });

        // S'assurer que le timer est annulé si le toucher est annulé
        div.addEventListener('touchcancel', () => {
            clearTimeout(touchTimer);
            longPressActive = false;
        });
    }

    return div;
}

    async loadExistingMessages() {
    try {
        // Définir l'utilisateur courant pour RLS
        const rlsSuccess = await this.setCurrentUserForRLS();
        if (!rlsSuccess) {
            console.warn('Échec de la définition de l\'utilisateur pour RLS');
        }

        // Obtenir la liste des utilisateurs bannis avec une requête plus simple
        const { data: bannedUsers, error: bannedError } = await this.supabase
            .from('banned_ips')
            .select('ip, expires_at');

        // Filtrer les bannissements non expirés
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
                // Extraire le pseudo du format 'pseudo-timestamp'
                const pseudoFromIP = msg.ip.split('-')[0];

                // Ne pas afficher les messages des utilisateurs bannis
                if (!bannedUsersList.includes(pseudoFromIP) && !bannedUsersList.includes(msg.pseudo)) {
                    container.appendChild(this.createMessageElement(msg));
                } else {
                    console.log(Message de l'utilisateur banni ${msg.pseudo} ignoré);
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
        // Utiliser directement this.pseudo comme identifiant
        const isBanned = await this.checkBannedIP(this.pseudo);

        if (isBanned) {
            console.log(Message rejeté - utilisateur banni: ${this.pseudo});
            this.showNotification('Vous êtes banni du chat', 'error');
            // Déconnecter l'utilisateur banni
            await this.logout();
            return false;
        }

        // Vérifier les mots bannis
        const containsBannedWord = await this.checkForBannedWords(content);
        if (containsBannedWord) {
            this.showNotification('Votre message contient des mots interdits', 'error');
            return false;
        }

        // Définir l'utilisateur courant pour RLS
        const rlsSuccess = await this.setCurrentUserForRLS();
        if (!rlsSuccess) {
            console.error("Échec de la définition de l'utilisateur pour RLS");
            this.showNotification('Erreur d\'authentification', 'error');
            return false;
        }

        // Créer l'identifiant unique pour ce message
        const messageIp = ${this.pseudo}-${Date.now()};

        // Construire le message avec l'identifiant
        const message = {
            pseudo: this.pseudo,
            content: content,
            ip: messageIp,
            created_at: new Date().toISOString()
        };

        // Insérer le message
        const { data: messageData, error } = await this.supabase
            .from('messages')
            .insert(message)
            .select()
            .single();

        if (error) throw error;

        // Envoi de la notification
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

            // Vérifier si la réponse est OK
            if (!response.ok) {
                console.warn("Erreur API:", response.status, response.statusText);
                return true; // Continuer car l'envoi de message a réussi
            }

            // Lire la réponse UNIQUEMENT UNE FOIS
            const responseText = await response.text();

            // Essayer de parser comme JSON
            try {
                const data = JSON.parse(responseText);
                console.log("✅ Notification envoyée :", data);
            } catch (jsonError) {
                console.error("❌ Erreur JSON:", responseText);
            }
        } catch (notifError) {
            console.error("❌ Erreur lors de l'envoi de la notification :", notifError);
        }

        return true; // Retourner true si le message a été envoyé avec succès

    } catch (error) {
        console.error('Erreur sendMessage:', error);
        return false;
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
// Ajoutez cette nouvelle méthode ici
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
// Méthode utilitaire pour détecter le type d'appareil
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

isTablet() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isTablet = /(ipad|tablet|(android(?!.mobile))|(windows(?!.phone)(.touch))|kindle|playbook|silk|(puffin(?!.(IP|AP|WP))))/.test(userAgent);
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
                console.log(Chargement du son: ${name} depuis ${path});
                const audio = new Audio(path);
                await audio.load();
                this.sounds.set(name, audio);
                console.log(Son ${name} chargé avec succès);
            } catch (error) {
                console.error(Erreur chargement son ${name}:, error);
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
                            console.warn(Erreur lecture son ${soundName}:, error);
                        }
                    });
                }
            } catch (error) {
                // Ignore silently
            }
        }
    }

    async checkBannedIP(ip) {
    try {
        // Extraire le pseudo de l'IP (format: pseudo-timestamp)
        const pseudo = ip.split('-')[0];
        console.log(Vérification bannissement pour pseudo: ${pseudo});

        // Requête plus simple et directe
        const { data, error } = await this.supabase
            .from('banned_ips')
            .select('*')
            .eq('ip', pseudo)
            .maybeSingle();

        if (error) {
            console.error('Erreur vérification bannissement:', error);
            return false;
        }

        // Si pas de bannissement, retourner false
        if (!data) {
            console.log(Aucun bannissement trouvé pour: ${pseudo});
            return false;
        }

        console.log('Bannissement trouvé:', data);

        // Vérifier si le bannissement est expiré
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            console.log(Bannissement expiré pour: ${pseudo});
            // Supprimer le bannissement expiré
            await this.supabase
                .from('banned_ips')
                .delete()
                .eq('ip', pseudo);
            return false;
        }

        console.log(Utilisateur ${pseudo} est banni!);
        return true;
    } catch (error) {
        console.error('Erreur vérification bannissement:', error);
        return false;
    }
}

    async getClientIP() {
    try {
        // Utiliser uniquement le pseudo comme identifiant pour le bannissement
        return this.pseudo || 'anonymous';
    } catch {
        return 'anonymous';
    }
}

startBanMonitoring() {
    console.log(Démarrage de la surveillance des bannissements pour ${this.pseudo});

    // Vérifier immédiatement
    this.checkBannedStatus();

    // Puis vérifier toutes les 10 secondes
    this.banMonitorInterval = setInterval(() => {
        this.checkBannedStatus();
    }, 10000);
}

async checkBannedStatus() {
    if (!this.pseudo) return;

    const isBanned = await this.checkBannedIP(this.pseudo);
    if (isBanned) {
        console.log(Bannissement détecté pour ${this.pseudo}, déconnexion...);
        this.showNotification('Vous avez été banni du chat', 'error');

        // Arrêter la surveillance
        if (this.banMonitorInterval) {
            clearInterval(this.banMonitorInterval);
        }

        // Déconnecter l'utilisateur
        await this.logout();
    }
}

    async checkForBannedWords(content) {
    try {
        // Recharger les mots bannis si nécessaire
        if (this.bannedWords.size === 0) {
            await this.loadBannedWords();
        }

        // Normaliser le contenu pour une meilleure détection
        const normalizedContent = content.toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
            .replace(/\s+/g, ' ');

        // Vérifier chaque mot banni
        for (const bannedWord of this.bannedWords) {
            if (normalizedContent.includes(bannedWord.toLowerCase())) {
                console.log(Mot banni détecté: "${bannedWord}" dans "${content}");
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('Erreur vérification mots bannis:', error);
        return false; // Par sécurité, on ne bloque pas le message en cas d'erreur
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
        notification.className = notification-popup ${type};
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

    // Mettez à jour la fonction qui gère les notifications
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
        bubble.innerHTML = <div style="font-weight: bold;">${this.unreadCount} nouveau(x) message(s)</div>;

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
    // Dans votre méthode de détection d'appareil, ajoutez cette fonction

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

// 3. Et celle-ci en troisième
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
    accessButton.style.cssText = 
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
    ;

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

showAdminPanel() {
        if (!this.isAdmin) return;

        const existingPanel = document.querySelector('.admin-panel');
        if (existingPanel) {
            existingPanel.remove();
            return;
        }

        const panel = document.createElement('div');
        panel.className = 'admin-panel';
        panel.innerHTML = 
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
        ;

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

    // Supprimer tout menu existant
    document.querySelectorAll('.message-options').forEach(el => el.remove());

    const options = document.createElement('div');
    options.className = 'message-options';

    // Détection du mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        options.classList.add('mobile-options');
    }

    options.innerHTML = 
        <div class="options-content">
            <button class="delete-option">
                <span class="material-icons">delete</span> Supprimer
            </button>
            ${this.isAdmin ? 
                <button class="ban-option">
                    <span class="material-icons">block</span> Bannir IP
                </button>
             : ''}
        </div>
    ;

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

    options.style.left = ${posX}px;
    options.style.top = ${posY}px;

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

        const messageElement = this.container.querySelector([data-message-id="${messageId}"]);
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
        const dialogHTML = 
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
        ;

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

        // Vérifier d'abord si l'utilisateur est déjà banni
        const { data: existingBan } = await this.supabase
            .from('banned_ips')
            .select('*')
            .eq('ip', pseudo)
            .maybeSingle();

        if (existingBan) {
            console.log('Utilisateur déjà banni, mise à jour du bannissement');

            // Mettre à jour le bannissement existant
            const { error: updateError } = await this.supabase
                .from('banned_ips')
                .update({
                    expires_at: expiresAt
                })
                .eq('ip', pseudo);

            if (updateError) throw updateError;
        } else {
            // Créer un nouveau bannissement
            const banData = {
                ip: pseudo,
                expires_at: expiresAt
            };

            console.log('Bannissement de l\'utilisateur avec données:', banData);

            const { error: insertError } = await this.supabase
                .from('banned_ips')
                .insert(banData);

            if (insertError) throw insertError;
        }

        this.showNotification(Utilisateur "${pseudo}" banni avec succès, 'success');
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
