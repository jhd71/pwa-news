document.addEventListener('DOMContentLoaded', function() {
    // Utiliser l'instance Supabase globale
    const supabase = window.supabase;
   
    // Références aux éléments du DOM
    const announcementsGrid = document.getElementById('announcementsGrid');
    const postAnnouncementBtn = document.getElementById('postAnnouncementBtn');
    const announcementModal = document.getElementById('announcementModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancelBtn');
    const announcementForm = document.getElementById('announcementForm');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Variables globales
let currentUser = localStorage.getItem('chatPseudo') || null;
let currentCategory = 'all';
let isEditMode = false;
let editAnnouncementId = null;

// Ajoutez cette fonction ici
function hideAnnouncementModal() {
    announcementModal.classList.add('hidden');
    
    // Si le formulaire existe, le réinitialiser
    if (document.getElementById('announcementForm')) {
        resetForm();
    }
}

// Puis la définition de resetForm si elle n'existe pas déjà
function resetForm() {
    // Si le formulaire existe
    const form = document.getElementById('announcementForm');
    if (form) {
        form.reset();
        document.getElementById('imagePreview').innerHTML = '';
        isEditMode = false;
        editAnnouncementId = null;
        
        // Réinitialiser le titre et le bouton de la modal si les éléments existent
        const headerTitle = document.querySelector('.modal-header h2');
        if (headerTitle) {
            headerTitle.textContent = 'Publier une annonce';
        }
        
        const submitBtn = document.querySelector('.form-actions button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Publier';
        }
    }
}
    
	function showToast(message, type = 'success') {
    // Créer un toast pour afficher des messages
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Afficher puis masquer le toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

    // Fonctions
    async function loadAnnouncements(category = 'all') {
        // Afficher le skeleton loader
        announcementsGrid.innerHTML = `
            <div class="loading-skeleton">
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
            </div>
        `;
        
        try {
            // Construire la requête
            let query = supabase
    .from('announcements')
    .select('*')
    // .eq('status', 'approved')  // Commentez cette ligne
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
                
            // Filtrer par catégorie si nécessaire
            if (category !== 'all') {
                query = query.eq('category', category);
            }
            
            // Exécuter la requête
            const { data, error } = await query;
            
            if (error) throw error;
            
            // Afficher les résultats
            renderAnnouncements(data);
        } catch (error) {
            console.error('Erreur chargement annonces:', error);
            announcementsGrid.innerHTML = `
                <div class="error-message">
                    <p>Une erreur est survenue lors du chargement des annonces.</p>
                    <button class="primary-button" onclick="loadAnnouncements('${category}')">
                        <span class="material-icons">refresh</span> Réessayer
                    </button>
                </div>
            `;
        }
    }
    
    function renderAnnouncements(announcements) {
        if (!announcements || announcements.length === 0) {
            announcementsGrid.innerHTML = `
                <div class="no-results">
                    <p>Aucune annonce trouvée dans cette catégorie.</p>
                    <p>Soyez le premier à publier une annonce !</p>
                    <button class="primary-button" id="noResultsPostBtn">
                        <span class="material-icons">add</span> Publier une annonce
                    </button>
                </div>
            `;
            
            document.getElementById('noResultsPostBtn')?.addEventListener('click', () => {
                showAnnouncementModal();
            });
            
            return;
        }
        
        let html = '';
        announcements.forEach(announcement => {
            const createdDate = new Date(announcement.created_at);
            const formattedDate = createdDate.toLocaleDateString('fr-FR');
            
            html += `
                <div class="announcement-card" data-id="${announcement.id}">
                    <div class="card-image" style="background-image: url('${announcement.image_url || '/images/default-announcement.jpg'}')"></div>
                    <div class="card-content">
                        <div class="card-category">${getCategoryLabel(announcement.category)}</div>
                        <h3 class="card-title">${announcement.title}</h3>
                        ${announcement.price ? `<div class="card-price">${announcement.price} €</div>` : ''}
                        <div class="card-location">
                            <span class="material-icons">location_on</span>
                            ${announcement.location}
                        </div>
                        <p class="card-description">${announcement.description.substring(0, 100)}${announcement.description.length > 100 ? '...' : ''}</p>
                        <div class="card-date">Publié le ${formattedDate}</div>
                        <button class="view-details" data-id="${announcement.id}">Voir détails</button>
                    </div>
                </div>
            `;
        });
        
        announcementsGrid.innerHTML = html;
        
        // Ajouter les gestionnaires d'événements pour les boutons de détails
        document.querySelectorAll('.view-details').forEach(button => {
            button.addEventListener('click', () => {
                showAnnouncementDetails(button.dataset.id);
            });
        });
    }
    
    function getCategoryLabel(categoryValue) {
        const categories = {
            'emploi': 'Emploi',
            'immobilier': 'Immobilier',
            'vehicules': 'Véhicules',
            'services': 'Services',
            'objets': 'Objets à vendre'
        };
        
        return categories[categoryValue] || categoryValue;
    }
    
    async function showAnnouncementDetails(id) {
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .eq('id', id)
                .single();
                
            if (error) throw error;
            
            if (!data) {
                showToast('Annonce introuvable');
                return;
            }
            
            // Créer une modal de détail
            const detailModal = document.createElement('div');
            detailModal.className = 'modal';
            detailModal.style.zIndex = '1001'; // Plus haut que la modal d'ajout
            
            const createdDate = new Date(data.created_at);
            const formattedDate = createdDate.toLocaleDateString('fr-FR');
            
            detailModal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${data.title}</h2>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div style="padding: 20px;">
                        ${data.image_url ? `
                            <div style="text-align: center; margin-bottom: 20px;">
                                <img src="${data.image_url}" alt="${data.title}" style="max-width: 100%; max-height: 300px; border-radius: 8px;">
                            </div>
                        ` : ''}
                        
                        <div style="margin-bottom: 15px;">
                            <span class="card-category" style="display: inline-block; background: #f0f0f0; padding: 5px 10px; border-radius: 15px; font-size: 12px; margin-bottom: 10px;">${getCategoryLabel(data.category)}</span>
                            ${data.price ? `<div style="font-size: 24px; font-weight: bold; color: var(--primary-color); margin-bottom: 15px;">${data.price} €</div>` : ''}
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 10px;">
                                <span class="material-icons" style="color: #666;">location_on</span>
                                <span style="color: #666;">${data.location}</span>
                            </div>
                            <div style="font-size: 14px; color: #999;">Publiée le ${formattedDate}</div>
                        </div>
                        
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <h3 style="margin-top: 0; margin-bottom: 10px; color: var(--primary-color);">Description</h3>
                            <p style="white-space: pre-line; line-height: 1.5;">${data.description}</p>
                        </div>
                        
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
                            <h3 style="margin-top: 0; margin-bottom: 10px; color: var(--primary-color);">Contact</h3>
                            <p>${data.contact}</p>
                        </div>
                        
                        ${data.user_id === currentUser ? `
                            <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
                                <button class="secondary-button edit-announcement" data-id="${data.id}">
                                    <span class="material-icons">edit</span> Modifier
                                </button>
                                <button class="secondary-button delete-announcement" data-id="${data.id}" style="color: #d32f2f;">
                                    <span class="material-icons">delete</span> Supprimer
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            document.body.appendChild(detailModal);
            
            // Fermer la modal
            detailModal.querySelector('.close-modal').addEventListener('click', () => {
                detailModal.remove();
            });
            
            // Modifier l'annonce
            const editBtn = detailModal.querySelector('.edit-announcement');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    detailModal.remove();
                    editAnnouncement(data.id);
                });
            }
            
            // Supprimer l'annonce
            const deleteBtn = detailModal.querySelector('.delete-announcement');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    if (confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
                        deleteAnnouncement(data.id);
                        detailModal.remove();
                    }
                });
            }
        } catch (error) {
            console.error('Erreur chargement détails:', error);
            showToast('Erreur lors du chargement des détails', 'error');
        }
    }
    
    async function editAnnouncement(id) {
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .eq('id', id)
                .single();
                
            if (error) throw error;
            
            // Passer en mode édition
            isEditMode = true;
            editAnnouncementId = id;
            
            // Remplir le formulaire
            document.getElementById('title').value = data.title;
            document.getElementById('category').value = data.category;
            document.getElementById('description').value = data.description;
            document.getElementById('price').value = data.price || '';
            document.getElementById('location').value = data.location;
            document.getElementById('contact').value = data.contact;
            
            // Afficher l'image si disponible
            if (data.image_url) {
                document.getElementById('imagePreview').innerHTML = `
                    <img src="${data.image_url}" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
                `;
            }
            
            // Mettre à jour le titre et le bouton de la modal
            document.querySelector('.modal-header h2').textContent = 'Modifier l\'annonce';
            document.querySelector('.form-actions button[type="submit"]').textContent = 'Mettre à jour';
            
            // Afficher la modal
            showAnnouncementModal();
        } catch (error) {
            console.error('Erreur récupération annonce:', error);
            showToast('Erreur lors de la récupération des données', 'error');
        }
    }
    
    async function deleteAnnouncement(id) {
        try {
            const { error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', id);
                
            if (error) throw error;
            
            showToast('Annonce supprimée avec succès');
            loadAnnouncements(currentCategory);
        } catch (error) {
            console.error('Erreur suppression:', error);
            showToast('Erreur lors de la suppression', 'error');
        }
    }
    
    function showAnnouncementModal() {
    announcementModal.classList.remove('hidden');
    
    // Vérifier si l'utilisateur est identifié
    if (!currentUser) {
        // Sauvegarder le contenu original de la modal pour pouvoir le restaurer
        const originalContent = announcementModal.querySelector('.modal-content').innerHTML;
        
        // Remplacer par un formulaire d'identification
        announcementModal.querySelector('.modal-content').innerHTML = `
            <div class="modal-header">
                <h2>Identification requise</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div style="padding: 20px;">
                <p>Vous devez vous identifier pour publier une annonce.</p>
                <div class="form-group">
                    <label for="pseudoInput">Votre pseudo (3-20 caractères)</label>
                    <input type="text" id="pseudoInput" maxlength="20" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="secondary-button" id="cancelLoginBtn">Annuler</button>
                    <button type="button" class="primary-button" id="confirmLoginBtn">S'identifier</button>
                </div>
            </div>
        `;
        
        // Attacher les écouteurs d'événements
        announcementModal.querySelector('.close-modal').addEventListener('click', hideAnnouncementModal);
        document.getElementById('cancelLoginBtn').addEventListener('click', hideAnnouncementModal);
        document.getElementById('confirmLoginBtn').addEventListener('click', function() {
            const pseudo = document.getElementById('pseudoInput').value.trim();
            if (pseudo && pseudo.length >= 3) {
                localStorage.setItem('chatPseudo', pseudo);
                currentUser = pseudo;
                showToast('Identification réussie !');
                
                // Restaurer le contenu original de la modal
                announcementModal.querySelector('.modal-content').innerHTML = originalContent;
                
                // Réattacher les écouteurs d'événements originaux
                announcementModal.querySelector('.close-modal').addEventListener('click', hideAnnouncementModal);
                document.getElementById('cancelBtn').addEventListener('click', hideAnnouncementModal);
                document.getElementById('announcementForm').addEventListener('submit', handleFormSubmit);
            } else {
                showToast('Le pseudo doit faire au moins 3 caractères', 'error');
            }
        });
        
        return;
    }
}

// Fonction pour réinitialiser la modal d'annonce
function resetAnnouncementModal() {
    announcementModal.querySelector('.modal-content').innerHTML = `
        <div class="modal-header">
            <h2>Publier une annonce</h2>
            <button class="close-modal">&times;</button>
        </div>
        <form id="announcementForm">
            <div class="form-group">
                <label for="title">Titre*</label>
                <input type="text" id="title" name="title" required maxlength="80">
            </div>
            <div class="form-group">
                <label for="category">Catégorie*</label>
                <select id="category" name="category" required>
                    <option value="">Sélectionnez une catégorie</option>
                    <option value="emploi">Emploi</option>
                    <option value="immobilier">Immobilier</option>
                    <option value="vehicules">Véhicules</option>
                    <option value="services">Services</option>
                    <option value="objets">Objets à vendre</option>
                </select>
            </div>
            <div class="form-group">
                <label for="description">Description*</label>
                <textarea id="description" name="description" rows="4" required maxlength="1000"></textarea>
            </div>
            <div class="form-group">
                <label for="price">Prix (€)</label>
                <input type="number" id="price" name="price" min="0" step="0.01">
            </div>
            <div class="form-group">
                <label for="location">Localisation*</label>
                <input type="text" id="location" name="location" required>
            </div>
            <div class="form-group">
    <label for="contact">Email de contact*</label>
    <input type="text" id="contact" name="contact" required>
</div>
            <div class="form-group">
                <label for="image">Image (optionnel)</label>
                <input type="file" id="image" name="image" accept="image/*">
                <div class="image-preview" id="imagePreview"></div>
            </div>
            <div class="form-actions">
                <button type="button" class="secondary-button" id="cancelBtn">Annuler</button>
                <button type="submit" class="primary-button">Publier</button>
            </div>
        </form>
    `;
    
    // Récupérer les nouveaux éléments après reconstruction
    closeModalBtn = document.querySelector('.close-modal');
    cancelBtn = document.getElementById('cancelBtn');
    announcementForm = document.getElementById('announcementForm');
    
    // Réattacher les écouteurs d'événements
    closeModalBtn.addEventListener('click', hideAnnouncementModal);
    cancelBtn.addEventListener('click', hideAnnouncementModal);
    announcementForm.addEventListener('submit', handleFormSubmit);
    
    // Prévisualisation de l'image
    document.getElementById('image').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('imagePreview').innerHTML = `
                <img src="${e.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
            `;
        };
        
        reader.readAsDataURL(file);
    });
}
   
   // Fonction de gestion de la soumission du formulaire
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Récupérer les données du formulaire
    const formData = new FormData(announcementForm);
    const title = formData.get('title');
    const category = formData.get('category');
    const description = formData.get('description');
    const price = formData.get('price') ? parseFloat(formData.get('price')) : null;
    const location = formData.get('location');
    const contact = formData.get('contact');
    const imageFile = document.getElementById('image').files[0];
    
    // Vérification basique d'un email
if (contact && contact.includes('@')) {
    // Email est probablement valide, continuer
} else {
    showToast('Veuillez entrer une adresse email valide', 'error');
    return;
}
    
    try {
        let imageUrl = null;
        
        // Si une image est sélectionnée, la télécharger
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `announcements/${fileName}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('public')
                .upload(filePath, imageFile);
                
            if (uploadError) throw uploadError;
            
            // Récupérer l'URL publique
            const { data: { publicUrl } } = supabase.storage
                .from('public')
                .getPublicUrl(filePath);
                
            imageUrl = publicUrl;
        }
        
        // Préparer les données de l'annonce
        const announcementData = {
            title,
            description,
            category,
            price,
            location,
            contact,
            user_id: currentUser,
            status: 'approved', // Pour que les annonces soient immédiatement visibles
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Expire dans 30 jours
        };
        
        if (imageUrl) {
            announcementData.image_url = imageUrl;
        }
        
        let result;
        
        if (isEditMode) {
            // Mettre à jour l'annonce existante
            result = await supabase
                .from('announcements')
                .update(announcementData)
                .eq('id', editAnnouncementId)
                .select();
                
            showToast('Annonce mise à jour avec succès');
        } else {
            // Créer une nouvelle annonce
            result = await supabase
                .from('announcements')
                .insert(announcementData)
                .select();
                
            showToast('Annonce publiée avec succès');
        }
        
        if (result.error) throw result.error;
        
        // Fermer la modal et recharger les annonces
        hideAnnouncementModal();
        loadAnnouncements(currentCategory);
    } catch (error) {
        console.error('Erreur soumission:', error);
        showToast('Erreur lors de la publication de l\'annonce', 'error');
    }
}
    // Écouteurs d'événements
    postAnnouncementBtn.addEventListener('click', showAnnouncementModal);
    closeModalBtn.addEventListener('click', hideAnnouncementModal);
    cancelBtn.addEventListener('click', hideAnnouncementModal);
    announcementForm.addEventListener('submit', handleFormSubmit);
    
    // Filtres de catégories
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Mettre à jour le bouton actif
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Mettre à jour la catégorie et recharger
            currentCategory = button.dataset.category;
            loadAnnouncements(currentCategory);
        });
    });
    
	const chatToggleBtn = document.getElementById('chatToggleBtn');
if (chatToggleBtn) {
    chatToggleBtn.addEventListener('click', function() {
        // Essayer d'ouvrir le chat directement
        if (typeof openChat === 'function') {
            openChat();
        } else {
            // Alternative : déclencher un événement personnalisé
            document.dispatchEvent(new CustomEvent('openChatRequest'));
            
            // Ou rediriger vers l'accueil avec un paramètre pour ouvrir le chat
            // window.location.href = '/?openchat=true';
        }
    });
}
    // Vérifier si l'utilisateur est identifié
    document.addEventListener('userLoggedIn', function(e) {
        currentUser = e.detail.pseudo;
    });
    
    // Ajouter des classes CSS pour les toasts
    const style = document.createElement('style');
    style.textContent = `
        .toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            z-index: 9999;
            opacity: 0;
            transition: transform 0.3s, opacity 0.3s;
        }
        
        .toast.show {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        
        .toast.error {
            background: #F44336;
        }
        
        .toast.warning {
            background: #FF9800;
        }
    `;
    document.head.appendChild(style);
    
    // Charger les annonces au chargement de la page
    loadAnnouncements();
    
    // Ajouter le menu latéral et autres fonctionnalités communes
    const menuButton = document.getElementById('menuButton');
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.querySelector('.sidebar .close-btn');
    
    menuButton.addEventListener('click', function() {
        sidebar.classList.add('open');
    });
    
    closeBtn.addEventListener('click', function() {
        sidebar.classList.remove('open');
    });
    
    // Mode sombre
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    darkModeToggle.addEventListener('click', function() {
        document.documentElement.dataset.theme = 
            document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        
        // Mettre à jour le stockage local
        localStorage.setItem('theme', document.documentElement.dataset.theme);
        
        // Mettre à jour l'icône
        this.querySelector('.material-icons').textContent = 
            document.documentElement.dataset.theme === 'dark' ? 'light_mode' : 'dark_mode';
            
        this.querySelector('span:last-child').textContent = 
            document.documentElement.dataset.theme === 'dark' ? 'Clair' : 'Sombre';
    });
    
    // Appliquer le thème sauvegardé
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.dataset.theme = savedTheme;
        darkModeToggle.querySelector('.material-icons').textContent = 
            savedTheme === 'dark' ? 'light_mode' : 'dark_mode';
            
        darkModeToggle.querySelector('span:last-child').textContent = 
            savedTheme === 'dark' ? 'Clair' : 'Sombre';
    }
});