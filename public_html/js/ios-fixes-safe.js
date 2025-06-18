// Détection iOS
function isiOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Application des fixes iOS
if (isiOS()) {
    // Ajouter une classe au body pour cibler iOS
    document.body.classList.add('ios-device');
    
    // Créer et ajouter les styles CSS pour iOS
    const style = document.createElement('style');
    style.textContent = `
        /* Ajuster l'espace en haut pour la barre d'état iOS */
        .ios-device {
            padding-top: env(safe-area-inset-top, 20px);
        }
        
        /* Ajuster le header principal */
        .ios-device header,
        .ios-device .header,
        .ios-device #header {
            margin-top: env(safe-area-inset-top, 20px);
        }
        
        /* Ajuster la position des boutons menu et paramètres */
        .ios-device .menu-button,
        .ios-device .settings-button,
        .ios-device [class*="menu"],
        .ios-device [class*="settings"],
        .ios-device button:first-child,
        .ios-device button:last-child {
            top: calc(env(safe-area-inset-top, 20px) + 10px);
        }
        
        /* Ajuster le logo */
        .ios-device .logo,
        .ios-device h1,
        .ios-device .site-title,
        .ios-device [class*="logo"] {
            margin-top: calc(env(safe-area-inset-top, 20px) + 5px);
        }
        
        /* Si les éléments sont en position fixed */
        .ios-device .fixed,
        .ios-device [style*="position: fixed"],
        .ios-device [style*="position:fixed"] {
            padding-top: env(safe-area-inset-top, 20px);
        }
        
        /* Ajustement supplémentaire pour le conteneur principal */
        .ios-device main,
        .ios-device .main-content,
        .ios-device #main {
            margin-top: calc(env(safe-area-inset-top, 20px) + 60px);
        }
    `;
    document.head.appendChild(style);
}