// ios-fixes-safe.js - Version 3.0 CORRIGÉE
// Corrections minimales et intelligentes pour iOS

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
    
    console.log('🍎 iOS détecté - Application des corrections v3.0');
    
    // Attendre que le DOM soit complètement chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyIOSFixes);
    } else {
        // Attendre un peu pour que tous les widgets soient initialisés
        setTimeout(applyIOSFixes, 500);
    }
    
    function applyIOSFixes() {
        console.log('📱 Application des corrections iOS...');
        
        // 1. Variables CSS pour les safe areas
        addSafeAreaSupport();
        
        // 2. Fix pour la hauteur viewport
        fixViewportHeight();
        
        // 3. Corrections de positionnement adaptatives
        applyAdaptivePositioning();
        
        // 4. Fix pour les inputs (zoom)
        preventInputZoom();
        
        // 5. Améliorations du rendu texte
        improveTextRendering();
        
        // 6. Gestion orientation
        handleOrientationChange();
        
        console.log('✅ Corrections iOS appliquées');
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
            
            /* Application automatique aux éléments fixes */
            .app-header {
                padding-top: var(--safe-area-top) !important;
            }
            
            .bottom-nav {
                padding-bottom: var(--safe-area-bottom) !important;
            }
            
            /* News ticker safe area */
            .news-ticker {
                bottom: calc(60px + var(--safe-area-bottom)) !important;
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
    
    // 3. Positionnement adaptatif basé sur ce qui existe vraiment
    function applyAdaptivePositioning() {
        const style = document.createElement('style');
        style.id = 'ios-adaptive-positioning';
        style.textContent = `
            /* ===== CORRECTION PRINCIPALE : HEADER ET CONTENU ===== */
            
            /* S'assurer que le header reste visible */
            .app-header {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                z-index: 1100 !important;
                height: 55px !important;
            }
            
            /* Logo dans le header - éviter le débordement */
            .site-logo {
                max-height: 50px !important;
                width: auto !important;
                object-fit: contain !important;
            }
            
            /* Ajuster le contenu principal pour ne pas passer sous le header */
            main, .main-content {
                margin-top: calc(55px + var(--safe-area-top)) !important;
                padding-bottom: calc(120px + var(--safe-area-bottom)) !important;
            }
            
            /* ===== WIDGET NEWS - POSITION CORRIGÉE ===== */
            @media (max-width: 767px) {
                .news-widget-container {
                    margin-top: calc(10px + var(--safe-area-top)) !important;
                    margin-bottom: 15px !important;
                    position: relative !important;
                    z-index: 1 !important;
                }
                
                .local-news-widget {
                    margin: 0 5px !important;
                    position: relative !important;
                }
                
                /* Premier séparateur après le widget */
                .separator:first-of-type {
                    margin-top: 10px !important;
                }
            }
            
            /* ===== BOUTONS FLOTTANTS - POSITIONS ADAPTATIVES ===== */
            
            /* Photos et Cinéma - Ces boutons sont dans le widget NEWS sur mobile */
            @media (max-width: 767px) {
                /* Les boutons photos-btn et cinema-btn sont positionnés par news-widget.css */
                /* On s'assure juste qu'ils restent visibles */
                .photos-btn, .cinema-btn {
                    opacity: 1 !important;
                    visibility: visible !important;
                    pointer-events: auto !important;
                }
                
                /* Si des boutons flottants séparés existent */
                .photos-mobile-btn {
                    position: fixed !important;
                    bottom: calc(140px + var(--safe-area-bottom)) !important;
                    left: 20px !important;
                    z-index: 1000 !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                    display: flex !important;
                }
                
                .cinema-mobile-btn {
                    position: fixed !important;
                    bottom: calc(140px + var(--safe-area-bottom)) !important;
                    right: 20px !important;
                    z-index: 1000 !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                    display: flex !important;
                }
                
                /* Boutons header - positions relatives au header */
                .weather-mobile-btn {
                    position: fixed !important;
                    top: calc(60px + var(--safe-area-top)) !important;
                    left: 10px !important;
                    z-index: 1001 !important;
                    width: 40px !important;
                    height: 40px !important;
                }
                
                .quick-links-show-btn {
                    position: fixed !important;
                    top: calc(60px + var(--safe-area-top)) !important;
                    right: 10px !important;
                    z-index: 1001 !important;
                    width: 40px !important;
                    height: 40px !important;
                }
                
                .fuel-button {
                    position: fixed !important;
                    top: calc(60px + var(--safe-area-top)) !important;
                    left: 60px !important;
                    z-index: 1001 !important;
                    width: 40px !important;
                    height: 40px !important;
                }
                
                .search-button {
                    position: fixed !important;
                    top: calc(60px + var(--safe-area-top)) !important;
                    right: 60px !important;
                    z-index: 1001 !important;
                    width: 40px !important;
                    height: 40px !important;
                }
            }
            
            /* ===== NAVIGATION DU BAS ===== */
            .bottom-nav {
                position: fixed !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                z-index: 1100 !important;
                background: inherit !important;
            }
            
            /* ===== NEWS TICKER ===== */
            .news-ticker {
                position: fixed !important;
                bottom: calc(60px + var(--safe-area-bottom)) !important;
                left: 0 !important;
                right: 0 !important;
                z-index: 999 !important;
            }
            
            /* ===== CHAT CONTAINER ===== */
            .chat-container {
                /* Utiliser la vraie hauteur du viewport */
                height: calc(var(--vh, 1vh) * 70) !important;
                max-height: calc(var(--vh, 1vh) * 80) !important;
            }
            
            /* ===== TILE CONTAINER - Éviter le chevauchement ===== */
            .tile-container, #tileContainer {
                padding-bottom: calc(130px + var(--safe-area-bottom)) !important;
            }
            
            /* ===== CORRECTIONS TABLETTES (iPad) ===== */
            @media (min-width: 768px) and (max-width: 1100px) {
                /* Boutons latéraux pour tablette */
                .weather-show-btn {
                    position: fixed !important;
                    top: calc(80px + var(--safe-area-top)) !important;
                    left: 15px !important;
                    z-index: 990 !important;
                }
                
                .quick-links-show-btn {
                    position: fixed !important;
                    top: calc(80px + var(--safe-area-top)) !important;
                    right: 15px !important;
                    z-index: 990 !important;
                }
                
                .fuel-button {
                    position: fixed !important;
                    top: calc(140px + var(--safe-area-top)) !important;
                    left: 15px !important;
                    z-index: 990 !important;
                }
                
                .search-button {
                    position: fixed !important;
                    top: calc(140px + var(--safe-area-top)) !important;
                    right: 15px !important;
                    z-index: 990 !important;
                }
            }
            
            /* ===== AMÉLIORATION DU SCROLL ===== */
            .scrollable,
            .chat-messages,
            .emoji-panel,
            .weather-sidebar,
            .quick-links-sidebar {
                -webkit-overflow-scrolling: touch !important;
                overflow-y: auto !important;
            }
            
            /* ===== Z-INDEX HIERARCHY ===== */
            .app-header { z-index: 1100 !important; }
            .bottom-nav { z-index: 1100 !important; }
            .chat-container { z-index: 1200 !important; }
            .news-panel { z-index: 1300 !important; }
            .modal { z-index: 1400 !important; }
            .notification-popup { z-index: 1500 !important; }
        `;
        document.head.appendChild(style);
    }
    
    // 4. Empêcher le zoom sur les inputs
    function preventInputZoom() {
        const style = document.createElement('style');
        style.id = 'ios-input-zoom-fix';
        style.textContent = `
            /* Empêcher le zoom automatique sur focus */
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
            
            /* Conserver la taille au focus */
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
            /* Amélioration globale du rendu texte */
            * {
                -webkit-font-smoothing: antialiased;
                -webkit-tap-highlight-color: transparent;
            }
            
            /* Amélioration spécifique pour les tuiles */
            .tile, .tile-title {
                -webkit-font-smoothing: antialiased !important;
                transform: translateZ(0); /* Force GPU acceleration */
            }
            
            /* Amélioration pour le texte blanc sur fond coloré */
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
                
                // Recalculer les positions après rotation
                setTimeout(() => {
                    fixViewportHeight();
                    
                    // Forcer un reflow pour iOS
                    document.body.style.display = 'none';
                    document.body.offsetHeight; // Trigger reflow
                    document.body.style.display = '';
                }, 300);
            }
        });
    }
    
    // Fonction utilitaire pour débugger
    window.iOSDebug = {
        version: '3.0',
        
        checkPositions: () => {
            const elements = {
                header: '.app-header',
                newsWidget: '.news-widget-container',
                photosBtn: '.photos-btn',  // Corrigé
                cinemaBtn: '.cinema-btn',  // Corrigé
                weatherBtn: '.weather-mobile-btn',
                bottomNav: '.bottom-nav',
                newsTicker: '.news-ticker',
                tileContainer: '.tile-container',
                quickLinksBtn: '.quick-links-show-btn',
                fuelBtn: '.fuel-button',
                searchBtn: '.search-button'
            };
            
            console.log('🔍 Positions des éléments:');
            
            Object.entries(elements).forEach(([name, selector]) => {
                const element = document.querySelector(selector);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const styles = window.getComputedStyle(element);
                    console.log(`📍 ${name}:`, {
                        top: rect.top,
                        bottom: rect.bottom,
                        position: styles.position,
                        zIndex: styles.zIndex,
                        display: styles.display,
                        visibility: styles.visibility
                    });
                } else {
                    console.log(`❌ ${name}: non trouvé`);
                }
            });
        },
        
        getSafeAreas: () => {
            const root = document.documentElement;
            console.log('📏 Safe Areas:', {
                top: getComputedStyle(root).getPropertyValue('--safe-area-top'),
                bottom: getComputedStyle(root).getPropertyValue('--safe-area-bottom'),
                left: getComputedStyle(root).getPropertyValue('--safe-area-left'),
                right: getComputedStyle(root).getPropertyValue('--safe-area-right')
            });
        },
        
        resetFixes: () => {
            // Supprimer tous les styles iOS
            ['ios-safe-areas', 'ios-adaptive-positioning', 'ios-input-zoom-fix', 'ios-text-rendering'].forEach(id => {
                const element = document.getElementById(id);
                if (element) element.remove();
            });
            console.log('🔄 Corrections iOS supprimées');
        }
    };
    
})();