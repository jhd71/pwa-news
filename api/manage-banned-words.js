// api/manage-banned-words.js
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

  // ✅ Vérifier l'authentification admin
  const adminPassword = req.headers['x-admin-password'];
  
  if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
    console.warn('⚠️ Tentative d\'accès non autorisée à manage-banned-words');
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const { action, word, addedBy } = req.body;

  try {
    // =================================
    // ➕ AJOUTER UN MOT BANNI
    // =================================
    if (action === 'add') {
      if (!word || word.trim().length === 0) {
        return res.status(400).json({ error: 'Mot invalide' });
      }

      const cleanWord = word.trim().toLowerCase();
      
      console.log(`📝 Ajout du mot banni: ${cleanWord}`);

      const { error } = await supabaseAdmin
        .from('banned_words')
        .insert({
          word: cleanWord,
          added_by: addedBy || 'Admin'
        });

      if (error) {
        // Vérifier si c'est un doublon
        if (error.code === '23505') {
          return res.status(400).json({ error: 'Ce mot existe déjà' });
        }
        throw error;
      }

      console.log(`✅ Mot "${cleanWord}" ajouté avec succès`);
      return res.status(200).json({ 
        success: true, 
        message: `Mot "${cleanWord}" ajouté`
      });
    }

    // =================================
    // 🗑️ SUPPRIMER UN MOT BANNI
    // =================================
    else if (action === 'remove') {
      if (!word || word.trim().length === 0) {
        return res.status(400).json({ error: 'Mot invalide' });
      }

      const cleanWord = word.trim().toLowerCase();
      
      console.log(`🗑️ Suppression du mot banni: ${cleanWord}`);

      const { error } = await supabaseAdmin
        .from('banned_words')
        .delete()
        .eq('word', cleanWord);

      if (error) throw error;

      console.log(`✅ Mot "${cleanWord}" supprimé avec succès`);
      return res.status(200).json({ 
        success: true, 
        message: `Mot "${cleanWord}" supprimé` 
      });
    }

    // =================================
    // ❌ ACTION INVALIDE
    // =================================
    else {
      return res.status(400).json({ 
        error: 'Action invalide. Utilisez "add" ou "remove"' 
      });
    }

  } catch (error) {
    console.error('❌ Erreur API manage-banned-words:', error);
    return res.status(500).json({ 
      error: error.message || 'Erreur serveur interne' 
    });
  }
}