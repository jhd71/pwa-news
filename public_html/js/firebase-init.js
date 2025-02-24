// Vérifier si Firebase est déjà chargé
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Charger les scripts Firebase si absents
    if (typeof firebase === 'undefined') {
      console.log('Chargement des scripts Firebase...');
      await loadScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');
    }

    // Charger la configuration Firebase depuis les variables d'environnement
    const firebaseConfig = {
      apiKey: window.env.VITE_FIREBASE_API_KEY,
      authDomain: window.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: window.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: window.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: window.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: window.env.VITE_FIREBASE_APP_ID,
      measurementId: window.env.VITE_FIREBASE_MEASUREMENT_ID
    };

    // Initialiser Firebase si ce n'est pas déjà fait
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      console.log('Firebase initialisé');
    }

    // Enregistrer le Service Worker pour Firebase Messaging
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then(registration => {
          console.log('Service Worker Firebase enregistré:', registration);

          // Envoyer la config Firebase au SW
          if (registration.active) {
            registration.active.postMessage({ firebaseConfig });
            console.log('Configuration Firebase envoyée au service worker');
          }
        })
        .catch(error => console.error('Erreur Service Worker Firebase:', error));
    }

    // Initialisation des notifications
    const messaging = firebase.messaging();

    // Demander la permission pour recevoir les notifications
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await messaging.getToken({ vapidKey: window.env.VITE_FIREBASE_VAPID_PUBLIC_KEY });
      console.log('Token FCM obtenu :', token);
      
      // TODO: Enregistrer le token dans Supabase si besoin
    } else {
      console.warn('Permission de notification refusée.');
    }

    // Écouter les messages en premier plan
    messaging.onMessage(payload => {
      console.log('Message reçu en premier plan:', payload);
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/images/INFOS-192.png'
      });
    });

  } catch (error) {
    console.error('Erreur initialisation Firebase:', error);
  }
});

// Fonction pour charger un script dynamiquement
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
