// Protection par mot de passe avec système de blocage
class SiteAuth {
    constructor() {
        this.password = 'fc35>$wL72iZA^'; // Changez ça !
        this.isAuthenticated = false;
        this.maxAttempts = 3;
        this.blockDuration = 15 * 60 * 1000; // 15 minutes en millisecondes
        this.init();
    }
    
    init() {
        console.log('🔒 Initialisation auth...');
        
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
                background: linear-gradient(135deg, #8b0000 0%, #450000 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                backdrop-filter: blur(10px);
            }
            .blocked-modal {
                background: white;
                padding: 30px;
                border-radius: 15px;
                text-align: center;
                max-width: 500px;
                width: 90%;
                border: 3px solid #dc3545;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
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
                    <div class="site-logo">
                        <h1>🏘️ ActuetMedia.fr</h1>
                        <p class="site-subtitle">Actualités locales de Montceau-les-Mines</p>
                    </div>
                    
                    <div class="auth-message">
                        <h3>⚠️ Accès Privé</h3>
                        <p>
                            Après <strong>18 mois</strong> de travail bénévole intensif, une refonte complète du site, 
                            et face à l'absence de soutien de la communauté locale (0 dons, très peu de visites), 
                            j'ai pris la décision de mettre ActuetMedia.fr en <strong>accès privé</strong>.
                        </p>
                        <p>
                            Ce site a été créé avec passion pour servir notre communauté de Montceau-les-Mines, 
                            offrant gratuitement : actualités locales, météo, radio, agenda d'événements, petites annonces, 
                            et bien plus encore.
                        </p>
                        <p class="contact-info">
                            <a href="mailto:contact@actuetmedia.fr?subject=Demande%20d%27acc%C3%A8s%20ActuetMedia&body=Bonjour,%0A%0AJe%20souhaite%20obtenir%20le%20mot%20de%20passe%20pour%20acc%C3%A9der%20au%20site%20ActuetMedia.fr.%0A%0AMerci" 
                               style="color: #3b82f6; text-decoration: none; font-weight: 600;">
                                contact@actuetmedia.fr
                            </a>
                        </p>
                    </div>
                    
                    <div class="auth-header">
                        <h2>🔒 Connexion</h2>
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
                background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                overflow-y: auto;
                padding: 1rem;
            }
            .auth-modal {
                background: rgba(255, 255, 255, 0.98);
                padding: 2.5rem;
                border-radius: 20px;
                text-align: center;
                max-width: 600px;
                width: 95%;
                box-shadow: 0 25px 70px rgba(0,0,0,0.5);
                margin: auto;
            }
            .site-logo h1 {
                color: #1e3a8a;
                font-size: 2rem;
                margin: 0 0 0.5rem 0;
            }
            .site-subtitle {
                color: #64748b;
                font-size: 0.9rem;
                margin-bottom: 2rem;
            }
            .auth-message {
                background: #fff3cd;
                border-left: 4px solid #fbbf24;
                padding: 1.5rem;
                margin-bottom: 2rem;
                border-radius: 10px;
                text-align: left;
            }
            .auth-message h3 {
                color: #92400e;
                font-size: 1.1rem;
                margin: 0 0 1rem 0;
            }
            .auth-message p {
                color: #78350f;
                line-height: 1.6;
                margin-bottom: 0.8rem;
                font-size: 0.95rem;
            }
            .contact-info {
                margin-top: 1.2rem;
                padding-top: 1rem;
                border-top: 1px solid rgba(146, 64, 14, 0.2);
            }
            .auth-header h2 {
                margin: 0 0 10px 0;
                color: #1e3a8a;
                font-size: 1.3rem;
            }
            .attempts-warning {
                background: #fee;
                color: #c00;
                padding: 8px 12px;
                border-radius: 8px;
                margin: 10px 0;
                border: 1px solid #fcc;
                font-weight: bold;
                font-size: 0.9rem;
            }
            .auth-form {
                margin-top: 1.5rem;
            }
            .auth-form input {
                width: 100%;
                padding: 12px;
                margin: 0 0 12px 0;
                border: 2px solid #e2e8f0;
                border-radius: 10px;
                font-size: 16px;
                box-sizing: border-box;
                transition: all 0.3s;
            }
            .auth-form input:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            .auth-form button {
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #3b82f6, #1e40af);
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                cursor: pointer;
                font-weight: 600;
                transition: transform 0.2s;
            }
            .auth-form button:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
            }
            .auth-error {
                color: #dc3545;
                margin-top: 12px;
                padding: 10px;
                background: #fee;
                border-radius: 8px;
                font-weight: 600;
            }
            
            /* Mobile responsive */
            @media (max-width: 600px) {
                .auth-modal {
                    padding: 1.5rem;
                }
                .site-logo h1 {
                    font-size: 1.5rem;
                }
                .auth-message p {
                    font-size: 0.9rem;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
        
        // Focus sur le champ mot de passe
        setTimeout(() => {
            document.getElementById('passwordInput').focus();
        }, 100);
        
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
            ip: 'masked_for_security'
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
                location.reload();
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