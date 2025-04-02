const CACHE_NAME = 'infos-pwa-v5'; // Incrémentez la version
// Suppression de const OFFLINE_URL = '/offline.html';

const STATIC_RESOURCES = [
    '/',
    '/css/styles.css',
    '/css/chat-styles.css',
    '/js/app.js',
    '/js/chatManager.js',
    '/js/content.js',
    '/js/lazyLoading.js',
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
    '/sounds/success.mp3'
];

// Contenu HTML de la page hors ligne (nouvelle variable)
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
    h1 {
      margin-top: 0;
    }
    .icon {
      font-size: 60px;
      margin-bottom: 20px;
    }
    .action {
      margin-top: 30px;
      background: rgba(255,255,255,0.2);
      border: 2px solid white;
      color: white;
      padding: 10px 25px;
      border-radius: 25px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .action:hover {
      background: rgba(255,255,255,0.3);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📶</div>
    <h1>Vous êtes hors ligne</h1>
    <p>Impossible de charger le contenu demandé car votre appareil n'est pas connecté à Internet.</p>
    <p>Certaines fonctionnalités de l'application restent disponibles hors ligne.</p>
    <button class="action" onclick="window.location.reload()">Réessayer</button>
  </div>
</body>
</html>`;

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

    // AJOUT: Traitement spécial pour les images
    if (
        event.request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/) ||
        event.request.url.includes('/images/')
    ) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                // Si trouvé dans le cache, retourner directement
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Sinon faire la requête réseau
                return fetch(event.request).then(networkResponse => {
                    // Ne mettre en cache que les réponses OK
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }

                    // Mettre en cache pour la prochaine fois
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                    return networkResponse;
                }).catch(() => {
                    // Si ni réseau ni cache, retourner une image placeholder
                    return new Response(
                        `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
                            <rect width="100%" height="100%" fill="#f0f0f0"/>
                            <text x="50%" y="50%" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#999">Image non disponible</text>
                        </svg>`,
                        {
                            headers: { 'Content-Type': 'image/svg+xml' }
                        }
                    );
                });
            })
        );
        return;
    }

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

                // Si c'est une navigation vers une page, retourner directement la page hors ligne intégrée
                if (event.request.mode === 'navigate') {
                    return new Response(OFFLINE_HTML, {
                        headers: { 'Content-Type': 'text/html; charset=utf-8' }
                    });
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
