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
		this.handlePWAInstallPrompt();
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
        tile.innerHTML = `
            <div class="tile-content">
                <div class="tile-title">${site.title}</div>
            </div>
        `;

        // Gestion du clic normal
        tile.addEventListener('click', () => {
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
 
 handlePWAInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e;

        const menuInstall = document.getElementById('menuInstall');
        if (menuInstall) {
            menuInstall.classList.add('visible');
            menuInstall.onclick = async () => {
                try {
                    if (this.deferredPrompt) {
                        this.deferredPrompt.prompt();
                        const { outcome } = await this.deferredPrompt.userChoice;
                        if (outcome === 'accepted') {
                            console.log("✅ PWA installée !");
                            this.showToast("Application installée !");
                            menuInstall.classList.remove('visible');
                        } else {
                            console.log("❌ Installation refusée");
                        }
                        this.deferredPrompt = null;
                    }
                } catch (err) {
                    console.error("Erreur installation PWA :", err);
                    this.showToast("Erreur lors de l'installation");
                }
            };
        }
    });

    window.addEventListener('appinstalled', () => {
        console.log("📲 Application PWA installée !");
        const menuInstall = document.getElementById('menuInstall');
        if (menuInstall) menuInstall.classList.remove('visible');

        const badge = document.getElementById('installBadge');
        if (badge) {
            badge.classList.remove('hidden');
            badge.classList.add('show');
            setTimeout(() => {
                badge.classList.remove('show');
                badge.classList.add('hidden');
            }, 3000);
        }

        this.showToast("Application installée !");
        this.deferredPrompt = null;
    });
}

export default ContentManager;
