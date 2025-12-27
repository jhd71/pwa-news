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
        const iconToday = getWeatherEmoji(data.current_weather.weathercode);
        
        const icon0 = document.getElementById('weatherIcon0');
        const temp0 = document.getElementById('weatherTemp0');
        if (icon0) icon0.innerHTML = getWeatherIcon(data.current_weather.weathercode, 'small');
        if (temp0) temp0.textContent = `${tempToday}°`;

        // Demain (J+1)
        if (data.daily && data.daily.temperature_2m_max && data.daily.temperature_2m_max.length > 1) {
            const tempJ1 = Math.round(data.daily.temperature_2m_max[1]);
            const iconJ1 = getWeatherEmoji(data.daily.weathercode[1]);
            
            const icon1 = document.getElementById('weatherIcon1');
            const temp1 = document.getElementById('weatherTemp1');
            if (icon1) icon1.innerHTML = getWeatherIcon(data.daily.weathercode[1], 'small');
            if (temp1) temp1.textContent = `${tempJ1}°`;
        }

        // Après-demain (J+2)
        if (data.daily && data.daily.temperature_2m_max && data.daily.temperature_2m_max.length > 2) {
            const tempJ2 = Math.round(data.daily.temperature_2m_max[2]);
            const iconJ2 = getWeatherEmoji(data.daily.weathercode[2]);
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

// Icône météo animée (HTML)
function getWeatherIcon(code, size = 'medium') {
    if (code === 0) {
        // Soleil
        return `<span class="weather-icon sun ${size}"></span>`;
    }
    if ([1, 2, 3].includes(code)) {
        // Partiellement nuageux
        return `<span class="weather-icon partly-cloudy ${size}"><span class="sun-part"></span><span class="cloud-part"></span></span>`;
    }
    if ([45, 48].includes(code)) {
        // Brouillard
        return `<span class="weather-icon fog ${size}"><span class="line"></span><span class="line"></span><span class="line"></span></span>`;
    }
    if ([51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        // Pluie
        return `<span class="weather-icon rain ${size}"><span class="cloud"></span><span class="drops"><span class="drop"></span><span class="drop"></span><span class="drop"></span></span></span>`;
    }
    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        // Neige
        return `<span class="weather-icon snow ${size}"><span class="cloud"></span><span class="flakes"><span class="flake"></span><span class="flake"></span><span class="flake"></span></span></span>`;
    }
    if ([95, 96, 99].includes(code)) {
        // Orage
        return `<span class="weather-icon thunder ${size}"><span class="cloud"></span><span class="bolt"></span></span>`;
    }
    // Par défaut : partiellement nuageux
    return `<span class="weather-icon partly-cloudy ${size}"><span class="sun-part"></span><span class="cloud-part"></span></span>`;
}

// ============================================
// THÈME (Multi-thèmes)
// ============================================
const THEMES = ['dark', 'light', 'rouge', 'bleuciel', 'rose', 'rosepale'];

const THEME_ICONS = {
    'dark': 'dark_mode',
    'light': 'light_mode',
    'rouge': 'local_fire_department',
    'bleuciel': 'water_drop',
    'rose': 'auto_awesome',
    'rosepale': 'spa'
};

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
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
                    <a href="${article.link}" target="_blank" class="news-item fade-in" style="animation-delay: ${index * 0.1}s">
                        <div class="news-item-image ${!article.image ? 'no-image' : ''}">
                            ${article.image 
                                ? `<img src="${article.image}" alt="" loading="lazy" onerror="this.parentElement.classList.add('no-image'); this.style.display='none';">` 
                                : ''}
                            <div class="news-item-placeholder"><span class="material-icons">article</span></div>
                        </div>
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
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        // Si aucune donnée
        if (!data || data.length === 0) {
            contentEl.style.display = 'none';
            emptyEl.style.display = 'block';
            console.log('📭 Aucune info communauté');
            return;
        }
        
        // Afficher les infos
        contentEl.innerHTML = data.map(item => `
            <div class="community-item" onclick="toggleCommunityDetail(this)">
                <div class="community-item-icon ${item.type || 'actualite'}">
                    ${getCommunityIcon(item.type)}
                </div>
                <div class="community-item-content">
                    <div class="community-item-title">${escapeHtml(item.title)}</div>
                    ${item.image_url ? `<img src="${item.image_url}" alt="${escapeHtml(item.title)}" class="community-item-image" onclick="event.stopPropagation(); openImageModal('${item.image_url}')">` : ''}
                    <div class="community-item-desc">${escapeHtml(item.content)}</div>
                    ${item.link_url ? `<a href="${item.link_url}" target="_blank" class="community-item-link" onclick="event.stopPropagation()"><span class="material-icons">link</span>Voir plus</a>` : ''}
                    <div class="community-item-meta">
                        ${item.location ? `<span class="community-item-location"><span class="material-icons">location_on</span>${escapeHtml(item.location)}</span>` : ''}
                        <span><span class="material-icons">person</span>${escapeHtml(item.author || 'Anonyme')}</span>
                        <span><span class="material-icons">schedule</span>${formatCommunityDate(item.created_at)}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        emptyEl.style.display = 'none';
        console.log(`📢 ${data.length} infos communauté chargées`);
        
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

// Fonction pour afficher/masquer le détail d'une info communauté
function toggleCommunityDetail(element) {
    element.classList.toggle('expanded');
}

// Fonction pour ouvrir une image en grand
function openImageModal(imageUrl) {
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
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    document.getElementById('modalImage').src = imageUrl;
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
