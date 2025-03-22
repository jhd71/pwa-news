const CACHE_NAME = 'infos-pwa-v3'; // Incrémentez la version
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
    '/images/AM-192-v2.png',
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
    console.log('[ServiceWorker] Installation');
    event.waitUntil(
        Promise.all([
            caches.open(CACHE_NAME).then(cache => {
                console.log('[ServiceWorker] Mise en cache globale');
                return cache.addAll(STATIC_RESOURCES);
            }),
            self.skipWaiting()
        ])
    );
});

// Activation
self.addEventListener('activate', event => {
    console.log('[ServiceWorker] Activation');
    event.waitUntil(
        Promise.all([
            clients.claim(),
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
                        .map(cacheName => {
                            console.log('[ServiceWorker] Suppression de l\'ancien cache:', cacheName);
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

// Stratégie de cache améliorée
self.addEventListener('fetch', (event) => {
    // Ignorer les requêtes non GET
    if (event.request.method !== 'GET') return;

    // Ignorer les URLs non HTTP/HTTPS
    const url = new URL(event.request.url);
    if (!url.protocol.startsWith('http')) return;

    // Ignorer les requêtes vers Supabase
    if (event.request.url.includes('supabase.co')) return;

    // Traitement spécial pour les requêtes d'API
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .catch(error => {
                    console.error('[ServiceWorker] Erreur de récupération API:', error);
                    return new Response(JSON.stringify({ 
                        error: 'Réseau indisponible',
                        offline: true 
                    }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
        return;
    }

    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            try {
                // Essayer d'abord le réseau
                const networkResponse = await fetch(event.request);
                // Ne mettre en cache que les réponses réussies et complètes
                if (networkResponse.ok && networkResponse.status !== 206) {
                    cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
            } catch (error) {
                // Si hors ligne, essayer le cache
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }
                // Si c'est une navigation vers une page, retourner la page hors ligne
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
    console.log('[ServiceWorker] Push Reçu', event.data?.text());
    
    event.waitUntil((async () => {
        try {
            let data;
            try {
                data = event.data.json();
            } catch (e) {
                data = {
                    title: 'Actu&Média Chat',
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
                    icon: '/images/AM-192-v2.png',
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

                await self.registration.showNotification('Actu&Média Chat', options);
                console.log('[ServiceWorker] Notification envoyée');
            }
        } catch (error) {
            console.error('[ServiceWorker] Erreur dans push:', error);
            await self.registration.showNotification('Actu&Média Chat', {
                body: 'Nouveau message reçu',
                icon: '/images/AM-192-v2.png',
                badge: '/images/badge-72x72.png',
                requireInteraction: true
            });
        }
    })());
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', function(event) {
    console.log('[ServiceWorker] Notification cliquée');
    
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
    console.log('[ServiceWorker] Notification fermée', {
        tag: event.notification.tag,
        data: event.notification.data
    });
});

// Gestion du changement de souscription
self.addEventListener('pushsubscriptionchange', async function(event) {
    console.log('[ServiceWorker] PushSubscriptionChange');
    try {
        const oldSubscription = event.oldSubscription || await self.registration.pushManager.getSubscription();
        const applicationServerKey = oldSubscription.options.applicationServerKey;
        
        const newSubscription = await self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
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
        console.error('[ServiceWorker] Erreur renouvellement souscription:', error);
    }
});

// Gestionnaires d'erreurs globaux
self.addEventListener('error', function(e) {
    console.error('[ServiceWorker] Erreur:', e.filename, e.lineno, e.colno, e.message);
});

self.addEventListener('unhandledrejection', function(e) {
    console.error('[ServiceWorker] Rejet non géré:', e.reason);
});
