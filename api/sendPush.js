import dotenv from 'dotenv';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

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

export const config = {
  api: {
    bodyParser: true,
    externalResolver: true,
    responseLimit: false,
    timeout: 30
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, fromUser, toUser, retry } = req.body;

    if (!message || !fromUser || !toUser) {
      return res.status(400).json({ 
        error: "Données manquantes" 
      });
    }

    // Log de la tentative
    const { data: logEntry, error: logError } = await supabase
      .from('push_notification_log')
      .insert({
        from_user: fromUser,
        to_user: toUser,
        message: message,
        status: 'pending',
        retry_count: retry ? 1 : 0
      })
      .select()
      .single();

    if (logError) {
      console.error('Erreur de logging:', logError);
    }

    // Récupération des souscriptions avec timeout
    const { data: subscriptions, error: subError } = await Promise.race([
      supabase
        .from('push_subscriptions')
        .select('*')
        .eq('pseudo', toUser)
        .eq('active', true),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('DB Timeout')), 5000)
      )
    ]);

    if (subError) {
      throw subError;
    }

    if (!subscriptions?.length) {
      if (logEntry) {
        await supabase
          .from('push_notification_log')
          .update({
            status: 'error',
            error_message: 'Aucune souscription active',
            updated_at: new Date().toISOString()
          })
          .eq('id', logEntry.id);
      }
      return res.status(404).json({ 
        error: 'Aucune souscription active' 
      });
    }

    // Envoi des notifications avec Promise.all et timeout
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const parsedSubscription = typeof sub.subscription === 'string'
            ? JSON.parse(sub.subscription)
            : sub.subscription;

          await Promise.race([
            webpush.sendNotification(
              parsedSubscription,
              JSON.stringify({
                title: `Message de ${fromUser}`,
                body: message
              })
            ),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Push Timeout')), 5000)
            )
          ]);

          return { 
            success: true, 
            device: sub.device_type 
          };
        } catch (error) {
          // Gestion des souscriptions expirées
          if (error.statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .match({
                pseudo: toUser,
                subscription: sub.subscription
              });
          }

          return { 
            success: false, 
            error: error.message,
            device: sub.device_type,
            expired: error.statusCode === 410
          };
        }
      })
    );

    // Mise à jour du log
    if (logEntry) {
      await supabase
        .from('push_notification_log')
        .update({
          status: 'completed',
          success_count: results.filter(r => r.success).length,
          error_count: results.filter(r => !r.success).length,
          error_message: results.some(r => !r.success) 
            ? results.filter(r => !r.success).map(r => r.error).join(', ')
            : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', logEntry.id);
    }

    // Statistiques pour monitoring
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const expiredCount = results.filter(r => r.expired).length;

    console.log('📊 Bilan des notifications:', {
      '✅ Envoyées': successCount,
      '❌ Échecs': failureCount,
      '🔄 Expirées': expiredCount,
      '📱 Total appareils': subscriptions.length
    });

    return res.status(200).json({
      success: true,
      sent: successCount,
      failed: failureCount,
      expired: expiredCount,
      total: subscriptions.length,
      errors: results
        .filter(r => !r.success)
        .map(r => ({ message: r.error, device: r.device }))
    });

  } catch (error) {
    console.error('Erreur notification:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
}
