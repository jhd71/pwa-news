const CACHE_NAME = 'infos-pwa-v1';
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
    OFFLINE_URL
];

// Installation
self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            await cache.addAll(STATIC_RESOURCES);
            await self.skipWaiting();
        })()
    );
});

// Activation
self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const cacheKeys = await caches.keys();
            await Promise.all(
                cacheKeys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
            await clients.claim();
        })()
    );
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
self.addEventListener('push', async function(event) {
    if (event.data) {
        const data = await event.data.json();
        const options = {
            body: data.body,
            icon: data.icon,
            badge: '/images/badge.png',
            vibrate: [100, 50, 100],
            data: {
                url: self.registration.scope
            }
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clientList) {
            // Si une fenêtre est déjà ouverte, l'utiliser
            for (let client of clientList) {
                if (client.url === event.notification.data.url && 'focus' in client) {
                    return client.focus();
                }
            }
            // Sinon, ouvrir une nouvelle fenêtre
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
