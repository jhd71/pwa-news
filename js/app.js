// ============================================
// ACTU & MÉDIA - Application JavaScript v2
// ============================================

// Configuration
const CONFIG = {
    news: {
        apiUrl: '/api/getNews',
        refreshInterval: 10 * 60 * 1000
    },
    cinema: {
        dataUrl: 'https://raw.githubusercontent.com/jhd71/scraper-cinema/main/data/cinema.json'
    }
};

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
    initServiceWorker();
    initInstallPrompt();
});

// ============================================
// MÉTÉO (Open-Meteo - sans clé API)
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
        const iconToday = getWeatherEmoji(data.current_weather.weathercode);
        
        document.getElementById('weatherIcon0').textContent = iconToday;
        document.getElementById('weatherTemp0').textContent = `${tempToday}°`;

        // Demain (J+1)
        if (data.daily && data.daily.temperature_2m_max && data.daily.temperature_2m_max.length > 1) {
            const tempJ1 = Math.round(data.daily.temperature_2m_max[1]);
            const iconJ1 = getWeatherEmoji(data.daily.weathercode[1]);
            
            document.getElementById('weatherIcon1').textContent = iconJ1;
            document.getElementById('weatherTemp1').textContent = `${tempJ1}°`;
        }

        // Après-demain (J+2)
        if (data.daily && data.daily.temperature_2m_max && data.daily.temperature_2m_max.length > 2) {
            const tempJ2 = Math.round(data.daily.temperature_2m_max[2]);
            const iconJ2 = getWeatherEmoji(data.daily.weathercode[2]);
            const dayNameJ2 = getDayName(2);
            
            document.getElementById('weatherLabel2').textContent = dayNameJ2;
            document.getElementById('weatherIcon2').textContent = iconJ2;
            document.getElementById('weatherTemp2').textContent = `${tempJ2}°`;
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
    if (code === 0) return '☀️';
    if ([1, 2, 3].includes(code)) return '⛅';
    if ([45, 48].includes(code)) return '☁️';
    if ([51, 53, 55, 61, 63, 65].includes(code)) return '🌧️';
    if ([66, 67].includes(code)) return '🌧️';
    if ([71, 73, 75, 77].includes(code)) return '❄️';
    if ([80, 81, 82].includes(code)) return '🌦️';
    if ([95, 96, 99].includes(code)) return '⛈️';
    return '🌤️';
}

// ============================================
// THÈME CLAIR/SOMBRE
// ============================================
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    
    // Charger le thème sauvegardé ou détecter la préférence système
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Appliquer le thème initial
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    } else if (!prefersDark) {
        document.documentElement.setAttribute('data-theme', 'light');
        updateThemeIcon('light');
    } else {
        updateThemeIcon('dark');
    }
    
    // Écouter le clic sur le bouton
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
            
            console.log(`🎨 Thème: ${newTheme}`);
        });
    }
    
    // Écouter les changements de préférence système
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            updateThemeIcon(newTheme);
        }
    });
}

function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'light' ? 'dark_mode' : 'light_mode';
    }
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
                        ${article.image ? `
                            <div class="news-item-image">
                                <img src="${article.image}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'">
                            </div>
                        ` : ''}
                        <div class="news-item-content">
                            <div class="news-item-source">${getSourceIcon(article.source)} ${article.source}</div>
                            <div class="news-item-title">${article.title}</div>
                            <div class="news-item-date">${formatDate(article.date)}</div>
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
}

function goToNewsSlide(index) {
    const slides = document.getElementById('newsSlides');
    const dots = document.querySelectorAll('.ticker-dot');
    
    if (!slides || !newsSlides.length) return;
    
    if (index < 0) index = newsSlides.length - 1;
    if (index >= newsSlides.length) index = 0;
    
    newsCurrentSlide = index;
    slides.style.transform = `translateX(-${index * 100}%)`;
    
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function startNewsAutoPlay() {
    newsAutoPlayInterval = setInterval(() => {
        goToNewsSlide(newsCurrentSlide + 1);
    }, 6000);
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
            renderCinema(data.films);
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
    const hasMore = films.length > 4;
    
    container.innerHTML = `
        <div class="cinema-films">
            ${films.map((film, index) => `
                <a href="${film.lien || 'https://www.cinemacapitole-montceau.fr/horaires/'}" 
                   target="_blank" 
                   class="cinema-film fade-in" 
                   style="animation-delay: ${index * 0.05}s">
                    <div class="cinema-film-title">${film.titre}</div>
                    <div class="cinema-film-meta">
                        <span>🎭 ${film.genre || 'Film'}</span>
                        <span>⏱️ ${film.duree || 'N/A'}</span>
                    </div>
                    <div class="cinema-film-times">
                        ${(film.horaires || []).slice(0, 5).map(time => 
                            `<span class="cinema-time">${time}</span>`
                        ).join('')}
                    </div>
                </a>
            `).join('')}
        </div>
        ${hasMore ? `
            <div class="cinema-scroll-hint">
                <span class="material-icons">swipe</span>
                Scroll pour voir plus
            </div>
        ` : ''}
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
// RAFRAÎCHISSEMENT PÉRIODIQUE
// ============================================
setInterval(() => {
    console.log('🔄 Rafraîchissement des actualités...');
    initNews();
}, CONFIG.news.refreshInterval);
