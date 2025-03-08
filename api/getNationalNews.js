const Parser = require('rss-parser');
const parser = new Parser();

module.exports = async (req, res) => {
  try {
    const feeds = [
      { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/news-24-7/', max: 3 },
      { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss', max: 3 },
      { name: 'Foot Mercato', url: 'https://rss.app/feeds/G2kPAILpRT1dRmh1.xml', max: 3 },
      { name: 'Morandini', url: 'https://rss.app/feeds/akk06WEums9OVUVA.xml', max: 3 }
    ];

    const allArticles = [];

    for (const feed of feeds) {
      try {
        const feedData = await parser.parseURL(feed.url);

        // Vérifie si le flux contient bien des articles
        if (!feedData.items || feedData.items.length === 0) {
          console.warn(`⚠️ Aucune actualité trouvée pour ${feed.name}`);
          continue; // Passe au prochain flux
        }

        const articles = feedData.items.slice(0, feed.max).map(item => {
          let image = item.enclosure?.url || null;

          // Vérifie si une image est présente dans le contenu HTML
          if (!image && item.content) {
            const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch) {
              image = imgMatch[1];
            }
          }

          return {
            title: item.title || "Titre non disponible",
            link: item.link || "#",
            image: image || "/images/default-news.jpg",
            source: feed.name
          };
        });

        allArticles.push(...articles);
      } catch (error) {
        console.error(`🚨 Erreur avec ${feed.name}:`, error.message);
      }
    }

    // Vérifie si des articles ont été récupérés
    if (allArticles.length === 0) {
      return res.status(500).json({ error: "❌ Aucun article valide récupéré" });
    }

    return res.status(200).json(allArticles.slice(0, 5));
  } catch (error) {
    console.error('❌ Erreur globale:', error.message);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
