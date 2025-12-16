// ============================================
// ACTU & MÉDIA - Application JavaScript
// ============================================

// Configuration
const CONFIG = {
    news: {
        apiUrl: '/api/getNews',
        refreshInterval: 10 * 60 * 1000 // 10 minutes
    },
    cinema: {
        dataUrl: 'https://raw.githubusercontent.com/jhd71/scraper-cinema/main/data/cinema.json'
    }
};

// État de l'application
let newsCurrentSlide = 0;
let newsSlides = [];
let newsAutoPlayInterval = null;

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Actu & Média - Initialisation');
    
    initWeather();
    initNews();
    initCinema();
    initServiceWorker();
});

async function initWeather() {
    const weatherTemp = document.getElementById('weatherTemp');
    const weatherIcon = document.getElementById('weatherIcon');
    const weatherTomorrow = document.getElementById('weatherTomorrow');

    try {
        // Vos coordonnées
        const latitude = 46.6667;
        const longitude = 4.3667;

        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,weathercode&timezone=Europe/Paris`
        );

        if (!response.ok) throw new Error('Erreur météo');

        const data = await response.json();

        // --- Aujourd’hui ---
        const tempToday = Math.round(data.current_weather.temperature);
        const iconToday = getWeatherEmojiFromCode(data.current_weather.weathercode);

        weatherTemp.textContent = `${tempToday}°`;
        weatherIcon.textContent = iconToday;

        // --- Demain (J+1) ---
        // Vérification des données daily
        if (data.daily && data.daily.temperature_2m_max && data.daily.temperature_2m_max.length > 1) {
            const tempTomorrow = Math.round(data.daily.temperature_2m_max[1]); // Index 1 = Demain
            const iconTomorrow = getWeatherEmojiFromCode(data.daily.weathercode[1]);

            if (weatherTomorrow) {
                // J'ai enlevé le style="opacity" car on le gère en CSS maintenant
                weatherTomorrow.innerHTML = `
                    <span>Demain</span>
                    <span style="font-weight:600;">${iconTomorrow} ${tempTomorrow}°</span>
                `;
            }
        }

        console.log('🌤️ Météo chargée avec succès');

    } catch (error) {
        console.error('❌ Erreur météo:', error);
        if(weatherTemp) weatherTemp.textContent = '--';
    }
}

// N'oubliez pas de lancer la fonction !
document.addEventListener('DOMContentLoaded', initWeather);

// Votre fonction helper (inchangée)
function getWeatherEmojiFromCode(code) {
    // Codes WMO (World Meteorological Organization)
    
    // 0 : Ciel dégagé
    if (code === 0) return '☀️'; 
    
    // 1-3 : Partiellement nuageux
    if ([1, 2, 3].includes(code)) return '🌥️'; 
    
    // 45, 48 : Brouillard
    if ([45, 48].includes(code)) return '🌫️'; 
    
    // 51-67 : Bruine et Pluie
    if ([51, 53, 55, 61, 63, 65, 66, 67].includes(code)) return '🌧️'; 
    
    // 71-77 : Neige
    if ([71, 73, 75, 77].includes(code)) return '❄️'; 
    
    // 80-82 : Averses de pluie
    if ([80, 81, 82].includes(code)) return '🌦️'; 
    
    // 85-86 : Averses de neige
    if ([85, 86].includes(code)) return '🌨️'; 
    
    // 95-99 : Orages
    if ([95, 96, 99].includes(code)) return '⛈️'; 
    
    // Par défaut
    return '🌤️';
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
                    <a href="${article.link}" target="_blank" class="news-item fade-in" style="animation-delay: ${index * 0.1}s">
                        <div class="news-item-source">${getSourceIcon(article.source)} ${article.source}</div>
                        <div class="news-item-title">${article.title}</div>
                        <div class="news-item-date">${formatDate(article.date)}</div>
                    </a>
                </div>
            `).join('')}
        </div>
    `;
    
    // Créer les points de navigation
    dotsContainer.innerHTML = articles.map((_, index) => 
        `<div class="ticker-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>`
    ).join('');
    
    // Événements sur les points
    dotsContainer.querySelectorAll('.ticker-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            goToNewsSlide(parseInt(dot.dataset.index));
        });
    });
}

function initNewsNavigation() {
    const prevBtn = document.getElementById('tickerPrev');
    const nextBtn = document.getElementById('tickerNext');
    
    prevBtn.addEventListener('click', () => {
        goToNewsSlide(newsCurrentSlide - 1);
        resetNewsAutoPlay();
    });
    
    nextBtn.addEventListener('click', () => {
        goToNewsSlide(newsCurrentSlide + 1);
        resetNewsAutoPlay();
    });
    
    // Swipe touch
    const container = document.getElementById('newsTicker');
    let touchStartX = 0;
    let touchEndX = 0;
    
    container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    container.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleNewsSwipe();
    }, { passive: true });
    
    function handleNewsSwipe() {
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                goToNewsSlide(newsCurrentSlide + 1);
            } else {
                goToNewsSlide(newsCurrentSlide - 1);
            }
            resetNewsAutoPlay();
        }
    }
}

function goToNewsSlide(index) {
    const slides = document.getElementById('newsSlides');
    const dots = document.querySelectorAll('.ticker-dot');
    
    if (!slides || !newsSlides.length) return;
    
    // Boucle infinie
    if (index < 0) index = newsSlides.length - 1;
    if (index >= newsSlides.length) index = 0;
    
    newsCurrentSlide = index;
    slides.style.transform = `translateX(-${index * 100}%)`;
    
    // Mise à jour des points
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function startNewsAutoPlay() {
    newsAutoPlayInterval = setInterval(() => {
        goToNewsSlide(newsCurrentSlide + 1);
    }, 6000); // Change toutes les 6 secondes
}

function resetNewsAutoPlay() {
    clearInterval(newsAutoPlayInterval);
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

function getSourceIcon(source) {
    const icons = {
        'Le JSL': '📰',
        'Montceau News': '🏙️',
        'Creusot Infos': '🏭',
        "L'Informateur": '📋',
        'France Bleu': '🎙️'
    };
    return icons[source] || '📰';
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
async function initCinema() {
    const container = document.getElementById('cinemaContent');
    
    try {
        const response = await fetch(CONFIG.cinema.dataUrl + '?t=' + Date.now(), {
            cache: 'no-store'
        });
        
        if (!response.ok) throw new Error('Erreur cinéma');
        
        const data = await response.json();
        
        if (data.films && data.films.length > 0) {
            renderCinema(data.films.slice(0, 4)); // Max 4 films
            console.log(`🎬 ${data.films.length} films chargés`);
        } else {
            showCinemaFallback();
        }
    } catch (error) {
        console.error('❌ Erreur cinéma:', error);
        showCinemaFallback();
    }
}

function renderCinema(films) {
    const container = document.getElementById('cinemaContent');
    
    container.innerHTML = `
        <div class="cinema-films">
            ${films.map((film, index) => `
                <a href="${film.lien || 'https://www.cinemacapitole-montceau.fr/horaires/'}" 
                   target="_blank" 
                   class="cinema-film fade-in" 
                   style="animation-delay: ${index * 0.1}s">
                    <div class="cinema-film-title">${film.titre}</div>
                    <div class="cinema-film-meta">
                        <span>🎭 ${film.genre || 'Film'}</span>
                        <span>⏱️ ${film.duree || 'N/A'}</span>
                    </div>
                    <div class="cinema-film-times">
                        ${(film.horaires || []).slice(0, 4).map(time => 
                            `<span class="cinema-time">${time}</span>`
                        ).join('')}
                    </div>
                </a>
            `).join('')}
        </div>
    `;
}

function showCinemaFallback() {
    const container = document.getElementById('cinemaContent');
    
    container.innerHTML = `
        <div style="text-align: center; padding: 1.5rem;">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🎬</div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">Le Capitole</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">
                4 salles • 589 places • Dolby Atmos
            </div>
            <a href="https://www.cinemacapitole-montceau.fr/horaires/" 
               target="_blank"
               style="display: inline-flex; align-items: center; gap: 0.5rem; 
                      padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                      color: white; border-radius: 50px; text-decoration: none; font-weight: 600;
                      font-size: 0.875rem;">
                <span class="material-icons" style="font-size: 1.25rem;">movie</span>
                Voir le programme
            </a>
        </div>
    `;
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
// UTILITAIRES
// ============================================

// Rafraîchir les news périodiquement
setInterval(() => {
    console.log('🔄 Rafraîchissement des actualités...');
    initNews();
}, CONFIG.news.refreshInterval);
