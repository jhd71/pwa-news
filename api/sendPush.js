const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Handler principal de l'API
module.exports = async (req, res) => {
  try {
    // S'assurer que les clés VAPID sont configurées
    webpush.setVapidDetails(
      'mailto:infos@jhd71.fr',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    // Récupérer les données du body de la requête
    const { message, fromUser, toUser } = req.body;
    console.log('Données reçues:', { message, fromUser, toUser });

    // Récupérer les subscriptions de l'utilisateur
    const { data: subscriptions, error: supabaseError } = await supabase
      .from('push_subscriptions')
      .select('subscription, device_type')
      .eq('pseudo', toUser)
      .eq('active', true);

    if (supabaseError) {
      console.error('Erreur Supabase:', supabaseError);
      return res.status(500).json({ error: `Supabase error: ${supabaseError.message}` });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    // Envoyer les notifications à toutes les subscriptions
    const notifications = await Promise.all(
      subscriptions.map(async ({ subscription }) => {
        try {
          // Tentative d'envoi
          await webpush.sendNotification(
            subscription,
            JSON.stringify({
              title: `Nouveau message de ${fromUser}`,
              body: message
            })
          );
          console.log('Notification envoyée avec succès à:', toUser);
          return true; // Indiquer le succès

        } catch (error) {
          // Gérer les erreurs d'envoi (subscription expirée, etc.)
          console.error('Erreur envoi notification:', error);

          // Si la subscription est expirée (410), la supprimer
          if (error.statusCode === 410) {
            console.warn('Subscription expirée, suppression:', subscription);
            const { error: deleteError } = await supabase
              .from('push_subscriptions')
              .delete()
              .match({
                pseudo: toUser,
                subscription: subscription, // Utiliser l'objet directement
              });

            if (deleteError) {
              console.error('Erreur suppression subscription:', deleteError);
            }
          }
          return false; // Indiquer l'échec
        }
      })
    );

    // Compter les succès
    const successful = notifications.filter(Boolean).length;
    console.log('Résultat des notifications:', {
      success: successful,
      total: subscriptions.length
    });

    //Répondre avec le statut des envois
    return res.status(200).json({
      success: true,
      sent: successful,
      total: subscriptions.length
    });

  } catch (error) {
    // Gérer les erreurs globales
    console.error('Erreur générale:', error);
    return res.status(500).json({ error: `General error: ${error.message}` });
  }
};
