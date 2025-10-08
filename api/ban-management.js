// api/ban-management.js
import { createClient } from '@supabase/supabase-js';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const adminPassword = req.headers['x-admin-password'];
  
  if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
    console.warn('⚠️ Tentative d\'accès non autorisée');
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const { action, ip, reason, duration, realIP, deviceId } = req.body;

  try {
    // =================================
    // 🚫 BANNIR UN UTILISATEUR/IP
    // =================================
    if (action === 'ban') {
      let expiresAt = null;
      if (duration) {
        expiresAt = new Date(Date.now() + duration).toISOString();
      }

      const bannedAt = new Date().toISOString();
      console.log(`📝 Bannissement multi-niveaux de: ${ip}`);

      // 1️⃣ Bannir le PSEUDO dans banned_ips
      const { error: pseudoBanError } = await supabaseAdmin
        .from('banned_ips')
        .insert({
          ip: ip, // Le pseudo
          banned_at: bannedAt,
          expires_at: expiresAt,
          reason: reason || 'Non spécifié',
          banned_by: 'Admin'
        });

      if (pseudoBanError && pseudoBanError.code !== '23505') { // Ignorer duplicates
        console.error('❌ Erreur bannissement pseudo:', pseudoBanError);
      } else {
        console.log('✅ Pseudo banni:', ip);
      }

      // 2️⃣ Bannir l'IP RÉELLE dans banned_real_ips (si fournie)
      if (realIP && realIP !== 'null') {
        const { error: realIPError } = await supabaseAdmin
          .from('banned_real_ips')
          .insert({
            ip: realIP,
            banned_at: bannedAt,
            expires_at: expiresAt,
            reason: `IP de ${ip} - ${reason || 'Non spécifié'}`,
            banned_by: 'Admin'
          });

        if (realIPError && realIPError.code !== '23505') {
          console.error('❌ Erreur bannissement IP réelle:', realIPError);
        } else {
          console.log('✅ IP réelle bannie:', realIP);
        }
      }

      // 3️⃣ Bannir l'APPAREIL dans banned_ips (si fourni)
      if (deviceId && deviceId !== 'null') {
        const { error: deviceError } = await supabaseAdmin
          .from('banned_ips')
          .insert({
            ip: deviceId,
            banned_at: bannedAt,
            expires_at: expiresAt,
            reason: `Appareil de ${ip} - ${reason || 'Non spécifié'}`,
            banned_by: 'Admin'
          });

        if (deviceError && deviceError.code !== '23505') {
          console.error('❌ Erreur bannissement appareil:', deviceError);
        } else {
          console.log('✅ Appareil banni:', deviceId);
        }
      }

      return res.status(200).json({ 
        success: true, 
        message: `${ip} banni (pseudo + IP + appareil)`,
        banned: {
          pseudo: ip,
          realIP: realIP || 'non disponible',
          deviceId: deviceId || 'non disponible'
        }
      });
    }

    // =================================
    // ✅ DÉBANNIR UN UTILISATEUR/IP
    // =================================
    else if (action === 'unban') {
      console.log(`🔓 Débannissement multi-niveaux de: ${ip}`);

      // Supprimer de banned_ips (pseudo + device)
      const { error: unbanError1 } = await supabaseAdmin
        .from('banned_ips')
        .delete()
        .eq('ip', ip);

      // Supprimer de banned_real_ips
      const { error: unbanError2 } = await supabaseAdmin
        .from('banned_real_ips')
        .delete()
        .eq('ip', ip);

      if (unbanError1) console.warn('⚠️ Erreur banned_ips:', unbanError1.message);
      if (unbanError2) console.warn('⚠️ Erreur banned_real_ips:', unbanError2.message);

      console.log('✅ Débannissement réussi:', ip);

      return res.status(200).json({ 
        success: true, 
        message: `${ip} débanni complètement` 
      });
    }

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