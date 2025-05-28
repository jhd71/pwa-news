/**
 * Correctif optimisé pour le repositionnement du chat quand le clavier virtuel se ferme
 * Spécialement optimisé pour iOS, Android et tablettes
 */
document.addEventListener('DOMContentLoaded', function() {
  'use strict';
  
  // Détection des plateformes
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isMobile = window.innerWidth <= 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth <= 1024;
  
  console.log('Chat Keyboard Fix - Plateforme détectée:', { isIOS, isAndroid, isMobile, isTablet });
  
  // Variables globales
  let initialWindowHeight = window.innerHeight;
  let initialViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  let keyboardHeight = 0;
  let isKeyboardVisible = false;
  
  // Références aux éléments
  let chatContainer = null;
  let chatInput = null;
  let chatMessages = null;
  let inputAccessButton = null;
  
  // Fonction pour obtenir les éléments (avec retry)
  function getChatElements() {
    chatContainer = document.querySelector('.chat-container');
    chatInput = document.querySelector('.chat-input, .chat-input textarea, textarea[class*="chat"]');
    chatMessages = document.querySelector('.chat-messages, .messages-container');
    
    return {
      container: chatContainer,
      input: chatInput,
      messages: chatMessages
    };
  }
  
  // Seuil pour détecter l'ouverture du clavier
  const keyboardThreshold = isIOS ? 150 : initialWindowHeight * 0.25;
  
  // Créer un bouton d'accès rapide à l'input (amélioré)
  function createInputAccessButton() {
    if (inputAccessButton) return; // Éviter les doublons
    
    const button = document.createElement('button');
    button.className = 'input-access-button';
    button.innerHTML = '<span class="material-icons">keyboard_arrow_down</span>';
    button.style.cssText = `
      position: fixed;
      top: 50%;
      right: 20px;
      transform: translateY(-50%);
      z-index: 10001;
      background: var(--primary-color, #7E57C2);
      color: white;
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      display: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
    `;
    
    button.addEventListener('click', function() {
      const elements = getChatElements();
      if (elements.input) {
        elements.input.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest'
        });
        
        // Focus sur iOS avec délai
        if (isIOS) {
          setTimeout(() => {
            if (elements.input.tagName === 'TEXTAREA') {
              elements.input.focus();
            } else {
              const textarea = elements.input.querySelector('textarea');
              if (textarea) textarea.focus();
            }
          }, 300);
        }
      }
    });
    
    document.body.appendChild(button);
    inputAccessButton = button;
  }
  
  // Gestion spécifique iOS avec Visual Viewport API
  function setupIOSKeyboardHandling() {
    if (!window.visualViewport) {
      console.log('Visual Viewport API non supporté, utilisation de la méthode fallback');
      return setupFallbackKeyboardHandling();
    }
    
    window.visualViewport.addEventListener('resize', () => {
      const currentHeight = window.visualViewport.height;
      const heightDiff = initialViewportHeight - currentHeight;
      
      keyboardHeight = heightDiff;
      isKeyboardVisible = heightDiff > keyboardThreshold;
      
      console.log('iOS Keyboard state:', { isKeyboardVisible, keyboardHeight, heightDiff });
      
      adjustChatForKeyboard();
    });
    
    window.visualViewport.addEventListener('scroll', () => {
      if (isKeyboardVisible) {
        adjustChatForKeyboard();
      }
    });
  }
  
  // Méthode fallback pour les anciens iOS ou autres plateformes
  function setupFallbackKeyboardHandling() {
    let resizeTimeout;
    
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        handleResize();
      }, 100);
    });
  }
  
  // Fonction principale d'ajustement du chat
  function adjustChatForKeyboard() {
    const elements = getChatElements();
    
    if (!elements.container || !elements.container.classList.contains('open')) {
      return;
    }
    
    if (isKeyboardVisible) {
      // Clavier ouvert
      elements.container.classList.add('keyboard-open');
      
      if (isIOS) {
        // iOS - Ajustement spécifique
        elements.container.style.cssText += `
          height: ${Math.max(300, initialViewportHeight - keyboardHeight - 100)}px !important;
          bottom: 0 !important;
          position: fixed !important;
          max-height: ${Math.max(300, initialViewportHeight - keyboardHeight - 100)}px !important;
        `;
        
        if (elements.messages) {
          elements.messages.style.cssText += `
            height: ${Math.max(200, initialViewportHeight - keyboardHeight - 200)}px !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
          `;
        }
      } else {
        // Android/Autres
        elements.container.style.cssText += `
          height: 50vh !important;
          bottom: 0 !important;
        `;
      }
      
      if (elements.input) {
        elements.input.classList.add('keyboard-visible');
        elements.input.style.cssText += `
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
        `;
      }
      
      // Afficher le bouton d'accès si nécessaire
      if (inputAccessButton && isMobile) {
        inputAccessButton.style.display = 'block';
      }
      
    } else {
      // Clavier fermé
      elements.container.classList.remove('keyboard-open');
      
      // Reset des styles
      elements.container.style.cssText = elements.container.style.cssText
        .replace(/height:\s*[^;]*!important;?/gi, '')
        .replace(/bottom:\s*[^;]*!important;?/gi, '')
        .replace(/position:\s*[^;]*!important;?/gi, '')
        .replace(/max-height:\s*[^;]*!important;?/gi, '');
      
      if (elements.messages) {
        elements.messages.style.cssText = elements.messages.style.cssText
          .replace(/height:\s*[^;]*!important;?/gi, '')
          .replace(/overflow-y:\s*[^;]*!important;?/gi, '')
          .replace(/-webkit-overflow-scrolling:\s*[^;]*!important;?/gi, '');
      }
      
      if (elements.input) {
        elements.input.classList.remove('keyboard-visible');
      }
      
      // Ajustement pour tablettes
      if (isTablet) {
        elements.container.style.height = '70vh';
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
          const navHeight = bottomNav.offsetHeight;
          elements.container.style.bottom = (navHeight + 5) + 'px';
        }
      }
      
      // Cacher le bouton d'accès
      if (inputAccessButton) {
        inputAccessButton.style.display = 'none';
      }
    }
  }
  
  // Fonction de resize (fallback)
  function handleResize() {
    if (initialWindowHeight === 0) {
      initialWindowHeight = window.innerHeight;
      return;
    }
    
    const heightDiff = initialWindowHeight - window.innerHeight;
    
    isKeyboardVisible = isIOS ? 
      (heightDiff > keyboardThreshold) : 
      (window.innerHeight < initialWindowHeight * 0.75);
    
    keyboardHeight = heightDiff;
    
    console.log('Fallback Keyboard state:', { isKeyboardVisible, keyboardHeight, heightDiff });
    
    adjustChatForKeyboard();
  }
  
  // Gestion des événements focus/blur améliorée
  function setupInputEventHandlers() {
    const checkAndSetup = () => {
      const elements = getChatElements();
      
      if (elements.input) {
        // Supprimer les anciens listeners
        elements.input.removeEventListener('focus', handleInputFocus);
        elements.input.removeEventListener('blur', handleInputBlur);
        
        // Ajouter les nouveaux
        elements.input.addEventListener('focus', handleInputFocus);
        elements.input.addEventListener('blur', handleInputBlur);
        
        // Gestion spécifique pour les textarea imbriqués
        const textarea = elements.input.querySelector('textarea');
        if (textarea && textarea !== elements.input) {
          textarea.removeEventListener('focus', handleInputFocus);
          textarea.removeEventListener('blur', handleInputBlur);
          textarea.addEventListener('focus', handleInputFocus);
          textarea.addEventListener('blur', handleInputBlur);
        }
      }
    };
    
    // Configuration initiale
    checkAndSetup();
    
    // Re-vérifier périodiquement (pour les éléments créés dynamiquement)
    const setupInterval = setInterval(() => {
      const elements = getChatElements();
      if (elements.input) {
        checkAndSetup();
      }
    }, 2000);
    
    // Nettoyer après 30 secondes
    setTimeout(() => {
      clearInterval(setupInterval);
    }, 30000);
  }
  
  function handleInputFocus() {
    console.log('Input focus - Keyboard va s\'ouvrir');
    
    setTimeout(() => {
      if (isIOS && !window.visualViewport) {
        // Force la détection sur les anciens iOS
        isKeyboardVisible = true;
        keyboardHeight = 300; // Estimation
        adjustChatForKeyboard();
      }
    }, isIOS ? 500 : 300);
  }
  
  function handleInputBlur() {
    console.log('Input blur - Keyboard va se fermer');
    
    setTimeout(() => {
      if (isIOS && !window.visualViewport) {
        // Force la détection sur les anciens iOS
        isKeyboardVisible = false;
        keyboardHeight = 0;
        adjustChatForKeyboard();
      }
    }, isIOS ? 500 : 300);
  }
  
  // S'assurer que l'input reste toujours visible
  function ensureInputVisibility() {
    const elements = getChatElements();
    
    if (elements.input && elements.container && elements.container.classList.contains('open')) {
      const computedStyle = getComputedStyle(elements.input);
      
      if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
        elements.input.style.cssText += `
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
        `;
        console.log('Input forcé visible');
      }
    }
  }
  
  // Empêcher l'input de disparaître quand on clique dans les messages
  function setupMessagesClickHandler() {
    const elements = getChatElements();
    
    if (elements.messages) {
      elements.messages.addEventListener('click', function(e) {
        // Ne pas interférer avec les clics sur les boutons/liens
        if (e.target.closest('button, a, .clickable')) {
          return;
        }
        
        setTimeout(() => {
          ensureInputVisibility();
        }, 100);
      });
    }
  }
  
  // Initialisation principale
  function initChatKeyboardFix() {
    console.log('Initialisation Chat Keyboard Fix');
    
    // Créer le bouton d'accès
    createInputAccessButton();
    
    // Configuration de la gestion du clavier
    if (isIOS) {
      setupIOSKeyboardHandling();
    } else {
      setupFallbackKeyboardHandling();
    }
    
    // Configuration des événements input
    setupInputEventHandlers();
    
    // Configuration des clics sur messages
    setupMessagesClickHandler();
    
    // Vérification périodique de la visibilité
    setInterval(ensureInputVisibility, 1000);
    
    // Ajustement initial
    setTimeout(() => {
      adjustChatForKeyboard();
    }, 1000);
    
    console.log('Chat Keyboard Fix initialisé avec succès');
  }
  
  // Démarrage
  initChatKeyboardFix();
  
  // Re-initialiser si les éléments ne sont pas encore prêts
  let retryCount = 0;
  const maxRetries = 10;
  
  const retryInit = setInterval(() => {
    const elements = getChatElements();
    
    if (elements.container || elements.input || retryCount >= maxRetries) {
      clearInterval(retryInit);
      if (retryCount < maxRetries) {
        console.log('Éléments chat trouvés, re-initialisation');
        initChatKeyboardFix();
      }
    }
    
    retryCount++;
  }, 1000);
});