// api/sendNotification.js - Envoyer des notifications push
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ekjgfiyhkythqcnmhzea.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramdmaXloa3l0aHFjbm1oemVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzYxNDIsImV4cCI6MjA1ODI1MjE0Mn0.V0j_drb6GiTojgwxC6ydjnyJDRRT9lUbSc1E7bFE2Z4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configurer VAPID
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
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
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

        // Payload de la notification - IMPORTANT : structure correcte
        const payload = JSON.stringify({
            title: title,
            body: body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-72.png',
            url: url || '/',
            timestamp: Date.now()
        });

        console.log('📤 Envoi notification:', payload);

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
                console.log('✅ Envoyé à:', sub.endpoint.substring(0, 50) + '...');
            } catch (err) {
                console.error('❌ Erreur envoi:', err.statusCode, err.body);
                failed++;
                
                // Supprimer les abonnements invalides
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await supabase
                        .from('push_subscriptions')
                        .delete()
                        .eq('endpoint', sub.endpoint);
                    console.log('🗑️ Abonnement supprimé:', sub.endpoint.substring(0, 50) + '...');
                }
            }
        }

        console.log(`📊 Résultat: ${sent} envoyés, ${failed} échoués`);

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