// ios-fixes-safe.js - Version 2.3 - COMPLET et CORRIGÉ
(function() {
    'use strict';
    
    // Détection iOS ultra-précise
    const isReallyIOS = () => {
        const ua = navigator.userAgent;
        const platform = navigator.platform;
        
        const iosPattern = /iPad|iPhone|iPod/.test(ua);
        const notAndroid = !(/Android/.test(ua));
        const notMSStream = !window.MSStream;
        const isPadOnIOS13 = platform === 'MacIntel' && navigator.maxTouchPoints > 1;
        
        return (iosPattern || isPadOnIOS13) && notAndroid && notMSStream;
    };
    
    if (!isReallyIOS()) {
        console.log('Non-iOS détecté - Aucune modification appliquée');
        return;
    }
    
    console.log('🍎 iOS détecté - Application des corrections v2.3');
    
    const initFixes = () => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applyIOSFixes);
        } else {
            applyIOSFixes();
        }
    };
    
    function applyIOSFixes() {
    console.log('Application des corrections iOS v2.3...');
    
    setTimeout(() => {
        addSafeAreaVariables();
        fixViewportHeight();
        fixWidgetPositioning();
        fixChatPositioning();
        fixTextRendering();
        handleOrientationChange();
        preventInputZoom();
        // ✅ NOUVELLES CORRECTIONS
        fixHeaderButtons();
        fixSiteLogo();
        fixNewsButton();
        fixNewsWidget();
        fixNewsTicker();
        fixChatZIndex();
    }, 1000);
    
    console.log('✅ Corrections iOS v2.3 appliquées');
}
    
    function addSafeAreaVariables() {
        const style = document.createElement('style');
        style.id = 'ios-safe-areas-v23';
        style.textContent = `
            :root {
                --ios-safe-top: env(safe-area-inset-top, 0px);
                --ios-safe-bottom: env(safe-area-inset-bottom, 0px);
                --ios-safe-left: env(safe-area-inset-left, 0px);
                --ios-safe-right: env(safe-area-inset-right, 0px);
            }
        `;
        document.head.appendChild(style);
    }
    
    function fixViewportHeight() {
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh-ios', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', setVH);
    }
    
    function fixWidgetPositioning() {
        const style = document.createElement('style');
        style.id = 'ios-widget-positioning-v23';
        style.textContent = `
            /* CORRECTIONS iOS - Compatible avec widgets.css */
            
            /* Empêcher les tuiles de passer sous la navigation */
            .tile-container, #tileContainer, .main-content {
                padding-bottom: calc(120px + var(--ios-safe-bottom, 0px)) !important;
                margin-bottom: 20px !important;
            }
            
            /* Corriger la barre d'infos déroulante */
            .news-ticker {
                position: fixed !important;
                bottom: calc(60px + var(--ios-safe-bottom, 0px)) !important;
                left: 0 !important;
                right: 0 !important;
                z-index: 1000 !important;
                background: rgba(0, 0, 0, 0.9) !important;
                backdrop-filter: blur(10px) !important;
                border-top: 1px solid rgba(255, 255, 255, 0.2) !important;
            }
            
            /* Navigation du bas avec safe area */
            .bottom-nav {
                position: fixed !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                padding-bottom: var(--ios-safe-bottom, 0px) !important;
                z-index: 1100 !important;
            }
            
            /* Header avec safe area */
            .app-header {
                padding-top: var(--ios-safe-top, 0px) !important;
                z-index: 1200 !important;
            }
            
            /* Contenu principal avec marge pour header */
            main, .main-content {
                padding-top: calc(20px + var(--ios-safe-top, 0px)) !important;
            }
            
            /* REPOSITIONNER LES BOUTONS WIDGETS SUR iOS */
            
            /* Desktop iOS (iPad) */
            @media (min-width: 1101px) {
                .weather-show-btn {
                    top: calc(120px + var(--ios-safe-top, 0px)) !important;
                    left: 15px !important;
                    z-index: 999 !important;
                }
                
                .quick-links-show-btn {
                    top: calc(120px + var(--ios-safe-top, 0px)) !important;
                    right: 15px !important;
                    z-index: 999 !important;
                }
                
                .fuel-button {
                    top: calc(180px + var(--ios-safe-top, 0px)) !important;
                    left: 15px !important;
                }
                
                .search-button {
                    top: calc(180px + var(--ios-safe-top, 0px)) !important;
                    right: 15px !important;
                }
            }
            
            /* Tablette iOS */
            @media (min-width: 768px) and (max-width: 1100px) {
                .weather-show-btn {
                    top: calc(80px + var(--ios-safe-top, 0px)) !important;
                    left: 15px !important;
                    z-index: 999 !important;
                }
                
                .quick-links-show-btn {
                    top: calc(80px + var(--ios-safe-top, 0px)) !important;
                    right: 15px !important;
                    z-index: 999 !important;
                }
                
                .fuel-button {
                    top: calc(140px + var(--ios-safe-top, 0px)) !important;
                    left: 15px !important;
                }
                
                .search-button {
                    top: calc(140px + var(--ios-safe-top, 0px)) !important;
                    right: 15px !important;
                }
            }
            
            /* Mobile iOS (iPhone) */
            @media (max-width: 767px) {
                /* Repositionner les boutons dans la barre du haut */
                .weather-mobile-btn {
                    top: calc(75px + var(--ios-safe-top, 0px)) !important;
                    left: 10px !important;
                    z-index: 1000 !important;
                }
                
                .quick-links-show-btn {
                    top: calc(75px + var(--ios-safe-top, 0px)) !important;
                    right: 10px !important;
                    z-index: 1000 !important;
                }
                
                .fuel-button {
                    top: calc(75px + var(--ios-safe-top, 0px)) !important;
                    left: 40% !important;
                    transform: translateX(-100px) !important;
                    z-index: 1000 !important;
                }
                
                .search-button {
                    top: calc(75px + var(--ios-safe-top, 0px)) !important;
                    left: 60% !important;
                    transform: translateX(60px) !important;
                    z-index: 1000 !important;
                }
                
                .weather-show-btn {
                    display: none !important;
                }
                
                /* BOUTONS CINÉMA ET PHOTOS - REPOSITIONNÉS POUR iOS */
                .cinema-mobile-btn {
                    position: absolute !important;
                    top: calc(320px + var(--ios-safe-top, 0px)) !important;
                    right: calc(10px + var(--ios-safe-right, 0px)) !important;
                    z-index: 1000 !important;
                    /* Assurer la visibilité sur iOS */
                    opacity: 1 !important;
                    visibility: visible !important;
                    display: flex !important;
                }
                
                .photos-mobile-btn {
                    position: absolute !important;
                    top: calc(320px + var(--ios-safe-top, 0px)) !important;
                    left: calc(10px + var(--ios-safe-left, 0px)) !important;
                    z-index: 1000 !important;
                    /* Assurer la visibilité sur iOS */
                    opacity: 1 !important;
                    visibility: visible !important;
                    display: flex !important;
                }
                
                /* Correction pour les petits iPhone */
                @media (max-width: 375px) {
                    .photos-mobile-btn {
                        left: calc(5px + var(--ios-safe-left, 0px)) !important;
                    }
                    
                    .cinema-mobile-btn {
                        right: calc(5px + var(--ios-safe-right, 0px)) !important;
                    }
                }
                
                /* Correction pour iPhone avec encoche */
                @media (max-width: 430px) and (min-height: 800px) {
                    .photos-mobile-btn {
                        left: calc(15px + var(--ios-safe-left, 0px)) !important;
                    }
                    
                    .cinema-mobile-btn {
                        right: calc(15px + var(--ios-safe-right, 0px)) !important;
                    }
                }
            }
            
            /* WIDGETS POSITIONNÉS CORRECTEMENT */
            .weather-sidebar,
            .quick-links-sidebar {
                z-index: 1500 !important;
                max-height: calc(70vh - var(--ios-safe-bottom, 0px)) !important;
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch !important;
            }
            
            /* WIDGETS THÉMATISÉS */
            
            /* Thème Océan */
            [data-theme="ocean"] .weather-sidebar,
            [data-theme="ocean"] .quick-links-sidebar {
                background: rgba(0, 96, 100, 0.95) !important;
                backdrop-filter: blur(20px) !important;
                border: 1px solid rgba(0, 131, 143, 0.5) !important;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
            }
            
            [data-theme="ocean"] .weather-sidebar h3,
            [data-theme="ocean"] .quick-links-sidebar h3 {
                color: #B3E5FC !important;
                background: rgba(0, 131, 143, 0.3) !important;
                padding: 10px !important;
                border-radius: 8px !important;
                margin-bottom: 15px !important;
            }
            
            [data-theme="ocean"] .weather-day {
                background: rgba(0, 131, 143, 0.6) !important;
                border: 1px solid rgba(0, 188, 212, 0.3) !important;
                color: white !important;
            }
            
            /* Thème Sunset */
            [data-theme="sunset"] .weather-sidebar,
            [data-theme="sunset"] .quick-links-sidebar {
                background: rgba(255, 107, 53, 0.95) !important;
                backdrop-filter: blur(20px) !important;
                border: 1px solid rgba(255, 138, 80, 0.5) !important;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
            }
            
            [data-theme="sunset"] .weather-sidebar h3,
            [data-theme="sunset"] .quick-links-sidebar h3 {
                color: #FFF8E7 !important;
                background: rgba(0, 0, 0, 0.2) !important;
                padding: 10px !important;
                border-radius: 8px !important;
                margin-bottom: 15px !important;
            }
            
            [data-theme="sunset"] .weather-day {
                background: rgba(0, 0, 0, 0.2) !important;
                border: 1px solid rgba(255, 138, 80, 0.3) !important;
                color: white !important;
            }
            
            /* Thème Super Light */
            [data-theme="super-light"] .weather-sidebar,
            [data-theme="super-light"] .quick-links-sidebar {
                background: linear-gradient(135deg, #6366F1, #8B5CF6) !important;
                backdrop-filter: blur(20px) brightness(1.1) !important;
                border: 1px solid rgba(99, 102, 241, 0.2) !important;
                box-shadow: 0 10px 40px rgba(99, 102, 241, 0.15) !important;
            }
            
            [data-theme="super-light"] .weather-sidebar h3,
            [data-theme="super-light"] .quick-links-sidebar h3 {
                color: #ffffff !important;
                background: rgba(255, 255, 255, 0.1) !important;
                padding: 10px !important;
                border-radius: 8px !important;
                margin-bottom: 15px !important;
                border-bottom: 2px solid rgba(255, 255, 255, 0.2) !important;
            }
            
            [data-theme="super-light"] .weather-day {
                background: rgba(102, 105, 234, 0.8) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                color: #1F2937 !important;
                backdrop-filter: blur(5px) !important;
            }
            
            [data-theme="super-light"] .weather-day h4 {
                background: rgba(99, 102, 241, 0.15) !important;
                color: #f9f9f9 !important;
            }
            
            [data-theme="super-light"] .quick-link {
                background: rgba(114, 91, 227, 0.8) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                color: white !important;
                backdrop-filter: blur(5px) !important;
            }
            
            /* PANNEAU INFOS EN DIRECT */
            .news-panel, 
            .panel, 
            .info-panel,
            [class*="panel"] {
                z-index: 2000 !important;
            }
            
            .panel-header {
                z-index: 2001 !important;
                position: relative !important;
            }
            
            .panel-content,
            .news-panel-content,
            .info-panel-content {
                z-index: 2000 !important;
                position: relative !important;
            }
            
            /* Masquer les widgets quand le chat est ouvert */
            .chat-container:not(.hidden) ~ .weather-sidebar,
            .chat-container:not(.hidden) ~ .quick-links-sidebar,
            .chat-container:not(.hidden) ~ .weather-show-btn,
            .chat-container:not(.hidden) ~ .quick-links-show-btn,
            .chat-container:not(.hidden) ~ .weather-mobile-btn {
                opacity: 0 !important;
                pointer-events: none !important;
                z-index: -1 !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    function fixTextRendering() {
        const style = document.createElement('style');
        style.id = 'ios-text-fixes-v23';
        style.textContent = `
            /* CORRECTION RENDU TEXTE iOS */
            * {
                -webkit-font-smoothing: antialiased !important;
                -moz-osx-font-smoothing: grayscale !important;
                text-rendering: optimizeLegibility !important;
            }
            
            .tile, .tile-title, .tile h3, .tile p, .tile span,
            .grid-item, .grid-item h3, .grid-item p, .grid-item span {
                -webkit-font-smoothing: antialiased !important;
                -webkit-text-stroke: 0.1px transparent !important;
                font-weight: 600 !important;
                text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3) !important;
                color: white !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            
            h1, h2, h3, h4, h5, h6, p, span, div, a, button {
                -webkit-font-smoothing: antialiased !important;
                text-rendering: optimizeLegibility !important;
            }
            
            .section-title, .actualites-locales, h2 {
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5) !important;
                font-weight: 700 !important;
                color: white !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    function fixChatPositioning() {
        const waitForChat = setInterval(() => {
            const chatContainer = document.querySelector('.chat-container');
            if (chatContainer) {
                clearInterval(waitForChat);
                applyChatFixes(chatContainer);
            }
        }, 500);
        
        setTimeout(() => clearInterval(waitForChat), 10000);
    }
    
    function applyChatFixes(chatContainer) {
        const style = document.createElement('style');
        style.id = 'ios-chat-fixes-v23';
        style.textContent = `
            /* CHAT OPTIMISÉ POUR iOS - TOUS LES THÈMES */
            
            .chat-container {
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                width: min(380px, calc(100vw - 40px)) !important;
                height: calc(70vh - var(--ios-safe-bottom, 0px)) !important;
                max-height: calc(70vh - var(--ios-safe-bottom, 0px)) !important;
                z-index: 10000 !important;
                border-radius: 20px !important;
                overflow: hidden !important;
                backdrop-filter: blur(20px) !important;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;
            }
            
            .chat-messages {
                height: calc(100% - 100px) !important;
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch !important;
                padding: 20px !important;
                padding-bottom: 10px !important;
            }
            
            .chat-input {
                position: absolute !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                padding: 15px 20px !important;
                padding-bottom: calc(15px + var(--ios-safe-bottom, 0px)) !important;
                backdrop-filter: blur(10px) !important;
            }
            
            .chat-input textarea {
                width: 100% !important;
                font-size: 16px !important;
                min-height: 40px !important;
                max-height: 100px !important;
                resize: none !important;
                border-radius: 20px !important;
                padding: 12px 16px !important;
                box-sizing: border-box !important;
            }
            
            .chat-input button {
                margin-top: 10px !important;
                padding: 10px 20px !important;
                border-radius: 20px !important;
                font-size: 16px !important;
                border: none !important;
                font-weight: 600 !important;
            }
            
            /* THÈME LIGHT (Violet) */
            [data-theme="light"] .chat-container {
                background: rgba(255, 255, 255, 0.95) !important;
                border: 2px solid rgba(126, 87, 194, 0.3) !important;
            }
            
            [data-theme="light"] .chat-header {
                background: rgb(119, 92, 189) !important;
                border-bottom: 1px solid rgba(126, 87, 194, 0.2) !important;
                color: #7e57c2 !important;
            }
            
            [data-theme="light"] .chat-input {
                background: rgb(119, 92, 189) !important;
                border-top: 1px solid rgba(126, 87, 194, 0.2) !important;
            }
            
            [data-theme="light"] .chat-input textarea {
                background: rgb(170, 145, 233) !important;
                border: 1px solid rgba(126, 87, 194, 0.3) !important;
                color: #f3eded !important;
            }
            
            [data-theme="light"] .chat-input textarea::placeholder {
                color: rgba(51, 51, 51, 0.6) !important;
            }
            
            [data-theme="light"] .chat-input button {
                background: #7e57c2 !important;
                color: white !important;
            }
            
            [data-theme="light"] .chat-input .material-icons {
                color: #7e57c2 !important;
            }
            
            [data-theme="light"] .chat-messages {
                background: rgb(106, 85, 185) !important;
            }
            
            /* THÈME DARK (Bleu foncé) */
            [data-theme="dark"] .chat-container {
                background: rgba(26, 35, 126, 0.95) !important;
                border: 2px solid rgba(255, 255, 255, 0.2) !important;
            }
            
            [data-theme="dark"] .chat-header {
                background: rgba(30, 40, 140, 0.8) !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
                color: #90caf9 !important;
            }
            
            [data-theme="dark"] .chat-input {
                background: rgba(30, 40, 140, 0.9) !important;
                border-top: 1px solid rgba(255, 255, 255, 0.2) !important;
            }
            
            [data-theme="dark"] .chat-input textarea {
                background: rgba(255, 255, 255, 0.1) !important;
                border: 1px solid rgba(255, 255, 255, 0.3) !important;
                color: white !important;
            }
            
            [data-theme="dark"] .chat-input textarea::placeholder {
                color: rgba(255, 255, 255, 0.6) !important;
            }
            
            [data-theme="dark"] .chat-input button {
                background: #1a237e !important;
                color: white !important;
            }
            
            [data-theme="dark"] .chat-input .material-icons {
                color: #ffffff !important;
            }
            
            [data-theme="dark"] .chat-messages {
                background: rgb(25, 32, 95) !important;
            }
            
            /* THÈME ROUGE */
            [data-theme="rouge"] .chat-container {
                background: linear-gradient(145deg, #b71c1c, #e53935) !important;
                border: 2px solid rgba(255, 255, 255, 0.3) !important;
            }
            
            [data-theme="rouge"] .chat-header {
                background: rgb(164, 48, 34) !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.3) !important;
                color: #ffeb3b !important;
            }
            
            [data-theme="rouge"] .chat-input {
                background: rgb(148, 58, 39) !important;
                border-top: 1px solid rgba(255, 255, 255, 0.3) !important;
            }
            
            [data-theme="rouge"] .chat-input textarea {
                background: rgba(255, 255, 255, 0.15) !important;
                border: 1px solid rgba(255, 255, 255, 0.4) !important;
                color: white !important;
            }
            
            [data-theme="rouge"] .chat-input textarea::placeholder {
                color: rgba(255, 255, 255, 0.7) !important;
            }
            
            [data-theme="rouge"] .chat-input button {
                background: #ffeb3b !important;
                color: white !important;
            }
            
            [data-theme="rouge"] .chat-input .material-icons {
                color: white !important;
            }
            
            /* THÈME BLEU CIEL */
            [data-theme="bleuciel"] .chat-container {
                background: linear-gradient(145deg, #0277bd, #03a9f4) !important;
                border: 2px solid rgba(255, 255, 255, 0.3) !important;
            }
            
            [data-theme="bleuciel"] .chat-header {
                background: rgba(255, 255, 255, 0.2) !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.3) !important;
                color: white !important;
            }
            
            [data-theme="bleuciel"] .chat-input {
                background: rgba(255, 255, 255, 0.2) !important;
                border-top: 1px solid rgba(255, 255, 255, 0.3) !important;
            }
            
            [data-theme="bleuciel"] .chat-input textarea {
                background: rgba(255, 255, 255, 0.2) !important;
                border: 1px solid rgba(255, 255, 255, 0.4) !important;
                color: white !important;
            }
            
            [data-theme="bleuciel"] .chat-input textarea::placeholder {
                color: rgba(255, 255, 255, 0.7) !important;
            }
            
            [data-theme="bleuciel"] .chat-input button {
                background: #0277bd !important;
                color: white !important;
            }
            
            [data-theme="bleuciel"] .chat-input .material-icons {
                color: white !important;
            }
            
            /* THÈME SUNSET */
            [data-theme="sunset"] .chat-container {
                background: linear-gradient(145deg, #ff6f00, #ff9800, #ffc107) !important;
                border: 2px solid rgba(255, 255, 255, 0.3) !important;
            }
            
            [data-theme="sunset"] .chat-header {
                background: rgba(0, 0, 0, 0.15) !important;
                border-bottom: 1px solid rgba(0, 0, 0, 0.2) !important;
                color: #1a1a1a !important;
            }
            
            [data-theme="sunset"] .chat-input {
                background: rgba(0, 0, 0, 0.15) !important;
                border-top: 1px solid rgba(0, 0, 0, 0.2) !important;
            }
            
            [data-theme="sunset"] .chat-input textarea {
                background: rgba(0, 0, 0, 0.1) !important;
                border: 1px solid rgba(0, 0, 0, 0.2) !important;
                color: #1a1a1a !important;
            }
            
            [data-theme="sunset"] .chat-input textarea::placeholder {
                color: rgba(26, 26, 26, 0.7) !important;
            }
            
            [data-theme="sunset"] .chat-input button {
                background: #ff6f00 !important;
                color: white !important;
            }
            
            [data-theme="sunset"] .chat-input .material-icons {
                color: #1a1a1a !important;
            }
            
            /* THÈME OCÉAN */
            [data-theme="ocean"] .chat-container {
                background: linear-gradient(145deg, #006064, #0097A7) !important;
                border: 2px solid rgba(255, 255, 255, 0.3) !important;
            }
            
            [data-theme="ocean"] .chat-header {
                background: rgba(0, 0, 0, 0.2) !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.3) !important;
                color: #B3E5FC !important;
            }
            
            [data-theme="ocean"] .chat-input {
                background: rgba(0, 0, 0, 0.2) !important;
                border-top: 1px solid rgba(255, 255, 255, 0.3) !important;
            }
            
            [data-theme="ocean"] .chat-input textarea {
                background: rgba(255, 255, 255, 0.15) !important;
                border: 1px solid rgba(255, 255, 255, 0.4) !important;
                color: white !important;
            }
            
            [data-theme="ocean"] .chat-input textarea::placeholder {
                color: rgba(255, 255, 255, 0.7) !important;
            }
            
            [data-theme="ocean"] .chat-input button {
                background: #006064 !important;
                color: white !important;
            }
            
            [data-theme="ocean"] .chat-input .material-icons {
                color: white !important;
            }
            
            /* THÈME SUPER LIGHT */
            [data-theme="super-light"] .chat-container {
                background: rgba(255, 255, 255, 0.98) !important;
                border: 2px solid rgba(99, 102, 241, 0.3) !important;
                backdrop-filter: blur(20px) brightness(1.1) !important;
                box-shadow: 0 20px 60px rgba(99, 102, 241, 0.25) !important;
            }
            
            [data-theme="super-light"] .chat-header {
                background: linear-gradient(135deg, #6366F1, #8B5CF6) !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
                color: white !important;
            }
            
            [data-theme="super-light"] .chat-input {
                background: rgba(248, 250, 252, 0.95) !important;
                border-top: 1px solid rgba(99, 102, 241, 0.2) !important;
                backdrop-filter: blur(10px) !important;
            }
            
            [data-theme="super-light"] .chat-input textarea {
                background: rgba(255, 255, 255, 0.95) !important;
                border: 1px solid rgba(99, 102, 241, 0.3) !important;
                color: #1F2937 !important;
                backdrop-filter: blur(5px) !important;
            }
            
            [data-theme="super-light"] .chat-input textarea::placeholder {
                color: rgba(31, 41, 55, 0.6) !important;
            }
            
            [data-theme="super-light"] .chat-input button {
                background: linear-gradient(135deg, #6366F1, #8B5CF6) !important;
                color: white !important;
                box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3) !important;
            }
            
            [data-theme="super-light"] .chat-input .material-icons {
                color: #6366F1 !important;
            }
            
            [data-theme="super-light"] .chat-messages {
                background: rgba(248, 250, 252, 0.9) !important;
                backdrop-filter: blur(10px) !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    function handleOrientationChange() {
        window.addEventListener('orientationchange', () => {
            console.log('Changement orientation iOS');
            
            setTimeout(() => {
                fixViewportHeight();
                
                const chatContainer = document.querySelector('.chat-container');
                if (chatContainer && !chatContainer.classList.contains('hidden')) {
                    chatContainer.style.transform = 'translate(-50%, -50%)';
                }
            }, 500);
        });
    }
    
    function preventInputZoom() {
        const style = document.createElement('style');
        style.id = 'ios-input-zoom-prevention-v23';
        style.textContent = `
            input, textarea, select {
                font-size: 16px !important;
                transform: translateZ(0);
                -webkit-appearance: none;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialiser
    setTimeout(initFixes, 500);
    
    // Exposer pour debug
    window.iOSFixesV23Active = true;
    
	// 🆕 NOUVELLES CORRECTIONS POSITIONNEMENT
function fixHeaderButtons() {
    const menuButton = document.getElementById('menuButton');
    const settingsButton = document.getElementById('settingsButton');
    
    if (menuButton) {
        menuButton.style.top = '50px';
        menuButton.style.position = 'fixed';
        menuButton.style.zIndex = '9998';
    }
    
    if (settingsButton) {
        settingsButton.style.top = '50px';
        settingsButton.style.position = 'fixed';
        settingsButton.style.zIndex = '9998';
    }
}

function fixSiteLogo() {
    const siteLogo = document.querySelector('.site-logo, .logo-text');
    if (siteLogo) {
        siteLogo.style.marginTop = '20px';
        siteLogo.style.paddingTop = '10px';
    }
}

function fixNewsButton() {
    const newsButton = document.querySelector('.news-button');
    if (newsButton) {
        newsButton.style.marginTop = '15px';
        newsButton.style.position = 'relative';
    }
}

function fixNewsWidget() {
    const newsWidget = document.querySelector('.local-news-widget');
    if (newsWidget) {
        newsWidget.style.marginTop = '20px';
        newsWidget.style.position = 'relative';
    }
}

function fixNewsTicker() {
    const newsTicker = document.querySelector('.news-ticker');
    const bottomNav = document.querySelector('.bottom-nav');
    
    if (newsTicker && bottomNav) {
        newsTicker.style.bottom = '70px';
        newsTicker.style.position = 'fixed';
        newsTicker.style.zIndex = '1000';
    }
    
    if (bottomNav) {
        bottomNav.style.bottom = '0';
        bottomNav.style.paddingBottom = 'env(safe-area-inset-bottom)';
    }
}

function fixChatZIndex() {
    const chatElements = [
        '.chat-container',
        '.chat-widget', 
        '.chat-overlay',
        '#chatContainer',
        '[class*="chat"]'
    ];
    
    chatElements.forEach(selector => {
        const chatElement = document.querySelector(selector);
        if (chatElement) {
            chatElement.style.zIndex = '99999';
            chatElement.style.position = 'fixed';
        }
    });
    
    const openChat = document.querySelector('.chat-open, .chat-active, .chat-visible');
    if (openChat) {
        openChat.style.zIndex = '99999';
        openChat.style.position = 'fixed';
    }
}

})();