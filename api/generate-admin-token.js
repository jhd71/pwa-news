import crypto from 'crypto';

// Stockage temporaire des tokens (en production, utilisez Redis ou une DB)
const validTokens = new Map();

// Nettoyer les tokens expirés toutes les minutes
setInterval(() => {
    const now = Date.now();
    for (const [token, expiry] of validTokens.entries()) {
        if (expiry < now) {
            validTokens.delete(token);
        }
    }
}, 60000);

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { password } = req.body;
        
        // Vérifier le mot de passe
        if (!password || password !== process.env.ADMIN_API_KEY) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        
        // Générer un token unique
        const token = crypto.randomBytes(32).toString('hex');
        const expires = Date.now() + 300000; // 5 minutes
        
        // Stocker le token
        validTokens.set(token, expires);
        
        return res.status(200).json({ 
            success: true,
            token, 
            expiresIn: 300000, // 5 minutes en ms
            expiresAt: expires 
        });
    } catch (error) {
        console.error('Erreur génération token:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// Fonction exportée pour vérifier les tokens
export function isValidToken(token) {
    if (!token) return false;
    
    const expiry = validTokens.get(token);
    if (!expiry) return false;
    
    if (expiry < Date.now()) {
        validTokens.delete(token);
        return false;
    }
    
    return true;
}