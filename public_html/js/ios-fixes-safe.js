// ios-fixes-safe.js - Version 5.0 SIMPLIFIÉE
// Corrections minimales et ciblées pour iPhone

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
    
    console.log('🍎 iOS détecté - Application des corrections minimales v5.0');
    
    // Attendre que le DOM soit complètement chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyIOSFixes);
    } else {
        // Attendre un peu pour que tous les widgets soient initialisés
        setTimeout(applyIOSFixes, 800);
    }
    
    function applyIOSFixes() {
        console.log('📱 Application des corrections iOS minimales...');
        
        // 1. Variables CSS pour les safe areas
        addSafeAreaSupport();
        
        // 2. Fix pour la hauteur viewport
        fixViewportHeight();
        
        // 3. Corrections MINIMALES et ciblées
        applyMinimalFixes();
        
        // 4. Fix pour les inputs (zoom)
        preventInputZoom();
        
        console.log('✅ Corrections iOS minimales appliquées');
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
    
    // 3. CORRECTIONS MINIMALES - Ne toucher QUE aux problèmes spécifiques
    function applyMinimalFixes() {
        const style = document.createElement('style');
        style.id = 'ios-minimal-fixes';
        style.textContent = `
            /* ===== CORRECTIONS MINIMALES POUR IPHONE ===== */
            
            /* 1. SAFE AREA pour le header seulement si nécessaire */
            .app-header {
                padding-top: var(--safe-area-top) !important;
            }
            
            /* 2. SAFE AREA pour la navigation du bas seulement */
            .bottom-nav {
                padding-bottom: var(--safe-area-bottom) !important;
            }
            
            /* 3. AJUSTEMENT du news ticker pour qu'il soit collé aux icônes */
            .news-ticker {
                bottom: calc(60px + var(--safe-area-bottom)) !important;
            }
            
            /* 4. Corrections SPÉCIFIQUES des problèmes iPhone observés */
            @media (max-width: 767px) {
                
                /* Bouton paramètres - légère correction position */
                .settings-btn, .quick-links-show-btn {
                    top: calc(5px + var(--safe-area-top)) !important;
                    right: 5px !important;
                }
                
                /* Bouton menu - légère correction position */
                .menu-toggle, .hamburger-menu {
                    top: calc(5px + var(--safe-area-top)) !important;
                    left: 5px !important;
                }
                
                /* Bouton "Infos en direct" - descendre légèrement */
                .news-button, .direct-info-btn {
                    margin-top: 10px !important;
                }
                
                /* Widget NEWS - espacement ajusté */
                .news-widget-container, .local-news-widget {
                    margin-top: 15px !important;
                    margin-bottom: 15px !important;
                }
                
                /* Contenu principal - marge bas pour éviter chevauchement */
                main, .main-content {
                    padding-bottom: calc(120px + var(--safe-area-bottom)) !important;
                }
                
                /* Boutons Photos et Cinéma - si ils existent, les ajuster */
                .photos-btn {
                    bottom: calc(110px + var(--safe-area-bottom)) !important;
                }
                
                .cinema-btn {
                    bottom: calc(110px + var(--safe-area-bottom)) !important;
                }
            }
            
            /* 5. Amélioration du scroll iOS */
            body {
                -webkit-overflow-scrolling: touch;
            }
            
            .scrollable,
            .chat-messages,
            .news-ticker {
                -webkit-overflow-scrolling: touch !important;
            }
            
            /* 6. Z-index minimal pour éviter les conflits */
            .app-header { z-index: 1000 !important; }
            .bottom-nav { z-index: 1000 !important; }
            .news-ticker { z-index: 999 !important; }
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
            textarea,
            select {
                font-size: 16px !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Fonction de debug simplifiée
    window.iOSDebug = {
        version: '5.0',
        
        info: () => {
            console.log('📱 iOS Fixes v5.0 - Corrections minimales');
            console.log('Safe areas:', {
                top: getComputedStyle(document.documentElement).getPropertyValue('--safe-area-top'),
                bottom: getComputedStyle(document.documentElement).getPropertyValue('--safe-area-bottom')
            });
        },
        
        reset: () => {
            ['ios-safe-areas', 'ios-minimal-fixes', 'ios-input-zoom-fix'].forEach(id => {
                const element = document.getElementById(id);
                if (element) element.remove();
            });
            console.log('🔄 Corrections supprimées');
        }
    };
    
})();