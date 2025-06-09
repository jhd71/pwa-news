// ios-install-improved.js - Popup d'installation iOS avec adaptation aux thèmes
(function() {
    'use strict';
    
    // Détection iOS ultra-précise (même que le script de fix)
    const isReallyIOS = () => {
        const ua = navigator.userAgent;
        const platform = navigator.platform;
        
        const iosPattern = /iPad|iPhone|iPod/.test(ua);
        const notAndroid = !(/Android/.test(ua));
        const notMSStream = !window.MSStream;
        const isPadOnIOS13 = platform === 'MacIntel' && navigator.maxTouchPoints > 1;
        
        return (iosPattern || isPadOnIOS13) && notAndroid && notMSStream;
    };
    
    function showIOSInstallPrompt() {
        const isIOS = isReallyIOS();
        const isInStandaloneMode = window.navigator.standalone === true;
        
        console.log("Vérification iOS install:", { isIOS, isInStandaloneMode });
        
        // Ne pas afficher si pas iOS ou déjà installé
        if (!isIOS || isInStandaloneMode) {
            console.log("Conditions non remplies pour afficher le prompt iOS");
            return;
        }
        
        // Vérifier si on a déjà montré récemment
        const lastPrompt = localStorage.getItem('iosPromptShown');
        const now = Date.now();
        const showAgain = !lastPrompt || (now - parseInt(lastPrompt)) > 3 * 24 * 60 * 60 * 1000; // 3 jours
        
        if (!showAgain) {
            console.log("Prompt iOS déjà montré récemment");
            return;
        }
        
        console.log("Affichage du prompt iOS amélioré");
        
        // Supprimer tout prompt existant
        const existingPrompt = document.querySelector('.ios-install-prompt');
        if (existingPrompt) existingPrompt.remove();
        
        // Détecter le type d'appareil pour personnaliser le message
        const isIPhone = /iPhone/.test(navigator.userAgent);
        const isIPad = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        const deviceName = isIPhone ? 'iPhone' : isIPad ? 'iPad' : 'appareil';
        
        // Créer le popup moderne
        const iosPrompt = document.createElement('div');
        iosPrompt.className = 'ios-install-prompt';
        iosPrompt.innerHTML = `
            <div class="ios-prompt-overlay"></div>
            <div class="ios-prompt-card">
                <div class="ios-prompt-header">
                    <div class="ios-app-icon">
                        📱
                    </div>
                    <h3>Installer Actu&Média</h3>
                    <button class="ios-prompt-close">&times;</button>
                </div>
                
                <div class="ios-prompt-content">
                    <p class="ios-prompt-subtitle">Ajoutez notre app à votre ${deviceName} pour une expérience optimale !</p>
                    
                    <div class="ios-steps">
                        <div class="ios-step">
                            <div class="ios-step-number">1</div>
                            <div class="ios-step-content">
                                <span class="ios-step-text">Appuyez sur</span>
                                <div class="ios-share-icon">⬆️</div>
                                <span class="ios-step-text">Partager</span>
                            </div>
                        </div>
                        
                        <div class="ios-step">
                            <div class="ios-step-number">2</div>
                            <div class="ios-step-content">
                                <span class="ios-step-text">Sélectionnez</span>
                                <div class="ios-home-icon">📱</div>
                                <span class="ios-step-text">"Sur l'écran d'accueil"</span>
                            </div>
                        </div>
                        
                        <div class="ios-step">
                            <div class="ios-step-number">3</div>
                            <div class="ios-step-content">
                                <span class="ios-step-text">Appuyez sur</span>
                                <strong>"Ajouter"</strong>
                            </div>
                        </div>
                    </div>
                    
                    <div class="ios-benefits">
                        <div class="ios-benefit">
                            <span class="ios-benefit-icon">⚡</span>
                            <span>Accès instantané</span>
                        </div>
                        <div class="ios-benefit">
                            <span class="ios-benefit-icon">🔔</span>
                            <span>Notifications push</span>
                        </div>
                        <div class="ios-benefit">
                            <span class="ios-benefit-icon">📱</span>
                            <span>Mode plein écran</span>
                        </div>
                    </div>
                </div>
                
                <div class="ios-prompt-actions">
                    <button class="ios-btn-later">Plus tard</button>
                    <button class="ios-btn-install">Installer maintenant</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(iosPrompt);
        
        // Animation d'entrée
        setTimeout(() => {
            iosPrompt.classList.add('ios-prompt-visible');
        }, 100);
        
        // Gestion des événements
        const closePrompt = () => {
            iosPrompt.classList.remove('ios-prompt-visible');
            setTimeout(() => {
                if (document.body.contains(iosPrompt)) {
                    iosPrompt.remove();
                }
            }, 300);
            localStorage.setItem('iosPromptShown', now.toString());
        };
        
        // Bouton fermer (X)
        iosPrompt.querySelector('.ios-prompt-close').addEventListener('click', closePrompt);
        
        // Bouton "Plus tard"
        iosPrompt.querySelector('.ios-btn-later').addEventListener('click', closePrompt);
        
        // Bouton "Installer maintenant" - scroll vers le haut et animation de l'icône partage
        iosPrompt.querySelector('.ios-btn-install').addEventListener('click', () => {
            // Fermer le popup
            closePrompt();
            
            // Scroll vers le haut pour que l'utilisateur voie l'icône partage
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Afficher une animation pointant vers l'icône partage
            setTimeout(() => {
                showShareIconAnimation();
            }, 800);
        });
        
        // Fermer en cliquant sur l'overlay
        iosPrompt.querySelector('.ios-prompt-overlay').addEventListener('click', closePrompt);
        
        // Auto-fermeture après 20 secondes
        setTimeout(() => {
            if (document.body.contains(iosPrompt)) {
                closePrompt();
            }
        }, 20000);
    }
    
    function showShareIconAnimation() {
        // Créer une flèche pointant vers l'icône partage Safari
        const arrow = document.createElement('div');
        arrow.className = 'ios-share-arrow';
        arrow.innerHTML = `
            <div class="ios-arrow-content">
                <div class="ios-arrow-text">Appuyez ici ⬆️</div>
                <div class="ios-arrow-pointer">↗️</div>
            </div>
        `;
        
        document.body.appendChild(arrow);
        
        // Animation pulsante
        setTimeout(() => {
            arrow.classList.add('ios-arrow-visible');
        }, 100);
        
        // Supprimer après 5 secondes
        setTimeout(() => {
            arrow.classList.remove('ios-arrow-visible');
            setTimeout(() => {
                if (document.body.contains(arrow)) {
                    arrow.remove();
                }
            }, 500);
        }, 5000);
    }
    
    // Ajouter les styles CSS avec adaptation aux thèmes
    const style = document.createElement('style');
    style.id = 'ios-install-styles';
    style.textContent = `
        /* POPUP INSTALLATION iOS MODERNE - ADAPTÉ AUX THÈMES */
        .ios-install-prompt {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            z-index: 99999 !important;
            opacity: 0;
            transform: scale(0.9);
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .ios-install-prompt.ios-prompt-visible {
            opacity: 1;
            transform: scale(1);
        }
        
        .ios-prompt-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(5px);
        }
        
        .ios-prompt-card {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: min(350px, calc(100vw - 40px));
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }
        
        .ios-prompt-header {
            background: var(--primary-color, linear-gradient(135deg, #c62828, #e53935)) !important;
            color: white;
            padding: 20px;
            text-align: center;
            position: relative;
        }
        
        .ios-app-icon {
            font-size: 40px;
            margin-bottom: 10px;
            display: block;
        }
        
        .ios-prompt-header h3 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
        }
        
        .ios-prompt-close {
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        
        .ios-prompt-close:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .ios-prompt-content {
            padding: 25px;
        }
        
        .ios-prompt-subtitle {
            text-align: center;
            color: #666;
            margin: 0 0 25px 0;
            font-size: 16px;
            line-height: 1.4;
        }
        
        .ios-steps {
            margin-bottom: 25px;
        }
        
        .ios-step {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 12px;
            border: 1px solid #e9ecef;
        }
        
        .ios-step-number {
            background: var(--primary-color, #c62828) !important;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            margin-right: 12px;
            flex-shrink: 0;
        }
        
        .ios-step-content {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .ios-step-text {
            font-size: 14px;
            color: #333;
        }
        
        .ios-share-icon,
        .ios-home-icon {
            background: var(--primary-color, #c62828) !important;
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 14px;
        }
        
        .ios-benefits {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .ios-benefit {
            text-align: center;
            padding: 10px 5px;
            background: #f0f7ff;
            border-radius: 8px;
            border: 1px solid #e3f2fd;
        }
        
        .ios-benefit-icon {
            display: block;
            font-size: 20px;
            margin-bottom: 5px;
        }
        
        .ios-benefit span:last-child {
            font-size: 11px;
            color: #666;
            font-weight: 500;
        }
        
        .ios-prompt-actions {
            display: flex;
            gap: 10px;
            padding: 0 25px 25px;
        }
        
        .ios-btn-later,
        .ios-btn-install {
            flex: 1;
            padding: 12px 20px;
            border: none;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .ios-btn-later {
            background: #f8f9fa;
            color: #666;
            border: 1px solid #dee2e6;
        }
        
        .ios-btn-later:hover {
            background: #e9ecef;
        }
        
        .ios-btn-install {
            background: var(--primary-color, linear-gradient(135deg, #c62828, #e53935)) !important;
            color: white;
            box-shadow: 0 4px 15px rgba(198, 40, 40, 0.4);
        }
        
        .ios-btn-install:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(198, 40, 40, 0.6);
        }
        
        /* ANIMATION FLÈCHE PARTAGE */
        .ios-share-arrow {
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            z-index: 100000 !important;
            opacity: 0;
            transform: scale(0.8);
            transition: all 0.3s ease;
        }
        
        .ios-share-arrow.ios-arrow-visible {
            opacity: 1;
            transform: scale(1);
            animation: iosPulse 1.5s infinite;
        }
        
        .ios-arrow-content {
            background: var(--primary-color, #c62828) !important;
            color: white;
            padding: 10px 15px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(198, 40, 40, 0.4);
            position: relative;
        }
        
        .ios-arrow-text {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .ios-arrow-pointer {
            font-size: 20px;
        }
        
        @keyframes iosPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        /* ==== ADAPTATION AUX THÈMES ==== */
        
        /* Thème Light (Violet) */
        [data-theme="light"] .ios-prompt-header {
            background: linear-gradient(135deg, #7e57c2, #9575cd) !important;
        }
        
        [data-theme="light"] .ios-step-number,
        [data-theme="light"] .ios-share-icon,
        [data-theme="light"] .ios-home-icon {
            background: #7e57c2 !important;
        }
        
        [data-theme="light"] .ios-btn-install {
            background: linear-gradient(135deg, #7e57c2, #9575cd) !important;
            box-shadow: 0 4px 15px rgba(126, 87, 194, 0.4);
        }
        
        [data-theme="light"] .ios-btn-install:hover {
            box-shadow: 0 6px 20px rgba(126, 87, 194, 0.6);
        }
        
        [data-theme="light"] .ios-arrow-content {
            background: #7e57c2 !important;
            box-shadow: 0 4px 20px rgba(126, 87, 194, 0.4);
        }
        
        /* Thème Dark (Bleu foncé) */
        [data-theme="dark"] .ios-prompt-header {
            background: linear-gradient(135deg, #1a237e, #3949ab) !important;
        }
        
        [data-theme="dark"] .ios-step-number,
        [data-theme="dark"] .ios-share-icon,
        [data-theme="dark"] .ios-home-icon {
            background: #1a237e !important;
        }
        
        [data-theme="dark"] .ios-btn-install {
            background: linear-gradient(135deg, #1a237e, #3949ab) !important;
            box-shadow: 0 4px 15px rgba(26, 35, 126, 0.4);
        }
        
        [data-theme="dark"] .ios-btn-install:hover {
            box-shadow: 0 6px 20px rgba(26, 35, 126, 0.6);
        }
        
        [data-theme="dark"] .ios-arrow-content {
            background: #1a237e !important;
            box-shadow: 0 4px 20px rgba(26, 35, 126, 0.4);
        }
        
        /* Thème Rouge (par défaut) */
        [data-theme="rouge"] .ios-prompt-header {
            background: linear-gradient(135deg, #c62828, #e53935) !important;
        }
        
        [data-theme="rouge"] .ios-step-number,
        [data-theme="rouge"] .ios-share-icon,
        [data-theme="rouge"] .ios-home-icon {
            background: #c62828 !important;
        }
        
        [data-theme="rouge"] .ios-btn-install {
            background: linear-gradient(135deg, #c62828, #e53935) !important;
            box-shadow: 0 4px 15px rgba(198, 40, 40, 0.4);
        }
        
        [data-theme="rouge"] .ios-arrow-content {
            background: #c62828 !important;
            box-shadow: 0 4px 20px rgba(198, 40, 40, 0.4);
        }
        
        /* Thème Bleu Ciel */
        [data-theme="bleuciel"] .ios-prompt-header {
            background: linear-gradient(135deg, #0277bd, #03a9f4) !important;
        }
        
        [data-theme="bleuciel"] .ios-step-number,
        [data-theme="bleuciel"] .ios-share-icon,
        [data-theme="bleuciel"] .ios-home-icon {
            background: #0277bd !important;
        }
        
        [data-theme="bleuciel"] .ios-btn-install {
            background: linear-gradient(135deg, #0277bd, #03a9f4) !important;
            box-shadow: 0 4px 15px rgba(2, 119, 189, 0.4);
        }
        
        [data-theme="bleuciel"] .ios-btn-install:hover {
            box-shadow: 0 6px 20px rgba(2, 119, 189, 0.6);
        }
        
        [data-theme="bleuciel"] .ios-arrow-content {
            background: #0277bd !important;
            box-shadow: 0 4px 20px rgba(2, 119, 189, 0.4);
        }
        
        /* RESPONSIVE */
        @media (max-width: 400px) {
            .ios-prompt-card {
                width: calc(100vw - 20px);
            }
            
            .ios-benefits {
                grid-template-columns: 1fr;
            }
            
            .ios-prompt-actions {
                flex-direction: column;
            }
        }
        
        /* SAFE AREAS iOS */
        @supports (padding: env(safe-area-inset-top)) {
            .ios-share-arrow {
                top: calc(20px + env(safe-area-inset-top)) !important;
                right: calc(20px + env(safe-area-inset-right)) !important;
            }
        }
    `;
    
    // Ajouter les styles seulement sur iOS
    if (isReallyIOS()) {
        document.head.appendChild(style);
    }
    
    // Initialisation
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(showIOSInstallPrompt, 3000);
        });
    } else {
        setTimeout(showIOSInstallPrompt, 3000);
    }
    
    // Exposer globalement
    window.showIOSInstallPrompt = showIOSInstallPrompt;
    
})();