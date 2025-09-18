// newsPanel.js
document.addEventListener('DOMContentLoaded', function() {
  
  // Masquer le ticker sur tablettes au chargement de la page
  function hideTickerOnTablets() {
    const ticker = document.querySelector('.news-ticker');
    if (ticker && window.innerWidth >= 768) {
      ticker.style.display = 'none';
      ticker.style.visibility = 'hidden';
      ticker.style.opacity = '0';
    }
  }

  // Exécuter au chargement
  hideTickerOnTablets();

  // Exécuter lors du redimensionnement
  window.addEventListener('resize', hideTickerOnTablets);

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
          
          // Créer la nouvelle modale avec des classes CSS au lieu des styles en ligne
const shareModal = document.createElement('div');
shareModal.className = 'share-modal';

// Utiliser des classes CSS au lieu de styles en ligne
// Utiliser un emoji pour WhatsApp comme alternative

shareModal.innerHTML = `
  <div id="share" class="share-modal-content">
    <h3>Partager</h3>
    
    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" 
       target="_blank" 
       class="share-option">
      <span class="material-icons">facebook</span>
      <span>Facebook</span>
    </a>
    
    <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}" 
       target="_blank" 
       class="share-option">
      <span class="material-icons">alternate_email</span>
      <span>X.com</span>
    </a>
    
    <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}" 
       target="_blank" 
       class="share-option">
      <img src="https://cdn-icons-png.flaticon.com/512/1384/1384023.png" width="24" height="24" alt="WhatsApp" class="whatsapp-icon">
      <span>WhatsApp</span>
    </a>
    
    <button class="share-option copy-btn">
      <span class="material-icons">content_copy</span>
      <span>Copier le lien</span>
    </button>
    
    <button class="share-close">
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
                <span class="material-icons">check</span>
                <span>Lien copié !</span>
              `;
              setTimeout(() => {
                copyBtn.innerHTML = originalContent;
              }, 2000);
            } catch (err) {
              console.error('Erreur de copie:', err);
            }
          });
          
          const closeBtn = shareModal.querySelector('.share-close');
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
  
// Définir la durée pendant laquelle l'effet de pulsation est actif (ici 90 minutes)
const pulsationDuration = 90 * 60 * 1000; // 90 minutes en millisecondes

// Fonction pour appliquer l'animation de pulsation aux articles récents
function applyPulsationEffect() {
  // Sélectionne tous les articles récents (ceux qui ont la classe "latest-article")
  const articles = document.querySelectorAll('.latest-article');

  // Applique l'animation en ajoutant la classe "pulsating"
  articles.forEach(article => {
    article.classList.add('pulsating');
  });

  // Après 90 minutes, retire l'animation et réinitialise la couleur de fond
  setTimeout(() => {
    articles.forEach(article => {
      article.classList.remove('pulsating');
      article.style.backgroundColor = ''; // Réinitialise la couleur de fond (elle se remettra aux styles par défaut)
    });
  }, pulsationDuration);
}

  // Fonction pour charger et afficher les articles dans le panneau d'actualités
	function loadNewsPanelContent() {
  if (newsPanelContent) {
    newsPanelContent.innerHTML = '<div class="loading-indicator">Chargement des actualités...</div>';
  }
  
  fetch('/api/getNews')
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
        articles.forEach((article, index) => {
          const newsItem = document.createElement('div');
          newsItem.className = 'news-item';

          // Vérifier si l'article a été publié il y a moins de 90 minutes
          if (Date.now() - new Date(article.date).getTime() < pulsationDuration) {
            newsItem.classList.add('latest-article');
          }

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

        // Appliquer l'effet de pulsation aux articles récents
        applyPulsationEffect();
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