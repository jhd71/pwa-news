// js/moderationManager.js
import { supabase } from './supabase-client.js';

export default class ModerationManager {
    constructor() {
        this.currentUser = null;
        this.forbiddenWords = [];
        this.isModerator = false;
    }

    async init() {
        try {
            // Récupérer l'utilisateur actuel
            const { data: { user } } = await supabase.auth.getUser();
            this.currentUser = user;

            // Vérifier si l'utilisateur est modérateur
            if (user) {
                await this.checkModeratorStatus();
            }

            // Charger les mots interdits
            await this.loadForbiddenWords();
        } catch (error) {
            console.error('Erreur d\'initialisation du gestionnaire de modération:', error);
        }
    }

    async checkModeratorStatus() {
        // Vérifier si l'utilisateur est dans la table des modérateurs
        const { data, error } = await supabase
            .from('moderators')
            .select('*')
            .eq('user_id', this.currentUser.id)
            .eq('is_active', true)
            .single();

        this.isModerator = !error && data;
    }

    async loadForbiddenWords() {
        const { data, error } = await supabase
            .from('forbidden_words')
            .select('word');

        if (error) {
            console.error('Erreur de chargement des mots interdits:', error);
            return;
        }

        this.forbiddenWords = data.map(item => item.word.toLowerCase());
    }

    containsForbiddenWord(message) {
        const lowerMessage = message.toLowerCase();
        return this.forbiddenWords.some(word => 
            lowerMessage.includes(word)
        );
    }

    async addForbiddenWord(word) {
        if (!this.isModerator) {
            throw new Error('Accès non autorisé');
        }

        const { data, error } = await supabase
            .from('forbidden_words')
            .insert({
                word: word.toLowerCase(),
                created_by: this.currentUser.id
            })
            .select();

        if (error) {
            console.error('Erreur lors de l\'ajout du mot interdit:', error);
            throw error;
        }

        // Mettre à jour la liste locale
        this.forbiddenWords.push(word.toLowerCase());

        // Journaliser l'action
        await this.logModerationAction('word_added', data[0].id, {
            word: word
        });

        return data[0];
    }

    async banUser(userId, reason, duration = null) {
        if (!this.isModerator) {
            throw new Error('Accès non autorisé');
        }

        // Calculer la date d'expiration
        const expiresAt = duration 
            ? new Date(Date.now() + duration) 
            : null;

        const { data, error } = await supabase
            .from('banned_users')
            .upsert({
                user_id: userId,
                reason: reason,
                banned_by: this.currentUser.id,
                expires_at: expiresAt
            })
            .select();

        if (error) {
            console.error('Erreur lors du bannissement:', error);
            throw error;
        }

        // Journaliser l'action
        await this.logModerationAction('user_banned', userId, {
            reason: reason,
            duration: duration
        });

        return data[0];
    }

    async unbanUser(userId) {
        if (!this.isModerator) {
            throw new Error('Accès non autorisé');
        }

        const { error } = await supabase
            .from('banned_users')
            .delete()
            .eq('user_id', userId);

        if (error) {
            console.error('Erreur lors du débannissement:', error);
            throw error;
        }

        // Journaliser l'action
        await this.logModerationAction('user_unbanned', userId);
    }

    async deleteMessage(messageId) {
        if (!this.isModerator) {
            throw new Error('Accès non autorisé');
        }

        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', messageId);

        if (error) {
            console.error('Erreur de suppression du message:', error);
            throw error;
        }

        // Journaliser l'action
        await this.logModerationAction('message_deleted', messageId);
    }

    async logModerationAction(actionType, targetId, details = {}) {
        const { error } = await supabase
            .from('moderation_logs')
            .insert({
                action_type: actionType,
                target_id: targetId,
                moderator_id: this.currentUser.id,
                details: details
            });

        if (error) {
            console.error('Erreur de journalisation:', error);
        }
    }

    async checkUserBanned(userId) {
        const { data, error } = await supabase
            .from('banned_users')
            .select('*')
            .eq('user_id', userId)
            .gt('expires_at', new Date().toISOString())
            .single();

        return !error && data;
    }

    async getModerationLogs(limit = 50) {
        const { data, error } = await supabase
            .from('moderation_logs')
            .select('*, moderator:users(email), target:users(email)')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Erreur de récupération des logs:', error);
            throw error;
        }

        return data;
    }
}