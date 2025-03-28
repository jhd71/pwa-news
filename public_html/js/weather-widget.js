// Fonction pour charger la météo
function loadWeatherWidget() {
  // Ne charger que sur desktop
  if (window.innerWidth < 1200) return;
  
  const apiKey = "4b79472c165b42f690790252242112";
  const city = "Montceau-les-Mines";
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=3&lang=fr`;
  
  // Utiliser weather-widget au lieu de weather
  const weatherContainer = document.getElementById("weather-widget");
  
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
      weatherContainer.innerHTML = `<p class="error">${error.message}</p>`;
      console.error("Erreur météo:", error);
    });
}

// Charger la météo au chargement de la page
document.addEventListener("DOMContentLoaded", function() {
  loadWeatherWidget();
  setupWeatherToggle();
});

// Fonction pour configurer le basculement du widget météo
function setupWeatherToggle() {
  const weatherSidebar = document.getElementById('weatherSidebar');
  const weatherToggle = document.querySelector('.weather-toggle');
  const weatherShowBtn = document.getElementById('weatherShowBtn');
  
  if (!weatherSidebar || !weatherToggle || !weatherShowBtn) {
    console.error("Éléments manquants pour la bascule météo");
    return;
  }
  
  // Vérifier si l'état est enregistré
  const weatherHidden = localStorage.getItem('weatherHidden') === 'true';
  
  // Appliquer l'état initial
  if (weatherHidden) {
    weatherSidebar.classList.add('hidden');
    weatherShowBtn.classList.add('visible');
  }
  
  // Gérer le clic sur le bouton masquer
  weatherToggle.addEventListener('click', function() {
    weatherSidebar.classList.add('hidden');
    weatherShowBtn.classList.add('visible');
    localStorage.setItem('weatherHidden', 'true');
  });
  
  // Gérer le clic sur le bouton afficher
  weatherShowBtn.addEventListener('click', function() {
    weatherSidebar.classList.remove('hidden');
    weatherShowBtn.classList.remove('visible');
    localStorage.setItem('weatherHidden', 'false');
  });
}