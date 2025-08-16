// api/football-data.js
export default async function handler(req, res) {
    // Configuration CORS pour permettre votre domaine
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Gérer les requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Récupérer les paramètres
    const { competition, endpoint } = req.query;
    
    if (!competition) {
        return res.status(400).json({ 
            error: 'Paramètre competition manquant' 
        });
    }
    
    // Votre clé API
    const API_KEY = '4dbaf633fb6348e1b9903a5809cb7951';
    
    // Construire l'URL
    let url = `https://api.football-data.org/v4/competitions/${competition}`;
    if (endpoint) {
        url += `/${endpoint}`;
    }
    
    try {
        // Faire l'appel à l'API Football-Data
        const response = await fetch(url, {
            headers: {
                'X-Auth-Token': API_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Ajouter un cache de 60 secondes
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
        
        return res.status(200).json(data);
        
    } catch (error) {
        console.error('Erreur Football-Data API:', error);
        return res.status(500).json({ 
            error: 'Erreur lors de la récupération des données',
            details: error.message 
        });
    }
}