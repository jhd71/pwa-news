importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// 📌 Initialiser Firebase avec des valeurs par défaut (remplacées par le message plus tard)
const firebaseConfig = {
    apiKey: "DEFAULT",
    authDomain: "DEFAULT",
    projectId: "DEFAULT",
    storageBucket: "DEFAULT",
    messagingSenderId: "DEFAULT",
    appId: "DEFAULT",
    measurementId: "DEFAULT"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 📌 Attendre le bon message pour charger la config Firebase
self.addEventListener('message', (event) => {
    if (event.data && event.data.firebaseConfig) {
        firebase.initializeApp(event.data.firebaseConfig);
        console.log("✅ Firebase Messaging configuré dans le Service Worker.");
    }
});

// 📌 Gérer les notifications reçues en arrière-plan
messaging.onBackgroundMessage((payload) => {
    console.log('📩 Message reçu en arrière-plan :', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/images/INFOS-192.png',
        badge: '/images/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: payload.data || {},
        tag: `chat-message-${Date.now()}`,
        requireInteraction: true
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 📌 Gérer le clic sur la notification
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notification cliquée :', event.notification);

    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow('/');
        })
    );
});
