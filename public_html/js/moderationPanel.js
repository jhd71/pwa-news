// js/moderationPanel.js
class ModerationPanel {
    constructor() {
        this.currentUser = null;
        this.isModerator = false;
        this.panelContainer = null;
    }
    
    async init() {
        try {
            // Vérifier si Supabase est disponible
            if (!window.supabase) {
                console.error('Supabase n\'est pas disponible');
                return false;
            }
            
            // Récupérer l'utilisateur actuel
            const { data: { user } } = await window.supabase.auth.getUser();
            
            if (!user) {
                console.log('Aucun utilisateur connecté');
                return false;
            }

            console.log("ID de l'utilisateur connecté:", user.id);
            
            // Vérifier les droits de modération
            const { data, error } = await window.supabase
                .from('moderators')
                .select('*')
                .eq('user_id', user.id);
            
            console.log("Résultat de la requête moderators:", data, error);
            
            if (error) {
                console.error('Erreur lors de la vérification des droits de modération:', error);
                return false;
            }
            
            // Vérifier si l'utilisateur est un modérateur actif
            const isModerator = data && data.length > 0 && data[0].is_active === true;
            
            if (!isModerator) {
                console.log('Utilisateur non modérateur ou inactif');
                return false;
            }
            
            // L'utilisateur est un modérateur actif
            this.currentUser = user;
            this.isModerator = true;
            console.log("Droits de modération confirmés");
            
            // Activer les boutons
            this.setupEventListeners();
            
            return true;
        } catch (error) {
            console.error('Erreur d\'initialisation du panneau de modération:', error);
            return false;
        }
    }

    setupEventListeners() {
        const openModerationPanelBtn = document.getElementById('openModerationPanel');
        const chatToggleBtn = document.getElementById('chatToggleBtn');

        if (openModerationPanelBtn) {
            openModerationPanelBtn.disabled = false;
            openModerationPanelBtn.addEventListener('click', () => this.show());
        }

        if (chatToggleBtn) {
            chatToggleBtn.disabled = false;
        }
    }

    show() {
        if (!this.isModerator) {
            alert('Vous n\'avez pas les droits de modération');
            return;
        }

        // Si le panneau existe déjà, l'afficher
        if (this.panelContainer) {
            this.panelContainer.classList.remove('hidden');
            this.refreshData();
            return;
        }

        // Sinon créer le panneau
        this.createModerationPanel();
    }

    createModerationPanel() {
        // Créer le conteneur du panneau
        this.panelContainer = document.createElement('div');
        this.panelContainer.id = 'moderation-panel';
        this.panelContainer.className = 'moderation-panel';
        this.panelContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;
        
        this.panelContainer.innerHTML = `
            <div style="background: #6a4fab; color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0;">Panneau de Modération</h2>
                <button id="closeModerationPanel" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">×</button>
            </div>

            <div style="padding: 20px; flex: 1; overflow-y: auto;">
                <div style="margin-bottom: 20px;">
                    <h3>Gestion des Mots Interdits</h3>
                    <form id="addForbiddenWordForm" style="display: flex; margin-bottom: 15px;">
                        <input 
                            type="text" 
                            id="forbiddenWordInput" 
                            placeholder="Ajouter un mot interdit" 
                            style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                            required
                        >
                        <button type="submit" style="background: #6a4fab; color: white; border: none; padding: 8px 15px; margin-left: 10px; border-radius: 4px; cursor: pointer;">Ajouter</button>
                    </form>
                    <ul id="forbiddenWordsList" style="list-style: none; padding: 0;"></ul>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3>Utilisateurs</h3>
                    <p>Fonctionnalité en développement</p>
                </div>
            </div>
        `;

        // Ajouter au DOM
        document.body.appendChild(this.panelContainer);

        // Ajouter les écouteurs d'événements
        document.getElementById('closeModerationPanel').addEventListener('click', () => {
            this.hide();
        });

        // Configurer le formulaire d'ajout de mots interdits
        document.getElementById('addForbiddenWordForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const wordInput = document.getElementById('forbiddenWordInput');
            const word = wordInput.value.trim();
            
            if (!word) return;
            
            try {
                const { error } = await window.supabase
                    .from('forbidden_words')
                    .insert({ word: word.toLowerCase() });
                    
                if (error) throw error;
                
                wordInput.value = '';
                this.loadForbiddenWords();
                alert('Mot interdit ajouté');
            } catch (error) {
                console.error('Erreur lors de l\'ajout du mot interdit:', error);
                alert('Erreur: ' + error.message);
            }
        });

        // Charger les données initiales
        this.refreshData();
    }

    refreshData() {
        this.loadForbiddenWords();
    }

    async loadForbiddenWords() {
        const wordsList = document.getElementById('forbiddenWordsList');
        if (!wordsList) return;
        
        wordsList.innerHTML = '<li style="padding: 10px;">Chargement...</li>';

        try {
            const { data, error } = await window.supabase
                .from('forbidden_words')
                .select('*');

            if (error) {
                console.error('Erreur de chargement des mots interdits:', error);
                wordsList.innerHTML = '<li style="color: red;">Erreur de chargement</li>';
                return;
            }

            wordsList.innerHTML = '';
            
            if (!data || data.length === 0) {
                wordsList.innerHTML = '<li style="padding: 10px;">Aucun mot interdit configuré</li>';
                return;
            }

            data.forEach(word => {
                const li = document.createElement('li');
                li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px; margin-bottom: 5px; background: #f5f5f5; border-radius: 4px;';
                li.innerHTML = `
                    <span>${word.word}</span>
                    <button class="remove-word" data-id="${word.id}" style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Supprimer</button>
                `;
                wordsList.appendChild(li);
            });

            // Ajouter des écouteurs pour supprimer des mots
            wordsList.querySelectorAll('.remove-word').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('Voulez-vous vraiment supprimer ce mot?')) return;
                    
                    try {
                        const wordId = btn.dataset.id;
                        const { error } = await window.supabase
                            .from('forbidden_words')
                            .delete()
                            .eq('id', wordId);
                            
                        if (error) throw error;
                        
                        // Rafraîchir la liste
                        this.loadForbiddenWords();
                    } catch (e) {
                        console.error('Erreur lors de la suppression du mot:', e);
                        alert('Erreur lors de la suppression');
                    }
                });
            });
        } catch (e) {
            console.error('Erreur générale:', e);
            wordsList.innerHTML = '<li style="color: red;">Erreur de chargement</li>';
        }
    }

    hide() {
        if (this.panelContainer) {
            this.panelContainer.style.display = 'none';
        }
    }
}

// Exposer globalement
window.ModerationPanel = ModerationPanel;
