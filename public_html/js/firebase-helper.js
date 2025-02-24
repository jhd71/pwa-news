class FirebaseHelper {
    static async initializeInServiceWorker() {
        // Cette méthode sera appelée au besoin
        // sans toucher à votre ChatManager
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                
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
                
                // Envoyer la configuration au service worker
                registration.active.postMessage({
                    firebaseConfig: firebaseConfig
                });
                
                console.log('Configuration Firebase envoyée au service worker');
                return true;
            } catch (error) {
                console.error('Erreur configuration Firebase:', error);
                return false;
            }
        }
        return false;
    }
}

export default FirebaseHelper;