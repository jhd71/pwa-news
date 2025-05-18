// ios-detector.js
(function() {
    // Détecter uniquement les appareils iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
        console.log("Appareil iOS détecté - Chargement des optimisations");
        
        // Ajouter une classe au HTML aussi (pas seulement au body)
        document.documentElement.classList.add('ios-device');
        document.body.classList.add('ios-device');
        
        // Charger le CSS spécifique à iOS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/ios-specific.css';
        link.id = 'ios-specific-css';
        document.head.appendChild(link);
        
        // Exposer cette information pour d'autres scripts
        window.isIOSDevice = true;
        
        // Détecter la version d'iOS (pour les correctifs spécifiques)
        const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
        if (match) {
            window.iOSVersion = {
                major: parseInt(match[1], 10),
                minor: parseInt(match[2], 10),
                patch: parseInt(match[3] || 0, 10)
            };
            console.log("Version iOS détectée:", window.iOSVersion);
        }
    }
})();