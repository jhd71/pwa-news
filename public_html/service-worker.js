const CACHE_NAME = 'infos-pwa-v2';
const APP_VERSION = '2.0.0';
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
            // Force l'activation immédiate
            self.skipWaiting()
        ])
    );
});

// Activation unifiée
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activation...');
    event.waitUntil(
        Promise.all([
            // Prend le contrôle immédiatement
            clients.claim(),
            
            // Nettoie les anciens caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[Service Worker] Suppression ancien cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

// Écouter le message pour SKIP_WAITING
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Stratégie de cache modifiée
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
                // Ne mettre en cache que les réponses réussies et complètes
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

// Notifications push
self.addEventListener('push', function(event) {
    if (!event.data) return;

    try {
        const pushData = event.data.json();
        const options = {
            body: pushData.message || 'Nouveau message',
            icon: '/images/INFOS-192.png',
            badge: '/images/badge-72x72.png',
            vibrate: [200, 100, 200],
            data: {
                url: '/?action=openchat'
            },
            requireInteraction: true,
            renotify: true,
            tag: 'chat-message'
        };

        event.waitUntil(
            self.registration.showNotification('INFOS Chat', options)
        );
    } catch (error) {
        console.error('Erreur notification push:', error);
        event.waitUntil(
            self.registration.showNotification('INFOS Chat', {
                body: 'Nouveau message reçu',
                icon: '/images/INFOS-192.png',
                badge: '/images/badge-72x72.png'
            })
        );
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function(clientList) {
                for (let client of clientList) {
                    if (client.url.includes('pwa-news-two.vercel.app') && 'focus' in client) {
                        return client.focus();
                    }
                }
                return clients.openWindow('/?action=openchat');
            })
    );
});

// Gestion des événements de fermeture de notification
self.addEventListener('notificationclose', function(event) {
    console.log('SW: Notification fermée', {
        tag: event.notification.tag,
        timestamp: new Date().toISOString(),
        data: event.notification.data
    });
});
// Ajoutez cette fonction pour la gestion des notifications
self.addEventListener('pushsubscriptionchange', function(event) {
    console.log('[Service Worker] PushSubscriptionChange');
    event.waitUntil(
        Promise.all([
            self.registration.pushManager.subscribe({ userVisibleOnly: true }),
            // Ici vous pouvez ajouter la logique pour mettre à jour la subscription sur votre serveur
        ])
    );
});
// Gestionnaires d'erreurs globaux
self.addEventListener('error', function(e) {
    console.error('Service Worker error:', e.filename, e.lineno, e.colno, e.message);
});

self.addEventListener('unhandledrejection', function(e) {
    console.error('Service Worker unhandled rejection:', e.reason);
});
