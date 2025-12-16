// ============================================
// ACTU & MÉDIA - Service Worker
// ============================================

const CACHE_NAME = 'actu-media-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
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

// Fetch - Network First pour HTML, Cache First pour assets
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Ignorer les requêtes non-GET
    if (event.request.method !== 'GET') return;
    
    // Ignorer les requêtes API (toujours réseau)
    if (url.pathname.startsWith('/api/')) return;
    
    // HTML - Network First
    if (event.request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }
    
    // Assets - Cache First
    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                if (cached) return cached;
                
                return fetch(event.request).then(response => {
                    if (response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                });
            })
    );
});
