// pages/api/sendPush.js
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fonction d'API simple pour Vercel
module.exports = async function (req, res) {
  console.log('API SendPush appelée - URL:', req.url);
  console.log('Méthode:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    webpush.setVapidDetails(
      'mailto:infos@jhd71.fr',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const { message, fromUser, toUser } = req.body;
    console.log('Données reçues:', { message, fromUser, toUser });

    const { data: subscriptions, error: supabaseError } = await supabase
      .from('push_subscriptions')
      .select('subscription, device_type')
      .eq('pseudo', toUser)
      .eq('active', true);

    if (supabaseError) {
      console.error('Erreur Supabase:', supabaseError);
      throw supabaseError;
    }

    console.log('Souscriptions trouvées:', subscriptions?.length || 0);

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ 
        error: 'No subscription found',
        user: toUser 
      });
    }

    const notifications = await Promise.all(subscriptions.map(async ({ subscription }) => {
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
        console.log('Notification envoyée avec succès à:', toUser);
        return true;
      } catch (error) {
        console.error('Erreur envoi notification:', error);
        return false;
      }
    }));

    const successful = notifications.filter(Boolean).length;
    console.log('Résultat des notifications:', {
      success: true,
      sent: successful,
      total: subscriptions.length
    });

    res.status(200).json({
      success: true,
      sent: successful,
      total: subscriptions.length
    });
  } catch (error) {
    console.error('Erreur générale:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
}
