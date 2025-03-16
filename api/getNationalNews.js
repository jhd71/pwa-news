// /api/getNationalNews.js
const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');

// Durée du cache en millisecondes (15 minutes)
const CACHE_DURATION = 15 * 60 * 1000;

// Variable pour stocker les données en cache
let cachedData = null;
let lastFetchTime = null;

module.exports = async (req, res) => {
  try {
    // Configuration CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Gérer les requêtes OPTIONS (CORS preflight)
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Vérifier si les données sont en cache et encore valides
    const now = Date.now();
    if (cachedData && lastFetchTime && (now - lastFetchTime < CACHE_DURATION)) {
      console.log('Retour des données en cache pour les actualités nationales');
      return res.status(200).json(cachedData);
    }

    // Définir un timeout pour l'ensemble de l'opération
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout dépassé')), 8000)
    );

    // Récupération des actualités avec timeout
    const fetchNewsPromise = fetchNationalNews();
    
    // Utiliser Promise.race pour limiter le temps d'attente
    const news = await Promise.race([fetchNewsPromise, timeoutPromise]);
    
    // Mise en cache des données
    cachedData = news;
    lastFetchTime = now;
    
    return res.status(200).json(news);
  } catch (error) {
    console.error('Erreur API getNationalNews:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des actualités nationales',
      details: error.message
    });
  }
};

async function fetchNationalNews() {
  const parser = new Parser({
    timeout: 5000, // 5 secondes de timeout pour le parser
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PWANewsBot/1.0)'
    },
  });

  try {
    // Vous pouvez essayer plusieurs sources en parallèle et prendre la première qui répond
    const sources = [
      'https://www.francetvinfo.fr/france.rss',
      'https://www.lemonde.fr/rss/une.xml',
      'https://www.lefigaro.fr/rss/figaro_actualites.xml'
    ];
    
    // Créer un tableau de promesses avec timeout individuel
    const promises = sources.map(source => {
      return axios.get(source, { 
        timeout: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PWANewsBot/1.0)' }
      })
      .then(response => {
        return parser.parseString(response.data);
      })
      .catch(err => {
        console.log(`Erreur avec la source ${source}:`, err.message);
        return null; // Retourner null en cas d'erreur pour ne pas bloquer les autres sources
      });
    });
    
    // Attendre que toutes les promesses soient résolues
    const results = await Promise.allSettled(promises);
    
    // Traiter les résultats et ignorer les erreurs
    const feeds = results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);
    
    if (feeds.length === 0) {
      throw new Error('Aucune source d\'actualités n\'a répondu');
    }
    
    // Utiliser le premier flux qui a répondu
    const feed = feeds[0];
    
    // Formater les articles
    const articles = feed.items.slice(0, 10).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate || item.isoDate,
      source: feed.title || 'Actualités Nationales'
    }));
    
    return {
      success: true,
      source: feed.title || 'Actualités Nationales',
      articles: articles
    };
  } catch (error) {
    console.error('Erreur fetchNationalNews:', error);
    throw error;
  }
}
