// app.js - Version optimisée
// Note: Importez les modules en utilisant le chemin correct selon votre structure de projet
import ChatManager from './chatManager.js';
import ContentManager from './content.js';

class App {
    constructor() {
        // Initialisation des managers
        this.initManagers();
    }

    async initManagers() {
    try {
        // Initialiser Content Manager et Chat Manager en parallèle
        this.contentManager = new ContentManager();
        this.chatManager = new ChatManager();

        await Promise.all([
            this.contentManager.init(),
            this.chatManager.init()
        ]);

        console.log('Content Manager et Chat Manager initialisés');
        
        // Initialiser PollManager si présent
        try {
            const PollManager = (await import('./pollManager.js')).default;
            this.pollManager = new PollManager("pollTile");
            await this.pollManager.init();
            console.log("Poll Manager initialisé");
        } catch (error) {
            console.warn('PollManager non disponible:', error);
        }

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

// Exposer la classe App
export default App;