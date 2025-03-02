// Script pour récupérer et afficher les actualités
async function loadNewsTickerItems() {
  try {
    const response = await fetch('/api/getNews');
    if (!response.ok) throw new Error('Erreur lors de la récupération des actualités');
    
    const articles = await response.json();
    const tickerElement = document.getElementById('newsTicker');
    
    if (tickerElement && articles.length > 0) {
      // Vider le ticker
      tickerElement.innerHTML = '';
      
      // Ajouter les articles
      articles.forEach(article => {
        const item = document.createElement('div');
        item.className = 'ticker-item';
        
        // Formater la date
        const date = new Date(article.date);
        const formattedDate = date.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        item.innerHTML = `
          <span class="ticker-source">[${article.source}]</span>
          <a href="${article.link}" target="_blank">${article.title}</a>
          <span class="ticker-time">${formattedDate}</span>
        `;
        
        tickerElement.appendChild(item);
      });
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Charger les actualités au chargement de la page
document.addEventListener('DOMContentLoaded', loadNewsTickerItems);

// Rafraîchir les actualités toutes les 5 minutes
setInterval(loadNewsTickerItems, 5 * 60 * 1000);