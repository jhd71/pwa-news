/* ============================================
   MINI RADIO PLAYER - ACCUEIL
   Se synchronise avec radio.html via localStorage
   VERSION CORRIGÉE - Utilise les données stockées
   ============================================ */

class MiniRadioPlayer {
    constructor() {
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
		// Vérifier si le mini player est activé dans les préférences
		const miniPlayerEnabled = localStorage.getItem('miniPlayerEnabled') !== 'false';
		if (!miniPlayerEnabled) {
			console.log('Mini player désactivé dans les préférences');
			return; // Ne pas initialiser
		}
		
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
						<button class="mini-radio-btn close-btn" id="miniCloseBtn" title="Fermer">
							<span class="material-icons">close</span>
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

		// Bouton Fermer
		document.getElementById('miniCloseBtn').addEventListener('click', () => {
			this.hide();
			this.stop();
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
                    // radio.html a lancé une radio - arrêter ici
                    this.stop();
                    // Recharger les données de la station
                    this.loadStationFromStorage();
                    this.updateUI();
                    this.show();
                } else if (data.type === 'STOP') {
                    // radio.html a arrêté
                    this.isPlaying = false;
                    this.updateUI();
                }
            };
        }
    }

    handleStorageChange(e) {
        if (e.key === 'lastStationData' || e.key === 'lastStation') {
            this.loadStationFromStorage();
            if (this.currentStation) {
                this.updateUI();
                this.show();
            }
        }
    }

    loadStationFromStorage() {
        // Essayer de charger les données complètes
        const stationData = localStorage.getItem('lastStationData');
        if (stationData) {
            try {
                this.currentStation = JSON.parse(stationData);
                return true;
            } catch (e) {
                console.error('Erreur parsing station data:', e);
            }
        }
        return false;
    }

    checkLastStation() {
        // Charger la dernière station depuis localStorage
        if (this.loadStationFromStorage()) {
            this.updateUI();
            this.show();
        }
    }

    play() {
        if (!this.currentStation || !this.currentStation.url) {
            // Pas de station sélectionnée, ouvrir radio.html
            window.location.href = 'radio.html';
            return;
        }

        this.audio.src = this.currentStation.url;
        this.audio.play().catch(err => {
            console.error('Erreur lecture:', err);
            this.isPlaying = false;
            this.updateUI();
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
}

// Initialiser quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    window.miniRadioPlayer = new MiniRadioPlayer();
});