// api/sendPush.js
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Vos clés VAPID que nous avons générées précédemment
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Configuration Supabase
const supabase = createClient(
  'https://aqedqlzsguvkopucyqbb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZWRxbHpzZ3V2a29wdWN5cWJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1MDAxNzUsImV4cCI6MjA1MjA3NjE3NX0.tjdnqCIW0dgmzn3VYx0ugCrISLPFMLhOQJBnnC5cfoo'
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Configurer webpush
    webpush.setVapidDetails(
      'mailto:infos@jhd.71',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );

    const { message, fromUser, toUser } = req.body;

    // Récupérer la souscription depuis Supabase
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('pseudo', toUser);

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    // Envoyer la notification
    await webpush.sendNotification(
      subscriptions[0].subscription,
      JSON.stringify({
        title: `Message de ${fromUser}`,
        body: message
      })
    );

    res.status(200).json({ message: 'Notification sent' });
  } catch (error) {
    console.error('Error sending push:', error);
    res.status(500).json({ error: error.message });
  }
}