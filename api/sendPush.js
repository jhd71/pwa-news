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
      return true; // Succès, on sort de la boucle
    } catch (error) {
      // Si la subscription est invalide (410), on ne retry pas
      if (error.statusCode === 410) {
        console.warn('Subscription expirée, pas de retry:', error);
        throw error; // On relance l'erreur pour la supprimer
      }

      // Si on a atteint le nombre max de retries, on relance l'erreur
      if (i === maxRetries) {
        console.error('Nombre max de retries atteint:', error);
        throw error;
      }

      console.log(`Retry #${i + 1} après erreur:`, error);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1s
    }
  }
  return false; // Ne devrait pas arriver ici
}

// Fonction pour nettoyer les subscriptions expirées
async function cleanExpiredSubscriptions(supabase) {
  try {
    console.log('Début du nettoyage des souscriptions expirées...');

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('active', true);

    if (error) {
      console.error('Erreur récupération souscriptions pour le nettoyage:', error);
      return;
    }

    console.log(`${subscriptions?.length || 0} souscriptions actives trouvées`);

    for (const sub of subscriptions || []) {
      try {
        const parsedSubscription = sub.subscription; // Pas besoin de re-parser, c'est déjà un objet

        // Envoyer une notification de "ping" pour tester la validité
        await webpush.sendNotification(
          parsedSubscription,
          JSON.stringify({ type: 'ping', timestamp: Date.now() })
        );

        console.log(`Souscription valide pour ${sub.pseudo}`);
      } catch (error) {
        if (error.statusCode === 410) {
          console.warn(`Suppression de la souscription expirée pour ${sub.pseudo}:`, error);

          // Log des objets subscription pour vérification
          console.log('Subscription en base de données:', sub.subscription);
          console.log('Subscription causant l\'erreur:', error.endpoint);

          // Supprimer la subscription de la base de données
          const { error: deleteError } = await supabase
            .from('push_subscriptions')
            .delete()
            .match({
              pseudo: sub.pseudo,
              subscription: sub.subscription, // Utiliser l'objet directement
            });

          if (deleteError) {
            console.error('Erreur suppression subscription:', deleteError);
          }

          // Log de la suppression
          const { error: logError } = await supabase
            .from('push_notification_log')
            .insert({
              from_user: 'system',
              to_user: sub.pseudo,
              status: 'error',
              error_message: `Subscription expired and deleted: ${error.body}`,
              subscription: JSON.stringify(sub.subscription), // Sérialiser pour le log
              device_type: sub.device_type || 'unknown'
            });

          if (logError) {
            console.error('Erreur logging suppression:', logError);
          }
        } else {
          console.error(`Erreur test souscription pour ${sub.pseudo}:`, error);
        }
      }
    }
    console.log('Nettoyage des souscriptions terminé');
  } catch (error) {
    console.error('Erreur globale nettoyage souscriptions:', error);
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
      console.error('Erreur logging initial:', logError);
      //On continue, car le log n'est pas critique
    }

    // Récupérer les subscriptions de l'utilisateur
    const { data: subscriptions, error: supabaseError } = await supabase
      .from('push_subscriptions')
      .select('subscription, device_type')
      .eq('pseudo', toUser)
      .eq('active', true);

    if (supabaseError) {
      console.error('Erreur Supabase:', supabaseError);
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
          const parsedSubscription = subscription;

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
          console.error('Erreur envoi notification:', error);

          // Si la subscription est expirée, la supprimer
          if (error.statusCode === 410) {
            console.warn('Subscription expirée, suppression:', subscription);
            const { error: deleteError } = await supabase
              .from('push_subscriptions')
              .delete()
              .match({
                 pseudo: toUser,
                 subscription: subscription,
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

    console.log('Résultats des notifications:', {
      success: successful,
      errors: errors.map(e => e.error),
      total: subscriptions.length
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
    console.error('Erreur générale:', error);
       return res.status(500).json({ error: `General error: ${error.message}` });
  }
};
