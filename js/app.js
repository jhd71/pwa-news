// ============================================
// ACTU & MÉDIA - Application JavaScript v3
// Version simplifiée : 2 thèmes (dark/light)
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

// Instance unique Supabase
let supabaseClient = null;

function getSupabaseClient() {
    if (!supabaseClient && typeof window.supabase !== 'undefined') {
        supabaseClient = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.key);
        console.log('✅ Supabase initialisé (instance unique)');
    }
    return supabaseClient;
}

// Exposer globalement
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
    console.log('🚀 Actu & Média - Initialisation v3');
    
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
        return `<span class="weather-icon sun ${size}"></span>`;
    }
    if ([1, 2, 3].includes(code)) {
        return `<span class="weather-icon partly-cloudy ${size}"><span class="sun-part"></span><span class="cloud-part"></span></span>`;
    }
    if ([45, 48].includes(code)) {
        return `<span class="weather-icon fog ${size}"><span class="line"></span><span class="line"></span><span class="line"></span></span>`;
    }
    if ([51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        return `<span class="weather-icon rain ${size}"><span class="cloud"></span><span class="drops"><span class="drop"></span><span class="drop"></span><span class="drop"></span></span></span>`;
    }
    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return `<span class="weather-icon snow ${size}"><span class="cloud"></span><span class="flakes"><span class="flake"></span><span class="flake"></span><span class="flake"></span></span></span>`;
    }
    if ([95, 96, 99].includes(code)) {
        return `<span class="weather-icon thunder ${size}"><span class="cloud"></span><span class="bolt"></span></span>`;
    }
    return `<span class="weather-icon partly-cloudy ${size}"><span class="sun-part"></span><span class="cloud-part"></span></span>`;
}

// ============================================
// THÈME - Simplifié (Dark / Light seulement)
// ============================================
const THEMES = ['dark', 'light'];

const THEME_ICONS = {
    'dark': 'dark_mode',
    'light': 'light_mode'
};

const THEME_COLORS = {
    'dark': '#0a0a0f',
    'light': '#f8fafc'
};

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
    
    // Bouton toggle header (bascule entre dark et light)
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = current === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
    
    // Sélecteur de thèmes (dans panel support) - pour compatibilité
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            // Convertir les anciens thèmes en dark/light
            const mappedTheme = (theme === 'light' || theme === 'rosepale') ? 'light' : 'dark';
            applyTheme(mappedTheme);
            localStorage.setItem('theme', mappedTheme);
        });
    });
}

function applyTheme(theme) {
    // Normaliser le thème (seulement dark ou light)
    const normalizedTheme = (theme === 'light' || theme === 'rosepale') ? 'light' : 'dark';
    
    if (normalizedTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', normalizedTheme);
    }
    
    // Mettre à jour l'icône du toggle header
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.textContent = THEME_ICONS[normalizedTheme] || 'dark_mode';
    }
    
    // Mettre à jour le bouton actif dans le sélecteur
    document.querySelectorAll('.theme-option').forEach(btn => {
        const btnTheme = btn.getAttribute('data-theme');
        const mappedBtnTheme = (btnTheme === 'light' || btnTheme === 'rosepale') ? 'light' : 'dark';
        btn.classList.toggle('active', mappedBtnTheme === normalizedTheme);
    });
    
    // Mettre à jour le theme-color pour les barres système (Android/iOS)
    const themeColorMeta = document.getElementById('themeColorMeta');
    if (themeColorMeta) {
        themeColorMeta.setAttribute('content', THEME_COLORS[normalizedTheme] || '#0a0a0f');
    }
}

// ============================================
// NEWS / INFOS EN DIRECT
// ============================================
async function initNews() {
    const container = document.getElementById('newsSlides');
    if (!container) return;

    // Afficher le loading
    container.innerHTML = `
        <div class="news-ticker-loading">
            <span class="material-icons spinning">refresh</span>
            <span>Chargement des actualités...</span>
        </div>
    `;

    try {
        const response = await fetch(CONFIG.news.apiUrl);
        if (!response.ok) throw new Error('Erreur API');

        const data = await response.json();
        newsSlides = data.articles || [];

        if (newsSlides.length === 0) {
            container.innerHTML = '<p style="text-align:center; color: var(--text-muted);">Aucune actualité disponible</p>';
            return;
        }

        renderNewsSlides();
        startNewsAutoPlay();

        console.log(`📰 ${newsSlides.length} articles chargés`);

    } catch (error) {
        console.error('❌ Erreur news:', error);
        container.innerHTML = '<p style="text-align:center; color: var(--text-muted);">Impossible de charger les actualités</p>';
    }
}

function renderNewsSlides() {
    const container = document.getElementById('newsSlides');
    const dotsContainer = document.querySelector('.ticker-dots');

    if (!container) return;

    container.innerHTML = newsSlides.map((article, index) => `
        <div class="news-slide">
            <a href="${article.link}" target="_blank" rel="noopener" class="news-item">
                <div class="news-item-image ${!article.image ? 'no-image' : ''}">
                    ${article.image ? `<img src="${article.image}" alt="${article.title}" loading="lazy" onerror="this.parentElement.classList.add('no-image')">` : ''}
                </div>
                <div class="news-item-content">
                    <span class="news-item-source">
                        ${getSourceIcon(article.source)} ${article.source}
                    </span>
                    <h3 class="news-item-title">${article.title}</h3>
                    <span class="news-item-date">${formatNewsDate(article.pubDate)}</span>
                </div>
            </a>
        </div>
    `).join('');

    // Créer les dots
    if (dotsContainer) {
        dotsContainer.innerHTML = newsSlides.map((_, i) => 
            `<span class="ticker-dot ${i === 0 ? 'active' : ''}" onclick="goToNewsSlide(${i})"></span>`
        ).join('');
    }
}

function getSourceIcon(source) {
    const icons = {
        'Le JSL': '📰',
        'Montceau News': '🏙️',
        'Info Chalon': '📍',
        'France 3': '📺',
        'France Bleu': '📻'
    };
    return icons[source] || '📄';
}

function formatNewsDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function goToNewsSlide(index, smooth = true) {
    const slides = document.getElementById('newsSlides');
    const dots = document.querySelectorAll('.ticker-dot');
    
    if (!slides || !newsSlides.length) return;
    
    let newIndex = index;
    let needsInstantJump = false;
    
    if (index < 0) {
        newIndex = newsSlides.length - 1;
        needsInstantJump = true;
    } else if (index >= newsSlides.length) {
        newIndex = 0;
        needsInstantJump = true;
    }
    
    // Désactiver transition pour boucle (évite rembobinage visible)
    if (needsInstantJump && smooth) {
        slides.style.transition = 'none';
        slides.style.transform = `translateX(-${newIndex * 100}%)`;
        
        slides.offsetHeight; // Force reflow
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
    if (newsAutoPlayInterval) {
        clearInterval(newsAutoPlayInterval);
    }
    
    newsAutoPlayInterval = setInterval(() => {
        goToNewsSlide(newsCurrentSlide + 1);
    }, 6000); // 6 secondes entre slides
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

// Exposer globalement
window.goToNewsSlide = goToNewsSlide;
window.prevNewsSlide = () => { goToNewsSlide(newsCurrentSlide - 1); resetNewsAutoPlay(); };
window.nextNewsSlide = () => { goToNewsSlide(newsCurrentSlide + 1); resetNewsAutoPlay(); };

// ============================================
// CINÉMA
// ============================================
async function initCinema() {
    const container = document.getElementById('cinemaList');
    if (!container) return;

    try {
        const response = await fetch(CONFIG.cinema.dataUrl);
        if (!response.ok) throw new Error('Erreur cinéma');

        const data = await response.json();
        const films = data.films || [];

        if (films.length === 0) {
            container.innerHTML = '<p style="text-align:center; color: var(--text-muted);">Aucune séance disponible</p>';
            return;
        }

        container.innerHTML = films.slice(0, 3).map(film => `
            <div class="cinema-film">
                <div class="cinema-film-title">${film.title}</div>
                <div class="cinema-film-info">
                    ${film.duration ? `<span><span class="material-icons">schedule</span>${film.duration}</span>` : ''}
                    ${film.genre ? `<span>${film.genre}</span>` : ''}
                </div>
                <div class="cinema-showtimes">
                    ${film.showtimes.map(time => `<span class="cinema-showtime">${time}</span>`).join('')}
                </div>
            </div>
        `).join('');

        console.log(`🎬 ${films.length} films chargés`);

    } catch (error) {
        console.error('❌ Erreur cinéma:', error);
        container.innerHTML = '<p style="text-align:center; color: var(--text-muted);">Programme indisponible</p>';
    }
}

// ============================================
// COMMUNAUTÉ / INFOS LOCALES
// ============================================
async function initCommunity() {
    const container = document.getElementById('communityList');
    if (!container) return;

    try {
        const client = getSupabaseClient();
        if (!client) {
            console.log('⏳ Supabase non disponible');
            return;
        }

        const { data, error } = await client
            .from('news_submissions')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="community-empty">
                    <div class="community-empty-icon">📭</div>
                    <p>Aucune actualité communautaire</p>
                    <p class="community-empty-sub">Soyez le premier à proposer une info !</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.map(item => `
            <div class="community-item">
                <span class="community-item-type">${getTypeEmoji(item.type)}</span>
                <h4 class="community-item-title">${escapeHtml(item.title)}</h4>
                ${item.image_url ? `<img src="${item.image_url}" alt="${item.title}" class="community-item-image" onclick="openImageModal('${item.image_url}')">` : ''}
                <p class="community-item-content">${escapeHtml(item.content)}</p>
                ${item.link_url ? `<a href="${item.link_url}" target="_blank" rel="noopener" class="community-item-link"><span class="material-icons">open_in_new</span> Voir plus</a>` : ''}
                <div class="community-item-meta">
                    ${item.location ? `<span><span class="material-icons">location_on</span>${escapeHtml(item.location)}</span>` : ''}
                    <span><span class="material-icons">person</span>${escapeHtml(item.author) || 'Actu & Média'}</span>
                    <span><span class="material-icons">schedule</span>${formatCommunityDate(item.created_at)}</span>
                </div>
            </div>
        `).join('');

        console.log(`🏘️ ${data.length} infos communautaires chargées`);

    } catch (error) {
        console.error('❌ Erreur communauté:', error);
    }
}

function getTypeEmoji(type) {
    const emojis = {
        'actualite': '📰',
        'evenement': '🎪',
        'pratique': '💡',
        'insolite': '🤔',
        'photo': '📸',
        'autre': '📋'
    };
    return emojis[type] || '📄';
}

function formatCommunityDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Modal image
function openImageModal(imageUrl) {
    let modal = document.getElementById('imageModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="image-modal-content">
                <button class="image-modal-close" onclick="closeImageModal()">
                    <span class="material-icons">close</span>
                </button>
                <img id="modalImage" src="" alt="Image agrandie">
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeImageModal();
        });
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

window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;

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
// INSTALL PROMPT (PWA)
// ============================================
function initInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        console.log('📲 Install prompt disponible');
    });
}

// ============================================
// EXTRA TILES (Plus de villes)
// ============================================
function initExtraTiles() {
    const btn = document.querySelector('.expand-tiles-btn');
    const extraTiles = document.querySelector('.extra-tiles');
    
    if (btn && extraTiles) {
        btn.addEventListener('click', () => toggleExtraTiles());
    }
}

function toggleExtraTiles() {
    const btn = document.querySelector('.expand-tiles-btn');
    const extraTiles = document.querySelector('.extra-tiles');
    
    if (btn && extraTiles) {
        const isExpanded = extraTiles.classList.toggle('show');
        btn.classList.toggle('expanded', isExpanded);
        
        const btnText = btn.querySelector('span:not(.material-icons)');
        if (btnText) {
            btnText.textContent = isExpanded ? 'Voir moins' : 'Plus de villes';
        }
    }
}

window.toggleExtraTiles = toggleExtraTiles;

// ============================================
// NOTIFICATIONS PUSH
// ============================================
let pushSubscription = null;

async function initPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('❌ Push non supporté');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            console.log('✅ Déjà abonné aux notifications');
            updateNotifButton(true);
        } else {
            updateNotifButton(false);
            
            const notifDismissed = localStorage.getItem('notifPromptDismissed');
            const lastDismiss = notifDismissed ? parseInt(notifDismissed) : 0;
            const daysSinceDismiss = (Date.now() - lastDismiss) / (1000 * 60 * 60 * 24);
            
            if (!notifDismissed || daysSinceDismiss > 7) {
                setTimeout(() => {
                    showNotifPrompt();
                }, 5000);
            }
        }
    } catch (error) {
        console.error('❌ Erreur init push:', error);
    }
}

function showNotifPrompt() {
    const prompt = document.getElementById('notifPrompt');
    if (prompt && Notification.permission === 'default') {
        prompt.classList.add('show');
    }
}

function closeNotifPrompt(saveDismiss = false) {
    const prompt = document.getElementById('notifPrompt');
    if (prompt) {
        prompt.classList.remove('show');
        if (saveDismiss) {
            localStorage.setItem('notifPromptDismissed', Date.now().toString());
        }
    }
}

async function acceptNotifPrompt() {
    closeNotifPrompt(false);
    await subscribeToPush();
}

function updateNotifButton(isSubscribed) {
    const btn = document.getElementById('notifSubscribeBtn');
    const icon = document.getElementById('notifIcon');
    const title = document.getElementById('notifTitle');
    const desc = document.getElementById('notifDesc');
    const arrow = document.getElementById('notifArrow');

    if (!btn) return;

    if (isSubscribed) {
        btn.classList.add('subscribed');
        if (icon) icon.textContent = '🔔';
        if (icon) icon.classList.add('subscribed');
        if (title) title.textContent = 'Notifications activées';
        if (desc) desc.textContent = 'Cliquez pour désactiver';
        if (arrow) arrow.textContent = 'notifications_active';
    } else {
        btn.classList.remove('subscribed');
        if (icon) icon.textContent = '🔕';
        if (icon) icon.classList.remove('subscribed');
        if (title) title.textContent = 'Activer les notifications';
        if (desc) desc.textContent = 'Recevoir les alertes infos';
        if (arrow) arrow.textContent = 'notifications_none';
    }
}

async function togglePushSubscription() {
    const btn = document.getElementById('notifSubscribeBtn');
    if (!btn) return;

    btn.classList.add('loading');

    try {
        if (pushSubscription) {
            await unsubscribeFromPush();
        } else {
            await subscribeToPush();
        }
    } catch (error) {
        console.error('❌ Erreur toggle push:', error);
        alert('Erreur : ' + error.message);
    } finally {
        btn.classList.remove('loading');
    }
}

async function subscribeToPush() {
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
        alert('Vous devez autoriser les notifications pour recevoir les alertes.');
        return;
    }

    const response = await fetch('/api/subscribe');
    const { publicKey } = await response.json();

    if (!publicKey) {
        throw new Error('Clé VAPID non disponible');
    }

    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    const registration = await navigator.serviceWorker.ready;
    pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
    });

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

    showToast('🔔 Notifications activées !', 'Vous recevrez les alertes infos.');
}

async function unsubscribeFromPush() {
    if (!pushSubscription) return;

    await fetch('/api/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: pushSubscription.endpoint })
    });

    await pushSubscription.unsubscribe();
    pushSubscription = null;

    updateNotifButton(false);
    console.log('✅ Désabonné des notifications');

    showToast('🔕 Notifications désactivées', 'Vous ne recevrez plus les alertes.');
}

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

function showToast(title, message) {
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

// Exposer globalement
window.togglePushSubscription = togglePushSubscription;
window.showNotifPrompt = showNotifPrompt;
window.closeNotifPrompt = closeNotifPrompt;
window.acceptNotifPrompt = acceptNotifPrompt;
