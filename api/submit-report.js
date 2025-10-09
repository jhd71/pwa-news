// ============================================================
// API : Soumettre un signalement de message
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
        const { messageId, reportedBy, reason, messageContent, messagePseudo } = req.body;

        // Validation des données
        if (!messageId || !reportedBy || !reason) {
            return res.status(400).json({ 
                error: 'Données manquantes',
                details: 'messageId, reportedBy et reason sont requis'
            });
        }

        // Créer le client Supabase avec la clé service
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Vérifier si le message existe toujours
        const { data: message, error: messageError } = await supabase
            .from('messages')
            .select('*')
            .eq('id', messageId)
            .single();

        if (messageError || !message) {
            return res.status(404).json({ 
                error: 'Message non trouvé',
                details: 'Le message a peut-être été supprimé'
            });
        }

        // Vérifier si l'utilisateur a déjà signalé ce message
        const { data: existingReport, error: checkError } = await supabase
            .from('reports')
            .select('id')
            .eq('message_id', messageId)
            .eq('reported_by', reportedBy)
            .maybeSingle();

        if (checkError) {
            console.error('Erreur vérification signalement existant:', checkError);
        }

        if (existingReport) {
            return res.status(409).json({ 
                error: 'Déjà signalé',
                details: 'Vous avez déjà signalé ce message'
            });
        }

        // Créer le signalement
        const { data: report, error: insertError } = await supabase
            .from('reports')
            .insert({
                message_id: messageId,
                reported_by: reportedBy,
                reason: reason,
                message_content: messageContent || message.content,
                message_pseudo: messagePseudo || message.pseudo,
                status: 'pending',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) {
            console.error('Erreur insertion signalement:', insertError);
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