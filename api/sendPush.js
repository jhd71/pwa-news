async sendMessage(content) { 
    try {
        const ip = await this.getClientIP();
        const isBanned = await this.checkBannedIP(ip);
        
        if (isBanned) {
            this.showNotification('Vous êtes banni du chat', 'error');
            return false;
        }

        const message = {
            pseudo: this.pseudo,
            content: content,
            ip: ip,
            created_at: new Date().toISOString()
        };

        const { data, error } = await this.supabase
            .from('messages')
            .insert(message)
            .select()
            .single();

        if (error) throw error;

        // Au lieu d'appeler l'API, utilisons directement OneSignal si disponible
        if (window.OneSignal) {
            console.log("Envoi de notification via OneSignal pour tous les utilisateurs");
            
            // Cette méthode ne fonctionne que pour l'utilisateur actuel
            // Pour des notifications à d'autres utilisateurs, vous aurez besoin d'une API côté serveur
            if (this.pseudo !== message.pseudo) {
                OneSignal.Notifications.sendSelfNotification(
                    `Nouveau message de ${this.pseudo}`,
                    content,
                    window.location.origin,
                    '/icons/icon-192x192.png'
                );
                console.log("Notification locale envoyée");
            }
        } else {
            console.log("OneSignal n'est pas disponible pour envoyer des notifications");
        }

        return true;
    } catch (error) {
        console.error('Erreur sendMessage:', error);
        return false;
    }
}
