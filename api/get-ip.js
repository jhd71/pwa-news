export default async function handler(req, res) {
  // Headers CORS pour votre domaine
  res.setHeader('Access-Control-Allow-Origin', 'https://actuetmedia.fr');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Récupérer l'IP depuis les headers Vercel
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               req.headers['x-real-ip'] || 
               req.connection?.remoteAddress ||
               '0.0.0.0';
    
    return res.status(200).json({ 
      ip: ip,
      success: true 
    });
  } catch (error) {
    console.error('Erreur get-ip:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      success: false 
    });
  }
}