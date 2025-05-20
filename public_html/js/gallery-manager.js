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
    setupMobileOptimizations();
    
    // Initialiser le menu contextuel après tout le reste
    addContextMenu();
    
    // Initialiser les fonctionnalités d'administrateur
    setTimeout(() => {
      renderAdminControls();
    }, 1000); // Attendre que tout soit chargé
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
        photoCard.innerHTML = `
          <div class="photo-img-container">
            <img class="photo-img" src="${photo.image_url || ''}" alt="${photo.title || 'Photo sans titre'}" 
                 onerror="this.src='/images/no-image.png'; this.onerror=null;">
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
      
    // Après avoir rendu toutes les photos, ajouter les contrôles admin si nécessaire
    renderAdminControls();
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
  
}, 100);

// Fin du fichier - ajouter un console.log pour confirmer
console.log('Fin du fichier gallery-manager.js atteinte correctement');