// api/testPush.js
// Endpoint de test pour vérifier que les API fonctionnent correctement

export default function handler(req, res) {
  // Activer CORS pour le développement
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Gérer les requêtes OPTIONS (pre-flight CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Envoyer une réponse de test
  res.status(200).json({
    status: 'success',
    message: 'L\'API fonctionne correctement',
    timestamp: new Date().toISOString(),
    method: req.method,
    query: req.query,
    env: {
      // Vérifier si les variables d'environnement sont disponibles
      // (ATTENTION: Ne révélez jamais de clés privées en production!)
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'défini' : 'non défini',
      vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? 'défini' : 'non défini',
      nodeEnv: process.env.NODE_ENV
    }
  });
}
