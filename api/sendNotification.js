// api/sendNotification.js - Envoyer des notifications push (OPTIMISÉ)
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ekjgfiyhkythqcnmhzea.supabase.co';
// Cette route s'exécute sur le serveur Vercel, jamais dans le navigateur.
// On utilise donc la clé service_role, qui ignore les règles RLS : la table
// push_subscriptions peut ainsi être fermée au public sans rien casser ici.
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY absente des variables Vercel.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configurer VAPID
webpush.setVapidDetails(
    'mailto:contact@actuetmedia.fr',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

export const config = {
    maxDuration: 60, // 🚀 Augmenter le timeout à 60 secondes
};

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const { title, body, url, adminKey } = req.body;

        // Vérifier la clé admin
        const ADMIN_PASSWORD = process.env.ADMIN_NOTIFICATION_KEY;
        if (!ADMIN_PASSWORD) {
            console.error('Variable ADMIN_NOTIFICATION_KEY non configurée');
            return res.status(500).json({ error: 'Configuration serveur manquante' });
        }
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

        if (error) throw error;

        if (!subscriptions || subscriptions.length === 0) {
            return res.status(200).json({ sent: 0, message: 'Aucun abonné' });
        }

        // Payload de la notification
        const payload = JSON.stringify({
            title: title,
            body: body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-72.png',
            url: url || '/',
            timestamp: Date.now()
        });

        console.log('📤 Envoi notification à', subscriptions.length, 'abonnés');

        // 🚀 OPTIMISATION : Envoyer en PARALLÈLE avec Promise.allSettled
        const sendPromises = subscriptions.map(async (sub) => {
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
                console.error('❌ Erreur envoi:', err.statusCode, err.body);
                
                // Supprimer les abonnements invalides
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await supabase
                        .from('push_subscriptions')
                        .delete()
                        .eq('endpoint', sub.endpoint);
                    console.log('🗑️ Abonnement supprimé:', sub.endpoint.substring(0, 50) + '...');
                }
                
                return { success: false, endpoint: sub.endpoint };
            }
        });

        // Attendre tous les envois (succès + échecs)
        const results = await Promise.allSettled(sendPromises);
        
        let sent = 0;
        let failed = 0;
        
        results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.success) {
                sent++;
            } else {
                failed++;
            }
        });

        console.log(`📊 Résultat: ${sent} envoyés, ${failed} échoués sur ${subscriptions.length} total`);

        return res.status(200).json({ 
            sent, 
            failed,
            total: subscriptions.length 
        });

    } catch (error) {
        console.error('❌ Erreur sendNotification:', error);
        return res.status(500).json({ error: error.message });
    }
}