class RadioWidget {
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
            this.createWidget();
            this.setupEventListeners();
        }, 1500);
    }

    createWidget() {
        // Trouver la section Radio et la dernière tuile radio
        const radioTiles = document.querySelectorAll('.tile[data-category="radio"]');
        if (radioTiles.length === 0) return;

        const lastRadioTile = radioTiles[radioTiles.length - 1];
        
        const widget = document.createElement('div');
        widget.id = 'radioWidget';
        widget.className = 'radio-widget tile';
        widget.setAttribute('data-category', 'radio');
        widget.innerHTML = `
            <div class="radio-widget-content">
                <div class="radio-header">
                    <span class="material-icons">radio</span>
                    <h3>Lecteur Radio</h3>
                </div>
                
                <div class="radio-select-container">
                    <select id="radioSelect" class="radio-select">
                        <option value="">🎵 Choisir une station...</option>
                        ${this.stations.map((station, index) => 
                            `<option value="${index}">${station.name}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="radio-player" id="radioPlayer" style="display: none;">
                    <div class="radio-info">
                        <div class="radio-logo-container">
                            <img id="radioLogo" src="" alt="Logo radio" class="radio-logo" 
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzk0MDAwMCIvPgo8cGF0aCBkPSJNMjAgMTJDMTYuNjg2MyAxMiAxNCAxNC42ODYzIDE0IDE4VjIyQzE0IDI1LjMxMzcgMTYuNjg2MyAyOCAyMCAyOEMyMy4zMTM3IDI4IDI2IDI1LjMxMzcgMjYgMjJWMThDMjYgMTQuNjg2MyAyMy4zMTM3IDEyIDIwIDEyWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTEyIDIwQzEyIDI0LjQxODMgMTUuNTgxNyAyOCAyMCAyOEMyNC40MTgzIDI4IDI4IDI0LjQxODMgMjggMjAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPgo='">
                        </div>
                        <div class="radio-details">
                            <div id="radioName" class="radio-name"></div>
                            <div id="radioStatus" class="radio-status">Prêt à diffuser</div>
                        </div>
                    </div>
                    
                    <div class="radio-controls-row">
                        <div class="radio-buttons">
                            <button id="playPauseBtn" class="radio-btn play-pause" title="Lecture/Pause">
                                <span class="material-icons">play_arrow</span>
                            </button>
                            <button id="stopBtn" class="radio-btn stop" title="Arrêt">
                                <span class="material-icons">stop</span>
                            </button>
                        </div>
                        
                        <div class="radio-volume">
                            <span class="material-icons volume-icon">volume_up</span>
                            <input type="range" id="volumeSlider" min="0" max="100" value="70" class="volume-slider">
                            <span class="volume-text">70%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insérer après la dernière tuile radio
        lastRadioTile.insertAdjacentElement('afterend', widget);
    }

    setupEventListeners() {
        const radioSelect = document.getElementById('radioSelect');
        const playPauseBtn = document.getElementById('playPauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        const volumeSlider = document.getElementById('volumeSlider');

        radioSelect.addEventListener('change', (e) => {
            if (e.target.value !== '') {
                this.selectStation(parseInt(e.target.value));
            } else {
                this.hidePlayer();
            }
        });

        playPauseBtn.addEventListener('click', () => {
            this.togglePlayPause();
        });

        stopBtn.addEventListener('click', () => {
            this.stopRadio();
        });

        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value;
            this.setVolume(volume / 100);
            document.querySelector('.volume-text').textContent = volume + '%';
        });
    }

    selectStation(index) {
        const station = this.stations[index];
        this.currentStation = station;
        
        // Afficher le lecteur
        document.getElementById('radioPlayer').style.display = 'block';
        
        // Mettre à jour les infos
        document.getElementById('radioLogo').src = station.logo;
        document.getElementById('radioName').textContent = station.name;
        document.getElementById('radioStatus').textContent = 'Prêt à diffuser';
        
        // Arrêter l'audio précédent
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }
        
        this.isPlaying = false;
        this.updatePlayButton();
    }

    hidePlayer() {
        document.getElementById('radioPlayer').style.display = 'none';
        this.stopRadio();
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
                    document.getElementById('radioStatus').textContent = '🔗 Connexion...';
                });
                
                this.audio.addEventListener('canplay', () => {
                    document.getElementById('radioStatus').textContent = '🎵 En direct';
                });
                
                this.audio.addEventListener('error', (e) => {
                    document.getElementById('radioStatus').textContent = '❌ Erreur de lecture';
                    console.error('Erreur audio:', e);
                });
                
                this.audio.addEventListener('waiting', () => {
                    document.getElementById('radioStatus').textContent = '⏳ Chargement...';
                });
            }
            
            this.audio.play();
            this.isPlaying = true;
            this.updatePlayButton();
            
        } catch (error) {
            console.error('Erreur lecture radio:', error);
            document.getElementById('radioStatus').textContent = '❌ Erreur';
        }
    }

    pauseRadio() {
        if (this.audio) {
            this.audio.pause();
        }
        this.isPlaying = false;
        this.updatePlayButton();
        document.getElementById('radioStatus').textContent = '⏸️ En pause';
    }

    stopRadio() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio = null;
        }
        this.isPlaying = false;
        this.updatePlayButton();
        document.getElementById('radioStatus').textContent = '⏹️ Arrêté';
    }

    setVolume(volume) {
        this.volume = volume;
        if (this.audio) {
            this.audio.volume = volume;
        }
        
        // Mettre à jour l'icône volume
        const volumeIcon = document.querySelector('.volume-icon');
        if (volume === 0) {
            volumeIcon.textContent = 'volume_off';
        } else if (volume < 0.5) {
            volumeIcon.textContent = 'volume_down';
        } else {
            volumeIcon.textContent = 'volume_up';
        }
    }

    updatePlayButton() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const icon = playPauseBtn.querySelector('.material-icons');
        
        if (this.isPlaying) {
            icon.textContent = 'pause';
            playPauseBtn.title = 'Pause';
            playPauseBtn.classList.add('playing');
        } else {
            icon.textContent = 'play_arrow';
            playPauseBtn.title = 'Lecture';
            playPauseBtn.classList.remove('playing');
        }
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    window.radioWidgetInstance = new RadioWidget();
    window.radioWidgetInstance.init();
});