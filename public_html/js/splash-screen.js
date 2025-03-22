// splash-screen.js - Script pour gérer le splash screen de la PWA
document.addEventListener('DOMContentLoaded', function() {
  const splashScreen = document.getElementById('splash-screen');
  
  // Si le splash screen n'existe pas encore, on le crée
  if (!splashScreen) {
    createSplashScreen();
  }
  
  // Fonction pour créer le splash screen dynamiquement s'il n'existe pas
  function createSplashScreen() {
    const splash = document.createElement('div');
    splash.id = 'splash-screen';
    
    // Sélectionner la bonne image de splash selon la taille de l'écran
    const splashImg = document.createElement('img');
    splashImg.className = 'splash-logo';
    splashImg.alt = 'Actu&Média';
    
    // Déterminer quelle image utiliser selon la taille de l'écran
    splashImg.src = getSplashImagePath();
    
    // Ajouter l'image au splash screen
    splash.appendChild(splashImg);
    
    // Ajouter le texte (optionnel car vos images contiennent déjà le texte)
    /* 
    const splashText = document.createElement('div');
    splashText.className = 'splash-text';
    splashText.textContent = 'Actu&Média';
    splash.appendChild(splashText);
    */
    
    // Ajouter le splash screen au body
    document.body.appendChild(splash);
    
    return splash;
  }
  
  // Fonction pour déterminer quelle image de splash utiliser selon les dimensions de l'écran
  function getSplashImagePath() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = window.devicePixelRatio || 1;
    
    // Déterminer la taille d'écran
    if (width <= 320) {
      return 'images/splash-320x470.png';  // Pour les petits écrans
    } else if (width <= 375) {
      return 'images/splash-750x1334.png';  // iPhone 6-8
    } else if (width <= 414) {
      return 'images/splash-1242x2208.png'; // iPhone 6-8 Plus
    } else if (width <= 768) {
      return 'images/splash-1536x2048.png'; // iPad
    } else if (width <= 1024) {
      return 'images/splash-2048x2732.png'; // iPad Pro
    } else {
      return 'images/splash-1242x2208.png'; // Fallback pour grands écrans
    }
  }
  
  // Fonction pour détecter si l'appli est lancée en mode PWA
  function isPWA() {
    return window.matchMedia('(display-mode: fullscreen)').matches || 
           window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
  }
  
  // Fonction pour masquer le splash screen
  function hideSplashScreen() {
    const splash = splashScreen || document.getElementById('splash-screen');
    if (splash) {
      splash.classList.add('hidden');
      
      // Supprimer complètement après la transition
      setTimeout(() => {
        if (splash && splash.parentNode) {
          splash.parentNode.removeChild(splash);
        }
      }, 500); // Durée correspondant à la transition CSS
    }
  }
  
  // Fonction pour essayer d'activer le plein écran
  function tryEnterFullscreen() {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    }
  }
  
  // Détecte si nous sommes déjà en plein écran
  function isFullscreen() {
    return !!(document.fullscreenElement || 
              document.mozFullScreenElement || 
              document.webkitFullscreenElement || 
              document.msFullscreenElement);
  }
  
  // Si nous sommes en PWA, on essaie de demander le mode plein écran au démarrage
  if (isPWA()) {
    // Sur certains appareils Android, une action utilisateur est nécessaire
    // Nous ajoutons donc un bouton qui peut être cliqué pour entrer en plein écran
    // Ce bouton est masqué par défaut et n'apparaît que si le fullscreen automatique échoue
    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.innerText = 'Activer plein écran';
    fullscreenBtn.style.position = 'fixed';
    fullscreenBtn.style.top = '10px';
    fullscreenBtn.style.right = '10px';
    fullscreenBtn.style.zIndex = '9999';
    fullscreenBtn.style.padding = '8px 12px';
    fullscreenBtn.style.backgroundColor = '#1a237e';
    fullscreenBtn.style.color = 'white';
    fullscreenBtn.style.border = 'none';
    fullscreenBtn.style.borderRadius = '4px';
    fullscreenBtn.style.display = 'none';
    document.body.appendChild(fullscreenBtn);
    
    // Essayer d'entrer en plein écran automatiquement
    if (!isFullscreen()) {
      try {
        tryEnterFullscreen();
      } catch (e) {
        console.log('Impossible d\'entrer en plein écran automatiquement:', e);
        // Si ça échoue, montrer le bouton
        fullscreenBtn.style.display = 'block';
      }
    }
    
    // Ajouter un gestionnaire d'événements pour le bouton
    fullscreenBtn.addEventListener('click', function() {
      tryEnterFullscreen();
      // Masquer le bouton après avoir essayé
      setTimeout(() => {
        fullscreenBtn.style.display = 'none';
      }, 1000);
    });
    
    // Écouter les changements de plein écran
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    function handleFullscreenChange() {
      if (isFullscreen()) {
        fullscreenBtn.style.display = 'none';
      }
    }
  }
  
  // Masquer le splash screen après le chargement complet
  window.addEventListener('load', function() {
    // Ajouter un délai pour s'assurer que tout est bien chargé
    // et pour montrer le splash screen au moins pendant un certain temps
    setTimeout(hideSplashScreen, 2000); // 2 secondes de délai minimum
  });
  
  // Si le chargement prend trop de temps, masquer le splash screen après un délai maximum
  setTimeout(hideSplashScreen, 5000); // 5 secondes maximum
  
  // Gestionnaire pour les erreurs de chargement (pour éviter que le splash reste coincé)
  window.addEventListener('error', function() {
    setTimeout(hideSplashScreen, 1000);
  });
});