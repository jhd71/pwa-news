// api/getNationalNews.js
import Parser from 'rss-parser';

// ✅ Fonction de scraping plus rapide avec timeout réduit
async function scrapeImageFromPage(url) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsApp/1.0)' },
      signal: AbortSignal.timeout(2000) // ✅ Réduit de 3s à 2s
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    
    const patterns = [
      /<meta property="og:image" content="([^"]+)"/i,
      /<meta name="twitter:image" content="([^"]+)"/i,
      /<img[^>]+class="[^"]*wp-post-image[^"]*"[^>]+src="([^"]+)"/i,
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) return match[1];
    }
    
    return null;
  } catch (error) {
    return null; // ✅ Échec silencieux
  }
}

// Cache en mémoire
let memoryCache = {
  data: null,
  timestamp: null
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const now = Date.now();
    
    // ✅ Cache de 5 minutes (au lieu de 10)
    if (memoryCache.data && memoryCache.timestamp && now - memoryCache.timestamp < 5 * 60 * 1000) {
      console.log('📡 Cache utilisé');
      return res.status(200).json(memoryCache.data);
    }
    
    const parser = new Parser({
      customFields: {
        item: [
          ['media:content', 'media:content'],
          ['media:thumbnail', 'media:thumbnail'],
          ['content:encoded', 'content:encoded'],
        ]
      }
    });
    
    // ✅ Flux optimisés (retirer ceux qui sont trop lents si nécessaire)
    const feeds = [
      { name: 'Informateur de Bourgogne', url: 'https://linformateurdebourgogne.com/feed/', max: 2 },	
      { name: 'Montceau News', url: 'https://montceau-news.com/feed/', max: 2 },
      { name: 'France 3 Bourgogne', url: 'https://france3-regions.francetvinfo.fr/bourgogne-franche-comte/rss', max: 2 },
      { name: 'Le JSL Montceau', url: 'https://www.lejsl.com/edition-montceau-les-mines/rss', max: 2 },
      { name: 'Le JSL Saône-et-Loire', url: 'https://www.lejsl.com/saone-et-loire/rss', max: 2 },
      { name: 'France Bleu Infos', url: 'https://www.francebleu.fr/rss/bourgogne/rubrique/infos.xml', max: 2 },
      { name: 'ARS Bourgogne', url: 'https://www.bourgogne-franche-comte.ars.sante.fr/rss.xml', max: 2 },
    ];
    
    let articles = [];
    
    // ========== CREUSOT INFOS (scraper GitHub) ==========
    try {
        console.log('📡 Creusot Infos...');
        
        const creusotUrl = 'https://raw.githubusercontent.com/jhd71/scraper-creusot/main/data/articles.json';
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // ✅ Réduit de 5s à 3s
        
        const creusotResponse = await fetch(creusotUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsApp/1.0)' },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (creusotResponse.ok) {
            const creusotData = await creusotResponse.json();
            
            const formattedCreusot = creusotData.slice(0, 2).map(article => ({
                title: article.title,
                link: article.link,
                image: article.image && 
                       !article.image.includes('logo.png') && 
                       !article.image.includes('98554_1_full.jpg') && 
                       article.image.length > 10
                    ? article.image 
                    : "/images/default-news.jpg",
                source: 'Creusot Infos'
            }));
            
            articles = [...articles, ...formattedCreusot];
            console.log(`✅ Creusot: ${formattedCreusot.length} articles`);
        }
    } catch (error) {
        console.error('❌ Creusot Infos timeout');
    }
    
    // ✅ Traiter les flux en parallèle (plus rapide)
    const feedPromises = feeds.map(async (feed) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // ✅ Réduit de 5s à 3s
        
        const response = await fetch(feed.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsApp/1.0)' },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.text();
        const feedData = await parser.parseString(data);
        
        const fetchedArticles = await Promise.all(
          feedData.items.slice(0, feed.max).map(async (item) => {
            let image = "/images/default-news.jpg";
            
            // Extraction d'image (sans scraping pour accélérer)
            if (item.enclosure?.url) {
              image = item.enclosure.url;
            } else if (item['media:content']) {
              const mediaContent = Array.isArray(item['media:content']) 
                ? item['media:content'][0] 
                : item['media:content'];
              image = mediaContent?.$?.url || mediaContent?.url || image;
            } else if (item['media:thumbnail']) {
              const mediaThumbnail = Array.isArray(item['media:thumbnail']) 
                ? item['media:thumbnail'][0] 
                : item['media:thumbnail'];
              image = mediaThumbnail?.$?.url || mediaThumbnail?.url || image;
            } else if (item['content:encoded']) {
              const imgMatch = item['content:encoded'].match(/<img[^>]+src=["']([^"']+)["']/i);
              if (imgMatch?.[1]) image = imgMatch[1];
            } else if (item.content) {
              const imgMatch = item.content.match(/<img[^>]+src=["']([^"']+)["']/i);
              if (imgMatch?.[1]) image = imgMatch[1];
            } else if (item.description) {
              const imgMatch = item.description.match(/<img[^>]+src=["']([^"']+)["']/i);
              if (imgMatch?.[1]) image = imgMatch[1];
            }
            
            // ✅ Scraping désactivé par défaut pour accélérer
            // Si vous voulez l'activer, décommentez ces lignes:
            // if (image === "/images/default-news.jpg" && item.link) {
            //   const scrapedImage = await scrapeImageFromPage(item.link);
            //   if (scrapedImage) image = scrapedImage;
            // }
            
            return {
              title: item.title,
              link: item.link,
              image,
              source: feed.name
            };
          })
        );
        
        console.log(`✅ ${feed.name}: ${fetchedArticles.length} articles`);
        return fetchedArticles;
        
      } catch (error) {
        console.error(`❌ ${feed.name}:`, error.message);
        return []; // ✅ Retourner tableau vide en cas d'erreur
      }
    });
    
    // ✅ Attendre toutes les requêtes en parallèle
    const feedResults = await Promise.all(feedPromises);
    
    // ✅ Fusionner tous les résultats
    feedResults.forEach(feedArticles => {
      articles = [...articles, ...feedArticles];
    });
    
    // ✅ Si aucun article, utiliser le cache même périmé
    if (articles.length === 0) {
      console.error("⚠️ Aucun article récupéré");
      
      if (memoryCache.data) {
        console.log('📡 Cache périmé utilisé');
        return res.status(200).json(memoryCache.data);
      }
      
      return res.status(500).json({ error: "Aucun article disponible" });
    }
    
    // Mélanger les articles
    articles.sort(() => Math.random() - 0.5);
    
    // Mettre à jour le cache
    memoryCache = {
      data: articles,
      timestamp: now
    };
    
    console.log(`✅ ${articles.length} articles total retournés`);
    return res.status(200).json(articles);
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    
    // ✅ En cas d'erreur, retourner le cache s'il existe
    if (memoryCache.data) {
      console.log('📡 Cache utilisé (erreur)');
      return res.status(200).json(memoryCache.data);
    }
    
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}