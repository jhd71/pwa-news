// /api/getNationalNews.js
const axios = require('axios');
const cheerio = require('cheerio');

export default async function handler(req, res) {
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
      // Vous pouvez ajouter d'autres sources nationales ici
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
    
    // Pour chaque source, récupérer quelques articles
    for (const source of sources) {
      try {
        const response = await axios.get(source.url);
        const $ = cheerio.load(response.data);
        
        $(source.selector).slice(0, 3).each((i, el) => {
          const title = $(el).find(source.titleSelector).text().trim();
          const link = $(el).find(source.linkSelector).attr('href');
          
          // Récupérer l'image si disponible
          let image = $(el).find(source.imageSelector).attr('src');
          if (!image) {
            image = $(el).find(source.imageSelector).attr('data-src');
          }
          
          if (title && link) {
            // S'assurer que l'URL est absolue
            const finalLink = link.startsWith('http') ? link : `${new URL(source.url).origin}${link}`;
            
            articles.push({
              title,
              link: finalLink,
              image,
              source: source.name,
              date: new Date().toISOString()
            });
          }
        });
      } catch (error) {
        console.error(`Erreur récupération ${source.name}:`, error);
      }
    }
    
    // Mélanger les articles des différentes sources
    const shuffledArticles = articles.sort(() => 0.5 - Math.random());
    
    res.status(200).json(shuffledArticles.slice(0, 10));
  } catch (error) {
    console.error('Erreur globale:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}
