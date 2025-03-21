import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Création du client Supabase avec les variables d'environnement
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration des clés VAPID
webpush.setVapidDetails(
  'mailto:infos@jhd71.fr',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Tout le reste de votre code...

// TRÈS IMPORTANT: Ajoutez cette ligne à la fin du fichier
// C'est la fonction handler principale qui sera appelée par Vercel
export default async function handler(req, res) {
  // Vérifier la méthode HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, fromUser, toUser } = req.body;

    // Validation des données requises
    if (!message || !fromUser || !toUser) {
      return res.status(400).json({ 
        error: "Les champs 'message', 'fromUser' et 'toUser' sont requis" 
      });
    }

    // Votre logique existante...
    
    // Assurez-vous de retourner une réponse appropriée
    return res.status(200).json({
      success: true,
      // autres données de réponse...
    });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur', 
      message: error.message 
    });
  }
}
