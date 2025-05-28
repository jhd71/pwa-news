// ios-chat-fix.js - Solution optimisée pour le problème de clavier iOS dans le chat

(function() {
    // Détection iOS améliorée
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (!isIOS) {
        console.log("Non-iOS - Correctifs chat iOS ignorés");
        return;
    }
    
    console.log("iOS détecté - Activation des correctifs optimisés pour le chat");
    
    let chatFixesApplied = false;
    let keyboardHeight = 0;
    let isKeyboardVisible = false;
    let originalViewportHeight = window.innerHeight;
    
    // Attendre que le DOM soit chargé
    const onReady = function() {
        // S'assurer que le gestionnaire de chat est initialisé avec retry
        let attempts = 0;
        const maxAttempts = 20; // 10 secondes max
        
        const waitForChatManager = setInterval(() => {
            attempts++;
            
            if (window.chatManager && window.chatManager.initialized) {
                clearInterval(waitForChatManager);
                setupIOSChatFixes();
            } else if (document.querySelector('.chat-container')) {
                // Alternative si chatManager n'est pas disponible
                clearInterval(waitForChatManager);
                setupIOSChatFixes();
            } else if (attempts >= maxAttempts) {
                console.log("ChatManager non trouvé après 10 secondes - correctifs iOS ignorés");
                clearInterval(waitForChatManager);
            }
        }, 500);
    };
    
    // Vérifier si le DOM est déjà chargé
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", onReady);
    } else {
        onReady();
    }
    
    function setupIOSChatFixes() {
        if (chatFixesApplied) {
            console.log("Correctifs iOS chat déjà appliqués");
            return;
        }
        
        // Référence aux éléments du chat
        const container = window.chatManager ? window.chatManager.container : document.querySelector('.chat-container');
        if (!container) {
            console.log("Container chat non trouvé");
            return;
        }
        
        // Trouver les éléments du chat
        const textarea = container.querySelector('.chat-input textarea') || container.querySelector('textarea');
        const chatContainer = container.querySelector('.chat-container') || container;
        const messagesContainer = container.querySelector('.chat-messages');
        const chatInput = container.querySelector('.chat-input');
        
        if (!textarea || !chatContainer) {
            console.log("Éléments chat non trouvés");
            return;
        }
        
        console.log("Mise en place des correctifs optimisés pour le clavier iOS");
        
        // Ajouter des styles spécifiques à iOS améliorés
        const style = document.createElement('style');
        style.id = 'ios-chat-fixes-style';
        style.textContent = `
            /* Base pour iOS */
            .ios-device {
                height: 100vh;
                height: -webkit-fill-available;
            }
            
            .ios-device body {
                min-height: 100vh;
                min-height: -webkit-fill-available;
                height: 100vh;
                height: -webkit-fill-available;
            }
            
            /* Chat container base */
            .chat-container {
                max-height: 70vh !important;
                height: 70vh !important;
                overflow: hidden !important;
                position: fixed !important;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
            
            /* Mode clavier iOS actif */
            .ios-keyboard-active .chat-container {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: auto !important;
                height: 45vh !important;
                max-height: 45vh !important;
                z-index: 99999 !important;
                border-radius: 0 !important;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
            }
            
            .ios-keyboard-active .chat-messages {
                height: calc(45vh - 120px) !important;
                max-height: calc(45vh - 120px) !important;
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch !important;
            }
            
            .ios-keyboard-active .chat-input {
                position: fixed !important;
                bottom: 55vh !important;
                left: 0 !important;
                right: 0 !important;
                background: var(--chat-gradient, linear-gradient(135deg, #667eea 0%, #764ba2 100%)) !important;
                border-top: 1px solid rgba(255, 255, 255, 0.2) !important;
                padding: 12px !important;
                z-index: 100000 !important;
                box-shadow: 0 -2px 10px rgba(0,0,0,0.3) !important;
            }
            
            /* Corrections Visual Viewport API pour iOS 13+ */
            @supports (height: 100dvh) {
                .ios-keyboard-active .chat-input {
                    bottom: 65vh !important;
                }
                
                .ios-keyboard-helper {
                    top: 37vh !important;
                }
            }
            
            /* Corrections pour iPhone avec notch */
            .ios-notch.ios-keyboard-active .chat-container {
                top: env(safe-area-inset-top, 0) !important;
                height: calc(45vh - env(safe-area-inset-top, 0px)) !important;
            }
            
            /* Performance optimizations */
            .ios-keyboard-active .chat-container,
            .ios-keyboard-active .chat-input,
            .ios-keyboard-helper {
                will-change: transform, height;
                -webkit-transform: translateZ(0);
                transform: translateZ(0);
                -webkit-backface-visibility: hidden;
                backface-visibility: hidden;
            }
        `;
        document.head.appendChild(style);
        
        // Créer les éléments d'interface
        createIOSChatInterface();
        
        // Variables pour Visual Viewport API (iOS 13+)
        setupVisualViewportAPI();
        
        // Gestionnaires d'événements
        setupChatEventHandlers(textarea, chatContainer, messagesContainer, chatInput);
        
        chatFixesApplied = true;
        console.log("Correctifs iOS optimisés pour le chat appliqués avec succès");
    }
    
    function createIOSChatInterface() {
        // Créer l'overlay
        if (!document.querySelector('.ios-keyboard-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'ios-keyboard-overlay';
            document.body.appendChild(overlay);
        }
        
        // Créer le bouton d'aide
        if (!document.querySelector('.ios-keyboard-helper')) {
            const helperButton = document.createElement('button');
            helperButton.className = 'ios-keyboard-helper';
            helperButton.innerHTML = '⬆️ Voir votre message';
            document.body.appendChild(helperButton);
        }
    }
    
    function setupVisualViewportAPI() {
        // Utiliser Visual Viewport API pour iOS 13+
        if (window.visualViewport) {
            console.log("Visual Viewport API disponible - utilisation pour iOS 13+");
            
            window.visualViewport.addEventListener('resize', () => {
                const heightDiff = window.innerHeight - window.visualViewport.height;
                
                if (heightDiff > 150) {
                    // Clavier visible
                    keyboardHeight = heightDiff;
                    isKeyboardVisible = true;
                    
                    if (document.activeElement && document.activeElement.matches('.chat-input textarea, textarea')) {
                        activateKeyboardMode();
                    }
                } else {
                    // Clavier caché
                    isKeyboardVisible = false;
                    keyboardHeight = 0;
                    deactivateKeyboardMode();
                }
            });
            
            window.visualViewport.addEventListener('scroll', () => {
                if (isKeyboardVisible) {
                    const chatInput = document.querySelector('.chat-input');
                    if (chatInput) {
                        chatInput.style.bottom = `${keyboardHeight - window.visualViewport.offsetTop}px`;
                    }
                }
            });
        } else {
            console.log("Visual Viewport API non disponible - utilisation des méthodes alternatives");
            
            // Fallback pour iOS plus anciens
            window.addEventListener('resize', () => {
                const currentHeight = window.innerHeight;
                const heightDiff = originalViewportHeight - currentHeight;
                
                if (heightDiff > 150) {
                    isKeyboardVisible = true;
                    keyboardHeight = heightDiff;
                } else {
                    isKeyboardVisible = false;
                    keyboardHeight = 0;
                }
            });
        }
    }
    
    function setupChatEventHandlers(textarea, chatContainer, messagesContainer, chatInput) {
        const overlay = document.querySelector('.ios-keyboard-overlay');
        const helperButton = document.querySelector('.ios-keyboard-helper');
        
        // Focus sur le textarea
        textarea.addEventListener('focus', function(e) {
            console.log("Focus textarea iOS - activation mode clavier");
            
            // Petit délai pour laisser le clavier apparaître
            setTimeout(() => {
                activateKeyboardMode();
                
                // Scroll vers le textarea après activation
                setTimeout(() => {
                    textarea.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'nearest',
                        inline: 'nearest'
                    });
                }, 100);
            }, 300);
        });
        
        // Perte de focus
        textarea.addEventListener('blur', function(e) {
            console.log("Blur textarea iOS - attente désactivation");
            
            // Délai plus long pour iOS
            setTimeout(() => {
                if (document.activeElement !== textarea) {
                    deactivateKeyboardMode();
                }
            }, 500);
        });
        
        // Gestionnaire pour le bouton d'aide
        if (helperButton) {
            helperButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Animation du bouton
                this.style.transform = 'translateX(-50%) scale(0.95)';
                this.innerHTML = '✓ Message visible !';
                this.style.background = 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)';
                
                // Scroll vers la zone de saisie
                const chatInput = document.querySelector('.chat-input');
                if (chatInput) {
                    chatInput.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'end',
                        inline: 'nearest'
                    });
                }
                
                // Focus sur le textarea
                setTimeout(() => {
                    if (textarea) {
                        textarea.focus();
                    }
                    
                    // Restaurer le bouton
                    setTimeout(() => {
                        this.style.transform = 'translateX(-50%) scale(1)';
                        this.innerHTML = '⬆️ Voir votre message';
                        this.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
                    }, 1500);
                }, 300);
            });
        }
        
        // Gestionnaire pour l'overlay
        if (overlay) {
            overlay.addEventListener('click', function(e) {
                e.preventDefault();
                console.log("Clic overlay - fermeture clavier");
                
                if (textarea) {
                    textarea.blur();
                }
                
                setTimeout(() => {
                    deactivateKeyboardMode();
                }, 100);
            });
        }
        
        // Gestionnaire pour l'envoi de message optimisé
        const sendButton = chatContainer.querySelector('.send-btn');
        if (sendButton) {
            // Remplacer le bouton pour éviter les conflits
            const newSendButton = sendButton.cloneNode(true);
            sendButton.parentNode.replaceChild(newSendButton, sendButton);
            
            newSendButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const content = textarea.value.trim();
                if (content && window.chatManager) {
                    // Vider le textarea
                    textarea.value = '';
                    
                    // Envoyer le message
                    window.chatManager.sendMessage(content);
                    
                    // Désactiver le mode clavier
                    textarea.blur();
                    setTimeout(() => {
                        deactivateKeyboardMode();
                    }, 300);
                }
            });
        }
        
        // Gestion de la rotation d'écran
        window.addEventListener('orientationchange', function() {
            console.log("Changement d'orientation iOS");
            
            // Forcer la fermeture du clavier
            if (textarea) {
                textarea.blur();
            }
            
            setTimeout(() => {
                deactivateKeyboardMode();
                originalViewportHeight = window.innerHeight;
                
                // Recalculer les hauteurs après rotation
                if (window.setIOSVH) {
                    window.setIOSVH();
                }
            }, 500);
        });
        
        // Prévenir le scroll du body pendant l'utilisation du chat
        chatContainer.addEventListener('touchmove', function(e) {
            if (document.body.classList.contains('ios-keyboard-active')) {
                e.stopPropagation();
            }
        }, { passive: false });
    }
    
    function activateKeyboardMode() {
        console.log("Activation mode clavier iOS");
        
        const overlay = document.querySelector('.ios-keyboard-overlay');
        const helperButton = document.querySelector('.ios-keyboard-helper');
        const chatContainer = document.querySelector('.chat-container');
        const messagesContainer = document.querySelector('.chat-messages');
        
        // Ajouter les classes d'activation
        document.body.classList.add('ios-keyboard-active');
        document.documentElement.classList.add('ios-keyboard-active');
        
        // Activer l'overlay et le bouton d'aide
        if (overlay) overlay.classList.add('active');
        if (helperButton) helperButton.style.display = 'block';
        
        // Empêcher le scroll du body
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        
        // Scroll vers le bas des messages
        if (messagesContainer) {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
        }
        
        // Animation d'entrée
        if (chatContainer) {
            chatContainer.style.transform = 'translateZ(0)';
        }
    }
    
    function deactivateKeyboardMode() {
        console.log("Désactivation mode clavier iOS");
        
        const overlay = document.querySelector('.ios-keyboard-overlay');
        const helperButton = document.querySelector('.ios-keyboard-helper');
        const chatContainer = document.querySelector('.chat-container');
        const chatInput = document.querySelector('.chat-input');
        const messagesContainer = document.querySelector('.chat-messages');
        
        // Retirer les classes d'activation
        document.body.classList.remove('ios-keyboard-active');
        document.documentElement.classList.remove('ios-keyboard-active');
        
        // Désactiver l'overlay et le bouton d'aide
        if (overlay) overlay.classList.remove('active');
        if (helperButton) helperButton.style.display = 'none';
        
        // Restaurer le scroll du body
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        
        // Nettoyer les styles inline
        if (chatContainer) {
            chatContainer.style.top = '';
            chatContainer.style.transform = '';
        }
        
        if (chatInput) {
            chatInput.style.bottom = '';
        }
        
        // Scroll final vers le bas des messages
        if (messagesContainer) {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 300);
        }
        
        // Reset des variables
        isKeyboardVisible = false;
        keyboardHeight = 0;
    }
    
    // Nettoyage lors du départ de la page
    window.addEventListener('beforeunload', function() {
        if (chatFixesApplied) {
            deactivateKeyboardMode();
            
            // Supprimer le style
            const style = document.getElementById('ios-chat-fixes-style');
            if (style) style.remove();
        }
    });
    
})();-container {
                    height: 40dvh !important;
                    max-height: 40dvh !important;
                }
                
                .ios-keyboard-active .chat-messages {
                    height: calc(40dvh - 120px) !important;
                    max-height: calc(40dvh - 120px) !important;
                }
                
                .ios-keyboard-active .chat-input {
                    bottom: 60dvh !important;
                }
            }
            
            /* Overlay pour désactiver le reste */
            .ios-keyboard-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.8);
                z-index: 99990;
                display: none;
                backdrop-filter: blur(3px);
                -webkit-backdrop-filter: blur(3px);
            }
            
            .ios-keyboard-overlay.active {
                display: block;
            }
            
            /* Bouton d'aide amélioré */
            .ios-keyboard-helper {
                position: fixed;
                top: 47vh;
                left: 50%;
                transform: translateX(-50%);
                z-index: 100001;
                background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                color: white;
                border: none;
                border-radius: 25px;
                padding: 12px 24px;
                font-size: 16px;
                font-weight: 600;
                box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
                display: none;
                animation: ios-helper-pulse 2s infinite;
                cursor: pointer;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            }
            
            @keyframes ios-helper-pulse {
                0% { 
                    transform: translateX(-50%) scale(1); 
                    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
                }
                50% { 
                    transform: translateX(-50%) scale(1.05); 
                    box-shadow: 0 6px 20px rgba(76, 175, 80, 0.6);
                }
                100% { 
                    transform: translateX(-50%) scale(1); 
                    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
                }
            }
            
            /* PWA standalone mode adjustments */
            @media (display-mode: standalone) {
                .ios-keyboard-active .chat-container {
                    height: 35vh !important;
                    max-height: 35vh !important;
                }
                
                .ios-keyboard-active .chat-messages {
                    height: calc(35vh - 120px) !important;
                    max-height: calc(35vh - 120px) !important;
                }
                
                .ios-keyboard-active .chat