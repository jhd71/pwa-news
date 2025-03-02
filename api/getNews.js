const Parser = require('rss-parser');
const parser = new Parser();

module.exports = async (req, res) => {
  try {
    // URLs des flux RSS identifiés
const feeds = [
  { name: 'Montceau News', url: 'https://montceau-news.com/feed' },
  { name: 'L\'Informateur de Bourgogne', url: 'http://www.linformateurdebourgogne.com/feed/' },
  { name: 'Le JSL', url: 'https://www.lejsl.com/edition-montceau/rss' },
  { name: 'BFM TV', url: 'https://www.bfmtv.com/rss/news-24-7/' },
  { name: 'France Bleu Bourgogne', url: 'https://www.francebleu.fr/rss/bourgogne.xml' }
];
    
    // Récupérer les articles de chaque flux
    const allArticles = [];
    
    for (const feed of feeds) {
      try {
        const feedData = await parser.parseURL(feed.url);
        
        // Extraire les 3 derniers articles
        const articles = feedData.items.slice(0, 3).map(item => ({
          title: item.title,
          link: item.link,
          date: item.pubDate || item.isoDate,
          source: feed.name
        }));
        
        allArticles.push(...articles);
      } catch (feedError) {
        console.error(`Erreur avec le flux ${feed.name}:`, feedError);
      }
    }
    
    // Trier tous les articles par date (les plus récents d'abord)
    allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Renvoyer les articles les plus récents (limité à 10)
    return res.status(200).json(allArticles.slice(0, 10));
    
  } catch (error) {
    console.error('Erreur lors de la récupération des actualités:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des actualités' });
  }
};
