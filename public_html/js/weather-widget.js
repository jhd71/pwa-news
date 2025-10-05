// Widget météo amélioré - Version hybride optimale
document.addEventListener('DOMContentLoaded', function() {
  console.log("Initialisation du widget météo amélioré");
  
  // ====== CONFIGURATION ======
  const WEATHER_API_KEY = "4b79472c165b42f690790252242112";
  const CITY = "Montceau-les-Mines";
  const DEPARTMENT_CODE = "71"; // Saône-et-Loire
  
  // ====== FONCTIONS UTILITAIRES ======
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
  
  function getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width >= 768 && width <= 1100) return 'tablet';
    return 'desktop';
  }
  
  // ====== ALERTES MÉTÉO-FRANCE ======
  async function fetchMeteoFranceAlerts() {
    try {
        // Nouvelle URL de l'API Météo-France vigilance
        const url = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/vigilance-meteorologique-de-meteo-france/records?where=nom_dept%3D%22SAONE-ET-LOIRE%22&limit=1`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.log('⚠️ Alertes Météo-France non disponibles (erreur API)');
            return null;
        }
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            const record = data.results[0];
            const alerts = [];
            
            // Vérifier les différents types de vigilance
            const vigilanceFields = ['vent', 'pluie_inondation', 'orage', 'inondation', 'neige', 'canicule', 'grand_froid', 'avalanches'];
            
            vigilanceFields.forEach(field => {
                const niveau = record[`vig_${field}`];
                if (niveau >= 3) {
                    alerts.push({
                        type: field.replace(/_/g, ' '),
                        niveau: niveau,
                        couleur: niveau === 4 ? '#d32f2f' : '#ff6f00'
                    });
                }
            });
            
            return alerts.length > 0 ? alerts : null;
        }
        
        return null;
    } catch (error) {
        console.log('ℹ️ Alertes Météo-France non disponibles:', error.message);
        return null; // Continuer sans alertes plutôt que de planter
    }
}
  
  // ====== CHARGEMENT DES DONNÉES ======
  async function loadWeatherData() {
    console.log("Chargement des données météo améliorées");
    
    const weatherWidget = document.getElementById('weather-widget');
    if (!weatherWidget) return;
    
    try {
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${CITY}&days=2&lang=fr&aqi=yes`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erreur : " + response.status);
        
        const data = await response.json();
        const location = data.location;
        const current = data.current;
        const forecast = data.forecast.forecastday;
        
        // Récupérer les alertes
        const alerts = data.alerts?.alert || [];
        
        let weatherHTML = '';
      
      // ====== ALERTES VIGILANCE ======
      if (alerts && alerts.length > 0) {
        weatherHTML += `<div class="weather-alerts">`;
        alerts.forEach(alert => {
          weatherHTML += `
            <div class="alert-item" style="background: ${alert.couleur}; color: white; padding: 8px; border-radius: 8px; margin-bottom: 8px; font-weight: bold; text-align: center;">
              <span class="material-icons" style="vertical-align: middle;">warning</span>
              Vigilance ${alert.niveau === 4 ? 'ROUGE' : 'ORANGE'} : ${alert.type.toUpperCase()}
            </div>
          `;
        });
        weatherHTML += `</div>`;
      }
      
      // ====== MÉTÉO ACTUELLE ======
		// Utiliser l'icône de l'API qui gère automatiquement jour/nuit
	const currentIcon = current.condition.icon;

	weatherHTML += `
	<div class="weather-current">
		<div style="text-align: center; margin-bottom: 10px;">
		<h3 style="margin: 0; color: white; font-size: 18px;">${location.name}</h3>
		<p style="margin: 2px 0; color: rgba(255,255,255,0.8); font-size: 12px;">
			Actualisé à ${new Date(current.last_updated).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
		</p>
		</div>
    
    <div style="display: flex; align-items: center; justify-content: space-around; background: rgba(255,255,255,0.1); border-radius: 12px; padding: 15px; margin-bottom: 15px;">
      <div style="text-align: center;">
        <div style="font-size: 42px; font-weight: bold; color: #FFD700;">${Math.round(current.temp_c)}°C</div>
        <div style="color: white; margin-top: 5px;">${current.condition.text}</div>
        <div style="color: rgba(255,255,255,0.7); font-size: 13px; margin-top: 3px;">
          Ressenti ${Math.round(current.feelslike_c)}°C
        </div>
      </div>
      <img src="${currentIcon}" alt="${current.condition.text}" style="width: 64px; height: 64px;">
    </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px;">
            <div class="weather-detail-box">
              <span class="material-icons" style="font-size: 20px;">air</span>
              <div>
                <div style="font-size: 11px; opacity: 0.8;">Vent</div>
                <div style="font-weight: bold;">${Math.round(current.wind_kph)} km/h</div>
              </div>
            </div>
            <div class="weather-detail-box">
              <span class="material-icons" style="font-size: 20px;">water_drop</span>
              <div>
                <div style="font-size: 11px; opacity: 0.8;">Humidité</div>
                <div style="font-weight: bold;">${current.humidity}%</div>
              </div>
            </div>
            <div class="weather-detail-box">
              <span class="material-icons" style="font-size: 20px;">wb_sunny</span>
              <div>
                <div style="font-size: 11px; opacity: 0.8;">UV</div>
                <div style="font-weight: bold;">${current.uv}</div>
              </div>
            </div>
            <div class="weather-detail-box">
              <span class="material-icons" style="font-size: 20px;">visibility</span>
              <div>
                <div style="font-size: 11px; opacity: 0.8;">Visibilité</div>
                <div style="font-weight: bold;">${Math.round(current.vis_km)} km</div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // ====== PRÉVISIONS HEURE PAR HEURE (PROCHAINES 24H) ======
      weatherHTML += `
        <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 15px;">
          <h4 style="color: white; margin: 0 0 10px 0; font-size: 16px;">Prochaines 24 heures</h4>
          <div class="hourly-forecast">
      `;
      
      const now = new Date();
      const currentHour = now.getHours();
      
      // Récupérer les heures pour aujourd'hui et demain
      let hourlyData = [];
      
      // Heures d'aujourd'hui
      forecast[0].hour.forEach((hour, index) => {
        if (index >= currentHour) {
          hourlyData.push(hour);
        }
      });
      
      // Compléter avec les heures de demain si besoin
      if (hourlyData.length < 24 && forecast[1]) {
        const remaining = 24 - hourlyData.length;
        hourlyData = hourlyData.concat(forecast[1].hour.slice(0, remaining));
      }
      
      // Afficher toutes les 3 heures (8 cartes)
      for (let i = 0; i < hourlyData.length; i += 3) {
        const hour = hourlyData[i];
        const time = new Date(hour.time).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
        
        weatherHTML += `
          <div class="hour-card">
            <div style="font-weight: bold; color: white; margin-bottom: 5px;">${time}</div>
            <img src="${hour.condition.icon}" alt="${hour.condition.text}" style="width: 32px; height: 32px; margin: 5px 0;">
            <div style="font-size: 18px; font-weight: bold; color: #FFD700;">${Math.round(hour.temp_c)}°</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.8); margin-top: 3px;">
              <span class="material-icons" style="font-size: 14px; vertical-align: middle;">water_drop</span>
              ${hour.chance_of_rain}%
            </div>
          </div>
        `;
      }
      
      weatherHTML += `
          </div>
        </div>
      `;
      
      // ====== DEMAIN ======
      if (forecast[1]) {
        const tomorrow = forecast[1];
        const date = new Date(tomorrow.date);
        const dayName = date.toLocaleDateString("fr-FR", { weekday: 'long' });
        
        weatherHTML += `
          <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 15px; margin-top: 15px;">
            <h4 style="color: white; margin: 0 0 10px 0; font-size: 16px; text-transform: capitalize;">${dayName}</h4>
            <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.1); border-radius: 10px; padding: 12px;">
              <div>
                <div style="color: white; margin-bottom: 5px;">${tomorrow.day.condition.text}</div>
                <div style="font-size: 20px; font-weight: bold; color: white;">
                  <span style="color: #90CAF9;">${Math.round(tomorrow.day.mintemp_c)}°</span>
                  <span style="margin: 0 5px;">-</span>
                  <span style="color: #FFB74D;">${Math.round(tomorrow.day.maxtemp_c)}°</span>
                </div>
              </div>
              <img src="${tomorrow.day.condition.icon}" alt="${tomorrow.day.condition.text}" style="width: 48px; height: 48px;">
            </div>
          </div>
        `;
      }
      
      // Injecter le HTML
      weatherWidget.innerHTML = weatherHTML;
      
      // Partager la température avec l'horloge
      if (current && current.temp_c !== undefined) {
        window.currentTemp = Math.round(current.temp_c) + '°';
        const tempElement = document.getElementById('tempValue');
        if (tempElement) {
          tempElement.textContent = window.currentTemp;
        }
        
        window.sharedWeatherData = {
          temperature: Math.round(current.temp_c),
          condition: current.condition.text,
          humidity: current.humidity,
          wind: Math.round(current.wind_kph),
          lastUpdate: new Date().getTime()
        };
        
        console.log(`Température actuelle: ${window.currentTemp}`);
      }
      
      return true;
    } catch (error) {
      console.error("Erreur de chargement météo:", error);
      weatherWidget.innerHTML = `<p class="error" style="color: white;">Erreur de chargement des données météo</p>`;
      return false;
    }
  }
  
  // ====== STYLES CSS ADDITIONNELS ======
  const style = document.createElement('style');
  style.textContent = `
    .weather-detail-box {
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: white;
    }
    
    .hourly-forecast {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 10px;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.3) transparent;
    }
    
    .hourly-forecast::-webkit-scrollbar {
      height: 6px;
    }
    
    .hourly-forecast::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.1);
      border-radius: 3px;
    }
    
    .hourly-forecast::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.3);
      border-radius: 3px;
    }
    
    .hour-card {
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 10px;
      min-width: 80px;
      text-align: center;
      flex-shrink: 0;
    }
  `;
  document.head.appendChild(style);
  
  // ====== RESTE DU CODE IDENTIQUE ======
  // (Toute la partie gestion des boutons, affichage/masquage, etc.)
  
  const weatherSidebar = document.getElementById('weatherSidebar');
  const weatherShowBtn = document.getElementById('weatherShowBtn');
  const closeBtn = document.querySelector('.weather-toggle');
  
  let weatherBtn = document.getElementById('weatherMobileBtn');
  
  const duplicateButtons = document.querySelectorAll('.weather-mobile-btn');
  if (duplicateButtons.length > 1) {
    for (let i = 1; i < duplicateButtons.length; i++) {
      if (duplicateButtons[i].parentNode) {
        duplicateButtons[i].parentNode.removeChild(duplicateButtons[i]);
      }
    }
  }
  
  if (!weatherBtn) {
    weatherBtn = document.createElement('button');
    weatherBtn.className = 'weather-mobile-btn';
    weatherBtn.id = 'weatherMobileBtn';
    weatherBtn.title = 'Météo';
    weatherBtn.innerHTML = '<span class="material-icons">cloudy_snowing</span>';
    document.body.appendChild(weatherBtn);
  }
  
  function showWeatherWidget() {
  console.log("Affichage du widget météo");
  
  if (weatherSidebar) {
    if (!window.weatherDataLoaded) {
      loadWeatherData();
      window.weatherDataLoaded = true;
    }
    
    weatherSidebar.style.display = 'block';
    weatherSidebar.style.visibility = 'visible';
    weatherSidebar.style.opacity = '1';
    weatherSidebar.classList.remove('hidden');
    weatherSidebar.classList.add('visible');
    
    // ✅ BLOQUER LE SCROLL SUR MOBILE
    if (getDeviceType() === 'mobile') {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }
    
    adjustWeatherWidgetPosition();
    manageButtonsVisibility(false);
  }
}
  
  function hideWeatherWidget() {
  console.log("Masquage du widget météo");
  
  if (weatherSidebar) {
    weatherSidebar.style.opacity = '0';
    weatherSidebar.classList.add('hidden');
    weatherSidebar.classList.remove('visible');
    
    // ✅ RÉACTIVER LE SCROLL
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    
    setTimeout(() => {
      weatherSidebar.style.display = 'none';
      weatherSidebar.style.visibility = 'hidden';
      window.weatherDataLoaded = false;
    }, 300);
    
    manageButtonsVisibility(true);
  }
}
  
  function adjustWeatherWidgetPosition() {
    const deviceType = getDeviceType();
    
    switch (deviceType) {
      case 'mobile':
        weatherSidebar.style.left = '50%';
        weatherSidebar.style.transform = 'translateX(-50%)';
        weatherSidebar.style.top = '80px';
        weatherSidebar.style.position = 'fixed';
        weatherSidebar.style.marginTop = '0';
        break;
        
      case 'tablet':
        weatherSidebar.style.top = '50%';
        weatherSidebar.style.left = '50%';
        weatherSidebar.style.transform = 'translate(-50%, -50%)';
        weatherSidebar.style.maxWidth = '400px';
        weatherSidebar.style.position = 'fixed';
        weatherSidebar.style.marginTop = '0';
        break;
        
      default:
        weatherSidebar.style.left = '10px';
        weatherSidebar.style.top = '90px';
        weatherSidebar.style.transform = 'none';
        break;
    }
  }
  
  function manageButtonsVisibility(showButtons) {
    const deviceType = getDeviceType();
    
    if (!showButtons) {
      if (weatherBtn) weatherBtn.style.display = 'none';
      if (weatherShowBtn) weatherShowBtn.style.display = 'none';
      return;
    }
    
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
  
  if (weatherBtn) {
    const newWeatherBtn = weatherBtn.cloneNode(true);
    if (weatherBtn.parentNode) {
      weatherBtn.parentNode.replaceChild(newWeatherBtn, weatherBtn);
    }
    weatherBtn = newWeatherBtn;
    weatherBtn.addEventListener('click', showWeatherWidget);
  }
  
  if (closeBtn) {
    const newCloseBtn = closeBtn.cloneNode(true);
    if (closeBtn.parentNode) {
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    }
    newCloseBtn.addEventListener('click', hideWeatherWidget);
  }
  
  if (weatherShowBtn) {
    const newWeatherShowBtn = weatherShowBtn.cloneNode(true);
    if (weatherShowBtn.parentNode) {
      weatherShowBtn.parentNode.replaceChild(newWeatherShowBtn, weatherShowBtn);
    }
    newWeatherShowBtn.style.opacity = '1';
    newWeatherShowBtn.style.transform = 'scale(1)';
    newWeatherShowBtn.style.display = 'flex';
    newWeatherShowBtn.addEventListener('click', showWeatherWidget);
  }
  
  window.addEventListener('resize', function() {
    if (weatherSidebar && 
        !weatherSidebar.classList.contains('hidden') && 
        weatherSidebar.style.display !== 'none') {
      adjustWeatherWidgetPosition();
    } else {
      manageButtonsVisibility(true);
    }
  });
  
  if (weatherSidebar) {
    weatherSidebar.style.display = 'none';
    weatherSidebar.classList.add('hidden');
  }
  
  manageButtonsVisibility(true);
  
  window.showWeatherWidget = showWeatherWidget;
  window.hideWeatherWidget = hideWeatherWidget;
  window.loadWeatherData = loadWeatherData;
  
  console.log("Configuration du widget météo terminée");
  
  setTimeout(() => {
    manageButtonsVisibility(true);
    const duplicateButtons = document.querySelectorAll('.weather-mobile-btn');
    if (duplicateButtons.length > 1) {
      for (let i = 1; i < duplicateButtons.length; i++) {
        if (duplicateButtons[i].parentNode) {
          duplicateButtons[i].parentNode.removeChild(duplicateButtons[i]);
        }
      }
    }
  }, 1000);
});