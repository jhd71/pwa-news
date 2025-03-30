// app.js
import { showToast } from './utils.js';
import ChatManager from './chatManager.js';
import ContentManager from './content.js';

class App {
    constructor() {
        // Sites par défaut - ne peuvent pas être supprimés
        this.defaultSites = [
            // Actualités locales
            {
                title: 'Montceau News',
                url: 'https://montceau-news.com',
                icon: 'images/INFOS.png',
                isDefault: true,
                section: 'news'
            },
            {
                title: "L'Informateur",
                url: 'https://linformateurdebourgogne.com',
                icon: 'images/INFOS.png',
                isDefault: true,
                section: 'news'
            },
            {
                title: 'Le JSL',
                url: 'https://www.lejsl.com/edition-montceau-les-mines',
                icon: 'images/INFOS.png',
                isDefault: true,
                section: 'news'
            },
            {
                title: 'Creusot Infos',
                url: 'https://www.creusot-infos.com',
                icon: 'images/INFOS.png',
                isDefault: true,
                section: 'news'
            },
            // Section Radio
            {
                title: 'France Bleu Bourgogne',
                url: 'https://www.radio-en-ligne.fr/france-bleu-bourgogne',
                icon: 'images/INFOS.png',
                isDefault: true,
                section: 'radio'
            },
            {
                title: 'Radio Sans Pub',
                url: 'https://www.radio-en-ligne.fr/radio-sans-pub',
                icon: 'images/INFOS.png',
                isDefault: true,
                section: 'radio'
            },			
            // Section TV en Direct
            {
                title: 'France 3 Bourgogne',
                url: 'https://www.francebleu.fr/tv/direct/bourgogne',
                icon: 'images/INFOS.png',
                isDefault: true,
                section: 'tv'
            },
            {
                title: 'BFMTV',
                url: 'https://www.bfmtv.com/en-direct/',
                icon: 'images/INFOS.png',
                isDefault: true,
                section: 'tv'
            },
            {
                title: 'FranceTV Info',
                url: 'https://www.francetvinfo.fr/en-direct/tv.html',
                icon: 'images/INFOS.png',
                isDefault: true,
                section: 'tv'
            },
            // Section Réseaux Sociaux
            {
                title: 'YouTube',
                url: 'https://www.youtube.com/feed/trending',
                icon: 'images/INFOS.png',
                isDefault: true,
                section: 'social'
            },
            {
               title: 'TikTok',
               url: 'https://www.tiktok.com/?lang=fr',
               icon: 'images/INFOS.png',
               isDefault: true,
               section: 'social'
            },
            {
              title: "Sondage : votre avis",
              icon: "images/INFOS.png",
              isDefault: true,
              section: "social",
              isPoll: true
            }      
        ];

        // État de l'application
        this.sites = [...this.defaultSites];
        this.currentLayout = localStorage.getItem('layout') || 'grid';
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        
        // Initialisation des managers
        this.initManagers();
    }

    async initManagers() {
        try {
            // Initialiser Content Manager
            this.contentManager = new ContentManager();
            await this.contentManager.init();
            console.log('Content Manager initialisé');

            // Initialiser Chat Manager
            this.chatManager = new ChatManager();
            await this.chatManager.init();
            console.log('Chat Manager initialisé');

            // Une fois les managers initialisés, continuer avec le reste
            await this.init();
        } catch (error) {
            console.error('Erreur initialisation managers:', error);
        }
    }

    async init() {
        try {
            // Charger les sites personnalisés
            this.loadCustomSites();
            
            // Initialiser l'interface
            this.initializeUI();
            
            // Mettre en place les écouteurs d'événements
            this.setupEventListeners();
            
            // Appliquer le thème
            this.applyTheme();
            
            // Vérifier si c'est une PWA installable
            this.checkPWAInstallable();

            // Mettre en place le swipe pour supprimer
            this.setupSwipeToDelete();

            // Mettre en place les écouteurs pour les modals
            this.setupModalListeners();

            console.log('Application initialisée avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
        }
    }

    initializeUI() {
        // Créer les tuiles
        this.renderTiles();
        
        // Appliquer le layout actuel
        this.applyLayout(this.currentLayout);
        
        // Mettre à jour l'interface du thème
        this.updateThemeUI();
    }

    setupEventListeners() {
        // Menu et paramètres
        document.getElementById('menuButton')?.addEventListener('click', () => this.toggleMenu());
        document.getElementById('settingsButton')?.addEventListener('click', () => this.toggleSettings());
        
        // Recherche Google
        document.getElementById('searchForm')?.addEventListener('submit', (e) => this.handleSearch(e));
        
        // Navigation du bas
        document.getElementById('darkModeToggle')?.addEventListener('click', () => this.toggleDarkMode());
        document.getElementById('addSiteBtn')?.addEventListener('click', () => this.showAddSiteModal());
        document.getElementById('layoutToggle')?.addEventListener('click', () => this.showLayoutMenu());
    }

    renderTiles() {
  const container = document.getElementById('tileContainer');
  container.innerHTML = '';

  console.log("Liste des tuiles chargées :", this.sites); // ← Important

  this.sites.forEach((site) => {
    if (site.isPoll) {
      const pollDiv = document.createElement("div");
      pollDiv.className = "tile";
      pollDiv.innerHTML = `
        <div class="poll-tile" id="pollTile">
          <h3>${site.title}</h3>
          <p>Chargement du sondage...</p>
        </div>
      `;
      container.appendChild(pollDiv);
      return;
    }

    const tile = document.createElement("div");
    tile.className = `tile${site.isDefault ? '' : ' removable'}`;
    tile.innerHTML = `
      <a href="${site.url}" target="_blank" class="tile-content">
        <img src="${site.icon}" alt="${site.title}" class="tile-icon">
        <div class="tile-title">${site.title}</div>
      </a>
    `;
    container.appendChild(tile);
  });
}

    setupModalListeners() {
        // Modal d'ajout de site
        document.getElementById('addSiteForm')?.addEventListener('submit', (e) => this.handleAddSite(e));
        document.getElementById('cancelAddSite')?.addEventListener('click', () => this.hideAddSiteModal());

        // Modal de suppression
        document.getElementById('cancelDelete')?.addEventListener('click', () => this.hideDeleteModal());
        document.getElementById('confirmDelete')?.addEventListener('click', () => this.confirmDelete());
    }

    setupSwipeToDelete() {
        let touchStartX = 0;
        let currentTile = null;

        const container = document.getElementById('tileContainer');
        if (!container) return;

        container.addEventListener('touchstart', (e) => {
            const tile = e.target.closest('.tile.removable');
            if (tile) {
                touchStartX = e.touches[0].clientX;
                currentTile = tile;
            }
        });

        container.addEventListener('touchmove', (e) => {
            if (!currentTile) return;

            const touchX = e.touches[0].clientX;
            const diff = touchX - touchStartX;

            if (diff < -50) {
                currentTile.classList.add('slide-out');
            } else {
                currentTile.classList.remove('slide-out');
            }
        });

        container.addEventListener('touchend', () => {
            if (currentTile?.classList.contains('slide-out')) {
                this.showDeleteConfirmation(currentTile);
            }
            currentTile = null;
        });
    }

    handleSearch(e) {
        e.preventDefault();
        const query = document.getElementById('searchInput')?.value.trim();
        if (query) {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = '';
        }
    }

    toggleMenu() {
        document.getElementById('sidebar')?.classList.toggle('active');
    }

    toggleSettings() {
        document.getElementById('settingsPanel')?.classList.toggle('hidden');
    }

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('darkMode', this.isDarkMode);
        this.applyTheme();
        showToast(`Mode ${this.isDarkMode ? 'sombre' : 'clair'} activé`);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
        this.updateThemeUI();
    }

    updateThemeUI() {
        const themeButton = document.getElementById('darkModeToggle');
        if (!themeButton) return;

        const icon = themeButton.querySelector('.material-icons');
        const text = themeButton.querySelector('span:not(.material-icons)');
        
        if (icon) icon.textContent = this.isDarkMode ? 'light_mode' : 'dark_mode';
        if (text) text.textContent = this.isDarkMode ? 'Clair' : 'Sombre';
    }

    showAddSiteModal() {
        document.getElementById('addSiteModal')?.classList.remove('hidden');
    }

    hideAddSiteModal() {
        const modal = document.getElementById('addSiteModal');
        const form = document.getElementById('addSiteForm');
        if (modal) modal.classList.add('hidden');
        if (form) form.reset();
    }

    async handleAddSite(e) {
        e.preventDefault();
        const urlInput = document.getElementById('newSiteUrl');
        const titleInput = document.getElementById('newSiteTitle');
        if (!urlInput || !titleInput) return;

        const url = urlInput.value.trim();
        const title = titleInput.value.trim();

        if (!url || !title) return;

        const newSite = {
            title,
            url: url.startsWith('http') ? url : `https://${url}`,
            icon: 'images/INFOS.png',
            isDefault: false
        };

        this.sites.push(newSite);
        this.saveCustomSites();
        this.renderTiles();
        this.hideAddSiteModal();
        showToast('Site ajouté avec succès');
    }

    showLayoutMenu() {
        document.getElementById('layoutMenu')?.classList.toggle('hidden');
    }

    applyLayout(layout) {
        const container = document.getElementById('tileContainer');
        if (container) {
            container.className = `tile-container ${layout}`;
            this.currentLayout = layout;
            localStorage.setItem('layout', layout);
        }
    }

    showHelp() {
        document.getElementById('helpModal')?.classList.remove('hidden');
    }

    showDeleteConfirmation(tile) {
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal && tile) {
            deleteModal.classList.remove('hidden');
            deleteModal.dataset.tileIndex = Array.from(tile.parentNode.children).indexOf(tile);
        }
    }

    hideDeleteModal() {
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) deleteModal.classList.add('hidden');
        this.renderTiles(); // Réinitialiser l'affichage
    }

    confirmDelete() {
        const deleteModal = document.getElementById('deleteModal');
        if (!deleteModal) return;

        const index = parseInt(deleteModal.dataset.tileIndex);
        
        if (this.sites[index] && !this.sites[index].isDefault) {
            this.sites.splice(index, 1);
            this.saveCustomSites();
            this.renderTiles();
            showToast('Site supprimé');
        }
        
        this.hideDeleteModal();
    }

    loadCustomSites() {
        const customSites = localStorage.getItem('customSites');
        if (customSites) {
            try {
                const parsed = JSON.parse(customSites);
                this.sites = [...this.defaultSites, ...parsed];
            } catch (error) {
                console.error('Erreur lors du chargement des sites:', error);
                this.sites = [...this.defaultSites];
            }
        }
    }

    saveCustomSites() {
        const customSites = this.sites.filter(site => !site.isDefault);
        localStorage.setItem('customSites', JSON.stringify(customSites));
    }

    checkPWAInstallable() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            showToast('Cette application peut être installée sur votre appareil');
        });
    }
}

// Initialiser l'application au chargement
window.addEventListener('load', () => {
    try {
        window.app = new App();
    } catch (error) {
        console.error('Erreur lors du démarrage de l\'application:', error);
    }
});

export default App;
