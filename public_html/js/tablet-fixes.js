// Corrections spécifiques pour tablettes - version améliorée
document.addEventListener('DOMContentLoaded', function() {
  // Fonction pour détecter si l'appareil est une tablette en mode portrait
  function isTabletPortrait() {
    return window.innerWidth >= 600 && 
           window.innerWidth <= 1100 && 
           window.innerHeight > window.innerWidth;
  }
  
  // Fonction pour forcer le positionnement du widget météo sur tablette
  function fixWeatherWidgetPosition() {
    if (isTabletPortrait()) {
      console.log("Correction position widget météo pour tablette portrait");
      
      const weatherWidget = document.getElementById('weatherSidebar');
      if (weatherWidget && weatherWidget.style.display !== 'none' && !weatherWidget.classList.contains('hidden')) {
        // Forcer la position au centre avec une taille adaptée
        weatherWidget.style.display = 'block';
        weatherWidget.style.visibility = 'visible';
        weatherWidget.style.opacity = '1';
        weatherWidget.style.top = '50%';
        weatherWidget.style.left = '50%';
        weatherWidget.style.transform = 'translate(-50%, -50%)';
        weatherWidget.style.zIndex = '1500';
        weatherWidget.style.maxWidth = '400px';
        weatherWidget.style.width = '400px';
        weatherWidget.style.maxHeight = '500px';
        weatherWidget.style.overflowY = 'auto';
        weatherWidget.style.position = 'fixed';
        weatherWidget.style.marginTop = '0';
        
        // S'assurer que le bouton de fermeture reste visible
        const closeBtn = weatherWidget.querySelector('.weather-toggle');
        if (closeBtn) {
          closeBtn.style.zIndex = '1501';
          closeBtn.style.position = 'absolute';
          closeBtn.style.top = '8px';
          closeBtn.style.right = '8px';
        }
      }
    }
  }
  
  // Fonction pour corriger immédiatement le positionnement
  function immediateFixForTablet() {
    if (isTabletPortrait()) {
      const weatherWidget = document.getElementById('weatherSidebar');
      if (weatherWidget) {
        fixWeatherWidgetPosition();
      }
    }
  }
  
  // Vérifier et corriger le widget météo au chargement, après 500ms et 1000ms (pour être sûr)
  immediateFixForTablet();
  setTimeout(immediateFixForTablet, 500);
  setTimeout(immediateFixForTablet, 1000);
  
  // Observer les changements de taille d'écran
  window.addEventListener('resize', immediateFixForTablet);
  
  // Observer les changements dans la visibilité du widget
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
        immediateFixForTablet();
      }
    });
  });
  
  // Configurer l'observation du widget météo
  const weatherWidget = document.getElementById('weatherSidebar');
  if (weatherWidget) {
    observer.observe(weatherWidget, { 
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }
  
  // Étendre la fonction showWeatherWidget si elle existe
  if (typeof window.showWeatherWidget === 'function') {
    const originalShowWeatherWidget = window.showWeatherWidget;
    
    window.showWeatherWidget = function() {
      // Appeler d'abord la fonction originale
      originalShowWeatherWidget();
      
      // Puis appliquer notre correction pour tablette
      setTimeout(fixWeatherWidgetPosition, 100);
    };
    
    console.log("Fonction showWeatherWidget étendue pour tablettes");
  }
});