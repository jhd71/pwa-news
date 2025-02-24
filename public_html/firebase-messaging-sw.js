importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Charger la configuration Firebase depuis le Service Worker Registration
self.addEventListener('message', (event) => {
    if (event.data && event.data.firebaseConfig) {
        firebase.initializeApp(event.data.firebaseConfig);
        const messaging = firebase.messaging();

        messaging.onBackgroundMessage((payload) => {
            console.log('Message reçu en arrière-plan :', payload);
            const notificationTitle = payload.notification.title;
            const notificationOptions = {
                body: payload.notification.body,
                icon: '/images/INFOS-192.png'
            };

            return self.registration.showNotification(notificationTitle, notificationOptions);
        });
    }
});
