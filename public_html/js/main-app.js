/* ============================================
   ACTU & MÉDIA - JAVASCRIPT PRINCIPAL
   Version 2.0 - Architecture modulaire
   ============================================ */

// ============================================
// 1. GESTIONNAIRE DE THÈMES
// ============================================

class ThemeManager {
    constructor() {
        this.themes = [
            { id: 'rouge', name: 'Rouge', icon: 'palette', color: '#940000' },
            { id: 'dark', name: 'Sombre', icon: 'dark_mode', color: '#1a1f2e' },
            { id: 'light', name: 'Clair', icon: 'light_mode', color: '#940000' }
        ];
        
        this.init();
    }
    
    init() {
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme) {
            this.setTheme(savedTheme, false);
        } else {
            this.setTheme('rouge', false);
        }
        
        this.setupThemeButton();
        console.log('✅ ThemeManager initialisé');
    }
    
    setTheme(themeId, showToast = true) {
        if (!this.themes.find(t => t.id === themeId)) {
            console.error(`Thème inconnu: ${themeId}`);
            return;
        }
        
        // Désactiver les transitions pendant le changement
        document.documentElement.classList.add('theme-transitioning');
        
        // Forcer un repaint
        document.documentElement.offsetHeight;
        
        // Changer le thème
        document.documentElement.setAttribute('data-theme', themeId);
        localStorage.setItem('theme', themeId);
        this.updateThemeColors(themeId);
        
        // Réactiver les transitions
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.documentElement.classList.remove('theme-transitioning');
            });
        });
        
        // Dispatch event pour les autres modules
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: themeId }
        }));
        
        if (showToast) {
            this.showToast(`Thème ${this.getThemeName(themeId)} activé`);
        }
        
        console.log(`🎨 Thème appliqué: ${themeId}`);
    }
    
    updateThemeColors(themeId) {
        const theme = this.themes.find(t => t.id === themeId);
        if (!theme) return;
        
        const color = theme.color;
        
        // Mettre à jour toutes les meta theme-color
        const updateMeta = (selector, content) => {
            const meta = document.querySelector(selector);
            if (meta) meta.content = content;
        };
        
        updateMeta('meta[name="theme-color"]:not([media])', color);
        updateMeta('meta[name="theme-color"][media*="light"]', color);
        updateMeta('meta[name="theme-color"][media*="dark"]', color);
        updateMeta('meta[name="msapplication-navbutton-color"]', color);
        updateMeta('meta[name="msapplication-TileColor"]', color);
        
        // Pour iOS
        const metaAppleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
        if (metaAppleStatus) {
            metaAppleStatus.content = themeId === 'light' ? 'default' : 'black-translucent';
        }
    }
    
    getThemeName(themeId) {
        const theme = this.themes.find(t => t.id === themeId);
        return theme ? theme.name : themeId;
    }
    
    setupThemeButton() {
        const themeBtn = document.getElementById('themeToggle');
        
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                this.cycleThemes();
            });
            
            this.updateThemeButtonUI();
        }
    }
    
    updateThemeButtonUI() {
        const themeBtn = document.getElementById('themeToggle');
        if (!themeBtn) return;
        
        const currentTheme = this.getCurrentTheme();
        const theme = this.themes.find(t => t.id === currentTheme);
        
        if (theme) {
            const iconElement = themeBtn.querySelector('.material-icons');
            if (iconElement) {
                iconElement.textContent = theme.icon;
            }
            
            const textElement = themeBtn.querySelector('span:not(.material-icons)');
            if (textElement) {
                textElement.textContent = theme.name;
            }
        }
    }
    
    cycleThemes() {
        const currentTheme = this.getCurrentTheme();
        const themeIds = this.themes.map(t => t.id);
        
        const currentIndex = themeIds.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themeIds.length;
        
        this.setTheme(themeIds[nextIndex], true);
        this.updateThemeButtonUI();
    }
    
    getCurrentTheme() {
        return localStorage.getItem('theme') || 'rouge';
    }
    
    showToast(message) {
        this.clearToast();
        
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 600;
            z-index: 9999;
            animation: fadeIn 0.3s ease-out;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            this.clearToast();
        }, 3000);
    }
    
    clearToast() {
        const existingToast = document.querySelector('[style*="bottom: 80px"][style*="fixed"]');
        if (existingToast && existingToast.parentNode) {
            existingToast.parentNode.removeChild(existingToast);
        }
    }
}

// ============================================
// 2. GESTIONNAIRE DE SIDEBAR
// ============================================

class SidebarManager {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.menuButton = document.getElementById('menuButton');
        this.closeButton = document.getElementById('closeSidebar');
        
        this.init();
    }
    
    init() {
        if (this.menuButton) {
            this.menuButton.addEventListener('click', () => this.open());
        }
        
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.close());
        }
        
        // Fermer en cliquant en dehors
        document.addEventListener('click', (e) => {
            if (this.sidebar && this.sidebar.classList.contains('active')) {
                if (!this.sidebar.contains(e.target) && !this.menuButton.contains(e.target)) {
                    this.close();
                }
            }
        });
        
        console.log('✅ SidebarManager initialisé');
    }
    
    open() {
        if (this.sidebar) {
            this.sidebar.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    close() {
        if (this.sidebar) {
            this.sidebar.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
}

// ============================================
// 3. GESTIONNAIRE DE WIDGETS LATÉRAUX
// ============================================

class WidgetSidebarManager {
    constructor() {
        this.weatherSidebar = document.getElementById('weatherSidebar');
        this.weatherToggle = document.getElementById('weatherToggle');
        
        this.quickLinksSidebar = document.getElementById('quickLinksSidebar');
        this.quickLinksToggle = document.getElementById('quickLinksToggle');
        
        this.init();
    }
    
    init() {
        // Weather sidebar
        if (this.weatherToggle) {
            this.weatherToggle.addEventListener('click', () => {
                this.toggleWeather();
            });
        }
        
        const weatherClose = this.weatherSidebar?.querySelector('.sidebar-close');
        if (weatherClose) {
            weatherClose.addEventListener('click', () => {
                this.closeWeather();
            });
        }
        
        // Quick links sidebar
        if (this.quickLinksToggle) {
            this.quickLinksToggle.addEventListener('click', () => {
                this.toggleQuickLinks();
            });
        }
        
        const quickLinksClose = this.quickLinksSidebar?.querySelector('.sidebar-close');
        if (quickLinksClose) {
            quickLinksClose.addEventListener('click', () => {
                this.closeQuickLinks();
            });
        }
        
        console.log('✅ WidgetSidebarManager initialisé');
    }
    
    toggleWeather() {
        if (this.weatherSidebar) {
            this.weatherSidebar.classList.toggle('active');
        }
    }
    
    closeWeather() {
        if (this.weatherSidebar) {
            this.weatherSidebar.classList.remove('active');
        }
    }
    
    toggleQuickLinks() {
        if (this.quickLinksSidebar) {
            this.quickLinksSidebar.classList.toggle('active');
        }
    }
    
    closeQuickLinks() {
        if (this.quickLinksSidebar) {
            this.quickLinksSidebar.classList.remove('active');
        }
    }
}

// ============================================
// 4. GESTIONNAIRE DE SWIPER
// ============================================

class SwiperManager {
    constructor() {
        this.swiper = null;
        this.init();
    }
    
    async init() {
        // Attendre que Swiper soit chargé
        if (typeof Swiper === 'undefined') {
            console.warn('⏳ Swiper non encore chargé, attente...');
            setTimeout(() => this.init(), 100);
            return;
        }
        
        this.initSwiper();
        console.log('✅ SwiperManager initialisé');
    }
    
    initSwiper() {
        this.swiper = new Swiper('#newsSwiper', {
            slidesPerView: 1,
            spaceBetween: 0,
            loop: false,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
                dynamicBullets: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            effect: 'slide',
            speed: 600,
        });
        
        console.log('🎪 Swiper initialisé');
    }
    
    addSlide(content) {
        if (this.swiper) {
            // Supprimer le slide de chargement si c'est le premier
            const wrapper = document.getElementById('swiperWrapper');
            const loadingSlide = wrapper.querySelector('.loading-slide');
            if (loadingSlide) {
                loadingSlide.remove();
            }
            
            this.swiper.appendSlide(content);
        }
    }
    
    removeAllSlides() {
        if (this.swiper) {
            this.swiper.removeAllSlides();
        }
    }
}

// ============================================
// 5. GESTIONNAIRE D'HORLOGE
// ============================================

class ClockManager {
    constructor() {
        this.clockTime = document.getElementById('clockTime');
        this.clockDate = document.getElementById('clockDate');
        
        this.init();
    }
    
    init() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
        console.log('✅ ClockManager initialisé');
    }
    
    updateClock() {
        const now = new Date();
        
        // Heure
        if (this.clockTime) {
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            this.clockTime.textContent = `${hours}:${minutes}`;
        }
        
        // Date
        if (this.clockDate) {
            const options = { weekday: 'short', day: 'numeric', month: 'short' };
            const dateStr = now.toLocaleDateString('fr-FR', options);
            this.clockDate.textContent = dateStr;
        }
    }
}

// ============================================
// 6. GESTIONNAIRE PWA (INSTALLATION)
// ============================================

class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = document.getElementById('installButton');
        
        this.init();
    }
    
    init() {
        // Écouter l'événement beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            
            if (this.installButton) {
                this.installButton.style.display = 'flex';
            }
        });
        
        // Gérer le clic sur le bouton d'installation
        if (this.installButton) {
            this.installButton.addEventListener('click', () => {
                this.install();
            });
        }
        
        // Écouter l'installation
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA installée');
            this.deferredPrompt = null;
            
            if (this.installButton) {
                this.installButton.style.display = 'none';
            }
        });
        
        console.log('✅ PWAManager initialisé');
    }
    
    async install() {
        if (!this.deferredPrompt) {
            alert('L\'application est déjà installée ou ne peut pas être installée.');
            return;
        }
        
        this.deferredPrompt.prompt();
        
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log(`Installation: ${outcome}`);
        
        this.deferredPrompt = null;
    }
}

// ============================================
// 7. GESTIONNAIRE DE NAVIGATION BOTTOM
// ============================================

class SettingsManager {
    constructor() {
        this.settingsButton = document.getElementById('settingsButton');
        this.init();
    }
    
    init() {
        if (this.settingsButton) {
            this.settingsButton.addEventListener('click', () => {
                this.openSettings();
            });
        }
        console.log('✅ SettingsManager initialisé');
    }
    
    openSettings() {
        // Pour l'instant, on affiche une alerte
        // TODO: Créer une vraie modal de paramètres
        alert('⚙️ Paramètres\n\nCette fonctionnalité sera disponible dans la prochaine session.\n\nVous pourrez configurer:\n- Taille des polices\n- Notifications\n- Préférences d\'affichage\n- Et plus encore !');
        console.log('⚙️ Paramètres ouverts');
    }
}

class ChatManager {
    constructor() {
        this.chatToggle = document.getElementById('chatToggle');
        this.init();
    }
    
    init() {
        if (this.chatToggle) {
            this.chatToggle.addEventListener('click', () => {
                this.openChat();
            });
        }
        console.log('✅ ChatManager initialisé');
    }
    
    openChat() {
        // Pour l'instant, on affiche une alerte
        // TODO: Intégrer le vrai système de chat
        alert('💬 Chat Communautaire\n\nCette fonctionnalité sera intégrée dans la Session 4.\n\nVous pourrez:\n- Discuter en temps réel\n- Partager des actualités\n- Rejoindre la communauté locale\n\nÀ bientôt !');
        console.log('💬 Chat ouvert');
    }
}

class BottomNavManager {
    constructor() {
        this.layoutToggle = document.getElementById('layoutToggle');
        this.chatToggle = document.getElementById('chatToggle');
        this.donateButton = document.getElementById('donateButton');
        
        this.init();
    }
    
    init() {
        if (this.layoutToggle) {
            this.layoutToggle.addEventListener('click', () => {
                this.toggleLayout();
            });
        }
        
        if (this.donateButton) {
            this.donateButton.addEventListener('click', () => {
                window.open('https://www.buymeacoffee.com/actuetmedia', '_blank');
            });
        }
        
        console.log('✅ BottomNavManager initialisé');
    }
    
    toggleLayout() {
        const tilesGrid = document.getElementById('tilesGrid');
        if (tilesGrid) {
            tilesGrid.classList.toggle('list-view');
            console.log('🔄 Vue changée');
        }
    }
}

// ============================================
// 8. FONCTIONS UTILITAIRES
// ============================================

function showEmergencyNumbers(event) {
    event.preventDefault();
    
    const message = `
🚨 NUMÉROS D'URGENCE 🚨

🚒 Pompiers : 18
👮 Police : 17
🏥 SAMU : 15
🇪🇺 Numéro d'urgence européen : 112

📞 Ces numéros sont gratuits et joignables 24h/24
    `;
    
    alert(message);
}

function openGalleryPage() {
    window.location.href = '/galerie-photos.html';
}

function openCinemaModal() {
    console.log('🎬 Cinéma modal (à implémenter)');
    // TODO: Ouvrir modal cinéma
}

function openSubmitModal() {
    console.log('📝 Modal soumission (à implémenter)');
    // TODO: Ouvrir modal soumission
}

// ============================================
// 9. INITIALISATION GLOBALE
// ============================================

class AppInitializer {
    constructor() {
        this.managers = {};
        this.init();
    }
    
    async init() {
        console.log('🚀 Initialisation d\'Actu & Média...');
        
        // Attendre que le DOM soit prêt
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initManagers());
        } else {
            this.initManagers();
        }
    }
    
    initManagers() {
        try {
            // Initialiser tous les gestionnaires
            this.managers.theme = new ThemeManager();
            this.managers.sidebar = new SidebarManager();
            this.managers.widgetSidebar = new WidgetSidebarManager();
            this.managers.swiper = new SwiperManager();
            this.managers.clock = new ClockManager();
            this.managers.pwa = new PWAManager();
            this.managers.settings = new SettingsManager();
            this.managers.chat = new ChatManager();
            this.managers.bottomNav = new BottomNavManager();
            
            console.log('✅ Tous les gestionnaires initialisés');
            console.log('🎉 Actu & Média prêt !');
            
            // Rendre les gestionnaires accessibles globalement
            window.appManagers = this.managers;
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
        }
    }
}

// ============================================
// 10. DÉMARRAGE DE L'APPLICATION
// ============================================

const app = new AppInitializer();

// Exposer certaines fonctions globalement pour les onclick
window.showEmergencyNumbers = showEmergencyNumbers;
window.openGalleryPage = openGalleryPage;
window.openCinemaModal = openCinemaModal;
window.openSubmitModal = openSubmitModal;
