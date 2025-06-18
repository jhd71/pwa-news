// Détection iOS
function isiOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Application des fixes iOS au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    if (isiOS()) {
        // Ajouter une classe au body pour cibler iOS
        document.body.classList.add('ios-device');
        
        // Créer et ajouter les styles CSS pour iOS
        const style = document.createElement('style');
        style.textContent = `
            /* Variables pour les espacements iOS */
            :root {
                --ios-safe-area-top: env(safe-area-inset-top, 20px);
            }
            
            /* Décaler le header fixe pour iOS */
            .ios-device .app-header {
                top: var(--ios-safe-area-top) !important;
            }
            
            /* Ajuster le bouton paramètres qui a aussi position:fixed */
            .ios-device .settings-button {
                top: calc(3px + var(--ios-safe-area-top)) !important;
            }
            
            /* Ajouter un padding au body pour compenser le header décalé */
            .ios-device body {
                padding-top: calc(55px + var(--ios-safe-area-top));
            }
            
            /* Fix pour la navigation du bas si elle touche le bas de l'écran */
            .ios-device .bottom-nav {
                padding-bottom: env(safe-area-inset-bottom, 0);
            }
            
            /* S'assurer que les modales et sidebars commencent sous la safe area */
            .ios-device .sidebar,
            .ios-device .settings-panel,
            .ios-device .news-panel {
                top: var(--ios-safe-area-top);
                height: calc(100% - var(--ios-safe-area-top));
            }
        `;
        document.head.appendChild(style);
        
        // Log pour debug
        console.log('iOS fixes appliqués - Header et Settings button ajustés');
    }
});