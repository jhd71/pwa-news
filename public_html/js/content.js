class ContentManager {
    constructor() {
    this.tileContainer = null;
    this.currentTheme = localStorage.getItem('theme') || 'rouge';
    this.fontSize = localStorage.getItem('fontSize') || 'normal';
    this.fontFamily = localStorage.getItem('fontFamily') || 'system'; // Cette ligne existe mais vérifiez qu'elle est bien prise en compte
    this.textContrast = localStorage.getItem('textContrast') || 'normal'; // Cette ligne existe mais vérifiez qu'elle est bien prise en compte
    this.deferredPrompt = null;
	this.visualEnhancement = localStorage.getItem('visualEnhancement') || 'enhanced';
}
	
	getCurrentWeek() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const diff = now - start;
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        return Math.floor(diff / oneWeek);
    }
	
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
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
	this.fixListModeLayout(); // NOUVELLE LIGNE
	this.updateActiveNavLinks();
	this.setupVisualEnhancement();
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
	
	// 🆕 AJOUTER : Gestionnaire pour le bouton photos mobile
    const photosMobileBtn = document.getElementById('photosMobileBtn');
    if (photosMobileBtn) {
        photosMobileBtn.addEventListener('click', () => {
            // Animation de clic
            photosMobileBtn.style.transform = 'scale(0.9)';
            
            // Vibration si disponible
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            // Retour à la taille normale et ouverture
            setTimeout(() => {
                photosMobileBtn.style.transform = 'scale(1)';
                this.openPhotosGallery();
            }, 150);
        });
    }

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
        separator0.innerHTML = `<h2 class="separator-text">Actualités Locales</h2>`;
        this.tileContainer.appendChild(separator0);
        
        // Actualités locales
        const newsDefaultSites = [			
  {
    title: 'Montceau News',
    url: 'https://montceau-news.com/',
    mobileUrl: 'https://montceau-news.com/',
    isDefault: true,
    category: 'news'
  },
  {
    title: 'L\'Informateur de Bourgogne',
    url: 'https://linformateurdebourgogne.com/',
    mobileUrl: 'https://linformateurdebourgogne.com/',
    isDefault: true,
    category: 'news'
  },
  {
    title: 'Le JSL',
    url: 'https://www.lejsl.com/edition-montceau-les-mines',
    mobileUrl: 'https://www.lejsl.com/edition-montceau-les-mines',
    isDefault: true,
    category: 'news'
  },
  {
    title: 'Creusot Infos',
    url: 'https://www.creusot-infos.com',
    mobileUrl: 'https://www.creusot-infos.com/?m=1',
    isDefault: true,
    category: 'news'
  },
  {
    title: 'Faits Divers Saône-et-Loire',
    url: 'https://faitsdivers365.fr/bourgogne-franche-comte/saone-et-loire/',
    mobileUrl: 'https://faitsdivers365.fr/bourgogne-franche-comte/saone-et-loire/',
    isDefault: true,
    category: 'news'
  },
  {
    title: 'Infos Dijon',
    url: 'https://www.infos-dijon.com/news/faits-divers/',
    mobileUrl: 'https://www.infos-dijon.com/news/faits-divers/',
    isDefault: true,
    category: 'news'
  },
  {
    title: '🛍️ Brocantes',
    url: 'https://brocabrac.fr/71/montceau-les-mines/',
    mobileUrl: 'https://brocabrac.fr/71/montceau-les-mines/',
    isDefault: true,
    category: 'events',
    specialStyle: 'brocantes'
	}
	];


// TUILE PHOTOS SIMPLE
const photosTile = {
    title: "📸 Galerie Photos", 
    url: "photos-gallery.html",
    mobileUrl: "photos-gallery.html",
    isDefault: true,
    category: "photos",
    isSlideshow: false // Plus de diaporama
};

// NOUVELLE TUILE QUIZ
const quizTile = {
    title: "🎯 Quiz Hebdo",
    url: "#quiz",
    mobileUrl: "#quiz",
    isDefault: true,
    category: "quiz",
    isQuiz: true
};

// Créer les tuiles d'actualités
newsDefaultSites.forEach(site => {
    const tile = this.createTile(site);
    this.tileContainer.appendChild(tile);
});

// 🆕 AJOUTER LE WIDGET FOOTBALL SELON LA TAILLE D'ÉCRAN
setTimeout(() => {
    if (typeof window.addFootballToWidgets === 'function') {
        window.addFootballToWidgets();
    }
}, 800);

// Séparateur Espace+
const separator1 = document.createElement('div');
separator1.className = 'separator';
separator1.innerHTML = `<h2 class="separator-text">Espace+</h2>`;
this.tileContainer.appendChild(separator1);

// DÉPLACÉ ICI - TUILE PHOTOS DANS ESPACE+
const photosTileElement = this.createTile(photosTile);
this.tileContainer.appendChild(photosTileElement);

// AJOUTER LA TUILE QUIZ DANS ESPACE+
const quizTileElement = this.createTile(quizTile);
this.tileContainer.appendChild(quizTileElement);

// NOUVELLE TUILE PETITES ANNONCES
const annoncesTile = {
    title: "🏪 Petites Annonces",
    url: "petites-annonces.html",
    mobileUrl: "petites-annonces.html",
    isDefault: true,
    category: "annonces"
};

const annoncesTileElement = this.createTile(annoncesTile);
this.tileContainer.appendChild(annoncesTileElement);

        // Séparateur TV
        const separator2 = document.createElement('div');
        separator2.className = 'separator';
        separator2.innerHTML = `<h2 class="separator-text">TV en Direct</h2>`;
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
        sportsSeparator.innerHTML = `<h2 class="separator-text">Sports</h2>`;
        this.tileContainer.appendChild(sportsSeparator);

        // Section Sports
        const sportsSites = [
  {
    title: '⚽ Ligue 1',
    url: 'https://ligue1.fr/fr/competitions/ligue1mcdonalds?tab=news&ranking=scorers',
    mobileUrl: 'https://ligue1.fr/fr/competitions/ligue1mcdonalds?tab=news&ranking=scorers',
    isDefault: true,
    category: 'sports'
  },
  {
    title: '⚽ Ligue 2',
    url: 'https://ligue1.fr/fr/competitions/ligue2bkt?tab=news',
    mobileUrl: 'https://ligue1.fr/fr/competitions/ligue2bkt?tab=news',
    isDefault: true,
    category: 'sports'
  },
  {
    title: '⚽ FC Montceau Bourgogne',
    url: 'https://epreuves.fff.fr/competition/engagement/438243-regional-1-herbelin/phase/1/1/resultats-et-calendrier',
    mobileUrl: 'https://epreuves.fff.fr/competition/engagement/438243-regional-1-herbelin/phase/1/1/resultats-et-calendrier',
    isDefault: true,
    category: 'sports'
  },
  {
    title: '🏀 ELAN Chalon Basket',
    url: 'https://scorenco.com/basket/clubs/elan-chalon-basket-2m40/1-4xe3',
    mobileUrl: 'https://www.elanchalon.com/',
    isDefault: true,
    category: 'sports'
  },
  {
    title: '🏉 RC Montceau Bourgogne',
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
        separator3.innerHTML = `<h2 class="separator-text">Réseaux Sociaux</h2>`;
        this.tileContainer.appendChild(separator3);

        // Section Réseaux Sociaux
        const socialSites = [
  {
    title: '📊 Sondage Actu & Média',
    url: '#survey', // URL spéciale pour le sondage
    mobileUrl: '#survey',
    isDefault: true,
    category: 'social',
    isSurvey: true // Marqueur spécial
  },
  {
    title: '🔴 YouTube',
    url: 'https://www.youtube.com/feed/trending',
    mobileUrl: 'https://www.youtube.com/feed/trending',
    isDefault: true,
    category: 'social'
  },
  {
    title: '🟢 Twitch',
    url: 'https://www.twitch.tv/',
    mobileUrl: 'https://www.twitch.tv/',
    isDefault: true,
    category: 'social'
  },
  {
    title: '⚫ TikTok',
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
            separator.innerHTML = `<h2 class="separator-text">Sites Perso</h2>`;
            this.tileContainer.appendChild(separator);

            // Ajouter d'abord la tuile "Ajouter un site"
            const addSiteTile = {
                title: '➕ Ajouter mon site',
                url: '#add-site', // URL spéciale pour identifier cette tuile
                mobileUrl: '#add-site',
                isDefault: true,
                category: 'add-site',
                isAddSite: true // Marqueur spécial
            };
            
            const addTileElement = this.createTile(addSiteTile);
            addTileElement.classList.add('add-site-tile'); // Classe CSS spéciale
            this.tileContainer.appendChild(addTileElement);

            // Ensuite charger les sites personnalisés existants
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
	
	// Marquer spécialement la tuile Petites Annonces
if (site.action === 'petites-annonces') {
    tile.classList.add('annonces-tile');
    
    // Logique pour afficher le badge "Nouveau"
    try {
        const annoncesDiscovered = localStorage.getItem('annoncesDiscovered');
        const currentDate = new Date().getTime();
        const BADGE_DURATION = 14 * 24 * 60 * 60 * 1000; // 14 jours
        
        // Si jamais découvert, ou découvert il y a moins de 14 jours
        if (!annoncesDiscovered || (currentDate - parseInt(annoncesDiscovered)) < BADGE_DURATION) {
            tile.classList.add('annonces-nouveau');
            
            // Enregistrer la première découverte
            if (!annoncesDiscovered) {
                localStorage.setItem('annoncesDiscovered', currentDate.toString());
            }
        }
    } catch (e) {
        console.error("Erreur badge annonces:", e);
    }
}

// Marquer la tuile quiz (SANS badge maintenant)
if (site.isQuiz) {
    tile.classList.add('quiz-tile');
    tile.id = 'quizTile';
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

    // Stockage de l'URL pour faciliter l'accès
    tile.dataset.siteUrl = site.url;
    tile.dataset.mobileSiteUrl = site.mobileUrl || site.url;
        
    // Gestion du clic normal
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

// Gestion spéciale pour le quiz
if (site.isQuiz) {
    // Vérifier si le quiz est déjà chargé
    if (typeof window.quizLocal !== 'undefined' && window.quizLocal) {
        window.quizLocal.openQuizModal();
    } else {
        // Charger le script une seule fois
        if (!document.querySelector('script[src="js/quiz-local.js"]')) {
            const script = document.createElement('script');
            script.src = 'js/quiz-local.js';
            script.onload = () => {
                if (window.quizLocal) {
                    window.quizLocal.openQuizModal();
                }
            };
            document.head.appendChild(script);
        }
    }
    return;
}

    // Gestion spéciale pour la tuile "Ajouter un site"
    if (site.isAddSite) {
        this.showAddSiteDialog();
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

        // Menu simplifié sans "Version mobile" 
        menu.innerHTML = `
            ${site.isDefault ? `
                <button class="menu-item info-item">
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
            <button class="menu-item open-site">
                <span class="material-icons">open_in_new</span>
                Ouvrir le site
            </button>
            <button class="menu-item share-site">
                <span class="material-icons">share</span>
                Partager
            </button>
        `;
        
        document.body.appendChild(menu);

        // Position intelligente du menu
        this.positionTileMenu(menu, x, y);

        // Gestionnaire d'événements
        menu.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            menu.remove();

            if (button.classList.contains('edit')) {
                this.editSite(site);
            } else if (button.classList.contains('delete')) {
                this.deleteSite(site);
            } else if (button.classList.contains('open-site')) {
                window.open(site.url, '_blank');
            } else if (button.classList.contains('share-site')) {
                this.shareSite(site);
            }
            // L'option "info-item" ne fait rien (juste informatif)
        });

        // Fermeture automatique
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
            }
        }, { once: true });

        // Fermeture automatique après 5 secondes
        setTimeout(() => {
            if (menu && menu.parentNode) {
                menu.remove();
            }
        }, 5000);
    }

    positionTileMenu(menu, x, y) {
        const menuRect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let menuX = x;
        let menuY = y;

        // Ajustements pour mobile
        if (window.innerWidth <= 768) {
            // Sur mobile, centrer horizontalement et placer au-dessus du doigt
            menuX = (viewportWidth - menuRect.width) / 2;
            menuY = Math.max(y - menuRect.height - 20, 20); // 20px au-dessus du point de touch
            
            // Si pas assez d'espace au-dessus, placer en dessous
            if (menuY < 20) {
                menuY = y + 20;
            }
        } else {
            // Sur desktop, position relative au clic
            // Éviter que le menu sorte de l'écran à droite
            if (menuX + menuRect.width > viewportWidth - 10) {
                menuX = viewportWidth - menuRect.width - 10;
            }
            
            // Éviter que le menu sorte de l'écran en bas
            if (menuY + menuRect.height > viewportHeight - 10) {
                menuY = viewportHeight - menuRect.height - 10;
            }
            
            // Éviter que le menu sorte de l'écran à gauche ou en haut
            menuX = Math.max(10, menuX);
            menuY = Math.max(10, menuY);
        }

        menu.style.position = 'fixed';
        menu.style.left = `${menuX}px`;
        menu.style.top = `${menuY}px`;
        menu.style.zIndex = '10000';
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
		
		<div class="settings-section">
            <h4>Amélioration visuelle</h4>
            <div class="visual-enhancement-tiles">
                <div class="visual-enhancement-tile ${this.visualEnhancement === 'normal' ? 'active' : ''}" data-visual-enhancement="normal">
                    <span>⚪ Standard</span>
                </div>
                <div class="visual-enhancement-tile ${this.visualEnhancement === 'enhanced' ? 'active' : ''}" data-visual-enhancement="enhanced">
                    <span>✨ Amélioré</span>
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

panel.querySelectorAll('.visual-enhancement-tile').forEach(tile => {
    ['touchstart', 'click'].forEach(eventType => {
        tile.addEventListener(eventType, (e) => {
            e.stopPropagation();
            
            panel.querySelectorAll('.visual-enhancement-tile').forEach(t => {
                t.classList.remove('active');
            });
            tile.classList.add('active');
            
            const visualEnhancement = tile.dataset.visualEnhancement;
            setTimeout(() => {
                this.changeVisualEnhancement(visualEnhancement);
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

setupVisualEnhancement() {
    // Appliquer l'amélioration visuelle sauvegardée au démarrage
    this.applyVisualEnhancement(this.visualEnhancement);
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
    const existingBanners = document.querySelectorAll('.install-banner-modal');
    existingBanners.forEach(b => b.remove());
    
    // Créer la bannière modale
    const bannerModal = document.createElement('div');
    bannerModal.className = 'install-banner-modal';
    bannerModal.innerHTML = `
        <div class="install-banner-overlay"></div>
        <div class="install-banner-content">
            <button class="install-banner-close" id="closeBannerBtn">
                <span class="material-icons">close</span>
            </button>
            
            <div class="install-banner-icon">
                <img src="/images/AM-192-v2.png" alt="Actu&Média" />
            </div>
            
            <h2 class="install-banner-title">
                Installez Actu&Média
            </h2>
            
            <p class="install-banner-description">
                Accédez rapidement à toute l'actualité locale depuis votre écran d'accueil
            </p>
            
            <div class="install-banner-features">
                <div class="install-feature">
                    <span class="material-icons">offline_bolt</span>
                    <span>Accès rapide</span>
                </div>
                <div class="install-feature">
                    <span class="material-icons">notifications</span>
                    <span>Notifications</span>
                </div>
                <div class="install-feature">
                    <span class="material-icons">phone_iphone</span>
                    <span>Comme une app</span>
                </div>
            </div>
            
            <div class="install-banner-actions">
                <button class="install-btn-primary" id="installBtnBanner">
                    <span class="material-icons">download</span>
                    Installer maintenant
                </button>
                <button class="install-btn-secondary" id="laterBtnBanner">
                    Plus tard
                </button>
            </div>
            
            <div class="install-banner-footer">
                <small>Installation gratuite • Sans téléchargement</small>
            </div>
        </div>
    `;
    
    // Ajouter les styles
    const style = document.createElement('style');
    style.textContent = `
        /* Overlay de fond */
        .install-banner-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: fadeIn 0.3s ease;
        }
        
        .install-banner-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(5px);
        }
        
        /* Contenu de la bannière */
        .install-banner-content {
            position: relative;
            background: var(--card-background, white);
            border-radius: 20px;
            padding: 30px;
            max-width: 420px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            text-align: center;
        }
        
        /* Bouton fermer */
        .install-banner-close {
            position: absolute;
            top: 15px;
            right: 15px;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: none;
            background: var(--close-btn-bg, rgba(0, 0, 0, 0.1));
            color: var(--text-color, #333);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        
        .install-banner-close:hover {
            background: var(--close-btn-hover, rgba(0, 0, 0, 0.2));
            transform: rotate(90deg);
        }
        
        /* Icône de l'app */
        .install-banner-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            animation: bounce 2s infinite;
        }
        
        .install-banner-icon img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        /* Titre */
        .install-banner-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary-color, #940000);
            margin-bottom: 10px;
        }
        
        /* Description */
        .install-banner-description {
            color: var(--text-color, #666);
            font-size: 0.95rem;
            line-height: 1.5;
            margin-bottom: 20px;
        }
        
        /* Features */
        .install-banner-features {
            display: flex;
            justify-content: space-around;
            margin: 25px 0;
            padding: 20px;
            background: var(--features-bg, rgba(0, 0, 0, 0.03));
            border-radius: 12px;
        }
        
        .install-feature {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            font-size: 0.85rem;
            color: var(--text-color, #333);
        }
        
        .install-feature .material-icons {
            font-size: 24px;
            color: var(--primary-color, #940000);
        }
        
        /* Boutons */
        .install-banner-actions {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin: 20px 0;
        }
        
        .install-btn-primary {
            background: var(--primary-color, #940000);
            color: white;
            border: none;
            padding: 14px 24px;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .install-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }
        
        .install-btn-primary:active {
            transform: translateY(0);
        }
        
        .install-btn-secondary {
            background: transparent;
            color: var(--text-color-secondary, #666);
            border: 1px solid var(--border-color, #ddd);
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .install-btn-secondary:hover {
            background: var(--hover-bg, rgba(0, 0, 0, 0.05));
        }
        
        /* Footer */
        .install-banner-footer {
            margin-top: 15px;
            color: var(--text-color-secondary, #999);
            font-size: 0.85rem;
        }
        
        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        /* ========================================
           ADAPTATIONS AUX THÈMES
           ======================================== */
        
        /* Thème Rouge */
        [data-theme="rouge"] .install-banner-content {
            --primary-color: #940000;
            --text-color: #333;
            --text-color-secondary: #666;
            --card-background: white;
            --features-bg: rgba(148, 0, 0, 0.05);
            --border-color: #ddd;
            --close-btn-bg: rgba(0, 0, 0, 0.1);
            --close-btn-hover: rgba(148, 0, 0, 0.2);
        }
        
        /* Thème Sombre */
        [data-theme="dark"] .install-banner-content {
            --primary-color: #ff6b6b;
            --text-color: #e2e8f0;
            --text-color-secondary: #a0aec0;
            --card-background: #2d3748;
            --features-bg: rgba(255, 255, 255, 0.08);
            --border-color: rgba(255, 255, 255, 0.2);
            --close-btn-bg: rgba(255, 255, 255, 0.1);
            --close-btn-hover: rgba(255, 255, 255, 0.2);
            --hover-bg: rgba(255, 255, 255, 0.1);
        }
        
        /* Thème Bleu Ciel */
        [data-theme="bleuciel"] .install-banner-content {
            --primary-color: #17a2b8;
            --text-color: #333;
            --text-color-secondary: #5f6f7a;
            --card-background: white;
            --features-bg: rgba(23, 162, 184, 0.05);
            --border-color: #ddd;
            --close-btn-bg: rgba(23, 162, 184, 0.1);
            --close-btn-hover: rgba(23, 162, 184, 0.2);
        }
        
        [data-theme="bleuciel"] .install-btn-primary {
            background: linear-gradient(135deg, #17a2b8, #20c997);
        }
        
        /* Thème Violet */
        [data-theme="light"] .install-banner-content {
            --primary-color: #6f42c1;
            --text-color: #333;
            --text-color-secondary: #6c757d;
            --card-background: white;
            --features-bg: rgba(111, 66, 193, 0.05);
            --border-color: #ddd;
            --close-btn-bg: rgba(111, 66, 193, 0.1);
            --close-btn-hover: rgba(111, 66, 193, 0.2);
        }
        
        [data-theme="light"] .install-btn-primary {
            background: linear-gradient(135deg, #6f42c1, #e83e8c);
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .install-banner-content {
                padding: 25px 20px;
                max-width: 95%;
            }
            
            .install-banner-icon {
                width: 70px;
                height: 70px;
            }
            
            .install-banner-title {
                font-size: 1.3rem;
            }
            
            .install-banner-description {
                font-size: 0.9rem;
            }
            
            .install-banner-features {
                padding: 15px 10px;
            }
            
            .install-feature {
                font-size: 0.8rem;
            }
            
            .install-feature .material-icons {
                font-size: 20px;
            }
        }
        
        @media (max-width: 480px) {
            .install-banner-features {
                flex-direction: column;
                gap: 12px;
            }
            
            .install-feature {
                flex-direction: row;
                justify-content: center;
                gap: 8px;
            }
        }
        
        /* Accessibilité */
        @media (prefers-reduced-motion: reduce) {
            .install-banner-modal,
            .install-banner-content,
            .install-banner-icon {
                animation: none !important;
            }
            
            .install-banner-close,
            .install-btn-primary,
            .install-btn-secondary {
                transition: none !important;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(bannerModal);
    
    // Référence à l'événement d'installation
    const deferredPrompt = window.pwaInstaller ? window.pwaInstaller.deferredPrompt : null;
    
    // Fonction pour installer l'application
    function installApp() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('PWA installée avec succès');
                    // Tracker l'installation si vous avez des analytics
                }
            });
        }
        closeBanner();
    }
    
    // Fonction pour fermer la bannière
    function closeBanner() {
        const banner = document.querySelector('.install-banner-modal');
        if (banner) {
            // Animation de fermeture
            banner.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (banner.parentNode) {
                    banner.parentNode.removeChild(banner);
                }
            }, 300);
        }
        
        // Enregistrer que la bannière a été fermée
        localStorage.setItem('installBannerLastShown', Date.now().toString());
    }
    
    // Configurer les boutons
    setTimeout(() => {
        // Bouton d'installation
        const installBtn = document.getElementById('installBtnBanner');
        if (installBtn) {
            installBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                installApp();
            };
        }
        
        // Bouton Plus tard
        const laterBtn = document.getElementById('laterBtnBanner');
        if (laterBtn) {
            laterBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeBanner();
            };
        }
        
        // Bouton fermer
        const closeBtn = document.getElementById('closeBannerBtn');
        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeBanner();
            };
        }
        
        // Fermer en cliquant sur l'overlay
        const overlay = document.querySelector('.install-banner-overlay');
        if (overlay) {
            overlay.onclick = (e) => {
                e.preventDefault();
                closeBanner();
            };
        }
    }, 100);
    
    // Ajouter l'animation de fermeture au CSS
    const fadeOutStyle = document.createElement('style');
    fadeOutStyle.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(fadeOutStyle);
    
    // Auto-fermeture après 30 secondes si pas d'interaction
    setTimeout(() => {
        const banner = document.querySelector('.install-banner-modal');
        if (banner) {
            closeBanner();
        }
    }, 30000);
}

    toggleTheme() {
    switch (this.currentTheme) {
        case 'rouge':
            this.currentTheme = 'dark';
            break;
        case 'dark':
            this.currentTheme = 'bleuciel';
            break;
        case 'bleuciel':
            this.currentTheme = 'light';
            break;
        case 'light':          
        default:
            this.currentTheme = 'rouge'; // ✅ Retour au rouge (défaut)
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
        case 'rouge': themeName = 'rouge'; break;
        case 'dark': themeName = 'sombre'; break;
        case 'bleuciel': themeName = 'bleu ciel'; break;       
        case 'light': themeName = 'violet'; break;
        default: themeName = 'rouge'; break;
    }
    
    this.showToast(`Thème ${themeName} activé`);
}

    toggleLayout() {
    // Simplifier avec seulement deux modes - VERSION OPTIMISÉE
    const currentLayout = localStorage.getItem('layout') || 'grid';
    const nextLayout = currentLayout === 'grid' ? 'list' : 'grid';
    
    // Changement immédiat sans recréer les tuiles
    this.setLayoutFast(nextLayout);
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

// NOUVELLE FONCTION - Changement de vue rapide
setLayoutFast(layout) {
    if (!this.tileContainer) return;
    
    // Changement instantané des classes CSS
    this.tileContainer.classList.remove('grid', 'list');
    this.tileContainer.classList.add(layout);
    
    // Sauvegarder immédiatement
    localStorage.setItem('layout', layout);
    
    // Mettre à jour l'icône
    this.updateLayoutIcon(layout);
    
    // Forcer le navigateur à recalculer immédiatement
    this.tileContainer.offsetHeight; // Force reflow
    
    // Appliquer les corrections spécifiques au mode liste sans délai
    if (layout === 'list') {
        this.applyListModeImmediate();
    }
}

// NOUVELLE FONCTION - Application immédiate du mode liste
applyListModeImmediate() {
    // Supprimer le style existant
    const existingStyle = document.getElementById('listModeFixStyle');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    // Ajouter immédiatement le style pour le mode liste
    const style = document.createElement('style');
    style.id = 'listModeFixStyle';
    style.textContent = `
        /* Application immédiate du mode liste */
        #tileContainer.list {
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            transition: none !important; /* Pas de transition */
        }
        
        #tileContainer.list .tile {
            width: 100% !important;
            max-width: 800px !important;
            margin: 0 auto !important;
            display: flex !important;
            align-items: center !important;
            justify-content: flex-start !important;
            min-height: 50px !important;
            height: auto !important;
            transition: none !important; /* Pas de transition */
        }
        
        #tileContainer.list .tile .tile-title {
            font-size: var(--tile-title-size) !important;
            text-align: left !important;
            width: 100% !important;
        }
        
        #tileContainer.list .separator {
            width: 100% !important;
            max-width: 800px !important;
        }
        
        /* Mode grille - transitions normales */
        #tileContainer.grid {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)) !important;
            gap: 8px !important;
            transition: all 0.3s ease !important;
        }
        
        #tileContainer.grid .tile {
            height: 80px !important;
            width: auto !important;
            max-width: none !important;
            padding: 10px !important;
            transition: all 0.3s ease !important;
        }
        
        #tileContainer.grid .tile .tile-title {
            text-align: center !important;
        }
    `;
    
    document.head.appendChild(style);
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
        
        // Configurer l'icône et le texte en fonction du thème ACTUEL
        switch (this.currentTheme) {
            case 'dark':
                if (icon) icon.textContent = 'dark_mode';
                if (text) text.textContent = 'Sombre';
                break;
            case 'rouge':
                if (icon) icon.textContent = 'palette';
                if (text) text.textContent = 'Rouge';
                break;
            case 'bleuciel':
                if (icon) icon.textContent = 'water_drop';
                if (text) text.textContent = 'Bleu Ciel';
                break;           
            case 'light':
            default:
                if (icon) icon.textContent = 'light_mode';
                if (text) text.textContent = 'Violet';
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
        // Supprimer toute modal existante
        const existingModal = document.querySelector('.add-site-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Créer la modal moderne
        const modal = document.createElement('div');
        modal.className = 'add-site-modal';
        modal.innerHTML = `
            <div class="add-site-modal-content">
                <div class="add-site-header">
                    <h2>
                        <span class="material-icons">add_circle</span>
                        Ajouter mon site
                    </h2>
                    <button class="close-add-site" type="button">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                
                <form class="add-site-form" id="addSiteForm">
                    <div class="form-group">
                        <label for="siteName">
                            <span class="material-icons">title</span>
                            Nom du site
                        </label>
                        <input 
                            type="text" 
                            id="siteName" 
                            placeholder="Ex: Mon blog, Ma boutique..."
                            required
                            maxlength="50"
                        >
                        <span class="form-hint">Maximum 50 caractères</span>
                    </div>
                    
                    <div class="form-group">
                        <label for="siteUrl">
                            <span class="material-icons">link</span>
                            Adresse du site
                        </label>
                        <div class="url-input-container">
                            <span class="url-prefix">https://</span>
                            <input 
                                type="text" 
                                id="siteUrl" 
                                placeholder="www.monsite.com"
                                required
                            >
                        </div>
                        <span class="form-hint">Entrez uniquement le nom de domaine</span>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="this.closest('.add-site-modal').remove()">
                            Annuler
                        </button>
                        <button type="submit" class="btn-add">
                            <span class="material-icons">add</span>
                            Ajouter le site
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // AJOUTEZ CES LIGNES POUR LE MOBILE ↓
        // Empêcher le scroll de la page sur mobile
        if (window.innerWidth <= 768) {
            document.body.classList.add('modal-open');
        }

        // Animation d'apparition
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });

        // Gestionnaires d'événements
        this.setupAddSiteModalEvents(modal);
    }

    setupAddSiteModalEvents(modal) {
        const form = modal.querySelector('#addSiteForm');
        const closeBtn = modal.querySelector('.close-add-site');
        const nameInput = modal.querySelector('#siteName');
        const urlInput = modal.querySelector('#siteUrl');

        // Fermeture par bouton X
        closeBtn.addEventListener('click', () => {
            this.closeAddSiteModal(modal);
        });

        // Fermeture par clic en dehors
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeAddSiteModal(modal);
            }
        });

        // Fermeture par Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeAddSiteModal(modal);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        // Focus automatique sur le nom
        setTimeout(() => {
            nameInput.focus();
        }, 100);

        // Soumission du formulaire
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddSiteSubmit(modal, nameInput.value.trim(), urlInput.value.trim());
        });
    }

    closeAddSiteModal(modal) {
        modal.classList.remove('show');
        
        // Restaurer le scroll sur mobile
        if (window.innerWidth <= 768) {
            document.body.classList.remove('modal-open');
        }
        
        setTimeout(() => {
            modal.remove();
        }, 300);
    }

    handleAddSiteSubmit(modal, name, urlPart) {
        // Validation
        if (!name || name.length === 0) {
            this.showToast('Le nom du site est obligatoire');
            return;
        }

        if (!urlPart || urlPart.length === 0) {
            this.showToast('L\'adresse du site est obligatoire');
            return;
        }

        // Construire l'URL complète
        let fullUrl = urlPart;
        
        // Ajouter https:// si pas présent
        if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
            fullUrl = 'https://' + fullUrl;
        }

        // Validation de l'URL
        if (!this.validateUrl(fullUrl)) {
            this.showToast('L\'adresse du site n\'est pas valide');
            return;
        }

        try {
            // Récupérer les sites existants
            let customSites = [];
            const saved = localStorage.getItem('customSites');
            if (saved) {
                customSites = JSON.parse(saved);
            }
            if (!Array.isArray(customSites)) {
                customSites = [];
            }

            // Créer le nouveau site
            const newSite = {
                title: name,
                url: fullUrl,
                mobileUrl: fullUrl, // Même URL pour mobile (responsive)
                isDefault: false,
                category: 'custom',
                timestamp: Date.now()
            };

            // Ajouter et sauvegarder
            customSites.push(newSite);
            localStorage.setItem('customSites', JSON.stringify(customSites));

            // Recharger les tuiles
            this.setupTiles();
            
            // Fermer la modal
            this.closeAddSiteModal(modal);
            
            // Message de succès
            this.showToast(`Site "${name}" ajouté avec succès !`);

        } catch (error) {
            console.error('Erreur ajout site:', error);
            this.showToast('Erreur lors de l\'ajout du site');
        }
    }

// 8. CORRECTION POUR LE MODE LISTE PC
fixListModeLayout() {
    const tileContainer = document.getElementById('tileContainer');
    if (!tileContainer) return;
    
    // Application immédiate du bon mode
    const currentLayout = localStorage.getItem('layout') || 'grid';
    if (currentLayout === 'list') {
        this.applyListModeImmediate();
    }
    
    // Observer les changements MAIS sans délai
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                // Application immédiate sans délai
                requestAnimationFrame(() => {
                    this.updateListModeStylesFast();
                });
            }
        });
    });
    
    observer.observe(tileContainer, { attributes: true });
}

// 9. Mettre à jour les styles du mode liste
updateListModeStylesFast() {
    const tileContainer = document.getElementById('tileContainer');
    if (!tileContainer) return;
    
    // Application immédiate selon le mode
    if (tileContainer.classList.contains('list')) {
        this.applyListModeImmediate();
    } else {
        // Mode grille - supprimer les styles de liste
        const existingStyle = document.getElementById('listModeFixStyle');
        if (existingStyle) {
            existingStyle.remove();
        }
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
        /* ========================================
           AMÉLIORATION AUTOMATIQUE DE LA VISIBILITÉ DES TUILES
           ======================================== */
        
        .tile.enhanced-visibility {
            /* Fond semi-transparent avec flou */
            backdrop-filter: blur(10px) brightness(1.1);
            -webkit-backdrop-filter: blur(10px) brightness(1.1);
            
            /* Bordure subtile */
            border: 1px solid rgba(255, 255, 255, 0.3);
            
            /* Ombre pour détacher du fond - AMÉLIORÉE */
            box-shadow: 
                0 6px 25px rgba(0, 0, 0, 0.4),
                0 3px 12px rgba(0, 0, 0, 0.3);
            
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
                0 12px 40px rgba(0, 0, 0, 0.5),
                0 6px 20px rgba(0, 0, 0, 0.4);
            transform: translateY(-3px) scale(1.02);
        }
        
        /* Texte ENCORE PLUS contrasté */
        .tile.enhanced-visibility .tile-title {
            text-shadow: 
                2px 2px 4px rgba(0, 0, 0, 0.9),
                0 0 8px rgba(0, 0, 0, 0.7),
                1px 1px 2px rgba(0, 0, 0, 1);
            font-weight: 700;
            letter-spacing: 0.3px;
        }
        
        /* ========================================
           COULEURS DE FOND PAR THÈME ET CATÉGORIE
           ======================================== */
        
        /* THÈME ROUGE */
        [data-theme="rouge"] .tile[data-category="news"].enhanced-visibility {
            --tile-bg-rgb: 220, 38, 38; /* Rouge intense */
        }
        [data-theme="rouge"] .tile[data-category="photos"].enhanced-visibility {
            --tile-bg-rgb: 234, 88, 12; /* Orange */
        }
        [data-theme="rouge"] .tile[data-category="tv"].enhanced-visibility {
            --tile-bg-rgb: 245, 158, 11; /* Jaune-orange */
        }
        [data-theme="rouge"] .tile[data-category="sports"].enhanced-visibility {
            --tile-bg-rgb: 234, 179, 8; /* Jaune */
        }
        [data-theme="rouge"] .tile[data-category="social"].enhanced-visibility {
            --tile-bg-rgb: 194, 65, 12; /* Orange foncé */
        }
        [data-theme="rouge"] .tile[data-category="custom"].enhanced-visibility {
            --tile-bg-rgb: 185, 28, 28; /* Rouge foncé */
        }
        [data-theme="rouge"] .tile[data-category="add-site"].enhanced-visibility {
            --tile-bg-rgb: 220, 53, 69; /* Rouge vibrant */
        }
        
        /* THÈME SOMBRE */
        [data-theme="dark"] .tile[data-category="news"].enhanced-visibility {
            --tile-bg-rgb: 30, 41, 59; /* Bleu foncé */
        }
        [data-theme="dark"] .tile[data-category="photos"].enhanced-visibility {
            --tile-bg-rgb: 30, 64, 175; /* Bleu */
        }
        [data-theme="dark"] .tile[data-category="tv"].enhanced-visibility {
            --tile-bg-rgb: 55, 48, 163; /* Indigo */
        }
        [data-theme="dark"] .tile[data-category="sports"].enhanced-visibility {
            --tile-bg-rgb: 88, 28, 135; /* Violet */
        }
        [data-theme="dark"] .tile[data-category="social"].enhanced-visibility {
            --tile-bg-rgb: 37, 99, 235; /* Bleu vif */
        }
        [data-theme="dark"] .tile[data-category="custom"].enhanced-visibility {
            --tile-bg-rgb: 67, 56, 202; /* Indigo vif */
        }
        [data-theme="dark"] .tile[data-category="add-site"].enhanced-visibility {
            --tile-bg-rgb: 124, 58, 237; /* Violet vif */
        }
        
        /* THÈME BLEU CIEL */
        [data-theme="bleuciel"] .tile[data-category="news"].enhanced-visibility {
            --tile-bg-rgb: 14, 165, 233; /* Bleu ciel */
        }
        [data-theme="bleuciel"] .tile[data-category="photos"].enhanced-visibility {
            --tile-bg-rgb: 6, 182, 212; /* Turquoise */
        }
        [data-theme="bleuciel"] .tile[data-category="tv"].enhanced-visibility {
            --tile-bg-rgb: 5, 150, 105; /* Vert émeraude */
        }
        [data-theme="bleuciel"] .tile[data-category="sports"].enhanced-visibility {
            --tile-bg-rgb: 13, 148, 136; /* Teal */
        }
        [data-theme="bleuciel"] .tile[data-category="social"].enhanced-visibility {
            --tile-bg-rgb: 59, 130, 246; /* Bleu */
        }
        [data-theme="bleuciel"] .tile[data-category="custom"].enhanced-visibility {
            --tile-bg-rgb: 34, 211, 238; /* Cyan */
        }
        [data-theme="bleuciel"] .tile[data-category="add-site"].enhanced-visibility {
            --tile-bg-rgb: 16, 185, 129; /* Vert */
        }
        
        /* THÈME VIOLET */
        [data-theme="light"] .tile[data-category="news"].enhanced-visibility {
            --tile-bg-rgb: 124, 58, 237; /* Violet */
        }
        [data-theme="light"] .tile[data-category="photos"].enhanced-visibility {
            --tile-bg-rgb: 139, 92, 246; /* Violet clair */
        }
        [data-theme="light"] .tile[data-category="tv"].enhanced-visibility {
            --tile-bg-rgb: 168, 85, 247; /* Violet vif */
        }
        [data-theme="light"] .tile[data-category="sports"].enhanced-visibility {
            --tile-bg-rgb: 192, 38, 211; /* Magenta */
        }
        [data-theme="light"] .tile[data-category="social"].enhanced-visibility {
            --tile-bg-rgb: 219, 39, 119; /* Rose */
        }
        [data-theme="light"] .tile[data-category="custom"].enhanced-visibility {
            --tile-bg-rgb: 225, 29, 72; /* Rouge-rose */
        }
        [data-theme="light"] .tile[data-category="add-site"].enhanced-visibility {
            --tile-bg-rgb: 147, 51, 234; /* Violet foncé */
        }
        
        /* ========================================
           COULEURS SPÉCIALES POUR LA TUILE "AJOUTER UN SITE"
           ======================================== */
        
        /* Toujours très visible quelque soit le thème */
        .tile.add-site-tile.enhanced-visibility {
            border: 2px dashed rgba(255, 255, 255, 0.6) !important;
            animation: shimmer-enhanced 2.5s infinite;
        }
        
        .tile.add-site-tile.enhanced-visibility:hover {
            border-color: rgba(255, 255, 255, 0.9) !important;
            transform: translateY(-3px) scale(1.05);
        }
        
        @keyframes shimmer-enhanced {
            0% { 
                box-shadow: 
                    0 6px 25px rgba(0, 0, 0, 0.4),
                    0 0 0 rgba(255, 255, 255, 0.3);
            }
            50% { 
                box-shadow: 
                    0 8px 30px rgba(0, 0, 0, 0.5),
                    0 0 20px rgba(255, 255, 255, 0.6);
            }
            100% { 
                box-shadow: 
                    0 6px 25px rgba(0, 0, 0, 0.4),
                    0 0 0 rgba(255, 255, 255, 0.3);
            }
        }
        
        /* ========================================
           COMPATIBILITÉ MODE LISTE
           ======================================== */
        
        .tile-container.list .tile.enhanced-visibility {
            box-shadow: 
                -4px 4px 15px rgba(0, 0, 0, 0.3),
                -2px 2px 8px rgba(0, 0, 0, 0.2);
        }
        
        .tile-container.list .tile.enhanced-visibility:hover {
            box-shadow: 
                -6px 6px 25px rgba(0, 0, 0, 0.4),
                -3px 3px 12px rgba(0, 0, 0, 0.3);
            transform: translateX(8px) scale(1.02);
        }
        
        /* ========================================
           RESPONSIVE MOBILE
           ======================================== */
        
        @media (max-width: 768px) {
            .tile.enhanced-visibility {
                box-shadow: 
                    0 4px 15px rgba(0, 0, 0, 0.3),
                    0 2px 6px rgba(0, 0, 0, 0.2);
            }
            
            .tile.enhanced-visibility:hover {
                box-shadow: 
                    0 6px 20px rgba(0, 0, 0, 0.4),
                    0 3px 10px rgba(0, 0, 0, 0.3);
                transform: translateY(-2px) scale(1.01);
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Nouvelle méthode pour ouvrir la galerie photos
openPhotosGallery() {
    try {
        // Animation du bouton
        const photosMobileBtn = document.getElementById('photosMobileBtn');
        if (photosMobileBtn) {
            photosMobileBtn.style.transform = 'scale(0.98)';
            setTimeout(() => {
                photosMobileBtn.style.transform = 'scale(1)';
            }, 150);
        }
        
        // Vibration
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Ouvrir la galerie photos
        const photosUrl = 'photos-gallery.html'; // Adaptez selon votre URL
        
        if (photosUrl.startsWith('http')) {
            window.open(photosUrl, '_blank');
        } else {
            window.location.href = photosUrl;
        }
        
        console.log('📸 Ouverture de la galerie photos');
        this.showToast && this.showToast('Ouverture de la galerie photos...');
        
    } catch (error) {
        console.error('Erreur ouverture galerie photos:', error);
        this.showToast && this.showToast('Erreur lors de l\'ouverture');
    }
}

changeVisualEnhancement(mode) {
        console.log("Changement d'amélioration visuelle vers:", mode);
        this.visualEnhancement = mode;
        localStorage.setItem('visualEnhancement', mode);
        
        this.applyVisualEnhancement(mode);
        
        setTimeout(() => {
            this.showToast(`Amélioration : ${
                mode === 'enhanced' ? 'Activée' : 'Standard'
            }`);
        }, 300);
    }

    applyVisualEnhancement(mode) {
        // Supprimer la classe précédente
        document.body.classList.remove('visual-enhancement-mode');
        
        if (mode === 'enhanced') {
            // Appliquer l'amélioration visuelle (effet fond crème)
            document.body.classList.add('visual-enhancement-mode');
        }
        // Si mode === 'normal', on ne fait rien (mode standard)
    }

}

export default ContentManager;