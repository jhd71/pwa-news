class TVGuideRSSWidget {
    constructor() {
        this.rssUrl = 'https://webnext.fr/templates/webnext_exclusive/views/includes/epg_cache/programme-tv-rss_2025-08-29.xml';
        this.programs = [];
        this.channels = new Set();
    }

    init() {
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        const modal = document.createElement('div');
        modal.id = 'tvGuideModal';
        modal.className = 'tv-guide-modal';
        modal.innerHTML = `
            <div class="tv-guide-content">
                <div class="tv-guide-header">
                    <h2>📺 Programme TV - Télé 7 Jours</h2>
                    <button id="closeTVGuide" class="close-tv-btn">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                <div class="tv-guide-body">
                    <div class="tv-loading" id="tvLoading">
                        <div class="loading-spinner"></div>
                        <p>Chargement des programmes...</p>
                    </div>
                    <div class="tv-content" id="tvContent" style="display: none;">
                        <div class="tv-filter">
                            <select id="channelFilter">
                                <option value="all">Toutes les chaînes</option>
                            </select>
                        </div>
                        <div class="tv-programs-list" id="tvProgramsList">
                        </div>
                    </div>
                </div>
                <div class="tv-guide-footer">
                    <p>Source : Télé 7 Jours RSS</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    setupEventListeners() {
        document.getElementById('closeTVGuide').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('tvGuideModal').addEventListener('click', (e) => {
            if (e.target.id === 'tvGuideModal') {
                this.closeModal();
            }
        });

        document.getElementById('channelFilter').addEventListener('change', (e) => {
            this.filterPrograms(e.target.value);
        });
    }

    async fetchRSSData() {
        try {
            const response = await fetch(`/api/rssProxy?url=${encodeURIComponent(this.rssUrl)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const xmlText = await response.text();
            return this.parseRSSData(xmlText);
            
        } catch (error) {
            console.error('Erreur fetch RSS:', error);
            return this.getFallbackData();
        }
    }

    parseRSSData(xmlText) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const items = xmlDoc.querySelectorAll('item');
        
        const programs = [];
        
        items.forEach(item => {
            const title = item.querySelector('title')?.textContent || 'Programme';
            const description = item.querySelector('description')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent;
            
            // Extraire le nom de la chaîne du titre
            const channelMatch = title.match(/^([^:]+):/);
            const channel = channelMatch ? channelMatch[1].trim() : 'Chaîne inconnue';
            
            // Extraire l'heure du titre
            const timeMatch = title.match(/(\d{2}h\d{2})/);
            const time = timeMatch ? timeMatch[1] : '';
            
            // Nettoyer le titre
            const cleanTitle = title.replace(/^[^:]+:\s*/, '').replace(/\s*\d{2}h\d{2}\s*/, '');
            
            programs.push({
                channel,
                time,
                title: cleanTitle,
                description: this.cleanDescription(description),
                pubDate
            });
            
            this.channels.add(channel);
        });
        
        return programs;
    }

    cleanDescription(description) {
        // Nettoyer la description HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = description;
        return tempDiv.textContent.substring(0, 200) + (tempDiv.textContent.length > 200 ? '...' : '');
    }

    async loadPrograms() {
        const loading = document.getElementById('tvLoading');
        const content = document.getElementById('tvContent');
        
        loading.style.display = 'flex';
        content.style.display = 'none';
        
        this.programs = await this.fetchRSSData();
        
        this.populateChannelFilter();
        this.displayPrograms(this.programs);
        
        loading.style.display = 'none';
        content.style.display = 'block';
    }

    populateChannelFilter() {
        const select = document.getElementById('channelFilter');
        select.innerHTML = '<option value="all">Toutes les chaînes</option>';
        
        Array.from(this.channels).sort().forEach(channel => {
            const option = document.createElement('option');
            option.value = channel;
            option.textContent = channel;
            select.appendChild(option);
        });
    }

    displayPrograms(programs) {
        const container = document.getElementById('tvProgramsList');
        
        if (programs.length === 0) {
            container.innerHTML = '<div class="no-programs">Aucun programme disponible</div>';
            return;
        }
        
        container.innerHTML = programs.map(program => `
            <div class="tv-program-card">
                <div class="program-header">
                    <span class="program-channel">${program.channel}</span>
                    <span class="program-time">${program.time}</span>
                </div>
                <h3 class="program-title">${program.title}</h3>
                <p class="program-description">${program.description}</p>
            </div>
        `).join('');
    }

    filterPrograms(channel) {
        if (channel === 'all') {
            this.displayPrograms(this.programs);
        } else {
            const filtered = this.programs.filter(p => p.channel === channel);
            this.displayPrograms(filtered);
        }
    }

    getFallbackData() {
        return [
            {
                channel: 'TF1',
                time: '20h00',
                title: 'Service temporairement indisponible',
                description: 'Les programmes ne peuvent pas être chargés pour le moment.',
                pubDate: new Date().toISOString()
            }
        ];
    }

    openModal() {
        const modal = document.getElementById('tvGuideModal');
        modal.classList.add('active');
        document.body.classList.add('tv-guide-open');
        this.loadPrograms();
    }

    closeModal() {
        const modal = document.getElementById('tvGuideModal');
        modal.classList.remove('active');
        document.body.classList.remove('tv-guide-open');
    }
}

// Fonction globale
window.openTVGuideWidget = function() {
    console.log('Programme TV RSS cliqué !');
    if (window.tvGuideInstance) {
        window.tvGuideInstance.openModal();
    }
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    window.tvGuideInstance = new TVGuideRSSWidget();
    window.tvGuideInstance.init();
});