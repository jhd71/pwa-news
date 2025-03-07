const Parser = require('rss-parser');

module.exports = async (req, res) => {
  try {
    const parser = new Parser({
      customFields: {
        item: ['media:content', 'enclosure']
      }
    });

    const feeds = [
      { name: 'Morandini', url: 'http://www.jeanmarcmorandini.com/rss.php', max: 3 },
      { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/news-24-7/', max: 3 },
      { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss', max: 3 }
    ];

    const allArticles = [];

    for (const feed of feeds) {
      try {
        const feedData = await parser.parseURL(feed.url);

        const articles = feedData.items.slice(0, feed.max).map(item => ({
          title: item.title,
          link: item.link,
          date: item.pubDate || item.isoDate,
          source: feed.name,
          image: item['media:content'] ? item['media:content'].url :
                 item.enclosure ? item.enclosure.url : null
        }));

        allArticles.push(...articles);
      } catch (error) {
        console.error(`Erreur avec ${feed.name}:`, error.message);
      }
    }

    res.status(200).json(allArticles.slice(0, 10));

  } catch (error) {
    console.error('Erreur générale:', error.message);
    res.status(500).json({ error: error.message });
  }
};
