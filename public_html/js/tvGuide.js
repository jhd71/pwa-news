class TVGuideWidget {
    constructor() {
        this.currentDate = new Date();
        this.apiKey = 'k_f41876n3';
        this.baseUrl = 'https://tv-api.com/fr/api/programmes';
        this.channels = [
            { id: 'tf1', name: 'TF1' },
            { id: 'france2', name: 'France 2' },
            { id: 'france3', name: 'France 3' },
            { id: 'canalplus', name: 'Canal+' },
            { id: 'france5', name: 'France 5' },
            { id: 'm6', name: 'M6' },
            { id: 'arte', name: 'Arte' },
            { id: 'c8', name: 'C8' }
        ];
        this.programsCache = new Map();
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
                    <h2>📺 Programme TV</h2>
                    <div class="tv-guide-controls">
                        <button id="tvPrevDay" class="tv-nav-btn">
                            <span class="material-icons">chevron_left</span>
                        </button>
                        <span id="tvCurrentDate">${this.formatDate(this.currentDate)}</span>
                        <button id="tvNextDay" class="tv-nav-btn">
                            <span class="material-icons">chevron_right</span>
                        </button>
                    </div>
                    <button id="closeTVGuide" class="close-tv-btn">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                <div class="tv-guide-body">
                    <div class="tv-time-slots">
                        <div class="time-header">Horaires</div>
                        ${this.createTimeSlots()}
                    </div>
                    <div class="tv-channels-container">
                        ${this.createChannelsGrid()}
                    </div>
                </div>
                <div class="tv-guide-footer">
                    <p>Données TV-API • Cliquez sur un programme pour plus d'infos</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    createTimeSlots() {
        let slots = '';
        for (let hour = 8; hour <= 23; hour++) {
            slots += `<div class="time-slot">${hour}:00</div>`;
        }
        return slots;
    }

    createChannelsGrid() {
        return this.channels.map(channel => `
            <div class="tv-channel" data-channel="${channel.id}">
                <div class="channel-name">
                    <div class="channel-text">${channel.name}</div>
                </div>
                <div class="channel-programs" id="programs-${channel.id}">
                    <div class="loading-programs">Chargement...</div>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        document.getElementById('closeTVGuide').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('tvPrevDay').addEventListener('click', () => {
            this.changeDate(-1);
        });

        document.getElementById('tvNextDay').addEventListener('click', () => {
            this.changeDate(1);
        });

        document.getElementById('tvGuideModal').addEventListener('click', (e) => {
            if (e.target.id === 'tvGuideModal') {
                this.closeModal();
            }
        });
    }

    openModal() {
        const modal = document.getElementById('tvGuideModal');
        modal.classList.add('active');
        document.body.classList.add('tv-guide-open');
        this.loadAllPrograms();
    }

    closeModal() {
        const modal = document.getElementById('tvGuideModal');
        modal.classList.remove('active');
        document.body.classList.remove('tv-guide-open');
    }

    formatDate(date) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('fr-FR', options);
    }

    formatDateForAPI(date) {
        return date.toISOString().split('T')[0];
    }

    formatTime(date) {
        return date.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    getFallbackPrograms() {
        return [
            {
                id: 'fallback-1',
                debut: new Date().setHours(8, 0),
                fin: new Date().setHours(8, 30),
                titre: 'Programme non disponible',
                genre: 'Information'
            }
        ];
    }

    async fetchPrograms(date, channelId) {
        try {
            const dateStr = this.formatDateForAPI(date);
            const response = await fetch(
                `/api/tvPrograms?channel=${channelId}&date=${dateStr}`
            );
            
            const data = await response.json();
            
            if (response.ok) {
                return data.programmes;
            } else {
                return data.fallback?.programmes || this.getFallbackPrograms();
            }
        } catch (error) {
            console.error('Erreur réseau:', error);
            return this.getFallbackPrograms();
        }
    }

    async loadAllPrograms() {
        try {
            const promises = this.channels.map(channel => 
                this.fetchPrograms(this.currentDate, channel.id)
            );
            
            const results = await Promise.allSettled(promises);
            
            results.forEach((result, index) => {
                const channel = this.channels[index];
                const programs = result.status === 'fulfilled' 
                    ? result.value 
                    : this.getFallbackPrograms();
                
                this.displayChannelPrograms(channel, programs);
            });
        } catch (error) {
            console.error('Erreur chargement programmes:', error);
        }
    }

    displayChannelPrograms(channel, programs) {
        const container = document.getElementById(`programs-${channel.id}`);
        if (!container) return;

        container.innerHTML = programs.map(program => {
            const startTime = new Date(program.debut);
            const endTime = new Date(program.fin);
            const duration = (endTime - startTime) / (1000 * 60);
            
            return `
                <div class="tv-program" 
                     data-time="${this.formatTime(startTime)}"
                     data-program-id="${program.id}"
                     style="height: ${Math.max(duration * 0.8, 40)}px;">
                    <div class="program-time">${this.formatTime(startTime)}</div>
                    <div class="program-title">${program.titre}</div>
                    <div class="program-genre">${program.genre || ''}</div>
                </div>
            `;
        }).join('');
    }

    async changeDate(days) {
        this.currentDate.setDate(this.currentDate.getDate() + days);
        document.getElementById('tvCurrentDate').textContent = this.formatDate(this.currentDate);
        this.programsCache.clear();
        await this.loadAllPrograms();
    }
}

// Fonction globale
window.openTVGuideWidget = function() {
    console.log('Programme TV cliqué !');
    if (window.tvGuideInstance) {
        window.tvGuideInstance.openModal();
    }
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    window.tvGuideInstance = new TVGuideWidget();
    window.tvGuideInstance.init();
});