// tickerAnimation.js - Animation JavaScript pour la barre d'informations défilante

document.addEventListener('DOMContentLoaded', function() {
  // Configuration de l'animation
  const config = {
    // Vitesse de défilement en pixels par seconde
    speed: {
      desktop: 50,   // Plus rapide sur desktop
      tablet: 30,    // Plus lent sur tablette
      mobile: 40     // Intermédiaire sur mobile
    },
    // Pause au survol
    pauseOnHover: true,
    // Distance entre les répétitions du contenu en pixels
    gap: 50
  };
  
  // Récupération des éléments
  const ticker = document.querySelector('.ticker-wrapper');
  const tickerContainer = document.querySelector('.news-ticker');
  
  // Si le ticker n'existe pas, arrêter l'exécution
  if (!ticker || !tickerContainer) return;
  
  // Variables d'animation
  let animationFrameId;
  let startTime;
  let currentPosition = tickerContainer.offsetWidth; // Démarrer hors écran à droite
  let isPaused = false;
  let tickerWidth = 0;
  let speed = config.speed.desktop; // Vitesse par défaut
  
  // Déterminer la vitesse en fonction de la largeur d'écran
  function updateSpeed() {
    const width = window.innerWidth;
    
    if (width <= 600) {
      speed = config.speed.mobile;
    } else if (width <= 900) {
      speed = config.speed.tablet;
    } else {
      speed = config.speed.desktop;
    }
    
    // Ajustement supplémentaire pour les tablettes 8 pouces
    if (width >= 768 && width <= 820) {
      speed = 25; // Encore plus lent pour les tablettes 8 pouces
    }
    
    console.log(`Ticker speed set to ${speed}px/s for screen width ${width}px`);
  }
  
  // Calculer la largeur totale du contenu du ticker
  function updateTickerWidth() {
    // Mise à jour de la largeur des éléments
    const tickerItems = ticker.querySelectorAll('.ticker-item');
    
    if (tickerItems.length === 0) return;
    
    // Réinitialiser les styles pour mesurer correctement
    ticker.style.display = 'inline-flex';
    ticker.style.width = 'auto';
    ticker.style.position = 'relative';
    
    // Mesurer la largeur réelle du contenu
    tickerWidth = 0;
    tickerItems.forEach(item => {
      tickerWidth += item.offsetWidth;
    });
    
    // Ajouter un espace entre les répétitions
    tickerWidth += config.gap;
    
    console.log(`Ticker content width: ${tickerWidth}px`);
    
    // Si le contenu est plus court que le conteneur, le dupliquer pour assurer une animation continue
    if (tickerWidth < tickerContainer.offsetWidth * 2) {
      const clone = ticker.cloneNode(true);
      ticker.appendChild(clone.innerHTML);
      
      // Recalculer après duplication
      tickerWidth = ticker.offsetWidth;
      console.log(`Content duplicated, new width: ${tickerWidth}px`);
    }
  }
  
  // Fonction d'animation
  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    
    if (!isPaused) {
      // Calculer le temps écoulé en secondes
      const elapsed = (timestamp - startTime) / 1000;
      
      // Calculer la nouvelle position
      currentPosition = tickerContainer.offsetWidth - (elapsed * speed);
      
      // Si le ticker est complètement sorti par la gauche, le repositionner
      if (currentPosition < -tickerWidth) {
        startTime = timestamp;
        currentPosition = tickerContainer.offsetWidth;
      }
      
      // Appliquer la position
      ticker.style.transform = `translateX(${currentPosition}px)`;
    }
    
    // Continuer l'animation
    animationFrameId = requestAnimationFrame(animate);
  }
  
  // Gestionnaires d'événements pour pause/reprise
  function setupEventListeners() {
    if (config.pauseOnHover) {
      ticker.addEventListener('mouseenter', () => {
        isPaused = true;
        console.log('Ticker animation paused');
      });
      
      ticker.addEventListener('mouseleave', () => {
        isPaused = false;
        console.log('Ticker animation resumed');
      });
    }
    
    // Mettre à jour les valeurs lors du redimensionnement de la fenêtre
    window.addEventListener('resize', () => {
      updateSpeed();
      updateTickerWidth();
      
      // Réinitialiser l'animation lors du redimensionnement
      cancelAnimationFrame(animationFrameId);
      startTime = null;
      currentPosition = tickerContainer.offsetWidth;
      animationFrameId = requestAnimationFrame(animate);
      
      console.log('Ticker animation reset due to window resize');
    });
  }
  
  // Initialisation
  function init() {
    // Supprimer toute animation CSS existante
    ticker.style.animation = 'none';
    
    // Préparer le ticker pour l'animation JavaScript
    ticker.style.display = 'inline-flex';
    ticker.style.position = 'relative';
    ticker.style.transform = `translateX(${tickerContainer.offsetWidth}px)`;
    
    updateSpeed();
    updateTickerWidth();
    setupEventListeners();
    
    // Démarrer l'animation
    animationFrameId = requestAnimationFrame(animate);
    console.log('Ticker animation started');
  }
  
  // Vérifier si la page est visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // La page est masquée, mettre en pause l'animation
      cancelAnimationFrame(animationFrameId);
      console.log('Ticker animation paused (page hidden)');
    } else {
      // La page est visible, redémarrer l'animation
      startTime = null;
      animationFrameId = requestAnimationFrame(animate);
      console.log('Ticker animation resumed (page visible)');
    }
  });
  
  // Démarrer l'animation après un court délai pour s'assurer que tout est chargé
  setTimeout(init, 100);
});