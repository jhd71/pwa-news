importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDGC0jBKzFYpv2dSsgrKAZlzMirTjqKjpk",
    authDomain: "jhd71-fbe56.firebaseapp.com",
    projectId: "jhd71-fbe56",
    storageBucket: "jhd71-fbe56.firebasestorage.app",
    messagingSenderId: "669167096860",
    appId: "1:669167096860:web:d46d695cd8a56571ee3bd9",
    measurementId: "G-E61V8DTJ2W"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/images/INFOS-192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});