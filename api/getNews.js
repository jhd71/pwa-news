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
    { name: 'Montceau News', url: 'https://www.lejsl.com/edition-montceau-les-mines/rss', max: 2 },
    { name: 'L\'Informateur', url: 'http://www.linformateurdebourgogne.com/feed/', max: 2 },
    { name: 'Le JSL', url: 'https://www.lejsl.com/rss', max: 2 },
    { name: 'France Bleu', url: 'https://www.francebleu.fr/rss/bourgogne/rubrique/infos.xml', max: 2 },
    // ajoute d'autres sources ici si besoin
  ];
    
    // Récupérer les articles de chaque flux
    const allArticles = [];
    
    for (const feed of feeds) {
      try {
        console.log(`Tentative pour ${feed.name}...`);
        const feedData = await parser.parseURL(feed.url);
        console.log(`Succès pour ${feed.name}, ${feedData.items.length} articles trouvés`);
        
        // Limiter au nombre maximum défini pour chaque source
        const articles = feedData.items.slice(0, feed.max).map(item => ({
          title: item.title,
          link: item.link,
          date: item.pubDate || item.isoDate,
          source: feed.name
        }));
        
        allArticles.push(...articles);
      } catch (feedError) {
        console.error(`Erreur avec ${feed.name}:`, feedError.message);
        continue;
      }
    }
    
    // Mélanger légèrement les articles au lieu de juste les trier par date
    // pour éviter d'avoir toutes les sources regroupées
    const shuffleAndSortArticles = (articles) => {
      // Regrouper par source
      const bySource = {};
      articles.forEach(article => {
        if (!bySource[article.source]) {
          bySource[article.source] = [];
        }
        bySource[article.source].push(article);
      });
      
      // Prendre un article de chaque source à tour de rôle
      const result = [];
      let sourcesWithArticles = Object.keys(bySource);
      
      while (sourcesWithArticles.length > 0) {
        for (let i = 0; i < sourcesWithArticles.length; i++) {
          const source = sourcesWithArticles[i];
          if (bySource[source].length > 0) {
            result.push(bySource[source].shift());
          }
          if (bySource[source].length === 0) {
            sourcesWithArticles = sourcesWithArticles.filter(s => s !== source);
            i--; // Ajustement pour la boucle
          }
        }
      }
      
      return result;
    };
    
    const mixedArticles = shuffleAndSortArticles(allArticles);
    
    // Renvoyer les articles (maximum 10)
    return res.status(200).json(mixedArticles.slice(0, 10));
    
  } catch (error) {
    console.error('Erreur générale:', error.message);
    return res.status(500).json({ error: error.message });
  }
};
