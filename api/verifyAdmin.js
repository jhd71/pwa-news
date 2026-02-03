export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }
    
    try {
        const { password } = req.body;
        const adminPassword = process.env.ADMIN_PASSWORD;
        
        if (!password) {
            return res.status(400).json({ success: false, error: 'Mot de passe requis' });
        }
        
        if (password === adminPassword) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(401).json({ success: false, error: 'Mot de passe incorrect' });
        }
        
    } catch (error) {
        console.error('Erreur vérification admin:', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
}