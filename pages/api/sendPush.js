// api/sendPush.js
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  // Log de la requête reçue
  console.log('Requête reçue:', {
    body: req.body,
    headers: req.headers,
    method: req.method,
    url: req.url
  });

  if (req.method !== 'POST') {
    console.log('Méthode non autorisée:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    webpush.setVapidDetails(
      'mailto:infos@jhd71.fr',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const { message, fromUser, toUser } = req.body;
    console.log('Données extraites:', { message, fromUser, toUser });

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription, device_type')
      .eq('pseudo', toUser)
      .eq('active', true);

    if (error) {
      console.error('Erreur Supabase:', error);
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('Aucune souscription trouvée pour:', toUser);
      return res.status(404).json({ 
        error: 'No subscription found',
        user: toUser 
      });
    }

    console.log(`${subscriptions.length} souscriptions trouvées pour:`, toUser);

    const notifications = subscriptions.map(async ({ subscription, device_type }) => {
      const parsedSubscription = typeof subscription === 'string' 
        ? JSON.parse(subscription) 
        : subscription;
      
      const notificationPayload = {
        title: `Nouveau message de ${fromUser}`,
        body: message,
        icon: '/images/INFOS-192.png',
        badge: '/images/badge-72x72.png',
        data: {
          url: '/?action=openchat',
          fromUser,
          timestamp: new Date().toISOString()
        },
        vibrate: [100, 50, 100],
        requireInteraction: true,
        renotify: true,
        tag: 'chat-message-' + Date.now()
      };

      try {
        await webpush.sendNotification(
          parsedSubscription,
          JSON.stringify(notificationPayload)
        );
        console.log('Notification envoyée avec succès à:', toUser);

        await supabase
          .from('push_subscriptions')
          .update({ 
            last_notification: new Date().toISOString(),
            notification_count: supabase.sql`notification_count + 1`
          })
          .match({ 
            pseudo: toUser, 
            subscription: typeof subscription === 'string' ? subscription : JSON.stringify(subscription)
          });

        return true;
      } catch (error) {
        console.error('Erreur envoi notification:', error);
        
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .update({ 
              active: false, 
              error_message: error.message,
              last_updated: new Date().toISOString()
            })
            .match({ 
              pseudo: toUser,
              subscription: typeof subscription === 'string' ? subscription : JSON.stringify(subscription)
            });
        }
        return false;
      }
    });

    const results = await Promise.all(notifications);
    const successful = results.filter(Boolean).length;

    res.status(200).json({
      success: true,
      sent: successful,
      total: subscriptions.length,
      failed: subscriptions.length - successful,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur globale handler:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
