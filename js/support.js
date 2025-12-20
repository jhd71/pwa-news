// ============================================
// WIDGET SUPPORT / À PROPOS
// ============================================

class SupportWidget {
    constructor() {
        this.panel = document.getElementById('supportPanel');
        this.overlay = document.getElementById('supportOverlay');
        this.openBtn = document.getElementById('supportBtn');
        this.closeBtn = document.getElementById('supportClose');
        
        this.init();
    }
    
    init() {
        if (!this.panel || !this.overlay || !this.openBtn) {
            console.error('❌ Éléments support manquants');
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
        
        console.log('✅ Widget support initialisé');
    }
    
    show() {
        // Fermer l'autre widget si ouvert
        if (window.quickLinksWidget) {
            window.quickLinksWidget.hide();
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
            
            // Swipe vers la droite pour fermer (panel à droite)
            if (diff > 0) {
                this.panel.style.transform = `translateX(${diff}px)`;
            }
        }, { passive: true });
        
        this.panel.addEventListener('touchend', () => {
            const diff = currentX - startX;
            
            if (diff > 80) {
                this.hide();
            }
            
            this.panel.style.transform = '';
            startX = 0;
            currentX = 0;
        }, { passive: true });
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.supportWidget = new SupportWidget();
});

// Fonction globale pour fermer le widget support
function closeSupportWidget() {
    if (window.supportWidget) {
        window.supportWidget.hide();
    }
}
