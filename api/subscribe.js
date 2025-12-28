// api/subscribe.js - Enregistrer un abonnement push
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || 'https://ekjgfiyhkythqcnmhzea.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GET : Récupérer la clé publique VAPID
    if (req.method === 'GET') {
        return res.status(200).json({
            publicKey: process.env.VAPID_PUBLIC_KEY
        });
    }

    // POST : Enregistrer un abonnement
    if (req.method === 'POST') {
        try {
            const subscription = req.body;

            if (!subscription || !subscription.endpoint) {
                return res.status(400).json({ error: 'Abonnement invalide' });
            }

            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    endpoint: subscription.endpoint,
                    keys_p256dh: subscription.keys.p256dh,
                    keys_auth: subscription.keys.auth,
                    user_agent: req.headers['user-agent'] || null,
                    is_active: true
                }, {
                    onConflict: 'endpoint'
                });

            if (error) throw error;

            console.log('✅ Abonnement enregistré');
            return res.status(201).json({ success: true });

        } catch (error) {
            console.error('❌ Erreur subscribe:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // DELETE : Supprimer un abonnement
    if (req.method === 'DELETE') {
        try {
            const { endpoint } = req.body;

            if (!endpoint) {
                return res.status(400).json({ error: 'Endpoint manquant' });
            }

            const { error } = await supabase
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', endpoint);

            if (error) throw error;

            console.log('✅ Abonnement supprimé');
            return res.status(200).json({ success: true });

        } catch (error) {
            console.error('❌ Erreur unsubscribe:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
}