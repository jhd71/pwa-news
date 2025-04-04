import express from 'express';
import { scrapeCreusotInfos } from './creusot.js';

const app = express();
const port = process.env.PORT || 3000;

app.get('/scrape', async (req, res) => {
  try {
    const articles = await scrapeCreusotInfos(5);
    res.json(articles);
  } catch (err) {
    console.error('Erreur API scraping:', err.message);
    res.status(500).json({ error: 'Erreur scraping' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Serveur en écoute sur http://localhost:${port}`);
});
