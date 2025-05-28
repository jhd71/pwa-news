// ios-detector.js - Version optimisée
(function() {
    // Détection iOS améliorée (inclut iPad Pro récents)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    const isIOSSafari = isIOS && /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);

    if (isIOS) {
        console.log("Appareil iOS détecté - Chargement des optimisations");
        
        // Ajouter des classes aux éléments racine
        document.documentElement.classList.add('ios-device');
        document.body.classList.add('ios-device');
        
        // Ajouter classe spécifique Safari
        if (isIOSSafari) {
            document.documentElement.classList.add('ios-safari');
            document.body.classList.add('ios-safari');
        }
        
        // Charger le CSS spécifique à iOS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/ios-specific.css';
        link.id = 'ios-specific-css';
        document.head.appendChild(link);
        
        // Exposer ces informations pour d'autres scripts
        window.isIOSDevice = true;
        window.isIOSSafari = isIOSSafari;
        
        // Détecter la version d'iOS (pour les correctifs spécifiques)
        const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
        if (match) {
            window.iOSVersion = {
                major: parseInt(match[1], 10),
                minor: parseInt(match[2], 10),
                patch: parseInt(match[3] || 0, 10)
            };
            console.log("Version iOS détectée:", window.iOSVersion);
            
            // Ajouter classe pour version iOS spécifique
            document.documentElement.classList.add(`ios-${window.iOSVersion.major}`);
        }
        
        // Détecter si c'est une PWA (mode standalone)
        if (window.navigator.standalone) {
            document.documentElement.classList.add('ios-standalone');
            document.body.classList.add('ios-standalone');
            console.log("Mode PWA standalone détecté sur iOS");
        }
        
        // Détecter les modèles spécifiques pour des corrections ciblées
        const userAgent = navigator.userAgent;
        if (userAgent.includes('iPhone')) {
            document.documentElement.classList.add('ios-iphone');
            
            // Détecter iPhone X/11/12/13/14/15 avec notch
            if (window.screen.height === 812 || window.screen.height === 844 || 
                window.screen.height === 896 || window.screen.height === 926) {
                document.documentElement.classList.add('ios-notch');
            }
        } else if (userAgent.includes('iPad')) {
            document.documentElement.classList.add('ios-ipad');
        }
        
        // Corrections immédiate pour iOS
        document.addEventListener('DOMContentLoaded', function() {
            // Fix pour la hauteur viewport
            function setIOSVH() {
                let vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
                document.documentElement.style.setProperty('--real-vh', `${window.innerHeight}px`);
            }
            
            setIOSVH();
            window.addEventListener('resize', setIOSVH);
            window.addEventListener('orientationchange', () => {
                setTimeout(setIOSVH, 500);
            });
            
            // Rendre la fonction disponible globalement
            window.setIOSVH = setIOSVH;
        });
        
    } else {
        console.log("Non-iOS - Optimisations iOS ignorées");
        window.isIOSDevice = false;
        window.isIOSSafari = false;
    }
})();