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
    this.toggleBtn.addEventListener('click', () => {
      console.log("Bouton de fermeture liens rapides cliqué");
      this.hideWidget();
    });
    
    // Bouton d'affichage du widget
    this.showBtn.addEventListener('click', () => {
      console.log("Bouton d'affichage liens rapides cliqué");
      this.showWidget();
    });
    
    // Écouter les événements d'ouverture du panel d'actualités et du chat
    document.addEventListener('panelOpened', () => this.handlePanelOpened());
    document.addEventListener('panelClosed', () => this.handlePanelClosed());
  }
  
  handlePanelOpened() {
    // Réduire le z-index du bouton de widget
    if (this.showBtn) this.showBtn.style.zIndex = '10';
  }
  
  handlePanelClosed() {
    // Restaurer le z-index du bouton de widget
    if (this.showBtn) this.showBtn.style.zIndex = '999';
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
    
    // Cacher aussi les panels plein écran si ouverts
    this.closeFullscreenPanels();
    
    // Afficher le widget liens rapides
    if (this.sidebar) {
      this.sidebar.classList.remove('hidden');
      this.sidebar.classList.add('visible');
      
      // Pour le mobile, forcer l'affichage
      this.sidebar.style.display = 'block';
      this.sidebar.style.opacity = '1';
      this.sidebar.style.visibility = 'visible';
      this.sidebar.style.pointerEvents = 'auto';
      
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
  
  closeFullscreenPanels() {
    // Fermer le panel d'actualités s'il est ouvert
    const newsPanel = document.getElementById('newsPanel');
    if (newsPanel && newsPanel.classList.contains('open')) {
      const closeBtn = newsPanel.querySelector('.close-panel');
      if (closeBtn) closeBtn.click();
    }
    
    // Fermer le chat s'il est ouvert
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer && chatContainer.classList.contains('open')) {
      const chatToggleBtn = document.getElementById('chatToggleBtn');
      if (chatToggleBtn) chatToggleBtn.click();
    }
  }
}

// Initialiser le widget au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  // Créer l'instance et l'exposer globalement
  window.quickLinksWidget = new QuickLinksWidget();
});
