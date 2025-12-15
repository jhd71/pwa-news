// ban-manager.js
(function() {
    // Vérifier le bannissement local
    function checkLocalBan() {
        if (localStorage.getItem('chat_device_banned') === 'true') {
            const bannedUntil = localStorage.getItem('chat_device_banned_until');
            
            // Vérifier si le bannissement a expiré
            if (bannedUntil && bannedUntil !== 'permanent') {
                const expiryTime = parseInt(bannedUntil);
                if (Date.now() > expiryTime) {
                    // Le bannissement a expiré, supprimer les données
                    clearBanData();
                    return false;
                }
            }
            
            // L'appareil est toujours banni
            hideChatButton();
            return true;
        }
        
        // Vérifier les cookies aussi
        if (document.cookie.includes('chat_banned=true')) {
            hideChatButton();
            return true;
        }
        
        return false;
    }
    
    // Vérifier s'il y a levée de ban
    function checkBanLifted() {
        if (getCookie('chat_ban_lifted') === 'true') {
            console.log("Bannissement levé détecté, réactivation du chat");
            
            // Supprimer les données locales de bannissement
            clearBanData();
            
            // Supprimer le cookie
            document.cookie = "chat_ban_lifted=; path=/; max-age=0";
            
            // Restaurer et animer le bouton quand le DOM est chargé
            window.addEventListener('DOMContentLoaded', function() {
                showChatButton();
                showBanLiftedNotification();
            });
            
            return true;
        }
        return false;
    }
    
    // Fonctions utilitaires
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
    
    function clearBanData() {
        localStorage.removeItem('chat_device_banned');
        localStorage.removeItem('chat_device_banned_until');
        localStorage.removeItem('chat_ban_reason');
        localStorage.removeItem('chat_ban_dismissed');
    }
    
    function hideChatButton() {
        console.log("APPAREIL BANNI: Bouton de chat masqué");
        
        // Masquer immédiatement avec un style
        const style = document.createElement('style');
        style.textContent = '#chatToggleBtn { display: none !important; }';
        document.head.appendChild(style);
        
        // S'assurer que le bouton est masqué après chargement du DOM
        window.addEventListener('DOMContentLoaded', function() {
            const chatBtn = document.getElementById('chatToggleBtn');
            if (chatBtn) chatBtn.style.display = 'none';
        });
    }
    
    function showChatButton() {
        const chatBtn = document.getElementById('chatToggleBtn');
        if (chatBtn) {
            chatBtn.style.display = 'flex';
            chatBtn.style.animation = 'pulse 2s infinite';
            
            // Ajouter l'animation si nécessaire
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
        }
    }
    
    function showBanLiftedNotification() {
        const notification = document.createElement('div');
        notification.className = 'ban-lifted-notification';
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="font-size: 20px;">✅</div>
                <div>Votre accès au chat a été restauré</div>
            </div>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 5px;
            z-index: 9999;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            font-size: 14px;
            text-align: center;
            animation: slideInDown 0.5s ease-out, fadeOut 0.5s ease-out 4.5s forwards;
        `;
        
        // Ajouter un style pour l'animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInDown {
                from { transform: translate(-50%, -100%); opacity: 0; }
                to { transform: translate(-50%, 0); opacity: 1; }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Supprimer la notification après 5 secondes
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
    
    // Restaurer le bouton de statut si nécessaire
    function restoreStatusButton() {
        window.addEventListener('DOMContentLoaded', function() {
            if (localStorage.getItem('chat_device_banned') === 'true' && 
                localStorage.getItem('status_button_visible') === 'true') {
                
                console.log("Tentative de restauration du bouton de statut");
                
                // Attendre que ChatManager soit initialisé
                const checkChatManager = setInterval(() => {
                    if (window.chatManager && window.chatManager.initialized) {
                        clearInterval(checkChatManager);
                        
                        // Créer le bouton de statut
                        if (typeof window.chatManager.createBanStatusButton === 'function') {
                            window.chatManager.createBanStatusButton();
                        }
                    }
                }, 500);
            }
        });
    }
    
    // Exécution principale
    const isBanned = checkLocalBan();
    const isBanLifted = checkBanLifted();
    
    // Si ni banni ni levée de ban, ne rien faire
    if (!isBanned && !isBanLifted) {
        // Aucune action nécessaire, le bouton de chat reste visible
    }
    
    // Dans tous les cas, vérifier le bouton de statut
    restoreStatusButton();
})();