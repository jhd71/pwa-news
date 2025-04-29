import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Configuration de Supabase avec vos clés existantes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Utiliser la clé de service pour les opérations côté serveur

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration des clés VAPID pour les notifications push
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

// Configuration de web-push
webpush.setVapidDetails(
  'mailto:infos@jhd71.fr', // Votre adresse email de contact
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Ajout de logs détaillés pour le debugging
function logWithTimestamp(message, data) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
}

// Fonction principale pour gérer les requêtes à l'API
export default async function handler(req, res) {
  // Log pour debugging
  logWithTimestamp('API /sendPush appelée', {
    method: req.method,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    },
    body: req.body
  });

  // Activer CORS pour le développement et la production
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Gérer les requêtes OPTIONS (pre-flight CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Vérifier la méthode HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { message, fromUser, toUser } = req.body;

    // Validation des paramètres
    if (!message || !fromUser) {
      logWithTimestamp('Paramètres invalides', req.body);
      return res.status(400).json({ 
        error: 'Paramètres manquants', 
        details: 'Les champs message et fromUser sont requis'
      });
    }

    logWithTimestamp('Récupération des abonnements pour', { toUser });

    // Si toUser est "all", envoyer à tous les utilisateurs
    let queryBuilder = supabase.from('push_subscriptions').select('*').eq('active', true);

    if (toUser && toUser !== 'all') {
      queryBuilder = queryBuilder.eq('pseudo', toUser);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      logWithTimestamp('Erreur Supabase', error);
      return res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }

    // Aucun abonnement trouvé
    if (!data || data.length === 0) {
      logWithTimestamp('Aucun abonnement trouvé pour', { toUser });
      return res.status(200).json({ 
        success: false, 
        message: 'Aucun destinataire trouvé',
        sent: 0
      });
    }

    logWithTimestamp(`${data.length} abonnements trouvés`);

    // Préparation de la notification
const notificationPayload = JSON.stringify({
  title: `Message de ${fromUser}`,
  body: message.length > 100 ? message.substring(0, 97) + '...' : message,
  icon: '/images/AM-192-v2.png',  // Assurez-vous que ce chemin est correct
  badge: '/images/badge-72x72.png',
  timestamp: new Date().getTime(),
  fromUser: fromUser,  // Ajouté pour que le service worker puisse l'utiliser directement
  data: {
    url: req.body.data?.url || '/', 
    type: req.body.data?.type || 'default',
    messageId: req.body.data?.messageId,
    fromUser: fromUser,
    urgent: req.body.data?.type === 'chat' || req.body.data?.urgent === true
  }
});

    // Envoi des notifications
    const sendResults = await Promise.allSettled(
      data.map(async (sub) => {
        try {
          // S'assurer que la subscription est un objet valide
          let parsedSubscription;
          try {
            parsedSubscription = typeof sub.subscription === 'string' 
              ? JSON.parse(sub.subscription) 
              : sub.subscription;
              
            // Vérification de la structure de l'abonnement
            if (!parsedSubscription.endpoint || !parsedSubscription.keys) {
              throw new Error('Structure d\'abonnement invalide');
            }
          } catch (parseError) {
            logWithTimestamp('Erreur de parsing d\'abonnement', {
              error: parseError.message,
              subscription: sub.id
            });
            return { 
              success: false, 
              error: 'Format d\'abonnement invalide',
              subscription: sub.id
            };
          }
            
          logWithTimestamp('Envoi notification à', {
            pseudo: sub.pseudo,
            endpoint: parsedSubscription.endpoint.substring(0, 50) + '...'
          });
          
          const result = await webpush.sendNotification(
            parsedSubscription,
            notificationPayload
          );
          
          logWithTimestamp('Notification envoyée', {
            statusCode: result.statusCode,
            pseudo: sub.pseudo
          });
          
          return { 
            success: true, 
            statusCode: result.statusCode,
            pseudo: sub.pseudo
          };
        } catch (error) {
          logWithTimestamp('Erreur envoi notification', {
            error: error.message,
            statusCode: error.statusCode,
            pseudo: sub.pseudo,
            endpoint: sub.subscription?.endpoint ? sub.subscription.endpoint.substring(0, 30) + '...' : 'N/A'
          });
          
          // Si l'abonnement n'est plus valide, le marquer comme inactif
          if (error.statusCode === 404 || error.statusCode === 410) {
            try {
              await supabase
                .from('push_subscriptions')
                .update({ active: false })
                .eq('id', sub.id);
                
              logWithTimestamp('Abonnement marqué comme inactif', { id: sub.id });
            } catch (updateError) {
              logWithTimestamp('Erreur lors de la mise à jour de l\'abonnement', updateError);
            }
          }
          
          return { 
            success: false, 
            error: error.message, 
            statusCode: error.statusCode,
            subscription: sub.id,
            pseudo: sub.pseudo
          };
        }
      })
    );

    // Analyse des résultats
    const successful = sendResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
const failed = sendResults.filter(r => r.status === 'rejected' || !r.value.success).length;

// Ajouter un log des notifications envoyées pour faciliter le débogage
try {
  // Enregistrer la notification dans une table de suivi
  if (req.body.data?.type === 'chat') {
    await supabase
      .from('notification_history')
      .insert({
        title: `Message de ${fromUser}`,
        body: message.length > 100 ? message.substring(0, 97) + '...' : message,
        type: 'chat',
        // Stocker les informations d'utilisateur dans le champ metadata au format JSON
        metadata: {
          from_user: fromUser,
          to_user: toUser
        },
        sent_at: new Date().toISOString(),
        success_count: successful,
        failure_count: failed
      });
    console.log('Notification de chat enregistrée dans l\'historique');
  }
} catch (logError) {
  console.error('Erreur lors de l\'enregistrement de la notification:', logError);
  // Ne pas bloquer le processus même si l'enregistrement échoue
}

logWithTimestamp('Résultats des envois', {
  successful,
  failed,
  total: data.length
});

return res.status(200).json({
  success: true,
  message: `Notifications envoyées avec succès: ${successful}, échouées: ${failed}`,
  sent: successful,
  failed,
  total: data.length,
  details: sendResults.map(r => r.status === 'fulfilled' ? r.value : r.reason)
});

  } catch (error) {
    logWithTimestamp('Erreur globale', {
      message: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      error: 'Erreur serveur',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
