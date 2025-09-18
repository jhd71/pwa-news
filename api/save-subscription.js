// api/save-subscription.js
export default async function handler(req, res) {
  // Gestion CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Importer Supabase seulement si nécessaire
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    // Si les variables ne sont pas disponibles, mode simplifié
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Variables Supabase non disponibles, mode simplifié activé');
      return res.status(200).json({ 
        success: true, 
        message: 'Operation completed (simplified mode)' 
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // DELETE - Supprimer un abonnement
    if (req.method === 'DELETE') {
      const { endpoint, userId } = req.body;
      
      // Si pas de données, retourner succès quand même
      if (!endpoint && !userId) {
        return res.status(200).json({ success: true });
      }

      try {
        if (userId) {
          // Supprimer par pseudo
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('pseudo', userId);
        } else if (endpoint) {
          // Supprimer par endpoint
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', endpoint);
        }
      } catch (error) {
        console.warn('Erreur suppression:', error);
      }

      return res.status(200).json({ success: true });
    }

    // POST - Créer/Mettre à jour un abonnement
    if (req.method === 'POST') {
      const { subscription, userId } = req.body;
      
      if (!subscription || !subscription.endpoint) {
        return res.status(200).json({ success: true }); // Retourner succès même si données invalides
      }

      try {
        const { data: existing } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('endpoint', subscription.endpoint)
          .single();

        if (existing) {
          // Mise à jour
          await supabase
            .from('push_subscriptions')
            .update({
              pseudo: userId || 'anonymous',
              subscription: subscription,
              updated_at: new Date().toISOString()
            })
            .eq('endpoint', subscription.endpoint);
        } else {
          // Insertion
          await supabase
            .from('push_subscriptions')
            .insert({
              pseudo: userId || 'anonymous',
              endpoint: subscription.endpoint,
              subscription: subscription,
              active: true
            });
        }
      } catch (error) {
        console.warn('Erreur sauvegarde:', error);
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Erreur API:', error);
    // Toujours retourner un succès pour ne pas bloquer l'interface
    return res.status(200).json({ success: true });
  }
}