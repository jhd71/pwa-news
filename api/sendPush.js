const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch'); // Assure-toi que 'node-fetch' est installé

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY; // Ta clé Firebase dans .env

// Fonction pour envoyer une notification via Firebase
async function sendFCMNotification(toToken, title, body) {
    try {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `key=${FCM_SERVER_KEY}`
            },
            body: JSON.stringify({
                to: toToken,
                notification: {
                    title: title,
                    body: body,
                    icon: '/images/INFOS-192.png'
                },
                priority: 'high'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur FCM: ${response.status} - ${errorText}`);
        }

        console.log(`📩 Notification envoyée à ${toToken}`);
        return true;
    } catch (error) {
        console.error('❌ Erreur envoi FCM:', error);
        return false;
    }
}

// Handler principal de l'API
module.exports = async (req, res) => {
    try {
        const { message, fromUser, toUser } = req.body;
        console.log('📨 Envoi de message:', { message, fromUser, toUser });

        // Récupérer le token FCM du destinataire depuis Supabase
        const { data: userToken, error } = await supabase
            .from('fcm_tokens')
            .select('token')
            .eq('user_id', toUser)
            .single();

        if (error || !userToken) {
            console.error('❌ Aucun token FCM trouvé pour cet utilisateur.');
            return res.status(404).json({ error: 'Aucun token FCM disponible.' });
        }

        // Envoi de la notification via FCM
        const success = await sendFCMNotification(userToken.token, `Message de ${fromUser}`, message);
        if (!success) {
            return res.status(500).json({ error: 'Échec envoi notification FCM' });
        }

        return res.status(200).json({ success: true, message: 'Notification envoyée avec succès' });
    } catch (error) {
        console.error('❌ Erreur générale dans sendPush.js:', error);
        return res.status(500).json({ error: error.message });
    }
};
