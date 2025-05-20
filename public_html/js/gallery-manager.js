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
console.log("Script gallery-manager.js chargé");

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded déclenché");
    initializeGallery();
});

// Vérification supplémentaire
window.addEventListener('load', () => {
    console.log("Window load déclenché");
    if (!photoGrid) {
        console.log("photoGrid non initialisé lors de window.load, tentative d'initialisation...");
        initializeGallery();
    }
});

// Fonction d'initialisation de la galerie
function initializeGallery() {
	console.log("Début de initializeGallery");
    // Initialiser les éléments DOM
    photoGrid = document.getElementById('photoGrid');
	console.log("photoGrid trouvé:", !!photoGrid);
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
	// Initialiser les fonctionnalités d'administrateur
    setTimeout(() => {
        renderAdminControls();
    }, 1000); // Attendre que tout soit chargé
}

// Charger les photos
async function loadPhotos(isLoadMore = false) {
    console.log("Début de loadPhotos, isLoadMore:", isLoadMore);
    console.log("État actuel: currentPage =", currentPage, "hasMorePhotos =", hasMorePhotos);
    
    // Vérifications
    if (!photoGrid) {
        console.error("photoGrid n'est pas initialisé!");
        return;
    }
    
    if (!loadingIndicator) {
        console.error("loadingIndicator n'est pas initialisé!");
        return;
    }
    
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
        console.log("Réinitialisation de l'affichage (nouveau chargement)");
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
        
        console.log("Réponse Supabase:", photos ? photos.length : 0, "photos,", error ? "avec erreur" : "sans erreur");
        if (photos && photos.length > 0) {
            console.log("Première photo:", photos[0]);
        }
        
        if (error) {
            console.error("Erreur Supabase:", error);
            throw error;
        }
        
        // Aucune photo trouvée
        if (!photos || photos.length === 0) {
            console.log("Aucune photo trouvée dans la base de données");
            if (noPhotosMessage) {
                noPhotosMessage.style.display = 'block';
            }
            hasMorePhotos = false;
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }
        } else {
            // Des photos ont été trouvées
            console.log(`${photos.length} photos récupérées`);
            if (noPhotosMessage) {
                noPhotosMessage.style.display = 'none';
            }
            
            // Rendu des photos
            renderPhotos(photos);
            
            // Mise à jour de la pagination
            if (photos.length < pageSize) {
                hasMorePhotos = false;
                if (loadMoreBtn) {
                    loadMoreBtn.style.display = 'none';
                }
            } else {
                hasMorePhotos = true;
                if (loadMoreBtn) {
                    loadMoreBtn.style.display = 'block';
                }
            }
            
            currentPage++;
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
        console.log("Fin de loadPhotos");
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
        if (noPhotosMessage) {
            noPhotosMessage.style.display = 'block';
        }
        return;
    }
    
    // Masquer le message "pas de photos" puisqu'on en a
    if (noPhotosMessage) {
        noPhotosMessage.style.display = 'none';
    }
    
    // Déterminer si l'utilisateur est admin (de manière asynchrone)
    let photoCards = []; // Pour stocker les cartes créées
    
    photos.forEach(photo => {
        try {
            console.log("Traitement de la photo:", photo);
            
            // Vérifier que la photo a les propriétés nécessaires
            if (!photo || !photo.id) {
                console.error("Photo invalide (pas d'ID):", photo);
                return;
            }
            
            const photoCard = document.createElement('div');
            photoCard.className = 'photo-card';
            photoCard.dataset.id = photo.id;
            photoCard.style.position = 'relative'; // Pour le positionnement absolu du bouton
            
            // Vérifier la date
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
            
            // Construction du HTML avec image de secours locale
            photoCard.innerHTML = `
                <div class="photo-img-container">
                    <img class="photo-img" src="${photo.image_url || ''}" alt="${photo.title || 'Photo sans titre'}" 
                         onerror="this.src='images/no-image.png'; this.onerror=null;">
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
            
            // Ajouter l'événement de clic
            photoCard.addEventListener('click', () => {
                console.log("Clic sur la photo ID:", photo.id);
                openPhotoView(photo.id);
            });
            
            // Ajouter au DOM
            photoGrid.appendChild(photoCard);
            photoCards.push(photoCard); // Stocker pour ajouter les contrôles admin plus tard
            console.log("Photo ajoutée au DOM:", photo.id);
            
        } catch (error) {
            console.error("Erreur lors du rendu de la photo:", error, photo);
        }
    });
    
    console.log("Fin de renderPhotos, " + photoGrid.children.length + " photos ajoutées au DOM");
    
    // Après avoir rendu toutes les photos, ajouter les contrôles admin si nécessaire
    renderAdminControls();
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

// Version modifiée de la fonction uploadPhoto
async function uploadPhoto(event) {
    event.preventDefault();
    console.log("Début de la fonction uploadPhoto");
    
    // Vérifier que tous les éléments DOM nécessaires sont disponibles
    if (!photoInput || !progressBarFill) {
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
    
    const title = document.getElementById('photoTitle').value;
    const description = document.getElementById('photoDescription').value;
    const location = document.getElementById('photoLocation').value;
    const authorName = document.getElementById('photographerName').value;
    
    console.log("Données du formulaire:", { title, description, location, authorName });
    
    uploadProgress.style.display = 'block';
    
    try {
        // Garder en mémoire le nom préféré de l'utilisateur
        localStorage.setItem('photographerName', authorName);
        
        // Générer un nom de fichier unique
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `photos/${fileName}`;
        
        console.log("Tentative d'upload du fichier vers:", filePath);
        
        // Uploader le fichier dans le bucket Storage
        const { data: fileData, error: fileError } = await supabase.storage
            .from('gallery')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
                onUploadProgress: (progress) => {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    console.log(`Upload: ${percent}%`);
                    progressBarFill.style.width = `${percent}%`;
                }
            });
        
        if (fileError) {
            console.error("Erreur d'upload du fichier:", fileError);
            throw fileError;
        }
        
        console.log("Fichier uploadé avec succès:", fileData);
        
        // Obtenir l'URL publique
        const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(filePath);
        const imageUrl = urlData.publicUrl;
        
        console.log("URL publique générée:", imageUrl);
        
        // Enregistrer les métadonnées dans la base de données
        console.log("Tentative d'insertion dans la table photos");
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
        
        if (error) {
            console.error("Erreur d'insertion dans la table photos:", error);
            throw error;
        }
        
        console.log("Données insérées avec succès:", data);
        
        alert('Photo ajoutée avec succès!');
        closeUploadModal();
        
        // Recharger les photos pour afficher la nouvelle
        photoGrid.innerHTML = '';
        currentPage = 0;
        loadPhotos();
        
    } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
        alert(`Une erreur est survenue: ${error.message || 'Erreur inconnue'}. Veuillez réessayer.`);
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
// Test de connexion Supabase (conserver cette partie, elle est utile)
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

// Nouveau code pour forcer le chargement des photos
setTimeout(() => {
    console.log("Forçage du chargement des photos après 3 secondes...");
    
    // S'assurer que les éléments DOM sont initialisés
    if (!photoGrid) {
        photoGrid = document.getElementById('photoGrid');
        console.log("PhotoGrid initialisé:", !!photoGrid);
    }
    
    if (!loadingIndicator) {
        loadingIndicator = document.getElementById('loadingIndicator');
        console.log("LoadingIndicator initialisé:", !!loadingIndicator);
    }
    
    if (!noPhotosMessage) {
        noPhotosMessage = document.getElementById('noPhotosMessage');
        console.log("NoPhotosMessage initialisé:", !!noPhotosMessage);
    }
    
    // Réinitialiser l'état
    currentPage = 0;
    
    // Appeler loadPhotos
    loadPhotos(false);
    
}, 3000);

// [tout le code existant...]

// Ajouter cette fonction pour gérer la suppression des photos
async function deletePhoto(photoId) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette photo ?")) {
        return;
    }
    
    try {
        console.log("Tentative de suppression de la photo ID:", photoId);
        
        // D'abord, récupérer les détails de la photo pour avoir le chemin du fichier
        const { data: photo, error: fetchError } = await supabase
            .from('photos')
            .select('file_path')
            .eq('id', photoId)
            .single();
        
        if (fetchError) {
            console.error("Erreur lors de la récupération des détails de la photo:", fetchError);
            throw fetchError;
        }
        
        if (!photo || !photo.file_path) {
            console.error("Chemin de fichier non disponible pour la photo ID:", photoId);
            throw new Error("Informations de fichier manquantes");
        }
        
        // Supprimer le fichier du storage
        const { error: storageError } = await supabase.storage
            .from('gallery')
            .remove([photo.file_path]);
        
        if (storageError) {
            console.error("Erreur lors de la suppression du fichier:", storageError);
            // Continuer même si la suppression du fichier échoue
            console.warn("Tentative de suppression de l'entrée de base de données malgré l'échec de la suppression du fichier");
        }
        
        // Supprimer l'entrée de la base de données
        const { error: dbError } = await supabase
            .from('photos')
            .delete()
            .eq('id', photoId);
        
        if (dbError) {
            console.error("Erreur lors de la suppression de l'entrée de base de données:", dbError);
            throw dbError;
        }
        
        console.log("Photo supprimée avec succès:", photoId);
        alert("Photo supprimée avec succès");
        
        // Recharger la galerie
        photoGrid.innerHTML = '';
        currentPage = 0;
        loadPhotos();
        
    } catch (error) {
        console.error("Erreur lors de la suppression de la photo:", error);
        alert("Erreur lors de la suppression de la photo: " + (error.message || "Erreur inconnue"));
    }
}

// Vérifier si l'utilisateur est administrateur en utilisant la session actuelle
async function checkIfUserIsAdmin() {
    // Vérifier si l'utilisateur est admin dans le chat
    const isChatAdmin = localStorage.getItem('chatAdmin') === 'true' || 
                        sessionStorage.getItem('chatAdmin') === 'true';
    
    // Vous pouvez également vérifier d'autres indicateurs d'admin
    const isLocalAdmin = localStorage.getItem('isAdmin') === 'true';
    
    // Vérifier la session Supabase (si vous utilisez l'authentification Supabase)
    let isSupabaseAdmin = false;
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!error && session && session.user) {
            isSupabaseAdmin = session.user?.app_metadata?.role === 'admin' || 
                             session.user?.user_metadata?.is_admin === true;
        }
    } catch (e) {
        console.error("Erreur lors de la vérification de la session Supabase:", e);
    }
    
    // Test pour le débogage
    console.log("Statut admin:", { isChatAdmin, isLocalAdmin, isSupabaseAdmin });
    
    // L'utilisateur est admin si l'une des conditions est vraie
    return isChatAdmin || isLocalAdmin || isSupabaseAdmin;
}

// Initialiser les contrôles d'administration
function renderAdminControls() {
    // Vérifier si l'utilisateur est administrateur
    checkIfUserIsAdmin().then(isAdmin => {
        console.log("Mode administrateur:", isAdmin);
        
        // Ajouter des boutons de suppression aux photos existantes si l'utilisateur est admin
        if (isAdmin) {
            const photoCards = document.querySelectorAll('.photo-card');
            photoCards.forEach(card => {
                const photoId = card.dataset.id;
                
                // Ne pas ajouter le bouton s'il existe déjà
                if (card.querySelector('.delete-photo-btn')) {
                    return;
                }
                
                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-photo-btn';
                deleteButton.innerHTML = '<i class="material-icons">delete</i>';
                deleteButton.style.cssText = `
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: rgba(255,0,0,0.7);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                `;
                
                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Empêcher l'ouverture de la vue détaillée
                    deletePhoto(photoId);
                });
                
                card.style.position = 'relative'; // Pour le positionnement absolu du bouton
                card.appendChild(deleteButton);
            });
            
            // Ajouter un indicateur visuel du mode admin
            let adminIndicator = document.getElementById('adminModeIndicator');
            if (!adminIndicator) {
                adminIndicator = document.createElement('div');
                adminIndicator.id = 'adminModeIndicator';
                adminIndicator.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: rgba(0,0,0,0.7);
                    color: white;
                    padding: 8px 15px;
                    border-radius: 20px;
                    font-size: 14px;
                    z-index: 1000;
                `;
                adminIndicator.innerHTML = 'Mode Admin Actif';
                document.body.appendChild(adminIndicator);
            }
        }
    });
}

// Fonction pour définir le mode administrateur (pour les tests)
function setAdminMode(enable) {
    if (enable) {
        localStorage.setItem('adminCode', 'photo123');
    } else {
        localStorage.removeItem('adminCode');
    }
    
    // Rafraîchir les contrôles d'administration
    renderAdminControls();
    
    // Recharger la galerie pour afficher/masquer les boutons de suppression
    photoGrid.innerHTML = '';
    currentPage = 0;
    loadPhotos();
}

// Ajouter un gestionnaire de clavier pour activer/désactiver le mode admin avec un code secret
document.addEventListener('keydown', function(e) {
    // Ctrl+Alt+A pour activer/désactiver le mode admin
    if (e.ctrlKey && e.altKey && e.key === 'a') {
        const isCurrentlyAdmin = localStorage.getItem('adminCode') === 'photo123';
        setAdminMode(!isCurrentlyAdmin);
        alert(isCurrentlyAdmin ? 'Mode administrateur désactivé' : 'Mode administrateur activé');
    }
});

// Appeler cette fonction après le chargement des photos
setTimeout(() => {
    renderAdminControls();
}, 1500);

// Fermeture du setTimeout - cette accolade manquait
}, 100);

// Fin du fichier - ajouter un console.log pour confirmer
console.log('Fin du fichier gallery-manager.js atteinte correctement');


