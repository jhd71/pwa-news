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
                    'media:content',
                    'media:thumbnail', 
                    'enclosure',
                    'content:encoded'
                ]
            }
        });
        
        // Flux RSS
        const feeds = [
            { name: 'Montceau News', url: 'https://montceau-news.com/rss', max: 3 },
            { name: "L'Informateur", url: 'http://www.linformateurdebourgogne.com/feed/', max: 2 },
            { name: 'Le JSL', url: 'https://www.lejsl.com/edition-montceau-les-mines/rss', max: 3 },
            { name: 'Creusot Infos', url: 'https://raw.githubusercontent.com/jhd71/scraper-creusot/main/data/articles.json', max: 2, type: 'json' },
        ];

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
                            image: item.image || null,
                            date: item.date,
                            source: item.source || feed.name
                        }));
                        return resolve(articles);
                    } else {
                        const data = await response.text();
                        const feedData = await parser.parseString(data);

                        console.log(`✅ ${feed.name}: ${feedData.items.length} articles`);

                        const articles = feedData.items.slice(0, feed.max).map(item => {
                            let image = null;

                            // --- STRATÉGIE 1 : Les champs RSS officiels ---
                            if (item.enclosure && item.enclosure.url) {
                                image = item.enclosure.url;
                            } 
                            else if (item['media:content']) {
                                if (item['media:content'].url) image = item['media:content'].url;
                                else if (item['media:content'].$ && item['media:content'].$.url) image = item['media:content'].$.url;
                            }
                            else if (item['media:thumbnail']) {
                                if (item['media:thumbnail'].url) image = item['media:thumbnail'].url;
                                else if (item['media:thumbnail'].$ && item['media:thumbnail'].$.url) image = item['media:thumbnail'].$.url;
                            }

                            // --- STRATÉGIE 2 : Scanner le HTML (Amélioré pour Lazy Load) ---
                            if (!image) {
                                // On assemble tout le contenu textuel
                                const fullContent = [
                                    item['content:encoded'],
                                    item.content,
                                    item.description,
                                    item.summary
                                ].filter(Boolean).join(' ');

                                // A. Chercher d'abord une balise img standard ou lazy-load
                                // On capture tout ce qui est dans <img ... >
                                const imgTagMatch = fullContent.match(/<img[^>]+>/i);
                                
                                if (imgTagMatch) {
                                    const imgTag = imgTagMatch[0];
                                    
                                    // 1. Chercher 'src'
                                    const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
                                    // 2. Chercher 'data-src' (souvent utilisé par JSL/Wordpress pour le différé)
                                    const dataSrcMatch = imgTag.match(/data-src=["']([^"']+)["']/i);
                                    // 3. Chercher 'srcset' (images haute qualité)
                                    const srcSetMatch = imgTag.match(/srcset=["']([^"'\s]+)/i);

                                    // On prend le meilleur candidat (data-src est souvent meilleur que src s'il existe)
                                    if (dataSrcMatch) image = dataSrcMatch[1];
                                    else if (srcMatch) image = srcMatch[1];
                                    else if (srcSetMatch) image = srcSetMatch[1];
                                }

                                // B. PLAN DE SECOURS : Chercher n'importe quel lien .jpg/.png/.jpeg dans le texte
                                // Utile si l'image est juste un lien sans balise img
                                if (!image) {
                                    const directLinkMatch = fullContent.match(/http[^"'\s]+\.(jpg|jpeg|png|webp)/i);
                                    if (directLinkMatch) {
                                        image = directLinkMatch[0];
                                    }
                                }
                            }

                            // --- STRATÉGIE 3 : Nettoyage final ---
                            // Parfois l'image commence par "//" (ex: //site.com/img.jpg), il faut ajouter https:
                            if (image && image.startsWith('//')) {
                                image = 'https:' + image;
                            }
                            
                            // WordPress Jetpack fallback
                            if (!image && item['content:encoded']) {
                                const origMatch = item['content:encoded'].match(/data-orig-file=["']([^"']+)["']/i);
                                if (origMatch) image = origMatch[1];
                            }

                            return {
                                title: item.title,
                                link: item.link,
                                image: image, // Renvoie l'image trouvée ou null
                                date: item.pubDate || item.isoDate,
                                source: feed.name
                            };
                        });

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
        
        // Trier par date
        const sortedArticles = allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Limiter à 10 articles
        const finalArticles = sortedArticles.slice(0, 10);

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
