const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fonction d'API simple pour Vercel
export default async function (req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('pseudo', toUser);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const notifications = subscriptions.map(async ({ subscription }) => {
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
        return true;
      } catch (error) {
        console.error('Error sending notification:', error);
        return false;
      }
    });

    const results = await Promise.all(notifications);
    const successful = results.filter(Boolean).length;

    return res.status(200).json({
      success: true,
      sent: successful,
      total: subscriptions.length
    });
  } catch (error) {
    console.error('Error in push notification handler:', error);
    return res.status(500).json({ error: error.message });
  }
}
