// api/sendEmail.js - Prévenir l'admin par mail d'une nouvelle proposition,
// d'un nouveau commentaire ou d'un nouvel événement.
//
// Protections ajoutées (24 septembre 2026) :
//  - seules les pages d'actuetmedia.fr peuvent appeler cette route ;
//  - 5 envois maximum par adresse IP et par 10 minutes (le quota Resend est
//    partagé avec l'envoi des mails depuis Gmail) ;
//  - longueurs limitées ;
//  - tout le texte des visiteurs est échappé : impossible de glisser du HTML
//    ou un faux lien dans le mail.

const ORIGINES_AUTORISEES = [
    'https://actuetmedia.fr',
    'https://www.actuetmedia.fr'
];

function origineAutorisee(req) {
    const origine = req.headers.origin || '';
    const referer = req.headers.referer || '';
    return ORIGINES_AUTORISEES.some(o => origine === o || referer.startsWith(o + '/'));
}

// Limite d'envois par IP. Mémoire de l'instance Vercel : ce n'est pas un
// verrou parfait (une nouvelle instance repart de zéro), mais ça arrête
// l'envoi en rafale.
const LIMITE = 5;
const FENETRE_MS = 10 * 60 * 1000;
const envoisParIp = new Map();

function tropDEnvois(ip) {
    const maintenant = Date.now();
    const liste = (envoisParIp.get(ip) || []).filter(t => maintenant - t < FENETRE_MS);
    if (liste.length >= LIMITE) {
        envoisParIp.set(ip, liste);
        return true;
    }
    liste.push(maintenant);
    envoisParIp.set(ip, liste);
    if (envoisParIp.size > 500) envoisParIp.clear();
    return false;
}

function echapper(texte, max) {
    return String(texte ?? '')
        .slice(0, max)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Pour le sujet du mail : pas de HTML, mais pas de retour à la ligne non plus
function nettoyerSujet(texte, max) {
    return String(texte ?? '').replace(/[\r\n]+/g, ' ').slice(0, max);
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', 'https://actuetmedia.fr');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    if (!origineAutorisee(req)) {
        return res.status(403).json({ error: 'Origine non autorisée' });
    }

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'inconnue';
    if (tropDEnvois(ip)) {
        return res.status(429).json({ error: 'Trop de messages, réessayez plus tard' });
    }

    const corps = req.body || {};
    const type = corps.type;
    const isRecurrent = !!corps.isRecurrent;

    if (!type || !corps.content) {
        return res.status(400).json({ error: 'Données manquantes' });
    }

    // Versions échappées, utilisables sans risque dans le HTML du mail
    const title = echapper(corps.title, 200);
    const author = echapper(corps.author, 100);
    const newsTitle = echapper(corps.newsTitle, 200);
    const category = echapper(corps.category, 40);
    const content = echapper(corps.content, 5000);

    // Versions texte pour le sujet
    const titreSujet = nettoyerSujet(corps.title, 120);
    const auteurSujet = nettoyerSujet(corps.author, 60);

    // Construire le sujet et le contenu de l'email
    let subject, htmlContent;
    
    if (type === 'proposition') {
        subject = `📰 Nouvelle proposition : ${titreSujet || 'Sans titre'}`;
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
        subject = `💬 Nouveau commentaire de ${auteurSujet || 'Anonyme'}`;
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
        const emoji = categoryEmojis[corps.category] || '📅';
        const recurrentBadge = isRecurrent ? ' 🔄 (récurrent)' : '';
        
        subject = `📅 Nouvel événement : ${titreSujet || 'Sans titre'}${recurrentBadge}`;
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
            return res.status(500).json({ error: 'Erreur envoi email' });
        }
        
        return res.status(200).json({ success: true, id: data.id });
        
    } catch (error) {
        console.error('Erreur:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}