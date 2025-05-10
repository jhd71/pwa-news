class ThemeManager {
    constructor() {
        // Définir les thèmes disponibles
        this.themes = [
            { id: 'light', name: 'Violet', icon: 'color_lens' },
            { id: 'dark', name: 'Sombre', icon: 'dark_mode' },
            { id: 'rouge', name: 'Rouge', icon: 'palette' }
        ];
        
        // Initialiser le système de thèmes
        this.init();
        
        // Exposer les méthodes et propriétés pour les autres scripts
        window.themeManager = this;
    }
    
    init() {
        // Récupérer le thème sauvegardé
        const savedTheme = localStorage.getItem('theme');
        
        // Appliquer le thème sauvegardé ou le thème par défaut (rouge)
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else {
            document.documentElement.setAttribute('data-theme', 'rouge');
            localStorage.setItem('theme', 'rouge');
        }
        
        // Configurer le bouton de thème
        this.setupThemeButton();
        
        console.log('ThemeManager initialisé');
    }
    
    // Appliquer un thème spécifique
    setTheme(themeId) {
        // Vérifier si le thème existe
        if (!this.themes.find(t => t.id === themeId)) {
            console.error(`Thème inconnu: ${themeId}`);
            return;
        }
        
        // Appliquer le thème au document
        document.documentElement.setAttribute('data-theme', themeId);
        
        // Sauvegarder dans le localStorage
        localStorage.setItem('theme', themeId);
        
        // Émettre un événement pour les autres scripts
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: themeId }
        }));
        
        // Afficher une notification toast pour indiquer le changement de thème
        this.showToast(`Thème ${this.getThemeName(themeId)} activé`);
        
        console.log(`Thème appliqué: ${themeId}`);
    }
    
    // Obtenir le nom du thème à partir de son ID
    getThemeName(themeId) {
        const theme = this.themes.find(t => t.id === themeId);
        return theme ? theme.name : themeId;
    }
    
    // Configurer le bouton de thème
    setupThemeButton() {
        // CORRECTION: Utiliser le bouton darkModeToggle qui existe dans le HTML
        const themeToggleBtn = document.getElementById('darkModeToggle');
        
        if (themeToggleBtn) {
            // Supprimer les gestionnaires d'événements existants
            const newBtn = themeToggleBtn.cloneNode(true);
            themeToggleBtn.parentNode.replaceChild(newBtn, themeToggleBtn);
            
            // Ajouter notre propre gestionnaire
            newBtn.addEventListener('click', () => {
                this.cycleThemes();
            });
            
            // Mettre à jour le texte du bouton selon le thème actuel
            this.updateThemeButtonUI();
        } else {
            console.warn("Bouton de changement de thème non trouvé. Assurez-vous d'avoir un bouton avec l'ID 'darkModeToggle'.");
        }
    }
    
    // Mettre à jour l'interface du bouton de thème
    updateThemeButtonUI() {
        const themeToggleBtn = document.getElementById('darkModeToggle');
        if (!themeToggleBtn) return;
        
        const currentTheme = this.getCurrentTheme();
        const theme = this.themes.find(t => t.id === currentTheme);
        
        if (theme) {
            // Mettre à jour l'icône
            const iconElement = themeToggleBtn.querySelector('.material-icons');
            if (iconElement) {
                iconElement.textContent = theme.icon;
            }
            
            // Mettre à jour le texte
            const textElement = themeToggleBtn.querySelector('span:not(.material-icons)');
            if (textElement) {
                textElement.textContent = theme.name;
            }
            
            // Ajouter la classe active uniquement au bouton actuel
            const allButtons = document.querySelectorAll('.nav-item');
            allButtons.forEach(btn => btn.classList.remove('active'));
            themeToggleBtn.classList.add('active');
        }
    }
    
    // Faire défiler les thèmes dans l'ordre
    cycleThemes() {
        const currentTheme = this.getCurrentTheme();
        const themeIds = this.themes.map(t => t.id);
        
        // Trouver l'index du thème actuel
        const currentIndex = themeIds.indexOf(currentTheme);
        
        // Calculer le prochain index (revenir au début si on atteint la fin)
        const nextIndex = (currentIndex + 1) % themeIds.length;
        
        // Appliquer le prochain thème
        this.setTheme(themeIds[nextIndex]);
        
        // Mettre à jour l'interface du bouton
        this.updateThemeButtonUI();
    }
    
    // Obtenir le thème actuel
    getCurrentTheme() {
        return localStorage.getItem('theme') || 'rouge';
    }
    
    // Afficher une notification toast
    showToast(message) {
        // Créer un élément toast s'il n'existe pas déjà
        let toast = document.getElementById('theme-toast');
        
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'theme-toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        
        // Définir le message
        toast.textContent = message;
        
        // Afficher le toast
        toast.classList.add('show');
        
        // Masquer le toast après 3 secondes
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialiser le gestionnaire de thèmes au chargement
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();

    // Correction pour l'animation constante du chat
    document.addEventListener('themeChanged', function() {
        // Arrêter l'animation de pulsation du bouton de chat après 2 secondes
        setTimeout(() => {
            const chatToggleBtn = document.getElementById('chatToggleBtn');
            if (chatToggleBtn) {
                chatToggleBtn.style.animation = 'none';
            }
        }, 2000);
    });
    
    // S'assurer que le bouton de chat ne pulse pas constamment
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

// Script pour arrêter l'animation au clic
document.addEventListener('click', function(e) {
    if (e.target.closest('#chatToggleBtn')) {
        const chatToggleBtn = document.getElementById('chatToggleBtn');
        if (chatToggleBtn) {
            chatToggleBtn.style.animation = 'none';
        }
    }
});