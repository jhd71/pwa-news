// ============================================================
// API : Soumettre un signalement (Messages, Photos, News, etc.)
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    // Configuration CORS
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
        const { 
            contentType,      // 'message', 'photo', 'news', etc.
            contentId, 
            contentAuthor, 
            contentText, 
            reportedBy, 
            category,         // 'spam', 'inappropriate', etc.
            reason,           // Détails du signalement
            reporterIP 
        } = req.body;

        // ✅ LOG DES DONNÉES REÇUES
        console.log('📥 Signalement reçu:', {
            contentType,
            contentId,
            contentAuthor,
            reportedBy,
            category,
            reporterIP
        });

        // Validation des données obligatoires
        if (!contentType || !contentId || !reportedBy || !category) {
            console.log('❌ Validation échouée');
            return res.status(400).json({ 
                error: 'Données manquantes',
                details: 'contentType, contentId, reportedBy et category sont requis'
            });
        }

        // Créer le client Supabase avec la clé service
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Vérifier si l'utilisateur a déjà signalé ce contenu
        const { data: existingReport, error: checkError } = await supabase
            .from('reports')
            .select('id')
            .eq('content_type', contentType)
            .eq('content_id', contentId)
            .eq('reported_by', reportedBy)
            .maybeSingle();

        if (checkError) {
            console.error('⚠️ Erreur vérification doublon:', checkError);
            // Ne pas bloquer si erreur de vérification
        }

        if (existingReport) {
            console.log('⚠️ Signalement déjà existant');
            return res.status(400).json({ 
                error: 'Déjà signalé',
                details: 'Vous avez déjà signalé ce contenu'
            });
        }

        // Créer le signalement
        const reportData = {
            content_type: contentType,
            content_id: contentId,
            content_author: contentAuthor || 'Inconnu',
            content_text: contentText || '',
            reported_by: reportedBy,
            category: category,
            reason: reason || `Signalé comme: ${category}`,
            reporter_ip: reporterIP || 'unknown',
            status: 'pending',
            created_at: new Date().toISOString()
        };

        console.log('💾 Insertion du signalement:', reportData);

        const { data: report, error: insertError } = await supabase
            .from('reports')
            .insert(reportData)
            .select()
            .single();

        if (insertError) {
            console.error('❌ Erreur insertion:', insertError);
            throw insertError;
        }

        console.log('✅ Signalement créé:', report.id);

        return res.status(200).json({ 
            success: true,
            reportId: report.id,
            message: 'Signalement enregistré avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur API submit-report:', error);
        
        return res.status(500).json({ 
            error: 'Erreur serveur',
            details: error.message
        });
    }
}