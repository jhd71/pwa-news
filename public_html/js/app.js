// app.js - Version optimisée
import ChatManager from './chatManager.js';
import ContentManager from './content.js';

class App {
    constructor() {
        // Initialisation des managers
        this.initManagers();
    }

    async initManagers() {
        try {
            // Initialiser Content Manager
            this.contentManager = new ContentManager();
            await this.contentManager.init();
            console.log('Content Manager initialisé');

            // Initialiser Chat Manager
            this.chatManager = new ChatManager();
            await this.chatManager.init();
            console.log('Chat Manager initialisé');

            // Service Worker et PWA
            this.setupServiceWorker();
        } catch (error) {
            console.error('Erreur initialisation managers:', error);
        }
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js', {
                    scope: '/'
                });
                console.log('ServiceWorker enregistré avec succès:', registration);

                // Gestion de la mise à jour du Service Worker
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

                // Écouter les changements d'état
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

// Initialiser l'application au chargement
window.addEventListener('load', () => {
    try {
        window.app = new App();
    } catch (error) {
        console.error('Erreur lors du démarrage de l\'application:', error);
    }
});

export default App;