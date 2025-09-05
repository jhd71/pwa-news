const CACHE_NAME = 'infos-pwa-v37'; // Incrémenté pour forcer la mise à jour
const API_CACHE_NAME = 'infos-api-cache-v1';

const STATIC_RESOURCES = [
    '/',
    '/index.html',
    '/photos-gallery.html',
    '/mentions-legales.html',
    '/politique-confidentialite.html',
    '/conditions-utilisation.html',
    '/notification.html',
    '/404.html',
    '/500.html',
	'/admin-news.html',
	'/admin-comments.html',
	'/news-locale.html',
	'/autour-de-moi.html',
	'/contact.html',
	'/presentation.html',
    
    // Feuilles de style CSS
    '/css/styles.css',
    '/css/chat-styles.css',
    '/css/news-panel.css',
    '/css/chat-ban.css',
    '/css/widgets.css',
    '/css/settings-styles.css',
    '/css/survey-styles.css',
    '/css/theme-bleuciel.css',
    '/css/tv-tiles-fix.css',
    '/css/background-selector.css',
    '/css/font-settings.css',
    '/css/tile-enhancements.css',
    '/css/gallery-styles.css',
    '/css/donation.css',
	'/css/news-widget.css',
	'/css/cinema-widget.css',
	'/css/football-widget.css',
	'/css/radioPopup.css',
	'/css/notepadApp.css',

    // Scripts JavaScript
    '/js/app.js',
    '/js/app-initializer.js',
    '/js/background-selector.js',
    '/js/ban-check.js',
    '/js/ban-manager.js',
    '/js/chat-keyboard-fix.js',
    '/js/chatManager.js',
    '/js/content.js',
    '/js/donation.js',
    '/js/ios-install.js',
    '/js/news-manager.js',
    '/js/newsPanel.js',
    '/js/newsTickerManager.js',
    '/js/notification-manager.js',
    '/js/quick-links.js',
    '/js/settingsManager.js',
    '/js/sounds.js',
    '/js/supabase-client.js',
    '/js/survey-manager.js',
    '/js/tablet-fixes.js',
    '/js/theme-manager.js',
    '/js/utils.js',
    '/js/weather-widget.js',
    '/js/gallery-manager-v2.js',
    '/js/welcome-manager.js',
    '/js/custom-background-manager.js',
	'/js/news-widget.js',
	'/js/cinema-widget.js',
	'/js/visitor-tracker.js',
	'/js/football-widget.js',
	'/js/ios-fixes-safe.js',
	'/js/expense-manager.js',
	'/js/radioPopup.js',
	'/js/notepadApp.js',
    
    // Fichiers de configuration (seulement ceux qui existent)
    '/manifest.json',
    '/robots.txt',
    '/sitemap.xml',
    '/favicon.ico',
    
    // Images principales et logos (seulement ceux confirmés)
    '/images/Actu&Media.png',
    '/images/ActualitesLocales.png',
    '/images/AM-192-v2.png',
    '/images/AM-512-v2.png',
    '/images/badge-72x72.png',
    '/images/default-news.jpg',
    '/images/don_resized_200x80.png',
    '/images/favicon-16x16.png',
    '/images/favicon-32x32.png',
    '/apple-touch-icon.png',
    '/images/Actu&Media.png',
    '/images/fond-rouge.jpg',
    '/images/fond-dark.jpg',
    
    // Icônes principales INFOS
    '/images/INFOS.png',
    '/images/INFOS-96.png',
    '/images/INFOS-144.png',
    '/images/INFOS-192.png',
    '/images/INFOS-512.png',
    '/images/INFOS-maskable-96.png',
    '/images/INFOS-maskable-144.png',
    '/images/INFOS-maskable-192.png',
    '/images/INFOS-maskable-512.png',
    
    // Icônes spécialisées
    '/images/Football.png',
    '/images/no-image.png',
    '/images/paypal-icon.png',
    '/images/qrcode.png',
    '/images/Radio.png',
    '/images/ReseauxSociaux.png',
    '/images/screenshot-mobile.png',
    '/images/screenshot-wide.png',
    '/images/SPORTS.png',
    '/images/TVenDirect.png',
    
	// Logos des radios
	'/images/radio-logos/france-info.png',
	'/images/radio-logos/Ici-Bourgogne.png',
	'/images/radio-logos/rtl.png',
	'/images/radio-logos/nrj.png',
	'/images/radio-logos/europe1.png',
	'/images/radio-logos/rmc.png',
	'/images/radio-logos/nostalgie.png',
	'/images/radio-logos/cherie-fm.png',
	'/images/radio-logos/Fun-Radio.png',
	'/images/radio-logos/La-Radio-Sans-pub.png',
	'/images/radio-logos/Radio-Prevert.png',
	'/images/radio-logos/Frequence-Plus.png',
	'/images/radio-logos/Skyrock.png',
	'/images/radio-logos/M-Radio.png',

    // Icônes de base (seulement ceux qui existent)
    '/images/icon-144x144.png',
    '/images/icon-192x192.png',
    '/icons/icon-128x128.png',
    '/icons/icon-152x152.png',
    '/icons/icon-384x384.png',
    
    // Icônes des raccourcis
    '/images/chat-icon-96.png',
    '/images/news-icon-96.png',
    '/images/weather-icon-96.png',
    
    // Écrans de démarrage iOS (seulement ceux qui existent)
    '/images/splash-320x470.png',
    '/images/splash-480x640.png',
    '/images/splash-512x512.png',
    '/images/splash-640x1136.png',
    '/images/splash-720x960.png',
    '/images/splash-750x1334.png',
    '/images/splash-960x1280.png',
    '/images/splash-1125x2436.png',
    '/images/splash-1242x2688.png',
    '/images/splash-1280x1920.png',
    '/images/splash-1536x2048.png',
    '/images/splash-1668x2388.png',
    '/images/splash-2048x2732.png',
    
    // GIFs météo
    '/images/weather-gifs/cloudy.gif',
    '/images/weather-gifs/default.gif',
    '/images/weather-gifs/fog.gif',
    '/images/weather-gifs/partly_cloudy.gif',
    '/images/weather-gifs/rain.gif',
    '/images/weather-gifs/snow.gif',
    '/images/weather-gifs/sunny.gif',
    '/images/weather-gifs/thunderstorm.gif',
    
    // Sons
    '/sounds/message.mp3',
	'/sounds/modern.mp3',
	'/sounds/college.mp3',
	'/sounds/pixel.mp3',
	'/sounds/suara.mp3',
	'/sounds/ringtone.mp3',
    '/sounds/notification.mp3',
    '/sounds/click.mp3',
    '/sounds/erreur.mp3',
    '/sounds/success.mp3',
    '/sounds/sent.mp3',
	'/sounds/todo.mp3',
    '/sounds/ban-alert.mp3'
];

const EXTERNAL_RESOURCES = [
    'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
    'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap'
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
    console.log('[ServiceWorker] Installation - Version v11');
    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(CACHE_NAME);
                console.log('[ServiceWorker] Mise en cache globale');
                
                // Au lieu d'utiliser addAll qui échoue si une seule ressource échoue,
                // on met en cache chaque ressource individuellement
                const successfulCaches = [];
                const failedCaches = [];
                
                // Mettre en cache les ressources statiques locales
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
                
                // Mettre en cache les ressources externes
                for (const url of EXTERNAL_RESOURCES) {
                    try {
                        await cache.add(url);
                        successfulCaches.push(url);
                    } catch (error) {
                        // Logger l'erreur mais continuer avec les autres ressources
                        console.warn(`[ServiceWorker] Échec de mise en cache externe: ${url}`, error);
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
    console.log('[ServiceWorker] Activation - Version v11');
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
        case 'CDN':
            handleCdnRequest(event);
            break;
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

// Gestion des requêtes CDN
function handleCdnRequest(event) {
    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(event.request);
            
            if (cachedResponse) {
                // Stale-while-revalidate : retourner la version en cache
                // tout en mettant à jour le cache en arrière-plan
                fetchWithTimeout(event.request, NETWORK_TIMEOUT)
                    .then(response => {
                        if (response.ok) {
                            try {
                                cache.put(event.request, response.clone());
                            } catch (cacheError) {
                                console.warn('[ServiceWorker] Erreur de mise en cache CDN:', cacheError);
                            }
                        }
                    })
                    .catch(error => {
                        console.warn('[ServiceWorker] Échec de revalidation CDN:', error);
                    });
                
                return cachedResponse;
            }
            
            try {
                // Si pas en cache, essayer le réseau
                const response = await fetchWithTimeout(event.request, NETWORK_TIMEOUT);
                if (response.ok) {
                    try {
                        cache.put(event.request, response.clone());
                    } catch (cacheError) {
                        console.warn('[ServiceWorker] Erreur de mise en cache CDN:', cacheError);
                    }
                }
                return response;
            } catch (error) {
                console.error('[ServiceWorker] Erreur CDN:', error);
                
                // Si pas de cache et pas de réseau, on peut essayer des fallbacks pour certaines ressources
                if (event.request.url.includes('Material+Icons')) {
                    // Fallback pour Material Icons
                    return new Response('', { 
                        status: 200,
                        headers: { 'Content-Type': 'text/css' }
                    });
                }
                
                // Pour le reste, échec normal
                throw error;
            }
        })()
    );
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
                            try {
                                cache.put(event.request, response.clone());
                            } catch (cacheError) {
                                console.warn('[ServiceWorker] Erreur de mise en cache image:', cacheError);
                            }
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
                try {
                    cache.put(event.request, response.clone());
                } catch (cacheError) {
                    console.warn('[ServiceWorker] Erreur de mise en cache API:', cacheError);
                }
                
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
                    try {
                        cache.put(event.request, response.clone());
                    } catch (cacheError) {
                        console.warn('[ServiceWorker] Erreur de mise en cache police:', cacheError);
                    }
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
                    try {
                        cache.put(event.request, response.clone());
                    } catch (cacheError) {
                        console.warn('[ServiceWorker] Erreur de mise en cache CSS/JS:', cacheError);
                    }
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
                try {
                    cache.put(event.request, networkResponse.clone());
                } catch (cacheError) {
                    console.warn('[ServiceWorker] Erreur de mise en cache navigation:', cacheError);
                }
                
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
                    try {
                        cache.put(event.request, networkResponse.clone());
                    } catch (cacheError) {
                        console.warn('[ServiceWorker] Erreur de mise en cache par défaut:', cacheError);
                    }
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

/* ---------------------- PUSH ------------------------------------------ */
self.addEventListener('push', event => {
  console.log('[SW] Push reçu ➜', event.data ? event.data.text() : '');

  event.waitUntil((async () => {
    try {
      /* 1) Payload ------------------------------------------------------- */
      let raw;
      try   { raw = event.data ? event.data.json() : {}; }
      catch { raw = { title:'Actu&Média', body: event.data?.text() || '' }; }

      // si vous avez enveloppé dans {notification:{…}} on récupère la vraie partie
      const data = raw.notification ?? raw;

      /* 2) Appli visible ? ---------------------------------------------- */
      const clientsList = await self.clients.matchAll({
        type:'window', includeUncontrolled:true
      });
      const visibleClient = clientsList.find(c => c.visibilityState === 'visible');

      if (visibleClient && data.data?.type === 'chat') {
        visibleClient.postMessage({ type:'PUSH_RECEIVED', data });
        console.log('[SW] App visible → message relayé, pas de notif');
        return;
      }

      /* 3) Construction des options ------------------------------------- */
const urgent = data.data?.urgent === true;
const options = {
  body: data.body || 'Nouvelle notification',
  icon: data.icon || '/images/AM-192-v2.png',
  badge: data.badge || '/images/badge-72x72.png',
  tag: data.tag || `notification-${Date.now()}`,
  
  requireInteraction: urgent,
  renotify: urgent,
  silent: !urgent,
  vibrate: urgent ? [200,100,200,100,200] : undefined,
  
  data: { 
    url: data.data?.url || '/', 
    type: data.data?.type || 'default',
    urgent, 
    ...data.data 
  }
  // Aucune action - le tableau "actions" est supprimé complètement
};


      /* 4) Affiche ------------------------------------------------------- */
      await self.registration.showNotification(
        data.title || 'Actu&Média',
        options
      );
      console.log('[SW] Notification affichée');
    } catch(err){
      console.error('[SW] Erreur push :', err);
      await self.registration.showNotification('Actu&Média',{
        body : 'Nouvelle notification',
        icon : '/images/AM-192-v2.png',
        badge: '/images/badge-72x72.png'
      });
    }
  })());
});

// Gestionnaire ULTRA-SIMPLIFIÉ spécial Android
self.addEventListener('notificationclick', function(event) {
    // Fermer immédiatement la notification
    event.notification.close();
    
    // URL à ouvrir, avec priorité au type chat
    let url = '/';
    
    // Priorité au type de notification
    if (event.notification.data) {
        if (event.notification.data.type === 'chat') {
            url = '/?action=openchat';
        } else if (event.notification.data.url) {
            url = event.notification.data.url;
        }
    }
    
    // Ouvrir directement
    event.waitUntil(clients.openWindow(url));
});

// Gestion du changement de souscription push améliorée
self.addEventListener('pushsubscriptionchange', async function(event) {
    console.log('[ServiceWorker] Changement de souscription push');
    
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
                console.log('[ServiceWorker] Pas d\'ancienne souscription, rien à faire');
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
                    console.log('[ServiceWorker] Souscription push mise à jour avec succès');
                } catch (error) {
                    console.error(`[ServiceWorker] Erreur lors du renouvellement (tentative ${retryCount + 1}):`, error);
                    retryCount++;
                    
                    // Attendre avant de réessayer (backoff exponentiel)
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
                }
            }
            
            if (!success) {
                console.error('[ServiceWorker] Échec de mise à jour de la souscription après plusieurs tentatives');
            }
        } catch (error) {
            console.error('[ServiceWorker] Erreur globale lors du changement de souscription:', error);
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