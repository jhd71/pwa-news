class RadioWidget {
    constructor() {
        this.stations = [
            {
                name: 'France Info',
                url: 'https://icecast.radiofrance.fr/franceinfo-midfi.mp3',
                logo: 'https://www.radiofrance.fr/s3/cruiser-production/2019/10/8c705ddc-57a4-4d8b-93c1-0f4d1e1faa0c/200x200_france_info.jpg'
            },
            {
                name: 'France Inter',
                url: 'https://icecast.radiofrance.fr/franceinter-midfi.mp3',
                logo: 'https://www.radiofrance.fr/s3/cruiser-production/2019/10/0e5c9297-2a5a-4f55-bac6-47fb3b439fd8/200x200_france_inter.jpg'
            },
            {
                name: 'France Bleu Bourgogne',
                url: 'https://icecast.radiofrance.fr/fbbourgogne-midfi.mp3',
                logo: 'https://www.radiofrance.fr/s3/cruiser-production/2019/10/2b5a6fc1-e553-485c-b58e-0fa7b7ff4c69/200x200_france_bleu.jpg'
            },
            {
                name: 'RTL',
                url: 'https://streaming.radio.rtl.fr/rtl-1-44-128',
                logo: 'https://cdn-profiles.tunein.com/s18223/images/logoq.png'
            },
            {
                name: 'NRJ',
                url: 'https://scdn.nrjaudio.fm/fr/30001/mp3_128.mp3',
                logo: 'https://www.nrj.fr/var/nrj/storage/images/nrj/accueil/1471998-1-fre-FR/Accueil_header_logo.png'
            }
        ];
        
        this.currentStation = null;
        this.isPlaying = false;
        this.audio = null;
        this.volume = 0.7;
    }

    init() {
        this.createWidget();
        this.setupEventListeners();
    }

    createWidget() {
        // Chercher le séparateur Radio
        const radioSeparator = Array.from(document.querySelectorAll('.separator')).find(
            separator => separator.textContent.includes('Radio')
        );

        if (radioSeparator) {
            const widget = document.createElement('div');
            widget.id = 'radioWidget';
            widget.className = 'radio-widget';
            widget.innerHTML = `
                <div class="radio-header">
                    <span class="material-icons">radio</span>
                    <h3>Lecteur Radio</h3>
                </div>
                
                <div class="radio-controls">
                    <select id="radioSelect" class="radio-select">
                        <option value="">Choisir une station...</option>
                        ${this.stations.map((station, index) => 
                            `<option value="${index}">${station.name}</option>`
                        ).join('')}
                    </select>
                    
                    <div class="radio-player" id="radioPlayer" style="display: none;">
                        <div class="radio-info">
                            <img id="radioLogo" src="" alt="Logo radio" class="radio-logo">
                            <div class="radio-details">
                                <div id="radioName" class="radio-name"></div>
                                <div id="radioStatus" class="radio-status">Arrêté</div>
                            </div>
                        </div>
                        
                        <div class="radio-buttons">
                            <button id="playPauseBtn" class="radio-btn play-pause">
                                <span class="material-icons">play_arrow</span>
                            </button>
                            <button id="stopBtn" class="radio-btn stop">
                                <span class="material-icons">stop</span>
                            </button>
                        </div>
                        
                        <div class="radio-volume">
                            <span class="material-icons">volume_up</span>
                            <input type="range" id="volumeSlider" min="0" max="100" value="70" class="volume-slider">
                        </div>
                    </div>
                </div>
            `;
            
            // Insérer après le séparateur Radio
            radioSeparator.insertAdjacentElement('afterend', widget);
        }
    }

    setupEventListeners() {
        const radioSelect = document.getElementById('radioSelect');
        const playPauseBtn = document.getElementById('playPauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        const volumeSlider = document.getElementById('volumeSlider');

        radioSelect.addEventListener('change', (e) => {
            if (e.target.value !== '') {
                this.selectStation(parseInt(e.target.value));
            }
        });

        playPauseBtn.addEventListener('click', () => {
            this.togglePlayPause();
        });

        stopBtn.addEventListener('click', () => {
            this.stopRadio();
        });

        volumeSlider.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
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
        document.getElementById('radioStatus').textContent = 'Prêt';
        
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
                
                this.audio.addEventListener('loadstart', () => {
                    document.getElementById('radioStatus').textContent = 'Connexion...';
                });
                
                this.audio.addEventListener('canplay', () => {
                    document.getElementById('radioStatus').textContent = 'En cours de lecture';
                });
                
                this.audio.addEventListener('error', (e) => {
                    document.getElementById('radioStatus').textContent = 'Erreur de lecture';
                    console.error('Erreur audio:', e);
                });
            }
            
            this.audio.play();
            this.isPlaying = true;
            this.updatePlayButton();
            
        } catch (error) {
            console.error('Erreur lecture radio:', error);
            document.getElementById('radioStatus').textContent = 'Erreur';
        }
    }

    pauseRadio() {
        if (this.audio) {
            this.audio.pause();
        }
        this.isPlaying = false;
        this.updatePlayButton();
        document.getElementById('radioStatus').textContent = 'En pause';
    }

    stopRadio() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
        this.isPlaying = false;
        this.updatePlayButton();
        document.getElementById('radioStatus').textContent = 'Arrêté';
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
            playPauseBtn.title = 'Pause';
        } else {
            icon.textContent = 'play_arrow';
            playPauseBtn.title = 'Play';
        }
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Attendre que les tuiles soient créées
    setTimeout(() => {
        window.radioWidgetInstance = new RadioWidget();
        window.radioWidgetInstance.init();
    }, 1000);
});