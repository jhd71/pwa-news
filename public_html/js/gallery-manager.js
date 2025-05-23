// gallery-manager-v2.js - Version complètement refaite

// ===== VARIABLES GLOBALES =====
let currentPhotoId = null;
let currentPage = 0;
let pageSize = 12;
let hasMorePhotos = true;
let isLoadingPhotos = false;
let isCommentFormVisible = false;
let isCommentsExpanded = true;

// ===== INITIALISATION =====
function waitForSupabase() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 secondes max
        
        const checkSupabase = () => {
            attempts++;
            
            // Vérifier si window.supabase existe et a la méthode from
            if (window.supabase && typeof window.supabase.from === 'function') {
                console.log('Supabase trouvé et fonctionnel');
                resolve();
                return;
            }
            
            // Si getSupabaseClient existe, essayer de l'utiliser
            if (window.getSupabaseClient && typeof window.getSupabaseClient === 'function') {
                const client = window.getSupabaseClient();
                if (client && typeof client.from === 'function') {
                    window.supabase = client;
                    console.log('Supabase récupéré via getSupabaseClient');
                    resolve();
                    return;
                }
            }
            
            if (attempts >= maxAttempts) {
                reject(new Error('Timeout en attendant Supabase'));
                return;
            }
            
            // Réessayer dans 100ms
            setTimeout(checkSupabase, 100);
        };
        
        checkSupabase();
    });
}

async function initializeApp() {
    console.log('Attente de Supabase...');
    
    try {
        await waitForSupabase();
        console.log('Supabase prêt, initialisation de la galerie');
        
        // Vérifier une dernière fois que tout est OK
        if (!window.supabase || typeof window.supabase.from !== 'function') {
            throw new Error('Supabase non fonctionnel');
        }
        
        initializeGallery();
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.innerHTML = `
                <div style="color: red; text-align: center; padding: 20px;">
                    <p><strong>Erreur de chargement</strong></p>
                    <p>${error.message}</p>
                    <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Rafraîchir la page
                    </button>
                </div>
            `;
        }
    }
}

// Attendre que le DOM soit chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM déjà chargé
    setTimeout(initializeApp, 100); // Petit délai pour laisser le temps aux scripts de se charger
}

function initializeGallery() {
    console.log('Initialisation complète de la galerie');
    
    // Initialiser les événements
    initializeEventListeners();
    
    // Charger les photos
    loadPhotos();
    
    // Restaurer les noms sauvegardés
    restoreSavedNames();
    
    // Optimisations mobile
    if (isMobile()) {
        initializeMobileOptimizations();
    }
}

// ===== DÉTECTION MOBILE =====
function isMobile() {
    return window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

// ===== ÉVÉNEMENTS PRINCIPAUX =====
function initializeEventListeners() {
    console.log('Initialisation des événements');
    
    // Bouton upload
    const uploadBtn = document.getElementById('uploadPhotoBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Clic sur le bouton upload');
            openUploadModal();
        });
    } else {
        console.error('Bouton upload non trouvé !');
    }
    
    // Fermeture modals
    const closeUploadBtn = document.getElementById('closeUploadModal');
    if (closeUploadBtn) {
        closeUploadBtn.addEventListener('click', closeUploadModal);
    }
    
    const closePhotoBtn = document.getElementById('closePhotoView');
    if (closePhotoBtn) {
        closePhotoBtn.addEventListener('click', closePhotoViewModal);
    }
    
    // Bouton charger plus
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMorePhotos);
    }
    
    // Formulaire upload
    const uploadForm = document.getElementById('photoUploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', uploadPhoto);
    }
    
    // Formulaire commentaire
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', submitComment);
    }
    
    // Boutons capture/galerie
    initializeCameraButtons();
    
    // Bouton ouvrir image
    const openNewTabBtn = document.getElementById('openInNewTab');
    if (openNewTabBtn) {
        openNewTabBtn.addEventListener('click', function() {
            if (currentPhotoId) {
                const img = document.getElementById('modalPhotoImg');
                if (img && img.src) {
                    window.open(img.src, '_blank');
                }
            }
        });
    }
    
    // Bouton retour galerie
    const backToGalleryBtn = document.getElementById('backToGalleryBtn');
    if (backToGalleryBtn) {
        backToGalleryBtn.addEventListener('click', closePhotoViewModal);
    }
    
    // NOUVEAUX BOUTONS COMMENTAIRES
    const viewCommentsBtn = document.getElementById('viewCommentsBtn');
    if (viewCommentsBtn) {
        viewCommentsBtn.addEventListener('click', showComments);
    }
    
    const writeCommentBtn = document.getElementById('writeCommentBtn');
    if (writeCommentBtn) {
        writeCommentBtn.addEventListener('click', showCommentForm);
    }
    
    // Bouton annuler commentaire
    const cancelBtn = document.getElementById('cancelCommentBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideCommentForm);
    }
    
    // Fermer modals en cliquant sur l'overlay
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', closePhotoViewModal);
    }
    
    // Fermer modal upload en cliquant dehors
    const uploadModal = document.getElementById('uploadModal');
    if (uploadModal) {
        uploadModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeUploadModal();
            }
        });
    }
    
    // FIX: Empêcher la fermeture du formulaire au focus sur mobile
    if (isMobile()) {
        const commentAuthor = document.getElementById('commentAuthor');
        const commentText = document.getElementById('commentText');
        
        if (commentAuthor) {
            commentAuthor.addEventListener('touchstart', function(e) {
                e.stopPropagation();
            });
            
            commentAuthor.addEventListener('focus', function(e) {
                e.preventDefault();
                e.stopPropagation();
                // Garder le formulaire visible
                const formWrapper = document.getElementById('commentFormWrapper');
                if (formWrapper) {
                    formWrapper.style.display = 'block';
                }
            });
        }
        
        if (commentText) {
            commentText.addEventListener('touchstart', function(e) {
                e.stopPropagation();
            });
            
            commentText.addEventListener('focus', function(e) {
                e.preventDefault();
                e.stopPropagation();
                // Garder le formulaire visible
                const formWrapper = document.getElementById('commentFormWrapper');
                if (formWrapper) {
                    formWrapper.style.display = 'block';
                }
            });
        }
    }
    
    console.log('Événements initialisés avec succès');
}

// ===== GESTION DES BOUTONS CAMERA =====
function initializeCameraButtons() {
    const captureBtn = document.getElementById('captureBtn');
    const galleryBtn = document.getElementById('galleryBtn');
    const photoInput = document.getElementById('photoInput');
    
    if (!captureBtn || !galleryBtn || !photoInput) return;
    
    // Fonction pour gérer le changement de fichier
    function handleFileSelect(file) {
        if (!file || !file.type.match('image.*')) {
            alert('Veuillez sélectionner une image');
            return;
        }
        
        // Afficher la prévisualisation
        const reader = new FileReader();
        reader.onload = function(e) {
            const photoPreview = document.getElementById('photoPreview');
            if (photoPreview) {
                photoPreview.innerHTML = `<img src="${e.target.result}" alt="Prévisualisation">`;
            }
        };
        reader.readAsDataURL(file);
        
        // Mettre à jour l'input principal
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        photoInput.files = dataTransfer.files;
    }
    
    // Bouton prendre photo
    captureBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        
        input.onchange = function(event) {
            const file = event.target.files[0];
            if (file) {
                handleFileSelect(file);
            }
        };
        
        input.click();
    });
    
    // Bouton choisir image
    galleryBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = function(event) {
            const file = event.target.files[0];
            if (file) {
                handleFileSelect(file);
            }
        };
        
        input.click();
    });
}

// ===== GESTION DES MODALS =====
function openUploadModal() {
    console.log('Ouverture de la modal upload');
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.classList.add('modal-open');
        console.log('Modal upload ouverte');
    } else {
        console.error('Modal upload non trouvée !');
    }
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        
        // Réinitialiser le formulaire
        document.getElementById('photoUploadForm')?.reset();
        document.getElementById('photoPreview').innerHTML = '';
        document.getElementById('uploadProgress').style.display = 'none';
    }
}

function closePhotoViewModal() {
    const modal = document.getElementById('photoViewModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        currentPhotoId = null;
        
        // Réinitialiser le formulaire de commentaire
        hideCommentForm();
        
        // Fermer le clavier sur mobile
        if (isMobile()) {
            document.activeElement?.blur();
        }
    }
}

// ===== UPLOAD DE PHOTO =====
async function uploadPhoto(event) {
    event.preventDefault();
    
    const photoInput = document.getElementById('photoInput');
    const file = photoInput.files[0];
    
    if (!file) {
        alert('Veuillez sélectionner une image');
        return;
    }
    
    // Récupérer les données du formulaire
    const title = document.getElementById('photoTitle').value.trim();
    const description = document.getElementById('photoDescription').value.trim();
    const location = document.getElementById('photoLocation').value.trim();
    const authorName = document.getElementById('photographerName').value.trim();
    
    // Afficher la progression
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBarFill = document.querySelector('.progress-bar-fill');
    uploadProgress.style.display = 'block';
    
    try {
        // Sauvegarder le nom
        localStorage.setItem('photographerName', authorName);
        
        // Générer un nom de fichier unique
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `photos/${fileName}`;
        
        // Upload vers Supabase Storage
        const { data: fileData, error: fileError } = await window.supabase.storage
            .from('gallery')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });
            
        if (fileError) throw fileError;
        
        // Obtenir l'URL publique
        const { data: urlData } = window.supabase.storage
            .from('gallery')
            .getPublicUrl(filePath);
        
        // Insérer dans la base de données
        const { data, error } = await window.supabase
            .from('photos')
            .insert([{
                title: title || 'Sans titre',
                description: description || '',
                location: location || '',
                author_name: authorName || 'Anonyme',
                image_url: urlData.publicUrl,
                file_path: filePath
            }]);
            
        if (error) throw error;
        
        // Succès
        alert('Photo ajoutée avec succès !');
        closeUploadModal();
        
        // Recharger les photos
        currentPage = 0;
        document.getElementById('photoGrid').innerHTML = '';
        loadPhotos();
        
    } catch (error) {
        console.error('Erreur upload:', error);
        alert('Erreur lors de l\'upload: ' + error.message);
    } finally {
        uploadProgress.style.display = 'none';
        progressBarFill.style.width = '0%';
    }
}

// ===== CHARGEMENT DES PHOTOS =====
async function loadPhotos(isLoadMore = false) {
    console.log('Début du chargement des photos');
    
    if (isLoadingPhotos) {
        console.log('Chargement déjà en cours, annulé');
        return;
    }
    
    if (!window.supabase) {
        console.error('Supabase non disponible pour charger les photos');
        return;
    }
    
    isLoadingPhotos = true;
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noPhotosMessage = document.getElementById('noPhotosMessage');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const photoGrid = document.getElementById('photoGrid');
    
    if (!isLoadMore && loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }
    
    try {
        const from = currentPage * pageSize;
        const to = from + pageSize - 1;
        
        console.log(`Chargement des photos de ${from} à ${to}`);
        
        const { data: photos, error } = await window.supabase
            .from('photos')
            .select('*')
            .order('created_at', { ascending: false })
            .range(from, to);
            
        if (error) {
            console.error('Erreur Supabase:', error);
            throw error;
        }
        
        console.log(`${photos ? photos.length : 0} photos chargées`);
        
        if (!photos || photos.length === 0) {
            if (currentPage === 0 && noPhotosMessage) {
                noPhotosMessage.style.display = 'block';
            }
            hasMorePhotos = false;
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }
        } else {
            if (noPhotosMessage) {
                noPhotosMessage.style.display = 'none';
            }
            renderPhotos(photos);
            
            hasMorePhotos = photos.length === pageSize;
            if (loadMoreBtn) {
                loadMoreBtn.style.display = hasMorePhotos ? 'block' : 'none';
            }
            
            currentPage++;
        }
        
    } catch (error) {
        console.error('Erreur chargement photos:', error);
        
        // Afficher un message d'erreur plus détaillé
        if (photoGrid && currentPage === 0) {
            photoGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-color);">
                    <p style="font-size: 18px; margin-bottom: 10px;">⚠️ Impossible de charger les photos</p>
                    <p style="color: var(--text-muted);">Erreur: ${error.message || 'Erreur inconnue'}</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Rafraîchir la page
                    </button>
                </div>
            `;
        }
    } finally {
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        isLoadingPhotos = false;
    }
}

function loadMorePhotos() {
    if (hasMorePhotos && !isLoadingPhotos) {
        loadPhotos(true);
    }
}

// ===== AFFICHAGE DES PHOTOS =====
function renderPhotos(photos) {
    const photoGrid = document.getElementById('photoGrid');
    
    photos.forEach(photo => {
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card';
        photoCard.dataset.id = photo.id;
        
        const date = new Date(photo.created_at);
        const formattedDate = date.toLocaleDateString('fr-FR');
        
        photoCard.innerHTML = `
            <div class="photo-img-container">
                <img class="photo-img" 
                     src="${photo.image_url}" 
                     alt="${photo.title || 'Photo'}"
                     onerror="this.src='images/Actu&Media.png';">
            </div>
            <div class="photo-info">
                <h3 class="photo-title">${photo.title || 'Sans titre'}</h3>
                <div class="photo-meta">
                    <span>📍 ${photo.location || 'Lieu non précisé'}</span>
                    <span>📸 ${photo.author_name || 'Anonyme'}</span>
                    <span>📅 ${formattedDate}</span>
                </div>
            </div>
        `;
        
        photoCard.addEventListener('click', () => openPhotoView(photo.id));
        photoGrid.appendChild(photoCard);
    });
}

// ===== VUE DÉTAILLÉE D'UNE PHOTO =====
async function openPhotoView(photoId) {
    currentPhotoId = photoId;
    const modal = document.getElementById('photoViewModal');
    
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    
    try {
        // Charger les détails de la photo
        const { data: photo, error } = await window.supabase
            .from('photos')
            .select('*')
            .eq('id', photoId)
            .single();
            
        if (error) throw error;
        
        // Mettre à jour l'interface
        document.getElementById('modalPhotoImg').src = photo.image_url;
        document.getElementById('modalPhotoTitle').textContent = photo.title || 'Sans titre';
        document.getElementById('modalPhotoDescription').textContent = photo.description || 'Aucune description';
        
        // Métadonnées
        const locationEl = document.getElementById('modalPhotoLocation');
        const dateEl = document.getElementById('modalPhotoDate');
        const authorEl = document.getElementById('modalPhotoAuthor');
        
        locationEl.textContent = photo.location ? `📍 ${photo.location}` : '';
        dateEl.textContent = `📅 ${new Date(photo.created_at).toLocaleDateString('fr-FR')}`;
        authorEl.textContent = `📸 ${photo.author_name || 'Anonyme'}`;
        
        // Charger les commentaires mais les cacher par défaut
        loadComments();
        
        // Cacher les commentaires et le formulaire à l'ouverture
        const commentsContent = document.getElementById('commentsContent');
        const commentFormWrapper = document.getElementById('commentFormWrapper');
        if (commentsContent) {
            commentsContent.style.display = 'none';
        }
        if (commentFormWrapper) {
            commentFormWrapper.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Erreur chargement photo:', error);
        alert('Erreur lors du chargement de la photo');
    }
}

// ===== GESTION DES COMMENTAIRES =====
async function loadComments() {
    const container = document.getElementById('commentsContainer');
    container.innerHTML = '<p style="text-align: center;">Chargement des commentaires...</p>';
    
    try {
        const { data: comments, error } = await window.supabase
            .from('photo_comments')
            .select('*')
            .eq('photo_id', currentPhotoId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        if (!comments || comments.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Aucun commentaire pour le moment.</p>';
        } else {
            container.innerHTML = '';
            comments.forEach(comment => {
                const commentEl = createCommentElement(comment);
                container.appendChild(commentEl);
            });
        }
        
    } catch (error) {
        console.error('Erreur chargement commentaires:', error);
        container.innerHTML = '<p style="color: red; text-align: center;">Erreur lors du chargement des commentaires.</p>';
    }
}

function createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = 'comment';
    
    const date = new Date(comment.created_at);
    const formattedDate = date.toLocaleDateString('fr-FR') + ' à ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    div.innerHTML = `
        <div class="comment-header">
            <span class="comment-author">${comment.author_name || 'Anonyme'}</span>
            <span class="comment-date">${formattedDate}</span>
        </div>
        <div class="comment-text">${comment.comment_text}</div>
    `;
    
    return div;
}

// Fonction pour afficher les commentaires
function showComments() {
    const commentsContent = document.getElementById('commentsContent');
    const commentFormWrapper = document.getElementById('commentFormWrapper');
    
    if (commentsContent) {
        commentsContent.style.display = 'block';
        // Cacher le formulaire quand on affiche les commentaires
        if (commentFormWrapper) {
            commentFormWrapper.style.display = 'none';
        }
        
        // Scroll vers les commentaires sur mobile
        if (isMobile()) {
            setTimeout(() => {
                commentsContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }
}

function showCommentForm() {
    const formWrapper = document.getElementById('commentFormWrapper');
    const commentsContent = document.getElementById('commentsContent');
    
    // D'abord afficher la section commentaires si elle est cachée
    if (commentsContent && commentsContent.style.display === 'none') {
        commentsContent.style.display = 'block';
    }
    
    if (formWrapper) {
        formWrapper.style.display = 'block';
        
        // Focus sur le premier champ
        setTimeout(() => {
            const authorInput = document.getElementById('commentAuthor');
            if (authorInput && !authorInput.value) {
                authorInput.focus();
            } else {
                const textInput = document.getElementById('commentText');
                if (textInput) {
                    textInput.focus();
                }
            }
            
            // Sur mobile, scroll vers le formulaire
            if (isMobile()) {
                formWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }
}

function hideCommentForm() {
    const formWrapper = document.getElementById('commentFormWrapper');
    
    if (formWrapper) {
        formWrapper.style.display = 'none';
        
        // Réinitialiser le formulaire
        const textInput = document.getElementById('commentText');
        if (textInput) {
            textInput.value = '';
        }
    }
}

async function submitComment(event) {
    event.preventDefault();
    
    const authorInput = document.getElementById('commentAuthor');
    const textInput = document.getElementById('commentText');
    
    const author = authorInput.value.trim();
    const text = textInput.value.trim();
    
    if (!author || !text) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    // Sauvegarder le nom
    localStorage.setItem('commenterName', author);
    
    try {
        const { data, error } = await window.supabase
            .from('photo_comments')
            .insert([{
                photo_id: currentPhotoId,
                author_name: author,
                comment_text: text
            }]);
            
        if (error) throw error;
        
        // Succès
        textInput.value = '';
        hideCommentForm();
        
        // Recharger les commentaires
        loadComments();
        
        // S'assurer que les commentaires sont visibles
        const commentsContent = document.getElementById('commentsContent');
        if (commentsContent) {
            commentsContent.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Erreur envoi commentaire:', error);
        alert('Erreur lors de l\'envoi du commentaire');
    }
}
    div.className = 'comment';
    
    const date = new Date(comment.created_at);
    const formattedDate = date.toLocaleDateString('fr-FR') + ' à ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    div.innerHTML = `
        <div class="comment-header">
            <span class="comment-author">${comment.author_name || 'Anonyme'}</span>
            <span class="comment-date">${formattedDate}</span>
        </div>
        <div class="comment-text">${comment.comment_text}</div>
    `;
    
    return div;
}

// Fonction pour afficher les commentaires (au cas où ils seraient cachés)
function showComments() {
    const container = document.getElementById('commentsContainer');
    if (container) {
        container.style.display = 'block';
    }
}

function showCommentForm() {
    const formWrapper = document.getElementById('commentFormWrapper');
    const commentsContainer = document.getElementById('commentsContainer');
    
    if (formWrapper) {
        formWrapper.style.display = 'block';
        
        // Focus sur le premier champ
        setTimeout(() => {
            const authorInput = document.getElementById('commentAuthor');
            if (authorInput && !authorInput.value) {
                authorInput.focus();
            } else {
                const textInput = document.getElementById('commentText');
                if (textInput) {
                    textInput.focus();
                }
            }
        }, 100);
    }
    
    // S'assurer que les commentaires sont visibles aussi
    if (commentsContainer) {
        commentsContainer.style.display = 'block';
    }
}

function hideCommentForm() {
    const formWrapper = document.getElementById('commentFormWrapper');
    
    if (formWrapper) {
        formWrapper.style.display = 'none';
        
        // Réinitialiser le formulaire
        const textInput = document.getElementById('commentText');
        if (textInput) {
            textInput.value = '';
        }
    }
}

async function submitComment(event) {
    event.preventDefault();
    
    const authorInput = document.getElementById('commentAuthor');
    const textInput = document.getElementById('commentText');
    
    const author = authorInput.value.trim();
    const text = textInput.value.trim();
    
    if (!author || !text) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    // Sauvegarder le nom
    localStorage.setItem('commenterName', author);
    
    try {
        const { data, error } = await window.supabase
            .from('photo_comments')
            .insert([{
                photo_id: currentPhotoId,
                author_name: author,
                comment_text: text
            }]);
            
        if (error) throw error;
        
        // Succès
        textInput.value = '';
        hideCommentForm();
        
        // Recharger les commentaires
        loadComments();
        
    } catch (error) {
        console.error('Erreur envoi commentaire:', error);
        alert('Erreur lors de l\'envoi du commentaire');
    }
}

// Plus besoin de toggleComments car on enlève cette fonctionnalité DÉTAILLÉE D'UNE PHOTO =====
async function openPhotoView(photoId) {
    currentPhotoId = photoId;
    const modal = document.getElementById('photoViewModal');
    
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    
    try {
        // Charger les détails de la photo
        const { data: photo, error } = await window.supabase
            .from('photos')
            .select('*')
            .eq('id', photoId)
            .single();
            
        if (error) throw error;
        
        // Mettre à jour l'interface
        document.getElementById('modalPhotoImg').src = photo.image_url;
        document.getElementById('modalPhotoTitle').textContent = photo.title || 'Sans titre';
        document.getElementById('modalPhotoDescription').textContent = photo.description || 'Aucune description';
        
        // Métadonnées
        const locationEl = document.getElementById('modalPhotoLocation');
        const dateEl = document.getElementById('modalPhotoDate');
        const authorEl = document.getElementById('modalPhotoAuthor');
        
        locationEl.textContent = photo.location ? `📍 ${photo.location}` : '';
        dateEl.textContent = `📅 ${new Date(photo.created_at).toLocaleDateString('fr-FR')}`;
        authorEl.textContent = `📸 ${photo.author_name || 'Anonyme'}`;
        
        // Charger les commentaires
        loadComments();
        
        // Sur PC, fermer les commentaires par défaut
        if (!isMobile()) {
            const commentsSection = document.querySelector('.comments-section');
            if (commentsSection) {
                commentsSection.classList.add('collapsed');
                isCommentsExpanded = false;
                const icon = document.querySelector('#toggleCommentsBtn .material-icons');
                if (icon) icon.textContent = 'keyboard_arrow_up';
            }
        }
        
    } catch (error) {
        console.error('Erreur chargement photo:', error);
        alert('Erreur lors du chargement de la photo');
    }
}

// ===== GESTION DES COMMENTAIRES =====
async function loadComments() {
    const container = document.getElementById('commentsContainer');
    container.innerHTML = '<p style="text-align: center;">Chargement des commentaires...</p>';
    
    try {
        const { data: comments, error } = await window.supabase
            .from('photo_comments')
            .select('*')
            .eq('photo_id', currentPhotoId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        if (!comments || comments.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Aucun commentaire pour le moment.</p>';
        } else {
            container.innerHTML = '';
            comments.forEach(comment => {
                const commentEl = createCommentElement(comment);
                container.appendChild(commentEl);
            });
        }
        
    } catch (error) {
        console.error('Erreur chargement commentaires:', error);
        container.innerHTML = '<p style="color: red;">Erreur lors du chargement des commentaires.</p>';
    }
}

function createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = 'comment';
    
    const date = new Date(comment.created_at);
    const formattedDate = date.toLocaleDateString('fr-FR') + ' à ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    div.innerHTML = `
        <div class="comment-header">
            <span class="comment-author">${comment.author_name || 'Anonyme'}</span>
            <span class="comment-date">${formattedDate}</span>
        </div>
        <div class="comment-text">${comment.comment_text}</div>
    `;
    
    return div;
}

function showCommentForm() {
    const form = document.getElementById('commentForm');
    const showBtn = document.getElementById('showCommentFormBtn');
    
    form.style.display = 'block';
    showBtn.style.display = 'none';
    isCommentFormVisible = true;
    
    // Focus sur le premier champ
    const authorInput = document.getElementById('commentAuthor');
    if (authorInput && !authorInput.value) {
        authorInput.focus();
    } else {
        document.getElementById('commentText').focus();
    }
    
    // Sur mobile, s'assurer que le formulaire est visible
    if (isMobile()) {
        setTimeout(() => {
            form.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
    }
}

function hideCommentForm() {
    const form = document.getElementById('commentForm');
    const showBtn = document.getElementById('showCommentFormBtn');
    
    form.style.display = 'none';
    showBtn.style.display = 'flex';
    isCommentFormVisible = false;
    
    // Réinitialiser le formulaire
    document.getElementById('commentText').value = '';
}

async function submitComment(event) {
    event.preventDefault();
    
    const authorInput = document.getElementById('commentAuthor');
    const textInput = document.getElementById('commentText');
    
    const author = authorInput.value.trim();
    const text = textInput.value.trim();
    
    if (!author || !text) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    // Sauvegarder le nom
    localStorage.setItem('commenterName', author);
    
    try {
        const { data, error } = await window.supabase
            .from('photo_comments')
            .insert([{
                photo_id: currentPhotoId,
                author_name: author,
                comment_text: text
            }]);
            
        if (error) throw error;
        
        // Succès
        textInput.value = '';
        hideCommentForm();
        
        // Recharger les commentaires
        loadComments();
        
    } catch (error) {
        console.error('Erreur envoi commentaire:', error);
        alert('Erreur lors de l\'envoi du commentaire');
    }
}

function toggleComments() {
    // Fonction uniquement pour PC
    if (isMobile()) return;
    
    const commentsSection = document.querySelector('.comments-section');
    const toggleBtn = document.getElementById('toggleCommentsBtn');
    const icon = toggleBtn.querySelector('.material-icons');
    
    if (isCommentsExpanded) {
        commentsSection.classList.add('collapsed');
        icon.textContent = 'keyboard_arrow_up';
        isCommentsExpanded = false;
    } else {
        commentsSection.classList.remove('collapsed');
        icon.textContent = 'keyboard_arrow_down';
        isCommentsExpanded = true;
    }
}

// ===== UTILITAIRES =====
function restoreSavedNames() {
    const photographerName = localStorage.getItem('photographerName');
    if (photographerName) {
        const input = document.getElementById('photographerName');
        if (input) input.value = photographerName;
    }
    
    const commenterName = localStorage.getItem('commenterName');
    if (commenterName) {
        const input = document.getElementById('commentAuthor');
        if (input) input.value = commenterName;
    }
}

// ===== OPTIMISATIONS MOBILE =====
function initializeMobileOptimizations() {
    // Empêcher le zoom sur double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Gérer le viewport pour iOS
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        // Ajuster la hauteur du viewport
        function setViewportHeight() {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
        
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        
        // Gérer le comportement du clavier - VERSION CORRIGÉE
        document.addEventListener('focusin', function(e) {
            if (e.target.matches('input, textarea')) {
                // Sur mobile, ne pas faire de scroll automatique qui peut casser l'interface
                if (e.target.closest('.comment-form')) {
                    // Pour le formulaire de commentaire, juste s'assurer qu'il est visible
                    setTimeout(() => {
                        const form = e.target.closest('.comment-form');
                        if (form) {
                            // Faire défiler doucement vers le formulaire
                            const rect = form.getBoundingClientRect();
                            if (rect.bottom > window.innerHeight) {
                                window.scrollBy({
                                    top: rect.bottom - window.innerHeight + 50,
                                    behavior: 'smooth'
                                });
                            }
                        }
                    }, 300);
                }
            }
        });
        
        // NE PAS empêcher le scroll dans les modals
        document.body.addEventListener('touchmove', function(e) {
            // Permettre le scroll partout dans les modals
            if (e.target.closest('.modal-scrollable-content, .comments-content, .upload-modal')) {
                return; // Laisser le scroll fonctionner
            }
            
            // Empêcher seulement si on est sur l'overlay de fond
            if (e.target.classList.contains('modal-overlay')) {
                e.preventDefault();
            }
        }, { passive: false });
    }
    
    // Gérer l'orientation
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            if (document.querySelector('.photo-view-modal').style.display === 'block') {
                window.scrollTo(0, 0);
            }
        }, 300);
    });
    
    // Améliorer les performances de scroll
    const scrollableElements = document.querySelectorAll('.modal-scrollable-content, .comments-content, .upload-modal .modal-content');
    scrollableElements.forEach(el => {
        if (el) {
            el.style.webkitOverflowScrolling = 'touch';
            el.style.overflowY = 'auto';
        }
    });
}

// ===== GESTION DES ERREURS =====
window.addEventListener('error', function(event) {
    console.error('Erreur globale:', event.error);
    
    // Ne pas afficher d'alerte pour chaque erreur
    if (event.error && event.error.message && event.error.message.includes('supabase')) {
        console.error('Erreur Supabase détectée');
    }
});

// ===== EXPORTS GLOBAUX =====
window.galleryManager = {
    openUploadModal,
    closeUploadModal,
    closePhotoViewModal,
    loadPhotos,
    loadMorePhotos,
    openPhotoView,
    submitComment,
    showCommentForm,
    hideCommentForm,
    showComments
};

console.log('Gallery Manager V2 initialisé avec succès');