const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

// Chargement direct du fichier de compte de service avec le nom exact
const serviceAccount = require('../config/jhd71-fbe56-58e7d4d404ec.json');

// Configuration de Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialiser Firebase Admin SDK
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin initialisé avec succès');
    } catch (error) {
        console.error('Erreur initialisation Firebase Admin:', error);
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

        if (error || !userToken || !userToken.token) {
            console.error('❌ Aucun token FCM trouvé pour cet utilisateur:', toUser);
            return res.status(404).json({ error: 'Aucun token FCM disponible.' });
        }

        console.log('✅ Token trouvé pour', toUser);

        // Envoyer la notification via Firebase Admin SDK
        try {
            const messagePayload = {
                token: userToken.token,
                notification: {
                    title: `Message de ${fromUser}`,
                    body: message
                },
                webpush: {
                    notification: {
                        icon: '/images/INFOS-192.png',
                        badge: '/images/badge-72x72.png',
                        vibrate: [100, 50, 100]
                    },
                    fcmOptions: {
                        link: 'https://pwa-news-two.vercel.app/?action=openchat'
                    }
                }
            };

            const response = await admin.messaging().send(messagePayload);
            console.log('✅ Notification envoyée avec succès:', response);
            return res.status(200).json({ success: true, messageId: response });
        } catch (fcmError) {
            console.error('❌ Erreur envoi Firebase:', fcmError);
            return res.status(500).json({ error: `Erreur Firebase: ${fcmError.message}` });
        }
    } catch (error) {
        console.error('❌ Erreur générale dans sendPush.js:', error);
        return res.status(500).json({ error: error.message });
    }
};
