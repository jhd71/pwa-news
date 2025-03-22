// newsPanel.js
document.addEventListener('DOMContentLoaded', function() {
  const newsButton = document.getElementById('newsButton');
  const newsPanel = document.getElementById('newsPanel');
  const closePanel = newsPanel?.querySelector('.close-panel');
  const newsPanelContent = document.getElementById('newsPanelContent');
  const refreshButton = document.getElementById('refreshButton');
  
  // Fonction pour formater la date (déplacée à l'extérieur pour être accessible partout)
  function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('fr-FR', options);
  }
  
  // Fonction pour le partage d'articles
  function setupShareButtons() {
    document.querySelectorAll('.share-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        try {
          const url = button.dataset.url || window.location.href;
          const title = button.dataset.title || document.title;
          
          console.log('Partage:', url, title);
          
          // Supprimer toute modale existante
          const existingModal = document.querySelector('.share-modal');
          if (existingModal) {
            existingModal.remove();
          }
          
          // Créer la nouvelle modale avec styles en ligne
          const shareModal = document.createElement('div');
          shareModal.style.position = 'fixed';
          shareModal.style.top = '0';
          shareModal.style.left = '0';
          shareModal.style.right = '0';
          shareModal.style.bottom = '0';
          shareModal.style.backgroundColor = 'rgba(0,0,0,0.8)';
          shareModal.style.zIndex = '9999';
          shareModal.style.display = 'flex';
          shareModal.style.alignItems = 'center';
          shareModal.style.justifyContent = 'center';
          
          // Contenu HTML avec styles en ligne pour le centrage garanti
          shareModal.innerHTML = `
            <div style="background: linear-gradient(145deg, #3949ab, #5c6bc0); color: white; border-radius: 12px; padding: 20px; width: 90%; max-width: 320px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
              <h3 style="margin-top: 0; margin-bottom: 20px; text-align: center; font-size: 24px;">Partager</h3>
              
              <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" 
                 target="_blank" 
                 style="display: flex; align-items: center; justify-content: center; padding: 14px; border-radius: 8px; background-color: rgba(255, 255, 255, 0.15); color: white; text-decoration: none; font-size: 16px; margin-bottom: 10px;">
                <span style="width: 24px; height: 24px; margin-right: 12px; text-align: center;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor" width="24" height="24">
                    <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/>
                  </svg>
                </span>
                <span style="flex-grow: 1; text-align: center; margin-right: 24px;">Facebook</span>
              </a>
              
              <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}" 
                 target="_blank" 
                 style="display: flex; align-items: center; justify-content: center; padding: 14px; border-radius: 8px; background-color: rgba(255, 255, 255, 0.15); color: white; text-decoration: none; font-size: 16px; margin-bottom: 10px;">
                <span style="width: 24px; height: 24px; margin-right: 12px; text-align: center;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" width="24" height="24">
                    <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"/>
                  </svg>
                </span>
                <span style="flex-grow: 1; text-align: center; margin-right: 24px;">Twitter</span>
              </a>
              
              <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}" 
                 target="_blank" 
                 style="display: flex; align-items: center; justify-content: center; padding: 14px; border-radius: 8px; background-color: rgba(255, 255, 255, 0.15); color: white; text-decoration: none; font-size: 16px; margin-bottom: 10px;">
                <span style="width: 24px; height: 24px; margin-right: 12px; text-align: center;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" width="24" height="24">
                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                  </svg>
                </span>
                <span style="flex-grow: 1; text-align: center; margin-right: 24px;">WhatsApp</span>
              </a>
              
              <button class="copy-btn" 
                      style="display: flex; align-items: center; justify-content: center; width: 100%; padding: 14px; border-radius: 8px; background-color: rgba(255, 255, 255, 0.15); color: white; border: none; font-size: 16px; cursor: pointer; margin-bottom: 20px;">
                <span style="width: 24px; height: 24px; margin-right: 12px; text-align: center;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" width="24" height="24">
                    <path d="M320 448v40c0 13.255-10.745 24-24 24H24c-13.255 0-24-10.745-24-24V120c0-13.255 10.745-24 24-24h72v296c0 30.879 25.121 56 56 56h168zm0-344V0H152c-13.255 0-24 10.745-24 24v368c0 13.255 10.745 24 24 24h272c13.255 0 24-10.745 24-24V128H344c-13.2 0-24-10.8-24-24zm120.971-31.029L375.029 7.029A24 24 0 0 0 358.059 0H352v96h96v-6.059a24 24 0 0 0-7.029-16.97z"/>
                  </svg>
                </span>
                <span style="flex-grow: 1; text-align: center; margin-right: 24px;">Copier le lien</span>
              </button>
              
              <button class="close-btn" 
                      style="width: 100%; padding: 14px; border-radius: 8px; background-color: #4CAF50; color: white; font-size: 16px; border: none; cursor: pointer; text-align: center; font-weight: bold;">
                Fermer
              </button>
            </div>
          `;
          
          document.body.appendChild(shareModal);
          
          // Ajouter les gestionnaires d'événements
          const copyBtn = shareModal.querySelector('.copy-btn');
          copyBtn.addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(url);
              const originalContent = copyBtn.innerHTML;
              copyBtn.innerHTML = `
                <span style="width: 24px; height: 24px; margin-right: 12px; text-align: center;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" width="24" height="24">
                    <path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"/>
                  </svg>
                </span>
                <span style="flex-grow: 1; text-align: center; margin-right: 24px;">Lien copié !</span>
              `;
              setTimeout(() => {
                copyBtn.innerHTML = originalContent;
              }, 2000);
            } catch (err) {
              console.error('Erreur de copie:', err);
            }
          });
          
          const closeBtn = shareModal.querySelector('.close-btn');
          closeBtn.addEventListener('click', () => {
            shareModal.remove();
          });
          
          // Fermer en cliquant à l'extérieur
          shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) {
              shareModal.remove();
            }
          });
        } catch (error) {
          console.error('Erreur partage:', error);
        }
      });
    });
  }
  
  // Fonction pour charger le contenu
  function loadNewsPanelContent() {
    if (newsPanelContent) {
      newsPanelContent.innerHTML = '<div class="loading-indicator">Chargement des actualités...</div>';
    }
    
    fetch('/api/getNews.js')
      .then(response => {
        if (!response.ok) {
          throw new Error('Erreur de réponse: ' + response.status);
        }
        return response.json();
      })
      .then(articles => {
        if (!newsPanelContent) return;
        
        newsPanelContent.innerHTML = '';
        
        if (articles && articles.length > 0) {
          articles.forEach(article => {
            const newsItem = document.createElement('div');
            newsItem.className = 'news-item';
            
            let sourceIcon = '📰';
            switch(article.source) {
              case 'BFM TV': sourceIcon = '📺'; break;
              case 'Le JSL': sourceIcon = '📰'; break;
              case 'Montceau News': sourceIcon = '🏙️'; break;
              case "L'Informateur": sourceIcon = '📝'; break;
              case 'France Bleu': sourceIcon = '🎙️'; break;
              case 'Creusot Infos': sourceIcon = '🏭'; break;
            }
            
            newsItem.innerHTML = `
              <div class="news-item-source">${sourceIcon} ${article.source}</div>
              <div class="news-item-title">${article.title}</div>
              <div class="news-item-date">${formatDate(article.date)}</div>
              <div class="news-item-actions">
                <a href="${article.link}" target="_blank" class="news-item-link">Lire l'article</a>
                <div class="share-buttons">
                  <button class="share-btn" data-url="${article.link}" data-title="${article.title}">
                    <span class="material-icons">share</span>
                  </button>
                </div>
              </div>
            `;
            
            newsPanelContent.appendChild(newsItem);
          });
          
          // Initialiser les boutons de partage
          setupShareButtons();
        } else {
          newsPanelContent.innerHTML = '<div class="error-message">Aucune actualité disponible</div>';
        }
      })
      .catch(error => {
        console.error('Erreur lors du chargement des actualités:', error);
        if (newsPanelContent) {
          newsPanelContent.innerHTML = '<div class="error-message">Impossible de charger les actualités: ' + error.message + '</div>';
        }
      });
  }
  
  // Événements de clic
  if (newsButton) {
    newsButton.addEventListener('click', () => {
      newsPanel?.classList.add('open');
      loadNewsPanelContent();
      
      // Masquer le ticker
      const newsTicker = document.querySelector('.news-ticker');
      if (newsTicker) newsTicker.style.display = 'none';
    });
  }
  
  if (closePanel) {
    closePanel.addEventListener('click', () => {
      newsPanel?.classList.remove('open');
      
      // Réafficher le ticker
      const newsTicker = document.querySelector('.news-ticker');
      if (newsTicker) newsTicker.style.display = 'block';
    });
  }
  
  // Utiliser le bouton déjà existant dans le HTML
  if (refreshButton) {
    refreshButton.addEventListener('click', (event) => {
      // Empêcher la propagation de l'événement
      event.preventDefault();
      event.stopPropagation();
      
      // Afficher un effet visuel d'actualisation
      refreshButton.classList.add('refreshing');
      refreshButton.innerHTML = '<span class="material-icons">sync</span> Actualisation...';
      
      console.log("Actualisation du panel d'actualités...");
      
      // Recharger les actualités du panel
      loadNewsPanelContent();
      
      // Restaurer l'apparence du bouton après 1 seconde
      setTimeout(() => {
        refreshButton.classList.remove('refreshing');
        refreshButton.innerHTML = '<span class="material-icons">refresh</span> Actualiser les infos';
      }, 1000);
      
      // Empêcher l'appel à window.refreshNews qui actualise le swiper
      return false;
    });
  }
  
  // AJOUTEZ LE CODE DU BOUTON DE FERMETURE MOBILE ICI
  const mobileCloseBtn = document.getElementById('mobileClosePanel');
  if (mobileCloseBtn) {
    mobileCloseBtn.addEventListener('click', () => {
      if (newsPanel) {
        newsPanel.classList.remove('open');
        
        // Réafficher le ticker
        const newsTicker = document.querySelector('.news-ticker');
        if (newsTicker) newsTicker.style.display = 'block';
      }
    });
  }
  
  // Fermer le panneau lors d'un clic en dehors
  document.addEventListener('click', (event) => {
    if (newsPanel?.classList.contains('open') && 
        !newsPanel.contains(event.target) && 
        event.target !== newsButton &&
        !newsButton?.contains(event.target)) {
      
      newsPanel.classList.remove('open');
      
      // Réafficher le ticker
      const newsTicker = document.querySelector('.news-ticker');
      if (newsTicker) newsTicker.style.display = 'block';
    }
  });
});
