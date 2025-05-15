// js/app-initializer.js

// PWA Installation
class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = document.getElementById('menuInstall');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Masquer le bouton par défaut
        if (this.installButton) {
            this.installButton.style.display = 'none';
        }

        window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt.bind(this));
        window.addEventListener('appinstalled', this.handleAppInstalled.bind(this));
    }

    async handleBeforeInstallPrompt(event) {
        event.preventDefault();
        this.deferredPrompt = event;

        if (this.installButton) {
            this.installButton.style.display = 'block';
            this.installButton.addEventListener('click', this.handleInstallClick.bind(this), { once: true });
        }
    }

    async handleInstallClick(event) {
        event.preventDefault();
        if (!this.deferredPrompt) return;

        try {
            const result = await this.deferredPrompt.prompt();
            console.log('Résultat de l\'installation:', result);
            
            if (result.outcome === 'accepted') {
                console.log('PWA installée avec succès');
                this.installButton.style.display = 'none';
            }
        } catch (error) {
            console.error('Erreur lors de l\'installation:', error);
        } finally {
            this.deferredPrompt = null;
        }
    }

    handleAppInstalled() {
        console.log('PWA installée avec succès');
        if (this.installButton) {
            this.installButton.style.display = 'none';
        }
        this.deferredPrompt = null;
    }
}

// Fonction pour enregistrer le Service Worker
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
            });
            
            console.log('Service Worker enregistré avec succès, scope:', registration.scope);
            
            // Gestion de la mise à jour
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('Service Worker en installation...');
                
                newWorker.addEventListener('statechange', () => {
                    console.log('Changement d\'état du Service Worker:', newWorker.state);
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('Nouveau Service Worker installé');
                    }
                });
            });
            
            // Écouter les changements d'état
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('Service Worker contrôleur a changé');
            });
            
            return registration;
        } catch (error) {
            console.error('Erreur d\'enregistrement du Service Worker:', error);
        }
    } else {
        console.warn('Service Workers non supportés par ce navigateur');
    }
}

// Fonction pour configurer le bouton du chat
function setupChatButton() {
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    
    if (chatToggleBtn) {
        console.log('Configuration du bouton de chat...');
        
        // Supprimer les gestionnaires existants pour éviter les doublons
        const newChatToggleBtn = chatToggleBtn.cloneNode(true);
        chatToggleBtn.parentNode.replaceChild(newChatToggleBtn, chatToggleBtn);
        
        // Ajouter le nouveau gestionnaire
        newChatToggleBtn.addEventListener('click', () => {
            console.log('Bouton de chat cliqué');
            
            if (window.chatManager) {
                console.log('Tentative d\'ouverture du chat');
                // Appeler la méthode toggleChatPanel que nous avons ajoutée
                window.chatManager.toggleChatPanel();
            } else {
                console.error('ChatManager non disponible');
            }
        });
    } else {
        console.error('Bouton de chat non trouvé dans le DOM');
    }
}

// Application Initialization
async function initApp() {
    try {
        // Enregistrer le Service Worker
        await registerServiceWorker();
        
        // Initialiser l'installateur PWA
        new PWAInstaller();
        
        // Initialiser ContentManager
        console.log('Chargement de ContentManager...');
        const contentModule = await import('./content.js');
        window.contentManager = new contentModule.default();
        await window.contentManager.init();
        console.log('Content Manager initialisé');

        // Initialiser ChatManager
        console.log('Chargement de ChatManager...');
        const chatModule = await import('./chatManager.js');
        window.chatManager = new chatModule.default();
        
        // Ajouter la méthode toggleChatPanel à ChatManager
        window.chatManager.toggleChatPanel = function() {
            const chatContainer = this.container.querySelector('.chat-container');
            
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
        
        await window.chatManager.init();
        console.log('Chat Manager initialisé');
        
        // Configurer le bouton du chat
        setupChatButton();
        
    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Démarrer l'application quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Exporter les fonctions ou classes si nécessaire pour d'autres modules
export { PWAInstaller, registerServiceWorker };