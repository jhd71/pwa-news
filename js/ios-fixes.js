// ios-fixes.js - Corrections d'affichage iOS pour Actu & Média
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

    // Application des fixes iOS au chargement du DOM
    document.addEventListener('DOMContentLoaded', function() {
        if (isiOS() || isIPadOS()) {
            // Ajouter une classe au body pour cibler iOS
            document.body.classList.add('ios-device');
            
            console.log('📱 iOS détecté - Application des corrections pour Actu & Média...');
            
            // Créer et ajouter les styles CSS pour iOS
            const style = document.createElement('style');
            style.id = 'ios-fixes-styles';
            style.textContent = `
                /* ========================================
                   ACTU & MÉDIA - iOS FIXES
                   ======================================== */
                
                /* Variables pour les espacements iOS */
                :root {
                    --ios-safe-area-top: env(safe-area-inset-top, 20px);
                    --ios-safe-area-bottom: env(safe-area-inset-bottom, 34px);
                    --ios-safe-area-left: env(safe-area-inset-left, 0px);
                    --ios-safe-area-right: env(safe-area-inset-right, 0px);
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
                
                /* ========== WIDGETS PANEL ========== */
                .ios-device .widgets-panel {
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
                .ios-device .modal-overlay {
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
                .ios-device .modal-content {
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
                }
                
                /* ========== GRANDS ÉCRANS (iPad) ========== */
                @media (min-width: 768px) {
                    .ios-device .radio-modal {
                        max-width: 500px !important;
                        margin: 0 auto !important;
                    }
                    
                    .ios-device .widgets-panel {
                        width: 400px !important;
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
                
                /* ========== PWA STANDALONE MODE ========== */
                @media (display-mode: standalone) {
                    .ios-device .header {
                        padding-top: calc(1.5rem + var(--ios-safe-area-top)) !important;
                    }
                    
                    .ios-device .footer {
                        padding-bottom: calc(1.5rem + var(--ios-safe-area-bottom)) !important;
                    }
                }
            `;
            document.head.appendChild(style);
            
            console.log('✅ iOS fixes CSS appliqués pour Actu & Média');
            
            // ========== DÉTECTION DU CLAVIER VIRTUEL ==========
            let initialHeight = window.innerHeight;
            
            window.addEventListener('resize', function() {
                const currentHeight = window.innerHeight;
                
                if (currentHeight < initialHeight * 0.75) {
                    document.body.classList.add('keyboard-visible');
                    console.log('⌨️ Clavier virtuel détecté');
                } else {
                    document.body.classList.remove('keyboard-visible');
                }
            });
            
            // ========== FIX SCROLL BOUNCE ==========
            document.body.addEventListener('touchmove', function(e) {
                const radioModal = document.querySelector('.radio-modal-overlay.show');
                if (radioModal) {
                    const stationsContainer = document.querySelector('.radio-stations-container');
                    if (stationsContainer && !stationsContainer.contains(e.target)) {
                        // Permettre le scroll uniquement dans le conteneur des stations
                        if (!e.target.closest('.radio-stations-container')) {
                            e.preventDefault();
                        }
                    }
                }
            }, { passive: false });
            
            // ========== FIX POUR LES LIENS ET BOUTONS ==========
            document.querySelectorAll('a, button').forEach(el => {
                el.addEventListener('touchstart', function() {}, { passive: true });
            });
            
            console.log('📱 iOS fixes complets appliqués pour Actu & Média');
        }
    });
    
    // Exposer pour debug
    window.checkiOS = function() {
        console.log('iOS:', isiOS());
        console.log('iPadOS:', isIPadOS());
        console.log('User Agent:', navigator.userAgent);
        console.log('Platform:', navigator.platform);
        console.log('Max Touch Points:', navigator.maxTouchPoints);
        console.log('Standalone:', window.navigator.standalone);
    };
    
})();
