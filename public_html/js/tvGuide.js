class TVGuideWidget {
    constructor() {
        this.currentDate = new Date();
        this.apiKey = 'k_f41876n3'; // À obtenir sur tv-api.com
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
        const loading = document.querySelector('.tv-loading');
        if (loading) loading.style.display = 'block';

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
            this.showErrorMessage();
        } finally {
            if (loading) loading.style.display = 'none';
        }
    }

    displayChannelPrograms(channel, programs) {
        const container = document.getElementById(`programs-${channel.id}`);
        if (!container) return;

        container.innerHTML = programs.map(program => {
            const startTime = new Date(program.debut);
            const endTime = new Date(program.fin);
            const duration = (endTime - startTime) / (1000 * 60); // en minutes
            
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

    formatDateForAPI(date) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    formatTime(date) {
        return date.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    getFallbackPrograms() {
        // Programmes de secours en cas d'échec API
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

    createChannelsGrid() {
        return this.channels.map(channel => `
            <div class="tv-channel" data-channel="${channel.id}">
                <div class="channel-name">
                    <div class="channel-logo">
                        <img src="images/channels/${channel.id}.png" 
                             alt="${channel.name}" 
                             onerror="this.style.display='none'">
                    </div>
                    <div class="channel-text">${channel.name}</div>
                </div>
                <div class="channel-programs" id="programs-${channel.id}">
                    <div class="loading-programs">Chargement...</div>
                </div>
            </div>
        `).join('');
    }

    async changeDate(days) {
        this.currentDate.setDate(this.currentDate.getDate() + days);
        document.getElementById('tvCurrentDate').textContent = this.formatDate(this.currentDate);
        
        // Vider le cache pour la nouvelle date
        this.programsCache.clear();
        
        // Recharger les programmes
        await this.loadAllPrograms();
    }

    async showProgramDetails(programElement) {
        const programId = programElement.dataset.programId;
        
        try {
            // Appel API pour les détails du programme
            const response = await fetch(
                `${this.baseUrl}/programme/${programId}?key=${this.apiKey}`
            );
            
            const program = await response.json();
            
            const detailModal = document.createElement('div');
            detailModal.className = 'program-detail-modal';
            detailModal.innerHTML = `
                <div class="program-detail-content">
                    <button class="close-detail" onclick="this.parentElement.parentElement.remove()">×</button>
                    <h3>${program.titre}</h3>
                    <div class="program-info">
                        <p><strong>Horaire:</strong> ${this.formatTime(new Date(program.debut))} - ${this.formatTime(new Date(program.fin))}</p>
                        <p><strong>Genre:</strong> ${program.genre}</p>
                        <p><strong>Durée:</strong> ${program.duree} minutes</p>
                        ${program.resume ? `<p><strong>Résumé:</strong> ${program.resume}</p>` : ''}
                        ${program.realisateur ? `<p><strong>Réalisateur:</strong> ${program.realisateur}</p>` : ''}
                        ${program.acteurs ? `<p><strong>Acteurs:</strong> ${program.acteurs}</p>` : ''}
                    </div>
                </div>
            `;
            
            document.body.appendChild(detailModal);
            setTimeout(() => detailModal.classList.add('active'), 100);
            
        } catch (error) {
            console.error('Erreur détails programme:', error);
            this.showBasicDetails(programElement);
        }
    }
}