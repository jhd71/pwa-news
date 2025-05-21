// Solution corrigée pour ouvrir/fermer les commentaires
document.addEventListener('DOMContentLoaded', function() {
    // Fonction pour configurer le toggle des commentaires
    function setupCommentsToggle() {
        // Cibler la section des commentaires
        const photoComments = document.querySelector('.photo-comments');
        if (!photoComments) return;
        
        // Masquer les commentaires par défaut
        photoComments.style.display = 'none';
        
        // Vérifier si le bouton existe déjà
        let toggleBtn = document.getElementById('commentsToggleBtn');
        
        // Si le bouton existe déjà, le supprimer pour éviter les doublons
        if (toggleBtn) {
            toggleBtn.remove();
        }
        
        // Créer le bouton toggle pour les commentaires
        toggleBtn = document.createElement('button');
        toggleBtn.className = 'open-image-btn';
        toggleBtn.id = 'commentsToggleBtn';
        toggleBtn.innerHTML = '<i class="material-icons">chat</i> Voir les commentaires';
        toggleBtn.style.marginTop = '15px';
        
        // Insérer le bouton avant la section des commentaires
        photoComments.parentNode.insertBefore(toggleBtn, photoComments);
        
        // Ajouter l'événement de clic pour basculer l'affichage
        toggleBtn.addEventListener('click', function() {
            const isVisible = photoComments.style.display === 'block';
            
            if (isVisible) {
                // Masquer les commentaires
                photoComments.style.display = 'none';
                toggleBtn.innerHTML = '<i class="material-icons">chat</i> Voir les commentaires';
            } else {
                // Afficher les commentaires
                photoComments.style.display = 'block';
                toggleBtn.innerHTML = '<i class="material-icons">expand_less</i> Masquer les commentaires';
                
                // Défiler jusqu'aux commentaires
                setTimeout(function() {
                    photoComments.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        });
    }
    
    // Fonction pour nettoyer et réinitialiser lors de la fermeture de la modal
    function cleanupCommentsToggle() {
        const toggleBtn = document.getElementById('commentsToggleBtn');
        if (toggleBtn) {
            toggleBtn.remove();
        }
    }
    
    // Intercepter la fonction de fermeture de la modale
    const originalClosePhotoViewModal = window.closePhotoViewModal;
    if (originalClosePhotoViewModal) {
        window.closePhotoViewModal = function() {
            // Nettoyer avant de fermer
            cleanupCommentsToggle();
            
            // Appeler la fonction originale
            return originalClosePhotoViewModal();
        };
    }
    
    // Appliquer le toggle lors de l'ouverture d'une photo
    const originalOpenPhotoView = window.openPhotoView;
    if (originalOpenPhotoView) {
        window.openPhotoView = function(photoId) {
            // Appeler la fonction originale
            const result = originalOpenPhotoView(photoId);
            
            // Ajouter le bouton de toggle après un court délai
            setTimeout(function() {
                // Nettoyer d'abord pour éviter les doublons
                cleanupCommentsToggle();
                // Puis configurer à nouveau
                setupCommentsToggle();
            }, 300);
            
            return result;
        };
    }
    
    // Observer les changements dans la modale pour y appliquer le toggle
    const photoViewModal = document.querySelector('.photo-view-modal');
    if (photoViewModal) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'style') {
                    const isVisible = photoViewModal.style.display === 'block';
                    
                    if (isVisible) {
                        // Nettoyer d'abord pour éviter les doublons
                        cleanupCommentsToggle();
                        // Puis configurer à nouveau
                        setupCommentsToggle();
                    } else {
                        // Nettoyer lorsque la modale est fermée
                        cleanupCommentsToggle();
                    }
                }
            });
        });
        
        observer.observe(photoViewModal, { attributes: true });
    }
});