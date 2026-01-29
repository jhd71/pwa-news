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
    initExtraTiles();
    initPushNotifications();
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

function stopNewsAutoPlay() {
    if (newsAutoPlayInterval) {
        clearInterval(newsAutoPlayInterval);
        newsAutoPlayInterval = null;
    }
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
        
        // Afficher les infos
        contentEl.innerHTML = data.map(item => {
            const commentCount = commentCounts[item.id] || 0;
            return `
            <div class="community-item">
                <!-- HEADER : Emoji + Auteur + Date -->
                <div class="community-item-header">
                    <span class="community-item-icon">${getCommunityIcon(item.type)}</span>
                    <span class="community-item-author">${escapeHtml(item.author || 'Actu & Média')}</span>
                    <span class="community-item-separator">·</span>
                    <span class="community-item-date">${formatCommunityDate(item.created_at)}</span>
                </div>
                
                <div class="community-item-content">
                    <div class="community-item-title">${escapeHtml(item.title)}</div>
                    ${item.image_url ? `<div class="community-image-wrapper" onclick="event.stopPropagation(); openImageModal('${item.image_url}')"><img src="${item.image_url}" alt="${escapeHtml(item.title)}" class="community-item-image"><div class="community-image-zoom"><span class="material-icons">zoom_in</span><span>Agrandir</span></div></div>` : ''}
                    <div class="community-item-desc" id="desc-${item.id}">${escapeHtml(item.content)}</div>
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
                    
                    <!-- Actions (Like) -->
                    <div class="community-item-actions" onclick="event.stopPropagation()">
                        <button class="like-btn ${userLikes.includes(item.id) ? 'liked' : ''}" id="like-btn-${item.id}" onclick="toggleLike(${item.id}, this)">
                            <span class="material-icons">${userLikes.includes(item.id) ? 'favorite' : 'favorite_border'}</span>
                            <span class="like-count" id="like-count-${item.id}">${likeCounts[item.id] || 0}</span>
                        </button>
                    </div>
                    
                    <!-- Section Commentaires -->
                    <div class="community-comments-section" onclick="event.stopPropagation()">
                        <button class="comments-toggle-btn" onclick="toggleComments(${item.id}, this)">
                            <span class="material-icons">chat_bubble_outline</span>
                            <span>${commentCount > 0 ? commentCount + ' commentaire' + (commentCount > 1 ? 's' : '') : 'Commenter'}</span>
                            <span class="material-icons arrow">expand_more</span>
                        </button>
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
        
        emptyEl.style.display = 'none';
        console.log(`📢 ${data.length} infos communauté chargées`);
        
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
function getUserFingerprint() {
    let fp = localStorage.getItem('user_fingerprint');
    if (!fp) {
        fp = 'fp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('user_fingerprint', fp);
    }
    return fp;
}

async function toggleLike(newsId, btn) {
    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) return;
    
    const userFingerprint = getUserFingerprint();
    const isLiked = btn.classList.contains('liked');
    const countEl = document.getElementById(`like-count-${newsId}`);
    const icon = btn.querySelector('.material-icons');
    let currentCount = parseInt(countEl.textContent) || 0;
    
    try {
        if (isLiked) {
            // Retirer le like
            const { error } = await supabaseClient
                .from('news_likes')
                .delete()
                .eq('news_id', newsId)
                .eq('user_fingerprint', userFingerprint);
            
            if (error) throw error;
            
            btn.classList.remove('liked');
            icon.textContent = 'favorite_border';
            countEl.textContent = Math.max(0, currentCount - 1);
            
            // Mettre à jour le tableau local
            window.userLikes = window.userLikes.filter(id => id !== newsId);
            
        } else {
            // Ajouter le like
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
            
            // Mettre à jour le tableau local
            window.userLikes.push(newsId);
        }
    } catch (error) {
        console.error('Erreur like:', error);
        // En cas d'erreur (ex: déjà liké), on ne fait rien
    }
}

async function incrementViews(newsId) {
    try {
        const supabaseClient = getSupabaseClient();
        if (!supabaseClient) return;
        
        await supabaseClient.rpc('increment_views', { row_id: newsId });
    } catch (error) {
        console.log('Erreur incrémentation vues:', error);
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
        
        // Incrémenter les vues (une seule fois)
        if (!descEl.dataset.viewed) {
            descEl.dataset.viewed = 'true';
            incrementViews(newsId);
            
            // Mettre à jour le compteur localement
            const viewsEl = descEl.closest('.community-item').querySelector('.views-count');
            if (viewsEl) {
                const currentViews = parseInt(viewsEl.textContent) || 0;
                viewsEl.innerHTML = `<span class="material-icons">visibility</span>${currentViews + 1}`;
            }
        }
    }
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

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', initFontSizeSelector);

// ============================================
// AGENDA LOCAL
// ============================================
async function initAgenda() {
    const contentEl = document.getElementById('agendaContent');
    const emptyEl = document.getElementById('agendaEmpty');
    
    if (!contentEl) return;
    
    try {
        const supabaseClient = getSupabaseClient();
        if (!supabaseClient) {
            console.log('⚠️ Supabase non disponible pour l\'agenda');
            return;
        }
        
        // Récupérer les 5 prochains événements
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabaseClient
            .from('events')
            .select('*')
            .eq('status', 'approved')
            .gte('event_date', today)
            .order('event_date', { ascending: true })
            .limit(5);
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            contentEl.style.display = 'none';
            emptyEl.style.display = 'block';
            console.log('📅 Aucun événement à venir');
            return;
        }
        
        // Afficher les événements
        contentEl.innerHTML = data.map(event => {
            const date = new Date(event.event_date);
            const day = date.getDate();
            const month = date.toLocaleDateString('fr-FR', { month: 'short' });
            const categoryIcon = getCategoryIcon(event.category);
            const categoryLabel = getCategoryLabel(event.category);
            
            return `
                <a href="${event.link || '#'}" class="agenda-item" ${event.link ? 'target="_blank"' : ''}>
                    <div class="agenda-item-date">
                        <span class="agenda-item-day">${day}</span>
                        <span class="agenda-item-month">${month}</span>
                    </div>
                    <div class="agenda-item-content">
                        <div class="agenda-item-title">${escapeHtml(event.title)}</div>
                        <div class="agenda-item-info">
                            ${event.event_time ? `<span><span class="material-icons">schedule</span>${formatTime(event.event_time)}</span>` : ''}
                            ${event.location ? `<span><span class="material-icons">place</span>${escapeHtml(event.location)}</span>` : ''}
                        </div>
                        <span class="agenda-item-category ${event.category}">${categoryIcon} ${categoryLabel}</span>
                    </div>
                </a>
            `;
        }).join('');
        
        console.log(`📅 ${data.length} événements chargés`);
        
    } catch (error) {
        console.error('❌ Erreur agenda:', error);
        contentEl.innerHTML = `
            <div class="agenda-empty">
                <div class="agenda-empty-icon">📅</div>
                <div class="agenda-empty-text">Erreur de chargement</div>
            </div>
        `;
    }
}

function getCategoryIcon(category) {
    const icons = {
        'sport': '⚽',
        'culture': '🎭',
        'marche': '🛒',
        'brocante': '🏷️',
        'concert': '🎵',
        'fete': '🎉',
        'reunion': '👥',
        'autre': '📌'
    };
    return icons[category] || '📌';
}

function getCategoryLabel(category) {
    const labels = {
        'sport': 'Sport',
        'culture': 'Culture',
        'marche': 'Marché',
        'brocante': 'Brocante',
        'concert': 'Concert',
        'fete': 'Fête',
        'reunion': 'Réunion',
        'autre': 'Événement'
    };
    return labels[category] || 'Événement';
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    return `${hours}h${minutes !== '00' ? minutes : ''}`;
}

// Ajouter à l'initialisation
document.addEventListener('DOMContentLoaded', initAgenda);

// Exposer globalement
window.togglePushSubscription = togglePushSubscription;
window.showNotifPrompt = showNotifPrompt;
window.closeNotifPrompt = closeNotifPrompt;
window.acceptNotifPrompt = acceptNotifPrompt;
