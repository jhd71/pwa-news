// ============================================
// WIDGET LIENS RAPIDES
// ============================================

class QuickLinksWidget {
    constructor() {
        this.panel = document.getElementById('quickLinksPanel');
        this.overlay = document.getElementById('quickLinksOverlay');
        this.openBtn = document.getElementById('quickLinksBtn');
        this.closeBtn = document.getElementById('quickLinksClose');
        
        this.init();
    }
    
    init() {
        if (!this.panel || !this.overlay || !this.openBtn) {
            console.error('❌ Éléments liens rapides manquants');
            return;
        }
        
        // Bouton ouvrir
        this.openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.show();
        });
        
        // Bouton fermer
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.hide());
        }
        
        // Clic sur overlay
        this.overlay.addEventListener('click', () => this.hide());
        
        // Touche Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.panel.classList.contains('show')) {
                this.hide();
            }
        });
        
        // Swipe pour fermer (mobile)
        this.initSwipeToClose();
        
        console.log('✅ Widget liens rapides initialisé');
    }
    
    show() {
        // Fermer l'autre widget si ouvert
        if (window.supportWidget) {
            window.supportWidget.hide();
        }
        
        this.panel.classList.add('show');
        this.overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    hide() {
        this.panel.classList.remove('show');
        this.overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    initSwipeToClose() {
        let startX = 0;
        let currentX = 0;
        
        this.panel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });
        
        this.panel.addEventListener('touchmove', (e) => {
            currentX = e.touches[0].clientX;
            const diff = currentX - startX;
            
            if (diff < 0) {
                this.panel.style.transform = `translateX(${diff}px)`;
            }
        }, { passive: true });
        
        this.panel.addEventListener('touchend', () => {
            const diff = currentX - startX;
            
            if (diff < -80) {
                this.hide();
            }
            
            this.panel.style.transform = '';
            startX = 0;
            currentX = 0;
        }, { passive: true });
    }
}

// Fonction pour afficher les numéros d'urgence
function showEmergencyNumbers() {
    const modal = document.createElement('div');
    modal.className = 'emergency-modal';
    modal.innerHTML = `
        <div class="emergency-content">
            <div class="emergency-header">
                <h3>🚨 Numéros d'urgence</h3>
                <button class="emergency-close" onclick="this.closest('.emergency-modal').remove()">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <div class="emergency-list">
                <a href="tel:15" class="emergency-item">
                    <span class="emergency-icon">🏥</span>
                    <div class="emergency-info">
                        <strong>15 - SAMU</strong>
                        <span>Urgences médicales</span>
                    </div>
                </a>
                <a href="tel:18" class="emergency-item">
                    <span class="emergency-icon">🚒</span>
                    <div class="emergency-info">
                        <strong>18 - Pompiers</strong>
                        <span>Incendie, accidents</span>
                    </div>
                </a>
                <a href="tel:17" class="emergency-item">
                    <span class="emergency-icon">👮</span>
                    <div class="emergency-info">
                        <strong>17 - Police</strong>
                        <span>Police secours</span>
                    </div>
                </a>
                <a href="tel:112" class="emergency-item">
                    <span class="emergency-icon">🆘</span>
                    <div class="emergency-info">
                        <strong>112 - Urgences UE</strong>
                        <span>Numéro européen</span>
                    </div>
                </a>
                <a href="tel:114" class="emergency-item">
                    <span class="emergency-icon">🦻</span>
                    <div class="emergency-info">
                        <strong>114 - Sourds/Malentendants</strong>
                        <span>SMS / Fax</span>
                    </div>
                </a>
                <a href="https://www.ch-montceau71.fr/" target="_blank" class="emergency-item">
                    <span class="emergency-icon">🏨</span>
                    <div class="emergency-info">
                        <strong>Hôpital Montceau</strong>
                        <span>Centre hospitalier</span>
                    </div>
                </a>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fermer en cliquant à l'extérieur
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Fermer avec Escape
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.quickLinksWidget = new QuickLinksWidget();
});
