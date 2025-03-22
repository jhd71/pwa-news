// service-worker.js
// Ce fichier doit être placé à la racine de votre projet

const CACHE_NAME = 'actu-media-v1.5';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/css/chat-styles.css',
  '/css/news-panel.css',
  '/js/content.js',
  '/js/chatManager.js',
  '/js/sounds.js',
  '/js/newsTickerManager.js',
  '/js/newsPanel.js',
  '/js/weather-widget.js',
  '/js/splash-screen.js',
  '/js/ios-install.js',
  '/images/Actu&Media.png',
  '/images/AM-192-v2.png',
  '/images/AM-512-v2.png',
  '/sounds/message.mp3',
  '/sounds/sent.mp3',
  '/sounds/notification.mp3',
  '/sounds/click.mp3',
  '/sounds/erreur.mp3',
  '/sounds/success.mp3'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installation');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Mise en cache globale');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[ServiceWorker] Erreur de mise en cache:', error);
      })
  );
});

// Activation et nettoyage des caches obsolètes
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activation');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.filter(cacheName => {
            return cacheName !== CACHE_NAME;
          }).map(cacheName => {
            console.log('[ServiceWorker] Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Revendication des clients');
        return self.clients.claim();
      })
  );
});

// Stratégie de cache : Network First, fallback to Cache
self.addEventListener('fetch', event => {
  // Pour les requêtes d'API, toujours aller au réseau
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(error => {
          console.error('[ServiceWorker] Erreur de récupération API:', error);
          return new Response(JSON.stringify({ 
            error: 'Réseau indisponible',
            offline: true 
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Pour les autres ressources, essayer le réseau d'abord, puis le cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la réponse est valide, la mettre en cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // En cas d'échec du réseau, essayer le cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Fallback pour les pages HTML
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // Si la ressource n'est pas dans le cache, retourner une erreur
            return new Response('Ressource non disponible hors ligne', {
              status: 503,
              statusText: 'Service indisponible'
            });
          });
      })
  );
});

// Gestion des notifications push
self.addEventListener('push', event => {
  console.log('[Service Worker] Notification push reçue', event);
  
  if (!event.data) {
    console.log('[Service Worker] Pas de données dans l\'événement push');
    return;
  }
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Nouveau message',
      icon: data.icon || '/images/AM-192-v2.png',
      badge: data.badge || '/images/AM-192-v2.png',
      vibrate: [100, 50, 100, 50, 100, 50, 100],
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: 'Ouvrir',
          icon: '/images/AM-192-v2.png'
        }
      ],
      // Fermer automatiquement après 5 secondes pour éviter l'accumulation de notifications
      requireInteraction: false,
      tag: 'chat-message'
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Actu & Média', options)
    );
  } catch (error) {
    console.error('[Service Worker] Erreur traitement notification:', error);
    
    // Fallback en cas d'erreur de parsing
    event.waitUntil(
      self.registration.showNotification('Nouveau message', {
        body: 'Vous avez reçu un nouveau message dans le chat',
        icon: '/images/AM-192-v2.png',
        badge: '/images/AM-192-v2.png'
      })
    );
  }
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification cliquée', event);
  
  event.notification.close();
  
  // Action par défaut: ouvrir l'application
  let targetUrl = '/';
  
  // Si des données personnalisées sont présentes, utiliser l'URL spécifiée
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }
  
  // Gérer les différentes actions disponibles
  if (event.action === 'open') {
    targetUrl = '/';
  }
  
  // Ouvrir ou réutiliser une fenêtre existante
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        // Vérifier s'il y a une fenêtre ouverte et la réutiliser
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Revenir à la fenêtre existante
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        
        // Sinon, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Gérer SKIP_WAITING pour mise à jour immédiate
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[ServiceWorker] Skip waiting demandé');
    self.skipWaiting();
  }
});
