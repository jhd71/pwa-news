// js/moderationManager.js
import { supabase } from './supabase-client.js';

export default class ModerationManager {
    constructor() {
        // NE PAS créer une instance de ModerationPanel ici
        this.isModerator = false;
    }

    async checkModeratorStatus() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) return false;
            
            const { data, error } = await supabase
                .from('moderators')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .single();
                
            this.isModerator = Boolean(data && !error);
            return this.isModerator;
        } catch (error) {
            console.error('Erreur de vérification du statut de modérateur:', error);
            return false;
        }
    }

    async addForbiddenWord(word) {
        if (!word) return;
        
        try {
            const { error } = await supabase
                .from('forbidden_words')
                .insert({ word: word.toLowerCase() });
                
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'ajout du mot interdit:', error);
            throw error;
        }
    }

    async banUser(userId, reason, duration) {
        if (!userId) return;
        
        try {
            const { error } = await supabase
                .from('banned_users')
                .insert({
                    user_id: userId,
                    reason,
                    banned_until: duration ? new Date(Date.now() + duration).toISOString() : null,
                    banned_by: (await supabase.auth.getUser()).data.user?.id
                });
                
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Erreur lors du bannissement de l\'utilisateur:', error);
            throw error;
        }
    }
}
	
    async init() {
        try {
            // Récupérer l'utilisateur actuel
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                console.log('Aucun utilisateur connecté');
                return false;
            }

            this.currentUser = user;

            // Vérifier si l'utilisateur est modérateur
            const { data: moderatorData, error } = await supabase
              .from('moderators')
              .select('*')
              .eq('user_id', user.id)
              .eq('is_active', true)
              .single();

            if (error || !moderatorData) {
                console.log('Vous n\'avez pas les droits de modération');
                return false;
            }

            // Marquer l'utilisateur comme modérateur
            this.isModerator = true;

            // Continuer l'initialisation si modérateur
            this.createModerationPanel();
            this.setupEventListeners();
            return true;

        } catch (error) {
            console.error('Erreur d\'initialisation:', error);
            alert('Erreur de connexion');
            return false;
        }
    }

    // Méthode pour afficher le panneau de modération
    show() {
        if (!this.isModerator) {
            alert('Accès refusé. Vous n\'avez pas les droits de modération.');
            return;
        }

        if (this.panelContainer) {
            this.panelContainer.classList.remove('hidden');
            
            // Recharger les données
            this.loadForbiddenWords();
            this.loadBannedUsers();
            this.loadModerationLogs();
        } else {
            // Si le panneau n'existe pas encore, le créer
            this.createModerationPanel();
        }
    }

    createModerationPanel() {
        // Créer le conteneur du panneau
        this.panelContainer = document.createElement('div');
        this.panelContainer.id = 'moderation-panel';
        this.panelContainer.className = 'moderation-panel hidden';
        this.panelContainer.innerHTML = `
            <div class="moderation-panel-header">
                <h2>Panneau de Modération</h2>
                <button id="closeModerationPanel" class="close-btn">
                    <span class="material-icons">close</span>
                </button>
            </div>

            <div class="moderation-panel-content">
                <!-- Onglets de modération -->
                <div class="moderation-tabs">
                    <button class="tab-btn active" data-tab="forbidden-words">Mots Interdits</button>
                    <button class="tab-btn" data-tab="banned-users">Utilisateurs Bannis</button>
                    <button class="tab-btn" data-tab="moderation-logs">Logs</button>
                </div>

                <!-- Contenu des onglets -->
                <div class="tab-content" id="forbidden-words-tab">
                    <h3>Gestion des Mots Interdits</h3>
                    <form id="addForbiddenWordForm">
                        <input 
                            type="text" 
                            id="forbiddenWordInput" 
                            placeholder="Ajouter un mot interdit" 
                            required
                        >
                        <button type="submit">Ajouter</button>
                    </form>
                    <ul id="forbiddenWordsList"></ul>
                </div>

                <div class="tab-content hidden" id="banned-users-tab">
                    <h3>Utilisateurs Bannis</h3>
                    <form id="banUserForm">
                        <select id="userSelect" required>
                            <!-- Options d'utilisateurs seront remplies dynamiquement -->
                        </select>
                        <input 
                            type="text" 
                            id="banReason" 
                            placeholder="Raison du bannissement" 
                            required
                        >
                        <select id="banDuration">
                            <option value="">Durée du bannissement</option>
                            <option value="3600000">1 heure</option>
                            <option value="86400000">1 jour</option>
                            <option value="604800000">1 semaine</option>
                            <option value="2592000000">1 mois</option>
                        </select>
                        <button type="submit">Bannir</button>
                    </form>
                    <ul id="bannedUsersList"></ul>
                </div>

                <div class="tab-content hidden" id="moderation-logs-tab">
                    <h3>Logs de Modération</h3>
                    <table id="moderationLogsTable">
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>Cible</th>
                                <th>Modérateur</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody id="moderationLogsBody"></tbody>
                    </table>
                </div>
            </div>
        `;

        // Ajouter au DOM
        document.body.appendChild(this.panelContainer);

        // Charger les données initiales
        this.loadForbiddenWords();
        this.loadBannedUsers();
        this.loadModerationLogs();
    }

    setupEventListeners() {
        if (!this.panelContainer) return;

        // Fermeture du panneau
        const closeButton = document.getElementById('closeModerationPanel');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hide();
            });
        }

        // Gestion des onglets
        const tabButtons = this.panelContainer.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Désactiver tous les onglets
                tabButtons.forEach(b => b.classList.remove('active'));
                this.panelContainer.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));

                // Activer l'onglet sélectionné
                btn.classList.add('active');
                document.getElementById(`${btn.dataset.tab}-tab`).classList.remove('hidden');
            });
        });

        // Formulaire d'ajout de mots interdits
        const addWordForm = document.getElementById('addForbiddenWordForm');
        if (addWordForm) {
            addWordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const wordInput = document.getElementById('forbiddenWordInput');
                try {
                    await this.moderationManager.addForbiddenWord(wordInput.value);
                    wordInput.value = '';
                    this.loadForbiddenWords();
                } catch (error) {
                    alert('Erreur : ' + error.message);
                }
            });
        }

        // Formulaire de bannissement
        const banUserForm = document.getElementById('banUserForm');
        if (banUserForm) {
            banUserForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const userSelect = document.getElementById('userSelect');
                const banReason = document.getElementById('banReason');
                const banDuration = document.getElementById('banDuration');

                try {
                    await this.moderationManager.banUser(
                        userSelect.value, 
                        banReason.value,
                        banDuration.value ? parseInt(banDuration.value) : null
                    );
                    banReason.value = '';
                    this.loadBannedUsers();
                } catch (error) {
                    alert('Erreur : ' + error.message);
                }
            });
        }
    }

    async loadForbiddenWords() {
    const wordsList = document.getElementById('forbiddenWordsList');
    if (!wordsList) return;
    
    wordsList.innerHTML = ''; // Vider la liste

    try {
        const { data, error } = await supabase
            .from('forbidden_words')
            .select('*');

        if (error) {
            console.error('Erreur de chargement des mots interdits:', error);
            return;
        }

        if (!data || data.length === 0) {
            wordsList.innerHTML = '<li>Aucun mot interdit configuré</li>';
            return;
        }

        data.forEach(word => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${word.word}
                <button class="remove-word" data-id="${word.id}">Supprimer</button>
            `;
            wordsList.appendChild(li);
        });

        // Ajouter des écouteurs pour supprimer des mots
        wordsList.querySelectorAll('.remove-word').forEach(btn => {
            btn.addEventListener('click', async () => {
                try {
                    const wordId = btn.dataset.id;
                    const { error } = await supabase
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
        wordsList.innerHTML = '<li>Erreur de chargement</li>';
    }
}

    async loadBannedUsers() {
        const bannedUsersList = document.getElementById('bannedUsersList');
        const userSelect = document.getElementById('userSelect');
        if (!bannedUsersList || !userSelect) return;
        
        bannedUsersList.innerHTML = '';
        userSelect.innerHTML = '<option value="">Sélectionner un utilisateur</option>';

        // Récupérer tous les utilisateurs
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, email');

        if (userError) {
            console.error('Erreur de chargement des utilisateurs:', userError);
            return;
        }

        // Récupérer les utilisateurs bannis
        const { data: bannedUsers, error } = await supabase
            .from('banned_users')
            .select('*, user:users(email)');

        if (error) {
            console.error('Erreur de chargement des utilisateurs bannis:', error);
            return;
        }

        // Peupler la liste des utilisateurs à bannir
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.email;
            userSelect.appendChild(option);
        });

        // Afficher les utilisateurs bannis
        bannedUsers.forEach(ban => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${ban.user.email} - Raison: ${ban.reason || 'Non spécifiée'}
                <button class="unban-user" data-id="${ban.user_id}">Débannir</button>
            `;
            bannedUsersList.appendChild(li);
        });

        // Ajouter des écouteurs pour débannir
        bannedUsersList.querySelectorAll('.unban-user').forEach(btn => {
            btn.addEventListener('click', async () => {
                const userId = btn.dataset.id;
                await supabase
                    .from('banned_users')
                    .delete()
                    .eq('user_id', userId);
                this.loadBannedUsers();
            });
        });
    }

    async loadModerationLogs() {
        const logsBody = document.getElementById('moderationLogsBody');
        if (!logsBody) return;
        
        logsBody.innerHTML = ''; // Vider les logs existants

        const { data, error } = await supabase
            .from('moderation_logs')
            .select('*, moderator:users(email), target:users(email)')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Erreur de chargement des logs:', error);
            return;
        }

        data.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${log.action_type}</td>
                <td>${log.target?.email || 'N/A'}</td>
                <td>${log.moderator?.email || 'Système'}</td>
                <td>${new Date(log.created_at).toLocaleString()}</td>
            `;
            logsBody.appendChild(row);
        });
    }

    // Méthode pour masquer le panneau de modération
    hide() {
        if (this.panelContainer) {
            this.panelContainer.classList.add('hidden');
        }
    }
