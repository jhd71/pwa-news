// Vérifier si Firebase est déjà chargé
document.addEventListener('DOMContentLoaded', async () => {
  // Attendre un peu pour éviter les conflits avec le service worker principal
  setTimeout(async () => {
    try {
      // Charger les scripts Firebase si absents
      if (typeof firebase === 'undefined') {
        console.log('Chargement des scripts Firebase...');
        await loadScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
        await loadScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');
      }

      // Configuration Firebase avec des valeurs en dur pour éviter les problèmes
      const firebaseConfig = {
        apiKey: "AIzaSyDGC0jBKzFYpv2dSsgrKAZlzMirTjqKjpk",
        authDomain: "jhd71-fbe56.firebaseapp.com",
        projectId: "jhd71-fbe56",
        storageBucket: "jhd71-fbe56.firebasestorage.app",
        messagingSenderId: "669167096860",
        appId: "1:669167096860:web:d46d695cd8a56571ee3bd9",
        measurementId: "G-E61V8DTJ2W"
      };

      // Initialiser Firebase si ce n'est pas déjà fait
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialisé');
      }

      // Service worker unique - vérifier si un service worker principal est déjà enregistré
      if ('serviceWorker' in navigator) {
        try {
          // Utiliser le service worker principal si déjà enregistré
          const existingRegistration = await navigator.serviceWorker.ready;
          
          // Envoyer la config Firebase au service worker existant
          if (existingRegistration.active) {
            existingRegistration.active.postMessage({ 
              type: 'FIREBASE_CONFIG',
              firebaseConfig: firebaseConfig 
            });
            console.log('Configuration Firebase envoyée au service worker existant');
          }
        } catch (error) {
          console.warn('Aucun service worker actif trouvé, enregistrement reporté');
        }
      }

      // Initialisation des notifications si Firebase est chargé
      if (typeof firebase !== 'undefined' && firebase.messaging) {
        try {
          const messaging = firebase.messaging();
          
          // Demander la permission pour recevoir les notifications
          if (Notification.permission === 'granted') {
            try {
              const token = await messaging.getToken({ 
                vapidKey: "BApNrfnS3PmDhWU0g21VynEMx6mpDfgpWWUlw15qObjjJ3F0G_KElbyU38YAOtNXScP4_khAPuJG0RSfZeV37mU" 
              });
              console.log('Token FCM obtenu :', token);
              
              // Stocker le token dans le localStorage
              localStorage.setItem('fcmToken', token);
              
              // Si l'utilisateur est connecté, enregistrez le token dans Supabase
if (window.chatManager && window.chatManager.pseudo) {
  try {
    // D'abord, supprimez les anciennes entrées pour cet utilisateur
    await window.chatManager.supabase
      .from('fcm_tokens')
      .delete()
      .eq('user_id', window.chatManager.pseudo);
      
    // Ensuite, insérez un nouveau token
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
    } else {
      throw error;
    }
  } catch (err) {
    console.error('Erreur enregistrement token:', err);
  }
}
          
          // Écouter les messages en premier plan
          messaging.onMessage(payload => {
            console.log('Message reçu en premier plan:', payload);
            if (payload.notification) {
              new Notification(payload.notification.title, {
                body: payload.notification.body,
                icon: '/images/INFOS-192.png'
              });
            }
          });
        } catch (messagingError) {
          console.error('Erreur Firebase Messaging:', messagingError);
        }
      }
    } catch (error) {
      console.error('Erreur initialisation Firebase:', error);
    }
  }, 2000); // Délai de 2 secondes
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
