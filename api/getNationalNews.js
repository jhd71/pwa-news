const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  try {
    const sources = [
      {
        url: 'https://www.jeanmarcmorandini.com/',
        selector: 'article.news-block',
        titleSelector: 'h2 a',
        linkSelector: 'h2 a',
        imageSelector: '.wp-post-image',
        name: 'Morandini'
      },
      {
        url: 'https://www.purepeople.com/',
        selector: '.c-card',
        titleSelector: '.c-card__title a',
        linkSelector: '.c-card__title a',
        imageSelector: '.c-card__image img',
        name: 'Pure People'
      },
      {
        url: 'https://www.terrafemina.com/',
        selector: 'article.post',
        titleSelector: 'h3.entry-title a',
        linkSelector: 'h3.entry-title a',
        imageSelector: '.entry-media img',
        name: 'Terra Femina'
      }
    ];
    
    const articles = [];

    for (const source of sources) {
      try {
        // Ajout d'un User-Agent pour éviter les blocages
        const response = await axios.get(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
          }
        });

        const $ = cheerio.load(response.data);
        
        $(source.selector).slice(0, 3).each((i, el) => {
          const title = $(el).find(source.titleSelector).text().trim();
          let link = $(el).find(source.linkSelector).attr('href');
          
          let image = $(el).find(source.imageSelector).attr('src') || $(el).find(source.imageSelector).attr('data-src');
          
          if (title && link) {
            // Vérification si l'URL est complète
            if (!link.startsWith('http')) {
              link = new URL(link, source.url).href;
            }
            
            articles.push({
              title,
              link,
              image: image || null, // Empêche undefined
              source: source.name,
              date: new Date().toISOString()
            });
          }
        });
      } catch (error) {
        console.error(`Erreur récupération ${source.name}:`, error.message);
      }
    }
    
    const shuffledArticles = articles.sort(() => 0.5 - Math.random());
    
    res.status(200).json(shuffledArticles.slice(0, 10));
  } catch (error) {
    console.error('Erreur globale:', error.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
