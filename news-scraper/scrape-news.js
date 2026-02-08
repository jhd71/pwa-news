// =====================================================
// SCRAPER D'ACTUALITÉS LOCALES
// Récupère titres + liens (pas le contenu complet)
// =====================================================

const { createClient } = require('@supabase/supabase-js');
const Parser = require('rss-parser');
const cheerio = require('cheerio');

// Configuration Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parser RSS
const parser = new Parser({
    timeout: 10000,
    headers: {
        'User-Agent': 'ActuMedia-NewsAggregator/1.0'
    }
});

// =====================================================
// SOURCES D'ACTUALITÉS
// =====================================================
const NEWS_SOURCES = [
    {
        name: 'France 3 Bourgogne',
        type: 'rss',
        url: 'https://france3-regions.francetvinfo.fr/bourgogne-franche-comte/rss',
        icon: '📺',
        filter: ['Montceau', 'Creusot', 'Chalon', 'Saône-et-Loire', 'Autun', 'Blanzy', 'Gueugnon']
    },
    {
        name: 'Le JSL',
        type: 'rss',
        url: 'https://www.lejsl.com/rss',
        icon: '📰',
        filter: ['Montceau', 'Creusot', 'Chalon', 'Blanzy', 'Sanvignes', 'Saint-Vallier', 'Gueugnon', 'Perrecy', 'Génelard', 'Torcy', 'Le Breuil']
    },
    {
        name: 'Creusot Infos',
        type: 'rss',
        url: 'https://www.creusot-infos.com/feed/',
        icon: '📰',
        filter: null
    }
];

// =====================================================
// FONCTIONS UTILITAIRES
// =====================================================

// Nettoyer le titre
function cleanTitle(title) {
    if (!title) return '';
    return title
        .replace(/<[^>]*>/g, '') // Supprimer HTML
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
}

// Nettoyer la description (max 200 caractères)
function cleanDescription(desc) {
    if (!desc) return null;
    let clean = desc
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
    
    if (clean.length > 200) {
        clean = clean.substring(0, 197) + '...';
    }
    return clean;
}

// Vérifier si l'article correspond aux filtres
function matchesFilter(text, filters) {
    if (!filters || filters.length === 0) return true;
    if (!text) return false;
    
    const lowerText = text.toLowerCase();
    return filters.some(f => lowerText.includes(f.toLowerCase()));
}

// =====================================================
// SCRAPING RSS
// =====================================================
async function scrapeRSS(source) {
    console.log(`📡 Scraping RSS: ${source.name}...`);
    const articles = [];
    
    try {
        const feed = await parser.parseURL(source.url);
        console.log(`   → ${feed.items.length} articles trouvés`);
        
        for (const item of feed.items) {
            const title = cleanTitle(item.title);
            const description = cleanDescription(item.contentSnippet || item.content || item.description);
            
            // Appliquer le filtre si défini
            if (source.filter) {
                const textToCheck = `${title} ${description || ''}`;
                if (!matchesFilter(textToCheck, source.filter)) {
                    continue;
                }
            }
            
            // Parser la date
            let publishedAt = null;
            if (item.pubDate || item.isoDate) {
                publishedAt = new Date(item.pubDate || item.isoDate).toISOString();
            }
            
            articles.push({
                title: title,
                url: item.link,
                source: source.name,
                source_icon: source.icon,
                description: description,
                published_at: publishedAt,
                category: 'local'
            });
        }
        
        console.log(`   ✅ ${articles.length} articles retenus après filtrage`);
        
    } catch (error) {
        console.error(`   ❌ Erreur RSS ${source.name}:`, error.message);
    }
    
    return articles;
}

// =====================================================
// SAUVEGARDE EN BASE
// =====================================================
async function saveArticles(articles) {
    console.log(`\n💾 Sauvegarde de ${articles.length} articles...`);
    
    let inserted = 0;
    let skipped = 0;
    
    for (const article of articles) {
        try {
            // Upsert basé sur l'URL (évite les doublons)
            const { data, error } = await supabase
                .from('news_feed')
                .upsert(article, { 
                    onConflict: 'url',
                    ignoreDuplicates: true 
                });
            
            if (error) {
                if (error.code === '23505') {
                    skipped++;
                } else {
                    console.error(`   ❌ Erreur insertion:`, error.message);
                }
            } else {
                inserted++;
            }
        } catch (err) {
            console.error(`   ❌ Exception:`, err.message);
        }
    }
    
    console.log(`   ✅ ${inserted} nouveaux articles`);
    console.log(`   ⏭️ ${skipped} doublons ignorés`);
}

// =====================================================
// NETTOYAGE DES ANCIENS ARTICLES
// =====================================================
async function cleanOldArticles() {
    console.log(`\n🧹 Nettoyage des articles > 30 jours...`);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data, error } = await supabase
        .from('news_feed')
        .delete()
        .lt('published_at', thirtyDaysAgo.toISOString());
    
    if (error) {
        console.error(`   ❌ Erreur nettoyage:`, error.message);
    } else {
        console.log(`   ✅ Nettoyage terminé`);
    }
}

// =====================================================
// FONCTION PRINCIPALE
// =====================================================
async function main() {
    console.log('='.repeat(50));
    console.log('🗞️ SCRAPER ACTUALITÉS LOCALES');
    console.log('='.repeat(50));
    console.log(`📅 ${new Date().toLocaleString('fr-FR')}\n`);
    
    const allArticles = [];
    
    // Scraper chaque source
    for (const source of NEWS_SOURCES) {
        if (source.type === 'rss') {
            const articles = await scrapeRSS(source);
            allArticles.push(...articles);
        }
        
        // Pause entre les sources
        await new Promise(r => setTimeout(r, 1000));
    }
    
    console.log(`\n📊 Total: ${allArticles.length} articles collectés`);
    
    // Sauvegarder
    if (allArticles.length > 0) {
        await saveArticles(allArticles);
    }
    
    // Nettoyer les vieux articles
    await cleanOldArticles();
    
    console.log('\n✅ Scraping terminé !');
}

// Lancer
main().catch(err => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
});
