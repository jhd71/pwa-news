// Créez un fichier pwa-chat-fixes.js
(function() {
  // Attendre que le DOM soit prêt
  document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si nous sommes dans une PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone;
    
    if (!isPWA) return;
    
    // Observer les changements de classe pour détecter le mode plein écran
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'class') {
          const target = mutation.target;
          
          if (target.classList.contains('chat-container') && 
              target.classList.contains('fullscreen')) {
            // Corriger le problème de barre
            fixFullscreenBar(target);
          }
        }
      });
    });
    
    // Observer tous les conteneurs de chat
    document.querySelectorAll('.chat-container').forEach(container => {
      observer.observe(container, { attributes: true });
    });
    
    // Fonction pour corriger la barre
    function fixFullscreenBar(container) {
      // Supprimer tout espace entre les éléments
      container.style.setProperty('display', 'flex', 'important');
      container.style.setProperty('flex-direction', 'column', 'important');
      
      const messagesContainer = container.querySelector('.chat-messages');
      const inputContainer = container.querySelector('.chat-input');
      
      if (messagesContainer && inputContainer) {
        // Ajuster les styles directement
        messagesContainer.style.setProperty('flex', '1', 'important');
        messagesContainer.style.setProperty('margin-bottom', '0', 'important');
        messagesContainer.style.setProperty('padding-bottom', '60px', 'important');
        
        inputContainer.style.setProperty('position', 'absolute', 'important');
        inputContainer.style.setProperty('bottom', '0', 'important');
        inputContainer.style.setProperty('left', '0', 'important');
        inputContainer.style.setProperty('right', '0', 'important');
      }
    }
  });
})();
