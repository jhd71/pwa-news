// api/subscribe.js - Enregistrer un abonnement push
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ekjgfiyhkythqcnmhzea.supabase.co';
// Cette route s'exécute sur le serveur Vercel, jamais dans le navigateur.
// On utilise donc la clé service_role, qui ignore les règles RLS : la table
// push_subscriptions peut ainsi être fermée au public sans rien casser ici.
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY absente des variables Vercel.');
}

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

            const userAgent = req.headers['user-agent'] || null;

            // 🧹 ÉTAPE 1 : Supprimer les anciens abonnements de ce navigateur
            if (userAgent) {
                const { data: oldSubs, error: selectError } = await supabase
                    .from('push_subscriptions')
                    .select('endpoint')
                    .eq('user_agent', userAgent)
                    .neq('endpoint', subscription.endpoint);

                if (!selectError && oldSubs && oldSubs.length > 0) {
                    console.log(`🗑️ Suppression de ${oldSubs.length} ancien(s) abonnement(s) pour ce navigateur`);
                    
                    const { error: deleteError } = await supabase
                        .from('push_subscriptions')
                        .delete()
                        .eq('user_agent', userAgent)
                        .neq('endpoint', subscription.endpoint);

                    if (deleteError) {
                        console.error('⚠️ Erreur suppression doublons:', deleteError);
                    }
                }
            }

            // ✅ ÉTAPE 2 : Enregistrer le nouvel abonnement
            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    endpoint: subscription.endpoint,
                    keys_p256dh: subscription.keys.p256dh,
                    keys_auth: subscription.keys.auth,
                    user_agent: userAgent,
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