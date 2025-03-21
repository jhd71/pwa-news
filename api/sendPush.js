import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Configuration et validation des variables d'environnement
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY'
];

// Fonction de validation des variables d'environnement
function validateEnvironment() {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('⚠️ Variables d\'environnement manquantes:', missingVars);
    throw new Error(`Variables d'environnement manquantes : ${missingVars.join(', ')}`);
  }
}

// Initialisation sécurisée
let supabase;
let vapidPublicKey;
let vapidPrivateKey;

try {
  validateEnvironment();

  // Création du client Supabase
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Configuration des clés VAPID
  vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  webpush.setVapidDetails(
    'mailto:infos@jhd71.fr',
    vapidPublicKey,
    vapidPrivateKey
  );
} catch (error) {
  console.error('Erreur d\'initialisation:', error);
}

// Fonction utilitaire pour envoyer une notification avec gestion des erreurs
async function sendNotificationWithRetry(subscription, payload, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error(`Tentative ${attempt + 1} échouée:`, error);

      // Gestion des abonnements expirés
      if (error.statusCode === 410) {
        console.log('Abonnement expiré');
        return false;
      }

      // Attente entre les tentatives
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  return false;
}

// Fonction de nettoyage des abonnements expirés
async function cleanExpiredSubscriptions() {
  try {
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) throw error;

    for (const sub of subscriptions || []) {
      try {
        const parsedSubscription = typeof sub.keys === 'string' 
          ? JSON.parse(sub.keys) 
          : sub.keys;

        await webpush.sendNotification(
          parsedSubscription, 
          JSON.stringify({ type: 'ping' })
        );
      } catch (error) {
        if (error.statusCode === 410) {
          // Supprimer l'abonnement expiré
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);
        }
      }
    }
  } catch (error) {
    console.error('Erreur de nettoyage des subscriptions:', error);
  }
}

export default async function handler(req, res) {
  // Log de débogage
  console.log('Requête reçue:', {
    method: req.method,
    body: req.body
  });

  // Vérification de la méthode
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Validation des données
    const { message, fromUser, toUser } = req.body;

    if (!message || !fromUser || !toUser) {
      return res.status(400).json({ 
        error: 'Données de notification incomplètes' 
      });
    }

    // Nettoyage des abonnements
    await cleanExpiredSubscriptions();

    // Récupération des abonnements
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (subError) throw subError;

    if (!subscriptions?.length) {
      return res.status(404).json({ error: 'Aucun abonnement actif' });
    }

    // Envoi des notifications
    const notificationPromises = subscriptions.map(async (sub) => {
      try {
        const parsedSubscription = typeof sub.keys === 'string' 
          ? JSON.parse(sub.keys) 
          : sub.keys;

        return await sendNotificationWithRetry(
          parsedSubscription, 
          {
            title: `Message de ${fromUser}`,
            body: message,
            icon: '/images/AM-192-v2.png'
          }
        );
      } catch (error) {
        console.error('Erreur lors de l\'envoi:', error);
        return false;
      }
    });

    // Attendre toutes les notifications
    const results = await Promise.all(notificationPromises);

    // Analyser les résultats
    const successCount = results.filter(Boolean).length;
    const failureCount = results.length - successCount;

    return res.status(200).json({
      success: true,
      total: subscriptions.length,
      sent: successCount,
      failed: failureCount
    });

  } catch (error) {
    console.error('Erreur serveur:', error);
    
    return res.status(500).json({ 
      error: 'Erreur serveur', 
      message: error.message 
    });
  }
}
