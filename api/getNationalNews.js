const Parser = require('rss-parser');
const axios = require('axios');

// Durée du cache en millisecondes (10 minutes)
const CACHE_DURATION = 10 * 60 * 1000;
let cachedArticles = null;
let lastFetchTime = null;

module.exports = async (req, res) => {
  try {
    // Configuration CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Vérifier si des données sont en cache et valides
    const now = Date.now();
    if (cachedArticles && lastFetchTime && (now - lastFetchTime < CACHE_DURATION)) {
      console.log('📡 Retour des données en cache');
      return res.status(200).json(cachedArticles);
    }
    
    const parser = new Parser({
      timeout: 5000, // 5 secondes de timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PWANewsBot/1.0)'
      },
    });

    const feeds = [
      { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/news-24-7/', max: 3 },
      { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss', max: 3 },
      { name: 'JeuxVideo.com', url: 'https://www.jeuxvideo.com/rss/rss.xml', max: 3 },
      { name: 'ActuGaming', url: 'https://www.actugaming.net/feed/', max: 3 }
    ];

    // Créer des promesses pour toutes les sources avec timeout individuel
    const fetchPromises = feeds.map(feed => {
      return new Promise(async (resolve) => {
        try {
          console.log(`📡 Récupération de ${feed.name}...`);
          
          // Utiliser axios avec timeout
          const response = await axios.get(feed.url, {
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PWANewsBot/1.0)' }
          });
          
          const feedData = await parser.parseString(response.data);
          console.log(`✅ ${feed.name}: ${feedData.items.length} articles trouvés`);
          
          const fetchedArticles = feedData.items.slice(0, feed.max).map(item => {
            let image = item.enclosure?.url || item['media:content']?.url || null;
            if (!image && item.content) {
              const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
              if (imgMatch) {
                image = imgMatch[1];
              }
            }
            if (!image) {
              image = "/images/default-news.jpg"; // Image par défaut
            }
            
            return {
              title: item.title,
              link: item.link,
              image,
              source: feed.name
            };
          });
          
          resolve(fetchedArticles);
        } catch (error) {
          console.error(`❌ Erreur avec ${feed.name}:`, error.message);
          resolve([]); // Retourner un tableau vide en cas d'erreur
        }
      });
    });

    // Définir un timeout global pour l'ensemble de l'opération
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.log('⚠️ Timeout global atteint');
        resolve([]);
      }, 8000); // 8 secondes de timeout global
    });

    // Exécuter toutes les promesses avec un timeout global
    const results = await Promise.race([
      Promise.all(fetchPromises),
      timeoutPromise.then(() => feeds.map(() => [])) // En cas de timeout, retourner des tableaux vides
    ]);
    
    // Aplatir les résultats
    let articles = results.flat();

    if (articles.length === 0) {
      console.error("⚠️ Aucun article récupéré, vérifiez les flux RSS !");
      
      // Si le cache existe mais est périmé, mieux vaut retourner des données périmées que rien
      if (cachedArticles) {
        console.log('📡 Utilisation du cache périmé en dernier recours');
        return res.status(200).json(cachedArticles);
      }
      
      return res.status(500).json({ error: "Aucun article récupéré" });
    }

    // Mélanger les articles avant de renvoyer
    articles.sort(() => Math.random() - 0.5);
    
    // Limiter à 10 articles
    const finalArticles = articles.slice(0, 10);
    
    // Mettre à jour le cache
    cachedArticles = finalArticles;
    lastFetchTime = now;
    
    return res.status(200).json(finalArticles);
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    
    // Si le cache existe en cas d'erreur, l'utiliser
    if (cachedArticles) {
      console.log('📡 Utilisation du cache en cas d\'erreur');
      return res.status(200).json(cachedArticles);
    }
    
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
