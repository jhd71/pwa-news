// api/subscribe.js - Enregistrer un abonnement push
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ekjgfiyhkythqcnmhzea.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramdmaXloa3l0aHFjbm1oemVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzYxNDIsImV4cCI6MjA1ODI1MjE0Mn0.V0j_drb6GiTojgwxC6ydjnyJDRRT9lUbSc1E7bFE2Z4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
        const publicKey = process.env.VAPID_PUBLIC_KEY;
        
        if (!publicKey) {
            console.error('❌ VAPID_PUBLIC_KEY non définie');
            return res.status(500).json({ error: 'Configuration VAPID manquante' });
        }
        
        return res.status(200).json({ publicKey });
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

            if (error) {
                console.error('❌ Erreur Supabase:', error);
                throw error;
            }

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