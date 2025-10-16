// js/annonces-manager.js
class AnnoncesManager {
    constructor() {
    this.annonces = [];
    this.currentFilter = 'all';
    this.currentTab = 'all';
    this.currentEventFilter = 'all-events';
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
    // Bouton déposer une annonce
    const addBtn = document.getElementById('addAnnonceBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            this.openCreateModal('annonce');
        });
    }
    
    // Bouton ajouter un événement
    const addEventBtn = document.getElementById('addEventBtn');
    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => {
            this.openCreateModal('evenement');
        });
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

    // Clic en dehors des modals
    const modal = document.getElementById('createModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeCreateModal();
        });
    }

    const detailsModal = document.getElementById('detailsModal');
    if (detailsModal) {
        detailsModal.addEventListener('click', (e) => {
            if (e.target === detailsModal) {
                detailsModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Formulaire
    const form = document.getElementById('annonceForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit(e);
        });
        
        // Basculer entre annonce et événement
        const pubTypeInputs = form.querySelectorAll('input[name="pub_type"]');
        pubTypeInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.toggleFormFields(e.target.value);
            });
        });
    }

    // Onglets de navigation
const tabs = document.querySelectorAll('.tab-btn');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Mettre à jour l'interface des onglets
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Mettre à jour la propriété currentTab
        this.currentTab = tab.dataset.tab;
        
        // Réinitialiser les filtres quand on change d'onglet
        if (this.currentTab === 'annonces') {
            document.getElementById('categoryFilter').value = 'all-annonces';
            this.currentFilter = 'all-annonces';
        } else if (this.currentTab === 'evenements') {
            document.getElementById('eventTypeFilter').value = 'all-events';
            this.currentEventFilter = 'all-events';
        }
        
        // Appliquer le filtrage
        this.filterContent();
    });
});

    // Filtres
const categoryFilter = document.getElementById('categoryFilter');
if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
        this.currentFilter = e.target.value;
        this.filterContent(); // Appeler filterContent, pas filterAnnonces
    });
}

const eventTypeFilter = document.getElementById('eventTypeFilter');
if (eventTypeFilter) {
    eventTypeFilter.addEventListener('change', (e) => {
        this.currentEventFilter = e.target.value;
        this.filterContent(); // Appeler filterContent
    });
}

    // Gestion upload image
    this.setupImageUpload();
}

toggleFormFields(type) {
    const annonceCategory = document.getElementById('annonceCategory');
    const eventType = document.getElementById('eventType');
    const eventFields = document.getElementById('eventFields');
    const priceField = document.getElementById('priceField');
    
    if (type === 'evenement') {
        annonceCategory.style.display = 'none';
        eventType.style.display = 'block';
        eventFields.style.display = 'block';
        priceField.style.display = 'none';
        
        // Rendre les champs événement requis
        document.getElementById('event_date').required = true;
        document.getElementById('event_category').required = true;
        document.getElementById('category').required = false;
    } else {
        annonceCategory.style.display = 'block';
        eventType.style.display = 'none';
        eventFields.style.display = 'none';
        priceField.style.display = 'block';
        
        // Rendre les champs annonce requis
        document.getElementById('event_date').required = false;
        document.getElementById('event_category').required = false;
        document.getElementById('category').required = true;
    }
}

filterContent() {
    const tab = this.currentTab || 'all';
    let filtered = [...this.annonces];
	
    
    // Gérer l'affichage des filtres selon l'onglet
    if (tab === 'all') {
        // TOUT VOIR : aucun filtre visible
        document.getElementById('annonceFilters').style.display = 'none';
        document.getElementById('eventFilters').style.display = 'none';
        // Pas de filtrage, on affiche tout
        
    } else if (tab === 'annonces') {
        // PETITES ANNONCES : afficher seulement le filtre de catégories
        document.getElementById('annonceFilters').style.display = 'block';
        document.getElementById('eventFilters').style.display = 'none';
        
        // Filtrer pour exclure les événements
        filtered = filtered.filter(a => a.category !== 'evenement');
        
        // Appliquer le filtre de catégorie si sélectionné
        if (this.currentFilter && this.currentFilter !== 'all-annonces') {
            filtered = filtered.filter(a => a.category === this.currentFilter);
        }
        
    } else if (tab === 'evenements') {
        // ÉVÉNEMENTS : afficher seulement le filtre d'événements
        document.getElementById('annonceFilters').style.display = 'none';
        document.getElementById('eventFilters').style.display = 'block';
        
        // Filtrer pour ne garder que les événements
        filtered = filtered.filter(a => a.category === 'evenement');
        
        // Appliquer le filtre de type d'événement si sélectionné
        if (this.currentEventFilter && this.currentEventFilter !== 'all-events') {
            filtered = filtered.filter(a => a.event_category === this.currentEventFilter);
        }
    }
    
    this.displayAnnonces(filtered);
}

setupImageUpload() {
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

    openCreateModal(type = 'annonce') {
    const modal = document.getElementById('createModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Pré-sélectionner le bon type
        const radio = document.querySelector(`input[name="pub_type"][value="${type}"]`);
        if (radio) {
            radio.checked = true;
            this.toggleFormFields(type);
        }
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
    const pubType = formData.get('pub_type');
    
    const imageFile = document.getElementById('annonceImage').files[0];
    let imageUrl = null;
    
    try {
        const submitBtn = form.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours...';

        // Upload image si présente
        if (imageFile) {
            const fileName = `${pubType}-${Date.now()}.${imageFile.name.split('.').pop()}`;
            const { data: uploadData, error: uploadError } = await this.supabase.storage
                .from('annonces-images')
                .upload(fileName, imageFile);

            if (uploadError) throw uploadError;

            const { data: urlData } = this.supabase.storage
                .from('annonces-images')
                .getPublicUrl(fileName);

            imageUrl = urlData.publicUrl;
        }

        // Préparer les données
        const data = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: pubType === 'evenement' ? 'evenement' : formData.get('category'),
            event_category: pubType === 'evenement' ? formData.get('event_category') : null,
            event_date: formData.get('event_date') || null,
            event_time: formData.get('event_time') || null,
            event_end_date: formData.get('event_end_date') || null,
            organizer: formData.get('organizer') || null,
            price: pubType === 'annonce' && formData.get('price') ? parseFloat(formData.get('price')) : null,
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

        const message = pubType === 'evenement' 
            ? 'Événement envoyé ! Il sera publié après modération.' 
            : 'Annonce envoyée ! Elle sera publiée après modération.';
            
        this.showToast(message, 'success');
        this.closeCreateModal();
        await this.loadAnnonces();

    } catch (error) {
        console.error('Erreur:', error);
        this.showToast('Erreur lors de l\'envoi. Réessayez.', 'error');
    } finally {
        const submitBtn = form.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Publier';
        }
    }
}

async loadAnnonces() {
    try {
        const { data, error } = await this.supabase
            .from('public_ads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erreur Supabase:', error);
            throw error;
        }

        console.log('Annonces chargées:', data);
        this.annonces = data || [];
        
        // Utiliser filterContent() au lieu de displayAnnonces() directement
        this.filterContent();
        
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
                <p>Aucun contenu disponible pour le moment</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = annonces.map(annonce => {
        const isEvent = annonce.category === 'evenement';
        
        return `
            <div class="annonce-card ${isEvent ? 'event-card' : ''}" onclick="annoncesManager.showAnnonceDetails(${annonce.id})">
                ${annonce.image_url ? `
                    <img src="${annonce.image_url}" alt="${annonce.title}" class="annonce-image">
                ` : `
                    <div class="annonce-image" style="display: flex; align-items: center; justify-content: center; background: #f0f0f0;">
                        <span class="material-icons" style="font-size: 48px; color: #ccc;">${isEvent ? 'event' : 'image'}</span>
                    </div>
                `}
                <div class="annonce-content">
                    <span class="annonce-category">${this.getCategoryLabel(annonce.category, annonce.event_category)}</span>
                    <h3 class="annonce-title">${annonce.title}</h3>
                    
                    ${isEvent && annonce.event_date ? `
                        <div class="event-date">
                            <span class="material-icons">event</span>
                            ${this.formatEventDate(annonce.event_date, annonce.event_time, annonce.event_end_date)}
                        </div>
                    ` : ''}
                    
                    ${!isEvent && annonce.price ? `<div class="annonce-price">${annonce.price} €</div>` : ''}
                    
                    ${isEvent && annonce.organizer ? `
                        <div class="event-organizer">Par ${annonce.organizer}</div>
                    ` : ''}
                    
                    <div class="annonce-location">
                        <span class="material-icons" style="font-size: 16px;">place</span>
                        ${annonce.location}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

    formatEventDate(startDate, time, endDate) {
    const start = new Date(startDate);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    let dateStr = start.toLocaleDateString('fr-FR', options);
    
    if (time) {
        dateStr += ` à ${time}`;
    }
    
    if (endDate && endDate !== startDate) {
        const end = new Date(endDate);
        dateStr += ` - ${end.toLocaleDateString('fr-FR', options)}`;
    }
    
    return dateStr;
}

getCategoryLabel(category, eventCategory = null) {
    if (category === 'evenement') {
        const eventLabels = {
            'marche': '🛍️ Marché / Brocante',
            'concert': '🎵 Concert / Spectacle',
            'sport': '⚽ Sport / Loisirs',
            'fete': '🎉 Fête / Célébration',
            'culture': '🎨 Culture / Exposition',
            'solidarite': '🤝 Solidarité',
            'autre': '📌 Événement'
        };
        return eventLabels[eventCategory] || '📅 Événement';
    }
    
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