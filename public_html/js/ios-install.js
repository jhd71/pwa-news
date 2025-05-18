// Script optimisé pour l'installation sur iOS
function showIOSInstallPrompt() {
  // Détection améliorée pour iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isInStandaloneMode = window.navigator.standalone === true;
  
  console.log("Vérification iOS install:", { isIOS, isInStandaloneMode });
  
  // Vérifier si on a déjà montré récemment
  const lastPrompt = localStorage.getItem('iosPromptShown');
  const now = Date.now();
  const showAgain = !lastPrompt || (now - parseInt(lastPrompt)) > 7 * 24 * 60 * 60 * 1000; // 7 jours
  
  // Si déjà en mode standalone ou déjà montré récemment, ne pas afficher
  if (!isIOS || isInStandaloneMode || !showAgain) {
    console.log("Conditions non remplies pour afficher le prompt iOS");
    return;
  }
  
  console.log("Affichage du prompt iOS");
  
  // Supprimer tout prompt existant
  const existingPrompt = document.querySelector('.ios-prompt');
  if (existingPrompt) existingPrompt.remove();
  
  // Créer la bannière avec instructions adaptées à iOS
  const iosPrompt = document.createElement('div');
  iosPrompt.className = 'ios-prompt';
  iosPrompt.innerHTML = `
    <div class="ios-prompt-container">
      <div class="ios-prompt-message">
        <span class="ios-icon">📱</span>
        <p>Installez Actu&Média sur votre iPhone/iPad :</p>
        <ol style="margin-top: 5px; padding-left: 20px; text-align: left;">
          <li>Appuyez sur <strong>Partager</strong> <span style="font-size: 16px;">⬆️</span></li>
          <li>Faites défiler et appuyez sur <strong>Sur l'écran d'accueil</strong></li>
        </ol>
      </div>
      <button class="ios-prompt-close">Plus tard</button>
    </div>
  `;
  
  document.body.appendChild(iosPrompt);
  
  // Gestion de la fermeture
  iosPrompt.querySelector('.ios-prompt-close').addEventListener('click', () => {
    iosPrompt.style.opacity = '0';
    setTimeout(() => {
      iosPrompt.remove();
      localStorage.setItem('iosPromptShown', now.toString());
    }, 300);
  });
  
  // Animation de pulsation pour attirer l'attention
  setTimeout(() => {
    const message = iosPrompt.querySelector('.ios-prompt-message');
    if (message) message.style.animation = 'pulse 2s infinite';
  }, 2000);
  
  // Masquer après 15 secondes
  setTimeout(() => {
    if (document.body.contains(iosPrompt)) {
      iosPrompt.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(iosPrompt)) {
          iosPrompt.remove();
          localStorage.setItem('iosPromptShown', now.toString());
        }
      }, 500);
    }
  }, 15000);
}

// Style complet pour le prompt iOS
const style = document.createElement('style');
style.textContent = `
  .ios-prompt {
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    background: var(--primary-color, #4a148c);
    color: white;
    padding: 15px;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 9999;
    transition: opacity 0.5s ease;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    opacity: 1;
  }
  
  .ios-prompt-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }
  
  .ios-prompt-message {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex: 1;
    min-width: 200px;
  }
  
  .ios-icon {
    font-size: 24px;
    margin-bottom: 5px;
  }
  
  .ios-prompt-close {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 8px 15px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    margin-left: 10px;
  }
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.03); }
    100% { transform: scale(1); }
  }
  
  /* Ajustement pour les appareils avec safe areas (notch) */
  @supports (padding-bottom: env(safe-area-inset-bottom)) {
    .ios-prompt {
      bottom: calc(20px + env(safe-area-inset-bottom));
    }
  }
`;

// N'ajouter le style que sur iOS
if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
  document.head.appendChild(style);
}

// S'assurer que le DOM est chargé avant d'appeler la fonction
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    // Attendre que la page soit chargée et affichée
    setTimeout(showIOSInstallPrompt, 3000);
  });
} else {
  setTimeout(showIOSInstallPrompt, 3000);
}

// Pour pouvoir le montrer manuellement depuis le menu
window.showIOSInstallPrompt = showIOSInstallPrompt;