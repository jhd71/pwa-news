const dotenv = require('dotenv');
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

console.log("📨 sendPush.js a été exécuté !");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration des clés VAPID
webpush.setVapidDetails(
  'mailto:infos@jhd71.fr',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Fonction utilitaire pour envoyer une notification avec retry
async function sendNotificationWithRetry(subscription, payload, maxRetries = 2) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      return true;
    } catch (error) {
      if (error.statusCode === 410) {
        console.log('🔄 Maintenance: Souscription à renouveler');
        throw error;
      }
      if (i === maxRetries) {
        console.log('📝 Info: Tentatives de notification épuisées');
        throw error;
      }
      console.log(`🔄 Nouvelle tentative ${i + 1}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

// Fonction pour nettoyer les souscriptions expirées
async function cleanExpiredSubscriptions() {
  try {
    console.log('🔄 Début maintenance des souscriptions...');

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('active', true);

    if (error) {
      console.log('ℹ️ Pas de souscriptions à maintenir');
      return;
    }

    console.log(`📝 Vérification de ${subscriptions?.length || 0} souscriptions`);

    for (const sub of subscriptions || []) {
      try {
        const parsedSubscription = typeof sub.subscription === 'string'
          ? JSON.parse(sub.subscription)
          : sub.subscription;

        await webpush.sendNotification(
          parsedSubscription,
          JSON.stringify({ type: 'ping', timestamp: Date.now() })
        );

        console.log(`✅ Souscription OK: ${sub.pseudo}`);
      } catch (error) {
        if (error.statusCode === 410) {
          console.log(`🔄 Maintenance pour ${sub.pseudo}: renouvellement nécessaire`);
          
          await supabase
            .from('push_subscriptions')
            .delete()
            .match({
              pseudo: sub.pseudo,
              subscription: sub.subscription
            });

          await supabase
            .from('push_notification_log')
            .insert({
              from_user: 'system',
              to_user: sub.pseudo,
              status: 'maintenance',
              error_message: `Renouvellement planifié`,
              subscription: sub.subscription,
              device_type: sub.device_type || 'unknown'
            });
        } else {
          console.log(`ℹ️ Info ${sub.pseudo}: notification temporairement indisponible`);
        }
      }
    }
    console.log('✅ Maintenance terminée');
  } catch (error) {
    console.log('ℹ️ Maintenance reportée');
  }
}

// Handler principal de l'API
module.exports = async function handler(req, res) {
  try {
    // Vérifier si req.body est défini et contient les données requises
    const { message, fromUser, toUser } = req.body || {};
    if (!message || !fromUser || !toUser) {
      console.error("⚠️ Corps de requête incomplet :", req.body);
      return res.status(400).json({ error: "Les champs 'message', 'fromUser' et 'toUser' sont obligatoires." });
    }

    console.log('📩 Données reçues:', { message, fromUser, toUser });

    // Vérifier les souscriptions de l'utilisateur
    const { data: subscriptions, error: supabaseError } = await supabase
  .from('push_subscriptions')
  .select('subscription, device_type')
  .or(`pseudo.eq.${toUser},pseudo.eq.all`)
  .eq('active', true);

    console.log("🔍 Souscriptions trouvées :", subscriptions);

    if (supabaseError) {
      console.log('⚠️ Erreur Supabase :', supabaseError);
      throw supabaseError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`🛑 Aucune souscription trouvée pour ${toUser}`);

      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('pseudo', toUser);

      console.log(`🗑️ Suppression de la souscription expirée pour ${toUser}`);
      return res.status(404).json({ error: 'No subscription found' });
    }

    // Envoi des notifications aux abonnés
    const notifications = await Promise.all(
      subscriptions.map(async ({ subscription }) => {
        try {
          const parsedSubscription = typeof subscription === 'string'
            ? JSON.parse(subscription)
            : subscription;

          await sendNotificationWithRetry(
            parsedSubscription,
            { title: `Nouveau message de ${fromUser}`, body: message }
          );

          return { success: true };
        } catch (error) {
          console.log(`❌ Erreur d'envoi pour ${toUser}:`, error.message);
          return { success: false, error: error.message };
        }
      })
    );

    // Compter les succès et les erreurs
    const successful = notifications.filter(r => r.success).length;
    const errors = notifications.filter(r => !r.success);

    console.log('📊 Bilan des notifications:', {
      '✅ Envoyées': successful,
      '❌ Échecs': errors.length,
      '📱 Total abonnés': subscriptions.length
    });

    return res.status(200).json({
      success: true,
      sent: successful,
      total: subscriptions.length,
      errors: errors.map(e => e.error)
    });

  } catch (error) {
    console.log('⚠️ Erreur interne :', error.message);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
};
