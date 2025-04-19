// pages/admin-notifications.js
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function AdminNotifications() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [notification, setNotification] = useState({
    title: '',
    body: '',
    url: '/',
    imageUrl: '',
    urgent: false
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  // Vérifiez si l'utilisateur est déjà authentifié via localStorage
  useEffect(() => {
    // On vérifie l'authentification côté client seulement
    if (typeof window !== 'undefined') {
      const storedAuth = localStorage.getItem('adminAuth');
      if (storedAuth === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    // Mot de passe simple pour l'exemple - à remplacer par une solution plus sécurisée
    if (password === 'actuetmedia-admin') {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
    } else {
      setStatus({ type: 'error', message: 'Mot de passe incorrect' });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuth');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNotification({
      ...notification,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const sendNotification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch('/api/send-important-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'actuetmedia-admin-key'  // Utilisez la même clé que dans checkApiKey()
        },
        body: JSON.stringify(notification)
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ 
          type: 'success', 
          message: `Notification envoyée avec succès! (${data.sent} envoyées, ${data.failed} échouées)` 
        });
        // Réinitialiser le formulaire
        setNotification({
          title: '',
          body: '',
          url: '/',
          imageUrl: '',
          urgent: false
        });
      } else {
        setStatus({ type: 'error', message: data.error || 'Erreur lors de l\'envoi' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <Head>
        <title>Administration des Notifications - Actu&Média</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <header className="admin-header">
        <h1>Administration des Notifications</h1>
        {isAuthenticated && (
          <button onClick={handleLogout} className="logout-btn">
            Déconnexion
          </button>
        )}
      </header>

      <main className="admin-content">
        {!isAuthenticated ? (
          <div className="login-form">
            <h2>Connexion</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="password">Mot de passe</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {status.type === 'error' && (
                <div className="status-message error">{status.message}</div>
              )}
              <button type="submit" className="submit-btn">
                Se connecter
              </button>
            </form>
          </div>
        ) : (
          <div className="notification-form">
            <h2>Envoyer une notification importante</h2>
            <form onSubmit={sendNotification}>
              <div className="form-group">
                <label htmlFor="title">Titre* :</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={notification.title}
                  onChange={handleInputChange}
                  required
                  maxLength="50"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="body">Message* :</label>
                <textarea
                  id="body"
                  name="body"
                  value={notification.body}
                  onChange={handleInputChange}
                  required
                  maxLength="150"
                  rows="3"
                />
                <small>{notification.body.length}/150 caractères</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="url">URL à ouvrir (facultatif) :</label>
                <input
                  type="text"
                  id="url"
                  name="url"
                  value={notification.url}
                  onChange={handleInputChange}
                  placeholder="/"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="imageUrl">URL de l'image (facultatif) :</label>
                <input
                  type="text"
                  id="imageUrl"
                  name="imageUrl"
                  value={notification.imageUrl}
                  onChange={handleInputChange}
                  placeholder="/images/notification-icon.png"
                />
              </div>
              
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="urgent"
                  name="urgent"
                  checked={notification.urgent}
                  onChange={handleInputChange}
                />
                <label htmlFor="urgent">Notification urgente (vibration, persistante)</label>
              </div>
              
              {status.message && (
                <div className={`status-message ${status.type}`}>
                  {status.message}
                </div>
              )}
              
              <button 
                type="submit" 
                className="submit-btn" 
                disabled={loading || !notification.title || !notification.body}
              >
                {loading ? 'Envoi en cours...' : 'Envoyer la notification'}
              </button>
            </form>
          </div>
        )}
      </main>

      <style jsx>{`
        .admin-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 10px;
          border-bottom: 1px solid #ddd;
        }
        
        h1 {
          font-size: 1.8rem;
          color: #333;
          margin: 0;
        }
        
        h2 {
          font-size: 1.4rem;
          color: #444;
          margin-bottom: 20px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
        }
        
        input, textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 16px;
        }
        
        .checkbox {
          display: flex;
          align-items: center;
        }
        
        .checkbox input {
          width: auto;
          margin-right: 10px;
        }
        
        .checkbox label {
          margin-bottom: 0;
        }
        
        small {
          display: block;
          margin-top: 5px;
          color: #777;
        }
        
        .submit-btn, .logout-btn {
          background-color: #6e46c9;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.2s;
        }
        
        .submit-btn:hover, .logout-btn:hover {
          background-color: #8a5adf;
        }
        
        .submit-btn:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .logout-btn {
          background-color: #f44336;
        }
        
        .logout-btn:hover {
          background-color: #d32f2f;
        }
        
        .status-message {
          padding: 10px;
          margin-bottom: 20px;
          border-radius: 6px;
        }
        
        .success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        @media (max-width: 600px) {
          .admin-container {
            padding: 15px;
          }
          
          h1 {
            font-size: 1.5rem;
          }
          
          .admin-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .logout-btn {
            margin-top: 10px;
          }
        }
      `}</style>
    </div>
  );
}