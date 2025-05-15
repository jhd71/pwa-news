class ContentManager {
    constructor() {
        this.tileContainer = null;
        this.currentTheme = localStorage.getItem('theme') || 'rouge';
        this.fontSize = localStorage.getItem('fontSize') || 'normal';
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
        this.setupTiles();
    }

    setupEventListeners() {
        // Gestion du menu
        const menuButton = document.getElementById('menuButton');
        const sidebar = document.getElementById('sidebar');

        if (menuButton && sidebar) {
            const sidebarCloseBtn = sidebar.querySelector('.close-btn');

            menuButton.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });

            if (sidebarCloseBtn) {
                sidebarCloseBtn.addEventListener('click', () => {
                    sidebar.classList.remove('open');
                });
            }

            document.addEventListener('click', (e) => {
                if (sidebar.classList.contains('open') &&
                    !sidebar.contains(e.target) &&
                    !menuButton.contains(e.target)) {
                    sidebar.classList.remove('open');
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
                title: 'Mâcon-Infos',
                url: 'https://macon-infos.com/fr/faits-divers/macon',
                mobileUrl: 'https://macon-infos.com/fr/faits-divers/macon',
                isDefault: true,
                category: 'news'
            }
        ];

        // Créer les tuiles d'actualités
        newsDefaultSites.forEach(site => {
            const tile = this.createTile(site);
            this.tileContainer.appendChild(tile);
        });

        // Séparateur Radio
        const separator1 = document.createElement('div');
        separator1.className = 'separator';
        separator1.innerHTML = `<img src="images/Radio.png" alt="Radio" class="separator-img">`;
        this.tileContainer.appendChild(separator1);

        // Section Radio
        const radioSites = [
            {
                title: 'France Bleu Bourgogne',
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
        title: 'FR3 Bourgogne', // Raccourci de "France 3 Bourgogne"
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
                title: 'Foot Ligue 1',
                url: 'https://ligue1.fr/fr/competitions/ligue1mcdonalds?tab=news&ranking=scorers',
                mobileUrl: 'https://ligue1.fr/fr/competitions/ligue1mcdonalds?tab=news&ranking=scorers',
                isDefault: true,
                category: 'sports'
            },
            {
                title: 'Foot Ligue 2',
                url: 'https://ligue1.fr/fr/competitions/ligue2bkt?tab=news',
                mobileUrl: 'https://ligue1.fr/fr/competitions/ligue2bkt?tab=news',
                isDefault: true,
                category: 'sports'
            },
            {
                title: 'Foot FC Montceau-Bourgogne',
                url: 'https://www.footmercato.net/club/fc-montceau-bourgogne/classement',
                mobileUrl: 'https://www.footmercato.net/club/fc-montceau-bourgogne/classement',
                isDefault: true,
                category: 'sports'
            },
            {
                title: 'Foot-Live',
                url: 'https://www.footmercato.net/live/',
                mobileUrl: 'https://www.footmercato.net/live/',
                isDefault: true,
                category: 'sports'
                // isLive supprimé pour Foot-Live
            },
            {
                title: 'ELAN Chalon Basket',
                url: 'https://scorenco.com/basket/clubs/elan-chalon-basket-2m40/1-4xe3',
                mobileUrl: 'https://www.elanchalon.com/',
                isDefault: true,
                category: 'sports'
            },
            {
                title: 'Rugby RC Montceau Bourgogne',
                url: 'https://scorenco.com/rugby/clubs/rc-montceau-bourgogne-2m2t',
                mobileUrl: 'https://scorenco.com/rugby/clubs/rc-montceau-bourgogne-2m2t',
                isDefault: true,
                category: 'sports'
            },
			{
                title: 'Cyclisme',
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
                title: 'YouTube',
                url: 'https://www.youtube.com/feed/trending',
                mobileUrl: 'https://www.youtube.com/feed/trending',
                isDefault: true,
                category: 'social'
            },
            {
                title: 'Twitch',
                url: 'https://www.twitch.tv/',
                mobileUrl: 'https://www.twitch.tv/',
                isDefault: true,
                category: 'social'
            },
            {
                title: 'TikTok',
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
    // N'ajoute le badge DIRECT qu'aux chaînes TV, pas à Foot-Live
    if (site.isLive && site.category === 'tv') {
        tile.classList.add('live-content');
    }
    
    // Ajouter des classes spéciales pour les icônes
    if (site.category === 'social') {
        if (site.title === 'YouTube') {
            tile.classList.add('tile-youtube');
        } else if (site.title === 'Twitch') {
            tile.classList.add('tile-twitch');
        } else if (site.title === 'TikTok') {
            tile.classList.add('tile-tiktok');
        }
    } else if (site.category === 'news') {
        if (site.title === 'Montceau News' || site.url.includes('montceau-news')) {
            tile.classList.add('tile-montceau-news');
        } else if (site.title === 'Le JSL' || site.url.includes('lejsl.com')) {
            tile.classList.add('tile-jsl');
        } else if (site.title === 'L\'Informateur de Bourgogne' || site.url.includes('informateurdebourgogne')) {
            tile.classList.add('tile-informateur');
        } else if (site.title === 'Creusot Infos' || site.url.includes('creusot-infos')) {
            tile.classList.add('tile-creusot');
        } else if (site.title === 'Faits Divers Saône-et-Loire' || site.url.includes('faitsdivers')) {
            tile.classList.add('tile-faits-divers');
        } else if (site.title === 'Mâcon-Infos' || site.url.includes('macon-infos')) {
            tile.classList.add('tile-macon');
        }
    } else if (site.category === 'tv') {
        if (site.title === 'France 3 Bourgogne' || site.url.includes('france3')) {
            tile.classList.add('tile-france3');
        } else if (site.title === 'BFMTV' || site.url.includes('bfmtv')) {
            tile.classList.add('tile-bfmtv');
        } else if (site.title === 'CNews' || site.url.includes('cnews')) {
            tile.classList.add('tile-cnews');
        } else if (site.title === 'FranceTV Info' || site.url.includes('francetvinfo')) {
            tile.classList.add('tile-francetv');
        }
    } else if (site.category === 'sports') {
    if (site.title.includes('Foot') || site.url.includes('foot')) {
        tile.classList.add('tile-foot');
    } else if (site.title.includes('Basket') || site.url.includes('basket')) {
        tile.classList.add('tile-basket');
    } else if (site.title.includes('Rugby') || site.url.includes('rugby')) {
        tile.classList.add('tile-rugby');
    } else if (site.title.includes('Cyclisme') || site.url.includes('cyclisme')) {
        tile.classList.add('tile-cyclisme');
    }
    } else if (site.category === 'radio') {
        tile.classList.add('tile-radio');
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
            window.open(site.mobileUrl || site.url, '_blank');
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
        });

        tile.addEventListener('touchmove', () => {
            clearTimeout(longPressTimer); // ✅ Annule l'appui long si le doigt bouge (scroll détecté)
        });

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

// Remplacez la méthode showSettings() existante par celle-ci :

// Remplacez la méthode showSettings() dans content.js par cette version corrigée

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

    const panel = document.createElement('div');
    panel.className = 'settings-menu';
    panel.innerHTML = `
        <div class="settings-header">
            <h3>Paramètres</h3>
            <button type="button" class="close-btn">
                <span class="material-icons">close</span>
            </button>
        </div>
        <div class="settings-content">
            <div class="settings-section">
                <h4>Taille du texte</h4>
                <div class="font-size-tiles">
                    <div class="font-size-tile ${this.fontSize === 'small' ? 'active' : ''}" data-font-size="small">
                        <span>Petit</span>
                    </div>
                    <div class="font-size-tile ${this.fontSize === 'normal' ? 'active' : ''}" data-font-size="normal">
                        <span>Normal</span>
                    </div>
                    <div class="font-size-tile ${this.fontSize === 'large' ? 'active' : ''}" data-font-size="large">
                        <span>Grand</span>
                    </div>
                </div>
            </div>
            <div class="settings-section">
                <h4>À propos</h4>
                <p class="version-text">Version 1.2</p>
                <div style="text-align: center; padding: 15px;">
                    <img src="images/qrcode.png" alt="QR Code" style="max-width: 200px; width: 100%; height: auto;">
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

// Remplacez également la méthode changeFontSize() par celle-ci :

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
        // Cycle entre les thèmes : light -> dark -> rouge -> light
        switch (this.currentTheme) {
            case 'light':
                this.currentTheme = 'dark';
                break;
            case 'dark':
                this.currentTheme = 'rouge';
                break;
            case 'rouge':
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
}

export default ContentManager;
