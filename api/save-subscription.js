// api/save-subscription.js
import { createClient } from '@supabase/supabase-js';

// Initialiser le client Supabase avec les variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Gestion CORS pour les requêtes préliminaires
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Enregistrer un nouvel abonnement
  if (req.method === 'POST') {
    try {
      const { subscription, userId } = req.body;
      
      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Données d\'abonnement invalides' });
      }

      // Vérifier si l'abonnement existe déjà
      const { data: existingSubscription } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('endpoint', subscription.endpoint)
        .single();

      if (existingSubscription) {
        // Mettre à jour l'abonnement existant
        const { error } = await supabase
          .from('push_subscriptions')
          .update({
            pseudo: userId,
            subscription: subscription,
            updated_at: new Date().toISOString()
          })
          .eq('endpoint', subscription.endpoint);

        if (error) throw error;
      } else {
        // Insérer un nouvel abonnement
        const { error } = await supabase
          .from('push_subscriptions')
          .insert({
            endpoint: subscription.endpoint,
            pseudo: userId,
            subscription: subscription,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'abonnement:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Supprimer un abonnement
  if (req.method === 'DELETE') {
    try {
      const { endpoint, userId } = req.body;
      
      if (!endpoint) {
        return res.status(400).json({ error: 'Endpoint invalide' });
      }

      // Supprimer l'abonnement
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint)
        .eq('pseudo', userId);

      if (error) throw error;

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'abonnement:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Méthode non autorisée
  return res.status(405).json({ error: 'Méthode non autorisée' });
}