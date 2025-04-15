// Corrections spécifiques pour tablettes
document.addEventListener('DOMContentLoaded', function() {
  // Fonction pour forcer le positionnement du widget météo
  function fixWeatherWidgetPosition() {
    const isTabletPortrait = window.innerWidth >= 600 && 
                            window.innerWidth <= 1100 && 
                            window.innerHeight > window.innerWidth;
    
    if (isTabletPortrait) {
      console.log("Correction position widget météo pour tablette portrait");
      
      const weatherWidget = document.getElementById('weatherSidebar');
      if (weatherWidget && !weatherWidget.classList.contains('hidden')) {
        // Forcer la position au centre
        weatherWidget.style.display = 'block';
        weatherWidget.style.visibility = 'visible';
        weatherWidget.style.opacity = '1';
        weatherWidget.style.top = '50%';
        weatherWidget.style.left = '50%';
        weatherWidget.style.transform = 'translate(-50%, -50%)';
        weatherWidget.style.zIndex = '99999';
      }
    }
  }
  
  // Étendre la fonction showWeatherWidget existante
  const originalShowWeatherWidget = window.showWeatherWidget;
  
  if (typeof originalShowWeatherWidget === 'function') {
    window.showWeatherWidget = function() {
      // Appeler d'abord la fonction originale
      originalShowWeatherWidget();
      
      // Puis appliquer notre correction
      setTimeout(fixWeatherWidgetPosition, 100);
    };
  }
  
  // Vérifier et corriger le widget météo au chargement et au redimensionnement
  fixWeatherWidgetPosition();
  window.addEventListener('resize', fixWeatherWidgetPosition);
});