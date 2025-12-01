// api/cinema-horaires.js
// Fonction Vercel pour récupérer les horaires du cinéma Le Capitole
// Avec fallback AlloCiné si le site principal ne fonctionne pas

export default async function handler(req, res) {
  // Autoriser uniquement votre domaine
  const allowedOrigins = [
    'https://actuetmedia.fr',
    'https://www.actuetmedia.fr',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  // Liste des sources à essayer dans l'ordre
  const sources = [
    {
      name: 'Le Capitole (site officiel)',
      url: 'https://www.cinemacapitole-montceau.fr/horaires/',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache'
      }
    },
    {
      name: 'AlloCiné Le Capitole',
      url: 'https://www.allocine.fr/seance/salle_gen_csalle=G0FNC.html',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Referer': 'https://www.allocine.fr/'
      }
    }
  ];
  
  let lastError = null;
  
  for (const source of sources) {
    try {
      console.log(`Tentative: ${source.name}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(source.url, {
        headers: source.headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const html = await response.text();
      
      // Vérifier que le HTML contient des données utiles
      // Pour le site du Capitole, vérifier s'il y a des éléments de film
      // Pour AlloCiné, vérifier s'il y a des séances
      const hasContent = html.includes('film') || 
                         html.includes('séance') || 
                         html.includes('seance') ||
                         html.includes('horaire') ||
                         html.includes('card-movie') ||
                         html.includes('showtimes');
      
      if (html.length > 5000 && hasContent) {
        console.log(`✅ Succès avec: ${source.name} (${html.length} caractères)`);
        
        // Ajouter un marqueur pour identifier la source
        const markedHtml = `<!-- Source: ${source.name} -->\n${html}`;
        
        return res.status(200).send(markedHtml);
      } else {
        console.log(`⚠️ ${source.name}: Contenu insuffisant ou pas de films`);
        lastError = new Error('Contenu insuffisant');
      }
      
    } catch (error) {
      console.error(`❌ Erreur ${source.name}:`, error.message);
      lastError = error;
    }
  }
  
  // Si toutes les sources échouent
  console.error('Toutes les sources ont échoué:', lastError?.message);
  res.status(500).json({ 
    error: 'Impossible de récupérer les horaires',
    message: lastError?.message || 'Toutes les sources ont échoué',
    suggestion: 'Le cinéma Le Capitole ouvre le 3 décembre 2025'
  });
}