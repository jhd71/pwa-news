// ===============================================
// DONATION.JS - Système de donation intelligent
// ===============================================

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        minVisitsBeforeShow: 3,        // Nombre minimum de visites avant d'afficher
        delayBeforeShow: 120000,       // Délai avant affichage (2 minutes)
        cooldownPeriod: 30,             // Jours entre deux affichages
        maxDismissals: 3,              // Nombre max de fermetures avant arrêt définitif
        storageKeys: {
            visits: 'am_visitor_count',
            lastShown: 'am_donation_last_shown',
            dismissCount: 'am_donation_dismiss_count',
            hasDonated: 'am_has_donated',
            firstVisit: 'am_first_visit'
        }
    };

    // Classe principale de gestion des donations
    class DonationManager {
        constructor() {
            this.popup = null;
            this.overlay = null;
            this.isVisible = false;
            this.hasShownThisSession = false;
            this.init();
        }

        init() {
            // Attendre que le DOM soit chargé
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        }

        setup() {
            // Récupérer les éléments
            this.overlay = document.getElementById('donationPopup');
            this.popup = document.querySelector('.donation-popup');
            
            if (!this.overlay || !this.popup) {
                console.warn('Éléments de donation non trouvés');
                return;
            }

            // Configurer les événements
            this.setupEventListeners();
            
            // Mettre à jour le compteur de visites
            this.updateVisitCount();
            
            // Vérifier si on doit afficher la popup
            this.checkAutoShow();
            
            // Améliorer le bouton dans la barre du bas
            this.enhanceBottomButton();
        }

        setupEventListeners() {
            // Bouton de fermeture
            const closeBtn = document.getElementById('donationClose');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hidePopup(true));
            }

            // Clic sur l'overlay
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.hidePopup(true);
                }
            });

            // Bouton de donation dans la barre du bas
            const donateBtn = document.getElementById('donateButton');
            if (donateBtn) {
                donateBtn.addEventListener('click', () => this.showPopup('manual'));
            }

            // Lien PayPal
            const paypalLink = document.querySelector('.donation-link');
            if (paypalLink) {
                paypalLink.addEventListener('click', () => {
                    this.trackDonation();
                });
            }

            // Échap pour fermer
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isVisible) {
                    this.hidePopup(true);
                }
            });
        }

        updateVisitCount() {
            let visits = parseInt(localStorage.getItem(CONFIG.storageKeys.visits) || '0');
            visits++;
            localStorage.setItem(CONFIG.storageKeys.visits, visits.toString());

            // Enregistrer la première visite
            if (!localStorage.getItem(CONFIG.storageKeys.firstVisit)) {
                localStorage.setItem(CONFIG.storageKeys.firstVisit, Date.now().toString());
            }

            console.log(`Visite n°${visits}`);
        }

        checkAutoShow() {
            // Ne pas afficher si déjà montré cette session
            if (this.hasShownThisSession) return;

            // Ne pas afficher si l'utilisateur a fait un don
            if (localStorage.getItem(CONFIG.storageKeys.hasDonated) === 'true') return;

            const visits = parseInt(localStorage.getItem(CONFIG.storageKeys.visits) || '0');
            const dismissCount = parseInt(localStorage.getItem(CONFIG.storageKeys.dismissCount) || '0');
            const lastShown = parseInt(localStorage.getItem(CONFIG.storageKeys.lastShown) || '0');

            // Vérifier les conditions
            if (visits < CONFIG.minVisitsBeforeShow) {
                console.log(`Pas assez de visites (${visits}/${CONFIG.minVisitsBeforeShow})`);
                return;
            }

            if (dismissCount >= CONFIG.maxDismissals) {
                console.log('Limite de fermetures atteinte');
                return;
            }

            // Vérifier le cooldown
            const daysSinceLastShow = (Date.now() - lastShown) / (1000 * 60 * 60 * 24);
            if (daysSinceLastShow < CONFIG.cooldownPeriod && lastShown > 0) {
                console.log(`Cooldown actif (${Math.floor(daysSinceLastShow)}/${CONFIG.cooldownPeriod} jours)`);
                return;
            }

            // Programmer l'affichage après le délai
            setTimeout(() => {
                this.showPopup('auto');
            }, CONFIG.delayBeforeShow);
        }

        showPopup(trigger = 'manual') {
            if (this.isVisible) return;

            // Animation d'apparition
            this.overlay.classList.add('visible');
            this.isVisible = true;

            // Tracking
            if (trigger === 'auto') {
                this.hasShownThisSession = true;
                localStorage.setItem(CONFIG.storageKeys.lastShown, Date.now().toString());
                console.log('Popup donation affichée automatiquement');
            } else {
                console.log('Popup donation ouverte manuellement');
            }

            // Analytics si disponible
            if (typeof gtag !== 'undefined') {
                gtag('event', 'donation_popup_shown', {
                    'trigger': trigger
                });
            }
        }

        hidePopup(wasDismissed = false) {
            if (!this.isVisible) return;

            // Animation de fermeture
            this.overlay.classList.remove('visible');
            this.isVisible = false;

            // Si fermé par l'utilisateur, incrémenter le compteur
            if (wasDismissed) {
                let dismissCount = parseInt(localStorage.getItem(CONFIG.storageKeys.dismissCount) || '0');
                dismissCount++;
                localStorage.setItem(CONFIG.storageKeys.dismissCount, dismissCount.toString());
                console.log(`Popup fermée ${dismissCount} fois`);
            }
        }

        trackDonation() {
            // Marquer comme donateur
            localStorage.setItem(CONFIG.storageKeys.hasDonated, 'true');
            
            // Analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'donation_click', {
                    'value': 1
                });
            }
            
            console.log('Clic sur le lien de donation');
        }

        enhanceBottomButton() {
            const donateBtn = document.getElementById('donateButton');
            if (!donateBtn) return;

            const visits = parseInt(localStorage.getItem(CONFIG.storageKeys.visits) || '0');
            
            // Après 5 visites, faire pulser le bouton occasionnellement
            if (visits >= 5 && visits % 3 === 0) {
                donateBtn.classList.add('pulse-animation');
                
                // Retirer l'animation après 5 secondes
                setTimeout(() => {
                    donateBtn.classList.remove('pulse-animation');
                }, 5000);
            }

            // Changer le texte selon le contexte
            if (visits === 1) {
                // Première visite : ne rien changer
            } else if (visits >= 10) {
                // Visiteur régulier
                const span = donateBtn.querySelector('span:last-child');
                if (span) {
                    span.textContent = 'Nous soutenir';
                }
            }
        }

        // Méthode pour réinitialiser (utile pour les tests)
        reset() {
            Object.values(CONFIG.storageKeys).forEach(key => {
                localStorage.removeItem(key);
            });
            console.log('Données de donation réinitialisées');
        }
    }

    // Créer une instance globale
    window.donationManager = new DonationManager();

// Amélioration dynamique du bouton
    function updateDonateButton() {
        const donateBtn = document.getElementById('donateButton');
        if (!donateBtn) return;
        
        const visits = parseInt(localStorage.getItem('am_visitor_count') || '0');
        const icon = donateBtn.querySelector('.material-icons');
        const text = donateBtn.querySelector('span:last-child');
        
        // Changer selon le nombre de visites
        if (visits === 1) {
            // Première visite : discret
            if (icon) icon.textContent = 'favorite_border';
            if (text) text.textContent = 'Soutenir';
        } else if (visits >= 3 && visits < 10) {
            // Visiteur qui revient
            if (icon) icon.textContent = 'favorite';
            if (text) text.textContent = 'Nous aider';
        } else if (visits >= 10) {
            // Visiteur régulier
            if (icon) icon.textContent = 'volunteer_activism';
            if (text) text.textContent = 'Faire un don';
        }
        
        // Animation occasionnelle pour attirer l'attention (subtile)
        if (visits === 5 || visits === 15 || visits === 30) {
            donateBtn.style.animation = 'subtle-glow 2s ease-in-out 3';
        }
    }

    // Appeler la fonction au chargement
    setTimeout(updateDonateButton, 1000);
	
    // Ajouter des styles pour l'animation pulse
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse-donation {
            0% {
                box-shadow: 0 0 0 0 rgba(229, 62, 62, 0.7);
                transform: scale(1);
            }
            50% {
                box-shadow: 0 0 0 10px rgba(229, 62, 62, 0);
                transform: scale(1.05);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(229, 62, 62, 0);
                transform: scale(1);
            }
        }
        
        .pulse-animation {
            animation: pulse-donation 2s ease-in-out 3;
        }
        
        /* Amélioration du bouton dans la barre du bas */
        #donateButton {
            position: relative;
            transition: all 0.3s ease;
        }
        
        #donateButton:hover {
            transform: translateY(-2px);
            background: rgba(229, 62, 62, 0.1);
        }
        
        /* Badge "Nouveau" pour les nouveaux visiteurs */
        #donateButton.new-visitor::after {
            content: "NEW";
            position: absolute;
            top: -5px;
            right: -5px;
            background: #e53e3e;
            color: white;
            font-size: 9px;
            padding: 2px 4px;
            border-radius: 4px;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);

})();

// Fonction helper pour les tests (à retirer en production)
function resetDonation() {
    if (window.donationManager) {
        window.donationManager.reset();
        location.reload();
    }
}