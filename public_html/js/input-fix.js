/**
 * Correctif spécifique pour l'input du chat sur mobile
 */
(function() {
    // S'exécuter quand le DOM est chargé
    document.addEventListener('DOMContentLoaded', function() {
        // Attendre que le chat soit initialisé
        const checkChatInterval = setInterval(function() {
            const chatContainer = document.querySelector('.chat-container');
            const chatInput = document.querySelector('.chat-input');
            
            if (chatContainer && chatInput) {
                clearInterval(checkChatInterval);
                initInputFix();
            }
        }, 500);
        
        function initInputFix() {
            console.log('Initialisation du correctif pour l\'input du chat');
            
            // Sélectionner les éléments du chat
            const chatContainer = document.querySelector('.chat-container');
            const chatInput = document.querySelector('.chat-input');
            const chatMessages = document.querySelector('.chat-messages');
            const textarea = chatInput.querySelector('textarea');
            
            // 1. S'assurer que l'input reste visible
            function ensureInputVisible() {
                if (getComputedStyle(chatInput).display === 'none') {
                    chatInput.style.display = 'flex';
                }
                
                if (parseFloat(getComputedStyle(chatInput).opacity) < 1) {
                    chatInput.style.opacity = '1';
                }
                
                chatInput.style.visibility = 'visible';
            }
            
            // 2. Créer un bouton pour revenir à l'input quand le clavier est ouvert
            function createInputAccessButton() {
                // Supprimer un bouton existant s'il y en a un
                const existingButton = document.getElementById('chat-input-access');
                if (existingButton) existingButton.remove();
                
                // Créer le nouveau bouton
                const button = document.createElement('button');
                button.id = 'chat-input-access';
                button.innerHTML = '<span style="font-size: 24px;">⬇️</span> Input';
                button.style.cssText = `
                    position: fixed;
                    bottom: 120px;
                    right: 20px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 30px;
                    padding: 8px 15px;
                    z-index: 10000;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                    display: none;
                    font-weight: bold;
                `;
                
                // Ajouter au document
                document.body.appendChild(button);
                
                // Gestionnaire d'événement
                button.addEventListener('click', function() {
                    ensureInputVisible();
                    
                    // Faire défiler jusqu'à l'input
                    chatInput.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    
                    // Si nécessaire, mettre le focus dans le textarea
                    setTimeout(() => textarea?.focus(), 300);
                });
                
                return button;
            }
            
            // Créer le bouton d'accès
            const accessButton = createInputAccessButton();
            
            // 3. Quand on clique dans la zone de messages, s'assurer que l'input reste visible
            chatMessages.addEventListener('click', function() {
                ensureInputVisible();
                
                // Afficher le bouton d'accès
                accessButton.style.display = 'block';
                
                // Le cacher après 5 secondes
                setTimeout(() => {
                    accessButton.style.display = 'none';
                }, 5000);
            });
            
            // 4. Quand le focus est dans le textarea, on est sûr que le clavier est ouvert
            textarea.addEventListener('focus', function() {
                chatContainer.classList.add('keyboard-open');
                chatInput.classList.add('keyboard-active');
                
                // Assurer que l'input est visible et accessible
                ensureInputVisible();
            });
            
            // 5. Quand on perd le focus, le clavier va probablement se fermer
            textarea.addEventListener('blur', function() {
                setTimeout(() => {
                    chatContainer.classList.remove('keyboard-open');
                    chatInput.classList.remove('keyboard-active');
                }, 300);
            });
            
            // 6. Vérifier périodiquement que l'input est visible
            setInterval(ensureInputVisible, 1000);
            
            console.log('Correctif input chat initialisé avec succès');
        }
    });
})();