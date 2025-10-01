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
                --ios-safe-area-bottom: env(safe-area-inset-bottom, 0px);
            }
            
            /* Ajustement spécifique pour le widget local-news sur iPhone */
            .ios-device .local-news-widget {
                margin-top: 21vh !important;
            }

            /* Monter la barre d'infos défilante sur iPhone */
            .ios-device .news-ticker {
                bottom: 70px !important;
            }

            /* Décaler le header fixe pour iOS */
            .ios-device .app-header {
                top: var(--ios-safe-area-top) !important;
                z-index: 1000 !important;
                position: fixed !important;
                left: 0 !important;
                right: 0 !important;
            }
            
            /* Ajuster le bouton paramètres qui a aussi position:fixed */
            .ios-device .settings-button {
                top: calc(3px + var(--ios-safe-area-top)) !important;
            }
            
            /* Ajouter un padding au body pour compenser le header décalé */
            .ios-device body {
                padding-top: calc(55px + var(--ios-safe-area-top));
            }
            
            /* ========== CORRECTIONS CHAT iOS ========== */
            
            /* 1. Fix z-index et position du chat sur iOS */
            .ios-device .chat-widget {
                z-index: 995 !important;
            }
            
            .ios-device .chat-container {
                z-index: 996 !important;
                position: fixed !important;
            }

            .ios-device .chat-container.open {
                /* Limiter la hauteur pour ne pas cacher la nav du bas */
                height: calc(100vh - var(--ios-safe-area-top) - var(--ios-safe-area-bottom) - 140px) !important;
                max-height: calc(100vh - var(--ios-safe-area-top) - var(--ios-safe-area-bottom) - 140px) !important;
                
                /* Position ajustée pour iOS */
                bottom: calc(70px + var(--ios-safe-area-bottom)) !important;
                
                /* S'assurer que le chat ne dépasse pas en haut */
                top: auto !important;
                
                /* Sur mobile iOS */
                width: 100% !important;
                right: 0 !important;
                left: 0 !important;
                border-radius: 20px 20px 0 0 !important;
            }

            /* 2. Protection de la navigation du bas */
            .ios-device .bottom-nav {
                z-index: 999 !important;
                position: fixed !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                backdrop-filter: blur(10px) !important;
                -webkit-backdrop-filter: blur(10px) !important;
                padding-bottom: var(--ios-safe-area-bottom) !important;
            }

            /* 3. Protection des boutons flottants du haut */
            .ios-device .weather-mobile-btn,
            .ios-device .weather-show-btn,
            .ios-device .quick-links-show-btn,
            .ios-device .tool-button,
            .ios-device .search-button,
            .ios-device .news-button {
                z-index: 990 !important;
            }

            /* 4. Zone de messages adaptée pour iOS */
            .ios-device .chat-messages {
                height: calc(100% - 170px) !important;
                max-height: calc(100vh - var(--ios-safe-area-top) - var(--ios-safe-area-bottom) - 250px) !important;
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch !important;
                overscroll-behavior: contain !important;
            }
			
			/* 5. Zone de saisie toujours visible */
            .ios-device .chat-input {
                position: sticky !important;
                bottom: 0 !important;
                z-index: 10 !important;
                padding-bottom: calc(10px + var(--ios-safe-area-bottom)) !important;
            }

            /* 6. Ajustements spécifiques pour iPhone avec encoche */
            @supports (padding: env(safe-area-inset-top)) {
                .ios-device .chat-container.open {
                    height: calc(90vh - 44px - env(safe-area-inset-top) - 70px - env(safe-area-inset-bottom)) !important;
                    max-height: calc(100vh - 44px - env(safe-area-inset-top) - 70px - env(safe-area-inset-bottom)) !important;
                }
            }

            /* 7. Mode paysage iOS */
            @media (orientation: landscape) {
                .ios-device .chat-container.open {
                    height: calc(100vh - var(--ios-safe-area-top) - var(--ios-safe-area-bottom) - 100px) !important;
                    max-height: calc(100vh - var(--ios-safe-area-top) - var(--ios-safe-area-bottom) - 100px) !important;
                }
            }

            /* 8. Fix pour le bouton toggle du chat */
            .ios-device .chat-toggle {
                bottom: calc(90px + var(--ios-safe-area-bottom)) !important;
                z-index: 995 !important;
            }

            /* 9. Protection contre le chevauchement avec le clavier */
            .ios-device.keyboard-visible .chat-container {
                height: calc(50vh - var(--ios-safe-area-top)) !important;
                transition: height 0.3s ease !important;
            }

            /* 10. Fix input pour éviter le zoom sur iOS */
            .ios-device .chat-input textarea,
            .ios-device .chat-login input {
                font-size: 16px !important;
                -webkit-text-size-adjust: 100% !important;
            }

            /* 11. Ajustements pour tablettes iPad */
            @media (min-width: 768px) {
                .ios-device .chat-container.open {
                    width: 400px !important;
                    right: 20px !important;
                    left: auto !important;
                    height: 60vh !important;
                    max-height: 60vh !important;
                }
            }

            /* 12. Empêcher le scroll de la page quand le chat est ouvert */
            .ios-device.chat-open {
                overflow: hidden !important;
                position: fixed !important;
                width: 100% !important;
            }

            /* 13. Fix pour le panneau emoji sur iOS */
            .ios-device .emoji-panel {
                position: fixed !important;
                bottom: calc(150px + var(--ios-safe-area-bottom)) !important;
                max-height: 40vh !important;
                z-index: 997 !important;
            }

            /* 14. Fix header du chat sur iOS */
            .ios-device .chat-header {
                position: relative !important;
                z-index: 5 !important;
            }

            /* 15. Bouton de fermeture toujours accessible */
            .ios-device .close-chat,
            .ios-device .chat-close-btn {
                z-index: 15 !important;
                position: absolute !important;
                top: 10px !important;
                right: 10px !important;
            }
            
			/* 16. Widget radio */
            @media (min-width: 768px) {
				.radio-compact-widget {
				left: 4px;
				bottom: 110px;
				max-width: 384px;
				}
			}		
				
            /* Fix pour les autres éléments iOS existants */
            .ios-device .weather-sidebar.visible,
            .ios-device .quick-links-sidebar.visible {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
            
            .ios-device .weather-mobile-btn,
            .ios-device .weather-show-btn {
                top: calc(70px + var(--ios-safe-area-top)) !important;
            }
            
            .ios-device .quick-links-show-btn {
                top: calc(70px + var(--ios-safe-area-top)) !important;
            }
            
            .ios-device .tool-button {
                top: calc(70px + var(--ios-safe-area-top)) !important;
            }
            
            .ios-device .search-button {
                top: calc(70px + var(--ios-safe-area-top)) !important;
            }
            
            @media (max-width: 768px) {
                .ios-device .news-button {
                    position: fixed !important;
                    top: calc(70px + var(--ios-safe-area-top)) !important;
                    left: 50% !important;
                    transform: translateX(-50%) !important;
                    z-index: 99 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
                }
            }
        `;
        document.head.appendChild(style);
        
        console.log('iOS fixes appliqués - Header, Chat et Settings button ajustés');
        		
        // Fix pour restaurer l'état des widgets sur iOS
        setTimeout(() => {
            const weatherHidden = localStorage.getItem('weatherWidgetHidden');
            const weatherWidget = document.querySelector('.weather-sidebar');
            
            if (weatherWidget && weatherHidden !== 'true') {
                weatherWidget.classList.remove('visible');
                weatherWidget.style.display = 'none';
                console.log('Widget météo configuré pour iOS');
            }
            
            const quickLinksHidden = localStorage.getItem('quickLinksHidden');
            const quickLinksWidget = document.querySelector('.quick-links-sidebar');
            
            if (quickLinksWidget && quickLinksHidden !== 'true') {
                quickLinksWidget.classList.remove('visible');
                quickLinksWidget.style.display = 'none';
                console.log('Widget liens rapides configuré pour iOS');
            }
            
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
        
        // Gestion spéciale du chat sur iOS
        const observeChatState = () => {
            const chatObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const chatContainer = mutation.target;
                        if (chatContainer.classList.contains('open')) {
                            document.body.classList.add('chat-open');
                        } else {
                            document.body.classList.remove('chat-open');
                        }
                    }
                });
            });

            const checkAndObserve = setInterval(() => {
                const chatContainer = document.querySelector('.chat-container');
                if (chatContainer) {
                    chatObserver.observe(chatContainer, { attributes: true });
                    clearInterval(checkAndObserve);
                }
            }, 500);
        };

        observeChatState();
        
        // Détection du clavier virtuel
        let windowHeight = window.innerHeight;
        
        window.addEventListener('resize', function() {
            const currentHeight = window.innerHeight;
            
            if (currentHeight < windowHeight * 0.75) {
                document.body.classList.add('keyboard-visible');
            } else {
                document.body.classList.remove('keyboard-visible');
            }
        });
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