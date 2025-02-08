const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

// Configuration for Vercel
export const config = {
  runtime: 'nodejs18',
  regions: ['iad1'],
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CORS Middleware
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
};

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  } = process.env;

  webpush.setVapidDetails(
    'mailto:infos@jhd71.fr',
    NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );

  try {
    const { message, fromUser, toUser } = req.body;
    console.log('Received data:', { message, fromUser, toUser });

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription, device_type')
      .eq('pseudo', toUser)
      .eq('active', true);

    if (error) throw new Error(`Database error: ${error.message}`);

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const notifications = subscriptions.map(({ subscription, device_type }) => {
      try {
        return {
          subscription: typeof subscription === 'string' ? JSON.parse(subscription) : subscription,
          device_type
        };
      } catch (parseError) {
        console.error('Subscription parsing error:', parseError);
        return null;
      }
    }).filter(Boolean);

    const results = await Promise.all(notifications.map(async ({ subscription }) => {
      const notificationPayload = {
        title: `New message from ${fromUser}`,
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
        await webpush.sendNotification(subscription, JSON.stringify(notificationPayload));
        return true;
      } catch (error) {
        console.error('Notification send error:', error);
        if (error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .update({ active: false })
            .match({ pseudo: toUser });
        }
        return false;
      }
    }));

    const successful = results.filter(Boolean).length;

    res.status(200).json({
      success: true,
      sent: successful,
      total: subscriptions.length
    });
  } catch (error) {
    console.error('Global error:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};
