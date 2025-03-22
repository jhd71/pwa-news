// js/ui-fixes.js
document.addEventListener('DOMContentLoaded', function() {
  // Configurer le bouton Chat
  const chatBtn = document.getElementById('chatToggleBtn');
  if (chatBtn) {
    chatBtn.addEventListener('click', function() {
      showChat();
    });
  }
  
  // Configurer le bouton S'inscrire
  const signupBtn = document.getElementById('signupBtn');
  if (signupBtn) {
    signupBtn.addEventListener('click', function() {
      showSignupForm();
    });
  }
});

// Fonction pour montrer le chat
function showChat() {
  // Vérifier si le chat existe déjà
  let chatContainer = document.getElementById('chat-container');
  
  if (!chatContainer) {
    // Créer une nouvelle fenêtre de chat
    chatContainer = document.createElement('div');
    chatContainer.id = 'chat-container';
    chatContainer.className = 'chat-container';
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
    
    // Contenu du chat avec bouton de connexion
    chatContainer.innerHTML = `
      <div style="background: #6a4fab; color: white; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; font-size: 16px;">Chat Actu&Média</h3>
        <div style="display: flex; align-items: center;">
          <button id="chatLoginBtn" style="background: none; border: 1px solid white; color: white; font-size: 12px; padding: 4px 8px; margin-right: 10px; border-radius: 4px; cursor: pointer; display: none;">Se connecter</button>
          <button id="closeChat" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; line-height: 1;">×</button>
        </div>
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
    
    // Configurer le bouton de connexion
    setupChatLoginButton();
    
    // Charger les messages précédents si Supabase est disponible
    loadPreviousMessages();
    
    // Gérer l'envoi de message
    document.getElementById('chatForm').addEventListener('submit', function(e) {
      e.preventDefault();
      sendChatMessage();
    });
  } else {
    // Basculer la visibilité
    chatContainer.style.display = chatContainer.style.display === 'none' ? 'flex' : 'none';
    
    if (chatContainer.style.display === 'flex') {
      // Mettre à jour le bouton de connexion et recharger les messages
      setupChatLoginButton();
      loadPreviousMessages();
    }
  }
}

// Configuration du bouton de connexion
function setupChatLoginButton() {
  const loginBtn = document.getElementById('chatLoginBtn');
  if (!loginBtn) return;
  
  // Vérifier si l'utilisateur est connecté
  if (window.supabase) {
    window.supabase.auth.getUser().then(({ data }) => {
      if (data && data.user) {
        // Utilisateur connecté
        loginBtn.style.display = 'none';
      } else {
        // Utilisateur non connecté
        loginBtn.style.display = 'block';
        loginBtn.addEventListener('click', showLoginForm);
      }
    }).catch(err => {
      console.error('Erreur de vérification de connexion:', err);
      loginBtn.style.display = 'block';
    });
  } else {
    // Supabase non disponible
    loginBtn.style.display = 'none';
  }
}

// Charger les messages précédents
function loadPreviousMessages() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages || !window.supabase) return;
  
  window.supabase.from('messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(50)
    .then(({ data, error }) => {
      if (error) {
        console.error('Erreur de chargement des messages:', error);
        return;
      }
      
      if (data && data.length > 0) {
        // Effacer les messages existants sauf le message de bienvenue
        const welcomeMessage = chatMessages.firstElementChild;
        chatMessages.innerHTML = '';
        if (welcomeMessage) chatMessages.appendChild(welcomeMessage);
        
        // Afficher les messages
        data.forEach(message => {
          displayMessage(message);
        });
        
        // Défiler vers le bas
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    });
}

// Afficher un message dans le chat
function displayMessage(message) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  
  const messageEl = document.createElement('div');
  
  // Vérifier si c'est un message de l'utilisateur actuel
  let isCurrentUser = false;
  
  if (window.supabase) {
    const user = window.supabase.auth.getSession()?.user;
    isCurrentUser = user && message.user_id === user.id;
  }
  
  messageEl.style.cssText = isCurrentUser ? 
    'background: #e3f2fd; padding: 10px; border-radius: 8px; margin-bottom: 10px; margin-left: 20%;' :
    'background: white; padding: 10px; border-radius: 8px; margin-bottom: 10px; margin-right: 20%;';
  
  messageEl.innerHTML = `
    <div>${message.content}</div>
    <div style="font-size: 0.8em; color: gray; text-align: right;">${new Date(message.created_at).toLocaleTimeString()}</div>
  `;
  
  chatMessages.appendChild(messageEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Envoyer un message
function sendChatMessage() {
  const input = document.querySelector('#chatForm input');
  if (!input) return;
  
  const message = input.value.trim();
  if (!message) return;
  
  // Effacer l'input
  input.value = '';
  
  // Afficher le message localement d'abord
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages) {
    const messageEl = document.createElement('div');
    messageEl.style.cssText = 'background: #e3f2fd; padding: 10px; border-radius: 8px; margin-bottom: 10px; margin-left: 20%;';
    messageEl.innerHTML = `
      <div>${message}</div>
      <div style="font-size: 0.8em; color: gray; text-align: right;">${new Date().toLocaleTimeString()}</div>
    `;
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Envoyer à Supabase si disponible
  if (window.supabase) {
    window.supabase.auth.getUser().then(({ data }) => {
      if (data && data.user) {
        // Utilisateur connecté, envoyer le message
        window.supabase.from('messages')
          .insert({
            content: message,
            user_id: data.user.id,
            channel_id: 'general'
          })
          .then(({ error }) => {
            if (error) console.error('Erreur d\'envoi du message:', error);
          });
      } else {
        // Utilisateur non connecté, montrer le formulaire de connexion
        showLoginForm();
      }
    });
  }
}

// Afficher le formulaire de connexion
function showLoginForm() {
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
        <h3 style="margin: 0;">Connexion</h3>
        <button id="closeLoginForm" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
      </div>
      <div style="padding: 20px;">
        <form id="login-form">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">Email</label>
            <input type="email" id="loginEmail" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">Mot de passe</label>
            <input type="password" id="loginPassword" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <button type="submit" style="background: #6a4fab; color: white; border: none; padding: 10px 0; width: 100%; border-radius: 4px; cursor: pointer;">Se connecter</button>
          <p style="text-align: center; margin-top: 15px;">
            Pas encore de compte? <a href="#" id="showSignupLink" style="color: #6a4fab; text-decoration: none;">S'inscrire</a>
          </p>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(formContainer);
  
  // Gérer la fermeture
  document.getElementById('closeLoginForm').addEventListener('click', function() {
    formContainer.remove();
  });
  
  // Gérer le lien vers l'inscription
  document.getElementById('showSignupLink').addEventListener('click', function(e) {
    e.preventDefault();
    formContainer.remove();
    showSignupForm();
  });
  
  // Gérer la soumission du formulaire
  document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (window.supabase) {
      window.supabase.auth.signInWithPassword({
        email: email,
        password: password
      }).then(({ data, error }) => {
        if (error) {
          alert('Erreur de connexion: ' + error.message);
        } else {
          formContainer.remove();
          setupChatLoginButton();
        }
      });
    } else {
      alert('Erreur: Supabase non disponible');
    }
  });
}

// Afficher le formulaire d'inscription
function showSignupForm() {
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
        <button id="closeSignupForm" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
      </div>
      <div style="padding: 20px;">
        <form id="signup-form">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">Email</label>
            <input type="email" id="signupEmail" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">Mot de passe</label>
            <input type="password" id="signupPassword" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">Confirmer le mot de passe</label>
            <input type="password" id="signupPasswordConfirm" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <button type="submit" style="background: #6a4fab; color: white; border: none; padding: 10px 0; width: 100%; border-radius: 4px; cursor: pointer;">S'inscrire</button>
          <p style="text-align: center; margin-top: 15px;">
            Déjà un compte? <a href="#" id="showLoginLink" style="color: #6a4fab; text-decoration: none;">Se connecter</a>
          </p>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(formContainer);
  
  // Gérer la fermeture
  document.getElementById('closeSignupForm').addEventListener('click', function() {
    formContainer.remove();
  });
  
  // Gérer le lien vers la connexion
  document.getElementById('showLoginLink').addEventListener('click', function(e) {
    e.preventDefault();
    formContainer.remove();
    showLoginForm();
  });
  
  // Gérer la soumission du formulaire
  document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
    
    if (password !== passwordConfirm) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (window.supabase) {
      window.supabase.auth.signUp({
        email: email,
        password: password
      }).then(({ data, error }) => {
        if (error) {
          alert('Erreur d\'inscription: ' + error.message);
        } else {
          alert('Inscription réussie! Veuillez vérifier votre email pour confirmer votre compte.');
          formContainer.remove();
        }
      });
    } else {
      alert('Erreur: Supabase non disponible');
    }
  });
}
