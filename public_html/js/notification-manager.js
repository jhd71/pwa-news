// notification-manager.js
class NotificationManager {
    constructor() {
        this.initialized = false;
        this.vapidPublicKey = 'BLpaDhsC7NWdMacPN0mRpqZlsaOrOEV1AwgPyqs7D2q3HBZaQqGSMH8zTnmwzZrFKjjO2JvDonicGOl2zX9Jsck'; // Votre clé publique existante
        this.supabase = null;
        this.subscriptionEndpoint = '/api/save-subscription.js';
        this.pseudo = localStorage.getItem('chatPseudo');
        this.isAdmin = localStorage.getItem('isAdmin') === 'true';
    }

    // Convertit une clé base64 en tableau Uint8Array pour l'API PushManager
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
    
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
    
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Vérifie si les notifications sont supportées
    async checkNotificationSupport() {
        if (!('serviceWorker' in navigator)) {
            this.showNotification('Votre navigateur ne supporte pas les Service Workers.', 'error');
            return false;
        }
        
        if (!('PushManager' in window)) {
            this.showNotification('Votre navigateur ne supporte pas les notifications push.', 'error');
            return false;
        }
        
        return true;
    }

    // Demande la permission et s'abonne aux notifications
    async requestPermissionAndSubscribe() {
        try {
            // Vérifier le support des notifications
            const isSupported = await this.checkNotificationSupport();
            if (!isSupported) return false;

            // Demander la permission
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                // S'abonner aux notifications
                const subscriptionResult = await this.subscribeToPush();
                return subscriptionResult;
            } else {
                this.showNotification('Les notifications sont désactivées.', 'info');
                return false;
            }
        } catch (error) {
            console.error('Erreur lors de la demande de permission:', error);
            this.showNotification('Erreur lors de la configuration des notifications.', 'error');
            return false;
        }
    }

    // S'abonne aux notifications push
    async subscribeToPush() {
        try {
            // Obtenir l'enregistrement du Service Worker
            const registration = await navigator.serviceWorker.ready;
            
            // Vérifier si un abonnement existe déjà
            let subscription = await registration.pushManager.getSubscription();
            
            // Si un abonnement existe, le désabonner pour en créer un nouveau
            if (subscription) {
                await subscription.unsubscribe();
            }
            
            // Créer un nouvel abonnement
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
            });
            
            // Enregistrer l'abonnement dans la base de données
            const saved = await this.saveSubscription(subscription);
            
            if (saved) {
                this.showNotification('Notifications activées avec succès!', 'success');
                return subscription;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Erreur lors de l\'abonnement aux notifications push:', error);
            this.showNotification('Erreur lors de l\'activation des notifications.', 'error');
            return null;
        }
    }

    // Vérifie si l'utilisateur est déjà abonné
    async checkSubscription() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            return !!subscription;
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'abonnement:', error);
            return false;
        }
    }

    // Désabonne l'utilisateur des notifications
    async unsubscribe() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
                // Supprimer l'abonnement du serveur
                await this.deleteSubscription(subscription);
                
                // Désabonner côté client
                const result = await subscription.unsubscribe();
                
                if (result) {
                    this.showNotification('Notifications désactivées.', 'info');
                }
                return result;
            }
            return false;
        } catch (error) {
            console.error('Erreur lors du désabonnement:', error);
            this.showNotification('Erreur lors de la désactivation des notifications.', 'error');
            return false;
        }
    }

    // Enregistre l'abonnement dans la base de données
    async saveSubscription(subscription) {
    try {
        if (this.supabase) {
            // Définir l'utilisateur courant
            await this.supabase.rpc('set_current_user', { user_pseudo: this.pseudo });
            
            // Simplifier - juste insérer un nouvel abonnement
            const { error } = await this.supabase
                .from('push_subscriptions')
                .insert({
                    pseudo: this.pseudo,
                    subscription: JSON.stringify(subscription),
                    endpoint: subscription.endpoint || 'unknown',
                    device_type: this.getDeviceType(),
                    active: true
                });
                
            if (error) {
                console.error('Erreur insertion abonnement:', error);
                throw error;
            }
            
            return true;
        } else {
            // Le reste du code...
        }
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'abonnement:', error);
        return false;
    }
}

    // Supprime l'abonnement de la base de données
    async deleteSubscription(subscription) {
    try {
        if (this.supabase) {
            // Essayer de supprimer via Supabase
            try {
                await this.supabase.rpc('set_current_user', { user_pseudo: this.pseudo }).catch(() => {});
                
                const { error } = await this.supabase
                    .from('push_subscriptions')
                    .delete()
                    .eq('pseudo', this.pseudo);
                    
                if (!error) return true;
            } catch (supabaseError) {
                console.warn('Erreur Supabase, utilisation du fallback API');
            }
        }
        
        // Fallback sur l'API
        try {
            const response = await fetch(this.subscriptionEndpoint, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    endpoint: subscription?.endpoint || '',
                    userId: this.pseudo || 'anonymous'
                })
            });
            
            return response.ok;
        } catch (fetchError) {
            console.warn('Erreur API:', fetchError);
            // Retourner true pour ne pas bloquer l'interface
            return true;
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'abonnement:', error);
        // Retourner true pour ne pas bloquer l'interface
        return true;
    }
}

    // Méthode pour envoyer une notification push
    async sendPushNotification(message) {
        try {
            const response = await fetch('/api/send-notification.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: 'Nouveau message',
                    body: message.senderName ? 
                        `${message.senderName}: ${this.truncateMessage(message.content, 50)}` : 
                        this.truncateMessage(message.content, 60),
                    chatMessage: true,
                    icon: '/images/chat-notification.png',
                    data: {
                        type: 'chat',
                        messageId: message.id,
                        senderId: message.senderId || message.pseudo,
                        timestamp: Date.now()
                    },
                    sendToAll: true
                })
            });
            
            const result = await response.json();
            console.log('Résultat notification push:', result);
            return result;
        } catch (error) {
            console.error('Erreur envoi notification push:', error);
            return { success: false, error: error.message };
        }
    }

    // Méthode pour tronquer un message trop long
    truncateMessage(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // Méthode pour déterminer le type d'appareil
    getDeviceType() {
        const ua = navigator.userAgent;
        if (/android/i.test(ua)) {
            return 'android';
        } else if (/iPad|iPhone|iPod/.test(ua)) {
            return 'ios';
        } else {
            return 'desktop';
        }
    }
    
    // Méthode pour afficher une notification (utilise la méthode existante de ChatManager)
    showNotification(message, type = 'info') {
        // Cette méthode sera remplacée par celle de ChatManager lors de l'initialisation
        console.log(`[Notification ${type}]: ${message}`);
    }
    
    // Initialise le gestionnaire de notifications avec les configurations nécessaires
    async init(config = {}) {
        if (this.initialized) return this;
        
        // Fusionner les configurations
        if (config.vapidPublicKey) this.vapidPublicKey = config.vapidPublicKey;
        if (config.supabase) this.supabase = config.supabase;
        if (config.showNotification) this.showNotification = config.showNotification;
        if (config.subscriptionEndpoint) this.subscriptionEndpoint = config.subscriptionEndpoint;
        if (config.pseudo) this.pseudo = config.pseudo;
        if (config.isAdmin !== undefined) this.isAdmin = config.isAdmin;
        
        this.initialized = true;
        
        // Vérifier si le Service Worker est enregistré
        try {
            await navigator.serviceWorker.ready;
            console.log('Service Worker prêt pour les notifications.');
        } catch (error) {
            console.error('Service Worker non disponible:', error);
        }
        
        return this;
    }
}

// Créer et exporter une instance unique
const notificationManager = new NotificationManager();
export default notificationManager;