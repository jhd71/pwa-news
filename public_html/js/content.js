class ContentManager {
    constructor() {
        this.tileContainer = null;
        this.isDarkMode = localStorage.getItem('theme') === 'dark';
        this.fontSize = localStorage.getItem('fontSize') || 'normal';
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
// Gestion des boutons
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        }

        const layoutToggle = document.getElementById('layoutToggle');
        if (layoutToggle) {
            layoutToggle.addEventListener('click', () => this.toggleLayout());
        }

        const helpBtn = document.getElementById('helpBtn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => this.showHelp());
        }

        const settingsButton = document.getElementById('settingsButton');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                const existingPanel = document.querySelector('.settings-menu');
                if (existingPanel) {
                    existingPanel.remove();
                }
                this.showSettings();
            });
        }

        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        }

        const addSiteBtn = document.getElementById('addSiteBtn');
        if (addSiteBtn) {
            addSiteBtn.addEventListener('click', () => this.showAddSiteDialog());
        }
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

    handleSearch(e) {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput.value.trim()) {
            e.preventDefault();
            this.showToast('Veuillez saisir un terme de recherche');
        }
    }

    showSettings() {
    const existingPanel = document.querySelector('.settings-menu');
    if (existingPanel) {
        existingPanel.remove();
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

    // Gestionnaire pour la fermeture
    const closeBtn = panel.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => panel.remove());
    }

    // Gestionnaire pour les tuiles de taille
    panel.querySelectorAll('.font-size-tile').forEach(tile => {
        tile.addEventListener('click', () => {
            const size = tile.dataset.fontSize;
            this.changeFontSize(size);
            // Mettre à jour l'état actif des tuiles
            panel.querySelectorAll('.font-size-tile').forEach(t => {
                t.classList.toggle('active', t.dataset.fontSize === size);
            });
        });
    });

    // Fermeture lors du clic en dehors
    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !e.target.closest('#settingsButton')) {
            panel.remove();
        }
    }, { capture: true });
}

// Assurez-vous que ces méthodes sont présentes dans votre classe
toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    const newTheme = this.isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    this.updateThemeIcon(this.isDarkMode);
    this.showToast(`Mode ${this.isDarkMode ? 'sombre' : 'clair'} activé`);
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

changeFontSize(size) {
    this.fontSize = size;
    localStorage.setItem('fontSize', size);
    document.documentElement.setAttribute('data-font-size', size);
    this.showToast(`Taille de texte : ${
        size === 'small' ? 'petite' :
        size === 'normal' ? 'normale' :
        'grande'
    }`);
}

updateLayoutIcon(layout) {
    const layoutButton = document.getElementById('layoutToggle');
    if (layoutButton) {
        const icon = layoutButton.querySelector('.material-icons');
        const text = layoutButton.querySelector('span:not(.material-icons)');
        if (icon && text) {
            switch (layout) {
                case 'grid':
                    icon.textContent = 'grid_view';
                    text.textContent = 'Grille';
                    break;
                case 'large':
                    icon.textContent = 'view_module';
                    text.textContent = 'Grandes';
                    break;
                case 'list':
                    icon.textContent = 'view_list';
                    text.textContent = 'Liste';
                    break;
            }
        }
    }
}
setupTiles() {
        if (!this.tileContainer) return;

        this.tileContainer.innerHTML = '';

        // Sites par défaut
        const defaultSites = [
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
            },
            {
                title: 'Radio Sans Pub',
                url: 'https://www.radio-en-ligne.fr/radio-sans-pub/',
                mobileUrl: 'https://www.radio-en-ligne.fr/radio-sans-pub/',
                isDefault: true
            }
        ];

        // Créer les tuiles par défaut
        defaultSites.forEach(site => {
            const tile = this.createTile(site);
            this.tileContainer.appendChild(tile);
        });

        // Charger les sites personnalisés
        try {
            const saved = localStorage.getItem('customSites');
            if (saved) {
                const customSites = JSON.parse(saved);
                if (Array.isArray(customSites) && customSites.length > 0) {
                    // Ajouter le séparateur
                    const separator = document.createElement('div');
                    separator.className = 'separator';
                    separator.textContent = '⎯⎯⎯  Autres sites  ⎯⎯⎯';
                    this.tileContainer.appendChild(separator);

                    // Ajouter les sites personnalisés
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

    async showAddSiteDialog() {
        // Demander le titre
        const title = prompt('Nom du site :');
        if (!title || title.trim() === '') {
            this.showToast('Le nom du site est obligatoire');
            return;
        }

        // Demander et valider l'URL principale
        let url = prompt('URL du site (doit commencer par https://) :');
        if (!this.validateUrl(url)) {
            this.showToast('URL invalide. L\'URL doit commencer par https://');
            return;
        }

        // URL mobile optionnelle
        let mobileUrl = prompt('URL version mobile (optionnel, doit commencer par https://) :');
        if (mobileUrl && !this.validateUrl(mobileUrl)) {
            this.showToast('URL mobile invalide. L\'URL doit commencer par https://');
            return;
        }

        try {
            // Charger les sites existants
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
                title: title.trim(),
                url: url.trim(),
                mobileUrl: (mobileUrl || url).trim(),
                isDefault: false,
                timestamp: Date.now()
            };

            // Ajouter et sauvegarder
            customSites.push(newSite);
            localStorage.setItem('customSites', JSON.stringify(customSites));

            // Rafraîchir l'affichage
            this.setupTiles();
            this.showToast('Site ajouté avec succès');
        } catch (error) {
            console.error('Erreur ajout site:', error);
            this.showToast('Erreur lors de l\'ajout du site');
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

        // Gestion de l'appui long sur mobile
        let longPressTimer;
        let isLongPress = false;

        tile.addEventListener('touchstart', (e) => {
            isLongPress = false;
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                const touch = e.touches[0];
                this.showTileMenu(tile, site, touch.clientX, touch.clientY);
            }, 500);
        });

        tile.addEventListener('touchend', (e) => {
            clearTimeout(longPressTimer);
            if (isLongPress) {
                e.preventDefault();
            }
        });

        tile.addEventListener('touchmove', () => {
            clearTimeout(longPressTimer);
        });

        return tile;
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

        // Ajuster la position du menu
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

        // Gestionnaire d'événements du menu
        menu.addEventListener('click', async (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            menu.remove();

            if (button.classList.contains('edit')) {
                await this.editSite(site);
            } else if (button.classList.contains('delete')) {
                await this.deleteSite(site);
            } else if (button.classList.contains('open-mobile')) {
                window.open(site.mobileUrl || site.url, '_blank');
            } else if (button.classList.contains('open-desktop')) {
                window.open(site.url, '_blank');
            }
        });

        // Fermer au clic en dehors
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

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        const newTheme = this.isDarkMode ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(this.isDarkMode);
        this.showToast(`Mode ${this.isDarkMode ? 'sombre' : 'clair'} activé`);
    }

    toggleLayout() {
        const layouts = ['grid', 'large', 'list'];
        const currentLayout = localStorage.getItem('layout') || 'grid';
        const currentIndex = layouts.indexOf(currentLayout);
        const nextLayout = layouts[(currentIndex + 1) % layouts.length];
        
        this.setLayout(nextLayout);
        this.showToast(`Vue : ${
            nextLayout === 'grid' ? 'grille' : 
            nextLayout === 'large' ? 'grandes tuiles' : 
            'liste'
        }`);
    }

    setLayout(layout) {
        if (this.tileContainer) {
            this.tileContainer.classList.remove('grid', 'large', 'list');
            this.tileContainer.classList.add(layout);
            localStorage.setItem('layout', layout);
            this.updateLayoutIcon(layout);
        }
    }

    showHelp() {
        const helpModal = document.getElementById('helpModal');
        if (helpModal) {
            helpModal.classList.remove('hidden');
            
            const closeBtn = helpModal.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    helpModal.classList.add('hidden');
                });
            }

            window.onclick = (event) => {
                if (event.target === helpModal) {
                    helpModal.classList.add('hidden');
                }
            };
        }
    }

    changeFontSize(size) {
        this.fontSize = size;
        localStorage.setItem('fontSize', size);
        document.documentElement.setAttribute('data-font-size', size);
        this.showToast(`Taille de texte : ${
            size === 'small' ? 'petite' :
            size === 'normal' ? 'normale' :
            'grande'
        }`);
    }

    updateLayoutIcon(layout) {
        const layoutButton = document.getElementById('layoutToggle');
        if (layoutButton) {
            const icon = layoutButton.querySelector('.material-icons');
            const text = layoutButton.querySelector('span:not(.material-icons)');
            if (icon && text) {
                switch (layout) {
                    case 'grid':
                        icon.textContent = 'grid_view';
                        text.textContent = 'Grille';
                        break;
                    case 'large':
                        icon.textContent = 'view_module';
                        text.textContent = 'Grandes';
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
}

export default ContentManager;
