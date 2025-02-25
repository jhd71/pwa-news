// Vérifier si Firebase est déjà chargé
document.addEventListener('DOMContentLoaded', async () => {
  // Attendre un peu pour éviter les conflits
  setTimeout(async () => {
    try {
      // Charger les scripts Firebase si nécessaire
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
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialisé');
      }

      // Configurer service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
          registration.active.postMessage({
            type: 'FIREBASE_CONFIG',
            firebaseConfig: firebaseConfig
          });
          console.log('Configuration Firebase envoyée au service worker');
        }
      }

      // Initialiser Messaging
      const messaging = firebase.messaging();
      
      if (Notification.permission === 'granted') {
        try {
          const token = await messaging.getToken({
            vapidKey: "BApNrfnS3PmDhWU0g21VynEMx6mpDfgpWWUlw15qObjjJ3F0G_KElbyU38YAOtNXScP4_khAPuJG0RSfZeV37mU"
          });
          console.log('Token FCM obtenu:', token);
          localStorage.setItem('fcmToken', token);
          
          // Enregistrer le token dans Supabase
          if (window.chatManager && window.chatManager.pseudo) {
            try {
              // Supprimer les anciennes entrées
              await window.chatManager.supabase
                .from('fcm_tokens')
                .delete()
                .eq('user_id', window.chatManager.pseudo);
                
              // Insérer le nouveau token
              const { error } = await window.chatManager.supabase
                .from('fcm_tokens')
                .insert({
                  user_id: window.chatManager.pseudo,
                  token: token,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
                
              if (!error) {
                console.log('Token FCM enregistré dans Supabase');
              }
            } catch (err) {
              console.error('Erreur enregistrement token:', err);
            }
          }
        } catch (error) {
          console.error('Erreur obtention token:', error);
        }
      }
      
      // Écouter les messages en premier plan
      messaging.onMessage(payload => {
        console.log('Message reçu:', payload);
        if (payload.notification) {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/images/INFOS-192.png'
          });
        }
      });
    } catch (error) {
      console.error('Erreur Firebase:', error);
    }
  }, 2000);
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
