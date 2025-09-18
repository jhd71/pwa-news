// api/get-ip.js
export default async function handler(req, res) {
  // Headers CORS pour votre domaine
  res.setHeader('Access-Control-Allow-Origin', 'https://actuetmedia.fr');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Gestion des requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Accepter uniquement GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      success: false 
    });
  }

  try {
    // Récupérer l'IP depuis les headers Vercel
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               req.headers['x-real-ip'] || 
               req.connection?.remoteAddress ||
               req.socket?.remoteAddress ||
               '0.0.0.0';
    
    // Log pour debug (à commenter en production)
    console.log('IP détectée:', ip);
    
    return res.status(200).json({ 
      ip: ip,
      success: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erreur get-ip:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      success: false,
      message: error.message
    });
  }
}