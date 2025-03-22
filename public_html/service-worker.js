const CACHE_NAME = 'infos-pwa-v2';
const OFFLINE_URL = '/offline.html';

const STATIC_RESOURCES = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/css/chat-styles.css',
    '/js/app.js',
    '/js/chatManager.js',
    '/js/content.js',
    '/manifest.json',
    '/images/INFOS-96.png',
    '/images/INFOS-192.png',
    '/images/INFOS.png',
    '/images/badge-72x72.png',
    '/sounds/message.mp3',
    '/sounds/notification.mp3',
    '/sounds/click.mp3',
    '/sounds/erreur.mp3',
    '/sounds/success.mp3',
    OFFLINE_URL
];

// Installation
self.addEventListener('install', event => {
    console.log('[Service Worker] Installation...');
    event.waitUntil(
        Promise.all([
            caches.open(CACHE_NAME).then(cache => {
                console.log('[Service Worker] Mise en cache des ressources');
                return cache.addAll(STATIC_RESOURCES);
            }),
            self.skipWaiting()
        ])
    );
});

// Activation
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activation...');
    event.waitUntil(
        Promise.all([
            clients.claim(),
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
                        .map(cacheName => {
                            console.log('[Service Worker] Suppression ancien cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
        ])
    );
});

// Message handling
self.addEventListener('message', async (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    // Ajout de la gestion de la visibilité
    if (event.data && event.data.type === 'CHECK_VISIBILITY') {
        const clientList = await clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        });
        
        const isVisible = clientList.some(
            client => client.visibilityState === 'visible'
        );
        
        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
                type: 'VISIBILITY_RESULT',
                isVisible
            });
        }
    }
});

// Stratégie de cache
self.addEventListener('fetch', (event) => {
    // Ignorer les requêtes non GET
    if (event.request.method !== 'GET') return;

    // Ignorer les requêtes vers Supabase et chrome-extension
    if (event.request.url.includes('supabase') || 
        event.request.url.startsWith('chrome-extension')) {
        return;
    }

    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            try {
                // Essayer d'abord le réseau
                const response = await fetch(event.request);
                // Ne mettre en cache que les réponses réussies
                if (response.ok && response.status !== 206) {
                    await cache.put(event.request, response.clone());
                }
                return response;
            } catch (error) {
                // Si hors ligne, essayer le cache
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }
                // Si c'est une page, retourner la page hors ligne
                if (event.request.mode === 'navigate') {
                    return cache.match(OFFLINE_URL);
                }
                throw error;
            }
        })()
    );
});

// Gestion des notifications push
self.addEventListener('push', function(event) {
    console.log('[Service Worker] Push Reçu', event.data?.text());
    
    event.waitUntil((async () => {
        try {
            let data;
            try {
                data = event.data.json();
            } catch (e) {
                data = {
                    title: 'INFOS Chat',
                    body: event.data.text()
                };
            }

            const clientList = await clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            });

            const windowClient = clientList.find(client => 
                client.visibilityState === 'visible'
            );

            if (!windowClient) {
                const options = {
                    body: data.body || 'Nouveau message',
                    icon: '/images/INFOS-192.png',
                    badge: '/images/badge-72x72.png',
                    tag: 'chat-message-' + Date.now(),
                    vibrate: [100, 50, 100],
                    data: {
                        url: '/?action=openchat',
                        timestamp: Date.now()
                    },
                    actions: [{
                        action: 'open',
                        title: 'Ouvrir le chat'
                    }],
                    requireInteraction: true,
                    renotify: true,
                    silent: false
                };

                await self.registration.showNotification('INFOS Chat', options);
                console.log('[Service Worker] Notification envoyée');
            }
        } catch (error) {
            console.error('[Service Worker] Erreur dans push:', error);
            await self.registration.showNotification('INFOS Chat', {
                body: 'Nouveau message reçu',
                icon: '/images/INFOS-192.png',
                badge: '/images/badge-72x72.png',
                requireInteraction: true
            });
        }
    })());
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notification cliquée');
    
    event.notification.close();
    
    const urlToOpen = new URL('/?action=openchat', self.location.origin).href;
    
    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    })
    .then((windowClients) => {
        for (const client of windowClients) {
            if (client.url === urlToOpen) {
                return client.focus();
            }
        }
        return clients.openWindow(urlToOpen);
    });

    event.waitUntil(promiseChain);
});

// Gestion de la fermeture des notifications
self.addEventListener('notificationclose', function(event) {
    console.log('[Service Worker] Notification fermée', {
        tag: event.notification.tag,
        data: event.notification.data
    });
});

// Gestion du changement de souscription
self.addEventListener('pushsubscriptionchange', async function(event) {
    console.log('[Service Worker] PushSubscriptionChange');
    try {
        const newSubscription = await self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: self.registration.pushManager.getSubscription()
                       .then(sub => sub.options.applicationServerKey)
        });

        // Informer l'application du changement
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SUBSCRIPTION_CHANGED',
                subscription: newSubscription
            });
        });
    } catch (error) {
        console.error('[Service Worker] Erreur renouvellement souscription:', error);
    }
});

// Gestionnaires d'erreurs globaux
self.addEventListener('error', function(e) {
    console.error('[Service Worker] Erreur:', e.filename, e.lineno, e.colno, e.message);
});

self.addEventListener('unhandledrejection', function(e) {
    console.error('[Service Worker] Rejet non géré:', e.reason);
});
