class RadioPopupWidget {
    constructor() {
        this.stations = [
            {
                name: 'France Info',
                url: 'https://icecast.radiofrance.fr/franceinfo-midfi.mp3',
                logo: 'images/radio-logos/france-info.png',
                description: 'Info en continu'
            },
            {
                name: 'France Inter',
                url: 'https://icecast.radiofrance.fr/franceinter-midfi.mp3',
                logo: 'images/radio-logos/france-inter.png',
                description: 'Radio généraliste'
            },
            {
                name: 'France Bleu Bourgogne',
                url: 'https://icecast.radiofrance.fr/fbbourgogne-midfi.mp3',
                logo: 'images/radio-logos/france-bleu.png',
                description: 'Radio locale'
            },
            {
                name: 'RTL',
                url: 'https://streamer-03.rtl.fr/rtl-1-44-128',
                logo: 'images/radio-logos/rtl.png',
                description: 'Info & divertissement'
            },
            {
                name: 'NRJ',
                url: 'https://streaming.nrjaudio.fm/oumvmk8fnozc?origine=fluxurlradio',
                logo: 'images/radio-logos/nrj.png',
                description: 'Hits & musique'
            },
            {
                name: 'Europe 1',
                url: 'https://europe1.lmn.fm/europe1.mp3',
                logo: 'images/radio-logos/europe1.png',
                description: 'Talk & actualités'
            },
            {
                name: 'RMC',
                url: 'http://audio.bfmtv.com/rmcradio_128.mp3',
                logo: 'images/radio-logos/rmc.png',
                description: 'Sport & info'
            },
            {
                name: 'Nostalgie',
                url: 'https://streaming.nrjaudio.fm/oug7girb92oc?origine=fluxradios',
                logo: 'images/radio-logos/nostalgie.png',
                description: 'Oldies & classics'
            },
            {
                name: 'Chérie FM',
                url: 'https://streaming.nrjaudio.fm/ouuku85n3nje?origine=fluxradios',
                logo: 'images/radio-logos/cherie-fm.png',
                description: 'Love songs'
            },
            {
                name: 'FIP',
                url: 'https://icecast.radiofrance.fr/fip-midfi.mp3',
                logo: 'images/radio-logos/fip.png',
                description: 'Éclectisme musical'
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
                                <div class="station-logo-container">
                                    <img src="${station.logo}" alt="${station.name}" class="station-logo"
                                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                    <div class="logo-fallback" style="display: none;">
                                        <span class="material-icons">radio</span>
                                    </div>
                                    <div class="play-overlay">
                                        <span class="material-icons">play_arrow</span>
                                    </div>
                                </div>
                                <div class="station-info">
                                    <div class="station-name">${station.name}</div>
                                    <div class="station-description">${station.description}</div>
                                </div>
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
                        
                        <div class="volume-control">
                            <span class="material-icons">volume_up</span>
                            <input type="range" id="volumeSlider" min="0" max="100" value="70" class="volume-slider">
                            <span class="volume-percentage">70%</span>
                        </div>
                    </div>
                </div>
                
                <div class="radio-popup-footer">
                    <p>🎧 Cliquez sur une station pour l'écouter en direct</p>
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

        // Sélection de station - clic direct pour play/pause
        document.querySelectorAll('.radio-station-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.index);
                this.toggleStationPlayback(index);
            });
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

    toggleStationPlayback(index) {
    const station = this.stations[index];
    const card = document.querySelector(`[data-index="${index}"]`);
    const overlayIcon = card.querySelector('.play-overlay .material-icons');
    
    // Si c'est la même station
    if (this.currentStation && this.currentStation.name === station.name) {
        if (this.isPlaying) {
            // En cours de lecture -> Pause
            this.pauseRadio();
        } else {
            // En pause -> Reprendre
            this.playRadio();
        }
    } else {
        // Nouvelle station
        this.stopCurrentAndPlayNew(index);
    }
}

    stopCurrentAndPlayNew(index) {
        // Arrêter la station actuelle
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }
        
        // Réinitialiser toutes les cartes
        document.querySelectorAll('.radio-station-card').forEach(card => {
            card.classList.remove('active', 'playing');
            const overlay = card.querySelector('.play-overlay .material-icons');
            overlay.textContent = 'play_arrow';
        });
        
        // Sélectionner et jouer la nouvelle station
        const station = this.stations[index];
        const card = document.querySelector(`[data-index="${index}"]`);
        
        this.currentStation = station;
        this.isPlaying = false;
        
        // Mettre à jour l'interface du lecteur
        document.getElementById('currentStationLogo').src = station.logo;
        document.getElementById('currentStationName').textContent = station.name;
        document.getElementById('currentStationStatus').textContent = 'Connexion...';
        document.getElementById('radioPlayerSection').style.display = 'block';
        
        // Marquer comme active
        card.classList.add('active');
        
        // Lancer la lecture
        this.playRadio();
        
        // Mettre à jour l'overlay
        const overlayIcon = card.querySelector('.play-overlay .material-icons');
        overlayIcon.textContent = 'pause';
        card.classList.add('playing');
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
                this.isPlaying = false;
                // Réinitialiser l'interface en cas d'erreur
                const activeCard = document.querySelector('.radio-station-card.active');
                if (activeCard) {
                    const overlayIcon = activeCard.querySelector('.play-overlay .material-icons');
                    overlayIcon.textContent = 'play_arrow';
                    activeCard.classList.remove('playing');
                    activeCard.classList.add('paused');
                }
                console.error('Erreur audio:', e);
            });
        }
        
        this.audio.play();
        this.isPlaying = true;
        this.updatePlayButton();
        
        // Mettre à jour l'overlay de la station active
        const activeCard = document.querySelector('.radio-station-card.active');
        if (activeCard) {
            const overlayIcon = activeCard.querySelector('.play-overlay .material-icons');
            overlayIcon.textContent = 'pause';
            activeCard.classList.add('playing');
            activeCard.classList.remove('paused'); // AJOUT : Retirer la classe paused
        }
        
    } catch (error) {
        console.error('Erreur lecture radio:', error);
        document.getElementById('currentStationStatus').textContent = 'Erreur';
        this.isPlaying = false;
    }
}

    pauseRadio() {
    if (this.audio) {
        this.audio.pause();
    }
    this.isPlaying = false;
    this.updatePlayButton();
    document.getElementById('currentStationStatus').textContent = 'En pause';
    
    // Mettre à jour l'overlay de la station active
    const activeCard = document.querySelector('.radio-station-card.active');
    if (activeCard) {
        const overlayIcon = activeCard.querySelector('.play-overlay .material-icons');
        overlayIcon.textContent = 'play_arrow';
        activeCard.classList.remove('playing');
        // AJOUT : Forcer l'affichage de l'overlay en pause
        activeCard.classList.add('paused');
    }
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