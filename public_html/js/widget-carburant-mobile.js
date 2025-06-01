console.log('🚗 Chargement du widget carburant...');

let carburantWidget = {
    isOpen: false,
    pricesData: null,
    currentTheme: 'rouge',
    themes: {
        light: {
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            name: 'Violet'
        },
        dark: {
            gradient: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
            name: 'Sombre'
        },
        rouge: {
            gradient: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
            name: 'Rouge'
        },
        bleuciel: {
            gradient: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
            name: 'Bleu Ciel'
        },
        vert: {
            gradient: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
            name: 'Vert Nature'
        },
        sunset: {
            gradient: 'linear-gradient(135deg, #e67e22 0%, #f39c12 100%)',
            name: 'Coucher de Soleil'
        }
    },
    apiConfig: {
    baseUrl: 'https://pwa-news-two.vercel.app/api/proxy-carburant',
    cacheKey: 'carburant_api_cache',
    cacheTimeout: 60 * 60 * 1000 // 1 heure
},

    init() {
        this.detectTheme();
        this.createButton();
        this.createWidget();
        this.setupThemeListener();
        this.fetchAndDisplayPrices();
    },

    detectTheme() {
        const htmlElement = document.documentElement;
        const currentTheme = htmlElement.getAttribute('data-theme') || 'rouge';
        this.currentTheme = currentTheme;
    },

    setupThemeListener() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    const newTheme = document.documentElement.getAttribute('data-theme');
                    if (newTheme !== this.currentTheme) {
                        this.currentTheme = newTheme;
                        this.updateTheme();
                    }
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
    },

    updateTheme() {
        const button = document.getElementById('carburantBtn');
        const widget = document.getElementById('carburantWidget');
        const theme = this.themes[this.currentTheme] || this.themes.rouge;
        if (button) button.style.background = theme.gradient;
        if (widget) widget.style.background = theme.gradient;
    },

    createButton() {
        const theme = this.themes[this.currentTheme] || this.themes.rouge;
        const button = document.createElement('button');
        button.id = 'carburantBtn';
        button.innerHTML = '⛽';
        button.style.cssText = `
            position: fixed;
            top: 120px;
            left: 10px;
            width: 50px;
            height: 50px;
            background: ${theme.gradient};
            color: white;
            border: none;
            border-radius: 50%;
            font-size: 1.3rem;
            cursor: pointer;
            z-index: 999;
            box-shadow: 0 4px 15px rgba(0,0,0,0.4);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        button.addEventListener('click', () => { this.toggle(); });
        button.addEventListener('mouseenter', () => { button.style.transform = 'scale(1.1)'; });
        button.addEventListener('mouseleave', () => { button.style.transform = 'scale(1)'; });
        document.body.appendChild(button);
    },

    createWidget() {
        const theme = this.themes[this.currentTheme] || this.themes.rouge;
        const widget = document.createElement('div');
        widget.id = 'carburantWidget';
        widget.style.cssText = `
            position: fixed;
            top: 70px;
            left: -320px;
            width: 300px;
            background: ${theme.gradient};
            color: white;
            border-radius: 0 15px 15px 0;
            box-shadow: 2px 0 15px rgba(0,0,0,0.3);
            transition: left 0.3s ease;
            z-index: 900;
            max-height: 80vh;
            overflow-y: auto;
        `;
        widget.innerHTML = `
            <div style="padding: 15px 20px; border-bottom: 1px solid rgba(255,255,255,0.2); position: relative;">
                <h3 style="margin: 0; font-size: 1.1rem;">⛽ Prix Carburants</h3>
                <button id="carburantWidgetCloseBtn" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(255,255,255,0.2);
                    border: none;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    color: white;
                    cursor: pointer;
                    transition: background 0.3s ease;
                ">×</button>
            </div>
            <div id="carburantContent" style="padding: 15px 20px;">
                <div style="text-align: center; padding: 20px;">Chargement...</div>
            </div>
            <div style="padding: 10px 20px; border-top: 1px solid rgba(255,255,255,0.2);">
                <button id="carburantWidgetRefreshBtn" style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    border-radius: 20px;
                    color: white;
                    padding: 8px 15px;
                    cursor: pointer;
                    width: 100%;
                    transition: background 0.3s ease;
                ">🔄 Actualiser</button>
            </div>
        `;
        document.body.appendChild(widget);

        // Ajout listeners pour fermer/actualiser
        setTimeout(() => {
            document.getElementById('carburantWidgetCloseBtn')
                .addEventListener('click', () => this.close());
            document.getElementById('carburantWidgetRefreshBtn')
                .addEventListener('click', () => this.fetchAndDisplayPrices());
        }, 100);
    },

    async fetchAndDisplayPrices() {
        this.displayLoading();
        const data = await this.fetchCarburantData();
        this.pricesData = this.processApiData(data);
        this.displayPrices();
    },

    buildApiUrl() {
    return this.apiConfig.baseUrl;
},

    async fetchCarburantData() {
        const url = this.buildApiUrl();
        const { cacheKey, cacheTimeout } = this.apiConfig;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < cacheTimeout) return data;
        }
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Erreur de chargement');
            const data = await response.json();
            localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
            return data;
        } catch (e) {
            console.error(e);
            return null;
        }
    },

    processApiData(data) {
        if (!data || !data.records || data.records.length === 0) return [];
        const stations = data.records.map(record => {
            const f = record.fields;
            return {
                nom: f.enseigne || f.com_arm_name || 'Station',
                ville: f.com_arm_name || '',
                adresse: f.adresse || '',
                gazole: f.prix_gazole || null,
                sp95: f.prix_sp95 || null,
                e10: f.prix_e10 || null,
                sp98: f.prix_sp98 || null,
                lastUpdate: f.date_maj ? new Date(f.date_maj) : new Date()
            };
        });
        return stations
            .filter(s => s.gazole)
            .sort((a, b) => parseFloat(a.gazole) - parseFloat(b.gazole))
            .slice(0, 8);
    },

    displayLoading() {
        const content = document.getElementById('carburantContent');
        if (content) {
            content.innerHTML = `<div style="text-align: center; padding: 20px;">Chargement…</div>`;
        }
    },

    formatPrice(price) {
        if (!price) return '-';
        return Number(price).toFixed(3) + '€';
    },

    displayPrices() {
        const content = document.getElementById('carburantContent');
        if (!content) return;
        const stations = this.pricesData;
        if (!stations || stations.length === 0) {
            content.innerHTML = '<div style="text-align:center;padding:20px;">Aucune donnée disponible.</div>';
            return;
        }
        let html = '';
        stations.forEach((station, index) => {
            html += `
            <div style="background: rgba(255,255,255,0.14); border-radius: 10px; padding: 12px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <h4 style="margin: 0; font-size: 0.92rem; font-weight: 600;">${station.nom}</h4>
                </div>
                <div style="display: flex; justify-content: space-between; gap: 5px;">
                    <div style="text-align: center; flex: 1;">
                        <div style="font-size: 0.7rem; opacity: 0.8;">Gazole</div>
                        <div style="font-weight: bold; font-size: 0.85rem;">${this.formatPrice(station.gazole)}</div>
                    </div>
                    <div style="text-align: center; flex: 1;">
                        <div style="font-size: 0.7rem; opacity: 0.8;">SP95</div>
                        <div style="font-weight: bold; font-size: 0.85rem;">${this.formatPrice(station.sp95)}</div>
                    </div>
                    <div style="text-align: center; flex: 1;">
                        <div style="font-size: 0.7rem; opacity: 0.8;">E10</div>
                        <div style="font-weight: bold; font-size: 0.85rem;">${this.formatPrice(station.e10)}</div>
                    </div>
                    <div style="text-align: center; flex: 1;">
                        <div style="font-size: 0.7rem; opacity: 0.8;">SP98</div>
                        <div style="font-weight: bold; font-size: 0.85rem;">${this.formatPrice(station.sp98)}</div>
                    </div>
                </div>
                <div style="font-size: 0.85em;color:#c2c2c2;">${station.adresse}</div>
            </div>`;
        });
        html += `<div style="text-align: center; font-size: 0.7rem; opacity: 0.8; margin-top: 15px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.2);">
            <span style="margin-right: 5px;">🕒</span>Prix mis à jour le ${new Date().toLocaleDateString('fr-FR')}
            <br>
            <a href="https://www.prix-carburants.gouv.fr/" target="_blank" rel="noopener" style="color:#fff;text-decoration:underline;">Source : prix-carburants.gouv.fr</a>
        </div>`;
        content.innerHTML = html;
    },

    toggle() { this.isOpen ? this.close() : this.open(); },

    open() {
        const widget = document.getElementById('carburantWidget');
        const button = document.getElementById('carburantBtn');
        widget.style.left = '0px';
        button.style.display = 'none';
        this.isOpen = true;
    },

    close() {
        const widget = document.getElementById('carburantWidget');
        const button = document.getElementById('carburantBtn');
        widget.style.left = '-320px';
        button.style.display = 'flex';
        this.isOpen = false;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    carburantWidget.init();
});

window.carburantWidgetMobile = carburantWidget;
window.openCarburantWidget = () => carburantWidget.open();
window.closeCarburantWidget = () => carburantWidget.close();

console.log('🚗 Script widget carburant chargé avec succès !');
