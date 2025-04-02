// /api/football.js
export default async function handler(req, res) {
  const { endpoint } = req.query;
  
  if (!endpoint) {
    return res.status(400).json({ error: "Endpoint requis" });
  }
  
  try {
    const response = await fetch(`https://api.football-data.org/v4/${endpoint}`, {
      headers: {
        'X-Auth-Token': '4dbaf633fb6348e1b9903a5809cb7951'
      }
    });
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Erreur proxy football:', error);
    res.status(500).json({ error: "Erreur lors de la récupération des données" });
  }
}