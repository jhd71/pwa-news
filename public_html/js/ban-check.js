// ban-check.js - Système de gestion des bannissements pour le chat

(function() {
    // Variables globales
    let supabaseClient = null;
    let banCheckInitialized = false;
    let statusButton = null;
    
    // Attendre que le document soit chargé
    document.addEventListener('DOMContentLoaded', function() {
        // Initialiser après un court délai pour s'assurer que tout est chargé
        setTimeout(initBanCheck, 1000);
    });
    
    // Fonction principale d'initialisation
    async function initBanCheck() {
        // Éviter les initialisations multiples
        if (banCheckInitialized) return;
        banCheckInitialized = true;
        
        console.log("Initialisation du système de vérification de bannissement");
        
        // Initialiser Supabase si nécessaire
        initializeSupabase();
        
        // Vérifier si l'utilisateur est banni
        const isBanned = localStorage.getItem('chat_device_banned') === 'true';
        
        // Si banni, créer le bouton de vérification
        if (isBanned) {
            createStatusButton();
            
            // Vérifier si le message de bannissement doit être affiché
            const banDismissed = localStorage.getItem('chat_ban_dismissed') === 'true';
            
            if (!banDismissed) {
                showBanMessage();
            }
        }
        
        // S'assurer que le bouton de chat est caché si banni
        updateChatButtonVisibility();
    }
    
    // Fonction pour initialiser Supabase correctement
function initializeSupabase() {
    try {
        // Utiliser la fonction partagée getSupabaseClient si disponible
        if (window.getSupabaseClient && typeof window.getSupabaseClient === 'function') {
            supabaseClient = window.getSupabaseClient();
            console.log("Client Supabase créé à partir de getSupabaseClient");
        }
        // Fallback vers chatManager si disponible
        else if (window.chatManager && window.chatManager.supabase) {
            supabaseClient = window.chatManager.supabase;
            console.log("Utilisation du client Supabase de chatManager");
        } 
        // Dernier recours : créer une nouvelle instance
        else if (window.supabase) {
            supabaseClient = window.supabase.createClient(
                'https://ekjgfiyhkythqcnmhzea.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramdmaXloa3l0aHFjbm1oemVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzYxNDIsImV4cCI6MjA1ODI1MjE0Mn0.V0j_drb6GiTojgwxC6ydjnyJDRRT9lUbSc1E7bFE2Z4'
            );
            console.warn("Client Supabase créé à partir de window.supabase - envisagez d'utiliser getSupabaseClient");
        }
        else {
            console.warn("Supabase non disponible - les vérifications en base de données seront ignorées");
        }
    } catch (error) {
        console.error("Erreur d'initialisation de Supabase:", error);
        supabaseClient = null;
    }
}
    
    // Fonction pour créer le bouton de vérification flottant
    function createStatusButton() {
        // Supprimer le bouton existant s'il y en a un
        if (statusButton) {
            statusButton.remove();
        }
        
        // Créer le nouveau bouton
        statusButton = document.createElement('button');
        statusButton.id = 'ban-status-button';
        
        // Style du bouton (adapté pour mobile et desktop)
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            statusButton.innerHTML = '🔄';
            statusButton.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(211, 47, 47, 0.9);
                color: white;
                border: none;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                font-size: 20px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                cursor: pointer;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            `;
        } else {
            statusButton.innerHTML = '🔄 Vérifier bannissement';
            statusButton.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(211, 47, 47, 0.9);
                color: white;
                border: none;
                border-radius: 50px;
                padding: 10px 20px;
                font-size: 14px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                cursor: pointer;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            `;
        }
        
        // Ajouter les effets de survol
        statusButton.addEventListener('mouseenter', () => {
            statusButton.style.background = 'rgba(211, 47, 47, 1)';
            statusButton.style.transform = 'scale(1.05)';
        });
        
        statusButton.addEventListener('mouseleave', () => {
            statusButton.style.background = 'rgba(211, 47, 47, 0.9)';
            statusButton.style.transform = 'scale(1)';
        });
        
        // Ajouter le gestionnaire de clic
        statusButton.addEventListener('click', () => {
            checkBanStatus();
        });
        
        // Ajouter le bouton au document
        document.body.appendChild(statusButton);
    }
    
    // Fonction pour afficher le message de bannissement
    function showBanMessage() {
        // Récupérer la raison du bannissement
        const banReason = localStorage.getItem('chat_ban_reason') || '';
        
        // Créer le message
        const banMessage = document.createElement('div');
        banMessage.id = 'ban-message-overlay';
        banMessage.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        // Contenu du message
        banMessage.innerHTML = `
            <div style="background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%); color: white; padding: 30px; border-radius: 10px; max-width: 90%; width: 400px; text-align: center; box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);">
                <div style="font-size: 48px; margin-bottom: 10px;">🚫</div>
                <h2 style="margin-top: 5px; margin-bottom: 10px; font-size: 24px; font-weight: bold;">Accès interdit</h2>
                <p style="margin: 0 0 10px 0; font-size: 16px;">Votre accès au chat a été suspendu.</p>
                ${banReason ? `<p style="background: rgba(0, 0, 0, 0.2); padding: 10px; border-radius: 5px; margin: 15px 0; font-size: 14px;">Raison: ${banReason}</p>` : ''}
                <div style="display: flex; gap: 10px; margin-top: 20px; justify-content: center;">
                    <button id="dismiss-ban-message" style="background: rgba(255, 255, 255, 0.2); border: none; padding: 10px 15px; color: white; border-radius: 5px; cursor: pointer; flex: 1;">Fermer</button>
                    <button id="check-ban-status-dialog" style="background: rgba(255, 255, 255, 0.25); border: none; padding: 10px 15px; color: white; border-radius: 5px; cursor: pointer; flex: 1;">Vérifier</button>
                </div>
            </div>
        `;
        
        // Ajouter au document
        document.body.appendChild(banMessage);
        
        // Gestionnaire pour fermer le message
        document.getElementById('dismiss-ban-message').addEventListener('click', () => {
            banMessage.remove();
            localStorage.setItem('chat_ban_dismissed', 'true');
        });
        
        // Gestionnaire pour vérifier le statut
        document.getElementById('check-ban-status-dialog').addEventListener('click', () => {
            banMessage.remove();
            localStorage.setItem('chat_ban_dismissed', 'true');
            checkBanStatus();
        });
    }
    
    // Fonction principale pour vérifier le statut du bannissement
    async function checkBanStatus() {
        // Mettre à jour l'apparence du bouton
        if (statusButton) {
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile) {
                statusButton.innerHTML = '⏳';
            } else {
                statusButton.innerHTML = '⏳ Vérification...';
            }
            
            statusButton.disabled = true;
        }
        
        try {
            // Récupérer les informations nécessaires
            const pseudo = localStorage.getItem('lastPseudo') || localStorage.getItem('chatPseudo');
            const realIP = await getClientRealIP();
            
            // Vérifier les bannissements dans la base de données
            let isBannedInDatabase = false;
            
            // Vérifier si supabaseClient est correctement initialisé
            if (supabaseClient && typeof supabaseClient.from === 'function') {
                // Vérifier dans banned_ips
                if (pseudo) {
                    const { data: ipBanData, error: ipBanError } = await supabaseClient
                        .from('banned_ips')
                        .select('*')
                        .eq('ip', pseudo)
                        .maybeSingle();
                    
                    if (!ipBanError && ipBanData) {
                        // Vérifier si le bannissement a expiré
                        if (ipBanData.expires_at && new Date(ipBanData.expires_at) < new Date()) {
                            // Supprimer le bannissement expiré
                            await supabaseClient
                                .from('banned_ips')
                                .delete()
                                .eq('ip', pseudo);
                        } else {
                            isBannedInDatabase = true;
                        }
                    }
                }
                
                // Vérifier dans banned_real_ips
                if (!isBannedInDatabase && realIP) {
                    const { data: realIpBanData, error: realIpBanError } = await supabaseClient
                        .from('banned_real_ips')
                        .select('*')
                        .eq('ip', realIP)
                        .maybeSingle();
                    
                    if (!realIpBanError && realIpBanData) {
                        // Vérifier si le bannissement a expiré
                        if (realIpBanData.expires_at && new Date(realIpBanData.expires_at) < new Date()) {
                            // Supprimer le bannissement expiré
                            await supabaseClient
                                .from('banned_real_ips')
                                .delete()
                                .eq('ip', realIP);
                        } else {
                            isBannedInDatabase = true;
                        }
                    }
                }
            } else {
                console.warn("Supabase non initialisé ou incomplet, vérification passive uniquement");
                // Si supabaseClient n'est pas disponible, on fait une vérification passive avec un délai supplémentaire
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // Forcer le débannissement si nous ne pouvons pas vérifier la base de données
            if (!supabaseClient || typeof supabaseClient.from !== 'function') {
                console.log("Supabase non disponible, débannissement forcé en mode local uniquement");
                isBannedInDatabase = false;
            }
            
            // Si l'utilisateur n'est plus banni, mettre à jour le stockage local
            if (!isBannedInDatabase) {
                // Supprimer toutes les informations de bannissement
                localStorage.removeItem('chat_device_banned');
                localStorage.removeItem('chat_device_banned_until');
                localStorage.removeItem('chat_ban_reason');
                localStorage.removeItem('chat_ban_dismissed');
                localStorage.removeItem('status_button_visible');
                
                // Marquer comme débanni avec un cookie
                document.cookie = "chat_ban_lifted=true; path=/; max-age=60";
                
                // Afficher une notification de succès
                showUnbannedNotification();
                
                // Supprimer le bouton de statut
                if (statusButton) {
                    statusButton.remove();
                    statusButton = null;
                }
                
                // Réactiver le bouton de chat
                updateChatButtonVisibility(true);
                
                return;
            }
            
            // Si toujours banni, mettre à jour le bouton
            if (statusButton) {
                const isMobile = window.innerWidth <= 768;
                
                if (isMobile) {
                    statusButton.innerHTML = '🔒';
                } else {
                    statusButton.innerHTML = '🔒 Toujours banni';
                }
                
                setTimeout(() => {
                    if (statusButton) {
                        if (isMobile) {
                            statusButton.innerHTML = '🔄';
                        } else {
                            statusButton.innerHTML = '🔄 Vérifier bannissement';
                        }
                        
                        statusButton.disabled = false;
                    }
                }, 3000);
            }
            
            // Afficher une notification d'échec
            showNotification("Vous êtes toujours banni", "error");
            
        } catch (error) {
            console.error("Erreur lors de la vérification du bannissement:", error);
            
            // Réinitialiser le bouton
            if (statusButton) {
                const isMobile = window.innerWidth <= 768;
                
                if (isMobile) {
                    statusButton.innerHTML = '⚠️';
                } else {
                    statusButton.innerHTML = '⚠️ Erreur';
                }
                
                setTimeout(() => {
                    if (statusButton) {
                        if (isMobile) {
                            statusButton.innerHTML = '🔄';
                        } else {
                            statusButton.innerHTML = '🔄 Vérifier bannissement';
                        }
                        
                        statusButton.disabled = false;
                    }
                }, 3000);
            }
            
            showNotification("Erreur lors de la vérification", "error");
        }
    }
    
    // Fonction pour afficher une notification de succès après la levée du bannissement
    function showUnbannedNotification() {
        // Créer la notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 90%;
            width: 400px;
            text-align: center;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
            z-index: 10000;
        `;
        
        notification.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
            <h2 style="margin-top: 5px; margin-bottom: 10px; font-size: 24px; font-weight: bold;">Bannissement levé</h2>
            <p style="margin: 0 0 20px 0; font-size: 16px;">Vous pouvez à nouveau utiliser le chat.</p>
            <button id="reload-page-button" style="background: rgba(255, 255, 255, 0.3); border: none; padding: 12px 20px; color: white; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 16px;">Actualiser la page</button>
        `;
        
        document.body.appendChild(notification);
        
        // Ajouter le gestionnaire pour actualiser la page
        document.getElementById('reload-page-button').addEventListener('click', () => {
            // Actualiser la page
            window.location.reload();
        });
    }
    
    // Fonction pour afficher une notification simple
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
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
            animation: fadeInOut 3s ease-in-out;
        `;
        
        // Ajouter un style pour l'animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateX(50px); }
                10% { opacity: 1; transform: translateX(0); }
                90% { opacity: 1; transform: translateX(0); }
                100% { opacity: 0; transform: translateX(50px); }
            }
        `;
        
        if (!document.head.querySelector('style[data-for="notification-animation"]')) {
            style.setAttribute('data-for', 'notification-animation');
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Supprimer la notification après 3 secondes
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    // Fonction pour obtenir l'adresse IP réelle du client
    async function getClientRealIP() {
        try {
            // Vérifier si nous avons une IP récente en cache (moins d'une heure)
            const cachedIP = localStorage.getItem('last_known_real_ip');
            const lastCheckTime = parseInt(localStorage.getItem('last_ip_check_time') || '0');
            const cacheAge = Date.now() - lastCheckTime;
            
            // Si le cache existe et est récent (moins d'une heure), l'utiliser
            if (cachedIP && cacheAge < 60 * 60 * 1000) {
                return cachedIP;
            }
            
            // Essayer d'obtenir l'IP via ipify
            const response = await fetch('https://api.ipify.org?format=json');
            
            if (response.ok) {
                const data = await response.json();
                
                // Stocker l'IP en cache local
                localStorage.setItem('last_known_real_ip', data.ip);
                localStorage.setItem('last_ip_check_time', Date.now().toString());
                
                return data.ip;
            }
        } catch (error) {
            console.warn('Erreur obtention IP:', error);
            
            // En cas d'échec, utiliser une IP en cache même ancienne
            const cachedIP = localStorage.getItem('last_known_real_ip');
            if (cachedIP) {
                return cachedIP;
            }
        }
        
        return null;
    }
    
    // Fonction pour mettre à jour la visibilité du bouton de chat
    function updateChatButtonVisibility(forceShow = false) {
        const chatBtn = document.getElementById('chatToggleBtn');
        if (!chatBtn) return;
        
        if (forceShow) {
            chatBtn.style.display = 'flex';
            
            // Ajouter une animation pour attirer l'attention
            chatBtn.style.animation = 'pulse 2s infinite';
            
            // Ajouter un style d'animation si nécessaire
            if (!document.getElementById('chat-btn-animation')) {
                const style = document.createElement('style');
                style.id = 'chat-btn-animation';
                style.textContent = `
                    @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.15); }
                        100% { transform: scale(1); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Arrêter l'animation après 5 secondes
            setTimeout(() => {
                chatBtn.style.animation = '';
            }, 5000);
        } else {
            const isBanned = localStorage.getItem('chat_device_banned') === 'true';
            chatBtn.style.display = isBanned ? 'none' : 'flex';
        }
    }
    
    // Exposer certaines fonctions globalement
    window.banCheckSystem = {
        checkBanStatus,
        showBanMessage,
        updateChatButtonVisibility
    };
})();