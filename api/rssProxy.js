import Parser from 'rss-parser';

export default async function handler(req, res) {
    const parser = new Parser();
    const feeds = [
        { name: "Montceau News", url: "https://montceau-news.com/rss" },
        { name: "L’Informateur de Bourgogne", url: "https://linformateurdebourgogne.com/rss" },
        { name: "Le Journal de Saône-et-Loire", url: "https://www.lejsl.com/edition-montceau-les-mines/rss" },
        { name: "BFMTV", url: "https://www.bfmtv.com/rss/news-24-7/" }
    ];

    let articles = [];

    for (const feed of feeds) {
        try {
            const parsedFeed = await parser.parseURL(feed.url);
            const latestArticles = parsedFeed.items.slice(0, 3).map(item => ({
                source: feed.name,
                title: item.title,
                link: item.link,
                date: item.pubDate
            }));
            articles = [...articles, ...latestArticles];
        } catch (error) {
            console.error(`Erreur lors de la récupération du flux RSS de ${feed.name}:`, error);
        }
    }

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ articles });
}