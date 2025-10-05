// Theme Manager avec de nouveaux thèmes vraiment distincts

class ThemeManager {
    constructor() {
        // Thèmes dans l'ordre souhaité avec rouge par défaut
        this.themes = [
            { id: 'rouge', name: 'Rouge', icon: 'palette' },
            { id: 'dark', name: 'Sombre', icon: 'dark_mode' },
            { id: 'bleuciel', name: 'Bleu Ciel', icon: 'water_drop' },
            { id: 'light', name: 'Violet', icon: 'color_lens' }
        ];
        
        this.init();
        window.themeManager = this;
    }
    
    init() {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        this.setTheme(savedTheme, false);
    } else {
        document.documentElement.setAttribute('data-theme', 'rouge');
        localStorage.setItem('theme', 'rouge');
        // NOUVEAU : Appliquer les couleurs au démarrage
        this.updateThemeColors('rouge');
    }
    
    this.setupThemeButton();
    console.log('ThemeManager avec nouveaux thèmes initialisé');
}
    
    setTheme(themeId, showToast = true) {
    if (!this.themes.find(t => t.id === themeId)) {
        console.error(`Thème inconnu: ${themeId}`);
        return;
    }
    
    // ✅ Masquer TOUS les widgets pendant la transition
    const newsWidget = document.querySelector('.local-news-widget');
    const footballWidget = document.querySelector('.football-widget');
    const cinemaWidget = document.querySelector('.cinema-widget');
    
    [newsWidget, footballWidget, cinemaWidget].forEach(widget => {
        if (widget) {
            widget.style.opacity = '0';
            widget.style.transition = 'opacity 0.15s ease';
        }
    });
    
    // Créer un overlay pour masquer le flash
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: black;
        opacity: 0;
        transition: opacity 0.2s ease;
        z-index: 99999;
        pointer-events: none;
    `;
    document.body.appendChild(overlay);
    
    // Fade vers noir
    requestAnimationFrame(() => {
        overlay.style.opacity = '0.3';
    });
    
    // Changer le thème après un court délai
    setTimeout(() => {
        document.documentElement.setAttribute('data-theme', themeId);
        localStorage.setItem('theme', themeId);
        
        // Mettre à jour les couleurs de la PWA
        this.updateThemeColors(themeId);
        
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: themeId }
        }));
        
        if (showToast) {
            this.showToast(`Thème ${this.getThemeName(themeId)} activé`);
        }
        
        // ✅ Réafficher TOUS les widgets après le changement
        setTimeout(() => {
            [newsWidget, footballWidget, cinemaWidget].forEach(widget => {
                if (widget) {
                    widget.style.opacity = '1';
                }
            });
        }, 50);
        
        // Fade out de l'overlay
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 200);
        }, 100);
        
        console.log(`Thème appliqué: ${themeId}`);
    }, 200);
}
    
    getThemeName(themeId) {
        const theme = this.themes.find(t => t.id === themeId);
        return theme ? theme.name : themeId;
    }
    
    setupThemeButton() {
        const themeToggleBtn = document.getElementById('darkModeToggle');
        
        if (themeToggleBtn) {
            const newBtn = themeToggleBtn.cloneNode(true);
            themeToggleBtn.parentNode.replaceChild(newBtn, themeToggleBtn);
            
            newBtn.addEventListener('click', () => {
                this.cycleThemes();
            });
            
            this.updateThemeButtonUI();
        } else {
            console.warn("Bouton de changement de thème non trouvé.");
        }
    }
    
    updateThemeButtonUI() {
        const themeToggleBtn = document.getElementById('darkModeToggle');
        if (!themeToggleBtn) return;
        
        const currentTheme = this.getCurrentTheme();
        const theme = this.themes.find(t => t.id === currentTheme);
        
        if (theme) {
            const iconElement = themeToggleBtn.querySelector('.material-icons');
            if (iconElement) {
                iconElement.textContent = theme.icon;
            }
            
            const textElement = themeToggleBtn.querySelector('span:not(.material-icons)');
            if (textElement) {
                textElement.textContent = theme.name;
            }
            
            const allButtons = document.querySelectorAll('.nav-item');
            allButtons.forEach(btn => btn.classList.remove('active'));
            themeToggleBtn.classList.add('active');
        }
    }
    
    cycleThemes() {
        const currentTheme = this.getCurrentTheme();
        const themeIds = this.themes.map(t => t.id);
        
        const currentIndex = themeIds.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themeIds.length;
        
        this.setTheme(themeIds[nextIndex], true);
        this.updateThemeButtonUI();
    }
    
    getCurrentTheme() {
        return localStorage.getItem('theme') || 'rouge';
    }
    
    showToast(message) {
        this.clearToast();
        
        const toast = document.createElement('div');
        toast.id = 'theme-toast';
        toast.className = 'toast show';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            this.clearToast();
        }, 3000);
    }
    
    clearToast() {
        const existingToast = document.getElementById('theme-toast');
        if (existingToast && existingToast.parentNode) {
            existingToast.parentNode.removeChild(existingToast);
        }
    }
	
	updateThemeColors(themeId) {
    // Mettre à jour toutes les balises meta theme-color
    const themeColors = {
        'rouge': '#940000',
        'dark': '#1a1f2e',
        'bleuciel': '#87CEEB',
        'light': '#6b46c1'
    };
    
    const color = themeColors[themeId] || '#940000';
    
    // Mettre à jour la meta theme-color principale
    const metaThemeColor = document.querySelector('meta[name="theme-color"]:not([media])');
    if (metaThemeColor) {
        metaThemeColor.content = color;
    }
    
    // Mettre à jour les theme-color avec media queries
    const metaThemeColorLight = document.querySelector('meta[name="theme-color"][media*="light"]');
    if (metaThemeColorLight) {
        metaThemeColorLight.content = color;
    }
    
    const metaThemeColorDark = document.querySelector('meta[name="theme-color"][media*="dark"]');
    if (metaThemeColorDark) {
        metaThemeColorDark.content = color;
    }
    
    // Mettre à jour msapplication-navbutton-color (pour Windows)
    const metaMsNavColor = document.querySelector('meta[name="msapplication-navbutton-color"]');
    if (metaMsNavColor) {
        metaMsNavColor.content = color;
    }
    
    // Mettre à jour msapplication-TileColor (pour Windows)
    const metaMsTileColor = document.querySelector('meta[name="msapplication-TileColor"]');
    if (metaMsTileColor) {
        metaMsTileColor.content = color;
    }
    
    // Pour iOS status bar
    const metaAppleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (metaAppleStatus) {
        // Pour iOS, on utilise black-translucent pour tous les thèmes sauf bleuciel
        if (themeId === 'bleuciel') {
            metaAppleStatus.content = 'default';
        } else {
            metaAppleStatus.content = 'black-translucent';
        }
    }
}
}

// Initialiser le gestionnaire de thèmes au chargement
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();

    document.addEventListener('themeChanged', function() {
        setTimeout(() => {
            const chatToggleBtn = document.getElementById('chatToggleBtn');
            if (chatToggleBtn) {
                chatToggleBtn.style.animation = 'none';
            }
        }, 2000);
    });
    
    setTimeout(() => {
        const chatToggleBtn = document.getElementById('chatToggleBtn');
        if (chatToggleBtn) {
            chatToggleBtn.style.animation = 'none';
        }
        
        const chatNotificationBadge = document.querySelector('.chat-notification-badge');
        if (chatNotificationBadge) {
            chatNotificationBadge.classList.add('hidden');
        }
    }, 5000);
});

document.addEventListener('click', function(e) {
    if (e.target.closest('#chatToggleBtn')) {
        const chatToggleBtn = document.getElementById('chatToggleBtn');
        if (chatToggleBtn) {
            chatToggleBtn.style.animation = 'none';
        }
    }
});