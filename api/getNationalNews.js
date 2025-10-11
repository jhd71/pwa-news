// api/getNationalNews.js
import Parser from 'rss-parser';

// Fonction pour scraper l'image depuis la page
async function scrapeImageFromPage(url) {
  try {
    const response = await fetch(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; NewsApp/1.0)'
      },
      signal: AbortSignal.timeout(3000) // Timeout de 3 secondes
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    
    // Chercher les images dans différents formats
    const patterns = [
      /<meta property="og:image" content="([^"]+)"/i,
      /<meta name="twitter:image" content="([^"]+)"/i,
      /<meta property="og:image:secure_url" content="([^"]+)"/i,
      /<img[^>]+class="[^"]*wp-post-image[^"]*"[^>]+src="([^"]+)"/i,
      /<article[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erreur scraping image:', error.message);
    return null;
  }
}

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
    
    const parser = new Parser({
      customFields: {
        item: [
          ['media:content', 'media:content'],
          ['media:thumbnail', 'media:thumbnail'],
          ['content:encoded', 'content:encoded'],
          ['description', 'description']
        ]
      }
    });
    
		// Limiter à quelques flux fiables
		const feeds = [
	{ name: 'Informateur de Bourgogne', url: 'https://linformateurdebourgogne.com/feed/', max: 2 },	
	{ name: 'Montceau News', url: 'https://montceau-news.com/feed/', max: 2 },
    { name: 'France 3 Bourgogne', url: 'https://france3-regions.francetvinfo.fr/bourgogne-franche-comte/rss', max: 2 },
	{ name: 'lejsl montceau-les-mines', url: 'https://www.lejsl.com/edition-montceau-les-mines/rss', max: 2 },
	{ name: 'lejsl Saône-et-Loire', url: 'https://www.lejsl.com/saone-et-loire/rss', max: 2 },
    { name: 'France Bleu infos', url: 'https://www.francebleu.fr/rss/bourgogne/rubrique/infos.xml', max: 2 },
	{ name: 'ARS Bourgogne-Franche-Comté', url: 'https://www.bourgogne-franche-comte.ars.sante.fr/rss.xml', max: 2 },
	{ name: 'France Bleu sports', url: 'https://www.francebleu.fr/rss/bourgogne/rubrique/sports.xml', max: 2 }
];
    
    let articles = [];
    
    // ========== CREUSOT INFOS (scraper GitHub) ==========
    try {
        console.log('📡 Récupération de Creusot Infos (scraper)...');
        
        const creusotUrl = 'https://raw.githubusercontent.com/jhd71/scraper-creusot/main/data/articles.json';
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const creusotResponse = await fetch(creusotUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsApp/1.0)' },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (creusotResponse.ok) {
            const creusotData = await creusotResponse.json();
            console.log(`✅ Creusot Infos: ${creusotData.length} articles trouvés`);
            
            // Prendre les 2 premiers articles
            const formattedCreusot = creusotData.slice(0, 2).map(article => ({
                title: article.title,
                link: article.link,
                image: article.image && 
                       !article.image.includes('logo.png') && 
                       !article.image.includes('bourgogne-infos.com') && // ✅ Exclure bourgogne-infos aussi
                       article.image.length > 10
                    ? article.image 
                    : "/images/default-news.jpg",
                source: 'Creusot Infos'
            }));
            
            articles = [...articles, ...formattedCreusot];
            console.log(`✅ ${formattedCreusot.length} articles Creusot Infos ajoutés`);
        }
    } catch (error) {
        console.error('❌ Erreur avec Creusot Infos:', error.message);
        // Continuer avec les autres flux
    }
    // ====================================================
    
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
        
        const fetchedArticles = await Promise.all(
        feedData.items.slice(0, feed.max).map(async (item) => {
          // Extraction d'image améliorée
          let image = "/images/default-news.jpg";
          
          // 1. Enclosure (format standard)
          if (item.enclosure?.url) {
            image = item.enclosure.url;
          }
          // 2. Media:content
          else if (item['media:content']) {
            if (Array.isArray(item['media:content'])) {
              image = item['media:content'][0]?.$?.url || item['media:content'][0]?.url;
            } else {
              image = item['media:content']?.$?.url || item['media:content']?.url;
            }
          }
          // 3. Media:thumbnail
          else if (item['media:thumbnail']) {
            if (Array.isArray(item['media:thumbnail'])) {
              image = item['media:thumbnail'][0]?.$?.url || item['media:thumbnail'][0]?.url;
            } else {
              image = item['media:thumbnail']?.$?.url || item['media:thumbnail']?.url;
            }
          }
          // 4. Extraire du contenu HTML (content:encoded)
          else if (item['content:encoded']) {
            const imgMatch = item['content:encoded'].match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch?.[1]) {
              image = imgMatch[1];
            }
          }
          // 5. Extraire du contenu HTML (content)
          else if (item.content) {
            const imgMatch = item.content.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch?.[1]) {
              image = imgMatch[1];
            }
          }
          // 6. Extraire de la description
          else if (item.description) {
            const imgMatch = item.description.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch?.[1]) {
              image = imgMatch[1];
            }
          }
          
          // 7. SI TOUJOURS PAS D'IMAGE : Scraper la page
          if (image === "/images/default-news.jpg" && item.link) {
            console.log(`🔍 Scraping image pour: ${feed.name}`);
            const scrapedImage = await scrapeImageFromPage(item.link);
            if (scrapedImage) {
              image = scrapedImage;
              console.log(`✅ Image trouvée par scraping`);
            }
          }
          
          return {
            title: item.title,
            link: item.link,
            image,
            source: feed.name
          };
        })
      );
        
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
