// Tentative d'initialisation Firebase sans perturber le chat
document.addEventListener('DOMContentLoaded', async () => {
  // Attendre quelques secondes pour que le chat soit initialisé
  setTimeout(async () => {
    try {
      // Initialiser Firebase en chargeant les scripts depuis le CDN
      if (typeof firebase === 'undefined') {
        console.log('Chargement des scripts Firebase...');
        await loadScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
        await loadScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');
      }

      // Configuration Firebase
      const firebaseConfig = {
        apiKey: "AIzaSyDGC0jBKzFYpv2dSsgrKAZlzMirTjqKjpk",
        authDomain: "jhd71-fbe56.firebaseapp.com",
        projectId: "jhd71-fbe56",
        storageBucket: "jhd71-fbe56.firebasestorage.app",
        messagingSenderId: "669167096860",
        appId: "1:669167096860:web:d46d695cd8a56571ee3bd9",
        measurementId: "G-E61V8DTJ2W"
      };

      // Initialiser Firebase
      if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialisé');
      }

      // Configurer le service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        // Envoyer la configuration au service worker
        if (registration.active) {
          registration.active.postMessage({
            firebaseConfig: firebaseConfig
          });
          console.log('Configuration Firebase envoyée au service worker');
        }
      }

      // Demander la permission pour les notifications
      if (typeof firebase !== 'undefined' && typeof firebase.messaging === 'function') {
        const messaging = firebase.messaging();
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            messaging.getToken({
  vapidKey: "BApNrfnS3PmDhWU0g21VynEMx6mpDfgpWWUlw15qObjjJ3F0G_KElbyU38YAOtNXScP4_khAPuJG0RSfZeV37mU"
}).then(token => {
  console.log('Token FCM obtenu :', token);
            }).catch(err => {
              console.error('Erreur lors de l\'obtention du token Firebase :', err);
            });
          }
        });
        
        // Gestion des messages en premier plan
        messaging.onMessage(payload => {
          console.log('Message reçu en premier plan:', payload);
        });
      }
    } catch (error) {
      console.error('Erreur Firebase (non bloquante):', error);
    }
  }, 3000); // Délai de 3 secondes
});

// Fonction pour charger un script
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}