export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }
    
    const { type, title, author, content, newsTitle, category, isRecurrent } = req.body;
    
    if (!type || !content) {
        return res.status(400).json({ error: 'Données manquantes' });
    }
    
    // Construire le sujet et le contenu de l'email
    let subject, htmlContent;
    
    if (type === 'proposition') {
        subject = `📰 Nouvelle proposition : ${title || 'Sans titre'}`;
        htmlContent = `
            <h2>📰 Nouvelle proposition d'actualité</h2>
            <p><strong>Titre :</strong> ${title || 'Non spécifié'}</p>
            <p><strong>Auteur :</strong> ${author || 'Anonyme'}</p>
            <p><strong>Contenu :</strong></p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 10px 0;">
                ${content.replace(/\n/g, '<br>')}
            </div>
            <p style="margin-top: 20px;">
                <a href="https://actuetmedia.fr/admin.html" style="background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none;">
                    Voir dans l'admin
                </a>
            </p>
        `;
    } else if (type === 'commentaire') {
        subject = `💬 Nouveau commentaire de ${author || 'Anonyme'}`;
        htmlContent = `
            <h2>💬 Nouveau commentaire à valider</h2>
            <p><strong>Sur l'actualité :</strong> ${newsTitle || 'Non spécifié'}</p>
            <p><strong>Auteur :</strong> ${author || 'Anonyme'}</p>
            <p><strong>Commentaire :</strong></p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 10px 0;">
                ${content.replace(/\n/g, '<br>')}
            </div>
            <p style="margin-top: 20px;">
                <a href="https://actuetmedia.fr/admin.html" style="background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none;">
                    Valider le commentaire
                </a>
            </p>
        `;
    } else if (type === 'evenement') {
        // Type événement
        const categoryEmojis = {
            'sport': '⚽', 'culture': '🎭', 'marche': '🛒', 'brocante': '🏷️',
            'concert': '🎵', 'fete': '🎉', 'reunion': '👥', 'autre': '📌'
        };
        const emoji = categoryEmojis[category] || '📅';
        const recurrentBadge = isRecurrent ? ' 🔄 (récurrent)' : '';
        
        subject = `📅 Nouvel événement : ${title || 'Sans titre'}${recurrentBadge}`;
        htmlContent = `
            <h2>${emoji} Nouvel événement à valider</h2>
            <p><strong>Titre :</strong> ${title || 'Non spécifié'}</p>
            <p><strong>Catégorie :</strong> ${emoji} ${category || 'Non spécifié'}</p>
            ${isRecurrent ? '<p><strong>🔄 Événement récurrent</strong></p>' : ''}
            <p><strong>Proposé par :</strong> ${author || 'Anonyme'}</p>
            <p><strong>Détails :</strong></p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 10px 0;">
                ${content.replace(/\n/g, '<br>')}
            </div>
            <p style="margin-top: 20px;">
                <a href="https://actuetmedia.fr/admin.html" style="background: #6366f1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none;">
                    Valider l'événement
                </a>
            </p>
        `;
    } else {
        return res.status(400).json({ error: 'Type non reconnu' });
    }
    
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Actu & Média <notifications@actuetmedia.fr>',
                to: ['contact@actuetmedia.fr'],
                subject: subject,
                html: htmlContent
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error('Erreur Resend:', data);
            return res.status(500).json({ error: 'Erreur envoi email', details: data });
        }
        
        return res.status(200).json({ success: true, id: data.id });
        
    } catch (error) {
        console.error('Erreur:', error);
        return res.status(500).json({ error: error.message });
    }
}