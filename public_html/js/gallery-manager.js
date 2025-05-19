// gallery-manager.js - Version adaptée pour utiliser l'instance Supabase partagée

// Obtenir l'instance Supabase partagée
const supabase = window.getSupabaseClient();

// État de l'application
let currentPhotoId = null;
let currentPage = 0;
const pageSize = 12;
let hasMorePhotos = true;

// Éléments DOM
const photoGrid = document.getElementById('photoGrid');
const uploadModal = document.getElementById('uploadModal');
const photoViewModal = document.getElementById('photoViewModal');
const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
const closeUploadModalBtn = document.getElementById('closeUploadModal');
const closePhotoViewBtn = document.getElementById('closePhotoView');
const photoUploadForm = document.getElementById('photoUploadForm');
const photoInput = document.getElementById('photoInput');
const photoPreview = document.getElementById('photoPreview');
const loadingIndicator = document.getElementById('loadingIndicator');
const noPhotosMessage = document.getElementById('noPhotosMessage');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const uploadProgress = document.getElementById('uploadProgress');
const progressBarFill = document.querySelector('.progress-bar-fill');
const commentForm = document.getElementById('commentForm');

// Événements
document.addEventListener('DOMContentLoaded', () => {
    // Charger les photos initiales
    loadPhotos();
    
    // Gérer les clics sur les boutons
    uploadPhotoBtn.addEventListener('click', openUploadModal);
    closeUploadModalBtn.addEventListener('click', closeUploadModal);
    closePhotoViewBtn.addEventListener('click', closePhotoViewModal);
    loadMoreBtn.addEventListener('click', loadMorePhotos);
    
    // Prévisualisation de la photo
    photoInput.addEventListener('change', previewPhoto);
    
    // Soumission du formulaire d'upload
    photoUploadForm.addEventListener('submit', uploadPhoto);
    
    // Soumission d'un commentaire
    commentForm.addEventListener('submit', submitComment);
    
    // Fermer les modales en cliquant à l'extérieur
    window.addEventListener('click', function(event) {
        if (event.target === uploadModal) {
            closeUploadModal();
        }
        if (event.target === photoViewModal) {
            closePhotoViewModal();
        }
    });
});

// Charger les photos
async function loadPhotos(isLoadMore = false) {
    if (!isLoadMore) {
        loadingIndicator.style.display = 'flex';
        photoGrid.innerHTML = '';
        currentPage = 0;
    }
    
    try {
        const from = currentPage * pageSize;
        const to = from + pageSize - 1;
        
        let { data: photos, error } = await supabase
            .from('photos')
            .select('*')
            .order('created_at', { ascending: false })
            .range(from, to);
        
        if (error) throw error;
        
        if (photos.length < pageSize) {
            hasMorePhotos = false;
            loadMoreBtn.style.display = 'none';
        } else {
            hasMorePhotos = true;
            loadMoreBtn.style.display = 'block';
        }
        
        if (photos.length === 0 && currentPage === 0) {
            noPhotosMessage.style.display = 'block';
        } else {
            noPhotosMessage.style.display = 'none';
            renderPhotos(photos);
        }
        
        currentPage++;
    } catch (error) {
        console.error('Erreur lors du chargement des photos:', error);
        alert('Impossible de charger les photos. Veuillez réessayer plus tard.');
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// Charger plus de photos
function loadMorePhotos() {
    if (hasMorePhotos) {
        loadPhotos(true);
    }
}

// Afficher les photos dans la grille
function renderPhotos(photos) {
    photos.forEach(photo => {
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card';
        photoCard.dataset.id = photo.id;
        
        const date = new Date(photo.created_at);
        const formattedDate = date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        photoCard.innerHTML = `
            <div class="photo-img-container">
                <img class="photo-img" src="${photo.image_url}" alt="${photo.title}">
            </div>
            <div class="photo-info">
                <h3 class="photo-title">${photo.title}</h3>
                <div class="photo-meta">
                    <span>${photo.location || 'Non précisé'}</span>
                    <span>Par ${photo.author_name}</span>
                    <span>${formattedDate}</span>
                </div>
            </div>
        `;
        
        photoCard.addEventListener('click', () => openPhotoView(photo.id));
        photoGrid.appendChild(photoCard);
    });
}

// Ouvrir la modale d'upload
function openUploadModal() {
    uploadModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Fermer la modale d'upload
function closeUploadModal() {
    uploadModal.style.display = 'none';
    document.body.style.overflow = '';
    photoUploadForm.reset();
    photoPreview.innerHTML = '';
    uploadProgress.style.display = 'none';
    progressBarFill.style.width = '0%';
}

// Prévisualiser l'image sélectionnée
function previewPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        alert('Veuillez sélectionner une image');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        photoPreview.innerHTML = `<img src="${e.target.result}" alt="Prévisualisation">`;
    };
    reader.readAsDataURL(file);
}

// Envoyer la photo
async function uploadPhoto(event) {
    event.preventDefault();
    
    const file = photoInput.files[0];
    if (!file) {
        alert('Veuillez sélectionner une image');
        return;
    }
    
    const title = document.getElementById('photoTitle').value;
    const description = document.getElementById('photoDescription').value;
    const location = document.getElementById('photoLocation').value;
    const authorName = document.getElementById('photographerName').value;
    
    uploadProgress.style.display = 'block';
    
    try {
        // Garder en mémoire le nom préféré de l'utilisateur
        localStorage.setItem('photographerName', authorName);
        
        // Générer un nom de fichier unique
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `photos/${fileName}`;
        
        // Uploader le fichier dans le bucket Storage
        const { data: fileData, error: fileError } = await supabase.storage
            .from('gallery')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
                onUploadProgress: (progress) => {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    progressBarFill.style.width = `${percent}%`;
                }
            });
        
        if (fileError) throw fileError;
        
        // Obtenir l'URL publique
        const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(filePath);
        const imageUrl = urlData.publicUrl;
        
        // Enregistrer les métadonnées dans la base de données
        const { data, error } = await supabase
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
        
        if (error) throw error;
        
        alert('Photo ajoutée avec succès!');
        closeUploadModal();
        
        // Recharger les photos pour afficher la nouvelle
        photoGrid.innerHTML = '';
        currentPage = 0;
        loadPhotos();
        
    } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
        alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
        uploadProgress.style.display = 'none';
    }
}

// Ouvrir la vue détaillée d'une photo
async function openPhotoView(photoId) {
    photoViewModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    currentPhotoId = photoId;
    
    try {
        // Charger les détails de la photo
        const { data: photo, error: photoError } = await supabase
            .from('photos')
            .select('*')
            .eq('id', photoId)
            .single();
        
        if (photoError) throw photoError;
        
        // Charger les commentaires
        loadPhotoComments(photoId);
        
        // Afficher les détails
        document.getElementById('modalPhotoImg').src = photo.image_url;
        document.getElementById('modalPhotoTitle').textContent = photo.title;
        document.getElementById('modalPhotoDescription').textContent = photo.description || 'Aucune description';
        document.getElementById('modalPhotoLocation').textContent = photo.location ? `📍 ${photo.location}` : '';
        
        const date = new Date(photo.created_at);
        document.getElementById('modalPhotoDate').textContent = `📅 ${date.toLocaleDateString('fr-FR')}`;
        document.getElementById('modalPhotoAuthor').textContent = `👤 ${photo.author_name}`;
        
        // Préremplir le nom du commentateur s'il existe
        const savedName = localStorage.getItem('commenterName');
        if (savedName) {
            document.getElementById('commentAuthor').value = savedName;
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement des détails:', error);
        alert('Impossible de charger les détails de la photo');
        closePhotoViewModal();
    }
}

// Fermer la vue détaillée
function closePhotoViewModal() {
    photoViewModal.style.display = 'none';
    document.body.style.overflow = '';
    currentPhotoId = null;
    document.getElementById('commentsContainer').innerHTML = '';
    commentForm.reset();
}

// Charger les commentaires d'une photo
async function loadPhotoComments(photoId) {
    const commentsContainer = document.getElementById('commentsContainer');
    commentsContainer.innerHTML = '<p>Chargement des commentaires...</p>';
    
    try {
        const { data: comments, error } = await supabase
            .from('photo_comments')
            .select('*')
            .eq('photo_id', photoId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (comments.length === 0) {
            commentsContainer.innerHTML = '<p>Aucun commentaire pour le moment. Soyez le premier à commenter!</p>';
            return;
        }
        
        commentsContainer.innerHTML = '';
        comments.forEach(comment => {
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
            commentElement.innerHTML = `
                <div class="comment-header">
                    <span class="comment-author">${comment.author_name}</span>
                    <span class="comment-date">${formattedDate}</span>
                </div>
                <div class="comment-text">${comment.comment_text}</div>
            `;
            
            commentsContainer.appendChild(commentElement);
        });
        
    } catch (error) {
        console.error('Erreur lors du chargement des commentaires:', error);
        commentsContainer.innerHTML = '<p>Impossible de charger les commentaires. Veuillez réessayer plus tard.</p>';
    }
}

// Soumettre un nouveau commentaire
async function submitComment(event) {
    event.preventDefault();
    
    if (!currentPhotoId) return;
    
    const authorInput = document.getElementById('commentAuthor');
    const textInput = document.getElementById('commentText');
    
    const author = authorInput.value.trim();
    const text = textInput.value.trim();
    
    if (!author || !text) {
        alert('Veuillez remplir tous les champs du commentaire');
        return;
    }
    
    // Sauvegarder le nom pour les futurs commentaires
    localStorage.setItem('commenterName', author);
    
    try {
        const { data, error } = await supabase
            .from('photo_comments')
            .insert([
                {
                    photo_id: currentPhotoId,
                    author_name: author,
                    comment_text: text
                }
            ]);
        
        if (error) throw error;
        
        // Réinitialiser le formulaire
        textInput.value = '';
        
        // Recharger les commentaires
        loadPhotoComments(currentPhotoId);
        
    } catch (error) {
        console.error('Erreur lors de l\'envoi du commentaire:', error);
        alert('Impossible d\'envoyer votre commentaire. Veuillez réessayer.');
    }
}

// Fonction utilitaire pour formater les dates
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Fonction de reporting pour le contenu inapproprié
async function reportContent(type, id) {
    if (!confirm("Souhaitez-vous signaler ce contenu comme inapproprié?")) return;
    
    try {
        const { data, error } = await supabase
            .from('content_reports')
            .insert([
                {
                    content_type: type, // 'photo' ou 'comment'
                    content_id: id,
                    status: 'pending'
                }
            ]);
        
        if (error) throw error;
        
        alert('Merci pour votre signalement. Notre équipe va examiner ce contenu.');
        
    } catch (error) {
        console.error('Erreur lors du signalement:', error);
        alert('Impossible de signaler ce contenu. Veuillez réessayer.');
    }
}

// Ajouter un menu contextuel pour signaler le contenu
function addContextMenu() {
    // Ajouter un gestionnaire de clic droit sur les photos
    photoGrid.addEventListener('contextmenu', function(e) {
        // Trouver l'élément photo-card parent
        const photoCard = e.target.closest('.photo-card');
        if (photoCard) {
            e.preventDefault();
            const photoId = photoCard.dataset.id;
            
            if (confirm("Signaler cette photo comme inappropriée?")) {
                reportContent('photo', photoId);
            }
        }
    });
    
    // Ajouter un gestionnaire de clic droit sur les commentaires
    document.addEventListener('contextmenu', function(e) {
        // Trouver l'élément comment parent
        const comment = e.target.closest('.comment');
        if (comment && comment.dataset.id) {
            e.preventDefault();
            const commentId = comment.dataset.id;
            
            if (confirm("Signaler ce commentaire comme inapproprié?")) {
                reportContent('comment', commentId);
            }
        }
    });
}

// Initialiser le menu contextuel
addContextMenu();

// Optimisations pour les appareils mobiles
function setupMobileOptimizations() {
    // Détecter les appareils iOS pour les correctifs spécifiques
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
        // Corriger les problèmes de position fixe sur iOS
        document.body.classList.add('ios-device');
        
        // Gérer les problèmes de sélection de fichier sur iOS
        photoInput.addEventListener('click', function(e) {
            // S'assurer que le clic est bien propagé sur iOS
            e.stopPropagation();
        });
    }
    
    // Ajout du support pour le glisser-déposer des images
    const dropArea = document.querySelector('.file-upload-area');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            photoInput.files = files;
            previewPhoto({ target: { files: files } });
        }
    }
}

// Initialiser les optimisations mobiles
setupMobileOptimizations();

// Gérer le scroll infini (alternative au bouton "Charger plus")
function setupInfiniteScroll() {
    let isLoading = false;
    
    window.addEventListener('scroll', function() {
        if (isLoading || !hasMorePhotos) return;
        
        const scrollPosition = window.innerHeight + window.scrollY;
        const bodyHeight = document.body.offsetHeight;
        
        // Charger plus de photos quand on arrive près du bas de la page
        if (scrollPosition >= bodyHeight - 500) {
            isLoading = true;
            
            loadPhotos(true).finally(() => {
                isLoading = false;
            });
        }
    });
}

// Activer le scroll infini (en option)
// setupInfiniteScroll();

// Compression des images avant upload pour améliorer les performances
async function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    
                    resolve(compressedFile);
                }, 'image/jpeg', 0.85); // Qualité de compression à 85%
            };
        };
    });
}

// Modifier la fonction d'upload pour utiliser la compression
async function uploadPhoto(event) {
    event.preventDefault();
    
    const file = photoInput.files[0];
    if (!file) {
        alert('Veuillez sélectionner une image');
        return;
    }
    
    const title = document.getElementById('photoTitle').value;
    const description = document.getElementById('photoDescription').value;
    const location = document.getElementById('photoLocation').value;
    const authorName = document.getElementById('photographerName').value;
    
    uploadProgress.style.display = 'block';
    
    try {
        // Compresser l'image avant upload
        const compressedFile = await compressImage(file);
        
        // Garder en mémoire le nom préféré de l'utilisateur
        localStorage.setItem('photographerName', authorName);
        
        // Générer un nom de fichier unique
        const fileExt = 'jpg'; // Toujours jpg après compression
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `photos/${fileName}`;
        
        // Uploader le fichier compressé
        const { data: fileData, error: fileError } = await supabase.storage
            .from('gallery')
            .upload(filePath, compressedFile, {
                cacheControl: '3600',
                upsert: false,
                onUploadProgress: (progress) => {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    progressBarFill.style.width = `${percent}%`;
                }
            });
        
        if (fileError) throw fileError;
        
        // Obtenir l'URL publique
        const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(filePath);
        const imageUrl = urlData.publicUrl;
        
        // Enregistrer les métadonnées dans la base de données
        const { data, error } = await supabase
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
        
        if (error) throw error;
        
        alert('Photo ajoutée avec succès!');
        closeUploadModal();
        
        // Recharger les photos pour afficher la nouvelle
        photoGrid.innerHTML = '';
        currentPage = 0;
        loadPhotos();
        
    } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
        alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
        uploadProgress.style.display = 'none';
    }
}