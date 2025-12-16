// api/getNews.js - API pour récupérer les actualités locales
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
            { name: 'Montceau News', url: 'https://montceau-news.com/rss', max: 2 },
            { name: "L'Informateur", url: 'http://www.linformateurdebourgogne.com/feed/', max: 2 },
            { name: 'Le JSL', url: 'https://www.lejsl.com/edition-montceau-les-mines/rss', max: 2 },
            { name: 'Creusot Infos', url: 'https://raw.githubusercontent.com/jhd71/scraper-creusot/main/data/articles.json', max: 2, type: 'json' },
        ];

        // Récupérer les articles de chaque flux
        const fetchPromises = feeds.map(feed => {
            return new Promise(async (resolve) => {
                try {
                    console.log(`📡 Tentative pour ${feed.name}...`);
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    
                    const response = await fetch(feed.url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        },
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    if (feed.type === 'json') {
                        const json = await response.json();
                        const articles = json.slice(0, feed.max).map(item => ({
                            title: item.title,
                            link: item.link,
                            image: item.image || "/images/icon-192.png",
                            date: item.date,
                            source: item.source || feed.name
                        }));
                        return resolve(articles);
                    } else {
                        const data = await response.text();
                        const feedData = await parser.parseString(data);

                        console.log(`✅ ${feed.name}: ${feedData.items.length} articles trouvés`);

                        const articles = feedData.items.slice(0, feed.max).map(item => {
                            let image = item.enclosure?.url || item['media:content']?.url || null;
                            if (!image && item.content) {
                                const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
                                if (imgMatch) image = imgMatch[1];
                            }
                            if (!image) image = "/images/icon-192.png";

                            return {
                                title: item.title,
                                link: item.link,
                                image,
                                date: item.pubDate || item.isoDate,
                                source: feed.name
                            };
                        });

                        return resolve(articles);
                    }
                } catch (feedError) {
                    console.error(`❌ Erreur avec ${feed.name}:`, feedError.message);
                    resolve([]);
                }
            });
        });

        // Timeout global
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => {
                console.log('⚠️ Timeout global atteint');
                resolve([]);
            }, 8000);
        });
        
        // Exécuter toutes les promesses
        const results = await Promise.race([
            Promise.all(fetchPromises),
            timeoutPromise.then(() => feeds.map(() => []))
        ]);
        
        // Aplatir les résultats
        const allArticles = results.flat();
        
        if (allArticles.length === 0) {
            console.error("⚠️ Aucun article récupéré");
            
            if (cachedArticles) {
                console.log('📡 Utilisation du cache périmé');
                return res.status(200).json(cachedArticles);
            }
            
            return res.status(500).json({ error: "Aucun article récupéré" });
        }
        
        // Trier par date et mélanger
        const sortedArticles = allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Limiter à 10 articles
        const finalArticles = sortedArticles.slice(0, 10);

        // Mettre à jour le cache
        cachedArticles = finalArticles;
        lastFetchTime = now;

        return res.status(200).json(finalArticles);
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
        
        if (cachedArticles) {
            console.log('📡 Utilisation du cache en cas d\'erreur');
            return res.status(200).json(cachedArticles);
        }
        
        return res.status(500).json({ error: error.message });
    }
}
