// api/submit-report.js
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

  const { 
    contentType, 
    contentId, 
    contentAuthor,
    contentText,
    reportedBy, 
    category, 
    reason,
    reporterIP 
  } = req.body;

  try {
    // Vérifier si déjà signalé par cette personne
    const { data: existing } = await supabaseAdmin
      .from('reports')
      .select('id')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .eq('reported_by', reportedBy)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Vous avez déjà signalé ce contenu' });
    }

    // Créer le signalement
    const { error } = await supabaseAdmin
      .from('reports')
      .insert({
        content_type: contentType,
        content_id: contentId,
        content_author: contentAuthor,
        content_text: contentText.substring(0, 200), // Limiter à 200 caractères
        reported_by: reportedBy,
        reporter_ip: reporterIP,
        category: category,
        reason: reason,
        status: 'pending'
      });

    if (error) throw error;

    console.log(`📢 Nouveau signalement: ${contentType} par ${reportedBy}`);

    return res.status(200).json({ success: true, message: 'Signalement envoyé' });

  } catch (error) {
    console.error('❌ Erreur signalement:', error);
    return res.status(500).json({ error: error.message });
  }
}