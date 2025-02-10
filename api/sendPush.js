const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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

// Fonction pour nettoyer les subscriptions expirées
async function cleanExpiredSubscriptions(supabase) {
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
module.exports = async (req, res) => {
  try {
    // S'assurer que les clés VAPID sont configurées
    webpush.setVapidDetails(
      'mailto:infos@jhd71.fr',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    // Nettoyer les souscriptions expirées (avant d'envoyer la notification)
    await cleanExpiredSubscriptions(supabase);

    // Récupérer les données du body de la requête
    const { message, fromUser, toUser } = req.body;
    console.log('Données reçues:', { message, fromUser, toUser });

    // Log initial de la tentative d'envoi
    const { data: logEntry, error: logError } = await supabase
      .from('push_notification_log')
      .insert({
        from_user: fromUser,
        to_user: toUser,
        message: message,
        status: 'pending'
      })
      .select()
      .single();

    if (logError) {
      console.log('ℹ️ Info: Log initial en attente', logError);
      //On continue, car le log n'est pas critique
    }

    // Récupérer les subscriptions de l'utilisateur
    const { data: subscriptions, error: supabaseError } = await supabase
      .from('push_subscriptions')
      .select('subscription, device_type')
      .eq('pseudo', toUser)
      .eq('active', true);

    if (supabaseError) {
      console.log('ℹ️ Info: Données Supabase en attente:', supabaseError);
      throw supabaseError; //Important de relancer pour que le code s'arrête ici
    }

    if (!subscriptions || subscriptions.length === 0) {
      // Mettre à jour le log avec l'erreur
      if (logEntry) {
        await supabase
          .from('push_notification_log')
          .update({
            status: 'error',
            error_message: 'No active subscriptions found',
            updated_at: new Date().toISOString()
          })
          .eq('id', logEntry.id);
      }

      return res.status(404).json({ error: 'No subscription found' });
    }

    // Envoyer les notifications à toutes les subscriptions
    const notifications = await Promise.all(
      subscriptions.map(async ({ subscription, device_type }) => {
        try {
          const parsedSubscription = typeof subscription === 'string'
            ? JSON.parse(subscription)
            : subscription;

          // Tentative d'envoi avec retry
          const success = await sendNotificationWithRetry(
            parsedSubscription,
            {
              title: `Nouveau message de ${fromUser}`,
              body: message
            }
          );

          // Si l'envoi a réussi, on log le succès
          if (success) {
            if (logEntry) {
              await supabase
                .from('push_notification_log')
                .update({
                  status: 'success',
                  updated_at: new Date().toISOString()
                })
                .eq('id', logEntry.id);
            }

            return { success, device_type };
          } else {
            return { success: false, error: 'sendNotificationWithRetry failed', device_type };
          }
        } catch (error) {
          // Gérer les erreurs d'envoi (subscription expirée, etc.)
          if (error.statusCode === 410) {
        console.log('🔄 Renouvellement nécessaire pour:', toUser);
      } else {
        console.log('ℹ️ Info: Notification en attente pour:', toUser);
      }

          // Si la subscription est expirée, la supprimer
          if (error.statusCode === 410) {
            console.log('🔄 Planification renouvellement pour:', {
    utilisateur: toUser,
    appareil: device_type || 'inconnu'
  });
            const { error: deleteError } = await supabase
              .from('push_subscriptions')
              .delete()
              .match({
                 pseudo: toUser,
                 subscription: subscription //On compare directement les strings
              });

            if (deleteError) {
              console.error('Erreur suppression subscription:', deleteError);
            }
          }
           if (logEntry) {
               await supabase
                .from('push_notification_log')
                .update({
                  status: 'error',
                  error_message: `Send notification error: ${error.message}`,
                  updated_at: new Date().toISOString()
                })
                .eq('id', logEntry.id);
           }
          return { success: false, error: error.message, device_type }; //Propager l'erreur
        }
      })
    );

    // Compter les succès et les échecs
    const successful = notifications.filter(r => r.success).length;
    const errors = notifications.filter(r => !r.success);

    console.log('📊 Bilan des notifications:', {
  '✅ Envoyées': successful,
  '🔄 À renouveler': errors.length,
  '📱 Total appareils': subscriptions.length
});

    //Répondre avec le statut des envois
    return res.status(200).json({
      success: true,
      sent: successful,
      total: subscriptions.length,
      errors: errors.map(e => e.error)
    });
  } catch (error) {
    // Gérer les erreurs globales
    console.log('ℹ️ Info: Service en cours de maintenance:', error.message);
    return res.status(500).json({ error: `Maintenance en cours: ${error.message}` });
  }
};
