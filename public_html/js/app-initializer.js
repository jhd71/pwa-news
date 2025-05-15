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

    // Dans votre classe PWAInstaller
async handleBeforeInstallPrompt(event) {
    event.preventDefault();
    this.deferredPrompt = event;

    if (this.installButton) {
        this.installButton.style.display = 'block';
        this.installButton.addEventListener('click', this.handleInstallClick.bind(this), { once: true });
    }
    
    // Afficher la bannière personnalisée
    this.showCustomInstallBanner();
}

// Ajoutez cette nouvelle méthode à votre classe PWAInstaller
showCustomInstallBanner() {
    // Vérifier si on a déjà montré la bannière récemment
    const lastShown = localStorage.getItem('installBannerLastShown');
    if (lastShown && (Date.now() - parseInt(lastShown)) < 3 * 24 * 60 * 60 * 1000) {
        return; // Ne pas montrer si la bannière a été affichée dans les 3 derniers jours
    }
    
    // Vérifier si la bannière existe déjà
    if (document.querySelector('.pwa-install-banner')) {
        return;
    }
    
    // Créer la bannière
    const banner = document.createElement('div');
    banner.className = 'pwa-install-banner';
    banner.innerHTML = `
        <div class="banner-content">
            <div class="banner-icon">
                <img src="/images/AM-192-v2.png" alt="Actu&Media" width="40" height="40">
            </div>
            <div class="banner-text">
                <h3>Installer Actu&Media</h3>
                <p>Accédez rapidement à vos actualités locales</p>
            </div>
            <div class="banner-buttons">
                <button id="banner-install-btn">Installer</button>
                <button id="banner-close-btn">Plus tard</button>
            </div>
        </div>
    `;
    
    // Ajouter les styles
    const style = document.createElement('style');
    style.textContent = `
        .pwa-install-banner {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: var(--card-bg, #ffffff);
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
            z-index: 9999;
            animation: slideUp 0.3s ease-out forwards;
            border-top: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .banner-content {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            max-width: 600px;
            margin: 0 auto;
        }
        
        .banner-icon {
            margin-right: 12px;
        }
        
        .banner-icon img {
            border-radius: 8px;
        }
        
        .banner-text {
            flex: 1;
        }
        
        .banner-text h3 {
            margin: 0 0 4px 0;
            font-size: 16px;
            font-weight: bold;
            color: var(--text-color, #333);
        }
        
        .banner-text p {
            margin: 0;
            font-size: 14px;
            color: var(--text-color-secondary, #666);
        }
        
        .banner-buttons {
            display: flex;
            gap: 8px;
        }
        
        .banner-buttons button {
            border: none;
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 14px;
            cursor: pointer;
        }
        
        #banner-install-btn {
            background: var(--primary-color, #1e3a8a);
            color: white;
        }
        
        #banner-close-btn {
            background: transparent;
            color: var(--text-color, #333);
        }
        
        @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
        }
        
        @media (max-width: 600px) {
            .banner-content {
                flex-wrap: wrap;
            }
            
            .banner-buttons {
                margin-top: 8px;
                width: 100%;
                justify-content: flex-end;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(banner);
    
    // Gérer les clics
    document.getElementById('banner-install-btn').addEventListener('click', () => {
        if (this.deferredPrompt) {
            this.handleInstallClick({ preventDefault: () => {} });
        }
        banner.remove();
    });
    
    document.getElementById('banner-close-btn').addEventListener('click', () => {
        banner.style.animation = 'slideDown 0.3s ease-out forwards';
        setTimeout(() => {
            banner.remove();
        }, 300);
        
        // Mémoriser que l'utilisateur a fermé la bannière
        localStorage.setItem('installBannerLastShown', Date.now().toString());
    });
    
    // Ajouter une animation de disparition
    const slideDownStyle = document.createElement('style');
    slideDownStyle.textContent = `
        @keyframes slideDown {
            from { transform: translateY(0); }
            to { transform: translateY(100%); }
        }
    `;
    document.head.appendChild(slideDownStyle);
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