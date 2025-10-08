// api/ban-management.js
import { createClient } from '@supabase/supabase-js';

// ⚠️ Client admin avec SERVICE ROLE KEY (côté serveur uniquement)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(req, res) {
  // ✅ Accepter uniquement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // ✅ Vérifier l'authentification admin
  const adminPassword = req.headers['x-admin-password'];
  
  if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
    console.warn('⚠️ Tentative d\'accès non autorisée');
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const { action, ip, reason, duration } = req.body;

  try {
    // =================================
    // 🚫 BANNIR UN UTILISATEUR/IP
    // =================================
    if (action === 'ban') {
      // Calculer la date d'expiration si une durée est fournie
      let expiresAt = null;
      if (duration) {
        expiresAt = new Date(Date.now() + duration).toISOString();
      }

      console.log(`📝 Tentative de bannissement: ${ip}`);

      // Bannir dans la table banned_ips
      const { error: banError } = await supabaseAdmin
        .from('banned_ips')
        .insert({
          ip: ip,
          banned_at: new Date().toISOString(),
          expires_at: expiresAt,
          reason: reason || 'Non spécifié',
          banned_by: 'Admin'
        });

      if (banError) {
        console.error('❌ Erreur bannissement:', banError);
        throw banError;
      }

      console.log('✅ Bannissement réussi:', ip);

      return res.status(200).json({ 
        success: true, 
        message: `${ip} a été banni` 
      });
    }

    // =================================
    // ✅ DÉBANNIR UN UTILISATEUR/IP
    // =================================
    else if (action === 'unban') {
      console.log(`🔓 Tentative de débannissement: ${ip}`);

      // Supprimer de banned_ips
      const { error: unbanError1 } = await supabaseAdmin
        .from('banned_ips')
        .delete()
        .eq('ip', ip);

      // Supprimer de banned_real_ips
      const { error: unbanError2 } = await supabaseAdmin
        .from('banned_real_ips')
        .delete()
        .eq('ip', ip);

      if (unbanError1) {
        console.warn('⚠️ Erreur banned_ips:', unbanError1.message);
      }
      if (unbanError2) {
        console.warn('⚠️ Erreur banned_real_ips:', unbanError2.message);
      }

      console.log('✅ Débannissement réussi:', ip);

      return res.status(200).json({ 
        success: true, 
        message: `${ip} a été débanni` 
      });
    }

    // =================================
    // ❌ ACTION INVALIDE
    // =================================
    else {
      return res.status(400).json({ 
        error: 'Action invalide. Utilisez "ban" ou "unban"' 
      });
    }

  } catch (error) {
    console.error('❌ Erreur API:', error);
    return res.status(500).json({ 
      error: error.message || 'Erreur serveur interne' 
    });
  }
}