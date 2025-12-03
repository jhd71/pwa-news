// api/cinema-horaires.js
// Fonction Vercel pour récupérer les horaires du cinéma Le Capitole via AlloCiné
// Code cinéma AlloCiné : G0FNC

export default async function handler(req, res) {
  // CORS
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
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  // Code du cinéma Le Capitole sur AlloCiné
  const CINEMA_CODE = 'G0FNC';
  
  // Date du jour au format YYYY-MM-DD
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  
  try {
    // Essayer plusieurs méthodes pour récupérer les données
    let films = [];
    
    // Méthode 1: API AlloCiné (non-officielle mais fonctionnelle)
    try {
      films = await fetchFromAllocineAPI(CINEMA_CODE, dateStr);
      if (films.length > 0) {
        console.log(`✅ AlloCiné API: ${films.length} films récupérés`);
        return res.status(200).json({
          success: true,
          source: 'allocine_api',
          cinema: 'Le Capitole - Montceau-les-Mines',
          date: dateStr,
          count: films.length,
          films: films
        });
      }
    } catch (e) {
      console.warn('AlloCiné API échouée:', e.message);
    }
    
    // Méthode 2: Scraper le HTML d'AlloCiné
    try {
      films = await scrapeAllocineHTML(CINEMA_CODE);
      if (films.length > 0) {
        console.log(`✅ AlloCiné HTML: ${films.length} films récupérés`);
        return res.status(200).json({
          success: true,
          source: 'allocine_html',
          cinema: 'Le Capitole - Montceau-les-Mines',
          date: dateStr,
          count: films.length,
          films: films
        });
      }
    } catch (e) {
      console.warn('AlloCiné HTML échoué:', e.message);
    }
    
    // Méthode 3: Site officiel du cinéma
    try {
      films = await fetchFromOfficialSite();
      if (films.length > 0) {
        console.log(`✅ Site officiel: ${films.length} films récupérés`);
        return res.status(200).json({
          success: true,
          source: 'official_site',
          cinema: 'Le Capitole - Montceau-les-Mines',
          date: dateStr,
          count: films.length,
          films: films
        });
      }
    } catch (e) {
      console.warn('Site officiel échoué:', e.message);
    }
    
    // Aucune méthode n'a fonctionné
    return res.status(200).json({
      success: false,
      source: 'none',
      cinema: 'Le Capitole - Montceau-les-Mines',
      date: dateStr,
      count: 0,
      films: [],
      message: 'Impossible de récupérer les horaires pour le moment'
    });
    
  } catch (error) {
    console.error('Erreur globale:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Méthode 1: API AlloCiné
async function fetchFromAllocineAPI(cinemaCode, date) {
  const partner = 'QUNXZWItQWxsb0Npbuk';
  const url = `http://api.allocine.fr/rest/v3/showtimelist?partner=${partner}&format=json&theaters=${cinemaCode}&date=${date}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    },
    timeout: 10000
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const data = await response.json();
  const films = [];
  
  if (data.feed && data.feed.theaterShowtimes) {
    for (const theater of data.feed.theaterShowtimes) {
      if (theater.movieShowtimes) {
        for (const movie of theater.movieShowtimes) {
          const film = {
            title: movie.onShow?.movie?.title || 'Titre inconnu',
            duration: movie.onShow?.movie?.runtime ? formatDuration(movie.onShow.movie.runtime) : 'Non spécifié',
            genre: movie.onShow?.movie?.genre?.[0]?.$ || 'Film',
            poster: movie.onShow?.movie?.poster?.href || null,
            times: [],
            dates: []
          };
          
          if (movie.scr) {
            for (const screening of movie.scr) {
              if (screening.t) {
                const time = screening.t.substring(11, 16).replace(':', 'h');
                if (!film.times.includes(time)) {
                  film.times.push(time);
                }
              }
              if (screening.d && !film.dates.includes(screening.d)) {
                film.dates.push(screening.d);
              }
            }
          }
          
          if (film.times.length > 0) {
            films.push(film);
          }
        }
      }
    }
  }
  
  return films;
}

// Méthode 2: Scraper AlloCiné HTML
async function scrapeAllocineHTML(cinemaCode) {
  const url = `https://www.allocine.fr/seance/salle_gen_csalle=${cinemaCode}.html`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'fr-FR,fr;q=0.9'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const html = await response.text();
  const films = [];
  
  // Parser simple pour extraire les films
  // Regex pour trouver les titres de films
  const titleRegex = /<a[^>]*class="[^"]*meta-title[^"]*"[^>]*>([^<]+)<\/a>/gi;
  const timeRegex = /(\d{1,2}:\d{2})/g;
  
  let match;
  const seenTitles = new Set();
  
  while ((match = titleRegex.exec(html)) !== null) {
    const title = match[1].trim();
    if (title.length > 2 && title.length < 100 && !seenTitles.has(title)) {
      seenTitles.add(title);
      
      // Chercher les horaires à proximité
      const contextStart = Math.max(0, match.index - 500);
      const contextEnd = Math.min(html.length, match.index + 2000);
      const context = html.substring(contextStart, contextEnd);
      
      const times = [];
      let timeMatch;
      while ((timeMatch = timeRegex.exec(context)) !== null) {
        const time = timeMatch[1].replace(':', 'h');
        const hours = parseInt(time.split('h')[0]);
        if (hours >= 8 && hours <= 23 && !times.includes(time)) {
          times.push(time);
        }
      }
      
      if (times.length > 0) {
        films.push({
          title: title,
          duration: 'Non spécifié',
          genre: 'Film',
          times: times.slice(0, 8),
          dates: []
        });
      }
    }
  }
  
  return films;
}

// Méthode 3: Site officiel
async function fetchFromOfficialSite() {
  const url = 'https://www.cinemacapitole-montceau.fr/horaires/';
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const html = await response.text();
  
  // Le site utilise JavaScript, donc on ne peut pas parser directement
  // Mais on essaie quand même au cas où
  const films = [];
  
  // Chercher des patterns de films dans le HTML
  const filmRegex = /<[^>]*class="[^"]*film[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi;
  const timeRegex = /(\d{1,2}h\d{2})/g;
  
  let match;
  while ((match = filmRegex.exec(html)) !== null) {
    const filmHtml = match[0];
    
    // Extraire le titre
    const titleMatch = filmHtml.match(/<h[123][^>]*>([^<]+)<\/h[123]>/i);
    if (titleMatch) {
      const title = titleMatch[1].trim();
      
      // Extraire les horaires
      const times = [];
      let timeMatch;
      while ((timeMatch = timeRegex.exec(filmHtml)) !== null) {
        if (!times.includes(timeMatch[1])) {
          times.push(timeMatch[1]);
        }
      }
      
      if (times.length > 0) {
        films.push({
          title: title,
          duration: 'Non spécifié',
          genre: 'Film',
          times: times,
          dates: []
        });
      }
    }
  }
  
  return films;
}

// Utilitaire pour formater la durée
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
  }
  return `${minutes} min`;
}