// ============================================
// ACTU & MÉDIA - Service Worker v38
// ============================================

const CACHE_NAME = 'actu-media-v38';

// Assets statiques à mettre en cache à l'installation
// Ne PAS inclure les pages admin (toujours besoin de données fraîches)
const STATIC_ASSETS = [
    '/',
    '/index.html',

    // CSS
    '/css/styles.css',
    '/css/quick-links.css',
    '/css/support.css',
    '/css/weather-widget.css',
    '/css/meteo-v2.css',
    '/css/radio-player.css',
    '/css/mini-radio.css',

    // JS
    '/js/app.js',
    '/js/quick-links.js',
    '/js/support.js',
    '/js/mini-radio.js',
    '/js/radio-player.js',
    '/js/ios-fixes.js',

    // Pages publiques
    '/radio.html',
    '/meteo.html',
    '/agenda.html',
    '/contact.html',
    '/infos.html',
    '/mentions-legales.html',
    '/confidentialite.html',
    '/proposer.html',
    '/proposer-evenement.html',
    '/merci.html',

    // Icônes
    '/icons/icon-72.png',
    '/icons/icon-192.png',
    '/favicon.png'
];

// Pages/chemins à TOUJOURS chercher sur le réseau (jamais depuis le cache seul)
const NETWORK_ONLY = [
    '/api/',
    '/admin',
    '/admin-hub',
    '/admin-news'
];

// Installation
self.addEventListener('install', event => {
    console.log('📦 SW v38: Installation');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activation - supprime les anciens caches
self.addEventListener('activate', event => {
    console.log('🚀 SW v38: Activation');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch
self.addEventListener('fetch', event => {
    const request = event.request;

    // Ignorer les requêtes non GET
    if (request.method !== 'GET') return;

    // Ignorer les requêtes hors origine (CDN, API externes, etc.)
    if (!request.url.startsWith(self.location.origin)) return;

    const url = new URL(request.url);

    // Network Only : API et pages admin (toujours besoin de données fraîches)
    if (NETWORK_ONLY.some(path => url.pathname.startsWith(path))) return;

    // HTML → Network First (essaie le réseau, sinon le cache)
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, clone).catch(() => {});
                        });
                    }
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // Assets (CSS, JS, images) → Cache First (rapide, puis met à jour en fond)
    event.respondWith(
        caches.match(request).then(cached => {
            // Lancer une mise à jour en arrière-plan
            const fetchPromise = fetch(request).then(response => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, clone).catch(() => {});
                    });
                }
                return response;
            }).catch(() => null);

            // Retourner le cache immédiatement si dispo, sinon attendre le réseau
            return cached || fetchPromise;
        })
    );
});

// ============================================
// NOTIFICATIONS PUSH
// ============================================

// Réception d'une notification push
self.addEventListener('push', (event) => {
    console.log('🔔 Notification push reçue');

    let data = {
        title: 'Actu & Média',
        body: 'Nouvelle actualité !',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        url: '/'
    };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        vibrate: [200, 100, 200],
        tag: 'actu-media-notification',
        renotify: true,
        requireInteraction: false,
        data: {
            url: data.url,
            timestamp: data.timestamp
        },
        actions: [
            { action: 'open', title: 'Voir' },
            { action: 'close', title: 'Fermer' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Clic sur la notification
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') return;

    const urlPath = event.notification.data?.url || '/';
    const fullUrl = urlPath.startsWith('http') ? urlPath : 'https://actuetmedia.fr' + urlPath;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if ('focus' in client) {
                        return client.focus().then(() => {
                            if ('navigate' in client) return client.navigate(fullUrl);
                        });
                    }
                }
                return clients.openWindow(fullUrl);
            })
            .catch(() => clients.openWindow(fullUrl))
    );
});

// Fermeture de notification
self.addEventListener('notificationclose', () => {});