// api/cinema-horaires.js
// Fonction Vercel pour récupérer les horaires du cinéma sans problème CORS

export default async function handler(req, res) {
  // Autoriser uniquement votre domaine
  const allowedOrigins = [
    'https://actuetmedia.fr',
    'https://www.actuetmedia.fr',
    'http://localhost:3000' // pour les tests locaux
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  try {
    // Récupérer la page du cinéma
    const response = await fetch('https://www.cinemacapitole-montceau.fr/horaires/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ActuMedia/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    // Retourner le HTML directement
    res.status(200).send(html);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des horaires:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des horaires',
      message: error.message 
    });
  }
}