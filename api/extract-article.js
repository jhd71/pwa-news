// API pour extraire les meta-données Open Graph d'une URL
// Déployer dans /api/extract-article.js sur Vercel

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL requise' });
    }

    try {
        // Récupérer la page
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ActuMediaBot/1.0)',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'fr-FR,fr;q=0.9'
            },
            timeout: 10000
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();

        // Extraire les meta-données
        const data = {
            url: url,
            title: '',
            description: '',
            image: '',
            siteName: '',
            author: ''
        };

        // Fonctions d'extraction
        const getMetaContent = (html, property) => {
            // Open Graph
            let match = html.match(new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']*)["']`, 'i'));
            if (match) return match[1];
            
            // Inverser l'ordre des attributs
            match = html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:${property}["']`, 'i'));
            if (match) return match[1];
            
            return null;
        };

        const getMetaName = (html, name) => {
            let match = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'));
            if (match) return match[1];
            
            match = html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i'));
            if (match) return match[1];
            
            return null;
        };

        // Titre
        data.title = getMetaContent(html, 'title');
        if (!data.title) {
            const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
            if (titleMatch) data.title = titleMatch[1];
        }

        // Description
        data.description = getMetaContent(html, 'description');
        if (!data.description) {
            data.description = getMetaName(html, 'description');
        }

        // Image
        data.image = getMetaContent(html, 'image');
        if (!data.image) {
            // Chercher twitter:image
            data.image = getMetaName(html, 'twitter:image');
        }

        // Nom du site
        data.siteName = getMetaContent(html, 'site_name');
        if (!data.siteName) {
            // Extraire du domaine
            try {
                const urlObj = new URL(url);
                data.siteName = urlObj.hostname.replace('www.', '').split('.')[0];
                data.siteName = data.siteName.charAt(0).toUpperCase() + data.siteName.slice(1);
            } catch (e) {}
        }

        // Auteur
        data.author = getMetaName(html, 'author');
        if (!data.author) {
            data.author = getMetaContent(html, 'article:author');
        }

        // Nettoyer les entités HTML
        const decodeHtml = (text) => {
            if (!text) return '';
            return text
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&nbsp;/g, ' ')
                .trim();
        };

        data.title = decodeHtml(data.title);
        data.description = decodeHtml(data.description);
        data.siteName = decodeHtml(data.siteName);

        // Limiter la description
        if (data.description && data.description.length > 300) {
            data.description = data.description.substring(0, 297) + '...';
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error('Erreur extraction:', error);
        return res.status(500).json({ 
            error: 'Impossible d\'extraire les données',
            details: error.message 
        });
    }
}
