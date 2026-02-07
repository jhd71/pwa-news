/* ============================================
   MINI RADIO PLAYER - ACCUEIL
   Se synchronise avec radio.html via localStorage
   ============================================ */

class MiniRadioPlayer {
    constructor() {
        // Stations disponibles (copie simplifiée)
        this.stations = [
            { id: 'Ici-Bourgogne', name: 'Ici-Bourgogne', url: 'https://icecast.radiofrance.fr/fbbourgogne-midfi.mp3', logo: 'images/radios-logos/Ici-Bourgogne.png' },
            { id: 'Radio-Prevert', name: 'Radio Prevert', url: 'https://vps.cbad.fr:8443/prevert', logo: 'images/radios-logos/Radio-Prevert.png' },
            { id: 'La-Radio-Sans-pub', name: 'La Radio Sans pub', url: 'https://live1.jupinfo.fr:8443/play', logo: 'images/radios-logos/La-Radio-Sans-pub.png' },
            { id: 'M-Radio', name: 'M Radio', url: 'https://mradio.ice.infomaniak.ch/mradio-high', logo: 'images/radios-logos/M-Radio.png' },
            { id: 'Frequence-Plus', name: 'Fréquence Plus', url: 'https://edge.audioxi.com/FREQUENCEPLUS', logo: 'images/radios-logos/Frequence-Plus.png' },
            { id: 'RFM', name: 'RFM', url: 'https://rfm.ice.infomaniak.ch/rfm-high', logo: 'images/radios-logos/RFM.png' },
            { id: 'NRJ', name: 'NRJ', url: 'https://scdn.nrjaudio.fm/fr/30001/mp3_128.mp3', logo: 'images/radios-logos/NRJ.png' },
            { id: 'Skyrock', name: 'Skyrock', url: 'https://icecast.skyrock.net/s/natio_mp3_128k', logo: 'images/radios-logos/Skyrock.png' },
            { id: 'Fun-Radio', name: 'Fun Radio', url: 'https://funradio.ice.infomaniak.ch/funradio-high', logo: 'images/radios-logos/Fun-Radio.png' },
            { id: 'RTL2', name: 'RTL2', url: 'https://streamer-02.rtl.fr/rtl2-1-44-128', logo: 'images/radios-logos/RTL2.png' },
            { id: 'Nostalgie', name: 'Nostalgie', url: 'https://scdn.nrjaudio.fm/fr/30601/mp3_128.mp3', logo: 'images/radios-logos/Nostalgie.png' },
            { id: 'Cherie-FM', name: 'Chérie FM', url: 'https://scdn.nrjaudio.fm/fr/30201/mp3_128.mp3', logo: 'images/radios-logos/Cherie-FM.png' },
            { id: 'Rire-Chansons', name: 'Rire & Chansons', url: 'https://scdn.nrjaudio.fm/fr/30401/mp3_128.mp3', logo: 'images/radios-logos/Rire-Chansons.png' },
            { id: 'Virage-Radio', name: 'Virage Radio', url: 'https://start-virage.ice.infomaniak.ch/start-virage-high', logo: 'images/radios-logos/Virage-Radio.png' },
            { id: 'OUI-FM', name: 'OUI FM', url: 'https://stream.ouifm.fr/ouifm-high.mp3', logo: 'images/radios-logos/OUI-FM.png' },
            { id: 'France-Inter', name: 'France Inter', url: 'https://icecast.radiofrance.fr/franceinter-midfi.mp3', logo: 'images/radios-logos/France-Inter.png' },
            { id: 'RTL', name: 'RTL', url: 'https://streamer-03.rtl.fr/rtl-1-44-128', logo: 'images/radios-logos/rtl.png' },
            { id: 'Europe-1', name: 'Europe 1', url: 'https://europe1.lmn.fm/europe1.mp3', logo: 'images/radios-logos/europe1.png' },
            { id: 'France-Info', name: 'France Info', url: 'https://icecast.radiofrance.fr/franceinfo-midfi.mp3', logo: 'images/radios-logos/france-info.png' },
            { id: 'FIP', name: 'FIP', url: 'https://icecast.radiofrance.fr/fip-midfi.mp3', logo: 'images/radios-logos/Radio-Fip.png' },
            { id: 'Radio-Nova', name: 'Radio Nova', url: 'https://novazz.ice.infomaniak.ch/novazz-128.mp3', logo: 'images/radios-logos/Radio-nova.png' }
        ];

        this.currentStation = null;
        this.isPlaying = false;
        this.volume = parseFloat(localStorage.getItem('miniRadioVolume')) || 0.3;
        this.expanded = false;

        // Éléments DOM
        this.container = null;
        this.audio = null;

        // Initialiser
        this.init();
    }

    init() {
        this.createPlayer();
        this.setupAudio();
        this.setupEventListeners();
        this.checkLastStation();
        this.setupBroadcastChannel();
        
        // Écouter les changements de localStorage (quand radio.html change)
        window.addEventListener('storage', (e) => this.handleStorageChange(e));
    }

    createPlayer() {
        // Créer le HTML du mini player
        const playerHTML = `
            <div class="mini-radio-player" id="miniRadioPlayer">
                <div class="mini-radio-content">
                    <img class="mini-radio-logo" id="miniRadioLogo" src="images/radios-logos/Radio-Prevert.png" alt="Radio">
                    
                    <div class="mini-radio-info" id="miniRadioInfo" title="Ouvrir le player complet">
                        <div class="mini-radio-name" id="miniRadioName">Aucune radio</div>
                        <div class="mini-radio-status" id="miniRadioStatus">
                            <span class="status-dot"></span>
                            <span class="status-text">En pause</span>
                        </div>
                    </div>
                    
                    <div class="mini-radio-visualizer" id="miniRadioVisualizer">
                        <div class="bar"></div>
                        <div class="bar"></div>
                        <div class="bar"></div>
                        <div class="bar"></div>
                    </div>
                    
                    <div class="mini-radio-controls">
                        <button class="mini-radio-btn play-btn" id="miniPlayBtn" title="Lecture / Pause">
                            <span class="material-icons">play_arrow</span>
                        </button>
                        <button class="mini-radio-btn stop-btn" id="miniStopBtn" title="Arrêter">
                            <span class="material-icons">stop</span>
                        </button>
                        <button class="mini-radio-btn expand-btn" id="miniExpandBtn" title="Ouvrir le player complet">
                            <span class="material-icons">open_in_new</span>
                        </button>
                    </div>
                </div>
                
                <div class="mini-radio-volume" id="miniRadioVolume">
                    <span class="material-icons" id="miniVolumeIcon">volume_up</span>
                    <input type="range" class="mini-radio-volume-slider" id="miniVolumeSlider" 
                           min="0" max="100" value="${Math.round(this.volume * 100)}">
                    <span class="mini-radio-volume-value" id="miniVolumeValue">${Math.round(this.volume * 100)}%</span>
                </div>
            </div>
        `;

        // Ajouter au body
        document.body.insertAdjacentHTML('beforeend', playerHTML);

        // Récupérer les références
        this.container = document.getElementById('miniRadioPlayer');
    }

    setupAudio() {
        this.audio = new Audio();
        this.audio.volume = this.volume;
        this.audio.preload = 'none';

        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.updateUI();
            this.syncToRadioPage();
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updateUI();
        });

        this.audio.addEventListener('error', (e) => {
            console.error('Erreur audio mini player:', e);
            this.isPlaying = false;
            this.updateUI();
        });
    }

    setupEventListeners() {
        // Bouton Play/Pause
        document.getElementById('miniPlayBtn').addEventListener('click', () => {
            if (this.isPlaying) {
                this.pause();
            } else {
                this.play();
            }
        });

        // Bouton Stop
        document.getElementById('miniStopBtn').addEventListener('click', () => {
            this.stop();
        });

        // Bouton Expand (ouvrir radio.html)
        document.getElementById('miniExpandBtn').addEventListener('click', () => {
            window.location.href = 'radio.html';
        });

        // Clic sur les infos → ouvrir radio.html
        document.getElementById('miniRadioInfo').addEventListener('click', () => {
            window.location.href = 'radio.html';
        });

        // Volume slider
        const volumeSlider = document.getElementById('miniVolumeSlider');
        volumeSlider.addEventListener('input', (e) => {
            const value = e.target.value / 100;
            this.setVolume(value);
        });

        // Toggle expand au double-clic sur le player
        this.container.addEventListener('dblclick', (e) => {
            if (!e.target.closest('button') && !e.target.closest('input')) {
                this.toggleExpand();
            }
        });
    }

    setupBroadcastChannel() {
        // Communication entre onglets
        if ('BroadcastChannel' in window) {
            this.channel = new BroadcastChannel('radio_sync');
            
            this.channel.onmessage = (event) => {
                const data = event.data;
                
                if (data.type === 'PLAY') {
                    // radio.html a lancé une radio
                    this.stop(); // Arrêter ici pour éviter le doublon
                    this.currentStation = this.stations.find(s => s.id === data.stationId);
                    this.updateUI();
                    this.show();
                } else if (data.type === 'STOP') {
                    // radio.html a arrêté
                    this.isPlaying = false;
                    this.updateUI();
                } else if (data.type === 'REQUEST_STATE') {
                    // radio.html demande l'état actuel
                    if (this.isPlaying && this.currentStation) {
                        this.channel.postMessage({
                            type: 'STATE',
                            stationId: this.currentStation.id,
                            isPlaying: this.isPlaying
                        });
                    }
                }
            };
        }
    }

    handleStorageChange(e) {
        if (e.key === 'lastStation') {
            const stationId = e.newValue;
            if (stationId) {
                this.currentStation = this.stations.find(s => s.id === stationId);
                this.updateUI();
                this.show();
            }
        }
    }

    checkLastStation() {
        const lastStationId = localStorage.getItem('lastStation');
        if (lastStationId) {
            this.currentStation = this.stations.find(s => s.id === lastStationId);
            if (this.currentStation) {
                this.updateUI();
                this.show();
            }
        }
    }

    play() {
        if (!this.currentStation) {
            // Pas de station sélectionnée, ouvrir radio.html
            window.location.href = 'radio.html';
            return;
        }

        this.audio.src = this.currentStation.url;
        this.audio.play().catch(err => {
            console.error('Erreur lecture:', err);
        });
    }

    pause() {
        this.audio.pause();
    }

    stop() {
        this.audio.pause();
        this.audio.src = '';
        this.isPlaying = false;
        this.updateUI();
        
        // Notifier radio.html
        if (this.channel) {
            this.channel.postMessage({ type: 'STOP_FROM_MINI' });
        }
    }

    setVolume(value) {
        this.volume = value;
        this.audio.volume = value;
        localStorage.setItem('miniRadioVolume', value);
        
        document.getElementById('miniVolumeValue').textContent = Math.round(value * 100) + '%';
        document.getElementById('miniVolumeSlider').value = Math.round(value * 100);
        
        // Icône volume
        const icon = document.getElementById('miniVolumeIcon');
        if (value === 0) {
            icon.textContent = 'volume_off';
        } else if (value < 0.5) {
            icon.textContent = 'volume_down';
        } else {
            icon.textContent = 'volume_up';
        }
    }

    toggleExpand() {
        this.expanded = !this.expanded;
        this.container.classList.toggle('expanded', this.expanded);
        document.body.classList.toggle('mini-player-expanded', this.expanded);
    }

    show() {
        this.container.classList.add('visible');
        document.body.classList.add('mini-player-visible');
    }

    hide() {
        this.container.classList.remove('visible');
        document.body.classList.remove('mini-player-visible');
    }

    updateUI() {
        const logo = document.getElementById('miniRadioLogo');
        const name = document.getElementById('miniRadioName');
        const status = document.getElementById('miniRadioStatus');
        const playBtn = document.getElementById('miniPlayBtn');
        const visualizer = document.getElementById('miniRadioVisualizer');

        if (this.currentStation) {
            logo.src = this.currentStation.logo;
            logo.alt = this.currentStation.name;
            name.textContent = this.currentStation.name;
        } else {
            name.textContent = 'Aucune radio';
        }

        if (this.isPlaying) {
            status.classList.add('playing');
            status.querySelector('.status-text').textContent = 'En lecture';
            playBtn.innerHTML = '<span class="material-icons">pause</span>';
            visualizer.classList.add('active');
        } else {
            status.classList.remove('playing');
            status.querySelector('.status-text').textContent = this.currentStation ? 'En pause' : 'Sélectionnez une radio';
            playBtn.innerHTML = '<span class="material-icons">play_arrow</span>';
            visualizer.classList.remove('active');
        }
    }

    syncToRadioPage() {
        // Stocker l'état pour radio.html
        if (this.currentStation) {
            localStorage.setItem('lastStation', this.currentStation.id);
        }
        
        // Notifier via BroadcastChannel
        if (this.channel && this.currentStation) {
            this.channel.postMessage({
                type: 'PLAY_FROM_MINI',
                stationId: this.currentStation.id
            });
        }
    }
}

// Initialiser quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    window.miniRadioPlayer = new MiniRadioPlayer();
});
