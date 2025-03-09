const Parser = require('rss-parser');
const parser = new Parser();

module.exports = async (req, res) => {
  try {
    const feeds = [
      { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/news-24-7/', max: 3 },
      { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss', max: 3 },
      { name: 'JeuxVideo.com', url: 'https://www.jeuxvideo.com/rss/rss.xml', max: 3 },
      { name: 'ActuGaming', url: 'https://www.actugaming.net/feed/', max: 3 }
    ];

    let articles = [];

    for (const feed of feeds) {
      try {
        console.log(`📡 Récupération de ${feed.name}...`);
        const feedData = await parser.parseURL(feed.url);
        console.log(`✅ ${feed.name}: ${feedData.items.length} articles trouvés`);

        const fetchedArticles = feedData.items.slice(0, feed.max).map(item => {
          let image = item.enclosure?.url || item['media:content']?.url || null;

          if (!image && item.content) {
            const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch) {
              image = imgMatch[1];
            }
          }

          if (!image) {
            image = "/images/default-news.jpg"; // Assurez-vous d'avoir cette image sur votre serveur
          }

          return {
            title: item.title,
            link: item.link,
            image,
            source: feed.name
          };
        });

        articles.push(...fetchedArticles);
      } catch (error) {
        console.error(`❌ Erreur avec ${feed.name}:`, error.message);
      }
    }

    if (articles.length === 0) {
      console.error("⚠️ Aucun article récupéré, vérifiez les flux RSS !");
      return res.status(500).json({ error: "Aucun article récupéré" });
    }

    // ✅ Mélanger les articles avant de renvoyer
    articles.sort(() => Math.random() - 0.5);

    return res.status(200).json(articles.slice(0, 10));

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
