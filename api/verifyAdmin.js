// api/verifyAdmin.js - Vérification sécurisée du mot de passe admin
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
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ success: false, error: 'Mot de passe requis' });
        }

        // Vérifier avec la variable d'environnement
        const ADMIN_PASSWORD = process.env.ADMIN_NOTIFICATION_KEY;
        
        if (!ADMIN_PASSWORD) {
            console.error('Variable ADMIN_NOTIFICATION_KEY non configurée');
            return res.status(500).json({ success: false, error: 'Configuration serveur manquante' });
        }

        if (password === ADMIN_PASSWORD) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(401).json({ success: false, error: 'Mot de passe incorrect' });
        }

    } catch (error) {
        console.error('Erreur verifyAdmin:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}