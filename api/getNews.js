// api/getNews.js - API pour récupérer les actualités locales
import Parser from 'rss-parser';

// Cache en mémoire
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
let cachedArticles = null;
let lastFetchTime = null;

export default async function handler(req, res) {
    // En-têtes CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Vérifier le cache
    const now = Date.now();
    if (cachedArticles && lastFetchTime && (now - lastFetchTime < CACHE_DURATION)) {
        console.log('📡 Retour du cache');
        return res.status(200).json(cachedArticles);
    }
    
    try {
        const parser = new Parser({
            customFields: {
                item: [
                    ['media:content', 'mediaContent', { keepArray: false }],
                    ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
                    ['enclosure', 'enclosure', { keepArray: false }]
                ]
            }
        });
        
        // Flux RSS - max plus élevé pour avoir du choix après dédoublonnage
        const feeds = [
            { name: 'Montceau News', url: 'https://montceau-news.com/rss', max: 4 },
            { name: "L'Informateur", url: 'http://www.linformateurdebourgogne.com/feed/', max: 3 },
            { name: 'Le JSL', url: 'https://www.lejsl.com/edition-montceau-les-mines/rss', max: 4 },
            { name: 'Creusot Infos', url: 'https://raw.githubusercontent.com/jhd71/scraper-creusot/main/data/articles.json', max: 3, type: 'json' },
        ];

        // Fonction pour extraire l'image d'un article RSS
        function extractImage(item) {
            // 1. media:content
            if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
                return item.mediaContent.$.url;
            }
            // 2. media:thumbnail
            if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) {
                return item.mediaThumbnail.$.url;
            }
            // 3. enclosure (type image)
            if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image')) {
                return item.enclosure.url;
            }
            // 4. Chercher une image dans le contenu HTML
            const content = item['content:encoded'] || item.content || item.summary || '';
            const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch && imgMatch[1]) {
                return imgMatch[1];
            }
            return '';
        }

        // Récupérer les articles
        const fetchPromises = feeds.map(feed => {
            return new Promise(async (resolve) => {
                try {
                    console.log(`📡 ${feed.name}...`);
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    
                    const response = await fetch(feed.url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (compatible; ActuMedia/2.0)'
                        },
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    
                    if (feed.type === 'json') {
                        const json = await response.json();
                        const articles = json.slice(0, feed.max).map(item => ({
                            title: item.title,
                            link: item.link,
                            image: item.image || '',
                            date: item.date,
                            source: item.source || feed.name
                        }));
                        return resolve(articles);
                    } else {
                        const data = await response.text();
                        const feedData = await parser.parseString(data);

                        console.log(`✅ ${feed.name}: ${feedData.items.length} articles`);

                        const articles = feedData.items.slice(0, feed.max).map(item => ({
                            title: item.title,
                            link: item.link,
                            image: extractImage(item),
                            date: item.pubDate || item.isoDate,
                            source: feed.name
                        }));

                        return resolve(articles);
                    }
                } catch (feedError) {
                    console.error(`❌ ${feed.name}:`, feedError.message);
                    resolve([]);
                }
            });
        });

        // Timeout global
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => {
                console.log('⚠️ Timeout global');
                resolve([]);
            }, 8000);
        });
        
        const results = await Promise.race([
            Promise.all(fetchPromises),
            timeoutPromise.then(() => feeds.map(() => []))
        ]);
        
        const allArticles = results.flat();
        
        if (allArticles.length === 0) {
            console.error("⚠️ Aucun article récupéré");
            
            if (cachedArticles) {
                console.log('📡 Utilisation du cache périmé');
                return res.status(200).json(cachedArticles);
            }
            
            return res.status(500).json({ error: "Aucun article récupéré" });
        }
        
        // Dédoublonner par titre (certains articles apparaissent dans plusieurs flux)
        const seen = new Set();
        const uniqueArticles = allArticles.filter(article => {
            const key = article.title.toLowerCase().trim();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        
        // Trier par date
        const sortedArticles = uniqueArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Limiter à 12 articles
        const finalArticles = sortedArticles.slice(0, 12);

        // Mettre à jour le cache
        cachedArticles = finalArticles;
        lastFetchTime = now;

        console.log(`✅ ${finalArticles.length} articles retournés`);
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
