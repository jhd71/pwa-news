/**
 * Correctif pour le repositionnement du chat quand le clavier virtuel se ferme
 * Spécialement pour iOS uniquement
 */
document.addEventListener('DOMContentLoaded', function() {
  // 🆕 Détection iOS - Ne s'exécuter QUE sur iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                !window.MSStream && 
                !(/Android/.test(navigator.userAgent));
  
  if (!isIOS) {
    console.log('chat-keyboard-fix.js: Non-iOS détecté, script ignoré');
    return; // 🛑 Arrêter l'exécution sur Android
  }
  
  console.log('chat-keyboard-fix.js: iOS détecté, application des correctifs');
  // Hauteur initiale de la fenêtre
  let initialWindowHeight = window.innerHeight;
  
  // Référence au chat
  const chatContainer = document.querySelector('.chat-container');
  const chatInput = document.querySelector('.chat-input');
  
  // Créer un bouton d'accès rapide à l'input
  function createInputAccessButton() {
    const button = document.createElement('button');
    button.className = 'input-access-button';
    button.innerHTML = '<span class="material-icons">keyboard_arrow_down</span>';
    
    button.addEventListener('click', function() {
      // Faire défiler jusqu'à l'input
      const chatInput = document.querySelector('.chat-input');
      if (chatInput) {
        chatInput.scrollIntoView({ behavior: 'smooth' });
      }
    });
    
    // Ajouter au chat
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
      chatContainer.appendChild(button);
    }
  }
  
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
        chatContainer.classList.add('keyboard-open');
        if (chatInput) chatInput.classList.add('keyboard-visible');
      } else {
        // Clavier fermé - repositionner le chat
        chatContainer.style.height = '';
        chatContainer.style.bottom = '';
        chatContainer.classList.remove('keyboard-open');
        if (chatInput) chatInput.classList.remove('keyboard-visible');
        
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
  
  // S'assurer que l'input reste toujours visible
  function ensureInputVisibility() {
    const chatInput = document.querySelector('.chat-input');
    if (chatInput && getComputedStyle(chatInput).display === 'none') {
      chatInput.style.display = 'flex';
    }
  }
  
  // Surveiller le redimensionnement de la fenêtre (ouverture/fermeture du clavier)
  window.addEventListener('resize', handleResize);
  
  // Vérifier périodiquement la visibilité de l'input
  setInterval(ensureInputVisibility, 500);
  
  // Pour les appareils iOS qui ne déclenchent pas toujours l'événement resize
  if (chatInput) {
    chatInput.addEventListener('focus', function() {
      // Utilisateur clique sur le champ de saisie (clavier va s'ouvrir)
      setTimeout(function() {
        // Ajuster la position du chat
        if (chatContainer && chatContainer.classList.contains('open')) {
          chatContainer.style.height = '50vh';
          chatContainer.style.bottom = '0';
          chatContainer.classList.add('keyboard-open');
          if (chatInput) chatInput.classList.add('keyboard-visible');
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
          chatContainer.classList.remove('keyboard-open');
          if (chatInput) chatInput.classList.remove('keyboard-visible');
          
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
  
  // Empêcher l'input de disparaître quand on clique dans les messages
  const messagesContainer = document.querySelector('.chat-messages');
  if (messagesContainer) {
    messagesContainer.addEventListener('click', function() {
      // S'assurer que l'input reste visible
      const chatInput = document.querySelector('.chat-input');
      if (chatInput) {
        chatInput.style.display = 'flex';
        
        // Garder l'input visible en ajoutant une classe
        chatInput.classList.add('force-visible');
        
        // S'assurer que le focus reste sur l'input
        setTimeout(function() {
          const textarea = chatInput.querySelector('textarea');
          if (textarea) {
            // Plutôt que de donner le focus directement (ce qui ouvrirait le clavier)
            // on s'assure juste que l'input reste visible
            chatInput.style.opacity = '1';
            chatInput.style.visibility = 'visible';
          }
        }, 100);
      }
    });
  }
  
  // Initialisation au chargement
  handleResize();
  createInputAccessButton();
});