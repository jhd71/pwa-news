// Classe de gestion du widget de liens rapides
class QuickLinksWidget {
  constructor() {
    // Éléments DOM
    this.sidebar = document.querySelector('#quickLinksSidebar');
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
    
    // S'assurer que le widget est masqué initialement
    if (this.sidebar) {
      this.sidebar.style.display = 'none';
      this.sidebar.style.visibility = 'hidden';
      this.sidebar.style.opacity = '0';
      this.sidebar.classList.add('hidden');
    }
    
    // Ajouter les écouteurs d'événements
    this.addEventListeners();
    
    // Observer les changements de thème pour correction des couleurs
    this.observeThemeChanges();
    
    // Rendre le bouton d'affichage visible
    this.makeShowButtonVisible();
  }
  
  makeShowButtonVisible() {
    if (this.showBtn) {
      // Configurer d'abord pour l'animation
      this.showBtn.style.opacity = '0';
      this.showBtn.style.transform = 'scale(0)';
      this.showBtn.style.display = 'flex';
      
      // Puis afficher avec une animation
      setTimeout(() => {
        this.showBtn.style.opacity = '1';
        this.showBtn.style.transform = 'scale(1)';
        this.showBtn.classList.add('visible');
        console.log('Bouton de liens rapides visible');
      }, 500);
    }
  }
  
  addEventListeners() {
    // Bouton de fermeture du widget
    this.toggleBtn.addEventListener('click', (e) => {
      console.log("Bouton de fermeture liens rapides cliqué");
      e.preventDefault(); 
      e.stopPropagation();
      this.hideWidget();
    });
    
    // Bouton d'affichage du widget
    this.showBtn.addEventListener('click', (e) => {
      console.log("Bouton d'affichage liens rapides cliqué");
      e.preventDefault();
      e.stopPropagation();
      this.showWidget();
    });
    
    // Écouter les changements de taille d'écran
    window.addEventListener('resize', () => {
      if (this.sidebar && 
          !this.sidebar.classList.contains('hidden') && 
          this.sidebar.style.display !== 'none') {
        this.adjustPosition();
      }
    });
  }
  
  showWidget() {
    // Cacher l'autre widget (communication inter-widget)
    if (window.weatherWidget) {
      window.weatherWidget.hideWidget();
    }
    
    // Afficher le widget liens rapides
    if (this.sidebar) {
      // D'abord, positionner correctement
      this.adjustPosition();
      
      // Puis afficher
      this.sidebar.style.display = 'block';
      this.sidebar.style.visibility = 'visible';
      this.sidebar.style.opacity = '1';
      this.sidebar.classList.remove('hidden');
      this.sidebar.classList.add('visible');
      
      // Masquer le bouton d'affichage
      if (this.showBtn) {
        this.showBtn.classList.remove('visible');
      }
      
      // Corriger les couleurs de texte en mode sombre
      this.fixDarkThemeText();
      
      // Sauvegarder l'état
      localStorage.setItem('quickLinksHidden', 'false');
    }
  }
  
  hideWidget() {
    if (this.sidebar) {
      // Masquer avec animation
      this.sidebar.style.opacity = '0';
      this.sidebar.classList.add('hidden');
      this.sidebar.classList.remove('visible');
      
      // Cacher complètement après la transition
      setTimeout(() => {
        this.sidebar.style.display = 'none';
        this.sidebar.style.visibility = 'hidden';
      }, 300);
      
      // Afficher le bouton pour réafficher
      if (this.showBtn) {
        this.showBtn.classList.add('visible');
      }
      
      // Sauvegarder l'état
      localStorage.setItem('quickLinksHidden', 'true');
    }
  }
  
  adjustPosition() {
    // Ajuster la position selon le type d'appareil
    const windowWidth = window.innerWidth;
    
    if (windowWidth < 768) {
      // Mobile: centré en haut
      this.sidebar.style.left = '50%';
      this.sidebar.style.transform = 'translateX(-50%)';
      this.sidebar.style.right = 'auto';
      this.sidebar.style.top = '80px';
    } 
    else if (windowWidth >= 768 && windowWidth <= 1100) {
      // Tablette: en haut à droite
      this.sidebar.style.right = '20px';
      this.sidebar.style.left = 'auto';
      this.sidebar.style.transform = 'none';
      this.sidebar.style.top = '130px';
    } 
    else {
      // Desktop: en haut à droite
      this.sidebar.style.right = '10px';
      this.sidebar.style.left = 'auto';
      this.sidebar.style.transform = 'none';
      this.sidebar.style.top = '90px';
    }
  }
  
  fixDarkThemeText() {
    // Corriger la couleur du texte en mode sombre
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
      const linkTexts = this.sidebar.querySelectorAll('.quick-link span:not(.material-icons)');
      linkTexts.forEach(text => {
        text.style.color = 'white';
      });
    }
  }
  
  observeThemeChanges() {
    // Observer les changements de thème pour ajuster les couleurs
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'data-theme' && 
            this.sidebar && 
            !this.sidebar.classList.contains('hidden')) {
          this.fixDarkThemeText();
        }
      });
    });
    
    // Observer les changements d'attribut data-theme sur html
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }
}

// Un seul écouteur d'événements DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // Créer l'instance et l'exposer globalement
  window.quickLinksWidget = new QuickLinksWidget();
  
  // Exposer les méthodes globalement pour compatibilité
  window.showQuickLinks = () => {
    if (window.quickLinksWidget) {
      window.quickLinksWidget.showWidget();
    }
  };
  
  window.hideQuickLinks = () => {
    if (window.quickLinksWidget) {
      window.quickLinksWidget.hideWidget();
    }
  };
});