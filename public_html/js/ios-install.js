// ios-install.js - Script optimisé pour l'installation sur iOS
function showIOSInstallPrompt() {
    // Détection améliorée pour iOS (inclut iPad Pro récents)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isInStandaloneMode = window.navigator.standalone === true;
    
    console.log("Vérification iOS install:", { isIOS, isInStandaloneMode });
    
    // Vérifier si on a déjà montré récemment
    const lastPrompt = localStorage.getItem('iosPromptShown');
    const now = Date.now();
    const showAgain = !lastPrompt || (now - parseInt(lastPrompt)) > 7 * 24 * 60 * 60 * 1000; // 7 jours
    
    // Si déjà en mode standalone ou déjà montré récemment, ne pas afficher
    if (!isIOS || isInStandaloneMode || !showAgain) {
        console.log("Conditions non remplies pour afficher le prompt iOS");
        return;
    }
    
    console.log("Affichage du prompt iOS");
    
    // Supprimer tout prompt existant
    const existingPrompt = document.querySelector('.ios-prompt');
    if (existingPrompt) existingPrompt.remove();
    
    // Créer la bannière avec instructions adaptées à iOS et améliorées
    const iosPrompt = document.createElement('div');
    iosPrompt.className = 'ios-prompt';
    iosPrompt.innerHTML = `
        <div class="ios-prompt-container">
            <div class="ios-prompt-message">
                <div class="ios-prompt-header">
                    <span class="ios-icon">📱</span>
                    <h3>Installer Actu&Média</h3>
                </div>
                <div class="ios-instructions">
                    <p><strong>Pour installer sur votre iPhone/iPad :</strong></p>
                    <div class="instruction-steps">
                        <div class="step">
                            <span class="step-number">1</span>
                            <span class="step-text">Appuyez sur <strong>Partager</strong> <span class="share-icon">⬆️</span></span>
                        </div>
                        <div class="step">
                            <span class="step-number">2</span>
                            <span class="step-text">Faites défiler et appuyez sur <strong>"Sur l'écran d'accueil"</strong></span>
                        </div>
                        <div class="step">
                            <span class="step-number">3</span>
                            <span class="step-text">Confirmez avec <strong>"Ajouter"</strong></span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="ios-prompt-actions">
                <button class="ios-prompt-close">Plus tard</button>
                <button class="ios-prompt-help">?</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(iosPrompt);
    
    // Gestion de la fermeture
    const closeBtn = iosPrompt.querySelector('.ios-prompt-close');
    const helpBtn = iosPrompt.querySelector('.ios-prompt-help');
    
    closeBtn.addEventListener('click', () => {
        iosPrompt.style.opacity = '0';
        iosPrompt.style.transform = 'translateY(100%)';
        setTimeout(() => {
            if (iosPrompt.parentNode) {
                iosPrompt.remove();
            }
            localStorage.setItem('iosPromptShown', now.toString());
        }, 300);
    });
    
    // Bouton d'aide
    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showIOSHelpModal();
    });
    
    // Animation d'entrée
    requestAnimationFrame(() => {
        iosPrompt.style.opacity = '1';
        iosPrompt.style.transform = 'translateY(0)';
    });
    
    // Animation de pulsation pour attirer l'attention
    setTimeout(() => {
        const header = iosPrompt.querySelector('.ios-prompt-header');
        if (header) header.style.animation = 'ios-pulse 2s infinite';
    }, 2000);
    
    // Masquer automatiquement après 20 secondes
    setTimeout(() => {
        if (document.body.contains(iosPrompt)) {
            iosPrompt.style.opacity = '0';
            iosPrompt.style.transform = 'translateY(100%)';
            setTimeout(() => {
                if (document.body.contains(iosPrompt)) {
                    iosPrompt.remove();
                    localStorage.setItem('iosPromptShown', now.toString());
                }
            }, 300);
        }
    }, 20000);
}

// Modal d'aide détaillée pour iOS
function showIOSHelpModal() {
    // Supprimer modal existant
    const existingModal = document.querySelector('.ios-help-modal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'ios-help-modal';
    modal.innerHTML = `
        <div class="ios-help-overlay"></div>
        <div class="ios-help-content">
            <div class="ios-help-header">
                <h2>📱 Guide d'installation iOS</h2>
                <button class="ios-help-close">×</button>
            </div>
            <div class="ios-help-body">
                <div class="device-specific">
                    <h3>📍 Localiser le bouton Partager</h3>
                    <p>Le bouton de partage <span class="share-icon-large">⬆️</span> se trouve :</p>
                    <ul>
                        <li><strong>Safari iPhone :</strong> En bas au centre de l'écran</li>
                        <li><strong>Safari iPad :</strong> En haut à droite de l'écran</li>
                    </ul>
                </div>
                
                <div class="step-details">
                    <h3>📋 Étapes détaillées</h3>
                    <div class="detailed-steps">
                        <div class="detailed-step">
                            <div class="step-icon">1️⃣</div>
                            <div class="step-content">
                                <h4>Ouvrir le menu de partage</h4>
                                <p>Appuyez sur l'icône de partage <span class="share-icon">⬆️</span> dans Safari</p>
                            </div>
                        </div>
                        <div class="detailed-step">
                            <div class="step-icon">2️⃣</div>
                            <div class="step-content">
                                <h4>Trouver l'option d'installation</h4>
                                <p>Faites défiler vers le bas et cherchez <strong>"Sur l'écran d'accueil"</strong> ou <strong>"Add to Home Screen"</strong></p>
                            </div>
                        </div>
                        <div class="detailed-step">
                            <div class="step-icon">3️⃣</div>
                            <div class="step-content">
                                <h4>Finaliser l'installation</h4>
                                <p>Appuyez sur <strong>"Ajouter"</strong> en haut à droite pour confirmer</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="benefits">
                    <h3>✨ Avantages de l'installation</h3>
                    <ul>
                        <li>🚀 Accès plus rapide depuis l'écran d'accueil</li>
                        <li>🔔 Notifications des nouvelles actualités</li>
                        <li>📱 Interface optimisée en plein écran</li>
                        <li>💾 Fonctionne même hors ligne</li>
                    </ul>
                </div>
                
                <div class="troubleshoot">
                    <h3>❓ Problèmes fréquents</h3>
                    <div class="faq-item">
                        <strong>Q : Je ne vois pas "Sur l'écran d'accueil"</strong>
                        <p>A : Assurez-vous d'utiliser Safari (pas Chrome ou autre) et faites bien défiler le menu de partage vers le bas.</p>
                    </div>
                    <div class="faq-item">
                        <strong>Q : L'option est grisée</strong>
                        <p>A : Vérifiez que vous êtes bien sur le site actuetmedia.fr et non sur une autre page.</p>
                    </div>
                </div>
            </div>
            <div class="ios-help-footer">
                <button class="ios-help-got-it">J'ai compris !</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Gestionnaires d'événements
    const closeBtn = modal.querySelector('.ios-help-close');
    const gotItBtn = modal.querySelector('.ios-help-got-it');
    const overlay = modal.querySelector('.ios-help-overlay');
    
    const closeModal = () => {
        modal.style.opacity = '0';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 300);
    };
    
    closeBtn.addEventListener('click', closeModal);
    gotItBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    
    // Animation d'entrée
    requestAnimationFrame(() => {
        modal.style.opacity = '1';
    });
}

// Style complet et amélioré pour iOS
const style = document.createElement('style');
style.textContent = `
    .ios-prompt {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, var(--primary-color, #4a148c) 0%, #6a1b9a 100%);
        color: white;
        padding: 20px;
        z-index: 9999;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        opacity: 0;
        transform: translateY(100%);
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
    }
    
    .ios-prompt-container {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        max-width: 400px;
        margin: 0 auto;
        gap: 15px;
    }
    
    .ios-prompt-message {
        flex: 1;
    }
    
    .ios-prompt-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;
    }
    
    .ios-prompt-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
    }
    
    .ios-icon {
        font-size: 24px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }
    
    .ios-instructions p {
        margin: 0 0 12px 0;
        font-size: 14px;
        opacity: 0.9;
    }
    
    .instruction-steps {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    
    .step {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        backdrop-filter: blur(10px);
    }
    
    .step-number {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        font-size: 12px;
        font-weight: bold;
        flex-shrink: 0;
    }
    
    .step-text {
        font-size: 13px;
        line-height: 1.3;
    }
    
    .share-icon {
        font-size: 16px;
        vertical-align: middle;
    }
    
    .ios-prompt-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-end;
    }
    
    .ios-prompt-close,
    .ios-prompt-help {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        padding: 10px 15px;
        border-radius: 20px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.2s ease;
        backdrop-filter: blur(10px);
    }
    
    .ios-prompt-help {
        width: 35px;
        height: 35px;
        padding: 0;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: bold;
    }
    
    .ios-prompt-close:hover,
    .ios-prompt-help:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
    }
    
    .ios-prompt-close:active,
    .ios-prompt-help:active {
        transform: scale(0.95);
    }
    
    @keyframes ios-pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    /* Modal d'aide */
    .ios-help-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .ios-help-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(5px);
    }
    
    .ios-help-content {
        position: relative;
        background: white;
        margin: 20px;
        border-radius: 16px;
        max-height: 90vh;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
    }
    
    .ios-help-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #eee;
        position: sticky;
        top: 0;
        background: white;
        border-radius: 16px 16px 0 0;
    }
    
    .ios-help-header h2 {
        margin: 0;
        color: #333;
        font-size: 20px;
    }
    
    .ios-help-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s ease;
    }
    
    .ios-help-close:hover {
        background: #f0f0f0;
    }
    
    .ios-help-body {
        padding: 20px;
        color: #333;
    }
    
    .ios-help-body h3 {
        color: #4a148c;
        margin: 0 0 15px 0;
        font-size: 18px;
    }
    
    .ios-help-body h4 {
        margin: 0 0 8px 0;
        color: #333;
        font-size: 16px;
    }
    
    .device-specific,
    .step-details,
    .benefits,
    .troubleshoot {
        margin-bottom: 25px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 12px;
    }
    
    .detailed-steps {
        display: flex;
        flex-direction: column;
        gap: 15px;
    }
    
    .detailed-step {
        display: flex;
        gap: 15px;
        padding: 15px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .step-icon {
        font-size: 24px;
        flex-shrink: 0;
    }
    
    .step-content {
        flex: 1;
    }
    
    .share-icon-large {
        font-size: 20px;
        color: #007AFF;
    }
    
    .benefits ul,
    .device-specific ul {
        margin: 10px 0;
        padding-left: 20px;
    }
    
    .benefits li,
    .device-specific li {
        margin: 8px 0;
    }
    
    .faq-item {
        margin: 15px 0;
        padding: 10px;
        background: white;
        border-radius: 8px;
    }
    
    .faq-item strong {
        color: #4a148c;
        display: block;
        margin-bottom: 5px;
    }
    
    .ios-help-footer {
        padding: 20px;
        border-top: 1px solid #eee;
        text-align: center;
        position: sticky;
        bottom: 0;
        background: white;
        border-radius: 0 0 16px 16px;
    }
    
    .ios-help-got-it {
        background: #4a148c;
        color: white;
        border: none;
        padding: 12px 30px;
        border-radius: 25px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .ios-help-got-it:hover {
        background: #6a1b9a;
        transform: scale(1.05);
    }
    
    /* Ajustement pour safe areas iOS */
    @supports (padding-bottom: env(safe-area-inset-bottom)) {
        .ios-prompt {
            padding-bottom: calc(20px + env(safe-area-inset-bottom));
        }
    }
    
    /* Responsive */
    @media (max-width: 480px) {
        .ios-prompt {
            padding: 15px;
        }
        
        .ios-prompt-container {
            flex-direction: column;
            gap: 15px;
        }
        
        .ios-prompt-actions {
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
        }
        
        .ios-help-content {
            margin: 10px;
        }
        
        .ios-help-body {
            padding: 15px;
        }
    }
`;

// N'ajouter le style que sur iOS
if (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    document.head.appendChild(style);
}

// S'assurer que le DOM est chargé avant d'appeler la fonction
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        // Attendre que la page soit chargée et affichée
        setTimeout(showIOSInstallPrompt, 3000);
    });
} else {
    setTimeout(showIOSInstallPrompt, 3000);
}

// Pour pouvoir le montrer manuellement depuis le menu
window.showIOSInstallPrompt = showIOSInstallPrompt;
window.showIOSHelpModal = showIOSHelpModal;