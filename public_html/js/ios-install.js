// À ajouter dans votre script
function showIOSInstallPrompt() {
  // Vérifier si c'est iOS mais pas en mode standalone
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  if (isIOS && !isStandalone && !localStorage.getItem('iosPromptShown')) {
    const iosPrompt = document.createElement('div');
    iosPrompt.className = 'ios-prompt';
    iosPrompt.innerHTML = `
      <div class="ios-prompt-container">
        <div class="ios-prompt-message">
          <span class="material-icons">add_to_home_screen</span>
          <p>Installez cette application sur votre écran d'accueil :<br>Appuyez sur <strong>Partager</strong> puis <strong>Sur l'écran d'accueil</strong></p>
        </div>
        <button class="ios-prompt-close">Fermer</button>
      </div>
    `;
    
    document.body.appendChild(iosPrompt);
    
    iosPrompt.querySelector('.ios-prompt-close').addEventListener('click', () => {
      iosPrompt.remove();
      localStorage.setItem('iosPromptShown', 'true');
    });
    
    // Masquer après 10 secondes
    setTimeout(() => {
      iosPrompt.remove();
    }, 10000);
  }
}

// Appeler cette fonction après un délai
setTimeout(showIOSInstallPrompt, 3000);