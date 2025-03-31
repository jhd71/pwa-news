const CACHE_NAME = 'infos-pwa-v5'; // Incrémentez la version
const OFFLINE_URL = './offline.html'; // Utilisez un chemin relatif avec le point

const STATIC_RESOURCES = [
    '/',
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
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] Mise en cache globale');
                // Mise en cache individuellement pour détecter les erreurs spécifiques
                return Promise.all(
                    STATIC_RESOURCES.map(url => {
                        return cache.add(url).catch(error => {
                            console.error(`[ServiceWorker] Échec de mise en cache: ${url}`, error);
                            // Continue malgré l'erreur
                            return Promise.resolve();
                        });
                    })
                );
            })
            .then(() => self.skipWaiting())
            .catch(error => {
                console.error('[ServiceWorker] Erreur d\'installation:', error);
                // Continue l'installation même en cas d'erreur
                return self.skipWaiting();
            })
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
                
                // Si c'est une navigation vers une page, gérer l'état hors ligne
                if (event.request.mode === 'navigate') {
                    try {
                        // Essayer d'obtenir la page offline.html du cache
                        const offlinePage = await cache.match('./offline.html');
                        if (offlinePage) {
                            return offlinePage;
                        } else {
                            // Si la page n'est pas trouvée, retourner une réponse HTML simple
                            return new Response(
                                `<!DOCTYPE html>
                                <html>
                                <head>
                                    <meta charset="UTF-8">
                                    <title>Hors ligne - Actu&Média</title>
                                    <style>
                                        body {
                                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                            background: linear-gradient(135deg, #6e46c9 0%, #8a5adf 100%);
                                            color: white;
                                            height: 100vh;
                                            margin: 0;
                                            display: flex;
                                            flex-direction: column;
                                            align-items: center;
                                            justify-content: center;
                                            text-align: center;
                                            padding: 20px;
                                        }
                                        .container {
                                            max-width: 500px;
                                            background: rgba(0,0,0,0.2);
                                            border-radius: 15px;
                                            padding: 30px;
                                            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                                        }
                                        h1 { margin-top: 0; }
                                        .action {
                                            margin-top: 30px;
                                            background: rgba(255,255,255,0.2);
                                            border: 2px solid white;
                                            color: white;
                                            padding: 10px 25px;
                                            border-radius: 25px;
                                            font-size: 16px;
                                            cursor: pointer;
                                        }
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <h1>Vous êtes hors ligne</h1>
                                        <p>Impossible de charger le contenu demandé car votre appareil n'est pas connecté à Internet.</p>
                                        <p>Certaines fonctionnalités de l'application restent disponibles hors ligne.</p>
                                        <button class="action" onclick="window.location.reload()">Réessayer</button>
                                    </div>
                                </body>
                                </html>`,
                                {
                                    headers: {
                                        'Content-Type': 'text/html; charset=utf-8'
                                    }
                                }
                            );
                        }
                    } catch (e) {
                        // En cas d'erreur, génèrer une page simple
                        return new Response('Vous êtes hors ligne', {
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    }
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
