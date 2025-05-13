class ContentManager {
    constructor() {
        this.tileContainer = null;
        this.currentTheme = localStorage.getItem('theme') || 'rouge'; // Thème par défaut: 'rouge'
        this.fontSize = localStorage.getItem('fontSize') || 'normal';
        this.deferredPrompt = null;
        this.previewMode = false;
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
        
        // Ajouter les styles CSS pour les effets de tuiles
        this.addTileEffectsStyles();
        
        // Vérifier les mises à jour toutes les 5 minutes
        setInterval(() => this.checkSitesUpdates(), 5 * 60 * 1000);
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
            // e.preventDefault(); <-- COMMENTEZ CETTE LIGNE
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

    addTileEffectsStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            /* Effet de survol amélioré avec zoom et ombre */
            .tile {
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
                position: relative;
                overflow: hidden;
                border-radius: 15px !important;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
            }

            .tile:hover {
                transform: translateY(-8px) scale(1.03) !important;
                box-shadow: 0 15px 25px rgba(0, 0, 0, 0.2) !important;
                filter: brightness(1.1) !important;
                z-index: 10 !important;
            }

            /* Effet de pulsation au clic */
            .tile.tile-click {
                animation: pulse 0.3s ease-in-out !important;
                transform: scale(0.95) !important;
            }

            @keyframes pulse {
                0% { transform: scale(0.95); }
                50% { transform: scale(0.98); }
                100% { transform: scale(0.95); }
            }

            /* Effet de brillance qui se déplace au survol */
            .tile::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    90deg,
                    transparent 0%,
                    rgba(255, 255, 255, 0.2) 50%,
                    transparent 100%
                );
                z-index: 1;
                transform: skewX(-15deg);
                transition: left 0.8s ease;
                pointer-events: none;
            }

            .tile:hover::before {
                left: 150%;
            }

            /* Indicateur visuel pour les sites avec du nouveau contenu */
            .tile.has-new-content::after {
                content: '';
                position: absolute;
                top: 10px;
                right: 10px;
                width: 10px;
                height: 10px;
                background-color: #FFD700;
                border-radius: 50%;
                box-shadow: 0 0 5px #FFD700;
                animation: blink 1.5s infinite;
            }

            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.4; }
            }

            /* Effet de rotation 3D léger au survol */
            .tile-container.grid .tile {
                transition: all 0.4s ease;
                transform-style: preserve-3d;
                perspective: 1000px;
            }

            /* Adaptation pour la vue liste */
            .tile-container.list .tile {
                height: 55px !important;
                border-radius: 12px !important;
                margin-bottom: 8px !important;
            }

            .tile-container.list .tile:hover {
                transform: translateX(15px) scale(1.02) !important;
            }

            .tile-container.list .tile-title {
                font-size: calc(var(--tile-title-size) - 1px) !important;
            }

            /* Animation pour le badge "nouveau contenu" */
            .has-new-content .tile-title::after {
                content: ' ';
                display: inline-block;
                width: 6px;
                height: 6px;
                background-color: #FFD700;
                border-radius: 50%;
                margin-left: 5px;
                vertical-align: middle;
                animation: blink 1s infinite;
            }

            /* Animation d'apparition lors du chargement */
            @keyframes tilesAppear {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .tile {
                animation: tilesAppear 0.5s ease forwards;
                animation-delay: calc(var(--tile-index, 0) * 0.05s);
                opacity: 0;
            }

            /* Badge pour les sites populaires */
            .tile.popular::before {
                content: 'trending_up';
                font-family: 'Material Icons';
                position: absolute;
                left: 8px;
                top: 8px;
                font-size: 16px;
                color: #FFD700;
                z-index: 3;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
            }

            /* Badge "DIRECT" pour les chaînes TV en direct */
            .tile.live-content::before {
                content: '•DIRECT';
                position: absolute;
                left: 8px;
                top: 8px;
                font-size: 12px;
                color: #FF5252;
                background-color: rgba(0, 0, 0, 0.5);
                padding: 2px 6px;
                border-radius: 10px;
                z-index: 3;
                font-weight: bold;
                animation: blink 1.5s infinite;
            }

            /* Menu contextuel des tuiles */
            .tile-menu {
                border-radius: 12px !important;
                overflow: hidden;
                animation: menuFadeIn 0.2s ease-out;
            }

            @keyframes menuFadeIn {
                from {
                    opacity: 0;
                    transform: scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            .tile-menu button {
                position: relative;
                overflow: hidden;
                transition: background-color 0.3s ease;
            }

            .tile-menu button:hover {
                background-color: rgba(255, 255, 255, 0.15) !important;
            }

            .tile-menu button::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                transition: width 0.4s ease, height 0.4s ease;
            }

            .tile-menu button:hover::before {
                width: 150%;
                height: 150%;
            }

            /* Badge de notification pour les catégories */
            .category-badge {
                position: absolute;
                right: 15px;
                top: 50%;
                transform: translateY(-50%);
                background-color: #FF5252;
                color: white;
                border-radius: 12px;
                padding: 2px 8px;
                font-size: 12px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                animation: pulse 2s infinite;
                z-index: 2;
            }

            /* Adaptation selon le thème */
            [data-theme="dark"] .category-badge {
                background-color: #FF7043;
            }

            [data-theme="rouge"] .category-badge {
                background-color: #FFD700;
                color: #a32f2a;
            }

            /* Position relative pour les séparateurs */
            .separator {
                position: relative;
            }
        `;
        document.head.appendChild(styleElement);
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
                title: 'France 3 Bourgogne',
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
                category: 'sports',
                isLive: true
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
    }

    createTile(site) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        
        // Ajouter l'attribut data-category pour faciliter le ciblage CSS
        tile.setAttribute('data-category', site.category || 'default');
        
        // Ajouter des classes conditionnelles pour les designs spéciaux
        if (site.isLive) tile.classList.add('live-content');
        
        // Déterminer si le site est populaire (pour ajouter un badge)
        const isPopular = site.url.includes('montceau-news.com') || site.url.includes('lejsl.com') || site.url.includes('francetvinfo.fr');
        if (isPopular) tile.classList.add('popular');
        
        // Structure HTML de la tuile avec les effets spéciaux
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
            
            // Marquer le site comme visité
            this.markSiteAsRead(tile, site);
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

        // Effet de brillance interactif sur desktop
        if (window.matchMedia('(min-width: 1024px)').matches) {
            tile.addEventListener('mousemove', (e) => {
                const rect = tile.getBoundingClientRect();
                const x = e.clientX - rect.left; 
                const y = e.clientY - rect.top;
                
                // Calcul de l'angle pour l'effet de brillance
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const deltaX = (x - centerX) / centerX;
                const deltaY = (y - centerY) / centerY;
                
                // Appliquer une légère rotation 3D
                tile.style.transform = `perspective(1000px) rotateX(${deltaY * 3}deg) rotateY(${-deltaX * 3}deg) translateZ(5px)`;
            });
            
            // Réinitialiser la transformation lorsque la souris quitte la tuile
            tile.addEventListener('mouseleave', () => {
                tile.style.transform = '';
            });
        }

        // Vérifier si le site a du nouveau contenu (simulé)
        const lastVisit = localStorage.getItem(`lastVisit_${site.url}`);
        const now = Date.now();
        
        // Si le site n'a jamais été visité ou la dernière visite date de plus de 24h
        if (!lastVisit || now - parseInt(lastVisit) > 24 * 60 * 60 * 1000) {
            // Aléatoirement ajouter la classe new-content pour la démo
            if (Math.random() > 0.7) {
                tile.classList.add('has-new-content');
            }
        }

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

        // Menu interactif enrichi
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
            <button class="menu-item mark-read">
                <span class="material-icons">done_all</span>
                Marquer comme lu
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

        // Animation d'apparition du menu
        menu.animate([
            { opacity: 0, transform: 'scale(0.9)' },
            { opacity: 1, transform: 'scale(1)' }
        ], {
            duration: 150,
            easing: 'ease-out',
            fill: 'forwards'
        });

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
            } else if (button.classList.contains('mark-read')) {
                this.markSiteAsRead(tile, site);
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
            this.showToast('Les sites par défaut ne peuvent pas être supprimés');
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
            setTimeout(() => {
                existingPanel.remove();
            }, 300);
            return;
        }

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
        setTimeout(() => panel.classList.add('open'), 10);

        const closeBtn = panel.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                panel.classList.remove('open');
                setTimeout(() => panel.remove(), 300);
            });
        }

        panel.querySelectorAll('.font-size-tile').forEach(tile => {
            tile.addEventListener('click', () => {
                const size = tile.dataset.fontSize;
                this.changeFontSize(size);
                panel.querySelectorAll('.font-size-tile').forEach(t => {
                    t.classList.toggle('active', t.dataset.fontSize === size);
                });
            });
        });

        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && !e.target.closest('#settingsButton')) {
                panel.classList.remove('open');
                setTimeout(() => panel.remove(), 300);
            }
        }, { capture: true });
    }
    
    changeFontSize(size) {
        // Sauvegarder la nouvelle taille
        this.fontSize = size;
        localStorage.setItem('fontSize', size);
        
        // Appliquer la taille au document
        document.documentElement.setAttribute('data-font-size', size);
        
        // Rafraîchir l'affichage
        this.setupTiles();
        
        // Notification du changement
        if (this.showToast) {
            this.showToast(`Taille de texte : ${
                size === 'small' ? 'petite' :
                size === 'normal' ? 'normale' :
                'grande'
            }`);
        }
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
        
        // Gérer les clics
        document.getElementById('installBtnBanner').addEventListener('click', () => {
            if (this.deferredPrompt) {
                this.deferredPrompt.prompt();
            }
            banner.remove();
        });
        
        document.getElementById('closeBannerBtn').addEventListener('click', () => {
            banner.remove();
            localStorage.setItem('installBannerLastShown', Date.now());
        });
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
    
    markSiteAsRead(tile, site) {
        tile.classList.remove('has-new-content');
        localStorage.setItem(`lastVisit_${site.url}`, Date.now().toString());
        this.showToast(`${site.title} marqué comme lu`);
    }
    
    checkSitesUpdates() {
        // Cette fonction simule une vérification des mises à jour
        // Dans une application réelle, vous utiliseriez des appels API
        
        // Liste des sites qui pourraient avoir des mises à jour
        const sitesData = [
            { url: 'montceau-news.com', category: 'news', hasUpdate: Math.random() > 0.7 },
            { url: 'lejsl.com', category: 'news', hasUpdate: Math.random() > 0.7 },
            { url: 'francebleu', category: 'radio', hasUpdate: Math.random() > 0.8 },
            { url: 'bfmtv.com', category: 'tv', hasUpdate: Math.random() > 0.7 },
            { url: 'francetvinfo.fr', category: 'tv', hasUpdate: Math.random() > 0.7 },
            { url: 'footmercato', category: 'sports', hasUpdate: Math.random() > 0.6 }
        ];
        
        const updatedSites = [];
        
        // Parcourir tous les sites
        sitesData.forEach(siteData => {
            if (siteData.hasUpdate) {
                updatedSites.push(siteData);
                
                // Marquer les tuiles correspondantes comme ayant du nouveau contenu
                const tiles = document.querySelectorAll('.tile');
                tiles.forEach(tile => {
                    const siteUrl = tile.dataset.siteUrl || '';
                    
                    if (siteUrl.includes(siteData.url)) {
                        tile.classList.add('has-new-content');
                    }
                });
            }
        });
        
        // Si des mises à jour ont été trouvées, notifier l'utilisateur
        if (updatedSites.length > 0) {
            const message = updatedSites.length === 1 
                ? `Nouveau contenu sur ${updatedSites[0].url.split('.')[0]}` 
                : `${updatedSites.length} sites ont du nouveau contenu`;
            
            this.showToast(message);
            
            // Notification si disponible
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Actu & Média', {
                    body: message,
                    icon: '/images/icon-192.png'
                });
            }
        }
    }
}

export default ContentManager;