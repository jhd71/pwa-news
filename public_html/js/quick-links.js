// Classe de gestion du widget de liens rapides
class QuickLinksWidget {
  constructor() {
    // Éléments DOM
    this.sidebar = document.querySelector('.quick-links-sidebar');
    this.toggleBtn = document.querySelector('.quick-links-toggle');
    this.showBtn = document.getElementById('quickLinksShowBtn');
    
    // Initialisation
    this.init();
  }
  
  init() {
    console.log("Initialisation du widget de liens rapides");
    
    // Vérifier que les éléments existent
    if (!this.sidebar || !this.toggleBtn || !this.showBtn) {
      console.error("Éléments manquants pour le widget de liens rapides");
      return;
    }
    
    // Ajouter les écouteurs d'événements
    this.addEventListeners();
    
    // Charger l'état initial
    this.loadInitialState();
  }
  
  addEventListeners() {
    // Bouton de fermeture du widget
    this.toggleBtn.addEventListener('click', (e) => {
      console.log("Bouton de fermeture liens rapides cliqué");
      e.preventDefault(); // CORRIGÉ: Empêcher le comportement par défaut
      e.stopPropagation(); // CORRIGÉ: Arrêter la propagation
      this.hideWidget();
    });
    
    // Bouton d'affichage du widget
    this.showBtn.addEventListener('click', (e) => {
      console.log("Bouton d'affichage liens rapides cliqué");
      e.preventDefault(); // CORRIGÉ: Empêcher le comportement par défaut
      e.stopPropagation(); // CORRIGÉ: Arrêter la propagation
      this.showWidget();
    });
  }
  
  loadInitialState() {
    // Toujours masquer le widget au démarrage
    this.hideWidget();
  }
  
  showWidget() {
    // Cacher l'autre widget (communication inter-widget)
    if (window.weatherWidget) {
      window.weatherWidget.hideWidget();
    }
    
    // Afficher le widget liens rapides
    if (this.sidebar) {
      this.sidebar.classList.remove('hidden');
      this.sidebar.classList.add('visible');
      
      // CORRIGÉ: S'assurer que le widget s'ouvre du bon côté
      this.sidebar.style.right = '10px';
      this.sidebar.style.left = 'auto';
      
      // Masquer le bouton d'affichage
      if (this.showBtn) {
        this.showBtn.classList.remove('visible');
      }
      
      // Sauvegarder l'état
      localStorage.setItem('quickLinksHidden', 'false');
    }
  }
  
  hideWidget() {
    if (this.sidebar) {
      this.sidebar.classList.add('hidden');
      this.sidebar.classList.remove('visible');
      
      // Afficher le bouton pour réafficher
      if (this.showBtn) {
        this.showBtn.classList.add('visible');
      }
      
      // Sauvegarder l'état
      localStorage.setItem('quickLinksHidden', 'true');
    }
  }
}

// Initialiser le widget au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  // Créer l'instance et l'exposer globalement
  window.quickLinksWidget = new QuickLinksWidget();
});
