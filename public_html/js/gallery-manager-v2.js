// gallery-manager-v2.js - Version 20 - Complètement refaite et nettoyée

// ===== VARIABLES GLOBALES =====
let currentPhotoId = null;
let currentPhotoIndex = 0;
let currentPage = 0;
let pageSize = 12;
let hasMorePhotos = true;
let isLoadingPhotos = false;

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
    setTimeout(initializeApp, 100);
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
    
	// Boutons de navigation photo
const prevPhotoBtn = document.getElementById('prevPhotoBtn');
const nextPhotoBtn = document.getElementById('nextPhotoBtn');

if (prevPhotoBtn) {
    prevPhotoBtn.addEventListener('click', () => navigateToPhoto(-1));
}

if (nextPhotoBtn) {
    nextPhotoBtn.addEventListener('click', () => navigateToPhoto(1));
}

// Navigation clavier
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('photoViewModal');
    if (modal && modal.style.display === 'block') {
        if (e.key === 'ArrowLeft') {
            navigateToPhoto(-1);
        } else if (e.key === 'ArrowRight') {
            navigateToPhoto(1);
        }
    }
});

    // Boutons commentaires
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
    
    // Fix mobile pour les commentaires
    if (isMobile()) {
        setupMobileCommentFix();
    }
    
    console.log('Événements initialisés avec succès');
}

// ===== GESTION DES BOUTONS CAMERA =====
function initializeCameraButtons() {
    const captureBtn = document.getElementById('captureBtn');
    const galleryBtn = document.getElementById('galleryBtn');
    const photoInput = document.getElementById('photoInput');
    
    if (!captureBtn || !galleryBtn || !photoInput) return;
    
    // Détecter si on est sur mobile ou PC
    const isMobileDevice = isMobile();
    
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
    captureBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        
        if (isMobileDevice) {
            // Sur mobile : utiliser l'input file avec capture
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
        } else {
            // Sur PC : utiliser getUserMedia pour la webcam
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    } 
                });
                
                // Créer l'interface de capture webcam
                createWebcamInterface(stream, handleFileSelect);
            } catch (error) {
                console.error('Erreur accès webcam:', error);
                alert('Impossible d\'accéder à la webcam. Vérifiez les permissions ou utilisez "Choisir une image".');
            }
        }
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

// Nouvelle fonction pour créer l'interface webcam
function createWebcamInterface(stream, onCapture) {
    // Créer l'overlay pour la capture webcam
    const webcamOverlay = document.createElement('div');
    webcamOverlay.className = 'webcam-overlay';
    webcamOverlay.innerHTML = `
        <div class="webcam-container">
            <video id="webcamVideo" autoplay playsinline></video>
            <canvas id="webcamCanvas" style="display: none;"></canvas>
            <div class="webcam-controls">
                <button id="capturePhotoBtn" class="capture-photo-btn">
                    <i class="material-icons">camera</i>
                    Capturer
                </button>
                <button id="cancelWebcamBtn" class="cancel-webcam-btn">
                    <i class="material-icons">close</i>
                    Annuler
                </button>
            </div>
        </div>
    `;
    
    // Ajouter les styles si ils n'existent pas
    if (!document.getElementById('webcam-styles')) {
        const style = document.createElement('style');
        style.id = 'webcam-styles';
        style.textContent = `
            .webcam-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.9);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .webcam-container {
                background: black;
                border-radius: 8px;
                overflow: hidden;
                max-width: 90vw;
                max-height: 90vh;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            }
            
            #webcamVideo {
                width: 100%;
                height: auto;
                max-height: 70vh;
                display: block;
            }
            
            .webcam-controls {
                display: flex;
                gap: 10px;
                padding: 15px;
                background: rgba(0, 0, 0, 0.8);
                justify-content: center;
            }
            
            .capture-photo-btn, .cancel-webcam-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 500;
                transition: all 0.3s ease;
            }
            
            .capture-photo-btn {
                background: var(--primary-color, #dc3545);
                color: white;
            }
            
            .capture-photo-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
            }
            
            .cancel-webcam-btn {
                background: #6c757d;
                color: white;
            }
            
            .cancel-webcam-btn:hover {
                background: #5a6268;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    document.body.appendChild(webcamOverlay);
    
    // Attacher le stream à la vidéo
    const video = document.getElementById('webcamVideo');
    video.srcObject = stream;
    
    // Gestionnaire pour capturer la photo
    document.getElementById('capturePhotoBtn').addEventListener('click', () => {
        const canvas = document.getElementById('webcamCanvas');
        const context = canvas.getContext('2d');
        
        // Définir la taille du canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Capturer l'image
        context.drawImage(video, 0, 0);
        
        // Convertir en blob
        canvas.toBlob((blob) => {
            // Créer un fichier à partir du blob
            const file = new File([blob], `webcam-${Date.now()}.jpg`, { type: 'image/jpeg' });
            
            // Appeler la fonction de callback avec le fichier
            onCapture(file);
            
            // Nettoyer
            closeWebcam(stream, webcamOverlay);
        }, 'image/jpeg', 0.9);
    });
    
    // Gestionnaire pour annuler
    document.getElementById('cancelWebcamBtn').addEventListener('click', () => {
        closeWebcam(stream, webcamOverlay);
    });
}

// Fonction pour fermer la webcam
function closeWebcam(stream, overlay) {
    // Arrêter tous les tracks du stream
    stream.getTracks().forEach(track => track.stop());
    
    // Supprimer l'overlay
    if (overlay && overlay.parentNode) {
        overlay.remove();
    }
}

// ===== GESTION DES MODALS =====
function openUploadModal() {
    console.log('Ouverture de la modal upload');
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.classList.add('modal-open');
        console.log('Modal upload ouverte');
    }
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        
        // Réinitialiser le formulaire
        const form = document.getElementById('photoUploadForm');
        if (form) form.reset();
        
        const preview = document.getElementById('photoPreview');
        if (preview) preview.innerHTML = '';
        
        const progress = document.getElementById('uploadProgress');
        if (progress) progress.style.display = 'none';
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
    if (uploadProgress) uploadProgress.style.display = 'block';
    
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
        const photoGrid = document.getElementById('photoGrid');
        if (photoGrid) photoGrid.innerHTML = '';
        loadPhotos();
        
    } catch (error) {
        console.error('Erreur upload:', error);
        alert('Erreur lors de l\'upload: ' + error.message);
    } finally {
        if (uploadProgress) uploadProgress.style.display = 'none';
        if (progressBarFill) progressBarFill.style.width = '0%';
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
    if (!photoGrid) return;
    
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
    
    if (!modal) return;
    
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
        // Stocker l'index de la photo actuelle pour la navigation
	currentPhotoIndex = findPhotoIndex(photoId);
	setupNavigationButtons();
        // Métadonnées
        const locationEl = document.getElementById('modalPhotoLocation');
        const dateEl = document.getElementById('modalPhotoDate');
        const authorEl = document.getElementById('modalPhotoAuthor');
        
        if (locationEl) locationEl.textContent = photo.location ? `📍 ${photo.location}` : '';
        if (dateEl) dateEl.textContent = `📅 ${new Date(photo.created_at).toLocaleDateString('fr-FR')}`;
        if (authorEl) authorEl.textContent = `📸 ${photo.author_name || 'Anonyme'}`;
        
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
    if (!container) return;
    
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
        
        // Sur mobile, ajouter une classe au body pour bloquer le scroll
        if (isMobile()) {
            document.body.classList.add('comment-form-open');
            
            // Sauvegarder la position actuelle
            const scrollY = window.scrollY;
            document.body.style.top = `-${scrollY}px`;
        }
        
        // Focus sur le premier champ après un délai
        setTimeout(() => {
            const authorInput = document.getElementById('commentAuthor');
            if (authorInput && !authorInput.value) {
                // Ne pas faire de focus automatique sur mobile pour éviter le clavier
                if (!isMobile()) {
                    authorInput.focus();
                }
            } else if (!isMobile()) {
                const textInput = document.getElementById('commentText');
                if (textInput) {
                    textInput.focus();
                }
            }
        }, 300);
    }
}

function hideCommentForm() {
    const formWrapper = document.getElementById('commentFormWrapper');
    
    if (formWrapper) {
        formWrapper.style.display = 'none';
        
        // Sur mobile, retirer la classe et restaurer le scroll
        if (isMobile()) {
            document.body.classList.remove('comment-form-open');
            
            // Restaurer la position de scroll
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
        
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
    
    if (!authorInput || !textInput) return;
    
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
function setupMobileCommentFix() {
    const commentAuthor = document.getElementById('commentAuthor');
    const commentText = document.getElementById('commentText');
    
    // Gestionnaire pour empêcher la fermeture au focus
    function preventFormClose(e) {
        e.stopPropagation();
        e.preventDefault();
        
        const formWrapper = document.getElementById('commentFormWrapper');
        if (formWrapper && formWrapper.style.display === 'block') {
            // Garder le formulaire visible
            formWrapper.style.display = 'block';
            
            // Empêcher le scroll du body
            if (!document.body.classList.contains('comment-form-open')) {
                document.body.classList.add('comment-form-open');
            }
        }
    }
    
    if (commentAuthor) {
        // Empêcher la propagation des événements tactiles
        commentAuthor.addEventListener('touchstart', function(e) {
            e.stopPropagation();
        }, { passive: true });
        
        // Gérer le focus
        commentAuthor.addEventListener('focus', preventFormClose);
        
        // Empêcher le blur accidentel
        commentAuthor.addEventListener('blur', function(e) {
            // Si on clique sur un autre champ du formulaire, ne pas fermer
            setTimeout(() => {
                const activeElement = document.activeElement;
                if (activeElement && activeElement.closest('.comment-form')) {
                    e.preventDefault();
                }
            }, 100);
        });
    }
    
    if (commentText) {
        // Même logique pour le textarea
        commentText.addEventListener('touchstart', function(e) {
            e.stopPropagation();
        }, { passive: true });
        
        commentText.addEventListener('focus', preventFormClose);
        
        commentText.addEventListener('blur', function(e) {
            setTimeout(() => {
                const activeElement = document.activeElement;
                if (activeElement && activeElement.closest('.comment-form')) {
                    e.preventDefault();
                }
            }, 100);
        });
    }
}

function initializeMobileOptimizations() {
    // Empêcher le zoom sur double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
    
    // Gérer le viewport pour iOS
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        // Ajuster la hauteur du viewport
        function setViewportHeight() {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
        
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        
        // Gérer le comportement du clavier
        document.addEventListener('focusin', function(e) {
            if (e.target.matches('input, textarea')) {
                if (e.target.closest('.comment-form')) {
                    setTimeout(() => {
                        const form = e.target.closest('.comment-form');
                        if (form) {
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
        
        // Gérer le scroll dans les modals
        document.body.addEventListener('touchmove', function(e) {
            if (e.target.closest('.modal-scrollable-content, .comments-content, .upload-modal')) {
                return; // Laisser le scroll fonctionner
            }
            
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

// ===== NAVIGATION ENTRE PHOTOS =====


// Trouver l'index d'une photo dans la liste actuelle
function findPhotoIndex(photoId) {
    // Récupérer toutes les photos affichées dans la grille
    const photoCards = document.querySelectorAll('.photo-card');
    for (let i = 0; i < photoCards.length; i++) {
        if (photoCards[i].dataset.id == photoId) {
            return i;
        }
    }
    return 0;
}

// Naviguer vers la photo précédente/suivante
function navigateToPhoto(direction) {
    const photoCards = document.querySelectorAll('.photo-card');
    if (photoCards.length === 0) return;
    
    // Calculer le nouvel index
    currentPhotoIndex += direction;
    
    // Gérer les limites (boucle infinie)
    if (currentPhotoIndex < 0) {
        currentPhotoIndex = photoCards.length - 1;
    } else if (currentPhotoIndex >= photoCards.length) {
        currentPhotoIndex = 0;
    }
    
    // Ouvrir la nouvelle photo
    const newPhotoId = photoCards[currentPhotoIndex].dataset.id;
    openPhotoView(newPhotoId);
}

// Configurer les boutons de navigation
function setupNavigationButtons() {
    const photoCards = document.querySelectorAll('.photo-card');
    const prevBtn = document.getElementById('prevPhotoBtn');
    const nextBtn = document.getElementById('nextPhotoBtn');
    
    if (!prevBtn || !nextBtn) return;
    
    // Afficher/masquer les boutons selon le nombre de photos
    if (photoCards.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
        
        // Mettre à jour les textes avec les numéros
        const currentNum = currentPhotoIndex + 1;
        const totalNum = photoCards.length;
        
        prevBtn.title = `Photo précédente (${currentNum - 1 > 0 ? currentNum - 1 : totalNum}/${totalNum})`;
        nextBtn.title = `Photo suivante (${currentNum + 1 <= totalNum ? currentNum + 1 : 1}/${totalNum})`;
    }
}

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