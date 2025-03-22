// js/ui-fixes.js
document.addEventListener('DOMContentLoaded', function() {
  // Configurer le bouton Chat
  const chatBtn = document.getElementById('chatToggleBtn');
  if (chatBtn) {
    chatBtn.addEventListener('click', function() {
      // Créer une fenêtre de chat si elle n'existe pas
      let chatContainer = document.getElementById('chat-container');
      if (!chatContainer) {
        chatContainer = document.createElement('div');
        chatContainer.id = 'chat-container';
        chatContainer.className = 'chat-container';
        chatContainer.style.cssText = `
          position: fixed;
          bottom: 80px;
          right: 20px;
          width: 300px;
          height: 400px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0,0,0,0.2);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        `;
        
        chatContainer.innerHTML = `
          <div style="background: #6a4fab; color: white; padding: 10px; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0;">Chat</h3>
            <button id="closeChat" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
          </div>
          <div id="chatMessages" style="flex: 1; overflow-y: auto; padding: 10px; background: #f5f5f5;">
            <div style="background: white; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
              <div>Bienvenue dans le chat! Commencez à écrire pour discuter.</div>
              <div style="font-size: 0.8em; color: gray; text-align: right;">${new Date().toLocaleTimeString()}</div>
            </div>
          </div>
          <form id="chatForm" style="display: flex; padding: 10px; border-top: 1px solid #ddd;">
            <input type="text" placeholder="Écrivez un message..." style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <button type="submit" style="background: #6a4fab; color: white; border: none; margin-left: 8px; padding: 0 12px; border-radius: 4px;">
              <span class="material-icons" style="font-size: 18px;">send</span>
            </button>
          </form>
        `;
        
        document.body.appendChild(chatContainer);
        
        // Ajouter la fonctionnalité de fermeture
        document.getElementById('closeChat').addEventListener('click', function() {
          chatContainer.style.display = 'none';
        });
        
        // Gérer l'envoi de message
        document.getElementById('chatForm').addEventListener('submit', function(e) {
          e.preventDefault();
          const input = this.querySelector('input');
          const message = input.value.trim();
          
          if (message) {
            const messagesContainer = document.getElementById('chatMessages');
            const messageEl = document.createElement('div');
            messageEl.style.cssText = 'background: #e3f2fd; padding: 10px; border-radius: 8px; margin-bottom: 10px; margin-left: 20%;';
            messageEl.innerHTML = `
              <div>${message}</div>
              <div style="font-size: 0.8em; color: gray; text-align: right;">${new Date().toLocaleTimeString()}</div>
            `;
            messagesContainer.appendChild(messageEl);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            input.value = '';
          }
        });
      } else {
        // Basculer la visibilité
        chatContainer.style.display = chatContainer.style.display === 'none' ? 'flex' : 'none';
      }
    });
  }
  
  // Configurer le bouton S'inscrire
  const signupBtn = document.getElementById('signupBtn');
  if (signupBtn) {
    signupBtn.addEventListener('click', function() {
      // Créer un formulaire d'inscription
      const formContainer = document.createElement('div');
      formContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1001;
      `;
      
      formContainer.innerHTML = `
        <div style="background: white; width: 90%; max-width: 400px; border-radius: 10px; overflow: hidden;">
          <div style="background: #6a4fab; color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0;">Inscription</h3>
            <button id="closeForm" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
          </div>
          <div style="padding: 20px;">
            <form id="signup-form">
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Email</label>
                <input type="email" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Mot de passe</label>
                <input type="password" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Confirmer le mot de passe</label>
                <input type="password" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
              <button type="submit" style="background: #6a4fab; color: white; border: none; padding: 10px 0; width: 100%; border-radius: 4px; cursor: pointer;">S'inscrire</button>
            </form>
          </div>
        </div>
      `;
      
      document.body.appendChild(formContainer);
      
      // Gérer la fermeture
      document.getElementById('closeForm').addEventListener('click', function() {
        formContainer.remove();
      });
      
      // Gérer la soumission du formulaire
      document.getElementById('signup-form').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Inscription en cours de développement. Cette fonctionnalité sera bientôt disponible!');
        formContainer.remove();
      });
    });
  }
});