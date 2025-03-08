const Parser = require('rss-parser');
const parser = new Parser();

module.exports = async (req, res) => {
  try {
    const feeds = [
      { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/news-24-7/', max: 3 },
      { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss', max: 3 },
      { name: 'jeux_video', url: 'https://cdn.feedcontrol.net/8812/14715-umH6LQsvsXz0D.xml', max: 3 }
    ];

    const articles = [];

    for (const feed of feeds) {
      try {
        console.log(`Récupération de ${feed.name}...`);
        const feedData = await parser.parseURL(feed.url);
        console.log(`Articles trouvés pour ${feed.name}:`, feedData.items.length);

        const fetchedArticles = feedData.items.slice(0, feed.max).map(item => {
          let image = item.enclosure?.url || null; // Vérifie d'abord si une image est déjà dans enclosure

          // Tentative d'extraction depuis content
          if (!image && item.content) {
            const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch) {
              image = imgMatch[1];
            }
          }

          // Si aucune image trouvée, utilise une image par défaut
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

    // Si aucun article n'a été récupéré, renvoyer une erreur pour éviter un JSON vide
    if (articles.length === 0) {
      console.error("Aucun article récupéré, vérifiez les flux RSS !");
      return res.status(500).json({ error: "Aucun article récupéré" });
    }

    return res.status(200).json(articles.slice(0, 10));
  } catch (error) {
    console.error('Erreur générale:', error.message);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
