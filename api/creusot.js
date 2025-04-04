// api/creusot.js
const puppeteer = require('puppeteer');

async function scrapeCreusotInfos(max = 2) {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://www.creusot-infos.com/news/faits-divers/', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // Attente du bon sélecteur
    await page.waitForSelector('h3 > a', { timeout: 15000 });

    const articles = await page.evaluate((max) => {
      const nodes = Array.from(document.querySelectorAll('h3 > a')).slice(0, max);
      return nodes.map((link) => ({
        title: link.innerText.trim(),
        link: link.href,
        image: 'https://www.creusot-infos.com/img/logo.png', // ou mieux si image dispo
        date: new Date().toISOString(),
        source: 'Creusot Infos'
      }));
    }, max);

    await browser.close();
    return articles;
  } catch (err) {
    console.error('❌ Erreur scraping Creusot Infos :', err.message);
    return [];
  }
}

module.exports = { scrapeCreusotInfos };
