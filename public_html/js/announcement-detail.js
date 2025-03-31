document.addEventListener('DOMContentLoaded', function() {
    // Initialiser Supabase
    const supabase = supabaseClient.createClient(
        'https://ekjgfiyhkythqcnmhzea.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramdmaXloa3l0aHFjbm1oemVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzYxNDIsImV4cCI6MjA1ODI1MjE0Mn0.V0j_drb6GiTojgwxC6ydjnyJDRRT9lUbSc1E7bFE2Z4'
    );
    
    // Variables globales
    const announcementDetail = document.getElementById('announcementDetail');
    let currentUser = localStorage.getItem('chatPseudo') || null;
    
    // Récupérer l'ID de l'annonce depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const announcementId = urlParams.get('id');
    
    // Fonctions
    async function loadAnnouncementDetail() {
        if (!announcementId) {
            showError('Identifiant d\'annonce manquant');
            return;
        }
        
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .eq('id', announcementId)
                .single();
                
            if (error) throw error;
            
            if (!data) {
                showError('Annonce introuvable');
                return;
            }
            
            renderAnnouncementDetail(data);
        } catch (error) {
            console.error('Erreur chargement détails:', error);
            showError('Erreur lors du chargement des détails de l\'annonce');
        }
    }
    
    function renderAnnouncementDetail(announcement) {
        const createdDate = new Date(announcement.created_at);
        const formattedDate = createdDate.toLocaleDateString('fr-FR');
        
        document.title = `${announcement.title} - Actu&Média`;
        
        announcementDetail.innerHTML = `
            <div class="announcement-header">
                <h1>${announcement.title}</h1>
                <div class="category-badge">${getCategoryLabel(announcement.category)}</div>
            </div>
            
            ${announcement.image_url ? `
                <div class="announcement-image">
                    <img src="${announcement.image_url}" alt="${announcement.title}">
                </div>
            ` : ''}
            
            <div class="announcement-info">
                ${announcement.price ? `<div class="announcement-price">${announcement.price} €</div>` : ''}
                
                <div class="announcement-location">
                    <span class="material-icons">location_on</span>
                    <span>${announcement.location}</span>
                </div>
                
                <div class="announcement-date">
                    <span class="material-icons">calendar_today</span>
                    <span>Publié le ${formattedDate}</span>
                </div>
            </div>
            
            <div class="announcement-description">
                <h2>Description</h2>
                <p>${announcement.description.replace(/\\n/g, '<br>')}</p>
            </div>
            
            <div class="announcement-contact">
                <h2>Contact</h2>
                <p>${announcement.contact}</p>
            </div>
            
            ${announcement.user_id === currentUser ? `
                <div class="owner-actions">
                    <button class="secondary-button edit-announcement" data-id="${announcement.id}">
                        <span class="material-icons">edit</span> Modifier
                    </button>
                    <button class="secondary-button delete-announcement" data-id="${announcement.id}">
                        <span class="material-icons">delete</span> Supprimer
                    </button>
                </div>
            ` : ''}
        `;
        
        // Ajouter les écouteurs d'événements pour les actions du propriétaire
        const editBtn = document.querySelector('.edit-announcement');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                window.location.href = `/annonces?edit=${announcement.id}`;
            });
        }
        
        const deleteBtn = document.querySelector('.delete-announcement');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
                    deleteAnnouncement(announcement.id);
                }
            });
        }
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
    
    function showError(message) {
        announcementDetail.innerHTML = `
            <div class="error-message">
                <span class="material-icons">error_outline</span>
                <p>${message}</p>
                <a href="/annonces" class="primary-button">
                    <span class="material-icons">arrow_back</span>
                    Retour aux annonces
                </a>
            </div>
        `;
    }
    
    async function deleteAnnouncement(id) {
        try {
            const { error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', id);
                
            if (error) throw error;
            
            showToast('Annonce supprimée avec succès');
            setTimeout(() => {
                window.location.href = '/annonces';
            }, 1500);
        } catch (error) {
            console.error('Erreur suppression:', error);
            showToast('Erreur lors de la suppression', 'error');
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
        
        .announcement-detail-container {
            padding: 20px;
            max-width: 800px;
            margin: 70px auto 80px;
        }
        
        .announcement-header {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .announcement-header h1 {
            margin: 0;
            color: var(--primary-color);
            font-size: 28px;
        }
        
        .category-badge {
            display: inline-block;
            background: var(--primary-color);
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 14px;
            align-self: flex-start;
        }
        
        .announcement-image {
            margin-bottom: 20px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        
        .announcement-image img {
            width: 100%;
            max-height: 400px;
            object-fit: cover;
            display: block;
        }
        
        .announcement-info {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 25px;
            background: #f9f9f9;
            padding: 15px;
            border-radius: 12px;
        }
        
        .announcement-price {
            font-size: 28px;
            font-weight: bold;
            color: var(--primary-color);
            grid-column: 1 / -1;
        }
        
        .announcement-location, .announcement-date {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #555;
        }
        
        .announcement-description, .announcement-contact {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
        }
        
        .announcement-description h2, .announcement-contact h2 {
            margin-top: 0;
            color: var(--primary-color);
            font-size: 20px;
            margin-bottom: 10px;
        }
        
        .announcement-description p {
            line-height: 1.6;
            white-space: pre-line;
        }
        
        .owner-actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        .detail-actions {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
        }
        
        .error-message {
            text-align: center;
            padding: 40px 20px;
            background: #f9f9f9;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
        }
        
        .error-message .material-icons {
            font-size: 48px;
            color: #f44336;
        }
        
        .error-message p {
            font-size: 18px;
            color: #555;
            margin: 0;
        }
        
        /* Squelettes de chargement */
        .loading-skeleton {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .skeleton-header, .skeleton-image, .skeleton-info, .skeleton-description, .skeleton-contact {
            background: #f0f0f0;
            border-radius: 12px;
            position: relative;
            overflow: hidden;
        }
        
        .skeleton-header {
            height: 80px;
        }
        
        .skeleton-image {
            height: 300px;
        }
        
        .skeleton-info {
            height: 100px;
        }
        
        .skeleton-description {
            height: 200px;
        }
        
        .skeleton-contact {
            height: 100px;
        }
        
        .skeleton-header::after, .skeleton-image::after, .skeleton-info::after, .skeleton-description::after, .skeleton-contact::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            transform: translateX(-100%);
            background-image: linear-gradient(
                90deg,
                rgba(255, 255, 255, 0) 0,
                rgba(255, 255, 255, 0.2) 20%,
                rgba(255, 255, 255, 0.5) 60%,
                rgba(255, 255, 255, 0)
            );
            animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
            100% {
                transform: translateX(100%);
            }
        }
        
        @media (max-width: 600px) {
            .announcement-header h1 {
                font-size: 24px;
            }
            
            .announcement-price {
                font-size: 24px;
            }
            
            .owner-actions {
                flex-direction: column;
            }
            
            .owner-actions button {
                width: 100%;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Charger les détails de l'annonce
    loadAnnouncementDetail();
    
    // Menu latéral
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