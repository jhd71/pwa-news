import soundManager from '/js/sounds.js';
import notificationManager from '/js/notification-manager.js';

// VÉRIFICATION CRITIQUE: Bloc de sécurité anti-contournement de bannissement
(function() {
    if (localStorage.getItem('chat_device_banned') === 'true') {
        const bannedUntil = localStorage.getItem('chat_device_banned_until');
        let isBanned = true;
        
        // Vérifier si le bannissement a expiré
        if (bannedUntil && bannedUntil !== 'permanent') {
            const expiryTime = parseInt(bannedUntil);
            if (Date.now() > expiryTime) {
                // Le bannissement a expiré
                localStorage.removeItem('chat_device_banned');
                localStorage.removeItem('chat_device_banned_until');
                isBanned = false;
            }
        }
        
        if (isBanned) {
    // Empêcher le chargement du chat
    console.log("🚫 APPAREIL BANNI: Chargement du chat bloqué");
    
    // Attendre que le DOM soit chargé
    document.addEventListener('DOMContentLoaded', function() {
        // Vérifier si le CSS est déjà chargé
        if (!document.getElementById('chat-ban-css')) {
            const link = document.createElement('link');
            link.id = 'chat-ban-css';
            link.rel = 'stylesheet';
            link.href = '/css/chat-ban.css'; // Assurez-vous que ce fichier existe
            document.head.appendChild(link);
        }
        
        // Créer le message de bannissement
        const banMessage = document.createElement('div');
        banMessage.className = 'chat-banned-message';
        banMessage.innerHTML = `
            <div class="banned-icon">🚫</div>
            <h2>Accès interdit</h2>
            <p>Votre accès au chat a été suspendu.</p>
            <button id="dismiss-ban-message" style="background: rgba(255,255,255,0.2); border: none; padding: 5px 10px; margin-top: 10px; color: white; border-radius: 5px; cursor: pointer;">Fermer</button>
        `;
        
        // Ajouter au document
        document.body.appendChild(banMessage);
        
        // Ajouter une fonction pour fermer le message
        document.getElementById('dismiss-ban-message').addEventListener('click', function() {
            banMessage.style.display = 'none';
        });
        
        // Bloquer tout accès au chat
        const chatElements = document.querySelectorAll('.chat-widget, .chat-toggle-btn, #chatToggleBtn');
        chatElements.forEach(el => {
            if (el) el.style.display = 'none';
        });
    });
    
    // Empêcher l'initialisation du chat en générant une erreur
    throw new Error("APPAREIL BANNI: Accès au chat bloqué");
}
    }
})();

class ChatManager {
    constructor() {
        // Remplacer la création directe du client Supabase par l'utilisation du client partagé
        this.supabase = window.getSupabaseClient();
    
        this.initialized = false;
        this.container = null;
        this.pseudo = localStorage.getItem('chatPseudo');
        this.isAdmin = localStorage.getItem('isAdmin') === 'true';
        this.lastMessageId = 0;
        this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        this.sounds = new Map();
        this.bannedWords = new Set();
        this.notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
        this.subscription = null;
        this.adminPanelOpen = false;
        this.isOpen = localStorage.getItem('chatOpen') === 'true';
        this.unreadCount = parseInt(localStorage.getItem('unreadCount') || '0');
        this.deviceBanned = false;
		this.realtimeChannel = null;
		this.chatPollingInterval = null;
		this.lastMessageTime = null;
		this.pollingCounter = 0;
		this.isRealtimeEnabled = false;
    }

    getDeviceId() {
        let deviceId = localStorage.getItem('chat_device_id');
        if (!deviceId) {
            deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('chat_device_id', deviceId);
            console.log('Nouvel identifiant d\'appareil généré:', deviceId);
        } else {
            console.log('Identifiant d\'appareil existant:', deviceId);
        }
        return deviceId;
    }
		
	async setCurrentUserForRLS() {
    try {
        if (!this.pseudo) {
            console.warn('Impossible de définir l\'utilisateur RLS: pseudo non défini');
            return false;
        }
        
        console.log(`Définition de l'utilisateur courant pour RLS: ${this.pseudo}`);
        
        // Vérifier d'abord si nous sommes admin
        if (this.isAdmin) {
            // Si nous sommes admin, mettre à jour cette information dans la base
            const { data: userData, error: userError } = await this.supabase
                .from('users')
                .select('is_admin')
                .eq('pseudo', this.pseudo)
                .single();
                
            if (!userError && userData && !userData.is_admin) {
                // Mettre à jour le statut admin
                const { error: updateError } = await this.supabase
                    .from('users')
                    .update({ is_admin: true })
                    .eq('pseudo', this.pseudo);
                    
                if (updateError) {
                    console.warn('Erreur mise à jour statut admin:', updateError);
                }
            }
        }
        
        // Définir l'utilisateur courant avec plusieurs tentatives en cas d'échec
        let attempts = 0;
        let success = false;
        
        while (attempts < 3 && !success) {
            const { error } = await this.supabase.rpc('set_current_user', { 
                user_pseudo: this.pseudo 
            });
            
            if (error) {
                console.warn(`Tentative ${attempts + 1} échouée:`, error);
                attempts++;
                // Attendre un peu avant de réessayer
                await new Promise(resolve => setTimeout(resolve, 200));
            } else {
                success = true;
                console.log('Utilisateur RLS défini avec succès');
            }
        }
        
        return success;
    } catch (error) {
        console.error('Erreur RLS:', error);
        return false;
    }
}
	
    async init() {
    try {
        // VÉRIFICATION CRITIQUE: Bannissement local
        // Vérifier d'abord si l'appareil est banni localement
        const isBanned = localStorage.getItem('chat_device_banned') === 'true';
        if (isBanned) {
            console.error("APPAREIL BANNI: Initialisation du chat bloquée");
            
            const bannedUntil = localStorage.getItem('chat_device_banned_until');
            let stillBanned = true;
            
            // Vérifier si le bannissement a expiré
            if (bannedUntil && bannedUntil !== 'permanent') {
                const expiryTime = parseInt(bannedUntil);
                if (Date.now() > expiryTime) {
                    // Le bannissement a expiré
                    localStorage.removeItem('chat_device_banned');
                    localStorage.removeItem('chat_device_banned_until');
                    localStorage.removeItem('chat_ban_reason');
                    localStorage.removeItem('chat_ban_dismissed');
                    stillBanned = false;
                }
            }
            
            if (stillBanned) {
                console.log('APPAREIL BANNI: Accès au chat refusé');
                
                // Déconnexion forcée
                this.pseudo = null;
                this.isAdmin = false;
                localStorage.removeItem('chatPseudo');
                localStorage.removeItem('isAdmin');
                
                // Récupérer la raison du bannissement
                const banReason = localStorage.getItem('chat_ban_reason') || '';
                
                // Utiliser notre méthode pour afficher le message
                this.showBanNotification(banReason);
                
                // On garde container pour le chat lui-même mais on le cache
                this.container = document.createElement('div');
                this.container.className = 'chat-widget hidden';
                document.body.appendChild(this.container);
                
                // Empêcher l'initialisation du chat
                return;
            }
        }
        
        // NOUVEAU: Vérification supplémentaire de l'appareil dans la base de données
        const deviceId = this.getDeviceId();
        if (deviceId) {
            try {
                // Vérifier si l'appareil est banni
                const { data: deviceBan, error: deviceError } = await this.supabase
                    .from('banned_ips')
                    .select('*')
                    .eq('ip', deviceId)
                    .maybeSingle();
                    
                if (!deviceError && deviceBan) {
                    // Vérifier si le bannissement est expiré
                    if (deviceBan.expires_at && new Date(deviceBan.expires_at) < new Date()) {
                        // Le bannissement a expiré, supprimer l'entrée
                        await this.supabase
                            .from('banned_ips')
                            .delete()
                            .eq('ip', deviceId);
                    } else {
                        // Appareil banni, afficher le message
                        console.log('APPAREIL BANNI: Accès refusé (base de données)');
                        
                        // Stocker localement
                        localStorage.setItem('chat_device_banned', 'true');
                        localStorage.setItem('chat_device_banned_until', deviceBan.expires_at || 'permanent');
                        localStorage.setItem('chat_ban_reason', deviceBan.reason || 'Appareil banni');
                        
                        // Déconnexion forcée
                        this.pseudo = null;
                        this.isAdmin = false;
                        localStorage.removeItem('chatPseudo');
                        localStorage.removeItem('isAdmin');
                        
                        this.showBanNotification(deviceBan.reason || 'Appareil banni');
                        
                        // On garde container pour le chat lui-même mais on le cache
                        this.container = document.createElement('div');
                        this.container.className = 'chat-widget hidden';
                        document.body.appendChild(this.container);
                        
                        // Empêcher l'initialisation du chat
                        return;
                    }
                }
            } catch (error) {
                console.warn("Erreur lors de la vérification du bannissement d'appareil:", error);
                // Continuer malgré l'erreur
            }
        }
        
        // NOUVEAU: Vérification de l'IP réelle
        const realIP = await this.getClientRealIP();
        
        if (realIP) {
            console.log(`Vérification bannissement pour IP réelle: ${realIP}`);
            
            // Vérifie si l'IP est dans la table des IPs bannies
            const { data: ipBan, error: ipBanError } = await this.supabase
                .from('banned_real_ips')
                .select('*')
                .eq('ip', realIP)
                .maybeSingle();
                
            if (!ipBanError && ipBan) {
                // Vérifier si le bannissement est expiré
                if (!ipBan.expires_at || new Date(ipBan.expires_at) > new Date()) {
                    console.log(`IP réelle bannie: ${realIP}`);
                    
                    // Vérifier si le CSS est déjà chargé
                    if (!document.getElementById('chat-ban-css')) {
                        const link = document.createElement('link');
                        link.id = 'chat-ban-css';
                        link.rel = 'stylesheet';
                        link.href = '/css/chat-ban.css';
                        document.head.appendChild(link);
                    }

                    // Créer le message de bannissement
                    const banDiv = document.createElement('div');
                    banDiv.className = 'chat-banned-message';
                    banDiv.innerHTML = `
                        <div class="banned-icon">🚫</div>
                        <h2>Accès interdit</h2>
                        <p>Votre adresse IP a été bannie du chat.</p>
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button id="dismiss-ban-message" style="background: rgba(255,255,255,0.2); border: none; padding: 5px 10px; margin-top: 10px; color: white; border-radius: 5px; cursor: pointer;">Fermer</button>
                            <button id="check-ban-status" style="background: rgba(255,255,255,0.25); border: none; padding: 5px 10px; margin-top: 10px; color: white; border-radius: 5px; cursor: pointer;">Vérifier si débanni</button>
                        </div>
                    `;

                    // Ajouter au document
                    document.body.appendChild(banDiv);

                    // Ajouter une fonction pour fermer le message
                    setTimeout(() => {
                        const dismissBtn = document.getElementById('dismiss-ban-message');
                        if (dismissBtn) {
                            dismissBtn.addEventListener('click', function() {
                                banDiv.style.display = 'none';
                            });
                        }
                        
                        // Gestionnaire pour vérifier si l'utilisateur est toujours banni
                        const checkButton = document.getElementById('check-ban-status');
                        if (checkButton) {
                            checkButton.addEventListener('click', async () => {
                                // Ajouter une animation de chargement
                                checkButton.innerHTML = '<span class="loading-dots">Vérification...</span>';
                                checkButton.disabled = true;
                                
                                try {
                                    // Vérifier dans la base de données si l'IP est toujours bannie
                                    const { data, error } = await this.supabase
                                        .from('banned_real_ips')
                                        .select('*')
                                        .eq('ip', realIP)
                                        .maybeSingle();
                                        
                                    if (error || !data) {
                                        // Si plus banni ou erreur, supprimer le bannissement
                                        banDiv.innerHTML = `
                                            <div class="banned-icon" style="color: #4CAF50;">✓</div>
                                            <h2 style="margin-top: 5px; margin-bottom: 10px; font-size: 20px; font-weight: bold; color: #4CAF50;">Votre bannissement a été levé</h2>
                                            <p style="margin: 0 0 15px 0;">Vous pouvez à nouveau utiliser le chat.</p>
                                            <button id="refresh-page" style="background: #4CAF50; border: none; padding: 8px 15px; color: white; border-radius: 5px; cursor: pointer;">Actualiser la page</button>
                                        `;
                                        
                                        // Créer un cookie pour indiquer que le bannissement a été levé
                                        document.cookie = "chat_ban_lifted=true; path=/; max-age=60";
                                        
                                        // Supprimer les informations de bannissement local
                                        localStorage.removeItem('chat_device_banned');
                                        localStorage.removeItem('chat_device_banned_until');
                                        localStorage.removeItem('chat_ban_reason');
                                        localStorage.removeItem('chat_ban_dismissed');
                                        
                                        // Ajouter un gestionnaire pour actualiser la page
                                        setTimeout(() => {
                                            document.getElementById('refresh-page')?.addEventListener('click', () => {
                                                window.location.reload();
                                            });
                                        }, 100);
                                    } else {
                                        // Vérifier si le bannissement a expiré
                                        if (data.expires_at && new Date(data.expires_at) < new Date()) {
                                            // Le bannissement a expiré
                                            banDiv.innerHTML = `
                                                <div class="banned-icon" style="color: #4CAF50;">✓</div>
                                                <h2 style="margin-top: 5px; margin-bottom: 10px; font-size: 20px; font-weight: bold; color: #4CAF50;">Votre bannissement a expiré</h2>
                                                <p style="margin: 0 0 15px 0;">Vous pouvez à nouveau utiliser le chat.</p>
                                                <button id="refresh-page" style="background: #4CAF50; border: none; padding: 8px 15px; color: white; border-radius: 5px; cursor: pointer;">Actualiser la page</button>
                                            `;
                                            
                                            // Créer un cookie pour indiquer que le bannissement a été levé
                                            document.cookie = "chat_ban_lifted=true; path=/; max-age=60";
                                            
                                            // Supprimer les informations de bannissement local
                                            localStorage.removeItem('chat_device_banned');
                                            localStorage.removeItem('chat_device_banned_until');
                                            localStorage.removeItem('chat_ban_reason');
                                            localStorage.removeItem('chat_ban_dismissed');
                                            
                                            // Ajouter un gestionnaire pour actualiser la page
                                            setTimeout(() => {
                                                document.getElementById('refresh-page')?.addEventListener('click', () => {
                                                    window.location.reload();
                                                });
                                            }, 100);
                                        } else {
                                            // Si toujours banni, afficher un message
                                            checkButton.innerHTML = 'Vérifier si débanni';
                                            checkButton.disabled = false;
                                            
                                            this.showNotification("Vous êtes toujours banni du chat", "error");
                                        }
                                    }
                                } catch (error) {
                                    console.error("Erreur lors de la vérification du bannissement:", error);
                                    checkButton.innerHTML = 'Vérifier si débanni';
                                    checkButton.disabled = false;
                                    
                                    this.showNotification("Erreur lors de la vérification", "error");
                                }
                            });
                        }
                    }, 100);
                    
                    // Si un utilisateur était connecté, le déconnecter
                    if (this.pseudo) {
                        this.pseudo = null;
                        this.isAdmin = false;
                        localStorage.removeItem('chatPseudo');
                        localStorage.removeItem('isAdmin');
                    }
                    
                    this.deviceBanned = true;
                    
                    // Ne pas initialiser le chat
                    return;
                } else {
                    // Le bannissement a expiré, supprimer l'entrée
                    await this.supabase
                        .from('banned_real_ips')
                        .delete()
                        .eq('ip', realIP);
                }
            }
        }
        
        // Si aucun bannissement local ou d'IP n'est trouvé, continuer normalement
        await this.loadBannedWords();
        
        // Vérifier si l'appareil est banni localement (ancien système)
        const bannedUntil = localStorage.getItem('device_banned_until');
        if (bannedUntil) {
            if (bannedUntil === 'permanent' || parseInt(bannedUntil) > Date.now()) {
                console.log('Appareil banni détecté (stockage local)');
                this.showNotification('Votre appareil est banni du chat', 'error');
                
                // Si un utilisateur était connecté, le déconnecter
                if (this.pseudo) {
                    this.pseudo = null;
                    this.isAdmin = false;
                    localStorage.removeItem('chatPseudo');
                    localStorage.removeItem('isAdmin');
                }
                
                this.deviceBanned = true;
                
                // Créer un chat vide pour montrer l'erreur
                this.container = document.createElement('div');
                this.container.className = 'chat-widget';
                this.container.innerHTML = `
                    <div class="chat-error-banner">
                        <div class="error-icon">⚠️</div>
                        <div class="error-message">Appareil banni du chat</div>
                    </div>
                `;
                document.body.appendChild(this.container);
                return;
            } else {
                // Le bannissement a expiré, supprimer l'entrée
                localStorage.removeItem('device_banned_until');
            }
        }
        
        // Vérifier si l'appareil est banni dans la base de données (ancien système)
        const isDeviceBanned = await this.isDeviceBanned();
        if (isDeviceBanned) {
            console.log('Appareil banni détecté (base de données)');
            this.showNotification('Votre appareil est banni du chat', 'error');
            
            // Stocker localement pour référence future
            localStorage.setItem('device_banned_until', 'permanent');
            
            // Si un utilisateur était connecté, le déconnecter
            if (this.pseudo) {
                this.pseudo = null;
                this.isAdmin = false;
                localStorage.removeItem('chatPseudo');
                localStorage.removeItem('isAdmin');
            }
            
            this.deviceBanned = true;
            
            // Créer un chat vide pour montrer l'erreur
            this.container = document.createElement('div');
            this.container.className = 'chat-widget';
            this.container.innerHTML = `
                <div class="chat-error-banner">
                    <div class="error-icon">⚠️</div>
                    <div class="error-message">Appareil banni du chat</div>
                </div>
            `;
            document.body.appendChild(this.container);
            return;
        }
        
        // Vérifier si l'utilisateur est banni avant de continuer
        if (this.pseudo) {
            const isBanned = await this.checkBannedIP(this.pseudo);
            if (isBanned) {
                // Forcer la déconnexion si l'utilisateur est banni
                this.pseudo = null;
                this.isAdmin = false;
                localStorage.removeItem('chatPseudo');
                localStorage.removeItem('isAdmin');
                this.showNotification('Vous êtes banni du chat', 'error');
            } else {
                // Seulement si l'utilisateur n'est pas banni
                await this.setCurrentUserForRLS();
            }
        }
        
        // Continuer l'initialisation normale
        this.container = document.createElement('div');
        this.container.className = 'chat-widget';
        
        // Vérifier l'état d'authentification
        const isAuthenticated = await this.checkAuthState();
        
        // Vérifier si on utilise le bouton de la barre de navigation
        const useNavButton = document.getElementById('chatToggleBtn') !== null;
        
        // Initialiser l'interface du chat
        if (isAuthenticated && this.pseudo) {
            this.container.innerHTML = useNavButton ? this.getChatHTMLWithoutToggle() : this.getChatHTML();
        } else {
            this.container.innerHTML = useNavButton ? this.getPseudoHTMLWithoutToggle() : this.getPseudoHTML();
        }
        
        // Appliquer l'état d'ouverture si nécessaire
        const chatContainer = this.container.querySelector('.chat-container');
        if (this.isOpen && chatContainer) {
            chatContainer.classList.add('open');
        }
        
        // Ajouter le conteneur au document
        document.body.appendChild(this.container);
        
        // Charger les sons
        await this.loadSounds();
        
        // Gestion des notifications push
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                
                if (subscription) {
                    this.subscription = subscription;
                    this.notificationsEnabled = true;
                    console.log('Notifications push déjà activées');
                    
                    // Vérification périodique de la souscription
                    setInterval(async () => {
                        try {
                            const currentSubscription = await registration.pushManager.getSubscription();
                            if (!currentSubscription) {
                                console.log('Renouvellement de la souscription nécessaire');
                                await this.renewPushSubscription();
                            }
                        } catch (error) {
                            console.error('Erreur vérification souscription:', error);
                        }
                    }, 3600000); // Vérification toutes les heures
                }
            } catch (error) {
                console.error('Erreur initialisation push notifications:', error);
            }
        }
        
        // Configurer les écouteurs d'événements
        this.setupListeners();
        
        // Configurer la souscription temps réel
        this.setupRealtimeSubscription();
        
        // Charger les messages existants si l'utilisateur est connecté
        if (this.pseudo) {
            await this.loadExistingMessages();
            this.updateUnreadBadgeAndBubble();
        }
        
        // Pour gérer spécifiquement les problèmes de PWA
        if (/Mobi|Android/i.test(navigator.userAgent)) {
            // Détecter si nous sommes dans une PWA
            const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone;
                         
            if (isPWA) {
                console.log("Mode PWA détecté - Activation des ajustements spécifiques");
                
                // Ajouter le bouton d'accès à la zone de saisie
                this.accessButton = this.addInputAccessButton();
                
                // Gérer la visibilité du clavier
                this.handleKeyboardVisibility();
                
                // Gérer l'apparition du clavier
                this.handleKeyboardAppearance();
                
                // Observer les changements d'orientation
                window.addEventListener('orientationchange', () => {
                    setTimeout(() => {
                        this.ensureChatInputVisible();
                    }, 500);
                });
            }
        }
        
        // Configurer les vérifications de bannissement si l'utilisateur est connecté
        if (this.pseudo) {
            this.setupBanChecker();
            this.startBanMonitoring();
        }
        
        // Écouter les changements de thème
        const themeObserver = new MutationObserver(() => {
            this.updateUnreadBadgeAndBubble();
        });
        
        // Observer les changements de classe sur le body et l'élément html
        themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        
        // Optimisations pour appareils à performances limitées
        if (/Mobi|Android|iPad|tablet/i.test(navigator.userAgent)) {
            this.optimizeForLowEndDevices();
        }
        
        // Vérifier et nettoyer les bannissements expirés
        await this.checkAndClearExpiredBans();
        // Gérer les problèmes de défilement tactile
		this.handleTouchScrolling();
        // Marquer l'initialisation comme terminée
		this.startAutoBanCheck();
        this.initialized = true;
        console.log("Chat initialisé avec succès");
    } catch (error) {
        console.error('Erreur initialisation:', error);
        
        // S'assurer que le conteneur est ajouté au document en cas d'erreur
        if (!document.querySelector('.chat-widget') && this.container) {
            document.body.appendChild(this.container);
        }
    }
}

startAutoBanCheck() {
    // Vérifier le bannissement toutes les 15 secondes
    this.banCheckTimer = setInterval(async () => {
        if (this.pseudo) {
            // Vérifier si l'utilisateur est banni
            const isBanned = await this.checkBannedIP(this.pseudo);
            if (isBanned) {
                console.log(`Bannissement détecté pour ${this.pseudo}, déconnexion forcée...`);
                this.showNotification('Vous avez été banni du chat', 'error');
                
                // Stocker les infos de bannissement localement
                localStorage.setItem('chat_device_banned', 'true');
                localStorage.setItem('chat_device_banned_until', 'permanent');
                localStorage.setItem('chat_ban_reason', 'Utilisateur banni');
                
                // Déconnecter l'utilisateur
                await this.logout();
                
                // Afficher le message de bannissement
                this.showBanNotification('Utilisateur banni');
                
                // Arrêter le timer
                clearInterval(this.banCheckTimer);
                
                // Recharger la page après un court délai
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        }
    }, 15000); // Vérification toutes les 15 secondes
}

    async loadBannedWords() {
        try {
            const { data: words, error } = await this.supabase
                .from('banned_words')
                .select('*')
                .order('added_at', { ascending: true });

            if (!error && words) {
                this.bannedWords = new Set(words.map(w => w.word.toLowerCase()));
                const list = document.querySelector('.banned-words-list');
                if (list) {
                    const isMobile = window.innerWidth <= 768;
list.innerHTML = words.map(w => `
    <div class="banned-word" style="${isMobile ? 'display: flex; align-items: center; justify-content: space-between; padding: 12px 15px; margin-bottom: 8px; background: rgba(255, 255, 255, 0.12); border-radius: 10px;' : ''}">
        ${w.word}
        <button class="remove-word" data-word="${w.word}" style="${isMobile ? 'position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 22px; background: rgba(255, 70, 70, 0.2); border-radius: 50%; color: #ff4c4c;' : ''}">×</button>
    </div>
`).join('');

                    list.querySelectorAll('.remove-word').forEach(btn => {
                        btn.addEventListener('click', () => this.removeBannedWord(btn.dataset.word));
                    });
                }
            }
        } catch (error) {
            console.error('Erreur loadBannedWords:', error);
            this.bannedWords = new Set();
        }
    }
	
	async loadBannedIPs() {
    try {
        console.log("Chargement des IPs bannies...");
        
        // Liste des IPs bannies combinée
        let allBannedIps = [];
        
        // 1. Essayer de récupérer les IPs de banned_ips
        try {
            const { data: ips, error: ipsError } = await this.supabase
                .from('banned_ips')
                .select('*')
                .order('banned_at', { ascending: false });

            if (ipsError) {
                console.warn('Erreur chargement banned_ips:', ipsError);
            } else {
                console.log(`${ips?.length || 0} IPs trouvées dans banned_ips`);
                if (ips?.length > 0) {
                    allBannedIps = [...ips];
                }
            }
        } catch (error) {
            console.warn('Exception lors du chargement de banned_ips:', error);
        }
        
        // 2. Essayer de récupérer les IPs de banned_real_ips
        try {
            const { data: realIps, error: realIpsError } = await this.supabase
                .from('banned_real_ips')
                .select('*')
                .order('banned_at', { ascending: false });
                
            if (realIpsError) {
                console.warn('Erreur chargement banned_real_ips:', realIpsError);
            } else {
                console.log(`${realIps?.length || 0} IPs trouvées dans banned_real_ips`);
                
                // Ajouter les IPs réelles à la liste
                if (realIps?.length > 0) {
                    realIps.forEach(realIp => {
                        // Vérifier si cette IP n'est pas déjà dans la liste
                        const existingIndex = allBannedIps.findIndex(ip => ip.ip === realIp.ip);
                        
                        if (existingIndex === -1) {
                            // Ajouter avec un indicateur que c'est une IP réelle
                            allBannedIps.push({
                                ...realIp,
                                is_real_ip: true
                            });
                        } else {
                            // Mise à jour de l'entrée existante avec l'information qu'elle est aussi une IP réelle
                            allBannedIps[existingIndex].is_real_ip = true;
                        }
                    });
                }
            }
        } catch (error) {
            console.warn('Exception lors du chargement de banned_real_ips:', error);
        }

        const list = document.querySelector('.banned-ips-list');
        if (list) {
    if (allBannedIps.length === 0) {
        const isMobile = window.innerWidth <= 768;
        list.innerHTML = `<div class="no-data" style="${isMobile ? 'text-align: center; padding: 30px 20px; font-size: 16px; color: rgba(255, 255, 255, 0.7); background: rgba(0, 0, 0, 0.2); border-radius: 10px; margin: 20px 0;' : ''}">Aucune IP bannie</div>`;
        return;
    }

            // Vider la liste actuelle
            list.innerHTML = '';
            
            // Ajouter chaque IP
            allBannedIps.forEach(ip => {
                // Formater la date d'expiration ou indiquer permanent
                let expires = 'Ban permanent';
                if (ip.expires_at) {
                    const expiryDate = new Date(ip.expires_at);
                    const now = new Date();
                    
                    if (expiryDate < now) {
                        expires = 'Expiré';
                    } else {
                        expires = `Expire le ${expiryDate.toLocaleDateString('fr-FR')} à ${expiryDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}`;
                    }
                }
                
                // Créer l'élément HTML avec votre structure existante
                const ipElement = document.createElement('div');
                ipElement.className = 'banned-ip';
                ipElement.dataset.ip = ip.ip;
                
                // Marquer les IPs réelles pour le CSS
                if (ip.is_real_ip) {
                    ipElement.dataset.isRealIp = 'true';
                }
                
                ipElement.innerHTML = `
                    <div class="ip-info">
                        <div class="ip-pseudo">${ip.ip} ${ip.is_real_ip ? '<span class="ip-badge">IP réelle</span>' : ''}</div>
                        <div class="ip-expiry">${expires}</div>
                        ${ip.reason ? `<div class="ip-reason">Raison: ${ip.reason}</div>` : ''}
                    </div>
                    <button class="remove-ban" data-ip="${ip.ip}">×</button>
                `;
                
                list.appendChild(ipElement);
            });

            // Ajouter les listeners pour les boutons de suppression
            list.querySelectorAll('.remove-ban').forEach(btn => {
                btn.addEventListener('click', () => this.unbanIP(btn.dataset.ip));
            });
        }
    } catch (error) {
        console.error('Erreur loadBannedIPs:', error);
        const list = document.querySelector('.banned-ips-list');
        if (list) {
            list.innerHTML = '<div class="error">Erreur lors du chargement des IPs bannies: ' + error.message + '</div>';
        }
    }
}

async unbanIP(ip) {
    try {
        console.log(`Tentative de débannissement de l'IP: ${ip}`);
        
        // Animation de suppression visuelle
        const ipElement = document.querySelector(`.banned-ip[data-ip="${ip}"]`);
        if (ipElement) {
            ipElement.classList.add('removing');
            // Attendre légèrement pour l'animation
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Essayer de définir l'utilisateur courant pour RLS
        try {
            await this.setCurrentUserForRLS();
        } catch (error) {
            console.warn("Erreur lors de la définition de l'utilisateur pour RLS, continue quand même:", error);
        }
        
        // 1. Supprimer de la table banned_ips
        console.log(`Suppression de l'IP ${ip} de la table banned_ips`);
        const { data: deleteData, error: deleteError } = await this.supabase
            .from('banned_ips')
            .delete()
            .eq('ip', ip);

        if (deleteError) {
            console.warn('Erreur lors de la suppression de banned_ips:', deleteError);
        } else {
            console.log('Suppression réussie de banned_ips');
        }
        
        // 2. Supprimer aussi de banned_real_ips
        console.log(`Suppression de l'IP ${ip} de la table banned_real_ips`);
        const { data: deleteRealData, error: deleteRealError } = await this.supabase
            .from('banned_real_ips')
            .delete()
            .eq('ip', ip);
            
        if (deleteRealError) {
            console.warn('Erreur lors de la suppression de banned_real_ips:', deleteRealError);
        } else {
            console.log('Suppression réussie de banned_real_ips');
        }

        // Notification de succès
        this.showNotification(`IP ${ip} débannie avec succès`, 'success');
        
        // Attendre avant de recharger la liste
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Recharger la liste des IPs bannies
        await this.loadBannedIPs();
        
        return true;
    } catch (error) {
        console.error('Erreur unbanIP:', error);
        this.showNotification('Erreur lors du débannissement: ' + error.message, 'error');
        return false;
    }
}

	getPseudoHTML() {
    return `
        <button class="chat-toggle" title="Ouvrir le chat">
            <i class="material-icons">chat</i>
            <span class="notification-badge hidden">${this.unreadCount}</span>
        </button>
        <div class="chat-container">
            <div class="chat-header">
                <div class="header-title">Connexion au chat</div>
                <div class="header-buttons">
                    <button class="sound-btn ${this.soundEnabled ? 'enabled' : ''}" title="Son">
                        <span class="material-icons">${this.soundEnabled ? 'volume_up' : 'volume_off'}</span>
                    </button>
                    <button class="close-chat" title="Fermer">
                        <span class="material-icons">close</span>
                    </button>
                </div>
            </div>
            <div class="chat-login">
    <form style="margin: 0;">
        <input type="text" 
       id="pseudoInput" 
       placeholder="Entrez votre pseudo (3-20 caractères)" 
       autocomplete="username"
       maxlength="20">
        <input type="password" 
       id="adminPassword" 
       placeholder="Mot de passe admin" 
       autocomplete="current-password"
       style="display: none;">
    </form>
    <div class="login-buttons">
        <button id="confirmPseudo">Confirmer</button>
    </div>
</div>
        </div>
    `;
}

getPseudoHTMLWithoutToggle() {
    return `
        <div class="chat-container">
            <div class="chat-header">
                <div class="header-title">Connexion au chat</div>
                <div class="header-buttons">
                    <button class="sound-btn ${this.soundEnabled ? 'enabled' : ''}" title="Son">
                        <span class="material-icons">${this.soundEnabled ? 'volume_up' : 'volume_off'}</span>
                    </button>
                    <button class="close-chat" title="Fermer">
                        <span class="material-icons">close</span>
                    </button>
                </div>
            </div>
            <div class="chat-login">
    <form style="margin: 0;">
        <input type="text" 
       id="pseudoInput" 
       placeholder="Entrez votre pseudo (3-20 caractères)" 
       autocomplete="username"
       maxlength="20">
        <input type="password" 
       id="adminPassword" 
       placeholder="Mot de passe admin" 
       autocomplete="current-password"
       style="display: none;">
    </form>
    <div class="login-buttons">
        <button id="confirmPseudo">Confirmer</button>
    </div>
</div>
        </div>
    `;
}

getChatHTML() {
    return `
        <button class="chat-toggle" title="Ouvrir le chat">
            <span class="material-icons">chat</span>
            <span class="notification-badge hidden">${this.unreadCount}</span>
        </button>
        <div class="chat-container">
            <div class="chat-header">
                <div class="header-title">Chat - ${this.pseudo}</div>
                <div class="header-buttons">
                    ${this.isAdmin ? `
                        <button class="admin-panel-btn" title="Panel Admin">
                            <span class="material-icons">admin_panel_settings</span>
                        </button>
                    ` : ''}
                    <button class="emoji-btn" title="Emojis">
                        <span class="material-icons">emoji_emotions</span>
                    </button>
                    <button class="notifications-btn ${this.notificationsEnabled ? 'enabled' : ''}" title="Notifications">
                        <span class="material-icons">${this.notificationsEnabled ? 'notifications_active' : 'notifications_off'}</span>
                    </button>
                    <button class="sound-btn ${this.soundEnabled ? 'enabled' : ''}" title="Son">
                        <span class="material-icons">${this.soundEnabled ? 'volume_up' : 'volume_off'}</span>
                    </button>
                    <button class="logout-btn" title="Déconnexion">
                        <span class="material-icons">logout</span>
                    </button>
                    <button class="close-chat" title="Fermer">
                        <span class="material-icons">close</span>
                    </button>
                </div>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input">
                <textarea 
                    placeholder="Votre message..." 
                    maxlength="500" 
                    rows="2"></textarea>
                <button class="send-btn" title="Envoyer">
                    <span class="material-icons">send</span>
                </button>
            </div>
        </div>
    `;
}

getChatHTMLWithoutToggle() {
    return `
        <div class="chat-container">
            <div class="chat-header">
                <div class="header-title">Chat - ${this.pseudo}</div>
                <div class="header-buttons">
                    ${this.isAdmin ? `
                        <button class="admin-panel-btn" title="Panel Admin">
                            <span class="material-icons">admin_panel_settings</span>
                        </button>
                    ` : ''}
					<button class="emoji-btn" title="Emojis">
                    <span class="material-icons">emoji_emotions</span>
                </button>
                    <button class="notifications-btn ${this.notificationsEnabled ? 'enabled' : ''}" title="Notifications">
                        <span class="material-icons">${this.notificationsEnabled ? 'notifications_active' : 'notifications_off'}</span>
                    </button>
                    <button class="sound-btn ${this.soundEnabled ? 'enabled' : ''}" title="Son">
                        <span class="material-icons">${this.soundEnabled ? 'volume_up' : 'volume_off'}</span>
                    </button>
                    <button class="logout-btn" title="Déconnexion">
                        <span class="material-icons">logout</span>
                    </button>
                    <button class="close-chat" title="Fermer">
                        <span class="material-icons">close</span>
                    </button>
                </div>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input">
                <textarea 
                    placeholder="Votre message..." 
                    maxlength="500" 
                    rows="2"></textarea>              
                <button class="send-btn" title="Envoyer">
                    <span class="material-icons">send</span>
                </button>
            </div>
        </div>
    `;
}

    setupListeners() {
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const closeBtn = this.container.querySelector('.close-chat');
    const chatContainer = this.container.querySelector('.chat-container');
    const toggle = this.container.querySelector('.chat-toggle');
    const soundBtn = this.container.querySelector('.sound-btn');
    const notificationsBtn = this.container.querySelector('.notifications-btn');
    const adminBtn = this.container.querySelector('.admin-panel-btn');
    const logoutBtn = this.container.querySelector('.logout-btn');

    // Fonction réutilisable pour basculer l'état du chat
    const toggleChat = () => {
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
        chatContainer?.classList.add('open');
        
        // Bloquer le défilement uniquement sur les appareils mobiles
        if (this.isMobileDevice()) {
            document.body.classList.add('chat-open-no-scroll');
        }
        
        // Réinitialisation du compteur
        this.unreadCount = 0;
        localStorage.setItem('unreadCount', '0');
        
        // Mettre à jour le badge ET l'info-bulle
        this.updateUnreadBadgeAndBubble();
        
        this.scrollToBottom();
    } else {
        chatContainer?.classList.remove('open');
        
        // Réactiver le défilement sur mobile
        document.body.classList.remove('chat-open-no-scroll');
    }
    
    localStorage.setItem('chatOpen', this.isOpen);
    this.playSound('click');
};

    if (chatToggleBtn) {
        // Supprimer les anciens écouteurs d'événements pour éviter les duplications
        const newChatToggleBtn = chatToggleBtn.cloneNode(true);
        chatToggleBtn.parentNode.replaceChild(newChatToggleBtn, chatToggleBtn);
        
        // Ajouter le nouvel écouteur
        newChatToggleBtn.addEventListener('click', toggleChat);
    }

    if (toggle) {
        toggle.addEventListener('click', toggleChat);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            this.isOpen = false;
            localStorage.setItem('chatOpen', 'false');
            chatContainer?.classList.remove('open');
            this.playSound('click');
        });
    }
// Bloquer le défilement de la page lorsque le chat est ouvert
if (chatContainer) {
    // Empêcher la propagation des événements tactiles en dehors du chat
    chatContainer.addEventListener('touchmove', (e) => {
        // Ne pas stopper la propagation - permettre le défilement normal
        e.stopPropagation(); // Ceci empêche l'événement de remonter à la page principale
    }, { passive: true });
    
    // Empêcher le rebond aux extrémités qui cause souvent le défilement de la page
    chatContainer.addEventListener('scroll', () => {
        const scrollTop = chatContainer.scrollTop;
        const scrollHeight = chatContainer.scrollHeight;
        const clientHeight = chatContainer.clientHeight;
        
        // Ajuster légèrement les valeurs pour éviter les problèmes de "bounce"
        if (scrollTop <= 1) {
            chatContainer.scrollTop = 1;
        } else if (scrollTop + clientHeight >= scrollHeight - 1) {
            chatContainer.scrollTop = scrollHeight - clientHeight - 1;
        }
    }, { passive: true });
    
    // Ajouter une classe au body quand le chat est ouvert
    const toggleBodyClass = () => {
        if (chatContainer.classList.contains('open')) {
            document.body.classList.add('chat-open-no-scroll');
        } else {
            document.body.classList.remove('chat-open-no-scroll');
        }
    };
    
    // Appliquer la classe immédiatement si le chat est déjà ouvert
    toggleBodyClass();
    
    // Observer les changements de classe sur le conteneur du chat
    const observer = new MutationObserver(toggleBodyClass);
    observer.observe(chatContainer, { attributes: true, attributeFilter: ['class'] });
}
    // Le reste de votre code pour setupListeners reste inchangé...
    if (soundBtn) {
        soundBtn.addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            localStorage.setItem('soundEnabled', this.soundEnabled);
            soundBtn.classList.toggle('enabled', this.soundEnabled);
            if (this.soundEnabled) {
                soundBtn.querySelector('.material-icons').textContent = 'volume_up';
                this.playSound('click');
            } else {
                soundBtn.querySelector('.material-icons').textContent = 'volume_off';
            }
        });
    }

        if (notificationsBtn) {
            notificationsBtn.addEventListener('click', async () => {
                try {
                    if (this.notificationsEnabled) {
                        await this.unsubscribeFromPushNotifications();
                    } else {
                        await this.setupPushNotifications();
                    }
                    this.playSound('click');
                } catch (error) {
                    console.error('Erreur gestion notifications:', error);
                    this.showNotification('Erreur avec les notifications', 'error');
                }
            });
        }

        if (adminBtn && this.isAdmin) {
            adminBtn.addEventListener('click', () => {
                this.showAdminPanel();
                this.playSound('click');
            });
        }
// Ajoutez ici le code pour le bouton de déconnexion
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await this.logout();
            this.playSound('click');
        });
    }

    if (!this.pseudo) {
        this.setupAuthListeners();
    } else {
        this.setupChatListeners();
    }
	// Ajouter la détection de défilement pour optimiser le rendu
const messagesContainer = this.container.querySelector('.chat-messages');
if (messagesContainer) {
    let scrollTimeout;
    
    messagesContainer.addEventListener('scroll', () => {
        // Ajouter une classe pendant le défilement
        messagesContainer.classList.add('scrolling');
        
        // Nettoyer le timeout précédent
        clearTimeout(scrollTimeout);
        
        // Définir un nouveau timeout
        scrollTimeout = setTimeout(() => {
            messagesContainer.classList.remove('scrolling');
        }, 150); // Attendre que le défilement s'arrête
    }, { passive: true });
}
// Détection du clavier virtuel sur tablette
if (this.isTablet()) {
    const textarea = this.container.querySelector('.chat-input textarea');
    if (textarea && chatContainer) {
        textarea.addEventListener('focus', () => {
            chatContainer.classList.add('keyboard-open');
        });
        
        textarea.addEventListener('blur', () => {
            setTimeout(() => {
                chatContainer.classList.remove('keyboard-open');
            }, 300);
        });
    }
}
    // Remplacer le code existant par celui-ci
// Remplacer le code existant par celui-ci
const chatMessages = this.container.querySelector('.chat-messages');
if (chatMessages) {
    // Empêcher la propagation des événements tactiles en dehors du chat
    // mais uniquement sur les appareils mobiles
    if (this.isMobileDevice()) {
        chatMessages.addEventListener('touchmove', (e) => {
            e.stopPropagation(); // Ceci empêche l'événement de remonter à la page principale
        }, { passive: true });
        
        // Empêcher le rebond aux extrémités sur les appareils mobiles
        chatMessages.addEventListener('scroll', () => {
            const scrollTop = chatMessages.scrollTop;
            const scrollHeight = chatMessages.scrollHeight;
            const clientHeight = chatMessages.clientHeight;
            
            // Ajuster légèrement les valeurs pour éviter les problèmes de "bounce"
            if (scrollTop <= 1) {
                chatMessages.scrollTop = 1;
            } else if (scrollTop + clientHeight >= scrollHeight - 1) {
                chatMessages.scrollTop = scrollHeight - clientHeight - 1;
            }
        }, { passive: true });
    }
}
  }
  
async setupAuthListeners() {
    // Vérifier d'abord si l'appareil est banni localement
    if (localStorage.getItem('chat_device_banned') === 'true') {
        const bannedUntil = localStorage.getItem('chat_device_banned_until');
        let isBanned = true;
        
        // Vérifier si le bannissement a expiré
        if (bannedUntil && bannedUntil !== 'permanent') {
            const expiryTime = parseInt(bannedUntil);
            if (Date.now() > expiryTime) {
                // Le bannissement a expiré
                localStorage.removeItem('chat_device_banned');
                localStorage.removeItem('chat_device_banned_until');
                localStorage.removeItem('chat_ban_reason');
                localStorage.removeItem('chat_ban_dismissed');
                isBanned = false;
            }
        }
        
        if (isBanned) {
            console.log('APPAREIL BANNI: Accès refusé (stockage local)');
            this.showBanNotification(localStorage.getItem('chat_ban_reason') || '');
            return; // Arrêter l'authentification
        }
    }

    // Vérifier si l'appareil est banni dans la base de données
    const deviceId = this.getDeviceId();
    if (deviceId) {
        try {
            // Vérifier si l'appareil est banni
            const { data: deviceBan, error: deviceError } = await this.supabase
                .from('banned_ips')
                .select('*')
                .eq('ip', deviceId)
                .maybeSingle();
                
            if (!deviceError && deviceBan) {
                // Vérifier si le bannissement est expiré
                if (deviceBan.expires_at && new Date(deviceBan.expires_at) < new Date()) {
                    // Le bannissement a expiré, supprimer l'entrée
                    await this.supabase
                        .from('banned_ips')
                        .delete()
                        .eq('ip', deviceId);
                } else {
                    // Appareil banni, afficher le message
                    console.log('APPAREIL BANNI: Accès refusé (base de données)');
                    
                    // Stocker localement
                    localStorage.setItem('chat_device_banned', 'true');
                    localStorage.setItem('chat_device_banned_until', deviceBan.expires_at || 'permanent');
                    localStorage.setItem('chat_ban_reason', deviceBan.reason || 'Appareil banni');
                    
                    this.showBanNotification(deviceBan.reason || 'Appareil banni');
                    return; // Arrêter l'authentification
                }
            }
        } catch (error) {
            console.warn("Erreur lors de la vérification du bannissement d'appareil:", error);
            // Continuer malgré l'erreur
        }
    }
    
    // Ensuite, gardez votre code existant...
    const pseudoInput = this.container.querySelector('#pseudoInput');
    const adminPasswordInput = this.container.querySelector('#adminPassword');
    const confirmButton = this.container.querySelector('#confirmPseudo');

    if (pseudoInput) {
        pseudoInput.addEventListener('input', () => {
            console.log('Pseudo input:', pseudoInput.value.trim());
            if (pseudoInput.value.trim() === 'Admin_ActuMedia') {
                console.log('Affichage du champ mot de passe admin');
                adminPasswordInput.style.display = 'block';
            } else {
                adminPasswordInput.style.display = 'none';
                adminPasswordInput.value = '';
            }
        });
    }
    
    if (confirmButton) {
        confirmButton.addEventListener('click', async () => {
    const pseudo = pseudoInput?.value.trim();
    const adminPassword = adminPasswordInput?.value;
    const deviceId = this.getDeviceId();
    
    console.log('Tentative de connexion avec pseudo:', pseudo);
    console.log('ID d\'appareil:', deviceId);

    if (!pseudo || pseudo.length < 3) {
        this.showNotification('Le pseudo doit faire au moins 3 caractères', 'error');
        this.playSound('error');
        return;
    }

    try {
        // Vérification simplifiée du bannissement d'appareil
        const isDeviceBanned = await this.isDeviceBanned();
        if (isDeviceBanned) {
            console.log('[DEBUG] APPAREIL BANNI DÉTECTÉ - ACCÈS REFUSÉ');
            this.showNotification('Votre appareil est banni du chat', 'error');
            this.playSound('error');
            return;
        }

        // Cas administrateur
        let isAdmin = false;
        if (pseudo === 'Admin_ActuMedia') {
            console.log('Tentative connexion admin');
            
            if (adminPassword !== 'admin2024') {
                this.showNotification('Mot de passe administrateur incorrect', 'error');
                this.playSound('error');
                return;
            }
            
            isAdmin = true;
        } else {
            console.log('Tentative connexion utilisateur normal');
        }

                // Vérifier si l'utilisateur existe déjà
                const { data: existingUser, error: queryError } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('pseudo', pseudo)
                    .single();
                
                console.log('Résultat recherche utilisateur:', existingUser, queryError);
                
                                // Si l'utilisateur n'existe pas ou erreur "not found", le créer
                if (!existingUser || (queryError && queryError.code === 'PGRST116')) {
                    console.log('Création d\'un nouvel utilisateur');
                    
                    // Insérer directement dans users
                    const { data: newUser, error: insertError } = await this.supabase
                        .from('users')
                        .insert([
                            { 
                                pseudo: pseudo,
                                last_active: new Date().toISOString(),
                                is_admin: isAdmin,
                                requires_password: true
                            }
                        ])
                        .select();
                    
                    if (insertError) {
                        console.error('Erreur création utilisateur:', insertError);
                        throw insertError;
                    }
                    
                    console.log('Utilisateur créé avec succès:', newUser);
                }

                // Définir les variables de session
                this.pseudo = pseudo;
                this.isAdmin = isAdmin;
                localStorage.setItem('chatPseudo', pseudo);
                localStorage.setItem('isAdmin', isAdmin);
				this.startBanMonitoring();

                // Actualiser l'interface
if (document.getElementById('chatToggleBtn')) {
    this.container.innerHTML = this.getChatHTMLWithoutToggle();
} else {
    this.container.innerHTML = this.getChatHTML();
}

const chatContainer = this.container.querySelector('.chat-container');
if (chatContainer) {
    chatContainer.classList.add('open');
    this.isOpen = true;
    localStorage.setItem('chatOpen', 'true');

    // Désactiver le scroll global quand le chat est ouvert
    document.body.classList.add('no-scroll');

    // Réactiver le scroll global quand le chat se ferme
    chatContainer.addEventListener('touchend', () => {
        document.body.classList.remove('no-scroll');
    });
}

this.setupListeners();
await this.loadExistingMessages();
this.playSound('success');

                
            } catch (error) {
        console.error('Erreur d\'authentification:', error);
        this.showNotification('Erreur lors de la connexion: ' + error.message, 'error');
        this.playSound('error');
    }
});
    }
}

async registerUser(pseudo, password, isAdmin = false) {
    try {
        console.log('Tentative d\'inscription de l\'utilisateur:', pseudo, 'admin:', isAdmin);
        
        // Insérer directement dans votre table users
        const { data, error: insertError } = await this.supabase
            .from('users')
            .insert([
                { 
                    pseudo: pseudo,
                    last_active: new Date().toISOString(),
                    is_admin: isAdmin,
                    requires_password: true
                }
            ])
            .select();
        
        if (insertError) {
            console.error('Erreur insertion table users:', insertError);
            throw insertError;
        }
        
        console.log('Utilisateur enregistré avec succès:', pseudo);
        this.showNotification('Inscription réussie!', 'success');
        return { success: true, user: data?.[0] };
    } catch (error) {
        console.error('Erreur d\'inscription:', error);
        this.showNotification('Erreur lors de l\'inscription: ' + error.message, 'error');
        throw error;
    }
}

async checkAuthState() {
    try {
        // Vérifier si le pseudo est stocké localement
        if (this.pseudo) {
            // Vérifier si l'utilisateur existe dans la base de données
            const { data: userData, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('pseudo', this.pseudo)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                throw error;
            }
            
            // Si l'utilisateur existe, mettre à jour les informations
            if (userData) {
                this.isAdmin = userData.is_admin || false;
                localStorage.setItem('isAdmin', this.isAdmin);
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error('Erreur vérification auth:', error);
        return false;
    }
}

async logout() {
    try {
		if (this.banMonitorInterval) {
            clearInterval(this.banMonitorInterval);
        }
		// Nettoyer le timer de vérification auto des bannissements
if (this.banCheckTimer) {
    clearInterval(this.banCheckTimer);
}
        // Nettoyer l'intervalle de vérification des bannissements
        if (this.banCheckInterval) {
            clearInterval(this.banCheckInterval);
        }
        
        // Nettoyer les données locales
        this.pseudo = null;
        this.isAdmin = false;
        localStorage.removeItem('chatPseudo');
        localStorage.removeItem('isAdmin');
        
        // Actualiser l'interface
        if (document.getElementById('chatToggleBtn')) {
            this.container.innerHTML = this.getPseudoHTMLWithoutToggle();
        } else {
            this.container.innerHTML = this.getPseudoHTML();
        }
        
        this.setupListeners();
        this.showNotification('Déconnexion réussie', 'success');
        return true;
    } catch (error) {
        console.error('Erreur déconnexion:', error);
        this.showNotification('Erreur lors de la déconnexion', 'error');
        return false;
    }
}

extractPseudoFromEmail(email) {
    return email.split('@')[0];
}
    setupChatListeners() {
    const input = this.container.querySelector('.chat-input textarea');
    const sendBtn = this.container.querySelector('.send-btn');
    const emojiBtn = this.container.querySelector('.emoji-btn');

    if (input && sendBtn) {
        const sendMessage = async () => {
    const content = input.value.trim();
    if (content) {
        // Vérification et autre code...
        
        // Fermer le clavier immédiatement
        input.blur();
        
        // Stocker et vider l'input
        const messageContent = content;
        input.value = '';
        
        // Envoyer le message
        const success = await this.sendMessage(messageContent);
        
        if (success) {
            this.playSound('message');
            // Montrer le bouton d'accès après l'envoi
        if (this.accessButton) {
            this.accessButton.style.display = 'block';
            
            // Le cacher automatiquement après 5 secondes
            setTimeout(() => {
                this.accessButton.style.display = 'none';
            }, 5000);
        }
            // Appels multiples pour s'assurer que la zone de saisie reste visible
            this.ensureChatInputVisible(); // Immédiatement
            
            // Répéter avec différents délais
            [300, 800, 1500, 3000].forEach(delay => {
                setTimeout(() => {
                    this.ensureChatInputVisible();
                }, delay);
            });
        } else {
            this.playSound('error');
        }
    }
};

        if (/Mobi|Android/i.test(navigator.userAgent)) {
            sendBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    sendMessage();
	}, { passive: false });
        } else {
            sendBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                sendMessage();
            });
        }

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Ajout du gestionnaire pour le bouton emoji
    if (emojiBtn) {
        emojiBtn.addEventListener('click', () => {
            this.toggleEmojiPanel();
        });
    }
}

// Nouvelle méthode pour gérer le panneau d'emojis
toggleEmojiPanel() {
    let panel = this.container.querySelector('.emoji-panel');
    const emojiBtn = this.container.querySelector('.emoji-btn');
    
    // Si le panneau existe déjà, on le ferme en cliquant sur l'icône
    if (panel) {
        panel.remove();
        // Retirer la classe d'état ouvert
        if (emojiBtn) {
            emojiBtn.classList.remove('panel-open');
        }
        return;
    }
    
    // Ajouter la classe d'état ouvert sur le bouton
    if (emojiBtn) {
        emojiBtn.classList.add('panel-open');
    }
    
    panel = document.createElement('div');
    panel.className = 'emoji-panel';
    
    const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', 
  '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '😝', 
  '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', 
  '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', 
  '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', 
  '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', 
  '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', 
  '👋', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👍', '👎', '✊', 
  '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪', '❤️', '🧡', 
  '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💓', '💔', '💕', '💖', '💗',

  // 🎭 Expressions et visages supplémentaires
  '🥹', '🫠', '🫡', '🫣', '🫤', '😇', '🥴', '😵‍💫', '🫥', '🤩', '🫨', '🫧',

  // 🐶 Animaux et nature
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', 
  '🐷', '🐸', '🐵', '🦄', '🐝', '🦋', '🐞', '🐢', '🐍', '🦖', '🦕', '🦀', 
  '🐡', '🐬', '🐳', '🐊', '🦆', '🦉', '🐓', '🦜', '🦢', '🦩', '🦚',

  // 🍔 Nourriture et boissons
  '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🥭', '🍍', 
  '🥥', '🥑', '🍔', '🍟', '🌭', '🍕', '🥪', '🍜', '🍣', '🍩', '🍪', '🎂',

  // 🎮 Objets et loisirs
  '🎮', '🕹️', '🎲', '♟️', '🎯', '🎳', '🏀', '⚽', '🏈', '🎾', '🏐', '🏉', 
  '🎼', '🎸', '🎷', '🎺', '🥁', '🎻', '📸', '🎥', '📺', '📱', '💻', '🖥️',

  // 🚀 Transport et voyage
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚜', '🛴', '🚲', 
  '🛵', '🏍️', '🚂', '🚆', '✈️', '🚀', '🛸', '🚢', '🛳️', '⛵',

  // 🏆 Récompenses et symboles
  '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '🎗️', '🔮', '💎', '📿', '💰', '💵', 
  '💳', '💡', '🛑', '🚧', '⚠️', '❗', '❓', '💢', '🔥', '✨', '🎉', '🎊'
];
    
    emojis.forEach(emoji => {
        const span = document.createElement('span');
        span.textContent = emoji;
        span.addEventListener('click', () => {
            const textarea = this.container.querySelector('.chat-input textarea');
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;
                textarea.value = text.substring(0, start) + emoji + text.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
                // Ne pas redonner le focus sur mobile pour éviter l'ouverture du clavier
                if (!/Mobi|Android/i.test(navigator.userAgent)) {
                    textarea.focus();
                }
            }
            this.playSound('click');
        });
        panel.appendChild(span);
    });
    
    const chatContainer = this.container.querySelector('.chat-container');
    chatContainer.appendChild(panel);
    
    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) &&
            e.target !== this.container.querySelector('.emoji-btn') &&
            !this.container.querySelector('.emoji-btn').contains(e.target)) {
            panel.remove();
            // Retirer la classe d'état ouvert quand le panneau est fermé autrement
            if (emojiBtn) {
                emojiBtn.classList.remove('panel-open');
            }
        }
    }, { once: true });
}

	setupRealtimeSubscription() {
    console.log('💬 Chat configuré en mode polling (plan gratuit Supabase)');
    
    // Fermer toute souscription existante
    if (this.realtimeChannel) {
        this.realtimeChannel.unsubscribe();
        this.realtimeChannel = null;
    }
    
    // Désactiver le temps réel, utiliser le polling
    this.isRealtimeEnabled = false;
    
    // Setup du polling spécifique au chat
    this.setupChatPolling();
    
    // Retourner un objet compatible pour éviter les erreurs
    return {
        unsubscribe: () => {
            console.log('🔌 Arrêt du polling chat');
            if (this.chatPollingInterval) {
                clearInterval(this.chatPollingInterval);
                this.chatPollingInterval = null;
            }
        }
    };
}

// NOUVELLE FONCTION : Polling spécifique au chat
setupChatPolling() {
    if (this.chatPollingInterval) return;
    
    console.log('🔄 Démarrage du polling chat spécifique');
    
    let lastMessageId = null;
    let lastReactionUpdate = null;
    
    this.chatPollingInterval = setInterval(async () => {
        try {
            // 1. Vérifier les nouveaux messages
            const { data: messages, error: msgError } = await this.supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);
            
            if (!msgError && messages && messages.length > 0) {
                const latestMessageId = messages[0].id;
                
                // Si nouveau message détecté
                if (lastMessageId && latestMessageId !== lastMessageId) {
                    console.log('💬 Nouveau message détecté via polling');
                    
                    // Trouver les nouveaux messages
                    const newMessages = messages.filter(msg => 
                        new Date(msg.created_at) > new Date(this.lastMessageTime || 0)
                    );
                    
                    // Traiter chaque nouveau message
                    newMessages.reverse().forEach(msg => {
                        this.handleNewMessage(msg);
                    });
                    
                    this.lastMessageTime = messages[0].created_at;
                }
                
                lastMessageId = latestMessageId;
            }
            
            // 2. Vérifier les bannissements (moins fréquent)
            if (this.pollingCounter % 3 === 0) { // Toutes les 3 fois
                await this.checkUserBannedStatus();
            }
            
            // 3. Vérifier les réactions (moins fréquent)
            if (this.pollingCounter % 2 === 0) { // Toutes les 2 fois
                const { data: reactions, error: reactError } = await this.supabase
                    .from('message_reactions')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(10);
                
                if (!reactError && reactions && reactions.length > 0) {
                    const latestReaction = reactions[0].created_at;
                    
                    if (lastReactionUpdate && latestReaction !== lastReactionUpdate) {
                        console.log('👍 Nouvelles réactions détectées');
                        // Recharger les réactions des messages visibles
                        this.refreshVisibleReactions();
                    }
                    
                    lastReactionUpdate = latestReaction;
                }
            }
            
            this.pollingCounter = (this.pollingCounter || 0) + 1;
            
        } catch (error) {
            console.warn('⚠️ Erreur polling chat:', error.message);
        }
    }, 8000); // Toutes les 8 secondes
}

// NOUVELLE FONCTION : Rafraîchir les réactions visibles
refreshVisibleReactions() {
    const messageElements = this.container.querySelectorAll('[data-message-id]');
    messageElements.forEach(element => {
        const messageId = element.getAttribute('data-message-id');
        if (messageId) {
            this.loadMessageReactions(messageId);
        }
    });
}

// MODIFICATION : Ajouter une propriété pour suivre le dernier message
handleNewMessage(message) {
    // Votre code existant pour handleNewMessage...
    // Juste ajouter cette ligne à la fin :
    this.lastMessageTime = message.created_at;
}

setupBanChecker() {
    // Vérifier le bannissement toutes les 30 secondes
    this.banCheckInterval = setInterval(async () => {
        if (this.pseudo) {
            const isBanned = await this.checkBannedIP(this.pseudo);
            if (isBanned) {
                console.log('Bannissement détecté, déconnexion...');
                this.showNotification('Vous avez été banni du chat', 'error');
                clearInterval(this.banCheckInterval);
                await this.logout();
            } else {
                // Vérifier et nettoyer les bannissements expirés
                await this.checkAndClearExpiredBans();
            }
        }
    }, 30000);
}
    async handleNewMessage(message) {
    if (!message) return;
    
    const chatContainer = this.container.querySelector('.chat-container');
    const chatOpen = chatContainer && chatContainer.classList.contains('open');
    
    console.log('État initial du message:', {
        chatOpen,
        isOpen: this.isOpen,
        messageFrom: message.pseudo,
        myPseudo: this.pseudo,
        notificationsEnabled: this.notificationsEnabled
    });
    
    const messagesContainer = this.container.querySelector('.chat-messages');
    if (!messagesContainer) return;
    
    const existingMessage = messagesContainer.querySelector(`[data-message-id="${message.id}"]`);
    if (existingMessage) return;
    
    const messageElement = this.createMessageElement(message);
    messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
    
    if (message.pseudo !== this.pseudo) {
        this.playSound('message');
        
        if (!chatOpen) {
            this.unreadCount++;
            localStorage.setItem('unreadCount', this.unreadCount.toString());
            
            if (this.notificationsEnabled) {
                try {
                    // Utiliser le résultat mais ne pas propager d'erreur
                    const notificationResult = await this.sendNotificationToUser(message);
                    if (!notificationResult?.success) {
                        console.warn('Notification non envoyée:', notificationResult?.error || 'Raison inconnue');
                    }
                } catch (error) {
                    // En cas d'erreur, simplement logger mais ne pas interrompre
                    console.warn('Erreur notification ignorée:', error.message);
                }
            }
            
            this.updateUnreadBadgeAndBubble();
        }
    }
}

    formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Format de l'heure
    const time = date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    let dateText, icon;
    
    // Si c'est aujourd'hui
    if (date.toDateString() === today.toDateString()) {
        dateText = "Aujourd'hui";
        icon = "today";
    }
    // Si c'est hier
    else if (date.toDateString() === yesterday.toDateString()) {
        dateText = "Hier";
        icon = "history";
    }
    // Pour les autres jours
    else {
        dateText = date.toLocaleDateString('fr-FR');
        icon = "calendar_today";
    }

    return `
        <span class="material-icons">${icon}</span>
        <span class="date">${dateText}</span>
        <span class="time">${time}</span>
    `;
}

createMessageElement(message) {
  const div = document.createElement('div');
  div.className = `message ${message.pseudo === this.pseudo ? 'sent' : 'received'}`;
  div.dataset.messageId = message.id;

  // Modification de la structure du message
div.innerHTML = `
  <div class="message-author">${message.pseudo}</div>
  <div class="message-content">${this.escapeHtml(message.content)}</div>
  <div class="message-time">${this.formatMessageTime(message.created_at)}</div>
  <div class="message-reactions" data-message-id="${message.id}"></div>
  <button class="add-reaction" title="Ajouter une réaction">
    <span class="material-icons">add_reaction</span>
  </button>
`;

  // Gestion des réactions
  const addReactionBtn = div.querySelector('.add-reaction');
  addReactionBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    this.showEmojiPicker(message.id, e.clientX, e.clientY);
  });

  // Gestion du menu contextuel et de l'appui long (code existant)
  if (this.isAdmin || message.pseudo === this.pseudo) {
        // Variables pour gérer l'appui long et prévenir les actions indésirables
        let touchTimer;
        let longPressActive = false;
        let lastTouchEnd = 0;
        
        // Gestion du clic droit sur PC
        div.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showMessageOptions(message, e.clientX, e.clientY);
        });

        // Gérer le toucher qui commence (touchstart)
        div.addEventListener('touchstart', (e) => {
    // Ne pas démarrer un nouveau timer si un appui long a été récemment détecté
    if (Date.now() - lastTouchEnd < 1000) {
        return;
    }
    
    // Démarrer le timer pour l'appui long
    touchTimer = setTimeout(() => {
        longPressActive = true;
        const touch = e.touches[0];
        this.showMessageOptions(message, touch.clientX, touch.clientY);
        
        // Ajouter une vibration si disponible
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }, 800);
	}, { passive: true });
        
        // Annuler l'appui long si le doigt bouge
        div.addEventListener('touchmove', () => {
    clearTimeout(touchTimer);
	}, { passive: true });
        
        // Gérer la fin du toucher
        div.addEventListener('touchend', (e) => {
            clearTimeout(touchTimer);
            
            // Si c'était un appui long, empêcher toute autre action
            if (longPressActive) {
                e.preventDefault();
                e.stopPropagation();
                longPressActive = false;
                
                // Enregistrer le moment où l'appui long s'est terminé
                lastTouchEnd = Date.now();
            }
        });
        
        // S'assurer que le timer est annulé si le toucher est annulé
        div.addEventListener('touchcancel', () => {
            clearTimeout(touchTimer);
            longPressActive = false;
        });
    }
	// Charger les réactions existantes
  this.loadMessageReactions(message.id);

    return div;
}

    async loadExistingMessages() {
    try {
        console.log("Chargement des messages existants...");
        
        // Afficher un indicateur de chargement
        const container = this.container.querySelector('.chat-messages');
        if (container) {
            container.innerHTML = '<div class="loading-messages">Chargement des messages...</div>';
        }
        
        // Définir l'utilisateur courant pour RLS
        await this.setCurrentUserForRLS();
        
        // Requête simple pour récupérer TOUS les messages sans filtrage
        const { data: messages, error } = await this.supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Erreur chargement messages:', error);
            throw error;
        }

        console.log(`${messages?.length || 0} messages récupérés de Supabase`);
        
        if (container) {
            container.innerHTML = '';
            
            if (!messages || messages.length === 0) {
                container.innerHTML = '<div class="no-messages">Aucun message récent</div>';
                return;
            }
            
            // Afficher chaque message sans filtrage supplémentaire
            messages.forEach(msg => {
                console.log(`Affichage du message ID: ${msg.id}, auteur: ${msg.pseudo}`);
                container.appendChild(this.createMessageElement(msg));
            });
            
            this.scrollToBottom();
        }
    } catch (error) {
        console.error('Erreur chargement messages:', error);
        
        const container = this.container.querySelector('.chat-messages');
        if (container) {
            container.innerHTML = '<div class="error-messages">Erreur lors du chargement des messages</div>';
        }
        
        this.showNotification('Erreur chargement messages', 'error');
    }
}

    async sendMessage(content) { 
    try {
        // Vérifier d'abord si l'utilisateur est banni
        const isBanned = await this.checkUserBannedStatus();
        if (isBanned) {
            return false;
        }
        
        // Utiliser directement this.pseudo comme identifiant
        const isBannedCheck = await this.checkBannedIP(this.pseudo);
        
        if (isBannedCheck) {
            console.log(`Message rejeté - utilisateur banni: ${this.pseudo}`);
            this.showNotification('Vous êtes banni du chat', 'error');
            // Déconnecter l'utilisateur banni
            await this.logout();
            return false;
        }        
        
        // Vérifier les mots bannis
        const containsBannedWord = await this.checkForBannedWords(content);
        if (containsBannedWord) {
            this.showNotification('Votre message contient des mots interdits', 'error');
            return false;
        }
        
        // Définir l'utilisateur courant pour RLS
        const rlsSuccess = await this.setCurrentUserForRLS();
        if (!rlsSuccess) {
            console.error("Échec de la définition de l'utilisateur pour RLS");
            this.showNotification('Erreur d\'authentification', 'error');
            return false;
        }
        
        // Créer l'identifiant unique pour ce message
        const messageIp = `${this.pseudo}-${Date.now()}`;
        
        // Obtenir l'IP réelle de l'utilisateur
        const realIP = await this.getClientRealIP();
        
        // Construire le message avec l'identifiant et l'IP réelle
        const message = {
            pseudo: this.pseudo,
            content: content,
            ip: messageIp,
            real_ip: realIP, // Nouvelle propriété
            created_at: new Date().toISOString()
        };
        
        // Insérer le message
        const { data: messageData, error } = await this.supabase
            .from('messages')
            .insert(message)
            .select()
            .single();
            
        if (error) throw error;
        
        // Le reste de votre code existant...
        return true;
    } catch (error) {
        console.error('Erreur sendMessage:', error);
        return false;
    }
}

    // Remplacez votre méthode setupPushNotifications par celle-ci:
    async setupPushNotifications() {
        try {
            // Initialiser le gestionnaire de notifications
            await notificationManager.init({
                supabase: this.supabase,
                showNotification: this.showNotification.bind(this),
                pseudo: this.pseudo,
                isAdmin: this.isAdmin
            });
            
            // Demander la permission et s'abonner
            const subscription = await notificationManager.requestPermissionAndSubscribe();
            
            if (subscription) {
                this.subscription = subscription;
                this.notificationsEnabled = true;
                localStorage.setItem('notificationsEnabled', 'true');
                this.updateNotificationButton();
                
                // Afficher une notification de test
                this.showNotification('Notifications activées!', 'success');
                
                // Vérification périodique de la souscription
                setInterval(async () => {
                    try {
                        const isSubscribed = await notificationManager.checkSubscription();
                        if (!isSubscribed) {
                            console.log('Renouvellement de la souscription nécessaire');
                            await notificationManager.subscribeToPush();
                        }
                    } catch (error) {
                        console.error('Erreur vérification souscription:', error);
                    }
                }, 3600000); // Vérification toutes les heures
                
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Erreur activation notifications:', error);
            this.showNotification('Erreur: ' + error.message, 'error');
            return false;
        }
    }

async sendTestNotification() {
    try {
        // Vérifier si les notifications sont supportées
        if (!('Notification' in window)) return;
        
        // Créer une notification de test
        new Notification('Notification de test', {
            body: 'Les notifications fonctionnent correctement!',
            icon: '/icons/icon-192x192.png' // Remplacez par le chemin de votre icône
        });
    } catch (error) {
        console.error('Erreur notification test:', error);
    }
}
// Ajoutez cette nouvelle méthode ici
async requestNotificationPermission() {
    try {
        // Vérifier si les notifications sont supportées
        if (!('Notification' in window)) {
            this.showNotification('Les notifications ne sont pas supportées par ce navigateur', 'error');
            return false;
        }
        
        // Demander la permission
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            this.showNotification('Notifications activées avec succès!', 'success');
            this.notificationsEnabled = true;
            localStorage.setItem('notificationsEnabled', 'true');
            this.updateNotificationButton();
            return true;
        } else {
            this.showNotification('Permission de notification refusée', 'error');
            return false;
        }
    } catch (error) {
        console.error('Erreur lors de la demande de permission:', error);
        this.showNotification('Erreur lors de l\'activation des notifications', 'error');
        return false;
    }
}
async renewPushSubscription() {
    try {
        const registration = await navigator.serviceWorker.ready;
        
        // Supprimer l'ancienne souscription
        const oldSubscription = await registration.pushManager.getSubscription();
        if (oldSubscription) {
            await oldSubscription.unsubscribe();
            
            // Supprimer l'ancienne souscription de Supabase
            await this.supabase
                .from('push_subscriptions')
                .delete()
                .match({ 
                    pseudo: this.pseudo,
                    subscription: JSON.stringify(oldSubscription)
                });
        }

        // Créer une nouvelle souscription - utiliser la même clé que dans setupPushNotifications()
        const newSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array('BLpaDhsC7NWdMacPN0mRpqZlsaOrOEV1AwgPyqs7D2q3HBZaQqGSMH8zTnmwzZrFKjjO2JvDonicGOl2zX9Jsck')
        });

        // Sauvegarder la nouvelle souscription
        await this.supabase
            .from('push_subscriptions')
            .insert({
                pseudo: this.pseudo,
                subscription: JSON.stringify(newSubscription),
                device_type: this.getDeviceType(),
                active: true,
                last_updated: new Date().toISOString()
            });

        console.log('Souscription push renouvelée avec succès');
        return true;
    } catch (error) {
        console.error('Erreur renouvellement souscription:', error);
        return false;
    }
}
// Méthode utilitaire pour détecter le type d'appareil
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

isTablet() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent);
    const isIPad = /ipad/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    return isTablet || isIPad || (window.innerWidth >= 600 && window.innerWidth <= 1024);
}

optimizeForLowEndDevices() {
    // Détecter si l'appareil est une tablette peu puissante
    const isLowPerfDevice = this.isTablet() && (navigator.hardwareConcurrency <= 4 || !navigator.hardwareConcurrency);
    
    if (isLowPerfDevice) {
        console.log("Optimisations pour appareil à performances limitées activées");
        
        // Simplifier les animations
        document.documentElement.style.setProperty('--chat-animation-duration', '0.2s');
        
        // Limiter le nombre de messages affichés
        const messagesContainer = this.container.querySelector('.chat-messages');
        if (messagesContainer && messagesContainer.children.length > 30) {
            // Garder seulement les 30 derniers messages
            while (messagesContainer.children.length > 30) {
                messagesContainer.removeChild(messagesContainer.firstChild);
            }
        }
        
        // Simplifier les gradients
        const elements = this.container.querySelectorAll('.chat-container, .message, .chat-header, .chat-input');
        elements.forEach(el => {
            if (el) {
                el.style.backgroundImage = 'none';
            }
        });
    }
}

// Remplacez votre méthode unsubscribeFromPushNotifications par celle-ci:
    async unsubscribeFromPushNotifications() {
        try {
            const result = await notificationManager.unsubscribe();
            
            if (result) {
                this.notificationsEnabled = false;
                localStorage.setItem('notificationsEnabled', 'false');
                this.updateNotificationButton();
                this.showNotification('Notifications désactivées', 'success');
            }
            
            return result;
        } catch (error) {
            console.error('Erreur désactivation notifications:', error);
            this.showNotification('Erreur de désactivation', 'error');
            return false;
        }
    }
	
    // Remplacez votre méthode sendNotificationToUser par celle-ci:
    async sendNotificationToUser(message) {
        if (!this.notificationsEnabled || !message) return { success: false };
        
        try {
            // Préparer le message pour le gestionnaire de notifications
            const notificationMessage = {
                id: message.id,
                content: message.content,
                pseudo: message.pseudo,
                senderName: message.pseudo,
                senderId: message.ip // Votre format actuel utilise ip comme identifiant
            };
            
            // Utiliser le gestionnaire pour envoyer la notification
            return await notificationManager.sendPushNotification(notificationMessage);
        } catch (error) {
            console.error('Erreur envoi notification:', error);
            return { success: false, error: error.message };
        }
    }
	
	async loadSounds() {
        const soundFiles = {
            'message': '/sounds/message.mp3',
            'sent': '/sounds/sent.mp3',
            'notification': '/sounds/notification.mp3',
            'click': '/sounds/click.mp3',
            'error': '/sounds/erreur.mp3',
            'success': '/sounds/success.mp3'
        };

        for (const [name, path] of Object.entries(soundFiles)) {
            try {
                console.log(`Chargement du son: ${name} depuis ${path}`);
                const audio = new Audio(path);
                await audio.load();
                this.sounds.set(name, audio);
                console.log(`Son ${name} chargé avec succès`);
            } catch (error) {
                console.error(`Erreur chargement son ${name}:`, error);
            }
        }
    }

    playSound(soundName) {
        if (this.soundEnabled && this.sounds.has(soundName)) {
            try {
                const sound = this.sounds.get(soundName).cloneNode();
                sound.volume = 0.5;
                const playPromise = sound.play();
                
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        if (error.name !== 'NotAllowedError') {
                            console.warn(`Erreur lecture son ${soundName}:`, error);
                        }
                    });
                }
            } catch (error) {
                // Ignore silently
            }
        }
    }

    async checkBannedIP(ip) {
    try {
        // Extraire le pseudo de l'IP (format: pseudo-timestamp)
        const pseudo = ip.split('-')[0];
        console.log(`Vérification bannissement pour pseudo: ${pseudo}`);
        
        // Requête plus simple et directe
        const { data, error } = await this.supabase
            .from('banned_ips')
            .select('*')
            .eq('ip', pseudo)
            .maybeSingle();

        if (error) {
            console.error('Erreur vérification bannissement:', error);
            return false;
        }
        
        // Si pas de bannissement, retourner false
        if (!data) {
            console.log(`Aucun bannissement trouvé pour: ${pseudo}`);
            return false;
        }
        
        console.log('Bannissement trouvé:', data);
        
        // Vérifier si le bannissement est expiré
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            console.log(`Bannissement expiré pour: ${pseudo}`);
            // Supprimer le bannissement expiré
            await this.supabase
                .from('banned_ips')
                .delete()
                .eq('ip', pseudo);
            return false;
        }
        
        console.log(`Utilisateur ${pseudo} est banni!`);
        
        // NOUVEAU: Marquer l'appareil comme banni localement
        localStorage.setItem('chat_device_banned', 'true');
        localStorage.setItem('chat_device_banned_until', data.expires_at || 'permanent');
        localStorage.setItem('chat_ban_reason', data.reason || 'Utilisateur banni');
        
        // NOUVEAU: Si l'utilisateur est connecté et est le même que celui qui est banni,
        // forcer immédiatement la déconnexion et afficher le message de bannissement
        if (this.pseudo === pseudo) {
            // Forcer la déconnexion
            await this.logout();
            
            // Afficher le message de bannissement
            this.showBanNotification(data.reason || 'Utilisateur banni');
            
            // Recharger la page après un court délai
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
        
        return true;
    } catch (error) {
        console.error('Erreur vérification bannissement:', error);
        return false;
    }
}

// Après votre méthode checkBannedIP ou toute autre méthode appropriée
async isDeviceBanned() {
    try {
        const deviceId = this.getDeviceId();
        console.log(`[DEBUG] Vérification bannissement pour appareil: ${deviceId}`);
        
        // Récupérer TOUS les bannissements 
        const { data: allBans, error: allBansError } = await this.supabase
            .from('banned_ips')
            .select('*');
            
        if (!allBansError && allBans) {
            console.log(`[DEBUG] Nombre de bannissements: ${allBans.length}`);
            
            // Chercher manuellement notre appareil dans la liste
            const deviceBan = allBans.find(ban => ban.ip === deviceId);
            if (deviceBan) {
                console.log(`[DEBUG] Bannissement trouvé pour appareil: ${deviceId}`, deviceBan);
                
                // Vérifier si le bannissement est expiré
                if (deviceBan.expires_at && new Date(deviceBan.expires_at) < new Date()) {
                    console.log(`[DEBUG] Bannissement expiré pour appareil: ${deviceId}`);
                    return false;
                }
                
                console.log(`[DEBUG] APPAREIL BANNI DÉTECTÉ: ${deviceId}`);
                return true;
            }
        }
        
        console.log(`[DEBUG] Aucun bannissement trouvé pour appareil: ${deviceId}`);
        return false;
    } catch (error) {
        console.error('[DEBUG] Erreur vérification bannissement appareil:', error);
        return false;
    }
}

// Nouvelle méthode pour vérifier si l'adresse IP réelle est bannie
async checkRealIPBan() {
    // Si l'utilisateur n'est pas connecté, ne pas continuer
    if (!this.pseudo) return false;
    
    // Obtenir l'adresse IP réelle
    const realIP = await this.getClientRealIP();
    if (!realIP) return false;
    
    // Vérifier dans la base de données si cette IP est bannie
    const { data: ipBan, error: ipBanError } = await this.supabase
        .from('banned_real_ips')
        .select('*')
        .eq('ip', realIP)
        .maybeSingle();
        
    // Si un bannissement valide est trouvé
    if (!ipBanError && ipBan && (!ipBan.expires_at || new Date(ipBan.expires_at) > new Date())) {
        console.log('IP réelle bannie détectée pendant la session');
        this.showNotification('Votre adresse IP a été bannie du chat', 'error');
        
        // Déconnecter l'utilisateur
        await this.logout();
        
        // Afficher un message de bannissement
        const banDiv = document.createElement('div');
        banDiv.style.position = 'fixed';
        banDiv.style.top = '50%';
        banDiv.style.left = '50%';
        banDiv.style.transform = 'translate(-50%, -50%)';
        banDiv.style.backgroundColor = '#d32f2f';
        banDiv.style.color = 'white';
        banDiv.style.padding = '20px';
        banDiv.style.borderRadius = '10px';
        banDiv.style.textAlign = 'center';
        banDiv.style.zIndex = '9999';
        banDiv.style.width = '80%';
        banDiv.style.maxWidth = '400px';
        banDiv.innerHTML = '<h2>Accès interdit</h2><p>Votre adresse IP a été bannie du chat.</p>';
        
        document.body.appendChild(banDiv);
        
        return true;
    }
    
    return false;
}

    async getClientIP() {
    try {
        // Utiliser uniquement le pseudo comme identifiant pour le bannissement
        return this.pseudo || 'anonymous';
    } catch {
        return 'anonymous';
    }
}

// Cette méthode utilise un service externe pour déterminer l'IP publique
async getClientRealIP() {
    try {
        // Vérifier si nous avons une IP récente en cache (moins d'une heure)
        const cachedIP = localStorage.getItem('last_known_real_ip');
        const lastCheckTime = parseInt(localStorage.getItem('last_ip_check_time') || '0');
        const cacheAge = Date.now() - lastCheckTime;
        
        // Si le cache existe et est récent (moins d'une heure), l'utiliser
        if (cachedIP && cacheAge < 60 * 60 * 1000) {
            console.log('Utilisation de l\'IP en cache:', cachedIP);
            return cachedIP;
        }
        
        // Essayer plusieurs services pour obtenir l'IP
        const services = [
            'https://api.ipify.org?format=json',
            'https://ipinfo.io/json',
            'https://api.my-ip.io/ip.json'
        ];
        
        for (const service of services) {
            try {
                // Ajouter un timeout pour éviter les attentes trop longues
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                
                const response = await fetch(service, { 
                    signal: controller.signal,
                    mode: 'cors',
                    cache: 'no-cache'
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    const ip = data.ip || data.IPv4 || data.ipAddress || '';
                    
                    if (ip) {
                        console.log('IP réelle obtenue via', service, ':', ip);
                        
                        // Stocker l'IP en cache local
                        localStorage.setItem('last_known_real_ip', ip);
                        localStorage.setItem('last_ip_check_time', Date.now().toString());
                        
                        return ip;
                    }
                }
            } catch (serviceError) {
                console.warn(`Erreur avec le service ${service}:`, serviceError);
                // Continuer avec le service suivant
            }
        }
        
        // Si tous les services échouent, utiliser une IP en cache même ancienne
        if (cachedIP) {
            console.log('Utilisation de l\'IP en cache (ancienne):', cachedIP);
            return cachedIP;
        }
    } catch (error) {
        console.error('Erreur obtention IP:', error);
    }
    
    console.warn("Impossible d'obtenir l'IP réelle");
    return null;
}

startBanMonitoring() {
    console.log(`Démarrage de la surveillance des bannissements pour ${this.pseudo}`);
    
    // Vérifier immédiatement
    this.checkBannedStatus();
    
    // Puis vérifier toutes les 30 secondes
    this.banMonitorInterval = setInterval(async () => {
        // Vérifier d'abord le bannissement par pseudo
        const isBanned = await this.checkBannedStatus();
        
        // Si pas banni par le pseudo, vérifier par IP réelle
        if (!isBanned) {
            await this.checkRealIPBan();
        }
    }, 30000);  // Augmenté à 30 secondes pour réduire la charge serveur
}

async checkBannedStatus() {
    if (!this.pseudo) return;
    
    const isBanned = await this.checkBannedIP(this.pseudo);
    if (isBanned) {
        console.log(`Bannissement détecté pour ${this.pseudo}, déconnexion...`);
        this.showNotification('Vous avez été banni du chat', 'error');
        
        // Arrêter la surveillance
        if (this.banMonitorInterval) {
            clearInterval(this.banMonitorInterval);
        }
        
        // Déconnecter l'utilisateur
        await this.logout();
    }
}

showSimpleNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `simple-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: ${type === 'error' ? 'rgba(211, 47, 47, 0.9)' : 'rgba(33, 150, 83, 0.9)'};
        color: white;
        padding: 12px 20px;
        border-radius: 5px;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        font-size: 14px;
        max-width: 300px;
        word-wrap: break-word;
        animation: slideInRight 0.3s ease-out forwards;
    `;
    
    // Ajouter un style pour l'animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    
    if (!document.head.querySelector('style[data-for="simple-notification"]')) {
        style.setAttribute('data-for', 'simple-notification');
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Supprimer la notification après 3 secondes
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.5s ease-out forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 3000);
}

// Ajoutez cette méthode juste après showSimpleNotification()
createBanStatusButton() {
    // Supprimer tout bouton existant
    const existingButton = document.getElementById('check-ban-status-button');
    if (existingButton) {
        existingButton.remove();
    }
    
    // Vérifier si l'utilisateur est réellement banni
    const isBanned = localStorage.getItem('chat_device_banned') === 'true';
    if (!isBanned) {
        console.log("L'utilisateur n'est pas banni, pas besoin de bouton de statut");
        return null;
    }
    
    // Détecter si on est sur mobile
    const isMobile = window.innerWidth <= 768;
    
    // Créer le bouton flottant
    const button = document.createElement('button');
    button.id = 'check-ban-status-button';
    
    // Style différent pour mobile et desktop
    if (isMobile) {
        button.innerHTML = '🔄';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(211, 47, 47, 0.8);
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 20px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            cursor: pointer;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        `;
    } else {
        button.innerHTML = '🔄 Vérifier accès chat';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(211, 47, 47, 0.8);
            color: white;
            border: none;
            border-radius: 50px;
            padding: 10px 20px;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            cursor: pointer;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        `;
    }
    
    // Ajouter un effet hover
    button.addEventListener('mouseenter', () => {
        button.style.background = 'rgba(211, 47, 47, 1)';
        button.style.transform = 'scale(1.05)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.background = 'rgba(211, 47, 47, 0.8)';
        button.style.transform = 'scale(1)';
    });
    
    // Titre informatif pour expliquer ce que fait le bouton
    button.title = "Vérifier si votre bannissement a été levé";
    
    // Ajouter le gestionnaire de clic
    button.addEventListener('click', async () => {
        // Animation de chargement adaptée au mobile
        if (isMobile) {
            button.innerHTML = '⏳';
        } else {
            button.innerHTML = '⏳ Vérification...';
        }
        button.disabled = true;
        
        try {
            // Vérifications identiques à celles dans showBanNotification
            const realIP = await this.getClientRealIP();
            const storedPseudo = localStorage.getItem('lastPseudo') || localStorage.getItem('chatPseudo');
            
            // Vérifier dans banned_ips
            let isBannedInIps = false;
            if (storedPseudo) {
                const { data: ipBanData } = await this.supabase
                    .from('banned_ips')
                    .select('*')
                    .eq('ip', storedPseudo)
                    .maybeSingle();
                    
                if (ipBanData) {
                    // Vérifier si le bannissement est expiré
                    if (ipBanData.expires_at && new Date(ipBanData.expires_at) < new Date()) {
                        // Le bannissement a expiré, supprimer l'entrée
                        await this.supabase
                            .from('banned_ips')
                            .delete()
                            .eq('ip', storedPseudo);
                    } else {
                        isBannedInIps = true;
                    }
                }
            }
            
            // Vérifier dans banned_real_ips
            let isBannedInRealIps = false;
            if (realIP) {
                const { data: realIpBanData } = await this.supabase
                    .from('banned_real_ips')
                    .select('*')
                    .eq('ip', realIP)
                    .maybeSingle();
                    
                if (realIpBanData) {
                    // Vérifier si le bannissement est expiré
                    if (realIpBanData.expires_at && new Date(realIpBanData.expires_at) < new Date()) {
                        // Le bannissement a expiré, supprimer l'entrée
                        await this.supabase
                            .from('banned_real_ips')
                            .delete()
                            .eq('ip', realIP);
                    } else {
                        isBannedInRealIps = true;
                    }
                }
            }
            
            // Si plus banni nulle part, afficher un message de succès
            if (!isBannedInIps && !isBannedInRealIps) {
                // Supprimer les données de bannissement local
                localStorage.removeItem('chat_device_banned');
                localStorage.removeItem('chat_device_banned_until');
                localStorage.removeItem('chat_ban_reason');
                localStorage.removeItem('chat_ban_dismissed');
                
                // Créer un cookie pour indiquer que le bannissement a été levé
                document.cookie = "chat_ban_lifted=true; path=/; max-age=60";
                
                // Afficher une notification de succès
                const successNotif = document.createElement('div');
                successNotif.className = 'ban-status-notification success';
                successNotif.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
                        <h3 style="margin: 0 0 10px 0;">Votre accès au chat a été restauré</h3>
                        <p style="margin: 0 0 15px 0;">Vous pouvez à nouveau utiliser le chat.</p>
                        <button id="reload-page-button" style="background: #4CAF50; border: none; color: white; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Actualiser la page</button>
                    </div>
                `;
                
                // Styles
                successNotif.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(135deg, rgba(33, 150, 83, 0.9), rgba(16, 120, 60, 0.9));
                    color: white;
                    padding: 30px;
                    border-radius: 10px;
                    z-index: 10000;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
                    max-width: 90%;
                    width: 350px;
                `;
                
                document.body.appendChild(successNotif);
                
                // Ajouter le gestionnaire pour actualiser la page
                document.getElementById('reload-page-button')?.addEventListener('click', () => {
                    window.location.reload();
                });
                
                // Supprimer le bouton de statut
                button.remove();
            } else {
                // Si toujours banni, afficher un message
                if (isMobile) {
                    button.innerHTML = '🔒';
                } else {
                    button.innerHTML = '🔒 Toujours banni';
                }
                
                // Réinitialiser après 3 secondes
                setTimeout(() => {
                    if (isMobile) {
                        button.innerHTML = '🔄';
                    } else {
                        button.innerHTML = '🔄 Vérifier accès chat';
                    }
                    button.disabled = false;
                }, 3000);
                
                // Afficher aussi une notification
                this.showSimpleNotification("Vous êtes toujours banni du chat", "error");
            }
        } catch (error) {
            console.error("Erreur lors de la vérification du bannissement:", error);
            if (isMobile) {
                button.innerHTML = '⚠️';
            } else {
                button.innerHTML = '⚠️ Erreur';
            }
            
            // Réinitialiser après 3 secondes
            setTimeout(() => {
                if (isMobile) {
                    button.innerHTML = '🔄';
                } else {
                    button.innerHTML = '🔄 Vérifier accès chat';
                }
                button.disabled = false;
            }, 3000);
            
            this.showSimpleNotification("Erreur lors de la vérification", "error");
        }
    });
    
    // Ajouter le bouton au document
    document.body.appendChild(button);
    
    // Stocker l'état du bouton pour persistance entre les rechargements
    localStorage.setItem('status_button_visible', 'true');
    
    return button;
}

async checkAndClearLocalBan() {
    console.log("Vérification des bannissements locaux...");
    
    // Vérifier si un bannissement local est enregistré
    const isBannedLocally = localStorage.getItem('chat_device_banned') === 'true';
    
    if (!isBannedLocally) {
        console.log("Aucun bannissement local détecté");
        return false; // Pas de bannissement local
    }
    
    console.log("Bannissement local détecté, vérification de sa validité...");
    
    // Vérifier si le bannissement a une date d'expiration
    const bannedUntil = localStorage.getItem('chat_device_banned_until');
    
    // Si c'est permanent, on ne fait rien
    if (bannedUntil === 'permanent') {
        console.log("Bannissement permanent, aucune action à entreprendre");
        return true; // Toujours banni
    }
    
    // Si c'est temporaire, vérifier si c'est expiré
    if (bannedUntil) {
        const expiryTime = parseInt(bannedUntil);
        if (Date.now() > expiryTime) {
            console.log("Bannissement local expiré, nettoyage...");
            
            // Supprimer toutes les informations de bannissement
            localStorage.removeItem('chat_device_banned');
            localStorage.removeItem('chat_device_banned_until');
            localStorage.removeItem('chat_ban_reason');
            localStorage.removeItem('chat_ban_dismissed');
            
            // Afficher une notification
            this.showNotification("Votre bannissement a expiré, vous pouvez à nouveau utiliser le chat", "success");
            
            // Afficher le bouton de chat s'il existe
            const chatBtn = document.getElementById('chatToggleBtn');
            if (chatBtn) {
                chatBtn.style.display = 'flex';
            }
            
            return false; // Plus banni
        } else {
            console.log(`Bannissement encore actif, expire dans ${Math.round((expiryTime - Date.now()) / 1000 / 60)} minutes`);
            return true; // Toujours banni
        }
    }
    
    return true; // Par défaut, considérer comme banni
}

// Fonction pour vérifier si un utilisateur est banni dans la base de données
async isUserBannedInDatabase(pseudo) {
    if (!pseudo) return false;
    
    try {
        // Vérifier dans banned_ips
        const { data: bannedIpData, error: bannedIpError } = await this.supabase
            .from('banned_ips')
            .select('*')
            .eq('ip', pseudo)
            .maybeSingle();
            
        if (!bannedIpError && bannedIpData) {
            // Vérifier si le bannissement est expiré
            if (bannedIpData.expires_at && new Date(bannedIpData.expires_at) < new Date()) {
                console.log(`Bannissement expiré pour ${pseudo} dans banned_ips`);
                return false;
            }
            return true;
        }
        
        // Vérifier dans banned_real_ips
        const { data: bannedRealIpData, error: bannedRealIpError } = await this.supabase
            .from('banned_real_ips')
            .select('*')
            .eq('ip', pseudo)
            .maybeSingle();
            
        if (!bannedRealIpError && bannedRealIpData) {
            // Vérifier si le bannissement est expiré
            if (bannedRealIpData.expires_at && new Date(bannedRealIpData.expires_at) < new Date()) {
                console.log(`Bannissement expiré pour ${pseudo} dans banned_real_ips`);
                return false;
            }
            return true;
        }
        
        return false;
    } catch (error) {
        console.error("Erreur lors de la vérification du bannissement:", error);
        return false; // En cas d'erreur, considérer comme non banni
    }
}

showBanNotification(reason = '') {
    // Stocker les informations de bannissement
    localStorage.setItem('chat_device_banned', 'true');
    localStorage.setItem('chat_device_banned_until', 'permanent');
    if (reason) {
        localStorage.setItem('chat_ban_reason', reason);
    }
    
    // Stocker le pseudo actuel pour vérifications ultérieures
    if (this.pseudo) {
        localStorage.setItem('lastPseudo', this.pseudo);
    }
    
    // Masquer le bouton de chat
    const chatElements = document.querySelectorAll('.chat-widget, .chat-toggle-btn, #chatToggleBtn');
    chatElements.forEach(el => {
        if (el) el.style.display = 'none';
    });
    
    // Utiliser le système externe de bannissement
    if (window.banCheckSystem) {
        window.banCheckSystem.showBanMessage();
    } else {
        // Afficher un message simple si le système externe n'est pas disponible
        const banMessage = document.createElement('div');
        banMessage.className = 'chat-banned-message';
        banMessage.innerHTML = `
            <div class="banned-icon">🚫</div>
            <h2>Accès interdit</h2>
            <p>Votre accès au chat a été suspendu.</p>
            ${reason ? `<p class="ban-reason">Raison: ${reason}</p>` : ''}
            <button id="dismiss-ban-message">Fermer</button>
        `;
        
        document.body.appendChild(banMessage);
        
        document.getElementById('dismiss-ban-message').addEventListener('click', function() {
            banMessage.remove();
            localStorage.setItem('chat_ban_dismissed', 'true');
        });
    }
}

async checkAndClearExpiredBans(forceCleanup = false) {
    try {
        console.log("Vérification des bannissements expirés...");
        
        // Vérifier le bannissement local d'abord
        const bannedUntil = localStorage.getItem('chat_device_banned_until');
        if (bannedUntil && bannedUntil !== 'permanent') {
            const expiryTime = parseInt(bannedUntil);
            if (Date.now() > expiryTime) {
                console.log("Bannissement local expiré, nettoyage...");
                localStorage.removeItem('chat_device_banned');
                localStorage.removeItem('chat_device_banned_until');
                localStorage.removeItem('chat_ban_reason');
                localStorage.removeItem('chat_ban_dismissed');
            }
        }
        
        // Si nous sommes administrateur ou si le nettoyage est forcé, nettoyer la base de données
        if (this.isAdmin || forceCleanup) {
            console.log("Nettoyage des bannissements expirés dans la base de données");
            
            // Supprimer les bannissements expirés de banned_ips
            const { data: expiredIps, error: ipSelectError } = await this.supabase
                .from('banned_ips')
                .select('*')
                .lt('expires_at', new Date().toISOString());
                
            if (ipSelectError) {
                console.error("Erreur lors de la recherche des banned_ips expirés:", ipSelectError);
            } else if (expiredIps && expiredIps.length > 0) {
                console.log(`${expiredIps.length} bannissements expirés trouvés dans banned_ips`);
                
                for (const ban of expiredIps) {
                    const { error: deleteError } = await this.supabase
                        .from('banned_ips')
                        .delete()
                        .eq('id', ban.id);
                        
                    if (deleteError) {
                        console.warn(`Erreur lors de la suppression du bannissement IP ${ban.ip}:`, deleteError);
                    } else {
                        console.log(`Bannissement expiré supprimé pour IP ${ban.ip}`);
                    }
                }
            }
            
            // Supprimer les bannissements expirés de banned_real_ips
            const { data: expiredRealIps, error: realIpSelectError } = await this.supabase
                .from('banned_real_ips')
                .select('*')
                .lt('expires_at', new Date().toISOString());
                
            if (realIpSelectError) {
                console.error("Erreur lors de la recherche des banned_real_ips expirés:", realIpSelectError);
            } else if (expiredRealIps && expiredRealIps.length > 0) {
                console.log(`${expiredRealIps.length} bannissements expirés trouvés dans banned_real_ips`);
                
                for (const ban of expiredRealIps) {
                    const { error: deleteError } = await this.supabase
                        .from('banned_real_ips')
                        .delete()
                        .eq('id', ban.id);
                        
                    if (deleteError) {
                        console.warn(`Erreur lors de la suppression du bannissement IP réelle ${ban.ip}:`, deleteError);
                    } else {
                        console.log(`Bannissement expiré supprimé pour IP réelle ${ban.ip}`);
                    }
                }
            }
        }
        
        // Vérifier si l'appareil actuel est encore banni
        const deviceId = this.getDeviceId();
        if (deviceId) {
            // Vérifier dans banned_ips
            const { data: deviceBan, error: deviceBanError } = await this.supabase
                .from('banned_ips')
                .select('*')
                .eq('ip', deviceId)
                .maybeSingle();
                
            if (deviceBanError) {
                console.warn("Erreur lors de la vérification du bannissement d'appareil:", deviceBanError);
            } else if (!deviceBan) {
                // L'appareil n'est plus banni dans la base de données
                localStorage.removeItem('chat_device_banned');
                localStorage.removeItem('chat_device_banned_until');
                localStorage.removeItem('chat_ban_reason');
                localStorage.removeItem('chat_ban_dismissed');
            }
        }
        
        // Vérifier si notre IP réelle est encore bannie
        const realIP = await this.getClientRealIP();
        if (realIP) {
            const { data: realIpBan, error: realIpBanError } = await this.supabase
                .from('banned_real_ips')
                .select('*')
                .eq('ip', realIP)
                .maybeSingle();
                
            if (realIpBanError) {
                console.warn("Erreur lors de la vérification du bannissement d'IP réelle:", realIpBanError);
            } else if (!realIpBan) {
                // L'IP réelle n'est plus bannie
                localStorage.removeItem('chat_device_banned');
                localStorage.removeItem('chat_device_banned_until');
                localStorage.removeItem('chat_ban_reason');
                localStorage.removeItem('chat_ban_dismissed');
                
                // Créer un cookie pour indiquer que le bannissement a été levé
                document.cookie = "chat_ban_lifted=true; path=/; max-age=60";
            }
        }
        
        return true;
    } catch (error) {
        console.error("Erreur lors de la vérification des bannissements expirés:", error);
        return false;
    }
}

async cleanBanDatabase() {
    if (!this.isAdmin) {
        console.warn("Tentative de nettoyage de la base de bannissements sans privilèges d'administrateur");
        return false;
    }
    
    try {
        console.log("Nettoyage des bannissements dans la base de données...");
        
        // Obtenir l'IP réelle de l'administrateur
        const adminRealIP = await this.getClientRealIP();
        const adminDeviceId = this.getDeviceId();
        
        // 1. Supprimer tous les bannissements pour l'IP de l'administrateur
        if (adminRealIP) {
            const { error: deleteRealIpError } = await this.supabase
                .from('banned_real_ips')
                .delete()
                .eq('ip', adminRealIP);
                
            if (deleteRealIpError) {
                console.error("Erreur lors de la suppression du bannissement IP réelle de l'admin:", deleteRealIpError);
            } else {
                console.log(`Bannissement IP réelle de l'admin supprimé: ${adminRealIP}`);
            }
        }
        
        // 2. Supprimer tous les bannissements pour l'appareil de l'administrateur
        if (adminDeviceId) {
            const { error: deleteDeviceError } = await this.supabase
                .from('banned_ips')
                .delete()
                .eq('ip', adminDeviceId);
                
            if (deleteDeviceError) {
                console.error("Erreur lors de la suppression du bannissement appareil de l'admin:", deleteDeviceError);
            } else {
                console.log(`Bannissement appareil de l'admin supprimé: ${adminDeviceId}`);
            }
        }
        
        // 3. Supprimer le bannissement du pseudo de l'administrateur
        if (this.pseudo) {
            const { error: deletePseudoError } = await this.supabase
                .from('banned_ips')
                .delete()
                .eq('ip', this.pseudo);
                
            if (deletePseudoError) {
                console.error("Erreur lors de la suppression du bannissement pseudo de l'admin:", deletePseudoError);
            } else {
                console.log(`Bannissement pseudo de l'admin supprimé: ${this.pseudo}`);
            }
        }
        
        // 4. Supprimer toutes les entrées locales de bannissement
        localStorage.removeItem('chat_device_banned');
        localStorage.removeItem('chat_device_banned_until');
        localStorage.removeItem('chat_ban_reason');
        localStorage.removeItem('chat_ban_dismissed');
        
        // 5. Ajouter un cookie pour indiquer que le bannissement a été levé
        document.cookie = "chat_ban_lifted=true; path=/; max-age=60";
        
        // 6. Afficher une notification de succès
        this.showNotification("Protection admin : vos bannissements ont été nettoyés", "success");
        
        // 7. Recharger la page après un court délai
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
        return true;
    } catch (error) {
        console.error("Erreur lors du nettoyage des bannissements:", error);
        return false;
    }
}

    async checkForBannedWords(content) {
    try {
        // Recharger les mots bannis si nécessaire
        if (this.bannedWords.size === 0) {
            await this.loadBannedWords();
        }
        
        // Normaliser le contenu pour une meilleure détection
        const normalizedContent = content.toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
            .replace(/\s+/g, ' ');
        
        // Vérifier chaque mot banni
        for (const bannedWord of this.bannedWords) {
            if (normalizedContent.includes(bannedWord.toLowerCase())) {
                console.log(`Mot banni détecté: "${bannedWord}" dans "${content}"`);
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error('Erreur vérification mots bannis:', error);
        return false; // Par sécurité, on ne bloque pas le message en cas d'erreur
    }
}

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

    showNotification(message, type = 'info') {
    // ✅ Supprimer toute notification existante AVANT d'en créer une nouvelle
    const existingNotifications = document.querySelectorAll('.notification-popup');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification-popup ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

showBanNotification(reason = '') {
    // Protection spéciale pour les administrateurs
    if (this.isAdmin) {
        // Offrir à l'administrateur la possibilité de se débannir
        const adminProtection = document.createElement('div');
        adminProtection.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 9999;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            text-align: center;
            max-width: 90%;
            width: 400px;
        `;
        
        adminProtection.innerHTML = `
            <div style="font-size: 18px; margin-bottom: 10px; font-weight: bold;">Protection Administrateur</div>
            <p style="margin: 0 0 15px 0;">Vous êtes banni du chat, mais en tant qu'administrateur, vous pouvez supprimer ce bannissement.</p>
            <button id="admin-unban-button" style="background: #4CAF50; border: none; padding: 8px 15px; color: white; border-radius: 5px; cursor: pointer;">Se débannir</button>
        `;
        
        document.body.appendChild(adminProtection);
        
        // Ajouter le gestionnaire pour le bouton de débannissement
        document.getElementById('admin-unban-button').addEventListener('click', async () => {
            await this.cleanBanDatabase();
            adminProtection.remove();
        });
    }

    // Supprimer toute notification existante
    document.querySelectorAll('.chat-banned-message').forEach(el => el.remove());
    
    // Vérifier si le CSS est déjà chargé
    if (!document.getElementById('chat-ban-css')) {
        const link = document.createElement('link');
        link.id = 'chat-ban-css';
        link.rel = 'stylesheet';
        link.href = '/css/chat-ban.css';
        document.head.appendChild(link);
    }
    
    // Créer le message de bannissement amélioré
    const banMessage = document.createElement('div');
    banMessage.className = 'chat-banned-message';
    banMessage.innerHTML = `
        <div class="banned-icon">🚫</div>
        <h2 style="margin-top: 5px; margin-bottom: 10px; font-size: 20px; font-weight: bold;">Accès interdit</h2>
        <p style="margin: 0 0 5px 0;">Votre accès au chat a été suspendu.</p>
        ${reason ? `<p class="ban-reason">Raison: ${reason}</p>` : ''}
        <div style="display: flex; gap: 10px; margin-top: 15px; justify-content: center;">
            <button id="dismiss-ban-message" style="background: rgba(255,255,255,0.2); border: none; padding: 8px 15px; color: white; border-radius: 5px; cursor: pointer;">Fermer</button>
            <button id="check-ban-status-btn" style="background: rgba(255,255,255,0.25); border: none; padding: 8px 15px; color: white; border-radius: 5px; cursor: pointer;">Vérifier si débanni</button>
        </div>
    `;
    
    document.body.appendChild(banMessage);
    
    // Enregistrer le bannissement et sa raison dans le stockage local
    localStorage.setItem('chat_device_banned', 'true');
    localStorage.setItem('chat_device_banned_until', 'permanent');
    if (reason) {
        localStorage.setItem('chat_ban_reason', reason);
    }
    
    // Stocker le pseudo actuel si disponible
    if (this.pseudo) {
        localStorage.setItem('lastPseudo', this.pseudo);
    }
    
    // Gestionnaire pour fermer la notification
    document.getElementById('dismiss-ban-message').addEventListener('click', function() {
        banMessage.classList.add('fade-out');
        setTimeout(() => {
            banMessage.remove();
        }, 500);
        
        // Stocker que le message a été fermé, mais garder l'information de bannissement
        localStorage.setItem('chat_ban_dismissed', 'true');
    });
    
    // ... le reste de votre code pour le bouton "Vérifier si débanni"
    
    // Empêcher l'accès au chat
    const chatElements = document.querySelectorAll('.chat-widget, .chat-toggle-btn, #chatToggleBtn');
    chatElements.forEach(el => {
        if (el) el.style.display = 'none';
    });
    
    // Créer le bouton flottant de secours
    if (window.banCheckSystem && typeof window.banCheckSystem.showBanMessage === 'function') {
        window.banCheckSystem.showBanMessage();
    }
}

    updateNotificationButton() {
        const notifBtn = this.container.querySelector('.notifications-btn');
        if (notifBtn) {
            notifBtn.classList.toggle('enabled', this.notificationsEnabled);
            notifBtn.querySelector('.material-icons').textContent =
                this.notificationsEnabled ? 'notifications_active' : 'notifications_off';

            if (this.notificationsEnabled) {
                notifBtn.querySelector('.material-icons').classList.add('animate');
                setTimeout(() => {
                    notifBtn.querySelector('.material-icons').classList.remove('animate');
                }, 1000);
            }
        }
    }

    // Mettez à jour la fonction qui gère les notifications
updateUnreadBadgeAndBubble() {
    // On récupère le bouton de chat via son ID
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    if (chatToggleBtn) {
        // Met à jour le badge de notification
        const badge = chatToggleBtn.querySelector('.chat-notification-badge');
        if (badge) {
            badge.textContent = this.unreadCount || '';
            badge.classList.toggle('hidden', this.unreadCount === 0);
        }
        
        // Supprimer toute bulle existante dans le document pour éviter les doublons
        const existingBubbles = document.querySelectorAll('.info-bubble');
        existingBubbles.forEach(bubble => bubble.remove());
        
        // Si le chat est ouvert ou s'il n'y a pas de messages non lus, on ne crée pas de bulle
        if (this.isOpen || this.unreadCount === 0) {
            return;
        }
        
        // Déterminer le thème actuel
        const isDarkTheme = document.body.classList.contains('dark-theme') || 
                          document.documentElement.classList.contains('dark-theme') ||
                          document.body.getAttribute('data-theme') === 'dark';
        
        // Créer une nouvelle bulle
        const bubble = document.createElement('div');
        bubble.className = 'info-bubble show';
        bubble.innerHTML = `<div style="font-weight: bold;">${this.unreadCount} nouveau(x) message(s)</div>`;
        
        // Sur mobile, on attache la bulle au body pour un positionnement absolu
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Utiliser la classe CSS de base
            bubble.className = 'info-bubble info-bubble-mobile show';
            
            // Appliquer les styles en fonction du thème
            if (isDarkTheme) {
                bubble.style.background = 'linear-gradient(135deg, #222232 0%, #444464 100%)';
                bubble.style.color = '#f0f0f0';
                bubble.style.border = '2px solid rgba(100, 100, 255, 0.3)';
            } else {
                bubble.style.background = 'linear-gradient(135deg, #8a40b8 0%, #c066ff 100%)';
                bubble.style.color = 'white';
                bubble.style.border = '2px solid rgba(255, 255, 255, 0.5)';
            }
            
            // Ajouter au body
            document.body.appendChild(bubble);
            
            // Ajouter un gestionnaire de clic pour ouvrir le chat
            bubble.addEventListener('click', () => {
                this.isOpen = true;
                localStorage.setItem('chatOpen', 'true');
                const chatContainer = this.container.querySelector('.chat-container');
                if (chatContainer) {
                    chatContainer.classList.add('open');
                }
                this.unreadCount = 0;
                localStorage.setItem('unreadCount', '0');
                this.updateUnreadBadgeAndBubble();
                this.scrollToBottom();
                this.playSound('click');
                bubble.remove();
            });
        } else {
            // Comportement normal sur desktop
            chatToggleBtn.appendChild(bubble);
        }
    }
}

	escapeHtml(unsafe) {
		return unsafe
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	}

	handleTouchScrolling() {
    // N'appliquer que sur les appareils mobiles
    if (!this.isMobileDevice()) return;
    
    const chatMessages = this.container.querySelector('.chat-messages');
    if (chatMessages) {
        // Utiliser une approche différente qui permet le défilement normal du chat
        chatMessages.addEventListener('touchmove', (e) => {
            // Ne pas stopper la propagation - permettre le défilement normal
            e.stopPropagation(); // Ceci empêche l'événement de remonter à la page principale
        }, { passive: true });
        
        // Empêcher le rebond aux extrémités qui cause souvent le défilement de la page
        chatMessages.addEventListener('scroll', () => {
            const scrollTop = chatMessages.scrollTop;
            const scrollHeight = chatMessages.scrollHeight;
            const clientHeight = chatMessages.clientHeight;
            
            // Ajuster légèrement les valeurs pour éviter les problèmes de "bounce"
            if (scrollTop <= 1) {
                chatMessages.scrollTop = 1;
            } else if (scrollTop + clientHeight >= scrollHeight - 1) {
                chatMessages.scrollTop = scrollHeight - clientHeight - 1;
            }
        }, { passive: true });
    }
}
	scrollToBottom() {
    const messagesContainer = this.container.querySelector('.chat-messages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}
	
	isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.innerWidth <= 768);
}

	ensureChatInputVisible() {
    if (/Mobi|Android/i.test(navigator.userAgent)) {
        // Obtenir les éléments nécessaires
        const chatContainer = this.container.querySelector('.chat-container');
        const chatInput = this.container.querySelector('.chat-input');
        const messagesContainer = this.container.querySelector('.chat-messages');
        
        if (chatInput && chatContainer) {
            console.log("Tentative de rendre la zone de saisie visible");
            
            // 1. D'abord, assurer que le conteneur du chat est à sa hauteur maximale
            chatContainer.style.height = '80vh';
            
            // 2. Repositionner les messages pour qu'ils laissent de la place pour l'input
            if (messagesContainer) {
                messagesContainer.style.maxHeight = 'calc(100% - 80px)';
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
            
            // 3. Forcer le conteneur à se redessiner (redraw)
            chatContainer.style.opacity = '0.99';
            setTimeout(() => {
                chatContainer.style.opacity = '1';
                
                // 4. Forcer le scroll tout en bas
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                
                // 5. Technique spéciale pour les PWA sur Android
                if (window.matchMedia('(display-mode: standalone)').matches) {
                    // Fixer la position de la zone d'entrée
                    chatInput.style.position = 'sticky';
                    chatInput.style.bottom = '0';
                    chatInput.style.zIndex = '1000';
                    
                    // Scroll doux vers la zone d'entrée
                    chatInput.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
                
                console.log("Ajustement de visibilité effectué");
            }, 50);
        }
    }
}

handleKeyboardVisibility() {
    if (!/Mobi|Android|iPad|tablet/i.test(navigator.userAgent)) return;
    
    const chatContainer = this.container.querySelector('.chat-container');
    const chatInput = this.container.querySelector('.chat-input');
    const textarea = chatInput?.querySelector('textarea');
    const messagesContainer = this.container.querySelector('.chat-messages');
    
    if (!chatContainer || !chatInput || !textarea) return;
    
    // Détecter si c'est une tablette
    const isTablet = this.isTablet();
    // Dans votre méthode de détection d'appareil, ajoutez cette fonction

    // Détecter l'ouverture du clavier virtuel
    textarea.addEventListener('focus', () => {
        console.log("Clavier virtuel ouvert");
        
        if (isTablet) {
            // Sur tablette, réduire davantage la hauteur pour laisser plus de place au clavier
            chatContainer.style.height = '40vh';
            chatContainer.style.maxHeight = '40vh';
            
            // Réduire la hauteur des messages pour laisser plus de place à l'input
            if (messagesContainer) {
                messagesContainer.style.maxHeight = 'calc(40vh - 90px)';
            }
            
            // Déplacer le chat plus haut
            chatContainer.style.bottom = '50vh';
        } else {
            // Sur smartphone, ajustements standards
            chatContainer.style.height = '50vh';
            chatContainer.style.maxHeight = '50vh';
        }
        
        // S'assurer que la zone de saisie reste visible
        setTimeout(() => {
            textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    });
    
    // Détecter la fermeture du clavier virtuel
    textarea.addEventListener('blur', () => {
        console.log("Clavier virtuel fermé");
        
        // Restaurer la hauteur normale
        setTimeout(() => {
            if (isTablet) {
                chatContainer.style.height = '65vh';
                chatContainer.style.maxHeight = '65vh';
                chatContainer.style.bottom = '20vh';
                
                if (messagesContainer) {
                    messagesContainer.style.maxHeight = 'calc(65vh - 90px)';
                }
            } else {
                chatContainer.style.height = '65vh';
                chatContainer.style.maxHeight = '65vh';
            }
            
            // S'assurer que la zone de saisie est visible
            chatInput.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 300);
    });
}

// 3. Et celle-ci en troisième
addInputAccessButton() {
    // Ne l'ajouter que sur mobile
    if (!/Mobi|Android/i.test(navigator.userAgent)) return;
    
    // Vérifier si on est dans une PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                 window.navigator.standalone;
    
    if (!isPWA) return;
    
    // Supprimer le bouton existant s'il y en a un
    const existingButton = document.getElementById('chat-input-access');
    if (existingButton) existingButton.remove();
    
    // Créer le bouton d'accès
    const accessButton = document.createElement('button');
    accessButton.id = 'chat-input-access';
    accessButton.textContent = '⬆️ Zone de saisie';
    accessButton.style.cssText = `
        position: fixed;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--chat-success, #4CAF50);
        color: white;
        border: none;
        border-radius: 20px;
        padding: 8px 15px;
        z-index: 2000;
        font-weight: bold;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: none;
    `;
    
    document.body.appendChild(accessButton);
    
    // Afficher le bouton après l'envoi d'un message
    accessButton.addEventListener('click', () => {
        const chatInput = this.container.querySelector('.chat-input');
        if (chatInput) {
            // Fermer le clavier s'il est ouvert
            document.activeElement?.blur();
            
            // Attendre que le clavier se ferme
            setTimeout(() => {
                // Ajuster la position du chat container
                const chatContainer = this.container.querySelector('.chat-container');
                if (chatContainer) {
                    chatContainer.style.height = '65vh';
                    chatContainer.style.bottom = '15vh';
                }
                
                // Faire défiler jusqu'à la zone de saisie
                chatInput.scrollIntoView({ behavior: 'smooth', block: 'end' });
                
                // Cacher le bouton après utilisation
                accessButton.style.display = 'none';
            }, 300);
        }
    });
    
    // Montrer le bouton après l'envoi d'un message
    return accessButton;
}

showAdminPanel() {
    if (!this.isAdmin) return;

    const existingPanel = document.querySelector('.admin-panel');
    if (existingPanel) {
        existingPanel.remove();
        this.adminPanelOpen = false;
        return;
    }

    // Détecter si on est sur mobile
    const isMobile = window.innerWidth <= 768;
    
    this.adminPanelOpen = true;
    
    const panel = document.createElement('div');
    panel.className = 'admin-panel';
    panel.style.cssText = isMobile ? 
        'position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10000; background: rgba(0,0,0,0.95); overflow-y: auto;' : 
        'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90%; max-width: 600px; max-height: 80vh; background: var(--chat-gradient); border-radius: 16px; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25); color: white; z-index: 1010; display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.2);';
    
    panel.innerHTML = `
    <div class="panel-header" style="${isMobile ? 'position: sticky; top: 0; background: #1a1a1a; z-index: 1001; padding: 15px; display: flex; justify-content: space-between; align-items: center;' : ''}">
        <h3>Panel Admin</h3>
        <button class="close-panel" style="${isMobile ? 'width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: none; color: white;' : ''}">
            <span class="material-icons">close</span>
        </button>
    </div>
    <div class="panel-tabs" style="${isMobile ? 'overflow-x: auto; white-space: nowrap; padding: 10px; background: #2a2a2a;' : ''}">
        <button class="tab-btn active" data-tab="banned-words" style="${isMobile ? 'min-width: auto; padding: 10px 15px; margin-right: 5px; border-radius: 20px; background: #4CAF50; color: white;' : ''}">Mots bannis</button>
        <button class="tab-btn" data-tab="banned-ips" style="${isMobile ? 'min-width: auto; padding: 10px 15px; margin-right: 5px; border-radius: 20px;' : ''}">IPs bannies</button>
        <button class="tab-btn" data-tab="notifications" style="${isMobile ? 'min-width: auto; padding: 10px 15px; margin-right: 5px; border-radius: 20px;' : ''}">Notif.</button>
        <button class="tab-btn" data-tab="admin-tools" style="${isMobile ? 'min-width: auto; padding: 10px 15px; margin-right: 5px; border-radius: 20px;' : ''}">Outils</button>
        <button class="tab-btn" data-tab="gallery" style="${isMobile ? 'min-width: auto; padding: 10px 15px; margin-right: 5px; border-radius: 20px;' : ''}">Photos</button>
		<button class="tab-btn" data-tab="comments" style="${isMobile ? 'min-width: auto; padding: 10px 15px; margin-right: 5px; border-radius: 20px;' : ''}">Commentaires</button>
		<button class="tab-btn" data-tab="news-admin" style="${isMobile ? 'min-width: auto; padding: 10px 15px; margin-right: 5px; border-radius: 20px;' : ''}">NEWS Admin</button>
		<button class="tab-btn" data-tab="visitor-stats" style="${isMobile ? 'min-width: auto; padding: 10px 15px; margin-right: 5px; border-radius: 20px;' : ''}">📊 Visiteurs</button>
    </div>
    <div class="panel-content" style="${isMobile ? 'padding: 15px; height: calc(100% - 130px); overflow-y: auto; -webkit-overflow-scrolling: touch;' : ''}">
        <!-- Onglet Mots bannis -->
        <div class="tab-section active" id="banned-words-section">
            <h4>Mots bannis</h4>
            <div class="add-word">
                <input type="text" placeholder="Nouveau mot à bannir">
                <button class="add-word-btn">Ajouter</button>
            </div>
            <div class="banned-words-list" style="${isMobile ? 'max-height: 300px; min-height: 200px;' : ''}"></div>
        </div>

        <!-- Onglet IPs bannies -->
        <div class="tab-section" id="banned-ips-section">
            <h4>IPs bannies</h4>
            <div class="banned-ips-list" style="${isMobile ? 'max-height: 300px; min-height: 200px;' : ''}">
                <div class="loading-ips">Chargement des IPs bannies...</div>
            </div>
        </div>

        <!-- Onglet Notifications -->
        <div class="tab-section" id="notifications-section">
            <h4>🚨 Envoyer une notification</h4>
            <form id="notificationForm">
                <label>Titre :</label><br>
                <input type="text" id="notif-title" required style="${isMobile ? 'width: 100%; padding: 10px; margin-bottom: 10px;' : ''}"><br><br>
                <label>Message :</label><br>
                <textarea id="notif-body" required style="${isMobile ? 'width: 100%; padding: 10px; margin-bottom: 10px; min-height: 80px;' : ''}"></textarea><br><br>
                <label>URL (facultatif) :</label><br>
                <input type="text" id="notif-url" placeholder="/actualites" style="${isMobile ? 'width: 100%; padding: 10px; margin-bottom: 10px;' : ''}"><br><br>
                <label>
                    <input type="checkbox" id="notif-urgent">
                    Notification urgente
                </label><br><br>
                <button type="submit" style="${isMobile ? 'width: 100%; padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 5px;' : ''}">📤 Envoyer</button>
            </form>
            <p id="result" style="margin-top:10px;"></p>
        </div>

        <!-- Onglet Outils admin -->
        <div class="tab-section" id="admin-tools-section">
            <h4>🛡️ Outils d'administration</h4>
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <button id="admin-protection-btn" style="background: #4CAF50; color: white; border: none; padding: 12px 15px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 5px; width: 100%;">
                        <span class="material-icons">security</span>
                        ${isMobile ? 'Débannir Admin' : 'Protection Admin (débannir vous-même)'}
                    </button>
                    <p style="font-size: 0.9em; margin-top: 5px; color: rgba(255,255,255,0.7);">
                        Utilisez ce bouton si vous vous êtes accidentellement banni vous-même.
                    </p>
                </div>
                <div>
                    <button id="clear-expired-bans-btn" style="background: #FFA726; color: white; border: none; padding: 12px 15px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 5px; width: 100%;">
                        <span class="material-icons">cleaning_services</span>
                        ${isMobile ? 'Nettoyer bans expirés' : 'Nettoyer les bannissements expirés'}
                    </button>
                    <p style="font-size: 0.9em; margin-top: 5px; color: rgba(255,255,255,0.7);">
                        Supprime tous les bannissements expirés de la base de données.
                    </p>
                </div>
                ${isMobile ? `
                <div style="margin-top: 30px; padding: 15px; border-top: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); border-radius: 8px;">
                    <button id="force-reload-btn" style="background: #2196F3; color: white; border: none; padding: 12px 15px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 5px; width: 100%;">
                        <span class="material-icons">refresh</span>
                        Actualiser la page
                    </button>
                    <p style="font-size: 0.9em; margin-top: 5px; color: rgba(255,255,255,0.7);">
                        Utilisez ce bouton pour recharger la page si les changements ne s'appliquent pas.
                    </p>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- Nouvel onglet pour la gestion de la galerie -->
        <div class="tab-section" id="gallery-section">
            <h4>Gestion des photos</h4>
            <div class="gallery-admin-controls">
                <div class="photos-list" style="${isMobile ? 'max-height: 300px; min-height: 200px; overflow-y: auto;' : ''}">
                    <div class="loading-photos">Chargement des photos...</div>
                </div>
            </div>
        </div>
<!-- Onglet Commentaires (Photos + NEWS) -->
<div class="tab-section" id="comments-section">
    <h4>Gestion des commentaires</h4>
    
    <!-- Sélecteur de type de commentaires -->
    <div style="margin-bottom: 15px;">
        <button class="comment-type-btn active" data-type="photos" style="background: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 20px; margin-right: 10px; cursor: pointer;">Photos</button>
        <button class="comment-type-btn" data-type="news" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 8px 15px; border-radius: 20px; cursor: pointer;">Actualités</button>
    </div>
    
    <!-- Zone d'affichage des commentaires -->
    <div class="comments-display">
        <div class="photo-comments-list" style="${isMobile ? 'max-height: 300px; min-height: 200px; overflow-y: auto;' : ''}">
            <div class="loading-comments">Chargement des commentaires photos...</div>
        </div>
        <div class="news-comments-list" style="display: none; ${isMobile ? 'max-height: 300px; min-height: 200px; overflow-y: auto;' : ''}">
            <div class="loading-comments">Chargement des commentaires actualités...</div>
        </div>
    </div>
</div>

<!-- Onglet NEWS Admin -->
<div class="tab-section" id="news-admin-section">
    <h4>📰 Administration NEWS</h4>
    
    <!-- Statistiques rapides -->
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
    <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; text-align: center;">
        <div style="font-size: 20px; font-weight: bold; color: #4CAF50;" id="publishedCount">0</div>
        <div style="font-size: 12px; color: #aaa;">Publiées</div>
    </div>
    <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; text-align: center;">
        <div style="font-size: 20px; font-weight: bold; color: #FFC107;" id="draftCount">0</div>
        <div style="font-size: 12px; color: #aaa;">Brouillons</div>
    </div>
    <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; text-align: center; position: relative;">
        <div style="font-size: 20px; font-weight: bold; color: #FF5722;" id="pendingCommentsCount">0</div>
        <div style="font-size: 12px; color: #aaa;">Commentaires</div>
        <!-- Badge de notification -->
        <div id="commentsBadgeNews" style="position: absolute; top: -5px; right: -5px; background: #FF5722; color: white; border-radius: 50%; width: 20px; height: 20px; font-size: 10px; font-weight: bold; display: none; align-items: center; justify-content: center;">!</div>
    </div>
</div>
    
    <!-- Actions rapides -->
    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
        <button id="openNewsAdmin" style="background: #2196F3; color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; flex: 1; min-width: 140px;">
    📝 Gérer actualités
</button>
<button id="openCommentsAdmin" style="background: #FF9800; color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; flex: 1; min-width: 140px; position: relative;">
    💬 Modérer commentaires
    <!-- Badge sur le bouton -->
    <span id="commentsButtonBadge" style="position: absolute; top: -5px; right: -5px; background: #FF5722; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; font-weight: bold; display: none; align-items: center; justify-content: center;"></span>
</button>
    </div>
    
    <!-- Liste des dernières actualités -->
    <h5 style="margin: 20px 0 10px 0;">Dernières actualités</h5>
    <div class="recent-news-list" style="${isMobile ? 'max-height: 650px; overflow-y: auto;' : ''}">
        <div class="loading-news">Chargement des actualités...</div>
    </div>
</div>

<!-- 🔧 SECTION VISITEURS CORRIGÉE POUR MOBILE -->
<div class="tab-section" id="visitor-stats-section">
    <h4 style="color: #ffffff; font-weight: bold; margin-bottom: 15px;">📊 Statistiques visiteurs</h4>
    
    <!-- Container avec fond plus visible sur mobile -->
    <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 12px; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.2);">
        <p style="margin-bottom: 20px; color: #ffffff; font-weight: 500; text-align: center;">
            Accédez aux statistiques détaillées via le compteur de visiteurs.
        </p>
        
        <div style="text-align: center; margin: 20px 0;">
            <button onclick="document.querySelector('#visitorsCounter').click()" style="
                background: linear-gradient(135deg, #4CAF50, #45a049); 
                color: white; 
                border: none; 
                padding: 15px 25px; 
                border-radius: 10px; 
                cursor: pointer; 
                font-weight: bold;
                font-size: 16px;
                box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
                border: 2px solid rgba(255,255,255,0.2);
                width: 100%;
                max-width: 280px;
            ">
                📊 Voir les statistiques détaillées
            </button>
        </div>
        
        <div style="
            font-size: 13px; 
            color: #ffffff; 
            text-align: center; 
            margin-top: 15px;
            background: rgba(255,193,7,0.2);
            padding: 8px 12px;
            border-radius: 8px;
            border-left: 3px solid #FFC107;
        ">
            💡 Seuls les administrateurs peuvent voir les graphiques détaillés
        </div>
    </div>
</div>
`;

	
	document.body.appendChild(panel);

// Ajouter une classe au body pour désactiver le scroll
if (isMobile) {
    document.body.classList.add('admin-panel-open');
}
    
    // Ajouter une classe au body pour désactiver le scroll
    if (isMobile) {
        document.body.classList.add('admin-panel-open');
    }
    
    this.loadBannedWords();
    this.loadBannedIPs();

	// Charger les stats NEWS par défaut
this.loadNewsStats();
this.loadRecentNews();

// 🆕 AJOUTEZ ICI : Initialiser l'affichage par défaut des commentaires
const photosList = panel.querySelector('.photo-comments-list');
const newsList = panel.querySelector('.news-comments-list');

if (photosList && newsList) {
    // Par défaut, afficher les commentaires photos et cacher les actualités
    photosList.style.display = 'block';
    newsList.style.display = 'none';
    
    // S'assurer que le bouton "Photos" est actif par défaut
    const photosBtn = panel.querySelector('[data-type="photos"]');
    const newsBtn = panel.querySelector('[data-type="news"]'); // ou 'actualites'
    
    if (photosBtn && newsBtn) {
        photosBtn.style.background = '#4CAF50';
        newsBtn.style.background = 'rgba(255,255,255,0.2)';
    }
}

// Gestion des onglets
const tabBtns = panel.querySelectorAll('.tab-btn');
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
    tabBtns.forEach(b => {
        b.classList.remove('active');
        // Supprimer également le style vert en ligne
        if (isMobile) {
            b.style.background = '';
            b.style.color = '';
        }
    });
    panel.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    // Ajouter le style vert en ligne pour mobile
    if (isMobile) {
        btn.style.background = '#4CAF50';
        btn.style.color = 'white';
    }
    const tabId = btn.dataset.tab + '-section';
    panel.querySelector(`#${tabId}`).classList.add('active');
    
    // Charger les photos si l'onglet Galerie est sélectionné
    if (btn.dataset.tab === 'gallery') {
        this.loadGalleryPhotos();
    }
    
    // Charger les commentaires si l'onglet Commentaires est sélectionné
    if (btn.dataset.tab === 'comments') {
        this.loadPhotoComments();
    }
	
	 // Charger les actualités si l'onglet NEWS Admin est sélectionné
if (btn.dataset.tab === 'news-admin') {
    this.loadNewsStats();
    this.loadRecentNews();
}

// Gestion de l'onglet visiteurs (pas de chargement spécial nécessaire)
if (btn.dataset.tab === 'visitor-stats') {
    console.log('Onglet visiteurs sélectionné');
}
    
	});
	});

	// Gestion du sélecteur de type de commentaires
	panel.querySelectorAll('.comment-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Mettre à jour les boutons
        panel.querySelectorAll('.comment-type-btn').forEach(b => {
            b.style.background = 'rgba(255,255,255,0.2)';
        });
        btn.style.background = '#4CAF50';
        
        // Afficher le bon type de commentaires
        const type = btn.dataset.type;
        const photosList = panel.querySelector('.photo-comments-list');
        const newsList = panel.querySelector('.news-comments-list');
        
        if (type === 'photos') {
            photosList.style.display = 'block';
            newsList.style.display = 'none';
            this.loadPhotoComments();
        } else {
            photosList.style.display = 'none';
            newsList.style.display = 'block';
            this.loadNewsComments();
        }
    });
});

const newsAdminBtn = panel.querySelector('#openNewsAdmin');
const commentsAdminBtn = panel.querySelector('#openCommentsAdmin');

// Configuration des gestionnaires NEWS avec authentification

// Fonction helper pour préparer l'authentification
const prepareNewsAdminAuth = () => {
    // Vérifier que l'utilisateur est bien admin
    if (this.pseudo === 'Admin_ActuMedia' && this.isAdmin) {
        // Définir tous les tokens nécessaires
        sessionStorage.setItem('newsAdminAuth', 'authenticated');
        sessionStorage.setItem('newsAdminUser', this.pseudo);
        sessionStorage.setItem('newsAdminTimestamp', Date.now().toString());
        return true;
    }
    return false;
};

if (newsAdminBtn) {
    const newNewsBtn = newsAdminBtn.cloneNode(true);
    newsAdminBtn.parentNode.replaceChild(newNewsBtn, newsAdminBtn);
    
    newNewsBtn.addEventListener('click', (e) => {
        console.log('OUVERTURE ADMIN-NEWS.HTML');
        e.preventDefault();
        e.stopPropagation();
        
        if (prepareNewsAdminAuth()) {
            window.open('admin-news.html', '_blank');
        } else {
            this.showNotification('Accès refusé - Admin requis', 'error');
        }
    });
}

if (commentsAdminBtn) {
    const newCommentsBtn = commentsAdminBtn.cloneNode(true);
    commentsAdminBtn.parentNode.replaceChild(newCommentsBtn, commentsAdminBtn);
    
    newCommentsBtn.addEventListener('click', (e) => {
        console.log('OUVERTURE ADMIN-COMMENTS.HTML');
        e.preventDefault();
        e.stopPropagation();
        
        if (prepareNewsAdminAuth()) {
            // Essayer d'ouvrir dans un nouvel onglet
            const newWindow = window.open('admin-comments.html', '_blank');
            
            // Si bloqué, rediriger dans l'onglet actuel
            if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                console.log('Popup bloqué, redirection dans l\'onglet actuel');
                window.location.href = 'admin-comments.html';
            }
        } else {
            this.showNotification('Accès refusé - Admin requis', 'error');
        }
    });
}

    // Bouton ajout de mot banni
    const addWordBtn = panel.querySelector('.add-word-btn');
    const wordInput = panel.querySelector('.add-word input');

    addWordBtn.addEventListener('click', async () => {
        const word = wordInput.value.trim().toLowerCase();
        if (word) {
            await this.addBannedWord(word);
            wordInput.value = '';
            await this.loadBannedWords();
        }
    });

    // Formulaire notification dans showAdminPanel() après
panel.querySelector('#notificationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = panel.querySelector('#notif-title').value;
    const body = panel.querySelector('#notif-body').value;
    const url = panel.querySelector('#notif-url').value || '/';
    const urgent = panel.querySelector('#notif-urgent').checked;
    const result = panel.querySelector('#result');
    
    if (!title || !body) {
        result.textContent = "⛔ Titre et message requis";
        result.style.color = "red";
        return;
    }
    
    result.textContent = "⏳ Envoi en cours...";
    result.style.color = "white";
    
    try {
        const response = await this.sendImportantNotification(title, body, url, urgent);
        
        result.textContent = `✅ Notification envoyée à ${response.sent} appareil(s)`;
        result.style.color = "#4CAF50";
        
        // Réinitialiser le formulaire
        panel.querySelector('#notif-title').value = '';
        panel.querySelector('#notif-body').value = '';
        panel.querySelector('#notif-url').value = '';
        panel.querySelector('#notif-urgent').checked = false;
        
        // Vibrer pour confirmation sur mobile
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
        
        this.playSound('success');
    } catch (err) {
        result.textContent = "❌ Erreur : " + err.message;
        result.style.color = "red";
        this.playSound('error');
    }
});

    // Bouton de protection admin
    panel.querySelector('#admin-protection-btn')?.addEventListener('click', async () => {
        if (confirm("Êtes-vous sûr de vouloir supprimer tous vos bannissements ? Cette action vous permettra de continuer à utiliser le chat si vous vous êtes accidentellement banni.")) {
            await this.cleanBanDatabase();
            if (isMobile) {
                // Fermer le panel sur mobile après l'action
                panel.remove();
                document.body.classList.remove('admin-panel-open');
                this.adminPanelOpen = false;
            }
        }
    });

    // Bouton pour nettoyer les bannissements expirés
    panel.querySelector('#clear-expired-bans-btn')?.addEventListener('click', async () => {
        if (confirm("Êtes-vous sûr de vouloir nettoyer tous les bannissements expirés ?")) {
            await this.checkAndClearExpiredBans(true);
            this.showNotification("Nettoyage des bannissements expirés terminé", "success");
            await this.loadBannedIPs();
        }
    });

    // Bouton d'actualisation (mobile uniquement)
    if (isMobile) {
        panel.querySelector('#force-reload-btn')?.addEventListener('click', () => {
            window.location.reload();
        });
    }

    // Fermer le panneau
    panel.querySelector('.close-panel')?.addEventListener('click', () => {
        panel.remove();
        document.body.classList.remove('admin-panel-open');
        this.adminPanelOpen = false;
    });
    
    // Sur mobile, faire défiler jusqu'à l'onglet Outils Admin automatiquement après un court délai
    if (isMobile) {
        setTimeout(() => {
            const adminToolsBtn = panel.querySelector('.tab-btn[data-tab="admin-tools"]');
            if (adminToolsBtn) {
                adminToolsBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }, 300);
    }
}

async sendImportantNotification(title, body, url, urgent) {
    try {
        // Vérifier que l'utilisateur est admin
        if (!this.isAdmin) {
            throw new Error("Seuls les administrateurs peuvent envoyer des notifications importantes");
        }
        
        const adminPassword = document.querySelector('#admin-password')?.value || 'admin2024';
        
        const response = await fetch("/api/send-important-notification", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": adminPassword
            },
            body: JSON.stringify({ title, body, url, urgent })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || "Erreur inconnue");
        }
        
        return result;
    } catch (error) {
        console.error('Erreur envoi notification importante:', error);
        throw error;
    }
}

    async addBannedWord(word) {
        const { error } = await this.supabase
            .from('banned_words')
            .insert({ word: word });

        if (!error) {
            this.bannedWords.add(word);
            this.showNotification('Mot ajouté avec succès', 'success');
        }
    }

    async removeBannedWord(word) {
        const { error } = await this.supabase
            .from('banned_words')
            .delete()
            .eq('word', word);

        if (!error) {
            this.bannedWords.delete(word);
            this.showNotification('Mot supprimé avec succès', 'success');
            await this.loadBannedWords();
        }
    }

    showMessageOptions(message, x, y) {
    console.log('showMessageOptions appelé:', message);
    
    // Supprimer tout menu existant
    document.querySelectorAll('.message-options').forEach(el => el.remove());

    const options = document.createElement('div');
    options.className = 'message-options';
    
    // Détection du mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        options.classList.add('mobile-options');
    }
    
    options.innerHTML = `
        <div class="options-content">
            <button class="delete-option">
                <span class="material-icons">delete</span> Supprimer
            </button>
            ${this.isAdmin ? `
                <button class="ban-option">
                    <span class="material-icons">block</span> Bannir IP
                </button>
            ` : ''}
        </div>
    `;

    document.body.appendChild(options);

    const chatContainer = this.container.querySelector('.chat-container');
    const chatBounds = chatContainer.getBoundingClientRect();
    const optionsRect = options.getBoundingClientRect();

    // Ajustement de la position
    let posX = x;
    let posY = y;
    
    // Positionnement amélioré sur mobile
    if (isMobile) {
        // Centrer horizontalement
        posX = chatBounds.left + (chatBounds.width / 2) - (optionsRect.width / 2);
        
        // Positionner plus haut dans la zone visible
        posY = chatBounds.top + (chatBounds.height * 0.3);
    } else {
        // Ajustements pour écran de bureau
        if (posX + optionsRect.width > chatBounds.right) {
            posX = chatBounds.right - optionsRect.width - 10;
        }
        if (posX < chatBounds.left) {
            posX = chatBounds.left + 10;
        }
        if (posY + optionsRect.height > chatBounds.bottom) {
            posY = chatBounds.bottom - optionsRect.height - 10;
        }
        if (posY < chatBounds.top) {
            posY = chatBounds.top + 10;
        }
    }

    options.style.left = `${posX}px`;
    options.style.top = `${posY}px`;

    // Protection contre les événements indésirables
    const preventPropagation = (e) => {
        e.stopPropagation();
    };
    
    // Appliquer à tous les types d'événements
    options.addEventListener('click', preventPropagation);
    options.addEventListener('touchstart', preventPropagation);
    options.addEventListener('touchend', preventPropagation);
    options.addEventListener('touchmove', preventPropagation);

    // Gestionnaire pour supprimer un message
    options.querySelector('.delete-option')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.deleteMessage(message.id);
        options.remove();
    });

    // Gestionnaire pour bannir un utilisateur
    options.querySelector('.ban-option')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showBanDialog(message);
        options.remove();
    });

    // Fermer le menu si on clique ailleurs, avec un délai
    setTimeout(() => {
        const closeHandler = (e) => {
            if (!options.contains(e.target)) {
                options.remove();
                document.removeEventListener('click', closeHandler);
                document.removeEventListener('touchstart', closeHandler);
            }
        };
        
        document.addEventListener('click', closeHandler);
        document.addEventListener('touchstart', closeHandler);
    }, 300); // Délai plus long pour éviter la fermeture accidentelle
}

    async deleteMessage(messageId) {
    try {
        console.log(`Tentative de suppression du message ${messageId}...`);
        
        // 1. Définir l'utilisateur courant pour les vérifications RLS
        const rlsSuccess = await this.setCurrentUserForRLS();
        if (!rlsSuccess) {
            throw new Error("Échec de l'authentification RLS");
        }
        
        // 2. Vérifier d'abord si le message existe et appartient à l'utilisateur
        const { data: messageData, error: messageError } = await this.supabase
            .from('messages')
            .select('*')
            .eq('id', messageId)
            .single();
            
        if (messageError || !messageData) {
            throw new Error("Message introuvable");
        }
        
        // 3. Vérifier les permissions
        const canDelete = messageData.pseudo === this.pseudo || this.isAdmin;
        if (!canDelete) {
            throw new Error("Non autorisé à supprimer ce message");
        }
        
        // ✅ 4. NOUVEAU : Marquer visuellement comme "en cours de suppression"
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.style.opacity = '0.5';
            messageElement.style.pointerEvents = 'none';
        }
        
        // ✅ 5. Supprimer de la base ET attendre confirmation
        const { error: deleteError } = await this.supabase
            .from('messages')
            .delete()
            .eq('id', messageId);
            
        if (deleteError) {
            // Restaurer l'apparence si erreur
            if (messageElement) {
                messageElement.style.opacity = '1';
                messageElement.style.pointerEvents = 'auto';
            }
            throw deleteError;
        }
        
        // ✅ 6. ATTENDRE un court délai pour la synchronisation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // ✅ 7. Vérifier que le message est vraiment supprimé
        const { data: checkData } = await this.supabase
            .from('messages')
            .select('id')
            .eq('id', messageId)
            .single();
            
        if (!checkData) {
            // Message vraiment supprimé, suppression visuelle
            if (messageElement) {
                messageElement.classList.add('fade-out');
                setTimeout(() => messageElement.remove(), 300);
            }
            this.showNotification('Message supprimé', 'success');
            console.log(`Message ${messageId} supprimé avec succès`);
        } else {
            // Message encore présent, restaurer l'apparence
            if (messageElement) {
                messageElement.style.opacity = '1';
                messageElement.style.pointerEvents = 'auto';
            }
            throw new Error("La suppression n'a pas été confirmée");
        }
        
        return true;
        
    } catch (error) {
        console.error('Erreur suppression:', error);
        this.showNotification('Erreur lors de la suppression: ' + error.message, 'error');
        return false;
    }
}

    showBanDialog(message) {
        const dialogHTML = `
            <div class="ban-dialog" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1200;">
                <div class="ban-content" style="background: var(--chat-gradient); padding: 20px; border-radius: 12px; width: 90%; max-width: 400px; color: white;">
                    <h3>Bannir ${message.pseudo}</h3>
                    <p>IP: ${message.ip}</p>
                    <input type="text" class="ban-reason" placeholder="Raison du ban" style="width: 100%; padding: 10px; margin: 10px 0; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white;">
                    <select class="ban-duration" style="width: 100%; padding: 10px; margin: 10px 0; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white;">
                        <option value="">Ban permanent</option>
                        <option value="3600000">1 heure</option>
                        <option value="86400000">24 heures</option>
                        <option value="604800000">1 semaine</option>
                    </select>
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button class="confirm-ban" style="flex: 1; padding: 10px; border-radius: 8px; border: none; cursor: pointer; background: var(--chat-error); color: white;">Bannir</button>
                        <button class="cancel-ban" style="flex: 1; padding: 10px; border-radius: 8px; border: none; cursor: pointer; background: rgba(255,255,255,0.2); color: white;">Annuler</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', dialogHTML);
        
        const dialog = document.querySelector('.ban-dialog');
        dialog.querySelector('.confirm-ban').addEventListener('click', async () => {
            const reason = dialog.querySelector('.ban-reason').value;
            const duration = dialog.querySelector('.ban-duration').value;
            await this.banUser(message.ip, reason, duration ? parseInt(duration) : null);
            dialog.remove();
        });

        dialog.querySelector('.cancel-ban').addEventListener('click', () => {
            dialog.remove();
        });
    }

    async banUser(userIdentifier, reason = '', duration = null) {
    try {
        // Extraire le pseudo
        const pseudo = userIdentifier.includes('-') ? userIdentifier.split('-')[0] : userIdentifier;
        
        // Vérification de sécurité : ne pas bannir l'administrateur
        if (pseudo === this.pseudo && this.isAdmin) {
            console.warn("Tentative de bannissement de soi-même détectée et bloquée");
            this.showNotification("Vous ne pouvez pas vous bannir vous-même", "error");
            return false;
        }
        
        // Convertir la durée
        let expiresAt = null;
        if (duration) {
            expiresAt = new Date(Date.now() + duration).toISOString();
        }
        
        console.log(`Bannissement de l'utilisateur ${pseudo}`);
        
        // 1. Bannir le pseudo dans la table banned_ips
        const { error: pseudoBanError } = await this.supabase
            .from('banned_ips')
            .insert({
                ip: pseudo,
                banned_at: new Date().toISOString(),
                expires_at: expiresAt,
                reason: reason || 'Non spécifié',
                banned_by: this.pseudo
            });
        
        if (pseudoBanError) {
            console.error('Erreur bannissement du pseudo:', pseudoBanError);
            throw pseudoBanError;
        }
        
        console.log('Pseudo banni avec succès:', pseudo);
        
        // 2. Récupérer les messages récents de l'utilisateur pour trouver son IP
        const { data: userMessages, error: messagesError } = await this.supabase
            .from('messages')
            .select('*')
            .eq('pseudo', pseudo)
            .order('created_at', { ascending: false })
            .limit(5);
            
        if (!messagesError && userMessages && userMessages.length > 0) {
            // Chercher une IP réelle dans les messages récents
            let userRealIP = null;
            for (const msg of userMessages) {
                if (msg.real_ip) {
                    userRealIP = msg.real_ip;
                    console.log(`IP réelle trouvée: ${userRealIP}`);
                    break;
                }
            }
            
            // Si une IP réelle a été trouvée, la bannir aussi
            if (userRealIP) {
                // Vérification de sécurité : ne pas bannir l'IP de l'administrateur
                const adminRealIP = await this.getClientRealIP();
                if (userRealIP === adminRealIP && this.isAdmin) {
                    console.warn("Tentative de bannissement de l'IP de l'admin détectée et bloquée");
                    this.showNotification("Protection admin : votre IP n'a pas été bannie", "warning");
                } else {
                    console.log(`Bannissement de l'IP réelle: ${userRealIP}`);
                    
                    // Insérer dans la table banned_real_ips
                    const { error: ipBanError } = await this.supabase
                        .from('banned_real_ips')
                        .insert({
                            ip: userRealIP,
                            banned_at: new Date().toISOString(),
                            expires_at: expiresAt,
                            reason: `IP de ${pseudo} - ${reason || 'Non spécifié'}`,
                            banned_by: this.pseudo
                        });
                        
                    if (ipBanError) {
                        console.error('Erreur bannissement IP réelle:', ipBanError);
                    } else {
                        console.log(`IP réelle ${userRealIP} bannie avec succès`);
                        this.showNotification(`L'IP de ${pseudo} a également été bannie`, 'success');
                    }
                }
            } else {
                console.warn(`Aucune IP réelle trouvée pour ${pseudo}`);
            }
        }
        
        // Actualiser les messages pour cacher les messages de l'utilisateur banni
        await this.loadExistingMessages();
        
        // Supprimer tous les messages de l'utilisateur banni
        console.log(`Suppression des messages de l'utilisateur ${pseudo}`);
        const { error: deleteMessagesError } = await this.supabase
            .from('messages')
            .delete()
            .eq('pseudo', pseudo);
            
        if (deleteMessagesError) {
            console.error('Erreur lors de la suppression des messages:', deleteMessagesError);
        } else {
            console.log(`Messages de l'utilisateur ${pseudo} supprimés avec succès`);
            this.showNotification(`Messages de "${pseudo}" supprimés avec succès`, 'success');
        }
        
        this.showNotification(`Utilisateur "${pseudo}" banni avec succès`, 'success');
        this.playSound('success');
        
        return true;
    } catch (error) {
        console.error('Erreur bannissement:', error);
        this.showNotification('Erreur lors du bannissement', 'error');
        return false;
    }
}

async checkUserBannedStatus() {
    // Vérifier si l'utilisateur est connecté
    if (!this.pseudo) return false;
    
    try {
        // Vérifier le bannissement dans la base de données
        const isBanned = await this.checkBannedIP(this.pseudo);
        
        if (isBanned) {
            console.log(`Bannissement détecté pour ${this.pseudo}, déconnexion forcée...`);
            this.showNotification('Vous avez été banni du chat', 'error');
            
            // Stocker les infos de bannissement localement
            localStorage.setItem('chat_device_banned', 'true');
            localStorage.setItem('chat_device_banned_until', 'permanent');
            localStorage.setItem('chat_ban_reason', 'Utilisateur banni');
            
            // Déconnecter l'utilisateur
            await this.logout();
            
            // Afficher le message de bannissement
            this.showBanNotification('Utilisateur banni');
            
            // Recharger la page après un court délai
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Erreur vérification bannissement:', error);
        return false;
    }
}
// Nouvelle méthode pour obtenir l'IP d'un message
async getMessageIP(message) {
    try {
        // Si nous avons l'IP stockée directement dans le message, l'utiliser
        if (message.real_ip) {
            return message.real_ip;
        }
        
        // Si nous avons une table qui associe les pseudos à des IPs
        const { data: userIPs, error: userIPsError } = await this.supabase
            .from('user_connections')
            .select('ip')
            .eq('pseudo', message.pseudo)
            .order('connected_at', { ascending: false })
            .limit(1);
            
        if (!userIPsError && userIPs && userIPs.length > 0) {
            return userIPs[0].ip;
        }
        
        // Si nous n'avons pas d'autre moyen, utiliser l'IP du message comme dernier recours
        if (message.ip) {
            // L'IP peut être au format "pseudo-timestamp"
            const ipParts = message.ip.split('-');
            if (ipParts.length > 1) {
                return ipParts[0]; // Retourner juste le pseudo comme identifiant
            }
            return message.ip;
        }
        
        return null;
    } catch (error) {
        console.error('Erreur récupération IP message:', error);
        return null;
    }
}

// Afficher le sélecteur d'emoji
showEmojiPicker(messageId /* Supprimer x, y - plus besoin ici */) { // On n'a plus besoin de x, y initiaux
    // Supprimer tout picker existant
    const existingPicker = document.querySelector('.emoji-picker');
    if (existingPicker) existingPicker.remove();

    // *** TROUVER L'ÉLÉMENT PARENT RELATIF ***
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageElement) {
        console.error("Élément message introuvable:", messageId);
        return; // Sortir si le message n'existe pas
    }
    // Idéalement, avoir un conteneur spécifique pour les actions/popups dans le message
    // Ex: const parentElement = messageElement.querySelector('.message-actions-container') || messageElement;
    // Pour l'instant, on utilise messageElement comme parent, assurez-vous qu'il a position: relative;
    const parentElement = messageElement;

    // Créer le nouveau picker
    const picker = document.createElement('div');
    picker.className = 'emoji-picker'; // Le CSS va maintenant gérer la position de base

    // Liste des emojis courants - inchangée
    const commonEmojis = [ /* ... vos emojis ... */
        '👍','❤️','😂','😘','😮','😢','👏',
        '🔥','🎉','🤔','👎','😡','🚀','👀',
        '💋','🙌','🤗','🥳','😇','🙃','🤩',
        '😭','🥺','😱','🤬','🙄','💯','💪'
    ];

    // Ajouter les emojis au picker
    commonEmojis.forEach(emoji => {
        const span = document.createElement('span');
        span.textContent = emoji;
        span.addEventListener('click', (e) => {
            e.stopPropagation(); // Empêcher le clic de fermer immédiatement via le listener document
            this.addReaction(messageId, emoji);
            picker.remove();
            // --- SUPPRIMER LA MODIFICATION DE L'OVERFLOW ---
            // document.body.style.overflow = ''; // N'est plus nécessaire
        });
        picker.appendChild(span);
    });

    // --- SUPPRIMER LA MODIFICATION DE L'OVERFLOW ---
    // document.body.style.overflow = 'hidden'; // NE PLUS FAIRE ÇA

    // *** AJOUTER LE PICKER DANS LE PARENT RELATIF, PAS BODY ***
    parentElement.appendChild(picker);

    // *** AFFICHER LE PICKER VIA CLASSE CSS ***
    // Forcer un reflow pour que la transition CSS fonctionne si vous en utilisez une
    void picker.offsetWidth;
    picker.classList.add('is-active'); // Le CSS gère l'affichage via .is-active


    // --- SUPPRIMER TOUT LE BLOC DE CALCUL DE POSITION x, y ---
    /*
    const pickerRect = picker.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const isMobile = window.innerWidth <= 768;
    let x, y; // Plus besoin de calculer x, y ici

    if (isMobile) {
        // ... ancien code mobile supprimé ...
    } else {
        // ... ancien code desktop supprimé ...
    }
    picker.style.left = `${x}px`; // Plus besoin
    picker.style.top = `${y}px`; // Plus besoin
    */

    // --- OPTIONNEL MAIS RECOMMANDÉ : AJUSTEMENT DES BORDS ---
    // Cette fonction vérifie si le picker (positionné par CSS) dépasse
    // et ajuste sa position si nécessaire.
    function adjustPickerPosition() {
        const pickerRect = picker.getBoundingClientRect();
        const parentRect = parentElement.getBoundingClientRect(); // Ou viewport si nécessaire

        // Ajustement horizontal (simple exemple : si ça dépasse à gauche/droite du PARENT)
        if (pickerRect.left < parentRect.left) {
            picker.style.left = '0px'; // Aligner à gauche du parent
            picker.style.transform = 'translateX(0)'; // Annuler le centrage
        } else if (pickerRect.right > parentRect.right) {
            picker.style.left = 'auto';
            picker.style.right = '5px'; // Aligner à droite du parent
            picker.style.transform = 'translateX(0)'; // Annuler le centrage
        }

        // Ajustement vertical (si ça dépasse en HAUT du viewport)
        if (pickerRect.top < 0) {
            picker.style.bottom = 'auto'; // Annuler positionnement par le bas
            picker.style.top = '100%';    // Positionner le haut du picker sous le parent
            picker.style.marginTop = '8px'; // Ajouter une marge en haut
            picker.style.marginBottom = '0';
            // Ajuster l'origine de la transformation si animée
            picker.style.transformOrigin = 'top center';
        }
    }
    // Appeler l'ajustement après un court délai ou requestAnimationFrame pour s'assurer que le rendu est fait
    requestAnimationFrame(adjustPickerPosition);


    // --- Listener pour fermer le picker ---
    // Utiliser une fonction nommée pour pouvoir la retirer proprement
    const closePickerOnClickOutside = (e) => {
        // Vérifier si le clic est sur le bouton "+" original pour éviter fermeture immédiate si on reclique dessus
        const addButton = parentElement.querySelector('.add-reaction'); // Sélecteur à adapter si besoin
        if (!picker.contains(e.target) && (!addButton || !addButton.contains(e.target))) {
            picker.remove();
            // document.body.style.overflow = ''; // N'est plus nécessaire
            document.removeEventListener('click', closePickerOnClickOutside, true); // Nettoyer le listener
        }
    };
    // Ajouter le listener en phase de capture pour intercepter le clic plus tôt si besoin
    document.addEventListener('click', closePickerOnClickOutside, true);


    // --- Gérer le popstate ---
    const closePickerOnPopstate = () => {
        if (document.body.contains(picker)) {
            picker.remove();
            // document.body.style.overflow = ''; // N'est plus nécessaire
            window.removeEventListener('popstate', closePickerOnPopstate); // Nettoyer
        }
    };
    // On ajoute une seule fois, pas besoin de { once: true } si on le nettoie
    window.addEventListener('popstate', closePickerOnPopstate);

    // Empêcher le scroll sur mobile SI le picker lui-même a un scroll interne
    // (Pas nécessaire si le picker est petit et fixe)
    /*
    picker.addEventListener('touchmove', (e) => {
        // Permettre le scroll SI l'élément scrollable DANS le picker est la cible
        if (picker.scrollHeight > picker.clientHeight && e.target.closest('.emoji-list-container')) {
             // Ne rien faire, laisser le scroll interne fonctionner
        } else {
            e.preventDefault(); // Empêcher le scroll de la page
        }
    }, { passive: false });
    */
}

// Ajouter une réaction à un message
async addReaction(messageId, emoji) {
  try {
    // Vérifier si l'utilisateur a déjà réagi avec cet emoji
    const { data: existingReactions, error: checkError } = await this.supabase
      .from('message_reactions')
      .select('*')
      .eq('message_id', messageId)
      .eq('user_pseudo', this.pseudo)
      .eq('emoji', emoji);
      
    if (checkError) throw checkError;
    
    if (existingReactions && existingReactions.length > 0) {
      // L'utilisateur a déjà réagi avec cet emoji, supprimer la réaction
      const { error: deleteError } = await this.supabase
        .from('message_reactions')
        .delete()
        .eq('id', existingReactions[0].id);
        
      if (deleteError) throw deleteError;
    } else {
      // Ajouter la nouvelle réaction
      const { error: insertError } = await this.supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_pseudo: this.pseudo,
          emoji: emoji,
          created_at: new Date().toISOString()
        });
        
      if (insertError) throw insertError;
    }
    
    // Rafraîchir l'affichage des réactions
    this.loadMessageReactions(messageId);
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'une réaction:', error);
    this.showNotification('Erreur lors de l\'ajout de la réaction', 'error');
  }
}

// Charger les réactions d'un message
async loadMessageReactions(messageId) {
  try {
    const { data: reactions, error } = await this.supabase
      .from('message_reactions')
      .select('*')
      .eq('message_id', messageId);
      
    if (error) throw error;
    
    // Regrouper les réactions par emoji
    const groupedReactions = {};
    reactions.forEach(reaction => {
      if (!groupedReactions[reaction.emoji]) {
        groupedReactions[reaction.emoji] = [];
      }
      groupedReactions[reaction.emoji].push(reaction);
    });
    
    // Afficher les réactions
    const reactionsContainer = document.querySelector(`.message-reactions[data-message-id="${messageId}"]`);
    if (reactionsContainer) {
      reactionsContainer.innerHTML = '';
      
      Object.entries(groupedReactions).forEach(([emoji, users]) => {
        const hasUserReacted = users.some(r => r.user_pseudo === this.pseudo);
        
        const reactionElement = document.createElement('div');
        reactionElement.className = `reaction ${hasUserReacted ? 'user-reacted' : ''}`;
        reactionElement.innerHTML = `
          <span class="reaction-emoji">${emoji}</span>
          <span class="reaction-count">${users.length}</span>
        `;
        
        // Ajouter l'événement pour basculer la réaction
        reactionElement.addEventListener('click', () => {
          this.addReaction(messageId, emoji);
        });
        
        reactionsContainer.appendChild(reactionElement);
      });
    }
  } catch (error) {
    console.error('Erreur lors du chargement des réactions:', error);
  }
}

    async checkNotificationStatus() {
    console.log('État des notifications:', {
        permission: Notification.permission,
        serviceWorkerRegistered: !!await navigator.serviceWorker.getRegistration(),
        pushManagerSupported: 'PushManager' in window,
        notificationsEnabled: this.notificationsEnabled,
        pushManagerSubscribed: !!(await (await navigator.serviceWorker.ready).pushManager.getSubscription())
    });
}

// Ajouter cette nouvelle méthode pour gérer le clavier
handleKeyboardAppearance() {
    const visualViewport = window.visualViewport;
    
    if (visualViewport) {
        visualViewport.addEventListener('resize', () => {
            const chatInput = document.querySelector('.chat-input-container');
            if (chatInput) {
                if (visualViewport.height < window.innerHeight * 0.8) {
                    // Clavier ouvert
                    chatInput.style.position = 'absolute';
                    chatInput.style.bottom = '0';
                    // Faire défiler jusqu'à l'input
                    chatInput.scrollIntoView(false);
                } else {
                    // Clavier fermé
                    chatInput.style.position = 'fixed';
                    chatInput.style.bottom = '0';
                }
            }
        });
    }
}

// Méthode pour charger les photos dans le panel admin
async loadGalleryPhotos() {
    try {
        console.log("Chargement des photos depuis le panel admin du chat...");
        
        // Obtenez l'élément où afficher les photos
        const photosList = document.querySelector('.photos-list');
        if (!photosList) {
            console.error("Conteneur photos-list non trouvé");
            return;
        }
        
        photosList.innerHTML = '<div class="loading-photos">Chargement des photos...</div>';
        
        // Utiliser l'instance Supabase du chat
        const { data: photos, error } = await this.supabase
            .from('photos')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error("Erreur lors du chargement des photos:", error);
            photosList.innerHTML = `<div class="error">Erreur lors du chargement des photos: ${error.message}</div>`;
            return;
        }
        
        if (!photos || photos.length === 0) {
            photosList.innerHTML = '<div class="no-data">Aucune photo trouvée</div>';
            return;
        }
        
        // Créer la liste des photos avec leurs contrôles
        photosList.innerHTML = '';
        
        // Style de la grille adaptée à l'administration
        const gridContainer = document.createElement('div');
gridContainer.className = 'admin-photos-grid';
gridContainer.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
    margin-top: 20px;
    padding: 10px;
`;

photos.forEach(photo => {
    const photoCard = document.createElement('div');
    photoCard.className = 'admin-photo-card';
    photoCard.dataset.id = photo.id;
    photoCard.style.cssText = `
        position: relative;
        background: rgba(30, 30, 30, 0.8);
        border-radius: 10px;
        overflow: hidden;
        transition: all 0.3s;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    `;
    
    // Ajouter un effet hover
    photoCard.addEventListener('mouseenter', () => {
        photoCard.style.transform = 'translateY(-5px)';
        photoCard.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.4)';
    });
    
    photoCard.addEventListener('mouseleave', () => {
        photoCard.style.transform = 'translateY(0)';
        photoCard.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    });
    
    photoCard.innerHTML = `
        <div style="width: 100%; height: 150px; overflow: hidden;">
            <img src="${photo.image_url || ''}" alt="${photo.title || 'Photo sans titre'}" 
                 style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s;"
                 onerror="this.src='/images/no-image.png'; this.onerror=null;">
        </div>
        <div style="padding: 12px; font-size: 14px; color: white; background: rgba(0,0,0,0.6);">
            <div style="font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 8px;">${photo.title || 'Sans titre'}</div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="text-shadow: 1px 1px 2px black;">${photo.author_name || 'Anonyme'}</span>
                <button class="delete-photo-btn" data-id="${photo.id}" style="background: rgba(255,0,0,0.8); color: white; border: none; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 20px; font-weight: bold; padding: 0;">×</button>
            </div>
        </div>
    `;
    
    gridContainer.appendChild(photoCard);
});
        
        photosList.appendChild(gridContainer);
        
        // Ajouter les gestionnaires d'événements pour les boutons de suppression
        photosList.querySelectorAll('.delete-photo-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const photoId = btn.dataset.id;
                
                if (confirm(`Êtes-vous sûr de vouloir supprimer la photo #${photoId} ?`)) {
                    await this.deleteGalleryPhoto(photoId);
                }
            });
        });
        
    } catch (error) {
        console.error("Erreur lors du chargement des photos:", error);
        const photosList = document.querySelector('.photos-list');
        if (photosList) {
            photosList.innerHTML = `<div class="error">Erreur: ${error.message}</div>`;
        }
    }
}

// Méthode pour charger les commentaires des photos
async loadPhotoComments() {
    try {
        console.log("🖼️ CHARGEMENT COMMENTAIRES PHOTOS");
        
        // 🆕 AJOUTEZ ICI : Nettoyer TOUS les conteneurs
        const photosList = document.querySelector('.photo-comments-list');
        const newsList = document.querySelector('.news-comments-list');
        
        if (newsList) newsList.innerHTML = ''; // Vider le conteneur actualités
        
        console.log("Chargement des commentaires depuis le panel admin du chat...");
        
        // Chercher l'élément dans le panel admin OU créer un container dédié
let commentsList = document.querySelector('.photo-comments-list') || 
                   document.querySelector('#photo-comments-container');

if (!commentsList) {
    // Créer un container pour les commentaires dans le panel admin
    commentsList = document.createElement('div');
    commentsList.className = 'comments-list admin-comments-list';
    commentsList.id = 'admin-comments-list';
    
    // L'ajouter au bon endroit dans le panel admin
    const commentsSection = document.querySelector('#photo-comments-section') || 
                           document.querySelector('.tab-section.active') ||
                           document.querySelector('.admin-panel .panel-content');
    
    if (commentsSection) {
        // Ajouter un titre si nécessaire
        if (!commentsSection.querySelector('h4')) {
            const title = document.createElement('h4');
            title.textContent = 'Commentaires des photos';
            title.style.marginBottom = '15px';
            commentsSection.appendChild(title);
        }
        
        commentsSection.appendChild(commentsList);
        console.log("Container de commentaires créé dans le panel admin");
    } else {
        console.error("Impossible de trouver un container parent pour les commentaires");
        return;
    }
}
        
        commentsList.innerHTML = '<div class="loading-comments">Chargement des commentaires...</div>';
        
        // Utiliser l'instance Supabase du chat pour récupérer les commentaires
        // Ajustement à votre structure spécifique
        const { data: comments, error } = await this.supabase
            .from('photo_comments')
            .select('*, photos(title, image_url)') // Jointure avec la table photos
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error("Erreur lors du chargement des commentaires:", error);
            commentsList.innerHTML = `<div class="error">Erreur: ${error.message}</div>`;
            return;
        }
        
        if (!comments || comments.length === 0) {
            commentsList.innerHTML = '<div class="no-data">Aucun commentaire trouvé</div>';
            return;
        }
        
        // Créer la liste des commentaires avec leurs contrôles
        commentsList.innerHTML = '';
        
        // Conteneur pour les commentaires
        const commentsContainer = document.createElement('div');
        commentsContainer.className = 'admin-comments-container';
        commentsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 15px;
            padding: 10px;
        `;

        comments.forEach(comment => {
            const commentCard = document.createElement('div');
            commentCard.className = 'admin-comment-card';
            commentCard.dataset.id = comment.id;
            commentCard.style.cssText = `
                position: relative;
                background: rgba(30, 30, 30, 0.8);
                border-radius: 10px;
                overflow: hidden;
                padding: 15px;
                transition: all 0.3s;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                display: flex;
                gap: 15px;
            `;
            
            // Si on a l'image de la photo associée, l'afficher en miniature
            const hasPhoto = comment.photos && comment.photos.image_url;
            
            commentCard.innerHTML = `
                ${hasPhoto ? `
                <div style="min-width: 80px; width: 80px; height: 80px; overflow: hidden; border-radius: 8px;">
                    <img src="${comment.photos.image_url}" alt="${comment.photos.title || 'Photo'}" 
                        style="width: 100%; height: 100%; object-fit: cover;"
                        onerror="this.src='/images/no-image.png'; this.onerror=null;">
                </div>
                ` : ''}
                <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <div style="font-weight: bold; margin-bottom: 4px; color: #ddd;">
                                ${comment.author_name || 'Anonyme'}
                            </div>
                            <div style="font-size: 12px; color: #aaa;">
                                ${new Date(comment.created_at).toLocaleString('fr-FR')}
                            </div>
                        </div>
                        <button class="delete-comment-btn" data-id="${comment.id}" style="background: rgba(255,0,0,0.8); color: white; border: none; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 20px; font-weight: bold; padding: 0;">×</button>
                    </div>
                    <div style="color: white; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; margin-top: 5px;">
                        ${comment.comment_text || 'Aucun contenu'}
                    </div>
                    ${hasPhoto ? `
                    <div style="font-size: 12px; color: #aaa; margin-top: 5px;">
                        Photo: ${comment.photos.title || 'Sans titre'}
                    </div>
                    ` : ''}
                </div>
            `;
            
            commentsContainer.appendChild(commentCard);
        });
        
        commentsList.appendChild(commentsContainer);
        
        // Ajouter les gestionnaires d'événements pour les boutons de suppression
        commentsList.querySelectorAll('.delete-comment-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const commentId = btn.dataset.id;
                
                if (confirm(`Êtes-vous sûr de vouloir supprimer ce commentaire ?`)) {
                    await this.deletePhotoComment(commentId);
                }
            });
        });
        
    } catch (error) {
        console.error("Erreur lors du chargement des commentaires:", error);
        const commentsList = document.querySelector('.comments-list');
        if (commentsList) {
            commentsList.innerHTML = `<div class="error">Erreur: ${error.message}</div>`;
        }
    }
}

// Méthode pour supprimer un commentaire
// Méthode pour supprimer un commentaire
async deletePhotoComment(commentId) {
    try {
        console.log(`Tentative de suppression du commentaire ID: ${commentId}...`);
        
        // Afficher un indicateur de chargement
        const commentCard = document.querySelector(`.admin-comment-card[data-id="${commentId}"]`);
        if (commentCard) {
            commentCard.style.opacity = '0.5';
        }
        
        // Supprimer le commentaire de la base de données
        const { error } = await this.supabase
            .from('photo_comments')
            .delete()
            .eq('id', commentId);
            
        if (error) {
            console.error("Erreur lors de la suppression du commentaire:", error);
            throw error;
        }
        
        console.log(`Commentaire ${commentId} supprimé avec succès`);
        this.showNotification("Commentaire supprimé avec succès", "success");
        
        // Supprimer visuellement le commentaire
        if (commentCard) {
            commentCard.style.transition = "all 0.3s";
            commentCard.style.maxHeight = "0";
            commentCard.style.opacity = "0";
            commentCard.style.padding = "0";
            commentCard.style.margin = "0";
            
            setTimeout(() => {
                commentCard.remove();
                
                // Vérifier s'il reste des commentaires
                const remainingComments = document.querySelectorAll('.admin-comment-card');
                if (remainingComments.length === 0) {
                    const commentsList = document.querySelector('.comments-list');
                    if (commentsList) {
                        commentsList.innerHTML = '<div class="no-data">Aucun commentaire trouvé</div>';
                    }
                }
            }, 300);
        }
        
        return true;
    } catch (error) {
        console.error("Erreur lors de la suppression du commentaire:", error);
        this.showNotification(`Erreur lors de la suppression: ${error.message}`, "error");
        
        // Restaurer l'opacité normale
        const commentCard = document.querySelector(`.admin-comment-card[data-id="${commentId}"]`);
        if (commentCard) {
            commentCard.style.opacity = '1';
        }
        
        return false;
    }
}

// Méthode pour supprimer une photo
async deleteGalleryPhoto(photoId) {
    try {
        console.log(`Tentative de suppression de la photo ID: ${photoId}...`);
        
        // Afficher un indicateur de chargement
        const photoCard = document.querySelector(`.admin-photo-card[data-id="${photoId}"]`);
        if (photoCard) {
            photoCard.style.opacity = '0.5';
        }
        
        // 1. Récupérer les détails de la photo pour avoir le chemin du fichier
        const { data: photo, error: fetchError } = await this.supabase
            .from('photos')
            .select('file_path')
            .eq('id', photoId)
            .single();
            
        if (fetchError) {
            console.error("Erreur lors de la récupération des détails de la photo:", fetchError);
            throw fetchError;
        }
        
        // 2. Supprimer le fichier du storage
        if (photo && photo.file_path) {
            const { error: storageError } = await this.supabase.storage
                .from('gallery')
                .remove([photo.file_path]);
                
            if (storageError) {
                console.warn("Erreur lors de la suppression du fichier:", storageError);
                // Continuer malgré l'erreur pour supprimer l'entrée de base de données
            }
        }
        
        // 3. Supprimer l'entrée de la base de données
        const { error: dbError } = await this.supabase
            .from('photos')
            .delete()
            .eq('id', photoId);
            
        if (dbError) {
            console.error("Erreur lors de la suppression de l'entrée de base de données:", dbError);
            throw dbError;
        }
        
        console.log(`Photo ${photoId} supprimée avec succès`);
        this.showNotification("Photo supprimée avec succès", "success");
        
        // Supprimer visuellement la carte de photo
        if (photoCard) {
            photoCard.style.transition = "all 0.3s";
            photoCard.style.transform = "scale(0.5)";
            photoCard.style.opacity = "0";
            
            setTimeout(() => {
                photoCard.remove();
                
                // Vérifier s'il reste des photos
                const remainingPhotos = document.querySelectorAll('.admin-photo-card');
                if (remainingPhotos.length === 0) {
                    const photosList = document.querySelector('.photos-list');
                    if (photosList) {
                        photosList.innerHTML = '<div class="no-data">Aucune photo trouvée</div>';
                    }
                }
            }, 300);
        }
        
        return true;
    } catch (error) {
        console.error("Erreur lors de la suppression de la photo:", error);
        this.showNotification(`Erreur lors de la suppression: ${error.message}`, "error");
        
        // Restaurer l'opacité normale
        const photoCard = document.querySelector(`.admin-photo-card[data-id="${photoId}"]`);
        if (photoCard) {
            photoCard.style.opacity = '1';
        }
        
        return false;
    }
}

// Charger les statistiques NEWS
async loadNewsStats() {
    try {
        // Actualités publiées
        const { count: published } = await this.supabase
            .from('local_news')
            .select('*', { count: 'exact', head: true })
            .eq('is_published', true);
            
        // Brouillons
        const { count: drafts } = await this.supabase
            .from('local_news')
            .select('*', { count: 'exact', head: true })
            .eq('is_published', false);
            
        // Commentaires en attente
        const { count: pendingComments } = await this.supabase
            .from('news_comments')
            .select('*', { count: 'exact', head: true })
            .eq('is_approved', false);
            
        // Mettre à jour l'affichage
        const publishedEl = document.getElementById('publishedCount');
        const draftEl = document.getElementById('draftCount');
        const pendingEl = document.getElementById('pendingCommentsCount');
        
        if (publishedEl) publishedEl.textContent = published || 0;
        if (draftEl) draftEl.textContent = drafts || 0;
        if (pendingEl) pendingEl.textContent = pendingComments || 0;
        
        // Gérer les badges de notification
        const commentsBadge = document.getElementById('commentsBadgeNews');
        const buttonBadge = document.getElementById('commentsButtonBadge');
        
        if (pendingComments > 0) {
            // Afficher les badges
            if (commentsBadge) {
                commentsBadge.style.display = 'flex';
                commentsBadge.textContent = pendingComments > 9 ? '9+' : pendingComments;
            }
            if (buttonBadge) {
                buttonBadge.style.display = 'flex';
                buttonBadge.textContent = pendingComments > 9 ? '9+' : pendingComments;
            }
        } else {
            // Cacher les badges
            if (commentsBadge) commentsBadge.style.display = 'none';
            if (buttonBadge) buttonBadge.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
}

// Charger les dernières actualités
async loadRecentNews() {
    try {
        const container = document.querySelector('.recent-news-list');
        if (!container) return;
        
        container.innerHTML = '<div class="loading-news">Chargement des actualités...</div>';
        
        const { data: news, error } = await this.supabase
            .from('local_news')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
            
        if (error) throw error;
        
        if (!news || news.length === 0) {
            container.innerHTML = '<div class="no-data">Aucune actualité</div>';
            return;
        }
        
        container.innerHTML = news.map(article => `
            <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid ${article.is_published ? '#4CAF50' : '#FFC107'};">
                <div style="font-weight: bold; margin-bottom: 4px; color: #ddd;">${article.title}</div>
                <div style="font-size: 12px; color: #aaa; display: flex; justify-content: space-between;">
                    <span>${new Date(article.created_at).toLocaleDateString('fr-FR')}</span>
                    <span style="color: ${article.is_published ? '#4CAF50' : '#FFC107'};">
                        ${article.is_published ? '✅ Publié' : '📝 Brouillon'}
                        ${article.featured ? ' ⭐' : ''}
                    </span>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erreur chargement actualités:', error);
        const container = document.querySelector('.recent-news-list');
        if (container) {
            container.innerHTML = `<div class="error">Erreur: ${error.message}</div>`;
        }
    }
}

// Charger les commentaires d'actualités
async loadNewsComments() {
    try {
        console.log("📰 CHARGEMENT COMMENTAIRES ACTUALITÉS");
        
        // 🆕 AJOUTEZ ICI : Nettoyer TOUS les conteneurs
        const photosList = document.querySelector('.photo-comments-list');
        const newsList = document.querySelector('.news-comments-list');
        
        if (photosList) photosList.innerHTML = ''; // Vider le conteneur photos
        
        const container = document.querySelector('.news-comments-list') || 
                  document.querySelector('#news-comments-container');
        if (!container) return;
        
        container.innerHTML = '<div class="loading-comments">Chargement des commentaires actualités...</div>';
        
        const { data: comments, error } = await this.supabase
            .from('news_comments')
            .select('*, local_news(title)')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        if (!comments || comments.length === 0) {
            container.innerHTML = '<div class="no-data">Aucun commentaire d\'actualité</div>';
            return;
        }
        
        container.innerHTML = comments.map(comment => `
            <div class="admin-comment-card" data-id="${comment.id}" style="background: rgba(30, 30, 30, 0.8); border-radius: 10px; padding: 15px; margin-bottom: 10px; border-left: 4px solid ${comment.is_approved ? '#4CAF50' : '#FFC107'};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div>
                        <div style="font-weight: bold; color: #ddd; margin-bottom: 4px;">${comment.author_name}</div>
                        <div style="font-size: 12px; color: #aaa;">${new Date(comment.created_at).toLocaleString('fr-FR')}</div>
                        <div style="font-size: 12px; color: #4CAF50; margin-top: 4px;">📰 ${comment.local_news?.title || 'Actualité supprimée'}</div>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        ${!comment.is_approved ? `
                            <button class="approve-news-comment" data-id="${comment.id}" style="background: #4CAF50; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">✓</button>
                        ` : ''}
                        <button class="delete-news-comment" data-id="${comment.id}" style="background: #F44336; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">×</button>
                    </div>
                </div>
                <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; color: white;">
                    ${comment.content}
                </div>
                <div style="margin-top: 8px; font-size: 12px; color: ${comment.is_approved ? '#4CAF50' : '#FFC107'};">
                    ${comment.is_approved ? '✅ Approuvé' : '⏳ En attente'}
                </div>
            </div>
        `).join('');
        
        // Ajouter les gestionnaires d'événements
        container.querySelectorAll('.approve-news-comment').forEach(btn => {
            btn.addEventListener('click', () => this.approveNewsComment(btn.dataset.id));
        });
        
        container.querySelectorAll('.delete-news-comment').forEach(btn => {
            btn.addEventListener('click', () => this.deleteNewsComment(btn.dataset.id));
        });
        
    } catch (error) {
        console.error('Erreur chargement commentaires actualités:', error);
        const container = document.querySelector('.news-comments-list');
        if (container) {
            container.innerHTML = `<div class="error">Erreur: ${error.message}</div>`;
        }
    }
}

// Approuver un commentaire d'actualité
async approveNewsComment(commentId) {
    try {
        const { error } = await this.supabase
            .from('news_comments')
            .update({ is_approved: true })
            .eq('id', commentId);
            
        if (error) throw error;
        
        this.showNotification('Commentaire approuvé', 'success');
        this.loadNewsComments();
        this.loadNewsStats(); // Recharger les stats
    } catch (error) {
        console.error('Erreur approbation:', error);
        this.showNotification('Erreur approbation', 'error');
    }
}

// Supprimer un commentaire d'actualité
async deleteNewsComment(commentId) {
    if (!confirm('Supprimer ce commentaire ?')) return;
    
    try {
        const { error } = await this.supabase
            .from('news_comments')
            .delete()
            .eq('id', commentId);
            
        if (error) throw error;
        
        this.showNotification('Commentaire supprimé', 'success');
        this.loadNewsComments();
        this.loadNewsStats(); // Recharger les stats
    } catch (error) {
        console.error('Erreur suppression:', error);
        this.showNotification('Erreur suppression', 'error');
    }
}
}
export default ChatManager;
