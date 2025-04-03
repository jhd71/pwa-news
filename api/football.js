// /api/football.js
export default async function handler(req, res) {
  const { endpoint } = req.query;
  
  if (!endpoint) {
    return res.status(400).json({ error: "Endpoint requis" });
  }
  
  try {
    // Extraire la base et les paramètres
    const [baseEndpoint, ...paramsParts] = endpoint.split('?');
    const paramsString = paramsParts.length > 0 ? `?${paramsParts.join('?')}` : '';
    
    console.log(`Requête vers: https://api.football-data.org/v4/${baseEndpoint}${paramsString}`);
    
    const response = await fetch(`https://api.football-data.org/v4/${baseEndpoint}${paramsString}`, {
      headers: {
        'X-Auth-Token': '4dbaf633fb6348e1b9903a5809cb7951'
      }
    });
    
    const data = await response.json();
    console.log('Réponse API football:', data);
    res.status(200).json(data);
  } catch (error) {
    console.error('Erreur proxy football:', error);
    res.status(500).json({ error: "Erreur lors de la récupération des données", message: error.message });
  }
}