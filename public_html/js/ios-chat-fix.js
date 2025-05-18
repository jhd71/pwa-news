// ios-chat-fix.js - Solution améliorée pour le problème de clavier iOS dans le chat

(function() {
    // Ne s'exécuter que sur iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (!isIOS) return;
    
    console.log("iOS détecté - Activation des correctifs améliorés pour le chat");
    
    // Attendre que le DOM soit chargé
    const onReady = function() {
        // S'assurer que le gestionnaire de chat est initialisé
        const waitForChatManager = setInterval(() => {
            if (window.chatManager && window.chatManager.initialized) {
                clearInterval(waitForChatManager);
                setupIOSChatFixes();
            } else if (document.querySelector('.chat-container')) {
                // Alternative si chatManager n'est pas disponible
                clearInterval(waitForChatManager);
                setupIOSChatFixes();
            }
        }, 500);
        
        // Arrêter la vérification après 10 secondes si rien n'est trouvé
        setTimeout(() => {
            clearInterval(waitForChatManager);
        }, 10000);
    };
    
    // Vérifier si le DOM est déjà chargé
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", onReady);
    } else {
        onReady();
    }
    
    function setupIOSChatFixes() {
        // Référence aux éléments du chat
        const container = window.chatManager.container;
        if (!container) return;
        
        // Trouver la zone de texte du chat
        const textarea = container.querySelector('.chat-input textarea');
        const chatContainer = container.querySelector('.chat-container');
        const messagesContainer = container.querySelector('.chat-messages');
        const chatInput = container.querySelector('.chat-input');
        
        if (!textarea || !chatContainer) return;
        
        console.log("Mise en place des correctifs améliorés pour le clavier iOS");
        
        // Ajouter des styles spécifiques à iOS
        const style = document.createElement('style');
        style.textContent = `
            /* Styles de base pour le chat sur iOS */
            html.ios-device, body.ios-device {
                height: -webkit-fill-available;
                overflow: hidden;
                position: fixed;
                width: 100%;
                height: 100%;
            }
            
            .chat-container {
                max-height: 75vh !important;
                height: 75vh !important;
                overflow: hidden !important;
            }
            
            /* Styles pour quand le clavier est ouvert */
            .chat-container.ios-keyboard-open {
                position: absolute !important;
                height: 50vh !important;
                max-height: 50vh !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: auto !important;
                border-radius: 0 !important;
                z-index: 99999 !important;
            }
            
            .chat-container.ios-keyboard-open .chat-messages {
                height: calc(50vh - 110px) !important;
                max-height: calc(50vh - 110px) !important;
                overflow-y: auto !important;
            }
            
            .chat-container.ios-keyboard-open .chat-input {
                position: fixed !important;
                bottom: 50vh !important;
                left: 0 !important;
                right: 0 !important;
                background: var(--chat-gradient) !important;
                border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
                padding: 10px !important;
                z-index: 100000 !important;
            }
            
            /* Overlay pour désactiver le reste de la page */
            .ios-keyboard-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.7);
                z-index: 99990;
                display: none;
            }
            
            .ios-keyboard-overlay.active {
                display: block;
            }
            
            /* Bouton d'aide iOS */
            .ios-keyboard-helper {
                position: fixed;
                top: 52vh;
                left: 50%;
                transform: translateX(-50%);
                z-index: 100001;
                background: rgba(76, 175, 80, 0.9);
                color: white;
                border: none;
                border-radius: 20px;
                padding: 10px 20px;
                font-size: 16px;
                font-weight: bold;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                display: none;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% { transform: translateX(-50%) scale(1); }
                50% { transform: translateX(-50%) scale(1.05); }
                100% { transform: translateX(-50%) scale(1); }
            }
            
            /* Ajustement quand on est en mode plein écran */
            @media (display-mode: standalone) {
                .chat-container.ios-keyboard-open {
                    height: 40vh !important;
                    max-height: 40vh !important;
                }
                
                .chat-container.ios-keyboard-open .chat-messages {
                    height: calc(40vh - 110px) !important;
                    max-height: calc(40vh - 110px) !important;
                }
                
                .chat-container.ios-keyboard-open .chat-input {
                    bottom: 60vh !important;
                }
                
                .ios-keyboard-helper {
                    top: 42vh;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Ajouter l'overlay
        const overlay = document.createElement('div');
        overlay.className = 'ios-keyboard-overlay';
        document.body.appendChild(overlay);
        
        // Créer un bouton d'aide
        const helperButton = document.createElement('button');
        helperButton.className = 'ios-keyboard-helper';
        helperButton.innerHTML = '⬆️ Voir mon message';
        helperButton.style.display = 'none';
        document.body.appendChild(helperButton);
        
        // Ajouter classe à HTML et BODY
        document.documentElement.classList.add('ios-device');
        document.body.classList.add('ios-device');
        
        // Variables pour le mode visualViewport (iOS 13+)
        let keyboardHeight = 0;
        let isKeyboardVisible = false;
        
        // Utiliser VisualViewport API si disponible (iOS 13+)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                // Détecter si le clavier est visible
                const heightDiff = window.innerHeight - window.visualViewport.height;
                
                if (heightDiff > 150) {
                    // Le clavier est probablement visible
                    keyboardHeight = heightDiff;
                    isKeyboardVisible = true;
                    
                    if (document.activeElement === textarea) {
                        activateKeyboardMode();
                    }
                } else {
                    // Le clavier est probablement caché
                    isKeyboardVisible = false;
                    deactivateKeyboardMode();
                }
            });
            
            window.visualViewport.addEventListener('scroll', () => {
                if (isKeyboardVisible && document.activeElement === textarea) {
                    // Ajuster la position en fonction du scroll
                    chatInput.style.bottom = `${keyboardHeight - window.visualViewport.offsetTop}px`;
                }
            });
        }
        
        // Gérer le focus sur le textarea
        textarea.addEventListener('focus', function() {
            console.log("Focus sur textarea - mode iOS amélioré");
            
            // Attendre que le clavier apparaisse
            setTimeout(() => {
                activateKeyboardMode();
            }, 300);
        });
        
        // Gérer la perte de focus
        textarea.addEventListener('blur', function() {
            console.log("Blur du textarea - retour à la normale");
            
            // Attendre un peu pour être sûr que le clavier est fermé
            setTimeout(() => {
                deactivateKeyboardMode();
            }, 300);
        });
        
        // Bouton d'aide
        helperButton.addEventListener('click', function() {
            // Ajouter un effet visuel temporaire
            helperButton.textContent = "✓ Visible!";
            helperButton.style.background = "#4CAF50";
            
            // Faire défiler jusqu'à la zone de saisie
            chatInput.scrollIntoView({ behavior: 'smooth', block: 'end' });
            
            // Donner le focus au textarea
            setTimeout(() => {
                textarea.focus();
                
                // Restaurer le texte du bouton
                setTimeout(() => {
                    helperButton.innerHTML = "⬆️ Voir mon message";
                    helperButton.style.background = "rgba(76, 175, 80, 0.9)";
                }, 1500);
            }, 300);
        });
        
        // Gérer l'envoi de message
        const sendButton = container.querySelector('.send-btn');
        if (sendButton) {
            // Cloner et remplacer le bouton
            const newSendButton = sendButton.cloneNode(true);
            sendButton.parentNode.replaceChild(newSendButton, sendButton);
            
            newSendButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Envoyer le message via le chatManager
                const content = textarea.value.trim();
                if (content) {
                    // Vider d'abord le textarea
                    const message = content;
                    textarea.value = '';
                    
                    // Puis envoyer le message
                    window.chatManager.sendMessage(message);
                    
                    // Désactiver le mode clavier
                    setTimeout(() => {
                        deactivateKeyboardMode();
                    }, 300);
                }
            });
        }
        
        // Fonction pour activer le mode clavier
        function activateKeyboardMode() {
            chatContainer.classList.add('ios-keyboard-open');
            overlay.classList.add('active');
            helperButton.style.display = 'block';
            
            // Scroll vers le bas
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
            
            // Scroller le conteneur du chat vers le haut
            chatContainer.style.top = "0";
            
            // Empêcher le scroll du body
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        }
        
        // Fonction pour désactiver le mode clavier
        function deactivateKeyboardMode() {
            chatContainer.classList.remove('ios-keyboard-open');
            overlay.classList.remove('active');
            helperButton.style.display = 'none';
            
            // Restaurer la position
            chatContainer.style.top = "";
            chatInput.style.bottom = "";
            
            // Restaurer le scroll du body
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            
            // Scroll à nouveau vers le bas pour voir les nouveaux messages
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
        
        // Gérer l'overlay
        overlay.addEventListener('click', function() {
            // Enlever le focus du textarea quand on clique ailleurs
            textarea.blur();
        });
        
        // Gérer la rotation d'écran
        window.addEventListener('orientationchange', function() {
            // Fermer le clavier lors de la rotation
            textarea.blur();
            
            // Réinitialiser après la rotation
            setTimeout(() => {
                deactivateKeyboardMode();
            }, 300);
        });
        
        console.log("Correctifs iOS améliorés pour le chat appliqués");
    }
})();