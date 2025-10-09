import { createClient } from '@supabase/supabase-js';

// ✅ Utiliser la SERVICE ROLE KEY (pas la clé anon)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Autoriser uniquement POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reportId, status, action, notes, adminPseudo } = req.body;

  // Validation des paramètres
  if (!reportId || !status || !adminPseudo) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }

  try {
    // 1. Vérifier que c'est bien un admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('pseudo', adminPseudo)
      .single();

    if (userError || !user?.is_admin) {
      console.log(`❌ Accès refusé pour ${adminPseudo}`);
      return res.status(403).json({ error: 'Unauthorized - Admin only' });
    }

    console.log(`✅ Admin vérifié: ${adminPseudo}`);

    // 2. Mettre à jour le signalement (SANS RLS car service_role_key)
    const { data, error } = await supabase
      .from('reports')
      .update({
        status,
        reviewed_by: adminPseudo,
        admin_action: action,
        admin_notes: notes,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur UPDATE:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Signalement ${reportId} mis à jour`);

    return res.status(200).json({ 
      success: true, 
      data 
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return res.status(500).json({ error: error.message });
  }
}