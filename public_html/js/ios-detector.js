// ios-detector.js
(function() {
    // Détecter uniquement les appareils iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
        // Charger le CSS spécifique à iOS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/ios-specific.css'; // Suppression du slash initial
        document.head.appendChild(link);
        document.body.classList.add('ios-device');
        
        // Exposer cette information pour d'autres scripts
        window.isIOSDevice = true;
    }
})();