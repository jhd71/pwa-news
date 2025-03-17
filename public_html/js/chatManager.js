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
    
    // Ajouter une classe pour détecter Android
    if (/Android/i.test(navigator.userAgent)) {
        document.documentElement.classList.add('android');
    }
}
    async init() {
    try {
        await this.loadBannedWords();
        
        if (document.getElementById('chatToggleBtn')) {
    this.setupChatToggleBtn();
    
    if (this.isOpen) {
        this.resetChatUI();
    } else {
        // Ne pas ouvrir le chat automatiquement
        console.log("Chat fermé par défaut");
    }
} else {
    // Créer l'interface mais la masquer si elle ne doit pas être ouverte
    this.resetChatUI();
    
    if (!this.isOpen) {
        const chatOverride = document.getElementById('chatOverride');
        if (chatOverride) {
            chatOverride.style.display = 'none';
            console.log("Chat créé mais masqué");
        }
    }
}
        this.fixCloseButton();
        this.forceMobileLayout(); // Ajoutez cette ligne
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
// Dans la méthode init(), juste avant this.initialized = true;
if (/Android/i.test(navigator.userAgent)) {
  this.gererClavierMobile();
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
                    <button class="close-chat" title="Fermer">✕</button>
                </div>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input">
                <textarea placeholder="Votre message..." maxlength="500" rows="1"></textarea>
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
                    <button class="close-chat" title="Fermer">✕</button>
                </div>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input">
                <textarea placeholder="Votre message..." maxlength="500" rows="1"></textarea>
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
    closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.isOpen = false;
        localStorage.setItem('chatOpen', 'false');
        if (chatContainer) {
            chatContainer.classList.remove('open');
        }
        this.playSound('click');
        console.log("Chat fermé via bouton closeBtn");
    });
    
    // Ajouter un événement touchend pour les appareils mobiles
    closeBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.isOpen = false;
        localStorage.setItem('chatOpen', 'false');
        if (chatContainer) {
            chatContainer.classList.remove('open');
        }
        this.playSound('click');
        console.log("Chat fermé via touchend sur closeBtn");
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
// Ajoutez le nouveau code ici
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
        // Définition de sendMessage
        const sendMessage = async () => {
            const content = input.value.trim();
            if (!content) return;
            
            // Créer un élément de message temporaire (pour feedback immédiat)
            const tempMessage = {
                id: 'temp-' + Date.now(),
                pseudo: this.pseudo,
                content: content,
                created_at: new Date().toISOString()
            };
            
            // Ajouter le message temporaire immédiatement
            const messagesContainer = this.container.querySelector('.chat-messages');
            if (messagesContainer) {
                const messageElement = this.createMessageElement(tempMessage);
                messageElement.style.opacity = '0.7'; // Style pour indiquer que c'est en cours d'envoi
                messagesContainer.appendChild(messageElement);
                this.scrollToBottom();
            }
            
            // Vider l'input immédiatement
            input.value = '';
            
            // Sur Android, gérer le clavier et l'affichage
            if (/Android/i.test(navigator.userAgent)) {
                document.activeElement.blur();
                
                // S'assurer que l'interface reste utilisable
                setTimeout(() => {
                    input.style.visibility = 'visible';
                    input.style.display = 'block';
                    this.scrollToBottom();
                }, 300);
            }
            
            // Vérifier les mots bannis
            if (await this.checkForBannedWords(content)) {
                // Supprimer le message temporaire
                const tempElement = messagesContainer.querySelector(`[data-message-id="${tempMessage.id}"]`);
                if (tempElement) tempElement.remove();
                
                this.showNotification('Message contient des mots interdits', 'error');
                this.playSound('error');
                return;
            }
            
            // Envoyer le message au serveur
            const success = await this.sendMessage(content);
            
            // Si l'envoi échoue, notifier l'utilisateur
            if (!success) {
                this.playSound('error');
                
                // Supprimer le message temporaire
                const tempElement = messagesContainer.querySelector(`[data-message-id="${tempMessage.id}"]`);
                if (tempElement) tempElement.remove();
            } else {
                this.playSound('message');
                
                // Comportement normal sur autres appareils (non-Android)
                if (!/Android/i.test(navigator.userAgent)) {
                    input.focus();
                }
            }
        };

        // Ajouter les écouteurs d'événements
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
// Insérer après la fin de setupChatListeners()
gererClavierMobile() {
  // Cibler les éléments nécessaires
  const chatInput = this.container.querySelector('.chat-input textarea');
  const chatInputContainer = this.container.querySelector('.chat-input');
  const sendBtn = this.container.querySelector('.send-btn');
  const messagesContainer = this.container.querySelector('.chat-messages');
  const chatContainer = this.container.querySelector('.chat-container');
  
  if (!chatInput || !sendBtn) return;
  
  // Pour les appareils Android uniquement
  if (/Android/i.test(navigator.userAgent)) {
    // Quand on clique sur le bouton d'envoi
    sendBtn.addEventListener('touchend', (e) => {
      e.preventDefault(); // Empêcher le comportement par défaut
      
      // Forcer la disparition du clavier
      document.activeElement.blur();
      
      // Faire défiler le chat pour voir l'input ET les derniers messages
      setTimeout(() => {
        // S'assurer que la zone d'input est visible
        chatInputContainer.style.visibility = 'visible';
        chatInputContainer.style.display = 'flex';
        
        // Défiler pour voir à la fois la zone d'input et les derniers messages
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        // Force le chat à remonter pour montrer la zone de saisie
        chatInput.scrollIntoView({ behavior: 'instant', block: 'end' });
        
        // Forcer une mise à jour de l'affichage
        window.requestAnimationFrame(() => {
          this.scrollToBottom();
        });
      }, 300);
    });
    
    // Écouter l'événement focus sur le textarea pour déplacer la vue
    chatInput.addEventListener('focus', () => {
      // Retarder légèrement pour laisser le clavier apparaître
      setTimeout(() => {
        // Calculer la hauteur visible de la fenêtre
        const windowHeight = window.innerHeight;
        // Position verticale absolue de l'input par rapport au haut de la page
        const inputTop = chatInput.getBoundingClientRect().top;
        // Calculer le déplacement nécessaire pour que l'input soit visible
        const scrollY = Math.max(0, inputTop - windowHeight * 0.3);
        
        // Faire défiler la page pour voir l'input
        window.scrollTo(0, scrollY);
        // Vérifier si l'application est dans une webview Android
        if (window.AndroidInterface || /Android/i.test(navigator.userAgent)) {
          chatInputContainer.style.position = 'relative';
          chatInputContainer.style.bottom = '0';
          chatInputContainer.style.zIndex = '1000';
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 300);
    });

    // Ajuster la position lors de l'apparition du clavier
    window.addEventListener('resize', () => {
      if (document.activeElement === chatInput) {
        // Si le clavier est ouvert (détecté par la réduction de la hauteur)
        if (window.innerHeight < window.outerHeight * 0.8) {
          chatInputContainer.style.position = 'relative';
          chatInputContainer.style.bottom = '0';
          chatInputContainer.style.zIndex = '1000';
          // Faire défiler la page pour voir l'input
          window.scrollTo(0, document.body.scrollHeight);
        } else {
          // Clavier fermé
          chatInputContainer.style.position = 'sticky';
          chatInputContainer.style.bottom = '0';
        }
      }
    });
    
    // Ajout d'un gestionnaire pour les clics dans la zone des messages
    messagesContainer.addEventListener('click', () => {
      // S'assurer que l'input est visible après un clic dans les messages
      setTimeout(() => {
        chatInputContainer.style.visibility = 'visible';
        chatInputContainer.style.display = 'flex';
        chatInput.scrollIntoView({ behavior: 'instant', block: 'end' });
      }, 100);
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
        console.log("Chargement des messages...");
        
        const { data: messages, error } = await this.supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true });
            
        if (error) throw error;
        
        const container = this.container.querySelector('.chat-messages');
        if (container) {
            container.innerHTML = '';
            
            if (!messages || messages.length === 0) {
                // Ajouter un message quand le chat est vide
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-chat-state';
                emptyState.innerHTML = `
                    <div class="empty-icon">💬</div>
                    <div class="empty-title">Aucun message</div>
                    <div class="empty-text">Soyez le premier à envoyer un message!</div>
                `;
                container.appendChild(emptyState);
            } else {
                // Ajouter les messages normalement
                messages.forEach(msg => {
                    container.appendChild(this.createMessageElement(msg));
                });
            }
            
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

        // Ne pas utiliser supabase.auth.getUser()
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

        // Envoi de la notification
        await fetch("/api/sendPush.js", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: content,
                fromUser: this.pseudo,
                toUser: "all"
            })
        })
        .then(response => response.json())
        .then(data => console.log("✅ Notification envoyée :", data))
        .catch(err => console.error("❌ Erreur lors de l'envoi de la notification :", err));

        return true;
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

    // Modifiez la méthode showNotification pour utiliser votre propre système 
// au lieu des alertes standards
showNotification(message, type = 'info') {
    // Empêcher les notifications du système (alert)
    if (message.includes("Message contient des mots interdits")) {
        // Créer une notification stylisée
        const notification = document.createElement('div');
        notification.className = `notification-popup ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Supprimer après 3 secondes
        setTimeout(() => {
            notification.remove();
        }, 3000);
        
        // Jouer un son si activé
        if (this.soundEnabled) {
            this.playSound('error');
        }
        
        return;
    }
    
    // Notification standard pour les autres messages
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

        // On récupère la bulle si elle existe déjà
        const existingBubble = chatToggleBtn.querySelector('.info-bubble');
        // Si le chat est ouvert ou s'il n'y a pas de messages non lus, on supprime la bulle
        if (this.isOpen || this.unreadCount === 0) {
            if (existingBubble) {
                existingBubble.remove();
            }
        } else {
            // Sinon, on la met à jour
            if (existingBubble) {
                existingBubble.remove();
            }
            const bubble = document.createElement('div');
            bubble.className = 'info-bubble show';
            bubble.innerHTML = `<div style="font-weight: bold;">${this.unreadCount} nouveau(x) message(s)</div>`;
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
    const chatInput = this.container.querySelector('.chat-input');
    const chatContainer = this.container.querySelector('.chat-container');
    
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Sur mobile, s'assurer que l'input reste visible
    if (/Android|iPhone|iPad/i.test(navigator.userAgent) && chatInput && chatContainer) {
        // Défiler le chat
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Si le clavier est visible (détecté par la hauteur de fenêtre)
        if (window.innerHeight < window.outerHeight * 0.8) {
            // Forcer le défilement de la page entière
            window.scrollTo(0, document.body.scrollHeight);
            
            // Sur Android spécifiquement
            if (/Android/i.test(navigator.userAgent)) {
                // Position supplémentaire si le chat est intégré dans une page
                chatInput.scrollIntoView({ behavior: 'instant', block: 'end' });
            }
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
    panel.style.zIndex = "9999999"; // Forcez un z-index élevé
    
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

    if (addWordBtn && wordInput) {
        addWordBtn.addEventListener('click', async () => {
            const word = wordInput.value.trim().toLowerCase();
            if (word) {
                console.log("Tentative d'ajout du mot:", word);
                await this.addBannedWord(word);
                wordInput.value = '';
                await this.loadBannedWords();
            }
        });
    }

    panel.querySelector('.close-panel').addEventListener('click', () => panel.remove());
}

    // Modifiez la méthode addBannedWord() pour inclure l'authentification admin explicite
async addBannedWord(word) {
    try {
        console.log("Ajout du mot banni:", word);
        
        // Utiliser une fonction RPC spéciale que vous créerez dans Supabase
        // Cette fonction ignorera les restrictions RLS
        const { data, error } = await this.supabase.rpc('admin_add_banned_word', {
            word_to_add: word,
            admin_pseudo: this.pseudo
        });

        if (error) {
            console.error("Erreur ajout mot banni:", error);
            this.showNotification('Erreur lors de l\'ajout du mot: ' + error.message, 'error');
            return false;
        }

        this.bannedWords.add(word);
        this.showNotification('Mot ajouté avec succès', 'success');
        console.log("Mot ajouté avec succès");
        return true;
    } catch (error) {
        console.error("Exception lors de l'ajout du mot:", error);
        this.showNotification('Erreur lors de l\'ajout du mot: ' + error.message, 'error');
        return false;
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
        // Définir l'utilisateur courant pour les vérifications RLS
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
    
    // Ajouter cette nouvelle méthode ici
    fixCloseButton() {
  console.log('Exécution de fixCloseButton');
  
  try {
    // Trouver la barre d'en-tête et les boutons
    const chatHeader = this.container.querySelector('.chat-header');
    const headerButtons = this.container.querySelector('.header-buttons');
    
    if (!chatHeader) {
      console.error('Chat header not found');
      return;
    }
    
    if (!headerButtons) {
      console.error('Header buttons container not found');
      return;
    }
    
    // Supprimer l'ancien bouton s'il existe
    const oldCloseBtn = headerButtons.querySelector('.close-chat');
    if (oldCloseBtn) {
      oldCloseBtn.remove();
      console.log('Removed old close button');
    }
    
    // Créer un nouveau bouton de fermeture
    const newCloseBtn = document.createElement('button');
    newCloseBtn.className = 'close-chat';
    newCloseBtn.setAttribute('title', 'Fermer');
    newCloseBtn.innerHTML = '<span class="material-icons">close</span>';
    
    // Ajouter le bouton à la barre d'en-tête
    headerButtons.appendChild(newCloseBtn);
    console.log('Added new close button');
    
    // Définir le gestionnaire de fermeture
    const closeChat = (e) => {
      console.log('Close button clicked/touched');
      e.preventDefault();
      e.stopPropagation();
      
      this.isOpen = false;
      localStorage.setItem('chatOpen', 'false');
      
      const chatContainer = this.container.querySelector('.chat-container');
      if (chatContainer) {
        chatContainer.classList.remove('open');
        console.log('Chat container closed');
      } else {
        console.error('Chat container not found');
      }
      
      this.playSound('click');
    };
    
    // Ajouter des gestionnaires d'événements directs
    newCloseBtn.addEventListener('click', closeChat, { capture: true });
    newCloseBtn.addEventListener('touchend', closeChat, { capture: true });
    
    // Ajouter une trace visuelle pour le débogage
    console.log('Close button setup complete');
  } catch (error) {
    console.error('Error in fixCloseButton:', error);
  }
}

forceMobileLayout() {
  if (!/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    return; // Ne rien faire sur les appareils non-mobiles
  }
  
  console.log("Forçage de la mise en page mobile...");
  
  try {
    // Récupérer les éléments
    const chatContainer = this.container.querySelector('.chat-container');
    if (!chatContainer) return;
    
    // Forcer les styles du conteneur
    chatContainer.style.position = 'fixed';
    chatContainer.style.top = '0';
    chatContainer.style.left = '0';
    chatContainer.style.right = '0';
    chatContainer.style.bottom = '0';
    chatContainer.style.width = '100vw';
    chatContainer.style.height = '100vh';
    chatContainer.style.zIndex = '9999';
    chatContainer.style.display = 'flex';
    chatContainer.style.flexDirection = 'column';
    chatContainer.style.background = '#6441a5';
    
    // S'assurer que l'en-tête est visible
    const header = chatContainer.querySelector('.chat-header');
    if (header) {
      header.style.minHeight = '60px';
      header.style.background = '#4a2b9b';
      header.style.display = 'flex';
      header.style.padding = '10px 15px';
      header.style.zIndex = '10001';
    }
    
    // S'assurer que la zone de saisie est visible
    const inputArea = chatContainer.querySelector('.chat-input');
    if (inputArea) {
      inputArea.style.position = 'fixed';
      inputArea.style.bottom = '0';
      inputArea.style.left = '0';
      inputArea.style.right = '0';
      inputArea.style.height = '70px';
      inputArea.style.background = '#4a2b9b';
      inputArea.style.padding = '10px 15px';
      inputArea.style.zIndex = '10000';
      inputArea.style.display = 'flex';
    }
    
    // S'assurer que la zone des messages a le bon padding
    const messagesArea = chatContainer.querySelector('.chat-messages');
    if (messagesArea) {
      messagesArea.style.paddingBottom = '80px';
      messagesArea.style.flex = '1';
    }
    
    console.log("Mise en page mobile forcée avec succès");
  } catch (error) {
    console.error("Erreur lors du forçage de la mise en page mobile:", error);
  }
}
resetChatUI() {
    try {
        console.log("Réinitialisation complète de l'interface du chat");
        
        // Supprimer l'ancien conteneur s'il existe
        const oldContainer = document.getElementById('chatOverride');
        if (oldContainer) {
            oldContainer.remove();
        }
        
        // Vérifier si l'utilisateur est authentifié
        if (!this.pseudo) {
            console.log("L'utilisateur n'est pas authentifié, affichage de l'écran de connexion");
            // Créer l'interface de connexion
            const loginContainer = document.createElement('div');
            loginContainer.id = 'chatOverride';
            
            loginContainer.innerHTML = `
                <div class="chat-container">
                    <div class="chat-header">
                        <div class="header-title">Connexion au chat</div>
                        <div class="header-buttons">
                            <button class="close-chat" title="Fermer">✕</button>
                        </div>
                    </div>
                    <div class="chat-login">
                        <input type="text" id="pseudoInput" placeholder="Entrez votre pseudo (3-20 caractères)" maxlength="20">
                        <input type="password" id="adminPassword" placeholder="Mot de passe admin (jhd71)" style="display: none;">
                        <div class="login-buttons">
                            <button id="confirmPseudo">Confirmer</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(loginContainer);
            this.container = loginContainer;
            
            // Ajouter les écouteurs d'événements pour l'interface de connexion
            const closeBtn = loginContainer.querySelector('.close-chat');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    console.log("Bouton fermeture de login cliqué");
                    loginContainer.style.display = 'none';
                    this.isOpen = false;
                });
            }
            
            const pseudoInput = loginContainer.querySelector('#pseudoInput');
            const adminPasswordInput = loginContainer.querySelector('#adminPassword');
            const confirmButton = loginContainer.querySelector('#confirmPseudo');
            
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
                        alert('Le pseudo doit faire au moins 3 caractères');
                        return;
                    }
                    
                    try {
                        // Cas administrateur
                        let isAdmin = false;
                        if (pseudo === 'jhd71') {
                            if (adminPassword !== 'admin2024') {
                                alert('Mot de passe administrateur incorrect');
                                return;
                            }
                            isAdmin = true;
                        }
                        
                        // Vérifier si l'utilisateur existe déjà
                        const { data: existingUser, error: queryError } = await this.supabase
                            .from('users')
                            .select('*')
                            .eq('pseudo', pseudo)
                            .single();
                        
                        // Si l'utilisateur n'existe pas, le créer
                        if (!existingUser || (queryError && queryError.code === 'PGRST116')) {
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
                                throw insertError;
                            }
                        }
                        
                        // Définir les variables de session
                        this.pseudo = pseudo;
                        this.isAdmin = isAdmin;
                        localStorage.setItem('chatPseudo', pseudo);
                        localStorage.setItem('isAdmin', isAdmin);
                        
                        // Fermer l'interface de connexion et ouvrir le chat
                        loginContainer.remove();
                        this.resetChatUI();
                    } catch (error) {
                        console.error('Erreur d\'authentification:', error);
                        alert('Erreur lors de la connexion: ' + error.message);
                    }
                });
            }
            
            return true;
        }
        
        // Créer le conteneur de chat avec l'interface complète pour un utilisateur authentifié
        const chatContainer = document.createElement('div');
        chatContainer.id = 'chatOverride';
        
        // Insérer le HTML du chat avec tous les boutons
        chatContainer.innerHTML = `
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
                    <textarea placeholder="Votre message..." maxlength="500" rows="1"></textarea>
                    <button class="send-btn" title="Envoyer">
                        <span class="material-icons">send</span>
                    </button>
                </div>
            </div>
        `;
        
        // Ajouter le conteneur au document
        document.body.appendChild(chatContainer);
        this.container = chatContainer;
        
        // Gérer le bouton de fermeture
        const closeBtn = chatContainer.querySelector('.close-chat');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                console.log("Bouton fermeture cliqué");
                chatContainer.style.display = 'none';
                this.isOpen = false;
                localStorage.setItem('chatOpen', 'false');
            });
        }
        
        // Gérer le bouton d'émojis
        const emojiBtn = chatContainer.querySelector('.emoji-btn');
        if (emojiBtn) {
            emojiBtn.addEventListener('click', () => {
                this.toggleEmojiPanel();
            });
        }
        
        // Gérer le bouton de son
        const soundBtn = chatContainer.querySelector('.sound-btn');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                this.soundEnabled = !this.soundEnabled;
                localStorage.setItem('soundEnabled', this.soundEnabled);
                soundBtn.classList.toggle('enabled', this.soundEnabled);
                soundBtn.querySelector('.material-icons').textContent = 
                    this.soundEnabled ? 'volume_up' : 'volume_off';
                if (this.soundEnabled) {
                    this.playSound('click');
                }
            });
        }
        
        // Gérer le bouton de notifications
        const notificationsBtn = chatContainer.querySelector('.notifications-btn');
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
                    alert('Erreur avec les notifications: ' + error.message);
                }
            });
        }
        
        // Gérer le bouton admin
        const adminBtn = chatContainer.querySelector('.admin-panel-btn');
        if (adminBtn && this.isAdmin) {
            adminBtn.addEventListener('click', () => {
                this.showAdminPanel();
                this.playSound('click');
            });
        }
        
        // Gérer le bouton de déconnexion
        const logoutBtn = chatContainer.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await this.logout();
                this.playSound('click');
                // Fermer le chat après la déconnexion
                chatContainer.remove();
            });
        }
        
        // Gérer l'envoi de messages
        const sendBtn = chatContainer.querySelector('.send-btn');
        const textarea = chatContainer.querySelector('textarea');
        
        if (sendBtn && textarea) {
            sendBtn.addEventListener('click', async () => {
                console.log("Bouton envoi cliqué");
                const content = textarea.value.trim();
                if (content) {
                    // Créer un message temporaire pour feedback immédiat
                    const tempMessage = {
                        id: 'temp-' + Date.now(),
                        pseudo: this.pseudo,
                        content: content,
                        created_at: new Date().toISOString()
                    };
                    
                    const messagesContainer = chatContainer.querySelector('.chat-messages');
                    if (messagesContainer) {
                        const messageElement = this.createMessageElement(tempMessage);
                        messageElement.style.opacity = '0.7';
                        messagesContainer.appendChild(messageElement);
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                    
                    // Vider l'input immédiatement
                    textarea.value = '';
                    
                    // Vérifier les mots bannis et envoyer le message
                    if (await this.checkForBannedWords(content)) {
                        // Supprimer le message temporaire
                        const tempElement = messagesContainer.querySelector(`[data-message-id="${tempMessage.id}"]`);
                        if (tempElement) tempElement.remove();
                        alert('Message contient des mots interdits');
                        this.playSound('error');
                    } else {
                        // Envoyer le message
                        const success = await this.sendMessage(content);
                        if (!success) {
                            // Supprimer le message temporaire en cas d'échec
                            const tempElement = messagesContainer.querySelector(`[data-message-id="${tempMessage.id}"]`);
                            if (tempElement) tempElement.remove();
                            alert('Erreur lors de l\'envoi du message');
                            this.playSound('error');
                        } else {
                            this.playSound('message');
                        }
                    }
                }
            });
            
            textarea.addEventListener('keydown', async (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    // Simuler un clic sur le bouton d'envoi
                    sendBtn.click();
                }
            });
        }
        
        // Charger les messages existants
        this.loadExistingMessages();
        
        console.log("Interface du chat réinitialisée avec succès");
        return true;
    } catch (error) {
        console.error("Erreur lors de la réinitialisation de l'interface:", error);
        return false;
    }
}

setupChatToggleBtn() {
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    if (chatToggleBtn) {
        chatToggleBtn.addEventListener('click', () => {
            console.log("Bouton de chat de la barre de navigation cliqué");
            const chatOverride = document.getElementById('chatOverride');
            if (chatOverride) {
                if (chatOverride.style.display === 'none') {
                    chatOverride.style.display = 'block';
                    this.isOpen = true;
                } else {
                    chatOverride.style.display = 'none';
                    this.isOpen = false;
                }
            } else {
                this.resetChatUI();
                this.isOpen = true;
            }
        });
    }
}

}

export default ChatManager;
