// ============================================
// ACTU & MÉDIA - Service Worker
// La version se change à UN SEUL endroit : CACHE_NAME ci-dessous.
// Les messages de la console la reprennent automatiquement.
// ============================================

const CACHE_NAME = 'actu-media-v102';
const VERSION = CACHE_NAME.split('-').pop();

// Assets statiques à mettre en cache à l'installation
// Ne PAS inclure les pages admin (toujours besoin de données fraîches)
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',

    // CSS
    '/css/styles.css',
    '/css/quick-links.css',
    '/css/support.css',
    '/css/weather-widget.css',
    '/css/meteo-v2.css',
    '/css/radio-player.css',
    '/css/mini-radio.css',

    // JS
    '/js/utils.js',
    '/js/app.js',
    '/js/quick-links.js',
    '/js/support.js',
    '/js/mini-radio.js',
    '/js/radio-player.js',
    '/js/ios-fixes.js',
    '/js/ios-install.js',
	
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

    // Icônes
    '/icons/icon-72.png',
    '/icons/icon-192.png',
    '/favicon.png',

    // Bannière d'accueil
    '/images/banniere-plessis-800.webp',
    '/images/banniere-plessis-1200.webp'
];

// Pages/chemins à TOUJOURS chercher sur le réseau (jamais depuis le cache seul)
const NETWORK_ONLY = [
    '/api/',
    '/admin'
];

// Installation
self.addEventListener('install', event => {
    console.log(`📦 SW ${VERSION}: Installation`);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // Mettre en cache chaque fichier individuellement
                // Un fichier manquant ne bloque pas l'installation
                // cache: 'reload' court-circuite le cache HTTP du navigateur,
                // sinon on risque de mettre en cache une ancienne version
                return Promise.allSettled(
                    STATIC_ASSETS.map(url =>
                        cache.add(new Request(url, { cache: 'reload' })).catch(err => {
                            console.warn('⚠️ Cache échoué pour:', url, err.message);
                        })
                    )
                );
            })
            .then(() => self.skipWaiting())
    );
});

// Activation - supprime les anciens caches
self.addEventListener('activate', event => {
    console.log(`🚀 SW ${VERSION}: Activation`);
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
                .catch(() => caches.match(request).then(cached => cached || caches.match('/index.html')))
        );
        return;
    }

    // CSS et JS → Network First, comme le HTML.
    //
    // C'est LE point qui cassait la mise en page a la premiere ouverture apres
    // une mise a jour : le HTML arrivait du reseau (donc neuf) pendant que le
    // CSS sortait du cache (donc ancien). Une section nouvelle comme la banniere
    // se retrouvait sans style, l'image passait a sa taille naturelle et faisait
    // deborder toute la page. Un rechargement corrigeait, puisque le cache avait
    // entre-temps ete rafraichi en arriere-plan.
    // Les deux doivent suivre la meme regle pour rester en phase.
    if (/\.(css|js)$/i.test(url.pathname)) {
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

    // Images, icones, polices → Cache First (leur nom change quand elles changent)
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