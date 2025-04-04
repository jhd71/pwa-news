// api/getNews.js
import Parser from 'rss-parser';
import { scrapeCreusotInfos } from './creusot.js';

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
let cachedArticles = null;
let lastFetchTime = null;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const now = Date.now();
  if (cachedArticles && lastFetchTime && now - lastFetchTime < CACHE_DURATION) {
    console.log('📡 Données locales en cache utilisées');
    return res.status(200).json(cachedArticles);
  }

  try {
    const parser = new Parser({
      customFields: {
        item: ['media:content', 'enclosure']
      }
    });

    const feeds = [
      { name: 'Montceau News', url: 'https://www.lejsl.com/edition-montceau-les-mines/rss', max: 2 },
      { name: 'L\'Informateur', url: 'http://www.linformateurdebourgogne.com/feed/', max: 2 },
      { name: 'Le JSL', url: 'https://www.lejsl.com/edition-montceau-les-mines/rss', max: 2 },
      { name: 'Creusot Infos', custom: true, max: 2 },
      { name: 'France Bleu', url: 'https://www.francebleu.fr/rss/bourgogne/rubrique/infos.xml', max: 2 },
    ];

    const fetchPromises = feeds.map(feed => {
      return new Promise(async (resolve) => {
        try {
          console.log(`📡 Récupération : ${feed.name}`);

          if (feed.custom && feed.name === 'Creusot Infos') {
            const articles = await scrapeCreusotInfos(feed.max);
            return resolve(articles);
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(feed.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const data = await response.text();
          const feedData = await parser.parseString(data);

          const articles = feedData.items.slice(0, feed.max).map(item => {
            let image = item.enclosure?.url || item['media:content']?.url || null;

            if (!image && item.content) {
              const match = item.content.match(/<img[^>]+src="([^">]+)"/);
              if (match) image = match[1];
            }

            if (!image) image = "/images/AM-192-v2.png";

            return {
              title: item.title,
              link: item.link,
              image,
              date: item.pubDate || item.isoDate,
              source: feed.name
            };
          });

          resolve(articles);
        } catch (error) {
          console.error(`❌ Erreur avec ${feed.name}:`, error.message);
          resolve([]);
        }
      });
    });

    const timeoutPromise = new Promise(resolve => {
      setTimeout(() => {
        console.log('⚠️ Timeout global atteint');
        resolve([]);
      }, 8000);
    });

    const results = await Promise.race([
      Promise.all(fetchPromises),
      timeoutPromise.then(() => feeds.map(() => []))
    ]);

    const allArticles = results.flat();

    if (allArticles.length === 0) {
      console.error("❌ Aucun article récupéré !");
      if (cachedArticles) {
        console.log('📡 Utilisation du cache expiré');
        return res.status(200).json(cachedArticles);
      }
      return res.status(500).json({ error: "Aucun article récupéré" });
    }

    const shuffleAndSortArticles = (articles) => {
      const bySource = {};
      articles.forEach(article => {
        if (!bySource[article.source]) bySource[article.source] = [];
        bySource[article.source].push(article);
      });

      const result = [];
      let sources = Object.keys(bySource);

      while (sources.length > 0) {
        for (let i = 0; i < sources.length; i++) {
          const source = sources[i];
          if (bySource[source].length > 0) {
            result.push(bySource[source].shift());
          }
          if (bySource[source].length === 0) {
            sources = sources.filter(s => s !== source);
            i--;
          }
        }
      }

      return result;
    };

    const mixedArticles = shuffleAndSortArticles(allArticles);
    const finalArticles = mixedArticles.slice(0, 10);

    cachedArticles = finalArticles;
    lastFetchTime = now;

    return res.status(200).json(finalArticles);

  } catch (error) {
    console.error('❌ Erreur générale dans getNews:', error.message);
    if (cachedArticles) {
      console.log('📡 Utilisation du cache local en cas d\'erreur');
      return res.status(200).json(cachedArticles);
    }
    return res.status(500).json({ error: error.message });
  }
}
