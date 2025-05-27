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
	const photosTile = {
    title: "📷 Photos d'ici et d'ailleurs",
    url: "photos-gallery.html",
    mobileUrl: "photos-gallery.html",
    isDefault: true,
    category: "photos",
    color: "var(--primary-color)"
	};
        // Créer les tuiles d'actualités
        newsDefaultSites.forEach(site => {
            const tile = this.createTile(site);
            this.tileContainer.appendChild(tile);
        });

// Ajouter la tuile photos séparément
const photosTileElement = this.createTile(photosTile);
this.tileContainer.appendChild(photosTileElement);

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
        
        // Vérifier si c'est un lien interne ou externe
        const url = site.mobileUrl || site.url;
        if (url.startsWith('http')) {
            // Lien externe - ouvrir dans un nouvel onglet
            window.open(url, '_blank');
        } else {
            // Lien interne - naviguer dans la même fenêtre
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
    // Vérifier si le widget existe déjà
    if (document.getElementById('transparencyWidget')) return;
    
    const widget = document.createElement('button');
    widget.id = 'transparencyWidget';
    widget.className = 'nav-item transparency-widget';
    widget.innerHTML = `
        <span class="material-icons">opacity</span>
        <span>Transparence</span>
    `;
    
    // Ajouter le widget dans la barre de navigation
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
        // Insérer avant "Chat" (dernier élément)
        const lastNavItem = bottomNav.lastElementChild;
        bottomNav.insertBefore(widget, lastNavItem);
    }
    
    // Gestionnaire d'événement
    widget.addEventListener('click', this.showTransparencyPanel.bind(this));
}

// 3. Afficher le panneau de transparence
showTransparencyPanel() {
    // Supprimer tout panneau existant
    const existingPanel = document.querySelector('.transparency-panel');
    if (existingPanel) {
        existingPanel.remove();
        return;
    }
    
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

// 4. Configurer les événements du panneau
setupTransparencyPanelEvents(panel) {
    const slider = panel.querySelector('#transparencySlider');
    const valueDisplay = panel.querySelector('#transparencyValue');
    const closeBtn = panel.querySelector('.close-transparency-btn');
    const presetButtons = panel.querySelectorAll('.preset-btn');
    
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
    
    // Fermeture
    closeBtn.addEventListener('click', () => {
        panel.classList.remove('open');
        setTimeout(() => panel.remove(), 300);
    });
    
    // Fermer en cliquant dehors
    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !e.target.closest('#transparencyWidget')) {
            panel.classList.remove('open');
            setTimeout(() => panel.remove(), 300);
        }
    }, { once: true });
}

// 5. Appliquer la transparence
applyTransparency(value) {
    const tiles = document.querySelectorAll('.tile');
    const opacity = 1 - (value / 100);
    
    tiles.forEach(tile => {
        tile.style.opacity = opacity;
        tile.style.transition = 'opacity 0.3s ease';
    });
    
    // Sauvegarder
    localStorage.setItem('tilesTransparency', value);
    
    // Toast informatif
    this.showToast(`Transparence : ${this.getTransparencyLabel(value)}`);
}

// 6. Appliquer la transparence sauvegardée
applyTransparencySettings() {
    const savedTransparency = localStorage.getItem('tilesTransparency') || '0';
    if (savedTransparency !== '0') {
        this.applyTransparency(savedTransparency);
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
}

export default ContentManager;