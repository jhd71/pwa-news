/* ============================================
   RADIO PLAYER - JavaScript
   Mini-lecteur radio pour Actu & Média
   ============================================ */

class RadioPlayer {
    constructor() {
        // Liste des stations
        this.stations = [
            {
                id: 'ici-bourgogne',
                name: 'Ici Bourgogne',
                url: 'https://icecast.radiofrance.fr/fbbourgogne-midfi.mp3',
                logo: 'images/radio-logos/ici-bourgogne.png',
                description: 'Info Bourgogne',
                category: 'local'
            },
            {
                id: 'radio-prevert',
                name: 'Radio Prévert',
                url: 'https://vps.cbad.fr:8443/prevert',
                logo: 'images/radio-logos/radio-prevert.png',
                description: 'Chalon-sur-Saône',
                category: 'local'
            },
            {
                id: 'frequence-plus',
                name: 'Fréquence Plus',
                url: 'https://fplus-chalonsursaone.ice.infomaniak.ch/fplus-chalonsursaone-128.mp3',
                logo: 'images/radio-logos/frequence-plus.png',
                description: 'Chalon-sur-Saône',
                category: 'local'
            },
            {
                id: 'france-info',
                name: 'France Info',
                url: 'https://icecast.radiofrance.fr/franceinfo-midfi.mp3',
                logo: 'images/radio-logos/france-info.png',
                description: 'Info en continu',
                category: 'info'
            },
            {
                id: 'rtl',
                name: 'RTL',
                url: 'https://streamer-03.rtl.fr/rtl-1-44-128',
                logo: 'images/radio-logos/rtl.png',
                description: 'Info & divertissement',
                category: 'info'
            },
            {
                id: 'europe1',
                name: 'Europe 1',
                url: 'https://europe1.lmn.fm/europe1.mp3',
                logo: 'images/radio-logos/europe1.png',
                description: 'Talk & actualités',
                category: 'info'
            },
            {
                id: 'rmc',
                name: 'RMC',
                url: 'https://audio.bfmtv.com/rmcradio_128.mp3',
                logo: 'images/radio-logos/rmc.png',
                description: 'Sport & info',
                category: 'info'
            },
            {
                id: 'nrj',
                name: 'NRJ',
                url: 'https://scdn.nrjaudio.fm/adwz1/fr/30001/mp3_128.mp3',
                logo: 'images/radio-logos/nrj.png',
                description: 'Hit Music Only',
                category: 'music'
            },
            {
                id: 'fun-radio',
                name: 'Fun Radio',
                url: 'https://streamer-02.rtl.fr/fun-1-44-128',
                logo: 'images/radio-logos/fun-radio.png',
                description: 'Le son Dancefloor',
                category: 'music'
            },
            {
                id: 'skyrock',
                name: 'Skyrock',
                url: 'https://icecast.skyrock.net/s/natio_mp3_128k',
                logo: 'images/radio-logos/skyrock.png',
                description: 'Premier sur le Rap',
                category: 'music'
            },
            {
                id: 'nostalgie',
                name: 'Nostalgie',
                url: 'https://scdn.nrjaudio.fm/adwz1/fr/30601/mp3_128.mp3',
                logo: 'images/radio-logos/nostalgie.png',
                description: 'Les plus grands tubes',
                category: 'music'
            },
            {
                id: 'cherie-fm',
                name: 'Chérie FM',
                url: 'https://scdn.nrjaudio.fm/adwz1/fr/30201/mp3_128.mp3',
                logo: 'images/radio-logos/cherie-fm.png',
                description: 'Vos plus belles émotions',
                category: 'music'
            },
            {
                id: 'rtl2',
                name: 'RTL2',
                url: 'https://streamer-02.rtl.fr/rtl2-1-44-128',
                logo: 'images/radio-logos/rtl2.png',
                description: 'Le son Pop-Rock',
                category: 'music'
            },
            {
                id: 'm-radio',
                name: 'M Radio',
                url: 'https://mradio.ice.infomaniak.ch/mradio.mp3',
                logo: 'images/radio-logos/m-radio.png',
                description: 'La chanson française',
                category: 'music'
            }
        ];

        // État du lecteur
        this.audio = null;
        this.currentStation = null;
        this.isPlaying = false;
        this.stoppingManually = false;
        this.volume = parseFloat(localStorage.getItem('radio_volume')) || 0.3; // 30% par défaut
        this.lastStationId = localStorage.getItem('radio_last_station');

        // Éléments DOM (seront initialisés après création du HTML)
        this.elements = {};

        // Initialisation
        this.init();
    }

    // ============================================
    // INITIALISATION
    // ============================================
    init() {
        this.createHTML();
        this.cacheElements();
        this.bindEvents();
        this.renderStations();
        this.restoreLastStation();
        console.log('📻 Radio Player initialisé');
    }

    // ============================================
    // CRÉATION DU HTML
    // ============================================
    createHTML() {
        // Modal Radio
        const modalHTML = `
            <div class="radio-modal-overlay" id="radioModal">
                <div class="radio-modal">
                    <div class="radio-modal-header">
                        <div class="radio-modal-title">
                            <span class="material-icons">radio</span>
                            Radio
                        </div>
                        <button class="radio-modal-close" id="radioModalClose">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                    
                    <div class="radio-now-playing hidden" id="radioNowPlaying">
                        <div class="radio-current-station">
                            <img class="radio-current-logo" id="radioCurrentLogo" src="" alt="">
                            <div class="radio-current-info">
                                <div class="radio-current-name" id="radioCurrentName">-</div>
                                <div class="radio-current-desc" id="radioCurrentDesc">-</div>
                                <div class="radio-current-status">
                                    <span class="live-dot"></span>
                                    <span>En direct</span>
                                </div>
                            </div>
                            <div class="radio-equalizer" id="radioEqualizer">
                                <div class="radio-equalizer-bar"></div>
                                <div class="radio-equalizer-bar"></div>
                                <div class="radio-equalizer-bar"></div>
                                <div class="radio-equalizer-bar"></div>
                            </div>
                        </div>
                        
                        <div class="radio-controls">
                            <button class="radio-play-btn" id="radioPlayBtn">
                                <span class="material-icons">play_arrow</span>
                            </button>
                            <div class="radio-volume-container">
                                <span class="material-icons radio-volume-icon" id="radioVolumeIcon">volume_up</span>
                                <input type="range" class="radio-volume-slider" id="radioVolumeSlider" min="0" max="100" value="50">
                                <span class="radio-volume-value" id="radioVolumeValue">50%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="radio-stations-container">
                        <div class="radio-stations-title">📍 Radios locales</div>
                        <div class="radio-stations-grid" id="radioStationsLocal"></div>
                        
                        <div class="radio-stations-title" style="margin-top: 1.25rem;">📰 Infos</div>
                        <div class="radio-stations-grid" id="radioStationsInfo"></div>
                        
                        <div class="radio-stations-title" style="margin-top: 1.25rem;">🎵 Musique</div>
                        <div class="radio-stations-grid" id="radioStationsMusic"></div>
                    </div>
                </div>
            </div>
        `;

        // Widget compact
        const widgetHTML = `
            <div class="radio-widget" id="radioWidget">
                <img class="radio-widget-logo" id="radioWidgetLogo" src="" alt="">
                <div class="radio-widget-info" id="radioWidgetInfo">
                    <div class="radio-widget-name" id="radioWidgetName">-</div>
                    <div class="radio-widget-status">
                        <span class="live-dot"></span>
                        <span>En direct</span>
                    </div>
                </div>
                <div class="radio-widget-controls">
                    <button class="radio-widget-btn play-pause" id="radioWidgetPlayBtn">
                        <span class="material-icons">pause</span>
                    </button>
                    <div class="radio-widget-volume">
                        <button class="radio-widget-btn" id="radioWidgetVolumeBtn">
                            <span class="material-icons">volume_up</span>
                        </button>
                        <input type="range" class="radio-widget-volume-slider" id="radioWidgetVolumeSlider" min="0" max="100" value="30">
                        <span class="radio-widget-volume-value" id="radioWidgetVolumeValue">30%</span>
                    </div>
                    <button class="radio-widget-btn close" id="radioWidgetCloseBtn">
                        <span class="material-icons">close</span>
                    </button>
                </div>
            </div>
        `;

        // Toast
        const toastHTML = `<div class="radio-toast" id="radioToast"></div>`;

        // Ajouter au DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        document.body.insertAdjacentHTML('beforeend', toastHTML);
    }

    // ============================================
    // CACHE DES ÉLÉMENTS DOM
    // ============================================
    cacheElements() {
        this.elements = {
            modal: document.getElementById('radioModal'),
            modalClose: document.getElementById('radioModalClose'),
            nowPlaying: document.getElementById('radioNowPlaying'),
            currentLogo: document.getElementById('radioCurrentLogo'),
            currentName: document.getElementById('radioCurrentName'),
            currentDesc: document.getElementById('radioCurrentDesc'),
            equalizer: document.getElementById('radioEqualizer'),
            playBtn: document.getElementById('radioPlayBtn'),
            volumeSlider: document.getElementById('radioVolumeSlider'),
            volumeValue: document.getElementById('radioVolumeValue'),
            volumeIcon: document.getElementById('radioVolumeIcon'),
            stationsLocal: document.getElementById('radioStationsLocal'),
            stationsInfo: document.getElementById('radioStationsInfo'),
            stationsMusic: document.getElementById('radioStationsMusic'),
            widget: document.getElementById('radioWidget'),
            widgetLogo: document.getElementById('radioWidgetLogo'),
            widgetName: document.getElementById('radioWidgetName'),
            widgetInfo: document.getElementById('radioWidgetInfo'),
            widgetPlayBtn: document.getElementById('radioWidgetPlayBtn'),
            widgetVolumeBtn: document.getElementById('radioWidgetVolumeBtn'),
            widgetVolumeSlider: document.getElementById('radioWidgetVolumeSlider'),
            widgetVolumeValue: document.getElementById('radioWidgetVolumeValue'),
            widgetCloseBtn: document.getElementById('radioWidgetCloseBtn'),
            toast: document.getElementById('radioToast')
        };

        // Initialiser le volume slider
        this.elements.volumeSlider.value = this.volume * 100;
        this.elements.volumeValue.textContent = Math.round(this.volume * 100) + '%';
        this.elements.widgetVolumeSlider.value = this.volume * 100;
        this.elements.widgetVolumeValue.textContent = Math.round(this.volume * 100) + '%';
        this.updateVolumeIcon();
    }

    // ============================================
    // BINDAGE DES ÉVÉNEMENTS
    // ============================================
    bindEvents() {
        // Fermer la modal
        this.elements.modalClose.addEventListener('click', () => this.closeModal());
        this.elements.modal.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) this.closeModal();
        });

        // Bouton play/pause principal
        this.elements.playBtn.addEventListener('click', () => this.togglePlay());

        // Volume
        this.elements.volumeSlider.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });

        this.elements.volumeIcon.addEventListener('click', () => this.toggleMute());

        // Widget
        this.elements.widgetInfo.addEventListener('click', () => this.openModal());
        this.elements.widgetPlayBtn.addEventListener('click', () => this.togglePlay());
        this.elements.widgetVolumeBtn.addEventListener('click', () => this.toggleMute());
        this.elements.widgetVolumeSlider.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });
        this.elements.widgetCloseBtn.addEventListener('click', () => this.stop());

        // Touche Echap pour fermer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.modal.classList.contains('show')) {
                this.closeModal();
            }
        });
    }

    // ============================================
    // RENDU DES STATIONS
    // ============================================
    renderStations() {
        const categories = {
            local: this.elements.stationsLocal,
            info: this.elements.stationsInfo,
            music: this.elements.stationsMusic
        };

        this.stations.forEach(station => {
            const container = categories[station.category];
            if (!container) return;

            const stationEl = document.createElement('div');
            stationEl.className = 'radio-station';
            stationEl.dataset.id = station.id;
            stationEl.innerHTML = `
                <img class="radio-station-logo" src="${station.logo}" alt="${station.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%236366f1%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.35em%22 fill=%22white%22 font-size=%2240%22>📻</text></svg>'">
                <div class="radio-station-name">${station.name}</div>
                <div class="radio-station-desc">${station.description}</div>
            `;

            stationEl.addEventListener('click', () => this.playStation(station.id));
            container.appendChild(stationEl);
        });
    }

    // ============================================
    // RESTAURER LA DERNIÈRE STATION
    // ============================================
    restoreLastStation() {
        if (this.lastStationId) {
            const station = this.stations.find(s => s.id === this.lastStationId);
            if (station) {
                this.currentStation = station;
                this.updateUI();
                // Ne pas jouer automatiquement, juste préparer l'UI
            }
        }
    }

    // ============================================
    // JOUER UNE STATION
    // ============================================
    playStation(stationId) {
        const station = this.stations.find(s => s.id === stationId);
        if (!station) return;

        // Arrêter l'audio actuel si existe
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
            this.audio = null;
        }

        // Créer nouvel audio
        this.audio = new Audio();
        this.audio.volume = this.volume;

        // Événements audio
        this.audio.addEventListener('playing', () => {
            this.isPlaying = true;
            this.updatePlayButton();
            this.elements.equalizer.classList.remove('paused');
            this.showWidget(); // Afficher le widget quand la radio joue
            // Mettre à jour le bouton du header
            const radioBtn = document.getElementById('radioBtn');
            if (radioBtn) radioBtn.classList.add('playing');
            console.log(`📻 En lecture: ${station.name}`);
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
            this.elements.equalizer.classList.add('paused');
            // Mettre à jour le bouton du header
            const radioBtn = document.getElementById('radioBtn');
            if (radioBtn) radioBtn.classList.remove('playing');
        });

        this.audio.addEventListener('error', (e) => {
            // Ignorer l'erreur si on arrête volontairement la radio
            if (this.stoppingManually) return;
            console.error('❌ Erreur radio:', e);
            this.showToast('Erreur de connexion à la radio');
            this.isPlaying = false;
            this.updatePlayButton();
        });

        this.audio.addEventListener('waiting', () => {
            this.elements.equalizer.classList.add('paused');
        });

        // Jouer
        this.audio.src = station.url;
        this.audio.play().catch(err => {
            console.error('Erreur lecture:', err);
            this.showToast('Impossible de lancer la radio');
        });

        // Mettre à jour l'état
        this.currentStation = station;
        localStorage.setItem('radio_last_station', station.id);
        this.updateUI();
        this.showToast(`📻 ${station.name}`);
    }

    // ============================================
    // TOGGLE PLAY/PAUSE
    // ============================================
    togglePlay() {
        if (!this.audio || !this.currentStation) {
            // Si pas d'audio, jouer la dernière station ou la première
            const stationId = this.lastStationId || this.stations[0].id;
            this.playStation(stationId);
            return;
        }

        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play().catch(err => {
                console.error('Erreur lecture:', err);
                // Essayer de recharger
                this.playStation(this.currentStation.id);
            });
        }
    }

    // ============================================
    // STOP
    // ============================================
    stop() {
        if (this.audio) {
            // Marquer qu'on arrête volontairement pour éviter le toast d'erreur
            this.stoppingManually = true;
            this.audio.pause();
            this.audio.src = '';
            this.audio = null;
            // Réinitialiser le flag après un court délai
            setTimeout(() => {
                this.stoppingManually = false;
            }, 100);
        }
        this.isPlaying = false;
        this.currentStation = null;
        this.updateUI();
        this.hideWidget();
        
        // Mettre à jour le bouton du header
        const radioBtn = document.getElementById('radioBtn');
        if (radioBtn) radioBtn.classList.remove('playing');
    }

    // ============================================
    // VOLUME
    // ============================================
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.audio) {
            this.audio.volume = this.volume;
        }
        localStorage.setItem('radio_volume', this.volume.toString());
        this.elements.volumeSlider.value = this.volume * 100;
        this.elements.volumeValue.textContent = Math.round(this.volume * 100) + '%';
        this.elements.widgetVolumeSlider.value = this.volume * 100;
        this.elements.widgetVolumeValue.textContent = Math.round(this.volume * 100) + '%';
        this.updateVolumeIcon();
    }

    toggleMute() {
        if (this.volume > 0) {
            this.previousVolume = this.volume;
            this.setVolume(0);
        } else {
            this.setVolume(this.previousVolume || 0.3);
        }
    }

    updateVolumeIcon() {
        let icon = 'volume_up';
        if (this.volume === 0) icon = 'volume_off';
        else if (this.volume < 0.5) icon = 'volume_down';

        this.elements.volumeIcon.textContent = icon;
        this.elements.widgetVolumeBtn.querySelector('.material-icons').textContent = icon;
    }

    // ============================================
    // MISE À JOUR DE L'UI
    // ============================================
    updateUI() {
        if (this.currentStation) {
            // Modal
            this.elements.currentLogo.src = this.currentStation.logo;
            this.elements.currentName.textContent = this.currentStation.name;
            this.elements.currentDesc.textContent = this.currentStation.description;
            this.elements.nowPlaying.classList.remove('hidden');

            // Widget - toujours mettre à jour les infos
            this.elements.widgetLogo.src = this.currentStation.logo;
            this.elements.widgetName.textContent = this.currentStation.name;

            // Marquer la station active
            document.querySelectorAll('.radio-station').forEach(el => {
                el.classList.toggle('active', el.dataset.id === this.currentStation.id);
            });

            // Bouton radio dans le header
            const radioBtn = document.getElementById('radioBtn');
            if (radioBtn) {
                radioBtn.classList.toggle('playing', this.isPlaying);
            }
        } else {
            this.elements.nowPlaying.classList.add('hidden');
            document.querySelectorAll('.radio-station').forEach(el => {
                el.classList.remove('active');
            });
            const radioBtn = document.getElementById('radioBtn');
            if (radioBtn) {
                radioBtn.classList.remove('playing');
            }
        }

        this.updatePlayButton();
    }

    updatePlayButton() {
        const icon = this.isPlaying ? 'pause' : 'play_arrow';
        this.elements.playBtn.querySelector('.material-icons').textContent = icon;
        this.elements.widgetPlayBtn.querySelector('.material-icons').textContent = this.isPlaying ? 'pause' : 'play_arrow';
    }

    // ============================================
    // MODAL
    // ============================================
    openModal() {
        this.elements.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.elements.modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    // ============================================
    // WIDGET
    // ============================================
    showWidget() {
        this.elements.widget.classList.add('show');
        document.body.classList.add('radio-playing');
    }

    hideWidget() {
        this.elements.widget.classList.remove('show');
        document.body.classList.remove('radio-playing');
    }

    // ============================================
    // TOAST
    // ============================================
    showToast(message) {
        this.elements.toast.textContent = message;
        this.elements.toast.classList.add('show');
        setTimeout(() => {
            this.elements.toast.classList.remove('show');
        }, 3000);
    }
}

// ============================================
// INITIALISATION GLOBALE
// ============================================
let radioPlayer = null;

document.addEventListener('DOMContentLoaded', () => {
    // Créer l'instance du lecteur
    radioPlayer = new RadioPlayer();

    // Exposer globalement pour le bouton
    window.openRadio = () => radioPlayer.openModal();
    window.radioPlayer = radioPlayer;
});

// ============================================
// FONCTION POUR OUVRIR LA RADIO (appelée depuis le HTML)
// ============================================
function openRadio() {
    if (radioPlayer) {
        radioPlayer.openModal();
    }
}
