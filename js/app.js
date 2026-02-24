// ============================================
// ACTU & MÉDIA - Application JavaScript v2
// ============================================

// === CACHE LOCAL CINÉMA ===
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

function getCachedData(key) {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp > CACHE_DURATION) {
            localStorage.removeItem(key);
            return null;
        }
        return data;
    } catch (e) {
        return null;
    }
}

function setCachedData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify({
            data: data,
            timestamp: Date.now()
        }));
    } catch (e) {
        console.log('Cache storage failed');
    }
}

// Configuration
const CONFIG = {
    news: {
        apiUrl: '/api/getNews',
        refreshInterval: 10 * 60 * 1000
    },
    cinema: {
        capitole: {
            dataUrl: 'https://raw.githubusercontent.com/jhd71/scraper-cinema/main/data/cinema.json',
            nom: 'Le Capitole',
            ville: 'Montceau-les-Mines',
            siteUrl: 'https://www.cinemacapitole-montceau.fr/horaires/'
        },
        magic: {
            dataUrl: 'https://raw.githubusercontent.com/jhd71/scraper-cinema-magic/main/data/cinema-magic.json',
            nom: 'Magic',
            ville: 'Le Creusot',
            siteUrl: 'https://www.cinemamagic-creusot.fr/horaires/'
        }
    },
    supabase: {
        url: 'https://ekjgfiyhkythqcnmhzea.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramdmaXloa3l0aHFjbm1oemVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzYxNDIsImV4cCI6MjA1ODI1MjE0Mn0.V0j_drb6GiTojgwxC6ydjnyJDRRT9lUbSc1E7bFE2Z4'
    }
};

// Instance unique Supabase (évite les multiples instances)
let supabaseClient = null;

function getSupabaseClient() {
    if (!supabaseClient && typeof window.supabase !== 'undefined') {
        supabaseClient = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.key);
        console.log('✅ Supabase initialisé (instance unique)');
    }
    return supabaseClient;
}

// Exposer globalement pour les autres scripts
window.getSupabaseClient = getSupabaseClient;

// État de l'application
let newsCurrentSlide = 0;
let newsSlides = [];
let newsAutoPlayInterval = null;
let deferredPrompt = null;

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Actu & Média - Initialisation');
    
    initTheme();
    initWeather();
    initNews();
    initCinema();
    initCommunity();
    initServiceWorker();
    initInstallPrompt();
    initExtraTiles();
    initToggleSections();
    initPushNotifications();
    initAgenda();
    initSport();
    initFontSizeSelector();
    initDateBar();
    recordVisit();
});

// ============================================
// MÉTÉO (Open-Meteo - sans clé API) - J+2
// ============================================
async function initWeather() {
    try {
        const latitude = 46.6667;
        const longitude = 4.3667;

        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,weathercode&timezone=Europe/Paris`
        );

        if (!response.ok) throw new Error('Erreur météo');

        const data = await response.json();

        // Aujourd'hui (J+0)
        const tempToday = Math.round(data.current_weather.temperature);
        
        const icon0 = document.getElementById('weatherIcon0');
        const temp0 = document.getElementById('weatherTemp0');
        if (icon0) icon0.innerHTML = getWeatherIcon(data.current_weather.weathercode, 'small');
        if (temp0) temp0.textContent = `${tempToday}°`;

        // Demain (J+1)
        if (data.daily && data.daily.temperature_2m_max && data.daily.temperature_2m_max.length > 1) {
            const tempJ1 = Math.round(data.daily.temperature_2m_max[1]);
            
            const icon1 = document.getElementById('weatherIcon1');
            const temp1 = document.getElementById('weatherTemp1');
            if (icon1) icon1.innerHTML = getWeatherIcon(data.daily.weathercode[1], 'small');
            if (temp1) temp1.textContent = `${tempJ1}°`;
        }

        // Après-demain (J+2)
        if (data.daily && data.daily.temperature_2m_max && data.daily.temperature_2m_max.length > 2) {
            const tempJ2 = Math.round(data.daily.temperature_2m_max[2]);
            const dayNameJ2 = getDayName(2);
            
            const label2 = document.getElementById('weatherLabel2');
            const icon2 = document.getElementById('weatherIcon2');
            const temp2 = document.getElementById('weatherTemp2');
            if (label2) label2.textContent = dayNameJ2;
            if (icon2) icon2.innerHTML = getWeatherIcon(data.daily.weathercode[2], 'small');
            if (temp2) temp2.textContent = `${tempJ2}°`;
        }

        console.log('🌤️ Météo chargée (J+0, J+1, J+2)');

    } catch (error) {
        console.error('❌ Erreur météo:', error);
    }
}

function getDayName(daysFromNow) {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return days[date.getDay()];
}

function getWeatherEmoji(code) {
    // Retourne emoji pour compatibilité (utilisé dans textContent)
    if (code === 0) return '☀️';
    if ([1, 2, 3].includes(code)) return '⛅';
    if ([45, 48].includes(code)) return '🌫️';
    if ([51, 53, 55, 61, 63, 65].includes(code)) return '🌧️';
    if ([66, 67].includes(code)) return '🌧️';
    if ([71, 73, 75, 77].includes(code)) return '❄️';
    if ([80, 81, 82].includes(code)) return '🌦️';
    if ([95, 96, 99].includes(code)) return '⛈️';
    return '🌤️';
}

// Icône météo moderne v2 (avec nuages sombres pour pluie/orage)
// URL de base des icônes Meteocons (animées, gratuites, licence MIT)
const METEOCONS_BASE = 'https://basmilius.github.io/weather-icons/production/fill/all/';
const ICON_SIZES = { small: 32, medium: 48, large: 72, xlarge: 120 };

function getWeatherIcon(code, size = 'medium') {
    const px = ICON_SIZES[size] || 48;
    const name = getMeteoconName(code);
    return `<img src="${METEOCONS_BASE}${name}.svg" width="${px}" height="${px}" alt="météo" style="display:block;">`;
}

function getMeteoconName(code) {
    const hour = new Date().getHours();
    const isDay = hour >= 7 && hour < 20;
    const daySuffix = isDay ? 'day' : 'night';
    
    if (code === 0) return isDay ? 'clear-day' : 'clear-night';
    if (code === 1) return `partly-cloudy-${daySuffix}`;
    if (code === 2) return `overcast-${daySuffix}`;
    if (code === 3) return 'overcast';
    if ([45, 48].includes(code)) return 'fog';
    if ([51, 53, 55].includes(code)) return 'drizzle';
    if ([61, 80].includes(code)) return `partly-cloudy-${daySuffix}-rain`;
    if ([63, 81].includes(code)) return 'rain';
    if ([65, 66, 67, 82].includes(code)) return 'rain';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
    if (code === 95) return 'thunderstorms-rain';
    if ([96, 99].includes(code)) return 'thunderstorms';
    return `partly-cloudy-${daySuffix}`;
}


// ============================================
// THÈME (Multi-thèmes)
// ============================================
const THEMES = ['dark', 'light'];

const THEME_ICONS = {
    'dark': 'dark_mode',
    'light': 'light_mode'
};

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    
    // Bouton toggle header (cycle tous les thèmes)
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'dark';
            const currentIndex = THEMES.indexOf(current);
            const nextIndex = (currentIndex + 1) % THEMES.length;
            const newTheme = THEMES[nextIndex];
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
    
    // Sélecteur de thèmes (dans panel support)
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            applyTheme(theme);
            localStorage.setItem('theme', theme);
        });
    });
}

function applyTheme(theme) {
    // "dark" = pas d'attribut (utilise :root)
    if (theme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
    
    // Mettre à jour l'icône du toggle header
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.textContent = THEME_ICONS[theme] || 'dark_mode';
    }
    
    // Mettre à jour le bouton actif dans le sélecteur
    document.querySelectorAll('.theme-option').forEach(btn => {
        const btnTheme = btn.getAttribute('data-theme');
        btn.classList.toggle('active', btnTheme === theme);
    });
}

// ============================================
// NEWS SWIPER
// ============================================
async function initNews() {
    const container = document.getElementById('newsTicker');
    
    try {
        const response = await fetch(CONFIG.news.apiUrl);
        if (!response.ok) throw new Error('Erreur API');
        
        const articles = await response.json();
        
        if (articles && articles.length > 0) {
            newsSlides = articles;
            renderNewsSlider(articles);
            initNewsNavigation();
            startNewsAutoPlay();
            console.log(`📰 ${articles.length} articles chargés`);
        } else {
            showNewsError('Aucune actualité disponible');
        }
    } catch (error) {
        console.error('❌ Erreur news:', error);
        showNewsError('Impossible de charger les actualités');
    }
}

function renderNewsSlider(articles) {
    const container = document.getElementById('newsTicker');
    const dotsContainer = document.getElementById('tickerDots');
    
    container.innerHTML = `
        <div class="news-slides" id="newsSlides">
            ${articles.map((article, index) => `
                <div class="news-slide">
                    <a href="${article.link}" target="_blank" rel="noopener" class="news-item fade-in" style="animation-delay: ${index * 0.1}s">
                        <div class="news-item-content">
                            <div class="news-item-title">${article.title}</div>
                            <div class="news-item-meta">
                                <span class="news-item-date">${formatDate(article.date)}</span>
                                <span class="news-item-read">Lire la suite sur ${article.source} →</span>
                            </div>
                        </div>
                    </a>
                </div>
            `).join('')}
        </div>
    `;
    
    dotsContainer.innerHTML = articles.map((_, index) => 
        `<div class="ticker-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>`
    ).join('');
    
    dotsContainer.querySelectorAll('.ticker-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            goToNewsSlide(parseInt(dot.dataset.index));
        });
    });
}

function initNewsNavigation() {
    const prevBtn = document.getElementById('tickerPrev');
    const nextBtn = document.getElementById('tickerNext');
    
    // Éviter les listeners en double (appelé à chaque refresh)
    const newPrev = prevBtn.cloneNode(true);
    const newNext = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrev, prevBtn);
    nextBtn.parentNode.replaceChild(newNext, nextBtn);
    
    newPrev.addEventListener('click', () => {
        goToNewsSlide(newsCurrentSlide - 1);
        resetNewsAutoPlay();
    });
    
    newNext.addEventListener('click', () => {
        goToNewsSlide(newsCurrentSlide + 1);
        resetNewsAutoPlay();
    });
    
    // Swipe touch (flag pour éviter les listeners en double)
    const container = document.getElementById('newsTicker');
    if (!container._touchInitialized) {
        let touchStartX = 0;
        let touchEndX = 0;
        
        container.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        container.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    goToNewsSlide(newsCurrentSlide + 1);
                } else {
                    goToNewsSlide(newsCurrentSlide - 1);
                }
                resetNewsAutoPlay();
            }
        }, { passive: true });
        
        container._touchInitialized = true;
    }
}

function goToNewsSlide(index, smooth = true) {
    const slides = document.getElementById('newsSlides');
    const dots = document.querySelectorAll('.ticker-dot');
    
    if (!slides || !newsSlides.length) return;
    
    // Calculer le nouvel index
    let newIndex = index;
    let needsInstantJump = false;
    
    if (index < 0) {
        newIndex = newsSlides.length - 1;
        needsInstantJump = true;
    } else if (index >= newsSlides.length) {
        newIndex = 0;
        needsInstantJump = true;
    }
    
    // Si on boucle (fin → début ou début → fin), désactiver la transition
    if (needsInstantJump && smooth) {
        slides.style.transition = 'none';
        slides.style.transform = `translateX(-${newIndex * 100}%)`;
        
        // Forcer le reflow puis réactiver la transition
        slides.offsetHeight;
        setTimeout(() => {
            slides.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }, 50);
    } else {
        slides.style.transform = `translateX(-${newIndex * 100}%)`;
    }
    
    newsCurrentSlide = newIndex;
    
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === newIndex);
    });
}

function startNewsAutoPlay() {
    // S'assurer qu'il n'y a pas déjà un intervalle actif
    if (newsAutoPlayInterval) {
        clearInterval(newsAutoPlayInterval);
    }
    
    newsAutoPlayInterval = setInterval(() => {
        goToNewsSlide(newsCurrentSlide + 1);
    }, 6000); // 6 secondes entre chaque slide
}

function resetNewsAutoPlay() {
    if (newsAutoPlayInterval) {
        clearInterval(newsAutoPlayInterval);
        newsAutoPlayInterval = null;
    }
    startNewsAutoPlay();
}

function showNewsError(message) {
    const container = document.getElementById('newsTicker');
    container.innerHTML = `
        <div class="news-ticker-loading">
            <span class="material-icons">error_outline</span>
            ${message}
        </div>
    `;
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
        return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
        return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
        return `Il y a ${diffDays}j`;
    } else {
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
}

// ============================================
// CINÉMA
// ============================================
// Variable pour stocker le cinéma actif
let currentCinema = 'capitole';
let currentFilms = [];

async function initCinema() {
    await loadCinema(currentCinema);
}

async function loadCinema(cinemaKey) {
    const container = document.getElementById('cinemaContent');
    const config = CONFIG.cinema[cinemaKey];
    
    if (!config) {
        console.error('Cinéma inconnu:', cinemaKey);
        return;
    }
    
    // Clé de cache
    const cacheKey = `cinema_${cinemaKey}`;
    
    // Afficher le cache immédiatement si disponible (pas de flash)
    const cachedFilms = getCachedData(cacheKey);
    if (cachedFilms && cachedFilms.length > 0) {
        renderCinema(cachedFilms, cinemaKey);
    } else {
        // Afficher le loading seulement si pas de cache
        container.innerHTML = `
            <div class="cinema-loading">
                <span class="material-icons spinning">theaters</span>
                <span>Chargement du programme...</span>
            </div>
        `;
    }
    
    try {
        const response = await fetch(config.dataUrl + '?t=' + Date.now(), {
            cache: 'no-store'
        });
        
        if (!response.ok) throw new Error('Erreur cinéma');
        
        const data = await response.json();
        
        if (data.films && data.films.length > 0) {
            // Sauvegarder en cache
            setCachedData(cacheKey, data.films);
            
            // Mettre à jour l'affichage si différent du cache
            if (!cachedFilms || JSON.stringify(data.films) !== JSON.stringify(cachedFilms)) {
                renderCinema(data.films, cinemaKey);
            }
            console.log(`🎬 ${data.films.length} films chargés pour ${config.nom}`);
        } else {
            if (!cachedFilms) {
                showCinemaFallback(cinemaKey);
            }
        }
    } catch (error) {
        console.error(`❌ Erreur cinéma ${config.nom}:`, error);
        if (!cachedFilms) {
            showCinemaFallback(cinemaKey);
        }
    }
}

function switchCinema(cinemaKey) {
    currentCinema = cinemaKey;
    const config = CONFIG.cinema[cinemaKey];
    
    // Mettre à jour les onglets
    document.getElementById('tabCapitole').classList.toggle('active', cinemaKey === 'capitole');
    document.getElementById('tabMagic').classList.toggle('active', cinemaKey === 'magic');
    
    // Mettre à jour le lien "Voir tout"
    document.getElementById('cinemaLink').href = config.siteUrl;
    
    // Mettre à jour le sous-titre (ville + aujourd'hui)
    document.getElementById('cinemaSubtitle').innerHTML = config.ville + ' • <span class="cinema-today">Aujourd\'hui</span>';
    
    // Charger les films
    loadCinema(cinemaKey);
}

function renderCinema(films, cinemaKey = 'capitole') {
    const container = document.getElementById('cinemaContent');
    const config = CONFIG.cinema[cinemaKey];
    const visibleCount = 2; // Films visibles sans cliquer
    
    // Stocker les films pour le modal
    currentFilms = films;
    
    // Fonction helper pour générer le HTML d'un film
    function filmCardHTML(film, index) {
        return `
            <div class="cinema-film fade-in" 
                 onclick="openFilmModal(${index})"
                 style="cursor:pointer">
                <div class="cinema-film-info">
                    <div class="cinema-film-title">${film.titre}</div>
                    <div class="cinema-film-meta">
                        <span>🎭 ${film.genre || 'Film'}</span>
                    </div>
                    <div class="cinema-film-meta">
                        <span>⏱️ ${film.duree || 'N/A'}</span>
                    </div>
                    <div class="cinema-film-times">
                        ${(film.horaires || []).slice(0, 5).map(time => 
                            `<span class="cinema-time">${time}</span>`
                        ).join('')}
                    </div>
                </div>
                ${film.affiche ? `
			<div class="cinema-film-poster">
				<img src="${film.affiche}" alt="${film.titre}" loading="lazy">
				<div class="cinema-play-badge">
					<span class="material-icons">play_circle</span>
				</div>
			</div>
		` : ''}
            </div>`;
    }
    
    // Bandeau astuce (affiché une seule fois)
    const showTip = !localStorage.getItem('cinemaTipDismissed');
    
    container.innerHTML = `
        ${showTip ? `
            <div class="cinema-tip" id="cinemaTip">
                <span class="material-icons">touch_app</span>
                <span>Cliquez sur un film pour voir la bande-annonce et réserver</span>
                <button class="cinema-tip-close" onclick="dismissCinemaTip()">
                    <span class="material-icons">close</span>
                </button>
            </div>
        ` : ''}
        <div class="cinema-films">
            ${films.slice(0, visibleCount).map((film, index) => filmCardHTML(film, index)).join('')}
        </div>
        ${films.length > visibleCount ? `
            <div class="cinema-films cinema-films-extra" id="cinemaFilmsExtra">
                ${films.slice(visibleCount).map((film, index) => filmCardHTML(film, index + visibleCount)).join('')}
            </div>
            <button class="cinema-toggle-btn" id="cinemaToggleBtn" onclick="toggleCinemaFilms()">
                <span class="material-icons" id="cinemaToggleIcon">expand_more</span>
                <span id="cinemaToggleText">Voir les ${films.length - visibleCount} autres films</span>
            </button>
        ` : ''}
    `;
    
    // Restaurer l'état si déjà ouvert
    if (localStorage.getItem('cinemaExpanded') === 'true') {
        const extra = document.getElementById('cinemaFilmsExtra');
        const icon = document.getElementById('cinemaToggleIcon');
        const text = document.getElementById('cinemaToggleText');
        if (extra) {
            extra.classList.add('expanded');
            if (icon) icon.textContent = 'expand_less';
            if (text) text.textContent = 'Moins de films';
        }
    }
}

// ============================================
// MODAL CINÉMA - Détails film + Bande-annonce
// ============================================

function openFilmModal(index) {
    const film = currentFilms[index];
    if (!film) return;
    
    // Masquer le bandeau astuce au premier clic
    dismissCinemaTip();
    
    const config = CONFIG.cinema[currentCinema];
    
    // Construire l'URL YouTube pour la bande-annonce
    const youtubeSearchQuery = encodeURIComponent(film.titre + ' bande annonce officielle VF');
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${youtubeSearchQuery}`;
    
    // Créer le modal s'il n'existe pas
    let modal = document.getElementById('filmModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'filmModal';
        modal.className = 'film-modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="film-modal-backdrop" onclick="closeFilmModal()"></div>
        <div class="film-modal-content">
            <button class="film-modal-close" onclick="closeFilmModal()">
                <span class="material-icons">close</span>
            </button>
            
            <div class="film-modal-header">
                ${film.affiche ? `
                    <div class="film-modal-poster">
                        <img src="${film.affiche}" alt="${film.titre}">
                    </div>
                ` : ''}
                <div class="film-modal-info">
                    <h2 class="film-modal-title">${film.titre}</h2>
                    <div class="film-modal-details">
                        <span class="film-modal-badge">🎭 ${film.genre || 'Film'}</span>
                        ${film.duree ? `<span class="film-modal-badge">⏱️ ${film.duree}</span>` : ''}
                    </div>
                    <div class="film-modal-cinema">
                        📍 ${config.nom} - ${config.ville}
                    </div>
                </div>
            </div>
            
            <div class="film-modal-section">
                <div class="film-modal-section-title">🕐 Séances aujourd'hui</div>
                <div class="film-modal-times">
                    ${(film.horaires || []).map(time => 
                        `<span class="film-modal-time">${time}</span>`
                    ).join('')}
                </div>
            </div>
            
            <div class="film-modal-actions">
                <a href="${youtubeSearchUrl}" target="_blank" class="film-modal-btn film-modal-btn-trailer">
                    <span class="material-icons">play_circle</span>
                    Bande-annonce
                </a>
                <a href="${film.lien || config.siteUrl}" target="_blank" class="film-modal-btn film-modal-btn-site">
                    <span class="material-icons">confirmation_number</span>
                    Réserver
                </a>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeFilmModal() {
    const modal = document.getElementById('filmModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function dismissCinemaTip() {
    const tip = document.getElementById('cinemaTip');
    if (tip) {
        tip.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => tip.remove(), 300);
    }
    localStorage.setItem('cinemaTipDismissed', 'true');
}

function toggleCinemaFilms() {
    const extra = document.getElementById('cinemaFilmsExtra');
    const icon = document.getElementById('cinemaToggleIcon');
    const text = document.getElementById('cinemaToggleText');
    if (!extra) return;
    
    const isExpanded = extra.classList.contains('expanded');
    
    if (isExpanded) {
        extra.classList.remove('expanded');
        icon.textContent = 'expand_more';
        // Recalculer le texte avec le nombre de films cachés
        const count = extra.querySelectorAll('.cinema-film').length;
        text.textContent = `Voir les ${count} autres films`;
        localStorage.removeItem('cinemaExpanded');
    } else {
        extra.classList.add('expanded');
        icon.textContent = 'expand_less';
        text.textContent = 'Moins de films';
        localStorage.setItem('cinemaExpanded', 'true');
    }
}

function showCinemaFallback(cinemaKey = 'capitole') {
    const container = document.getElementById('cinemaContent');
    const config = CONFIG.cinema[cinemaKey];
    
    container.innerHTML = `
        <div style="text-align: center; padding: 1.5rem;">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🎬</div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">${config.nom}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">
                ${config.ville}
            </div>
            <a href="${config.siteUrl}" 
               target="_blank"
               style="display: inline-flex; align-items: center; gap: 0.5rem; 
                      padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                      color: white; border-radius: 50px; text-decoration: none; font-weight: 600;">
                <span class="material-icons" style="font-size: 1.25rem;">movie</span>
                Voir le programme
            </a>
        </div>
    `;
}

// ============================================
// INSTALLATION PWA
// ============================================
function initInstallPrompt() {
    const installPrompt = document.getElementById('installPrompt');
    const installBtn = document.getElementById('installBtn');
    const dismissBtn = document.getElementById('dismissBtn');
    const iosModal = document.getElementById('iosInstallModal');
    const iosCloseBtn = document.getElementById('iosCloseBtn');
    
    // Vérifier si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('📱 App déjà installée');
        return;
    }
    
    // Vérifier si déjà refusé récemment
    const dismissed = localStorage.getItem('installDismissed');
    if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const daysPassed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
        if (daysPassed < 7) {
            console.log('📱 Installation refusée il y a moins de 7 jours');
            return;
        }
    }
    
    // Détecter iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isInStandaloneMode = window.navigator.standalone === true;
    
    if (isIOS && !isInStandaloneMode) {
        // iOS - Afficher après 3 secondes
        setTimeout(() => {
            if (installPrompt) {
                installPrompt.classList.add('show');
            }
        }, 3000);
        
        if (installBtn) {
            installBtn.addEventListener('click', () => {
                installPrompt.classList.remove('show');
                if (iosModal) {
                    iosModal.classList.add('show');
                }
            });
        }
        
        if (iosCloseBtn) {
            iosCloseBtn.addEventListener('click', () => {
                iosModal.classList.remove('show');
            });
        }
        
        if (iosModal) {
            iosModal.addEventListener('click', (e) => {
                if (e.target === iosModal) {
                    iosModal.classList.remove('show');
                }
            });
        }
    } else {
        // Android / Chrome - Écouter l'événement beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            console.log('📱 Installation disponible');
            
            setTimeout(() => {
                if (installPrompt) {
                    installPrompt.classList.add('show');
                }
            }, 3000);
        });
        
        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (!deferredPrompt) return;
                
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                
                console.log(`📱 Installation: ${outcome}`);
                deferredPrompt = null;
                installPrompt.classList.remove('show');
            });
        }
    }
    
    // Bouton ignorer
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            installPrompt.classList.remove('show');
            localStorage.setItem('installDismissed', Date.now().toString());
        });
    }
    
    // Écouter l'installation réussie
    window.addEventListener('appinstalled', () => {
        console.log('✅ App installée !');
        if (installPrompt) {
            installPrompt.classList.remove('show');
        }
        deferredPrompt = null;
    });
}

// ============================================
// SERVICE WORKER
// ============================================
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('✅ Service Worker enregistré'))
            .catch(err => console.error('❌ SW Error:', err));
    }
}

// ============================================
// INFOS COMMUNAUTÉ (Supabase)
// ============================================
async function initCommunity() {
    const contentEl = document.getElementById('communityContent');
    const emptyEl = document.getElementById('communityEmpty');
    const sectionEl = document.getElementById('communitySection');
    
    // Vérifier que les éléments existent
    if (!contentEl || !emptyEl) {
        console.log('⚠️ Section communauté non trouvée');
        return;
    }
    
    try {
        // Vérifier que Supabase est chargé
        if (typeof window.supabase === 'undefined') {
            console.log('⚠️ Supabase non chargé, section communauté masquée');
            if (sectionEl) sectionEl.style.display = 'none';
            return;
        }
        
        // Utiliser l'instance unique Supabase
        const supabaseClient = getSupabaseClient();
        if (!supabaseClient) {
            console.log('⚠️ Supabase non disponible');
            return;
        }
        
        // Charger les propositions approuvées
        const { data, error } = await supabaseClient
            .from('news_submissions')
            .select('*')
            .eq('status', 'approved')
            .order('pinned', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (error) throw error;
        
        // Si aucune donnée
        if (!data || data.length === 0) {
            contentEl.style.display = 'none';
            emptyEl.style.display = 'block';
            console.log('📭 Aucune info communauté');
            return;
        }
        
        // *** COMPTEUR DE VUES AU CHARGEMENT (vérification serveur) ***
        const today = new Date().toISOString().split('T')[0];
        const fingerprint = getUserFingerprint();
        
        for (const item of data) {
            try {
                // Vérifier CÔTÉ SERVEUR si ce fingerprint a déjà vu cet article aujourd'hui
                const { data: existingView } = await supabaseClient
                    .from('submission_view_logs')
                    .select('id')
                    .eq('submission_id', item.id)
                    .eq('fingerprint', fingerprint)
                    .eq('view_date', today)
                    .maybeSingle();
                
                if (!existingView) {
                    // Pas encore vu → incrémenter
                    const { error: viewError } = await supabaseClient.rpc('increment_submission_views', { submission_id: item.id });
                    if (!viewError) {
                        // Enregistrer la vue côté serveur
                        await supabaseClient
                            .from('submission_view_logs')
                            .insert({ submission_id: item.id, fingerprint: fingerprint, view_date: today });
                        item.views = (item.views || 0) + 1;
                        console.log(`👁️ Vue comptée pour info #${item.id} (vérifié serveur)`);
                    }
                }
            } catch (e) {
                console.log('⚠️ Erreur compteur vue:', e);
            }
        }
        
        // Charger le nombre de commentaires pour chaque actualité
        const newsIds = data.map(item => item.id);
        let commentCounts = {};
        let likeCounts = {};
        let userLikes = [];
        const userFingerprint = getUserFingerprint();
        
        try {
            const { data: comments } = await supabaseClient
                .from('news_comments')
                .select('news_id')
                .eq('status', 'approved')
                .in('news_id', newsIds);
            
            if (comments) {
                comments.forEach(c => {
                    commentCounts[c.news_id] = (commentCounts[c.news_id] || 0) + 1;
                });
            }
        } catch (e) {
            console.log('⚠️ Erreur chargement compteurs commentaires:', e);
        }
        
        // Charger les likes
        try {
            const { data: likes } = await supabaseClient
                .from('news_likes')
                .select('news_id, user_fingerprint')
                .in('news_id', newsIds);
            
            if (likes) {
                likes.forEach(l => {
                    likeCounts[l.news_id] = (likeCounts[l.news_id] || 0) + 1;
                    if (l.user_fingerprint === userFingerprint) {
                        userLikes.push(l.news_id);
                    }
                });
            }
        } catch (e) {
            console.log('⚠️ Erreur chargement likes:', e);
        }
        
        // Stocker les likes de l'utilisateur pour référence
        window.userLikes = userLikes;
        window.likeCounts = likeCounts;
        
        // Masquer les articles épinglés pour les visiteurs qui les ont déjà vus
        const filteredData = data.filter(item => {
            if (item.pinned) {
                const seenKey = `pinned_seen_${item.id}`;
                if (localStorage.getItem(seenKey)) {
                    return false; // Déjà vu, on ne l'affiche pas
                }
                localStorage.setItem(seenKey, 'true'); // Marquer comme vu
            }
            return true;
        });

        // Afficher les infos
        contentEl.innerHTML = filteredData.map(item => {
            const commentCount = commentCounts[item.id] || 0;
            return `
            <div class="community-item ${item.pinned ? 'pinned' : ''}" data-id="${item.id}">
                ${item.pinned ? '<div class="community-pinned-badge"><span class="material-icons">push_pin</span> Épinglé</div>' : ''}
                <!-- HEADER : Emoji + Auteur + Date -->
                <div class="community-item-header">
                    <span class="community-item-icon">${getCommunityIcon(item.type)}</span>
                    <span class="community-item-author">${escapeHtml(item.author || 'Actu & Média')}</span>
                    <span class="community-item-separator">·</span>
                    <span class="community-item-date">${formatCommunityDate(item.created_at)}</span>
                </div>
                
                <div class="community-item-content">
                    <div class="community-item-title">${escapeHtml(item.title)}</div>
                    ${item.image_url ? `<div class="community-image-wrapper"><div class="community-image-inner" onclick="event.stopPropagation(); openImageModal('${item.image_url.replace(/'/g, "\\'")}', '${(item.source_name || '').replace(/'/g, "\\'")}')"><img src="${item.image_url}" alt="${escapeHtml(item.title)}" class="community-item-image" onerror="this.parentElement.parentElement.style.display='none'"><div class="community-image-zoom"><span class="material-icons">zoom_in</span><span>Agrandir</span></div>${item.source_name ? `<div class="community-image-credit">📷 ${escapeHtml(item.source_name)}</div>` : ''}</div></div>` : ''}
                    <div class="community-item-desc" id="desc-${item.id}">${linkifyContent(item.content)}</div>
                    <button class="see-more-btn" id="see-more-${item.id}" onclick="event.stopPropagation(); toggleSeeMore(${item.id})">
                        <span>Voir plus</span>
                        <span class="material-icons">expand_more</span>
                    </button>
                    ${item.link ? `<a href="${item.link}" target="_blank" class="community-item-link" onclick="event.stopPropagation()"><span class="material-icons">link</span>Voir le lien</a>` : ''}
                    
                    <!-- FOOTER : Lieu + Vues -->
                    <div class="community-item-footer">
                        <div class="community-item-location">
                            <span class="material-icons">place</span>
                            <span>${escapeHtml(item.location || 'Montceau-les-Mines')}</span>
                        </div>
                        <div class="community-item-views">
                            <span class="material-icons">visibility</span>
                            <span>${item.views || 0}</span>
                        </div>
                    </div>
                    
                    <!-- Actions (Like + Commenter sur même ligne) -->
                    <div class="community-item-actions" onclick="event.stopPropagation()">
                        <button class="like-btn ${userLikes.includes(item.id) ? 'liked' : ''}" id="like-btn-${item.id}" onclick="toggleLike(${item.id}, this)">
                            <span class="material-icons">${userLikes.includes(item.id) ? 'favorite' : 'favorite_border'}</span>
                            <span class="like-count" id="like-count-${item.id}">${likeCounts[item.id] || 0}</span>
                        </button>
                        <button class="comments-toggle-btn" onclick="toggleComments(${item.id}, this)">
                            <span class="material-icons">chat_bubble_outline</span>
                            <span>${commentCount > 0 ? commentCount + ' commentaire' + (commentCount > 1 ? 's' : '') : 'Commenter'}</span>
                        </button>
                    </div>
                    
                    <!-- Section Commentaires déroulante -->
                    <div class="community-comments-section" onclick="event.stopPropagation()">
                        <div class="comments-container" id="comments-${item.id}">
                            <div class="comments-list" id="comments-list-${item.id}">
                                <div class="comments-empty">
                                    <div class="comments-empty-icon">💬</div>
                                    Chargement...
                                </div>
                            </div>
                            <form class="comment-form" onsubmit="submitComment(event, ${item.id})">
                                <div class="comment-form-row">
                                    <input type="text" class="comment-input" id="comment-author-${item.id}" placeholder="Votre pseudo" maxlength="50" required>
                                </div>
                                <textarea class="comment-input comment-textarea" id="comment-content-${item.id}" placeholder="Votre commentaire..." maxlength="500" required></textarea>
                                <button type="submit" class="comment-submit-btn">
                                    <span class="material-icons">send</span>
                                    Envoyer
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `}).join('');
        
        // Ajouter le bouton "Voir toutes les infos"
        contentEl.innerHTML += `
            <a href="infos.html" class="community-voir-tout">
                <span class="material-icons">article</span>
                <span>Voir toutes les infos</span>
            </a>
        `;
        
        emptyEl.style.display = 'none';
        console.log(`📢 ${data.length} infos communauté chargées (accueil)`);
        
        // Détecter les textes tronqués et afficher le bouton "Voir plus"
        setTimeout(() => {
            data.forEach(item => {
                const descEl = document.getElementById(`desc-${item.id}`);
                const btnEl = document.getElementById(`see-more-${item.id}`);
                if (descEl && btnEl) {
                    if (descEl.scrollHeight > descEl.clientHeight + 10) {
                        descEl.classList.add('truncated');
                        btnEl.classList.add('visible');
                    }
                }
            });
        }, 100);
        
    } catch (error) {
        console.error('❌ Erreur communauté:', error);
        contentEl.innerHTML = '';
        emptyEl.style.display = 'block';
    }
}

function getCommunityIcon(type) {
    const icons = {
        'actualite': '📰',
        'evenement': '🎪',
        'sport': '⚽',
        'culture': '🎭',
        'economie': '💼',
        'pratique': '💡',
        'insolite': '🤔',
        'photo': '📸',
        'autre': '📋'
    };
    return icons[type] || '📰';
}

function formatCommunityDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    // Moins d'une heure
    if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return `Il y a ${mins} min`;
    }
    
    // Moins d'un jour
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `Il y a ${hours}h`;
    }
    
    // Moins d'une semaine
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
    
    // Plus d'une semaine
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Convertir les URLs en liens cliquables (après escapeHtml)
function linkifyContent(text) {
    if (!text) return '';
    // D'abord échapper le HTML
    let safe = escapeHtml(text);
    // Puis convertir les URLs en liens cliquables
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    return safe.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="community-link">$1</a>');
}

// ============================================
// GESTION DES COMMENTAIRES
// ============================================
async function toggleComments(newsId, btn) {
    const container = document.getElementById(`comments-${newsId}`);
    const isOpen = container.classList.contains('open');
    
    if (isOpen) {
        container.classList.remove('open');
        btn.classList.remove('open');
    } else {
        container.classList.add('open');
        btn.classList.add('open');
        loadComments(newsId);
    }
}

async function loadComments(newsId) {
    const listEl = document.getElementById(`comments-list-${newsId}`);
    
    try {
        const supabaseClient = getSupabaseClient();
        if (!supabaseClient) return;
        
        const { data, error } = await supabaseClient
            .from('news_comments')
            .select('*')
            .eq('news_id', newsId)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            listEl.innerHTML = `
                <div class="comments-empty">
                    <div class="comments-empty-icon">💬</div>
                    Aucun commentaire pour le moment.<br>Soyez le premier !
                </div>
            `;
            return;
        }
        
        listEl.innerHTML = data.map(comment => `
            <div class="comment-item">
                <div class="comment-item-header">
                    <span class="comment-item-author">👤 ${escapeHtml(comment.author)}</span>
                    <span class="comment-item-date">${formatCommunityDate(comment.created_at)}</span>
                </div>
                <div class="comment-item-content">${escapeHtml(comment.content)}</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erreur chargement commentaires:', error);
        listEl.innerHTML = `
            <div class="comments-empty">
                <div class="comments-empty-icon">❌</div>
                Erreur de chargement
            </div>
        `;
    }
}

async function submitComment(event, newsId) {
    event.preventDefault();
    
    const authorInput = document.getElementById(`comment-author-${newsId}`);
    const contentInput = document.getElementById(`comment-content-${newsId}`);
    const form = event.target;
    const submitBtn = form.querySelector('.comment-submit-btn');
    
    const author = authorInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!author || !content) return;
    
    // Désactiver le bouton
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Envoi...';
    
    try {
        const supabaseClient = getSupabaseClient();
        if (!supabaseClient) throw new Error('Supabase non disponible');
        
        const { error } = await supabaseClient
            .from('news_comments')
            .insert([{
                news_id: newsId,
                author: author,
                content: content,
                status: 'pending'
            }]);
        
        if (error) throw error;
        
        // Envoyer notification email
        try {
            await fetch('/api/sendEmail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'commentaire',
                    author: author,
                    content: content,
                    newsTitle: document.querySelector(`#comments-${newsId}`)?.closest('.community-item')?.querySelector('.community-item-title')?.textContent || 'Actualité'
                })
            });
        } catch (e) {
            console.log('Email notification non envoyée:', e);
        }
        
        // Afficher message de succès
        form.innerHTML = `
            <div class="comment-success">
                ✅ Merci ! Votre commentaire sera visible après validation.
            </div>
        `;
        
        // Restaurer le formulaire après 5 secondes
        setTimeout(() => {
            form.innerHTML = `
                <div class="comment-form-row">
                    <input type="text" class="comment-input" id="comment-author-${newsId}" placeholder="Votre pseudo" maxlength="50" required>
                </div>
                <textarea class="comment-input comment-textarea" id="comment-content-${newsId}" placeholder="Votre commentaire..." maxlength="500" required></textarea>
                <button type="submit" class="comment-submit-btn">
                    <span class="material-icons">send</span>
                    Envoyer
                </button>
            `;
        }, 5000);
        
    } catch (error) {
        console.error('Erreur envoi commentaire:', error);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-icons">send</span> Envoyer';
        alert('Erreur lors de l\'envoi. Réessayez.');
    }
}

// ============================================
// GESTION DES LIKES
// ============================================

// Fingerprint navigateur déterministe (survit au nettoyage localStorage)
function generateBrowserFingerprint() {
    try {
        const components = [];
        
        // 1. Canvas fingerprint (unique par GPU/navigateur)
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(100, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('ActuMedia.fp', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('ActuMedia.fp', 4, 17);
        components.push(canvas.toDataURL());
        
        // 2. Infos écran
        components.push(screen.width + 'x' + screen.height);
        components.push(screen.colorDepth);
        components.push(window.devicePixelRatio || 1);
        
        // 3. Timezone
        components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
        components.push(new Date().getTimezoneOffset());
        
        // 4. Langue et plateforme
        components.push(navigator.language);
        components.push(navigator.platform);
        components.push(navigator.hardwareConcurrency || 'unknown');
        
        // 5. Touch
        components.push(navigator.maxTouchPoints || 0);
        
        // Générer un hash déterministe
        const raw = components.join('|||');
        let hash = 0;
        for (let i = 0; i < raw.length; i++) {
            const char = raw.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return 'bfp_' + Math.abs(hash).toString(36);
    } catch (e) {
        console.log('⚠️ Fingerprint canvas impossible, fallback');
        return null;
    }
}

function getUserFingerprint() {
    // 1. Essayer le cookie (survit au nettoyage localStorage)
    const cookieFp = getCookie('user_fp');
    if (cookieFp) {
        localStorage.setItem('user_fingerprint', cookieFp);
        return cookieFp;
    }
    
    // 2. Essayer localStorage
    let fp = localStorage.getItem('user_fingerprint');
    
    // 3. Si pas de fingerprint ou ancien format → en générer un nouveau
    if (!fp || fp.startsWith('fp_')) {
        const browserFp = generateBrowserFingerprint();
        fp = browserFp || ('fp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
    }
    
    // Sauvegarder partout
    localStorage.setItem('user_fingerprint', fp);
    setCookie('user_fp', fp, 365);
    
    return fp;
}

// Utilitaires cookies
function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + expires + ';path=/;SameSite=Lax';
}

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

async function toggleLike(newsId, btn) {
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) return;
    
    const userFingerprint = getUserFingerprint();
    const countEl = document.getElementById(`like-count-${newsId}`);
    const icon = btn.querySelector('.material-icons');
    let currentCount = parseInt(countEl.textContent) || 0;
    
    try {
        // Vérifier côté SERVEUR si ce fingerprint a déjà liké
        const { data: existingLike } = await supabaseClient
            .from('news_likes')
            .select('id')
            .eq('news_id', newsId)
            .eq('user_fingerprint', userFingerprint)
            .maybeSingle();
        
        if (existingLike) {
            // Le like existe → le retirer
            const { error } = await supabaseClient
                .from('news_likes')
                .delete()
                .eq('news_id', newsId)
                .eq('user_fingerprint', userFingerprint);
            
            if (error) throw error;
            
            btn.classList.remove('liked');
            icon.textContent = 'favorite_border';
            countEl.textContent = Math.max(0, currentCount - 1);
            window.userLikes = (window.userLikes || []).filter(id => id !== newsId);
            
        } else {
            // Pas de like → en ajouter un
            const { error } = await supabaseClient
                .from('news_likes')
                .insert([{
                    news_id: newsId,
                    user_fingerprint: userFingerprint
                }]);
            
            if (error) throw error;
            
            btn.classList.add('liked');
            icon.textContent = 'favorite';
            countEl.textContent = currentCount + 1;
            (window.userLikes || []).push(newsId);
        }
    } catch (error) {
        console.error('Erreur like:', error);
    }
}

function toggleSeeMore(newsId) {
    const descEl = document.getElementById(`desc-${newsId}`);
    const btnEl = document.getElementById(`see-more-${newsId}`);
    
    if (!descEl || !btnEl) return;
    
    const isExpanded = descEl.classList.contains('expanded');
    
    if (isExpanded) {
        // Réduire
        descEl.classList.remove('expanded');
        btnEl.classList.remove('expanded');
        btnEl.querySelector('span:first-child').textContent = 'Voir plus';
    } else {
        // Déplier
        descEl.classList.add('expanded');
        btnEl.classList.add('expanded');
        btnEl.querySelector('span:first-child').textContent = 'Voir moins';
    }
}

// Fonction pour ouvrir une image en grand
function openImageModal(imageUrl, sourceName = '') {
    // Créer le modal s'il n'existe pas
    let modal = document.getElementById('imageModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="image-modal-backdrop" onclick="closeImageModal()"></div>
            <div class="image-modal-content">
                <button class="image-modal-close" onclick="closeImageModal()">
                    <span class="material-icons">close</span>
                </button>
                <img id="modalImage" src="" alt="Image">
                <div id="modalImageCredit" class="image-modal-credit"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    document.getElementById('modalImage').src = imageUrl;
    
    // Afficher le crédit si disponible
    const creditEl = document.getElementById('modalImageCredit');
    if (sourceName && sourceName.trim() !== '') {
        creditEl.textContent = '📷 ' + sourceName;
        creditEl.style.display = 'block';
    } else {
        creditEl.style.display = 'none';
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// ============================================
// RAFRAÎCHISSEMENT PÉRIODIQUE
// ============================================
setInterval(() => {
    console.log('🔄 Rafraîchissement des actualités...');
    initNews();
}, CONFIG.news.refreshInterval);

// ============================================
// TOGGLE VILLES SUPPLÉMENTAIRES
// ============================================
function toggleExtraTiles() {
    const tilesExtra = document.getElementById('tilesExtra');
    const toggleBtn = document.getElementById('tilesToggle');
    const toggleIcon = document.getElementById('tilesToggleIcon');
    const toggleText = document.getElementById('tilesToggleText');
    
    if (!tilesExtra || !toggleBtn) return;
    
    const isExpanded = tilesExtra.classList.contains('show');
    
    if (isExpanded) {
        // Fermer
        tilesExtra.classList.remove('show');
        toggleBtn.classList.remove('expanded');
        toggleIcon.textContent = 'expand_more';
        toggleText.textContent = 'Plus de villes';
        localStorage.setItem('tilesExpanded', 'false');
    } else {
        // Ouvrir
        tilesExtra.classList.add('show');
        toggleBtn.classList.add('expanded');
        toggleIcon.textContent = 'expand_less';
        toggleText.textContent = 'Moins de villes';
        localStorage.setItem('tilesExpanded', 'true');
    }
}

// Restaurer l'état au chargement
function initExtraTiles() {
    const saved = localStorage.getItem('tilesExpanded');
    if (saved === 'true') {
        const tilesExtra = document.getElementById('tilesExtra');
        const toggleBtn = document.getElementById('tilesToggle');
        const toggleIcon = document.getElementById('tilesToggleIcon');
        const toggleText = document.getElementById('tilesToggleText');
        
        if (tilesExtra && toggleBtn) {
            tilesExtra.classList.add('show');
            toggleBtn.classList.add('expanded');
            toggleIcon.textContent = 'expand_less';
            toggleText.textContent = 'Moins de villes';
        }
    }
}

// Exposer la fonction globalement
window.toggleExtraTiles = toggleExtraTiles;

// === TOGGLE GÉNÉRIQUE POUR TOUTES LES SECTIONS ===
function toggleSection(extraId, btnId, iconId, textId, openLabel, closeLabel, storageKey) {
    const extra = document.getElementById(extraId);
    const btn = document.getElementById(btnId);
    const icon = document.getElementById(iconId);
    const text = document.getElementById(textId);
    
    if (!extra || !btn) return;
    
    const isExpanded = extra.classList.contains('show');
    
    if (isExpanded) {
        extra.classList.remove('show');
        btn.classList.remove('expanded');
        icon.textContent = 'expand_more';
        text.textContent = openLabel;
        localStorage.setItem(storageKey, 'false');
    } else {
        extra.classList.add('show');
        btn.classList.add('expanded');
        icon.textContent = 'expand_less';
        text.textContent = closeLabel;
        localStorage.setItem(storageKey, 'true');
    }
}

// Restaurer l'état des sections au chargement
function initToggleSections() {
    const sections = [
        { storageKey: 'mediaRegionalExpanded', extraId: 'mediaRegionalExtra', btnId: 'mediaRegionalBtn', iconId: 'mediaRegionalIcon', textId: 'mediaRegionalText', closeLabel: 'Moins de médias' },
        { storageKey: 'mediaNationalExpanded', extraId: 'mediaNationalExtra', btnId: 'mediaNationalBtn', iconId: 'mediaNationalIcon', textId: 'mediaNationalText', closeLabel: 'Moins de médias' }
    ];
    
    sections.forEach(function(s) {
        if (localStorage.getItem(s.storageKey) === 'true') {
            const extra = document.getElementById(s.extraId);
            const btn = document.getElementById(s.btnId);
            const icon = document.getElementById(s.iconId);
            const text = document.getElementById(s.textId);
            if (extra && btn) {
                extra.classList.add('show');
                btn.classList.add('expanded');
                icon.textContent = 'expand_less';
                text.textContent = s.closeLabel;
            }
        }
    });
}

window.toggleSection = toggleSection;

// ============================================
// NOTIFICATIONS PUSH
// ============================================

let pushSubscription = null;

// Initialiser les notifications au chargement
async function initPushNotifications() {
    // Vérifier si les notifications sont supportées
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('❌ Push non supporté');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            // Déjà abonné - stocker l'abonnement
            pushSubscription = subscription;
            console.log('✅ Déjà abonné aux notifications');
            updateNotifButton(true);
        } else {
            // Pas encore abonné
            pushSubscription = null;
            updateNotifButton(false);
            
            // Si permission déjà accordée mais pas d'abonnement → créer l'abonnement
            if (Notification.permission === 'granted') {
                console.log('🔄 Permission accordée, création de l\'abonnement...');
                setTimeout(() => {
                    subscribeToPush();
                }, 2000);
            } 
            // Si permission pas encore demandée → afficher le popup
            else if (Notification.permission === 'default') {
                const notifDismissed = localStorage.getItem('notifPromptDismissed');
                const lastDismiss = notifDismissed ? parseInt(notifDismissed) : 0;
                const daysSinceDismiss = (Date.now() - lastDismiss) / (1000 * 60 * 60 * 24);
                
                if (!notifDismissed || daysSinceDismiss > 7) {
                    setTimeout(() => {
                        showNotifPrompt();
                    }, 5000);
                }
            }
            // Si permission refusée → ne rien faire
            else {
                console.log('❌ Notifications refusées par l\'utilisateur');
            }
        }
    } catch (error) {
        console.error('❌ Erreur init push:', error);
    }
}

// Afficher le popup de notification
function showNotifPrompt() {
    const prompt = document.getElementById('notifPrompt');
    if (prompt && Notification.permission === 'default') {
        prompt.classList.add('show');
    }
}

// Fermer le popup
function closeNotifPrompt(saveDismiss = false) {
    const prompt = document.getElementById('notifPrompt');
    if (prompt) {
        prompt.classList.remove('show');
        if (saveDismiss) {
            localStorage.setItem('notifPromptDismissed', Date.now().toString());
        }
    }
}

// Accepter les notifications depuis le popup
async function acceptNotifPrompt() {
    closeNotifPrompt(false);
    await subscribeToPush();
}

// Mettre à jour l'apparence du bouton
function updateNotifButton(isSubscribed) {
    const btn = document.getElementById('notifSubscribeBtn');
    const icon = document.getElementById('notifIcon');
    const title = document.getElementById('notifTitle');
    const desc = document.getElementById('notifDesc');
    const arrow = document.getElementById('notifArrow');

    if (!btn) return;

    if (isSubscribed) {
        btn.classList.add('subscribed');
        icon.textContent = '🔔';
        icon.classList.add('subscribed');
        title.textContent = 'Notifications activées';
        desc.textContent = 'Cliquez pour désactiver';
        arrow.textContent = 'notifications_active';
    } else {
        btn.classList.remove('subscribed');
        icon.textContent = '🔕';
        icon.classList.remove('subscribed');
        title.textContent = 'Activer les notifications';
        desc.textContent = 'Recevoir les alertes infos';
        arrow.textContent = 'notifications_none';
    }
}

// Toggle abonnement
async function togglePushSubscription() {
    const btn = document.getElementById('notifSubscribeBtn');
    if (!btn) return;

    btn.classList.add('loading');

    try {
        if (pushSubscription) {
            // Se désabonner
            await unsubscribeFromPush();
        } else {
            // S'abonner
            await subscribeToPush();
        }
    } catch (error) {
        console.error('❌ Erreur toggle push:', error);
        alert('Erreur : ' + error.message);
    } finally {
        btn.classList.remove('loading');
    }
}

// S'abonner aux notifications
async function subscribeToPush() {
    // Demander la permission
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
        alert('Vous devez autoriser les notifications pour recevoir les alertes.');
        return;
    }

    // Récupérer la clé publique VAPID
    const response = await fetch('/api/subscribe');
    const { publicKey } = await response.json();

    if (!publicKey) {
        throw new Error('Clé VAPID non disponible');
    }

    // Convertir la clé
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // S'abonner
    const registration = await navigator.serviceWorker.ready;
    pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
    });

    // Envoyer l'abonnement au serveur
    const subscribeResponse = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pushSubscription.toJSON())
    });

    if (!subscribeResponse.ok) {
        throw new Error('Erreur lors de l\'enregistrement');
    }

    updateNotifButton(true);
    console.log('✅ Abonné aux notifications');

    // Notification de confirmation
    showToast('🔔 Notifications activées !', 'Vous recevrez les alertes infos.');
}

// Se désabonner
async function unsubscribeFromPush() {
    if (!pushSubscription) return;

    // Supprimer côté serveur
    await fetch('/api/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: pushSubscription.endpoint })
    });

    // Supprimer côté client
    await pushSubscription.unsubscribe();
    pushSubscription = null;

    updateNotifButton(false);
    console.log('✅ Désabonné des notifications');

    showToast('🔕 Notifications désactivées', 'Vous ne recevrez plus les alertes.');
}

// Convertir clé VAPID base64 en Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Toast de confirmation
function showToast(title, message) {
    // Utiliser le toast existant ou en créer un simple
    const existingToast = document.querySelector('.notification-toast');
    if (existingToast) {
        existingToast.querySelector('.notification-toast-title').textContent = title;
        existingToast.querySelector('.notification-toast-text').textContent = message;
        existingToast.classList.add('show');
        setTimeout(() => existingToast.classList.remove('show'), 3000);
    } else {
        alert(title + '\n' + message);
    }
}

// ============================================
// SÉLECTEUR TAILLE DE TEXTE
// ============================================
function initFontSizeSelector() {
    const buttons = document.querySelectorAll('.font-size-btn');
    
    if (buttons.length === 0) return;
    
    // Charger la préférence sauvegardée
    const savedSize = localStorage.getItem('fontSize') || 'normal';
    document.documentElement.setAttribute('data-font-size', savedSize);
    
    // Mettre à jour le bouton actif
    buttons.forEach(btn => {
        if (btn.dataset.size === savedSize) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Ajouter les événements de clic
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const size = btn.dataset.size;
            
            // Appliquer la taille
            document.documentElement.setAttribute('data-font-size', size);
            
            // Sauvegarder la préférence
            localStorage.setItem('fontSize', size);
            
            // Mettre à jour les boutons actifs
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            console.log('📏 Taille de texte:', size);
        });
    });
    
    console.log('✅ Sélecteur taille de texte initialisé');
}

// ============================================
// AGENDA HOMEPAGE
// ============================================
async function initAgenda() {
    const contentEl = document.getElementById('agendaContent');
    const emptyEl = document.getElementById('agendaEmpty');
    
    if (!contentEl) return;
    
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        
        const today = new Date();
		const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        
        // 1. Charger les événements NON récurrents à venir
        const { data: regularEvents, error: err1 } = await supabase
            .from('events')
            .select('*')
            .eq('status', 'approved')
            .eq('is_recurring', false)
            .gte('event_date', todayStr)
            .order('event_date', { ascending: true })
            .limit(5);
        
        // 2. Charger les événements RÉCURRENTS (UNE SEULE FOIS chacun)
        const { data: recurringEvents, error: err2 } = await supabase
            .from('events')
            .select('*')
            .eq('status', 'approved')
            .eq('is_recurring', true);
        
        if (err1) console.error('Erreur events réguliers:', err1);
        if (err2) console.error('Erreur events récurrents:', err2);
        
        // 3. Préparer les événements récurrents avec leur label
        const processedRecurring = (recurringEvents || []).map(event => {
            const days = event.recurrence_days ? event.recurrence_days.split(',').map(d => dayNames[parseInt(d)]) : [];
            return {
                ...event,
                _recurrenceLabel: `Tous les ${days.join(', ')}`,
                _sortOrder: 0 // Les récurrents en premier
            };
        });
        
        // 4. Préparer les événements réguliers
        const processedRegular = (regularEvents || []).map(event => ({
            ...event,
            _sortOrder: 1
        }));
        
        // 5. Combiner : récurrents d'abord, puis par date (limité à 3 pour l'accueil)
        const allEvents = [...processedRecurring, ...processedRegular].slice(0, 3);
        
        if (!allEvents || allEvents.length === 0) {
            contentEl.innerHTML = '';
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }
        
        if (emptyEl) emptyEl.style.display = 'none';
        
        contentEl.innerHTML = allEvents.map(event => {
            // Pour les récurrents : afficher le label au lieu de la date
            if (event.is_recurring) {
                return `
                    <a href="agenda.html?event=${event.id}" class="agenda-item" data-event-id="${event.id}">
                        <div class="agenda-item-date recurring">
                            <span class="material-icons agenda-item-day">sync</span>
                            <span class="agenda-item-month">HEBDO</span>
                        </div>
                        <div class="agenda-item-content">
                            <div class="agenda-item-title">${escapeHtml(event.title)}</div>
                            <div class="agenda-item-info">
                                <span class="agenda-info-highlight"><span class="material-icons">event_repeat</span>${event._recurrenceLabel}</span>
                                ${event.event_time ? `<span><span class="material-icons">schedule</span>${formatAgendaTime(event.event_time)}</span>` : ''}
                            </div>
                            <div class="agenda-item-info">
                                ${event.location ? `<span><span class="material-icons">place</span>${escapeHtml(event.location)}</span>` : ''}
                                <span class="agenda-views"><span class="material-icons">visibility</span>${event.views || 0}</span>
                            </div>
                            <span class="agenda-item-category ${event.category}">${getAgendaCategoryIcon(event.category)} ${getAgendaCategoryLabel(event.category)}</span>
                        </div>
                    </a>
                `;
            }
            
            // Pour les événements uniques : afficher la date
            const date = new Date(event.event_date + 'T12:00:00');
			const day = date.getDate();
			const month = date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '').toUpperCase();
            
            return `
                <a href="agenda.html?event=${event.id}" class="agenda-item" data-event-id="${event.id}">
                    <div class="agenda-item-date">
                        <span class="agenda-item-day">${day}</span>
                        <span class="agenda-item-month">${month}</span>
                    </div>
                    <div class="agenda-item-content">
                        <div class="agenda-item-title">${escapeHtml(event.title)}</div>
                        <div class="agenda-item-info">
                            ${event.event_time ? `<span><span class="material-icons">schedule</span>${formatAgendaTime(event.event_time)}</span>` : ''}
                            ${event.location ? `<span><span class="material-icons">place</span>${escapeHtml(event.location)}</span>` : ''}
                            <span class="agenda-views"><span class="material-icons">visibility</span>${event.views || 0}</span>
                        </div>
                        <span class="agenda-item-category ${event.category}">${getAgendaCategoryIcon(event.category)} ${getAgendaCategoryLabel(event.category)}</span>
                    </div>
                </a>
            `;
        }).join('');
        
        // Ajouter le bouton "Voir tout l'agenda" en bas
        contentEl.innerHTML += `
            <a href="agenda.html" class="agenda-voir-tout">
                <span>Voir tout l'agenda</span>
                <span class="material-icons">calendar_month</span>
            </a>
        `;
        
        console.log(`📅 ${allEvents.length} événements agenda chargés`);
        
    } catch (error) {
        console.error('❌ Erreur initAgenda:', error);
    }
}

function formatAgendaTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    return `${h}h${m !== '00' ? m : ''}`;
}

function getAgendaCategoryIcon(category) {
    const icons = { 'sport': '⚽', 'culture': '🎭', 'marche': '🛒', 'brocante': '🏷️', 'concert': '🎵', 'fete': '🎉' };
    return icons[category] || '📅';
}

function getAgendaCategoryLabel(category) {
    const labels = { 'sport': 'Sport', 'culture': 'Culture', 'marche': 'Marché', 'brocante': 'Brocante', 'concert': 'Concert', 'fete': 'Fête' };
    return labels[category] || 'Événement';
}

window.togglePushSubscription = togglePushSubscription;
window.showNotifPrompt = showNotifPrompt;
window.closeNotifPrompt = closeNotifPrompt;
window.acceptNotifPrompt = acceptNotifPrompt;
window.toggleSeeMore = toggleSeeMore;
window.toggleComments = toggleComments;
window.submitComment = submitComment;
window.toggleLike = toggleLike;
window.toggleCinemaFilms = toggleCinemaFilms;
window.openFilmModal = openFilmModal;
window.closeFilmModal = closeFilmModal;
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;

// ============================================
// COMPTEUR DE VISITES (vérification serveur)
// ============================================
async function recordVisit() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        
        const fingerprint = getUserFingerprint();
        const today = new Date().toISOString().split('T')[0];
        
        // Vérifier CÔTÉ SERVEUR si ce fingerprint a déjà visité aujourd'hui
        const { data: existing } = await supabase
            .from('visitor_logs')
            .select('id')
            .eq('fingerprint', fingerprint)
            .eq('visit_date', today)
            .maybeSingle();
        
        const isNewVisitor = !existing;
        
        const { error } = await supabase.rpc('record_visit', { is_new_visitor: isNewVisitor });
        
        if (!error) {
            if (isNewVisitor) {
                await supabase
                    .from('visitor_logs')
                    .insert({ fingerprint: fingerprint, visit_date: today });
                console.log('👤 Nouveau visiteur enregistré (vérifié serveur)');
            } else {
                console.log('📄 Page vue enregistrée (visiteur déjà connu)');
            }
        }
    } catch (err) {
        console.error('Erreur compteur visites:', err);
    }
}

// ============================================
// BARRE DATE & SAINT DU JOUR
// ============================================
function initDateBar() {
    const dayEl = document.getElementById('dateBarDay');
    const saintEl = document.getElementById('dateBarSaint');
    if (!dayEl || !saintEl) return;

    // Saints du jour (index 0 = 1er janvier)
    const saints = [
        // Janvier
        "Marie","Basile","Geneviève","Odilon","Édouard","Melchior","Raymond","Lucien","Alix","Guillaume",
        "Paulin","Tatiana","Yvette","Nina","Rémi","Marcel","Roseline","Prisca","Marius","Sébastien",
        "Agnès","Vincent","Barnard","François de Sales","Conv. de Paul","Paule","Angèle","Thomas d'Aquin","Gildas","Martine","Marcelle",
        // Février
        "Ella","Présentation","Blaise","Véronique","Agathe","Gaston","Eugénie","Jacqueline","Apolline","Arnaud",
        "N-D de Lourdes","Félix","Béatrice","Valentin","Claude","Julienne","Alexis","Bernadette","Gabin","Aimée",
        "Damien","Isabelle","Lazare","Modeste","Roméo","Nestor","Honorine","Romain",
        // Mars
        "Aubin","Charles le Bon","Guénolé","Casimir","Olive","Colette","Félicité","Jean de Dieu","Françoise","Vivien",
        "Rosine","Justine","Rodrigue","Mathilde","Louise","Bénédicte","Patrick","Cyrille","Joseph","Herbert",
        "Clémence","Léa","Victorien","Cath. de Suède","Humbert","Larissa","Habib","Gontran","Gwladys","Amédée","Benjamin",
        // Avril
        "Hugues","Sandrine","Richard","Isidore","Irène","Marcellin","J-B de la Salle","Julie","Gautier","Fulbert",
        "Stanislas","Jules","Ida","Maxime","Paterne","Benoît-Joseph","Anicet","Parfait","Emma","Odette",
        "Anselme","Alexandre","Georges","Fidèle","Marc","Alida","Zita","Valérie","Cath. de Sienne","Robert",
        // Mai
        "Jérémie","Boris","Philippe","Sylvain","Judith","Prudence","Gisèle","Désiré","Pacôme","Solange",
        "Estelle","Achille","Rolande","Matthias","Denise","Honoré","Pascal","Éric","Yves","Bernardin",
        "Constantin","Émile","Didier","Donatien","Sophie","Bérenger","Augustin","Germain","Aymar","Ferdinand","Visit. de Marie",
        // Juin
        "Justin","Blandine","Kévin","Clotilde","Igor","Norbert","Gilbert","Médard","Diane","Landry",
        "Barnabé","Guy","Antoine de Padoue","Élisée","Germaine","J-F Régis","Hervé","Léonce","Romuald","Silvère",
        "Rodolphe","Alban","Audrey","Jean-Baptiste","Prosper","Anthelme","Fernand","Irénée","Pierre et Paul","Martial",
        // Juillet
        "Thierry","Martinien","Thomas","Florent","Antoine","Mariette","Raoul","Thibaut","Amandine","Ulrich",
        "Benoît","Olivier","Henri et Joël","Fête nationale","Donald","N-D du Carmel","Charlotte","Frédéric","Arsène","Marina",
        "Victor","Marie-Madeleine","Brigitte","Christine","Jacques","Anne et Joachim","Nathalie","Samson","Marthe","Juliette","Ignace de Loyola",
        // Août
        "Alphonse","Julien Eymard","Lydie","Jean-M Vianney","Abel","Transfiguration","Gaëtan","Dominique","Amour","Laurent",
        "Claire","Clarisse","Hippolyte","Evrard","Assomption","Armel","Hyacinthe","Hélène","Jean Eudes","Bernard",
        "Christophe","Fabrice","Rose de Lima","Barthélemy","Louis","Natacha","Monique","Augustin","Sabine","Fiacre","Aristide",
        // Septembre
        "Gilles","Ingrid","Grégoire","Rosalie","Raïssa","Bertrand","Reine","Nativité","Alain","Inès",
        "Adelphe","Apollinaire","Aimé","Materne","Roland","Édith","Renaud","Nadège","Émilie","Davy",
        "Matthieu","Maurice","Constance","Thècle","Hermann","Côme et Damien","Vinc. de Paul","Venceslas","Michel","Jérôme",
        // Octobre
        "Thérèse","Léger","Gérard","François d'Assise","Fleur","Bruno","Serge","Pélagie","Denis","Ghislain",
        "Firmin","Wilfrid","Géraud","Juste","Thérèse d'Avila","Edwige","Baudouin","Luc","René","Adeline",
        "Céline","Élodie","Jean de Capistran","Florentin","Crépin","Dimitri","Émeline","Simon et Jude","Narcisse","Bienvenu","Quentin",
        // Novembre
        "Toussaint","Défunts","Hubert","Charles","Sylvie","Bertille","Carine","Geoffrey","Théodore","Léon",
        "Martin","Christian","Brice","Sidoine","Albert","Marguerite","Élisabeth","Aude","Tanguy","Edmond",
        "Présent. de Marie","Cécile","Clément","Flora","Catherine","Delphine","Sévrin","Jacq. de la Marche","Saturnin","André",
        // Décembre
        "Florence","Viviane","François Xavier","Barbara","Gérald","Nicolas","Ambroise","Immac. Conception","Pierre Fourier","Romaric",
        "Daniel","Jeanne de Chantal","Lucie","Odile","Ninon","Alice","Gaël","Gatien","Urbain","Abraham",
        "Pierre Canisius","Françoise-Xavière","Armand","Adèle","Noël","Étienne","Jean","Innocents","David","Roger","Sylvestre"
    ];

    function updateDateBar() {
        const now = new Date();
        const jours = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
        const mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
        
        const heure = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const jour = jours[now.getDay()];
        const numero = now.getDate();
        const nomMois = mois[now.getMonth()];
        
        dayEl.textContent = `${jour} ${numero} ${nomMois} · ${heure}h${minutes}`;
        
        // Saint du jour
        const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000) - 1;
        const saint = saints[dayOfYear] || '';
        if (saint) {
            saintEl.textContent = `Bonne fête aux ${saint} !`;
        }
    }

    updateDateBar();
    setInterval(updateDateBar, 30000); // Mise à jour toutes les 30 secondes
}

// ============================================
// SECTION SPORT - FC MONTCEAU BOURGOGNE
// ============================================

function initSport() {
    loadSportData();
}

async function loadSportData() {
    const loading = document.getElementById('sportLoading');
    const content = document.getElementById('sportContent');
    
    if (!loading || !content) return;

    try {
        const supabaseClient = getSupabaseClient();
        if (!supabaseClient) {
            loading.innerHTML = '<span style="color: var(--text-secondary); font-size: 0.8rem;">Données sport indisponibles</span>';
            return;
        }

        const { data, error } = await supabaseClient
            .from('sport_data')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            console.warn('Sport: pas de données', error);
            loading.innerHTML = '<span style="color: var(--text-secondary); font-size: 0.8rem;">Données sport indisponibles</span>';
            return;
        }

        // === DERNIER MATCH ===
        const lastDate = document.getElementById('sportLastDate');
        const lastHome = document.getElementById('sportLastHome');
        const lastAway = document.getElementById('sportLastAway');
        const lastHomeScore = document.getElementById('sportLastHomeScore');
        const lastAwayScore = document.getElementById('sportLastAwayScore');
        const resultIndicator = document.getElementById('sportResultIndicator');
        const resultLetter = document.getElementById('sportResultLetter');

        if (data.last_match_date) {
            const matchDate = new Date(data.last_match_date + 'T00:00:00');
            lastDate.textContent = (data.last_match_matchday || '') + ' · ' + matchDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            
            lastHome.textContent = data.last_match_home_team;
            lastAway.textContent = data.last_match_away_team;
            lastHomeScore.textContent = data.last_match_home_score;
            lastAwayScore.textContent = data.last_match_away_score;

            if (data.last_match_is_home) {
                lastHome.classList.add('is-fcmb');
            } else {
                lastAway.classList.add('is-fcmb');
            }

            const fcmbScore = data.last_match_is_home ? data.last_match_home_score : data.last_match_away_score;
            const oppScore = data.last_match_is_home ? data.last_match_away_score : data.last_match_home_score;
            
            if (fcmbScore > oppScore) {
                resultIndicator.classList.add('win');
                resultLetter.textContent = 'V';
            } else if (fcmbScore < oppScore) {
                resultIndicator.classList.add('loss');
                resultLetter.textContent = 'D';
            } else {
                resultIndicator.classList.add('draw');
                resultLetter.textContent = 'N';
            }
        }

        // === PROCHAIN MATCH ===
        const nextDate = document.getElementById('sportNextDate');
        const nextHome = document.getElementById('sportNextHome');
        const nextAway = document.getElementById('sportNextAway');
        const nextTime = document.getElementById('sportNextTime');
        const nextLabel = document.getElementById('sportNextLabel');

        if (data.next_match_date) {
            const nDate = new Date(data.next_match_date + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const matchDay = new Date(nDate);
            matchDay.setHours(0, 0, 0, 0);
            
            const isToday = matchDay.getTime() === today.getTime();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const isTomorrow = matchDay.getTime() === tomorrow.getTime();

            let dateStr = (data.next_match_matchday || '') + ' · ';
            if (isToday) {
                dateStr += '<span class="sport-today-badge">Aujourd\'hui !</span>';
                nextLabel.innerHTML = '🔴 Ce soir !';
            } else if (isTomorrow) {
                dateStr += '<span class="sport-today-badge">Demain</span>';
            } else {
                dateStr += nDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
            }
            nextDate.innerHTML = dateStr;

            nextHome.textContent = data.next_match_home_team;
            nextAway.textContent = data.next_match_away_team;
            nextTime.textContent = data.next_match_time || '';

            if (data.next_match_is_home) {
                nextHome.classList.add('is-fcmb');
            } else {
                nextAway.classList.add('is-fcmb');
            }
        }

        // === CLASSEMENT ===
        const posEl = document.getElementById('sportPosition');
        const statsEl = document.getElementById('sportStats');

        if (data.standing_position) {
            posEl.textContent = data.standing_position + (data.standing_position === 1 ? 'er' : 'e');
            posEl.classList.add(data.standing_position <= 3 ? 'top3' : 'mid');

            const diff = data.standing_goals_for - data.standing_goals_against;
            const diffStr = diff > 0 ? '+' + diff : diff.toString();
            statsEl.innerHTML = '<strong>' + data.standing_points + ' pts</strong> · ' + data.standing_played + 'J · ' + data.standing_won + 'V ' + data.standing_drawn + 'N ' + data.standing_lost + 'D · ' + diffStr;
        }

        // === FORME ===
        const formEl = document.getElementById('sportForm');
        if (data.form) {
            const formArr = data.form.split(',');
            formEl.innerHTML = formArr.map(function(f) {
                const letter = f.trim();
                let cls = '';
                if (letter === 'V') cls = 'win';
                else if (letter === 'N') cls = 'draw';
                else if (letter === 'D') cls = 'loss';
                return '<div class="sport-form-dot ' + cls + '">' + letter + '</div>';
            }).join('');
        }

        // === CLASSEMENT COMPLET ===
        if (data.standings_json && data.standings_json.length > 0) {
            window._standingsData = data.standings_json;
        }

        loading.style.display = 'none';
        content.style.display = 'block';

        console.log('⚽ Sport: données chargées');

    } catch (err) {
        console.error('Sport: erreur chargement', err);
        loading.innerHTML = '<span style="color: var(--text-secondary); font-size: 0.8rem;">Erreur de chargement</span>';
    }
}

// ============================================
// MODAL CLASSEMENT R1 HERBELIN
// ============================================
function showStandingsModal() {
    var overlay = document.getElementById('standingsModalOverlay');
    var modal = document.getElementById('standingsModal');
    var body = document.getElementById('standingsModalBody');
    if (!overlay || !modal || !body) return;

    overlay.classList.add('active');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    var standings = window._standingsData;
    if (!standings || standings.length === 0) {
        body.innerHTML = '<div class="standings-loading" style="flex-direction: column; gap: 0.8rem; padding: 2rem 1rem;">' +
            '<span class="material-icons" style="font-size: 2rem; color: #fbbf24;">emoji_events</span>' +
            '<div style="text-align: center; font-size: 0.8rem; color: var(--text-secondary);">Le classement complet sera disponible<br>après la prochaine mise à jour du scraper.</div>' +
            '<a href="https://www.sportcorico.com/championnat/bourgogne-franche-comte-regional-1-herbelin-3/phase-unique/poule-a" target="_blank" rel="noopener" style="color: #818cf8; font-size: 0.75rem; text-decoration: none;">Voir sur SportCorico →</a>' +
            '</div>';
        return;
    }

    // Trier par position
    standings.sort(function(a, b) { return a.position - b.position; });
    var totalTeams = standings.length;

    var html = '<table class="standings-table">';
    html += '<thead><tr><th>#</th><th>Équipe</th><th>Pts</th><th>J</th><th>V</th><th>N</th><th>D</th><th>BP</th><th>BC</th><th>Diff</th></tr></thead>';
    html += '<tbody>';

    standings.forEach(function(team) {
        var isMontceau = team.team.toLowerCase().includes('montceau');
        var isTop3 = team.position <= 3;
        var isBottom3 = team.position > totalTeams - 3;
        var posClass = isTop3 ? 'top3' : (isBottom3 ? 'bottom3' : '');
        var diff = team.diff || (team.goalsFor - team.goalsAgainst);
        var diffStr = diff > 0 ? '+' + diff : diff.toString();
        var diffClass = diff > 0 ? 'standings-diff-pos' : (diff < 0 ? 'standings-diff-neg' : '');

        // Raccourcir les noms longs
        var displayName = team.team
            .replace(/\s*\d+$/, '')
            .replace('A.S.A.', 'ASA')
            .replace('JURA DOLOIS FOOTBALL', 'Jura Dolois')
            .replace('FAUVERNEY ROUVRES', 'Fauverney R.');

        // Capitaliser proprement
        displayName = displayName.split(' ').map(function(w) {
            if (w.length <= 2) return w;
            return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
        }).join(' ');

        html += '<tr class="' + (isMontceau ? 'is-montceau' : '') + '">';
        html += '<td><span class="standings-pos ' + posClass + '">' + team.position + '</span></td>';
        html += '<td>' + displayName + '</td>';
        html += '<td class="standings-pts">' + team.points + '</td>';
        html += '<td>' + team.played + '</td>';
        html += '<td>' + team.won + '</td>';
        html += '<td>' + team.drawn + '</td>';
        html += '<td>' + team.lost + '</td>';
        html += '<td>' + team.goalsFor + '</td>';
        html += '<td>' + team.goalsAgainst + '</td>';
        html += '<td class="' + diffClass + '">' + diffStr + '</td>';
        html += '</tr>';
    });

    html += '</tbody></table>';
    body.innerHTML = html;
}

function closeStandingsModal() {
    var overlay = document.getElementById('standingsModalOverlay');
    var modal = document.getElementById('standingsModal');
    if (overlay) overlay.classList.remove('active');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}