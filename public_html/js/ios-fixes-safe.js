// ios-fixes-safe.js - Version 2.3 - Compatibilité avec widgets.css - CORRIGÉ
(function() {
    'use strict';
    
    // Détection iOS ultra-précise - ERREUR CORRIGÉE
    const isReallyIOS = () => {
        const ua = navigator.userAgent;
        const platform = navigator.platform;
        
        const iosPattern = /iPad|iPhone|iPod/.test(ua);
        const notAndroid = !(/Android/.test(ua));
        const notMSStream = !window.MSStream;
        const isPadOnIOS13 = platform === 'MacIntel' && navigator.maxTouchPoints > 1;
        
        return (iosPattern || isPadOnIOS13) && notAndroid && notMSStream; // CORRIGÉ
    };
    
    if (!isReallyIOS()) {
        console.log('Non-iOS détecté - Aucune modification appliquée');
        return;
    }
    
    console.log('🍎 iOS détecté - Application des corrections v2.3 (compatibilité widgets.css)');
    
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
            /* CORRECTIONS SPÉCIFIQUES iOS - Compatible avec widgets.css */
            
            /* Empêcher les tuiles de passer sous la navigation */
            .tile-container, #tileContainer, .main-content {
                padding-bottom: calc(120px + var(--ios-safe-bottom, 0px)) !important;
                margin-bottom: 20px !important;
            }
            
            /* Corriger la barre d'infos déroulante (ticker) */
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
            
            /* REPOSITIONNER LES BOUTONS WIDGETS SUR iOS UNIQUEMENT */
            
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
                
                /* S'assurer que le weather-show-btn standard est caché sur mobile iOS */
                .weather-show-btn {
                    display: none !important;
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
            
            /* PANNEAU INFOS EN DIRECT - Z-INDEX SUPÉRIEUR AUX WIDGETS */
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
            
            /* S'assurer que le contenu du panneau est au-dessus */
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
            
            /* Force un meilleur rendu du texte sur iOS */
            * {
                -webkit-font-smoothing: antialiased !important;
                -moz-osx-font-smoothing: grayscale !important;
                text-rendering: optimizeLegibility !important;
            }
            
            /* Correction spécifique pour les tuiles */
            .tile, .tile-title, .tile h3, .tile p, .tile span,
            .grid-item, .grid-item h3, .grid-item p, .grid-item span {
                -webkit-font-smoothing: antialiased !important;
                -webkit-text-stroke: 0.1px transparent !important;
                font-weight: 600 !important;
                text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3) !important;
                color: white !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            
            /* Assurer la lisibilité sur tous les éléments de texte */
            h1, h2, h3, h4, h5, h6, p, span, div, a, button {
                -webkit-font-smoothing: antialiased !important;
                text-rendering: optimizeLegibility !important;
            }
            
            /* Correction pour les titres de section */
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
            /* CHAT OPTIMISÉ POUR iOS v2.3 - AVEC VOS COULEURS PERSONNALISÉES */
            
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
            
            /* ==== THÈME LIGHT (Violet) - VOS COULEURS ==== */
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
            
            /* ==== THÈME DARK (Bleu foncé) - VOS COULEURS ==== */
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
            
            /* ==== THÈME ROUGE - VOS COULEURS ==== */
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
            
            /* ==== THÈME BLEU CIEL - VOS COULEURS ==== */
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
    
})();