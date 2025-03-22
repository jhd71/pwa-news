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
        
        // Ajouter un message de bienvenue
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            const welcomeMessage = document.createElement('div');
            welcomeMessage.classList.add('chat-message', 'received');
            welcomeMessage.innerHTML = `
                <div class="message-content">Bienvenue dans le chat Actu&Média ! Commencez à écrire pour discuter.</div>
                <div class="message-timestamp">${new Date().toLocaleTimeString()}</div>
            `;
            chatMessages.appendChild(welcomeMessage);
        }
    }
}

    setupEventListeners() {
        // Bouton de toggle du chat
        if (this.chatToggleBtn) {
            this.chatToggleBtn.addEventListener('click', () => this.toggleChat());
        }

        // Fermeture du chat
        const closeChatBtn = document.getElementById('closeChatBtn');
        if (closeChatBtn) {
            closeChatBtn.addEventListener('click', () => this.toggleChat());
        }

        // Formulaire d'envoi de message
        const chatForm = document.getElementById('chatForm');
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => this.sendMessage(e));
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
        if (!this.currentUser) {
            this.showLoginPrompt();
            return;
        }

        const chatContainer = document.getElementById('chat-container');
        if (chatContainer) {
            chatContainer.classList.toggle('hidden');
            
            // Réinitialiser le badge de notification quand le chat est ouvert
            if (!chatContainer.classList.contains('hidden')) {
                this.resetNotificationBadge();
            }
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
            const { error } = await supabase
                .from('messages')
                .insert({
                    content: message,
                    user_id: this.currentUser.id,
                    channel_id: 'general' // Canal par défaut
                });

            if (error) throw error;

            input.value = ''; // Réinitialiser l'input
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message:', error);
            alert('Impossible d\'envoyer le message');
        }
    }

    // Cette méthode existait mais utilisait this.supabase qui n'est pas défini
    // Nous l'avons remplacée par la définition dans setupRealtimeSubscription
    setupMessageListener() {
        console.warn('Méthode obsolète, utiliser setupRealtimeSubscription à la place');
    }

    displayMessage(message) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        messageElement.classList.add(
            message.user_id === this.currentUser.id ? 'sent' : 'received'
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
