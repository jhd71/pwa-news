// Correction à ajouter dans votre fichier fixes.js ou directement dans chatManager.js

function fixChatDisplay() {
  // Vérifier si le conteneur de chat existe
  const chatContainer = document.getElementById('chat-container');
  
  if (!chatContainer) {
    console.error("Le conteneur de chat n'existe pas");
    return;
  }
  
  // Vérifier la structure du chat
  let chatContent = chatContainer.querySelector('.chat-content');
  let chatMessages = chatContainer.querySelector('#chatMessages');
  
  // Si .chat-content n'existe pas, créer la structure complète
  if (!chatContent) {
    console.log("Restructuration complète du chat");
    
    // Conserver l'en-tête existant si possible
    const chatHeader = chatContainer.querySelector('.chat-header');
    const chatInputForm = chatContainer.querySelector('form') || chatContainer.querySelector('.chat-input-form');
    
    // Vider le conteneur pour reconstruire
    chatContainer.innerHTML = '';
    
    // Recréer la structure complète
    if (chatHeader) {
      chatContainer.appendChild(chatHeader);
    } else {
      // Créer un nouvel en-tête si nécessaire
      const newHeader = document.createElement('div');
      newHeader.className = 'chat-header';
      newHeader.innerHTML = `
        <h3>Chat Actu&Média</h3>
        <button id="closeChatBtn" class="close-chat-btn">
          <span class="material-icons">close</span>
        </button>
      `;
      chatContainer.appendChild(newHeader);
      
      // Ajouter l'écouteur d'événement pour le bouton de fermeture
      document.getElementById('closeChatBtn').addEventListener('click', () => {
        chatContainer.classList.add('hidden');
      });
    }
    
    // Créer la zone de contenu
    chatContent = document.createElement('div');
    chatContent.className = 'chat-content';
    
    // Créer la zone des messages
    chatMessages = document.createElement('div');
    chatMessages.id = 'chatMessages';
    chatMessages.className = 'chat-messages';
    chatContent.appendChild(chatMessages);
    
    // Réutiliser le formulaire existant ou en créer un nouveau
    if (chatInputForm) {
      chatContent.appendChild(chatInputForm);
    } else {
      const newForm = document.createElement('form');
      newForm.id = 'chatForm';
      newForm.className = 'chat-input-form';
      newForm.innerHTML = `
        <input 
          type="text" 
          id="chatInput" 
          placeholder="Écrivez un message..." 
          required
        >
        <button type="submit">
          <span class="material-icons">send</span>
        </button>
      `;
      chatContent.appendChild(newForm);
      
      // Ajouter l'écouteur d'événement pour l'envoi
      newForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (message) {
          console.log("Message à envoyer:", message);
          // Appeler la fonction d'envoi du ChatManager si disponible
          if (window.chatManager && typeof window.chatManager.sendMessage === 'function') {
            window.chatManager.sendMessage(e);
          } else {
            console.error("ChatManager non disponible");
            
            // Ajouter visuellement le message en attendant
            const messagesContainer = document.getElementById('chatMessages');
            if (messagesContainer) {
              const messageElement = document.createElement('div');
              messageElement.classList.add('chat-message', 'sent');
              messageElement.innerHTML = `
                <div class="message-content">${message}</div>
                <div class="message-timestamp">
                  ${new Date().toLocaleTimeString()}
                </div>
              `;
              messagesContainer.appendChild(messageElement);
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
            
            input.value = '';
          }
        }
      });
    }
    
    chatContainer.appendChild(chatContent);
    
    // Ajouter du style CSS pour s'assurer que le chat s'affiche correctement
    const style = document.createElement('style');
    style.textContent = `
      .chat-container {
        display: flex;
        flex-direction: column;
        position: fixed;
        bottom: 70px;
        right: 20px;
        width: 320px;
        height: 450px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        z-index: 1000;
      }
      
      .chat-container.hidden {
        display: none;
      }
      
      .chat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        background: #1a237e;
        color: white;
        border-radius: 10px 10px 0 0;
      }
      
      .chat-content {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden;
      }
      
      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
        background: #f5f5f5;
      }
      
      .chat-input-form {
        display: flex;
        padding: 10px;
        border-top: 1px solid #ddd;
      }
      
      .chat-input-form input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 20px;
        margin-right: 10px;
      }
      
      .chat-message {
        margin-bottom: 10px;
        padding: 8px 12px;
        border-radius: 10px;
        max-width: 80%;
      }
      
      .chat-message.sent {
        align-self: flex-end;
        background-color: #e3f2fd;
        margin-left: auto;
      }
      
      .chat-message.received {
        align-self: flex-start;
        background-color: #ffffff;
      }
      
      .message-content {
        word-break: break-word;
      }
      
      .message-timestamp {
        font-size: 0.7em;
        color: #757575;
        text-align: right;
        margin-top: 4px;
      }
    `;
    document.head.appendChild(style);
  } 
  // Si .chat-content existe mais pas #chatMessages
  else if (!chatMessages) {
    console.log("Ajout de la zone de messages manquante");
    
    // Créer la zone des messages
    chatMessages = document.createElement('div');
    chatMessages.id = 'chatMessages';
    chatMessages.className = 'chat-messages';
    
    // Insérer au début du .chat-content
    chatContent.insertBefore(chatMessages, chatContent.firstChild);
  }
  
  // Vérifier si la zone de messages est vide et y ajouter un message de bienvenue
  if (chatMessages && chatMessages.children.length === 0) {
    const welcomeMessage = document.createElement('div');
    welcomeMessage.classList.add('chat-message', 'received');
    welcomeMessage.innerHTML = `
      <div class="message-content">Bienvenue dans le chat Actu&Média ! Commencez à écrire pour discuter.</div>
      <div class="message-timestamp">${new Date().toLocaleTimeString()}</div>
    `;
    chatMessages.appendChild(welcomeMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  console.log("Structure du chat vérifiée et corrigée si nécessaire");
}

// Exécuter la fonction après le chargement de la page et l'initialisation du chat
document.addEventListener('DOMContentLoaded', () => {
  // Attendre un peu que ChatManager soit initialisé
  setTimeout(fixChatDisplay, 1500);
  
  // Également corriger l'affichage lorsque le chat est ouvert
  const chatToggleBtn = document.getElementById('chatToggleBtn');
  if (chatToggleBtn) {
    chatToggleBtn.addEventListener('click', () => {
      setTimeout(fixChatDisplay, 100);
    });
  }
});