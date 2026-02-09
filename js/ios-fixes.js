// ios-fixes.js - Corrections d'affichage iOS pour Actu & Média
// Version 2.1 - Mise à jour janvier 2026
(function() {
    'use strict';

    // Détection iOS
    function isiOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    // Détection iPad sur iOS 13+
    function isIPadOS() {
        return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    }
    
    // Détection iOS 18+ (nouveaux comportements)
    function isiOS18Plus() {
        const match = navigator.userAgent.match(/OS (\d+)_/);
        return match && parseInt(match[1]) >= 18;
    }

    // Application des fixes iOS au chargement du DOM
    document.addEventListener('DOMContentLoaded', function() {
        if (isiOS() || isIPadOS()) {
            // Ajouter une classe au body pour cibler iOS
            document.body.classList.add('ios-device');
            
            console.log('📱 iOS détecté - Application des corrections pour Actu & Média v2.1...');
            
            // Créer et ajouter les styles CSS pour iOS
            const style = document.createElement('style');
            style.id = 'ios-fixes-styles';
            style.textContent = `
                /* ========================================
                   ACTU & MÉDIA - iOS FIXES v2.1
                   ======================================== */
                
                /* Variables pour les espacements iOS */
                :root {
                    --ios-safe-area-top: env(safe-area-inset-top, 20px);
                    --ios-safe-area-bottom: env(safe-area-inset-bottom, 34px);
                    --ios-safe-area-left: env(safe-area-inset-left, 0px);
                    --ios-safe-area-right: env(safe-area-inset-right, 0px);
                }
				
				/* Support Dynamic Island (iPhone 14 Pro+) */
                @supports (padding-top: env(safe-area-inset-top)) {
                    .ios-device .header {
                        padding-top: max(1rem, env(safe-area-inset-top)) !important;
                    }
                }
                
                /* ========== HEADER ========== */
                .ios-device .header {
                    padding-top: calc(1rem + var(--ios-safe-area-top)) !important;
                    position: sticky !important;
                    top: 0 !important;
                    z-index: 100 !important;
                }

                .ios-device .header-actions {
                    top: calc(1rem + var(--ios-safe-area-top)) !important;
                }

                /* Fix icônes header alignement horizontal */
                .ios-device .header-left {
                    display: flex !important;
                    flex-direction: row !important;
                    align-items: center !important;
                    gap: 0.5rem !important;
                }

                .ios-device .header-left .header-btn {
                    display: flex !important;
                    flex-shrink: 0 !important;
                }

                /* ========== MÉTÉO - Supprimer surbrillance ========== */
                .ios-device .weather-widget,
                .ios-device .weather-widget * {
                    -webkit-tap-highlight-color: transparent !important;
                    -webkit-touch-callout: none !important;
                    -webkit-user-select: none !important;
                    user-select: none !important;
                    background-color: transparent !important;
                }

                .ios-device .weather-day {
                    -webkit-tap-highlight-color: transparent !important;
                }

                /* ========== TUILES - Espacement uniforme ========== */
                .ios-device .quick-links-grid,
                .ios-device .tiles-grid {
                    grid-template-columns: repeat(2, 1fr) !important;
                    gap: 1rem !important;
                }

                .ios-device .quick-link-tile,
                .ios-device .tile {
                    margin: 0 !important;
                }

                /* Fix tuiles supplémentaires */
                .ios-device .extra-tiles {
                    display: grid !important;
                    grid-template-columns: repeat(2, 1fr) !important;
                    gap: 1rem !important;
                    margin-top: 1rem !important;
                }

                .ios-device .extra-tiles .quick-link-tile,
                .ios-device .extra-tiles .tile {
                    margin: 0 !important;
                }
                
                /* ========== NAVIGATION ========== */
                .ios-device .nav-tabs {
                    position: sticky !important;
                    top: calc(70px + var(--ios-safe-area-top)) !important;
                    z-index: 90 !important;
                }
                
                /* ========== CONTENU PRINCIPAL ========== */
                .ios-device .main-content {
                    padding-bottom: calc(100px + var(--ios-safe-area-bottom)) !important;
                }
                
                .ios-device .news-feed {
                    padding-bottom: calc(120px + var(--ios-safe-area-bottom)) !important;
                }
                
                /* ========== FOOTER ========== */
                .ios-device .footer {
                    padding-bottom: calc(1rem + var(--ios-safe-area-bottom)) !important;
                }
                
                /* ========== RADIO WIDGET ========== */
                .ios-device #radioWidget {
                    bottom: calc(16px + var(--ios-safe-area-bottom)) !important;
                }
                
                .ios-device.radio-playing .footer {
                    margin-bottom: calc(110px + var(--ios-safe-area-bottom)) !important;
                }
                
                /* ========== MODAL RADIO ========== */
                .ios-device .radio-modal {
                    padding-bottom: var(--ios-safe-area-bottom) !important;
                    max-height: calc(90vh - var(--ios-safe-area-bottom)) !important;
                }
                
                .ios-device .radio-stations-container {
                    padding-bottom: calc(2rem + var(--ios-safe-area-bottom)) !important;
                    -webkit-overflow-scrolling: touch !important;
                }
                
                /* ========== POPUP MINUTEUR ========== */
                .ios-device .sleep-timer-popup {
                    bottom: calc(200px + var(--ios-safe-area-bottom)) !important;
                    max-height: calc(70vh - var(--ios-safe-area-bottom)) !important;
                    overflow-y: auto !important;
                    -webkit-overflow-scrolling: touch !important;
                }
                
                /* ========== WIDGETS PANEL / SUPPORT PANEL ========== */
                .ios-device .widgets-panel,
                .ios-device .support-panel {
                    padding-top: calc(1rem + var(--ios-safe-area-top)) !important;
                    padding-bottom: calc(1rem + var(--ios-safe-area-bottom)) !important;
                    max-height: 100vh !important;
                    -webkit-overflow-scrolling: touch !important;
                }
                
                /* ========== TOAST NOTIFICATIONS ========== */
                .ios-device .toast,
                .ios-device .radio-toast {
                    bottom: calc(100px + var(--ios-safe-area-bottom)) !important;
                }
                
                /* ========== MODALS ========== */
                .ios-device .modal-overlay,
                .ios-device .image-modal {
                    padding-bottom: var(--ios-safe-area-bottom) !important;
                }
                
                .ios-device .modal-content {
                    max-height: calc(90vh - var(--ios-safe-area-top) - var(--ios-safe-area-bottom)) !important;
                    -webkit-overflow-scrolling: touch !important;
                }
                
                /* ========== FORMULAIRES - ÉVITER LE ZOOM ========== */
                .ios-device select,
                .ios-device input[type="text"],
                .ios-device input[type="email"],
                .ios-device input[type="tel"],
                .ios-device input[type="time"],
                .ios-device input[type="number"],
                .ios-device input[type="search"],
                .ios-device textarea {
                    font-size: 16px !important;
                    -webkit-text-size-adjust: 100% !important;
                }
                
                /* ========== SCROLL AMÉLIORÉ ========== */
                .ios-device .news-feed,
                .ios-device .widgets-panel-content,
                .ios-device .radio-stations-container,
                .ios-device .modal-content,
                .ios-device .support-content,
                .ios-device .comments-container {
                    -webkit-overflow-scrolling: touch !important;
                    overscroll-behavior-y: contain !important;
                }
                
                /* ========== FIX POUR LES BOUTONS ========== */
                .ios-device .btn,
                .ios-device .glass-btn,
                .ios-device .header-btn,
                .ios-device button {
                    -webkit-tap-highlight-color: transparent !important;
                    touch-action: manipulation !important;
                }
                
                /* ========== ANNONCES ========== */
                .ios-device .annonces-section {
                    padding-bottom: calc(100px + var(--ios-safe-area-bottom)) !important;
                }
                
                /* ========== MÉTÉO WIDGET ========== */
                .ios-device .weather-widget {
                    -webkit-overflow-scrolling: touch !important;
                }
                
                /* ========== NOUVELLE DISPOSITION CARTES COMMUNAUTÉ ========== */
                .ios-device .community-item-header {
                    display: flex !important;
                    flex-wrap: nowrap !important;
                    align-items: center !important;
                }
                
                .ios-device .community-item-footer {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                }
                
                .ios-device .community-item-location,
                .ios-device .community-item-views {
                    display: flex !important;
                    align-items: center !important;
                    white-space: nowrap !important;
                }
                
                /* ========== BOUTONS VOIR PLUS / COMMENTER ========== */
                .ios-device .see-more-btn,
                .ios-device .comments-toggle-btn {
                    -webkit-tap-highlight-color: transparent !important;
                    touch-action: manipulation !important;
                }
                
                /* ========== SÉLECTEUR TAILLE DE TEXTE ========== */
                .ios-device .font-size-selector {
                    display: flex !important;
                    flex-wrap: nowrap !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                
                .ios-device .font-size-btn {
                    -webkit-tap-highlight-color: transparent !important;
                    touch-action: manipulation !important;
                    min-width: 44px !important;
                    min-height: 44px !important;
                }
                
                /* ========== SECTION COMMENTAIRES ========== */
                .ios-device .comments-container {
                    -webkit-overflow-scrolling: touch !important;
                }
                
                .ios-device .comment-input,
                .ios-device .comment-textarea {
                    font-size: 16px !important;
                    -webkit-appearance: none !important;
                    border-radius: 8px !important;
                }
                
                .ios-device .comment-submit-btn {
                    min-height: 44px !important;
                }
                
                /* ========== BOUTON LIKE ========== */
                .ios-device .like-btn {
                    -webkit-tap-highlight-color: transparent !important;
                    touch-action: manipulation !important;
                    min-width: 44px !important;
                    min-height: 44px !important;
                }
                
                /* ========== IMAGE MODAL (Agrandir) ========== */
                .ios-device .image-modal {
                    -webkit-overflow-scrolling: touch !important;
                }
                
                .ios-device .image-modal-content img {
                    max-height: calc(90vh - var(--ios-safe-area-top) - var(--ios-safe-area-bottom)) !important;
                }
                
                .ios-device .image-modal-close {
                    top: calc(1rem + var(--ios-safe-area-top)) !important;
                }
                
                /* ========== SECTION SEO ========== */
                .ios-device .seo-section {
                    padding-bottom: calc(1rem + var(--ios-safe-area-bottom)) !important;
                }
                
                /* ========== NEWS TICKER / SWIPER ========== */
                .ios-device .news-ticker-container {
                    -webkit-overflow-scrolling: touch !important;
                }
                
                .ios-device .ticker-nav-btn {
                    min-width: 44px !important;
                    min-height: 44px !important;
                }
                
                /* ========== CINEMA SECTION ========== */
                .ios-device .cinema-films {
                    -webkit-overflow-scrolling: touch !important;
                }
                
                .ios-device .cinema-film {
                    -webkit-tap-highlight-color: transparent !important;
                }
                
                /* ========== INSTALL PROMPT ========== */
                .ios-device .install-prompt {
                    bottom: calc(1rem + var(--ios-safe-area-bottom)) !important;
                }
                
                /* ========== NOTIFICATION PROMPT ========== */
                .ios-device .notif-prompt {
                    bottom: calc(1rem + var(--ios-safe-area-bottom)) !important;
                }
                
                /* ========== MODE PAYSAGE ========== */
                @media (orientation: landscape) {
                    .ios-device #radioWidget {
                        bottom: calc(10px + var(--ios-safe-area-bottom)) !important;
                    }
                    
                    .ios-device .radio-modal {
                        max-height: calc(95vh - var(--ios-safe-area-bottom)) !important;
                    }
                    
                    .ios-device .main-content {
                        padding-bottom: calc(80px + var(--ios-safe-area-bottom)) !important;
                    }
                    
                    .ios-device .support-panel {
                        width: 50vw !important;
                        max-width: 400px !important;
                    }
                }
                
                /* ========== PETITS ÉCRANS (iPhone SE, etc.) ========== */
                @media (max-width: 375px) {
                    .ios-device #radioWidget {
                        width: calc(100% - 1rem) !important;
                    }
                    
                    .ios-device .radio-widget-btn {
                        width: 42px !important;
                        height: 42px !important;
                    }
                    
                    .ios-device .sleep-timer-popup {
                        min-width: 160px !important;
                        padding: 10px !important;
                    }
                    
                    .ios-device .community-item-header {
                        flex-wrap: wrap !important;
                        gap: 0.25rem !important;
                    }
                    
                    .ios-device .font-size-selector {
                        flex-wrap: wrap !important;
                        gap: 0.5rem !important;
                    }
                    
                    .ios-device .font-size-btn {
                        min-width: 40px !important;
                        min-height: 40px !important;
                        padding: 0.4rem 0.8rem !important;
                    }
                }
                
                /* ========== GRANDS ÉCRANS (iPad) ========== */
                @media (min-width: 768px) {
                    .ios-device .radio-modal {
                        max-width: 500px !important;
                        margin: 0 auto !important;
                    }
                    
                    .ios-device .widgets-panel,
                    .ios-device .support-panel {
                        width: 400px !important;
                    }
                    
                    .ios-device .community-item {
                        max-width: 600px !important;
                        margin-left: auto !important;
                        margin-right: auto !important;
                    }
                }
                
                /* ========== CLAVIER VIRTUEL OUVERT ========== */
                .ios-device.keyboard-visible #radioWidget {
                    position: relative !important;
                    bottom: auto !important;
                }
                
                .ios-device.keyboard-visible .footer {
                    display: none !important;
                }
                
                .ios-device.keyboard-visible .install-prompt,
                .ios-device.keyboard-visible .notif-prompt {
                    display: none !important;
                }
                
                /* ========== PWA STANDALONE MODE ========== */
                @media (display-mode: standalone) {
                    .ios-device .header {
                        padding-top: calc(1.5rem + var(--ios-safe-area-top)) !important;
                    }
                    
                    .ios-device .footer {
                        padding-bottom: calc(1.5rem + var(--ios-safe-area-bottom)) !important;
                    }
                    
                    .ios-device .support-panel {
                        padding-top: calc(1.5rem + var(--ios-safe-area-top)) !important;
                    }
                }
                
                /* ========== ACCESSIBILITÉ - TAILLE MINIMALE TOUCH ========== */
                .ios-device .header-btn,
                .ios-device .ticker-nav-btn,
                .ios-device .theme-option,
                .ios-device .support-close,
                .ios-device .tiles-toggle {
                    min-width: 44px !important;
                    min-height: 44px !important;
                }
            `;
            document.head.appendChild(style);
            
            console.log('✅ iOS fixes CSS appliqués pour Actu & Média v2.1');
            
            // ========== DÉTECTION DU CLAVIER VIRTUEL ==========
            let initialHeight = window.innerHeight;
            let resizeTimer;
            
            window.addEventListener('resize', function() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function() {
                    const currentHeight = window.innerHeight;
                    
                    if (currentHeight < initialHeight * 0.75) {
                        document.body.classList.add('keyboard-visible');
                        console.log('⌨️ Clavier virtuel détecté');
                    } else {
                        document.body.classList.remove('keyboard-visible');
                    }
                }, 150); // Attendre 150ms après la fin du resize
            });
            
            // ========== FIX SCROLL BOUNCE ==========
            document.body.addEventListener('touchmove', function(e) {
                const radioModal = document.querySelector('.radio-modal-overlay.show');
                const imageModal = document.querySelector('.image-modal.show');
                
                if (radioModal || imageModal) {
                    const scrollableContainers = [
                        '.radio-stations-container',
                        '.image-modal-content'
                    ];
                    
                    let isInsideScrollable = false;
                    scrollableContainers.forEach(selector => {
                        const container = document.querySelector(selector);
                        if (container && container.contains(e.target)) {
                            isInsideScrollable = true;
                        }
                    });
                    
                    if (!isInsideScrollable) {
                        e.preventDefault();
                    }
                }
            }, { passive: false });
            
            // ========== FIX POUR LES LIENS ET BOUTONS ==========
            document.querySelectorAll('a, button').forEach(el => {
                el.addEventListener('touchstart', function() {}, { passive: true });
            });
            
            // ========== FIX DOUBLE-TAP ZOOM ==========
            let lastTouchEnd = 0;
            document.addEventListener('touchend', function(e) {
                const now = Date.now();
                if (now - lastTouchEnd <= 300) {
                    // Éviter le double-tap zoom sauf sur les inputs
                    if (!e.target.matches('input, textarea, select')) {
                        e.preventDefault();
                    }
                }
                lastTouchEnd = now;
            }, { passive: false });
            
            // ========== OBSERVER POUR LES ÉLÉMENTS DYNAMIQUES ==========
            let observerTimeout;
            const observer = new MutationObserver(function(mutations) {
                // Throttle pour éviter trop d'appels
                clearTimeout(observerTimeout);
                observerTimeout = setTimeout(function() {
                    mutations.forEach(function(mutation) {
                        mutation.addedNodes.forEach(function(node) {
                            if (node.nodeType === 1) {
                                // Appliquer les fixes aux nouveaux boutons/liens
                                const interactiveElements = node.querySelectorAll ? 
                                    node.querySelectorAll('a, button') : [];
                                interactiveElements.forEach(el => {
                                    // Vérifier si l'événement n'est pas déjà attaché
                                    if (!el.dataset.iosTouchFixed) {
                                        el.addEventListener('touchstart', function() {}, { passive: true });
                                        el.dataset.iosTouchFixed = 'true';
                                    }
                                });
                            }
                        });
                    });
                }, 100);
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            // ========== FIX VIEWPORT iOS 15+ ==========
            // Empêcher le zoom non désiré sur focus d'input
            const viewportMeta = document.querySelector('meta[name="viewport"]');
            if (viewportMeta) {
                const originalContent = viewportMeta.getAttribute('content');
                
                // Sur focus d'input, désactiver temporairement le zoom
                document.addEventListener('focusin', function(e) {
                    if (e.target.matches('input, textarea, select')) {
                        viewportMeta.setAttribute('content', 
                            originalContent + ', maximum-scale=1.0');
                    }
                });
                
                // Sur blur, restaurer
                document.addEventListener('focusout', function(e) {
                    if (e.target.matches('input, textarea, select')) {
                        viewportMeta.setAttribute('content', originalContent);
                    }
                });
            }
            
            console.log('📱 iOS fixes complets appliqués pour Actu & Média v2.1');
        }
    });
    
    // Exposer pour debug
    window.checkiOS = function() {
        console.log('=== iOS Debug Info ===');
        console.log('iOS:', isiOS());
        console.log('iPadOS:', isIPadOS());
        console.log('User Agent:', navigator.userAgent);
        console.log('Platform:', navigator.platform);
        console.log('Max Touch Points:', navigator.maxTouchPoints);
        console.log('Standalone:', window.navigator.standalone);
        console.log('Screen:', window.screen.width + 'x' + window.screen.height);
        console.log('Viewport:', window.innerWidth + 'x' + window.innerHeight);
        console.log('Device Pixel Ratio:', window.devicePixelRatio);
        console.log('=====================');
    };
    
})();