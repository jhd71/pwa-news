// api/sendNotification.js - Envoyer une notification push
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabase = createClient(
    process.env.SUPABASE_URL || 'https://ekjgfiyhkythqcnmhzea.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// Configuration VAPID
webpush.setVapidDetails(
    'mailto:contact@actuetmedia.fr',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const { title, body, url, adminKey } = req.body;

        // Vérification admin simple (à améliorer selon ton système)
        const ADMIN_PASSWORD = process.env.ADMIN_NOTIFICATION_KEY || 'fc35$wL72iZA^';
if (adminKey !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Non autorisé' });
        }

        if (!title || !body) {
            return res.status(400).json({ error: 'Titre et message requis' });
        }

        // Récupérer tous les abonnements actifs
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('is_active', true);

        if (error) throw error;

        if (!subscriptions || subscriptions.length === 0) {
            return res.status(200).json({ 
                success: true, 
                sent: 0, 
                message: 'Aucun abonné' 
            });
        }

        console.log(`📤 Envoi à ${subscriptions.length} abonnés...`);

        // Payload de la notification
        const payload = JSON.stringify({
            title: title,
            body: body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-72.png',
            url: url || '/',
            timestamp: Date.now()
        });

        // Envoyer à tous les abonnés
        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.keys_p256dh,
                        auth: sub.keys_auth
                    }
                };

                try {
                    await webpush.sendNotification(pushSubscription, payload);
                    return { success: true, endpoint: sub.endpoint };
                } catch (err) {
                    // Si l'abonnement n'est plus valide, le désactiver
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await supabase
                            .from('push_subscriptions')
                            .update({ is_active: false })
                            .eq('endpoint', sub.endpoint);
                    }
                    return { success: false, endpoint: sub.endpoint, error: err.message };
                }
            })
        );

        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.length - successful;

        console.log(`✅ Envoyé: ${successful}, ❌ Échec: ${failed}`);

        return res.status(200).json({
            success: true,
            sent: successful,
            failed: failed,
            total: subscriptions.length
        });

    } catch (error) {
        console.error('❌ Erreur sendNotification:', error);
        return res.status(500).json({ error: error.message });
    }
}