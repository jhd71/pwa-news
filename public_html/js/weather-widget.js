// Widget météo - script final corrigé
document.addEventListener('DOMContentLoaded', function() {
  console.log("Initialisation du widget météo responsif");
  
  // ====== FONCTIONS UTILITAIRES ======
  // Fonction pour obtenir le GIF animé selon la météo
  function getAnimatedGif(condition) {
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('pluie') || conditionLower.includes('averse'))
      return "images/weather-gifs/rain.gif";
    else if (conditionLower.includes('neige'))
      return "images/weather-gifs/snow.gif";
    else if (conditionLower.includes('orage'))
      return "images/weather-gifs/thunderstorm.gif";
    else if (conditionLower.includes('nuage') || conditionLower.includes('couvert'))
      return "images/weather-gifs/cloudy.gif";
    else if (conditionLower.includes('soleil') || conditionLower.includes('ensoleillé') || conditionLower.includes('clair'))
      return "images/weather-gifs/sunny.gif";
    else if (conditionLower.includes('brouillard') || conditionLower.includes('brume'))
      return "images/weather-gifs/fog.gif";
    else if (conditionLower.includes('partiellement'))
      return "images/weather-gifs/partly_cloudy.gif";
    else
      return "images/weather-gifs/default.gif";
  }
  
  // ====== DÉTECTION D'APPAREIL ======
  // Fonction pour détecter le type d'appareil
  function getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width >= 768 && width <= 1100) return 'tablet';
    return 'desktop';
  }
  
  // ====== CHARGEMENT DES DONNÉES ======
  // Mise à jour du style du widget météo
async function loadWeatherData() {
  console.log("Chargement des données météo");
  
  const weatherWidget = document.getElementById('weather-widget');
  if (!weatherWidget) return;
  
  try {
    const apiKey = "4b79472c165b42f690790252242112";
    const city = "Montceau-les-Mines";
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=3&lang=fr`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Erreur : " + response.status);
    }
    
    const data = await response.json();
    const location = data.location;
    const current = data.current; // ✅ NOUVEAU : Données actuelles
    const forecast = data.forecast.forecastday;
    
    // ✅ NOUVEAU : Ajout de la température actuelle en haut
    let forecastHTML = `
      <div style="text-align: center; margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 10px;">
        <p style="margin: 0 0 5px 0; color: white; font-size: 16px;"><strong>${location.name}</strong></p>
        <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
          <span style="font-size: 24px; font-weight: bold; color: #FFD700;">${Math.round(current.temp_c)}°C</span>
          <img src="${current.condition.icon}" alt="${current.condition.text}" style="width: 32px; height: 32px;">
        </div>
        <p style="margin: 5px 0 0 0; color: white; font-size: 14px;">${current.condition.text}</p>
        <p style="margin: 2px 0 0 0; color: rgba(255,255,255,0.8); font-size: 12px;">
          Ressenti ${Math.round(current.feelslike_c)}°C • Vent ${Math.round(current.wind_kph)} km/h
        </p>
      </div>
    `;
    
    // ✅ NOUVEAU : Partager la température avec le widget horloge
    if (current && current.temp_c !== undefined) {
        window.currentTemp = Math.round(current.temp_c) + '°';
        const tempElement = document.getElementById('tempValue');
        if (tempElement) {
            tempElement.textContent = window.currentTemp;
        }
        
        // Sauvegarder globalement pour partage
        window.sharedWeatherData = {
            temperature: Math.round(current.temp_c),
            condition: current.condition.text,
            humidity: current.humidity,
            wind: Math.round(current.wind_kph),
            lastUpdate: new Date().getTime()
        };
        
        console.log(`🌡️ Température actuelle partagée: ${window.currentTemp}`);
    }
    
    // Générer les cartes pour chaque jour avec un style amélioré
    forecast.slice(0, 3).forEach((day, index) => {
      const date = new Date(day.date);
      const dayName = date.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' });
      
      // Obtenir le GIF animé pour la condition météo
      const animatedGif = getAnimatedGif(day.day.condition.text);
      
      // Créer une classe spécifique pour chaque jour
      const dayClass = `day-${index + 1}`;
      
      forecastHTML += `
      <div class="weather-day ${dayClass}">
        <h4>${dayName}</h4>
        
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <div style="flex: 1; text-align: center; color: white;">${day.day.condition.text}</div>
          <img src="${animatedGif}" alt="${day.day.condition.text}" class="weather-gif">
        </div>
        
        <div class="temperature-container">
          <span class="min-temp">${Math.round(day.day.mintemp_c)}°C</span>
          <span style="font-weight: bold; color: white;">-</span>
          <span class="max-temp">${Math.round(day.day.maxtemp_c)}°C</span>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 6px;">
          <div class="weather-detail-item">
            <span>Vent:</span>
            <span>${Math.round(day.day.maxwind_kph)} km/h</span>
          </div>
          <div class="weather-detail-item">
            <span>UV:</span>
            <span>${day.day.uv}</span>
          </div>
          <div class="weather-detail-item">
            <span>Humidité:</span>
            <span>${day.day.avghumidity}%</span>
          </div>
          <div class="weather-detail-item">
            <span>Pluie:</span>
            <span>${day.day.daily_chance_of_rain}%</span>
          </div>
        </div>
      </div>
      `;
    });
    
    // Injecte le contenu HTML dans le widget météo
    weatherWidget.innerHTML = forecastHTML;
    return true;
  } catch (error) {
    console.error("Erreur de chargement météo:", error);
    weatherWidget.innerHTML = `<p class="error" style="color: white;">Erreur de chargement des données météo: ${error.message}</p>`;
    return false;
  }
}

// ✅ NOUVEAU : Version simplifiée de fetchTemperature pour utiliser les données partagées
async function fetchTemperature() {
    try {
        // Si on a des données récentes du widget météo, les utiliser
        const now = new Date().getTime();
        if (window.sharedWeatherData && 
            (now - window.sharedWeatherData.lastUpdate) < 300000) { // 5 minutes
            
            currentTemp = window.sharedWeatherData.temperature + '°';
            const tempElement = document.getElementById('tempValue');
            if (tempElement) {
                tempElement.textContent = currentTemp;
            }
            console.log(`🌡️ Température depuis widget météo: ${currentTemp}`);
            return;
        }
        
        // Sinon, récupérer directement
        const apiKey = "4b79472c165b42f690790252242112";
        const city = "Montceau-les-Mines";
        const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&lang=fr`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.current && data.current.temp_c !== undefined) {
            currentTemp = Math.round(data.current.temp_c) + '°';
            const tempElement = document.getElementById('tempValue');
            if (tempElement) {
                tempElement.textContent = currentTemp;
            }
            console.log(`🌡️ Température directe: ${currentTemp}`);
        } else {
            throw new Error('Données météo indisponibles');
        }
        
    } catch (error) {
        console.log('❌ Impossible de récupérer la météo:', error);
        // Masquer le widget météo si échec
        const weatherWidget = document.getElementById('weatherTemp');
        if (weatherWidget) {
            weatherWidget.style.display = 'none';
        }
    }
}
  
  // ====== RÉFÉRENCES DOM ======
  // Sélection des éléments DOM
  const weatherSidebar = document.getElementById('weatherSidebar');
  const weatherShowBtn = document.getElementById('weatherShowBtn');
  const closeBtn = document.querySelector('.weather-toggle');
  
  // ====== BOUTON MOBILE ======
  // Vérifier l'existence du bouton mobile
  let weatherBtn = document.getElementById('weatherMobileBtn');
  
  // Suppression de tout bouton mobile dupliqué
  const duplicateButtons = document.querySelectorAll('.weather-mobile-btn');
  if (duplicateButtons.length > 1) {
    for (let i = 1; i < duplicateButtons.length; i++) {
      if (duplicateButtons[i].parentNode) {
        duplicateButtons[i].parentNode.removeChild(duplicateButtons[i]);
      }
    }
  }
  
  // Création du bouton s'il n'existe pas
  if (!weatherBtn) {
    weatherBtn = document.createElement('button');
    weatherBtn.className = 'weather-mobile-btn';
    weatherBtn.id = 'weatherMobileBtn';
    weatherBtn.title = 'Météo';
    weatherBtn.innerHTML = '<span class="material-icons">cloudy_snowing</span>';
    document.body.appendChild(weatherBtn);
  }
  
  // ====== FONCTIONS D'AFFICHAGE ======
  // Fonction pour afficher le widget météo
  function showWeatherWidget() {
  console.log("Affichage du widget météo");
  
  if (weatherSidebar) {
    // Chargement des données météo uniquement si elles n'ont pas déjà été chargées
    if (!window.weatherDataLoaded) {
      loadWeatherData();
      window.weatherDataLoaded = true;
    }
    
    // Affichage du widget
    weatherSidebar.style.display = 'block';
    weatherSidebar.style.visibility = 'visible';
    weatherSidebar.style.opacity = '1';
    weatherSidebar.classList.remove('hidden');
    weatherSidebar.classList.add('visible');
    window.weatherDataLoaded = false;
    // Ajustement de la position
    adjustWeatherWidgetPosition();
    
    // Gestion des boutons
    manageButtonsVisibility(false);
  }
}
  
  // Fonction pour masquer le widget météo
  function hideWeatherWidget() {
    console.log("Masquage du widget météo");
    
    if (weatherSidebar) {
      // Masquer le widget avec transition
      weatherSidebar.style.opacity = '0';
      weatherSidebar.classList.add('hidden');
      weatherSidebar.classList.remove('visible');
      
      // Cacher complètement après la transition
      setTimeout(() => {
        weatherSidebar.style.display = 'none';
        weatherSidebar.style.visibility = 'hidden';
      }, 300);
      
      // Afficher le bon bouton selon l'appareil
      manageButtonsVisibility(true);
    }
  }
  
  // ====== POSITIONNEMENT ======
  // Fonction pour ajuster la position du widget
  function adjustWeatherWidgetPosition() {
    const deviceType = getDeviceType();
    
    switch (deviceType) {
      case 'mobile':
        // Mobile: centré en haut
        weatherSidebar.style.left = '50%';
        weatherSidebar.style.transform = 'translateX(-50%)';
        weatherSidebar.style.top = '80px';
        weatherSidebar.style.position = 'fixed';
        weatherSidebar.style.marginTop = '0';
        break;
        
      case 'tablet':
        // Tablette: centré au milieu
        weatherSidebar.style.top = '50%';
        weatherSidebar.style.left = '50%';
        weatherSidebar.style.transform = 'translate(-50%, -50%)';
        weatherSidebar.style.maxWidth = '400px';
        weatherSidebar.style.position = 'fixed';
        weatherSidebar.style.marginTop = '0';
        break;
        
      default:
        // Desktop: côté gauche
        weatherSidebar.style.left = '10px';
        weatherSidebar.style.top = '90px';
        weatherSidebar.style.transform = 'none';
        break;
    }
  }
  
  // ====== GESTION DES BOUTONS ======
  // Fonction pour gérer la visibilité des boutons
  function manageButtonsVisibility(showButtons) {
    const deviceType = getDeviceType();
    
    // Si on doit cacher tous les boutons
    if (!showButtons) {
      if (weatherBtn) weatherBtn.style.display = 'none';
      if (weatherShowBtn) weatherShowBtn.style.display = 'none';
      return;
    }
    
    // Sinon, afficher le bon bouton selon le type d'appareil
    switch (deviceType) {
      case 'mobile':
        if (weatherBtn) {
          weatherBtn.style.display = 'flex';
          weatherBtn.style.zIndex = '990';
        }
        if (weatherShowBtn) weatherShowBtn.style.display = 'none';
        break;
        
      case 'tablet':
      case 'desktop':
        if (weatherBtn) weatherBtn.style.display = 'none';
        if (weatherShowBtn) {
          weatherShowBtn.style.display = 'flex';
          weatherShowBtn.style.opacity = '1';
          weatherShowBtn.style.transform = 'scale(1)';
          weatherShowBtn.style.zIndex = '990';
        }
        break;
    }
  }
  
  // ====== ÉCOUTEURS D'ÉVÉNEMENTS ======
  // Configuration du bouton mobile
  if (weatherBtn) {
    // Cloner pour supprimer les écouteurs précédents
    const newWeatherBtn = weatherBtn.cloneNode(true);
    if (weatherBtn.parentNode) {
      weatherBtn.parentNode.replaceChild(newWeatherBtn, weatherBtn);
    }
    weatherBtn = newWeatherBtn;
    
    weatherBtn.addEventListener('click', showWeatherWidget);
  }
  
  // Configuration du bouton de fermeture
  if (closeBtn) {
    // Cloner pour supprimer les écouteurs précédents
    const newCloseBtn = closeBtn.cloneNode(true);
    if (closeBtn.parentNode) {
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    }
    
    newCloseBtn.addEventListener('click', hideWeatherWidget);
  }
  
  // Configuration du bouton desktop
  if (weatherShowBtn) {
    // Cloner pour supprimer les écouteurs précédents
    const newWeatherShowBtn = weatherShowBtn.cloneNode(true);
    if (weatherShowBtn.parentNode) {
      weatherShowBtn.parentNode.replaceChild(newWeatherShowBtn, weatherShowBtn);
    }
    
    // Assurer la visibilité
    newWeatherShowBtn.style.opacity = '1';
    newWeatherShowBtn.style.transform = 'scale(1)';
    newWeatherShowBtn.style.display = 'flex';
    
    newWeatherShowBtn.addEventListener('click', showWeatherWidget);
  }
  
  // Écouteur de redimensionnement
  window.addEventListener('resize', function() {
    // Vérifier si le widget est ouvert
    if (weatherSidebar && 
        !weatherSidebar.classList.contains('hidden') && 
        weatherSidebar.style.display !== 'none') {
      adjustWeatherWidgetPosition();
    } else {
      manageButtonsVisibility(true);
    }
  });
  
  // ====== INITIALISATION ======
  // Configuration initiale
  if (weatherSidebar) {
    weatherSidebar.style.display = 'none';
    weatherSidebar.classList.add('hidden');
  }
  
  // Gérer la visibilité des boutons
  manageButtonsVisibility(true);
  
  // Exposer les fonctions globalement
  window.showWeatherWidget = showWeatherWidget;
  window.hideWeatherWidget = hideWeatherWidget;
  window.loadWeatherData = loadWeatherData;
  
  console.log("Configuration du widget météo terminée");
  
  // Vérification supplémentaire après un court délai
  setTimeout(() => {
    manageButtonsVisibility(true);
    console.log("Vérification supplémentaire des boutons météo");
    
    // Supprimer tout bouton mobile dupliqué
    const duplicateButtons = document.querySelectorAll('.weather-mobile-btn');
    if (duplicateButtons.length > 1) {
      console.log("Suppression de boutons météo dupliqués:", duplicateButtons.length - 1);
      for (let i = 1; i < duplicateButtons.length; i++) {
        if (duplicateButtons[i].parentNode) {
          duplicateButtons[i].parentNode.removeChild(duplicateButtons[i]);
        }
      }
    }
  }, 1000);
});