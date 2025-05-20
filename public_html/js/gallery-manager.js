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
function previewPhoto() {
    console.log("previewPhoto appelée - utilise le nouveau système");
}