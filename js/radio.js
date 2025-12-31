// ============================================
// RADIO PLAYER - Actu & Média
// Widget avec état déplié/replié, minuteur sommeil, now playing
// ============================================

class RadioPlayer {
    constructor() {
        // Liste des stations (de radiofm.ovh)
        this.stations = [
            // =====================================================
            // LOCALES / RÉGIONALES
            // =====================================================
			{
                id: 'Ici-Bourgogne',
                name: 'Ici-Bourgogne',
                url: 'https://icecast.radiofrance.fr/fbbourgogne-midfi.mp3',
                logo: 'images/radios-logos/Ici-Bourgogne.png',
                description: 'Info locale Bourgogne',
                category: 'locale'
            },
            {
                id: 'Radio-Prevert',
                name: 'Radio Prevert',
                url: 'https://vps.cbad.fr:8443/prevert',
                logo: 'images/radios-logos/Radio-Prevert.png',
                description: 'Chalon Sur Saône',
                category: 'locale'
            },
            {
                id: 'Frequence-Plus',
                name: 'Fréquence Plus',
                url: 'https://fplus-chalonsursaone.ice.infomaniak.ch/fplus-chalonsursaone-128.mp3',
                logo: 'images/radios-logos/Frequence-Plus.png',
                description: 'A plein tubes, Chalon',
                category: 'locale'
            },
            {
                id: 'Cerise-FM',
                name: 'Cerise FM',
                url: 'https://stream.rcs.revma.com/q90fb3dwnwzuv.mp3',
                logo: 'images/radios-logos/Cerise-FM.png',
                description: 'Les tubes d\'hier, les hits d\'aujourd\'hui',
                category: 'locale'
            },
            {
                id: 'Alouette-FM',
                name: 'Alouette FM',
                url: 'https://alouette-poitiers.ice.infomaniak.ch/alouette-poitiers-128.mp3',
                logo: 'images/radios-logos/Alouette-FM.png',
                description: 'Toujours plus de Hits',
                category: 'locale'
            },
            {
                id: 'Alouette-Nouveaux-Talents',
                name: 'Alouette Nouveaux Talents',
                url: 'https://alouettenouveauxtalents.ice.infomaniak.ch/alouettenouveauxtalents-128.mp3',
                logo: 'images/radios-logos/Alouette-Nouveaux-Talents.png',
                description: '1ère Radio Régionale de France',
                category: 'locale'
            },

            // =====================================================
            // GÉNÉRALISTES
            // =====================================================
			{
                id: 'La-Radio-Sans-pub',
                name: 'La Radio Sans pub',
                url: 'https://live1.jupinfo.fr:8443/play',
                logo: 'images/radios-logos/La-Radio-Sans-pub.png',
                description: '100% Hits 24/24',
                category: 'generaliste'
            },
            {
                id: 'NRJ',
                name: 'NRJ',
                url: 'https://streaming.nrjaudio.fm/oumvmk8fnozc?origine=fluxurlradio',
                logo: 'images/radios-logos/nrj.png',
                description: 'Hits & musique',
                category: 'generaliste'
            },
			{
                id: 'RFM',
                name: 'RFM',
                url: 'https://rfm.lmn.fm/rfm.mp3',
                logo: 'images/radios-logos/RFM.png',
                description: 'Le meilleur de la musique',
                category: 'generaliste'
            },
			{
                id: 'Skyrock',
                name: 'Skyrock',
                url: 'https://icecast.skyrock.net/s/natio_aac_128k?tvr_name=tunein16&tvr_section1=64aac',
                logo: 'images/radios-logos/Skyrock.png',
                description: 'Skyrock 1er sur le rap',
                category: 'generaliste'
            },
            {
                id: 'Fun-Radio',
                name: 'Fun Radio',
                url: 'https://streamer-02.rtl.fr/fun-1-44-128',
                logo: 'images/radios-logos/Fun-Radio.png',
                description: 'Le son dancefloor',
                category: 'generaliste'
            },
            {
                id: 'Vibration',
                name: 'Vibration',
                url: 'https://vibration.ice.infomaniak.ch/vibration-high.mp3',
                logo: 'images/radios-logos/Vibration.png',
                description: 'Hits & variétés',
                category: 'generaliste'
            },
            {
                id: 'Voltage',
                name: 'Voltage',
                url: 'https://start-voltage.ice.infomaniak.ch/start-voltage-high.mp3',
                logo: 'images/radios-logos/Voltage.png',
                description: 'Pop-rock français',
                category: 'generaliste'
            },

            // =====================================================
            // ROCK
            // =====================================================
			{
                id: 'RTL2',
                name: 'RTL2',
                url: 'https://streamer-02.rtl.fr/rtl2-1-44-128',
                logo: 'images/radios-logos/RTL2.png',
                description: 'Le Son Pop-Rock',
                category: 'rock'
            },
            {
                id: 'Virage-Radio',
                name: 'Virage Radio',
                url: 'https://virageradio.ice.infomaniak.ch/virageradio-high.mp3',
                logo: 'images/radios-logos/Virage-Radio.png',
                description: 'Rock & pop',
                category: 'rock'
            },
            {
                id: 'OUI-FM',
                name: 'OUI FM',
                url: 'https://ouifm.ice.infomaniak.ch/ouifm-high.mp3',
                logo: 'images/radios-logos/OUI-FM.png',
                description: 'Rock indé & alternatif',
                category: 'rock'
            },

            // =====================================================
            // THÉMATIQUES
            // =====================================================
			{
                id: 'M-Radio',
                name: 'M Radio',
                url: 'https://mradio-lyon.ice.infomaniak.ch/mradio-lyon.mp3',
                logo: 'images/radios-logos/M-Radio.png',
                description: 'Numéro 1 sur la chanson française',
                category: 'thematique'
            },
            {
                id: 'Nostalgie',
                name: 'Nostalgie',
                url: 'https://streaming.nrjaudio.fm/oug7girb92oc?origine=fluxradios',
                logo: 'images/radios-logos/nostalgie.png',
                description: 'Oldies & classics',
                category: 'thematique'
            },
            {
                id: 'Cherie-FM',
                name: 'Chérie FM',
                url: 'https://streaming.nrjaudio.fm/ouuku85n3nje?origine=fluxradios',
                logo: 'images/radios-logos/cherie-fm.png',
                description: 'Love songs',
                category: 'thematique'
            },
            {
                id: 'Voltage-80s',
                name: 'Voltage 80s',
                url: 'https://voltage80s.ice.infomaniak.ch/voltage80s-128.mp3',
                logo: 'images/radios-logos/Voltage-80s.png',
                description: 'Hits années 80',
                category: 'thematique'
            },
            {
                id: 'Voltage-90s',
                name: 'Voltage 90s',
                url: 'https://voltage90s.ice.infomaniak.ch/voltage90s-128.mp3',
                logo: 'images/radios-logos/Voltage-90s.png',
                description: 'Hits années 90',
                category: 'thematique'
            },
            {
                id: 'Voltage-2000',
                name: 'Voltage 2000',
                url: 'https://voltage2000.ice.infomaniak.ch/voltage2000-128.mp3',
                logo: 'images/radios-logos/Voltage-2000.png',
                description: 'Hits années 2000',
                category: 'thematique'
            },
            {
                id: 'Kiss-FM',
                name: 'Kiss FM',
                url: 'https://kissfm2.ice.infomaniak.ch/kissfm2-128.mp3',
                logo: 'images/radios-logos/Kiss-fm.png',
                description: 'Urban & R&B',
                category: 'thematique'
            },
            {
                id: 'FIP',
                name: 'FIP',
                url: 'https://icecast.radiofrance.fr/fip-midfi.mp3',
                logo: 'images/radios-logos/Radio-Fip.png',
                description: 'Éclectique & sans pub',
                category: 'thematique'
            },
            {
                id: 'Mouv',
                name: 'Mouv\'',
                url: 'https://icecast.radiofrance.fr/mouv-midfi.mp3',
                logo: 'images/radios-logos/Radio-mouv.png',
                description: 'Hip-hop & urbain',
                category: 'thematique'
            },
            {
                id: 'Radio-Nova',
                name: 'Radio Nova',
                url: 'https://novazz.ice.infomaniak.ch/novazz-128.mp3',
                logo: 'images/radios-logos/Radio-nova.png',
                description: 'Soul Funk World',
                category: 'thematique'
            },

            // =====================================================
            // INFO / TALK
            // =====================================================
            {
                id: 'France-Inter',
                name: 'France Inter',
                url: 'https://icecast.radiofrance.fr/franceinter-midfi.mp3',
                logo: 'images/radios-logos/France-Inter.png',
                description: 'Service public radio',
                category: 'info'
            },
            {
                id: 'RTL',
                name: 'RTL',
                url: 'https://streamer-03.rtl.fr/rtl-1-44-128',
                logo: 'images/radios-logos/rtl.png',
                description: 'Info & divertissement',
                category: 'info'
            },
            {
                id: 'Europe-1',
                name: 'Europe 1',
                url: 'https://europe1.lmn.fm/europe1.mp3',
                logo: 'images/radios-logos/europe1.png',
                description: 'Talk & actualités',
                category: 'info'
            },
            {
                id: 'RMC',
                name: 'RMC',
                url: 'https://audio.bfmtv.com/rmcradio_128.mp3',
                logo: 'images/radios-logos/rmc.png',
                description: 'Sport & info',
                category: 'info'
            },
			{
                id: 'France-Info',
                name: 'France Info',
                url: 'https://icecast.radiofrance.fr/franceinfo-midfi.mp3',
                logo: 'images/radios-logos/france-info.png',
                description: 'Info en continu',
                category: 'info'
            },
            {
                id: 'BFM-Radio',
                name: 'BFM Radio',
                url: 'https://audio.bfmtv.com/bfmradio_128.mp3',
                logo: 'images/radios-logos/BFM-Radio.png',
                description: 'Info en continu',
                category: 'info'
            },
            {
                id: 'Sud-Radio',
                name: 'Sud Radio',
                url: 'https://live.sudradio.fr/sudradio-mp3-128',
                logo: 'images/radios-logos/Sud-Radio.png',
                description: 'Talk & débats',
                category: 'info'
            }
        ];

        // État du lecteur
        this.audio = null;
        this.currentStation = null;
        this.isPlaying = false;
        this.stoppingManually = false;
        this.changingStation = false;
        this.volume = parseFloat(localStorage.getItem('radio_volume')) || 0.3;
        this.previousVolume = 0.3;
        this.lastStationId = localStorage.getItem('radio_last_station');
        this.isExpanded = true;

        // Minuteur sommeil
        this.sleepTimerId = null;
        this.sleepTimerEndTime = null;

        // Now Playing
        this.nowPlayingInterval = null;
        this.lastNowPlaying = '';

        // Éléments DOM
        this.elements = {};

        // Initialisation
        this.init();
    }

    init() {
        this.createHTML();
        this.cacheElements();
        this.bindEvents();
        this.renderStations();
        this.restoreLastStation();
        this.restoreSleepTimer();
        this.updateCastButtons();
        console.log('📻 Radio Player initialisé');
    }

    createHTML() {
        // Modal des stations
        const modalHTML = `
            <div class="radio-modal-overlay" id="radioModal">
                <div class="radio-modal">
                    <div class="radio-modal-header">
                        <h2>📻 Radio en direct</h2>
                        <button class="radio-modal-close" id="radioModalClose">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                    
                    <div class="radio-modal-content">
                        <div class="radio-now-playing hidden" id="radioNowPlaying">
                            <img class="radio-current-logo" id="radioCurrentLogo" src="" alt="">
                            <div class="radio-current-info">
                                <div class="radio-current-name" id="radioCurrentName">-</div>
                                <div class="radio-current-desc" id="radioCurrentDesc">-</div>
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
                            <button class="radio-cast-btn" id="radioCastBtn" title="Diffuser sur Chromecast">
                                <span class="material-icons">cast</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="radio-stations-container">
                        <div class="radio-stations-title">📍 Locales</div>
                        <div class="radio-stations-grid" id="radioStationsLocale"></div>
                        
                        <div class="radio-stations-title">🎵 Généralistes</div>
                        <div class="radio-stations-grid" id="radioStationsGeneraliste"></div>
                        
                        <div class="radio-stations-title">🎸 Rock</div>
                        <div class="radio-stations-grid" id="radioStationsRock"></div>
                        
                        <div class="radio-stations-title">🎧 Thématiques</div>
                        <div class="radio-stations-grid" id="radioStationsThematique"></div>
                        
                        <div class="radio-stations-title">📰 Infos</div>
                        <div class="radio-stations-grid" id="radioStationsInfo"></div>
                    </div>
                </div>
            </div>
        `;

        // Widget avec état déplié/replié
        const widgetHTML = `
            <div class="radio-widget" id="radioWidget">
                <!-- Header toujours visible -->
                <div class="radio-widget-header" id="radioWidgetHeader">
                    <img class="radio-widget-logo" id="radioWidgetLogo" src="" alt="">
                    <div class="radio-widget-info">
                        <div class="radio-widget-name" id="radioWidgetName">-</div>
                        <div class="radio-widget-status">
                            <span class="live-dot"></span>
                            <span>En direct</span>
                        </div>
                        <div class="radio-widget-nowplaying" id="radioWidgetNowPlaying">
                            <span class="material-icons">music_note</span>
                            <span id="radioWidgetNowPlayingText">-</span>
                        </div>
                    </div>
                    <button class="radio-widget-toggle" id="radioWidgetToggle" title="Déplier/Replier">
                        <span class="material-icons">expand_more</span>
                    </button>
                </div>
                
                <!-- Partie dépliable -->
                <div class="radio-widget-expanded" id="radioWidgetExpanded">
                    <!-- Visualiseur -->
                    <div class="radio-widget-visualizer" id="radioWidgetVisualizer">
                        <div class="radio-widget-bar"></div>
                        <div class="radio-widget-bar"></div>
                        <div class="radio-widget-bar"></div>
                        <div class="radio-widget-bar"></div>
                        <div class="radio-widget-bar"></div>
                    </div>
                    
                    <!-- Contrôles principaux -->
                    <div class="radio-widget-main-controls">
                        <button class="radio-widget-btn large" id="radioWidgetPlayBtn" title="Lecture/Pause">
                            <span class="material-icons">pause</span>
                        </button>
                        <button class="radio-widget-btn" id="radioWidgetMuteBtn" title="Muet">
                            <span class="material-icons">volume_up</span>
                        </button>
                        <button class="radio-widget-btn" id="radioWidgetStopBtn" title="Arrêter">
                            <span class="material-icons">stop</span>
                        </button>
                        <button class="radio-widget-btn" id="radioWidgetListBtn" title="Liste des radios">
                            <span class="material-icons">list</span>
                        </button>
                        <button class="radio-widget-btn cast" id="radioWidgetCastBtn" title="Chromecast">
                            <span class="material-icons">cast</span>
                        </button>
                        <button class="radio-widget-btn sleep" id="radioWidgetSleepBtn" title="Minuteur sommeil">
                            <span class="material-icons">bedtime</span>
                            <span class="sleep-badge" id="radioWidgetSleepBadge"></span>
                        </button>
                    </div>
                    
                    <!-- Volume slider grand -->
                    <div class="radio-widget-volume-section">
                        <input type="range" class="radio-widget-volume-slider" id="radioWidgetVolumeSlider" min="0" max="100" value="30">
                        <span class="radio-widget-volume-value" id="radioWidgetVolumeValue">30%</span>
                    </div>
                </div>
            </div>
            
            <!-- Popup Minuteur Sommeil -->
            <div class="sleep-timer-popup" id="sleepTimerPopup">
                <div class="sleep-timer-popup-header">
                    <span class="material-icons">bedtime</span>
                    <span>Minuteur sommeil</span>
                </div>
                <div class="sleep-timer-popup-grid">
                    <button class="sleep-timer-option" data-minutes="15">15 min</button>
                    <button class="sleep-timer-option" data-minutes="30">30 min</button>
                    <button class="sleep-timer-option" data-minutes="45">45 min</button>
                    <button class="sleep-timer-option" data-minutes="60">1 heure</button>
                    <button class="sleep-timer-option" data-minutes="90">1h30</button>
                    <button class="sleep-timer-option" data-minutes="120">2 heures</button>
                </div>
                <button class="sleep-timer-time-btn" id="sleepTimerTimeBtn">
                    <span class="material-icons">schedule</span>
                    <span>Heure précise...</span>
                </button>
                <input type="time" class="sleep-timer-time-input" id="sleepTimerTimeInput">
                <div class="sleep-timer-status" id="sleepTimerStatus">
                    <span class="material-icons">timer</span>
                    <span id="sleepTimerStatusText">Arrêt à --:--</span>
                    <button class="sleep-timer-cancel" id="sleepTimerCancel" title="Annuler">
                        <span class="material-icons">close</span>
                    </button>
                </div>
            </div>
        `;

        const toastHTML = `<div class="radio-toast" id="radioToast"></div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        document.body.insertAdjacentHTML('beforeend', toastHTML);
    }

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
            castBtn: document.getElementById('radioCastBtn'),
            volumeSlider: document.getElementById('radioVolumeSlider'),
            volumeValue: document.getElementById('radioVolumeValue'),
            volumeIcon: document.getElementById('radioVolumeIcon'),
            stationsLocale: document.getElementById('radioStationsLocale'),
            stationsGeneraliste: document.getElementById('radioStationsGeneraliste'),
            stationsRock: document.getElementById('radioStationsRock'),
            stationsThematique: document.getElementById('radioStationsThematique'),
            stationsInfo: document.getElementById('radioStationsInfo'),
            
            widget: document.getElementById('radioWidget'),
            widgetHeader: document.getElementById('radioWidgetHeader'),
            widgetToggle: document.getElementById('radioWidgetToggle'),
            widgetExpanded: document.getElementById('radioWidgetExpanded'),
            widgetLogo: document.getElementById('radioWidgetLogo'),
            widgetName: document.getElementById('radioWidgetName'),
            widgetNowPlaying: document.getElementById('radioWidgetNowPlaying'),
            widgetNowPlayingText: document.getElementById('radioWidgetNowPlayingText'),
            widgetVisualizer: document.getElementById('radioWidgetVisualizer'),
            widgetPlayBtn: document.getElementById('radioWidgetPlayBtn'),
            widgetMuteBtn: document.getElementById('radioWidgetMuteBtn'),
            widgetStopBtn: document.getElementById('radioWidgetStopBtn'),
            widgetListBtn: document.getElementById('radioWidgetListBtn'),
            widgetCastBtn: document.getElementById('radioWidgetCastBtn'),
            widgetSleepBtn: document.getElementById('radioWidgetSleepBtn'),
            widgetSleepBadge: document.getElementById('radioWidgetSleepBadge'),
            widgetVolumeSlider: document.getElementById('radioWidgetVolumeSlider'),
            widgetVolumeValue: document.getElementById('radioWidgetVolumeValue'),
            
            sleepTimerPopup: document.getElementById('sleepTimerPopup'),
            sleepTimerTimeBtn: document.getElementById('sleepTimerTimeBtn'),
            sleepTimerTimeInput: document.getElementById('sleepTimerTimeInput'),
            sleepTimerStatus: document.getElementById('sleepTimerStatus'),
            sleepTimerStatusText: document.getElementById('sleepTimerStatusText'),
            sleepTimerCancel: document.getElementById('sleepTimerCancel'),
            
            toast: document.getElementById('radioToast')
        };

        this.elements.volumeSlider.value = this.volume * 100;
        this.elements.volumeValue.textContent = Math.round(this.volume * 100) + '%';
        this.elements.widgetVolumeSlider.value = this.volume * 100;
        this.elements.widgetVolumeValue.textContent = Math.round(this.volume * 100) + '%';
        this.updateVolumeIcon();
    }

    bindEvents() {
        // Modal
        this.elements.modalClose.addEventListener('click', () => this.closeModal());
        this.elements.modal.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) this.closeModal();
        });

        this.elements.playBtn.addEventListener('click', () => this.togglePlay());
        this.elements.castBtn.addEventListener('click', () => this.startCast());
        this.elements.volumeSlider.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });
        this.elements.volumeIcon.addEventListener('click', () => this.toggleMute());

        // Widget header - clic pour ouvrir modal
        this.elements.widgetHeader.addEventListener('click', (e) => {
            if (!e.target.closest('.radio-widget-toggle')) {
                this.openModal();
            }
        });
        
        this.elements.widgetToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleWidgetExpand();
        });

        // Widget controls
        this.elements.widgetPlayBtn.addEventListener('click', () => this.togglePlay());
        this.elements.widgetMuteBtn.addEventListener('click', () => this.toggleMute());
        this.elements.widgetStopBtn.addEventListener('click', () => this.stop());
        this.elements.widgetListBtn.addEventListener('click', () => this.openModal());
        this.elements.widgetCastBtn.addEventListener('click', () => this.startCast());
        
        this.elements.widgetVolumeSlider.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });

        // Minuteur sommeil
        this.elements.widgetSleepBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSleepPopup();
        });

        document.querySelectorAll('.sleep-timer-option[data-minutes]').forEach(btn => {
            btn.addEventListener('click', () => {
                const minutes = parseInt(btn.dataset.minutes, 10);
                this.startSleepTimer(minutes);
            });
        });

        this.elements.sleepTimerTimeBtn.addEventListener('click', () => {
            const input = this.elements.sleepTimerTimeInput;
            if (input.style.display === 'none' || !input.style.display) {
                const now = new Date();
                now.setHours(now.getHours() + 1);
                input.value = now.toTimeString().slice(0, 5);
                input.style.display = 'block';
            } else {
                input.style.display = 'none';
            }
        });

        this.elements.sleepTimerTimeInput.addEventListener('change', () => {
            const timeValue = this.elements.sleepTimerTimeInput.value;
            if (timeValue) {
                this.startSleepTimerAtTime(timeValue);
            }
        });

        this.elements.sleepTimerCancel.addEventListener('click', () => {
            this.cancelSleepTimer();
        });

        document.addEventListener('click', (e) => {
            const popup = this.elements.sleepTimerPopup;
            const sleepBtn = this.elements.widgetSleepBtn;
            if (!popup.contains(e.target) && !sleepBtn.contains(e.target)) {
                popup.classList.remove('show');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.elements.modal.classList.contains('show')) {
                    this.closeModal();
                }
                this.elements.sleepTimerPopup.classList.remove('show');
            }
        });
    }

    renderStations() {
        const categories = {
            locale: this.elements.stationsLocale,
            generaliste: this.elements.stationsGeneraliste,
            rock: this.elements.stationsRock,
            thematique: this.elements.stationsThematique,
            info: this.elements.stationsInfo
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

    restoreLastStation() {
        if (this.lastStationId) {
            const station = this.stations.find(s => s.id === this.lastStationId);
            if (station) {
                this.currentStation = station;
                this.updateUI();
            }
        }
    }

    playStation(stationId) {
        const station = this.stations.find(s => s.id === stationId);
        if (!station) return;

        this.changingStation = true;

        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
            this.audio = null;
        }

        setTimeout(() => { this.changingStation = false; }, 500);

        this.audio = new Audio();
        this.audio.volume = this.volume;
        
        let loadingTimeout = null;
        let hasStartedPlaying = false;

        this.audio.addEventListener('playing', () => {
            hasStartedPlaying = true;
            if (loadingTimeout) clearTimeout(loadingTimeout);
            this.isPlaying = true;
            this.updatePlayButton();
            this.elements.equalizer.classList.remove('paused');
            this.elements.widgetVisualizer.classList.add('active');
            this.showWidget();
            
            const radioBtn = document.getElementById('radioBtn');
            if (radioBtn) radioBtn.classList.add('playing');
            
            console.log(`📻 En lecture: ${station.name}`);
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
            this.elements.equalizer.classList.add('paused');
            this.elements.widgetVisualizer.classList.remove('active');
            
            const radioBtn = document.getElementById('radioBtn');
            if (radioBtn) radioBtn.classList.remove('playing');
        });

        this.audio.addEventListener('error', (e) => {
            if (this.stoppingManually || this.changingStation) return;
            if (hasStartedPlaying) return;
            
            if (loadingTimeout) clearTimeout(loadingTimeout);
            loadingTimeout = setTimeout(() => {
                if (!hasStartedPlaying && !this.stoppingManually) {
                    console.error('❌ Erreur radio:', station.name);
                    this.showToast('Erreur de connexion à la radio');
                    this.isPlaying = false;
                    this.updatePlayButton();
                }
            }, 3000);
        });

        this.audio.addEventListener('waiting', () => {
            this.elements.equalizer.classList.add('paused');
            this.elements.widgetVisualizer.classList.remove('active');
        });

        this.audio.src = station.url;
        this.audio.play().catch(err => {
            console.error('Erreur lecture:', err);
            this.showToast('Impossible de lancer la radio');
        });

        this.currentStation = station;
        localStorage.setItem('radio_last_station', station.id);
        this.updateUI();
        this.showToast(`📻 ${station.name}`);
        
        this.startNowPlayingPolling();

        if (this.isCasting()) {
            this.castMedia();
        }
    }

    togglePlay() {
        if (!this.audio || !this.currentStation) {
            const stationId = this.lastStationId || this.stations[0].id;
            this.playStation(stationId);
            return;
        }

        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play().catch(err => {
                console.error('Erreur lecture:', err);
                this.playStation(this.currentStation.id);
            });
        }
    }

    stop() {
        if (this.isCasting()) {
            this.stopCast();
        }
        
        if (this.audio) {
            this.stoppingManually = true;
            this.audio.pause();
            this.audio.src = '';
            this.audio = null;
            setTimeout(() => { this.stoppingManually = false; }, 100);
        }
        
        this.isPlaying = false;
        this.currentStation = null;
        this.updateUI();
        this.hideWidget();
        this.stopNowPlayingPolling();
        
        const radioBtn = document.getElementById('radioBtn');
        if (radioBtn) radioBtn.classList.remove('playing');
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.audio) {
            this.audio.volume = this.volume;
        }
        
        if (this.isCasting()) {
            this.setCastVolume(this.volume);
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
        this.elements.widgetMuteBtn.querySelector('.material-icons').textContent = icon;
    }

    openModal() {
        this.elements.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.elements.modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    showWidget() {
        this.elements.widget.classList.add('show');
        document.body.classList.add('radio-playing');
    }

    hideWidget() {
        this.elements.widget.classList.remove('show');
        document.body.classList.remove('radio-playing');
    }

    toggleWidgetExpand() {
        this.isExpanded = !this.isExpanded;
        this.elements.widget.classList.toggle('collapsed', !this.isExpanded);
        
        const icon = this.elements.widgetToggle.querySelector('.material-icons');
        // Flèche vers le bas (v) quand déplié, vers le haut (^) quand minimisé
        icon.textContent = this.isExpanded ? 'expand_more' : 'expand_less';
    }

    updateUI() {
        if (this.currentStation) {
            this.elements.currentLogo.src = this.currentStation.logo;
            this.elements.currentName.textContent = this.currentStation.name;
            this.elements.currentDesc.textContent = this.currentStation.description;
            this.elements.nowPlaying.classList.remove('hidden');

            this.elements.widgetLogo.src = this.currentStation.logo;
            this.elements.widgetName.textContent = this.currentStation.name;

            document.querySelectorAll('.radio-station').forEach(el => {
                el.classList.toggle('active', el.dataset.id === this.currentStation.id);
            });

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
        this.elements.widgetPlayBtn.querySelector('.material-icons').textContent = icon;
    }

    showToast(message) {
        this.elements.toast.textContent = message;
        this.elements.toast.classList.add('show');
        setTimeout(() => {
            this.elements.toast.classList.remove('show');
        }, 3000);
    }

    // Minuteur sommeil
    toggleSleepPopup() {
        const popup = this.elements.sleepTimerPopup;
        popup.classList.toggle('show');
        
        if (popup.classList.contains('show')) {
            this.updateSleepTimerUI();
        }
    }

    startSleepTimer(minutes) {
        this.cancelSleepTimer();

        const now = Date.now();
        this.sleepTimerEndTime = now + minutes * 60 * 1000;
        localStorage.setItem('radio_sleep_timer', this.sleepTimerEndTime.toString());

        this.sleepTimerId = setTimeout(() => {
            this.stop();
            this.sleepTimerId = null;
            this.sleepTimerEndTime = null;
            localStorage.removeItem('radio_sleep_timer');
            this.updateSleepTimerUI();
            this.showToast('⏰ Minuteur terminé - Radio arrêtée');
        }, minutes * 60 * 1000);

        this.updateSleepTimerUI();
        this.showToast(`⏱️ Arrêt dans ${minutes} min`);
        
        setTimeout(() => {
            this.elements.sleepTimerPopup.classList.remove('show');
        }, 300);
    }

    startSleepTimerAtTime(timeString) {
        this.cancelSleepTimer();

        const [hours, minutes] = timeString.split(':').map(Number);
        const now = new Date();
        const target = new Date();
        
        target.setHours(hours, minutes, 0, 0);
        
        if (target <= now) {
            target.setDate(target.getDate() + 1);
        }

        this.sleepTimerEndTime = target.getTime();
        localStorage.setItem('radio_sleep_timer', this.sleepTimerEndTime.toString());

        const remainingMs = this.sleepTimerEndTime - now.getTime();

        this.sleepTimerId = setTimeout(() => {
            this.stop();
            this.sleepTimerId = null;
            this.sleepTimerEndTime = null;
            localStorage.removeItem('radio_sleep_timer');
            this.updateSleepTimerUI();
            this.showToast('⏰ Minuteur terminé - Radio arrêtée');
        }, remainingMs);

        this.updateSleepTimerUI();
        
        const isToday = target.getDate() === now.getDate();
        const dayText = isToday ? "aujourd'hui" : "demain";
        this.showToast(`⏰ Arrêt ${dayText} à ${timeString}`);
        
        this.elements.sleepTimerTimeInput.style.display = 'none';
        setTimeout(() => {
            this.elements.sleepTimerPopup.classList.remove('show');
        }, 300);
    }

    cancelSleepTimer() {
        if (this.sleepTimerId) {
            clearTimeout(this.sleepTimerId);
        }
        this.sleepTimerId = null;
        this.sleepTimerEndTime = null;
        localStorage.removeItem('radio_sleep_timer');
        this.updateSleepTimerUI();
        this.showToast('Minuteur annulé');
    }

    restoreSleepTimer() {
        const storedEndTime = localStorage.getItem('radio_sleep_timer');
        if (!storedEndTime) return;

        const endTime = parseInt(storedEndTime, 10);
        if (isNaN(endTime)) {
            localStorage.removeItem('radio_sleep_timer');
            return;
        }

        const remainingMs = endTime - Date.now();
        if (remainingMs <= 0) {
            localStorage.removeItem('radio_sleep_timer');
            return;
        }

        this.sleepTimerEndTime = endTime;
        this.sleepTimerId = setTimeout(() => {
            this.stop();
            this.sleepTimerId = null;
            this.sleepTimerEndTime = null;
            localStorage.removeItem('radio_sleep_timer');
            this.updateSleepTimerUI();
            this.showToast('⏰ Minuteur terminé - Radio arrêtée');
        }, remainingMs);

        this.updateSleepTimerUI();
    }

    updateSleepTimerUI() {
        const badge = this.elements.widgetSleepBadge;
        const sleepBtn = this.elements.widgetSleepBtn;
        const status = this.elements.sleepTimerStatus;
        const statusText = this.elements.sleepTimerStatusText;

        if (this.sleepTimerEndTime) {
            const remainingMs = this.sleepTimerEndTime - Date.now();
            const remainingMinutes = Math.round(remainingMs / 60000);
            const endDate = new Date(this.sleepTimerEndTime);
            const endTimeStr = endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

            sleepBtn.classList.add('active');
            badge.style.display = 'block';
            if (remainingMinutes >= 60) {
                const hours = Math.floor(remainingMinutes / 60);
                const mins = remainingMinutes % 60;
                badge.textContent = `${hours}h${mins > 0 ? mins : ''}`;
            } else {
                badge.textContent = `${remainingMinutes}m`;
            }

            status.style.display = 'flex';
            statusText.textContent = `Arrêt à ${endTimeStr}`;
        } else {
            sleepBtn.classList.remove('active');
            badge.style.display = 'none';
            status.style.display = 'none';
        }

        if (this.sleepTimerEndTime) {
            setTimeout(() => this.updateSleepTimerUI(), 30000);
        }
    }

    // Now Playing
    async fetchNowPlaying() {
        if (!this.currentStation || !this.isPlaying) {
            this.hideNowPlaying();
            return;
        }

        try {
            const encodedUrl = encodeURIComponent(this.currentStation.url);
            // Utiliser l'API locale
            const response = await fetch(`/api/nowplaying?url=${encodedUrl}`);
            const data = await response.json();

            if (data.success && data.nowPlaying) {
                this.showNowPlaying(data.nowPlaying);
            } else {
                this.hideNowPlaying();
            }
        } catch (error) {
            console.log('Erreur récupération titre:', error.message);
            this.hideNowPlaying();
        }
    }

    showNowPlaying(title) {
        if (title !== this.lastNowPlaying) {
            this.lastNowPlaying = title;
            this.elements.widgetNowPlayingText.textContent = title;
            this.elements.widgetNowPlaying.style.display = 'flex';
        }
    }

    hideNowPlaying() {
        this.elements.widgetNowPlaying.style.display = 'none';
        this.lastNowPlaying = '';
    }

    startNowPlayingPolling() {
        this.stopNowPlayingPolling();
        this.fetchNowPlaying();
        this.nowPlayingInterval = setInterval(() => {
            this.fetchNowPlaying();
        }, 15000);
    }

    stopNowPlayingPolling() {
        if (this.nowPlayingInterval) {
            clearInterval(this.nowPlayingInterval);
            this.nowPlayingInterval = null;
        }
        this.hideNowPlaying();
    }

    // Chromecast
    updateCastButtons() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) {
            this.elements.castBtn.style.display = 'none';
            this.elements.widgetCastBtn.style.display = 'none';
        }
    }

    isCasting() {
        if (typeof cast === 'undefined' || !cast.framework) return false;
        try {
            const castContext = cast.framework.CastContext.getInstance();
            const session = castContext.getCurrentSession();
            return session !== null;
        } catch (e) {
            return false;
        }
    }

    startCast() {
        if (typeof cast === 'undefined' || !cast.framework) {
            this.showToast('Chromecast non disponible');
            return;
        }

        if (this.isCasting()) {
            this.stopCast();
            return;
        }

        if (!this.currentStation) {
            this.showToast('Sélectionnez une radio d\'abord');
            return;
        }

        try {
            const castContext = cast.framework.CastContext.getInstance();
            
            castContext.requestSession().then(() => {
                this.castMedia();
                this.updateCastUI(true);
            }).catch(err => {
                if (err.code !== 'cancel') {
                    console.log('Cast annulé ou erreur:', err);
                }
            });
        } catch (err) {
            console.error('Erreur Cast:', err);
            this.showToast('Erreur Chromecast');
        }
    }

    stopCast() {
        try {
            const castContext = cast.framework.CastContext.getInstance();
            const session = castContext.getCurrentSession();
            if (session) {
                session.endSession(true);
                this.showToast('📺 Cast arrêté');
                this.updateCastUI(false);
            }
        } catch (err) {
            console.error('Erreur stop Cast:', err);
        }
    }

    castMedia() {
        if (!this.currentStation) return;

        const castSession = cast.framework.CastContext.getInstance().getCurrentSession();
        if (!castSession) return;

        const mediaInfo = new chrome.cast.media.MediaInfo(this.currentStation.url, 'audio/mpeg');
        mediaInfo.metadata = new chrome.cast.media.MusicTrackMediaMetadata();
        mediaInfo.metadata.title = this.currentStation.name;
        mediaInfo.metadata.subtitle = this.currentStation.description;
        if (this.currentStation.logo) {
            mediaInfo.metadata.images = [new chrome.cast.Image(this.currentStation.logo)];
        }

        const request = new chrome.cast.media.LoadRequest(mediaInfo);
        request.autoplay = true;

        castSession.loadMedia(request).then(() => {
            this.showToast(`📺 ${this.currentStation.name} sur Chromecast`);
            if (this.audio) {
                this.audio.pause();
            }
            this.setCastVolume(this.volume);
        }).catch(err => {
            console.error('Erreur Cast:', err);
            this.showToast('Erreur de diffusion');
        });
    }

    setCastVolume(value) {
        if (!this.isCasting()) return;
        
        try {
            const castSession = cast.framework.CastContext.getInstance().getCurrentSession();
            if (castSession) {
                castSession.setVolume(value);
            }
        } catch (err) {
            console.error('Erreur volume Cast:', err);
        }
    }

    updateCastUI(isCasting) {
        const castBtns = [this.elements.castBtn, this.elements.widgetCastBtn];
        castBtns.forEach(btn => {
            if (btn) {
                if (isCasting) {
                    btn.classList.add('casting');
                    btn.querySelector('.material-icons').textContent = 'cast_connected';
                } else {
                    btn.classList.remove('casting');
                    btn.querySelector('.material-icons').textContent = 'cast';
                }
            }
        });
    }
}

// Initialisation globale
let radioPlayer = null;

document.addEventListener('DOMContentLoaded', () => {
    radioPlayer = new RadioPlayer();
    window.openRadio = () => radioPlayer.openModal();
    window.radioPlayer = radioPlayer;
});

function openRadio() {
    if (radioPlayer) {
        radioPlayer.openModal();
    }
}
