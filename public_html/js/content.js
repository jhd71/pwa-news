class ContentManager {
    constructor() {
        this.tileContainer = null;
        this.isDarkMode = localStorage.getItem('theme') === 'dark';
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
            darkModeToggle.addEventListener('click', this.toggleDarkMode.bind(this));
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
            e.preventDefault();
            this.deferredPrompt = e;
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
    } // <-- Ajout de l'accolade fermante

    setupLayout() {
        const savedLayout = localStorage.getItem('layout') || 'grid';
        this.setLayout(savedLayout);
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme === 'dark');
    }

    setupFontSize() {
        document.documentElement.setAttribute('data-font-size', this.fontSize);
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
            isDefault: true
        },
        {
            title: 'L\'Informateur de Bourgogne',
            url: 'https://linformateurdebourgogne.com/',
            mobileUrl: 'https://linformateurdebourgogne.com/',
            isDefault: true
        },
        {
            title: 'Le JSL',
            url: 'https://www.lejsl.com/edition-montceau-les-mines',
            mobileUrl: 'https://www.lejsl.com/edition-montceau-les-mines',
            isDefault: true
        },
        {
            title: 'Creusot Infos',
            url: 'https://www.creusot-infos.com',
            mobileUrl: 'https://www.creusot-infos.com/?m=1',
            isDefault: true
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
            isDefault: true
        },
        {
            title: 'Radio Sans Pub',
            url: 'https://www.radio-en-ligne.fr/radio-sans-pub/',
            mobileUrl: 'https://www.radio-en-ligne.fr/radio-sans-pub/',
            isDefault: true
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
            isDefault: true
        },
        {
            title: 'BFMTV',
            url: 'https://www.bfmtv.com/en-direct/',
            mobileUrl: 'https://www.bfmtv.com/en-direct/',
            isDefault: true
        },
        {
            title: 'FranceTV Info',
            url: 'https://www.francetvinfo.fr/en-direct/tv.html',
            mobileUrl: 'https://www.francetvinfo.fr/en-direct/tv.html',
            isDefault: true
        }
    ];

    tvSites.forEach(site => {
        const tile = this.createTile(site);
        this.tileContainer.appendChild(tile);
    });

// Séparateur Football
const footballSeparator = document.createElement('div');
footballSeparator.className = 'separator';
footballSeparator.innerHTML = `<img src="images/Football.png" alt="Football" class="separator-img">`;
this.tileContainer.appendChild(footballSeparator);

// Section Football
const footballSites = [
    {
        title: 'Ligue 1',
        url: 'https://www.ligue1.fr',
        mobileUrl: 'https://www.ligue1.fr',
        isDefault: true
    },
    {
        title: 'Ligue 2',
        url: 'https://www.ligue2.fr',
        mobileUrl: 'https://www.ligue2.fr',
        isDefault: true
    },
    {
        title: 'FC Montceau-Bourgogne',
        url: 'https://www.footmercato.net/club/fc-montceau-bourgogne/classement',
        mobileUrl: 'https://www.footmercato.net/club/fc-montceau-bourgogne/classement',
        isDefault: true
    },
    {
        title: 'Foot-Live',
        url: 'https://www.footmercato.net/live/',
        mobileUrl: 'https://www.footmercato.net/live/',
        isDefault: true
    },
	{
        title: 'Scores en direct',
        customAction: 'showFootballScores',
        icon: 'sports_soccer',
        isDefault: true
    }
];

footballSites.forEach(site => {
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
            isDefault: true
        },
        {
            title: 'TikTok',
            url: 'https://www.tiktok.com/discover?lang=fr',
            mobileUrl: 'https://www.tiktok.com/?lang=fr',
            isDefault: true
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
                    const tile = this.createTile({...site, isDefault: false});
                    this.tileContainer.appendChild(tile);
                });
            }
        }
    } catch (error) {
        console.error('Erreur chargement sites personnalisés:', error);
        this.showToast('Erreur lors du chargement des sites personnalisés');
    }
}

    createTile(site) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    
    // Contenu de base de la tuile
    tile.innerHTML = `
        <div class="tile-content">
            ${site.icon ? `<span class="material-icons">${site.icon}</span>` : ''}
            <div class="tile-title">${site.title}</div>
        </div>
    `;

    // Gestion du clic normal
    tile.addEventListener('click', () => {
        if (site.customAction) {
            if (site.customAction === 'showFootballScores') {
                this.showFootballScores();
            }
        } else {
            window.open(site.mobileUrl || site.url, '_blank');
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
});

tile.addEventListener('touchmove', () => {
    clearTimeout(longPressTimer); // ✅ Annule l’appui long si le doigt bouge (scroll détecté)
});

tile.addEventListener('touchend', (e) => {
    clearTimeout(longPressTimer);
    if (isLongPress) {
        e.preventDefault();
    }
});

tile.addEventListener('touchmove', () => {
    clearTimeout(longPressTimer);
    isScrolling = true; // Empêche le menu si l'utilisateur bouge le doigt
});

// Retourne l'élément modifié
return tile;
    }

    showTileMenu(tile, site, x, y) {
        const existingMenu = document.querySelector('.tile-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'tile-menu';

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
// Ajouter cet élément dans le HTML pour un message d'erreur
panel.innerHTML += '<div id="football-error" style="display: none; padding: 20px; background-color: #ffebee; color: #c62828; border-radius: 8px; margin: 20px;"></div>';
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

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        const newTheme = this.isDarkMode ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(this.isDarkMode);
        this.showToast(`Mode ${this.isDarkMode ? 'sombre' : 'clair'} activé`);
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

    updateThemeIcon(isDark) {
        const themeButton = document.getElementById('darkModeToggle');
        if (themeButton) {
            const icon = themeButton.querySelector('.material-icons');
            const text = themeButton.querySelector('span:not(.material-icons)');
            if (icon) icon.textContent = isDark ? 'light_mode' : 'dark_mode';
            if (text) text.textContent = isDark ? 'Clair' : 'Sombre';
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
 
 async showFootballScores() {
    // Supprimer tout panneau existant pour éviter les doublons
    const existingPanel = document.querySelector('.football-scores-panel');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    // Créer le panneau
    const panel = document.createElement('div');
    panel.className = 'football-scores-panel';
    panel.innerHTML = `
    <div class="panel-header">
        <h3>Résultats Football</h3>
        <button class="close-panel">
            <span class="material-icons">close</span>
        </button>
    </div>
    <div class="panel-tabs">
        <button class="tab-btn active" data-tab="live">En direct</button>
        <button class="tab-btn" data-tab="upcoming">À venir</button>
        <button class="tab-btn" data-tab="standings">Classements</button>
    </div>
        <div class="panel-content">
            <div class="tab-section active" id="live-section">
                <div class="loading">Chargement des matchs en direct...</div>
            </div>
            <div class="tab-section" id="upcoming-section">
                <div class="loading">Chargement des prochains matchs...</div>
            </div>
            <div class="tab-section" id="standings-section">
                <div class="loading">Chargement des classements...</div>
            </div>
        </div>
        <!-- Bouton de retour fixe en bas du panneau -->
        <button class="back-to-home-btn">
            <span class="material-icons">home</span>
            Retour à l'accueil
        </button>
    `;

    // Styles pour le panneau
    panel.style.position = 'fixed';
    panel.style.top = '0';
    panel.style.left = '0';
    panel.style.width = '100%';
    panel.style.height = '100%';
    panel.style.backgroundColor = 'var(--bg-color, white)';
    panel.style.zIndex = '1000';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.overflow = 'hidden';

    // Style pour le bouton de retour
    const backBtn = panel.querySelector('.back-to-home-btn');
    if (backBtn) {
        backBtn.style.position = 'fixed';
        backBtn.style.bottom = '20px';
        backBtn.style.left = '50%';
        backBtn.style.transform = 'translateX(-50%)';
        backBtn.style.padding = '10px 20px';
        backBtn.style.backgroundColor = 'var(--primary-color, #1a237e)';
        backBtn.style.color = 'white';
        backBtn.style.border = 'none';
        backBtn.style.borderRadius = '20px';
        backBtn.style.display = 'flex';
        backBtn.style.alignItems = 'center';
        backBtn.style.gap = '5px';
        backBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        backBtn.style.zIndex = '1001';
    }

    // Styles pour l'en-tête
    const header = panel.querySelector('.panel-header');
    if (header) {
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.padding = '10px 15px';
        header.style.backgroundColor = 'var(--primary-color, #1a237e)';
        header.style.color = 'white';
        header.style.position = 'sticky';
        header.style.top = '0';
        header.style.zIndex = '1002';
    }

    // Styles pour le bouton de fermeture
    const closeBtn = panel.querySelector('.close-panel');
    if (closeBtn) {
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.color = 'white';
        closeBtn.style.fontSize = '24px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.padding = '5px';
    }
    
    // Styles pour les onglets
    const tabs = panel.querySelector('.panel-tabs');
    if (tabs) {
        tabs.style.display = 'flex';
        tabs.style.background = 'var(--bg-color-light, #f0f0f0)';
        tabs.style.borderBottom = '1px solid var(--border-color, #ddd)';
    }
    
    const tabButtons = panel.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.style.flex = '1';
        btn.style.padding = '12px';
        btn.style.border = 'none';
        btn.style.background = 'none';
        btn.style.cursor = 'pointer';
        btn.style.textAlign = 'center';
        btn.style.fontWeight = 'bold';
    });
    
    // Styles pour le contenu
    const content = panel.querySelector('.panel-content');
    if (content) {
        content.style.flex = '1';
        content.style.overflow = 'auto';
        content.style.padding = '15px';
    }
    
    const tabSections = panel.querySelectorAll('.tab-section');
    tabSections.forEach(section => {
        if (!section.classList.contains('active')) {
            section.style.display = 'none';
        }
    });

    // Ajouter au document
    document.body.appendChild(panel);
    const showError = (message) => {
    const errorEl = panel.querySelector('#football-error');
    if (errorEl) {
        errorEl.textContent = `Erreur: ${message}`;
        errorEl.style.display = 'block';
    }
};
    // IMPORTANT: S'assurer que les éléments d'interface restent accessibles
    const appHeader = document.querySelector('.app-header');
    if (appHeader) {
        appHeader.style.zIndex = '1003'; // Plus haut que le panneau
    }
    
    // Multiple gestionnaires pour la fermeture
    const closePanelAndCleanup = () => {
        panel.remove();
        // Restaurer tout style modifié
        if (appHeader) {
            appHeader.style.zIndex = '';
        }
        this.showToast('Football scores fermé');
    };
    
    // Configurer les boutons
    const closeButtons = [
        panel.querySelector('.close-panel'),
        panel.querySelector('.back-to-home-btn')
    ];
    
    closeButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', closePanelAndCleanup);
        }
    });
    
    // Permettre de fermer avec la touche Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePanelAndCleanup();
        }
    }, { once: true });
    
    // Gestion des onglets
const tabBtns = panel.querySelectorAll('.tab-btn');
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        console.log('Onglet cliqué:', btn.dataset.tab);
        
        // Désactiver tous les onglets
        tabBtns.forEach(b => b.classList.remove('active'));
        panel.querySelectorAll('.tab-section').forEach(s => {
            s.style.display = 'none';
        });
        
        // Activer l'onglet cliqué
        btn.classList.add('active');
        const tabId = btn.dataset.tab + '-section';
        const section = panel.querySelector(`#${tabId}`);
        if (section) {
            section.style.display = 'block';
            console.log('Section activée:', tabId);
        } else {
            console.error('Section non trouvée:', tabId);
        }
    });
});
    
    // Charger les données
    this.loadFootballData(panel);
}

async loadFootballData(panel) {
    // Fonction pour afficher un indicateur de chargement
    const showLoading = (section, message) => {
        section.innerHTML = `
            <div class="loading">${message}</div>
            <div style="display: flex; justify-content: center; margin: 20px 0;">
                <div class="loading-spinner" style="width: 40px; height: 40px; border: 4px solid rgba(0,0,0,0.1); border-left-color: var(--primary-color, #1a237e); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>
        `;
    };
    
    // Fonction pour afficher une erreur
    const showError = (message, section, suggestion = '') => {
        section.innerHTML = `
            <div style="padding: 15px; background-color: #ffebee; color: #c62828; border-radius: 8px; margin: 15px 0;">
                <h4 style="margin-top: 0;">Erreur</h4>
                <p>${message}</p>
                ${suggestion ? `<p style="font-size: 14px; color: #666;">${suggestion}</p>` : ''}
            </div>
        `;
    };
    
    try {
        // Importer dynamiquement l'API de football
        const { default: FootballAPI } = await import('./football-api.js');
        const api = new FootballAPI();
        
        // Charger les matchs en direct
        const liveSection = panel.querySelector('#live-section');
        showLoading(liveSection, 'Chargement des matchs en direct...');
        
        console.log('Chargement des matchs en direct...');
        
        // Ajouter un timeout pour éviter que l'utilisateur attende trop longtemps
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Délai d'attente dépassé")), 10000)
        );
        
        // Charger les données avec un timeout
        const liveData = await Promise.race([
            api.getLiveMatches(),
            timeoutPromise
        ]);
        
        // Maintenant que liveData est défini, on peut l'afficher
        console.log("Réponse brute de l'API:", JSON.stringify(liveData));
        console.log('Données des matchs en direct (détaillées):', JSON.stringify(liveData));
        
        // Pour les matchs à venir
const upcomingSection = panel.querySelector('#upcoming-section');
showLoading(upcomingSection, 'Chargement des prochains matchs...');
        
        console.log('Chargement des matchs à venir...');
        const upcomingData = await api.getUpcomingMatches();
        console.log('Données des matchs à venir:', upcomingData);
        
        const standingsSection = panel.querySelector('#standings-section');
showLoading(standingsSection, 'Chargement des classements...');
        
        console.log('Chargement des classements...');
        const standingsData = await api.getLeagueStandings();
        console.log('Données des classements:', standingsData);
        
        // Traiter les matchs en direct
        if (liveData && liveData.matches && Array.isArray(liveData.matches) && liveData.matches.length > 0) {
            // Votre code existant pour les matchs en direct
        } else {
            liveSection.innerHTML = `
                <div class="no-matches-container">
                    <div style="font-size: 60px; margin-bottom: 20px;">⚽</div>
                    <h3>Aucun match de Ligue 1 ou Ligue 2 en direct actuellement</h3>
                    <p>Consultez les prochains matchs ou les classements.</p>
                </div>
            `;
        }
        
        // Traiter les matchs à venir
        if (upcomingData.matches && upcomingData.matches.length > 0) {
            // Filtrer pour les matchs français
            const frenchMatches = upcomingData.matches.filter(match => 
                match.competition?.name?.includes('Ligue 1') || 
                match.competition?.name?.includes('Ligue 2')
            );
            
            if (frenchMatches.length > 0) {
                upcomingSection.innerHTML = `
                    <h4>Prochains matchs de Ligue 1 & Ligue 2</h4>
                    <div class="matches-grid">
                        ${frenchMatches.map(match => {
                            const matchDate = new Date(match.utcDate);
                            const formattedDate = matchDate.toLocaleDateString('fr-FR');
                            const formattedTime = matchDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
                            
                            return `
                                <div class="match-card upcoming">
                                    <div class="match-competition">${match.competition?.name || 'Match'}</div>
                                    <div class="match-teams">
                                        <div class="team home-team">${match.homeTeam.name}</div>
                                        <div class="vs">VS</div>
                                        <div class="team away-team">${match.awayTeam.name}</div>
                                    </div>
                                    <div class="match-date">${formattedDate} - ${formattedTime}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            } else {
                // Aucun match français à venir, mais peut-être d'autres matchs
                upcomingSection.innerHTML = `
                    <div class="no-matches-card">
                        <h4>Aucun match de Ligue 1 ou Ligue 2 à venir prochainement</h4>
                        <p>Voici quelques matchs internationaux à venir</p>
                    </div>
                    <div class="matches-grid">
                        ${upcomingData.matches.slice(0, 4).map(match => {
                            const matchDate = new Date(match.utcDate);
                            const formattedDate = matchDate.toLocaleDateString('fr-FR');
                            const formattedTime = matchDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
                            
                            return `
                                <div class="match-card upcoming">
                                    <div class="match-competition">${match.competition?.name || 'Match'}</div>
                                    <div class="match-teams">
                                        <div class="team home-team">${match.homeTeam.name}</div>
                                        <div class="vs">VS</div>
                                        <div class="team away-team">${match.awayTeam.name}</div>
                                    </div>
                                    <div class="match-date">${formattedDate} - ${formattedTime}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }
        } else {
            // Pas de matchs à venir disponibles
upcomingSection.innerHTML = `
    <div class="no-data-container" style="text-align: center; padding: 30px; background-color: #f5f5f5; border-radius: 10px; margin: 20px 0;">
        <div style="font-size: 40px; margin-bottom: 15px;">📅</div>
        <h4>Aucun match à venir disponible</h4>
        <p>Les données des prochains matchs de Ligue 1 et Ligue 2 ne sont pas disponibles pour le moment.</p>
    </div>
`;
        }
        
        // Traiter les classements
if (standingsData.standings && standingsData.standings.length > 0) {
    let standingsHTML = '';
    
    // Regrouper par compétition
    standingsData.competitions.forEach((competition, index) => {
        if (standingsData.standings[index]) {
            standingsHTML += `
                <h4>${competition.name || 'Classement'}</h4>
                <div class="standings-table-container">
                    <table class="standings-table">
                        <thead>
                            <tr>
                                <th>Pos</th>
                                <th class="team-column">Équipe</th>
                                <th>J</th>
                                <th>G</th>
                                <th>N</th>
                                <th>P</th>
                                <th>BP</th>
                                <th>BC</th>
                                <th>Diff</th>
                                <th>Pts</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${standingsData.standings[index].table.map(entry => `
                                <tr>
                                    <td>${entry.position}</td>
                                    <td class="team-column">${entry.team.name}</td>
                                    <td>${entry.playedGames}</td>
                                    <td>${entry.won}</td>
                                    <td>${entry.draw}</td>
                                    <td>${entry.lost}</td>
                                    <td>${entry.goalsFor}</td>
                                    <td>${entry.goalsAgainst}</td>
                                    <td>${entry.goalDifference}</td>
                                    <td><strong>${entry.points}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div style="margin-bottom: 30px;"></div>
            `;
        }
    });
    
    standingsSection.innerHTML = standingsHTML;
} else {
            // Pas de classements disponibles
        standingsSection.innerHTML = `
            <div class="no-data-container" style="text-align: center; padding: 30px; background-color: #f5f5f5; border-radius: 10px; margin: 20px 0;">
                <div style="font-size: 40px; margin-bottom: 15px;">🏆</div>
                <h4>Classement non disponible</h4>
                <p>Les données de classement de Ligue 1 et Ligue 2 ne sont pas disponibles pour le moment.</p>
                <p style="font-size: 14px; margin-top: 20px; color: #666;">Réessayez ultérieurement ou consultez le site officiel de la Ligue 1.</p>
            </div>
        `;
    }
    
    // Ajouter un bouton de rafraîchissement (placé ici pour qu'il apparaisse dans tous les cas)
        standingsSection.innerHTML += `
            <div style="text-align: center; margin-top: 20px;">
                <button id="refresh-football-data" style="padding: 8px 16px; background-color: var(--primary-color, #1a237e); color: white; border: none; border-radius: 20px; cursor: pointer;">
                    <span class="material-icons" style="vertical-align: middle; margin-right: 5px;">refresh</span>
                    Actualiser les données
                </button>
            </div>
        `;
        
        // Ajouter l'écouteur d'événement après avoir inséré le HTML
        setTimeout(() => {
            const refreshBtn = panel.querySelector('#refresh-football-data');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.loadFootballData(panel);
                });
            }
        }, 0);
        
        // Ajouter styles pour les cartes et le tableau - DÉPLACÉ À L'INTÉRIEUR DU TRY
        const style = document.createElement('style');
        style.textContent = `
            .no-matches-container {
                text-align: center;
                padding: 30px;
                background-color: var(--bg-color-light, #f5f5f5);
                border-radius: 10px;
                margin: 20px 0;
            }
            
            .no-matches-card {
                background-color: var(--bg-color-light, #f5f5f5);
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin-bottom: 20px;
            }
            
            .no-matches-card h4 {
                margin-top: 0;
                color: var(--text-primary, #333);
            }
            
            .section-title {
                margin-top: 30px;
                margin-bottom: 15px;
                border-bottom: 1px solid var(--border-color, #ddd);
                padding-bottom: 8px;
            }
        `;
        document.head.appendChild(style);
        
        // Si pas de matchs en direct, basculer automatiquement vers l'onglet classements - DÉPLACÉ À L'INTÉRIEUR DU TRY
        if (!liveData.matches || liveData.matches.length === 0) {
            // Trouver l'onglet des classements et simuler un clic
            const standingsTab = panel.querySelector('.tab-btn[data-tab="standings"]');
            if (standingsTab) {
                standingsTab.click();
            }
        }
        
    } catch (error) {
    console.error('Erreur chargement données football:', error);
    
    // Pour les différentes sections
    const liveSection = panel.querySelector('#live-section');
    const upcomingSection = panel.querySelector('#upcoming-section');
    const standingsSection = panel.querySelector('#standings-section');
    
    showError('Impossible de charger les données de football', liveSection, 'Vérifiez votre connexion internet et réessayez plus tard.');
    showError('Impossible de charger les prochains matchs', upcomingSection);
    showError('Impossible de charger les classements', standingsSection, 'Vous pouvez consulter les classements sur le site officiel de la ligue.');
    
    // Ajouter un bouton pour réessayer
    standingsSection.innerHTML += `
        <div style="text-align: center; margin-top: 20px;">
            <button id="refresh-football-data" style="padding: 8px 16px; background-color: var(--primary-color, #1a237e); color: white; border: none; border-radius: 20px; cursor: pointer;">
                <span class="material-icons" style="vertical-align: middle; margin-right: 5px;">refresh</span>
                Réessayer
            </button>
        </div>
    `;
    
    // Ajouter l'écouteur d'événement pour le bouton
    setTimeout(() => {
        const refreshBtn = panel.querySelector('#refresh-football-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadFootballData(panel);
            });
        }
    }, 0);
}
}
// Méthode d'aide pour obtenir l'info du prochain match
getNextMatchInfo(upcomingData) {
    if (upcomingData.matches && upcomingData.matches.length > 0) {
        // Filtrer pour les matchs français et prendre le premier
        const frenchMatches = upcomingData.matches.filter(match => 
            match.competition?.name?.includes('Ligue 1') || 
            match.competition?.name?.includes('Ligue 2')
        );
        
        if (frenchMatches.length > 0) {
            const nextMatch = frenchMatches[0];
            const matchDate = new Date(nextMatch.utcDate);
            const formattedDate = matchDate.toLocaleDateString('fr-FR');
            const formattedTime = matchDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
            
            return `${nextMatch.homeTeam.name} vs ${nextMatch.awayTeam.name} le ${formattedDate} à ${formattedTime}`;
        }
    }
    
    return "Aucune information disponible";
}
}
export default ContentManager;
