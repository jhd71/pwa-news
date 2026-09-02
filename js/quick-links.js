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

// Les numéros d'urgence sont désormais sur la page urgences.html,
// afin de n'avoir qu'une seule liste à tenir à jour.

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.quickLinksWidget = new QuickLinksWidget();
});

// ============================================
// MODAL TV EN DIRECT
// ============================================
function showTVModal() {
    const modal = document.getElementById('tvModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Fermer le panel liens rapides
        if (window.quickLinksWidget) {
            window.quickLinksWidget.hide();
        }
    }
}

function closeTVModal() {
    const modal = document.getElementById('tvModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Fermer modal TV en cliquant à l'extérieur
document.addEventListener('click', (e) => {
    const modal = document.getElementById('tvModal');
    if (e.target === modal) {
        closeTVModal();
    }
});

// Fermer modal TV avec Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeTVModal();
        closeSportsModal();
    }
});

// ============================================
// MODAL SPORTS
// ============================================
function showSportsModal() {
    const modal = document.getElementById('sportsModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Fermer le panel liens rapides
        if (window.quickLinksWidget) {
            window.quickLinksWidget.hide();
        }
    }
}

function closeSportsModal() {
    const modal = document.getElementById('sportsModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Fermer modal Sports en cliquant à l'extérieur
document.addEventListener('click', (e) => {
    const modal = document.getElementById('sportsModal');
    if (e.target === modal) {
        closeSportsModal();
    }
});

// ============================================
// PARTAGE DU SITE
// ============================================
function shareWebsite() {
    const shareData = {
        title: 'Actu & Média',
        text: 'Découvrez Actu & Média, votre source d\'infos locales pour Montceau-les-Mines !',
        url: 'https://actuetmedia.fr'
    };
    
    // Si Web Share API disponible (mobile)
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => console.log('✅ Site partagé'))
            .catch((err) => console.log('Partage annulé'));
    } else {
        // Fallback : copier le lien
        navigator.clipboard.writeText(shareData.url)
            .then(() => {
                alert('🔗 Lien copié dans le presse-papiers !\n\nhttps://actuetmedia.fr');
            })
            .catch(() => {
                // Fallback ultime
                prompt('Copiez ce lien :', shareData.url);
            });
    }
}
