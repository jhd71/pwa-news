import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export async function scrapeCreusotInfos(max = 5) {
  let browser = null;
  const articles = [];

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();
    await page.goto('https://www.creusot-infos.com/news/faits-divers/', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    await page.waitForSelector('h3 > a', { timeout: 10000 });

    const results = await page.evaluate((maxArticles) => {
      const nodes = document.querySelectorAll('h3 > a');
      const data = [];

      nodes.forEach((el, index) => {
        if (index >= maxArticles) return;

        const title = el.innerText.trim();
        const link = el.href;
        const image = el.closest('.catItemBody')?.querySelector('img')?.src || null;

        if (title && link) {
          data.push({
            title,
            link,
            image,
            date: new Date().toISOString(),
            source: 'Creusot Infos'
          });
        }
      });

      return data;
    }, max);

    articles.push(...results);
  } catch (err) {
    console.error('❌ Erreur scraping Creusot Infos :', err.message);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }

  return articles;
}
