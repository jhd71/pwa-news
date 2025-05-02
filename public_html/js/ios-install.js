// Script optimisé pour l'installation sur iOS
function showIOSInstallPrompt() {
  // Détection améliorée pour iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isInStandaloneMode = window.navigator.standalone === true;
  
  // Vérifier si on a déjà montré récemment
  const lastPrompt = localStorage.getItem('iosPromptShown');
  const now = Date.now();
  const showAgain = !lastPrompt || (now - parseInt(lastPrompt)) > 7 * 24 * 60 * 60 * 1000; // 7 jours
  
  if (isIOS && !isInStandaloneMode && showAgain) {
    // Créer la bannière avec instructions adaptées à iOS
    const iosPrompt = document.createElement('div');
    iosPrompt.className = 'ios-prompt';
    iosPrompt.innerHTML = `
      <div class="ios-prompt-container">
        <div class="ios-prompt-message">
          <span class="material-icons">add_to_home_screen</span>
          <p>Installez Actu&Média sur votre iPhone/iPad :</p>
          <ol style="margin-top: 5px; padding-left: 20px; text-align: left;">
            <li>Appuyez sur <strong>Partager</strong> <span class="material-icons" style="font-size: 16px; vertical-align: middle;">ios_share</span></li>
            <li>Faites défiler et appuyez sur <strong>Sur l'écran d'accueil</strong></li>
          </ol>
        </div>
        <button class="ios-prompt-close">Plus tard</button>
      </div>
    `;
    
    document.body.appendChild(iosPrompt);
    
    // Gestion de la fermeture
    iosPrompt.querySelector('.ios-prompt-close').addEventListener('click', () => {
      iosPrompt.remove();
      localStorage.setItem('iosPromptShown', now.toString());
    });
    
    // Animation de pulsation pour attirer l'attention
    setTimeout(() => {
      const message = iosPrompt.querySelector('.ios-prompt-message');
      if (message) message.style.animation = 'pulse 2s infinite';
    }, 3000);
    
    // Masquer après 15 secondes
    setTimeout(() => {
      if (document.body.contains(iosPrompt)) {
        iosPrompt.style.opacity = '0';
        setTimeout(() => iosPrompt.remove(), 500);
      }
    }, 15000);
  }
}

// Style pour l'animation de pulsation
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.03); }
    100% { transform: scale(1); }
  }
  
  .ios-prompt {
    transition: opacity 0.5s ease;
  }
`;
document.head.appendChild(style);

// Appeler cette fonction après un délai
setTimeout(showIOSInstallPrompt, 2000);

// Exposer la fonction globalement pour pouvoir l'appeler à nouveau si nécessaire
window.showIOSInstallPrompt = showIOSInstallPrompt;