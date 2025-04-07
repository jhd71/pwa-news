// Dans newsTickerManager.js, modifiez la fonction loadNewsTickerItems
async function loadNewsTickerItems() {
  try {
    console.log("Tentative de récupération des actualités pour le ticker...");
    
    // Utiliser la même API que pour le panel d'actualités
    const response = await fetch('/api/getNews');
    console.log("Statut de la réponse:", response.status);
    
    if (!response.ok) {
      console.error("Erreur de réponse:", response.status, response.statusText);
      throw new Error('Erreur lors de la récupération des actualités');
    }
    
    const articles = await response.json();
    console.log("Articles récupérés pour le ticker:", articles, "Total:", articles.length);
    
    const tickerElement = document.getElementById('newsTicker');
    if (!tickerElement) {
      console.error("Élément #newsTicker non trouvé dans le DOM");
      return;
    }
    
    if (articles && articles.length > 0) {
      // Vider le ticker
      tickerElement.innerHTML = '';
      
      const now = Date.now();
      const newArticleThreshold = 60 * 60 * 1000; // 1 heure en millisecondes

      // Ajouter les articles
      articles.forEach((article, index) => {
        const title = article.title || 'Article sans titre';
        
        // Nettoyer le titre si nécessaire (enlever HTML, etc.)
        const cleanTitle = title.replace(/<\/?[^>]+(>|$)/g, "");
        
        const item = document.createElement('div');
        item.className = 'ticker-item';
        
        // Vérifier si l'article est récent (moins d'une heure)
        if (now - new Date(article.date).getTime() < newArticleThreshold) {
          item.classList.add('new-article'); // Ajouter la classe pour l'effet
        }
        
        // Formater la date
        let dateStr = '';
        try {
          const date = new Date(article.date);
          dateStr = date.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit'
          });
        } catch (e) {
          dateStr = '';
        }
        
        item.innerHTML = `
          <span class="ticker-source" data-source="${article.source}">[${article.source}]</span>
          <a href="${article.link}" target="_blank">${cleanTitle}</a>
          ${dateStr ? `<span class="ticker-time">${dateStr}</span>` : ''}
        `;
        
        tickerElement.appendChild(item);
      });
      
      console.log("Affichage terminé pour", articles.length, "articles dans le ticker");
    } else {
      console.warn("Aucun article récupéré ou tableau vide pour le ticker");
      tickerElement.innerHTML = '<div class="ticker-item">Aucune actualité disponible pour le moment</div>';
    }
  } catch (error) {
    console.error('Erreur complète:', error);
    const tickerElement = document.getElementById('newsTicker');
    if (tickerElement) {
      tickerElement.innerHTML = `<div class="ticker-item">Erreur: ${error.message}</div>`;
    }
  }
}

// Le reste du code reste inchangé
// Données de test (à utiliser si l'API ne fonctionne pas)
function loadTestData() {
  const testArticles = [
    { title: 'Article de test 1', link: '#', date: new Date().toISOString(), source: 'Test Source' },
    { title: 'Article de test 2', link: '#', date: new Date().toISOString(), source: 'Test Source' }
  ];
  
  const tickerElement = document.getElementById('newsTicker');
  if (tickerElement) {
    tickerElement.innerHTML = '';
    testArticles.forEach(article => {
      const item = document.createElement('div');
      item.className = 'ticker-item';
      item.innerHTML = `
        <span class="ticker-source">[${article.source}]</span>
        <a href="${article.link}" target="_blank">${article.title}</a>
      `;
      tickerElement.appendChild(item);
    });
  }
}

// Charger les actualités au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
  // Décommentez la ligne suivante pour tester avec des données fictives
  // loadTestData();
  
  // Commentez cette ligne si vous utilisez loadTestData
  loadNewsTickerItems();
  
  // Rafraîchir les actualités toutes les 5 minutes
  setInterval(loadNewsTickerItems, 5 * 60 * 1000);
  
  // Ajustement de l'espace sous <main> pour éviter le chevauchement du ticker
  let newsTicker = document.querySelector(".news-ticker");
  let mainContent = document.querySelector("main");

  if (newsTicker && mainContent) {
      let tickerHeight = newsTicker.offsetHeight;
      mainContent.style.paddingBottom = `${tickerHeight + 20}px`;
  }
  
  // Duplication du contenu du ticker pour un défilement complet
  const tickerWrapper = document.querySelector('.ticker-wrapper');
  if (tickerWrapper) {
    tickerWrapper.innerHTML += tickerWrapper.innerHTML;
  }
});
