// js/chat-fix.js
document.addEventListener('DOMContentLoaded', function() {
  const chatBtn = document.getElementById('chatToggleBtn');
  if (chatBtn) {
    // Supprimer les écouteurs existants
    const newChatBtn = chatBtn.cloneNode(true);
    chatBtn.parentNode.replaceChild(newChatBtn, chatBtn);
    
    // Ajouter un nouvel écouteur
    newChatBtn.addEventListener('click', function() {
      showSimpleChat();
    });
  }
});

function showSimpleChat() {
  // Vérifier si le chat existe déjà
  let chatContainer = document.getElementById('simple-chat-container');
  
  if (!chatContainer) {
    // Créer une nouvelle fenêtre de chat simple
    chatContainer = document.createElement('div');
    chatContainer.id = 'simple-chat-container';
    chatContainer.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 320px;
      height: 450px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 0 15px rgba(0,0,0,0.25);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;
    
    // Contenu du chat
    chatContainer.innerHTML = `
      <div style="background: #6a4fab; color: white; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; font-size: 16px;">Chat Actu&Média</h3>
        <button id="closeSimpleChat" style="background: none; border: none; color: white; font-size: 22px; cursor: pointer; line-height: 1;">×</button>
      </div>
      <div id="simpleMessages" style="flex: 1; overflow-y: auto; padding: 10px; background: #f5f5f5;">
        <div style="background: white; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
          <div>Bienvenue dans le chat! Commencez à écrire pour discuter.</div>
          <div style="font-size: 0.8em; color: gray; text-align: right;">${new Date().toLocaleTimeString()}</div>
        </div>
      </div>
      <form id="simpleChatForm" style="display: flex; padding: 10px; border-top: 1px solid #ddd;">
        <input type="text" placeholder="Écrivez un message..." style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        <button type="submit" style="background: #6a4fab; color: white; border: none; margin-left: 8px; padding: 0 12px; border-radius: 4px;">
          <span class="material-icons" style="font-size: 18px;">send</span>
        </button>
      </form>
    `;
    
    document.body.appendChild(chatContainer);
    
    // Ajouter la fonctionnalité de fermeture
    document.getElementById('closeSimpleChat').addEventListener('click', function() {
      chatContainer.style.display = 'none';
    });
    
    // Empêcher la soumission du formulaire de rafraîchir la page
    document.getElementById('simpleChatForm').addEventListener('submit', function(e) {
      e.preventDefault(); // Empêche le comportement par défaut (refresh)
      
      const input = this.querySelector('input');
      const message = input.value.trim();
      
      if (message) {
        // Afficher le message localement
        const messagesContainer = document.getElementById('simpleMessages');
        const messageEl = document.createElement('div');
        messageEl.style.cssText = 'background: #e3f2fd; padding: 10px; border-radius: 8px; margin-bottom: 10px; margin-left: 20%;';
        messageEl.innerHTML = `
          <div>${message}</div>
          <div style="font-size: 0.8em; color: gray; text-align: right;">${new Date().toLocaleTimeString()}</div>
        `;
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Vider l'input
        input.value = '';
      }
      
      return false; // Double sécurité pour empêcher le refresh
    });
  } else {
    // Basculer la visibilité
    chatContainer.style.display = chatContainer.style.display === 'none' ? 'flex' : 'none';
  }
}