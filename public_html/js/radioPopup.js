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
                name: 'France Inter',
                url: 'https://icecast.radiofrance.fr/franceinter-midfi.mp3',
                logo: 'images/radio-logos/france-inter.png',
                description: 'Radio généraliste'
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
    
    // AJOUT : Restaurer le scroll du body
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
        }
    }

    pauseRadio() {
        if (this.audio) {
            this.audio.pause();
        }
        this.isPlaying = false;
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
        document.getElementById('currentStationStatus').textContent = 'Arrêté';
        this.updateStatusStyle('Arrêté');
    }

    setVolume(volume) {
        this.volume = volume;
        if (this.audio) {
            this.audio.volume = volume;
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