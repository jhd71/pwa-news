// api/send-important-notification.js
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

/* ──────────────────────────────────────────────── */
/* 1)  Supabase + VAPID                            */
/* ──────────────────────────────────────────────── */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Config Web Push avec les mêmes paramètres que votre fichier send-notification.js
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT_EMAIL || 'contact@actuetmedia.fr'}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/* ──────────────────────────────────────────────── */
/* 2)  Vérification de la clé d'API                */
/* ──────────────────────────────────────────────── */
function checkApiKey(req) {
  const given = req.headers['x-api-key'];
  // Vous pouvez définir ces valeurs dans votre fichier .env
  return given === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramdmaXloa3l0aHFjbm1oemVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzYxNDIsImV4cCI6MjA1ODI1MjE0Mn0.V0j_drb6GiTojgwxC6ydjnyJDRRT9lUbSc1E7bFE2Z4'; // Utilisez la même clé que dans le fichier HTML
}

/* ──────────────────────────────────────────────── */
/* 3)  Handler HTTP                                */
/* ──────────────────────────────────────────────── */
export default async function handler(req, res) {
  // Vérifier méthode HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Vérifier authenticité de la requête
  if (!checkApiKey(req)) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    /* -------- données reçues -------- */
    const { title, body, url = '/', imageUrl, urgent = false } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Titre et corps requis' });
    }

    /* -------- 1. Construction du payload ------- */
    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: imageUrl || '/images/AM-192-v2.png',
      badge: '/images/badge-72x72.png',
      timestamp: Date.now(),
      data: {
        url: url.startsWith('http') ? url : `${url.startsWith('/') ? url : `/${url}`}`,
        type: 'important',
        urgent
      }
    });

    /* -------- 2. Récupération des abonnements --- */
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('active', true); // Seulement les abonnements actifs

    if (error) throw error;
    
    if (!subscriptions?.length) {
      return res.status(404).json({ error: 'Aucun abonnement actif trouvé' });
    }

    console.log(`Envoi de notifications importantes à ${subscriptions.length} abonnés`);

    /* -------- 3. Envoi des notifications -------- */
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          // S'assurer que la subscription est un objet et non une chaîne JSON
          let pushSubscription = subscription.subscription;
          if (typeof pushSubscription === 'string') {
            pushSubscription = JSON.parse(pushSubscription);
          }
          
          await webpush.sendNotification(pushSubscription, notificationPayload);
          return { success: true, endpoint: pushSubscription.endpoint };
        } catch (error) {
          // Si l'abonnement n'est plus valide (erreur 410), le supprimer
          if (error.statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', subscription.endpoint);
          }
          return { success: false, endpoint: subscription.endpoint, error: error.message };
        }
      })
    );

    // Compter les succès et les échecs
    const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
    const failed = results.length - successful;

    /* -------- 4. Historique --------------------- */
    await supabase.from('notification_history').insert({
      title, 
      body,
      type: urgent ? 'urgent' : 'important',
      sent_at: new Date().toISOString(),
      success_count: successful,
      failure_count: failed,
      metadata: { url, imageUrl }
    });

    return res.status(200).json({
      success: true,
      sent: successful,
      failed,
      total: results.length
    });
  } catch (err) {
    console.error('Erreur envoi notification :', err);
    return res.status(500).json({ error: err.message });
  }
}