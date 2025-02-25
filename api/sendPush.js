const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

// Configuration de Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Version simplifiée - utile pour le débogage
module.exports = async (req, res) => {
    try {
        const { message, fromUser, toUser } = req.body;
        console.log('📨 Envoi de message:', { message, fromUser, toUser });

        // Initialiser Firebase Admin à la demande
        if (!admin.apps.length) {
            try {
                // Chargement direct du compte de service
                const serviceAccount = require('../config/VOTRE-NOUVEAU-FICHIER.json');
                
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                console.log('Firebase Admin initialisé avec succès');
            } catch (error) {
                console.error('Erreur initialisation Firebase Admin:', error);
                return res.status(500).json({ error: `Erreur initialisation: ${error.message}` });
            }
        }

        // Récupérer le token FCM du destinataire
        const { data: userToken, error } = await supabase
            .from('fcm_tokens')
            .select('token')
            .eq('user_id', toUser)
            .single();

        if (error || !userToken || !userToken.token) {
            return res.status(404).json({ error: 'Aucun token FCM disponible.' });
        }

        // Envoyer la notification
        const messagePayload = {
            token: userToken.token,
            notification: {
                title: `Message de ${fromUser}`,
                body: message
            }
        };

        const response = await admin.messaging().send(messagePayload);
        return res.status(200).json({ success: true, messageId: response });
    } catch (error) {
        console.error('❌ Erreur:', error);
        return res.status(500).json({ error: error.message });
    }
};
