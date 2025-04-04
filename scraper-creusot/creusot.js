import puppeteer from 'puppeteer';

export async function scrapeCreusotInfos(max = 5) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://www.creusot-infos.com/news/faits-divers/', {
    waitUntil: 'domcontentloaded',
    timeout: 20000
  });

  await page.waitForSelector('h3 > a', { timeout: 10000 });

  const articles = await page.evaluate(() => {
    const items = document.querySelectorAll('h3 > a');
    const results = [];
    items.forEach((link, i) => {
      if (i >= 5) return;
      results.push({
        title: link.innerText.trim(),
        link: link.href,
        image: '/images/AM-192-v2.png',
        date: new Date().toISOString(),
        source: 'Creusot Infos'
      });
    });
    return results;
  });

  await browser.close();
  return articles;
}
