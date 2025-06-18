// ios-fixes-safe.js - Version 6.0 BASÉE SUR ANDROID
// Reproduction exacte de la mise en page Android sur iPhone

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
    
    console.log('🍎 iOS détecté - Reproduction mise en page Android v6.0');
    
    // Attendre que le DOM soit complètement chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyIOSFixes);
    } else {
        setTimeout(applyIOSFixes, 1000);
    }
    
    function applyIOSFixes() {
        console.log('📱 Application des corrections basées sur Android...');
        
        // 1. Variables CSS pour les safe areas
        addSafeAreaSupport();
        
        // 2. Fix pour la hauteur viewport
        fixViewportHeight();
        
        // 3. Corrections pour reproduire Android
        applyAndroidLayoutFixes();
        
        // 4. Fix pour les inputs
        preventInputZoom();
        
        console.log('✅ Mise en page Android reproduite sur iOS');
    }
    
    // 1. Support des safe areas iOS
    function addSafeAreaSupport() {
        const style = document.createElement('style');
        style.id = 'ios-safe-areas';
        style.textContent = `
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
    
    // 3. CORRECTIONS pour reproduire la mise en page Android
    function applyAndroidLayoutFixes() {
        const style = document.createElement('style');
        style.id = 'ios-android-layout-fixes';
        style.textContent = `
            /* ===== REPRODUCTION EXACTE DE LA MISE EN PAGE ANDROID ===== */
            
            /* 1. HEADER - Structure exacte comme sur Android */
            .app-header {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                height: calc(60px + var(--safe-area-top)) !important;
                background: #dc2626 !important;
                z-index: 1100 !important;
                padding-top: var(--safe-area-top) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                padding-left: 15px !important;
                padding-right: 15px !important;
            }
            
            /* Logo centré comme sur Android */
            .app-header .site-logo,
            .app-header h1,
            .header-title {
                flex: 1 !important;
                text-align: center !important;
                color: white !important;
                font-size: 24px !important;
                font-weight: bold !important;
                margin: 0 !important;
            }
            
            /* Bouton menu à gauche */
            .menu-toggle, .hamburger-menu {
                position: absolute !important;
                left: 15px !important;
                top: calc(var(--safe-area-top) + 10px) !important;
                width: 40px !important;
                height: 40px !important;
                z-index: 1200 !important;
                color: white !important;
            }
            
            /* Bouton paramètres à droite */
            .settings-btn, .quick-links-show-btn {
                position: absolute !important;
                right: 15px !important;
                top: calc(var(--safe-area-top) + 10px) !important;
                width: 40px !important;
                height: 40px !important;
                z-index: 1200 !important;
                color: white !important;
            }
            
            /* 2. LIGNE DES BOUTONS - Sous le header comme sur Android */
            .button-row, .header-buttons {
                position: fixed !important;
                top: calc(60px + var(--safe-area-top)) !important;
                left: 0 !important;
                right: 0 !important;
                height: 60px !important;
                background: #dc2626 !important;
                z-index: 1050 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-around !important;
                padding: 0 20px !important;
            }
            
            /* Boutons météo, essence, "Infos en direct", recherche, liens */
            .weather-mobile-btn,
            .fuel-button,
            .news-button,
            .search-button,
            .quick-links-btn {
                position: relative !important;
                width: 50px !important;
                height: 50px !important;
                border-radius: 25px !important;
                background: rgba(255,255,255,0.2) !important;
                border: none !important;
                color: white !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                z-index: 1051 !important;
            }
            
            /* Bouton "Infos en direct" spécial */
            .news-button, .direct-info-btn {
                background: rgba(255,255,255,0.9) !important;
                color: #dc2626 !important;
                padding: 10px 20px !important;
                border-radius: 25px !important;
                font-weight: bold !important;
                width: auto !important;
                min-width: 140px !important;
                height: 40px !important;
            }
            
            /* 3. CONTENU PRINCIPAL - Décalé sous les deux barres */
            main, .main-content, .container {
                margin-top: calc(120px + var(--safe-area-top)) !important;
                padding-bottom: calc(80px + var(--safe-area-bottom)) !important;
            }
            
            /* 4. WIDGET NEWS - Position correcte comme sur Android */
            .news-widget-container, .local-news-widget {
                margin-top: 0 !important;
                margin-bottom: 20px !important;
                margin-left: 10px !important;
                margin-right: 10px !important;
                background: white !important;
                border-radius: 15px !important;
                padding: 15px !important;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
            }
            
            /* 5. BOUTONS PHOTOS ET CINÉMA - En bas du widget comme sur Android */
            .photos-btn, .cinema-btn {
                position: relative !important;
                display: inline-block !important;
                margin: 10px 5px !important;
                padding: 8px 16px !important;
                background: white !important;
                color: #dc2626 !important;
                border: 2px solid #dc2626 !important;
                border-radius: 20px !important;
                font-weight: bold !important;
                text-decoration: none !important;
                font-size: 14px !important;
                z-index: auto !important;
                bottom: auto !important;
                left: auto !important;
                right: auto !important;
            }
            
            /* Container des boutons dans le widget */
            .widget-buttons, .news-widget-footer {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                margin-top: 15px !important;
                padding-top: 10px !important;
                border-top: 1px solid #eee !important;
            }
            
            /* 6. NAVIGATION DU BAS - Safe area */
            .bottom-nav {
                position: fixed !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                z-index: 1100 !important;
                padding-bottom: var(--safe-area-bottom) !important;
                background: #dc2626 !important;
            }
            
            /* 7. NEWS TICKER - Juste au-dessus de la navigation */
            .news-ticker {
                position: fixed !important;
                bottom: calc(60px + var(--safe-area-bottom)) !important;
                left: 0 !important;
                right: 0 !important;
                z-index: 1000 !important;
                height: 30px !important;
                background: rgba(0,0,0,0.8) !important;
                color: white !important;
            }
            
            /* 8. MASQUER ÉLÉMENTS EN DOUBLE sur mobile */
            @media (max-width: 767px) {
                /* Si il y a des boutons flottants en plus, les masquer */
                .floating-photos-btn,
                .floating-cinema-btn {
                    display: none !important;
                }
                
                /* S'assurer que les boutons du widget sont visibles */
                .widget-buttons .photos-btn,
                .widget-buttons .cinema-btn {
                    display: inline-block !important;
                    position: relative !important;
                }
            }
            
            /* 9. AMÉLIORATION DU SCROLL */
            body {
                -webkit-overflow-scrolling: touch;
                overflow-x: hidden;
            }
            
            .scrollable,
            .chat-messages {
                -webkit-overflow-scrolling: touch !important;
            }
            
            /* 10. Z-INDEX HIERARCHY */
            .app-header { z-index: 1100 !important; }
            .button-row { z-index: 1050 !important; }
            .bottom-nav { z-index: 1100 !important; }
            .news-ticker { z-index: 1000 !important; }
            .chat-container { z-index: 1200 !important; }
            .modal { z-index: 1300 !important; }
            
            /* 11. CORRECTIONS SPÉCIFIQUES POUR DIFFÉRENTES TAILLES D'IPHONE */
            
            /* iPhone SE et petits écrans */
            @media (max-width: 375px) {
                .button-row {
                    padding: 0 10px !important;
                }
                
                .news-button {
                    min-width: 120px !important;
                    font-size: 13px !important;
                }
            }
            
            /* iPhone Plus et grands écrans */
            @media (min-width: 414px) {
                .app-header {
                    height: calc(65px + var(--safe-area-top)) !important;
                }
                
                .button-row {
                    top: calc(65px + var(--safe-area-top)) !important;
                    height: 65px !important;
                }
                
                main, .main-content {
                    margin-top: calc(130px + var(--safe-area-top)) !important;
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
            input, textarea, select {
                font-size: 16px !important;
                -webkit-appearance: none !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Fonction de debug
    window.iOSDebug = {
        version: '6.0 Android Layout',
        
        checkLayout: () => {
            const elements = {
                'Header': '.app-header',
                'Button Row': '.button-row',
                'News Button': '.news-button',
                'News Widget': '.news-widget-container',
                'Photos Button': '.photos-btn',
                'Cinema Button': '.cinema-btn',
                'Bottom Nav': '.bottom-nav',
                'News Ticker': '.news-ticker'
            };
            
            console.log('🔍 Vérification mise en page Android sur iOS:');
            
            Object.entries(elements).forEach(([name, selector]) => {
                const element = document.querySelector(selector);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const styles = window.getComputedStyle(element);
                    console.log(`📍 ${name}:`, {
                        visible: rect.width > 0 && rect.height > 0,
                        top: rect.top,
                        position: styles.position,
                        zIndex: styles.zIndex
                    });
                } else {
                    console.log(`❌ ${name}: non trouvé (${selector})`);
                }
            });
        },
        
        info: () => {
            console.log('📱 iOS Android Layout v6.0');
            console.log('🎯 Objectif: Reproduire exactement la mise en page Android');
            this.checkLayout();
        }
    };
    
})();