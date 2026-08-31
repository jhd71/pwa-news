// api/getNews.js - API pour récupérer les actualités locales
import Parser from 'rss-parser';

// Cache en mémoire
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
let cachedArticles = null;
let lastFetchTime = null;

// Cache des images trouvees sur la page de l'article (cle = lien).
// Evite de retelecharger la meme page a chaque renouvellement du cache.
const imageParLien = new Map();
const MAX_CACHE_IMAGES = 200;

// Lit une balise <meta> quel que soit l'ordre des attributs.
// Meme logique que api/extract-article.js
function lireMeta(html, attribut, valeur) {
    let m = html.match(new RegExp(`<meta[^>]*${attribut}=["']${valeur}["'][^>]*content=(["'])([\\s\\S]*?)\\1`, 'i'));
    if (m) return m[2];
    m = html.match(new RegExp(`<meta[^>]*content=(["'])([\\s\\S]*?)\\1[^>]*${attribut}=["']${valeur}["']`, 'i'));
    if (m) return m[2];
    return null;
}

// Va chercher l'illustration sur la page de l'article quand le flux RSS n'en fournit pas.
// Beaucoup de flux (Le JSL, L'Informateur) omettent l'image alors que la page en a une.
async function imageDepuisLaPage(lien) {
    if (!lien) return '';
    if (imageParLien.has(lien)) return imageParLien.get(lien);

    const controleur = new AbortController();
    const minuteur = setTimeout(() => controleur.abort(), 2500);

    try {
        const reponse = await fetch(lien, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ActuMedia/2.0)' },
            signal: controleur.signal
        });
        if (!reponse.ok) throw new Error('HTTP ' + reponse.status);

        // og:image vit dans le <head> : inutile d'analyser tout le document
        const html = (await reponse.text()).slice(0, 150000);

        let src = lireMeta(html, 'property', 'og:image')
               || lireMeta(html, 'name', 'og:image')
               || lireMeta(html, 'name', 'twitter:image')
               || lireMeta(html, 'property', 'twitter:image')
               || '';

        if (src) {
            src = src.replace(/&amp;/g, '&').trim();
            // Rendre l'URL absolue si le site l'a ecrite en relatif
            try { src = new URL(src, lien).href; } catch (e) { src = ''; }
        }

        if (imageParLien.size >= MAX_CACHE_IMAGES) imageParLien.clear();
        imageParLien.set(lien, src);
        return src;

    } catch (e) {
        console.log(`\u26A0\uFE0F Pas d'image sur ${lien} : ${e.message}`);
        imageParLien.set(lien, '');
        return '';
    } finally {
        clearTimeout(minuteur);
    }
}

export default async function handler(req, res) {
    // En-têtes CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');

    // Cache CDN Vercel : la réponse est gardée 10 min sur les serveurs de
    // Vercel et servie instantanément à TOUS les visiteurs, même quand la
    // fonction est relancée à froid (le cache en mémoire ci-dessous, lui,
    // est perdu à chaque redémarrage). Passé 10 min, l'ancienne réponse est
    // encore servie pendant 1 h le temps de se régénérer en arrière-plan.
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');

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

        // Fonction pour extraire le résumé d'un article RSS
        function extractExcerpt(item) {
            // rss-parser fournit contentSnippet : le contenu débarrassé de son HTML
            let text = item.contentSnippet || item.summary || item.content || item.description || '';

            // Filet de sécurité si le HTML est passé quand même
            text = text.replace(/<[^>]*>/g, ' ');

            // Décoder les entités HTML.
            // D'abord les numériques (&#233; et &#xE9;), qui couvrent tout,
            // puis les nommées les plus fréquentes en français.
            text = text.replace(/&#(\d+);/g, (m, code) => String.fromCharCode(parseInt(code, 10)));
            text = text.replace(/&#x([0-9a-fA-F]+);/g, (m, code) => String.fromCharCode(parseInt(code, 16)));

            const entites = {
                nbsp: ' ', quot: '"', apos: "'", lsquo: "'", rsquo: "'",
                ldquo: '"', rdquo: '"', laquo: '«', raquo: '»',
                hellip: '…', ndash: '–', mdash: '—', deg: '°', euro: '€',
                agrave: 'à', acirc: 'â', ccedil: 'ç',
                eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë',
                icirc: 'î', iuml: 'ï', ocirc: 'ô', oelig: 'œ',
                ugrave: 'ù', ucirc: 'û', uuml: 'ü',
                Agrave: 'À', Ccedil: 'Ç', Eacute: 'É', Egrave: 'È', Ocirc: 'Ô',
                lt: '<', gt: '>'
            };
            text = text.replace(/&([a-zA-Z]+);/g, (m, nom) => entites[nom] !== undefined ? entites[nom] : m);

            // &amp; en dernier, sinon on ré-décoderait les entités déjà traitées
            text = text.replace(/&amp;/g, '&');

            // Espaces multiples et sauts de ligne
            text = text.replace(/\s+/g, ' ').trim();

            // Couper proprement à 200 caractères, sans casser un mot
            if (text.length > 200) {
                text = text.slice(0, 200);
                const lastSpace = text.lastIndexOf(' ');
                if (lastSpace > 150) text = text.slice(0, lastSpace);
                text += '…';
            }

            return text;
        }

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
                            excerpt: item.excerpt || item.description || '',
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
                            excerpt: extractExcerpt(item),
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
        
        // Dédoublonner par LIEN et non par titre : Montceau News publie
        // plusieurs « Avis de décès » le même jour, ce sont des articles
        // différents. Deux articles ont toujours des URL distinctes.
        const seen = new Set();
        const uniqueArticles = allArticles.filter(article => {
            const key = (article.link || '').toLowerCase().trim();
            if (!key) return true;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        
        // Trier par date
        const sortedArticles = uniqueArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Limiter à 12 articles
        const finalArticles = sortedArticles.slice(0, 12);

        // Completer les images manquantes depuis la page de l'article.
        // On ne le fait que s'il reste du temps : Vercel coupe la fonction a 10 s
        // et la recuperation des flux a deja consomme une partie du budget.
        const tempsEcoule = Date.now() - now;
        const sansImage = finalArticles.filter(a => !a.image);

        if (sansImage.length > 0 && tempsEcoule < 5000) {
            console.log(`\uD83D\uDDBC\uFE0F ${sansImage.length} article(s) sans image, recherche sur la page...`);
            await Promise.allSettled(sansImage.map(async article => {
                const trouvee = await imageDepuisLaPage(article.link);
                if (trouvee) article.image = trouvee;
            }));
            const recuperees = sansImage.filter(a => a.image).length;
            console.log(`\uD83D\uDDBC\uFE0F ${recuperees}/${sansImage.length} image(s) recuperee(s)`);
        } else if (sansImage.length > 0) {
            console.log(`\u23F1\uFE0F Budget temps depasse (${tempsEcoule} ms), images non completees`);
        }

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
