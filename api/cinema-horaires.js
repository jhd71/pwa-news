// api/cinema-horaires.js
// API pour le widget cinéma Le Capitole
// Note: Le site utilise Webedia Movies Pro (JavaScript dynamique)
// Le scraping automatique n'est pas possible sans service payant

export default async function handler(req, res) {
  // CORS
  const allowedOrigins = [
    'https://actuetmedia.fr',
    'https://www.actuetmedia.fr',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  // Retourner une réponse informative
  return res.status(200).json({
    success: false,
    source: 'info',
    cinema: {
      name: 'Le Capitole',
      city: 'Montceau-les-Mines',
      address: '30 Quai Jules Chagot, 71300 Montceau-les-Mines',
      rooms: 4,
      seats: 589,
      features: ['4K Laser', 'Dolby Atmos', 'Fauteuils premium']
    },
    links: {
      official: 'https://www.cinemacapitole-montceau.fr/horaires/',
      allocine: 'https://www.allocine.fr/seance/salle_gen_csalle=G0FNC.html',
      facebook: 'https://www.facebook.com/profile.php?id=61569755554498'
    },
    message: 'Le site du Capitole utilise une technologie JavaScript dynamique. Consultez directement le site officiel ou AlloCiné pour les horaires.',
    films: []
  });
}