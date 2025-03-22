// pure-chat.js
document.addEventListener('DOMContentLoaded', function() {
  // Obtenir une référence au bouton de chat
  const chatButton = document.getElementById('chatToggleBtn');
  
  if (chatButton) {
    // Remplacer l'écouteur existant
    const newButton = chatButton.cloneNode(true);
    chatButton.parentNode.replaceChild(newButton, chatButton);
    
    // Ajouter un nouvel écouteur
    newButton.addEventListener('click', function() {
      // Vérifier si le chat existe déjà
      let chatBox = document.getElementById('pure-chat-box');
      
      if (chatBox) {
        // Si le chat existe déjà, basculer sa visibilité
        chatBox.style.display = chatBox.style.display === 'none' ? 'flex' : 'none';
      } else {
        // Créer un nouveau chat
        createSimpleChat();
      }
    });
  }
});

function createSimpleChat() {
  // Créer l'élément conteneur
  const chatBox = document.createElement('div');
  chatBox.id = 'pure-chat-box';
  chatBox.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    width: 300px;
    height: 400px;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    z-index: 9999;
    overflow: hidden;
  `;
  
  // Ajouter le contenu HTML
  chatBox.innerHTML = `
    <div style="background-color: #6a4fab; color: white; padding: 10px; display: flex; justify-content: space-between; align-items: center;">
      <h3 style="margin: 0; font-size: 16px;">Chat Actu&Media</h3>
      <button id="close-chat-btn" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
    </div>
    
    <div id="chat-messages" style="flex: 1; overflow-y: auto; padding: 10px; background-color: #f5f5f5;">
      <div style="background-color: white; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
        <div>Bienvenue dans le chat! Commencez à écrire pour discuter.</div>
        <div style="font-size: 0.8em; color: gray; text-align: right;">${new Date().toLocaleTimeString()}</div>
      </div>
    </div>
    
    <form id="chat-form" style="display: flex; padding: 10px; border-top: 1px solid #ddd; background-color: white;">
      <input type="text" id="message-input" placeholder="Écrivez un message..." style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
      <button type="submit" style="background-color: #6a4fab; color: white; border: none; padding: 8px 12px; margin-left: 8px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
        <span class="material-icons" style="font-size: 18px;">send</span>
      </button>
    </form>
  `;
  
  // Ajouter à la page
  document.body.appendChild(chatBox);
  
  // Gérer le bouton de fermeture
  document.getElementById('close-chat-btn').addEventListener('click', function() {
    chatBox.style.display = 'none';
  });
  
  // Gérer l'envoi de messages
  document.getElementById('chat-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (message) {
      // Ajouter le message au chat
      addMessage(message, true);
      
      // Effacer l'input
      input.value = '';
    }
  });
}

function addMessage(text, isUser = false) {
  const messagesContainer = document.getElementById('chat-messages');
  
  if (!messagesContainer) return;
  
  // Créer l'élément du message
  const messageElement = document.createElement('div');
  messageElement.style.cssText = isUser 
    ? 'background-color: #e3f2fd; padding: 10px; border-radius: 8px; margin-bottom: 10px; margin-left: 20%;'
    : 'background-color: white; padding: 10px; border-radius: 8px; margin-bottom: 10px; margin-right: 20%;';
  
  // Ajouter le contenu du message
  messageElement.innerHTML = `
    <div>${text}</div>
    <div style="font-size: 0.8em; color: gray; text-align: right;">${new Date().toLocaleTimeString()}</div>
  `;
  
  // Ajouter à la liste des messages
  messagesContainer.appendChild(messageElement);
  
  // Faire défiler vers le bas
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}