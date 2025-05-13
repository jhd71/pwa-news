// Essayez d'ajouter ce script dans un fichier séparé ou dans une balise script à la fin de votre fichier HTML

(function() {
    // Fonction qui sera appelée quand le DOM est chargé
    function fixSettingsMenu() {
        // Observer les changements sur le body pour détecter quand le menu des paramètres est ajouté
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes && mutation.addedNodes.length) {
                    for (let node of mutation.addedNodes) {
                        if (node.classList && node.classList.contains('settings-menu')) {
                            // Le menu des paramètres a été ajouté
                            setupSettingsMenuFix(node);
                        }
                    }
                }
            });
        });

        // Observer les modifications du body
        observer.observe(document.body, {
            childList: true,
            subtree: false
        });

        // Fonction pour intercepter et corriger le comportement du menu
        function setupSettingsMenuFix(menuElement) {
            console.log("Menu des paramètres détecté, application des correctifs...");

            // 1. Empêcher que le clic sur le changement de taille de texte ferme le menu
            const fontSizeTiles = menuElement.querySelectorAll('.font-size-tile');
            
            // Remplacer tous les gestionnaires d'événements par nos propres versions
            fontSizeTiles.forEach(tile => {
                // Supprimer les anciens gestionnaires (clone et remplace)
                const newTile = tile.cloneNode(true);
                tile.parentNode.replaceChild(newTile, tile);
                
                // Ajouter notre propre gestionnaire
                newTile.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Récupérer la taille
                    const size = newTile.getAttribute('data-font-size');
                    
                    // Marquer ce bouton comme actif
                    fontSizeTiles.forEach(t => {
                        const clonedT = t.cloneNode(false);
                        if (t.getAttribute('data-font-size') === size) {
                            clonedT.classList.add('active');
                        } else {
                            clonedT.classList.remove('active');
                        }
                        t.parentNode.replaceChild(clonedT, t);
                    });
                    
                    // Appliquer la taille de police manuellement
                    document.documentElement.setAttribute('data-font-size', size);
                    
                    // Sauvegarder la taille dans localStorage
                    localStorage.setItem('fontSize', size);
                    
                    // Afficher un toast personnalisé
                    showCustomToast(`Taille de texte : ${
                        size === 'small' ? 'petite' :
                        size === 'normal' ? 'normale' :
                        'grande'
                    }`);
                    
                    return false;
                }, true);
            });
            
            // 2. Empêcher que le menu se ferme au clic ailleurs
            const documentClickHandler = function(e) {
                // Ne faire que pour les clics directement sur document, pas sur les boutons
                if (e.target.closest('.font-size-tile') || e.target.closest('.settings-menu') || e.target.closest('#settingsButton')) {
                    e.stopPropagation();
                }
            };
            
            document.addEventListener('click', documentClickHandler, true);
            
            // Nettoyer lorsque le menu est fermé
            const closeBtn = menuElement.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    document.removeEventListener('click', documentClickHandler, true);
                });
            }
        }
        
        // Fonction pour afficher un toast personnalisé
        function showCustomToast(message) {
            // Vérifier si un toast existe déjà
            let toast = document.querySelector('.toast');
            if (toast) {
                toast.remove();
            }
            
            // Créer un nouveau toast
            toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = message;
            
            // Ajouter au document
            document.body.appendChild(toast);
            
            // Supprimer après 3 secondes
            setTimeout(() => {
                if (toast && toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 3000);
        }
    }
    
    // Attendre que le DOM soit chargé
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixSettingsMenu);
    } else {
        fixSettingsMenu();
    }
})();
