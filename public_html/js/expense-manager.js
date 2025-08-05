// expense-manager.js - Gestion du bouton gestionnaire de dépenses

/**
 * Ouvre le gestionnaire de dépenses avec détection intelligente du device
 */
function openExpenseManager() {
    // Configuration
    const EXPENSE_URL = 'https://depenses.actuetmedia.fr/';
    const IOS_TIP_KEY = 'iosExpenseInstallTipShown';
    const ANDROID_TIP_KEY = 'androidExpenseInstallTipShown';
    
    // Détection du device et du navigateur
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(userAgent);
    const isIOSSafari = isIOS && /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone || 
                        document.referrer.includes('android-app://');
    
    // Logging pour debug
    console.log('📊 Gestionnaire de dépenses - Ouverture', {
        mobile: isMobile,
        ios: isIOS,
        android: isAndroid,
        standalone: isStandalone
    });
    
    // Fonction pour afficher les instructions d'installation
    function showInstallInstructions() {
        if (isIOSSafari && !localStorage.getItem(IOS_TIP_KEY)) {
            setTimeout(() => {
                const message = `
📱 Installer l'application sur iPhone/iPad :

1. Appuyez sur le bouton Partager ⬆️
2. Faites défiler et choisissez "Sur l'écran d'accueil"
3. Appuyez sur "Ajouter"

Vous pourrez ensuite accéder à vos dépenses comme une vraie app !
                `.trim();
                
                if (confirm(message)) {
                    localStorage.setItem(IOS_TIP_KEY, 'true');
                }
            }, 3000);
        } else if (isAndroid && !localStorage.getItem(ANDROID_TIP_KEY)) {
            // Vérifier si Chrome affiche déjà sa bannière d'installation
            setTimeout(() => {
                if (!document.querySelector('.install-prompt')) {
                    const message = `
📱 Installer l'application sur Android :

Une bannière d'installation devrait apparaître en bas de l'écran.
Sinon : Menu (3 points) → "Installer l'application"

Accédez à vos dépenses directement depuis votre écran d'accueil !
                    `.trim();
                    
                    if (confirm(message)) {
                        localStorage.setItem(ANDROID_TIP_KEY, 'true');
                    }
                }
            }, 5000);
        }
    }
    
    // Stratégie d'ouverture selon le contexte
    if (isMobile) {
        if (isStandalone) {
            // Dans une PWA, ouvrir dans la même fenêtre
            window.location.href = EXPENSE_URL;
        } else {
            // Sur mobile web, rediriger (permettra de lancer la PWA si installée)
            window.location.href = EXPENSE_URL;
            
            // Proposer l'installation après redirection
            showInstallInstructions();
        }
    } else {
        // Desktop : ouvrir dans un nouvel onglet
        const newWindow = window.open(EXPENSE_URL, '_blank', 'noopener,noreferrer');
        
        // Gérer le cas où les popups sont bloqués
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            // Créer une notification stylée au lieu d'une alerte
            showDesktopNotification();
        }
    }
    
    // Analytics (si disponible)
    trackEvent('expense_manager_open', {
        device: isMobile ? 'mobile' : 'desktop',
        standalone: isStandalone
    });
}

/**
 * Affiche une notification desktop stylée
 */
function showDesktopNotification() {
    // Créer une notification custom
    const notification = document.createElement('div');
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 400px;
            text-align: center;
        ">
            <h3 style="margin: 0 0 1rem 0; color: #333;">
                🚫 Popup bloqué
            </h3>
            <p style="margin: 0 0 1.5rem 0; color: #666; line-height: 1.5;">
                Votre navigateur a bloqué l'ouverture du gestionnaire de dépenses.
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button onclick="window.location.href='https://depenses.actuetmedia.fr/'" style="
                    background: #2563eb;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                ">Ouvrir quand même</button>
                <button onclick="this.closest('div').parentElement.remove()" style="
                    background: #e5e7eb;
                    color: #333;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                ">Annuler</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-fermeture après 10 secondes
    setTimeout(() => {
        notification.remove();
    }, 10000);
}

/**
 * Fonction de tracking (à adapter selon votre système)
 */
function trackEvent(eventName, parameters = {}) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
    
    // Matomo
    if (typeof _paq !== 'undefined') {
        _paq.push(['trackEvent', 'ExpenseManager', eventName, JSON.stringify(parameters)]);
    }
    
    // Console log pour debug
    console.log(`📊 Track: ${eventName}`, parameters);
}

/**
 * Détection de l'installation PWA au chargement
 */
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si on peut installer le gestionnaire comme PWA
    let expenseManagerPrompt = null;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        // Si on est sur la page du gestionnaire
        if (window.location.hostname === 'depenses.actuetmedia.fr') {
            e.preventDefault();
            expenseManagerPrompt = e;
            
            // Créer un bouton d'installation flottant
            createInstallButton(e);
        }
    });
    
    // Détecter quand la PWA est installée
    window.addEventListener('appinstalled', () => {
        console.log('✅ Gestionnaire de dépenses installé avec succès !');
        
        // Retirer le bouton d'installation si présent
        const installBtn = document.getElementById('expenseInstallBtn');
        if (installBtn) {
            installBtn.remove();
        }
    });
});

/**
 * Créer un bouton d'installation flottant
 */
function createInstallButton(installPrompt) {
    const button = document.createElement('button');
    button.id = 'expenseInstallBtn';
    button.innerHTML = `
        <span style="margin-right: 8px;">📱</span>
        Installer l'app
    `;
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 50px;
        box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);
        cursor: pointer;
        font-weight: 600;
        font-size: 16px;
        z-index: 1000;
        animation: pulse 2s infinite;
    `;
    
    // Ajouter l'animation pulse
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
    
    button.addEventListener('click', async () => {
        button.disabled = true;
        button.textContent = 'Installation...';
        
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('✅ Installation acceptée');
            button.remove();
        } else {
            button.disabled = false;
            button.innerHTML = '<span style="margin-right: 8px;">📱</span>Installer l\'app';
        }
    });
    
    document.body.appendChild(button);
}

// Export pour utilisation dans d'autres modules si besoin
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { openExpenseManager };
}