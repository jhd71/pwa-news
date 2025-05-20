// gallery-manager.js - Version corrigée
// Utiliser une variable globale pour éviter les redéclarations
window.galleryInitialized = window.galleryInitialized !== undefined ? window.galleryInitialized : false;

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
  
  // État de l'application
  let currentPhotoId = null;
  let currentPage = 0;
  const pageSize = 12;
  let hasMorePhotos = true;
  let isLoadingPhotos = false; // Nouvelle variable pour éviter les chargements multiples

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

// Utiliser une variable globale pour éviter les redéclarations
if (typeof window.galleryInitialized === 'undefined') {
  window.galleryInitialized = false;
}

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOMContentLoaded déclenché");
  if (!window.galleryInitialized) {
    initializeGallery();
    window.galleryInitialized = true;
  }
});

// Vérification supplémentaire
window.addEventListener('load', () => {
  console.log("Window load déclenché");
  if (!window.galleryInitialized) {
    console.log("Galerie non initialisée lors de window.load, tentative d'initialisation...");
    initializeGallery();
    window.galleryInitialized = true;
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
      
    // Configurer les événements avec des fonctions anonymes
if (uploadPhotoBtn) uploadPhotoBtn.addEventListener('click', function() { 
    if (typeof openUploadModal === 'function') openUploadModal(); 
    else console.error("Fonction openUploadModal non définie");
});

if (closeUploadModalBtn) closeUploadModalBtn.addEventListener('click', function() { 
    if (typeof closeUploadModal === 'function') closeUploadModal(); 
    else console.error("Fonction closeUploadModal non définie");
});

if (closePhotoViewBtn) closePhotoViewBtn.addEventListener('click', function() {
    if (typeof closePhotoViewModal === 'function') closePhotoViewModal();
    else console.error("Fonction closePhotoViewModal non définie");
});

if (loadMoreBtn) loadMoreBtn.addEventListener('click', function() {
    if (typeof loadMorePhotos === 'function') loadMorePhotos();
    else console.error("Fonction loadMorePhotos non définie");
});

if (photoInput) photoInput.addEventListener('change', function(event) {
    if (typeof previewPhoto === 'function') previewPhoto(event);
    else console.error("Fonction previewPhoto non définie");
});

if (photoUploadForm) photoUploadForm.addEventListener('submit', function(event) {
    if (typeof uploadPhoto === 'function') uploadPhoto(event);
    else console.error("Fonction uploadPhoto non définie");
});

if (commentForm) commentForm.addEventListener('submit', function(event) {
    if (typeof submitComment === 'function') submitComment(event);
    else console.error("Fonction submitComment non définie");
});
      
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
    // Optimisations pour les appareils mobiles - fonction temporaire
function setupMobileOptimizations() {
  console.log("Optimisations mobiles désactivées");
}
setupMobileOptimizations();
    
    // Fonction temporaire pour éviter l'erreur
function addContextMenu() {
  console.log("Menu contextuel désactivé");
}
    addContextMenu();
    
    // Initialiser les fonctionnalités d'administrateur
    setTimeout(() => {
		// Fonction temporaire pour éviter l'erreur
function renderAdminControls() {
    console.log("Contrôles admin désactivés");
}
      renderAdminControls();
    }, 1000); // Attendre que tout soit chargé
  }

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

// Version modifiée de la fonction uploadPhoto
async function uploadPhoto(event) {
    event.preventDefault();
    console.log("Début de la fonction uploadPhoto");
    
    // Vérifier que tous les éléments DOM nécessaires sont disponibles
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
        
        // Vérifier que supabase est bien défini
        if (!supabase) {
            console.error("Erreur: supabase n'est pas défini");
            throw new Error("Supabase n'est pas initialisé");
        }
        
        // Vérifier que storage est disponible
        if (!supabase.storage) {
            console.error("Erreur: supabase.storage n'est pas disponible");
            throw new Error("Storage Supabase non disponible");
        }
        
        // Uploader le fichier dans le bucket Storage avec un timeout plus long
        console.log("Début de l'upload du fichier...");
        const { data: fileData, error: fileError } = await supabase.storage
            .from('gallery')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
                onUploadProgress: (progress) => {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    console.log(`Upload: ${percent}%`);
                    if (progressBarFill) {
                        progressBarFill.style.width = `${percent}%`;
                    }
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
        
        // Fermer la modale d'upload
        if (uploadModal) {
            uploadModal.style.display = 'none';
            document.body.style.overflow = '';
        }
        
        // Réinitialiser le formulaire
        if (photoUploadForm) {
            photoUploadForm.reset();
        }
        
        // Vider la prévisualisation
        if (photoPreview) {
            photoPreview.innerHTML = '';
        }
        
        // Masquer la barre de progression
        if (uploadProgress) {
            uploadProgress.style.display = 'none';
            if (progressBarFill) {
                progressBarFill.style.width = '0%';
            }
        }
        
        // Recharger les photos pour afficher la nouvelle
        if (photoGrid) {
            photoGrid.innerHTML = '';
        }
        
        // Réinitialiser l'état et recharger les photos
        currentPage = 0;
        loadPhotos();
        
    } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
        alert(`Une erreur est survenue: ${error.message || 'Erreur inconnue'}. Veuillez réessayer.`);
        
        // Masquer la barre de progression en cas d'erreur
        if (uploadProgress) {
            uploadProgress.style.display = 'none';
        }
    }
}

// Fermer la modale d'upload
function closeUploadModal() {
    if (uploadModal) {
        uploadModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    // Réinitialiser le formulaire
    if (photoUploadForm) {
        photoUploadForm.reset();
    }
    
    // Vider la prévisualisation
    if (photoPreview) {
        photoPreview.innerHTML = '';
    }
    
    // Masquer la barre de progression
    if (uploadProgress) {
        uploadProgress.style.display = 'none';
        if (progressBarFill) {
            progressBarFill.style.width = '0%';
        }
    }
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
        if (photoPreview) {
            photoPreview.innerHTML = `<img src="${e.target.result}" alt="Prévisualisation" style="max-width: 100%; max-height: 200px;">`;
        }
    };
    reader.readAsDataURL(file);
}

// Ouvrir la vue détaillée d'une photo
async function openPhotoView(photoId) {
    console.log("Ouverture de la vue photo:", photoId);
    
    // Vérifier si la modale existe
    if (!document.getElementById('photoViewModal')) {
        console.error("Modal de vue photo non trouvée!");
        alert("Erreur: Impossible d'afficher la photo en détail");
        return;
    }
    
    // Afficher la modale
    document.getElementById('photoViewModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    currentPhotoId = photoId;
    
    try {
        // Charger les détails de la photo
        const { data: photo, error: photoError } = await supabase
            .from('photos')
            .select('*')
            .eq('id', photoId)
            .single();
        
        if (photoError) {
            console.error("Erreur requête photo:", photoError);
            throw photoError;
        }
        
        console.log("Données de la photo récupérées:", photo);
        
        // Mettre à jour les éléments de la modale
        const modalImg = document.getElementById('modalPhotoImg');
        if (modalImg) {
            modalImg.src = photo.image_url || '';
            modalImg.alt = photo.title || 'Photo';
            modalImg.onerror = function() {
                this.src = '/images/no-image.png';
                console.error("Erreur chargement image modale");
            };
        } else {
            console.error("Élément modalPhotoImg non trouvé");
        }
        
        // Mettre à jour les autres éléments s'ils existent
        document.getElementById('modalPhotoTitle')?.textContent = photo.title || 'Sans titre';
        document.getElementById('modalPhotoDescription')?.textContent = photo.description || 'Aucune description';
        
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
        
        // Charger les commentaires si la fonction existe
        if (typeof loadPhotoComments === 'function') {
            loadPhotoComments(photoId);
        }
        
    } catch (error) {
        console.error('Erreur chargement détails:', error);
        alert('Impossible de charger les détails de la photo');
    }
}

// Fermer la vue détaillée
function closePhotoViewModal() {
    if (photoViewModal) {
        photoViewModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    currentPhotoId = null;
}

  // Charger les photos - Fonction corrigée pour éviter les chargements multiples
  async function loadPhotos(isLoadMore = false) {
    console.log("Début de loadPhotos, isLoadMore:", isLoadMore);
    console.log("État actuel: currentPage =", currentPage, "hasMorePhotos =", hasMorePhotos);
      
    // Éviter les chargements simultanés
    if (isLoadingPhotos) {
      console.log("Chargement déjà en cours, opération annulée");
      return;
    }
      
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

    isLoadingPhotos = true; // Marquer le début du chargement

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
      isLoadingPhotos = false; // Marquer la fin du chargement
    }
  }

  // Charger plus de photos
  function loadMorePhotos() {
    if (hasMorePhotos && !isLoadingPhotos) {
      loadPhotos(true);
    }
  }

  // Afficher les photos dans la grille - Correction pour éviter les bugs d'images
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
        // Dans la fonction renderPhotos, modifiez la construction du HTML:
photoCard.innerHTML = `
  <div class="photo-img-container">
    <img class="photo-img" src="${photo.image_url || ''}" alt="${photo.title || 'Photo sans titre'}" 
         onerror="this.onerror=null; this.src='/images/no-image.png'; console.error('Erreur chargement image:', this.src);">
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
        photoCard.addEventListener('click', (e) => {
          // Ne pas ouvrir si le clic est sur le bouton de suppression
          if (e.target.closest('.delete-photo-btn')) {
            return;
          }
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
      
    console.log("Fin de renderPhotos, " + photoCards.length + " photos ajoutées au DOM");
   
  }

  // Fonction pour définir le mode administrateur (pour les tests)
  function setAdminMode(enable) {
    if (enable) {
      localStorage.setItem('isAdmin', 'true');
    } else {
      localStorage.removeItem('isAdmin');
    }
      
    // Rafraîchir les contrôles d'administration
    renderAdminControls();
  }

  // Fonctions supplémentaires (inchangées)...
  // [Insérer ici le reste des fonctions]

  // Ajouter le gestionnaire pour la touche secrète qui définit le mode admin
  document.addEventListener('keydown', function(e) {
    // Ctrl+Alt+A pour activer/désactiver le mode admin
    if (e.ctrlKey && e.altKey && e.key === 'a') {
      const isCurrentlyAdmin = localStorage.getItem('isAdmin') === 'true';
      setAdminMode(!isCurrentlyAdmin);
      alert(isCurrentlyAdmin ? 'Mode administrateur désactivé' : 'Mode administrateur activé');
    }
  });
  
  
// Ajouter le gestionnaire pour la touche secrète qui définit le mode admin
  document.addEventListener('keydown', function(e) {
    // Ctrl+Alt+A pour activer/désactiver le mode admin
    if (e.ctrlKey && e.altKey && e.key === 'a') {
      const isCurrentlyAdmin = localStorage.getItem('isAdmin') === 'true';
      setAdminMode(!isCurrentlyAdmin);
      alert(isCurrentlyAdmin ? 'Mode administrateur désactivé' : 'Mode administrateur activé');
    }
  });

  // Charger les commentaires d'une photo
  async function loadPhotoComments(photoId) {
    console.log("Chargement des commentaires pour la photo ID:", photoId);
    
    const commentsContainer = document.getElementById('commentsContainer');
    if (!commentsContainer) {
        console.error("Conteneur de commentaires non trouvé");
        return;
    }
    
    commentsContainer.innerHTML = '<p>Chargement des commentaires...</p>';
    
    try {
        const { data: comments, error } = await supabase
            .from('photo_comments')
            .select('*')
            .eq('photo_id', photoId)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error("Erreur de chargement des commentaires:", error);
            throw error;
        }
        
        if (!comments || comments.length === 0) {
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
            commentElement.dataset.id = comment.id;
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
      console.log("Tentative d'envoi de commentaire");
      
      if (!currentPhotoId) {
          console.error("ID de photo non défini");
          return;
      }
      
      const authorInput = document.getElementById('commentAuthor');
      const textInput = document.getElementById('commentText');
      
      if (!authorInput || !textInput) {
          console.error("Champs de commentaire non trouvés");
          return;
      }
      
      const author = authorInput.value.trim();
      const text = textInput.value.trim();
      
      if (!author || !text) {
          alert('Veuillez remplir tous les champs du commentaire');
          return;
      }
      
      console.log("Envoi d'un commentaire pour la photo:", currentPhotoId);
      console.log("Auteur:", author);
      console.log("Texte:", text);
      
      try {
          // Sauvegarder le nom pour les futurs commentaires
          localStorage.setItem('commenterName', author);
          
          // Insérer le commentaire
          const { data, error } = await supabase
              .from('photo_comments')
              .insert([
                  {
                      photo_id: currentPhotoId,
                      author_name: author,
                      comment_text: text
                  }
              ]);
          
          if (error) {
              console.error('Erreur lors de l\'envoi du commentaire:', error);
              throw error;
          }
          
          console.log("Commentaire enregistré:", data);
          
          // Réinitialiser le formulaire
          textInput.value = '';
          
          // Recharger les commentaires
          loadPhotoComments(currentPhotoId);
          
          alert('Commentaire ajouté avec succès!');
          
      } catch (error) {
          console.error('Erreur lors de l\'envoi du commentaire:', error);
          alert('Impossible d\'envoyer votre commentaire: ' + error.message);
      }
  }
  
}, 100);

// Fin du fichier - ajouter un console.log pour confirmer
console.log('Fin du fichier gallery-manager.js atteinte correctement');