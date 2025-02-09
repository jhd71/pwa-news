const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanExpiredSubscriptions(supabase) {
  try {
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('active', true);

    for (const sub of subscriptions || []) {
      try {
        const parsedSubscription = typeof sub.subscription === 'string' 
          ? JSON.parse(sub.subscription) 
          : sub.subscription;

        await webpush.sendNotification(
          parsedSubscription,
          JSON.stringify({ type: 'ping' })
        );
      } catch (error) {
        if (error.statusCode === 410) {
          console.log('Suppression souscription expirée pour:', sub.pseudo);
          await supabase
            .from('push_subscriptions')
            .delete()
            .match({ 
              pseudo: sub.pseudo,
              subscription: typeof sub.subscription === 'string' 
                ? sub.subscription 
                : JSON.stringify(sub.subscription)
            });

          await supabase
            .from('push_notification_log')
            .insert({
              from_user: 'system',
              to_user: sub.pseudo,
              status: 'error',
              error_message: 'Subscription expired and deleted',
              subscription: sub.subscription
            });
        }
      }
    }
  } catch (error) {
    console.error('Erreur nettoyage souscriptions:', error);
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
        await webpush.sendNotification(
          parsedSubscription,
          JSON.stringify({
            title: `Nouveau message de ${fromUser}`,
            body: message
          })
        );

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

        return { success: true, device_type };
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
