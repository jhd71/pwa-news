// ios-chat-fix.js - Solution pour le problème de clavier iOS dans le chat

(function() {
    // Ne s'exécuter que sur iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (!isIOS) return;
    
    console.log("iOS détecté - Activation des correctifs pour le chat");
    
    document.addEventListener('DOMContentLoaded', function() {
        // S'assurer que le gestionnaire de chat est initialisé
        const waitForChatManager = setInterval(() => {
            if (window.chatManager && window.chatManager.initialized) {
                clearInterval(waitForChatManager);
                setupIOSChatFixes();
            }
        }, 500);
    });
    
    function setupIOSChatFixes() {
        // Référence aux éléments du chat
        const container = window.chatManager.container;
        if (!container) return;
        
        // Trouver la zone de texte du chat
        const textarea = container.querySelector('.chat-input textarea');
        const chatContainer = container.querySelector('.chat-container');
        const messagesContainer = container.querySelector('.chat-messages');
        
        if (!textarea || !chatContainer) return;
        
        console.log("Mise en place des correctifs pour le clavier iOS");
        
        // Ajouter des styles spécifiques à iOS
        const style = document.createElement('style');
        style.textContent = `
            .chat-container.ios-keyboard-open {
                height: 50% !important;
                bottom: 50% !important;
                transition: all 0.3s ease-out;
            }
            
            .chat-container.ios-keyboard-open .chat-messages {
                max-height: calc(100% - 120px) !important;
            }
            
            .chat-container.ios-keyboard-open .chat-input {
                position: absolute !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                background: var(--chat-gradient, linear-gradient(135deg, #6e46c9 0%, #8a5adf 100%)) !important;
                padding: 10px !important;
                border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
            }
            
            /* Bouton d'aide spécifique iOS */
            .ios-keyboard-helper {
                position: fixed;
                bottom: 10px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 2000;
                background: rgba(126, 87, 194, 0.9);
                color: white;
                border: none;
                border-radius: 20px;
                padding: 8px 15px;
                font-weight: bold;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                display: none;
            }
        `;
        document.head.appendChild(style);
        
        // Créer un bouton d'aide
        const helperButton = document.createElement('button');
        helperButton.className = 'ios-keyboard-helper';
        helperButton.textContent = '⬆️ Voir ce que j\'écris';
        helperButton.style.display = 'none';
        document.body.appendChild(helperButton);
        
        // Gérer l'apparition du clavier
        textarea.addEventListener('focus', function() {
            console.log("Focus sur textarea - ajustement pour iOS");
            
            // Attendre un peu que le clavier apparaisse
            setTimeout(() => {
                chatContainer.classList.add('ios-keyboard-open');
                
                // Faire défiler pour voir le textarea
                textarea.scrollIntoView(false);
                
                // Montrer le bouton d'aide
                helperButton.style.display = 'block';
                
                // S'assurer que la zone de messages est scrollée jusqu'en bas
                if (messagesContainer) {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }, 300);
        });
        
        // Gérer la disparition du clavier
        textarea.addEventListener('blur', function() {
            console.log("Blur de textarea - restauration pour iOS");
            
            // Attendre un peu pour être sûr que le clavier est fermé
            setTimeout(() => {
                chatContainer.classList.remove('ios-keyboard-open');
                helperButton.style.display = 'none';
            }, 300);
        });
        
        // Bouton d'aide pour ajuster la vue
        helperButton.addEventListener('click', function() {
            textarea.scrollIntoView(false);
            setTimeout(() => {
                // Donner à nouveau le focus au textarea
                textarea.focus();
            }, 100);
        });
        
        // Gérer l'envoi de message pour iOS
        const sendButton = container.querySelector('.send-btn');
        if (sendButton) {
            // Cloner et remplacer pour éviter les conflits avec les gestionnaires existants
            const newSendButton = sendButton.cloneNode(true);
            sendButton.parentNode.replaceChild(newSendButton, sendButton);
            
            newSendButton.addEventListener('click', function() {
                // L'event normal va envoyer le message
                
                // Après envoi, attendre que le clavier se ferme puis ajuster la vue
                setTimeout(() => {
                    chatContainer.classList.remove('ios-keyboard-open');
                    helperButton.style.display = 'none';
                    
                    // Scroll au bas pour voir les nouveaux messages
                    if (messagesContainer) {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                }, 300);
            });
        }
        
        // Gérer les rotations d'écran
        window.addEventListener('orientationchange', function() {
            // Attendre que la rotation soit complète
            setTimeout(() => {
                if (document.activeElement === textarea) {
                    // Si le textarea a le focus, s'assurer qu'il est visible
                    textarea.scrollIntoView(false);
                }
            }, 300);
        });
        
        console.log("Correctifs iOS pour le chat appliqués");
    }
})();