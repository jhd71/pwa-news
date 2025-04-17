const CACHE_NAME = 'infos-pwa-v5';
const API_CACHE_NAME = 'infos-api-cache-v1';

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

// Contenu HTML de la page hors ligne
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

// Configuration du timeout pour les requêtes réseau
const NETWORK_TIMEOUT = 5000; // 5 secondes

// Installation
self.addEventListener('install', event => {
    console.log('[ServiceWorker] Installation');
    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(CACHE_NAME);
                console.log('[ServiceWorker] Mise en cache globale');
                
                // Au lieu d'utiliser addAll qui échoue si une seule ressource échoue,
                // on met en cache chaque ressource individuellement
                const successfulCaches = [];
                const failedCaches = [];
                
                for (const url of STATIC_RESOURCES) {
                    try {
                        await cache.add(url);
                        successfulCaches.push(url);
                    } catch (error) {
                        // Logger l'erreur mais continuer avec les autres ressources
                        console.warn(`[ServiceWorker] Échec de mise en cache: ${url}`, error);
                        failedCaches.push(url);
                    }
                }
                
                console.log(`[ServiceWorker] Mise en cache réussie pour ${successfulCaches.length} ressources`);
                if (failedCaches.length > 0) {
                    console.warn(`[ServiceWorker] Échec de mise en cache pour ${failedCaches.length} ressources`);
                }
                
                await self.skipWaiting();
                return;
            } catch (error) {
                console.error('[ServiceWorker] Erreur d\'installation:', error);
                // Continue l'installation même en cas d'erreur
                await self.skipWaiting();
                return;
            }
        })()
    );
});

// Fonction pour précharger des ressources additionnelles importantes
async function precacheAdditionalResources() {
    try {
        // Ici, vous pouvez ajouter du code pour précharger d'autres ressources
        // comme des données JSON importantes, des icônes supplémentaires, etc.
        console.log('[ServiceWorker] Préchargement de ressources additionnelles');
        return Promise.resolve();
    } catch (error) {
        console.error('[ServiceWorker] Erreur de préchargement:', error);
        return Promise.resolve(); // Continue malgré l'erreur
    }
}

// Activation avec nettoyage des anciens caches
self.addEventListener('activate', event => {
    console.log('[ServiceWorker] Activation');
    event.waitUntil(
        (async () => {
            try {
                // Prendre le contrôle immédiatement
                await clients.claim();
                
                // Nettoyage des anciens caches
                const cacheNames = await caches.keys();
                const cachesToDelete = cacheNames.filter(cacheName => 
                    cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME
                );
                
                await Promise.all(
                    cachesToDelete.map(cacheName => {
                        console.log('[ServiceWorker] Suppression de l\'ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    })
                );
            } catch (error) {
                console.error('[ServiceWorker] Erreur d\'activation:', error);
            }
        })()
    );
});

// Fonction utilitaire pour ajouter un timeout aux requêtes fetch
function fetchWithTimeout(request, timeoutMs) {
    return new Promise((resolve, reject) => {
        // Définir un timeout
        const timeoutId = setTimeout(() => {
            reject(new Error('Timeout de requête réseau'));
        }, timeoutMs);
        
        // Faire la requête
        fetch(request).then(
            response => {
                clearTimeout(timeoutId);
                resolve(response);
            },
            error => {
                clearTimeout(timeoutId);
                reject(error);
            }
        );
    });
}

// Message handling avec async/await pour plus de clarté
self.addEventListener('message', async (event) => {
    try {
        if (event.data && event.data.type === 'SKIP_WAITING') {
            await self.skipWaiting();
        }
        
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
    } catch (error) {
        console.error('[ServiceWorker] Erreur dans message handler:', error);
    }
});

// Déterminer si une requête doit être mise en cache
function shouldCache(request, response) {
    // Ne pas mettre en cache les réponses partielles ou non-ok
    if (!response.ok || response.status === 206) {
        return false;
    }
    
    // Vérifier le type de contenu et Content-Length
    const contentType = response.headers.get('Content-Type') || '';
    const size = parseInt(response.headers.get('Content-Length') || '0', 10);
    
    // Limiter la taille des éléments mis en cache (ex: 5MB)
    const MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5MB
    if (size > MAX_CACHE_SIZE) {
        return false;
    }
    
    // Ne pas mettre en cache certains types de contenu
    if (contentType.includes('video/') || contentType.includes('audio/')) {
        return false;
    }
    
    return true;
}

// Stratégie de cache améliorée avec meilleure catégorisation des requêtes
self.addEventListener('fetch', (event) => {
    // Ignorer les requêtes non GET
    if (event.request.method !== 'GET') return;

    // Ignorer les URLs non HTTP/HTTPS
    const url = new URL(event.request.url);
    if (!url.protocol.startsWith('http')) return;

    // Ignorer les requêtes vers Supabase
    if (event.request.url.includes('supabase.co')) return;
    
    // Catégoriser la requête
    const requestType = categorizeRequest(event.request);
    
    switch (requestType) {
        case 'IMAGE':
            handleImageRequest(event);
            break;
        case 'API':
            handleApiRequest(event);
            break;
        case 'FONT':
            handleFontRequest(event);
            break;
        case 'CSS_JS':
            handleCssJsRequest(event);
            break;
        case 'NAVIGATION':
            handleNavigationRequest(event);
            break;
        default:
            handleDefaultRequest(event);
    }
});

// Catégoriser la requête pour appliquer la stratégie appropriée
function categorizeRequest(request) {
    const url = request.url;
    
    // Détection des images
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/) || url.includes('/images/')) {
        return 'IMAGE';
    }
    
    // Détection des API
    if (url.includes('/api/')) {
        return 'API';
    }
    
    // Détection des polices
    if (url.match(/\.(woff|woff2|ttf|otf|eot)$/) || url.includes('/fonts/')) {
        return 'FONT';
    }
    
    // Détection des CSS et JS
    if (url.match(/\.(css|js)$/) || url.includes('/css/') || url.includes('/js/')) {
        return 'CSS_JS';
    }
    
    // Détection des navigations
    if (request.mode === 'navigate') {
        return 'NAVIGATION';
    }
    
    return 'DEFAULT';
}

// Gestion des requêtes d'images avec stale-while-revalidate optimisé
function handleImageRequest(event) {
    event.respondWith(
        (async () => {
            try {
                // Vérifier d'abord dans le cache
                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(event.request);
                
                // Lancer la requête réseau en parallèle
                const networkPromise = fetchWithTimeout(event.request, NETWORK_TIMEOUT)
                    .then(response => {
                        // Mettre en cache si approprié
                        if (shouldCache(event.request, response)) {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    })
                    .catch(error => {
                        console.error('[ServiceWorker] Erreur image:', error);
                        throw error;
                    });
                
                // Si on a une réponse en cache, on la retourne immédiatement
                if (cachedResponse) {
                    // Revalidation en arrière-plan
                    networkPromise.catch(() => {/* Ignorer les erreurs de revalidation */});
                    return cachedResponse;
                }
                
                // Sinon attendre la réponse réseau
                return await networkPromise;
            } catch (error) {
                // En cas d'échec, essayer de servir depuis le cache
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) return cachedResponse;
                
                // Ou retourner une image placeholder
                return new Response(
                    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
                        <rect width="100%" height="100%" fill="#f0f0f0"/>
                        <text x="50%" y="50%" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#999">Image non disponible</text>
                    </svg>`,
                    {
                        headers: { 'Content-Type': 'image/svg+xml' }
                    }
                );
            }
        })()
    );
}

// Gestion des requêtes API avec optimisation pour données fraîches
function handleApiRequest(event) {
    event.respondWith(
        (async () => {
            try {
                // D'abord essayer le réseau avec timeout
                const response = await fetchWithTimeout(event.request, NETWORK_TIMEOUT);
                
                // Mettre en cache pour une utilisation hors ligne future
                const cache = await caches.open(API_CACHE_NAME);
                cache.put(event.request, response.clone());
                
                return response;
            } catch (error) {
                console.error('[ServiceWorker] Erreur API:', error);
                
                // En cas d'échec, essayer de servir depuis le cache API
                const cache = await caches.open(API_CACHE_NAME);
                const cachedResponse = await cache.match(event.request);
                
                if (cachedResponse) {
                    // Ajouter un en-tête pour indiquer que c'est une réponse mise en cache
                    const headers = new Headers(cachedResponse.headers);
                    headers.append('X-Cache', 'HIT');
                    
                    // Créer une nouvelle réponse avec l'en-tête ajouté
                    return new Response(cachedResponse.body, {
                        status: cachedResponse.status,
                        statusText: cachedResponse.statusText,
                        headers: headers
                    });
                }
                
                // Si pas en cache, retourner une réponse d'erreur formatée
                return new Response(JSON.stringify({
                    error: 'Réseau indisponible',
                    offline: true,
                    timestamp: Date.now()
                }), {
                    status: 503,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-store'
                    }
                });
            }
        })()
    );
}

// Gestion des polices avec mise en cache agressive
function handleFontRequest(event) {
    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(event.request);
            
            if (cachedResponse) {
                return cachedResponse;
            }
            
            try {
                const response = await fetch(event.request);
                if (response.ok) {
                    cache.put(event.request, response.clone());
                }
                return response;
            } catch (error) {
                console.error('[ServiceWorker] Erreur de police:', error);
                return new Response('', { 
                    status: 404, 
                    statusText: 'Police non disponible'
                });
            }
        })()
    );
}

// Gestion optimisée des ressources CSS et JS 
function handleCssJsRequest(event) {
    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            
            try {
                // Stratégie réseau d'abord pour les ressources critiques
                const response = await fetchWithTimeout(event.request, NETWORK_TIMEOUT);
                if (response.ok) {
                    cache.put(event.request, response.clone());
                }
                return response;
            } catch (error) {
                console.error('[ServiceWorker] Erreur CSS/JS:', error);
                
                // Fallback sur le cache
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Si c'est une ressource CSS critique sans fallback, créer un CSS minimal
                if (event.request.url.endsWith('styles.css')) {
                    return new Response(
                        `/* CSS de secours minimaliste */
                        body { font-family: sans-serif; }`,
                        { headers: { 'Content-Type': 'text/css' } }
                    );
                }
                
                // Pour le reste, échec normal
                throw error;
            }
        })()
    );
}

// Gestion des requêtes de navigation (page web principale)
function handleNavigationRequest(event) {
    event.respondWith(
        (async () => {
            try {
                // Essayer d'abord le réseau pour les pages principales
                const networkResponse = await fetchWithTimeout(event.request, NETWORK_TIMEOUT);
                
                // Mettre en cache pour utilisation hors ligne
                const cache = await caches.open(CACHE_NAME);
                cache.put(event.request, networkResponse.clone());
                
                return networkResponse;
            } catch (error) {
                console.error('[ServiceWorker] Erreur navigation:', error);
                
                // Essayer de servir depuis le cache
                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(event.request);
                
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Dernier recours : page hors ligne
                return new Response(OFFLINE_HTML, {
                    headers: { 'Content-Type': 'text/html; charset=utf-8' }
                });
            }
        })()
    );
}

// Gestion par défaut pour toutes les autres requêtes
function handleDefaultRequest(event) {
    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            
            try {
                // Essayer d'abord le réseau
                const networkResponse = await fetchWithTimeout(event.request, NETWORK_TIMEOUT);
                
                // Mettre en cache si c'est approprié
                if (shouldCache(event.request, networkResponse)) {
                    cache.put(event.request, networkResponse.clone());
                }
                
                return networkResponse;
            } catch (error) {
                console.error('[ServiceWorker] Erreur requête par défaut:', error);
                
                // Fallback sur le cache
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                throw error;
            }
        })()
    );
}

// Gestion des notifications push avec contrôle de la visibilité
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

            // Vérification de la visibilité de l'application
            const isClientVisible = await isApplicationVisible();
            
            // Ne montrer la notification que si l'application n'est pas visible
            if (!isClientVisible) {
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
            } else {
                // Si l'app est visible, envoyer un message au client au lieu d'une notification
                const clients = await self.clients.matchAll({
                    type: 'window',
                    includeUncontrolled: true
                });
                
                clients.forEach(client => {
                    client.postMessage({
                        type: 'PUSH_RECEIVED',
                        data: data
                    });
                });
                
                console.log('[ServiceWorker] Message envoyé au client visible');
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

// Fonction utilitaire pour vérifier si l'application est visible
async function isApplicationVisible() {
    const clientList = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    });

    return clientList.some(client => client.visibilityState === 'visible');
}

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', function(event) {
    console.log('[ServiceWorker] Notification cliquée', event.notification.tag);

    event.notification.close();

    const urlToOpen = event.notification.data?.url || 
                     new URL('/?action=openchat', self.location.origin).href;

    event.waitUntil((async () => {
        try {
            const windowClients = await clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            });
            
            // Chercher un client existant avec l'URL cible
            for (const client of windowClients) {
                if (client.url === urlToOpen || client.url.startsWith(self.location.origin)) {
                    // Focus et navigation dans la fenêtre existante
                    await client.focus();
                    
                    // Si l'URL est différente, naviguer vers la destination
                    if (client.url !== urlToOpen) {
                        return client.navigate(urlToOpen);
                    }
                    
                    return;
                }
            }
            
            // Si aucun client correspondant, ouvrir une nouvelle fenêtre
            await clients.openWindow(urlToOpen);
        } catch (error) {
            console.error('[ServiceWorker] Erreur notificationclick:', error);
        }
    })());
});

// Gestion de la fermeture des notifications
self.addEventListener('notificationclose', function(event) {
    console.log('[ServiceWorker] Notification fermée', {
        tag: event.notification.tag,
        data: event.notification.data
    });
    
    // Possibilité d'enregistrer des statistiques ou des préférences utilisateur ici
});

// Gestion du changement de souscription avec retry sur échec
self.addEventListener('pushsubscriptionchange', async function(event) {
    console.log('[ServiceWorker] PushSubscriptionChange');
    
    event.waitUntil((async () => {
        try {
            const MAX_RETRY = 3;
            let retryCount = 0;
            let success = false;
            
            // Récupérer l'ancienne souscription ou la souscription actuelle
            const oldSubscription = event.oldSubscription || 
                                   await self.registration.pushManager.getSubscription();
            
            // Extraire la clé d'application
            const applicationServerKey = oldSubscription?.options?.applicationServerKey;
            
            while (!success && retryCount < MAX_RETRY) {
                try {
                    // Souscrire à nouveau
                    const newSubscription = await self.registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: applicationServerKey
                    });
                    
                    // Informer l'application du changement
                    const allClients = await self.clients.matchAll();
                    allClients.forEach(client => {
                        client.postMessage({
                            type: 'SUBSCRIPTION_CHANGED',
                            subscription: newSubscription
                        });
                    });
                    
                    success = true;
                } catch (error) {
                    console.error(`[ServiceWorker] Erreur renouvellement (tentative ${retryCount + 1}):`, error);
                    retryCount++;
                    
                    // Attendre avant de réessayer (backoff exponentiel)
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
                }
            }
            
            if (!success) {
                console.error('[ServiceWorker] Échec du renouvellement de la souscription après plusieurs tentatives');
            }
        } catch (error) {
            console.error('[ServiceWorker] Erreur globale de renouvellement:', error);
        }
    })());
});

// Amélioration de la gestion des erreurs globales
self.addEventListener('error', function(e) {
    console.error('[ServiceWorker] Erreur:', e.filename, e.lineno, e.colno, e.message);
    // Possibilité d'envoyer les erreurs à un service d'analyse
});

self.addEventListener('unhandledrejection', function(e) {
    console.error('[ServiceWorker] Rejet non géré:', e.reason);
    // Possibilité d'envoyer les erreurs à un service d'analyse
});

// Périodiquement, nettoyer les caches trop anciens
self.addEventListener('periodicsync', async (event) => {
    if (event.tag === 'cache-cleanup') {
        event.waitUntil((async () => {
            try {
                console.log('[ServiceWorker] Nettoyage périodique du cache');
                await cleanupOldCacheEntries();
            } catch (error) {
                console.error('[ServiceWorker] Erreur de nettoyage du cache:', error);
            }
        })());
    }
});

// Fonction utilitaire pour nettoyer les entrées de cache trop anciennes
async function cleanupOldCacheEntries() {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    const now = Date.now();
    const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 jours
    
    for (const request of requests) {
        // Vérifier si la requête contient une indication de date
        const response = await cache.match(request);
        const dateHeader = response.headers.get('date');
        
        if (dateHeader) {
            const date = new Date(dateHeader).getTime();
            if (now - date > MAX_AGE) {
                console.log('[ServiceWorker] Suppression de l\'entrée de cache expirée:', request.url);
                await cache.delete(request);
            }
        }
    }
}