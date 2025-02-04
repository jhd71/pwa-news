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
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    event.waitUntil(clients.claim());
});

// Écouter le message pour SKIP_WAITING
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
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
// Remplacez le gestionnaire d'événement push existant par celui-ci
self.addEventListener('push', function(event) {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const options = {
            body: data.body || 'Nouveau message reçu',
            icon: data.icon || '/images/INFOS-192.png',
            badge: data.badge || '/images/badge-72x72.png',
            vibrate: [200, 100, 200],
            tag: 'chat-notification',
            renotify: true,
            requireInteraction: true,
            data: data.data || { url: self.registration.scope }
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'INFOS Chat', options)
        );
    } catch (error) {
        console.error('Erreur traitement notification push:', error);
        // Fallback en cas d'erreur de parsing
        event.waitUntil(
            self.registration.showNotification('INFOS Chat', {
                body: 'Nouveau message reçu',
                icon: '/images/INFOS-192.png',
                badge: '/images/badge-72x72.png',
                vibrate: [200, 100, 200]
            })
        );
    }
});

// Gestion des événements de fermeture de notification
self.addEventListener('notificationclose', function(event) {
    console.log('SW: Notification fermée', {
        tag: event.notification.tag,
        timestamp: new Date().toISOString(),
        data: event.notification.data
    });
});
