// ios-content.js - Version optimisée pour iOS
// Gère le contenu et les tuiles avec des optimisations spécifiques à iOS

class ContentManager {
    constructor() {
        this.tileContainer = null;
        this.currentTheme = localStorage.getItem('theme') || 'rouge';
        this.fontSize = localStorage.getItem('fontSize') || 'normal';
        this.fontFamily = localStorage.getItem('fontFamily') || 'system';
        this.textContrast = localStorage.getItem('textContrast') || 'normal';
        this.deferredPrompt = null;
        this.isIOS = true;
        this.initialized = false;
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
        return Promise.resolve();
    }

    setup() {
        this.tileContainer = document.getElementById('tileContainer');
        if (!this.tileContainer) {
            console.error('Container de tuiles non trouvé');
            return;
        }
        
        // Appliquer les paramètres sauvegardés
        document.documentElement.setAttribute('data-font-size', this.fontSize);
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        // Configuration
        this.setupEventListeners();
        this.setupLayout();
        this.setupTheme();
        this.setupFontSize();
        this.setupFontFamily();
        this.setupTextContrast();
        this.setupTiles();
        
        // Optimisations iOS supplémentaires
        this.applyiOSOptimizations();
        
        this.initialized = true;
        console.log("Gestionnaire de contenu iOS configuré");
        
        // Dispatcher un événement pour informer les autres modules
        window.dispatchEvent(new CustomEvent('contentManagerReady', { detail: this }));
    }
    
    applyiOSOptimizations() {
        // Optimisations pour améliorer les performances sur iOS
        
        // Optimiser le ticker d'actualités
        const ticker = document.querySelector('.news-ticker');
        if (ticker) {
            ticker.style.position = 'fixed';
            ticker.style.bottom = 'calc(var(--ios-nav-height) + env(safe-area-inset-bottom, 0px))';
            ticker.style.zIndex = '1400';
            ticker.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            
            // Assurer une transition fluide pour le texte défilant
            const tickerWrapper = ticker.querySelector('.ticker-wrapper');
            if (tickerWrapper) {
                tickerWrapper.style.transition = 'transform 0.3s cubic-bezier(0.1, 0.7, 0.1, 1)';
            }
        }
        
        // Optimiser la navigation du bas
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            bottomNav.style.position = 'fixed';
            bottomNav.style.bottom = '0';
            bottomNav.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
            bottomNav.style.zIndex = '1500';
            bottomNav.style.boxShadow = '0 -2px 10px rgba(0, 0, 0, 0.1)';
        }
        
        // Optimiser les tuiles pour le touch
        document.querySelectorAll('.tile').forEach(tile => {
            // Améliorer le feedback tactile
            tile.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
                this.style.transition = 'transform 0.1s ease';
            }, { passive: true });
            
            tile.addEventListener('touchend', function() {
                this.style.transform = 'scale(1)';
                this.style.transition = 'transform 0.2s ease';
                
                // Vibration pour feedback tactile si disponible
                if (navigator.vibrate) {
                    navigator.vibrate(20);
                }
            }, { passive: true });
            
            tile.addEventListener('touchcancel', function() {
                this.style.transform = 'scale(1)';
            }, { passive: true });
        });
        
        console.log("Optimisations iOS appliquées au contenu");
    }

    setupEventListeners() {
        // Gestion du menu avec optimisations iOS
        const menuButton = document.getElementById('menuButton');
        const sidebar = document.getElementById('sidebar');

        if (menuButton && sidebar) {
            const sidebarCloseBtn = sidebar.querySelector('.close-btn');
            
            // Créer un overlay pour le menu
            let menuOverlay = document.createElement('div');
            menuOverlay.className = 'menu-overlay';
            document.body.appendChild(menuOverlay);
            
            // Utiliser touchend pour une meilleure réactivité sur iOS
            menuButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                sidebar.classList.toggle('open');
                
                if (sidebar.classList.contains('open')) {
                    menuOverlay.classList.add('visible');
                    document.body.classList.add('overlay-active');
                } else {
                    menuOverlay.classList.remove('visible');
                    document.body.classList.remove('overlay-active');
                }
            });
            
            // Conserver aussi l'événement click pour compatibilité
            menuButton.addEventListener('click', (e) => {
                // Ne pas déclencher si c'est un événement synthétisé depuis touchend
                if (e.isTrusted && e._fromTouchEnd !== true) {
                    sidebar.classList.toggle('open');
                    
                    if (sidebar.classList.contains('open')) {
                        menuOverlay.classList.add('visible');
                        document.body.classList.add('overlay-active');
                    } else {
                        menuOverlay.classList.remove('visible');
                        document.body.classList.remove('overlay-active');
                    }
                }
            });
            
            // Gestion du bouton de fermeture
            if (sidebarCloseBtn) {
                sidebarCloseBtn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    sidebar.classList.remove('open');
                    menuOverlay.classList.remove('visible');
                    document.body.classList.remove('overlay-active');
                });
                
                sidebarCloseBtn.addEventListener('click', (e) => {
                    if (e.isTrusted && e._fromTouchEnd !== true) {
                        sidebar.classList.remove('open');
                        menuOverlay.classList.remove('visible');
                        document.body.classList.remove('overlay-active');
                    }
                });
            }
            
            // Gestion du clic sur l'overlay
            menuOverlay.addEventListener('touchend', (e) => {
                e.preventDefault();
                sidebar.classList.remove('open');
                menuOverlay.classList.remove('visible');
                document.body.classList.remove('overlay-active');
            });
            
            menuOverlay.addEventListener('click', (e) => {
                if (e.isTrusted && e._fromTouchEnd !== true) {
                    sidebar.classList.remove('open');
                    menuOverlay.classList.remove('visible');
                    document.body.classList.remove('overlay-active');
                }
            });
        }

        // Boutons de navigation
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
            
            darkModeToggle.addEventListener('click', (e) => {
                if (e.isTrusted && e._fromTouchEnd !== true) {
                    this.toggleTheme();
                }
            });
        }

        const layoutToggle = document.getElementById('layoutToggle');
        if (layoutToggle) {
            layoutToggle.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.toggleLayout();
            });
            
            layoutToggle.addEventListener('click', (e) => {
                if (e.isTrusted && e._fromTouchEnd !== true) {
                    this.toggleLayout();
                }
            });
        }

        const settingsButton = document.getElementById('settingsButton');
        if (settingsButton) {
            settingsButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                const existingPanel = document.querySelector('.settings-menu');
                if (existingPanel) {
                    existingPanel.classList.remove('open');
                    setTimeout(() => {
                        existingPanel.remove();
                    }, 300);
                } else {
                    this.showSettings();
                }
            });
            
            settingsButton.addEventListener('click', (e) => {
                if (e.isTrusted && e._fromTouchEnd !== true) {
                    const existingPanel = document.querySelector('.settings-menu');
                    if (existingPanel) {
                        existingPanel.classList.remove('open');
                        setTimeout(() => {
                            existingPanel.remove();
                        }, 300);
                    } else {
                        this.showSettings();
                    }
                }
            });
        }

        const addSiteBtn = document.getElementById('addSiteBtn');
        if (addSiteBtn) {
            addSiteBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.showAddSiteDialog();
            });
            
            addSiteBtn.addEventListener('click', (e) => {
                if (e.isTrusted && e._fromTouchEnd !== true) {
                    this.showAddSiteDialog();
                }
            });
        }

        // Installation PWA - géré avec optimisations iOS
        window.addEventListener('beforeinstallprompt', (e) => {
            this.deferredPrompt = e;
            
            // Conserver pour une utilisation ultérieure
            window.pwaInstaller = { deferredPrompt: e };
            
            // Montrer la bannière d'installation
            this.showInstallBanner();
            
            // Activer le bouton du menu
            const menuInstall = document.getElementById('menuInstall');
            if (menuInstall) {
                menuInstall.classList.add('visible');
                menuInstall.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.handleInstall();
                });
                
                menuInstall.addEventListener('click', (e) => {
                    if (e.isTrusted && e._fromTouchEnd !== true) {
                        this.handleInstall();
                    }
                });
            }
        });

        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            if (window.pwaInstaller) {
                window.pwaInstaller.deferredPrompt = null;
            }
            
            const menuInstall = document.getElementById('menuInstall');
            if (menuInstall) {
                menuInstall.classList.remove('visible');
            }
            
            // Afficher un toast de confirmation
            this.showToast('Application installée avec succès');
        });
    }

    setupLayout() {
        const savedLayout = localStorage.getItem('layout') || 'grid';
        this.setLayout(savedLayout);
    }

    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateThemeIcon();
    }

    setupFontSize() {
        document.documentElement.setAttribute('data-font-size', this.fontSize);
    }
    
    setupFontFamily() {
        document.body.classList.add(`${this.fontFamily}-font`);
    }
    
    setupTextContrast() {
        document.body.classList.add(`${this.textContrast}-contrast`);
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
            },
            {
                title: '✉️ Proposer une actu (mail)',
                url: 'mailto:contact@actuetmedia.fr',
                mobileUrl: 'mailto:contact@actuetmedia.fr',
                isDefault: true,
                category: 'news'
            },
            {
                title: '💬 Proposer via Messenger',
                url: 'https://m.me/actuetmedia',
                mobileUrl: 'https://m.me/actuetmedia',
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
                title: '📻 France Bleu<br>Bourgogne',
                url: 'https://www.radio-en-ligne.fr/france-bleu-bourgogne',
                mobileUrl: 'https://www.radio-en-ligne.fr/france-bleu-bourgogne',
                isDefault: true,
                category: 'radio'
            },
            {
                title: '🎧 Radios de Bourgogne',
                url: 'https://ecouterradioenligne.com/region/bourgogne/#prevert-chalon',
                mobileUrl: 'https://ecouterradioenligne.com/region/bourgogne/#prevert-chalon',
                isDefault: true,
                category: 'radio'
            },
            {
                title: '🚫 Radio Sans Pub',
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
                title: '🏟️ Foot<br>FC Montceau-Bourgogne',
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

    // Le reste des fonctions de ContentManager (comme createTile, toggleTheme, etc.)
    // peut être copié directement depuis content.js (non inclus ici pour éviter
    // que la réponse ne devienne trop longue)

    showToast(message) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'toast ios-toast';
        toast.textContent = message;
        
        // Style optimisé pour iOS
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '20px';
        toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        toast.style.fontWeight = '500';
        
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

export default ContentManager;