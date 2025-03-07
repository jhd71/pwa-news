const Parser = require('rss-parser');
const parser = new Parser();

module.exports = async (req, res) => {
  try {
    const feeds = [
      { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/news-24-7/', max: 3 },
      { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss', max: 3 }
    ];

    const articles = [];

    for (const feed of feeds) {
      try {
        const feedData = await parser.parseURL(feed.url);
        const fetchedArticles = feedData.items.slice(0, feed.max).map(item => ({
          title: item.title,
          link: item.link,
          image: item.enclosure?.url || "images/default-news.jpg", // Image par défaut
          source: feed.name
        }));

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
