// ============================================
// ACTU & MÉDIA - Service Worker v2
// ============================================

const CACHE_NAME = 'actu-media-v20';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/css/quick-links.css',
    '/css/support.css',
    '/css/radio.css',
    '/js/app.js',
    '/js/quick-links.js',
    '/js/support.js',
    '/js/radio.js',
    '/manifest.json'
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
