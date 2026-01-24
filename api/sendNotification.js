// api/sendNotification.js - Version corrigée pour extensions Chrome
const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ekjgfiyhkythqcnmhzea.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configurer VAPID
webpush.setVapidDetails(
    'mailto:contact@actuetmedia.fr',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

module.exports = async function handler(req, res) {
    // CORS - Important pour les extensions Chrome
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Répondre immédiatement aux requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).json({ ok: true });
    }

    // Vérifier la méthode
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const { title, body, url, adminKey, urgent } = req.body;

        // Vérifier la clé admin
        const ADMIN_PASSWORD = process.env.ADMIN_NOTIFICATION_KEY || 'fc35$wL72iZA^';
        if (adminKey !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Clé admin invalide' });
        }

        if (!title || !body) {
            return res.status(400).json({ error: 'Titre et message requis' });
        }

        // Récupérer tous les abonnés actifs
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('is_active', true);

        if (error) {
            console.error('Erreur Supabase:', error);
            throw error;
        }

        if (!subscriptions || subscriptions.length === 0) {
            return res.status(200).json({ sent: 0, failed: 0, total: 0, message: 'Aucun abonné' });
        }

        // Payload de la notification
        const payload = JSON.stringify({
            title: title,
            body: body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-72.png',
            url: url || 'https://actuetmedia.fr/',
            urgent: urgent || false,
            timestamp: Date.now()
        });

        console.log('📤 Envoi notification à', subscriptions.length, 'abonnés');

        let sent = 0;
        let failed = 0;

        // Envoyer à chaque abonné
        for (const sub of subscriptions) {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.keys_p256dh,
                    auth: sub.keys_auth
                }
            };

            try {
                await webpush.sendNotification(pushSubscription, payload);
                sent++;
            } catch (err) {
                console.error('❌ Erreur envoi:', err.statusCode);
                failed++;
                
                // Désactiver les abonnements invalides
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await supabase
                        .from('push_subscriptions')
                        .update({ is_active: false })
                        .eq('endpoint', sub.endpoint);
                }
            }
        }

        console.log(`📊 Résultat: ${sent} envoyés, ${failed} échoués`);

        return res.status(200).json({ 
            sent, 
            failed,
            total: subscriptions.length,
            success: true
        });

    } catch (error) {
        console.error('❌ Erreur sendNotification:', error);
        return res.status(500).json({ error: error.message || 'Erreur serveur' });
    }
};