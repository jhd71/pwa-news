const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

// Configuration pour Vercel
export const config = {
  runtime: 'nodejs18',
  regions: ['iad1'],
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    webpush.setVapidDetails(
      'mailto:infos@jhd71.fr',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const { message, fromUser, toUser } = req.body;
    console.log('Données reçues:', { message, fromUser, toUser });

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription, device_type')
      .eq('pseudo', toUser)
      .eq('active', true);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: 'No subscription found' });
    }

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
        return true;
      } catch (error) {
        console.error('Erreur envoi notification:', error);
        if (error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .update({ active: false })
            .match({ pseudo: toUser });
        }
        return false;
      }
    });

    const results = await Promise.all(notifications);
    const successful = results.filter(Boolean).length;

    res.status(200).json({
      success: true,
      sent: successful,
      total: subscriptions.length
    });
  } catch (error) {
    console.error('Erreur globale:', error);
    res.status(500).json({ error: error.message });
  }
};
