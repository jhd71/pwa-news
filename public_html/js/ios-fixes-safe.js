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
            
            /* Ajouter un padding en haut du body pour l'espace iOS */
            .ios-device {
                padding-top: var(--ios-safe-area-top);
            }
            
            /* Fix pour le header - ajuster l'espacement et l'alignement */
            .ios-device .app-header {
                padding-top: 10px;
                position: relative;
                z-index: 100;
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-height: 60px;
            }
            
            /* Centrer le titre du site */
            .ios-device .app-header .site-title {
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
                margin: 0;
                white-space: nowrap;
            }
            
            /* S'assurer que les boutons flottants restent à leur place normale */
            .ios-device .fuel-button,
            .ios-device .search-button {
                /* Pas de modification, ils gardent leur position CSS d'origine */
            }
            
            /* Fix pour la navigation du bas si elle touche le bas de l'écran */
            .ios-device .bottom-nav {
                padding-bottom: env(safe-area-inset-bottom, 0);
            }
        `;
        document.head.appendChild(style);
        
        // Log pour debug
        console.log('iOS fixes appliqués - version minimale');
    }
});