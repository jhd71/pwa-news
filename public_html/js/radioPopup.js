/* ===================================================================== */
/* RADIO POPUP - JAVASCRIPT ORGANISÉ - PARTIE 1                        */
/* Structure de Base, Constructeur et Initialisation                    */
/* ===================================================================== */

class RadioPopupWidget {
    constructor() {
        // === STATIONS DE RADIO ===
        this.stations = [
            {
                name: 'Ici Bourgogne',
                url: 'https://icecast.radiofrance.fr/fbbourgogne-midfi.mp3',
                logo: 'images/radio-logos/Ici-Bourgogne.png',
                description: 'Info Bourgogne'
            },
            {
                name: 'Radio Prevert',
                url: 'https://vps.cbad.fr:8443/prevert',
                logo: 'images/radio-logos/Radio-Prevert.png',
                description: 'Chalon Sur Saône'
            },
            {
                name: 'La Radio Sans pub',
                url: 'https://live1.jupinfo.fr:8443/play',
                logo: 'images/radio-logos/La-Radio-Sans-pub.png',
                description: '100% Hits 24/24'
            },
            {
                name: 'France Info',
                url: 'https://icecast.radiofrance.fr/franceinfo-midfi.mp3',
                logo: 'images/radio-logos/france-info.png',
                description: 'Info en continu'
            },
            {
                name: 'RTL',
                url: 'https://streamer-03.rtl.fr/rtl-1-44-128',
                logo: 'images/radio-logos/rtl.png',
                description: 'Info & divertissement'
            },
            {
                name: 'Europe 1',
                url: 'https://europe1.lmn.fm/europe1.mp3',
                logo: 'images/radio-logos/europe1.png',
                description: 'Talk & actualités'
            },
            {
                name: 'RMC',
                url: 'https://audio.bfmtv.com/rmcradio_128.mp3',
                logo: 'images/radio-logos/rmc.png',
                description: 'Sport & info'
            },
            {
                name: 'Skyrock',
                url: 'https://icecast.skyrock.net/s/natio_aac_128k?tvr_name=tunein16&tvr_section1=64aac',
                logo: 'images/radio-logos/Skyrock.png',
                description: 'Skyrock 1er sur le rap'
            },
            {
                name: 'NRJ',
                url: 'https://streaming.nrjaudio.fm/oumvmk8fnozc?origine=fluxurlradio',
                logo: 'images/radio-logos/nrj.png',
                description: 'Hits & musique'
            },
            {
                name: 'Fun Radio',
                url: 'https://streamer-02.rtl.fr/fun-1-44-128',
                logo: 'images/radio-logos/Fun-Radio.png',
                description: 'Le son dancefloor'
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
                name: 'Fréquence Plus',
                url: 'https://fplus-chalonsursaone.ice.infomaniak.ch/fplus-chalonsursaone-128.mp3',
                logo: 'images/radio-logos/Frequence-Plus.png',
                description: 'A plein tubes, Chalon'
            },
            {
                name: 'M Radio',
                url: 'https://mradio-lyon.ice.infomaniak.ch/mradio-lyon.mp3',
                logo: 'images/radio-logos/M-Radio.png',
                description: ' Numéro 1 sur la chanson française'
            },
            {
                name: 'Cerise FM',
                url: 'https://stream.rcs.revma.com/q90fb3dwnwzuv.mp3',
                logo: 'images/radio-logos/Cerise-FM.png',
                description: 'Les tubes dhier, les hits daujourdhui'
            },
            {
                name: 'Alouette FM',
                url: 'https://alouette-poitiers.ice.infomaniak.ch/alouette-poitiers-128.mp3',
                logo: 'images/radio-logos/Alouette-FM.png',
                description: 'Toujours plus de Hits'
            },
            {
                name: 'RTL2',
                url: 'https://streamer-02.rtl.fr/rtl2-1-44-128',
                logo: 'images/radio-logos/RTL2.png',
                description: 'Le Son Pop-Rock'
            },
            {
                name: 'Alouette Nouveaux Talents',
                url: 'https://alouettenouveauxtalents.ice.infomaniak.ch/alouettenouveauxtalents-128.mp3',
                logo: 'images/radio-logos/Alouette-Nouveaux-Talents.png',
                description: ' 1ère Radio Régionale de France'
            }
        ];
        
        // === ÉTAT DE LA RADIO ===
        this.currentStation = null;
        this.isPlaying = false;
        this.audio = null;
        this.volume = 0.3;  // Volume par défaut à 30%
        
        // === MINUTEUR D'ARRÊT ===
        this.sleepTimer = null;
        this.sleepTimeRemaining = 0;
        this.sleepMode = 'duration';
        this.sleepTargetTime = null;
        
        // === ÉGALISEURS ===
        this.equalizerInterval = null;
        this.isEqualizerActive = false;
        this.compactEqualizerInterval = null;
        
        // === SYNCHRONISATION WIDGET ===
        this.widgetSyncInterval = null;
        
        // === CHROMECAST ===
        this.castSession = null;
        this.castPlayer = null;
        this.isCasting = false;
        this.castInitialized = false;
        this.castButtonsConfigured = false;
    }

    // === INITIALISATION ===
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.createRadioTile();
                this.createPopup();
                this.setupNetworkDetection();
                this.initializeCast();
            });
        } else {
            this.createRadioTile();
            this.createPopup();
            this.setupNetworkDetection();
            this.initializeCast();
        }
    }

    // === DÉTECTION RÉSEAU ===
    setupNetworkDetection() {
        window.addEventListener('online', () => {
            if (this.isPlaying && this.audio) {
                console.log('Connexion réseau rétablie');
                setTimeout(() => {
                    if (this.audio && this.audio.paused && this.isPlaying) {
                        console.log('Reconnexion après perte réseau...');
                        const currentStationIndex = this.stations.findIndex(s => s.name === this.currentStation.name);
                        if (currentStationIndex >= 0) {
                            this.stopCurrentAndPlayNew(currentStationIndex);
                        }
                    }
                }, 1000);
            }
        });
    }

    // === CRÉATION DE LA TUILE RADIO ===
    createRadioTile() {
        if (document.querySelector('.radio-app-tile')) {
            console.log('Tuile Radio déjà présente');
            return;
        }

        const radioSeparator = Array.from(document.querySelectorAll('.separator'))
            .find(sep => sep.textContent.includes('Espace+'));
        
        if (!radioSeparator) {
            const observer = new MutationObserver(() => {
                const separator = Array.from(document.querySelectorAll('.separator'))
                    .find(sep => sep.textContent.includes('Espace+'));
                if (separator) {
                    observer.disconnect();
                    this.createRadioTile();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            return;
        }

        const tileElement = document.createElement('div');
        tileElement.className = 'tile radio-app-tile';
        tileElement.setAttribute('data-category', 'Espace+');
        tileElement.innerHTML = `
            <div class="tile-content">
                <div class="tile-title">Lecteur Radio</div>
            </div>
            <div class="radio-tile-indicator" id="radioTileIndicator" style="display: none;"></div>
            <div class="radio-tile-status" id="radioTileStatus" style="display: none;"></div>
        `;

        tileElement.addEventListener('click', () => {
            this.openPopup();
        });

        radioSeparator.insertAdjacentElement('afterend', tileElement);
    }

    // === GESTION DES INDICATEURS DE LA TUILE ===
    showTileIndicator(stationName) {
        const indicator = document.getElementById('radioTileIndicator');
        const status = document.getElementById('radioTileStatus');
        
        if (indicator) {
            indicator.style.display = 'block';
        }
        
        if (status && stationName) {
            status.textContent = `▶ ${stationName}`;
            status.style.display = 'block';
        }
    }

    hideTileIndicator() {
        const indicator = document.getElementById('radioTileIndicator');
        const status = document.getElementById('radioTileStatus');
        
        if (indicator) {
            indicator.style.display = 'none';
        }
        
        if (status) {
            status.style.display = 'none';
        }
    }

    updateTileIndicator() {
        if (this.isPlaying && this.currentStation) {
            this.showTileIndicator(this.currentStation.name);
        } else {
            this.hideTileIndicator();
        }
    }

    // === GESTION DES STYLES DE STATUT ===
    updateStatusStyle(status) {
        const statusElement = document.getElementById('currentStationStatus');
        if (!statusElement) return;
        
        statusElement.classList.remove('status-live', 'status-paused', 'status-error', 'status-connecting');
        
        switch(status) {
            case 'En direct':
                statusElement.classList.add('status-live');
                break;
            case 'En pause':
            case 'Arrêté':
                statusElement.classList.add('status-paused');
                break;
            case 'Erreur':
            case 'Erreur de lecture':
                statusElement.classList.add('status-error');
                break;
            case 'Connexion...':
            case 'Connexion en cours...':
                statusElement.classList.add('status-connecting');
                break;
        }
    }

    // === GESTION DU VOLUME ===
    setVolume(volume) {
    this.volume = volume;
    
    if (this.audio) {
        this.audio.volume = volume;
    }
    
    if (this.isCasting && this.castSession) {
        const media = this.castSession.getMediaSession();
        if (media) {
            try {
                const volumeRequest = new chrome.cast.media.VolumeRequest(new chrome.cast.Volume(volume));
                media.setVolume(volumeRequest);
                // console.log supprimé pour éviter le spam
            } catch (error) {
                console.error('Erreur volume Cast:', error);
            }
        }
    }
}

    // === NOTIFICATIONS TOAST ===
    showToast(message) {
        let toast = document.querySelector('.radio-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'radio-toast';
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
	
	/* ===================================================================== */
/* RADIO POPUP - JAVASCRIPT ORGANISÉ - PARTIE 2                        */
/* Création de la Popup et Gestion des Événements                       */
/* ===================================================================== */

    // === CRÉATION DE LA POPUP ===
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
								<input type="range" id="volumeSlider" min="0" max="100" value="30" class="volume-slider">
								<span class="volume-percentage">30%</span>
						</div>
                        
                        <!-- Contrôle Chromecast -->
                        <div class="cast-control" id="castControl" style="display: none;">
                            <button class="cast-button" id="castButton" title="Diffuser sur un appareil">
                                <span class="material-icons">cast</span>
                                <span class="cast-status">Chromecast</span>
                            </button>
                        </div>
                        
                        <!-- Égaliseur visuel -->
                        <div class="equalizer-section">
                            <div class="equalizer-container" id="equalizerContainer">
                                <div class="equalizer-bar"></div>
                                <div class="equalizer-bar"></div>
                                <div class="equalizer-bar"></div>
                                <div class="equalizer-bar"></div>
                                <div class="equalizer-bar"></div>
                            </div>
                        </div>
                        
                        <!-- Minuteur d'arrêt -->
                        <div class="sleep-timer-section">
                            <div class="sleep-timer-mode-toggle">
                                <button id="durationModeBtn" class="timer-mode-btn active">Durée</button>
                                <button id="timeModeBtn" class="timer-mode-btn">Heure précise</button>
                            </div>
        
                            <div class="sleep-timer-controls" id="durationControls">
                                <span class="material-icons">schedule</span>
                                <select id="sleepTimerSelect" class="sleep-timer-select">
                                    <option value="0">Pas d'arrêt automatique</option>
                                    <option value="15">Arrêt dans 15 min</option>
                                    <option value="30">Arrêt dans 30 min</option>
                                    <option value="60">Arrêt dans 1 heure</option>
                                    <option value="120">Arrêt dans 2 heures</option>
                                    <option value="180">Arrêt dans 3 heures</option>
                                    <option value="240">Arrêt dans 4 heures</option>
                                </select>
                            </div>
        
                            <div class="sleep-timer-controls" id="timeControls" style="display: none;">
                                <span class="material-icons">access_time</span>
                                <input type="time" id="sleepTimeInput" class="sleep-time-input">
                                <button id="setSleepTimeBtn" class="set-time-btn">Programmer</button>
                                <button id="cancelSleepTimeBtn" class="cancel-time-btn" style="display: none;">Annuler</button>
                            </div>
        
                            <div class="sleep-timer-display" id="sleepTimerDisplay" style="display: none;">
                                <span class="material-icons">timer</span>
                                <span id="sleepTimerText">--:--</span>
                                <button id="cancelSleepTimer" class="cancel-timer-btn">
                                    <span class="material-icons">close</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="radio-popup-footer">
                    <p style="font-size: 12px; color: gray; text-align: center;">
                        📻 Les flux proviennent des diffuseurs officiels – Actu & Média n'héberge aucun contenu
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(popup);
        this.setupPopupEventListeners();
    }

    // === CONFIGURATION DES GESTIONNAIRES D'ÉVÉNEMENTS ===
    setupPopupEventListeners() {
        document.getElementById('closeRadioPopup').addEventListener('click', () => {
            this.closePopup();
        });

        document.getElementById('radioPopup').addEventListener('click', (e) => {
            if (e.target.id === 'radioPopup') {
                this.closePopup();
            }
        });

        document.querySelectorAll('.radio-station-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.index);
                this.toggleStationPlayback(index);
            });
        });

        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            const volume = e.target.value;
            this.setVolume(volume / 100);
            document.querySelector('.volume-percentage').textContent = volume + '%';
        });

        document.getElementById('sleepTimerSelect').addEventListener('change', (e) => {
            const minutes = parseInt(e.target.value);
            if (minutes > 0) {
                this.setSleepTimer(minutes);
            } else {
                this.cancelSleepTimer();
            }
        });

        document.getElementById('cancelSleepTimer').addEventListener('click', () => {
            this.cancelSleepTimer();
        });

        document.getElementById('durationModeBtn').addEventListener('click', () => {
            this.switchTimerMode('duration');
        });

        document.getElementById('timeModeBtn').addEventListener('click', () => {
            this.switchTimerMode('time');
        });

        document.getElementById('setSleepTimeBtn').addEventListener('click', () => {
            const timeInput = document.getElementById('sleepTimeInput');
            if (timeInput.value) {
                this.setSleepTime(timeInput.value);
            }
        });

        document.getElementById('cancelSleepTimeBtn').addEventListener('click', () => {
            this.cancelSleepTimer();
        });

        this.setupTimeControlsClickability();
    }

    // === CONFIGURATION DE LA ZONE HORAIRE CLIQUABLE ===
    setupTimeControlsClickability() {
        const timeControlsDiv = document.getElementById('timeControls');
        const timeInput = document.getElementById('sleepTimeInput');

        timeControlsDiv.addEventListener('click', (e) => {
            if (!e.target.closest('button') && !e.target.matches('input[type="time"]')) {
                timeInput.focus();
                timeInput.click();
                e.preventDefault();
                e.stopPropagation();
            }
        });

        timeInput.addEventListener('focus', () => {
            setTimeout(() => {
                timeInput.select();
            }, 50);
        });

        timeControlsDiv.style.cursor = 'pointer';
        timeControlsDiv.addEventListener('mouseenter', () => {
            timeControlsDiv.style.backgroundColor = 'rgba(148, 0, 0, 0.05)';
        });
        timeControlsDiv.addEventListener('mouseleave', () => {
            timeControlsDiv.style.backgroundColor = '';
        });
    }

    // === OUVERTURE DE LA POPUP ===
    openPopup() {
        const popup = document.getElementById('radioPopup');
        popup.classList.add('active');
        
        if (this.castInitialized) {
            this.showCastButtons();
        }
        
        document.body.classList.add('radio-popup-open');
        
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            this.scrollPosition = window.pageYOffset;
            document.body.style.top = `-${this.scrollPosition}px`;
        }
    }

    // === FERMETURE DE LA POPUP ===
    closePopup() {
        const popup = document.getElementById('radioPopup');
        popup.classList.remove('active');
        document.body.classList.remove('radio-popup-open');
        
        if (window.innerWidth <= 768) {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';
            if (this.scrollPosition) {
                window.scrollTo(0, this.scrollPosition);
                this.scrollPosition = null;
            }
        }
        
        this.updateTileIndicator();
        
        if (this.isPlaying && this.currentStation) {
            this.stopEqualizer();
            this.stopCompactEqualizer();
            
            setTimeout(() => {
                this.startEqualizer();
                this.startCompactEqualizer();
            }, 100);
        }
        
        if (this.currentStation) {
            this.createCompactWidget();
            this.updateCompactWidget();
        }
    }
	
	/* ===================================================================== */
/* RADIO POPUP - JAVASCRIPT ORGANISÉ - PARTIE 3                        */
/* Lecture Radio et Contrôles Audio                                     */
/* ===================================================================== */

    // === GESTION DE LA LECTURE (PLAY/STOP) ===
    toggleStationPlayback(index) {
        const station = this.stations[index];

        if (this.currentStation && this.currentStation.name === station.name) {
            if (this.isPlaying && this.audio && !this.audio.paused) {
                this.stopRadio();
            } else {
                this.stopCurrentAndPlayNew(index);
            }
        } else {
            this.stopCurrentAndPlayNew(index);
        }
    }

    // === ARRÊT ET NOUVELLE STATION ===
    stopCurrentAndPlayNew(index) {
        if (this.stopRetrying) {
            this.stopRetrying();
        }
        if (this.watchdogInterval) {
            clearInterval(this.watchdogInterval);
            this.watchdogInterval = null;
        }
        
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio = null;
        }
        this.isPlaying = false;
        
        document.querySelectorAll('.radio-station-card').forEach(card => {
            card.classList.remove('active', 'playing', 'paused');
            const overlay = card.querySelector('.play-overlay .material-icons');
            overlay.textContent = 'play_arrow';
        });
        
        this.stopEqualizer();
        this.stopCompactEqualizer();
        this.cancelSleepTimer();
        
        const station = this.stations[index];
        const card = document.querySelector(`[data-index="${index}"]`);
        
        this.currentStation = station;
        this.isPlaying = false;
        
        // Mettre à jour l'interface du lecteur
		document.getElementById('currentStationLogo').src = station.logo;
		document.getElementById('currentStationName').textContent = station.name;

	// Ne pas mettre "Connexion..." si on est en train de caster
		if (!this.isCasting) {
    document.getElementById('currentStationStatus').textContent = 'Connexion...';
    this.updateStatusStyle('Connexion...');
	}

document.getElementById('radioPlayerSection').style.display = 'block';
        
        card.classList.add('active');
        
        this.playRadio();
        
        const overlayIcon = card.querySelector('.play-overlay .material-icons');
        overlayIcon.textContent = 'stop';
        card.classList.add('playing');
    }

    // === LECTURE RADIO ===
    playRadio() {
    if (!this.currentStation) return;

    if (this.isCasting && this.castSession) {
        this.isPlaying = true;
        
        // Mettre à jour immédiatement le statut dans la popup
        const deviceName = this.castSession.getCastDevice()?.friendlyName || 'Chromecast';
        const statusElement = document.getElementById('currentStationStatus');
        if (statusElement) {
            statusElement.textContent = `📡 ${deviceName}`;
            this.updateStatusStyle('En direct');
        }
        
        this.loadMediaOnCast();
        return;
    }
        
        let retryCount = 0;
        const maxRetries = 10;
        let retryTimeout = null;
        let isIntentionallyStopped = false;

        const attemptConnection = () => {
            try {
                if (this.audio) {
                    this.audio.pause();
                    this.audio.src = '';
                    this.audio.load();
                    this.audio = null;
                }

                this.audio = new Audio(this.currentStation.url);
                this.audio.volume = this.volume;
                this.audio.crossOrigin = 'anonymous';
                
                this.audio.addEventListener('loadstart', () => {
                    document.getElementById('currentStationStatus').textContent = 'Connexion en cours...';
                    this.updateStatusStyle('Connexion en cours...');
                });
                
                this.audio.addEventListener('canplay', () => {
                    document.getElementById('currentStationStatus').textContent = 'En direct';
                    this.updateStatusStyle('En direct');
                    retryCount = 0;
                });

                this.audio.addEventListener('pause', () => {
    // Ne rien faire si on est en train de caster
    if (this.isCasting) {
        return;
    }
    
    if (this.isPlaying && !isIntentionallyStopped) {
        console.log('Pause détectée, tentative de reprise...');
                        setTimeout(() => {
                            if (this.isPlaying && !isIntentionallyStopped && this.audio) {
                                this.audio.play().catch(e => {
                                    console.log('Reprise échouée:', e);
                                });
                            }
                        }, 1000);
                    }
                });

                this.audio.addEventListener('stalled', () => {
                    console.log('Flux audio bloqué, reconnexion...');
                    if (this.isPlaying && !isIntentionallyStopped) {
                        retryTimeout = setTimeout(() => {
                            attemptConnection();
                        }, 2000);
                    }
                });

                this.audio.addEventListener('waiting', () => {
                    document.getElementById('currentStationStatus').textContent = 'Mise en mémoire tampon...';
                    this.updateStatusStyle('Connexion...');
                });
                
                this.audio.addEventListener('error', (e) => {
    // ✅ Vérifier le Cast EN PREMIER
    if (this.isCasting) {
        console.log('🎵 Audio local ignoré (Cast en cours)');
        return;
    }
    
    // ✅ Afficher l'erreur SEULEMENT si pas de Cast
    console.error('❌ Erreur audio:', e);
    
    if (!this.isPlaying || isIntentionallyStopped) {
        document.getElementById('currentStationStatus').textContent = 'Arrêté';
        this.updateStatusStyle('Arrêté');
        return;
    }

                    retryCount++;
                    
                    if (retryCount <= maxRetries) {
                        document.getElementById('currentStationStatus').textContent = `Reconnexion (${retryCount}/${maxRetries})...`;
                        this.updateStatusStyle('Connexion...');
                        
                        const delay = Math.min(1000 * Math.pow(1.5, retryCount - 1), 10000);
                        
                        retryTimeout = setTimeout(() => {
                            if (this.isPlaying && !isIntentionallyStopped) {
                                console.log(`Tentative de reconnexion ${retryCount}...`);
                                attemptConnection();
                            }
                        }, delay);
                    } else {
                        document.getElementById('currentStationStatus').textContent = 'Erreur de lecture';
                        this.updateStatusStyle('Erreur de lecture');
                        this.isPlaying = false;
                        
                        const activeCard = document.querySelector('.radio-station-card.active');
                        if (activeCard) {
                            const overlayIcon = activeCard.querySelector('.play-overlay .material-icons');
                            overlayIcon.textContent = 'play_arrow';
                            activeCard.classList.remove('playing');
                            activeCard.classList.add('paused');
                        }
                        
                        this.updateTileIndicator();
                        this.updateCompactWidget();
                        this.stopEqualizer();
                        this.stopCompactEqualizer();
                    }
                });

                const watchdog = setInterval(() => {
                    if (!this.isPlaying || isIntentionallyStopped || !this.audio) {
                        clearInterval(watchdog);
                        return;
                    }

                    if (this.audio.paused && this.isPlaying) {
                        console.log('Lecture interrompue détectée, relance...');
                        this.audio.play().catch(() => {
                            if (this.isPlaying && !isIntentionallyStopped) {
                                attemptConnection();
                            }
                        });
                    }
                }, 5000);

                this.watchdogInterval = watchdog;
                
                this.audio.play().then(() => {
                    this.isPlaying = true;
                    
                    this.updateTileIndicator();
                    
                    this.startEqualizer();
                    this.startCompactEqualizer();
                    
                    this.createCompactWidget();
                    this.updateCompactWidget();
                    
                    document.getElementById('currentStationStatus').textContent = 'En direct';
                    this.updateStatusStyle('En direct');
                    
                    const activeCard = document.querySelector('.radio-station-card.active');
                    if (activeCard) {
                        const overlayIcon = activeCard.querySelector('.play-overlay .material-icons');
                        overlayIcon.textContent = 'stop';
                        activeCard.classList.add('playing');
                        activeCard.classList.remove('paused');
                    }
                }).catch((error) => {
                    console.error('Erreur démarrage lecture:', error);
                    if (retryCount <= maxRetries && this.isPlaying && !isIntentionallyStopped) {
                        retryTimeout = setTimeout(() => {
                            attemptConnection();
                        }, 2000);
                    }
                });
                
            } catch (error) {
                console.error('Erreur création audio:', error);
                document.getElementById('currentStationStatus').textContent = 'Erreur';
                this.updateStatusStyle('Erreur');
                this.isPlaying = false;
                this.updateTileIndicator();
            }
        };

        this.stopRetrying = () => {
            isIntentionallyStopped = true;
            if (retryTimeout) {
                clearTimeout(retryTimeout);
                retryTimeout = null;
            }
            if (this.watchdogInterval) {
                clearInterval(this.watchdogInterval);
                this.watchdogInterval = null;
            }
        };

        attemptConnection();
    }

    // === ARRÊT COMPLET DE LA RADIO ===
    stopRadio(resetStation = true) {
        if (this.isCasting && this.castSession) {
            const media = this.castSession.getMediaSession();
            if (media) {
                media.stop(new chrome.cast.media.StopRequest());
            }
        }
        
        if (this.stopRetrying) {
            this.stopRetrying();
        }
        if (this.watchdogInterval) {
            clearInterval(this.watchdogInterval);
            this.watchdogInterval = null;
        }
        
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio = null;
        }
        this.isPlaying = false;
        
        document.querySelectorAll('.radio-station-card').forEach(card => {
            card.classList.remove('active', 'playing', 'paused');
            const overlay = card.querySelector('.play-overlay .material-icons');
            overlay.textContent = 'play_arrow';
        });
        
        if (resetStation) {
            this.currentStation = null;
        }
        
        this.hideTileIndicator();
        this.stopEqualizer();
        this.stopCompactEqualizer();
        this.cancelSleepTimer();
        
        if (resetStation) {
            this.hideCompactWidget();
        } else {
            this.updateCompactWidget();
        }
        
        const statusElement = document.getElementById('currentStationStatus');
        if (statusElement) {
            statusElement.textContent = 'Arrêté';
            this.updateStatusStyle('Arrêté');
        }
        
        if (resetStation) {
            const playerSection = document.getElementById('radioPlayerSection');
            if (playerSection) {
                playerSection.style.display = 'none';
            }
        }
        
        this.updateTileIndicator();
    }

    // === GESTION DES ÉGALISEURS ===
    startEqualizer() {
        if (this.equalizerInterval) {
            clearInterval(this.equalizerInterval);
            this.equalizerInterval = null;
        }
        
        this.isEqualizerActive = true;
        const bars = document.querySelectorAll('.equalizer-bar');
        
        if (bars.length === 0) {
            console.log('Aucune barre d\'égaliseur trouvée');
            return;
        }
        
        this.equalizerInterval = setInterval(() => {
            if (this.isEqualizerActive && this.isPlaying) {
                bars.forEach(bar => {
                    const height = Math.random() * 80 + 20;
                    bar.style.height = height + '%';
                });
            }
        }, 200);
    }

    stopEqualizer() {
        this.isEqualizerActive = false;
        
        if (this.equalizerInterval) {
            clearInterval(this.equalizerInterval);
            this.equalizerInterval = null;
        }
        
        const bars = document.querySelectorAll('.equalizer-bar');
        bars.forEach(bar => {
            bar.style.height = '20%';
        });
    }

    startCompactEqualizer() {
        if (this.compactEqualizerInterval) {
            clearInterval(this.compactEqualizerInterval);
            this.compactEqualizerInterval = null;
        }
        
        setTimeout(() => {
            const bars = document.querySelectorAll('.mini-bar');
            if (bars.length === 0) {
                setTimeout(() => this.startCompactEqualizer(), 500);
                return;
            }
            
            this.compactEqualizerInterval = setInterval(() => {
                if (this.isPlaying) {
                    bars.forEach(bar => {
                        const height = Math.random() * 70 + 30;
                        bar.style.height = height + '%';
                    });
                } else {
                    bars.forEach(bar => {
                        bar.style.height = '30%';
                    });
                }
            }, 300);
        }, 100);
    }

    stopCompactEqualizer() {
        if (this.compactEqualizerInterval) {
            clearInterval(this.compactEqualizerInterval);
            this.compactEqualizerInterval = null;
        }
        
        document.querySelectorAll('.mini-bar').forEach(bar => {
            bar.style.height = '30%';
        });
    }
	
	/* ===================================================================== */
/* RADIO POPUP - JAVASCRIPT ORGANISÉ - PARTIE 4                        */
/* Minuteur d'Arrêt et Gestion du Temps                                 */
/* ===================================================================== */

    // === GESTION DES MODES DE MINUTEUR ===
    switchTimerMode(mode) {
        this.sleepMode = mode;
        
        const durationBtn = document.getElementById('durationModeBtn');
        const timeBtn = document.getElementById('timeModeBtn');
        const durationControls = document.getElementById('durationControls');
        const timeControls = document.getElementById('timeControls');
        
        if (mode === 'duration') {
            durationBtn.classList.add('active');
            timeBtn.classList.remove('active');
            durationControls.style.display = 'flex';
            timeControls.style.display = 'none';
        } else {
            timeBtn.classList.add('active');
            durationBtn.classList.remove('active');
            durationControls.style.display = 'none';
            timeControls.style.display = 'flex';
            
            const now = new Date();
            now.setHours(now.getHours() + 1);
            const timeString = now.toTimeString().slice(0, 5);
            document.getElementById('sleepTimeInput').value = timeString;
        }
    }

    // === MINUTEUR PAR DURÉE ===
    setSleepTimer(minutes) {
        this.cancelSleepTimer();
        
        this.sleepTimeRemaining = minutes * 60;
        
        document.getElementById('sleepTimerDisplay').style.display = 'flex';
        this.updateSleepTimerDisplay();
        
        this.sleepTimer = setInterval(() => {
            this.sleepTimeRemaining--;
            this.updateSleepTimerDisplay();
            
            if (this.sleepTimeRemaining <= 0) {
                this.stopRadio();
                this.cancelSleepTimer();
                this.showToast('Arrêt automatique de la radio');
            }
        }, 1000);
        
        let timeText;
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            
            if (remainingMinutes === 0) {
                timeText = hours === 1 ? '1 heure' : `${hours} heures`;
            } else {
                timeText = `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
            }
        } else {
            timeText = `${minutes} min`;
        }
        
        this.showToast(`⏰ Arrêt programmé dans ${timeText}`);
        this.updateCompactWidget();
    }

    // === MINUTEUR À HEURE PRÉCISE ===
    setSleepTime(timeString) {
        this.cancelSleepTimer();
        
        const [hours, minutes] = timeString.split(':').map(Number);
        const now = new Date();
        const targetTime = new Date();
        
        targetTime.setHours(hours, minutes, 0, 0);
        
        if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
        }
        
        this.sleepTargetTime = targetTime;
        this.sleepTimeRemaining = Math.floor((targetTime - now) / 1000);
        
        if (this.sleepTimeRemaining <= 0) {
            this.showToast('⚠️ Heure invalide');
            return;
        }
        
        document.getElementById('sleepTimerDisplay').style.display = 'flex';
        document.getElementById('cancelSleepTimeBtn').style.display = 'inline-block';
        document.getElementById('setSleepTimeBtn').textContent = 'Modifier';
        
        this.updateSleepTimerDisplay();
        
        this.sleepTimer = setInterval(() => {
            this.sleepTimeRemaining--;
            this.updateSleepTimerDisplay();
            
            if (this.sleepTimeRemaining <= 0) {
                this.stopRadio();
                this.cancelSleepTimer();
                this.showToast('🕐 Arrêt programmé de la radio');
            }
        }, 1000);
        
        const timeDisplay = targetTime.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const dateDisplay = targetTime.toLocaleDateString('fr-FR') === now.toLocaleDateString('fr-FR') 
            ? 'aujourd\'hui' 
            : 'demain';
        
        this.showToast(`⏰ Arrêt programmé ${dateDisplay} à ${timeDisplay}`);
        this.updateCompactWidget();
    }

    // === ANNULATION DU MINUTEUR ===
    cancelSleepTimer() {
        if (this.sleepTimer) {
            clearInterval(this.sleepTimer);
            this.sleepTimer = null;
        }
        
        this.sleepTimeRemaining = 0;
        this.sleepTargetTime = null;
        
        document.getElementById('sleepTimerDisplay').style.display = 'none';
        document.getElementById('sleepTimerSelect').value = '0';
        
        document.getElementById('cancelSleepTimeBtn').style.display = 'none';
        document.getElementById('setSleepTimeBtn').textContent = 'Programmer';
        document.getElementById('sleepTimeInput').value = '';
        
        this.updateCompactWidget();
    }

    // === AFFICHAGE DU TEMPS RESTANT ===
    updateSleepTimerDisplay() {
        const totalMinutes = Math.floor(this.sleepTimeRemaining / 60);
        const seconds = this.sleepTimeRemaining % 60;
        
        let timeText;
        if (totalMinutes >= 60) {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            
            if (minutes === 0) {
                timeText = `${hours}h`;
            } else {
                timeText = `${hours}h${minutes.toString().padStart(2, '0')}`;
            }
        } else {
            timeText = `${totalMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        document.getElementById('sleepTimerText').textContent = timeText;
    }
	
	/* ===================================================================== */
/* RADIO POPUP - JAVASCRIPT ORGANISÉ - PARTIE 5                        */
/* Widget Compact et Gestion                                             */
/* ===================================================================== */

    // === CRÉATION DU WIDGET COMPACT ===
    createCompactWidget() {
        if (!this.currentStation) {
            return;
        }
        
        if (document.querySelector('.radio-compact-widget')) {
            return;
        }

        const widget = document.createElement('div');
        widget.className = 'radio-compact-widget';
        widget.innerHTML = `
            <div class="compact-widget-content">
                <button class="compact-close-btn" id="compactCloseBtn" title="Fermer le widget">
                    <span class="material-icons">close</span>
                </button>
                
                <div class="compact-station-info">
                    <div class="compact-logo-container">
                        <img id="compactStationLogo" src="" alt="" class="compact-logo">
                        <div class="compact-equalizer" id="compactEqualizer">
                            <div class="mini-bar"></div>
                            <div class="mini-bar"></div>
                            <div class="mini-bar"></div>
                        </div>
                    </div>
                    <div class="compact-details">
                        <div id="compactStationName">Aucune station</div>
                        <div id="compactStationStatus">Arrêtée</div>
                        <div id="compactTimerDisplay" class="compact-timer" style="display: none;">
                            ⏰ <span id="compactTimerText">--:--</span>
                        </div>
                    </div>
                </div>
                
                <div class="compact-controls">
                    <button id="compactPlayPause" class="compact-btn" title="Lecture/Stop">
                        <span class="material-icons">play_arrow</span>
                    </button>
                    <button id="compactCast" class="compact-btn compact-cast-btn" title="Chromecast" style="display: none;">
                        <span class="material-icons">cast</span>
                    </button>
                    <button id="compactTimer" class="compact-btn compact-timer-btn" title="Minuteur d'arrêt">
                        <span class="material-icons">schedule</span>
                    </button>
                    <button id="compactVolume" class="compact-btn" title="Volume">
                        <span class="material-icons">volume_up</span>
                    </button>
                    <button id="compactOpenFull" class="compact-btn" title="Ouvrir">
                        <span class="material-icons">open_in_full</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(widget);

        if (this.castInitialized) {
            const compactCast = document.getElementById('compactCast');
            if (compactCast) {
                compactCast.style.display = 'flex';
                this.setupCastButtonEvents();
            }
        }

        this.setupCompactWidgetEvents(widget);
        this.startCompactEqualizer();
        this.startWidgetSync();
    }

    // === CONFIGURATION DES ÉVÉNEMENTS DU WIDGET ===
    setupCompactWidgetEvents(widget) {
        document.getElementById('compactCloseBtn').addEventListener('click', () => {
            this.hideCompactWidget();
        });

        document.getElementById('compactPlayPause').addEventListener('click', () => {
            if (this.currentStation) {
                this.toggleStationPlayback(this.stations.findIndex(s => s.name === this.currentStation.name));
            } else {
                this.openPopup();
            }
        });

        document.getElementById('compactTimer').addEventListener('click', () => {
            this.showQuickTimerMenu();
        });

        document.getElementById('compactVolume').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleVolumeSlider();
        });

        document.getElementById('compactOpenFull').addEventListener('click', () => {
            this.openPopup();
        });
    }

    // === MISE À JOUR DU WIDGET COMPACT ===
    updateCompactWidget() {
        const widget = document.querySelector('.radio-compact-widget');
        if (!widget) return;

        const logo = document.getElementById('compactStationLogo');
        const name = document.getElementById('compactStationName');
        const status = document.getElementById('compactStationStatus');
        const playBtn = document.getElementById('compactPlayPause');
        const timerDisplay = document.getElementById('compactTimerDisplay');
        const timerText = document.getElementById('compactTimerText');
        const timerBtn = document.getElementById('compactTimer');
        const equalizer = document.getElementById('compactEqualizer');
        
        const isActuallyPlaying = this.currentStation && this.isPlaying && this.audio && !this.audio.paused;
        const isCastingNow = this.currentStation && this.isPlaying && this.isCasting;

        if (isActuallyPlaying || isCastingNow) {
            logo.src = this.currentStation.logo;
            logo.style.display = 'block';
            name.textContent = this.currentStation.name;
            
            if (isCastingNow) {
                const deviceName = this.castSession?.getCastDevice()?.friendlyName || 'Chromecast';
                status.textContent = `📡 ${deviceName}`;
            } else {
                status.textContent = 'En direct';
            }
            
            status.className = 'status-live';
            playBtn.querySelector('.material-icons').textContent = 'stop';
            widget.classList.add('playing');
            
            if (isActuallyPlaying) {
                equalizer.style.display = 'flex';
            } else {
                equalizer.style.display = 'none';
            }
        } else if (this.currentStation) {
            logo.src = this.currentStation.logo;
            logo.style.display = 'block';
            name.textContent = this.currentStation.name;
            status.textContent = 'Arrêtée';
            status.className = 'status-paused';
            playBtn.querySelector('.material-icons').textContent = 'play_arrow';
            widget.classList.remove('playing');
            equalizer.style.display = 'none';
        } else {
            this.hideCompactWidget();
            return;
        }

        if (this.sleepTimer && this.sleepTimeRemaining > 0) {
            const totalMinutes = Math.floor(this.sleepTimeRemaining / 60);
            const seconds = this.sleepTimeRemaining % 60;
            
            let displayText;
            if (totalMinutes >= 60) {
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                
                if (minutes === 0) {
                    displayText = `${hours}h`;
                } else {
                    displayText = `${hours}h${minutes.toString().padStart(2, '0')}`;
                }
            } else {
                displayText = `${totalMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            timerText.textContent = displayText;
            timerDisplay.style.display = 'flex';
            timerBtn.classList.add('active-timer');
        } else {
            timerDisplay.style.display = 'none';
            timerBtn.classList.remove('active-timer');
        }

        this.updateCompactVolumeIcon();
    }

    // === MISE À JOUR DE L'ICÔNE VOLUME ===
    updateCompactVolumeIcon() {
        const volumeBtn = document.getElementById('compactVolume');
        if (!volumeBtn) return;

        const icon = volumeBtn.querySelector('.material-icons');
        if (this.volume === 0) {
            icon.textContent = 'volume_off';
        } else if (this.volume <= 0.3) {
            icon.textContent = 'volume_down';
        } else {
            icon.textContent = 'volume_up';
        }
    }

    // === GESTION DE L'AFFICHAGE DU WIDGET ===
    hideCompactWidget() {
        const widget = document.querySelector('.radio-compact-widget');
        if (widget) {
            widget.style.animation = 'slideOutLeft 0.3s ease';
            setTimeout(() => {
                if (widget.parentNode) {
                    widget.remove();
                }
                this.stopWidgetSync();
                this.stopCompactEqualizer();
            }, 300);
            
            if (this.isPlaying || this.currentStation) {
                this.showToast('Widget masqué');
            }
        }
    }

    showCompactWidget() {
        if (!document.querySelector('.radio-compact-widget')) {
            this.createCompactWidget();
            this.updateCompactWidget();
        }
    }

    // === SYNCHRONISATION DU WIDGET ===
    startWidgetSync() {
        if (this.widgetSyncInterval) return;
        
        this.widgetSyncInterval = setInterval(() => {
            const widget = document.querySelector('.radio-compact-widget');
            if (widget) {
                this.updateCompactWidget();
            }
        }, 1000);
    }

    stopWidgetSync() {
        if (this.widgetSyncInterval) {
            clearInterval(this.widgetSyncInterval);
            this.widgetSyncInterval = null;
        }
    }
	
	/* ===================================================================== */
/* RADIO POPUP - JAVASCRIPT ORGANISÉ - PARTIE 6                        */
/* Menu Minuteur Rapide et Chromecast                                   */
/* ===================================================================== */

    // === MENU MINUTEUR RAPIDE ===
    showQuickTimerMenu() {
        const existingMenu = document.querySelector('.quick-timer-menu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }

        const menu = document.createElement('div');
        menu.className = 'quick-timer-menu';
        menu.innerHTML = `
            <div class="quick-timer-options">
                <div class="timer-mode-header">
                    <button class="quick-mode-btn active" data-mode="duration">Durée</button>
                    <button class="quick-mode-btn" data-mode="time">Heure</button>
                </div>
                
                <div class="duration-options" id="quickDurationOptions">
                    <div class="timer-option" data-minutes="0">
                        <span class="material-icons">close</span>
                        <span>Annuler</span>
                    </div>
                    <div class="timer-option" data-minutes="15">
                        <span class="material-icons">schedule</span>
                        <span>15 min</span>
                    </div>
                    <div class="timer-option" data-minutes="30">
                        <span class="material-icons">schedule</span>
                        <span>30 min</span>
                    </div>
                    <div class="timer-option" data-minutes="60">
                        <span class="material-icons">schedule</span>
                        <span>1 heure</span>
                    </div>
                    <div class="timer-option" data-minutes="120">
                        <span class="material-icons">schedule</span>
                        <span>2 heures</span>
                    </div>
                </div>
                
                <div class="time-options" id="quickTimeOptions" style="display: none;">
                    <div class="quick-time-input">
                        <input type="time" id="quickTimeInput" class="quick-time-field">
                        <button id="quickSetTime" class="quick-set-btn">OK</button>
                    </div>
                    <div class="quick-time-presets">
                        <div class="time-preset" data-offset="30">+30min</div>
                        <div class="time-preset" data-offset="60">+1h</div>
                        <div class="time-preset" data-offset="120">+2h</div>
                    </div>
                </div>
            </div>
        `;

        const widget = document.querySelector('.radio-compact-widget');
        const rect = widget.getBoundingClientRect();

        menu.style.position = 'fixed';
        menu.style.zIndex = '10001';

        if (window.innerWidth <= 480) {
            menu.style.left = '10px';
            menu.style.bottom = '160px';
            menu.style.right = 'auto';
            menu.style.top = 'auto';
        } else {
            menu.style.left = rect.left + 'px';
            menu.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
            menu.style.right = 'auto';
            menu.style.top = 'auto';
        }

        document.body.appendChild(menu);
        this.setupQuickTimerMenuEvents(menu);
    }

    // === GESTIONNAIRES D'ÉVÉNEMENTS DU MENU RAPIDE ===
    setupQuickTimerMenuEvents(menu) {
        menu.addEventListener('click', (e) => {
            const option = e.target.closest('.timer-option');
            if (option) {
                const minutes = parseInt(option.dataset.minutes);
                if (minutes > 0) {
                    this.setSleepTimer(minutes);
                    const selectElement = document.getElementById('sleepTimerSelect');
                    if (selectElement) {
                        selectElement.value = minutes;
                    }
                } else {
                    this.cancelSleepTimer();
                    this.showToast('⏰ Minuteur d\'arrêt annulé');
                    const selectElement = document.getElementById('sleepTimerSelect');
                    if (selectElement) {
                        selectElement.value = '0';
                    }
                }
                menu.remove();
            }
        });

        const autoCloseTimer = setTimeout(() => {
            if (menu.parentNode) {
                menu.remove();
            }
        }, 30000);

        const closeHandler = (e) => {
            if (!menu.contains(e.target) && !e.target.closest('#compactTimer')) {
                menu.remove();
                clearTimeout(autoCloseTimer);
                document.removeEventListener('click', closeHandler);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', closeHandler);
        }, 200);

        menu.addEventListener('click', (e) => {
            const option = e.target.closest('.timer-option');
            const preset = e.target.closest('.time-preset');
            const setBtn = e.target.closest('#quickSetTime');
            
            if (option || preset || setBtn) {
                clearTimeout(autoCloseTimer);
                document.removeEventListener('click', closeHandler);
            }
        });

        menu.querySelectorAll('.quick-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                menu.querySelectorAll('.quick-mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const mode = e.target.dataset.mode;
                document.getElementById('quickDurationOptions').style.display = mode === 'duration' ? 'block' : 'none';
                document.getElementById('quickTimeOptions').style.display = mode === 'time' ? 'block' : 'none';
                
                if (mode === 'time') {
                    const now = new Date();
                    now.setMinutes(now.getMinutes() + 30);
                    document.getElementById('quickTimeInput').value = now.toTimeString().slice(0, 5);
                }
            });
        });

        document.getElementById('quickSetTime').addEventListener('click', () => {
            const timeValue = document.getElementById('quickTimeInput').value;
            if (timeValue) {
                this.setSleepTime(timeValue);
                menu.remove();
            }
        });

        menu.querySelectorAll('.time-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                const offset = parseInt(preset.dataset.offset);
                const targetTime = new Date();
                targetTime.setMinutes(targetTime.getMinutes() + offset);
                this.setSleepTime(targetTime.toTimeString().slice(0, 5));
                menu.remove();
            });
        });
    }

    /* ===================================================================== */
/* CHROMECAST - INTÉGRATION GOOGLE CAST                                 */
/* ===================================================================== */

// === INITIALISATION DU SDK CHROMECAST ===
initializeCast() {
    // Au tout début de initializeCast()
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
if (isIOS) {
    console.log('📱 Cast désactivé sur iOS');
    return;
}
    
    // ✅ Initialiser le compteur si nécessaire
    if (typeof this.castInitAttempts === 'undefined') {
        this.castInitAttempts = 0;
        this.castInitialized = false;
    }
    
    // ✅ AJOUT : Protection contre les tentatives multiples
    if (this.castInitialized) {
        console.log('⚠️ Cast déjà initialisé, abandon');
        return;
    }
    
    // ✅ AJOUT : Limiter à 5 tentatives maximum
    const MAX_ATTEMPTS = 5;
    if (this.castInitAttempts >= MAX_ATTEMPTS) {
        console.log('⚠️ Cast: Nombre max de tentatives atteint (' + MAX_ATTEMPTS + '), abandon');
        console.log('💡 Cast non disponible - Lecture en mode normal uniquement');
        return;
    }
    
    this.castInitAttempts++;
    console.log('🎬 Début initialisation Cast... (Tentative ' + this.castInitAttempts + '/' + MAX_ATTEMPTS + ')');
    
    if (!window.chrome || !window.chrome.cast || !window.cast) {
        console.log('⏳ En attente du SDK Google Cast... (Tentative ' + this.castInitAttempts + '/' + MAX_ATTEMPTS + ')');
        
        // ✅ Réessayer seulement si on n'a pas atteint le max
        if (this.castInitAttempts < MAX_ATTEMPTS) {
            setTimeout(() => this.initializeCast(), 2000); // ✅ Augmenté à 2 secondes
        }
        return;
    }
    
    console.log('✅ SDK Google Cast détecté');
    
    if (window.cast && window.cast.framework) {
        console.log('🚀 Initialisation directe du Cast');
        this.castInitialized = true; // ✅ Marquer comme initialisé
        this.setupCast();
    } else {
        window['__onGCastApiAvailable'] = (isAvailable) => {
            console.log('📡 Cast API Available:', isAvailable);
            if (isAvailable) {
                this.castInitialized = true; // ✅ Marquer comme initialisé
                this.setupCast();
            }
        };
    }
}

    setupCast() {
        const context = cast.framework.CastContext.getInstance();
        
        context.setOptions({
            receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
            autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
        });

        context.addEventListener(
            cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
            (event) => this.onSessionStateChanged(event)
        );

        this.castInitialized = true;
        console.log('✅ Chromecast initialisé');
        
        this.showCastButtons();
    }

    showCastButtons() {
        const castControl = document.getElementById('castControl');
        if (castControl) {
            castControl.style.display = 'flex';
        }

        const compactCast = document.getElementById('compactCast');
        if (compactCast) {
            compactCast.style.display = 'flex';
        }

        if (!this.castButtonsConfigured) {
            this.setupCastButtonEvents();
            this.castButtonsConfigured = true;
        }
    }

    setupCastButtonEvents() {
        const castButton = document.getElementById('castButton');
        if (castButton && !castButton.dataset.configured) {
            castButton.addEventListener('click', () => {
                this.toggleCast();
            });
            castButton.dataset.configured = 'true';
        }

        const compactCast = document.getElementById('compactCast');
        if (compactCast && !compactCast.dataset.configured) {
            compactCast.addEventListener('click', () => {
                this.toggleCast();
            });
            compactCast.dataset.configured = 'true';
        }
    }

    toggleCast() {
        const context = cast.framework.CastContext.getInstance();
        
        if (this.isCasting) {
            context.endCurrentSession(true);
        } else {
            context.requestSession().then(
                () => {
                    console.log('✅ Session Cast démarrée');
                },
                (error) => {
                    if (error !== 'cancel') {
                        console.error('❌ Erreur Cast:', error);
                        this.showToast('Impossible de se connecter à Chromecast');
                    }
                }
            );
        }
    }

    onSessionStateChanged(event) {
        switch (event.sessionState) {
            case cast.framework.SessionState.SESSION_STARTED:
case cast.framework.SessionState.SESSION_RESUMED:
    this.castSession = event.session;
    this.isCasting = true;
    this.updateCastButtons(true);
    console.log('📊 Chromecast connecté');
    
    // Mettre à jour le statut dans la popup
    if (this.currentStation) {
        const deviceName = this.castSession.getCastDevice()?.friendlyName || 'Chromecast';
        const statusElement = document.getElementById('currentStationStatus');
        if (statusElement) {
            statusElement.textContent = `📡 ${deviceName}`;
            this.updateStatusStyle('En direct');
        }
    }
    
    if (this.isPlaying && this.currentStation) {
        this.loadMediaOnCast();
    }
    break;

            case cast.framework.SessionState.SESSION_ENDED:
                this.castSession = null;
                this.isCasting = false;
                this.updateCastButtons(false);
                console.log('🔇 Chromecast déconnecté');
                
                if (this.currentStation && this.isPlaying) {
                    const stationIndex = this.stations.findIndex(s => s.name === this.currentStation.name);
                    if (stationIndex >= 0) {
                        if (this.stopRetrying) this.stopRetrying();
                        if (this.watchdogInterval) {
                            clearInterval(this.watchdogInterval);
                            this.watchdogInterval = null;
                        }
                        
                        setTimeout(() => {
                            this.stopCurrentAndPlayNew(stationIndex);
                        }, 500);
                    }
                }
                break;
        }
    }

    updateCastButtons(isCasting) {
        const castButton = document.getElementById('castButton');
        const castStatus = castButton?.querySelector('.cast-status');
        
        if (castButton) {
            if (isCasting) {
                castButton.classList.add('casting');
                if (castStatus) {
                    const deviceName = this.castSession?.getCastDevice()?.friendlyName || 'Appareil';
                    castStatus.textContent = `▶ ${deviceName}`;
                }
            } else {
                castButton.classList.remove('casting');
                if (castStatus) {
                    castStatus.textContent = 'Chromecast';
                }
            }
        }

        const compactCast = document.getElementById('compactCast');
        if (compactCast) {
            if (isCasting) {
                compactCast.classList.add('casting');
            } else {
                compactCast.classList.remove('casting');
            }
        }
    }
	
	/* ===================================================================== */
/* RADIO POPUP - JAVASCRIPT ORGANISÉ - PARTIE 7 FINALE                 */
/* Chromecast Media Loading et Slider de Volume                         */
/* ===================================================================== */

    loadMediaOnCast() {
    if (!this.castSession || !this.currentStation) return;

    // Arrêter et détruire l'audio local IMMÉDIATEMENT
    if (this.stopRetrying) {
        this.stopRetrying();
    }
    if (this.watchdogInterval) {
        clearInterval(this.watchdogInterval);
        this.watchdogInterval = null;
    }
    if (this.audio) {
        this.audio.pause();
        this.audio.src = '';
        this.audio = null;
    }

    // Mettre à jour le statut IMMÉDIATEMENT
    const deviceName = this.castSession.getCastDevice()?.friendlyName || 'Chromecast';
    const statusElement = document.getElementById('currentStationStatus');
    if (statusElement) {
        statusElement.textContent = `📡 ${deviceName}`;
        this.updateStatusStyle('En direct');
    }

    const mediaInfo = new chrome.cast.media.MediaInfo(
        this.currentStation.url,
        'audio/mpeg'
    );

        const metadata = new chrome.cast.media.GenericMediaMetadata();
        metadata.title = this.currentStation.name;
        metadata.subtitle = this.currentStation.description;
        
        metadata.images = [
            new chrome.cast.Image(window.location.origin + '/' + this.currentStation.logo)
        ];

        mediaInfo.metadata = metadata;
        mediaInfo.streamType = chrome.cast.media.StreamType.LIVE;

        const request = new chrome.cast.media.LoadRequest(mediaInfo);
        request.autoplay = true;
        request.currentTime = 0;

        // Définir le volume AVANT de charger
        request.volume = new chrome.cast.Volume(this.volume);
        console.log(`🔊 Volume initial demandé pour Cast: ${Math.round(this.volume * 100)}%`);

        this.castSession.loadMedia(request).then(
            () => {
                console.log('✅ Radio diffusée sur Chromecast');
                this.showToast(`🔊 Diffusion sur ${this.castSession.getCastDevice().friendlyName}`);
                
                // Double vérification du volume après chargement
                const media = this.castSession.getMediaSession();
                if (media) {
                    const checkVolume = setInterval(() => {
                        if (media.playerState !== 'IDLE') {
                            clearInterval(checkVolume);
                            try {
                                const volumeRequest = new chrome.cast.media.VolumeRequest(new chrome.cast.Volume(this.volume));
                                media.setVolume(volumeRequest);
                                console.log(`✅ Volume Cast appliqué: ${Math.round(this.volume * 100)}%`);
                            } catch (error) {
                                console.error('Erreur volume Cast:', error);
                            }
                        }
                    }, 200);
                    
                    setTimeout(() => clearInterval(checkVolume), 3000);
                }
                
                // Mettre à jour le statut dans la popup
                const statusElement = document.getElementById('currentStationStatus');
                if (statusElement) {
                    statusElement.textContent = `📡 ${this.castSession.getCastDevice().friendlyName}`;
                    this.updateStatusStyle('En direct');
                }
            },
            (error) => {
                console.error('❌ Erreur de chargement:', error);
                this.showToast('Erreur lors de la diffusion');
            }
        );
    }

    // === SLIDER DE VOLUME COMPACT ===
    toggleVolumeSlider() {
        const existingSlider = document.querySelector('.compact-volume-slider');
        if (existingSlider) {
            existingSlider.remove();
            return;
        }

        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'compact-volume-slider';
        sliderContainer.innerHTML = `
            <div class="volume-slider-content">
                <span class="volume-label">${Math.round(this.volume * 100)}%</span>
                <input type="range" class="volume-range" min="0" max="100" value="${Math.round(this.volume * 100)}">
                <div class="volume-presets">
                    <button class="preset-btn" data-volume="0">🔇</button>
                    <button class="preset-btn" data-volume="50">🔉</button>
                    <button class="preset-btn" data-volume="100">🔊</button>
                </div>
            </div>
        `;

        const widget = document.querySelector('.radio-compact-widget');
        const rect = widget.getBoundingClientRect();

        sliderContainer.style.position = 'fixed';
        sliderContainer.style.zIndex = '10002';

        if (window.innerWidth <= 480) {
            sliderContainer.style.left = '10px';
            sliderContainer.style.bottom = '160px';
        } else {
            sliderContainer.style.left = rect.left + 'px';
            sliderContainer.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
        }

        document.body.appendChild(sliderContainer);

        const rangeInput = sliderContainer.querySelector('.volume-range');
        const label = sliderContainer.querySelector('.volume-label');

        rangeInput.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.setVolume(volume);
            label.textContent = e.target.value + '%';
            this.updateCompactVolumeIcon();
        });

        sliderContainer.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const volume = parseInt(btn.dataset.volume) / 100;
                this.setVolume(volume);
                rangeInput.value = btn.dataset.volume;
                label.textContent = btn.dataset.volume + '%';
                this.updateCompactVolumeIcon();
            });
        });

        setTimeout(() => {
            const closeHandler = (e) => {
                if (!sliderContainer.contains(e.target) && !e.target.closest('#compactVolume')) {
                    sliderContainer.remove();
                    document.removeEventListener('click', closeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 100);

        setTimeout(() => {
            if (sliderContainer.parentNode) {
                sliderContainer.remove();
            }
        }, 15000);
    }

  } // === FIN DE LA CLASSE RADIOPOPUPWIDGET ===

/* ===================================================================== */
/* INITIALISATION GLOBALE                                               */
/* ===================================================================== */

// Initialisation automatique quand le DOM est prêt
document.addEventListener('DOMContentLoaded', function() {
    window.radioPopupInstance = new RadioPopupWidget();
    window.radioPopupInstance.init();
});

/* ===================================================================== */
/* FIN DU JAVASCRIPT RADIO ORGANISÉ                                     */
/* ===================================================================== */