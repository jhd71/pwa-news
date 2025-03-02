// Dans api/getNews.js
module.exports = async (req, res) => {
  // En-têtes CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const Parser = require('rss-parser');
    const parser = new Parser({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      },
      timeout: 5000, // 5 secondes de timeout
      customFields: {
        item: ['media:content', 'enclosure']
      }
    });
    
    // URLs des flux RSS
    const feeds = [
      { name: 'Montceau News', url: 'https://montceau-news.com/feed/' },
      { name: 'L\'Informateur', url: 'http://www.linformateurdebourgogne.com/feed/' },
      { name: 'Le JSL', url: 'https://www.lejsl.com/rss' },
      { name: 'BFM TV', url: 'https://www.bfmtv.com/rss/news-24-7/' },
      { name: 'France Bleu', url: 'https://www.francebleu.fr/rss/bourgogne.xml' }
    ];
    
    const allArticles = [];
    const feedPromises = feeds.map(async (feed) => {
      try {
        console.log(`Tentative pour ${feed.name}...`);
        const feedData = await parser.parseURL(feed.url);
        console.log(`Succès pour ${feed.name}, ${feedData.items.length} articles trouvés`);
        
        // Extraire jusqu'à 4 articles
        const articles = feedData.items.slice(0, 4).map(item => ({
          title: item.title,
          link: item.link,
          date: item.pubDate || item.isoDate,
          source: feed.name
        }));
        
        return articles;
      } catch (feedError) {
        console.error(`Erreur avec ${feed.name}:`, feedError.message);
        return []; // Retourner un tableau vide en cas d'erreur
      }
    });
    
    // Attendre que tous les flux soient traités, même ceux en erreur
    const results = await Promise.allSettled(feedPromises);
    
    // Traiter les résultats
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
      }
    });
    
    // Trier les articles par date
    allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Limiter à 15 articles au total
    return res.status(200).json(allArticles.slice(0, 15));
    
  } catch (error) {
    console.error('Erreur générale:', error.message);
    return res.status(500).json({ error: error.message });
  }
};
