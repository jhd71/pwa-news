// managers.js
export class EventEmitter {
    constructor() {
        this.events = new Map();
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event).add(callback);
    }

    emit(event, data) {
        if (this.events.has(event)) {
            for (const callback of this.events.get(event)) {
                callback(data);
            }
        }
    }
}

export class WidgetManager extends EventEmitter {
    constructor() {
        super();
        this.widgets = new Map();
        this.draggedElement = null;
        this.isDragging = false;
    }

    async init() {
        console.log('Initialisation WidgetManager...');
        await this.loadWidgets();
        this.setupDragAndDrop();
        this.setupEventListeners();
    }

    async loadWidgets() {
        const savedWidgets = localStorage.getItem('widgets');
        if (savedWidgets) {
            try {
                const widgetConfig = JSON.parse(savedWidgets);
                // Vider d'abord le container
                const container = document.getElementById('tileContainer');
                if (container) {
                    container.innerHTML = '';
                }
                for (const [id, config] of Object.entries(widgetConfig)) {
                    await this.createWidget(id, config);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des widgets:', error);
                await this.createDefaultWidgets();
            }
        } else {
            await this.createDefaultWidgets();
        }
    }async createDefaultWidgets() {
        const container = document.getElementById('tileContainer');
        if (container) {
            container.innerHTML = '';
        }

        // Sites d'actualités locales
        const localNews = [
            {
                id: 'montceau-news',
                title: 'Montceau News',
                url: 'https://montceau-news.com/',
                mobileUrl: 'https://montceau-news.com/',
                color: '#1a237e',
                isDefault: true,
                section: 'local'
            },
            {
                id: 'linformateur',
                title: 'L\'Informateur de Bourgogne',
                url: 'https://linformateurdebourgogne.com/',
                mobileUrl: 'https://linformateurdebourgogne.com/',
                color: '#1a237e',
                isDefault: true,
                section: 'local'
            },
            {
                id: 'le-jsl',
                title: 'Le JSL',
                url: 'https://www.lejsl.com/edition-montceau-les-mines',
                mobileUrl: 'https://www.lejsl.com/edition-montceau-les-mines',
                color: '#1a237e',
                isDefault: true,
                section: 'local'
            },
            {
                id: 'creusot-infos',
                title: 'Creusot Infos',
                url: 'https://www.creusot-infos.com',
                mobileUrl: 'https://www.creusot-infos.com/?m=1',
                color: '#1a237e',
                isDefault: true,
                section: 'local'
            }
        ];

        // Créer les sites locaux
        for (const widget of localNews) {
            await this.createWidget(widget.id, widget);
        }

        // Ajouter le séparateur
        const separator = document.createElement('div');
        separator.className = 'separator';
        separator.textContent = '⎯⎯⎯  Autres sites  ⎯⎯⎯';
        container.appendChild(separator);

        // Sites généraux
        const generalSites = [
            {
                id: 'radio-sans-pub',
                title: 'Radio Sans Pub',
                url: 'https://www.radio-en-ligne.fr/radio-sans-pub/',
                mobileUrl: 'https://www.radio-en-ligne.fr/radio-sans-pub/',
                color: '#1a237e',
                isDefault: true,
                section: 'general'
            },
            {
                id: 'morandini',
                title: 'Jean-Marc Morandini',
                url: 'https://www.jeanmarcmorandini.com/',
                mobileUrl: 'https://www.jeanmarcmorandini.com/',
                color: '#1a237e',
                isDefault: true,
                section: 'general'
            }
        ];

        // Créer les sites généraux
        for (const widget of generalSites) {
            await this.createWidget(widget.id, widget);
        }

        this.saveWidgets();
    }

    getMobileUrl(config) {
        return config.mobileUrl || config.url;
    }

    async createWidget(id, config) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.draggable = true;
        tile.id = `widget-${id}`;
        tile.dataset.widgetId = id;
        tile.style.backgroundColor = config.color || '#1a237e';
        
        tile.innerHTML = `
            <div class="tile-content">
                <div class="tile-title">${config.title}</div>
            </div>
        `;

        tile.addEventListener('click', (e) => {
            if (!this.isDragging) {
                e.preventDefault();
                window.open(this.getMobileUrl(config), '_blank');
            }
        });

        const container = document.getElementById('tileContainer');
        if (container) {
            container.appendChild(tile);
        }
        this.widgets.set(id, { element: tile, config });
        
        return tile;
    }setupDragAndDrop() {
        const container = document.getElementById('tileContainer');

        container.addEventListener('dragstart', (e) => {
            const tile = e.target.closest('.tile');
            if (!tile) return;
            
            const section = this.getWidgetSection(tile);
            const separator = container.querySelector('.separator');
            if (!separator) return;

            // Stocker la section dans le dataTransfer
            e.dataTransfer.setData('text/plain', section);
            
            this.draggedElement = tile;
            this.isDragging = true;
            tile.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        container.addEventListener('dragend', (e) => {
            const tile = e.target.closest('.tile');
            if (!tile) return;
            
            tile.classList.remove('dragging');
            this.draggedElement = null;
            this.isDragging = false;
            this.saveWidgets();
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!this.draggedElement) return;

            // Vérifier la section du widget en cours de déplacement
            const section = this.getWidgetSection(this.draggedElement);
            const separator = container.querySelector('.separator');
            const sepRect = separator.getBoundingClientRect();

            // Empêcher le passage à travers le séparateur
            if ((section === 'local' && e.clientY > sepRect.bottom) ||
                (section === 'general' && e.clientY < sepRect.top)) {
                return;
            }

            const afterElement = this.getDragAfterElement(container, e.clientY);
            if (afterElement) {
                container.insertBefore(this.draggedElement, afterElement);
            } else {
                container.appendChild(this.draggedElement);
            }
        });

        // Gestion des appuis longs sur mobile
        let longPressTimer;
        let touchStartY;

        container.addEventListener('touchstart', (e) => {
            const tile = e.target.closest('.tile');
            if (!tile) return;

            touchStartY = e.touches[0].clientY;
            longPressTimer = setTimeout(() => {
                this.showTileMenu(tile, e.touches[0].clientX, e.touches[0].clientY);
            }, 500);
        });

        container.addEventListener('touchend', () => {
            clearTimeout(longPressTimer);
        });

        container.addEventListener('touchmove', (e) => {
            if (Math.abs(e.touches[0].clientY - touchStartY) > 10) {
                clearTimeout(longPressTimer);
            }
        });
    }

    getWidgetSection(tile) {
        const widgetId = tile.dataset.widgetId;
        const widget = this.widgets.get(widgetId);
        return widget?.config.section || 'general';
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.tile:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }setupEventListeners() {
        // Menu contextuel au clic droit
        document.addEventListener('contextmenu', (e) => {
            const tile = e.target.closest('.tile');
            if (tile) {
                e.preventDefault();
                this.showTileMenu(tile, e.clientX, e.clientY);
            }
        });

        // Bouton d'ajout
        const addButton = document.getElementById('addSiteBtn');
        if (addButton) {
            addButton.addEventListener('click', () => this.showAddTileDialog());
        }
    }

    showTileMenu(tile, x, y) {
        const existingMenu = document.querySelector('.tile-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const widgetId = tile.dataset.widgetId;
        const widget = this.widgets.get(widgetId);
        
        const menu = document.createElement('div');
        menu.className = 'tile-menu';

        if (widget && widget.config.isDefault) {
            // Menu pour les tuiles par défaut
            menu.innerHTML = `
                <button class="menu-item">
                    <span class="material-icons">info</span>
                    Site par défaut
                </button>
                <button class="menu-item open-mobile">
                    <span class="material-icons">phone_android</span>
                    Version mobile
                </button>
                <button class="menu-item open-desktop">
                    <span class="material-icons">computer</span>
                    Version bureau
                </button>
            `;
        } else {
            // Menu pour les tuiles personnalisées
            menu.innerHTML = `
                <button class="menu-item edit">
                    <span class="material-icons">edit</span>
                    Modifier
                </button>
                <button class="menu-item delete">
                    <span class="material-icons">delete</span>
                    Supprimer
                </button>
                <button class="menu-item open-mobile">
                    <span class="material-icons">phone_android</span>
                    Version mobile
                </button>
                <button class="menu-item open-desktop">
                    <span class="material-icons">computer</span>
                    Version bureau
                </button>
            `;
        }

        // Ajuster la position pour éviter de sortir de l'écran
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        menu.style.position = 'fixed';
        document.body.appendChild(menu);

        const menuRect = menu.getBoundingClientRect();
        let menuX = Math.min(x, viewportWidth - menuRect.width - 10);
        let menuY = Math.min(y, viewportHeight - menuRect.height - 10);
        
        menuX = Math.max(10, menuX);
        menuY = Math.max(10, menuY);

        menu.style.left = `${menuX}px`;
        menu.style.top = `${menuY}px`;

        menu.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            if (button.classList.contains('edit')) {
                this.editTile(tile);
            } else if (button.classList.contains('delete')) {
                this.deleteTile(tile);
            } else if (button.classList.contains('open-mobile')) {
                window.open(this.getMobileUrl(widget.config), '_blank');
            } else if (button.classList.contains('open-desktop')) {
                window.open(widget.config.url, '_blank');
            }
            menu.remove();
        });

        // Fermer au clic en dehors
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
            }
        }, { once: true });

        // Fermer au scroll
        document.addEventListener('scroll', () => {
            menu.remove();
        }, { once: true });
    }

    async showAddTileDialog() {
        const title = prompt('Nom du site :');
        if (!title) return;
        
        let url = prompt('URL du site :');
        if (!url) return;

        // Ajouter http:// ou https:// si nécessaire
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        let mobileUrl = prompt('URL version mobile (optionnel, appuyez sur Annuler pour utiliser l\'URL principale) :');
        if (mobileUrl) {
            if (!mobileUrl.startsWith('http://') && !mobileUrl.startsWith('https://')) {
                mobileUrl = 'https://' + mobileUrl;
            }
        }

        try {
            const id = `widget-${Date.now()}`;
            const config = {
                id,
                title: title,
                url: url,
                mobileUrl: mobileUrl || url,
                color: '#1a237e',
                isDefault: false,
                section: 'general'
            };
            
            // Trouver l'emplacement correct après le séparateur
            const container = document.getElementById('tileContainer');
            const separator = container.querySelector('.separator');
            const newTile = await this.createWidget(id, config);
            
            // Positionner après le séparateur
            if (separator && separator.nextSibling) {
                container.insertBefore(newTile, separator.nextSibling);
            } else if (separator) {
                container.appendChild(newTile);
            }
            
            this.saveWidgets();
            this.showToast('Site ajouté avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'ajout du site:', error);
            this.showToast('Erreur : Impossible d\'ajouter ce site');
        }
    }

    editTile(tile) {
        const widgetId = tile.dataset.widgetId;
        const widget = this.widgets.get(widgetId);
        if (!widget || widget.config.isDefault) return;

        const newTitle = prompt('Nouveau titre :', widget.config.title);
        if (!newTitle) return;

        let newUrl = prompt('Nouvelle URL :', widget.config.url);
        if (!newUrl) return;

        if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
            newUrl = 'https://' + newUrl;
        }

        let newMobileUrl = prompt('Nouvelle URL mobile (optionnel) :', widget.config.mobileUrl);
        if (newMobileUrl) {
            if (!newMobileUrl.startsWith('http://') && !newMobileUrl.startsWith('https://')) {
                newMobileUrl = 'https://' + newMobileUrl;
            }
        }

        widget.config.title = newTitle;
        widget.config.url = newUrl;
        widget.config.mobileUrl = newMobileUrl || newUrl;
        
        tile.querySelector('.tile-title').textContent = newTitle;
        
        this.saveWidgets();
        this.showToast('Site modifié avec succès');
    }

    deleteTile(tile) {
        const widgetId = tile.dataset.widgetId;
        const widget = this.widgets.get(widgetId);
        
        if (widget && widget.config.isDefault) {
            this.showToast('Les sites par défaut ne peuvent pas être supprimés');
            return;
        }

        if (confirm('Voulez-vous vraiment supprimer ce site ?')) {
            this.widgets.delete(widgetId);
            tile.remove();
            this.saveWidgets();
            this.showToast('Site supprimé');
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
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    saveWidgets() {
        const widgets = {};
        document.querySelectorAll('.tile').forEach((tile, index) => {
            const widgetId = tile.dataset.widgetId;
            const widget = this.widgets.get(widgetId);
            if (widget) {
                widgets[widgetId] = {
                    ...widget.config,
                    order: index
                };
            }
        });
        localStorage.setItem('widgets', JSON.stringify(widgets));
        this.emit('widgetsUpdated', widgets);
    }
}