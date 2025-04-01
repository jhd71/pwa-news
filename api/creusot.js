// pages/api/creusot.js
import cheerio from 'cheerio';
import axios from 'axios';

export default async function handler(req, res) {
  try {
    const url = 'https://www.creusot-infos.com/news/faits-divers/';
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const results = [];

    $('.catItemBody').slice(0, 3).each((_, el) => {
      const title = $(el).find('.catItemTitle a').text().trim();
      const link = $(el).find('.catItemTitle a').attr('href');
      const excerpt = $(el).find('.catItemIntroText').text().trim();

      if (title && link) {
        results.push({
          title,
          url: `https://www.creusot-infos.com${link}`,
          excerpt
        });
      }
    });

    res.status(200).json(results);
  } catch (error) {
    console.error("Erreur scraping :", error.message);
    res.status(500).json({ error: 'Erreur scraping Creusot Infos' });
  }
}
