// api/getNews.js
import Parser from 'rss-parser';

// Durée du cache en millisecondes (10 minutes)
const CACHE_DURATION = 10 * 60 * 1000;
let cachedArticles = null;
let lastFetchTime = null;

export default async function handler(req, res) {
  // En-têtes CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Vérifier si des données sont en cache et valides
  const now = Date.now();
  if (cachedArticles && lastFetchTime && (now - lastFetchTime < CACHE_DURATION)) {
    console.log('📡 Retour des données locales en cache');
    return res.status(200).json(cachedArticles);
  }
  
  try {
    const parser = new Parser({
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
    ];
    
    // Récupérer les articles de chaque flux avec gestion des promesses
    const fetchPromises = feeds.map(feed => {
      return new Promise(async (resolve) => {
        try {
          console.log(`📡 Tentative pour ${feed.name}...`);
          
          // Remplacer axios par fetch avec timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(feed.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.text();
          const feedData = await parser.parseString(data);
          
          console.log(`✅ ${feed.name}: ${feedData.items.length} articles trouvés`);
          
          // Traiter les articles
          const articles = feedData.items.slice(0, feed.max).map(item => {
            let image = item.enclosure?.url || item['media:content']?.url || null;
            if (!image && item.content) {
              const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
              if (imgMatch) {
                image = imgMatch[1];
              }
            }
            if (!image) {
              // Modifiez le chemin d'image par défaut pour utiliser une image existante
              image = "/images/AM-192-v2.png"; // Utilisez une image que vous avez déjà
            }
            
            return {
              title: item.title,
              link: item.link,
              image,
              date: item.pubDate || item.isoDate,
              source: feed.name
            };
          });
          
          resolve(articles);
        } catch (feedError) {
          console.error(`❌ Erreur avec ${feed.name}:`, feedError.message);
          resolve([]); // Tableau vide en cas d'erreur
        }
      });
    });

    // Définir un timeout global
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.log('⚠️ Timeout global atteint pour les actualités locales');
        resolve([]);
      }, 8000); // 8 secondes de timeout global
    });
    
    // Exécuter toutes les promesses
    const results = await Promise.race([
      Promise.all(fetchPromises),
      timeoutPromise.then(() => feeds.map(() => []))
    ]);
    
    // Aplatir les résultats
    const allArticles = results.flat();
    
    if (allArticles.length === 0) {
      console.error("⚠️ Aucun article local récupéré, vérifiez les flux RSS !");
      
      // Si le cache existe mais est périmé, mieux vaut retourner des données périmées que rien
      if (cachedArticles) {
        console.log('📡 Utilisation du cache local périmé en dernier recours');
        return res.status(200).json(cachedArticles);
      }
      
      return res.status(500).json({ error: "Aucun article récupéré" });
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
    
    // Limiter à 10 articles
    const finalArticles = mixedArticles.slice(0, 10);
    
    // Mettre à jour le cache
    cachedArticles = finalArticles;
    lastFetchTime = now;
    
    // Renvoyer les articles
    return res.status(200).json(finalArticles);
    
  } catch (error) {
    console.error('❌ Erreur générale dans getNews:', error.message);
    
    // Si le cache existe en cas d'erreur, l'utiliser
    if (cachedArticles) {
      console.log('📡 Utilisation du cache local en cas d\'erreur');
      return res.status(200).json(cachedArticles);
    }
    
    return res.status(500).json({ error: error.message });
  }
}
