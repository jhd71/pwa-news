// js/app-initializer.js

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
    
    // Si vous voyez toujours l'erreur, ajoutez ce commentaire pour ignorer l'avertissement
    console.log('Installation PWA disponible - bannière personnalisée utilisée');
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

// Dans app-initializer.js - Ajouter cette fonction simple

async function checkAdminNotifications() {
    // Vérifier si l'utilisateur est admin
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const pseudo = localStorage.getItem('chatPseudo');
    
    if (!isAdmin || pseudo !== 'Admin_ActuMedia') {
        return; // Pas admin, on sort
    }

    try {
        const supabase = window.getSupabaseClient();
        if (!supabase) return;

        // Compter les commentaires en attente
        const { count, error } = await supabase
            .from('news_comments')
            .select('*', { count: 'exact', head: true })
            .eq('is_approved', false);

        if (!error && count > 0) {
            // Ajouter un badge au widget NEWS
            addNotificationBadgeToNewsWidget(count);
            
            // Optionnel : notification native une seule fois
            const lastNotified = localStorage.getItem('lastCommentNotification');
            const now = Date.now();
            
            if (!lastNotified || (now - parseInt(lastNotified)) > 3600000) { // 1 heure
                showSimpleNotification(`${count} commentaire(s) en attente de modération`);
                localStorage.setItem('lastCommentNotification', now.toString());
            }
        } else {
            // Supprimer le badge s'il n'y a plus de commentaires
            removeNotificationBadgeFromNewsWidget();
        }
    } catch (error) {
        console.error('Erreur vérification commentaires:', error);
    }
}

function addNotificationBadgeToNewsWidget(count) {
    const newsWidget = document.querySelector('.news-widget-container');
    if (!newsWidget) return;

    // Supprimer ancien badge
    const oldBadge = newsWidget.querySelector('.admin-notification-badge');
    if (oldBadge) oldBadge.remove();

    // Créer nouveau badge
    const badge = document.createElement('div');
    badge.className = 'admin-notification-badge';
    badge.textContent = count > 9 ? '9+' : count;
    badge.title = `${count} commentaire(s) en attente de modération - Cliquez pour modérer`;
    
    badge.style.cssText = `
    position: absolute;
    top: -12px;
    right: -12px;
    background: #ff4444;
    color: white;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(255, 68, 68, 0.6);
    animation: pulse 2s infinite;
    border: 2px solid white;
`;

    // Ajouter animation CSS
if (!document.querySelector('#admin-badge-styles')) {
    const style = document.createElement('style');
    style.id = 'admin-badge-styles';
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
            50% { transform: scale(1.1); box-shadow: 0 2px 12px rgba(255,68,68,0.6); }
            100% { transform: scale(1); box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
        }
        .news-widget-container {
            position: relative;
        }
        
        @media (max-width: 768px) {
            .admin-notification-badge {
                width: 36px !important;
                height: 36px !important;
                font-size: 16px !important;
                top: 7px !important;
                right: 80px !important;
                border: 3px solid white !important;
            }
        }
    `;
    document.head.appendChild(style);
}

    // Ajouter le clic pour ouvrir admin-comments
    badge.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Préparer l'authentification
        sessionStorage.setItem('newsAdminAuth', 'authenticated');
        sessionStorage.setItem('newsAdminUser', 'Admin_ActuMedia');
        sessionStorage.setItem('newsAdminTimestamp', Date.now().toString());
        
        // Ouvrir la page de modération
        window.open('admin-comments.html', '_blank');
    });

    newsWidget.appendChild(badge);
    
    // S'assurer que le widget a position: relative
    if (getComputedStyle(newsWidget).position === 'static') {
        newsWidget.style.position = 'relative';
    }
}

function removeNotificationBadgeFromNewsWidget() {
    const badge = document.querySelector('.admin-notification-badge');
    if (badge) badge.remove();
}

function showSimpleNotification(message) {
    // Notification native si permission accordée
    if (Notification.permission === 'granted') {
        new Notification('Administration - Actu&Média', {
            body: message,
            icon: '/icons/icon-192x192.png',
            tag: 'admin-comments'
        });
    }
    
    // Vibration sur mobile
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
    }
}

// Dans app-initializer.js, ajouter à la fin de l'initialisation :
document.addEventListener('DOMContentLoaded', () => {
    // ... votre code existant ...
    
    // Vérifier les notifications admin après le chargement
    setTimeout(() => {
        checkAdminNotifications();
        
        // Vérifier toutes les 3 minutes
        setInterval(checkAdminNotifications, 180000);
    }, 5000);
});

// Rendre disponible globalement
window.checkAdminNotifications = checkAdminNotifications;

// Application Initialization
async function initApp() {
    try {
        // Enregistrer le Service Worker
        await registerServiceWorker();
        
        // Initialiser l'installateur PWA
        window.pwaInstaller = new PWAInstaller();
        
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