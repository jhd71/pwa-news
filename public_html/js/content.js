class ContentManager {
    constructor() {
    this.tileContainer = null;
    this.currentTheme = localStorage.getItem('theme') || 'rouge';
    this.fontSize = localStorage.getItem('fontSize') || 'normal';
    this.fontFamily = localStorage.getItem('fontFamily') || 'system'; // Cette ligne existe mais vérifiez qu'elle est bien prise en compte
    this.textContrast = localStorage.getItem('textContrast') || 'normal'; // Cette ligne existe mais vérifiez qu'elle est bien prise en compte
    this.deferredPrompt = null;
}

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

// À ajouter après la méthode init()
setupIOSOptimizations() {
    if (!window.isIOSDevice) return;
    
    console.log("Application des optimisations iOS dans ContentManager");
    
    // Fix pour les événements touch iOS
    this.setupIOSTouchEvents();
    
    // Fix pour le Swiper sur iOS (desktop uniquement)
    this.setupIOSSwiper();
    
    // Fix pour les modales et sidebars iOS
    this.setupIOSModals();
    
    // Fix pour la rotation d'écran iOS
    this.setupIOSOrientation();
}

setupIOSTouchEvents() {
    // Optimiser les événements touch pour iOS
    document.addEventListener('touchstart', function(){}, {passive: true});
    document.addEventListener('touchmove', function(){}, {passive: true});
    
    // Fix pour les tuiles sur iOS
    const tiles = document.querySelectorAll('.tile');
    tiles.forEach(tile => {
        tile.style.webkitTapHighlightColor = 'rgba(0,0,0,0.1)';
        tile.style.webkitTouchCallout = 'none';
        
        // Feedback tactile iOS
        tile.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        }, {passive: true});
        
        tile.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        }, {passive: true});
    });
}

setupIOSSwiper() {
    // Swiper uniquement sur grand écran, même sur iOS
    if (window.innerWidth <= 1024) return;
    
    // Attendre que Swiper soit chargé
    setTimeout(() => {
        if (typeof Swiper !== 'undefined' && document.querySelector('.swiper')) {
            // Configuration Swiper optimisée pour iOS desktop
            const swiperConfig = {
                slidesPerView: 1,
                spaceBetween: 0,
                loop: true,
                autoplay: {
                    delay: 8000,
                    disableOnInteraction: false,
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                // Options spécifiques iOS Safari
                touchEventsTarget: 'container',
                simulateTouch: true,
                allowTouchMove: true,
                touchStartPreventDefault: false,
                touchStartForcePreventDefault: false,
                on: {
                    init: function() {
                        console.log('Swiper iOS initialisé');
                        // Force un update pour iOS
                        setTimeout(() => this.update(), 100);
                    }
                }
            };
            
            // Initialiser Swiper
            window.swiper = new Swiper('.swiper', swiperConfig);
        }
    }, 1000);
}

setupIOSModals() {
    // Fix pour les modales et sidebars sur iOS
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.addEventListener('touchmove', function(e) {
            e.stopPropagation();
        }, {passive: false});
    }
    
    // Observer pour les futures modales
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.classList && (node.classList.contains('modal') || 
                        node.classList.contains('settings-menu') ||
                        node.classList.contains('news-panel'))) {
                        
                        // Optimiser pour iOS
                        node.style.webkitOverflowScrolling = 'touch';
                        node.style.transform = 'translateZ(0)';
                        
                        node.addEventListener('touchmove', function(e) {
                            e.stopPropagation();
                        }, {passive: false});
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

setupIOSOrientation() {
    // Gestion de la rotation d'écran iOS
    window.addEventListener('orientationchange', () => {
        // Fix viewport iOS
        setTimeout(() => {
            if (window.setIOSVH) {
                window.setIOSVH();
            }
            
            // Réinitialiser le Swiper si nécessaire
            if (window.swiper && window.innerWidth > 1024) {
                window.swiper.update();
            }
            
            // Forcer un reflow
            document.body.style.height = window.innerHeight + 'px';
            setTimeout(() => {
                document.body.style.height = '';
            }, 500);
        }, 500);
    });
}

// Méthode améliorée pour showSettings (iOS)
showSettings() {
    const existingPanel = document.querySelector('.settings-menu');
    if (existingPanel) {
        existingPanel.classList.remove('open');
        document.body.classList.remove('settings-open');
        const settingsButton = document.getElementById('settingsButton');
        if (settingsButton) {
            settingsButton.classList.remove('active');
        }
        setTimeout(() => {
            existingPanel.remove();
        }, 300);
        return;
    }

    document.body.classList.add('settings-open');
    
    const settingsOverlay = document.createElement('div');
    settingsOverlay.className = 'menu-overlay';
    settingsOverlay.classList.add('visible');
    document.body.appendChild(settingsOverlay);
    document.body.classList.add('overlay-active');

    const panel = document.createElement('div');
    panel.className = 'settings-menu';
    
    // Optimisation iOS pour le panel
    if (window.isIOSDevice) {
        panel.style.webkitOverflowScrolling = 'touch';
        panel.style.transform = 'translateZ(0)';
    }
    
    panel.innerHTML = `
    <div class="settings-header">
        <h3>Paramètres d'affichage</h3>
        <button type="button" class="close-btn">
            <span class="material-icons">close</span>
        </button>
    </div>
    <div class="settings-content">
        <p class="settings-intro">Ces options personnalisent l'apparence des tuiles de navigation.</p>
        
        <div class="settings-section">
            <h4>Taille du texte</h4>
            <div class="font-size-tiles">
                <div class="font-size-tile ${this.fontSize === 'small' ? 'active' : ''}" data-font-size="small">
                    <span>Petit</span>
                </div>
                <div class="font-size-tile ${this.fontSize === 'normal' ? 'active' : ''}" data-font-size="normal">
                    <span>Normal</span>
                </div>
                <div class="font-size-tile font-size-large ${this.fontSize === 'large' ? 'active' : ''}" data-font-size="large">
                    <span>Grand</span>
                </div>
            </div>
        </div>
        
        <div class="settings-section">
            <h4>Police de caractères</h4>
            <div class="font-family-tiles">
                <div class="font-family-tile ${this.fontFamily === 'system' ? 'active' : ''}" data-font-family="system">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, sans-serif">Système</span>
                </div>
                <div class="font-family-tile ${this.fontFamily === 'roboto' ? 'active' : ''}" data-font-family="roboto">
                    <span style="font-family: 'Roboto', sans-serif">Roboto</span>
                </div>
                <div class="font-family-tile ${this.fontFamily === 'opensans' ? 'active' : ''}" data-font-family="opensans">
                    <span style="font-family: 'Open Sans', sans-serif">Open Sans</span>
                </div>
                <div class="font-family-tile ${this.fontFamily === 'montserrat' ? 'active' : ''}" data-font-family="montserrat">
                    <span style="font-family: 'Montserrat', sans-serif">Montserrat</span>
                </div>
            </div>
        </div>

        <div class="settings-section">
            <h4>Contraste du texte</h4>
            <div class="text-contrast-tiles">
                <div class="text-contrast-tile ${this.textContrast === 'normal' ? 'active' : ''}" data-text-contrast="normal">
                    <span>Normal</span>
                </div>
                <div class="text-contrast-tile ${this.textContrast === 'high' ? 'active' : ''}" data-text-contrast="high">
                    <span>Élevé</span>
                </div>
                <div class="text-contrast-tile ${this.textContrast === 'very-high' ? 'active' : ''}" data-text-contrast="very-high">
                    <span>Très élevé</span>
                </div>
            </div>
        </div>
`;

    document.body.appendChild(panel);
    
    // Indiquer visuellement que le bouton settings est actif
    const settingsButton = document.getElementById('settingsButton');
    if (settingsButton) {
        settingsButton.classList.add('active');
    }
    
    // Animation d'ouverture
    requestAnimationFrame(() => {
        panel.classList.add('open');
    });

    // Gestionnaires d'événements optimisés pour iOS
    const closeBtn = panel.querySelector('.close-btn');
    if (closeBtn) {
        const closeHandler = (e) => {
            e.stopPropagation();
            panel.classList.remove('open');
            document.body.classList.remove('settings-open');
            settingsOverlay.remove();
            document.body.classList.remove('overlay-active');
            
            if (settingsButton) {
                settingsButton.classList.remove('active');
            }
            setTimeout(() => panel.remove(), 300);
        };
        
        // Utiliser touchstart sur iOS, click sur desktop
        if (window.isIOSDevice) {
            closeBtn.addEventListener('touchstart', closeHandler, {passive: false});
        } else {
            closeBtn.addEventListener('click', closeHandler);
        }
    }

    // Fermeture par overlay
    settingsOverlay.addEventListener(window.isIOSDevice ? 'touchstart' : 'click', (e) => {
        e.preventDefault();
        panel.classList.remove('open');
        document.body.classList.remove('settings-open');
        settingsOverlay.remove();
        document.body.classList.remove('overlay-active');
        
        if (settingsButton) {
            settingsButton.classList.remove('active');
        }
        
        setTimeout(() => panel.remove(), 300);
    });

    // Système de verrouillage pour éviter les problèmes lors du changement de taille
    let isChangingFontSize = false;

    // Gestionnaires optimisés pour iOS
    panel.querySelectorAll('.font-size-tile').forEach(tile => {
        const eventType = window.isIOSDevice ? 'touchstart' : 'click';
        
        tile.addEventListener(eventType, (e) => {
            e.stopPropagation();
            
            if (isChangingFontSize) return;
            isChangingFontSize = true;
            
            // Feedback visuel immédiat
            panel.querySelectorAll('.font-size-tile').forEach(t => {
                t.classList.remove('active');
            });
            tile.classList.add('active');
            
            const size = tile.dataset.fontSize;
            
            setTimeout(() => {
                this.changeFontSize(size);
                setTimeout(() => {
                    isChangingFontSize = false;
                }, 500);
            }, 50);
        }, { passive: false });
    });

    // Même logique pour les autres tiles...
    panel.querySelectorAll('.font-family-tile').forEach(tile => {
        const eventType = window.isIOSDevice ? 'touchstart' : 'click';
        
        tile.addEventListener(eventType, (e) => {
            e.stopPropagation();
            
            panel.querySelectorAll('.font-family-tile').forEach(t => {
                t.classList.remove('active');
            });
            tile.classList.add('active');
            
            const fontFamily = tile.dataset.fontFamily;
            setTimeout(() => {
                this.changeFontFamily(fontFamily);
            }, 50);
        }, { passive: false });
    });

    panel.querySelectorAll('.text-contrast-tile').forEach(tile => {
        const eventType = window.isIOSDevice ? 'touchstart' : 'click';
        
        tile.addEventListener(eventType, (e) => {
            e.stopPropagation();
            
            panel.querySelectorAll('.text-contrast-tile').forEach(t => {
                t.classList.remove('active');
            });
            tile.classList.add('active');
            
            const textContrast = tile.dataset.textContrast;
            setTimeout(() => {
                this.changeTextContrast(textContrast);
            }, 50);
        }, { passive: false });
    });

    // Empêcher la fermeture sur iOS avec touchmove
    if (window.isIOSDevice) {
        panel.addEventListener('touchmove', (e) => {
            e.stopPropagation();
        }, { passive: false });
    }
}

    setup() {
        this.tileContainer = document.getElementById('tileContainer');
        if (!this.tileContainer) {
            console.error('Container de tuiles non trouvé');
            return;
        }
        document.documentElement.setAttribute('data-font-size', this.fontSize);
        this.setupEventListeners();
    this.setupLayout();
    this.setupTheme();
    this.setupFontSize();
    this.setupFontFamily();
    this.setupTextContrast();
    this.setupTiles();
	this.autoEnhanceTileVisibility(); // LIGNE EXISTANTE
	this.setupTransparencyControl(); // NOUVELLE LIGNE
	this.fixListModeLayout(); // NOUVELLE LIGNE
	this.updateActiveNavLinks();
	this.setupIOSOptimizations();
	}

    setupEventListeners() {
        // Gestion du menu
const menuButton = document.getElementById('menuButton');
const sidebar = document.getElementById('sidebar');

if (menuButton && sidebar) {
    const sidebarCloseBtn = sidebar.querySelector('.close-btn');
    
    // Créer un overlay pour le menu
    let menuOverlay = document.createElement('div');
    menuOverlay.className = 'menu-overlay';
    document.body.appendChild(menuOverlay);
    
    // Gestion du clic sur le bouton du menu
    menuButton.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        
        // Si le menu est ouvert, afficher l'overlay
        if (sidebar.classList.contains('open')) {
            menuOverlay.classList.add('visible');
            document.body.classList.add('overlay-active');
        } else {
            menuOverlay.classList.remove('visible');
            document.body.classList.remove('overlay-active');
        }
    });
    
    // Gestion du clic sur le bouton de fermeture
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', () => {
            sidebar.classList.remove('open');
            menuOverlay.classList.remove('visible');
            document.body.classList.remove('overlay-active');
        });
    }
    
    // Gestion du clic sur l'overlay
    menuOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        menuOverlay.classList.remove('visible');
        document.body.classList.remove('overlay-active');
    });
    
    // Conserver le gestionnaire de clic existant
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('open') &&
            !sidebar.contains(e.target) &&
            !menuButton.contains(e.target) &&
            !menuOverlay.contains(e.target)) {
            sidebar.classList.remove('open');
            menuOverlay.classList.remove('visible');
            document.body.classList.remove('overlay-active');
        }
    });
}

        // Boutons de navigation
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', this.toggleTheme.bind(this));
        }

        const layoutToggle = document.getElementById('layoutToggle');
        if (layoutToggle) {
            layoutToggle.addEventListener('click', this.toggleLayout.bind(this));
        }

        const settingsButton = document.getElementById('settingsButton');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                const existingPanel = document.querySelector('.settings-menu');
                if (existingPanel) {
                    existingPanel.classList.remove('open');
                    setTimeout(() => {
                        existingPanel.remove();
                    }, 300);
                }
                this.showSettings();
            });
        }

        const addSiteBtn = document.getElementById('addSiteBtn');
        if (addSiteBtn) {
            addSiteBtn.addEventListener('click', this.showAddSiteDialog.bind(this));
        }

	this.updateActiveNavLinks();
// AJOUTEZ VOTRE CODE ICI - Gestion des liens actifs dans la navigation du bas
    document.querySelectorAll('.bottom-nav .nav-item').forEach(navItem => {
        const link = navItem.getAttribute('href');
        const currentPath = window.location.pathname;
        
        // Vérifier si c'est le chemin actuel
        if (currentPath.endsWith(link)) {
            navItem.classList.add('active');
        } else {
            navItem.classList.remove('active');
        }
    });
        // Installation PWA
        window.addEventListener('beforeinstallprompt', (e) => {
            this.deferredPrompt = e;
            
            // Ajouter cette ligne pour afficher notre bannière personnalisée
            this.showInstallBanner();
            
            // Conserver le code existant pour le bouton du menu
            const menuInstall = document.getElementById('menuInstall');
            if (menuInstall) {
                menuInstall.classList.add('visible');
                menuInstall.addEventListener('click', () => {
                    if (this.deferredPrompt) {
                        this.deferredPrompt.prompt();
                        this.deferredPrompt.userChoice.then((choiceResult) => {
                            if (choiceResult.outcome === 'accepted') {
                                console.log('Application installée');
                                menuInstall.classList.remove('visible');
                            }
                            this.deferredPrompt = null;
                        }).catch((error) => {
                            console.error('Erreur lors du choix de l\'utilisateur:', error);
                            this.showToast('Erreur lors de l\'installation de l\'application');
                        });
                    }
                });
            }
        });

        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            const menuInstall = document.getElementById('menuInstall');
            if (menuInstall) {
                menuInstall.classList.remove('visible');
            }
        });
    }

    setupLayout() {
        const savedLayout = localStorage.getItem('layout') || 'grid';
        this.setLayout(savedLayout);
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.currentTheme = savedTheme;
        
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Mettre à jour l'icône appropriée
        this.updateThemeIcon();
    }

    setupFontSize() {
        document.documentElement.setAttribute('data-font-size', this.fontSize);
    }
// À ajouter dans votre classe ContentManager
setupTVIcons() {
  // Attendre que les tuiles soient chargées
  setTimeout(() => {
    // Récupérer toutes les tuiles TV
    const tvTiles = document.querySelectorAll('.tile[data-category="tv"]');
    
    // Parcourir chaque tuile TV
    tvTiles.forEach(tile => {
      const titleElement = tile.querySelector('.tile-title');
      if (!titleElement) return;
      
      const title = titleElement.textContent.trim();
      
      // Ajouter des classes spécifiques en fonction du titre
      if (title.includes('FR3') || title.includes('France 3')) {
        tile.classList.add('tile-france3');
      }
      else if (title.includes('BFMTV')) {
        tile.classList.add('tile-bfmtv');
      }
      else if (title.includes('CNews')) {
        tile.classList.add('tile-cnews');
      }
      else if (title.includes('FranceTV') || title.includes('France TV')) {
        tile.classList.add('tile-francetv');
      }
    });
    
    console.log('Classes TV ajoutées avec succès');
  }, 500); // Léger délai pour s'assurer que les tuiles sont chargées
}

    setupTiles() {
        if (!this.tileContainer) return;

        this.tileContainer.innerHTML = '';
        
        // Séparateur Actualités
        const separator0 = document.createElement('div');
        separator0.className = 'separator';
        separator0.innerHTML = `<img src="images/ActualitesLocales.png" alt="Actualités Locales" class="separator-img">`;
        this.tileContainer.appendChild(separator0);
        
        // Actualités locales
        const newsDefaultSites = [			
  {
    title: '📰 Montceau News',
    url: 'https://montceau-news.com/',
    mobileUrl: 'https://montceau-news.com/',
    isDefault: true,
    category: 'news'
  },
  {
    title: '🗞️ L\'Informateur de Bourgogne',
    url: 'https://linformateurdebourgogne.com/',
    mobileUrl: 'https://linformateurdebourgogne.com/',
    isDefault: true,
    category: 'news'
  },
  {
    title: '📰 Le JSL',
    url: 'https://www.lejsl.com/edition-montceau-les-mines',
    mobileUrl: 'https://www.lejsl.com/edition-montceau-les-mines',
    isDefault: true,
    category: 'news'
  },
  {
    title: '🗞️ Creusot Infos',
    url: 'https://www.creusot-infos.com',
    mobileUrl: 'https://www.creusot-infos.com/?m=1',
    isDefault: true,
    category: 'news'
  },
  {
    title: '🚨 Faits Divers Saône-et-Loire',
    url: 'https://faitsdivers365.fr/bourgogne-franche-comte/saone-et-loire/',
    mobileUrl: 'https://faitsdivers365.fr/bourgogne-franche-comte/saone-et-loire/',
    isDefault: true,
    category: 'news'
  },
  {
    title: '🗞️ Mâcon-Infos',
    url: 'https://macon-infos.com/fr/faits-divers/macon',
    mobileUrl: 'https://macon-infos.com/fr/faits-divers/macon',
    isDefault: true,
    category: 'news'
  }
	];

	// Ajouter la tuile Photos séparément après la liste des sites d'actualités


// NOUVELLE TUILE DIAPORAMA
const slideshowTile = {
    title: "🎞️ Galerie<br>Photos", 
    url: "#slideshow",
    mobileUrl: "#slideshow",
    isDefault: true,
    category: "photos",
    isSlideshow: true
};

// Créer les tuiles d'actualités
newsDefaultSites.forEach(site => {
    const tile = this.createTile(site);
    this.tileContainer.appendChild(tile);
});

// AJOUTER LA TUILE DIAPORAMA
const slideshowTileElement = this.createTile(slideshowTile);
this.tileContainer.appendChild(slideshowTileElement);

        // Séparateur Radio
        const separator1 = document.createElement('div');
        separator1.className = 'separator';
        separator1.innerHTML = `<img src="images/Radio.png" alt="Radio" class="separator-img">`;
        this.tileContainer.appendChild(separator1);

        // Section Radio
        const radioSites = [		
  {
    title: 'France Bleu<br>Bourgogne',
    url: 'https://www.radio-en-ligne.fr/france-bleu-bourgogne',
    mobileUrl: 'https://www.radio-en-ligne.fr/france-bleu-bourgogne',
    isDefault: true,
    category: 'radio'
  },
  {
    title: 'Radios de Bourgogne',
    url: 'https://ecouterradioenligne.com/region/bourgogne/#prevert-chalon',
    mobileUrl: 'https://ecouterradioenligne.com/region/bourgogne/#prevert-chalon',
    isDefault: true,
    category: 'radio'
  },
  {
    title: 'Radio Sans Pub',
    url: 'https://www.radio-en-ligne.fr/radio-sans-pub/',
    mobileUrl: 'https://www.radio-en-ligne.fr/radio-sans-pub/',
    isDefault: true,
    category: 'radio'
  }
];

        radioSites.forEach(site => {
            const tile = this.createTile(site);
            this.tileContainer.appendChild(tile);
        });

        // Séparateur TV
        const separator2 = document.createElement('div');
        separator2.className = 'separator';
        separator2.innerHTML = `<img src="images/TVenDirect.png" alt="TV en Direct" class="separator-img">`;
        this.tileContainer.appendChild(separator2);

        // Section TV
const tvSites = [
  {
    title: 'France 3<br>Bourgogne',
    url: 'https://www.francebleu.fr/tv/direct/bourgogne',
    mobileUrl: 'https://www.francebleu.fr/tv/direct/bourgogne',
    isDefault: true,
    category: 'tv',
    isLive: true
  },
    {
        title: 'BFMTV',
        url: 'https://www.bfmtv.com/en-direct/',
        mobileUrl: 'https://www.bfmtv.com/en-direct/',
        isDefault: true,
        category: 'tv',
        isLive: true
    },
    {
        title: 'CNews',
        url: 'https://www.cnews.fr/le-direct',
        mobileUrl: 'https://www.cnews.fr/le-direct',
        isDefault: true,
        category: 'tv',
        isLive: true
    },
    {
        title: 'FranceTV Info',
        url: 'https://www.francetvinfo.fr/en-direct/tv.html',
        mobileUrl: 'https://www.francetvinfo.fr/en-direct/tv.html',
        isDefault: true,
        category: 'tv',
        isLive: true
    }
];

        tvSites.forEach(site => {
            const tile = this.createTile(site);
            this.tileContainer.appendChild(tile);
        });

        // Séparateur Sports
        const sportsSeparator = document.createElement('div');
        sportsSeparator.className = 'separator';
        sportsSeparator.innerHTML = `<img src="images/SPORTS.png" alt="Sports" class="separator-img">`;
        this.tileContainer.appendChild(sportsSeparator);

        // Section Sports
        const sportsSites = [
  {
    title: '⚽ Foot Ligue 1',
    url: 'https://ligue1.fr/fr/competitions/ligue1mcdonalds?tab=news&ranking=scorers',
    mobileUrl: 'https://ligue1.fr/fr/competitions/ligue1mcdonalds?tab=news&ranking=scorers',
    isDefault: true,
    category: 'sports'
  },
  {
    title: '⚽ Foot Ligue 2',
    url: 'https://ligue1.fr/fr/competitions/ligue2bkt?tab=news',
    mobileUrl: 'https://ligue1.fr/fr/competitions/ligue2bkt?tab=news',
    isDefault: true,
    category: 'sports'
  },
  {
    title: '⚽ Foot<br>FC Montceau-Bourgogne',
    url: 'https://www.footmercato.net/club/fc-montceau-bourgogne/classement',
    mobileUrl: 'https://www.footmercato.net/club/fc-montceau-bourgogne/classement',
    isDefault: true,
    category: 'sports'
  },
  {
    title: '🆚 Foot-Live',
    url: 'https://www.footmercato.net/live/',
    mobileUrl: 'https://www.footmercato.net/live/',
    isDefault: true,
    category: 'sports'
  },
  {
    title: '🏀 ELAN<br>Chalon Basket',
    url: 'https://scorenco.com/basket/clubs/elan-chalon-basket-2m40/1-4xe3',
    mobileUrl: 'https://www.elanchalon.com/',
    isDefault: true,
    category: 'sports'
  },
  {
    title: '🏉 Rugby<br>RC Montceau Bourgogne',
    url: 'https://scorenco.com/rugby/clubs/rc-montceau-bourgogne-2m2t',
    mobileUrl: 'https://scorenco.com/rugby/clubs/rc-montceau-bourgogne-2m2t',
    isDefault: true,
    category: 'sports'
  },
  {
    title: '🚴 Cyclisme',
    url: 'https://rmcsport.bfmtv.com/cyclisme/',
    mobileUrl: 'https://rmcsport.bfmtv.com/cyclisme/',
    isDefault: true,
    category: 'sports'
  }
];

        sportsSites.forEach(site => {
            const tile = this.createTile(site);
            this.tileContainer.appendChild(tile);
        });

        // Séparateur Réseaux Sociaux
        const separator3 = document.createElement('div');
        separator3.className = 'separator';
        separator3.innerHTML = `<img src="images/ReseauxSociaux.png" alt="Réseaux Sociaux" class="separator-img">`;
        this.tileContainer.appendChild(separator3);

        // Section Réseaux Sociaux
        const socialSites = [
  {
    title: '📊 Sondage<br>Actu & Média',
    url: '#survey', // URL spéciale pour le sondage
    mobileUrl: '#survey',
    isDefault: true,
    category: 'social',
    isSurvey: true // Marqueur spécial
  },
  {
    title: '▶️ YouTube',
    url: 'https://www.youtube.com/feed/trending',
    mobileUrl: 'https://www.youtube.com/feed/trending',
    isDefault: true,
    category: 'social'
  },
  {
    title: '🟣 Twitch',
    url: 'https://www.twitch.tv/',
    mobileUrl: 'https://www.twitch.tv/',
    isDefault: true,
    category: 'social'
  },
  {
    title: '🎵 TikTok',
    url: 'https://www.tiktok.com/discover?lang=fr',
    mobileUrl: 'https://www.tiktok.com/?lang=fr',
    isDefault: true,
    category: 'social'
  }
];

        socialSites.forEach(site => {
            const tile = this.createTile(site);
            this.tileContainer.appendChild(tile);
        });

        // Sites personnalisés
        try {
            // Créer le séparateur même s'il n'y a pas de sites
            const separator = document.createElement('div');
            separator.className = 'separator';
            separator.innerHTML = `<img src="images/Sites-Personnalise.png" alt="Sites personnalisés">`;
            this.tileContainer.appendChild(separator);

            const saved = localStorage.getItem('customSites');
            if (saved) {
                const customSites = JSON.parse(saved);
                if (Array.isArray(customSites) && customSites.length > 0) {
                    customSites.forEach(site => {
                        // Ajouter la catégorie pour les sites personnalisés
                        const tileWithCategory = {...site, isDefault: false, category: 'custom'};
                        const tile = this.createTile(tileWithCategory);
                        this.tileContainer.appendChild(tile);
                    });
                }
            }
        } catch (error) {
            console.error('Erreur chargement sites personnalisés:', error);
            this.showToast('Erreur lors du chargement des sites personnalisés');
        }
        
        // Animer l'apparition des tuiles
        this.setupTilesWithAnimation();
		this.setupTVIcons();
    }

    createTile(site) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    
    // Ajouter l'attribut data-category pour faciliter le ciblage CSS
    tile.setAttribute('data-category', site.category || 'default');
    // Marquer spécialement la tuile sondage
	if (site.isSurvey) {
    tile.classList.add('survey-tile');
	}
	
	// Marquer spécialement la tuile diaporama
	if (site.isSlideshow) {
    tile.classList.add('slideshow-tile');
	}
	
    // Ajouter des classes conditionnelles pour les designs spéciaux
    if (site.isLive && site.category === 'tv') {
        tile.classList.add('live-content');
    }
    
    // Structure HTML de la tuile
    tile.innerHTML = `
        <div class="tile-content">
            <div class="tile-title">${site.title}</div>
        </div>
    `;

	// Créer l'aperçu pour la tuile diaporama
	this.createTilePreview(tile, site);
    // Stockage de l'URL pour faciliter l'accès
    tile.dataset.siteUrl = site.url;
    tile.dataset.mobileSiteUrl = site.mobileUrl || site.url;
        
    // Gestion du clic normal
	// Remplacez la gestion du clic par :
	tile.addEventListener('click', () => {
    this.animateTileClick(tile);
    
    // Gestion spéciale pour le sondage
	if (site.isSurvey) {
    // Appeler directement la fonction d'ouverture du sondage de survey-manager.js
    if (typeof window.openSurveyModal !== 'undefined') {
        window.openSurveyModal();
    } else {
        // Fallback : déclencher l'événement comme si on cliquait sur le bouton
        setTimeout(() => {
            const surveyModal = document.getElementById('surveyModal');
            if (surveyModal) {
                // Déclencher l'ouverture du modal avec toute la logique
                const event = new CustomEvent('openSurvey');
                document.dispatchEvent(event);
            }
        }, 100);
    }
    return;
	}
    
	// Gestion spéciale pour le diaporama
	if (site.isSlideshow) {
    this.openSlideshowModal();
    return;
	}
    // Vérifier si c'est un lien interne ou externe
    const url = site.mobileUrl || site.url;
    if (url.startsWith('http')) {
        window.open(url, '_blank');
    } else {
        window.location.href = url;
    }
});

        // Menu contextuel (clic droit)
        tile.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showTileMenu(tile, site, e.clientX, e.clientY);
        });

        // Gestion de l'appui long sur mobile avec prévention du scroll
        let longPressTimer;
        let isLongPress = false;
        let lastScrollTime = 0;

        // Détection du scroll (mémorise le moment du dernier scroll)
        window.addEventListener('scroll', () => {
            lastScrollTime = Date.now(); // Enregistre le moment du scroll
        });

        tile.addEventListener('touchstart', (e) => {
            isLongPress = false;

            // Vérifie si le scroll a eu lieu récemment (moins d'1 seconde)
            if (Date.now() - lastScrollTime < 1000) {
                return; // Ignore l'appui long si on vient de scroller
            }

            longPressTimer = setTimeout(() => {
                isLongPress = true;
                const touch = e.touches[0];
                this.showTileMenu(tile, site, touch.clientX, touch.clientY);
            }, 800); // ✅ Augmenté à 800ms pour éviter l'apparition trop rapide
        }, { passive: true });

        tile.addEventListener('touchmove', () => {
            clearTimeout(longPressTimer); // ✅ Annule l'appui long si le doigt bouge (scroll détecté)
        }, { passive: true });

        tile.addEventListener('touchend', (e) => {
            clearTimeout(longPressTimer);
            if (isLongPress) {
                e.preventDefault();
            }
        });

        return tile;
    }

    animateTileClick(tile) {
        // Effet visuel de pression
        tile.classList.add('tile-click');
        
        // Effet de vibration tactile si disponible
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Supprimer la classe après l'animation
        setTimeout(() => {
            tile.classList.remove('tile-click');
        }, 300);
    }

    setupTilesWithAnimation() {
        if (!this.tileContainer) return;
        
        // Récupérer toutes les tuiles
        const tiles = this.tileContainer.querySelectorAll('.tile');
        
        // Ajouter un délai progressif pour chaque tuile
        tiles.forEach((tile, index) => {
            tile.style.setProperty('--tile-index', index);
        });
    }

    showTileMenu(tile, site, x, y) {
        const existingMenu = document.querySelector('.tile-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'tile-menu';

        // Menu interactif réduit (sans l'option "Marquer comme lu")
        menu.innerHTML = `
            ${site.isDefault ? `
                <button class="menu-item">
                    <span class="material-icons">info</span>
                    Site par défaut
                </button>
            ` : `
                <button class="menu-item edit">
                    <span class="material-icons">edit</span>
                    Modifier
                </button>
                <button class="menu-item delete">
                    <span class="material-icons">delete</span>
                    Supprimer
                </button>
            `}
            <button class="menu-item open-mobile">
                <span class="material-icons">phone_android</span>
                Version mobile
            </button>
            <button class="menu-item open-desktop">
                <span class="material-icons">computer</span>
                Version bureau
            </button>
            <button class="menu-item share-site">
                <span class="material-icons">share</span>
                Partager
            </button>
        `;
        document.body.appendChild(menu);

        // Position du menu
        const menuRect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let menuX = Math.min(x, viewportWidth - menuRect.width - 10);
        let menuY = Math.min(y, viewportHeight - menuRect.height - 10);

        menuX = Math.max(10, menuX);
        menuY = Math.max(10, menuY);

        menu.style.position = 'fixed';
        menu.style.left = `${menuX}px`;
        menu.style.top = `${menuY}px`;

        // Gestionnaire d'événements
        menu.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            menu.remove();

            if (button.classList.contains('edit')) {
                this.editSite(site);
            } else if (button.classList.contains('delete')) {
                this.deleteSite(site);
            } else if (button.classList.contains('open-mobile')) {
                window.open(site.mobileUrl || site.url, '_blank');
            } else if (button.classList.contains('open-desktop')) {
                window.open(site.url, '_blank');
            } else if (button.classList.contains('share-site')) {
                this.shareSite(site);
            }
        });

        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
            }
        }, { once: true });
    }

    editSite(site) {
        if (site.isDefault) {
            this.showToast('Les sites par défaut ne peuvent pas être modifiés');
            return;
        }

        const newTitle = prompt('Nouveau titre :', site.title);
        if (!newTitle || newTitle.trim() === '') {
            this.showToast('Le titre est obligatoire');
            return;
        }

        let newUrl = prompt('Nouvelle URL (doit commencer par https://) :', site.url);
        if (!this.validateUrl(newUrl)) {
            this.showToast('URL invalide. L\'URL doit commencer par https://');
            return;
        }

        let newMobileUrl = prompt('Nouvelle URL mobile (optionnel, doit commencer par https://) :', site.mobileUrl);
        if (newMobileUrl && !this.validateUrl(newMobileUrl)) {
            this.showToast('URL mobile invalide. L\'URL doit commencer par https://');
            return;
        }
        try {
            const customSites = JSON.parse(localStorage.getItem('customSites') || '[]');
            const siteIndex = customSites.findIndex(s => s.url === site.url && s.title === site.title);

            if (siteIndex !== -1) {
                customSites[siteIndex] = {
                    title: newTitle.trim(),
                    url: newUrl.trim(),
                    mobileUrl: (newMobileUrl || newUrl).trim(),
                    isDefault: false,
                    category: 'custom',
                    timestamp: Date.now()
                };

                localStorage.setItem('customSites', JSON.stringify(customSites));
                this.setupTiles();
                this.showToast('Site modifié avec succès');
            }
        } catch (error) {
            console.error('Erreur modification site:', error);
            this.showToast('Erreur lors de la modification');
        }
    }

    deleteSite(site) {
        if (site.isDefault) {
            this.showToast('Les sites par défaut ne peuvent pas être modifiés');
            return;
        }

        const shouldDelete = confirm('Voulez-vous vraiment supprimer ce site ?');
        if (!shouldDelete) return;

        try {
            const customSites = JSON.parse(localStorage.getItem('customSites') || '[]');
            const updatedSites = customSites.filter(s =>
                !(s.url === site.url && s.title === site.title)
            );

            localStorage.setItem('customSites', JSON.stringify(updatedSites));
            this.setupTiles();
            this.showToast('Site supprimé avec succès');
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            this.showToast('Erreur lors de la suppression du site');
        }
    }

    validateUrl(url) {
        if (!url) return false;
        url = url.trim();
        if (!url.startsWith('https://')) {
            return false;
        }
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    showToast(message) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

showSettings() {
    const existingPanel = document.querySelector('.settings-menu');
    if (existingPanel) {
        existingPanel.classList.remove('open');
        document.body.classList.remove('settings-open');
        const settingsButton = document.getElementById('settingsButton');
        if (settingsButton) {
            settingsButton.classList.remove('active');
        }
        setTimeout(() => {
            existingPanel.remove();
        }, 300);
        return;
    }

    // Ajouter une classe au body pour indiquer que le panneau est ouvert
    document.body.classList.add('settings-open');
// Créer un overlay pour le menu des paramètres
const settingsOverlay = document.createElement('div');
settingsOverlay.className = 'menu-overlay';
settingsOverlay.classList.add('visible');
document.body.appendChild(settingsOverlay);
document.body.classList.add('overlay-active');

// Fermer le menu quand on clique sur l'overlay
settingsOverlay.addEventListener('click', (e) => {
    e.preventDefault();
    panel.classList.remove('open');
    document.body.classList.remove('settings-open');
    settingsOverlay.remove();
    document.body.classList.remove('overlay-active');
    
    if (settingsButton) {
        settingsButton.classList.remove('active');
    }
    
    setTimeout(() => panel.remove(), 300);
});
    const panel = document.createElement('div');
    panel.className = 'settings-menu';
    panel.innerHTML = `
    <div class="settings-header">
        <h3>Paramètres d'affichage</h3>
        <button type="button" class="close-btn">
            <span class="material-icons">close</span>
        </button>
    </div>
    <div class="settings-content">
        <p class="settings-intro">Ces options personnalisent l'apparence des tuiles de navigation.</p>
        
        <div class="settings-section">
            <h4>Taille du texte</h4>
            <div class="font-size-tiles">
                <div class="font-size-tile ${this.fontSize === 'small' ? 'active' : ''}" data-font-size="small">
                    <span>Petit</span>
                </div>
                <div class="font-size-tile ${this.fontSize === 'normal' ? 'active' : ''}" data-font-size="normal">
                    <span>Normal</span>
                </div>
                <div class="font-size-tile font-size-large ${this.fontSize === 'large' ? 'active' : ''}" data-font-size="large">
                    <span>Grand</span>
                </div>
            </div>
        </div>
        
        <div class="settings-section">
            <h4>Police de caractères</h4>
            <div class="font-family-tiles">
                <div class="font-family-tile ${this.fontFamily === 'system' ? 'active' : ''}" data-font-family="system">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, sans-serif">Système</span>
                </div>
                <div class="font-family-tile ${this.fontFamily === 'roboto' ? 'active' : ''}" data-font-family="roboto">
                    <span style="font-family: 'Roboto', sans-serif">Roboto</span>
                </div>
                <div class="font-family-tile ${this.fontFamily === 'opensans' ? 'active' : ''}" data-font-family="opensans">
                    <span style="font-family: 'Open Sans', sans-serif">Open Sans</span>
                </div>
                <div class="font-family-tile ${this.fontFamily === 'montserrat' ? 'active' : ''}" data-font-family="montserrat">
                    <span style="font-family: 'Montserrat', sans-serif">Montserrat</span>
                </div>
            </div>
        </div>

        <div class="settings-section">
            <h4>Contraste du texte</h4>
            <div class="text-contrast-tiles">
                <div class="text-contrast-tile ${this.textContrast === 'normal' ? 'active' : ''}" data-text-contrast="normal">
                    <span>Normal</span>
                </div>
                <div class="text-contrast-tile ${this.textContrast === 'high' ? 'active' : ''}" data-text-contrast="high">
                    <span>Élevé</span>
                </div>
                <div class="text-contrast-tile ${this.textContrast === 'very-high' ? 'active' : ''}" data-text-contrast="very-high">
                    <span>Très élevé</span>
                </div>
            </div>
        </div>
`;

    document.body.appendChild(panel);
    
    // Indiquer visuellement que le bouton settings est actif
    const settingsButton = document.getElementById('settingsButton');
    if (settingsButton) {
        settingsButton.classList.add('active');
    }
    
    // Laisser le panneau s'ajouter au DOM avant d'animer
    requestAnimationFrame(() => {
        panel.classList.add('open');
    });

    const closeBtn = panel.querySelector('.close-btn');
if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
        // Important: arrêter la propagation pour éviter que le clic atteigne le document
        e.stopPropagation();
        panel.classList.remove('open');
        document.body.classList.remove('settings-open');
        
        // Supprimer l'overlay
        const overlay = document.querySelector('.menu-overlay.visible');
        if (overlay) {
            overlay.remove();
        }
        document.body.classList.remove('overlay-active');
        
        if (settingsButton) {
            settingsButton.classList.remove('active');
        }
        setTimeout(() => panel.remove(), 300);
    });
}

    // Système de verrouillage pour éviter les problèmes lors du changement de taille
    let isChangingFontSize = false;

    // Gestionnaire pour les tuiles de taille de police
    panel.querySelectorAll('.font-size-tile').forEach(tile => {
        // Utiliser touchstart et click pour couvrir tous les cas
        ['touchstart', 'click'].forEach(eventType => {
            tile.addEventListener(eventType, (e) => {
                // IMPORTANT: Arrêter la propagation de l'événement
                e.stopPropagation();
                
                // Ne pas traiter si on est déjà en train de changer
                if (isChangingFontSize) return;
                isChangingFontSize = true;
                
                // Feedback visuel immédiat
                panel.querySelectorAll('.font-size-tile').forEach(t => {
                    t.classList.remove('active');
                });
                tile.classList.add('active');
                
                // Changer la taille de police
                const size = tile.dataset.fontSize;
                
                // Utiliser un délai pour s'assurer que l'interface est mise à jour avant l'animation
                setTimeout(() => {
                    this.changeFontSize(size);
                    // Réinitialiser le verrouillage après un délai
                    setTimeout(() => {
                        isChangingFontSize = false;
                    }, 500);
                }, 50);
            }, { passive: false });
        });
    });

// Ajouter des gestionnaires pour les nouvelles options
panel.querySelectorAll('.font-family-tile').forEach(tile => {
    ['touchstart', 'click'].forEach(eventType => {
        tile.addEventListener(eventType, (e) => {
            e.stopPropagation();
            
            panel.querySelectorAll('.font-family-tile').forEach(t => {
                t.classList.remove('active');
            });
            tile.classList.add('active');
            
            const fontFamily = tile.dataset.fontFamily;
            setTimeout(() => {
                this.changeFontFamily(fontFamily);
            }, 50);
        }, { passive: false });
    });
});

panel.querySelectorAll('.text-contrast-tile').forEach(tile => {
    ['touchstart', 'click'].forEach(eventType => {
        tile.addEventListener(eventType, (e) => {
            e.stopPropagation();
            
            panel.querySelectorAll('.text-contrast-tile').forEach(t => {
                t.classList.remove('active');
            });
            tile.classList.add('active');
            
            const textContrast = tile.dataset.textContrast;
            setTimeout(() => {
                this.changeTextContrast(textContrast);
            }, 50);
        }, { passive: false });
    });
});
    // Empêcher que des clics sur le panneau lui-même ferment celui-ci
    panel.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Fermer le panneau si on clique ailleurs dans le document
    // Utiliser un flag pour ne pas fermer durant les manipulations de taille
    const outsideClickHandler = (e) => {
        // Ne pas fermer si on est en train de changer la taille
        if (isChangingFontSize) return;
        
        // Ne pas fermer si on clique sur le panneau ou le bouton settings
        if (panel.contains(e.target) || (settingsButton && settingsButton.contains(e.target))) {
            return;
        }
        
        // Fermer le panneau
        panel.classList.remove('open');
        document.body.classList.remove('settings-open');
        if (settingsButton) {
            settingsButton.classList.remove('active');
        }
        
        // Nettoyer
        document.removeEventListener('click', outsideClickHandler);
        setTimeout(() => panel.remove(), 300);
    };

    // Ajouter le gestionnaire après un petit délai
    setTimeout(() => {
        document.addEventListener('click', outsideClickHandler);
    }, 100);
}

changeFontSize(size) {
    // Sauvegarder la nouvelle taille de manière persistante
    this.fontSize = size;
    localStorage.setItem('fontSize', size);
    
    // Appliquer la taille au document HTML immédiatement
    document.documentElement.setAttribute('data-font-size', size);
    
    // Force un reflow pour s'assurer que les changements sont appliqués
    document.body.clientWidth;
    
    // Mettre à jour explicitement les tuiles en mode liste si nécessaire
    const tileContainer = document.getElementById('tileContainer');
    if (tileContainer && tileContainer.classList.contains('list')) {
        const tiles = tileContainer.querySelectorAll('.tile');
        tiles.forEach(tile => {
            // Mettre à jour explicitement le style de chaque tuile
            const titleEl = tile.querySelector('.tile-title');
            if (titleEl) {
                switch(size) {
                    case 'small':
                        titleEl.style.fontSize = '0.85rem';
                        break;
                    case 'normal':
                        titleEl.style.fontSize = '1rem';
                        break;
                    case 'large':
                        titleEl.style.fontSize = '1.2rem';
                        break;
                }
            }
        });
    }
    
    // Afficher une notification avec un léger délai
    setTimeout(() => {
        this.showToast(`Taille de texte : ${
            size === 'small' ? 'petite' :
            size === 'normal' ? 'normale' :
            'grande'
        }`);
    }, 300);
}

// Mise à jour des méthodes setup
setupFontFamily() {
    // Ajouter la classe de police au body
    document.body.classList.add(`${this.fontFamily}-font`);
}

setupTextContrast() {
    // Ajouter la classe de contraste au body
    document.body.classList.add(`${this.textContrast}-contrast`);
}

changeFontFamily(family) {
    console.log("Changement de police vers:", family);
    this.fontFamily = family;
    localStorage.setItem('fontFamily', family);
    
    // Enlever toutes les classes de police
    document.body.classList.remove('system-font', 'roboto-font', 'opensans-font', 'montserrat-font');
    
    // Ajouter la nouvelle classe
    document.body.classList.add(`${family}-font`);
    
    setTimeout(() => {
        this.showToast(`Police : ${
            family === 'system' ? 'Système' :
            family === 'roboto' ? 'Roboto' :
            family === 'opensans' ? 'Open Sans' :
            'Montserrat'
        }`);
    }, 300);
}

changeTextContrast(contrast) {
    console.log("Changement de contraste vers:", contrast);
    this.textContrast = contrast;
    localStorage.setItem('textContrast', contrast);
    
    // Enlever toutes les classes de contraste
    document.body.classList.remove('normal-contrast', 'high-contrast', 'very-high-contrast');
    
    // Ajouter la nouvelle classe
    document.body.classList.add(`${contrast}-contrast`);
    
    setTimeout(() => {
        this.showToast(`Contraste : ${
            contrast === 'normal' ? 'Normal' :
            contrast === 'high' ? 'Élevé' :
            'Très élevé'
        }`);
    }, 300);
}
    handleInstall() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('L\'utilisateur a accepté l\'installation');
                    const menuInstall = document.getElementById('menuInstall');
                    if (menuInstall) {
                        menuInstall.classList.remove('visible');
                    }
                    this.showToast('Application installée avec succès');
                }
                this.deferredPrompt = null;
            });
        }
    }

    showInstallBanner() {
    // Vérifier si on a déjà montré la bannière récemment
    const lastShown = localStorage.getItem('installBannerLastShown');
    if (lastShown && (Date.now() - parseInt(lastShown)) < 7 * 24 * 60 * 60 * 1000) {
        return; // Ne pas montrer si la bannière a été affichée dans les 7 derniers jours
    }
    
    // Supprimer toute bannière existante
    const existingBanners = document.querySelectorAll('.install-banner');
    existingBanners.forEach(b => b.remove());
    
    // Créer la bannière
    const banner = document.createElement('div');
    banner.className = 'install-banner';
    banner.innerHTML = `
        <div class="install-content">
            <p>Installez Actu&Média sur votre appareil !</p>
            <button id="installBtnBanner">Installer</button>
            <button id="closeBannerBtn">✕</button>
        </div>
    `;
    
    // Ajouter les styles
    const style = document.createElement('style');
    style.textContent = `
        .install-banner {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: var(--primary-color);
            color: white;
            padding: 12px;
            z-index: 9999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            animation: slideDown 0.5s ease;
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .install-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .install-banner button {
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
        }
        
        #installBtnBanner {
            background: white;
            color: var(--primary-color);
            font-weight: bold;
        }
        
        #closeBannerBtn {
            background: transparent;
            color: white;
        }
        
        @keyframes slideDown {
            from { transform: translateY(-100%); }
            to { transform: translateY(0); }
        }
    `;
    
    document.head.appendChild(style);
    document.body.prepend(banner);
    
    // Référence à l'événement d'installation depuis l'initializer
    const deferredPrompt = window.pwaInstaller ? window.pwaInstaller.deferredPrompt : null;
    
    // Fonction pour installer l'application
    function installApp() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
        }
        
        const banners = document.querySelectorAll('.install-banner');
        banners.forEach(b => b.remove());
    }
    
    // Fonction pour fermer la bannière
    function closeBanner() {
        const banners = document.querySelectorAll('.install-banner');
        banners.forEach(b => {
            // Animation de disparition
            b.style.opacity = '0';
            b.style.transform = 'translateY(-100%)';
            
            // Supprimer après l'animation
            setTimeout(() => {
                if (b.parentNode) {
                    b.parentNode.removeChild(b);
                }
            }, 300);
        });
        
        // Enregistrer que la bannière a été fermée
        localStorage.setItem('installBannerLastShown', Date.now().toString());
    }
    
    // Configurer les boutons après un court délai
    setTimeout(() => {
        // Configurer le bouton d'installation
        const installBtn = document.getElementById('installBtnBanner');
        if (installBtn) {
            // Remplacer pour supprimer tous les gestionnaires
            const newInstallBtn = installBtn.cloneNode(true);
            installBtn.parentNode.replaceChild(newInstallBtn, installBtn);
            
            // Configurer le nouveau bouton
            document.getElementById('installBtnBanner').onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                installApp();
                return false;
            };
        }
        
        // Configurer le bouton de fermeture
        const closeBtn = document.getElementById('closeBannerBtn');
        if (closeBtn) {
            // Remplacer pour supprimer tous les gestionnaires
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            
            // Configurer le nouveau bouton
            document.getElementById('closeBannerBtn').onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeBanner();
                return false;
            };
        }
    }, 100);
    
    // Ajouter un gestionnaire global avec un identifiant unique
    const handlerId = 'install-banner-handler-' + Date.now();
    window[handlerId] = function(e) {
        // Si on clique sur le bouton de fermeture ou un de ses enfants
        if (e.target && (e.target.id === 'closeBannerBtn' || e.target.closest('#closeBannerBtn'))) {
            e.preventDefault();
            e.stopPropagation();
            closeBanner();
            // Supprimer ce gestionnaire après utilisation
            document.removeEventListener('click', window[handlerId], true);
        }
        
        // Si on clique sur le bouton d'installation ou un de ses enfants
        if (e.target && (e.target.id === 'installBtnBanner' || e.target.closest('#installBtnBanner'))) {
            e.preventDefault();
            e.stopPropagation();
            installApp();
            // Supprimer ce gestionnaire après utilisation
            document.removeEventListener('click', window[handlerId], true);
        }
    };
    
    // Ajouter le gestionnaire global en mode capture
    document.addEventListener('click', window[handlerId], true);
}

    toggleTheme() {
    // Cycle entre les thèmes : light -> dark -> rouge -> bleuciel -> light
    switch (this.currentTheme) {
        case 'light':
            this.currentTheme = 'dark';
            break;
        case 'dark':
            this.currentTheme = 'rouge';
            break;
        case 'rouge':
            this.currentTheme = 'bleuciel';
            break;
        case 'bleuciel':
        default:
            this.currentTheme = 'light';
            break;
    }
        
        // Appliquer le thème
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    localStorage.setItem('theme', this.currentTheme);
    
    // Mettre à jour l'icône et le texte
    this.updateThemeIcon();
    
    // Afficher une notification
    let themeName = '';
    switch(this.currentTheme) {
        case 'dark': themeName = 'sombre'; break;
        case 'rouge': themeName = 'rouge'; break;
        case 'light': themeName = 'violet'; break;
        case 'bleuciel': themeName = 'bleu ciel'; break;
        default: themeName = 'clair'; break;
    }
    
    this.showToast(`Thème ${themeName} activé`);
}

    toggleLayout() {
        // Simplifier avec seulement deux modes
        const currentLayout = localStorage.getItem('layout') || 'grid';
        const nextLayout = currentLayout === 'grid' ? 'list' : 'grid';
        this.setLayout(nextLayout);
        this.showToast(`Vue : ${nextLayout === 'grid' ? 'grille' : 'liste'}`);
    }

    setLayout(layout) {
        if (this.tileContainer) {
            // Enlever 'large' des classes à supprimer
            this.tileContainer.classList.remove('grid', 'list');
            this.tileContainer.classList.add(layout);
            localStorage.setItem('layout', layout);
            this.updateLayoutIcon(layout);
        }
    }

    updateLayoutIcon(layout) {
        const layoutButton = document.getElementById('layoutToggle');
        if (layoutButton) {
            const icon = layoutButton.querySelector('.material-icons');
            const text = layoutButton.querySelector('span:not(.material-icons)');
            if (icon && text) {
                // Simplifier le switch avec seulement deux cas
                switch (layout) {
                    case 'grid':
                        icon.textContent = 'grid_view';
                        text.textContent = 'Grille';
                        break;
                    case 'list':
                        icon.textContent = 'view_list';
                        text.textContent = 'Liste';
                        break;
                }
            }
        }
    }

    updateThemeIcon() {
    const themeButton = document.getElementById('darkModeToggle');
    if (themeButton) {
        const icon = themeButton.querySelector('.material-icons');
        const text = themeButton.querySelector('span:not(.material-icons)');
        
        // Configurer l'icône et le texte en fonction du thème actuel
        switch (this.currentTheme) {
            case 'dark':
                if (icon) icon.textContent = 'palette';
                if (text) text.textContent = 'Rouge';
                break;
            case 'rouge':
                if (icon) icon.textContent = 'water_drop';
                if (text) text.textContent = 'Bleu Ciel';
                break;
            case 'bleuciel':
                if (icon) icon.textContent = 'light_mode';
                if (text) text.textContent = 'Violet';
                break;
            case 'light':
            default:
                if (icon) icon.textContent = 'dark_mode';
                if (text) text.textContent = 'Sombre';
                break;
        }
    }
}

    shareSite(site) {
        if (navigator.share) {
            navigator.share({
                title: site.title,
                text: `Découvrez ${site.title} sur Actu & Média`,
                url: site.url
            })
            .then(() => this.showToast('Lien partagé avec succès'))
            .catch(error => {
                console.error('Erreur lors du partage:', error);
                this.showToast('Le partage a été annulé');
            });
        } else {
            // Copier l'URL dans le presse-papier si Web Share n'est pas disponible
            navigator.clipboard.writeText(site.url)
                .then(() => this.showToast('URL copiée dans le presse-papier'))
                .catch(error => {
                    console.error('Erreur lors de la copie:', error);
                    this.showToast('Impossible de copier l\'URL');
                });
        }
    }

    async showAddSiteDialog() {
        const title = prompt('Nom du site :');
        if (!title || title.trim() === '') {
            this.showToast('Le nom du site est obligatoire');
            return;
        }

        // Message modifié pour indiquer le format attendu
        let url = prompt('Ajouter votre site (ex : https://www.votresite.com) :');
        if (!this.validateUrl(url)) {
            this.showToast('URL invalide. L\'URL doit commencer par https://');
            return;
        }

        let mobileUrl = prompt('URL version mobile (optionnel, doit commencer par https://) :');
        if (mobileUrl && !this.validateUrl(mobileUrl)) {
            this.showToast('URL mobile invalide. L\'URL doit commencer par https://');
            return;
        }

        try {
            let customSites = [];
            const saved = localStorage.getItem('customSites');
            if (saved) {
                customSites = JSON.parse(saved);
            }
            if (!Array.isArray(customSites)) {
                customSites = [];
            }

            const newSite = {
                title: title.trim(),
                url: url.trim(),
                mobileUrl: (mobileUrl || url).trim(),
                isDefault: false,
                category: 'custom',
                timestamp: Date.now()
            };

            customSites.push(newSite);
            localStorage.setItem('customSites', JSON.stringify(customSites));
            this.setupTiles();
            this.showToast('Site ajouté avec succès');
        } catch (error) {
            console.error('Erreur ajout site:', error);
            this.showToast('Erreur lors de l\'ajout du site');
        }
    }
	
	// AJOUTEZ ces méthodes dans votre classe ContentManager

// 1. Méthode pour créer le curseur de transparence des tuiles
setupTransparencyControl() {
    // Créer le bouton widget dans la navigation du bas
    this.createTransparencyWidget();
    
    // Appliquer la transparence sauvegardée
    this.applyTransparencySettings();
}

// 2. Créer le widget de transparence
createTransparencyWidget() {
    // Attendre que le DOM soit prêt
    setTimeout(() => {
        // Vérifier si le widget existe déjà
        if (document.getElementById('transparencyWidget')) {
            // Le widget existe déjà dans le HTML, juste ajouter l'événement
            const existingWidget = document.getElementById('transparencyWidget');
            if (existingWidget) {
                existingWidget.addEventListener('click', this.showTransparencyPanel.bind(this));
            }
            return;
        }
        
        // Si le widget n'existe pas, le créer (code de secours)
        const widget = document.createElement('button');
        widget.id = 'transparencyWidget';
        widget.className = 'nav-item transparency-widget';
        widget.innerHTML = `
            <span class="material-icons">opacity</span>
            <span>Transparence</span>
        `;
        
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            const lastNavItem = bottomNav.lastElementChild;
            bottomNav.insertBefore(widget, lastNavItem);
        }
        
        widget.addEventListener('click', this.showTransparencyPanel.bind(this));
    }, 100);
}

// 3. Afficher le panneau de transparence (VERSION AMÉLIORÉE)
showTransparencyPanel() {
    const widget = document.getElementById('transparencyWidget');
    
    // Supprimer tout panneau existant (fermeture au re-clic)
    const existingPanel = document.querySelector('.transparency-panel');
    if (existingPanel) {
        existingPanel.classList.remove('open');
        if (widget) widget.classList.remove('active');
        setTimeout(() => existingPanel.remove(), 300);
        return;
    }
    
    // Marquer le widget comme actif
    if (widget) widget.classList.add('active');
    
    const panel = document.createElement('div');
    panel.className = 'transparency-panel';
    panel.innerHTML = `
        <div class="transparency-panel-content">
            <div class="transparency-header">
                <h3>🎛️ Transparence des tuiles</h3>
                <button class="close-transparency-btn">×</button>
            </div>
            <div class="transparency-controls">
                <div class="transparency-slider-container">
                    <label for="transparencySlider">Niveau de transparence</label>
                    <div class="slider-wrapper">
                        <span class="slider-label">Visible</span>
                        <input type="range" id="transparencySlider" min="0" max="90" value="${localStorage.getItem('tilesTransparency') || '0'}" step="5">
                        <span class="slider-label">Transparent</span>
                    </div>
                    <div class="transparency-value">
                        <span id="transparencyValue">${this.getTransparencyLabel(localStorage.getItem('tilesTransparency') || '0')}</span>
                    </div>
                </div>
                <div class="transparency-presets">
                    <h4>Réglages rapides</h4>
                    <div class="preset-buttons">
                        <button class="preset-btn" data-value="0">👁️ Visible</button>
                        <button class="preset-btn" data-value="25">🔍 Léger</button>
                        <button class="preset-btn" data-value="50">👻 Moyen</button>
                        <button class="preset-btn" data-value="75">🌫️ Fort</button>
                        <button class="preset-btn" data-value="90">💨 Presque invisible</button>
                    </div>
                </div>
                <div class="transparency-info">
                    <p>💡 <strong>Astuce :</strong> Réglez la transparence selon votre fond d'écran pour une lecture optimale.</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // Animation d'apparition
    requestAnimationFrame(() => {
        panel.classList.add('open');
    });
    
    // Gestionnaires d'événements
    this.setupTransparencyPanelEvents(panel);
}

// 4. Configurer les événements du panneau (VERSION AMÉLIORÉE)
setupTransparencyPanelEvents(panel) {
    const slider = panel.querySelector('#transparencySlider');
    const valueDisplay = panel.querySelector('#transparencyValue');
    const closeBtn = panel.querySelector('.close-transparency-btn');
    const presetButtons = panel.querySelectorAll('.preset-btn');
    const widget = document.getElementById('transparencyWidget');
    
    // Fonction de fermeture
    const closePanel = () => {
        panel.classList.remove('open');
        if (widget) widget.classList.remove('active');
        setTimeout(() => panel.remove(), 300);
    };
    
    // Curseur
    slider.addEventListener('input', (e) => {
        const value = e.target.value;
        valueDisplay.textContent = this.getTransparencyLabel(value);
        this.applyTransparency(value);
    });
    
    // Boutons de préréglage
    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const value = btn.dataset.value;
            slider.value = value;
            valueDisplay.textContent = this.getTransparencyLabel(value);
            this.applyTransparency(value);
            
            // Animation du bouton
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 150);
        });
    });
    
    // Fermeture par bouton X
    closeBtn.addEventListener('click', closePanel);
    
    // Fermer en cliquant dehors (PC uniquement)
    setTimeout(() => {
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && 
                !e.target.closest('#transparencyWidget') &&
                window.innerWidth > 768) { // Seulement sur PC
                closePanel();
            }
        }, { once: true });
    }, 100);
    
    // Fermer avec Escape
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closePanel();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

// 5. Appliquer la transparence (VERSION AVEC EXCLUSION SONDAGE)
applyTransparency(value) {
    const tiles = document.querySelectorAll('.tile');
    const separators = document.querySelectorAll('.separator');
    const opacity = 1 - (value / 100);
    
    // Supprimer le style de transparence existant
    const existingTransparencyStyle = document.getElementById('tileTransparencyStyle');
    if (existingTransparencyStyle) {
        existingTransparencyStyle.remove();
    }
    
    // Créer un nouveau style CSS avec !important pour forcer l'application
    const style = document.createElement('style');
    style.id = 'tileTransparencyStyle';
    style.textContent = `
        .tile:not(.survey-tile):not(.slideshow-tile):not([data-category="social"]:first-child) {
            opacity: ${opacity} !important;
            transition: opacity 0.3s ease, transform 0.3s ease !important;
        }
        
		/* Forcer la tuile diaporama à rester visible */
	.tile.slideshow-tile {
    opacity: 1 !important;
	}
        .tile:not(.survey-tile):not([data-category="social"]:first-child):hover {
            opacity: 1 !important;
            transform: scale(1.02) !important;
            z-index: 10 !important;
            position: relative !important;
        }
        
        /* Assurer que la transparence fonctionne même avec enhanced-visibility */
        .tile.enhanced-visibility:not(.survey-tile):not([data-category="social"]:first-child) {
            opacity: ${opacity} !important;
        }
        
        .tile.enhanced-visibility:not(.survey-tile):not([data-category="social"]:first-child):hover {
            opacity: 1 !important;
        }
        
        /* Forcer la tuile sondage à rester visible */
        .tile.survey-tile,
        .tile[data-category="social"]:first-child {
            opacity: 1 !important;
        }
        
        /* Transparence pour les séparateurs */
        .separator {
            opacity: ${opacity} !important;
            transition: opacity 0.3s ease !important;
        }
        
        .separator:hover {
            opacity: 1 !important;
        }
        
        .separator img {
            opacity: inherit !important;
            transition: opacity 0.3s ease !important;
        }
    `;
    
    document.head.appendChild(style);
    
    // Sauvegarder
    localStorage.setItem('tilesTransparency', value);
    
    // Mettre à jour l'indicateur sur le widget
    const widget = document.getElementById('transparencyWidget');
    if (widget) {
        if (value > 0) {
            widget.setAttribute('data-transparency-level', Math.round(value / 25));
        } else {
            widget.removeAttribute('data-transparency-level');
        }
    }
    
    // Toast informatif
    this.showToast(`Transparence : ${this.getTransparencyLabel(value)}`);
}

// 6. Appliquer la transparence sauvegardée (VERSION MISE À JOUR)
applyTransparencySettings() {
    const savedTransparency = localStorage.getItem('tilesTransparency') || '0';
    if (savedTransparency !== '0') {
        // Attendre que les tuiles soient créées
        setTimeout(() => {
            this.applyTransparency(savedTransparency);
        }, 500);
    }
}

// 7. Obtenir le label de transparence
getTransparencyLabel(value) {
    const val = parseInt(value);
    if (val === 0) return 'Visible';
    if (val <= 25) return 'Léger';
    if (val <= 50) return 'Moyen';
    if (val <= 75) return 'Fort';
    return 'Presque invisible';
}

// AJOUTEZ LA NOUVELLE MÉTHODE ICI ↓
// Méthode pour nettoyer les styles de transparence
cleanupTransparencyStyles() {
    const existingTransparencyStyle = document.getElementById('tileTransparencyStyle');
    if (existingTransparencyStyle) {
        existingTransparencyStyle.remove();
    }
}

// 8. CORRECTION POUR LE MODE LISTE PC
fixListModeLayout() {
    const tileContainer = document.getElementById('tileContainer');
    if (!tileContainer) return;
    
    // Observer les changements de classe pour détecter le mode liste
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                this.updateListModeStyles();
            }
        });
    });
    
    observer.observe(tileContainer, { attributes: true });
    
    // Appliquer immédiatement
    this.updateListModeStyles();
}

// 9. Mettre à jour les styles du mode liste
updateListModeStyles() {
    const tileContainer = document.getElementById('tileContainer');
    if (!tileContainer) return;
    
    // Supprimer le style existant
    const existingStyle = document.getElementById('listModeFixStyle');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    // Ajouter le nouveau style si on est en mode liste
    if (tileContainer.classList.contains('list')) {
        const style = document.createElement('style');
        style.id = 'listModeFixStyle';
        style.textContent = `
            /* Correction mode liste pour PC */
            @media (min-width: 769px) {
                #tileContainer.list {
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 10px !important;
                }
                
                #tileContainer.list .tile {
                    width: 100% !important;
                    max-width: 600px !important;
                    margin: 0 auto !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: flex-start !important;
                    padding: 15px 20px !important;
                    min-height: 60px !important;
                }
                
                #tileContainer.list .tile .tile-title {
                    font-size: 16px !important;
                    text-align: left !important;
                    width: 100% !important;
                }
                
                #tileContainer.list .separator {
                    width: 100% !important;
                    max-width: 600px !important;
                    margin: 20px auto !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

	updateActiveNavLinks() {
        document.querySelectorAll('.bottom-nav .nav-item').forEach(navItem => {
            const link = navItem.getAttribute('href');
            const currentPath = window.location.pathname;
            
            if (currentPath.endsWith(link)) {
                navItem.classList.add('active');
            } else {
                navItem.classList.remove('active');
            }
        });
    }
	
	// Méthode pour améliorer automatiquement la visibilité des tuiles
autoEnhanceTileVisibility() {
    // Appliquer les améliorations visuelles à toutes les tuiles
    const tiles = document.querySelectorAll('.tile');
    
    tiles.forEach(tile => {
        // Ajouter une classe pour le style amélioré
        tile.classList.add('enhanced-visibility');
    });
    
    // Ajouter les styles CSS si ils n'existent pas
    this.addVisibilityStyles();
}

// Ajouter les styles CSS directement via JavaScript
addVisibilityStyles() {
    // Vérifier si les styles existent déjà
    if (document.getElementById('visibility-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'visibility-styles';
    style.textContent = `
        /* Amélioration automatique de la visibilité des tuiles */
        .tile.enhanced-visibility {
            /* Fond semi-transparent avec flou */
            backdrop-filter: blur(10px) brightness(1.1);
            -webkit-backdrop-filter: blur(10px) brightness(1.1);
            
            /* Bordure subtile */
            border: 1px solid rgba(255, 255, 255, 0.3);
            
            /* Ombre pour détacher du fond */
            box-shadow: 
                0 4px 20px rgba(0, 0, 0, 0.3),
                0 2px 8px rgba(0, 0, 0, 0.2);
            
            /* Fond de secours plus opaque */
            background-color: rgba(var(--tile-bg-rgb), 0.85) !important;
            
            /* Transition fluide */
            transition: all 0.3s ease;
        }
        
        .tile.enhanced-visibility:hover {
            /* Plus visible au survol */
            backdrop-filter: blur(15px) brightness(1.2);
            -webkit-backdrop-filter: blur(15px) brightness(1.2);
            box-shadow: 
                0 8px 30px rgba(0, 0, 0, 0.4),
                0 4px 12px rgba(0, 0, 0, 0.3);
            transform: translateY(-2px);
        }
        
        /* Texte plus contrasté */
        .tile.enhanced-visibility .tile-title {
            text-shadow: 
                1px 1px 2px rgba(0, 0, 0, 0.8),
                0 0 4px rgba(0, 0, 0, 0.5);
            font-weight: 600;
        }
        
        /* Variables CSS pour les couleurs de fond des tuiles */
        .tile[data-category="news"].enhanced-visibility {
            --tile-bg-rgb: 220, 53, 69; /* Rouge */
        }
        
        .tile[data-category="radio"].enhanced-visibility {
            --tile-bg-rgb: 255, 193, 7; /* Jaune/Orange */
        }
        
        .tile[data-category="tv"].enhanced-visibility {
            --tile-bg-rgb: 0, 123, 255; /* Bleu */
        }
        
        .tile[data-category="sports"].enhanced-visibility {
            --tile-bg-rgb: 40, 167, 69; /* Vert */
        }
        
        .tile[data-category="social"].enhanced-visibility {
            --tile-bg-rgb: 108, 117, 125; /* Gris */
        }
        
        .tile[data-category="custom"].enhanced-visibility {
            --tile-bg-rgb: 111, 66, 193; /* Violet */
        }
        
        .tile[data-category="photos"].enhanced-visibility {
            --tile-bg-rgb: 255, 105, 180; /* Rose */
        }
    `;
    
    document.head.appendChild(style);
}

// Méthodes pour le diaporama - à ajouter dans votre classe ContentManager

// 1. Créer le modal du diaporama
createSlideshowModal() {
    // Vérifier si le modal existe déjà
    if (document.getElementById('slideshowModal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'slideshowModal';
    modal.className = 'slideshow-modal';
    modal.innerHTML = `
        <div class="slideshow-overlay"></div>
        <div class="slideshow-container">
            <div class="slideshow-header">
                <h2>🎞️ Diaporama des photos</h2>
                <button class="close-slideshow-btn">×</button>
            </div>
            <div class="slideshow-content">
                <div class="slideshow-loading">
                    <div class="spinner"></div>
                    <p>Chargement des photos...</p>
                </div>
                <div class="slideshow-viewer" style="display: none;">
                    <div class="slide-container">
                        <img class="slide-image" src="" alt="Photo du diaporama">
                        <div class="slide-info">
                            <h3 class="slide-title"></h3>
                            <p class="slide-description"></p>
                            <span class="slide-author"></span>
                        </div>
                    </div>
                    <div class="slideshow-controls">
                        <button class="slide-btn prev-btn">
                            <span class="material-icons">chevron_left</span>
                        </button>
                        <div class="slide-indicators">
                            <span class="slide-counter">1 / 1</span>
                        </div>
                        <button class="slide-btn next-btn">
                            <span class="material-icons">chevron_right</span>
                        </button>
                    </div>
                    <div class="slideshow-actions">
                        <button class="action-btn play-pause-btn">
                            <span class="material-icons">pause</span>
                            <span class="btn-text">Pause</span>
                        </button>
                        <button class="action-btn gallery-btn">
                            <span class="material-icons">photo_library</span>
                            <span>Voir la galerie</span>
                        </button>
                    </div>
                </div>
                <div class="slideshow-empty" style="display: none;">
                    <span class="material-icons" style="font-size: 48px; opacity: 0.5;">photo_library</span>
                    <h3>Aucune photo disponible</h3>
                    <p>La galerie est vide pour le moment.</p>
                    <button class="action-btn" onclick="window.location.href='photos-gallery.html'">
                        <span class="material-icons">add_photo_alternate</span>
                        <span>Ajouter des photos</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    this.setupSlideshowEvents(modal);
}

// 2. Configurer les événements du diaporama
setupSlideshowEvents(modal) {
    const closeBtn = modal.querySelector('.close-slideshow-btn');
    const overlay = modal.querySelector('.slideshow-overlay');
    const prevBtn = modal.querySelector('.prev-btn');
    const nextBtn = modal.querySelector('.next-btn');
    const playPauseBtn = modal.querySelector('.play-pause-btn');
    const galleryBtn = modal.querySelector('.gallery-btn');
    
    // Fermeture
    closeBtn.addEventListener('click', () => this.closeSlideshowModal());
    overlay.addEventListener('click', () => this.closeSlideshowModal());
    
    // Navigation
    prevBtn.addEventListener('click', () => this.previousSlide());
    nextBtn.addEventListener('click', () => this.nextSlide());
    
    // Play/Pause
    playPauseBtn.addEventListener('click', () => this.toggleSlideshow());
    
    // Aller à la galerie
    galleryBtn.addEventListener('click', () => {
        window.location.href = 'photos-gallery.html';
    });
    
    // Navigation clavier
    document.addEventListener('keydown', (e) => {
        if (modal.classList.contains('show')) {
            switch(e.key) {
                case 'ArrowLeft':
                    this.previousSlide();
                    break;
                case 'ArrowRight':
                    this.nextSlide();
                    break;
                case ' ':
                    e.preventDefault();
                    this.toggleSlideshow();
                    break;
                case 'Escape':
                    this.closeSlideshowModal();
                    break;
        }
    }
});
}

// 3. Ouvrir le diaporama
async openSlideshowModal() {
    // Créer le modal s'il n'existe pas
    this.createSlideshowModal();
    
    const modal = document.getElementById('slideshowModal');
    modal.classList.add('show');
    
    // Initialiser les variables du diaporama
    this.currentSlideIndex = 0;
    this.slides = [];
    this.slideshowInterval = null;
    this.isPlaying = true;
    
    // Charger les photos
    await this.loadSlideshowPhotos();
}

// 4. Charger les photos depuis Supabase
async loadSlideshowPhotos() {
    const loadingEl = document.querySelector('.slideshow-loading');
    const viewerEl = document.querySelector('.slideshow-viewer');
    const emptyEl = document.querySelector('.slideshow-empty');
    
    try {
        // Obtenir le client Supabase
        const supabaseClient = window.getSupabaseClient();
        if (!supabaseClient) {
            throw new Error('Client Supabase non disponible');
        }
        
        // Récupération des photos
        const { data: photos, error } = await supabaseClient
            .from('photos')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20); // Limiter à 20 photos pour de bonnes performances
        
        if (error) throw error;
        
        loadingEl.style.display = 'none';
        
        if (!photos || photos.length === 0) {
            emptyEl.style.display = 'block';
            return;
        }
        
        this.slides = photos;
        viewerEl.style.display = 'block';
        
        // Démarrer le diaporama
        this.showSlide(0);
        this.startSlideshow();
        
    } catch (error) {
        console.error('Erreur chargement photos diaporama:', error);
        loadingEl.innerHTML = `
            <span class="material-icons" style="font-size: 48px; color: #f44336;">error</span>
            <p>Erreur de chargement des photos</p>
            <button onclick="location.reload()" style="padding: 8px 16px; margin-top: 10px;">
                Réessayer
            </button>
        `;
    }
}

// 5. Afficher une slide
showSlide(index) {
    if (!this.slides || this.slides.length === 0) return;
    
    // Corriger l'index si nécessaire
    if (index >= this.slides.length) index = 0;
    if (index < 0) index = this.slides.length - 1;
    
    this.currentSlideIndex = index;
    const slide = this.slides[index];
    
    // Mettre à jour l'image et les informations
    const slideImage = document.querySelector('.slide-image');
    const slideTitle = document.querySelector('.slide-title');
    const slideDescription = document.querySelector('.slide-description');
    const slideAuthor = document.querySelector('.slide-author');
    const slideCounter = document.querySelector('.slide-counter');
    
    slideImage.src = slide.image_url;
    slideImage.alt = slide.title || 'Photo';
    slideTitle.textContent = slide.title || 'Sans titre';
    slideDescription.textContent = slide.description || '';
    slideAuthor.textContent = `Par ${slide.author_name || slide.photographer_name || 'Anonyme'}`;
    slideCounter.textContent = `${index + 1} / ${this.slides.length}`;
}

// 6. Navigation dans les slides
nextSlide() {
    if (this.slides && this.slides.length > 0) {
        this.showSlide(this.currentSlideIndex + 1);
    }
}

previousSlide() {
    if (this.slides && this.slides.length > 0) {
        this.showSlide(this.currentSlideIndex - 1);
    }
}

// 7. Gestion du diaporama automatique
startSlideshow() {
    if (this.slideshowInterval) {
        clearInterval(this.slideshowInterval);
    }
    
    this.slideshowInterval = setInterval(() => {
        if (this.isPlaying) {
            this.nextSlide();
        }
    }, 4000); // 4 secondes par image
}

toggleSlideshow() {
    this.isPlaying = !this.isPlaying;
    const playPauseBtn = document.querySelector('.play-pause-btn');
    const icon = playPauseBtn.querySelector('.material-icons');
    const text = playPauseBtn.querySelector('.btn-text');
    
    if (this.isPlaying) {
        icon.textContent = 'pause';
        text.textContent = 'Pause';
        this.startSlideshow();
    } else {
        icon.textContent = 'play_arrow';
        text.textContent = 'Lecture';
        if (this.slideshowInterval) {
            clearInterval(this.slideshowInterval);
        }
    }
}

// 8. Fermer le diaporama
closeSlideshowModal() {
    const modal = document.getElementById('slideshowModal');
    if (modal) {
        modal.classList.remove('show');
        
        // Nettoyer les intervalles
        if (this.slideshowInterval) {
            clearInterval(this.slideshowInterval);
            this.slideshowInterval = null;
        }
    }
}

// Ajoutez cette méthode dans votre classe ContentManager

// Méthode pour créer l'aperçu diaporama dans la tuile
createTilePreview(tile, site) {
    if (!site.isSlideshow) return;
    
    // Modifier la structure HTML de la tuile diaporama
    tile.innerHTML = `
        <div class="tile-content slideshow-preview">
            <div class="mini-slideshow">
                <div class="mini-slide-container">
                    <img class="mini-slide-image" src="" alt="Aperçu photo" style="display: none;">
                    <div class="mini-slide-placeholder">
                        <span class="material-icons">photo_library</span>
                        <span class="loading-text">Chargement...</span>
                    </div>
                </div>
                <div class="mini-slide-overlay">
                    <div class="tile-title">${site.title}</div>
                    <div class="mini-slide-counter">• • •</div>
                </div>
            </div>
        </div>
    `;
    
    // Charger et démarrer l'aperçu
    this.loadTilePreview(tile);
}

// Charger les photos pour l'aperçu de la tuile
async loadTilePreview(tile) {
    try {
        const supabaseClient = window.getSupabaseClient();
        if (!supabaseClient) return;
        
        const { data: photos, error } = await supabaseClient
            .from('photos')
            .select('image_url, title')
            .order('created_at', { ascending: false })
            .limit(5); // Limiter à 5 photos pour l'aperçu
        
        if (error || !photos || photos.length === 0) {
            // Pas de photos disponibles
            const placeholder = tile.querySelector('.mini-slide-placeholder');
            if (placeholder) {
                placeholder.innerHTML = `
                    <span class="material-icons">add_photo_alternate</span>
                    <span class="loading-text">Aucune photo</span>
                `;
            }
            return;
        }
        
        // Démarrer le mini-diaporama
        this.startTileSlideshow(tile, photos);
        
    } catch (error) {
        console.error('Erreur chargement aperçu photos:', error);
    }
}

// Démarrer le diaporama dans la tuile
startTileSlideshow(tile, photos) {
    const imageEl = tile.querySelector('.mini-slide-image');
    const placeholder = tile.querySelector('.mini-slide-placeholder');
    const counter = tile.querySelector('.mini-slide-counter');
    
    if (!imageEl || photos.length === 0) return;
    
    let currentIndex = 0;
    
    // Fonction pour changer d'image
    const showNextImage = () => {
        const photo = photos[currentIndex];
        imageEl.src = photo.image_url;
        imageEl.alt = photo.title || 'Photo';
        
        // Cacher le placeholder et montrer l'image
        if (placeholder) placeholder.style.display = 'none';
        imageEl.style.display = 'block';
        
        // Mettre à jour le compteur visuel
        if (counter) {
            const dots = photos.map((_, index) => 
                index === currentIndex ? '●' : '○'
            ).join(' ');
            counter.textContent = dots;
        }
        
        // Passer à l'image suivante
        currentIndex = (currentIndex + 1) % photos.length;
    };
    
    // Montrer la première image
    showNextImage();
    
    // Changer d'image toutes les 3 secondes
    const interval = setInterval(showNextImage, 3000);
    
    // Nettoyer l'intervalle si la tuile est supprimée
    tile.dataset.slideshowInterval = interval;
}

}

export default ContentManager;