// Gestionnaire des thèmes
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
        
        // Configurer le bouton de thème unique
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
        
        console.log(`Thème appliqué: ${themeId}`);
    }
    
    // Configurer le bouton de thème (unique)
    setupThemeButton() {
        // Utilisez le bouton existant qui sert à alterner entre les trois thèmes
        // Nous supposons qu'il existe un bouton avec un id comme 'themeToggle'
        const themeToggleBtn = document.getElementById('themeToggle') || document.querySelector('.theme-toggle');
        
        if (themeToggleBtn) {
            // Supprimer les gestionnaires d'événements existants
            const newBtn = themeToggleBtn.cloneNode(true);
            themeToggleBtn.parentNode.replaceChild(newBtn, themeToggleBtn);
            
            // Ajouter notre propre gestionnaire
            newBtn.addEventListener('click', () => {
                this.cycleThemes();
            });
        } else {
            console.warn("Bouton de changement de thème non trouvé. Assurez-vous d'avoir un bouton avec l'ID 'themeToggle' ou la classe 'theme-toggle'.");
        }
        
        // Nous ne créons aucun nouveau bouton, car vous avez mentionné avoir déjà une icône qui sert pour les trois thèmes
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
    }
    
    // Obtenir le thème actuel
    getCurrentTheme() {
        return localStorage.getItem('theme') || 'rouge';
    }
}

// Initialiser le gestionnaire de thèmes au chargement
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
});