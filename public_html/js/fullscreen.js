// Ajoutez ce code dans votre fichier JavaScript principal ou créez un nouveau fichier
// fullscreen.js et incluez-le dans votre HTML

document.addEventListener('DOMContentLoaded', function() {
  // Fonction pour détecter si l'appli est lancée en mode PWA (et non dans le navigateur)
  function isPWA() {
    return window.matchMedia('(display-mode: fullscreen)').matches || 
           window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
  }

  // Si nous sommes en PWA, on essaie de demander le mode plein écran au démarrage
  if (isPWA()) {
    // Sur certains appareils Android, une action utilisateur est nécessaire
    // Nous ajoutons donc un bouton qui peut être cliqué pour entrer en plein écran
    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.innerText = 'Activer plein écran';
    fullscreenBtn.style.position = 'fixed';
    fullscreenBtn.style.top = '10px';
    fullscreenBtn.style.right = '10px';
    fullscreenBtn.style.zIndex = '9999';
    fullscreenBtn.style.display = 'none';
    document.body.appendChild(fullscreenBtn);

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
});