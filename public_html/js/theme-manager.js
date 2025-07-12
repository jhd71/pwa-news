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
        }
        
        this.setupThemeButton();
        console.log('ThemeManager avec nouveaux thèmes initialisé');
    }
    
    setTheme(themeId, showToast = true) {
        if (!this.themes.find(t => t.id === themeId)) {
            console.error(`Thème inconnu: ${themeId}`);
            return;
        }
        
        document.documentElement.setAttribute('data-theme', themeId);
        localStorage.setItem('theme', themeId);
        
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: themeId }
        }));
        
        if (showToast) {
            this.showToast(`Thème ${this.getThemeName(themeId)} activé`);
        }
        
        console.log(`Thème appliqué: ${themeId}`);
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