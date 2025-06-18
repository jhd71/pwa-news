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
            
            /* Fix pour le header principal sur iOS */
            .ios-device .app-header {
                position: relative;
                top: var(--ios-safe-area-top);
                margin-bottom: var(--ios-safe-area-top);
            }
            
            /* Ajuster le conteneur principal pour compenser le décalage du header */
            .ios-device .weather-sidebar,
            .ios-device .fuel-button,
            .ios-device .search-button,
            .ios-device .swiper-container,
            .ios-device .widgets-row,
            .ios-device main {
                position: relative;
                top: var(--ios-safe-area-top);
            }
            
            /* Fix pour les boutons flottants (fuel et search) */
            .ios-device .fuel-button,
            .ios-device .search-button {
                top: calc(80px + var(--ios-safe-area-top));
            }
            
            /* Ajuster le widget météo si nécessaire */
            .ios-device .weather-sidebar {
                top: calc(60px + var(--ios-safe-area-top));
            }
            
            /* S'assurer que le contenu n'est pas caché derrière le header */
            .ios-device body {
                padding-top: var(--ios-safe-area-top);
            }
            
            /* Fix pour le ticker en bas si nécessaire */
            .ios-device .news-ticker {
                margin-bottom: env(safe-area-inset-bottom, 0);
            }
            
            /* Fix pour la navigation du bas */
            .ios-device .bottom-nav {
                padding-bottom: env(safe-area-inset-bottom, 0);
            }
        `;
        document.head.appendChild(style);
        
        // Log pour debug
        console.log('iOS fixes appliqués');
    }
});