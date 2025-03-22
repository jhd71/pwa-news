// auth.js
import { supabase } from './supabase-client.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
    }

    async init() {
        try {
            // Vérifier l'état de l'authentification
            const { data: { user } } = await supabase.auth.getUser();
            this.currentUser = user;
            
            // Mettre en place les écouteurs d'événements
            this.setupEventListeners();
            
            return true;
        } catch (error) {
            console.error('Erreur d\'initialisation AuthManager:', error);
            return false;
        }
    }

    setupEventListeners() {
        // Remplacer le bouton de modération en bas par S'inscrire/Se connecter
        this.setupAuthButton();
        
        // Écouter les changements d'authentification
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                this.currentUser = session.user;
                this.updateAuthUI();
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.updateAuthUI();
            }
        });
    }
    
    setupAuthButton() {
        // Trouver le bouton Modération dans la barre du bas
        const navButtons = document.querySelectorAll('.nav-button');
        let modButton = null;
        
        navButtons.forEach(button => {
            const text = button.textContent.trim();
            if (text === 'Modération') {
                modButton = button;
            }
        });
        
        if (modButton) {
            // Créer un nouveau bouton Connexion/Inscription
            const authButton = document.createElement('button');
            authButton.id = 'authButton';
            authButton.className = modButton.className; // Copier les classes
            
            // Définir le contenu initial
            this.updateButtonContent(authButton);
            
            // Remplacer le bouton
            modButton.parentNode.replaceChild(authButton, modButton);
            
            // Ajouter l'écouteur d'événements
            authButton.addEventListener('click', () => {
                if (this.currentUser) {
                    this.showUserMenu();
                } else {
                    this.showAuthForms();
                }
            });
        }
    }
    
    updateButtonContent(button) {
        if (!button) {
            button = document.getElementById('authButton');
            if (!button) return;
        }
        
        if (this.currentUser) {
            button.innerHTML = `
                <span class="material-icons">account_circle</span>
                <span>Profil</span>
            `;
        } else {
            button.innerHTML = `
                <span class="material-icons">login</span>
                <span>Connexion</span>
            `;
        }
    }
    
    updateAuthUI() {
        // Mettre à jour le bouton d'authentification
        this.updateButtonContent();
        
        // Mettre à jour d'autres éléments si nécessaire
        // Par exemple, afficher/masquer le bouton de modération dans le menu
    }
    
    showUserMenu() {
        if (!document.getElementById('user-menu')) {
            const menu = document.createElement('div');
            menu.id = 'user-menu';
            menu.className = 'user-menu';
            menu.innerHTML = `
                <div class="user-menu-content">
                    <div class="user-info">
                        <span class="material-icons user-icon">account_circle</span>
                        <span class="user-email">${this.currentUser.email}</span>
                    </div>
                    <div class="menu-items">
                        <button id="logoutBtn" class="menu-item">
                            <span class="material-icons">logout</span>
                            <span>Déconnexion</span>
                        </button>
                    </div>
                </div>
            `;
            
            // Ajouter des styles
            if (!document.getElementById('user-menu-styles')) {
                const style = document.createElement('style');
                style.id = 'user-menu-styles';
                style.textContent = `
                    .user-menu {
                        position: fixed;
                        bottom: 70px;
                        right: 10px;
                        background: white;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                        z-index: 1000;
                        overflow: hidden;
                    }
                    
                    .user-menu-content {
                        padding: 0;
                    }
                    
                    .user-info {
                        display: flex;
                        align-items: center;
                        padding: 15px;
                        background: #6a4fab;
                        color: white;
                    }
                    
                    .user-icon {
                        font-size: 24px;
                        margin-right: 10px;
                    }
                    
                    .menu-items {
                        padding: 10px 0;
                    }
                    
                    .menu-item {
                        display: flex;
                        align-items: center;
                        width: 100%;
                        padding: 10px 15px;
                        background: none;
                        border: none;
                        text-align: left;
                        cursor: pointer;
                    }
                    
                    .menu-item:hover {
                        background: #f5f5f5;
                    }
                    
                    .menu-item .material-icons {
                        margin-right: 10px;
                    }
                    
                    [data-theme="dark"] .user-menu {
                        background: #333;
                    }
                    
                    [data-theme="dark"] .menu-item {
                        color: white;
                    }
                    
                    [data-theme="dark"] .menu-item:hover {
                        background: #444;
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(menu);
            
            // Ajouter des écouteurs d'événements
            document.getElementById('logoutBtn').addEventListener('click', () => {
                this.logout();
                menu.remove();
            });
            
            // Fermer le menu lorsqu'on clique ailleurs
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target) && e.target.id !== 'authButton') {
                    menu.remove();
                }
            }, { once: true });
        }
    }
    
    showAuthForms() {
        this.showLoginForm();
    }
    
    showLoginForm() {
        if (!document.getElementById('login-container')) {
            const loginContainer = document.createElement('div');
            loginContainer.id = 'login-container';
            loginContainer.className = 'auth-container';
            loginContainer.innerHTML = `
                <div class="auth-content">
                    <div class="auth-header">
                        <h3>Connexion</h3>
                        <button id="closeLoginBtn" class="close-btn">×</button>
                    </div>
                    <div class="auth-body">
                        <form id="loginForm">
                            <div class="form-group">
                                <label for="loginEmail">Email</label>
                                <input type="email" id="loginEmail" required placeholder="Votre email">
                            </div>
                            <div class="form-group">
                                <label for="loginPassword">Mot de passe</label>
                                <input type="password" id="loginPassword" required placeholder="Votre mot de passe">
                            </div>
                            <div class="form-group">
                                <button type="submit" class="submit-btn">Se connecter</button>
                            </div>
                            <div class="form-footer">
                                <p>Pas encore de compte? <a href="#" id="signupLink">S'inscrire</a></p>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            // Ajouter des styles
            if (!document.getElementById('auth-styles')) {
                const style = document.createElement('style');
                style.id = 'auth-styles';
                style.textContent = `
                    .auth-container {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0, 0, 0, 0.5);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 1000;
                    }
                    
                    .auth-content {
                        background-color: white;
                        border-radius: 10px;
                        width: 90%;
                        max-width: 400px;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    }
                    
                    .auth-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 15px;
                        background: #6a4fab;
                        color: white;
                        border-radius: 10px 10px 0 0;
                    }
                    
                    .close-btn {
                        background: none;
                        border: none;
                        color: white;
                        font-size: 24px;
                        cursor: pointer;
                    }
                    
                    .auth-body {
                        padding: 20px;
                    }
                    
                    .form-group {
                        margin-bottom: 15px;
                    }
                    
                    .form-group label {
                        display: block;
                        margin-bottom: 5px;
                    }
                    
                    .form-group input {
                        width: 100%;
                        padding: 8px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                    }
                    
                    .submit-btn {
                        background-color: #6a4fab;
                        color: white;
                        border: none;
                        padding: 10px 15px;
                        border-radius: 4px;
                        cursor: pointer;
                        width: 100%;
                    }
                    
                    .form-footer {
                        margin-top: 15px;
                        text-align: center;
                    }
                    
                    .form-footer a {
                        color: #6a4fab;
                        text-decoration: none;
                    }
                    
                    [data-theme="dark"] .auth-content {
                        background: #333;
                        color: white;
                    }
                    
                    [data-theme="dark"] .form-group label {
                        color: white;
                    }
                    
                    [data-theme="dark"] .form-group input {
                        background: #444;
                        color: white;
                        border-color: #555;
                    }
                    
                    [data-theme="dark"] .form-footer {
                        color: #ddd;
                    }
                    
                    [data-theme="dark"] .form-footer a {
                        color: #9b83de;
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(loginContainer);
            
            // Ajouter des écouteurs d'événements
            document.getElementById('closeLoginBtn').addEventListener('click', () => {
                loginContainer.remove();
            });
            
            document.getElementById('signupLink').addEventListener('click', (e) => {
                e.preventDefault();
                loginContainer.remove();
                this.showSignupForm();
            });
            
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                
                try {
                    const { error } = await supabase.auth.signInWithPassword({
                        email,
                        password
                    });
                    
                    if (error) throw error;
                    
                    loginContainer.remove();
                    
                } catch (error) {
                    alert('Erreur de connexion: ' + error.message);
                }
            });
        }
    }
    
    showSignupForm() {
        if (!document.getElementById('signup-container')) {
            const signupContainer = document.createElement('div');
            signupContainer.id = 'signup-container';
            signupContainer.className = 'auth-container';
            signupContainer.innerHTML = `
                <div class="auth-content">
                    <div class="auth-header">
                        <h3>Inscription</h3>
                        <button id="closeSignupBtn" class="close-btn">×</button>
                    </div>
                    <div class="auth-body">
                        <form id="signupForm">
                            <div class="form-group">
                                <label for="signupEmail">Email</label>
                                <input type="email" id="signupEmail" required placeholder="Votre email">
                            </div>
                            <div class="form-group">
                                <label for="signupPassword">Mot de passe</label>
                                <input type="password" id="signupPassword" required placeholder="Votre mot de passe">
                            </div>
                            <div class="form-group">
                                <label for="signupPasswordConfirm">Confirmer le mot de passe</label>
                                <input type="password" id="signupPasswordConfirm" required placeholder="Confirmez votre mot de passe">
                            </div>
                            <div class="form-group">
                                <button type="submit" class="submit-btn">S'inscrire</button>
                            </div>
                            <div class="form-footer">
                                <p>Déjà inscrit? <a href="#" id="loginLink">Se connecter</a></p>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            document.body.appendChild(signupContainer);
            
            // Ajouter des écouteurs d'événements
            document.getElementById('closeSignupBtn').addEventListener('click', () => {
                signupContainer.remove();
            });
            
            document.getElementById('loginLink').addEventListener('click', (e) => {
                e.preventDefault();
                signupContainer.remove();
                this.showLoginForm();
            });
            
            document.getElementById('signupForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('signupEmail').value;
                const password = document.getElementById('signupPassword').value;
                const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
                
                if (password !== passwordConfirm) {
                    alert('Les mots de passe ne correspondent pas');
                    return;
                }
                
                try {
                    const { error } = await supabase.auth.signUp({
                        email,
                        password
                    });
                    
                    if (error) throw error;
                    
                    alert('Inscription réussie! Veuillez vérifier votre email pour confirmer votre compte.');
                    signupContainer.remove();
                    
                } catch (error) {
                    alert('Erreur lors de l\'inscription: ' + error.message);
                }
            });
        }
    }
    
    async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            alert('Erreur lors de la déconnexion: ' + error.message);
        }
    }
}

export default AuthManager;