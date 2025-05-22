// gallery-manager.js - Version complète optimisée
// PARTIE 1/5 - DÉBUT ET FONCTIONS DE BASE

// ===============================
// DÉFINITION DES FONCTIONS PRINCIPALES
// ===============================

// Fonction pour ouvrir la modale d'upload
function openUploadModal() {
    const uploadModal = document.getElementById('uploadModal');
    if (uploadModal) {
        uploadModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    } else {
        console.error("Modal d'upload non trouvée");
    }
}

// Fonction pour fermer la modale d'upload
function closeUploadModal() {
    const uploadModal = document.getElementById('uploadModal');
    if (uploadModal) {
        uploadModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    // Réinitialiser le formulaire
    const photoUploadForm = document.getElementById('photoUploadForm');
    if (photoUploadForm) {
        photoUploadForm.reset();
    }
    
    // Vider la prévisualisation
    const photoPreview = document.getElementById('photoPreview');
    if (photoPreview) {
        photoPreview.innerHTML = '';
    }
    
    // Masquer la barre de progression
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBarFill = document.querySelector('.progress-bar-fill');
    if (uploadProgress) {
        uploadProgress.style.display = 'none';
        if (progressBarFill) {
            progressBarFill.style.width = '0%';
        }
    }
}

// VERSION AMÉLIORÉE - Fermer la vue détaillée
function closePhotoViewModal() {
    // NETTOYER TOUS LES BOUTONS CRÉÉS DYNAMIQUEMENT
    const scrollBtn = document.getElementById('scrollToCommentsBtn');
    const toggleBtn = document.getElementById('commentsToggleBtn');
    if (scrollBtn) scrollBtn.remove();
    if (toggleBtn) toggleBtn.remove();
    
    const photoViewModal = document.getElementById('photoViewModal');
    if (photoViewModal) {
        photoViewModal.style.display = 'none';
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
    }
    window.currentPhotoId = null;
    
    // Nettoyer les champs du formulaire sur mobile
    if (window.innerWidth <= 768) {
        const commentText = document.getElementById('commentText');
        if (commentText) {
            commentText.blur(); // Fermer le clavier
        }
    }
    
    // Fermer le clavier sur mobile
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        activeElement.blur();
    }
    
    // Réinitialiser le scroll
    window.scrollTo(0, 0);
    
    console.log('Modal fermée proprement');
}

// Charger plus de photos
function loadMorePhotos() {
    if (window.hasMorePhotos && !window.isLoadingPhotos) {
        loadPhotos(true);
    }
}

// Fonction de compatibilité - remplace l'ancienne fonction previewPhoto
function previewPhoto(event) {
    console.log("previewPhoto appelée");
    
    const file = event && event.target && event.target.files ? event.target.files[0] : null;
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        alert('Veuillez sélectionner une image');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const photoPreview = document.getElementById('photoPreview');
        if (photoPreview) {
            photoPreview.innerHTML = '';
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = "Prévisualisation";
            photoPreview.appendChild(img);
        }
    };
    reader.readAsDataURL(file);
}

// PARTIE 2/5 - CAPTURE PHOTO ET UPLOAD

// Fonction pour initialiser les inputs de capture photo séparés
function initCameraCapture() {
    console.log("Initialisation de la capture avec méthode directe");
    
    const captureBtn = document.getElementById('captureBtn');
    const galleryBtn = document.getElementById('galleryBtn');
    const photoPreview = document.getElementById('photoPreview');

    if (!captureBtn || !galleryBtn || !photoPreview) {
        console.log("Éléments de capture non disponibles (modal fermée)");
        return;
    }
    
    // Fonction pour créer un input file temporaire
    function createTemporaryInput(useCamera) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        if (useCamera) {
            input.setAttribute('capture', 'environment');
        }
        
        input.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            if (!file.type.match('image.*')) {
                alert('Veuillez sélectionner une image');
                input.remove();
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const mainPhotoInput = document.getElementById('photoInput');
                if (mainPhotoInput) {
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    mainPhotoInput.files = dataTransfer.files;
                }
                
                photoPreview.innerHTML = '';
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = "Prévisualisation";
                photoPreview.appendChild(img);
                
                const sourceIndicator = document.createElement('div');
                sourceIndicator.style.cssText = 'position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px;';
                sourceIndicator.innerText = useCamera ? '📷 Appareil photo' : '🖼️ Galerie';
                photoPreview.appendChild(sourceIndicator);
                
                input.remove();
            };
            reader.readAsDataURL(file);
        });
        
        return input;
    }
    
    captureBtn.addEventListener('click', function() {
        console.log("Clic sur le bouton appareil photo");
        const input = createTemporaryInput(true);
        document.body.appendChild(input);
        input.click();
    });
    
    galleryBtn.addEventListener('click', function() {
        console.log("Clic sur le bouton galerie");
        const input = createTemporaryInput(false);
        document.body.appendChild(input);
        input.click();
    });
}

// Version modifiée de la fonction uploadPhoto
async function uploadPhoto(event) {
    event.preventDefault();
    console.log("Début de la fonction uploadPhoto");
    
    const photoInput = document.getElementById('photoInput');
    const progressBarFill = document.querySelector('.progress-bar-fill');
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadModal = document.getElementById('uploadModal');
    const photoUploadForm = document.getElementById('photoUploadForm');
    const photoPreview = document.getElementById('photoPreview');
    
    if (!photoInput || !progressBarFill || !uploadProgress) {
        console.error("Éléments DOM manquants pour uploadPhoto");
        alert('Erreur: éléments DOM manquants. Veuillez rafraîchir la page.');
        return;
    }
    
    const file = photoInput.files[0];
    if (!file) {
        alert('Veuillez sélectionner une image');
        return;
    }
    
    console.log("Fichier sélectionné:", file.name, file.type, file.size);
    
    const title = document.getElementById('photoTitle').value || 'Sans titre';
    const description = document.getElementById('photoDescription').value || '';
    const location = document.getElementById('photoLocation').value || '';
    const authorName = document.getElementById('photographerName').value || 'Anonyme';
    
    uploadProgress.style.display = 'block';
    
    try {
        localStorage.setItem('photographerName', authorName);
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `photos/${fileName}`;
        
        if (!window.supabase || !window.supabase.storage) {
            throw new Error("Supabase n'est pas initialisé");
        }
        
        const { data: fileData, error: fileError } = await window.supabase.storage
            .from('gallery')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
                onUploadProgress: (progress) => {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    if (progressBarFill) {
                        progressBarFill.style.width = `${percent}%`;
                    }
                }
            });
            
        if (fileError) {
            throw fileError;
        }
        
        const { data: urlData } = window.supabase.storage.from('gallery').getPublicUrl(filePath);
        const imageUrl = urlData.publicUrl;
        
        const { data, error } = await window.supabase
            .from('photos')
            .insert([
                { 
                    title, 
                    description, 
                    location, 
                    author_name: authorName,
                    image_url: imageUrl,
                    file_path: filePath
                }
            ]);
        
        if (error) {
            throw error;
        }
        
        alert('Photo ajoutée avec succès!');
        closeUploadModal();
        
        const photoGrid = document.getElementById('photoGrid');
        if (photoGrid) {
            photoGrid.innerHTML = '';
        }
        
        window.currentPage = 0;
        loadPhotos();
        
    } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
        alert(`Une erreur est survenue: ${error.message || 'Erreur inconnue'}. Veuillez réessayer.`);
        
        if (uploadProgress) {
            uploadProgress.style.display = 'none';
        }
    }
}

// PARTIE 3/5 - COMMENTAIRES ET VUE DÉTAILLÉE

// VERSION AMÉLIORÉE - Fonction pour soumettre un commentaire
async function submitComment(event) {
    event.preventDefault();
    console.log("Tentative d'envoi de commentaire");
    
    if (!window.currentPhotoId) {
        console.error("ID de photo non défini");
        alert("Erreur: photo non sélectionnée");
        return;
    }
    
    const authorInput = document.getElementById('commentAuthor');
    const textInput = document.getElementById('commentText');
    
    if (!authorInput || !textInput) {
        console.error("Champs de commentaire non trouvés");
        alert("Erreur: formulaire non disponible");
        return;
    }
    
    const author = authorInput.value.trim();
    const text = textInput.value.trim();
    
    if (!author || !text) {
        alert('Veuillez remplir tous les champs du commentaire');
        if (!author) {
            authorInput.focus();
        } else if (!text) {
            textInput.focus();
        }
        return;
    }
    
    const submitBtn = document.querySelector('#commentForm button');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours...';
    
    // Fermer le clavier sur mobile
    if (window.innerWidth <= 768) {
        authorInput.blur();
        textInput.blur();
    }
    
    try {
        localStorage.setItem('commenterName', author);
        
        const commentData = {
            photo_id: window.currentPhotoId,
            author_name: author,
            comment_text: text
        };
        
        const { data, error } = await window.supabase
            .from('photo_comments')
            .insert([commentData]);
        
        if (error) {
            throw error;
        }
        
        // Message de succès
        const successMsg = document.createElement('div');
        successMsg.style.cssText = 'background: #28a745; color: white; padding: 10px; border-radius: 8px; text-align: center; margin: 10px 0; font-weight: bold;';
        successMsg.textContent = '✓ Commentaire ajouté avec succès!';
        
        const commentForm = document.getElementById('commentForm');
        commentForm.insertBefore(successMsg, commentForm.firstChild);
        
        textInput.value = '';
        
        setTimeout(() => {
            successMsg.style.opacity = '0';
            successMsg.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                if (successMsg.parentNode) {
                    successMsg.remove();
                }
            }, 500);
        }, 3000);
        
        setTimeout(() => {
            loadPhotoComments(window.currentPhotoId);
        }, 500);
        
    } catch (error) {
        console.error('Erreur lors de l\'envoi du commentaire:', error);
        
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'background: #dc3545; color: white; padding: 10px; border-radius: 8px; text-align: center; margin: 10px 0; font-weight: bold;';
        errorMsg.textContent = '✗ Impossible d\'envoyer votre commentaire: ' + (error.message || 'Erreur inconnue');
        
        const commentForm = document.getElementById('commentForm');
        commentForm.insertBefore(errorMsg, commentForm.firstChild);
        
        setTimeout(() => {
            errorMsg.style.opacity = '0';
            errorMsg.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                if (errorMsg.parentNode) {
                    errorMsg.remove();
                }
            }, 500);
        }, 5000);
        
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// VERSION AMÉLIORÉE - Ouvrir la vue détaillée d'une photo
// VERSION COMPLÈTE DE openPhotoView avec toutes les corrections

async function openPhotoView(photoId) {
    console.log("Ouverture de la vue photo:", photoId);
    
    if (!document.getElementById('photoViewModal')) {
        console.error("Modal de vue photo non trouvée!");
        alert("Erreur: Impossible d'afficher la photo en détail");
        return;
    }
    
    const modal = document.getElementById('photoViewModal');
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    window.currentPhotoId = photoId;
    
    // Forcer le scroll en haut sur mobile
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            modal.scrollTop = 0;
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.scrollTop = 0;
            }
        }, 100);
    }
    
    try {
        const { data: photo, error: photoError } = await window.supabase
            .from('photos')
            .select('*')
            .eq('id', photoId)
            .single();
        
        if (photoError) {
            throw photoError;
        }
        
        console.log("Données de la photo récupérées:", photo);
        
        // Mettre à jour l'image
        const modalImg = document.getElementById('modalPhotoImg');
        if (modalImg) {
            modalImg.onerror = function() {
                this.src = 'images/Actu&Media.png';
            };
            modalImg.src = photo.image_url || '';
            modalImg.alt = photo.title || 'Photo';
        }
        
        // Mettre à jour les autres éléments
        const modalPhotoTitle = document.getElementById('modalPhotoTitle');
        if (modalPhotoTitle) {
            modalPhotoTitle.textContent = photo.title || 'Sans titre';
        }
        
        const modalPhotoDescription = document.getElementById('modalPhotoDescription');
        if (modalPhotoDescription) {
            modalPhotoDescription.textContent = photo.description || 'Aucune description';
        }
        
        if (document.getElementById('modalPhotoLocation')) {
            document.getElementById('modalPhotoLocation').textContent = photo.location ? `📍 ${photo.location}` : '';
        }
        
        if (document.getElementById('modalPhotoDate')) {
            const date = new Date(photo.created_at);
            document.getElementById('modalPhotoDate').textContent = `📅 ${date.toLocaleDateString('fr-FR')}`;
        }
        
        if (document.getElementById('modalPhotoAuthor')) {
            document.getElementById('modalPhotoAuthor').textContent = `👤 ${photo.author_name || 'Anonyme'}`;
        }
        
        // Charger les commentaires
        loadPhotoComments(photoId);
        
        // === CORRECTIONS MOBILE COMPLÈTES ===
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                // Nettoyer TOUS les anciens boutons
                const oldScrollBtn = document.getElementById('scrollToCommentsBtn');
                const oldToggleBtn = document.getElementById('commentsToggleBtn');
                if (oldScrollBtn) oldScrollBtn.remove();
                if (oldToggleBtn) oldToggleBtn.remove();
                
                // S'assurer que le formulaire est visible
                const commentForm = document.getElementById('commentForm');
                if (commentForm) {
                    commentForm.style.display = 'block';
                    commentForm.style.visibility = 'visible';
                    commentForm.style.opacity = '1';
                    
                    const commentAuthor = document.getElementById('commentAuthor');
                    if (commentAuthor && localStorage.getItem('commenterName')) {
                        commentAuthor.value = localStorage.getItem('commenterName');
                    }
                }
                
                // 1. CORRIGER LA CROIX DE FERMETURE
                const closeBtn = document.getElementById('closePhotoView');
                if (closeBtn) {
                    closeBtn.onclick = null;
                    closeBtn.removeEventListener('click', closePhotoViewModal);
                    
                    closeBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Clic croix fermeture (mobile)');
                        closePhotoViewModal();
                    }, { passive: false });
                    
                    closeBtn.addEventListener('touchend', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Touch croix fermeture (mobile)');
                        closePhotoViewModal();
                    }, { passive: false });
                    
                    console.log('Croix de fermeture corrigée');
                }
                
                // 2. CORRIGER LE BOUTON "OUVRIR L'IMAGE"
                const openInNewTabBtn = document.getElementById('openInNewTab');
                if (openInNewTabBtn) {
                    openInNewTabBtn.onclick = null;
                    
                    openInNewTabBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Clic ouvrir image (mobile)');
                        
                        if (photo && photo.image_url) {
                            window.open(photo.image_url, '_blank');
                            console.log('Image ouverte:', photo.image_url);
                        } else {
                            console.error('URL image non disponible');
                            alert('Impossible d\'ouvrir l\'image');
                        }
                    }, { passive: false });
                    
                    openInNewTabBtn.addEventListener('touchend', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (photo && photo.image_url) {
                            window.open(photo.image_url, '_blank');
                        }
                    }, { passive: false });
                    
                    console.log('Bouton "Ouvrir image" corrigé');
                }
                
                // 3. CRÉER LE BOUTON "VOIR LES COMMENTAIRES" - VERSION CORRIGÉE
const buttonContainer = document.querySelector('.button-container');
if (buttonContainer && !document.getElementById('scrollToCommentsBtn')) {
    const scrollBtn = document.createElement('button');
    scrollBtn.id = 'scrollToCommentsBtn';
    scrollBtn.className = 'scroll-to-comments-btn';
    scrollBtn.innerHTML = '<i class="material-icons">expand_more</i> Voir les commentaires';
    
    scrollBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Tentative de scroll vers commentaires');
        
        // NOUVELLE APPROCHE - Scroll directement vers la section
        const commentsSection = document.querySelector('.photo-comments');
        
        if (commentsSection) {
            console.log('Section commentaires trouvée, scroll en cours...');
            
            // Scroll vers la section commentaires
            commentsSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            });
            
            // Feedback visuel
            scrollBtn.innerHTML = '<i class="material-icons">check</i> Commentaires visibles !';
            scrollBtn.style.background = '#28a745';
            
            setTimeout(() => {
                scrollBtn.innerHTML = '<i class="material-icons">expand_more</i> Voir les commentaires';
                scrollBtn.style.background = '#FF6B35';
            }, 2000);
            
            console.log('Scroll vers commentaires exécuté');
        } else {
            console.error('Section .photo-comments non trouvée');
            
            // Alternative - essayer de trouver le titre "Commentaires"
            const commentsTitle = document.querySelector('.photo-comments h3');
            if (commentsTitle) {
                console.log('Titre commentaires trouvé, scroll alternatif...');
                commentsTitle.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            } else {
                alert('Section commentaires non trouvée. Scrollez manuellement vers le bas.');
            }
        }
    }, { passive: false });
    
    // Ajouter aussi l'événement touch pour mobile
    scrollBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Touch sur bouton commentaires');
        // Déclencher le même comportement que le clic
        setTimeout(() => {
            scrollBtn.click();
        }, 50);
    }, { passive: false });
    
    buttonContainer.appendChild(scrollBtn);
    console.log('Bouton "Voir commentaires" créé avec scroll corrigé');
}
            }, 500);
        }
        
    } catch (error) {
        console.error('Erreur chargement détails:', error);
        alert('Impossible de charger les détails de la photo');
    }
}

// PARTIE 4/5 - CHARGEMENT PHOTOS ET OPTIMISATIONS MOBILE

// VERSION AMÉLIORÉE - Charger les commentaires d'une photo
async function loadPhotoComments(photoId) {
    console.log("Chargement des commentaires pour la photo ID:", photoId);
    
    const commentsContainer = document.getElementById('commentsContainer');
    if (!commentsContainer) {
        console.error("Conteneur de commentaires non trouvé");
        return;
    }
    
    commentsContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;"><i class="material-icons" style="font-size: 24px; margin-bottom: 10px;">hourglass_empty</i><br>Chargement des commentaires...</div>';
    
    try {
        const idToUse = typeof photoId === 'string' ? parseInt(photoId, 10) : photoId;
        
        const { data: comments, error } = await window.supabase
            .from('photo_comments')
            .select('*')
            .eq('photo_id', idToUse)
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        if (!comments || comments.length === 0) {
            commentsContainer.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #6c757d; background: #f8f9fa; border-radius: 8px;">
                    <i class="material-icons" style="font-size: 36px; display: block; margin-bottom: 10px; color: #dee2e6;">chat_bubble_outline</i>
                    <p style="margin: 0; font-size: 14px;">Aucun commentaire pour le moment.<br>Soyez le premier à commenter!</p>
                </div>
            `;
            return;
        }
        
        commentsContainer.innerHTML = '';
        
        comments.forEach((comment, index) => {
            const date = new Date(comment.created_at);
            const formattedDate = date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.dataset.id = comment.id;
            commentElement.style.opacity = '0';
            commentElement.style.transform = 'translateY(20px)';
            commentElement.style.transition = 'all 0.3s ease';
            
            commentElement.innerHTML = `
                <div class="comment-header">
                    <span class="comment-author">${comment.author_name || 'Anonyme'}</span>
                    <span class="comment-date">${formattedDate}</span>
                </div>
                <div class="comment-text">${comment.comment_text || ''}</div>
            `;
            
            commentsContainer.appendChild(commentElement);
            
            setTimeout(() => {
                commentElement.style.opacity = '1';
                commentElement.style.transform = 'translateY(0)';
            }, 100 * index);
        });
        
    } catch (error) {
        console.error('Erreur lors du chargement des commentaires:', error);
        commentsContainer.innerHTML = `
            <div style="color: #dc3545; text-align: center; padding: 20px; background: #f8d7da; border-radius: 8px; border: 1px solid #f5c6cb;">
                <i class="material-icons" style="font-size: 24px; margin-bottom: 10px;">error</i>
                <p style="margin: 0; font-weight: bold;">Impossible de charger les commentaires</p>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Erreur: ${error.message || 'Erreur inconnue'}</p>
                <button onclick="loadPhotoComments(${photoId})" style="margin-top: 10px; padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Réessayer
                </button>
            </div>
        `;
    }
}

// Afficher les photos dans la grille
function renderPhotos(photos) {
    const photoGrid = document.getElementById('photoGrid');
    const noPhotosMessage = document.getElementById('noPhotosMessage');
    
    if (!photos || photos.length === 0) {
        if (noPhotosMessage) {
            noPhotosMessage.style.display = 'block';
        }
        return;
    }
    
    if (noPhotosMessage) {
        noPhotosMessage.style.display = 'none';
    }
    
    photos.forEach(photo => {
        try {
            if (!photo || !photo.id) {
                return;
            }
            
            const photoCard = document.createElement('div');
            photoCard.className = 'photo-card';
            photoCard.dataset.id = photo.id;
            photoCard.style.position = 'relative';
            
            let formattedDate = 'Date inconnue';
            if (photo.created_at) {
                try {
                    const date = new Date(photo.created_at);
                    formattedDate = date.toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                } catch (e) {
                    console.error("Erreur de formatage de date:", e);
                }
            }
            
            photoCard.innerHTML = `
                <div class="photo-img-container">
                    <img class="photo-img" src="${photo.image_url || ''}" alt="${photo.title || 'Photo sans titre'}" 
                         onerror="this.src='images/Actu&Media.png';">
                </div>
                <div class="photo-info">
                    <h3 class="photo-title">${photo.title || 'Sans titre'}</h3>
                    <div class="photo-meta">
                        <span>${photo.location || 'Lieu non précisé'}</span>
                        <span>Par ${photo.author_name || 'Anonyme'}</span>
                        <span>${formattedDate}</span>
                    </div>
                </div>
            `;
            
            photoCard.addEventListener('click', (e) => {
                if (e.target.closest('.delete-photo-btn')) {
                    return;
                }
                openPhotoView(photo.id);
            });
            
            photoGrid.appendChild(photoCard);
            
        } catch (error) {
            console.error("Erreur lors du rendu de la photo:", error, photo);
        }
    });
}

// Charger les photos
async function loadPhotos(isLoadMore = false) {
    const photoGrid = document.getElementById('photoGrid');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noPhotosMessage = document.getElementById('noPhotosMessage');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    if (window.isLoadingPhotos) {
        return;
    }
    
    if (!photoGrid || !loadingIndicator) {
        console.error("Éléments DOM essentiels non trouvés");
        return;
    }
    
    if (!window.supabase) {
        console.error('Erreur: Supabase n\'est pas initialisé');
        loadingIndicator.style.display = 'none';
        const errorMessage = document.createElement('div');
        errorMessage.innerHTML = `
            <div style="color: #d32f2f; text-align: center; padding: 20px;">
                <p><strong>Erreur de connexion à la base de données</strong></p>
                <p>Impossible de charger les photos. Veuillez rafraîchir la page.</p>
                <button onclick="location.reload()" style="padding: 8px 16px; background: #d32f2f; color: white; border: none; border-radius: 4px; margin-top: 10px;">Rafraîchir</button>
            </div>
        `;
        photoGrid.appendChild(errorMessage);
        return;
    }

    window.isLoadingPhotos = true;

    if (!isLoadMore) {
        loadingIndicator.style.display = 'flex';
        photoGrid.innerHTML = '';
        window.currentPage = 0;
    }
    
    try {
        const from = window.currentPage * window.pageSize;
        const to = from + window.pageSize - 1;
        
        let { data: photos, error } = await window.supabase
            .from('photos')
            .select('*')
            .order('created_at', { ascending: false })
            .range(from, to);
        
        if (error) {
            throw error;
        }
        
        if (!photos || photos.length === 0) {
            if (noPhotosMessage) {
                noPhotosMessage.style.display = 'block';
            }
            window.hasMorePhotos = false;
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }
        } else {
            if (noPhotosMessage) {
                noPhotosMessage.style.display = 'none';
            }
            
            renderPhotos(photos);
            
            if (photos.length < window.pageSize) {
                window.hasMorePhotos = false;
                if (loadMoreBtn) {
                    loadMoreBtn.style.display = 'none';
                }
            } else {
                window.hasMorePhotos = true;
                if (loadMoreBtn) {
                    loadMoreBtn.style.display = 'block';
                }
            }
            
            window.currentPage++;
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement des photos:', error);
        photoGrid.innerHTML = `
            <div style="color: #d32f2f; text-align: center; padding: 20px; margin: 20px; border-radius: 8px; background-color: rgba(211, 47, 47, 0.1);">
                <p><strong>Erreur lors du chargement des photos</strong></p>
                <p>Détails: ${error.message || 'Erreur inconnue'}</p>
                <button onclick="location.reload()" style="padding: 8px 16px; background: #d32f2f; color: white; border: none; border-radius: 4px; margin-top: 10px;">Réessayer</button>
            </div>
        `;
    } finally {
        loadingIndicator.style.display = 'none';
        window.isLoadingPhotos = false;
    }
}

// ===============================
// OPTIMISATIONS MOBILE
// ===============================

// Gestion du clavier mobile
function initMobileKeyboardHandling() {
    if (window.innerWidth <= 768) {
        const commentAuthor = document.getElementById('commentAuthor');
        const commentText = document.getElementById('commentText');
        
        if (commentAuthor) {
            commentAuthor.addEventListener('focus', function() {
                console.log('Focus sur champ auteur');
                setTimeout(() => {
                    const commentForm = document.getElementById('commentForm');
                    if (commentForm) {
                        commentForm.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'end' 
                        });
                    }
                }, 300);
            });
            
            commentAuthor.addEventListener('blur', function() {
                if (this.value.trim()) {
                    localStorage.setItem('commenterName', this.value.trim());
                }
            });
        }
        
        if (commentText) {
            commentText.addEventListener('focus', function() {
                console.log('Focus sur champ commentaire');
                setTimeout(() => {
                    const commentForm = document.getElementById('commentForm');
                    if (commentForm) {
                        commentForm.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'end' 
                        });
                    }
                }, 300);
            });
        }
    }
}

// Optimisations mobile complètes
function initMobileOptimizations() {
    console.log('Initialisation des optimisations mobile');
    
    const isMobile = window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        console.log('Mode mobile détecté - Application des optimisations');
        
        setTimeout(initMobileKeyboardHandling, 1000);
        
        // Améliorer la gestion des clics
        document.addEventListener('click', function(e) {
            if (e.target.closest('.photo-view-modal')) {
                e.stopPropagation();
            }
        }, true);
        
        // Gestion du redimensionnement
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                const modal = document.getElementById('photoViewModal');
                if (modal && modal.style.display === 'block') {
                    const commentForm = document.getElementById('commentForm');
                    if (commentForm) {
                        commentForm.style.display = 'block';
                        commentForm.style.visibility = 'visible';
                        commentForm.style.opacity = '1';
                    }
                }
            }, 250);
        });
        
        // Optimisations iOS Safari
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            console.log('iOS détecté - Optimisations Safari appliquées');
            
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
            }
            
            document.addEventListener('touchmove', function(e) {
                if (document.body.classList.contains('modal-open')) {
                    const target = e.target.closest('.photo-view-modal .modal-content, #commentsContainer');
                    if (!target) {
                        e.preventDefault();
                    }
                }
            }, { passive: false });
        }
    }
    
    // Observer pour les changements de modal
    const photoViewModal = document.getElementById('photoViewModal');
    if (photoViewModal) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (photoViewModal.style.display === 'block' && isMobile) {
                        setTimeout(() => {
                            initMobileKeyboardHandling();
                            const commentForm = document.getElementById('commentForm');
                            if (commentForm) {
                                commentForm.style.display = 'block';
                                commentForm.style.visibility = 'visible';
                                commentForm.style.opacity = '1';
                            }
                        }, 500);
                    }
                }
            });
        });
        
        observer.observe(photoViewModal, {
            attributes: true,
            attributeFilter: ['style']
        });
    }
}

// PARTIE 5/5 - INITIALISATION ET FIN

// ===============================
// INITIALISATION
// ===============================

// Initialisation principale
function initializeGallery() {
    console.log("Début de initializeGallery");
    
    // Variables globales
    window.currentPhotoId = null;
    window.currentPage = 0;
    window.pageSize = 12;
    window.hasMorePhotos = true;
    window.isLoadingPhotos = false;
    
    // Éléments DOM
    const photoGrid = document.getElementById('photoGrid');
    const uploadModal = document.getElementById('uploadModal');
    const photoViewModal = document.getElementById('photoViewModal');
    const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
    const closeUploadModalBtn = document.getElementById('closeUploadModal');
    const closePhotoViewBtn = document.getElementById('closePhotoView');
    const photoUploadForm = document.getElementById('photoUploadForm');
    const photoInput = document.getElementById('photoInput');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const commentForm = document.getElementById('commentForm');
    
    if (!photoGrid || !loadingIndicator) {
        console.error('Éléments DOM essentiels non trouvés');
        return;
    }
    
    // Charger les photos initiales
    loadPhotos();
    
    // Configurer les événements
    if (uploadPhotoBtn) uploadPhotoBtn.addEventListener('click', openUploadModal);
    if (closeUploadModalBtn) closeUploadModalBtn.addEventListener('click', closeUploadModal);
    if (closePhotoViewBtn) closePhotoViewBtn.addEventListener('click', closePhotoViewModal);
    if (loadMoreBtn) loadMoreBtn.addEventListener('click', loadMorePhotos);
    if (photoInput) photoInput.addEventListener('change', previewPhoto);
    if (photoUploadForm) photoUploadForm.addEventListener('submit', uploadPhoto);
    if (commentForm) commentForm.addEventListener('submit', submitComment);
    
    // Fermer les modales en cliquant à l'extérieur
    window.addEventListener('click', function(event) {
        if (event.target === uploadModal) {
            closeUploadModal();
        }
        if (event.target === photoViewModal) {
            closePhotoViewModal();
        }
    });
    
    // Charger les noms utilisateur depuis localStorage
    const photographerNameInput = document.getElementById('photographerName');
    if (photographerNameInput && localStorage.getItem('photographerName')) {
        photographerNameInput.value = localStorage.getItem('photographerName');
    }
    
    const commentAuthorInput = document.getElementById('commentAuthor');
    if (commentAuthorInput && localStorage.getItem('commenterName')) {
        commentAuthorInput.value = localStorage.getItem('commenterName');
    }
    
    initCameraCapture();
}

// Initialiser Supabase
function initializeSupabase() {
    console.log("Initialisation de Supabase");
    
    if (window.supabaseInstance) {
        window.supabase = window.supabaseInstance;
        console.log("Utilisation de l'instance Supabase globale");
        return true;
    } else if (typeof window.getSupabaseClient === 'function') {
        window.supabase = window.getSupabaseClient();
        if (!window.supabase) {
            console.error("getSupabaseClient a retourné null ou undefined");
            return false;
        } else {
            console.log("Instance Supabase récupérée via getSupabaseClient");
            return true;
        }
    } else {
        console.error("Aucune méthode disponible pour obtenir l'instance Supabase");
        
        // Créer un objet factice pour éviter les erreurs
        window.supabase = {
            from: () => ({
                select: () => ({
                    order: () => ({
                        range: () => Promise.resolve({ data: [], error: null })
                    })
                }),
                insert: () => Promise.resolve({ data: null, error: new Error('Base de données non disponible') })
            }),
            storage: {
                from: () => ({
                    upload: () => Promise.resolve({ data: null, error: new Error('Base de données non disponible') }),
                    getPublicUrl: () => ({ data: { publicUrl: '' } })
                })
            }
        };
        
        const errorMessageElement = document.createElement('div');
        errorMessageElement.style.cssText = 'background-color: #d32f2f; color: white; padding: 20px; margin: 20px; border-radius: 8px; text-align: center;';
        errorMessageElement.innerHTML = `
            <h3>Erreur de connexion à la base de données</h3>
            <p>Impossible de se connecter au service de galerie photos.</p>
            <button onclick="location.reload()" style="background: white; color: #d32f2f; border: none; padding: 8px 16px; margin-top: 10px; border-radius: 4px; cursor: pointer;">Rafraîchir la page</button>
        `;
        
        document.addEventListener('DOMContentLoaded', function() {
            const container = document.querySelector('.gallery-main') || document.body;
            container.prepend(errorMessageElement);
        });
        
        return false;
    }
}

// ===============================
// LANCEMENT DE L'APPLICATION
// ===============================

console.log("Script gallery-manager.js chargé");

// Variable globale pour éviter les redéclarations
if (typeof window.galleryInitialized === 'undefined') {
    window.galleryInitialized = false;
}

// Initialisation unique et complète au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOMContentLoaded déclenché - Initialisation complète");
    
    if (!window.galleryInitialized) {
        // 1. Initialiser Supabase et la galerie
        const supabaseInitialized = initializeSupabase();
        if (supabaseInitialized) {
            initializeGallery();
        } else {
            console.error("Impossible d'initialiser Supabase, galerie non initialisée");
        }
        
        // 2. Détecter si c'est un appareil mobile
        const isMobile = window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile) {
            console.log('Mode mobile détecté - Application de toutes les optimisations');
            
            // Appliquer les corrections clavier après un délai
            setTimeout(initMobileKeyboardHandling, 1000);
            
            // Améliorer la gestion des clics pour éviter les clics qui "passent à travers"
            document.addEventListener('click', function(e) {
                if (e.target.closest('.photo-view-modal')) {
                    e.stopPropagation();
                }
            }, true);
            
            // Gestion du redimensionnement de fenêtre (rotation, clavier)
            let resizeTimer;
            window.addEventListener('resize', function() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function() {
                    const modal = document.getElementById('photoViewModal');
                    if (modal && modal.style.display === 'block') {
                        const commentForm = document.getElementById('commentForm');
                        if (commentForm) {
                            commentForm.style.display = 'block';
                            commentForm.style.visibility = 'visible';
                            commentForm.style.opacity = '1';
                        }
                    }
                }, 250);
            });
            
            // Observer pour les changements de modal
            const photoViewModal = document.getElementById('photoViewModal');
            if (photoViewModal) {
                const observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                            if (photoViewModal.style.display === 'block') {
                                setTimeout(() => {
                                    initMobileKeyboardHandling();
                                    const commentForm = document.getElementById('commentForm');
                                    if (commentForm) {
                                        commentForm.style.display = 'block';
                                        commentForm.style.visibility = 'visible';
                                        commentForm.style.opacity = '1';
                                    }
                                }, 500);
                            }
                        }
                    });
                });
                
                observer.observe(photoViewModal, {
                    attributes: true,
                    attributeFilter: ['style']
                });
            }
        }
        
        // 3. Initialiser les optimisations mobile complètes
        setTimeout(() => {
            initMobileOptimizations();
            console.log('Optimisations mobile initialisées avec succès');
        }, 1200);
        
        window.galleryInitialized = true;
    }
});

// Vérification supplémentaire si le DOM est déjà chargé
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log("Document déjà chargé, tentative d'initialisation immédiate");
    if (!window.galleryInitialized) {
        const supabaseInitialized = initializeSupabase();
        if (supabaseInitialized) {
            setTimeout(initializeGallery, 0);
        } else {
            console.error("Impossible d'initialiser Supabase, galerie non initialisée");
        }
        
        setTimeout(() => {
            initMobileOptimizations();
            console.log('Optimisations mobile initialisées avec succès (chargement immédiat)');
        }, 1000);
        
        window.galleryInitialized = true;
    }
}

// Correction supplémentaire pour le chargement tardif
window.addEventListener('load', function() {
    console.log('Window load event - Double vérification des optimisations');
    // Double vérification après le chargement complet
    setTimeout(() => {
        if (window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
            initMobileOptimizations();
            console.log('Seconde vérification des optimisations mobile terminée');
        }
    }, 500);
});

// Exposer les fonctions globalement
window.openUploadModal = openUploadModal;
window.closeUploadModal = closeUploadModal;
window.closePhotoViewModal = closePhotoViewModal;
window.loadMorePhotos = loadMorePhotos;
window.previewPhoto = previewPhoto;
window.uploadPhoto = uploadPhoto;
window.submitComment = submitComment;
window.openPhotoView = openPhotoView;
window.loadPhotoComments = loadPhotoComments;

// Fonctions de correction mobile supplémentaires pour compatibilité
function fixMobileScrolling() {
    // Cette fonction est conservée pour compatibilité mais intégrée dans initMobileOptimizations
    console.log('fixMobileScrolling - fonction legacy conservée pour compatibilité');
}

// Appel de fixMobileScrolling pour compatibilité avec l'ancien code
document.addEventListener('DOMContentLoaded', fixMobileScrolling);

console.log('Fin du fichier gallery-manager.js atteinte correctement');