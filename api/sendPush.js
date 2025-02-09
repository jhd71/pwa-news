const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
// Ajouter au début du fichier
async function sendNotificationWithRetry(subscription, payload, maxRetries = 2) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      return true;
    } catch (error) {
      if (error.statusCode === 410 || i === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1s entre les tentatives
    }
  }
  return false;
}
async function cleanExpiredSubscriptions(supabase) {
  try {
    console.log('Début du nettoyage des souscriptions...');
    
    // Récupérer toutes les souscriptions actives
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('active', true);

    if (error) {
      console.error('Erreur récupération souscriptions:', error);
      return;
    }

    console.log(`${subscriptions?.length || 0} souscriptions actives trouvées`);

    for (const sub of subscriptions || []) {
      try {
        // Tenter un ping sur chaque souscription
        const parsedSubscription = typeof sub.subscription === 'string' 
          ? JSON.parse(sub.subscription) 
          : sub.subscription;

        // Si le ping échoue, une erreur sera levée
        await webpush.sendNotification(
          parsedSubscription,
          JSON.stringify({ type: 'ping', timestamp: Date.now() })
        );
        
        console.log(`Souscription valide pour ${sub.pseudo}`);
      } catch (error) {
        if (error.statusCode === 410) {
          console.log(`Suppression de la souscription expirée pour ${sub.pseudo}`);
          
          // Supprimer la souscription
          await supabase
            .from('push_subscriptions')
            .delete()
            .match({ 
              pseudo: sub.pseudo,
              subscription: typeof sub.subscription === 'string' 
                ? sub.subscription 
                : JSON.stringify(sub.subscription)
            });

          // Logger la suppression
          await supabase
            .from('push_notification_log')
            .insert({
              from_user: 'system',
              to_user: sub.pseudo,
              status: 'error',
              error_message: `Subscription expired and deleted: ${error.body}`,
              subscription: sub.subscription,
              device_type: sub.device_type || 'unknown'
            });
        } else {
          console.error(`Erreur test souscription pour ${sub.pseudo}:`, error);
        }
      }
    }
    console.log('Nettoyage des souscriptions terminé');
  } catch (error) {
    console.error('Erreur globale nettoyage souscriptions:', error);
  }
}

module.exports = async (req, res) => {
  try {
    // Nettoyer les souscriptions expirées
    await cleanExpiredSubscriptions(supabase);

    const { message, fromUser, toUser } = req.body;
    console.log('Données reçues:', { message, fromUser, toUser });

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

    webpush.setVapidDetails(
      'mailto:infos@jhd71.fr',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const { data: subscriptions, error: supabaseError } = await supabase
      .from('push_subscriptions')
      .select('subscription, device_type')
      .eq('pseudo', toUser)
      .eq('active', true);

    if (supabaseError) throw supabaseError;

    if (!subscriptions || subscriptions.length === 0) {
      await supabase
        .from('push_notification_log')
        .update({
          status: 'error',
          error_message: 'No active subscriptions found',
          updated_at: new Date().toISOString()
        })
        .eq('id', logEntry.id);

      return res.status(404).json({ error: 'No subscription found' });
    }

    const notifications = await Promise.all(subscriptions.map(async ({ subscription, device_type }) => {
      const parsedSubscription = typeof subscription === 'string' 
        ? JSON.parse(subscription) 
        : subscription;
      
      try {
  const success = await sendNotificationWithRetry(
    parsedSubscription,
    {
      title: `Nouveau message de ${fromUser}`,
      body: message
    }
  );

  if (success) {
    await supabase
      .from('push_notification_log')
      .insert({
        from_user: fromUser,
        to_user: toUser,
        message: message,
        status: 'success',
        subscription: parsedSubscription,
        device_type
      });
  }

  return { success, device_type };
} catch (error) {
        console.error('Erreur envoi notification:', error);
        
        if (error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .match({ 
              pseudo: toUser,
              subscription: typeof subscription === 'string' 
                ? subscription 
                : JSON.stringify(subscription)
            });

          await supabase
            .from('push_notification_log')
            .insert({
              from_user: fromUser,
              to_user: toUser,
              message: message,
              status: 'error',
              error_message: 'Subscription expired',
              subscription: subscription,
              device_type
            });
        }
        
        return { 
          success: false, 
          error: error.message,
          device_type 
        };
      }
    }));

    const successful = notifications.filter(r => r.success).length;

    // Mise à jour finale du log
    await supabase
      .from('push_notification_log')
      .update({
        status: successful > 0 ? 'success' : 'error',
        updated_at: new Date().toISOString()
      })
      .eq('id', logEntry.id);

    return res.status(200).json({
      success: true,
      sent: successful,
      total: subscriptions.length
    });

  } catch (error) {
    console.error('Erreur générale:', error);
    return res.status(500).json({ error: error.message });
  }
};
