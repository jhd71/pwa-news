// Dans api/getNews.js, ajoutez en début de fonction :
module.exports = async (req, res) => {
  // Ajouter les en-têtes CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    console.log("Tentative de récupération des actualités...");
    
    const response = await fetch('/api/getNews');
    console.log("Statut de la réponse:", response.status);
    
    if (!response.ok) {
      console.error("Erreur de réponse:", response.status, response.statusText);
      throw new Error('Erreur lors de la récupération des actualités');
    }
    
    const articles = await response.json();
    console.log("Articles récupérés:", articles);
    
    const tickerElement = document.getElementById('newsTicker');
    if (!tickerElement) {
      console.error("Élément #newsTicker non trouvé dans le DOM");
      return;
    }
    
    if (articles && articles.length > 0) {
      console.log(`Affichage de ${articles.length} articles`);
      // Vider le ticker
      tickerElement.innerHTML = '';
      
      // Ajouter les articles
      articles.forEach((article, index) => {
        console.log(`Traitement de l'article ${index}:`, article.title);
        
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
    } else {
      console.warn("Aucun article récupéré ou tableau vide");
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
