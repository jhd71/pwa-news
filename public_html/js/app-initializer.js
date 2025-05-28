// js/app-initializer.js - Optimisé pour iOS

(function() {
    // Créer un filtre global pour les messages de la console
    const filters = [
        "Banner not shown: beforeinstallpromptevent.preventDefault()",
        "Unchecked runtime.lastError",
        "Deprecated API for given entry type"
    ];

    // Redéfinir console.warn et console.error
    try {
        const originalWarn = console.warn;
        console.warn = function(...args) {
            if (args.length > 0 && typeof args[0] === 'string' && 
                filters.some(filter => args[0].includes(filter))) {
                return; // Ignorer ce message
            }
            originalWarn.apply(console, args);
        };

        const originalError = console.error;
        console.error = function(...args) {
            if (args.length > 0 && typeof args[0] === 'string' && 
                filters.some(filter => args[0].includes(filter))) {
                return; // Ignorer ce message
            }
            originalError.apply(console, args);
        };

        const originalLog = console.log;
        console.log = function(...args) {
            if (args.length > 0 && typeof args[0] === 'string' && 
                filters.some(filter => args[0].includes(filter))) {
                return; // Ignorer ce message
            }
            originalLog.apply(console, args);
        };
    } catch (e) {
        // En cas d'erreur, ne rien faire
    }
})();

// Détection iOS améliorée
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isIOSSafari = isIOS && /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);

// PWA Installation avec support iOS amélioré
class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = document.getElementById('menuInstall');
        this.setupEventListeners();
        
        // Support spécial pour iOS
        if (isIOS) {
            this.setupIOSInstallation();
        }
    }

    setupEventListeners() {
        // Masquer le bouton par défaut
        if (this.installButton) {
            this.installButton.style.display = 'none';
        }

        window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt.bind(this));
        window.addEventListener('appinstalled', this.handleAppInstalled.bind(this));
        
        // Événements iOS spécifiques
        if (isIOS) {
            window.addEventListener('orientationchange', this.handleIOSOrientationChange.bind(this));
        }
    }

    setupIOSInstallation() {
        // Sur iOS, montrer le bouton avec des instructions spéciales
        if (this.installButton && !window.navigator.standalone) {
            this.installButton.style.display = 'block';
            this.installButton.addEventListener('click', this.showIOSInstallInstructions.bind(this));
        } else if (window.navigator.standalone) {
            // Déjà installé en mode standalone sur iOS
            console.log('App déjà installée sur iOS en mode standalone');
        }
    }

    showIOSInstallInstructions() {
        const instructions = `
            Pour installer Actu&Média sur votre iPhone :
            1. Appuyez sur le bouton de partage (□↗) en bas de Safari
            2. Faites défiler et appuyez sur "Sur l'écran d'accueil"
            3. Appuyez sur "Ajouter" en haut à droite
        `;
        
        // Créer une alerte personnalisée pour iOS
        if (window.showModal) {
            window.showModal('Installation sur iOS', instructions);
        } else {
            alert(instructions);
        }
    }

    handleIOSOrientationChange() {
        // Corriger les problèmes de viewport sur iOS lors du changement d'orientation
        setTimeout(() => {
            if (window.setVH) {
                window.setVH();
            }
        }, 500);
    }

    async handleBeforeInstallPrompt(event) {
        // Garder event.preventDefault() - c'est nécessaire pour votre bannière personnalisée
        event.preventDefault();
        this.deferredPrompt = event;

        if (this.installButton) {
            this.installButton.style.display = 'block';
            this.installButton.addEventListener('click', this.handleInstallClick.bind(this), { once: true });
        }
        
        // Appeler la bannière personnalisée existante dans contentManager
        if (window.contentManager && typeof window.contentManager.showInstallBanner === 'function') {
            window.contentManager.showInstallBanner();
        }
        
        console.log('Installation PWA disponible - bannière personnalisée utilisée');
    }

    async handleInstallClick(event) {
        event.preventDefault();
        
        // Vérification spéciale pour iOS
        if (isIOS && !this.deferredPrompt) {
            this.showIOSInstallInstructions();
            return;
        }
        
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
            
            // Fallback pour iOS
            if (isIOS) {
                this.showIOSInstallInstructions();
            }
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

// Fonction pour enregistrer le Service Worker avec support iOS
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
                        
                        // Sur iOS, forcer un refresh si nécessaire
                        if (isIOS && window.location.reload) {
                            setTimeout(() => {
                                window.location.reload();
                            }, 1000);
                        }
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
            
            // Log spécifique pour iOS
            if (isIOS) {
                console.log('Erreur Service Worker sur iOS - cela peut être normal en mode développement');
            }
        }
    } else {
        console.warn('Service Workers non supportés par ce navigateur');
    }
}

// Fonction pour configurer le bouton du chat avec support iOS
function setupChatButton() {
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    
    if (chatToggleBtn) {
        console.log('Configuration du bouton de chat...');
        
        // Supprimer les gestionnaires existants pour éviter les doublons
        const newChatToggleBtn = chatToggleBtn.cloneNode(true);
        chatToggleBtn.parentNode.replaceChild(newChatToggleBtn, chatToggleBtn);
        
        // Support touch pour iOS
        if (isIOS) {
            newChatToggleBtn.style.webkitTapHighlightColor = 'rgba(0,0,0,0.1)';
            newChatToggleBtn.style.webkitTouchCallout = 'none';
        }
        
        // Ajouter le nouveau gestionnaire avec support iOS
        const handleChatClick = (event) => {
            event.preventDefault();
            console.log('Bouton de chat cliqué');
            
            // Feedback tactile pour iOS
            if (isIOS && navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            if (window.chatManager) {
                console.log('Tentative d\'ouverture du chat');
                window.chatManager.toggleChatPanel();
            } else {
                console.error('ChatManager non disponible');
            }
        };
        
        newChatToggleBtn.addEventListener('click', handleChatClick);
        
        // Événements touch spécifiques pour iOS
        if (isIOS) {
            newChatToggleBtn.addEventListener('touchstart', (e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
            }, {passive: true});
            
            newChatToggleBtn.addEventListener('touchend', (e) => {
                e.currentTarget.style.transform = 'scale(1)';
            }, {passive: true});
        }
    } else {
        console.error('Bouton de chat non trouvé dans le DOM');
    }
}

// Fonction pour initialiser les corrections iOS
function initIOSFixes() {
    if (!isIOS) return;
    
    console.log('Initialisation des corrections iOS...');
    
    // Fix pour la hauteur viewport
    function setVH() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setVH();
    window.setVH = setVH; // Rendre disponible globalement
    
    // Événements iOS
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', () => {
        setTimeout(setVH, 500);
    });
    
    // Fix pour les performances iOS
    document.body.style.webkitOverflowScrolling = 'touch';
    document.body.style.transform = 'translateZ(0)';
    
    // Fix pour les inputs iOS
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        if (parseFloat(getComputedStyle(input).fontSize) < 16) {
            input.style.fontSize = '16px';
        }
    });
    
	// Ajouter classe iOS au body si nécessaire
    if (isIOS && !document.body.classList.contains('ios-device')) {
        document.body.classList.add('ios-device');
    }
    console.log('Corrections iOS appliquées');
}

// Application Initialization avec support iOS amélioré
async function initApp() {
    try {
        console.log('Initialisation de l\'application...');
        
        // Initialiser les corrections iOS en premier
        initIOSFixes();
        
        // Enregistrer le Service Worker
        await registerServiceWorker();
        
        // Initialiser l'installateur PWA
        window.pwaInstaller = new PWAInstaller();
        
        // Initialiser ContentManager avec délai pour iOS
        console.log('Chargement de ContentManager...');
        
        const loadContentManager = async () => {
            try {
                const contentModule = await import('./content.js');
                window.contentManager = new contentModule.default();
                await window.contentManager.init();
                console.log('Content Manager initialisé');
                return true;
            } catch (error) {
                console.error('Erreur lors du chargement de ContentManager:', error);
                return false;
            }
        };
        
        // Retry logic pour iOS
        let contentLoaded = await loadContentManager();
        if (!contentLoaded && isIOS) {
            console.log('Tentative de rechargement ContentManager pour iOS...');
            setTimeout(async () => {
                await loadContentManager();
            }, 1000);
        }

        // Initialiser ChatManager avec délai pour iOS
        console.log('Chargement de ChatManager...');
        
        const loadChatManager = async () => {
            try {
                const chatModule = await import('./chatManager.js');
                window.chatManager = new chatModule.default();
                
                // Ajouter la méthode toggleChatPanel à ChatManager avec support iOS
                window.chatManager.toggleChatPanel = function() {
                    const chatContainer = this.container.querySelector('.chat-container');
                    
                    this.isOpen = !this.isOpen;
                    
                    if (this.isOpen) {
                        chatContainer?.classList.add('open');
                        
                        // Fix pour iOS - scroll fix
                        if (isIOS && chatContainer) {
                            chatContainer.style.webkitOverflowScrolling = 'touch';
                            chatContainer.style.transform = 'translateZ(0)';
                        }
                        
                        // Réinitialisation du compteur
                        this.unreadCount = 0;
                        localStorage.setItem('unreadCount', '0');
                        
                        // Mettre à jour le badge ET l'info-bulle
                        this.updateUnreadBadgeAndBubble();
                        
                        // Scroll avec délai pour iOS
                        if (isIOS) {
                            setTimeout(() => this.scrollToBottom(), 300);
                        } else {
                            this.scrollToBottom();
                        }
                    } else {
                        chatContainer?.classList.remove('open');
                    }
                    
                    localStorage.setItem('chatOpen', this.isOpen);
                    this.playSound('click');
                };
                
                await window.chatManager.init();
                console.log('Chat Manager initialisé');
                return true;
            } catch (error) {
                console.error('Erreur lors du chargement de ChatManager:', error);
                return false;
            }
        };
        
        // Retry logic pour iOS
        let chatLoaded = await loadChatManager();
        if (!chatLoaded && isIOS) {
            console.log('Tentative de rechargement ChatManager pour iOS...');
            setTimeout(async () => {
                await loadChatManager();
            }, 1000);
        }
        
        // Configurer le bouton du chat avec délai pour iOS
        if (isIOS) {
            setTimeout(setupChatButton, 500);
        } else {
            setupChatButton();
        }
        
        console.log('Application initialisée avec succès');
        
    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        console.error('Stack trace:', error.stack);
        
        // Retry pour iOS en cas d'erreur
        if (isIOS) {
            console.log('Tentative de récupération pour iOS...');
            setTimeout(initApp, 2000);
        }
    }
}

// Démarrer l'application quand le DOM est prêt avec support iOS
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (isIOS) {
            // Délai supplémentaire pour iOS
            setTimeout(initApp, 100);
        } else {
            initApp();
        }
    });
} else {
    if (isIOS) {
        setTimeout(initApp, 100);
    } else {
        initApp();
    }
}

// Exporter les fonctions ou classes si nécessaire pour d'autres modules
export { PWAInstaller, registerServiceWorker };