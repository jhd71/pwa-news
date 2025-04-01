const axios = require('axios');
const cheerio = require('cheerio');

async function fetchCreusotInfos(req, res) {
  console.log("API Creusot-Infos appelée");
  
  // Activer CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log("Tentative de fetch sur Creusot-Infos");
    // URL de la page des faits divers
    const url = 'https://www.creusot-infos.com/news/faits-divers/';
    
    // Utiliser un User-Agent pour éviter d'être bloqué
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
      },
      timeout: 10000 // 10 secondes de timeout
    });
    
    console.log("HTML récupéré, taille:", data.length);
    
    // Charger le HTML dans cheerio (similaire à jQuery)
    const $ = cheerio.load(data);
    
    // Tableau pour stocker les articles
    const articles = [];
    
    // Afficher les premiers éléments du DOM pour le débogage
    console.log("Structure de la page :");
    console.log("Nombre d'éléments .news-item trouvés:", $('.news-item').length);
    console.log("Nombre d'éléments article trouvés:", $('article').length);
    console.log("Nombre d'éléments .article trouvés:", $('.article').length);
    
    // Essayons différents sélecteurs (à ajuster selon la structure réelle)
    $('.news-item, article, .article, .news, .post, .entry').each((index, element) => {
      // Limiter à 5 articles maximum
      if (index < 5) {
        // Essayer différentes structures de titre et lien
        const titleEl = $(element).find('h1, h2, h3, .title, a.title, .headline');
        const title = titleEl.first().text().trim();
        
        // Essayer de trouver le lien de différentes manières
        let link = '';
        if (titleEl.is('a')) {
          link = titleEl.attr('href');
        } else {
          link = $(element).find('a').first().attr('href');
        }
        
        // Essayer de trouver une image
        const imageEl = $(element).find('img').first();
        const image = imageEl.length ? imageEl.attr('src') : '/images/AM-192-v2.png';
        
        // Essayer de trouver une date
        const dateEl = $(element).find('.date, time, .time, .post-date, .meta-date');
        const dateText = dateEl.length ? dateEl.first().text().trim() : new Date().toISOString();
        
        // Essayer de trouver une description
        const descEl = $(element).find('p, .excerpt, .summary, .description');
        const description = descEl.first().text().trim().substring(0, 150) + '...';
        
        console.log(`Article trouvé: ${title}`);
        
        // Vérifier que nous avons au moins un titre et un lien
        if (title && link) {
          // Construire l'URL complète si le lien est relatif
          const fullLink = link.startsWith('http') ? link : `https://www.creusot-infos.com${link}`;
          
          articles.push({
            title,
            link: fullLink,
            image: image.startsWith('http') ? image : `https://www.creusot-infos.com${image}`,
            date: dateText,
            source: 'Creusot Infos',
            description
          });
        }
      }
    });
    
    if (articles.length === 0) {
      console.log("Aucun article trouvé. Tentative avec structure HTML brute:");
      // Si aucun article n'est trouvé, analyser un extrait du HTML pour comprendre la structure
      console.log(data.substring(0, 3000));
    }
    
    // Retourner les articles au format JSON
    res.status(200).json({
      success: true,
      count: articles.length,
      articles
    });

  } catch (error) {
    console.error('Erreur lors du scraping de Creusot-Infos:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des articles: ' + error.message
    });
  }
}

// Exporter la fonction pour serverless
module.exports = fetchCreusotInfos;