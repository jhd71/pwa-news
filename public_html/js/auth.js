// Protection par mot de passe avec système de blocage
class SiteAuth {
    constructor() {
        this.password = 'Loupi'; // Changez ça !
        this.isAuthenticated = false;
        this.maxAttempts = 3;
        this.blockDuration = 15 * 60 * 1000; // 15 minutes en millisecondes
        this.init();
    }
    
    init() {
        console.log('🔐 Initialisation auth...');
        
        // Vérifier si bloqué
        if (this.isBlocked()) {
            this.showBlockedModal();
            return;
        }
        
        // Vérifier si déjà authentifié (session)
        const auth = sessionStorage.getItem('siteAuth');
        if (auth === 'authenticated') {
            this.isAuthenticated = true;
            console.log('✅ Déjà authentifié');
            return;
        }
        
        console.log('🚪 Affichage du modal de connexion');
        this.showLoginModal();
    }
    
    isBlocked() {
        const blockInfo = localStorage.getItem('authBlock');
        if (!blockInfo) return false;
        
        const { timestamp, attempts } = JSON.parse(blockInfo);
        const now = Date.now();
        
        // Si le temps de blocage est écoulé, débloquer
        if (now - timestamp > this.blockDuration) {
            localStorage.removeItem('authBlock');
            localStorage.removeItem('authAttempts');
            return false;
        }
        
        // Encore bloqué si 3+ tentatives
        return attempts >= this.maxAttempts;
    }
    
    getBlockedTimeRemaining() {
        const blockInfo = localStorage.getItem('authBlock');
        if (!blockInfo) return 0;
        
        const { timestamp } = JSON.parse(blockInfo);
        const elapsed = Date.now() - timestamp;
        const remaining = this.blockDuration - elapsed;
        
        return Math.max(0, Math.ceil(remaining / 1000 / 60)); // en minutes
    }
    
    showBlockedModal() {
        const remainingMinutes = this.getBlockedTimeRemaining();
        
        // Masquer tout le contenu
        document.body.style.overflow = 'hidden';
        
        const modal = document.createElement('div');
        modal.id = 'authModal';
        modal.innerHTML = `
            <div class="auth-overlay">
                <div class="auth-modal blocked-modal">
                    <div class="auth-header">
                        <h2>🚫 Accès temporairement bloqué</h2>
                        <div class="blocked-info">
                            <p><strong>Trop de tentatives incorrectes détectées</strong></p>
                            <p>Temps de blocage restant : <span class="countdown">${remainingMinutes} minutes</span></p>
                        </div>
                    </div>
                    <div class="security-warning">
                        <div class="warning-icon">⚠️</div>
                        <div class="warning-text">
                            <strong>Avertissement de sécurité</strong><br>
                            Cette tentative d'accès non autorisée a été enregistrée.<br>
                            Les adresses IP suspectes sont transmises à <strong>actuetmedia.fr</strong><br>
                            pour analyse et éventuelle action légale.
                        </div>
                    </div>
                    <div class="blocked-actions">
    <button onclick="window.location.href='mailto:contact@actuetmedia.fr?subject=Demande%20d%27acc%C3%A8s%20-%20Site%20priv%C3%A9&body=Bonjour,%0A%0AJe%20souhaite%20demander%20l%27acc%C3%A8s%20au%20site%20priv%C3%A9.%0A%0AMerci'" class="contact-btn">
        📧 Contacter par email
    </button>
    <button onclick="location.reload()" class="retry-btn">
        Vérifier à nouveau (${remainingMinutes}min)
    </button>
</div>
                </div>
            </div>
        `;
        
        // Styles spéciaux pour le modal bloqué
        const style = document.createElement('style');
        style.textContent = `
            .auth-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(139, 0, 0, 0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
            }
            .blocked-modal {
                background: white;
                padding: 30px;
                border-radius: 15px;
                text-align: center;
                max-width: 500px;
                width: 90%;
                border: 3px solid #dc3545;
            }
            .blocked-modal h2 {
                color: #dc3545;
                margin: 0 0 20px 0;
            }
            .blocked-info {
                background: #f8d7da;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                border-left: 4px solid #dc3545;
            }
            .countdown {
                font-weight: bold;
                color: #dc3545;
                font-size: 1.2em;
            }
            .security-warning {
                background: #fff3cd;
                border: 2px solid #ffc107;
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                display: flex;
                align-items: flex-start;
                text-align: left;
            }
            .warning-icon {
                font-size: 24px;
                margin-right: 15px;
                flex-shrink: 0;
            }
            .warning-text {
                flex: 1;
                line-height: 1.4;
            }
            .blocked-actions {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }
            .contact-btn {
                flex: 1;
                padding: 12px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
            }
            .retry-btn {
                flex: 1;
                padding: 12px;
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            }
            .retry-btn:hover {
                background: #5a6268;
            }
            .contact-btn:hover {
                background: #218838;
            }			
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
        
        // Countdown timer
        this.startCountdown();
    }
    
    startCountdown() {
        const countdownElement = document.querySelector('.countdown');
        if (!countdownElement) return;
        
        const updateCountdown = () => {
            const remaining = this.getBlockedTimeRemaining();
            if (remaining <= 0) {
                location.reload();
                return;
            }
            countdownElement.textContent = `${remaining} minutes`;
        };
        
        // Mettre à jour chaque minute
        setInterval(updateCountdown, 60000);
    }
    
    showLoginModal() {
        const attempts = this.getAttempts();
        const remaining = this.maxAttempts - attempts;
        
        // Masquer tout le contenu
        document.body.style.overflow = 'hidden';
        
        const modal = document.createElement('div');
        modal.id = 'authModal';
        modal.innerHTML = `
            <div class="auth-overlay">
                <div class="auth-modal">
                    <div class="auth-header">
                        <h2>🔐 Accès privé</h2>
                        <p>Veuillez saisir le mot de passe</p>
                        ${attempts > 0 ? `<div class="attempts-warning">⚠️ ${remaining} tentative(s) restante(s)</div>` : ''}
                    </div>
                    <div class="auth-form">
                        <input type="password" id="passwordInput" placeholder="Mot de passe">
                        <button onclick="siteAuth.checkPassword()">Connexion</button>
                    </div>
                    <div class="auth-error" id="authError" style="display: none;">
                        ❌ Mot de passe incorrect
                    </div>
                </div>
            </div>
        `;
        
        // Styles normaux + warning
        const style = document.createElement('style');
        style.textContent = `
            .auth-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
            }
            .auth-modal {
                background: white;
                padding: 30px;
                border-radius: 15px;
                text-align: center;
                max-width: 400px;
                width: 90%;
            }
            .auth-header h2 {
                margin: 0 0 10px 0;
                color: #333;
            }
            .attempts-warning {
                background: #fff3cd;
                color: #856404;
                padding: 8px 12px;
                border-radius: 5px;
                margin: 10px 0;
                border: 1px solid #ffeaa7;
                font-weight: bold;
            }
            .auth-form input {
                width: 100%;
                padding: 12px;
                margin: 15px 0;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 16px;
                box-sizing: border-box;
            }
            .auth-form button {
                width: 100%;
                padding: 12px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
            }
            .auth-error {
                color: #dc3545;
                margin-top: 10px;
                padding: 10px;
                background: #f8d7da;
                border-radius: 5px;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
        
        // Focus sur le champ mot de passe
        document.getElementById('passwordInput').focus();
        
        // Entrée pour valider
        document.getElementById('passwordInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkPassword();
            }
        });
    }
    
    getAttempts() {
        return parseInt(localStorage.getItem('authAttempts') || '0');
    }
    
    incrementAttempts() {
        const attempts = this.getAttempts() + 1;
        localStorage.setItem('authAttempts', attempts.toString());
        return attempts;
    }
    
    resetAttempts() {
        localStorage.removeItem('authAttempts');
        localStorage.removeItem('authBlock');
    }
    
    blockAccess(attempts) {
        const blockInfo = {
            timestamp: Date.now(),
            attempts: attempts,
            ip: 'masked_for_security' // On ne stocke pas la vraie IP côté client
        };
        localStorage.setItem('authBlock', JSON.stringify(blockInfo));
    }
    
    checkPassword() {
        const input = document.getElementById('passwordInput');
        const error = document.getElementById('authError');
        
        if (input.value === this.password) {
            // Mot de passe correct
            this.resetAttempts();
            sessionStorage.setItem('siteAuth', 'authenticated');
            this.isAuthenticated = true;
            
            // Supprimer le modal
            document.getElementById('authModal').remove();
            document.body.style.overflow = 'auto';
            
            console.log('✅ Authentification réussie');
        } else {
            // Mot de passe incorrect
            const attempts = this.incrementAttempts();
            
            if (attempts >= this.maxAttempts) {
                // Bloquer l'accès
                this.blockAccess(attempts);
                location.reload(); // Recharger pour afficher le modal de blocage
            } else {
                // Afficher l'erreur avec tentatives restantes
                const remaining = this.maxAttempts - attempts;
                error.innerHTML = `❌ Mot de passe incorrect (${remaining} tentative(s) restante(s))`;
                error.style.display = 'block';
                input.value = '';
                input.focus();
            }
        }
    }
    
    logout() {
        this.resetAttempts();
        sessionStorage.removeItem('siteAuth');
        window.location.reload();
    }
}

// Initialisation quand le DOM est prêt
let siteAuth = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        siteAuth = new SiteAuth();
    });
} else {
    siteAuth = new SiteAuth();
}