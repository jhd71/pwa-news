// ios-fixes-safe.js - Version 4.0 CORRECTION IPHONE
// Corrections spécifiques pour les problèmes d'affichage iPhone

(function() {
    'use strict';
    
    // Détection iOS fiable
    const isIOS = () => {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    };
    
    if (!isIOS()) {
        console.log('✅ Non-iOS - Pas de modifications');
        return;
    }
    
    console.log('🍎 iOS détecté - Application des corrections v4.0 pour iPhone');
    
    // Attendre que le DOM soit complètement chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyIOSFixes);
    } else {
        // Attendre un peu pour que tous les widgets soient initialisés
        setTimeout(applyIOSFixes, 500);
    }
    
    function applyIOSFixes() {
        console.log('📱 Application des corrections iOS spécifiques iPhone...');
        
        // 1. Variables CSS pour les safe areas
        addSafeAreaSupport();
        
        // 2. Fix pour la hauteur viewport
        fixViewportHeight();
        
        // 3. Corrections SPÉCIFIQUES pour iPhone
        applyiPhoneSpecificFixes();
        
        // 4. Fix pour les inputs (zoom)
        preventInputZoom();
        
        // 5. Améliorations du rendu texte
        improveTextRendering();
        
        // 6. Gestion orientation
        handleOrientationChange();
        
        console.log('✅ Corrections iOS iPhone appliquées');
    }
    
    // 1. Support des safe areas iOS
    function addSafeAreaSupport() {
        const style = document.createElement('style');
        style.id = 'ios-safe-areas';
        style.textContent = `
            /* Variables pour les safe areas iOS */
            :root {
                --safe-area-top: env(safe-area-inset-top, 0px);
                --safe-area-bottom: env(safe-area-inset-bottom, 0px);
                --safe-area-left: env(safe-area-inset-left, 0px);
                --safe-area-right: env(safe-area-inset-right, 0px);
            }
        `;
        document.head.appendChild(style);
    }
    
    // 2. Fix pour la vraie hauteur du viewport
    function fixViewportHeight() {
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);
    }
    
    // 3. CORRECTIONS SPÉCIFIQUES IPHONE
    function applyiPhoneSpecificFixes() {
        const style = document.createElement('style');
        style.id = 'ios-iphone-specific-fixes';
        style.textContent = `
            /* ===== CORRECTIONS SPÉCIFIQUES POUR IPHONE ===== */
            
            /* 1. HEADER - Repositionner le bouton paramètres et ajuster la hauteur */
            .app-header {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                z-index: 1100 !important;
                height: calc(50px + var(--safe-area-top)) !important;
                padding-top: var(--safe-area-top) !important;
                padding-left: 10px !important;
                padding-right: 10px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
            }
            
            /* Bouton paramètres - repositionner correctement */
            .settings-btn, .quick-links-show-btn {
                position: absolute !important;
                top: calc(var(--safe-area-top) + 5px) !important;
                right: 10px !important;
                z-index: 1200 !important;
                width: 40px !important;
                height: 40px !important;
            }
            
            /* Bouton menu hamburger - repositionner */
            .menu-toggle, .menu-btn {
                position: absolute !important;
                top: calc(var(--safe-area-top) + 5px) !important;
                left: 10px !important;
                z-index: 1200 !important;
                width: 40px !important;
                height: 40px !important;
            }
            
            /* 2. BOUTON "INFOS EN DIRECT" - Descendre */
            .news-button, .direct-info-btn, [data-section="news"] {
                position: relative !important;
                margin-top: calc(55px + var(--safe-area-top) + 10px) !important;
                margin-bottom: 15px !important;
                z-index: 1000 !important;
            }
            
            /* 3. WIDGET NEWS - Descendre davantage */
            .news-widget-container, .local-news-widget {
                margin-top: calc(75px + var(--safe-area-top)) !important;
                margin-bottom: 20px !important;
                position: relative !important;
                z-index: 900 !important;
            }
            
            /* Container principal - ajuster pour éviter chevauchement */
            main, .main-content, .container {
                margin-top: calc(60px + var(--safe-area-top)) !important;
                padding-bottom: calc(150px + var(--safe-area-bottom)) !important;
            }
            
            /* 4. NAVIGATION DU BAS - Ajuster avec safe area */
            .bottom-nav {
                position: fixed !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                z-index: 1100 !important;
                padding-bottom: var(--safe-area-bottom) !important;
                background: var(--primary-color, #dc2626) !important;
            }
            
            /* 5. BARRE DE DÉFILEMENT INFOS - Coller aux icônes du bas */
            .news-ticker, .scrolling-news, .news-scroll {
                position: fixed !important;
                bottom: calc(60px + var(--safe-area-bottom)) !important;
                left: 0 !important;
                right: 0 !important;
                z-index: 1050 !important;
                height: 30px !important;
                margin: 0 !important;
                padding: 0 10px !important;
            }
            
            /* 6. BOUTONS FLOTTANTS - Repositionner pour éviter les conflits */
            @media (max-width: 767px) {
                /* Boutons dans le header - réajuster */
                .weather-mobile-btn {
                    position: fixed !important;
                    top: calc(55px + var(--safe-area-top) + 5px) !important;
                    left: 15px !important;
                    z-index: 990 !important;
                    width: 35px !important;
                    height: 35px !important;
                }
                
                .fuel-button {
                    position: fixed !important;
                    top: calc(55px + var(--safe-area-top) + 5px) !important;
                    left: 60px !important;
                    z-index: 990 !important;
                    width: 35px !important;
                    height: 35px !important;
                }
                
                .search-button {
                    position: fixed !important;
                    top: calc(55px + var(--safe-area-top) + 5px) !important;
                    right: 60px !important;
                    z-index: 990 !important;
                    width: 35px !important;
                    height: 35px !important;
                }
                
                /* Boutons Photos et Cinéma - positionner près du bas */
                .photos-btn, .photos-mobile-btn {
                    position: fixed !important;
                    bottom: calc(100px + var(--safe-area-bottom)) !important;
                    left: 20px !important;
                    z-index: 1000 !important;
                    width: 50px !important;
                    height: 50px !important;
                    border-radius: 25px !important;
                }
                
                .cinema-btn, .cinema-mobile-btn {
                    position: fixed !important;
                    bottom: calc(100px + var(--safe-area-bottom)) !important;
                    right: 20px !important;
                    z-index: 1000 !important;
                    width: 50px !important;
                    height: 50px !important;
                    border-radius: 25px !important;
                }
            }
            
            /* 7. CONTENU SCROLLABLE - Éviter le chevauchement */
            .tile-container, #tileContainer, .content-area {
                padding-top: 10px !important;
                padding-bottom: calc(160px + var(--safe-area-bottom)) !important;
            }
            
            /* 8. CHAT - Ajuster la hauteur */
            .chat-container {
                height: calc(var(--vh, 1vh) * 70) !important;
                max-height: calc(var(--vh, 1vh) * 80) !important;
                bottom: calc(60px + var(--safe-area-bottom)) !important;
            }
            
            /* 9. MASQUER LES BOUTONS QUAND LE CHAT EST OUVERT */
            body:has(.chat-container.open) .weather-mobile-btn,
            body:has(.chat-container.open) .fuel-button,
            body:has(.chat-container.open) .search-button,
            body:has(.chat-container.open) .photos-btn,
            body:has(.chat-container.open) .cinema-btn {
                opacity: 0 !important;
                pointer-events: none !important;
                transition: opacity 0.3s ease !important;
            }
            
            /* 10. Z-INDEX HIERARCHY OPTIMISÉE */
            .app-header { z-index: 1100 !important; }
            .settings-btn, .quick-links-show-btn, .menu-toggle { z-index: 1200 !important; }
            .bottom-nav { z-index: 1100 !important; }
            .news-ticker { z-index: 1050 !important; }
            .photos-btn, .cinema-btn { z-index: 1000 !important; }
            .weather-mobile-btn, .fuel-button, .search-button { z-index: 990 !important; }
            .news-widget-container { z-index: 900 !important; }
            .chat-container { z-index: 1300 !important; }
            .modal, .notification-popup { z-index: 1400 !important; }
            
            /* 11. CORRECTIONS ADDITIONNELLES POUR IPHONE */
            
            /* Éviter le rebond lors du scroll */
            body {
                -webkit-overflow-scrolling: touch;
                overflow-x: hidden;
            }
            
            /* Amélioration du scroll pour les conteneurs */
            .scrollable,
            .chat-messages,
            .weather-sidebar,
            .quick-links-sidebar {
                -webkit-overflow-scrolling: touch !important;
                overflow-y: auto !important;
            }
            
            /* Correction pour les inputs - éviter le zoom */
            input, textarea, select {
                font-size: 16px !important;
                -webkit-appearance: none;
            }
            
            /* Amélioration tactile */
            button, .btn, .clickable {
                -webkit-tap-highlight-color: rgba(0,0,0,0.1);
                touch-action: manipulation;
            }
            
            /* 12. CORRECTIONS SPÉCIFIQUES SELON LA TAILLE D'ÉCRAN */
            
            /* iPhone SE et petits écrans */
            @media (max-width: 375px) {
                .fuel-button {
                    left: 55px !important;
                }
                
                .search-button {
                    right: 55px !important;
                }
                
                .photos-btn {
                    bottom: calc(95px + var(--safe-area-bottom)) !important;
                }
                
                .cinema-btn {
                    bottom: calc(95px + var(--safe-area-bottom)) !important;
                }
            }
            
            /* iPhone Plus et grands écrans */
            @media (min-width: 414px) {
                .app-header {
                    height: calc(55px + var(--safe-area-top)) !important;
                }
                
                .news-widget-container {
                    margin-top: calc(80px + var(--safe-area-top)) !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 4. Empêcher le zoom sur les inputs
    function preventInputZoom() {
        const style = document.createElement('style');
        style.id = 'ios-input-zoom-fix';
        style.textContent = `
            input[type="text"],
            input[type="email"],
            input[type="number"],
            input[type="password"],
            input[type="tel"],
            input[type="url"],
            input[type="search"],
            input[type="time"],
            textarea,
            select {
                font-size: 16px !important;
                -webkit-appearance: none !important;
            }
            
            @media (max-width: 767px) {
                input:focus,
                textarea:focus,
                select:focus {
                    font-size: 16px !important;
                    transform: scale(1) !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 5. Améliorer le rendu du texte
    function improveTextRendering() {
        const style = document.createElement('style');
        style.id = 'ios-text-rendering';
        style.textContent = `
            * {
                -webkit-font-smoothing: antialiased;
                -webkit-tap-highlight-color: transparent;
            }
            
            .tile, .tile-title {
                -webkit-font-smoothing: antialiased !important;
                transform: translateZ(0);
            }
            
            .tile-title,
            .header-title,
            .nav-item span,
            .chat-message {
                text-rendering: optimizeLegibility !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 6. Gestion de l'orientation
    function handleOrientationChange() {
        let orientation = window.orientation;
        
        window.addEventListener('orientationchange', () => {
            if (orientation !== window.orientation) {
                orientation = window.orientation;
                
                setTimeout(() => {
                    fixViewportHeight();
                    
                    // Forcer un reflow pour iOS
                    document.body.style.display = 'none';
                    document.body.offsetHeight;
                    document.body.style.display = '';
                }, 300);
            }
        });
    }
    
    // Fonction de debug améliorée
    window.iOSDebug = {
        version: '4.0',
        
        checkPositions: () => {
            const elements = {
                header: '.app-header',
                settingsBtn: '.settings-btn',
                menuBtn: '.menu-toggle',
                newsButton: '.news-button',
                newsWidget: '.news-widget-container',
                photosBtn: '.photos-btn',
                cinemaBtn: '.cinema-btn',
                weatherBtn: '.weather-mobile-btn',
                bottomNav: '.bottom-nav',
                newsTicker: '.news-ticker'
            };
            
            console.log('🔍 Positions des éléments iPhone:');
            
            Object.entries(elements).forEach(([name, selector]) => {
                const element = document.querySelector(selector);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const styles = window.getComputedStyle(element);
                    console.log(`📍 ${name}:`, {
                        top: rect.top,
                        bottom: rect.bottom,
                        left: rect.left,
                        right: rect.right,
                        position: styles.position,
                        zIndex: styles.zIndex,
                        visibility: styles.visibility
                    });
                } else {
                    console.log(`❌ ${name}: non trouvé (sélecteur: ${selector})`);
                }
            });
        },
        
        getSafeAreas: () => {
            const root = document.documentElement;
            console.log('📏 Safe Areas:', {
                top: getComputedStyle(root).getPropertyValue('--safe-area-top'),
                bottom: getComputedStyle(root).getPropertyValue('--safe-area-bottom'),
                left: getComputedStyle(root).getPropertyValue('--safe-area-left'),
                right: getComputedStyle(root).getPropertyValue('--safe-area-right'),
                vh: getComputedStyle(root).getPropertyValue('--vh')
            });
        },
        
        testElements: () => {
            console.log('🧪 Test de présence des éléments:');
            const selectors = [
                '.app-header',
                '.settings-btn', '.quick-links-show-btn',
                '.menu-toggle', '.menu-btn',
                '.news-button', '.direct-info-btn', '[data-section="news"]',
                '.news-widget-container', '.local-news-widget',
                '.bottom-nav',
                '.news-ticker', '.scrolling-news', '.news-scroll',
                '.photos-btn', '.cinema-btn'
            ];
            
            selectors.forEach(selector => {
                const found = document.querySelector(selector);
                console.log(`${found ? '✅' : '❌'} ${selector}`);
            });
        }
    };
    
})();