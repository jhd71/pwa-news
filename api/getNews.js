// api/getNews.js
import Parser from 'rss-parser';
import * as cheerio from 'cheerio'; // 👈 ajoute ceci pour le scraping

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
  { name: 'Creusot Infos', custom: true, max: 2 } // ⬅️ Ajoute cette ligne
    ];
    
	export async function scrapeCreusotInfos(max = 2) {
  const articles = [];

  try {
    const response = await fetch('https://www.creusot-infos.com/news/faits-divers/', {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    $('div.catItemView').each((i, element) => {
      if (i >= max) return;

      const title = $(element).find('h3.catItemTitle a').text().trim();
      const link = $(element).find('h3.catItemTitle a').attr('href');
      const image = $(element).find('.catItemImage img').attr('src') || '/images/AM-192-v2.png';

      if (title && link) {
        articles.push({
          title,
          link: link.startsWith('http') ? link : `https://www.creusot-infos.com${link}`,
          image: image.startsWith('http') ? image : `https://www.creusot-infos.com${image}`,
          date: new Date().toISOString(),
          source: 'Creusot Infos'
        });
      }
    });

    console.log("✅ Articles Creusot Infos :", articles);
  } catch (err) {
    console.error("❌ Erreur scraping Creusot Infos:", err.message);
  }

  return articles;
}

    // Récupérer les articles de chaque flux avec gestion des promesses
    const fetchPromises = feeds.map(feed => {
  if (feed.custom) {
    return scrapeCreusotInfos(feed.max || 2);
  }

  return new Promise(async (resolve) => {
    try {
      console.log(`📡 Tentative pour ${feed.name}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.text();
      const feedData = await parser.parseString(data);
      const articles = feedData.items.slice(0, feed.max).map(item => {
        let image = item.enclosure?.url || item['media:content']?.url || null;
        if (!image && item.content) {
          const match = item.content.match(/<img[^>]+src="([^">]+)"/);
          if (match) image = match[1];
        }
        if (!image) image = "/images/AM-192-v2.png";
        return {
          title: item.title,
          link: item.link,
          image,
          date: item.pubDate || item.isoDate,
          source: feed.name
        };
      });
      resolve(articles);
    } catch (error) {
      console.error(`❌ Erreur avec ${feed.name}:`, error.message);
      resolve([]);
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
