// api/getNationalNews.js
import Parser from 'rss-parser';

// Cache en mémoire
let memoryCache = {
  data: null,
  timestamp: null
};

export default async function handler(req, res) {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Vérifier le cache (10 minutes)
    const now = Date.now();
    if (memoryCache.data && memoryCache.timestamp && now - memoryCache.timestamp < 10 * 60 * 1000) {
      console.log('📡 Retour des données en cache');
      return res.status(200).json(memoryCache.data);
    }
    
    const parser = new Parser();
    
		// Limiter à quelques flux fiables
		const feeds = [
    { name: 'France 3 Bourgogne', url: 'https://france3-regions.francetvinfo.fr/bourgogne-franche-comte/rss', max: 2 },
	{ name: 'Montceau News', url: 'https://montceau-news.com/feed/', max: 2 },
	{ name: 'lejsl montceau-les-mines', url: 'https://www.lejsl.com/edition-montceau-les-mines/rss', max: 2 },
	{ name: 'Informateur de Bourgogne', url: 'https://linformateurdebourgogne.com/feed/', max: 2 },
	{ name: 'lejsl Saône-et-Loire', url: 'https://www.lejsl.com/saone-et-loire/rss', max: 2 },
    { name: 'France Bleu infos', url: 'https://www.francebleu.fr/rss/bourgogne/rubrique/infos.xml', max: 2 },
	{ name: 'ARS Bourgogne-Franche-Comté', url: 'https://www.bourgogne-franche-comte.ars.sante.fr/rss.xml', max: 2 },
	{ name: 'France Bleu sports', url: 'https://www.francebleu.fr/rss/bourgogne/rubrique/sports.xml', max: 2 }
];
    
    let articles = [];
    
    // Approche séquentielle pour plus de fiabilité
    for (const feed of feeds) {
  try {
    console.log(`📡 Récupération de ${feed.name}...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(feed.url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; NewsApp/1.0)'
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
        
        const fetchedArticles = feedData.items.slice(0, feed.max).map(item => {
          // Extraction d'image améliorée
          let image = "/images/default-news.jpg"; // Image par défaut
          
          // 1. Vérifier enclosure
          if (item.enclosure && item.enclosure.url) {
            image = item.enclosure.url;
          } 
          // 2. Vérifier media:content
          else if (item['media:content'] && item['media:content'].url) {
            image = item['media:content'].url;
          }
          // 3. Vérifier media:thumbnail
          else if (item['media:thumbnail'] && item['media:thumbnail'].url) {
            image = item['media:thumbnail'].url;
          }
          // 4. Chercher dans le contenu HTML
          else if (item.content || item['content:encoded']) {
            const content = item.content || item['content:encoded'];
            const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch && imgMatch[1]) {
              image = imgMatch[1];
            }
          }
          // 5. Chercher dans la description
          else if (item.description) {
            const imgMatch = item.description.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch && imgMatch[1]) {
              image = imgMatch[1];
            }
          }
          
          return {
            title: item.title,
            link: item.link,
            image,
            source: feed.name
          };
        });
        
        articles = [...articles, ...fetchedArticles];
      } catch (error) {
        console.error(`❌ Erreur avec ${feed.name}:`, error.message);
        // Continuer avec les autres flux
      }
    }
    
    if (articles.length === 0) {
      console.error("⚠️ Aucun article récupéré");
      
      if (memoryCache.data) {
        console.log('📡 Utilisation du cache périmé en dernier recours');
        return res.status(200).json(memoryCache.data);
      }
      
      return res.status(500).json({ error: "Aucun article récupéré" });
    }
    
    // Mélanger légèrement les articles
    articles.sort(() => Math.random() - 0.5);
    
    // Mettre à jour le cache
    memoryCache = {
      data: articles,
      timestamp: now
    };
    
    return res.status(200).json(articles);
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    
    if (memoryCache.data) {
      console.log('📡 Utilisation du cache en cas d\'erreur');
      return res.status(200).json(memoryCache.data);
    }
    
    return res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
}
