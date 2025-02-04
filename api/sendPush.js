// api/sendPush.js
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Configuration des clés VAPID
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

// Configuration Supabase avec variables d'environnement
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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

    // Récupérer toutes les souscriptions de l'utilisateur
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('pseudo', toUser);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    // Envoyer la notification à toutes les souscriptions
    const notificationPayload = JSON.stringify({
      title: `Nouveau message de ${fromUser}`,
      body: message,
      icon: '/images/INFOS-192.png',
      badge: '/images/badge-72x72.png',
      data: {
        url: '/?action=openchat'
      }
    });

    // Envoyer à toutes les souscriptions et gérer les erreurs
    const results = await Promise.allSettled(
      subscriptions.map(async ({ subscription }) => {
        try {
          const parsedSubscription = typeof subscription === 'string' 
            ? JSON.parse(subscription) 
            : subscription;
            
          await webpush.sendNotification(
            parsedSubscription,
            notificationPayload
          );
          return true;
        } catch (error) {
          if (error.statusCode === 410) {
            // Supprimer les souscriptions expirées
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('subscription', subscription);
          }
          throw error;
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.status(200).json({ 
      message: `Notifications sent: ${successful} successful, ${failed} failed`
    });
  } catch (error) {
    console.error('Error sending push:', error);
    res.status(500).json({ error: error.message });
  }
}
