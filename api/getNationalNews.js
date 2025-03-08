const Parser = require('rss-parser');
const parser = new Parser();

// 🔄 Mélange aléatoire des articles
function shuffleArticles(articles) {
  for (let i = articles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [articles[i], articles[j]] = [articles[j], articles[i]];
  }
  return articles;
}

module.exports = async (req, res) => {
  try {
    const feeds = [
      { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/news-24-7/', max: 3 },
      { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss', max: 3 },
      { name: '20 Minutes', url: 'https://www.20minutes.fr/rss/actu-france.xml', max: 3 },
      { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml', max: 3 }
    ];

    let articles = [];

    for (const feed of feeds) {
      try {
        console.log(`Récupération de ${feed.name}...`);
        const feedData = await parser.parseURL(feed.url);
        console.log(`Articles trouvés pour ${feed.name}:`, feedData.items.length);

        const fetchedArticles = feedData.items.slice(0, feed.max).map(item => {
          let image = item.enclosure?.url || null;

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
        console.error(`Erreur avec ${feed.name}:`, error.message);
      }
    }

    if (articles.length === 0) {
      console.error("Aucun article récupéré, vérifiez les flux RSS !");
      return res.status(500).json({ error: "Aucun article récupéré" });
    }

    // ✅ Appliquer le mélange aléatoire AVANT de renvoyer les données
    return res.status(200).json(shuffleArticles(articles).slice(0, 10));

  } catch (error) {
    console.error('Erreur générale:', error.message);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
