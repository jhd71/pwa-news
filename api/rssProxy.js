// api/rssProxy.js
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL manquante' });
    }

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.text();
        
        res.setHeader('Content-Type', 'text/xml');
        res.setHeader('Cache-Control', 'public, max-age=300'); // Cache 5 minutes
        
        return res.status(200).send(data);
        
    } catch (error) {
        console.error('Erreur proxy RSS:', error);
        return res.status(500).json({ error: 'Erreur lors de la récupération du flux RSS' });
    }
}