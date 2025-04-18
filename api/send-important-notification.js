// api/send-important-notification.js
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Initialiser le client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configurer les clés VAPID pour les notifications Web Push
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT_EMAIL || 'contact@actuetmedia.fr'}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Vérifier la clé d'API (à adapter selon votre système de sécurité)
function checkApiKey(req) {
  const apiKey = req.headers['x-api-key'];
  // Utilisez une clé simple ici, mais dans un environnement de production, 
  // utilisez une clé d'API sécurisée et stockée dans les variables d'environnement
  return apiKey === process.env.ADMIN_API_KEY || apiKey === 'actuetmedia-admin-key';
}

export default async function handler(req, res) {
  // Vérifier la méthode
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Vérifier l'authentification
  if (!checkApiKey(req)) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  
  try {
    const { title, body, url, imageUrl, urgent } = req.body;
    
    // Vérifier les données requises
    if (!title || !body) {
      return res.status(400).json({ error: 'Titre et corps du message requis' });
    }

    // Préparer les données de notification
    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: imageUrl || '/images/AM-192-v2.png',
      badge: '/images/badge-72x72.png',
      timestamp: Date.now(),
      data: {
        url: url || '/',
        type: 'important',
        urgent: !!urgent
      }
    });

    // Récupérer tous les abonnements
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) {
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: 'Aucun abonnement trouvé' });
    }

    console.log(`Envoi de notification importante à ${subscriptions.length} abonnés`);

    // Envoyer les notifications
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          // S'assurer que la subscription est un objet et non une chaîne JSON
          let pushSubscription = subscription.subscription;
          if (typeof pushSubscription === 'string') {
            pushSubscription = JSON.parse(pushSubscription);
          }
          
          await webpush.sendNotification(pushSubscription, notificationPayload);
          return { success: true, endpoint: pushSubscription.endpoint };
        } catch (error) {
          // Si l'abonnement n'est plus valide, le supprimer
          if (error.statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', subscription.endpoint);
          }
          return { success: false, endpoint: subscription.endpoint, error: error.message };
        }
      })
    );

    // Compter les succès et les échecs
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    // Enregistrer dans l'historique des notifications
    await supabase
      .from('notification_history')
      .insert({
        title,
        body,
        type: urgent ? 'urgent' : 'important',
        sent_at: new Date().toISOString(),
        success_count: successful,
        failure_count: failed,
        metadata: {
          url,
          imageUrl
        }
      });

    return res.status(200).json({
      success: true,
      sent: successful,
      failed: failed,
      total: results.length
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi des notifications importantes:', error);
    return res.status(500).json({ error: error.message });
  }
}