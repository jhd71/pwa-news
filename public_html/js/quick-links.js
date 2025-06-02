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

// Fonction globale pour afficher les numéros d'urgence
function showEmergencyNumbers(event) {
  event.preventDefault();
  
  // Créer le modal d'urgence
  const modal = document.createElement('div');
  modal.className = 'emergency-modal';
  modal.innerHTML = `
    <div class="emergency-content">
      <div class="emergency-header">
        <h3>🚨 Numéros d'urgence</h3>
        <button class="close-emergency">×</button>
      </div>
      <div class="emergency-numbers">
        <div class="emergency-item" onclick="callNumber('15')">
          <span class="material-icons">medical_services</span>
          <div>
            <strong>15 - SAMU</strong>
            <span>Urgences médicales</span>
          </div>
        </div>
        <div class="emergency-item" onclick="callNumber('18')">
          <span class="material-icons">local_fire_department</span>
          <div>
            <strong>18 - Pompiers</strong>
            <span>Incendie, accidents</span>
          </div>
        </div>
        <div class="emergency-item" onclick="callNumber('17')">
          <span class="material-icons">shield</span>
          <div>
            <strong>17 - Police</strong>
            <span>Police secours</span>
          </div>
        </div>
        <div class="emergency-item" onclick="callNumber('112')">
          <span class="material-icons">phone</span>
          <div>
            <strong>112 - Urgences UE</strong>
            <span>Numéro d'urgence européen</span>
          </div>
        </div>
		<div class="emergency-item" onclick="window.open('https://www.ch-montceau71.fr/', '_blank')">
			<span class="material-icons">local_hospital</span>
		<div>
			<strong>Hôpital Montceau</strong>
			<span>Centre hospitalier</span>
		</div>
		</div>
        <div class="emergency-item" onclick="callNumber('114')">
          <span class="material-icons">hearing</span>
          <div>
            <strong>114 - Malentendants</strong>
            <span>Urgences par SMS/Fax</span>
          </div>
        </div>       
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Styles CSS inline pour le modal
  const style = document.createElement('style');
  style.textContent = `
    .emergency-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .emergency-content {
      background: white;
      border-radius: 15px;
      padding: 20px;
      max-width: 400px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }
    .emergency-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      color: #d32f2f;
    }
    .close-emergency {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
    }
    .emergency-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      border: 2px solid #f5f5f5;
      border-radius: 10px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .emergency-item:hover {
      border-color: #d32f2f;
      background: #fff5f5;
    }
    .emergency-item .material-icons {
      color: #d32f2f;
      font-size: 28px;
    }
    .emergency-item div {
      flex: 1;
    }
    .emergency-item strong {
      display: block;
      color: #333;
      font-size: 16px;
    }
    .emergency-item span {
      color: #666;
      font-size: 14px;
    }
  `;
  
  document.head.appendChild(style);
  
  // Fermeture du modal
  modal.querySelector('.close-emergency').onclick = () => {
    modal.remove();
    style.remove();
  };
  
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove();
      style.remove();
    }
  };
}

// Fonction pour appeler un numéro
function callNumber(number) {
  if (confirm(`Appeler le ${number} ?`)) {
    window.location.href = `tel:${number}`;
  }
}

// Fonction pour appeler un numéro
function callNumber(number) {
  if (confirm(`Appeler le ${number} ?`)) {
    window.location.href = `tel:${number}`;
  }
}

// AJOUTEZ ICI - Fonction globale pour la recherche locale
function openLocalSearchDirect() {
    const searchUrl = 'https://www.google.fr/maps/search/?api=1&query=Montceau-les-Mines,+France';
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
    console.log('🔍 Ouverture de la recherche locale');
}