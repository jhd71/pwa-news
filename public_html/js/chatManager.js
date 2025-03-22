// js/chatManager.js
import { supabase } from './supabase-client.js';

export default class ChatManager {
    constructor() {
        this.chatToggleBtn = document.getElementById('chatToggleBtn');
        this.chatNotificationBadge = document.querySelector('.chat-notification-badge');
        this.chatContainer = null;
        this.currentUser = null;
        this.unreadMessages = 0;
    }

    async init() {
        try {
            // Vérifier l'authentification
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                // Désactiver le bouton de chat
                this.chatToggleBtn.disabled = true;
                this.chatToggleBtn.title = 'Connexion requise';
                return;
            }

            // Stocker l'utilisateur actuel
            this.currentUser = user;

            // Configurer le chat si l'utilisateur est connecté
            this.setupChatContainer();
            this.setupEventListeners();
            // Ajout de la fonction manquante
            this.setupRealtimeSubscription = () => {
                console.log('Configuration de l\'abonnement en temps réel...');
                // Écouter les nouveaux messages en temps réel
                supabase
                    .channel('public:messages')
                    .on(
                        'postgres_changes', 
                        { event: 'INSERT', schema: 'public', table: 'messages' },
                        (payload) => {
                            // Ne pas afficher ses propres messages
                            if (payload.new.user_id !== this.currentUser.id) {
                                this.displayMessage(payload.new);
                                
                                // Incrémenter les messages non lus si le chat est fermé
                                const chatContainer = document.getElementById('chat-container');
                                if (chatContainer && chatContainer.classList.contains('hidden')) {
                                    this.incrementUnreadMessages();
                                }
                            }
                        }
                    )
                    .subscribe();
            };
            
            // Maintenant on peut l'appeler
            this.setupRealtimeSubscription();
            await this.loadMessages();
        } catch (error) {
            console.error('Erreur d\'initialisation du chat:', error);
        }
    }

    setupChatToggle() {
        if (this.chatToggleBtn) {
            this.chatToggleBtn.addEventListener('click', () => this.toggleChat());
        }
    }

    setupChatContainer() {
        // Créer le conteneur de chat s'il n'existe pas
        if (!document.getElementById('chat-container')) {
            this.chatContainer = document.createElement('div');
            this.chatContainer.id = 'chat-container';
            this.chatContainer.className = 'chat-container hidden';
            this.chatContainer.innerHTML = `
                <div class="chat-header">
                    <h3>Chat Actu&Média</h3>
                    <button id="closeChatBtn" class="close-chat-btn">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                <div class="chat-content">
                    <div id="chatMessages" class="chat-messages"></div>
                    <form id="chatForm" class="chat-input-form">
                        <input 
                            type="text" 
                            id="chatInput" 
                            placeholder="Écrivez un message..." 
                            required
                        >
                        <button type="submit">
                            <span class="material-icons">send</span>
                        </button>
                    </form>
                </div>
            `;
            document.body.appendChild(this.chatContainer);

            // Configurer les événements
            document.getElementById('closeChatBtn').addEventListener('click', () => this.toggleChat());
            document.getElementById('chatForm').addEventListener('submit', (e) => this.sendMessage(e));
        }
    }

    setupEventListeners() {
    // Bouton de toggle du chat
    if (this.chatToggleBtn) {
        // Remplacer l'écouteur existant pour éviter les doublons
        const newChatToggleBtn = this.chatToggleBtn.cloneNode(true);
        this.chatToggleBtn.parentNode.replaceChild(newChatToggleBtn, this.chatToggleBtn);
        this.chatToggleBtn = newChatToggleBtn;
        
        this.chatToggleBtn.addEventListener('click', () => this.toggleChat());
    }
    
    // Bouton de fermeture du chat
    const closeChatBtn = document.getElementById('closeChatBtn');
    if (closeChatBtn) {
        // Remplacer l'écouteur existant pour éviter les conflits
        const newCloseChatBtn = closeChatBtn.cloneNode(true);
        closeChatBtn.parentNode.replaceChild(newCloseChatBtn, closeChatBtn);
        
        // Ajouter le nouvel écouteur
        newCloseChatBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Empêcher toute action par défaut
            e.stopPropagation(); // Empêcher la propagation de l'événement
            
            const chatContainer = document.getElementById('chat-container');
            if (chatContainer) {
                chatContainer.classList.add('hidden');
                console.log('Chat fermé par le bouton X');
            }
        });
    }
    
    // Formulaire d'envoi de message
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        // Remplacer l'écouteur existant pour éviter les doublons
        const newChatForm = chatForm.cloneNode(true);
        chatForm.parentNode.replaceChild(newChatForm, chatForm);
        
        // Ajouter le nouvel écouteur
        newChatForm.addEventListener('submit', (e) => this.sendMessage(e));
    }
}

async loadMessages() {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(50);
                
            if (error) throw error;
            
            if (data && data.length > 0) {
                // Vider d'abord la liste des messages
                const chatMessages = document.getElementById('chatMessages');
                if (chatMessages) {
                    chatMessages.innerHTML = '';
                    
                    // Afficher chaque message
                    data.forEach(message => {
                        this.displayMessage(message);
                    });
                    
                    // Faire défiler vers le bas
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des messages:', error);
        }
    }

    handleUnauthenticated() {
        // Désactiver le bouton de chat ou montrer un message de connexion
        if (this.chatToggleBtn) {
            this.chatToggleBtn.disabled = true;
            this.chatToggleBtn.title = 'Connexion requise';
        }
    }

    toggleChat() {
    // Vérifier l'authentification
    const user = supabase.auth.user();
    
    if (!user) {
        // Si l'utilisateur n'est pas connecté, afficher le formulaire de connexion
        this.showLoginForm();
        return;
    }

    // Si l'utilisateur est connecté
    this.currentUser = user; // S'assurer que l'utilisateur est défini
    
    // S'assurer que le conteneur du chat est créé
    this.setupChatContainer();
    
    // Afficher/masquer le chat
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
        chatContainer.classList.toggle('hidden');
        
        // Si le chat est affiché, charger les messages
        if (!chatContainer.classList.contains('hidden')) {
            this.loadMessages();
        }
    }
}

// Nouvelle méthode pour afficher le formulaire de connexion
showLoginForm() {
    // Créer le formulaire de connexion s'il n'existe pas
    if (!document.getElementById('login-form-container')) {
        const loginContainer = document.createElement('div');
        loginContainer.id = 'login-form-container';
        loginContainer.className = 'login-form-container';
        loginContainer.innerHTML = `
            <div class="login-form-content">
                <div class="login-header">
                    <h3>Connexion</h3>
                    <button id="closeLoginBtn" class="close-login-btn">×</button>
                </div>
                <div class="login-body">
                    <form id="loginForm">
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" required placeholder="Votre email">
                        </div>
                        <div class="form-group">
                            <label for="password">Mot de passe</label>
                            <input type="password" id="password" required placeholder="Votre mot de passe">
                        </div>
                        <div class="form-group">
                            <button type="submit" class="submit-btn">Se connecter</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Ajouter des styles pour le formulaire
        const style = document.createElement('style');
        style.textContent = `
            .login-form-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .login-form-content {
                background-color: white;
                border-radius: 10px;
                width: 90%;
                max-width: 400px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
            
            .login-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                background: #1a237e;
                color: white;
                border-radius: 10px 10px 0 0;
            }
            
            .close-login-btn {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
            }
            
            .login-body {
                padding: 20px;
            }
            
            .form-group {
                margin-bottom: 15px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 5px;
            }
            
            .form-group input {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            
            .submit-btn {
                background-color: #1a237e;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 4px;
                cursor: pointer;
                width: 100%;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(loginContainer);
        
        // Gérer la fermeture du formulaire
        document.getElementById('closeLoginBtn').addEventListener('click', () => {
            const container = document.getElementById('login-form-container');
            if (container) {
                container.remove();
            }
        });
        
        // Gérer la soumission du formulaire
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const { error } = await supabase.auth.signIn({ email, password });
                
                if (error) throw error;
                
                // Fermer le formulaire
                const container = document.getElementById('login-form-container');
                if (container) {
                    container.remove();
                }
                
                // Rafraîchir la page ou initialiser le chat
                window.location.reload();
            } catch (error) {
                console.error('Erreur de connexion:', error);
                alert('Erreur de connexion: ' + error.message);
            }
        });
    }
}

    showLoginPrompt() {
        // Montrer un modal ou un message demandant de se connecter
        alert('Veuillez vous connecter pour accéder au chat');
        // Vous pouvez remplacer cela par un modal plus élégant
    }

    async sendMessage(event) {
    event.preventDefault();
    
    if (!this.currentUser) {
        this.showLoginPrompt();
        return;
    }

    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    try {
        // Créer le message localement avant l'envoi à Supabase
        const newMessage = {
            content: message,
            user_id: this.currentUser.id,
            created_at: new Date().toISOString()
        };
        
        // Afficher le message immédiatement
        this.displayMessage({
            ...newMessage,
            sent: true // Marquer comme envoyé par l'utilisateur actuel
        });
        
        // Réinitialiser l'input avant d'attendre la réponse
        input.value = '';
        
        // Envoyer à Supabase
        const { error } = await supabase
            .from('messages')
            .insert({
                content: message,
                user_id: this.currentUser.id,
                channel_id: 'general' // Canal par défaut
            });

        if (error) throw error;
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        alert('Impossible d\'envoyer le message');
    }
}

// Adapter la méthode displayMessage pour utiliser le flag 'sent'
displayMessage(message) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    messageElement.classList.add(
        message.sent || message.user_id === this.currentUser?.id ? 'sent' : 'received'
    );
    
    messageElement.innerHTML = `
        <div class="message-content">${message.content}</div>
        <div class="message-timestamp">
            ${new Date(message.created_at).toLocaleTimeString()}
        </div>
    `;

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

    incrementUnreadMessages() {
        this.unreadMessages++;
        this.updateNotificationBadge();
    }

    resetNotificationBadge() {
        this.unreadMessages = 0;
        this.updateNotificationBadge();
    }

    updateNotificationBadge() {
        if (this.chatNotificationBadge) {
            this.chatNotificationBadge.textContent = this.unreadMessages;
            this.chatNotificationBadge.classList.toggle('hidden', this.unreadMessages === 0);
        }
    }
}
