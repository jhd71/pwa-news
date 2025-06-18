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
            
			/* Ajustement spécifique pour le widget local-news sur iPhone */
			.ios-device .local-news-widget {
			margin-top: 21vh !important; /* ajuste la valeur à ton goût */
			}

			/* Monter la barre d'infos défilante sur iPhone */
			.ios-device .news-ticker {
			bottom: 75px !important; /* Ajuste la hauteur selon le footer ou widgets */
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
            
            /* Fix pour les widgets qui doivent être visibles sur iOS */
            .ios-device .weather-sidebar.visible,
            .ios-device .quick-links-sidebar.visible {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
            
            /* Fix pour les boutons flottants sur iOS - météo et liens rapides */
            .ios-device .weather-mobile-btn,
            .ios-device .weather-show-btn {
                top: calc(70px + var(--ios-safe-area-top)) !important;
            }
            
            .ios-device .quick-links-show-btn {
                top: calc(70px + var(--ios-safe-area-top)) !important;
            }
            
            /* Fix pour les boutons carburant et recherche */
            .ios-device .fuel-button {
                top: calc(70px + var(--ios-safe-area-top)) !important;
            }
            
            .ios-device .search-button {
                top: calc(70px + var(--ios-safe-area-top)) !important;
            }
            
            /* Fix pour le bouton Infos en direct sur iOS mobile uniquement */
            @media (max-width: 768px) {
                .ios-device .news-button {
                    position: fixed !important;
                    top: calc(70px + var(--ios-safe-area-top)) !important;
                    left: 50% !important;
                    transform: translateX(-50%) !important;
                    z-index: 999 !important;
                    
                    /* Style circulaire comme les autres boutons */
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    background: var(--primary-color) !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
                }
                
            }
        `;
        document.head.appendChild(style);
        
        // Log pour debug
        console.log('iOS fixes appliqués - Header et Settings button ajustés');
        		
        // Fix pour restaurer l'état des widgets sur iOS
        setTimeout(() => {
            // Vérifier l'état sauvegardé du widget météo
            const weatherHidden = localStorage.getItem('weatherWidgetHidden');
            const weatherWidget = document.querySelector('.weather-sidebar');
            
            if (weatherWidget && weatherHidden !== 'true') {
                // Si le widget n'était pas explicitement masqué, le garder masqué par défaut
                // mais s'assurer qu'il peut être affiché
                weatherWidget.classList.remove('visible');
                weatherWidget.style.display = 'none';
                console.log('Widget météo configuré pour iOS');
            }
            
            // Vérifier l'état sauvegardé du widget liens rapides
            const quickLinksHidden = localStorage.getItem('quickLinksHidden');
            const quickLinksWidget = document.querySelector('.quick-links-sidebar');
            
            if (quickLinksWidget && quickLinksHidden !== 'true') {
                // Même logique pour les liens rapides
                quickLinksWidget.classList.remove('visible');
                quickLinksWidget.style.display = 'none';
                console.log('Widget liens rapides configuré pour iOS');
            }
            
            // S'assurer que les boutons d'affichage sont visibles
            const weatherShowBtn = document.getElementById('weatherShowBtn');
            const quickLinksShowBtn = document.getElementById('quickLinksShowBtn');
            
            if (weatherShowBtn) {
                weatherShowBtn.style.display = 'flex';
                weatherShowBtn.style.opacity = '1';
            }
            
            if (quickLinksShowBtn) {
                quickLinksShowBtn.style.display = 'flex';
                quickLinksShowBtn.style.opacity = '1';
            }
        }, 1000);
    }
});

// Fonction globale pour afficher les widgets si nécessaire
window.forceShowWidgets = function() {
    const weatherWidget = document.querySelector('.weather-sidebar');
    const quickLinksWidget = document.querySelector('.quick-links-sidebar');
    
    if (weatherWidget) {
        weatherWidget.classList.add('visible');
        weatherWidget.style.display = 'block';
        weatherWidget.style.visibility = 'visible';
        weatherWidget.style.opacity = '1';
    }
    
    if (quickLinksWidget) {
        quickLinksWidget.classList.add('visible');
        quickLinksWidget.style.display = 'block';
        quickLinksWidget.style.visibility = 'visible';
        quickLinksWidget.style.opacity = '1';
    }
	
};