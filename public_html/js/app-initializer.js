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

// Démarrer l'application quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Exporter les fonctions ou classes si nécessaire pour d'autres modules
export { PWAInstaller, registerServiceWorker };