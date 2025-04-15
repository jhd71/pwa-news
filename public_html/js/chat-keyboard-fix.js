/**
 * Correctif pour le repositionnement du chat quand le clavier virtuel se ferme
 * Spécialement pour les tablettes et mobiles
 */
document.addEventListener('DOMContentLoaded', function() {
  // Hauteur initiale de la fenêtre
  let initialWindowHeight = window.innerHeight;
  
  // Référence au chat
  const chatContainer = document.querySelector('.chat-container');
  const chatInput = document.querySelector('.chat-input');
  
  // Hauteur minimale pour considérer que le clavier est ouvert (75% de la hauteur d'origine)
  const keyboardThreshold = initialWindowHeight * 0.75;
  
  // Fonction pour détecter les changements de taille de la fenêtre (ouverture/fermeture du clavier)
  function handleResize() {
    // Mise à jour lors du premier chargement
    if (initialWindowHeight === 0) {
      initialWindowHeight = window.innerHeight;
      return;
    }
    
    // Si le chat est ouvert
    if (chatContainer && chatContainer.classList.contains('open')) {
      if (window.innerHeight < keyboardThreshold) {
        // Clavier ouvert - ajuster la position du chat
        chatContainer.style.height = '50vh';
        chatContainer.style.bottom = '0';
      } else {
        // Clavier fermé - repositionner le chat
        chatContainer.style.height = '';
        chatContainer.style.bottom = '';
        
        // Vérifier si nous sommes sur une tablette
        if (window.innerWidth >= 768 && window.innerWidth <= 1024) {
          chatContainer.style.height = '70vh';
          
          // S'assurer que le chat est bien positionné au-dessus de la barre de navigation
          const bottomNav = document.querySelector('.bottom-nav');
          if (bottomNav) {
            const navHeight = bottomNav.offsetHeight;
            chatContainer.style.bottom = (navHeight + 5) + 'px';
          }
        }
      }
    }
  }
  
  // Surveiller le redimensionnement de la fenêtre (ouverture/fermeture du clavier)
  window.addEventListener('resize', handleResize);
  
  // Pour les appareils iOS qui ne déclenchent pas toujours l'événement resize
  if (chatInput) {
    chatInput.addEventListener('focus', function() {
      // Utilisateur clique sur le champ de saisie (clavier va s'ouvrir)
      setTimeout(function() {
        // Ajuster la position du chat
        if (chatContainer && chatContainer.classList.contains('open')) {
          chatContainer.style.height = '50vh';
          chatContainer.style.bottom = '0';
        }
      }, 300);
    });
    
    chatInput.addEventListener('blur', function() {
      // Utilisateur quitte le champ de saisie (clavier va se fermer)
      setTimeout(function() {
        // Repositionner le chat
        if (chatContainer && chatContainer.classList.contains('open')) {
          chatContainer.style.height = '';
          chatContainer.style.bottom = '';
          
          // Vérifier si nous sommes sur une tablette
          if (window.innerWidth >= 768 && window.innerWidth <= 1024) {
            chatContainer.style.height = '70vh';
            
            const bottomNav = document.querySelector('.bottom-nav');
            if (bottomNav) {
              const navHeight = bottomNav.offsetHeight;
              chatContainer.style.bottom = (navHeight + 5) + 'px';
            }
          }
        }
      }, 300);
    });
  }
  
  // Initialisation au chargement
  handleResize();
});