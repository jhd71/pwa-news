class RadioPopupWidget {
    constructor() {
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
                url: 'https://stream1.jupinfo.fr:8443/play',
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
                name: 'Fun Radio',
                url: 'https://streamer-02.rtl.fr/fun-1-44-128',
                logo: 'images/radio-logos/Fun-Radio.png',
                description: 'Le son dancefloor'
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
                name: 'RTL2',
                url: 'https://streamer-02.rtl.fr/rtl2-1-44-128',
                logo: 'images/radio-logos/RTL2.png',
                description: ' Le Son Pop-Rock'
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
            }           
        ];
        
        this.currentStation = null;
        this.isPlaying = false;
        this.audio = null;
        this.volume = 0.7;
		// Minuteur d'arrêt
        this.sleepTimer = null;
        this.sleepTimeRemaining = 0;
        
        // Égaliseur visuel
        this.equalizerInterval = null;
        this.isEqualizerActive = false;
		// Mini-égaliseur compact
        this.compactEqualizerInterval = null;
		// Synchronisation widget
        this.widgetSyncInterval = null;
    }

    init() {
    // Créer immédiatement si le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            this.createRadioTile();
            this.createPopup();
        });
    } else {
        // Le DOM est déjà chargé
        this.createRadioTile();
        this.createPopup();
    }
}

    createRadioTile() {
    // Vérifier si la tuile existe déjà
    if (document.querySelector('.radio-app-tile')) {
        console.log('Tuile Radio déjà présente');
        return;
    }

    // Trouver le séparateur Espace+
    const radioSeparator = Array.from(document.querySelectorAll('.separator'))
        .find(sep => sep.textContent.includes('Espace+'));
    
    if (!radioSeparator) {
        // Si pas trouvé, observer le DOM pour l'ajouter dès qu'il apparaît
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

    // Ajouter une classe pour identifier la tuile radio
    const tileElement = document.createElement('div');
    tileElement.className = 'tile radio-app-tile'; // Ajout de la classe radio-app-tile
    tileElement.setAttribute('data-category', 'Espace+');
    tileElement.innerHTML = `
        <div class="tile-content">
            <div class="tile-title">🎵 Lecteur Radio</div>
        </div>
        <div class="radio-tile-indicator" id="radioTileIndicator" style="display: none;"></div>
        <div class="radio-tile-status" id="radioTileStatus" style="display: none;"></div>
    `;

    // Ajouter le gestionnaire de clic
    tileElement.addEventListener('click', () => {
        this.openPopup();
    });

    // Insérer juste après le séparateur Espace+
    radioSeparator.insertAdjacentElement('afterend', tileElement);
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
                        <div class="sleep-timer-controls">
                            <span class="material-icons">schedule</span>
                            <input type="time" id="sleepTimerTime" class="sleep-timer-time">
                            <button id="setSleepTimerBtn" class="set-timer-btn">
                                <span class="material-icons">alarm_add</span>
                                Programmer
                            </button>
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
        📻 Les flux proviennent des diffuseurs officiels – Actu & Média n’héberge aucun contenu
		</p>
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
		// Gestionnaire minuteur d'arrêt par heure
        document.getElementById('setSleepTimerBtn').addEventListener('click', () => {
            const timeInput = document.getElementById('sleepTimerTime');
            if (timeInput.value) {
                this.setSleepTimerByTime(timeInput.value);
            }
        });

        // Gestionnaire annulation minuteur
        document.getElementById('cancelSleepTimer').addEventListener('click', () => {
            this.cancelSleepTimer();
        });
    }

    openPopup() {
    const popup = document.getElementById('radioPopup');
    popup.classList.add('active');
    document.body.classList.add('radio-popup-open');
    
    // AJOUT : Empêcher le scroll du body sur mobile
    if (window.innerWidth <= 768) {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        // Sauvegarder la position de scroll actuelle
        this.scrollPosition = window.pageYOffset;
        document.body.style.top = `-${this.scrollPosition}px`;
    }
}

	closePopup() {
    const popup = document.getElementById('radioPopup');
    popup.classList.remove('active');
    document.body.classList.remove('radio-popup-open');
    
    // Restaurer le scroll du body
    if (window.innerWidth <= 768) {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        // Restaurer la position de scroll
        if (this.scrollPosition) {
            window.scrollTo(0, this.scrollPosition);
            this.scrollPosition = null;
        }
    }
    
    // Maintenir l'indicateur si la radio joue toujours
    this.updateTileIndicator();
    
    // Redémarrer les égaliseurs SEULEMENT si une station joue
    if (this.isPlaying && this.currentStation) {
        // S'assurer que les égaliseurs sont arrêtés avant de redémarrer
        this.stopEqualizer();
        this.stopCompactEqualizer();
        
        // Petite pause pour laisser le temps aux intervals de se nettoyer
        setTimeout(() => {
            // Démarrer l'égaliseur visuel
            this.startEqualizer();
            
            // Démarrer le mini-égaliseur compact
            this.startCompactEqualizer();
        }, 100);
    }
    
    // Créer le widget compact SEULEMENT si une station joue actuellement
    if (this.isPlaying && this.currentStation) {
        this.createCompactWidget();
        this.updateCompactWidget();
    }
}
	
	toggleStationPlayback(index) {
        const station = this.stations[index];
        const card = document.querySelector(`[data-index="${index}"]`);
        
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
        
        // Arrêter l'égaliseur avant de changer de station
        this.stopEqualizer();
        this.stopCompactEqualizer();
        
        // Réinitialiser toutes les cartes
        document.querySelectorAll('.radio-station-card').forEach(card => {
            card.classList.remove('active', 'playing', 'paused');
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
        this.updateStatusStyle('Connexion...');
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

    playRadio() {
        if (!this.currentStation) return;

        try {
            if (!this.audio) {
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
                });
                
                this.audio.addEventListener('error', (e) => {
                    document.getElementById('currentStationStatus').textContent = 'Erreur de lecture';
                    this.updateStatusStyle('Erreur de lecture');
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
            
            // Mettre à jour l'indicateur de la tuile
            this.updateTileIndicator();
            
            // DÉMARRER les égaliseurs (et non les arrêter !)
            this.startEqualizer();
            this.startCompactEqualizer();
            
            // Créer le widget compact s'il n'existe pas
            this.createCompactWidget();
            
            // Mettre à jour le widget compact
            this.updateCompactWidget();
            
            document.getElementById('currentStationStatus').textContent = 'En direct';
            this.updateStatusStyle('En direct');
            
            // Mettre à jour l'overlay de la station active
            const activeCard = document.querySelector('.radio-station-card.active');
            if (activeCard) {
                const overlayIcon = activeCard.querySelector('.play-overlay .material-icons');
                overlayIcon.textContent = 'pause';
                activeCard.classList.add('playing');
                activeCard.classList.remove('paused');
            }
            
        } catch (error) {
            console.error('Erreur lecture radio:', error);
            document.getElementById('currentStationStatus').textContent = 'Erreur';
            this.updateStatusStyle('Erreur');
            this.isPlaying = false;
			// Mettre à jour l'indicateur de la tuile
			this.updateTileIndicator();
        }
    }

    pauseRadio() {
        if (this.audio) {
            this.audio.pause();
            this.audio = null; // AJOUTER CETTE LIGNE pour nettoyer l'audio
        }
        this.isPlaying = false;
        
        // Mettre à jour l'indicateur de la tuile
        this.updateTileIndicator();
        
        // Arrêter l'égaliseur visuel
        this.stopEqualizer();
        
        // Arrêter le mini-égaliseur compact
        this.stopCompactEqualizer();
        
        // Supprimer le widget quand on met en pause
        this.hideCompactWidget();
        
        document.getElementById('currentStationStatus').textContent = 'En pause';
        this.updateStatusStyle('En pause');
        
        // Mettre à jour l'overlay de la station active
        const activeCard = document.querySelector('.radio-station-card.active');
        if (activeCard) {
            const overlayIcon = activeCard.querySelector('.play-overlay .material-icons');
            overlayIcon.textContent = 'play_arrow';
            activeCard.classList.remove('playing');
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
        this.currentStation = null; // Réinitialiser la station
        
        // Masquer l'indicateur de la tuile
        this.hideTileIndicator();
        
        // Arrêter l'égaliseur visuel
        this.stopEqualizer();
        
        // Arrêter le mini-égaliseur compact
        this.stopCompactEqualizer();
        
        // Annuler le minuteur d'arrêt
        this.cancelSleepTimer();
        
        // Supprimer le widget quand plus de station
        this.hideCompactWidget();
        
        document.getElementById('currentStationStatus').textContent = 'Arrêté';
        this.updateStatusStyle('Arrêté');
    }

    setVolume(volume) {
        this.volume = volume;
        if (this.audio) {
            this.audio.volume = volume;
        }
    }

	// Afficher l'indicateur de lecture sur la tuile
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

    // Masquer l'indicateur de lecture sur la tuile
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

	// === MINUTEUR D'ARRÊT ===
    setSleepTimer(minutes) {
        // Annuler le minuteur précédent s'il existe
        this.cancelSleepTimer();
        
        this.sleepTimeRemaining = minutes * 60; // Conversion en secondes
        
        // Afficher le minuteur
        document.getElementById('sleepTimerDisplay').style.display = 'flex';
        this.updateSleepTimerDisplay();
        
        // Démarrer le décompte
        this.sleepTimer = setInterval(() => {
            this.sleepTimeRemaining--;
            this.updateSleepTimerDisplay();
            
            if (this.sleepTimeRemaining <= 0) {
                this.stopRadio();
                this.cancelSleepTimer();
                this.showToast('Arrêt automatique de la radio');
            }
        }, 1000);
        
        // Message plus informatif selon la durée
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
		// Mettre à jour le widget compact
        this.updateCompactWidget();
    }

    cancelSleepTimer() {
        if (this.sleepTimer) {
            clearInterval(this.sleepTimer);
            this.sleepTimer = null;
        }
        
        this.sleepTimeRemaining = 0;
        document.getElementById('sleepTimerDisplay').style.display = 'none';
        document.getElementById('sleepTimerSelect').value = '0';
		// Mettre à jour le widget compact
        this.updateCompactWidget();
    }

	setSleepTimerByTime(timeString) {
        // Annuler le minuteur précédent
        this.cancelSleepTimer();
        
        // Parser l'heure (format HH:MM)
        const [hours, minutes] = timeString.split(':').map(Number);
        const targetTime = new Date();
        targetTime.setHours(hours, minutes, 0, 0);
        
        const now = new Date();
        
        // Si l'heure est déjà passée aujourd'hui, programmer pour demain
        if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
        }
        
        // Calculer les secondes restantes
        this.sleepTimeRemaining = Math.floor((targetTime - now) / 1000);
        
        // Afficher le minuteur
        document.getElementById('sleepTimerDisplay').style.display = 'flex';
        this.updateSleepTimerDisplay();
        
        // Démarrer le décompte
        this.sleepTimer = setInterval(() => {
            this.sleepTimeRemaining--;
            this.updateSleepTimerDisplay();
            
            if (this.sleepTimeRemaining <= 0) {
                this.stopRadio();
                this.cancelSleepTimer();
                this.showToast('Arrêt automatique de la radio');
            }
        }, 1000);
        
        // Message de confirmation
        const timeFormatted = timeString;
        const isToday = targetTime.getDate() === now.getDate();
        const dayText = isToday ? "aujourd'hui" : "demain";
        
        this.showToast(`Arrêt programmé ${dayText} à ${timeFormatted}`);
        this.updateCompactWidget();
    }
	
    updateSleepTimerDisplay() {
        const totalMinutes = Math.floor(this.sleepTimeRemaining / 60);
        const seconds = this.sleepTimeRemaining % 60;
        
        let timeText;
        if (totalMinutes >= 60) {
            // Plus d'une heure : afficher en heures et minutes
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            
            if (minutes === 0) {
                timeText = `${hours}h`;
            } else {
                timeText = `${hours}h${minutes.toString().padStart(2, '0')}`;
            }
        } else {
            // Moins d'une heure : afficher en minutes et secondes
            timeText = `${totalMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        document.getElementById('sleepTimerText').textContent = timeText;
    }

    // === ÉGALISEUR VISUEL ===
    startEqualizer() {
        // Arrêter l'égaliseur existant s'il y en a un
        if (this.equalizerInterval) {
            clearInterval(this.equalizerInterval);
            this.equalizerInterval = null;
        }
        
        this.isEqualizerActive = true;
        const bars = document.querySelectorAll('.equalizer-bar');
        
        // Vérifier que les barres existent
        if (bars.length === 0) {
            console.log('Aucune barre d\'égaliseur trouvée');
            return;
        }
        
        this.equalizerInterval = setInterval(() => {
            // Vérifier que l'égaliseur doit toujours être actif
            if (this.isEqualizerActive && this.isPlaying) {
                bars.forEach(bar => {
                    const height = Math.random() * 80 + 20; // Entre 20% et 100%
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
        
        // Remettre les barres à zéro
        const bars = document.querySelectorAll('.equalizer-bar');
        bars.forEach(bar => {
            bar.style.height = '20%';
        });
    }

    stopCompactEqualizer() {
        if (this.compactEqualizerInterval) {
            clearInterval(this.compactEqualizerInterval);
            this.compactEqualizerInterval = null;
        }
        
        // Remettre les barres au minimum
        const bars = document.querySelectorAll('.mini-bar');
        bars.forEach(bar => {
            bar.style.height = '30%';
        });
    }

    // === WIDGET COMPACT AMÉLIORÉ ===
    createCompactWidget() {
        // Ne créer le widget QUE si une station est sélectionnée
        if (!this.currentStation) {
            return;
        }
        
        // Vérifier si le widget existe déjà 
        if (document.querySelector('.radio-compact-widget')) {
            return;
        }

        const widget = document.createElement('div');
        widget.className = 'radio-compact-widget';
        widget.innerHTML = `
            <div class="compact-widget-content">
                <!-- Bouton de fermeture -->
                <button class="compact-close-btn" id="compactCloseBtn" title="Fermer le widget">
                    <span class="material-icons">close</span>
                </button>
                
                <!-- Info station avec mini-égaliseur -->
                <div class="compact-station-info">
                    <div class="compact-logo-container">
                        <img id="compactStationLogo" src="" alt="" class="compact-logo">
                        <!-- Mini égaliseur intégré -->
                        <div class="compact-equalizer" id="compactEqualizer">
                            <div class="mini-bar"></div>
                            <div class="mini-bar"></div>
                            <div class="mini-bar"></div>
                        </div>
                    </div>
                    <div class="compact-details">
                        <div id="compactStationName">Aucune station</div>
                        <div id="compactStationStatus">Arrêtée</div>
                        <!-- Indicateur minuteur -->
                        <div id="compactTimerDisplay" class="compact-timer" style="display: none;">
                            ⏰ <span id="compactTimerText">--:--</span>
                        </div>
                    </div>
                </div>
                
                <!-- Contrôles améliorés -->
                <div class="compact-controls">
                    <button id="compactPlayPause" class="compact-btn" title="Lecture/Pause">
                        <span class="material-icons">play_arrow</span>
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
        this.setupCompactWidgetEvents(widget);
        this.startCompactEqualizer();
		this.startWidgetSync();
    }

    setupCompactWidgetEvents(widget) {
        // Fermer le widget (sans arrêter la radio)
        document.getElementById('compactCloseBtn').addEventListener('click', () => {
            this.hideCompactWidget();
        });

        // Play/Pause
        document.getElementById('compactPlayPause').addEventListener('click', () => {
            if (this.currentStation) {
                this.toggleStationPlayback(this.stations.findIndex(s => s.name === this.currentStation.name));
            } else {
                this.openPopup(); // Ouvrir pour choisir une station
            }
        });

        // Minuteur d'arrêt - Menu rapide
        document.getElementById('compactTimer').addEventListener('click', () => {
            this.showQuickTimerMenu();
        });

        // Volume (cycle entre muet, faible, moyen, fort)
        document.getElementById('compactVolume').addEventListener('click', () => {
            const currentVolume = this.volume;
            let newVolume;
            
            if (currentVolume === 0) newVolume = 0.3;
            else if (currentVolume <= 0.3) newVolume = 0.6;
            else if (currentVolume <= 0.6) newVolume = 1.0;
            else newVolume = 0;
            
            this.setVolume(newVolume);
            this.updateCompactVolumeIcon();
            
            // Feedback visuel pour le volume
            this.showToast(`Volume : ${Math.round(newVolume * 100)}%`);
        });

        // Ouvrir popup complète
        document.getElementById('compactOpenFull').addEventListener('click', () => {
            this.openPopup();
        });
    }

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

        if (this.currentStation) {
            logo.src = this.currentStation.logo;
            logo.style.display = 'block';
            name.textContent = this.currentStation.name;
            
            if (this.isPlaying) {
                status.textContent = 'En direct';
                status.className = 'status-live';
                playBtn.querySelector('.material-icons').textContent = 'pause';
                widget.classList.add('playing');
                equalizer.style.display = 'flex';
            } else {
                status.textContent = 'En pause';
                status.className = 'status-paused';
                playBtn.querySelector('.material-icons').textContent = 'play_arrow';
                widget.classList.remove('playing');
                equalizer.style.display = 'none';
            }
        } else {
            logo.style.display = 'none';
            name.textContent = 'Aucune station';
            status.textContent = 'Arrêtée';
            status.className = '';
            playBtn.querySelector('.material-icons').textContent = 'play_arrow';
            widget.classList.remove('playing');
            equalizer.style.display = 'none';
        }

        // Mise à jour minuteur - AMÉLIORÉE
        if (this.sleepTimer && this.sleepTimeRemaining > 0) {
            const totalMinutes = Math.floor(this.sleepTimeRemaining / 60);
            const seconds = this.sleepTimeRemaining % 60;
            
            let displayText;
            if (totalMinutes >= 60) {
                // Plus d'une heure : afficher en heures et minutes
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                
                if (minutes === 0) {
                    displayText = `${hours}h`;
                } else {
                    displayText = `${hours}h${minutes.toString().padStart(2, '0')}`;
                }
            } else {
                // Moins d'une heure : afficher en minutes et secondes
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

    showToast(message) {
        // Créer ou mettre à jour un toast simple
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
	
	// === MENU MINUTEUR RAPIDE ===
    showQuickTimerMenu() {
        const existingMenu = document.querySelector('.quick-timer-menu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }

        const menu = document.createElement('div');
        menu.className = 'quick-timer-menu';
        
        // Générer des options d'heures
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        let options = '<div class="timer-option" data-action="cancel"><span class="material-icons">close</span><span>Annuler</span></div>';
        
        // Ajouter des créneaux de 30 minutes
        for (let i = 0; i < 8; i++) {
            const futureTime = new Date(now.getTime() + (30 * i + 30) * 60000);
            const timeString = futureTime.toTimeString().slice(0, 5);
            const dayText = futureTime.getDate() !== now.getDate() ? " (demain)" : "";
            
            options += `
                <div class="timer-option" data-time="${timeString}">
                    <span class="material-icons">schedule</span>
                    <span>${timeString}${dayText}</span>
                </div>
            `;
        }
        
        menu.innerHTML = `<div class="quick-timer-options">${options}</div>`;

        // Position et affichage
        const widget = document.querySelector('.radio-compact-widget');
        const rect = widget.getBoundingClientRect();
        
        menu.style.position = 'fixed';
        menu.style.left = rect.left + 'px';
        menu.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
        menu.style.zIndex = '10001';

        document.body.appendChild(menu);

        // Gestionnaires d'événements
        menu.addEventListener('click', (e) => {
            const option = e.target.closest('.timer-option');
            if (option) {
                if (option.dataset.action === 'cancel') {
                    this.cancelSleepTimer();
                    this.showToast('Minuteur d\'arrêt annulé');
                } else if (option.dataset.time) {
                    this.setSleepTimerByTime(option.dataset.time);
                }
                menu.remove();
            }
        });

        // Auto-fermeture
        setTimeout(() => {
            if (menu.parentNode) menu.remove();
        }, 8000);
    }

        // Fermer en cliquant ailleurs
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target) && !e.target.closest('#compactTimer')) {
                    menu.remove();
                }
            }, { once: true });
        }, 100);
    }

    // === MINI-ÉGALISEUR COMPACT ===
    startCompactEqualizer() {
        // Arrêter l'égaliseur compact existant s'il y en a un
        if (this.compactEqualizerInterval) {
            clearInterval(this.compactEqualizerInterval);
            this.compactEqualizerInterval = null;
        }
        
        const bars = document.querySelectorAll('.mini-bar');
        if (bars.length === 0) {
            console.log('Aucune barre de mini-égaliseur trouvée');
            return;
        }
        
        this.compactEqualizerInterval = setInterval(() => {
            if (this.isPlaying) {
                bars.forEach(bar => {
                    const height = Math.random() * 70 + 30; // Entre 30% et 100%
                    bar.style.height = height + '%';
                });
            } else {
                bars.forEach(bar => {
                    bar.style.height = '30%';
                });
            }
        }, 300);
    }

    stopCompactEqualizer() {
        if (this.compactEqualizerInterval) {
            clearInterval(this.compactEqualizerInterval);
            this.compactEqualizerInterval = null;
        }
        
        // Remettre les barres au minimum
        document.querySelectorAll('.mini-bar').forEach(bar => {
            bar.style.height = '30%';
        });
    }
	
	// === GESTION AFFICHAGE WIDGET ===
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
            
            this.showToast('Widget masqué');
        }
    }

    showCompactWidget() {
        // Recréer le widget s'il a été fermé
        if (!document.querySelector('.radio-compact-widget')) {
            this.createCompactWidget();
            this.updateCompactWidget();
        }
    }
	
	// === SYNCHRONISATION WIDGET ===
    startWidgetSync() {
        // Mettre à jour le widget toutes les secondes s'il existe
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
	
    // Mettre à jour l'indicateur selon l'état
    updateTileIndicator() {
        if (this.isPlaying && this.currentStation) {
            this.showTileIndicator(this.currentStation.name);
        } else {
            this.hideTileIndicator();
        }
    }
	
    updateStatusStyle(status) {
        const statusElement = document.getElementById('currentStationStatus');
        if (!statusElement) return;
        
        // Retirer toutes les classes de statut
        statusElement.classList.remove('status-live', 'status-paused', 'status-error', 'status-connecting');
        
        // Ajouter la classe appropriée
        switch(status) {
            case 'En direct':
                statusElement.classList.add('status-live');
                break;
            case 'En pause':
                statusElement.classList.add('status-paused');
                break;
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
} // FIN DE LA CLASSE - ACCOLADE MANQUANTE AJOUTÉE ICI

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    window.radioPopupInstance = new RadioPopupWidget();
    window.radioPopupInstance.init();
});