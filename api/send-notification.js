// api/send-notification.js
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Initialiser le client Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configurer les clés VAPID pour les notifications Web Push
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT_EMAIL || 'contact@actuetmedia.fr'}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  // Vérifier la méthode
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  
  try {
    const { title, body, userId, chatMessage, icon, data, sendToAll } = req.body;
    
    // Vérifier les données requises
    if (!title || !body) {
      return res.status(400).json({ error: 'Titre et corps du message requis' });
    }

    // Préparer les données de notification
    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: icon || '/images/AM-192-v2.png',
      badge: '/images/badge-72x72.png',
      timestamp: Date.now(),
      data: {
        url: chatMessage ? '/?action=openchat' : '/',
        ...data
      }
    });

    // Récupérer les abonnements
    let query = supabase
      .from('push_subscriptions')
      .select('*');

    // Si ce n'est pas un envoi à tous, filtrer par userId
    if (!sendToAll && userId) {
      query = query.eq('pseudo', userId);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: 'Aucun abonnement trouvé' });
    }

    console.log(`Envoi de notifications à ${subscriptions.length} abonnés`);

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
          // Si l'abonnement n'est plus valide (erreur 410), le supprimer
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

    // Si un message de chat, enregistrer dans l'historique des notifications
    if (chatMessage && title.includes('Nouveau message')) {
      await supabase
        .from('notification_history')
        .insert({
          title,
          body,
          type: 'chat',
          sent_at: new Date().toISOString(),
          success_count: successful,
          failure_count: failed
        });
    }

    return res.status(200).json({
      success: true,
      sent: successful,
      failed: failed,
      total: results.length
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi des notifications:', error);
    return res.status(500).json({ error: error.message });
  }
}