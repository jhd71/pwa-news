// highlightNews.js
async function loadTopHighlights() {
  const topNewsContainer = document.getElementById('topNews');
  if (!topNewsContainer) return;
  
  try {
    const response = await fetch('/api/getNationalNews.js');
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const articles = await response.json();
    
    if (articles.length === 0) {
      topNewsContainer.innerHTML = '<p class="news-empty">Aucune actualité disponible.</p>';
      return;
    }
    
    // Limiter à 4 articles pour ce widget
    const highlights = articles.slice(0, 4);
    
    let newsHTML = '';
    highlights.forEach(article => {
      if (article.title && article.link) {
        newsHTML += `
          <a href="${article.link}" target="_blank" class="news-item">
            <p>${article.title}</p>
          </a>
        `;
      }
    });
    
    topNewsContainer.innerHTML = newsHTML || '<p class="news-empty">Aucune actualité disponible.</p>';
    
  } catch (error) {
    console.error('Erreur chargement actualités:', error);
    topNewsContainer.innerHTML = '<p class="news-error">Erreur lors du chargement des actualités.</p>';
  }
}

// Exécuter au chargement de la page
document.addEventListener('DOMContentLoaded', loadTopHighlights);