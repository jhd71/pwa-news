// Gestion du widget météo
document.addEventListener('DOMContentLoaded', function() {
  // Récupérer les éléments du DOM
  const weatherSidebar = document.querySelector('.weather-sidebar');
  const weatherToggle = document.querySelector('.weather-toggle');
  const weatherShowBtn = document.getElementById('weatherShowBtn');
  const weatherMobileBtn = document.getElementById('weatherMobileBtn');
  
  // Vérifier si les éléments existent
  if (!weatherSidebar || !weatherToggle || !weatherShowBtn) {
    console.error("Éléments manquants pour le widget météo");
    return;
  }
  
  console.log("Initialisation du widget météo");
  
  // Sur mobile, masquer le widget par défaut
  if (window.innerWidth < 768) {
    weatherSidebar.classList.add('hidden');
    localStorage.setItem('weatherHidden', 'true');
  } else {
    // Sur desktop, vérifier l'état enregistré
    const weatherHidden = localStorage.getItem('weatherHidden') === 'true';
    
    if (weatherHidden) {
      weatherSidebar.classList.add('hidden');
      weatherShowBtn.classList.add('visible');
    }
  }
  
  // Gérer le clic sur le bouton masquer (la croix)
  weatherToggle.addEventListener('click', function() {
    console.log("Bouton de fermeture cliqué");
    weatherSidebar.classList.add('hidden');
    weatherShowBtn.classList.add('visible');
    localStorage.setItem('weatherHidden', 'true');
  });
  
  // Gérer le clic sur le bouton afficher
  weatherShowBtn.addEventListener('click', function() {
    console.log("Bouton d'affichage cliqué");
    weatherSidebar.classList.remove('hidden');
    weatherShowBtn.classList.remove('visible');
    localStorage.setItem('weatherHidden', 'false');
    
    // Charger les données météo
    loadWeatherWidget(true);
  });
  
  // Gérer le clic sur le bouton mobile
  if (weatherMobileBtn) {
    console.log("Bouton météo mobile trouvé");
    weatherMobileBtn.addEventListener('click', function() {
      console.log("Bouton météo mobile cliqué");
      
      // Forcer l'affichage
      weatherSidebar.classList.remove('hidden');
      
      // Assurer la visibilité avec des styles directs en cas de problème CSS
      weatherSidebar.style.display = 'block';
      weatherSidebar.style.opacity = '1';
      weatherSidebar.style.visibility = 'visible';
      
      // Forcer la transformation pour mobile
      if (window.innerWidth < 768) {
        weatherSidebar.style.transform = 'translateX(-50%)';
      } else {
        weatherSidebar.style.transform = 'none';
      }
      
      // Masquer le bouton de réaffichage
      weatherShowBtn.classList.remove('visible');
      
      // Sauvegarder l'état
      localStorage.setItem('weatherHidden', 'false');
      
      // Charger les données météo
      loadWeatherWidget(true);
    });
  }
  
  // Charger les données météo
  loadWeatherWidget();
});

// Fonction pour charger la météo
function loadWeatherWidget(forceLoad = false) {
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
