import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export async function scrapeCreusotInfos(max = 5) {
  const articles = [];

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto('https://www.creusot-infos.com/news/faits-divers/', {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });

    await page.waitForSelector('.catItemBody', { timeout: 15000 });

    const data = await page.evaluate(() => {
      const results = [];
      const items = document.querySelectorAll('.catItemBody');

      items.forEach((item) => {
        const title = item.querySelector('h3 a')?.innerText?.trim();
        const link = item.querySelector('h3 a')?.href;
        const image = item.querySelector('img')?.src;
        const date = new Date().toISOString();

        if (title && link) {
          results.push({
            title,
            link: link.startsWith('http') ? link : `https://www.creusot-infos.com${link}`,
            image: image || 'https://actuetmedia.fr/images/AM-192-v2.png',
            date,
            source: 'Creusot Infos',
          });
        }
      });

      return results;
    });

    await browser.close();
    return data.slice(0, max);
  } catch (err) {
    console.error('❌ Erreur scraping Creusot Infos :', err.message);
    return [];
  }
}
