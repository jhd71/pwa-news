// Version corrigée et complète de service-worker.js

// D'abord on définit les versions des caches
const CACHE_NAME = 'infos-pwa-v10';
const API_CACHE_NAME = 'infos-api-cache-v5';

// TRÈS IMPORTANT: Version du service worker
const WORKER_VERSION = 'v10'; 

// Log initial au démarrage du service worker
console.log(`[SW ${WORKER_VERSION}] Démarrage du service worker`);

const STATIC_RESOURCES = [
    '/',
    '/css/styles.css',
    '/css/chat-styles.css',
    '/css/news-panel.css',
    '/css/chat-ban.css',
    '/css/widgets.css',
    '/css/settings-styles.css',
    '/js/app.js',
    '/js/chatManager.js',
    '/js/chat-keyboard-fix.js',
    '/js/content.js',
    '/js/ios-install.js',
    '/js/newsPanel.js',
    '/js/newsTickerManager.js',
    '/js/notification-manager.js',
    '/js/quick-links.js',
    '/js/service-worker.js',
    '/js/settingsManager.js',
    '/js/sounds.js',
    '/js/tablet-fixes.js',
    '/js/utils.js',
    '/js/weather-widget.js',
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
    '/sounds/success.mp3',
    '/sounds/sent.mp3'
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
    console.log(`[SW ${WORKER_VERSION}] Installation`);
    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(CACHE_NAME);
                console.log(`[SW ${WORKER_VERSION}] Mise en cache globale`);
                
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
                        console.warn(`[SW ${WORKER_VERSION}] Échec de mise en cache: ${url}`, error);
                        failedCaches.push(url);
                    }
                }
                
                console.log(`[SW ${WORKER_VERSION}] Mise en cache réussie pour ${successfulCaches.length} ressources`);
                if (failedCaches.length > 0) {
                    console.warn(`[SW ${WORKER_VERSION}] Échec de mise en cache pour ${failedCaches.length} ressources`);
                }
                
                await self.skipWaiting();
                return;
            } catch (error) {
                console.error(`[SW ${WORKER_VERSION}] Erreur d'installation:`, error);
                // Continue l'installation même en cas d'erreur
                await self.skipWaiting();
                return;
            }
        })()
    );
});

// Activation avec nettoyage des anciens caches
self.addEventListener('activate', event => {
    console.log(`[SW ${WORKER_VERSION}] Activation`);
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
                        console.log(`[SW ${WORKER_VERSION}] Suppression de l'ancien cache:`, cacheName);
                        return caches.delete(cacheName);
                    })
                );
            } catch (error) {
                console.error(`[SW ${WORKER_VERSION}] Erreur d'activation:`, error);
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
        console.error(`[SW ${WORKER_VERSION}] Erreur dans message handler:`, error);
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
                        console.error(`[SW ${WORKER_VERSION}] Erreur image:`, error);
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
                console.error(`[SW ${WORKER_VERSION}] Erreur API:`, error);
                
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
                console.error(`[SW ${WORKER_VERSION}] Erreur de police:`, error);
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
                console.error(`[SW ${WORKER_VERSION}] Erreur CSS/JS:`, error);
                
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
                console.error(`[SW ${WORKER_VERSION}] Erreur navigation:`, error);
                
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
                console.error(`[SW ${WORKER_VERSION}] Erreur requête par défaut:`, error);
                
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

/* ---------------------- PUSH ------------------------------------------ */
// REMPLACER l'événement push existant par celui-ci
self.addEventListener('push', async event => {
  const pushText = event.data ? event.data.text() : '(sans données)';
  console.log(`[SW v10] Push reçu:`, pushText);

  event.waitUntil((async () => {
    try {
      // Essayer de parser les données en JSON
      let payload;
      try {
        const rawData = event.data ? event.data.json() : {};
        console.log(`[SW v10] Données push détaillées:`, JSON.stringify(rawData));
        
        // Extraire les données correctement, quelle que soit la structure
        payload = rawData.notification || rawData;
      } catch (error) {
        console.error(`[SW v10] Erreur parsing JSON:`, error);
        
        // Pour les données non-JSON, créer un payload simple
        payload = {
          title: 'Actu&Média',
          body: event.data ? event.data.text() : 'Nouvelle notification'
        };
      }

      // Log détaillé du payload extrait
      console.log(`[SW v10] Payload extrait:`, JSON.stringify(payload));

      // Titre et corps du message
      const title = payload.title || (payload.fromUser ? `Message de ${payload.fromUser}` : 'Actu&Média');
      const body = payload.body || 'Notification';

      // Options complètes pour la notification
      const options = {
        body: body,
        icon: '/images/AM-192-v2.png',
        badge: '/images/badge-72x72.png',
        tag: `notif-${Date.now()}`,
        requireInteraction: true,
        renotify: true,
        vibrate: [200, 100, 200],
        data: {
          // Utiliser l'URL du payload si disponible, sinon utiliser le chat
          url: (payload.data && payload.data.url) || 
               (payload.url) || 
               '/?action=openchat',
          type: (payload.data && payload.data.type) || 'notification',
          urgent: true,
          timestamp: Date.now()
        }
      };

      // Log des options finales
      console.log(`[SW v10] Options notification:`, JSON.stringify({
        title,
        options
      }));

      // Afficher la notification
      await self.registration.showNotification(title, options);
      console.log(`[SW v10] Notification affichée avec succès`);
      
      return true;
    } catch (error) {
      console.error(`[SW v10] Erreur notification:`, error);
      
      // Notification de secours en cas d'erreur
      try {
        await self.registration.showNotification('Actu&Média', {
          body: 'Nouvelle notification',
          icon: '/images/AM-192-v2.png'
        });
      } catch (e) {
        console.error(`[SW v10] Erreur ultime:`, e);
      }
      
      return false;
    }
  })());
});

// REMPLACER l'événement notificationclick existant par celui-ci
self.addEventListener('notificationclick', async event => {
  console.log(`[SW ${WORKER_VERSION}] Notification cliquée:`, event.notification.title);
  
  // Fermer la notification
  event.notification.close();
  
  // Ouvrir l'URL ou, par défaut, la page d'accueil avec le chat
  const url = event.notification.data?.url || '/?action=openchat';
  
  // Ouvrir directement dans une nouvelle fenêtre
  event.waitUntil(clients.openWindow(url));
});

// Gestion du changement de souscription push améliorée
self.addEventListener('pushsubscriptionchange', async function(event) {
    console.log(`[SW ${WORKER_VERSION}] Changement de souscription push`);
    
    event.waitUntil((async () => {
        try {
            // Nombre maximum de tentatives
            const MAX_RETRY = 3;
            let retryCount = 0;
            let success = false;
            
            // Récupérer l'ancienne souscription
            const oldSubscription = event.oldSubscription || 
                                   await self.registration.pushManager.getSubscription();
            
            if (!oldSubscription) {
                console.log(`[SW ${WORKER_VERSION}] Pas d'ancienne souscription, rien à faire`);
                return;
            }
            
            // Obtenir la clé d'application
            const applicationServerKey = oldSubscription.options?.applicationServerKey;
            
            // Essayer jusqu'à MAX_RETRY fois
            while (!success && retryCount < MAX_RETRY) {
                try {
                    // S'abonner à nouveau
                    const newSubscription = await self.registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: applicationServerKey
                    });
                    
                    // Informer le serveur du changement
                    const response = await fetch('/api/update-subscription.js', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            oldEndpoint: oldSubscription.endpoint,
                            newSubscription: newSubscription
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error('Échec de mise à jour de l\'abonnement sur le serveur');
                    }
                    
                    // Informer l'application du changement
                    const allClients = await self.clients.matchAll();
                    allClients.forEach(client => {
                        client.postMessage({
                            type: 'SUBSCRIPTION_CHANGED',
                            oldEndpoint: oldSubscription.endpoint,
                            subscription: newSubscription
                        });
                    });
                    
                    success = true;
                    console.log(`[SW ${WORKER_VERSION}] Souscription push mise à jour avec succès`);
                } catch (error) {
                    console.error(`[SW ${WORKER_VERSION}] Erreur lors du renouvellement (tentative ${retryCount + 1}):`, error);
                    retryCount++;
                    
                    // Attendre avant de réessayer (backoff exponentiel)
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
                }
            }
            
            if (!success) {
                console.error(`[SW ${WORKER_VERSION}] Échec de mise à jour de la souscription après plusieurs tentatives`);
            }
        } catch (error) {
            console.error(`[SW ${WORKER_VERSION}] Erreur globale lors du changement de souscription:`, error);
        }
    })());
});

// Amélioration de la gestion des erreurs globales
self.addEventListener('error', function(e) {
    console.error(`[SW ${WORKER_VERSION}] Erreur:`, e.filename, e.lineno, e.colno, e.message);
    // Possibilité d'envoyer les erreurs à un service d'analyse
});

self.addEventListener('unhandledrejection', function(e) {
    console.error(`[SW ${WORKER_VERSION}] Rejet non géré:`, e.reason);
    // Possibilité d'envoyer les erreurs à un service d'analyse
});

// Périodiquement, nettoyer les caches trop anciens
self.addEventListener('periodicsync', async (event) => {
    if (event.tag === 'cache-cleanup') {
        event.waitUntil((async () => {
            try {
                console.log(`[SW ${WORKER_VERSION}] Nettoyage périodique du cache`);
                await cleanupOldCacheEntries();
            } catch (error) {
                console.error(`[SW ${WORKER_VERSION}] Erreur de nettoyage du cache:`, error);
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
                console.log(`[SW ${WORKER_VERSION}] Suppression de l'entrée de cache expirée:`, request.url);
                await cache.delete(request);
            }
        }
    }
}