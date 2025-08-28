// api/tvPrograms.js
import fetch from 'node-fetch';

const TV_API_KEY = process.env.TV_API_KEY;
const TV_API_URL = 'https://tv-api.com/fr/api';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { channel, date } = req.query;

    if (!channel || !date) {
        return res.status(400).json({ error: 'Paramètres manquants' });
    }

    try {
        const response = await fetch(
            `${TV_API_URL}/programmes/${channel}/${date}?key=${TV_API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        
        // Cache les résultats pendant 1 heure
        res.setHeader('Cache-Control', 'public, max-age=3600');
        
        return res.status(200).json(data);
        
    } catch (error) {
        console.error('Erreur API TV:', error);
        return res.status(500).json({ 
            error: 'Erreur lors de la récupération des programmes',
            fallback: getFallbackPrograms()
        });
    }
}

function getFallbackPrograms() {
    return {
        programmes: [
            {
                id: 'fallback',
                debut: new Date().toISOString(),
                fin: new Date(Date.now() + 3600000).toISOString(),
                titre: 'Programme non disponible',
                genre: 'Information'
            }
        ]
    };
}