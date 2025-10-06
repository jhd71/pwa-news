// js/annonces-manager.js
class AnnoncesManager {
    constructor() {
        this.annonces = [];
        this.currentFilter = 'all';
        this.supabase = null;
    }

    // Nouvelle fonction init() robuste
async init() {

    // Cette fonction contient la suite du code à exécuter une fois Supabase prêt.
    const finishInit = async () => {
        this.supabase = window.getSupabaseClient();
        
        if (!this.supabase) {
            console.error("❌ AnnoncesManager: Le client Supabase n'a pas pu être récupéré.");
            return; // Arrête l'exécution si le client est invalide
        }

        this.setupEventListeners();
        await this.loadAnnonces();
    };

    // Scénario 1 : Si Supabase est DÉJÀ prêt (le script a été plus rapide)
    if (window.supabaseReady) {
        await finishInit();
    } else {

        window.addEventListener('supabaseReady', finishInit, { once: true });
    }
}

    setupEventListeners() {
    const addBtn = document.getElementById('addAnnonceBtn');
    
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            this.openCreateModal();
        });
    } else {
        console.error('❌ Bouton addAnnonceBtn introuvable');
    }

const backBtn = document.getElementById('backButton');
        if (backBtn) {
            backBtn.addEventListener('click', function(event) {
                // Empêche le comportement par défaut et stoppe d'autres scripts
                event.preventDefault(); 
                // Force la redirection vers l'URL spécifiée dans le href
                window.location.href = this.href; 
            });
        } else {
             console.error('❌ Bouton backButton introuvable');
        }
		
    // Fermer modal création
    const closeBtn = document.getElementById('closeModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeCreateModal());
    }

    // Fermer modal détails
    const closeDetailsBtn = document.getElementById('closeDetailsModal');
    if (closeDetailsBtn) {
        closeDetailsBtn.addEventListener('click', () => {
            document.getElementById('detailsModal').classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Clic en dehors du modal création
    const modal = document.getElementById('createModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeCreateModal();
            }
        });
    }

    // Clic en dehors du modal détails
    const detailsModal = document.getElementById('detailsModal');
    if (detailsModal) {
        detailsModal.addEventListener('click', (e) => {
            if (e.target === detailsModal) {
                detailsModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Formulaire de création
    const form = document.getElementById('annonceForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit(e);
        });
    }

    // Filtre par catégorie
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.filterAnnonces();
        });
    }

    // === GESTION UPLOAD IMAGE ===
    const captureBtn = document.getElementById('captureAnnonceBtn');
    const galleryBtn = document.getElementById('galleryAnnonceBtn');
    const imageInput = document.getElementById('annonceImage');
    const preview = document.getElementById('annoncePreview');

    if (captureBtn && imageInput) {
        captureBtn.addEventListener('click', () => {
            imageInput.setAttribute('capture', 'environment');
            imageInput.click();
        });
    }

    if (galleryBtn && imageInput) {
        galleryBtn.addEventListener('click', () => {
            imageInput.removeAttribute('capture');
            imageInput.click();
        });
    }

    if (imageInput && preview) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    preview.innerHTML = `
                        <img src="${event.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 8px; display: block; margin: 10px 0;">
                        <button type="button" class="remove-photo-btn" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                            <span class="material-icons" style="font-size: 16px; vertical-align: middle;">delete</span>
                            Supprimer la photo
                        </button>
                    `;
                    
                    // Bouton supprimer
                    preview.querySelector('.remove-photo-btn').addEventListener('click', () => {
                        imageInput.value = '';
                        preview.innerHTML = '';
                    });
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

    openCreateModal() {
        const modal = document.getElementById('createModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeCreateModal() {
        const modal = document.getElementById('createModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // Reset du formulaire
        const form = document.getElementById('annonceForm');
        if (form) {
            form.reset();
        }
    }

    async handleSubmit(event) {
    const form = event.target;
    const formData = new FormData(form);
    
    // Récupérer l'image
    const imageFile = document.getElementById('annonceImage').files[0];
    let imageUrl = null;
    
    try {
        const submitBtn = form.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours...';

        // Upload image si présente
        if (imageFile) {
            const fileName = `annonce-${Date.now()}.${imageFile.name.split('.').pop()}`;
            const { data: uploadData, error: uploadError } = await this.supabase.storage
                .from('annonces-images')
                .upload(fileName, imageFile);

            if (uploadError) throw uploadError;

            const { data: urlData } = this.supabase.storage
                .from('annonces-images')
                .getPublicUrl(fileName);

            imageUrl = urlData.publicUrl;
        }

        // Convertir FormData en objet
        const data = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
            price: formData.get('price') ? parseFloat(formData.get('price')) : null,
            author_name: formData.get('author_name'),
            author_email: formData.get('author_email'),
            author_phone: formData.get('author_phone') || null,
            location: formData.get('location'),
            image_url: imageUrl,
            is_approved: false,
            is_published: false,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        const { error } = await this.supabase
            .from('classified_ads')
            .insert([data]);

        if (error) throw error;

        this.showToast('Annonce envoyée ! Elle sera publiée après modération.', 'success');
        this.closeCreateModal();
        await this.loadAnnonces();

    } catch (error) {
        console.error('Erreur:', error);
        this.showToast('Erreur lors de l\'envoi. Réessayez.', 'error');
    } finally {
        const submitBtn = form.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Publier mon annonce';
        }
    }
}

async loadAnnonces() {
    try {
        // Version utilisant la Vue
		const { data, error } = await this.supabase
    .from('public_ads') // On utilise la vue qui contient déjà les filtres
    .select('*')
    .order('created_at', { ascending: false });

        if (error) {
            console.error('Erreur Supabase:', error);
            throw error;
        }

        console.log('Annonces chargées:', data); // Ce log devrait maintenant afficher vos annonces
        this.annonces = data || [];
        this.displayAnnonces();

    } catch (error) {
        console.error('Erreur chargement annonces:', error);
        this.showError();
    }
}

    filterAnnonces() {
        const filtered = this.currentFilter === 'all' 
            ? this.annonces 
            : this.annonces.filter(a => a.category === this.currentFilter);
        
        this.displayAnnonces(filtered);
    }

    displayAnnonces(annonces = this.annonces) {
        const grid = document.getElementById('annoncesGrid');
        if (!grid) return;

        if (annonces.length === 0) {
            grid.innerHTML = `
                <div class="loading">
                    <span class="material-icons" style="font-size: 48px;">inventory_2</span>
                    <p>Aucune annonce disponible pour le moment</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = annonces.map(annonce => `
            <div class="annonce-card" onclick="annoncesManager.showAnnonceDetails(${annonce.id})">
                ${annonce.image_url ? `
                    <img src="${annonce.image_url}" alt="${annonce.title}" class="annonce-image">
                ` : `
                    <div class="annonce-image" style="display: flex; align-items: center; justify-content: center; background: #f0f0f0;">
                        <span class="material-icons" style="font-size: 48px; color: #ccc;">image</span>
                    </div>
                `}
                <div class="annonce-content">
                    <span class="annonce-category">${this.getCategoryLabel(annonce.category)}</span>
                    <h3 class="annonce-title">${annonce.title}</h3>
                    ${annonce.price ? `<div class="annonce-price">${annonce.price} €</div>` : ''}
                    <div class="annonce-location">
                        <span class="material-icons" style="font-size: 16px;">place</span>
                        ${annonce.location}
                    </div>
                </div>
            </div>
        `).join('');
    }

    getCategoryLabel(category) {
        const labels = {
            'vente': 'Vente',
            'achat': 'Recherche',
            'don': 'Don',
            'echange': 'Échange',
            'services': 'Services'
        };
        return labels[category] || category;
    }

    showAnnonceDetails(id) {
    const annonce = this.annonces.find(a => a.id === id);
    if (!annonce) return;

    // Remplir la modale
    document.getElementById('modalTitle').textContent = annonce.title;
    document.getElementById('modalDescription').textContent = annonce.description || 'Pas de description';
    
    // Prix
    const priceEl = document.getElementById('modalPrice');
    if (annonce.price) {
        priceEl.textContent = `${annonce.price} €`;
    } else {
        priceEl.textContent = 'Prix non spécifié';
    }
    
    // Lieu
    document.getElementById('modalLocation').textContent = annonce.location || 'Non spécifié';
    
    // Contact
    document.getElementById('modalContactEmail').innerHTML = 
    `<span class="material-icons">email</span> <a href="mailto:${annonce.author_email}" style="color: var(--primary-color); text-decoration: none;">${annonce.author_email}</a>`;
    
    const phoneEl = document.getElementById('modalContactPhone');
    if (annonce.author_phone) {
        phoneEl.innerHTML = `<span class="material-icons">phone</span> <a href="tel:${annonce.author_phone}" style="color: var(--primary-color); text-decoration: none;">${annonce.author_phone}</a>`;
        phoneEl.style.display = 'block';
    } else {
        phoneEl.style.display = 'none';
    }
    
    // Image
    const imageContainer = document.getElementById('modalImageContainer');
    if (annonce.image_url) {
        imageContainer.innerHTML = `<img src="${annonce.image_url}" alt="${annonce.title}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;">`;
    } else {
        imageContainer.innerHTML = '';
    }
    
    // Afficher la modale
    document.getElementById('detailsModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

    showError() {
        const grid = document.getElementById('annoncesGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="loading">
                    <span class="material-icons" style="font-size: 48px; color: #dc3545;">error</span>
                    <p>Erreur de chargement des annonces</p>
                </div>
            `;
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-weight: 600;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialisation
const annoncesManager = new AnnoncesManager();

// Démarrer quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => annoncesManager.init());
} else {
    annoncesManager.init();
}