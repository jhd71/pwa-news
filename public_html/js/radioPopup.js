class RadioPopupWidget {
    constructor() {
        this.stations = [
            {
                name: 'France Info',
                url: 'https://icecast.radiofrance.fr/franceinfo-midfi.mp3',
                logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/4/41/France_Info_-_Logo_2016.svg/256px-France_Info_-_Logo_2016.svg.png'
            },
            {
                name: 'France Inter',
                url: 'https://icecast.radiofrance.fr/franceinter-midfi.mp3',
                logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/9/9b/France_Inter_logo.svg/256px-France_Inter_logo.svg.png'
            },
            {
                name: 'France Bleu Bourgogne',
                url: 'https://icecast.radiofrance.fr/fbbourgogne-midfi.mp3',
                logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/c/c3/France_Bleu_logo_2005.svg/256px-France_Bleu_logo_2005.svg.png'
            },
            {
                name: 'RTL',
                url: 'https://streaming.radio.rtl.fr/rtl-1-44-128',
                logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/f/f8/RTL_logo_2015.svg/256px-RTL_logo_2015.svg.png'
            },
            {
                name: 'NRJ',
                url: 'https://scdn.nrjaudio.fm/fr/30001/mp3_128.mp3',
                logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/f/fb/NRJ_Logo_2016.svg/256px-NRJ_Logo_2016.svg.png'
            },
            {
                name: 'Europe 1',
                url: 'https://europe1.lmn.fm/europe1.mp3',
                logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/b/b0/Europe_1_logo_2008.svg/256px-Europe_1_logo_2008.svg.png'
            },
            {
                name: 'RMC',
                url: 'https://rmc.bfmtv.com/rmcinfo-mp3',
                logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/0/06/RMC_logo_2017.svg/256px-RMC_logo_2017.svg.png'
            },
            {
                name: 'Nostalgie',
                url: 'https://scdn.nrjaudio.fm/fr/30601/mp3_128.mp3',
                logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/6/67/Nostalgie_%28logo%29.svg/256px-Nostalgie_%28logo%29.svg.png'
            },
            {
                name: 'Chérie FM',
                url: 'https://scdn.nrjaudio.fm/fr/30201/mp3_128.mp3',
                logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/f/f8/Ch%C3%A9rie_FM_logo_2017.svg/256px-Ch%C3%A9rie_FM_logo_2017.svg.png'
            },
            {
                name: 'FIP',
                url: 'https://icecast.radiofrance.fr/fip-midfi.mp3',
                logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/0/09/FIP_logo_2005.svg/256px-FIP_logo_2005.svg.png'
            }
        ];
        
        this.currentStation = null;
        this.isPlaying = false;
        this.audio = null;
        this.volume = 0.7;
    }

    init() {
        // Attendre que les tuiles soient créées
        setTimeout(() => {
            this.createRadioTile();
            this.createPopup();
        }, 1500);
    }

    createRadioTile() {
        // Trouver la section Radio et ajouter une tuile pour ouvrir le lecteur
        const radioTiles = document.querySelectorAll('.tile[data-category="radio"]');
        if (radioTiles.length === 0) return;

        const lastRadioTile = radioTiles[radioTiles.length - 1];
        
        const radioTile = {
            title: '🎵 Lecteur Radio',
            url: '#radio-popup',
            mobileUrl: '#radio-popup',
            isDefault: true,
            category: 'radio',
            isRadioPopup: true
        };

        // Créer la tuile
        const tileElement = document.createElement('div');
        tileElement.className = 'tile';
        tileElement.setAttribute('data-category', 'radio');
        tileElement.innerHTML = `
            <div class="tile-content">
                <div class="tile-title">🎵 Lecteur Radio</div>
            </div>
        `;

        // Ajouter le gestionnaire de clic
        tileElement.addEventListener('click', () => {
            this.openPopup();
        });

        // Insérer après la dernière tuile radio
        lastRadioTile.insertAdjacentElement('afterend', tileElement);
    }

    createPopup() {
        const popup = document.createElement('div');
        popup.id = 'radioPopup';
        popup.className = 'radio-popup-overlay';
        popup.innerHTML = `
            <div class="radio-popup-content">
                <div class="radio-popup-header">
                    <h2>🎵 Lecteur Radio</h2>
                    <button class="radio-popup-close" id="closeRadioPopup">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                
                <div class="radio-popup-body">
                    <div class="radio-stations-grid">
                        ${this.stations.map((station, index) => `
                            <div class="radio-station-card" data-index="${index}">
                                <img src="${station.logo}" alt="${station.name}" class="station-logo"
                                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iMTIiIGZpbGw9IiM5NDAwMDAiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDEwQzE0LjQ3NzIgMTAgMTAgMTQuNDc3MiAxMCAyMEMxMCAyNS41MjI4IDE0LjQ3NzIgMzAgMjAgMzBDMjUuNTIyOCAzMCAzMCAyNS41MjI4IDMwIDIwQzMwIDE0LjQ3NzIgMjUuNTIyOCAxMCAyMCAxMFoiIGZpbGw9IndoaXRlIi8+CjwvcGF0aD4KPC9zdmc+Cjwvc3ZnPgo='">
                                <div class="station-name">${station.name}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="radio-player-section" id="radioPlayerSection" style="display: none;">
                        <div class="current-station-info">
                            <img id="currentStationLogo" src="" alt="" class="current-station-logo">
                            <div class="current-station-details">
                                <h3 id="currentStationName"></h3>
                                <p id="currentStationStatus">Prêt à diffuser</p>
                            </div>
                        </div>
                        
                        <div class="radio-controls">
                            <button id="playPauseBtn" class="control-btn play-pause">
                                <span class="material-icons">play_arrow</span>
                            </button>
                            <button id="stopBtn" class="control-btn stop">
                                <span class="material-icons">stop</span>
                            </button>
                        </div>
                        
                        <div class="volume-control">
                            <span class="material-icons">volume_up</span>
                            <input type="range" id="volumeSlider" min="0" max="100" value="70" class="volume-slider">
                            <span class="volume-percentage">70%</span>
                        </div>
                    </div>
                </div>
                
                <div class="radio-popup-footer">
                    <p>Sélectionnez une station pour commencer l'écoute</p>
                </div>
            </div>
        `;

        document.body.appendChild(popup);
        this.setupPopupEventListeners();
    }

    setupPopupEventListeners() {
        // Fermer la popup
        document.getElementById('closeRadioPopup').addEventListener('click', () => {
            this.closePopup();
        });

        // Fermer en cliquant à l'extérieur
        document.getElementById('radioPopup').addEventListener('click', (e) => {
            if (e.target.id === 'radioPopup') {
                this.closePopup();
            }
        });

        // Sélection de station
        document.querySelectorAll('.radio-station-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.index);
                this.selectStation(index);
            });
        });

        // Contrôles de lecture
        document.getElementById('playPauseBtn').addEventListener('click', () => {
            this.togglePlayPause();
        });

        document.getElementById('stopBtn').addEventListener('click', () => {
            this.stopRadio();
        });

        // Contrôle du volume
        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            const volume = e.target.value;
            this.setVolume(volume / 100);
            document.querySelector('.volume-percentage').textContent = volume + '%';
        });
    }

    openPopup() {
        const popup = document.getElementById('radioPopup');
        popup.classList.add('active');
        document.body.classList.add('radio-popup-open');
    }

    closePopup() {
        const popup = document.getElementById('radioPopup');
        popup.classList.remove('active');
        document.body.classList.remove('radio-popup-open');
    }

    selectStation(index) {
        const station = this.stations[index];
        this.currentStation = station;
        
        // Mettre à jour l'interface
        document.getElementById('currentStationLogo').src = station.logo;
        document.getElementById('currentStationName').textContent = station.name;
        document.getElementById('currentStationStatus').textContent = 'Station sélectionnée';
        document.getElementById('radioPlayerSection').style.display = 'block';
        
        // Marquer la station active
        document.querySelectorAll('.radio-station-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-index="${index}"]`).classList.add('active');
        
        // Arrêter l'audio précédent
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }
        
        this.isPlaying = false;
        this.updatePlayButton();
    }

    togglePlayPause() {
        if (!this.currentStation) return;

        if (this.isPlaying) {
            this.pauseRadio();
        } else {
            this.playRadio();
        }
    }

    playRadio() {
        if (!this.currentStation) return;

        try {
            if (!this.audio) {
                this.audio = new Audio(this.currentStation.url);
                this.audio.volume = this.volume;
                this.audio.crossOrigin = 'anonymous';
                
                this.audio.addEventListener('loadstart', () => {
                    document.getElementById('currentStationStatus').textContent = 'Connexion en cours...';
                });
                
                this.audio.addEventListener('canplay', () => {
                    document.getElementById('currentStationStatus').textContent = 'En direct';
                });
                
                this.audio.addEventListener('error', (e) => {
                    document.getElementById('currentStationStatus').textContent = 'Erreur de lecture';
                    console.error('Erreur audio:', e);
                });
            }
            
            this.audio.play();
            this.isPlaying = true;
            this.updatePlayButton();
            
        } catch (error) {
            console.error('Erreur lecture radio:', error);
            document.getElementById('currentStationStatus').textContent = 'Erreur';
        }
    }

    pauseRadio() {
        if (this.audio) {
            this.audio.pause();
        }
        this.isPlaying = false;
        this.updatePlayButton();
        document.getElementById('currentStationStatus').textContent = 'En pause';
    }

    stopRadio() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio = null;
        }
        this.isPlaying = false;
        this.updatePlayButton();
        document.getElementById('currentStationStatus').textContent = 'Arrêté';
    }

    setVolume(volume) {
        this.volume = volume;
        if (this.audio) {
            this.audio.volume = volume;
        }
    }

    updatePlayButton() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const icon = playPauseBtn.querySelector('.material-icons');
        
        if (this.isPlaying) {
            icon.textContent = 'pause';
            playPauseBtn.classList.add('playing');
        } else {
            icon.textContent = 'play_arrow';
            playPauseBtn.classList.remove('playing');
        }
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    window.radioPopupInstance = new RadioPopupWidget();
    window.radioPopupInstance.init();
});