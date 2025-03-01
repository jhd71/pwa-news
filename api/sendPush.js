const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

console.log("📨 sendPush.js a été exécuté !");

// Initialisation Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Clés VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// Fonction utilitaire pour envoyer une notification avec retry
async function sendNotificationWithRetry(subscription, payload, maxRetries = 2) {
    if (!subscription) {
        console.error("❌ Erreur: Subscription manquante");
        return false;
    }
    for (let i = 0; i <= maxRetries; i++) {
        try {
            await webpush.sendNotification(subscription, JSON.stringify(payload));
            console.log("✅ Notification envoyée avec succès (tentative:", i + 1, ")");
            return true;
        } catch (error) {
            console.error("❌ Erreur lors de l'envoi (tentative:", i + 1, "):", error);
            if (error.statusCode === 410) {
                console.log('🔄 Maintenance: Souscription à renouveler');
                throw error;
            }

            if (i === maxRetries) {
                console.warn('📝 Info: Tentatives de notification épuisées');
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
            console.warn('ℹ️ Pas de souscriptions à maintenir:', error.message);
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
                    
                    const { error: deleteError } = await supabase
                        .from('push_subscriptions')
                        .delete()
                        .match({
                            pseudo: sub.pseudo,
                            subscription: sub.subscription
                        });

                    if (deleteError) {
                        console.error('❌ Erreur suppression subscription:', deleteError);
                    }
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

                    if (maintenanceError) {
                        console.error("❗ Erreur de log de maintenance :", maintenanceError);
                    }
                } else {
                    console.warn(`ℹ️ Info ${sub.pseudo}: notification temporairement indisponible`, error.message);
                }
            }
        }

        console.log('✅ Maintenance terminée');
    } catch (error) {
        console.warn('ℹ️ Maintenance reportée:', error.message);
    }
}
// Handler principal de l'API
module.exports = async (req, res) => {
    try {
        // Vérification de la méthode HTTP
        if (req.method !== 'POST') {
            console.warn("❌ Erreur: Méthode HTTP incorrecte");
            return res.status(405).json({ error: 'Méthode non autorisée. Utiliser POST.' });
        }

        // Débogage - Afficher le body de la requête (à retirer en production)
        console.log("Body de la requête :", req.body);

        // Vérifier si les clés VAPID sont définies
        if (!vapidPublicKey || !vapidPrivateKey) {
            console.error("Clés VAPID non définies dans l'environnement");
            return res.status(500).json({ error: "Clés VAPID non définies" });
        }

        // S'assurer que les clés VAPID sont configurées
        webpush.setVapidDetails(
            'mailto:infos@jhd71.fr',
            vapidPublicKey,
            vapidPrivateKey
        );
        
        // Récupérer les données du body de la requête
        const { message, fromUser, toUser } = req.body || {};

        // Vérifier si req.body est défini et si message, fromUser et toUser existent
        if (!req.body || !message || !fromUser || !toUser) {
            console.error("Corps de requête incomplet :", req.body);
            return res.status(400).json({ error: "Corps de requête incomplet : Les champs 'message', 'fromUser' et 'toUser' sont obligatoires." });
        }

        console.log('Données reçues:', { message, fromUser, toUser });

        // Log initial de la tentative d'envoi
        let logEntry = null;
        try {
            const { data, error: logError } = await supabase
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
                console.warn('ℹ️ Info: Log initial en attente', logError);
            }
            logEntry = data;
        } catch (err) {
            console.error("❌ Erreur de LOG dans Supabase :", err.message);
            logEntry = null;
        }
        // Récupérer les subscriptions de l'utilisateur
        let subscriptions = null;
        try {
            const { data, error: supabaseError } = await supabase
                .from('push_subscriptions')
                .select('subscription, device_type')
                .eq('pseudo', toUser)
                .eq('active', true);

            if (supabaseError) {
                console.warn('ℹ️ Info: Données Supabase en attente:', supabaseError);
            }
            subscriptions = data;
        } catch (err) {
            console.error("❌ Erreur de récupération des souscriptions dans Supabase :", err.message);
            subscriptions = null;
        }

        if (!subscriptions || !Array.isArray(subscriptions) || subscriptions.length === 0) {
            // Mettre à jour le log avec l'erreur
            if (logEntry) {
                await supabase
                .from('push_notification_log')
                .update({
                  status: 'error',
                  error_message: 'No active subscriptions found',
                  updated_at: new Date().toISOString()
                })
                .eq('id', logEntry.id)
                .then((updateResult) => {
                    if (updateResult.error) {
                        console.error("❌ Erreur de update du log:", updateResult.error.message);
                    }
                })
                .catch(console.error);
            }

            return res.status(404).json({ error: 'No subscription found' });
        }
        const notifications = await Promise.all(
                subscriptions.map(async ({ subscription: sub, device_type }) => {
                    try {
                        const parsedSubscription = typeof sub === 'string'
                            ? JSON.parse(sub)
                            : sub;

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
                          .eq('id', logEntry.id)
                          .then((updateResult) => {
                              if (updateResult.error) {
                                  console.error("❌ Erreur de update du log:", updateResult.error.message);
                              }
                          })
                          .catch(console.error);
                }

                    return { success, device_type };
                } else {
                    return { success: false, error: 'sendNotificationWithRetry failed', device_type };
                }
            } catch (error) {
              // Gérer les erreurs d'envoi (subscription expirée, etc.)
      console.error("❌ Erreur lors de l'envoi de la notification à l'appareil :", device_type, error);
               // Erreur :
              if (logEntry) {
                  await supabase
                    .from('push_notification_log')
                    .update({
                      status: 'error',
                      error_message: `Send notification error: ${error.message}`,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', logEntry.id)
                    .then((updateResult) => {
                        if (updateResult.error) {
                            console.error("❌ Erreur de update du log:", updateResult.error.message);
                        }
                    })
                    .catch(console.error);
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
        console.error('❌ Erreur globale:', error);
        return res.status(500).json({ error: `Maintenance en cours: ${error.message}` });
    }
};
