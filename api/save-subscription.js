// api/save-subscription.js
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase - Utiliser les variables d'environnement Vercel
const supabaseUrl = process.env.SUPABASE_URL || 
                    process.env.NEXT_PUBLIC_SUPABASE_URL ||
                    'https://ekjgfiyhkythqcnmhzea.supabase.co';

const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramdmaXloa3l0aHFjbm1oemVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzYxNDIsImV4cCI6MjA1ODI1MjE0Mn0.V0j_drb6GiTojgwxC6ydjnyJDRRT9lUbSc1E7bFE2Z4';

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://actuetmedia.fr');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Gestion CORS pour les requêtes préliminaires
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Enregistrer un nouvel abonnement
  if (req.method === 'POST') {
    try {
      const { subscription, userId } = req.body;
      
      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ 
          error: 'Données d\'abonnement invalides',
          success: false 
        });
      }

      // Vérifier si l'abonnement existe déjà
      const { data: existingSubscription, error: checkError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('endpoint', subscription.endpoint)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingSubscription) {
        // Mettre à jour l'abonnement existant
        const { error } = await supabase
          .from('push_subscriptions')
          .update({
            pseudo: userId || 'anonymous',
            subscription: JSON.stringify(subscription),
            active: true,
            updated_at: new Date().toISOString()
          })
          .eq('endpoint', subscription.endpoint);

        if (error) throw error;
        
        return res.status(200).json({ 
          success: true,
          message: 'Abonnement mis à jour'
        });
      } else {
        // Insérer un nouvel abonnement
        const { error } = await supabase
          .from('push_subscriptions')
          .insert({
            endpoint: subscription.endpoint,
            pseudo: userId || 'anonymous',
            subscription: JSON.stringify(subscription),
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        
        return res.status(200).json({ 
          success: true,
          message: 'Nouvel abonnement créé'
        });
      }

    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'abonnement:', error);
      return res.status(500).json({ 
        error: error.message || 'Erreur serveur',
        success: false 
      });
    }
  }

  // Supprimer un abonnement
  if (req.method === 'DELETE') {
    try {
      const { endpoint, userId } = req.body;
      
      if (!endpoint) {
        return res.status(400).json({ 
          error: 'Endpoint invalide',
          success: false 
        });
      }

      // Construire la requête de suppression
      let query = supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);
      
      // Ajouter le filtre userId s'il est fourni
      if (userId) {
        query = query.eq('pseudo', userId);
      }

      const { error } = await query;

      if (error) throw error;

      return res.status(200).json({ 
        success: true,
        message: 'Abonnement supprimé'
      });
      
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'abonnement:', error);
      return res.status(500).json({ 
        error: error.message || 'Erreur serveur',
        success: false 
      });
    }
  }

  // Méthode non autorisée
  return res.status(405).json({ 
    error: 'Méthode non autorisée',
    success: false 
  });
}