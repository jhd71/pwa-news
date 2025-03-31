document.addEventListener('DOMContentLoaded', function() {
    // Référence à l'instance Supabase globale
    const supabase = window.supabase;
    
    // Références aux éléments du DOM
    const pendingAnnouncementsGrid = document.getElementById('pendingAnnouncements');
    const approvedAnnouncementsGrid = document.getElementById('approvedAnnouncements');
    const rejectedAnnouncementsGrid = document.getElementById('rejectedAnnouncements');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const rejectModal = document.getElementById('rejectModal');
    const confirmRejectBtn = document.getElementById('confirmReject');
    const cancelRejectBtn = document.getElementById('cancelReject');
    const closeModalBtn = document.querySelector('.close-modal');
    
    // Variables globales
    let currentAnnouncementId = null;
    
    // Vérifier si l'utilisateur est admin
   async function checkAdminAccess() {
    // Vérifier si l'utilisateur est déjà considéré comme admin dans cette session
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    
    if (!isAdmin) {
        // Demander un mot de passe
        const password = prompt("admin2024");
        
        // Remplacez "votre_mot_de_passe_admin" par un mot de passe de votre choix
        if (password !== "votre_mot_de_passe_admin") {
            alert('Mot de passe incorrect. Accès refusé.');
            window.location.href = '/';
            return false;
        }
        
        // Si correct, enregistrer en session
        localStorage.setItem('isAdmin', 'true');
    }
    
    return true;
}
    
    // Charger les annonces selon leur statut
    async function loadAnnouncements(status) {
        const container = document.getElementById(`${status}Announcements`);
        if (!container) return;
        
        container.innerHTML = `
            <div class="loading-skeleton">
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
            </div>
        `;
        
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .eq('status', status)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            renderAnnouncements(data, container, status);
        } catch (error) {
            console.error(`Erreur chargement annonces ${status}:`, error);
            container.innerHTML = `
                <div class="error-message">
                    <p>Erreur lors du chargement des annonces.</p>
                </div>
            `;
        }
    }
    
    // Rendre les annonces dans le conteneur approprié
    function renderAnnouncements(announcements, container, status) {
        if (!announcements || announcements.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <p>Aucune annonce ${getStatusLabel(status)}.</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        announcements.forEach(announcement => {
            const createdDate = new Date(announcement.created_at);
            const formattedDate = createdDate.toLocaleDateString('fr-FR');
            
            html += `
                <div class="admin-card" data-id="${announcement.id}">
                    <div class="status-badge status-${status}">${getStatusLabel(status)}</div>
                    <div class="card-image" style="height: 180px; background-image: url('${announcement.image_url || '/images/default-announcement.jpg'}')"></div>
                    <div class="card-content" style="padding: 15px;">
                        <div class="card-category" style="display: inline-block; background: #f0f0f0; padding: 5px 10px; border-radius: 15px; font-size: 12px; margin-bottom: 10px;">${getCategoryLabel(announcement.category)}</div>
                        <h3 style="margin: 0 0 10px 0; font-size: 18px;">${announcement.title}</h3>
                        ${announcement.price ? `<div style="font-weight: bold; color: var(--primary-color); margin-bottom: 10px;">${announcement.price} €</div>` : ''}
                        <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 10px;">
                            <span class="material-icons" style="font-size: 16px; color: #666;">location_on</span>
                            <span style="color: #666; font-size: 14px;">${announcement.location}</span>
                        </div>
                        <p style="margin: 0 0 10px 0; color: #555; font-size: 14px;">${announcement.description.substring(0, 100)}${announcement.description.length > 100 ? '...' : ''}</p>
                        <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 5px;">
                            <span class="material-icons" style="font-size: 16px; color: #666;">person</span>
                            <span style="color: #666; font-size: 14px;">Par ${announcement.user_id}</span>
                        </div>
                        <div style="font-size: 12px; color: #999;">Publiée le ${formattedDate}</div>
                        <div style="margin-top: 10px;">
                            <strong>Contact:</strong> ${announcement.contact}
                        </div>
                    </div>
                    <div class="admin-actions">
                        ${status === 'pending' ? `
                            <button class="approve-btn" data-id="${announcement.id}">
                                <span class="material-icons">check_circle</span> Approuver
                            </button>
                            <button class="reject-btn" data-id="${announcement.id}">
                                <span class="material-icons">cancel</span> Rejeter
                            </button>
                        ` : ''}
                        ${status === 'rejected' ? `
                            <button class="restore-btn" data-id="${announcement.id}">
                                <span class="material-icons">restore</span> Restaurer
                            </button>
                        ` : ''}
                        ${status === 'approved' ? `
                            <button class="reject-btn" data-id="${announcement.id}">
                                <span class="material-icons">cancel</span> Suspendre
                            </button>
                        ` : ''}
                        <button class="delete-btn" data-id="${announcement.id}">
                            <span class="material-icons">delete</span> Supprimer
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Ajouter les gestionnaires d'événements
        if (status === 'pending' || status === 'approved') {
            container.querySelectorAll('.approve-btn').forEach(button => {
                button.addEventListener('click', () => {
                    approveAnnouncement(button.dataset.id);
                });
            });
            
            container.querySelectorAll('.reject-btn').forEach(button => {
                button.addEventListener('click', () => {
                    showRejectModal(button.dataset.id);
                });
            });
        }
        
        if (status === 'rejected') {
            container.querySelectorAll('.restore-btn').forEach(button => {
                button.addEventListener('click', () => {
                    restoreAnnouncement(button.dataset.id);
                });
            });
        }
        
        container.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', () => {
                if (confirm('Êtes-vous sûr de vouloir supprimer définitivement cette annonce ?')) {
                    deleteAnnouncement(button.dataset.id);
                }
            });
        });
    }
    
    // Obtenir le libellé du statut
    function getStatusLabel(status) {
        switch (status) {
            case 'pending': return 'En attente';
            case 'approved': return 'Approuvée';
            case 'rejected': return 'Rejetée';
            default: return status;
        }
    }
    
    // Obtenir le libellé de la catégorie
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
    
    // Fonction pour approuver une annonce
    async function approveAnnouncement(id) {
        try {
            const { error } = await supabase
                .from('announcements')
                .update({ status: 'approved' })
                .eq('id', id);
                
            if (error) throw error;
            
            showToast('Annonce approuvée avec succès');
            reloadAllTabs();
        } catch (error) {
            console.error('Erreur approbation:', error);
            showToast('Erreur lors de l\'approbation', 'error');
        }
    }
    
    // Fonction pour rejeter une annonce
    async function rejectAnnouncement(id, reason = '') {
        try {
            const { error } = await supabase
                .from('announcements')
                .update({ 
                    status: 'rejected',
                    reject_reason: reason
                })
                .eq('id', id);
                
            if (error) throw error;
            
            showToast('Annonce rejetée avec succès');
            reloadAllTabs();
            hideRejectModal();
        } catch (error) {
            console.error('Erreur rejet:', error);
            showToast('Erreur lors du rejet', 'error');
        }
    }
    
    // Fonction pour restaurer une annonce rejetée
    async function restoreAnnouncement(id) {
        try {
            const { error } = await supabase
                .from('announcements')
                .update({ 
                    status: 'pending',
                    reject_reason: null
                })
                .eq('id', id);
                
            if (error) throw error;
            
            showToast('Annonce restaurée avec succès');
            reloadAllTabs();
        } catch (error) {
            console.error('Erreur restauration:', error);
            showToast('Erreur lors de la restauration', 'error');
        }
    }
    
    // Fonction pour supprimer définitivement une annonce
    async function deleteAnnouncement(id) {
        try {
            const { error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', id);
                
            if (error) throw error;
            
            showToast('Annonce supprimée avec succès');
            reloadAllTabs();
        } catch (error) {
            console.error('Erreur suppression:', error);
            showToast('Erreur lors de la suppression', 'error');
        }
    }
    
    // Recharger toutes les listes d'annonces
    function reloadAllTabs() {
        loadAnnouncements('pending');
        loadAnnouncements('approved');
        loadAnnouncements('rejected');
    }
    
    // Afficher la modal de rejet
    function showRejectModal(id) {
        currentAnnouncementId = id;
        document.getElementById('rejectReason').value = '';
        rejectModal.classList.remove('hidden');
    }
    
    // Masquer la modal de rejet
    function hideRejectModal() {
        rejectModal.classList.add('hidden');
        currentAnnouncementId = null;
    }
    
    // Afficher un toast
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
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
    
    // Initialiser l'application
    async function initialize() {
        if (!(await checkAdminAccess())) return;
        
        // Charger les annonces
        loadAnnouncements('pending');
        loadAnnouncements('approved');
        loadAnnouncements('rejected');
        
        // Gérer les onglets
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Désactiver tous les onglets
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Activer l'onglet sélectionné
                button.classList.add('active');
                document.getElementById(`${button.dataset.tab}-tab`).classList.add('active');
            });
        });
        
        // Gérer la modal de rejet
        confirmRejectBtn.addEventListener('click', () => {
            const reason = document.getElementById('rejectReason').value;
            if (currentAnnouncementId) {
                rejectAnnouncement(currentAnnouncementId, reason);
            }
        });
        
        cancelRejectBtn.addEventListener('click', hideRejectModal);
        closeModalBtn.addEventListener('click', hideRejectModal);
        
        // Ajouter des styles pour les toasts si pas déjà présent
        if (!document.querySelector('style[data-toast-styles]')) {
            const style = document.createElement('style');
            style.setAttribute('data-toast-styles', 'true');
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
        }
    }
    
    initialize();
});