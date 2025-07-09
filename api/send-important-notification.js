import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { isValidToken } from './generate-admin-token.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT_EMAIL || 'contact@actuetmedia.fr'}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Admin-Token');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Vérifier le token OU le mot de passe
  const token = req.headers['x-admin-token'];
  const apiKey = req.headers['x-api-key'];
  
  let isAuthorized = false;
  
  // Vérifier d'abord le token
  if (token && isValidToken(token)) {
    isAuthorized = true;
  }
  // Sinon vérifier le mot de passe (pour compatibilité)
  else if (apiKey && apiKey === process.env.ADMIN_API_KEY) {
    isAuthorized = true;
  }
  
  if (!isAuthorized) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    const { title, body, url = '/', imageUrl, urgent = false } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Titre et corps requis' });
    }

    /* -------- 1. Construction du payload ------- */
    const notificationPayload = {
      notification: {
        title,
        body,
        icon : imageUrl || '/images/AM-192-v2.png',
        badge: '/images/badge-72x72.png',
        data : {
          url   : new URL(url, 'https://actuetmedia.fr').href, // URL absolue
          type  : 'important',
          urgent
        }
      }
    };

    /* -------- 2. Récupération des abonnements --- */
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) throw error;
    if (!subscriptions?.length)
      return res.status(404).json({ error: 'Aucun abonnement trouvé' });

    /* -------- 3. Envoi des notifications -------- */
    const results = await Promise.allSettled(
      subscriptions.map(async row => {
        let pushSubscription = row.subscription;
        if (typeof pushSubscription === 'string')
          pushSubscription = JSON.parse(pushSubscription);

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(notificationPayload)
        );
        return { success: true };
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed     = results.length - successful;

    /* -------- 4. Historique --------------------- */
    await supabase.from('notification_history').insert({
      title, body,
      type          : urgent ? 'urgent' : 'important',
      sent_at       : new Date().toISOString(),
      success_count : successful,
      failure_count : failed,
      metadata      : { url, imageUrl }
    });

    return res.status(200).json({ success: true, sent: successful, failed });
  }
  catch (err){
    console.error('Erreur envoi notification :', err);
    return res.status(500).json({ error: err.message });
  }
}