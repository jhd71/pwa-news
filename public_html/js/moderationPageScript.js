// js/moderationPageScript.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://aqedqlzsguvkopucyqbb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZWRxbHpzZ3V2a29wdWN5cWJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1MDAxNzUsImV4cCI6MjA1MjA3NjE3NX0.tjdnqCIW0dgmzn3VYx0ugCrISLPFMLhOQJBnnC5cfoo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class ModerationPage {
    constructor() {
        this.currentUser = null;
        this.isModerator = false;
    }

    async init() {
        try {
            // Vérifier l'authentification
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert('Veuillez vous connecter');
                window.location.href = '/login.html';
                return false;
            }

            // Vérifier les droits de modération
            const { data: moderatorData, error } = await supabase
                .from('moderators')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .single();

            if (error || !moderatorData) {
                alert('Vous n\'avez pas les droits de modération');
                window.location.href = '/index.html';
                return false;
            }

            // L'utilisateur est un modérateur
            this.currentUser = user;
            this.isModerator = true;

            // Initialiser les événements
            this.setupEventListeners();
            this.loadForbiddenWords();
            this.loadMessages();
            this.loadUsers();

            return true;

        } catch (error) {
            console.error('Erreur d\'initialisation:', error);
            alert('Erreur de chargement');
            return false;
        }
    }

    setupEventListeners() {
        // Gestion des onglets
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Désactiver tous les onglets
                tabButtons.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));

                // Activer l'onglet sélectionné
                btn.classList.add('active');
                document.getElementById(`${btn.dataset.tab}-tab`).classList.remove('hidden');
            });
        });

        // Formulaire des mots interdits
        const forbiddenWordsForm = document.getElementById('forbiddenWordsForm');
        forbiddenWordsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const wordInput = document.getElementById('newForbiddenWord');
            const word = wordInput.value.trim();

            if (!word) return;

            try {
                const { data, error } = await supabase
                    .from('forbidden_words')
                    .insert({ 
                        word: word, 
                        created_by: this.currentUser.id 
                    });

                if (error) throw error;

                wordInput.value = '';
                this.loadForbiddenWords();
            } catch (error) {
                console.error('Erreur ajout mot interdit:', error);
                alert('Impossible d\'ajouter le mot');
            }
        });
    }

    async loadForbiddenWords() {
        const wordsList = document.getElementById('forbiddenWordsList');
        wordsList.innerHTML = '';

        try {
            const { data, error } = await supabase
                .from('forbidden_words')
                .select('*');

            if (error) throw error;

            data.forEach(wordItem => {
                const li = document.createElement('li');
                li.innerHTML = `
                    ${wordItem.word}
                    <button class="remove-word" data-id="${wordItem.id}">Supprimer</button>
                `;
                wordsList.appendChild(li);

                // Ajout de l'événement de suppression
                li.querySelector('.remove-word').addEventListener('click', async () => {
                    try {
                        const { error } = await supabase
                            .from('forbidden_words')
                            .delete()
                            .eq('id', wordItem.id);

                        if (error) throw error;
                        this.loadForbiddenWords();
                    } catch (error) {
                        console.error('Erreur suppression mot:', error);
                    }
                });
            });
        } catch (error) {
            console.error('Erreur chargement mots interdits:', error);
        }
    }

    async loadMessages() {
        const messagesList = document.getElementById('messagesList');
        messagesList.innerHTML = 'Chargement des messages...';

        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*, user:users(email)')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            messagesList.innerHTML = '';
            data.forEach(message => {
                const messageEl = document.createElement('div');
                messageEl.classList.add('message-item');
                messageEl.innerHTML = `
                    <div class="message-header">
                        <span class="message-user">${message.user.email}</span>
                        <span class="message-date">${new Date(message.created_at).toLocaleString()}</span>
                    </div>
                    <div class="message-content">${message.content}</div>
                    <button class="delete-message" data-id="${message.id}">Supprimer</button>
                `;

                // Événement de suppression
                messageEl.querySelector('.delete-message').addEventListener('click', async () => {
                    try {
                        const { error } = await supabase
                            .from('messages')
                            .delete()
                            .eq('id', message.id);

                        if (error) throw error;
                        messageEl.remove();
                    } catch (error) {
                        console.error('Erreur suppression message:', error);
                    }
                });

                messagesList.appendChild(messageEl);
            });
        } catch (error) {
            console.error('Erreur chargement messages:', error);
            messagesList.innerHTML = 'Erreur de chargement des messages';
        }
    }

    async loadUsers() {
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = 'Chargement des utilisateurs...';

        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .limit(50);

            if (error) throw error;

            usersList.innerHTML = '';
            data.forEach(user => {
                const userEl = document.createElement('div');
                userEl.classList.add('user-item');
                userEl.innerHTML = `
                    <span class="user-email">${user.email}</span>
                    <div class="user-actions">
                        <button class="ban-user" data-id="${user.id}">Bannir</button>
                    </div>
                `;

                // Événement de bannissement
                userEl.querySelector('.ban-user').addEventListener('click', async () => {
                    try {
                        const { error } = await supabase
                            .from('banned_users')
                            .insert({
                                user_id: user.id,
                                reason: 'Modération',
                                banned_by: this.currentUser.id
                            });

                        if (error) throw error;
                        userEl.remove();
                    } catch (error) {
                        console.error('Erreur de bannissement:', error);
                    }
                });

                usersList.appendChild(userEl);
            });
        } catch (error) {
            console.error('Erreur chargement utilisateurs:', error);
            usersList.innerHTML = 'Erreur de chargement des utilisateurs';
        }
    }
}

// Initialisation de la page
document.addEventListener('DOMContentLoaded', async () => {
    const moderationPage = new ModerationPage();
    await moderationPage.init();
});