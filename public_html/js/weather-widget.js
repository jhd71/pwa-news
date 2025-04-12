// Fonction pour charger la météo - modifiée pour fonctionner sur mobile également
function loadWeatherWidget(forceLoad = false) {
  // Ne charger automatiquement que sur desktop, sauf si forceLoad est true
  if (window.innerWidth < 1200 && !forceLoad) return;
  
  const apiKey = "4b79472c165b42f690790252242112";
  const city = "Montceau-les-Mines";
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=3&lang=fr`;
  
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

<!-- Bouton météo mobile -->
<button class="weather-mobile-btn" id="weatherMobileBtn" title="Météo">
  <span class="material-icons">wb_sunny</span>
</button>

// Fonction modifiée pour configurer le basculement du widget météo
function setupWeatherToggle() {
  const weatherSidebar = document.getElementById('weatherSidebar');
  const weatherToggle = document.querySelector('.weather-toggle');
  const weatherShowBtn = document.getElementById('weatherShowBtn');
  
  if (!weatherSidebar || !weatherToggle || !weatherShowBtn) {
    console.error("Éléments manquants pour la bascule météo");
    return;
  }
  
  // Sur mobile, masquer le widget par défaut
  if (window.innerWidth < 768) {
    weatherSidebar.classList.add('hidden');
    weatherShowBtn.classList.add('visible');
    localStorage.setItem('weatherHidden', 'true');
  } else {
    // Sur desktop, vérifier l'état enregistré
    const weatherHidden = localStorage.getItem('weatherHidden') === 'true';
    
    if (weatherHidden) {
      weatherSidebar.classList.add('hidden');
      weatherShowBtn.classList.add('visible');
    }
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
    
    // Charger les données météo si ce n'est pas déjà fait
    loadWeatherWidget(true);
  });
  
  // Configuration du bouton météo mobile
  const weatherMobileBtn = document.getElementById('weatherMobileBtn');
  if (weatherMobileBtn) {
    weatherMobileBtn.addEventListener('click', function() {
      // Afficher le widget météo
      weatherSidebar.classList.remove('hidden');
      weatherShowBtn.classList.remove('visible');
      localStorage.setItem('weatherHidden', 'false');
      
      // Charger les données météo
      loadWeatherWidget(true);
      
      // Optionnel : faire défiler vers le haut si nécessaire
      window.scrollTo({top: 0, behavior: 'smooth'});
    });
  }
}

/* Bouton météo pour mobile */
.weather-mobile-btn {
  position: fixed;
  top: 66px; /* Même hauteur que votre bouton liens rapides */
  left: 15px;
  background-color: var(--primary-color); /* Votre couleur primaire (violet) */
  color: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
  z-index: 990;
  display: none; /* Caché par défaut */
}

/* Afficher uniquement sur mobile */
@media (max-width: 767px) {
  .weather-mobile-btn {
    display: flex;
  }
  
  .bottom-nav .nav-item[href="meteo.html"] {
    display: none;
  }

  .weather-sidebar {
    width: 85%;
    max-width: 300px;
    left: 50%;
    transform: translateX(-50%);
    top: 100px;
  }

  .weather-show-btn {
    top: 100px;
    left: 15px;
  }
}