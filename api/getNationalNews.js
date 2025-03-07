const Parser = require('rss-parser');
const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
  },
  timeout: 5000,
  customFields: {
    item: ['media:content', 'enclosure', 'image', 'thumbnail']
  }
});

module.exports = async (req, res) => {
  try {
    const feeds = [
      { name: 'Morandini', url: 'http://www.jeanmarcmorandini.com/rss.php', max: 3 },
      { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/news-24-7/', max: 3 },
      { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss', max: 3 }
    ];

    const allArticles = [];

    for (const feed of feeds) {
      try {
        console.log(`Récupération des articles de ${feed.name}...`);
        const feedData = await parser.parseURL(feed.url);
        console.log(`✅ ${feed.name} - ${feedData.items.length} articles trouvés`);

        const articles = feedData.items.slice(0, feed.max).map(item => {
          let imageUrl =
            item.enclosure?.url ||
            item['media:content']?.url ||
            item.image ||
            item.thumbnail ||
            null;

          return {
            title: item.title,
            link: item.link,
            date: item.pubDate || item.isoDate,
            image: imageUrl,
            source: feed.name
          };
        });

        allArticles.push(...articles);
      } catch (feedError) {
        console.error(`❌ Erreur avec ${feed.name}:`, feedError.message);
      }
    }

    if (allArticles.length === 0) {
      return res.status(500).json({ error: 'Aucun article trouvé' });
    }

    res.status(200).json(allArticles);
  } catch (error) {
    console.error('❌ Erreur serveur:', error.message);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};
