// Script JavaScript pour corriger le panneau de paramètres

// Attendre que le document soit complètement chargé
document.addEventListener('DOMContentLoaded', function() {
    // Sélectionner tous les boutons de taille de texte qui pourraient être présents
    const fontSizeButtons = document.querySelectorAll('.font-size-tile, [data-font-size] button, .settings-content button, button[data-size]');
    
    // Créer un overlay pour bloquer les interactions avec l'arrière-plan
    const overlay = document.createElement('div');
    overlay.className = 'settings-overlay';
    document.body.appendChild(overlay);
    
    // Ajouter un gestionnaire d'événements pour chaque bouton
    fontSizeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Empêcher la propagation de l'événement pour éviter que le menu se ferme
            e.stopPropagation();
            
            // Forcer le menu à rester ouvert
            const settingsMenu = document.querySelector('.settings-menu');
            if (settingsMenu && settingsMenu.classList.contains('open')) {
                // Bloquer toute animation et transition
                settingsMenu.style.transition = 'none';
                settingsMenu.style.transform = 'none';
                settingsMenu.style.right = '0';
                
                // S'assurer que le menu reste ouvert
                setTimeout(() => {
                    settingsMenu.style.transition = 'right 0.3s ease';
                    settingsMenu.style.right = '0';
                }, 100);
            }
        });
    });
    
    // Observer les changements de classe pour réagir quand le menu s'ouvre
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.classList.contains('open')) {
                // Le menu est ouvert, assurer qu'il reste bien placé
                mutation.target.style.right = '0';
                mutation.target.style.transform = 'none';
            }
        });
    });
    
    // Trouver le menu des paramètres et observer les changements
    const settingsMenu = document.querySelector('.settings-menu');
    if (settingsMenu) {
        observer.observe(settingsMenu, { attributes: true, attributeFilter: ['class'] });
    }
});
