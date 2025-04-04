import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export async function scrapeCreusotInfos(max = 3) {
  const articles = [];

  let browser = null;

  try {
    const executablePath = await chromium.executablePath;

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: chromium.headless,
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();
    await page.goto('https://www.creusot-infos.com/news/faits-divers/', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    const data = await page.evaluate((max) => {
      const items = Array.from(document.querySelectorAll('h3 a'));
      const results = [];

      items.slice(0, max).forEach((el) => {
        const title = el.textContent.trim();
        const link = el.href;
        const imageEl = el.closest('.catItemBody')?.querySelector('img');
        const image = imageEl ? imageEl.src : 'https://www.creusot-infos.com/images/logo.png';

        if (title && link) {
          results.push({
            title,
            link,
            image,
            date: new Date().toISOString(),
            source: 'Creusot Infos'
          });
        }
      });

      return results;
    }, max);

    articles.push(...data);
  } catch (err) {
    console.error('❌ Erreur scraping Creusot Infos :', err.message);
  } finally {
    if (browser) await browser.close();
  }

  return articles;
}
