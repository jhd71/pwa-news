const Parser = require('rss-parser');
const parser = new Parser();

module.exports = async (req, res) => {
  try {
    const feeds = [
      { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/news-24-7/', max: 3 },
      { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss', max: 3 },
      { name: 'Foot Mercato', url: 'https://rss.app/feeds/G2kPAILpRT1dRmh1.xml', max: 3 },
      { name: 'Morandini', url: 'https://rss.app/feeds/akk06WEums9OVUVA.xml', max: 3 }
    ]; // ✅ Ajout de la virgule manquante

    const articles = [];

    for (const feed of feeds) {
      try {
        const feedData = await parser.parseURL(feed.url);
        
        const fetchedArticles = feedData.items.slice(0, feed.max).map(item => {
          let image = item.enclosure?.url || null;

          // ✅ Vérifier si l'image est présente dans le contenu (RSS.app ne met pas toujours les images dans `enclosure`)
          if (!image && item.content) {
            const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch) {
              image = imgMatch[1]; // Récupère l’image du contenu
            }
          }

          return {
            title: item.title || "Titre non disponible",
            link: item.link || "#",
            image: image || "/images/default-news.jpg", // Image par défaut si aucune trouvée
            source: feed.name
          };
        });

        articles.push(...fetchedArticles);
      } catch (error) {
        console.error(`Erreur avec ${feed.name}:`, error.message);
      }
    }

    return res.status(200).json(articles.slice(0, 10));
  } catch (error) {
    console.error('Erreur générale:', error.message);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

