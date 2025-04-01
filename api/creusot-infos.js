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
    
    // Récupérer le contenu HTML de la page
    const { data } = await axios.get(url);
    console.log("HTML récupéré, taille:", data.length);
    
    // Charger le HTML dans cheerio (similaire à jQuery)
    const $ = cheerio.load(data);
    
    // Débogage : Vérifier les sélecteurs principaux
    console.log("Nombre d'éléments .content_area trouvés:", $('.content_area').length);
    console.log("Nombre d'éléments .content_zone trouvés:", $('.content_zone').length);
    console.log("Nombre d'éléments .sujet trouvés:", $('.sujet').length);
    
    // Si les sélecteurs ci-dessus ne trouvent rien, essayons des sélecteurs plus génériques
    if ($('.sujet').length === 0) {
      console.log("Recherche d'articles avec des sélecteurs alternatifs");
      console.log("Nombre d'éléments article trouvés:", $('article').length);
      console.log("Nombre d'éléments .article trouvés:", $('.article').length);
      console.log("Nombre d'éléments .news-item trouvés:", $('.news-item').length);
      
      // Récupérer le HTML des premières sections pour analyse
      console.log("Extrait du HTML pour analyse:", data.substring(0, 1000));
    }
    
    // Tableau pour stocker les articles
    const articles = [];
    
    // Sélectionnez les articles (ajustez le sélecteur selon la structure réelle du site)
    $('.content_area .content_zone .sujet').each((index, element) => {
      // Limiter à 10 articles maximum
      if (index < 10) {
        const title = $(element).find('.titre_sujet a').text().trim();
        const link = $(element).find('.titre_sujet a').attr('href');
        const image = $(element).find('img').attr('src') || '';
        const date = $(element).find('.date_sujet').text().trim();
        const description = $(element).find('.content_sujet').text().trim().substring(0, 150) + '...';
        
        // Vérifier que nous avons au moins un titre et un lien
        if (title && link) {
          // Construire l'URL complète si le lien est relatif
          const fullLink = link.startsWith('http') ? link : `https://www.creusot-infos.com${link}`;
          
          articles.push({
            title,
            link: fullLink,
            image,
            date,
            description,
            source: 'Creusot-Infos'
          });
        }
      }
    });
    
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
      error: 'Erreur lors de la récupération des articles'
    });
  }
}

// Exporter la fonction pour serverless
module.exports = fetchCreusotInfos;