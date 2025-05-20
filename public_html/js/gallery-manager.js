// gallery-manager.js - Version améliorée (PARTIE 1)
// Définition de toutes les fonctions en premier

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

// Fermer la vue détaillée
function closePhotoViewModal() {
    const photoViewModal = document.getElementById('photoViewModal');
    if (photoViewModal) {
        photoViewModal.style.display = 'none';
        document.body.style.overflow = '';
    }
    window.currentPhotoId = null;
}

// Charger plus de photos
function loadMorePhotos() {
    if (window.hasMorePhotos && !window.isLoadingPhotos) {
        loadPhotos(true);
    }
}

// Fonction de compatibilité - ne fait rien
function previewPhoto(event) {
    console.log("previewPhoto appelée - ne fait rien car utilise la méthode directe");
}

// Version corrigée de la fonction patchUploadPhoto
function patchUploadPhoto() {
    console.log("Modification de la fonction uploadPhoto pour utiliser base64");
    
    // Complètement remplacer la fonction uploadPhoto
    window.uploadPhoto = async function(event) {
        event.preventDefault();
        console.log("Fonction uploadPhoto modifiée appelée");
        
        // Récupérer les données du formulaire
        const photoBase64 = document.getElementById('photoBase64');
        const titleInput = document.getElementById('photoTitle');
        const descriptionInput = document.getElementById('photoDescription');
        const locationInput = document.getElementById('photoLocation');
        const authorNameInput = document.getElementById('photographerName');
        const uploadProgress = document.getElementById('uploadProgress');
        const progressBarFill = document.querySelector('.progress-bar-fill');
        
        // Vérifier les éléments essentiels
        if (!photoBase64 || !photoBase64.value) {
            alert('Veuillez sélectionner une image');
            return;
        }
        
        if (!titleInput || !authorNameInput) {
            console.error("Éléments de formulaire manquants");
            alert('Erreur: formulaire incomplet. Veuillez rafraîchir la page.');
            return;
        }
        
        // Récupérer les valeurs
        const title = titleInput.value || 'Sans titre';
        const description = descriptionInput ? descriptionInput.value || '' : '';
        const location = locationInput ? locationInput.value || '' : '';
        const authorName = authorNameInput.value || 'Anonyme';
        
        console.log("Données formulaire:", { title, authorName });
        
        // Afficher la barre de progression
        if (uploadProgress) {
            uploadProgress.style.display = 'block';
        }
        
        try {
            // Sauvegarder le nom pour les futurs uploads
            localStorage.setItem('photographerName', authorName);
            
            // Convertir la base64 en blob
            const base64Data = photoBase64.value.split(',')[1];
            const mimeType = photoBase64.value.split(',')[0].split(':')[1].split(';')[0];
            const byteCharacters = atob(base64Data);
            const byteArrays = [];
            
            for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                const slice = byteCharacters.slice(offset, offset + 512);
                const byteNumbers = new Array(slice.length);
                
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                
                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }
            
            // Créer un blob à partir des données
            const blob = new Blob(byteArrays, { type: mimeType });
            
            // Créer un fichier à partir du blob
            const fileName = Date.now() + '.jpg';
            const file = new File([blob], fileName, { type: mimeType });
            
            // Générer un nom de fichier unique
            const fileExt = file.name.split('.').pop();
            const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `photos/${uniqueFileName}`;
            
            console.log("Tentative d'upload vers:", filePath);
            
            // Vérifier que Supabase est disponible
            if (!window.supabase || !window.supabase.storage) {
                console.error("Supabase ou Supabase Storage n'est pas disponible");
                throw new Error("Service de stockage non disponible");
            }
            
            // Upload du fichier dans Supabase
            const { data: fileData, error: fileError } = await window.supabase.storage
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
            
            console.log("Fichier uploadé avec succès");
            
            // Obtenir l'URL publique
            const { data: urlData } = window.supabase.storage.from('gallery').getPublicUrl(filePath);
            const imageUrl = urlData.publicUrl;
            
            console.log("URL publique:", imageUrl);
            
            // Enregistrer les métadonnées
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
                console.error("Erreur d'insertion dans la table photos:", error);
                throw error;
            }
            
            console.log("Métadonnées enregistrées avec succès");
            
            alert('Photo ajoutée avec succès!');
            
            // Fermer la modale
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
            
            // Réinitialiser la valeur base64
            photoBase64.value = '';
            
            // Masquer la barre de progression
            if (uploadProgress) {
                uploadProgress.style.display = 'none';
                if (progressBarFill) {
                    progressBarFill.style.width = '0%';
                }
            }
            
            // Recharger les photos
            const photoGrid = document.getElementById('photoGrid');
            if (photoGrid) {
                photoGrid.innerHTML = '';
            }
            
            window.currentPage = 0;
            window.loadPhotos();
            
        } catch (error) {
            console.error('Erreur lors de l\'upload:', error);
            alert(`Une erreur est survenue: ${error.message || 'Erreur inconnue'}. Veuillez réessayer.`);
            
            // Masquer la barre de progression
            if (uploadProgress) {
                uploadProgress.style.display = 'none';
            }
        }
    };
    
    console.log("Fonction uploadPhoto remplacée avec succès");
}

// Fonction pour initialiser à la fois la capture et patcher uploadPhoto
// Solution complète pour la capture photo et l'upload
// Copiez tout ce bloc de code et placez-le dans votre fichier gallery-manager.js

// Fonction pour initialiser le système d'upload de photos
function initPhotoSystem() {
    console.log("Initialisation du système de photos intégré");
    
    // Référence aux éléments DOM
    const captureBtn = document.getElementById('captureBtn');
    const galleryBtn = document.getElementById('galleryBtn');
    const photoPreview = document.getElementById('photoPreview');
    const photoBase64 = document.getElementById('photoBase64');
    const submitPhotoBtn = document.getElementById('submitPhotoBtn');
    
    // Vérifier que les éléments essentiels existent
    if (!captureBtn || !galleryBtn || !photoPreview || !photoBase64 || !submitPhotoBtn) {
        console.error("Éléments essentiels manquants pour le système d'upload");
        return;
    }
    
    console.log("Tous les éléments trouvés, initialisation...");
    
    // Fonction pour créer un input temporaire
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
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const base64Image = e.target.result;
                photoBase64.value = base64Image;
                
                photoPreview.innerHTML = '';
                const img = document.createElement('img');
                img.src = base64Image;
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
    
    // Gestionnaire pour le bouton appareil photo
    captureBtn.addEventListener('click', function() {
        console.log("Clic sur le bouton appareil photo");
        const input = createTemporaryInput(true);
        document.body.appendChild(input);
        input.click();
    });
    
    // Gestionnaire pour le bouton galerie
    galleryBtn.addEventListener('click', function() {
        console.log("Clic sur le bouton galerie");
        const input = createTemporaryInput(false);
        document.body.appendChild(input);
        input.click();
    });
    
    // Gestionnaire pour le bouton de soumission
    submitPhotoBtn.addEventListener('click', function() {
        console.log("Clic sur le bouton de soumission");
        uploadPhotoDirectly();
    });
    
    // Fonction d'upload directe
    async function uploadPhotoDirectly() {
        console.log("Début de l'upload direct");
        
        // Vérifier la présence de l'image
        if (!photoBase64.value) {
            alert('Veuillez sélectionner une image');
            return;
        }
        
        // Référence aux éléments du formulaire
        const titleInput = document.getElementById('photoTitle');
        const descriptionInput = document.getElementById('photoDescription');
        const locationInput = document.getElementById('photoLocation');
        const authorNameInput = document.getElementById('photographerName');
        const uploadProgress = document.getElementById('uploadProgress');
        const progressBarFill = document.querySelector('.progress-bar-fill');
        const uploadModal = document.getElementById('uploadModal');
        const photoUploadForm = document.getElementById('photoUploadForm');
        
        // Vérifier les éléments essentiels
        if (!titleInput || !authorNameInput) {
            console.error("Éléments de formulaire manquants");
            alert('Erreur: formulaire incomplet. Veuillez rafraîchir la page.');
            return;
        }
        
        // Récupérer les valeurs
        const title = titleInput.value || 'Sans titre';
        const description = descriptionInput ? descriptionInput.value || '' : '';
        const location = locationInput ? locationInput.value || '' : '';
        const authorName = authorNameInput.value || 'Anonyme';
        
        console.log("Données formulaire:", { title, authorName });
        
        // Afficher la progression
        if (uploadProgress) {
            uploadProgress.style.display = 'block';
        }
        
        try {
            // Sauvegarder le nom d'auteur
            localStorage.setItem('photographerName', authorName);
            
            // Convertir base64 en blob
            const base64Data = photoBase64.value.split(',')[1];
            const mimeType = photoBase64.value.split(',')[0].split(':')[1].split(';')[0];
            const byteCharacters = atob(base64Data);
            const byteArrays = [];
            
            for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                const slice = byteCharacters.slice(offset, offset + 512);
                const byteNumbers = new Array(slice.length);
                
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                
                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }
            
            const blob = new Blob(byteArrays, { type: mimeType });
            const fileName = Date.now() + '.jpg';
            const file = new File([blob], fileName, { type: mimeType });
            
            // Générer un nom de fichier unique
            const fileExt = file.name.split('.').pop();
            const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `photos/${uniqueFileName}`;
            
            console.log("Tentative d'upload vers:", filePath);
            
            // Vérifier Supabase
            if (!window.supabase || !window.supabase.storage) {
                console.error("Supabase ou Storage non disponible");
                throw new Error("Service de stockage non disponible");
            }
            
            // Upload du fichier
            const { data: fileData, error: fileError } = await window.supabase.storage
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
            
            console.log("Fichier uploadé avec succès");
            
            // Obtenir l'URL publique
            const { data: urlData } = window.supabase.storage.from('gallery').getPublicUrl(filePath);
            const imageUrl = urlData.publicUrl;
            
            console.log("URL publique:", imageUrl);
            
            // Enregistrer les métadonnées
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
                console.error("Erreur d'insertion dans la table photos:", error);
                throw error;
            }
            
            console.log("Métadonnées enregistrées avec succès");
            
            alert('Photo ajoutée avec succès!');
            
            // Fermer la modale
            if (uploadModal) {
                uploadModal.style.display = 'none';
                document.body.style.overflow = '';
            }
            
            // Réinitialiser le formulaire
            if (photoUploadForm) {
                photoUploadForm.reset();
            }
            
            // Vider la prévisualisation
            photoPreview.innerHTML = '';
            photoBase64.value = '';
            
            // Masquer la progression
            if (uploadProgress) {
                uploadProgress.style.display = 'none';
                if (progressBarFill) {
                    progressBarFill.style.width = '0%';
                }
            }
            
            // Recharger les photos
            const photoGrid = document.getElementById('photoGrid');
            if (photoGrid) {
                photoGrid.innerHTML = '';
            }
            
            window.currentPage = 0;
            window.loadPhotos();
            
        } catch (error) {
            console.error('Erreur lors de l\'upload:', error);
            alert(`Une erreur est survenue: ${error.message || 'Erreur inconnue'}. Veuillez réessayer.`);
            
            if (uploadProgress) {
                uploadProgress.style.display = 'none';
            }
        }
    }
}

// Fonction pour remplacer la fonction existante
function previewPhoto(event) {
    // Cette fonction est maintenant gérée par l'événement 'change' dans initCameraCapture
    // On garde cette version simplifiée pour maintenir la compatibilité avec le code existant
    console.log("Fonction previewPhoto appelée - utilisant l'événement change interne");
    
    // Obtenir l'élément input
    const photoInput = document.getElementById('photoInput');
    
    // Vérifier si l'input existe et a un gestionnaire d'événements change
    if (photoInput && typeof event === 'object' && event.target && event.target.files) {
        // Déclencher manuellement l'événement change sur l'input
        // Cela permet de réutiliser la logique définie dans initCameraCapture
        const newEvent = new Event('change', { bubbles: true });
        Object.defineProperty(newEvent, 'target', { value: event.target });
        photoInput.dispatchEvent(newEvent);
    } else {
        // Si l'input n'existe pas ou s'il n'y a pas de gestionnaire,
        // utiliser l'ancienne logique comme fallback
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            alert('Veuillez sélectionner une image');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const photoPreview = document.getElementById('photoPreview');
            if (photoPreview) {
                photoPreview.innerHTML = `<img src="${e.target.result}" alt="Prévisualisation" style="max-width: 100%; max-height: 200px;">`;
            }
        };
        reader.readAsDataURL(file);
    }
}

// Fonction pour initialiser les inputs de capture photo séparés
function initCameraCapture() {
    console.log("Initialisation de la capture avec méthode directe");
    
    // Référence aux éléments
    const captureBtn = document.getElementById('captureBtn');
    const galleryBtn = document.getElementById('galleryBtn');
    const photoPreview = document.getElementById('photoPreview');
    const photoBase64 = document.getElementById('photoBase64');
    
    // Vérifier que les éléments existent
    if (!captureBtn || !galleryBtn || !photoPreview || !photoBase64) {
        console.error("Éléments nécessaires non trouvés");
        return;
    }
    
    // Fonction pour créer un input file temporaire
    function createTemporaryInput(useCamera) {
        // Créer un nouvel élément input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        // Ajouter l'attribut capture si on utilise l'appareil photo
        if (useCamera) {
            input.setAttribute('capture', 'environment');
        }
        
        // Ajouter le gestionnaire d'événements change
        input.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            if (!file.type.match('image.*')) {
                alert('Veuillez sélectionner une image');
                return;
            }
            
            // Lire le fichier et l'afficher
            const reader = new FileReader();
            reader.onload = function(e) {
                // Stocker l'image en base64
                const base64Image = e.target.result;
                photoBase64.value = base64Image;
                
                // Afficher la prévisualisation
                photoPreview.innerHTML = '';
                const img = document.createElement('img');
                img.src = base64Image;
                img.alt = "Prévisualisation";
                photoPreview.appendChild(img);
                
                // Ajouter une indication de source
                const sourceIndicator = document.createElement('div');
                sourceIndicator.style.cssText = 'position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; padding: 5px 10px; border-radius: 20px; font-size: 12px;';
                sourceIndicator.innerText = useCamera ? '📷 Appareil photo' : '🖼️ Galerie';
                photoPreview.appendChild(sourceIndicator);
                
                // Supprimer l'input temporaire
                input.remove();
            };
            reader.readAsDataURL(file);
        });
        
        // Retourner l'input
        return input;
    }
    
    // Gérer le clic sur le bouton de capture
    captureBtn.addEventListener('click', function() {
        console.log("Clic sur le bouton appareil photo");
        
        // Créer un input temporaire avec l'attribut capture
        const input = createTemporaryInput(true);
        
        // Ajouter à la page et déclencher le clic
        document.body.appendChild(input);
        input.click();
    });
    
    // Gérer le clic sur le bouton galerie
    galleryBtn.addEventListener('click', function() {
        console.log("Clic sur le bouton galerie");
        
        // Créer un input temporaire sans l'attribut capture
        const input = createTemporaryInput(false);
        
        // Ajouter à la page et déclencher le clic
        document.body.appendChild(input);
        input.click();
    });
}

// Version modifiée de la fonction uploadPhoto
async function uploadPhoto(event) {
    event.preventDefault();
    console.log("Début de la fonction uploadPhoto");
    
    // Références aux éléments DOM
    const photoInput = document.getElementById('photoInput');
    const progressBarFill = document.querySelector('.progress-bar-fill');
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadModal = document.getElementById('uploadModal');
    const photoUploadForm = document.getElementById('photoUploadForm');
    const photoPreview = document.getElementById('photoPreview');
    
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
        if (!window.supabase) {
            console.error("Erreur: supabase n'est pas défini");
            throw new Error("Supabase n'est pas initialisé");
        }
        
        // Vérifier que storage est disponible
        if (!window.supabase.storage) {
            console.error("Erreur: supabase.storage n'est pas disponible");
            throw new Error("Storage Supabase non disponible");
        }
        
        // Uploader le fichier dans le bucket Storage avec un timeout plus long
        console.log("Début de l'upload du fichier...");
        const { data: fileData, error: fileError } = await window.supabase.storage
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
        const { data: urlData } = window.supabase.storage.from('gallery').getPublicUrl(filePath);
        const imageUrl = urlData.publicUrl;
        
        console.log("URL publique générée:", imageUrl);
        
        // Enregistrer les métadonnées dans la base de données
        console.log("Tentative d'insertion dans la table photos");
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
        const photoGrid = document.getElementById('photoGrid');
        if (photoGrid) {
            photoGrid.innerHTML = '';
        }
        
        // Réinitialiser l'état et recharger les photos
        window.currentPage = 0;
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

// Fonction pour soumettre un commentaire
async function submitComment(event) {
    event.preventDefault();
    console.log("Tentative d'envoi de commentaire");
    
    if (!window.currentPhotoId) {
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
    
    console.log("Envoi d'un commentaire pour la photo:", window.currentPhotoId);
    console.log("Auteur:", author);
    console.log("Texte:", text);
    
    // Afficher un indicateur de chargement
    const submitBtn = document.querySelector('#commentForm button');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="material-icons" style="font-size: 14px;">hourglass_empty</i> Envoi...';
    
    try {
        // Sauvegarder le nom pour les futurs commentaires
        localStorage.setItem('commenterName', author);
        
        // Vérifier le type de currentPhotoId
        console.log("Type de currentPhotoId:", typeof window.currentPhotoId);
        
        // Préparer les données à insérer
        const commentData = {
            photo_id: window.currentPhotoId,
            author_name: author,
            comment_text: text
        };
        
        console.log("Données du commentaire à insérer:", commentData);
        
        // Insérer le commentaire
        const { data, error } = await window.supabase
            .from('photo_comments')
            .insert([commentData]);
        
        if (error) {
            console.error('Erreur lors de l\'envoi du commentaire:', error);
            throw error;
        }
        
        console.log("Commentaire enregistré:", data);
        
        // Afficher un message de succès
        const successMsg = document.createElement('div');
        successMsg.style.cssText = 'background: #4CAF50; color: white; padding: 10px; border-radius: 4px; text-align: center; margin-top: 10px;';
        successMsg.textContent = 'Commentaire ajouté avec succès!';
        textInput.parentNode.insertBefore(successMsg, textInput.nextSibling);
        
        // Réinitialiser le formulaire
        textInput.value = '';
        
        // Masquer le message après quelques secondes
        setTimeout(() => {
            successMsg.style.opacity = 0;
            successMsg.style.transition = 'opacity 0.5s';
            setTimeout(() => successMsg.remove(), 500);
        }, 3000);
        
        // Attendre un court instant avant de recharger les commentaires
        setTimeout(() => {
            loadPhotoComments(window.currentPhotoId);
        }, 500);
        
    } catch (error) {
        console.error('Erreur lors de l\'envoi du commentaire:', error);
        
        // Afficher une erreur visible
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'background: #f44336; color: white; padding: 10px; border-radius: 4px; text-align: center; margin-top: 10px;';
        errorMsg.textContent = 'Impossible d\'envoyer votre commentaire: ' + error.message;
        textInput.parentNode.insertBefore(errorMsg, textInput.nextSibling);
        
        // Masquer l'erreur après quelques secondes
        setTimeout(() => {
            errorMsg.style.opacity = 0;
            errorMsg.style.transition = 'opacity 0.5s';
            setTimeout(() => errorMsg.remove(), 500);
        }, 5000);
    } finally {
        // Rétablir le bouton d'envoi
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
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
    window.currentPhotoId = photoId;
    
    try {
        // Charger les détails de la photo
        const { data: photo, error: photoError } = await window.supabase
            .from('photos')
            .select('*')
            .eq('id', photoId)
            .single();
        
        if (photoError) {
            console.error("Erreur requête photo:", photoError);
            throw photoError;
        }
        
        console.log("Données de la photo récupérées:", photo);
        
        // REMPLACER CETTE PARTIE - DÉBUT
        const modalImg = document.getElementById('modalPhotoImg');
        if (modalImg) {
            // Test direct de l'URL en utilisant une requête fetch pour vérifier si l'image est accessible
            fetch(photo.image_url)
                .then(response => {
                    if (response.ok) {
                        console.log("Image accessible via fetch:", photo.image_url);
                    } else {
                        console.error("Image inaccessible via fetch:", photo.image_url, "Status:", response.status);
                    }
                })
                .catch(error => {
                    console.error("Erreur fetch pour l'image:", error);
                });
            
            // Ajouter un bouton "Ouvrir dans un nouvel onglet" pour tester directement
            const modalHeader = document.querySelector('.photo-detail-view');
if (modalHeader) {
    // D'abord, supprimer tous les boutons "Ouvrir l'image" existants
    const existingButtons = modalHeader.querySelectorAll('button');
    existingButtons.forEach(button => {
        if (button.textContent === "Ouvrir l'image dans un nouvel onglet") {
            button.remove();
        }
    });
    
    // Ensuite, créer un nouveau bouton
    const openImageBtn = document.createElement('button');
    openImageBtn.textContent = "Ouvrir l'image dans un nouvel onglet";
    openImageBtn.style.cssText = "margin: 10px 0; padding: 5px; background: #007bff; color: white; border: none; border-radius: 4px;";
    openImageBtn.onclick = function() {
        window.open(photo.image_url, '_blank');
    };
    modalHeader.appendChild(openImageBtn);
}
            
            // Définir l'image source avec gestion d'erreur améliorée
            modalImg.onerror = function() {
                console.error("Erreur chargement image modale:", photo.image_url);
                this.src = 'images/Actu&Media.png';
            };
            modalImg.src = photo.image_url || '';
            modalImg.alt = photo.title || 'Photo';
        } else {
            console.error("Élément modalPhotoImg non trouvé");
        }
        // REMPLACER CETTE PARTIE - FIN
        
        // Mettre à jour les autres éléments s'ils existent
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
        
    } catch (error) {
        console.error('Erreur chargement détails:', error);
        alert('Impossible de charger les détails de la photo');
    }
}

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
        // Logging de la requête
        console.log("Requête de commentaires pour photo_id:", photoId);
        
        // Assurez-vous que photoId est un nombre si nécessaire
        const idToUse = typeof photoId === 'string' ? parseInt(photoId, 10) : photoId;
        
        const { data: comments, error } = await window.supabase
            .from('photo_comments')
            .select('*')
            .eq('photo_id', idToUse)
            .order('created_at', { ascending: false });
        
        // Vérifier si les commentaires sont disponibles
        console.log("Réponse de commentaires:", comments);
        
        if (error) {
            console.error("Erreur de chargement des commentaires:", error);
            throw error;
        }
        
        if (!comments || comments.length === 0) {
            commentsContainer.innerHTML = '<div style="text-align: center; padding: 15px; color: #777;">' +
                '<i class="material-icons" style="font-size: 36px; display: block; margin-bottom: 10px;">chat_bubble_outline</i>' +
                '<p>Aucun commentaire pour le moment. Soyez le premier à commenter!</p></div>';
            return;
        }
        
        // Vider le conteneur avant d'ajouter les nouveaux commentaires
        commentsContainer.innerHTML = '';
        
        console.log(`Affichage de ${comments.length} commentaires`);
        
        // Créer des éléments HTML visibles pour chaque commentaire
        comments.forEach(comment => {
            console.log("Traitement du commentaire:", comment);
            
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
                    <span class="comment-author">${comment.author_name || 'Anonyme'}</span>
                    <span class="comment-date">${formattedDate}</span>
                </div>
                <div class="comment-text">${comment.comment_text || ''}</div>
            `;
            
            commentsContainer.appendChild(commentElement);
            
            // Ajouter un délai d'animation pour le rendre plus visible
            setTimeout(() => {
                commentElement.style.opacity = 1;
                commentElement.style.transform = 'translateY(0)';
            }, 100 * (comments.length - comments.indexOf(comment)));
        });
        
        // Ajouter un message de notification quand les commentaires sont chargés
        const notification = document.createElement('div');
        notification.style.cssText = 'background: #4CAF50; color: white; padding: 8px; border-radius: 4px; text-align: center; margin-top: 10px; font-size: 14px; transition: opacity 2s; opacity: 1;';
        notification.textContent = `${comments.length} commentaire(s) chargé(s)`;
        commentsContainer.parentNode.insertBefore(notification, commentsContainer.nextSibling);
        
        // Faire disparaître la notification après quelques secondes
        setTimeout(() => {
            notification.style.opacity = 0;
            setTimeout(() => notification.remove(), 2000);
        }, 3000);
        
    } catch (error) {
        console.error('Erreur lors du chargement des commentaires:', error);
        commentsContainer.innerHTML = '<p style="color: #d32f2f; text-align: center; padding: 15px;">Impossible de charger les commentaires. Veuillez réessayer plus tard.</p>';
    }
}

// Afficher les photos dans la grille
function renderPhotos(photos) {
    const photoGrid = document.getElementById('photoGrid');
    const noPhotosMessage = document.getElementById('noPhotosMessage');
    
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
            console.log("URL de l'image:", photo.image_url);
photoCard.innerHTML = `
    <div class="photo-img-container">
        <img class="photo-img" src="${photo.image_url || ''}" alt="${photo.title || 'Photo sans titre'}" 
             onerror="console.error('Erreur chargement image:', this.src, 'URL originale:', '${photo.image_url}'); this.src='images/Actu&Media.png';">
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

// Charger les photos - Fonction corrigée pour éviter les chargements multiples
async function loadPhotos(isLoadMore = false) {
    console.log("Début de loadPhotos, isLoadMore:", isLoadMore);
    console.log("État actuel: currentPage =", window.currentPage, "hasMorePhotos =", window.hasMorePhotos);
    
    const photoGrid = document.getElementById('photoGrid');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noPhotosMessage = document.getElementById('noPhotosMessage');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
      
    // Éviter les chargements simultanés
    if (window.isLoadingPhotos) {
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
      
    if (!window.supabase) {
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

    window.isLoadingPhotos = true; // Marquer le début du chargement

    if (!isLoadMore) {
        console.log("Réinitialisation de l'affichage (nouveau chargement)");
        loadingIndicator.style.display = 'flex';
        photoGrid.innerHTML = '';
        window.currentPage = 0;
    }
      
    try {
        console.log("Tentative de chargement des photos...");
        const from = window.currentPage * window.pageSize;
        const to = from + window.pageSize - 1;
        
        console.log(`Requête Supabase: from=${from}, to=${to}`);
        
        let { data: photos, error } = await window.supabase
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
            window.hasMorePhotos = false;
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
        console.log("Fin de loadPhotos");
        loadingIndicator.style.display = 'none';
        window.isLoadingPhotos = false; // Marquer la fin du chargement
    }
}

// Initialisation principale
function initializeGallery() {
    console.log("Début de initializeGallery");
    
    // Définir les variables globales
    window.currentPhotoId = null;
    window.currentPage = 0;
    window.pageSize = 12;
    window.hasMorePhotos = true;
    window.isLoadingPhotos = false;
    
    // Initialiser les éléments DOM
    const photoGrid = document.getElementById('photoGrid');
    const uploadModal = document.getElementById('uploadModal');
    const photoViewModal = document.getElementById('photoViewModal');
    const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
    const closeUploadModalBtn = document.getElementById('closeUploadModal');
    const closePhotoViewBtn = document.getElementById('closePhotoView');
    const photoUploadForm = document.getElementById('photoUploadForm');
    const photoInput = document.getElementById('photoInput');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const noPhotosMessage = document.getElementById('noPhotosMessage');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const commentForm = document.getElementById('commentForm');
    
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
    
    // Charger le nom utilisateur depuis localStorage s'il existe
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
    
    // Vérifier si l'instance Supabase est disponible globalement
    if (window.supabaseInstance) {
        // Utiliser l'instance créée directement
        window.supabase = window.supabaseInstance;
        console.log("Utilisation de l'instance Supabase globale");
        return true;
    } else if (typeof window.getSupabaseClient === 'function') {
        // Utiliser la fonction getSupabaseClient
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
        
        // Afficher un message d'erreur utilisateur après chargement du DOM
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

// Code d'initialisation principal
console.log("Script gallery-manager.js chargé");

// Utiliser une variable globale pour éviter les redéclarations
if (typeof window.galleryInitialized === 'undefined') {
    window.galleryInitialized = false;
}

// Attendre que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded déclenché");
    if (!window.galleryInitialized) {
        const supabaseInitialized = initializeSupabase();
        if (supabaseInitialized) {
            initializeGallery();
        } else {
            console.error("Impossible d'initialiser Supabase, galerie non initialisée");
        }
        window.galleryInitialized = true;
    }
});

// Vérification supplémentaire au cas où DOMContentLoaded a déjà été déclenché
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log("Document déjà chargé, tentative d'initialisation immédiate");
    if (!window.galleryInitialized) {
        const supabaseInitialized = initializeSupabase();
        if (supabaseInitialized) {
            setTimeout(initializeGallery, 0); // Utiliser setTimeout pour s'assurer que toutes les ressources sont chargées
        } else {
            console.error("Impossible d'initialiser Supabase, galerie non initialisée");
        }
        window.galleryInitialized = true;
    }
}

// Exposer certaines fonctions globalement pour permettre les événements inline
window.openUploadModal = openUploadModal;
window.closeUploadModal = closeUploadModal;
window.closePhotoViewModal = closePhotoViewModal;
window.loadMorePhotos = loadMorePhotos;
window.previewPhoto = previewPhoto;
window.uploadPhoto = uploadPhoto;
window.submitComment = submitComment;
window.openPhotoView = openPhotoView;

console.log('Fin du fichier gallery-manager.js atteinte correctement');