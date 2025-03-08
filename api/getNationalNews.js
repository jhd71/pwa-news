const Parser = require('rss-parser');
const parser = new Parser();

module.exports = async (req, res) => {
  try {
    const feeds = [
      { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/news-24-7/', max: 3 },
      { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss', max: 3 },
      { name: 'jeux_video', url: 'https://cdn.feedcontrol.net/8812/14715-umH6LQsvsXz0D.xml', max: 3 }
    ];

    const allArticles = [];

    for (const feed of feeds) {
      try {
        const feedData = await parser.parseURL(feed.url);

        const articles = feedData.items.slice(0, feed.max).map(item => {
          let image = item.enclosure?.url || null;

          // Récupère l'image depuis plusieurs sources possibles
let image = item.enclosure?.url || 
            item["media:content"]?.url || 
            item.image || 
            item.thumbnail || 
            "https://via.placeholder.com/400x200?text=Pas+d'image";

// Si l'image n'est toujours pas trouvée, essaie de l'extraire du contenu HTML
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
        console.error(`Erreur avec ${feed.name}:`, error.message);
      }
    }

    // **🔀 Mélange et équilibre les articles**
    const shuffledArticles = [];
    while (allArticles.length > 0) {
      for (let i = 0; i < feeds.length; i++) {
        const articleIndex = allArticles.findIndex(a => a.source === feeds[i].name);
        if (articleIndex !== -1) {
          shuffledArticles.push(allArticles.splice(articleIndex, 1)[0]);
        }
      }
    }

    return res.status(200).json(shuffledArticles.slice(0, 5)); // ✅ Prend 5 articles sans répétition
  } catch (error) {
    console.error('Erreur générale:', error.message);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
