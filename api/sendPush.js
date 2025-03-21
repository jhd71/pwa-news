import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Création du client Supabase avec les variables d'environnement
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration des clés VAPID une seule fois
webpush.setVapidDetails(
  'mailto:infos@jhd71.fr',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Fonction utilitaire pour envoyer une notification avec retry
async function sendNotificationWithRetry(subscription, payload, maxRetries = 2) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      return true;
    } catch (error) {
      if (error.statusCode === 410) {
        console.log('🔄 Maintenance: Souscription expirée');
        throw error;
      }

      if (i === maxRetries) {
        console.log('📝 Info: Tentatives épuisées');
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return false;
}

// Fonction pour nettoyer les subscriptions expirées
async function cleanExpiredSubscriptions() {
  try {
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('active', true);

    if (error) throw error;

    for (const sub of subscriptions || []) {
      try {
        const parsedSubscription = typeof sub.subscription === 'string'
          ? JSON.parse(sub.subscription)
          : sub.subscription;

        await webpush.sendNotification(
          parsedSubscription,
          JSON.stringify({ type: 'ping', timestamp: Date.now() })
        );
      } catch (error) {
        if (error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .update({ active: false })
            .eq('id', sub.id);

          await supabase
            .from('push_notification_log')
            .insert({
              from_user: 'system',
              to_user: sub.pseudo,
              status: 'expired',
              error_message: 'Subscription expired',
              subscription: sub.subscription,
              device_type: sub.device_type || 'unknown'
            });
        }
      }
    }
  } catch (error) {
    console.error('Erreur nettoyage subscriptions:', error);
  }
}

// Handler API Next.js
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

    // Log initial
    const { data: logEntry } = await supabase
      .from('push_notification_log')
      .insert({
        from_user: fromUser,
        to_user: toUser,
        message: message,
        status: 'pending'
      })
      .select()
      .single();

    // Nettoyage des subscriptions expirées
    await cleanExpiredSubscriptions();

    // Récupération des subscriptions actives
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('pseudo', toUser)
      .eq('active', true);

    if (subError) throw subError;

    if (!subscriptions?.length) {
      await supabase
        .from('push_notification_log')
        .update({
          status: 'error',
          error_message: 'No active subscriptions',
          updated_at: new Date().toISOString()
        })
        .eq('id', logEntry?.id);

      return res.status(404).json({ error: 'No active subscriptions found' });
    }

    // Envoi des notifications
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const parsedSubscription = typeof sub.subscription === 'string'
            ? JSON.parse(sub.subscription)
            : sub.subscription;

          const success = await sendNotificationWithRetry(
            parsedSubscription,
            {
              title: `Message de ${fromUser}`,
              body: message
            }
          );

          return { success, device: sub.device_type };
        } catch (error) {
          return { 
            success: false, 
            error: error.message, 
            device: sub.device_type 
          };
        }
      })
    );

    // Mise à jour du log
    if (logEntry) {
      await supabase
        .from('push_notification_log')
        .update({
          status: 'completed',
          success_count: results.filter(r => r.success).length,
          error_count: results.filter(r => !r.success).length,
          updated_at: new Date().toISOString()
        })
        .eq('id', logEntry.id);
    }

    return res.status(200).json({
      success: true,
      results: {
        total: subscriptions.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('Erreur serveur:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur', 
      message: error.message 
    });
  }
}
