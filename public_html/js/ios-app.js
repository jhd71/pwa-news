// ios-app.js - Version optimisée pour iOS
// Initialise l'application avec des optimisations spécifiques à iOS

// Récupérer l'instance Supabase partagée
const supabase = window.getSupabaseClient ? window.getSupabaseClient() : null;

// Classe principale de l'application iOS
class iOSApp {
    constructor() {
        console.log("Initialisation de l'application iOS");
        
        // Variables globales
        this.contentManager = null;
        this.chatManager = null;
        this.initialized = false;
        this.deferredPrompt = null;
        
        // Initialiser l'application
        this.init();
    }
    
    async init() {
        try {
            // Ajouter des classes iOS pour le CSS
            document.documentElement.classList.add('ios');
            document.body.classList.add('ios-body');
            
            // Initialiser les managers
            await this.initManagers();
            
            // Optimisations iOS
            this.setupIOSOptimizations();
            
            // Service Worker et PWA
            this.setupServiceWorker();
            
            // Marquer comme initialisé
            this.initialized = true;
            console.log("Application iOS initialisée avec succès");
        } catch (error) {
            console.error("Erreur lors de l'initialisation de l'application iOS:", error);
        }
    }
    
    async initManagers() {
        try {
            // Initialiser iOS Content Manager
            const ContentManager = (await import('./ios-content.js')).default;
            this.contentManager = new ContentManager();
            await this.contentManager.init();
            
            // Exposer globalement pour d'autres scripts
            window.contentManager = this.contentManager;
            console.log("Gestionnaire de contenu iOS initialisé");
            
            // Vérifiez si les différents gestionnaires sont déjà initialisés
            // par d'autres scripts inclus dans la page
            
            // Optimisations pour les composants existants initialisés par d'autres scripts
            this.applyIOSOptimizationsToNewsPanel();
            this.applyIOSOptimizationsToWeatherWidget();
            this.applyIOSOptimizationsToChat();
            this.applyIOSOptimizationsToSurvey();
            
            // Initialiser le chat si nécessaire
            if (!window.chatManager) {
                try {
                    const ChatManager = (await import('./chatManager.js')).default;
                    this.chatManager = new ChatManager();
                    await this.chatManager.init();
                    
                    // Exposer globalement pour d'autres scripts
                    window.chatManager = this.chatManager;
                    console.log("Gestionnaire de chat initialisé pour iOS");
                } catch (error) {
                    console.error("Erreur lors de l'initialisation du gestionnaire de chat:", error);
                }
            }
        } catch (error) {
            console.error("Erreur lors de l'initialisation des gestionnaires iOS:", error);
        }
    }
    
    applyIOSOptimizationsToNewsPanel() {
        const newsPanel = document.querySelector('.news-panel');
        if (newsPanel) {
            // Ajouter des styles ou comportements spécifiques à iOS
            newsPanel.style.webkitOverflowScrolling = 'touch';
            newsPanel.style.overscrollBehavior = 'none';
            
            // Assurer une transition fluide
            newsPanel.style.transition = 'transform 0.3s cubic-bezier(0.1, 0.7, 0.1, 1)';
            
            // Optimiser le bouton de fermeture mobile
            const closeButton = newsPanel.querySelector('.mobile-close-panel');
            if (closeButton) {
                closeButton.style.padding = '10px';
                closeButton.style.marginBottom = 'env(safe-area-inset-bottom, 0px)';
            }
            
            console.log("Optimisations iOS appliquées au panneau d'actualités");
        }
    }
    
    applyIOSOptimizationsToWeatherWidget() {
        const weatherWidget = document.querySelector('.weather-sidebar');
        if (weatherWidget) {
            // Ajouter des styles ou comportements spécifiques à iOS
            weatherWidget.style.webkitOverflowScrolling = 'touch';
            weatherWidget.style.overscrollBehavior = 'none';
            weatherWidget.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
            
            console.log("Optimisations iOS appliquées au widget météo");
        }
    }
    
    applyIOSOptimizationsToChat() {
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
            // Ajouter des styles ou comportements spécifiques à iOS
            chatContainer.style.webkitOverflowScrolling = 'touch';
            chatContainer.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
            
            // Ajouter une classe iOS spécifique
            chatContainer.classList.add('ios-chat-container');
            
            console.log("Optimisations iOS appliquées au chat");
        }
    }
    
    applyIOSOptimizationsToSurvey() {
        const surveyModal = document.querySelector('.survey-modal');
        if (surveyModal) {
            // Ajouter des styles ou comportements spécifiques à iOS
            surveyModal.style.paddingTop = 'env(safe-area-inset-top, 0px)';
            surveyModal.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
            
            console.log("Optimisations iOS appliquées au sondage");
        }
    }
    
    setupIOSOptimizations() {
        // Optimisations pour le défilement
        document.body.style.webkitOverflowScrolling = 'touch';
        document.body.style.overscrollBehavior = 'none';
        
        // Prévenir le zoom sur les inputs
        const metaViewport = document.querySelector('meta[name="viewport"]');
        if (metaViewport) {
            metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
        }
        
        // Désactiver le surlignage au toucher
        const style = document.createElement('style');
        style.textContent = `
            * {
                -webkit-tap-highlight-color: transparent !important;
                touch-action: manipulation !important;
            }
            
            input, button, a, .tile {
                cursor: pointer !important;
            }
            
            .ios-active {
                opacity: 0.7 !important;
                transform: scale(0.98) !important;
            }
            
            /* Améliorer la visibilité de la barre de défilement */
            .news-ticker {
                background-color: rgba(0, 0, 0, 0.8) !important;
            }
            
            /* Correction pour les modaux */
            .bg-selector-panel, .settings-menu, .survey-modal {
                padding-top: env(safe-area-inset-top, 0px) !important;
                padding-bottom: env(safe-area-inset-bottom, 0px) !important;
            }
        `;
        document.head.appendChild(style);
        
        // Améliorer la réactivité des touches
        this.setupTouchEvents();
        
        // Gérer les problèmes de clavier
        this.setupKeyboardFixes();
        
        console.log("Optimisations iOS appliquées");
    }
    
    setupTouchEvents() {
        // Rendre les boutons plus réactifs
        document.querySelectorAll('button, a, .tile').forEach(el => {
            el.addEventListener('touchstart', function() {
                this.classList.add('ios-active');
            }, { passive: true });
            
            el.addEventListener('touchend', function() {
                this.classList.remove('ios-active');
                
                // Petite vibration pour le feedback tactile
                if (navigator.vibrate && this.classList.contains('tile')) {
                    navigator.vibrate(20);
                }
            }, { passive: true });
            
            el.addEventListener('touchcancel', function() {
                this.classList.remove('ios-active');
            }, { passive: true });
        });
    }
    
    setupKeyboardFixes() {
        // Gérer le clavier virtuel iOS
        const inputs = document.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            // Faire défiler pour que l'input soit visible quand le clavier apparaît
            input.addEventListener('focus', () => {
                setTimeout(() => {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
            
            // S'assurer que les inputs n'ont pas de zoom automatique
            if (input.type === 'text' || input.type === 'search' || input.tagName === 'TEXTAREA') {
                input.style.fontSize = '16px';
            }
        });
    }
    
    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js', {
                    scope: '/'
                });
                console.log('ServiceWorker enregistré avec succès:', registration);

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('Nouveau service worker en installation');

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('Nouveau Service Worker installé');
                            if (confirm('Une nouvelle version est disponible. Voulez-vous mettre à jour maintenant?')) {
                                if (registration.waiting) {
                                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                                }
                            }
                        }
                    });
                });

                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('Service Worker mis à jour');
                    window.location.reload();
                });
            } catch (error) {
                console.error('Erreur d\'enregistrement du ServiceWorker:', error);
            }
        }
    }
}

// Initialiser l'application iOS après le chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    window.iosApp = new iOSApp();
});

// Exposer la classe iOSApp globalement
window.iOSApp = iOSApp;