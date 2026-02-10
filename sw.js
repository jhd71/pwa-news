// ============================================
// ACTU & MÉDIA - Service Worker v37
// ============================================

const CACHE_NAME = 'actu-media-v37';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/css/quick-links.css',
    '/css/support.css',
    '/css/weather-widget.css',
    '/css/meteo-v2.css',
    '/css/radio-player.css',
    '/css/mini-radio.css',
    '/js/app.js',
    '/js/quick-links.js',
    '/js/support.js',
    '/js/mini-radio.js',
    '/radio.html',
    '/js/radio-player.js'
];

// Installation
self.addEventListener('install', event => {
    console.log('📦 SW: Installation');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activation
self.addEventListener('activate', event => {
    console.log('🚀 SW: Activation');
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

    // Ignorer les requêtes hors origine
    if (!request.url.startsWith(self.location.origin)) return;

    const url = new URL(request.url);

    // Ignorer les API (toujours réseau)
    if (url.pathname.startsWith('/api/')) return;

    // HTML → Network First
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

    // Assets → Cache First
    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached;

            return fetch(request).then(response => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, clone).catch(() => {});
                    });
                }
                return response;
            });
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
    console.log('👆 Clic sur notification, action:', event.action);
    console.log('📦 Données notification:', event.notification.data);

    event.notification.close();

    // Si l'utilisateur clique sur "Fermer"
    if (event.action === 'close') {
        console.log('❌ Action fermer');
        return;
    }

    // Récupérer l'URL
    const urlPath = event.notification.data?.url || '/';
    const fullUrl = urlPath.startsWith('http') ? urlPath : 'https://actuetmedia.fr' + urlPath;
    
    console.log('🌐 URL à ouvrir:', fullUrl);

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                console.log('📱 Nombre de fenêtres:', clientList.length);
                
                // Chercher une fenêtre existante
                for (const client of clientList) {
                    console.log('🔍 Fenêtre trouvée:', client.url);
                    if ('focus' in client) {
                        return client.focus().then(() => {
                            if ('navigate' in client) {
                                console.log('➡️ Navigation vers:', fullUrl);
                                return client.navigate(fullUrl);
                            }
                        });
                    }
                }
                
                // Ouvrir une nouvelle fenêtre
                console.log('🆕 Ouverture nouvelle fenêtre:', fullUrl);
                return clients.openWindow(fullUrl);
            })
            .catch((err) => {
                console.error('❌ Erreur:', err);
                return clients.openWindow(fullUrl);
            })
    );
});

// Fermeture de notification
self.addEventListener('notificationclose', (event) => {
    console.log('❌ Notification fermée');
});