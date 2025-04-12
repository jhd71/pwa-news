// Au début de weather-widget.js
if (window.weatherWidget) {
  console.log("Instance de weatherWidget déjà existante, initialisation ignorée");
} else {
// Fonction globale explicitement attachée à window pour être accessible via l'attribut onclick
window.showWeatherWidget = function() {
  console.log("Fonction globale showWeatherWidget appelée");
  if (window.weatherWidget) {
    window.weatherWidget.showWidget();
  } else {
    console.error("Widget météo non initialisé");
  }
};

// Classe de gestion du widget météo
class WeatherWidget {
  constructor() {
    // Éléments DOM
    this.sidebar = document.getElementById('weatherSidebar');
    this.toggleBtn = document.querySelector('.weather-toggle');
    this.showBtn = document.getElementById('weatherShowBtn');
    this.mobileBtn = document.getElementById('weatherMobileBtn');
    
    // Initialisation
    this.init();
  }
  
  init() {
    console.log("Initialisation du widget météo");
    
    // Vérifier que les éléments existent
    if (!this.sidebar || !this.toggleBtn || !this.showBtn) {
      console.error("Éléments manquants pour le widget météo");
      return;
    }
    
    // Ajouter les écouteurs d'événements
    this.addEventListeners();
    
    // Charger l'état initial
    this.loadInitialState();
    
    // Charger les données météo
    this.loadWeatherData();
  }
  
  addEventListeners() {
    // Bouton de fermeture du widget
    this.toggleBtn.addEventListener('click', (e) => {
      console.log("Bouton de fermeture météo cliqué");
      e.preventDefault(); // Empêcher le comportement par défaut
      e.stopPropagation(); // Arrêter la propagation
      this.hideWidget();
    });
    
    // Bouton d'affichage du widget
    this.showBtn.addEventListener('click', (e) => {
      console.log("Bouton d'affichage météo cliqué");
      e.preventDefault(); // Empêcher le comportement par défaut
      e.stopPropagation(); // Arrêter la propagation
      this.showWidget();
    });
    
    // Bouton mobile (si présent) - ajouter un écouteur même s'il y a déjà un onclick
    if (this.mobileBtn) {
      this.mobileBtn.addEventListener('click', (e) => {
        console.log("Bouton météo mobile cliqué via addEventListener");
        e.preventDefault(); // Empêcher le comportement par défaut
        e.stopPropagation(); // Arrêter la propagation
        this.showWidget();
      });
    }
  }
  
  loadInitialState() {
    // Toujours masquer le widget au démarrage
    this.hideWidget();
  }
  
  showWidget() {
    // Cacher l'autre widget (communication inter-widget)
    if (window.quickLinksWidget) {
      window.quickLinksWidget.hideWidget();
    }
    
    // Afficher le widget météo
    if (this.sidebar) {
      console.log("Affichage du widget météo");
      
      // S'assurer que le widget s'ouvre du bon côté
      this.sidebar.style.left = '10px';
      this.sidebar.style.right = 'auto';
      
      // Enlever la classe hidden et ajouter visible
      this.sidebar.classList.remove('hidden');
      this.sidebar.classList.add('visible');
      
      // Pour le mobile, forcer l'affichage
      this.sidebar.style.display = 'block';
      this.sidebar.style.opacity = '1';
      this.sidebar.style.visibility = 'visible';
      this.sidebar.style.pointerEvents = 'auto';
      
      // Sur mobile, centrer le widget (si nécessaire)
      if (window.innerWidth <= 767) {
        this.sidebar.style.left = '50%';
        this.sidebar.style.transform = 'translateX(-50%)';
      }
      
      // Masquer le bouton d'affichage
      if (this.showBtn) {
        this.showBtn.classList.remove('visible');
      }
      
      // Sauvegarder l'état
      localStorage.setItem('weatherHidden', 'false');
      
      // Recharger les données météo
      this.loadWeatherData(true);
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
      localStorage.setItem('weatherHidden', 'true');
    }
  }
  
  loadWeatherData(forceLoad = false) {
    // Ne charger automatiquement que sur desktop, sauf si forceLoad est true
    if (window.innerWidth < 1200 && !forceLoad) return;
    
    console.log("Chargement des données météo");
    
    const apiKey = "4b79472c165b42f690790252242112";
    const city = "Montceau-les-Mines";
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=3&lang=fr`;
    
    const weatherContainer = document.getElementById("weather-widget");
    if (!weatherContainer) {
      console.error("Conteneur météo introuvable");
      return;
    }
    
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur : " + response.status);
        }
        return response.json();
      })
      .then((data) => {
        const location = data.location;
        const forecast = data.forecast.forecastday;
        
        // Version simplifiée pour le widget
        let forecastHTML = `<p style="text-align:center; margin: 0 0 5px 0;"><strong>${location.name}</strong></p>`;
        forecast.slice(0, 3).forEach((day) => {
          const date = new Date(day.date);
          const dayName = date.toLocaleDateString("fr-FR", { weekday: 'short' });
          
          forecastHTML += `
            <div class="weather-day">
              <h4>${dayName}</h4>
              <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
              <p>${day.day.condition.text}</p>
              <p>${Math.round(day.day.mintemp_c)}°C - ${Math.round(day.day.maxtemp_c)}°C</p>
            </div>
          `;
        });
        
        weatherContainer.innerHTML = forecastHTML;
      })
      .catch((error) => {
        weatherContainer.innerHTML = `<p class="error">Erreur météo: ${error.message}</p>`;
        console.error("Erreur météo:", error);
      });
  }
}

// Initialiser le widget au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  // Créer l'instance et l'exposer globalement
  window.weatherWidget = new WeatherWidget();
  
  // Debug: vérifier si la fonction globale est bien définie
  console.log("showWeatherWidget défini globalement:", typeof window.showWeatherWidget === 'function');
});
