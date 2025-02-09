const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  console.log('API SendPush appelée - URL:', req.url);
  
  try {
    const { message, fromUser, toUser } = req.body;

    // Log initial de la tentative
    const { data: logEntry, error: logError } = await supabase
      .from('push_notification_log')
      .insert({
        from_user: fromUser,
        to_user: toUser,
        message: message,
        status: 'pending'
      })
      .select()
      .single();

    if (logError) console.error('Erreur création log:', logError);

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
      // Mise à jour du log - Pas de souscription
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

    const results = await Promise.all(subscriptions.map(async ({ subscription, device_type }) => {
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

        // Log du succès
        return { success: true, device_type };
      } catch (error) {
        // Log de l'erreur
        console.error('Erreur envoi notification:', error);
        
        if (error.statusCode === 410) {
          // Désactiver la souscription expirée
          await supabase
            .from('push_subscriptions')
            .update({ active: false })
            .match({ 
              pseudo: toUser,
              subscription: JSON.stringify(parsedSubscription)
            });
        }
        
        return { 
          success: false, 
          error: error.message,
          device_type 
        };
      }
    }));

    const successful = results.filter(r => r.success).length;

    // Mise à jour finale du log
    await supabase
      .from('push_notification_log')
      .update({
        status: successful > 0 ? 'success' : 'error',
        error_message: successful === 0 ? 'All notifications failed' : null,
        subscription: subscriptions[0].subscription,
        device_type: subscriptions[0].device_type,
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
    
    // Log de l'erreur générale si on a un logEntry
    if (logEntry) {
      await supabase
        .from('push_notification_log')
        .update({
          status: 'error',
          error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', logEntry.id);
    }

    return res.status(500).json({ error: error.message });
  }
};
