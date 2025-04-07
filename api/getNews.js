	// api/getNews.js
	import Parser from 'rss-parser';

	// Durée du cache en millisecondes (10 minutes)
	const CACHE_DURATION = 10 * 60 * 1000;
	let cachedArticles = null;
	let lastFetchTime = null;

		export default async function handler(req, res) {
		  // En-têtes CORS
		  res.setHeader('Access-Control-Allow-Credentials', true);
		  res.setHeader('Access-Control-Allow-Origin', '*');
		  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
		  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
		  
		  if (req.method === 'OPTIONS') {
			return res.status(200).end();
		  }

		  // Vérifier si des données sont en cache et valides
		  const now = Date.now();
		  if (cachedArticles && lastFetchTime && (now - lastFetchTime < CACHE_DURATION)) {
			console.log('📡 Retour des données locales en cache');
			return res.status(200).json(cachedArticles);
		  }
		  
		  try {
			const parser = new Parser({
			  customFields: {
				item: ['media:content', 'enclosure']
			  }
			});
			
				// URLs des flux RSS
				const feeds = [
			{ name: 'Montceau News', url: 'https://www.lejsl.com/edition-montceau-les-mines/rss', max: 2 },
			{ name: 'L\'Informateur', url: 'http://www.linformateurdebourgogne.com/feed/', max: 2 },
			{ name: 'Le JSL', url: 'https://www.lejsl.com/edition-montceau-les-mines/rss', max: 2 },
			{ name: 'Creusot-Infos', url: 'https://raw.githubusercontent.com/jhd71/scraper-creusot/main/data/articles.json', max: 2, type: 'json' },
			{ name: 'France Bleu', url: 'https://www.francebleu.fr/rss/bourgogne/rubrique/infos.xml', max: 2 },
				];
		
		// Récupérer les articles de chaque flux avec gestion des promesses
		const fetchPromises = feeds.map(feed => {
		  return new Promise(async (resolve) => {
			try {
			  console.log(`📡 Tentative pour ${feed.name}...`);
			  
			  // Remplacer axios par fetch avec timeout
			  const controller = new AbortController();
			  const timeoutId = setTimeout(() => controller.abort(), 5000);
			  
			  const response = await fetch(feed.url, {
				headers: {
				  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
				},
				signal: controller.signal
			  });
			  
			  clearTimeout(timeoutId);
			  
			  if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			  }
			  
			  if (feed.type === 'json') {
  const json = await response.json();
  const articles = json.slice(0, feed.max).map(item => ({
    title: item.title,
    link: item.link,
    image: item.image || "/images/AM-192-v2.png",
    date: item.date,
    source: item.source || feed.name
  }));
  return resolve(articles);
} else {
  const data = await response.text();
  const feedData = await parser.parseString(data);

  console.log(`✅ ${feed.name}: ${feedData.items.length} articles trouvés`);

  const articles = feedData.items.slice(0, feed.max).map(item => {
    let image = item.enclosure?.url || item['media:content']?.url || null;
    if (!image && item.content) {
      const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch) {
        image = imgMatch[1];
      }
    }
    if (!image) {
      image = "/images/AM-192-v2.png";
    }

    return {
      title: item.title,
      link: item.link,
      image,
      date: item.pubDate || item.isoDate,
      source: feed.name
    };
  });

  return resolve(articles);
}
			} catch (feedError) {
			  console.error(`❌ Erreur avec ${feed.name}:`, feedError.message);
			  resolve([]); // Tableau vide en cas d'erreur
			}
		  });
		});

		// Définir un timeout global
		const timeoutPromise = new Promise((resolve) => {
		  setTimeout(() => {
			console.log('⚠️ Timeout global atteint pour les actualités locales');
			resolve([]);
		  }, 8000); // 8 secondes de timeout global
		});
		
		// Exécuter toutes les promesses
		const results = await Promise.race([
		  Promise.all(fetchPromises),
		  timeoutPromise.then(() => feeds.map(() => []))
		]);
		
		// Aplatir les résultats
		const allArticles = results.flat();
		
		if (allArticles.length === 0) {
		  console.error("⚠️ Aucun article local récupéré, vérifiez les flux RSS !");
		  
		  // Si le cache existe mais est périmé, mieux vaut retourner des données périmées que rien
		  if (cachedArticles) {
			console.log('📡 Utilisation du cache local périmé en dernier recours');
			return res.status(200).json(cachedArticles);
		  }
		  
		  return res.status(500).json({ error: "Aucun article récupéré" });
		}
		
		// Mélanger légèrement les articles et placer les 3 derniers en haut
const shuffleAndSortArticles = (articles) => {
  // Trier par date pour récupérer les 3 dernières publications
  articles.sort((a, b) => new Date(b.date) - new Date(a.date)); // Tri décroissant par date
  
  // Récupérer les 3 dernières publications
  const latestArticles = articles.slice(0, 3); 
  const remainingArticles = articles.slice(3); // Le reste des articles
  
  // Regrouper les articles par source pour éviter trop de répétition
  const bySource = {};
  remainingArticles.forEach(article => {
    if (!bySource[article.source]) {
      bySource[article.source] = [];
    }
    bySource[article.source].push(article);
  });
  
  // Mélanger les articles restants
  const result = [];
  let sourcesWithArticles = Object.keys(bySource);
  
  // Mélanger les articles de chaque source pour éviter les répétitions
  while (sourcesWithArticles.length > 0) {
    for (let i = 0; i < sourcesWithArticles.length; i++) {
      const source = sourcesWithArticles[i];
      if (bySource[source].length > 0) {
        result.push(bySource[source].shift());
      }
      if (bySource[source].length === 0) {
        sourcesWithArticles = sourcesWithArticles.filter(s => s !== source);
        i--; // Ajuster l'index pour ne pas sauter une source
      }
    }
  }
  
  // Combiner les 3 dernières publications et les autres mélangées
  const finalResult = [...latestArticles, ...result];

  // Ajouter la classe .new-article aux articles récents
  finalResult.forEach(article => {
    // Si l'article est dans les 3 derniers, appliquer l'animation de pulsation
    if (latestArticles.includes(article)) {
      article.isNew = true;  // Marquer comme récent
    }
  });

  return finalResult;
};

// 1. Fonction pour envoyer la notification via ntfy
const notifyNewArticle = (title, link) => { 
  fetch('https://ntfy.sh/actu-local', {
    method: 'POST',
    body: JSON.stringify({
      message: `Nouvelle actu : ${title}`,
      title: 'Nouveau contenu sur Actu & Média',
      priority: 'high', // Priorité de la notification
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(response => response.json())
  .then(data => console.log("Notification envoyée avec succès", data))
  .catch(error => console.error("Erreur lors de l'envoi de la notification", error));
};

// Mélanger et trier les articles
const mixedArticles = shuffleAndSortArticles(allArticles);

// Limiter à 10 articles
const finalArticles = mixedArticles.slice(0, 10);

// Marquer les articles récents comme "nouveaux" et envoyer les notifications
finalArticles.forEach(article => {
  if (article.isNew) {
    // Si l'article est récent, on envoie une notification
    notifyNewArticle(article.title, article.link);  // Envoi de la notification
  }
});

// Mettre à jour le cache
cachedArticles = finalArticles;
lastFetchTime = now;

// Renvoyer les articles avec la propriété isNew
return res.status(200).json(finalArticles);
		
} catch (error) {
  console.error('❌ Erreur générale dans getNews:', error.message);
  
  // Si le cache existe en cas d'erreur, l'utiliser
  if (cachedArticles) {
    console.log('📡 Utilisation du cache local en cas d\'erreur');
    return res.status(200).json(cachedArticles);
  }
  
  return res.status(500).json({ error: error.message });
}

	}
