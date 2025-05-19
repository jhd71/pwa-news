// gallery-manager.js - Début du fichier
// Attendre un bref instant pour s'assurer que tout est bien chargé
setTimeout(() => {
  // Vérifier si l'instance Supabase est disponible globalement
  let supabase;
  
  if (window.supabaseInstance) {
    // Utiliser l'instance créée directement
    supabase = window.supabaseInstance;
    console.log("Utilisation de l'instance Supabase globale");
  } else if (typeof window.getSupabaseClient === 'function') {
    // Utiliser la fonction getSupabaseClient
    supabase = window.getSupabaseClient();
    if (!supabase) {
      console.error("getSupabaseClient a retourné null ou undefined");
    } else {
      console.log("Instance Supabase récupérée via getSupabaseClient");
    }
  } else {
    console.error("Aucune méthode disponible pour obtenir l'instance Supabase");
  }
  
  // Si l'instance n'est pas disponible, créer une version factice
  if (!supabase) {
    console.error("Impossible d'obtenir une instance Supabase, utilisation d'une version factice");
    // Créer un objet factice pour éviter les erreurs
    supabase = {
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
    
    // Afficher un message d'erreur utilisateur
    window.addEventListener('DOMContentLoaded', function() {
      const container = document.querySelector('.gallery-main') || document.body;
      const errorMessage = document.createElement('div');
      errorMessage.style.cssText = 'background-color: #d32f2f; color: white; padding: 20px; margin: 20px; border-radius: 8px; text-align: center;';
      errorMessage.innerHTML = `
        <h3>Erreur de connexion à la base de données</h3>
        <p>Impossible de se connecter au service de galerie photos.</p>
        <button onclick="location.reload()" style="background: white; color: #d32f2f; border: none; padding: 8px 16px; margin-top: 10px; border-radius: 4px; cursor: pointer;">Rafraîchir la page</button>
      `;
      container.prepend(errorMessage);
    });
  }
  
  // Continuez avec le reste du code
  // État de l'application
  let currentPhotoId = null;
  let currentPage = 0;
  const pageSize = 12;
  let hasMorePhotos = true;

// Déclarer les variables d'éléments DOM au niveau global
let photoGrid;
let uploadModal;
let photoViewModal;
let uploadPhotoBtn;
let closeUploadModalBtn;
let closePhotoViewBtn;
let photoUploadForm;
let photoInput;
let photoPreview;
let loadingIndicator;
let noPhotosMessage;
let loadMoreBtn;
let uploadProgress;
let progressBarFill;
let commentForm;

// Attendre que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser la galerie
    initializeGallery();
});

// Fonction d'initialisation de la galerie
function initializeGallery() {
    // Initialiser les éléments DOM
    photoGrid = document.getElementById('photoGrid');
    uploadModal = document.getElementById('uploadModal');
    photoViewModal = document.getElementById('photoViewModal');
    uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
    closeUploadModalBtn = document.getElementById('closeUploadModal');
    closePhotoViewBtn = document.getElementById('closePhotoView');
    photoUploadForm = document.getElementById('photoUploadForm');
    photoInput = document.getElementById('photoInput');
    photoPreview = document.getElementById('photoPreview');
    loadingIndicator = document.getElementById('loadingIndicator');
    noPhotosMessage = document.getElementById('noPhotosMessage');
    loadMoreBtn = document.getElementById('loadMoreBtn');
    uploadProgress = document.getElementById('uploadProgress');
    progressBarFill = document.querySelector('.progress-bar-fill');
    commentForm = document.getElementById('commentForm');
    
    // Vérifier si tous les éléments nécessaires sont disponibles
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
    
    // Optimisations pour les appareils mobiles
    setupMobileOptimizations();
	 // Initialiser le menu contextuel après tout le reste
    addContextMenu();
}

// Charger les photos
async function loadPhotos(isLoadMore = false) {
    console.log("Début de loadPhotos, supabase disponible:", !!supabase);
    
    if (!supabase) {
        console.error('Erreur: Supabase n\'est pas initialisé');
        loadingIndicator.style.display = 'none';
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.innerHTML = `
            <div style="color: #d32f2f; text-align: center; padding: 20px;">
                <p><strong>Erreur de connexion à la base de données</strong></p>
                <p>Impossible de charger les photos. Veuillez rafraîchir la page ou réessayer plus tard.</p>
                <button onclick="location.reload()" style="padding: 8px 16px; background: #d32f2f; color: white; border: none; border-radius: 4px; margin-top: 10px;">Rafraîchir</button>
            </div>
        `;
        photoGrid.appendChild(errorMessage);
        return;
    }

    if (!isLoadMore) {
        loadingIndicator.style.display = 'flex';
        photoGrid.innerHTML = '';
        currentPage = 0;
    }
    
    try {
        console.log("Tentative de chargement des photos...");
        const from = currentPage * pageSize;
        const to = from + pageSize - 1;
        
        console.log(`Requête Supabase: from=${from}, to=${to}`);
        
        let { data: photos, error } = await supabase
            .from('photos')
            .select('*')
            .order('created_at', { ascending: false })
            .range(from, to);
        
        console.log("Réponse Supabase:", { photos, error });
        
        if (error) {
            console.error("Erreur Supabase:", error);
            throw error;
        }
        
        if (photos && photos.length > 0) {
            console.log(`${photos.length} photos récupérées:`, photos);
            renderPhotos(photos);
        } else {
            console.log("Aucune photo trouvée");
            noPhotosMessage.style.display = 'block';
        }
        
        if (photos && photos.length < pageSize) {
            hasMorePhotos = false;
            loadMoreBtn.style.display = 'none';
        } else {
            hasMorePhotos = true;
            loadMoreBtn.style.display = 'block';
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
    console.log("Début de renderPhotos avec", photos.length, "photos");
    
    if (!photos || photos.length === 0) {
        console.log("Aucune photo à afficher");
        return;
    }
    
    photos.forEach(photo => {
        // Ajouter cette vérification
        if (!photo || !photo.id) {
            console.error("Photo invalide:", photo);
            return;
        }
        
        console.log("Rendu de la photo:", photo);
        
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
    // S'assurer que photoGrid existe avant d'ajouter des gestionnaires d'événements
    if (!photoGrid) {
        console.error('photoGrid non disponible pour addContextMenu');
        return;
    }
    
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

// Fermeture du setTimeout - cette accolade manquait
}, 100);

// Fin du fichier - ajouter un console.log pour confirmer
console.log('Fin du fichier gallery-manager.js atteinte correctement');

// Ajoutez ce code temporairement à la fin de votre fichier gallery-manager.js pour tester directement
setTimeout(async () => {
  try {
    console.log("Test direct de la connexion Supabase:");
    const { data, error } = await supabase.from('photos').select('count');
    console.log("Résultat du comptage:", data, error);
    
    // Essayez aussi une requête simple
    const { data: testData, error: testError } = await supabase
      .from('photos')
      .select('id, title')
      .limit(1);
    console.log("Résultat du test:", testData, testError);
    
  } catch (err) {
    console.error("Erreur lors du test Supabase:", err);
  }
}, 2000);