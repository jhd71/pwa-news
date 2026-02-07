// =====================================================
// RADIO PLAYER PRO - APPLICATION PRINCIPALE
// VERSION CORRIGÉE ET RÉORGANISÉE
// =====================================================

// =====================================================
// A. CONFIGURATION SUPABASE
// =====================================================
const SUPABASE_URL = 'https://ekjgfiyhkythqcnmhzea.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramdmaXloa3l0aHFjbm1oemVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzYxNDIsImV4cCI6MjA1ODI1MjE0Mn0.V0j_drb6GiTojgwxC6ydjnyJDRRT9lUbSc1E7bFE2Z4';

// Initialiser Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================================================
// B. CLASSE PRINCIPALE RadioPlayerApp
// =====================================================
class RadioPlayerApp {

    // =====================================================
    // INITIALISATION - Constructor
    // =====================================================
    constructor() {
        // === LISTE DES RADIOS ===
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
                id: 'La-Radio-Sans-pub',
                name: 'La Radio Sans pub',
                url: 'https://live1.jupinfo.fr:8443/play',
                logo: 'images/radios-logos/La-Radio-Sans-pub.png',
                description: '100% Hits 24/24',
                category: 'generaliste'
            },
			{
                id: 'M-Radio',
                name: 'M Radio',
                url: 'https://mradio-lyon.ice.infomaniak.ch/mradio-lyon.mp3',
                logo: 'images/radios-logos/M-Radio.png',
                description: 'Numéro 1 sur la chanson française',
                category: 'thematique'
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
                id: 'RFM',
                name: 'RFM',
                url: 'https://rfm.lmn.fm/rfm.mp3',
                logo: 'images/radios-logos/RFM.png',
                description: ' Le meillleur de la musique',
                category: 'generaliste'
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
            {
                id: 'NRJ',
                name: 'NRJ',
                url: 'https://streaming.nrjaudio.fm/oumvmk8fnozc?origine=fluxurlradio',
                logo: 'images/radios-logos/nrj.png',
                description: 'Hits & musique',
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

        // === ÉTAT DE L'APPLICATION ===
        this.currentStation = null;
        this.isPlaying = false;
        this.favorites = this.loadFavorites();
        this.volume = 0.3;
        this.isMuted = false;
        this.previousVolume = 0.3;
        this.audioContext = null;
        this.playerMinimized = false;
        this.errorCount = 0;
        this.isStopping = false;

        // === CHROMECAST ===
        this.castSession = null;
        this.isCasting = false;
        this.castInitialized = false;

        // === MINUTEUR DE SOMMEIL ===
        this.sleepTimerId = null;
        this.sleepTimerEndTime = null;
        this.sleepTimerMode = 'delay'; // 'delay' ou 'time'

        // === PARAMÈTRES ===
        this.autoResumeEnabled = localStorage.getItem('autoResumeLastStation') === 'true';
        this.startOnFavorites = localStorage.getItem('startOnFavorites') === 'true';
        this.currentCategory = localStorage.getItem('currentCategory') || 'toutes';

        // === CHAT EN DIRECT ===
        this.chatOpen = false;
        this.chatSubscription = null;
        this.globalChatSubscription = null; // Abonnement global pour TOUTES les radios
        this.presenceChannel = null; // Canal de présence pour compter les utilisateurs du chat
        this.globalPresenceChannel = null; // Canal de présence global pour TOUS les auditeurs
        this.listenersPerRadio = {}; // Nombre d'auditeurs par radio
        this.onlineUsers = 0; // Nombre d'utilisateurs connectés au chat
        this.chatMessages = [];
        this.username = this.getOrCreateUsername();
        this.unreadMessages = 0;
        this.badgePollingInterval = null; // Polling pour les badges

        // === ADMIN ===
        this.isAdmin = false;
        this.adminUsername = null;

        // === PWA ===
        this.deferredPrompt = null;

		// === NOW PLAYING (Titre en cours) ===
        this.nowPlayingInterval = null;
        this.lastNowPlaying = '';
		
		// === THÈME COULEUR ===
        this.currentColorTheme = localStorage.getItem('colorTheme') || 'default';
        
        // === MODE D'AFFICHAGE (grille/liste) ===
        this.viewMode = localStorage.getItem('viewMode') || 'grid';
		
        // === ÉLÉMENTS DOM ===
        this.audioPlayer = document.getElementById('audioPlayer');
        this.playerContainer = document.getElementById('playerContainer');
        this.radiosGrid = document.getElementById('radiosGrid');
        this.favorisGrid = document.getElementById('favorisGrid');
        this.favorisEmpty = document.getElementById('favorisEmpty');
        this.contextMenu = document.getElementById('contextMenu');
        this.toast = document.getElementById('toast');

        // === LANCER L'INITIALISATION ===
        this.init();
    }

    // =====================================================
    // INITIALISATION - init()
    // =====================================================
    init() {
        this.setupAudioPlayer();
        this.renderRadios();
        this.renderFavorites();
        this.setupEventListeners();
        this.setupVolumeControl();
        this.setupThemeToggle();
        this.setupSleepTimerUI();
        this.setupSwipeNavigation();
        this.setupPWA();
        this.setupCast();
        this.checkNetworkStatus();
        this.checkAdminSession();
        this.applyStartupTab();
        this.updateChatBadges();
        this.checkSharedRadio();
        
        // S'abonner à TOUS les nouveaux messages (pour les badges globaux)
        this.subscribeToAllChats();
        
        // Polling des badges toutes les 30 secondes (backup)
        this.startBadgePolling();
        
		// Rafraîchir le badge minuteur toutes les 30 secondes
        setInterval(() => {
            if (this.sleepTimerEndTime) {
                this.updateSleepTimerBadge();
            }
        }, 30000);
		
		// Fix pour le rendu des cartes au scroll (bug mobile)
        const tabsSlider = document.getElementById('tabsSlider');
        if (tabsSlider) {
            let scrollTimeout;
            tabsSlider.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    // Forcer le re-rendu des cartes
                    document.querySelectorAll('.radio-card').forEach(card => {
                        card.style.transform = 'translateZ(0)';
                        void card.offsetHeight; // Force reflow
                    });
                }, 100);
            }, { passive: true });
        }
		
        // Gérer le bouton retour Android
        this.setupAndroidBackButton();
        
        // S'abonner à la présence globale (pour voir les auditeurs sur chaque radio)
        this.joinGlobalPresence();
		
		// Reprendre la lecture si on vient du mini player
		this.checkAutoResume();
    }

    // =====================================================
    // CONFIGURATION - setupAudioPlayer()
    // =====================================================
    setupAudioPlayer() {
        this.audioPlayer.volume = this.volume;

        this.audioPlayer.addEventListener('play', () => {
            this.isPlaying = true;
            this.errorCount = 0;
            this.updatePlayerUI();
            this.updateRadioCards();
            this.startVisualizer();
        });

        this.audioPlayer.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayerUI();
            this.updateRadioCards();
            this.stopVisualizer();
        });

        this.audioPlayer.addEventListener('error', (e) => {
            if (this.isStopping) {
                this.isStopping = false;
                return;
            }

            this.errorCount++;
            console.error('Erreur audio:', e);

            if (this.errorCount >= 3) {
                this.showToast('Impossible de lire cette radio');
                this.stopRadio();
            } else {
                this.showToast('Erreur de lecture, nouvelle tentative...');
                setTimeout(() => {
                    if (this.currentStation && this.isPlaying) {
                        this.audioPlayer.load();
                        this.audioPlayer.play().catch(err => {
                            console.error('Erreur replay:', err);
                        });
                    }
                }, 2000);
            }
        });
    }

				// =====================================================
				// CONFIGURATION - setupEventListeners()
				// =====================================================
    setupEventListeners() {
				// === ONGLETS (UNE SEULE FOIS) ===
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                this.switchToTab(button.dataset.tab);
            });
        });

				// === THÈME COULEUR ===
        this.applyColorTheme(this.currentColorTheme);
        
				// === MODE D'AFFICHAGE (grille/liste) ===
        this.applyViewMode(this.viewMode);
        
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.view;
                this.applyViewMode(mode);
                
                // Mettre à jour l'UI des boutons
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Sauvegarder
                this.viewMode = mode;
                localStorage.setItem('viewMode', mode);
            });
        });
        
        document.querySelectorAll('.theme-color-btn').forEach(btn => {
            // Marquer le thème actuel comme actif
            if (btn.dataset.theme === this.currentColorTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
            
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.applyColorTheme(theme);
                
                // Mettre à jour l'UI
                document.querySelectorAll('.theme-color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Sauvegarder
                this.currentColorTheme = theme;
                localStorage.setItem('colorTheme', theme);
                
                this.showToast(`🎨 Thème ${btn.title} appliqué`);
            });
        });
		
	// === MINUTEUR SOMMEIL - BOUTON PLAYER ===
        const sleepTimerBtn = document.getElementById('sleepTimerBtn');
        const sleepTimerPopup = document.getElementById('sleepTimerPopup');
        
        if (sleepTimerBtn && sleepTimerPopup) {
            // Ouvrir/Fermer le popup
            sleepTimerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Si le player est minimisé, le déplier d'abord
                if (this.playerMinimized) {
                    this.togglePlayerSize();
                    // Attendre l'animation puis ouvrir le popup
                    setTimeout(() => {
                        sleepTimerPopup.style.display = 'block';
                        this.updateSleepPopupUI();
                    }, 300);
                    return;
                }
                
                const isVisible = sleepTimerPopup.style.display === 'block';
                sleepTimerPopup.style.display = isVisible ? 'none' : 'block';
                
                if (!isVisible) {
                    this.updateSleepPopupUI();
                }
            });
            
            // Fermer le popup en cliquant ailleurs
            document.addEventListener('click', (e) => {
                if (!sleepTimerPopup.contains(e.target) && e.target !== sleepTimerBtn) {
                    sleepTimerPopup.style.display = 'none';
                }
            });
            
            // Options de durée rapide
            document.querySelectorAll('.sleep-option[data-minutes]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const minutes = parseInt(btn.dataset.minutes, 10);
                    this.startSleepTimer(minutes);
                    this.updateSleepTimerInfo();
                    this.updateSleepPopupUI();
                    this.updateSleepTimerBadge();
                    
                    // Fermer le popup après sélection
                    setTimeout(() => {
                        sleepTimerPopup.style.display = 'none';
                    }, 300);
                });
            });
            
            // Option heure précise
            const sleepOptionTime = document.getElementById('sleepOptionTime');
            const sleepPopupTime = document.getElementById('sleepPopupTime');
            
            if (sleepOptionTime && sleepPopupTime) {
                sleepOptionTime.addEventListener('click', () => {
                    const isVisible = sleepPopupTime.style.display === 'block';
                    sleepPopupTime.style.display = isVisible ? 'none' : 'block';
                    
                    if (!isVisible) {
                        // Pré-remplir avec +1h
                        const now = new Date();
                        now.setHours(now.getHours() + 1);
                        sleepPopupTime.value = now.toTimeString().slice(0, 5);
                    }
                });
                
                sleepPopupTime.addEventListener('change', () => {
                    if (sleepPopupTime.value) {
                        this.startSleepTimerAtTime(sleepPopupTime.value);
                        this.updateSleepTimerInfo();
                        this.updateSleepPopupUI();
                        this.updateSleepTimerBadge();
                        sleepPopupTime.style.display = 'none';
                        
                        setTimeout(() => {
                            sleepTimerPopup.style.display = 'none';
                        }, 300);
                    }
                });
            }
            
            // Bouton annuler
            const sleepOptionCancel = document.getElementById('sleepOptionCancel');
            if (sleepOptionCancel) {
                sleepOptionCancel.addEventListener('click', () => {
                    this.cancelSleepTimer();
                    this.updateSleepTimerInfo();
                    this.updateSleepPopupUI();
                    this.updateSleepTimerBadge();
                    this.showToast('Minuteur annulé');
                });
            }
        }
			// === MINUTEUR SOMMEIL - MODES ===
        const sleepModeDelay = document.getElementById('sleepModeDelay');
        const sleepModeTime = document.getElementById('sleepModeTime');
        const sleepDelayMode = document.getElementById('sleepDelayMode');
        const sleepTimeMode = document.getElementById('sleepTimeMode');

        if (sleepModeDelay && sleepModeTime) {
            sleepModeDelay.addEventListener('click', () => {
                this.sleepTimerMode = 'delay';
                sleepModeDelay.classList.add('active');
                sleepModeTime.classList.remove('active');
                sleepDelayMode.style.display = 'block';
                sleepTimeMode.style.display = 'none';
            });

            sleepModeTime.addEventListener('click', () => {
                this.sleepTimerMode = 'time';
                sleepModeTime.classList.add('active');
                sleepModeDelay.classList.remove('active');
                sleepTimeMode.style.display = 'block';
                sleepDelayMode.style.display = 'none';
                
                // Pré-remplir avec une heure par défaut (dans 1h)
                const sleepTimerTime = document.getElementById('sleepTimerTime');
                if (sleepTimerTime && !sleepTimerTime.value) {
                    const now = new Date();
                    now.setHours(now.getHours() + 1);
                    sleepTimerTime.value = now.toTimeString().slice(0, 5);
                }
            });
        }
		
        // === FILTRE DE CATÉGORIE ===
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) {
            categorySelect.value = this.currentCategory;
            categorySelect.addEventListener('change', (e) => {
                this.currentCategory = e.target.value;
                localStorage.setItem('currentCategory', this.currentCategory);
                this.renderRadios();
                this.showToast(`Filtre : ${e.target.options[e.target.selectedIndex].text}`);
            });
        }

        // === CONTRÔLES DU PLAYER ===
        document.getElementById('playPauseBtn').addEventListener('click', () => {
            if (this.isPlaying) {
                this.pauseRadio();
            } else {
                this.resumeRadio();
            }
        });

        document.getElementById('stopBtn').addEventListener('click', () => {
            this.stopRadio();
        });

        document.getElementById('togglePlayerBtn').addEventListener('click', () => {
            this.togglePlayerSize();
        });

        // === CHROMECAST ===
        const castBtn = document.getElementById('castBtn');
        if (castBtn) {
            castBtn.addEventListener('click', () => {
                this.toggleCast();
            });
        }

        // === MENU CONTEXTUEL ===
        document.getElementById('addToFavorites').addEventListener('click', () => {
            const stationId = this.contextMenu.dataset.stationId;
            this.toggleFavorite(stationId);
            this.hideContextMenu();
        });

        document.getElementById('removeFromFavorites').addEventListener('click', () => {
            const stationId = this.contextMenu.dataset.stationId;
            this.toggleFavorite(stationId);
            this.hideContextMenu();
        });

        const shareBtn = document.getElementById('shareRadio');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                const stationId = this.contextMenu.dataset.stationId;
                const station = this.stations.find(s => s.id === stationId);
                if (station) {
                    this.shareStation(station);
                }
                this.hideContextMenu();
            });
        }

        // Variable pour bloquer la fermeture immédiate après ouverture
		let contextMenuJustOpened = false;

		document.addEventListener('click', (e) => {
			if (contextMenuJustOpened) {
				contextMenuJustOpened = false;
				return;
			}
			if (!this.contextMenu.contains(e.target)) {
				this.hideContextMenu();
			}
		});

		// Aussi sur touchend pour mobile
		document.addEventListener('touchend', (e) => {
			if (contextMenuJustOpened) {
				contextMenuJustOpened = false;
				return;
			}
			// Petit délai pour éviter les faux positifs
			setTimeout(() => {
				if (this.contextMenu.style.display === 'block' && !this.contextMenu.contains(e.target)) {
					// Ne pas fermer si on touche le menu lui-même
				}
			}, 100);
		});

		// Stocker la référence pour l'utiliser dans showContextMenu
		this.setContextMenuJustOpened = () => { contextMenuJustOpened = true; };

        // === RÉSEAU ===
        window.addEventListener('online', () => {
            this.showToast('Connexion rétablie');
        });

        window.addEventListener('offline', () => {
            this.showToast('Connexion perdue');
        });

        // === CHAT - BOUTON OUVRIR ===
        const chatBtn = document.getElementById('chatBtn');
        if (chatBtn) {
            chatBtn.addEventListener('click', () => {
                this.openChat();
            });
        }

        // === CHAT - BOUTON FERMER ===
        const chatCloseBtn = document.getElementById('chatCloseBtn');
        if (chatCloseBtn) {
            chatCloseBtn.addEventListener('click', () => {
                this.closeChat();
            });
        }

        // === CHAT - FERMER EN CLIQUANT SUR L'OVERLAY ===
        const chatOverlay = document.getElementById('chatOverlay');
        if (chatOverlay) {
            chatOverlay.addEventListener('click', (e) => {
                if (e.target === chatOverlay) {
                    this.closeChat();
                }
            });
        }

        // === CHAT - EMOJIS ===
        const chatEmojiBtn = document.getElementById('chatEmojiBtn');
        const chatEmojiPicker = document.getElementById('chatEmojiPicker');

        if (chatEmojiBtn && chatEmojiPicker) {
            chatEmojiBtn.addEventListener('click', () => {
                chatEmojiPicker.style.display =
                    chatEmojiPicker.style.display === 'none' ? 'grid' : 'none';
            });

            chatEmojiPicker.querySelectorAll('.emoji-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const input = document.getElementById('chatInput');
                    if (input) {
                        input.value += btn.textContent;
                        input.focus();
                        chatEmojiPicker.style.display = 'none';
                    }
                });
            });
        }

        // === CHAT - ENVOYER MESSAGE ===
        const chatSendBtn = document.getElementById('chatSendBtn');
        if (chatSendBtn) {
            chatSendBtn.addEventListener('click', () => {
                this.sendChatMessage();
            });
        }

        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendChatMessage();
                }
            });
        }

        // === ADMIN - CONNEXION ===
        const adminLoginBtn = document.getElementById('adminLoginBtn');
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', () => {
                this.loginAdmin();
            });
        }

        const adminPassword = document.getElementById('adminPassword');
        if (adminPassword) {
            adminPassword.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.loginAdmin();
                }
            });
        }

        // === ADMIN - DÉCONNEXION ===
        const adminLogoutBtn = document.getElementById('adminLogoutBtn');
        if (adminLogoutBtn) {
            adminLogoutBtn.addEventListener('click', () => {
                if (confirm('Se déconnecter de l\'administration ?')) {
                    this.logoutAdmin();
                }
            });
        }

        // === NOTIFICATIONS (ANDROID) ===
        const isAndroid = /Android/i.test(navigator.userAgent);
        const notificationSection = document.getElementById('notificationSection');

        if (isAndroid && notificationSection) {
            notificationSection.style.display = 'block';
            this.updateNotificationStatus();
        }

        const enableNotificationsBtn = document.getElementById('enableNotificationsBtn');
        if (enableNotificationsBtn) {
            enableNotificationsBtn.addEventListener('click', () => {
                this.requestNotificationPermission().then(() => {
                    this.updateNotificationStatus();
                });
            });
        }
    }

    // =====================================================
    // CONFIGURATION - setupVolumeControl()
    // =====================================================
    setupVolumeControl() {
        const muteBtn = document.getElementById('muteBtn');
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeContainer = document.getElementById('volumeSliderContainer');

        if (!muteBtn || !volumeSlider || !volumeContainer) {
            console.warn('Éléments de volume non trouvés');
            return;
        }

        const volumeValue = volumeContainer.querySelector('.volume-value');

        muteBtn.addEventListener('click', () => {
            this.toggleMute();
        });

        volumeSlider.addEventListener('input', (e) => {
            const newVolume = e.target.value / 100;

            if (this.isMuted && newVolume > 0) {
                this.isMuted = false;
            }

            this.volume = newVolume;
            this.audioPlayer.volume = this.volume;

            if (volumeValue) {
                volumeValue.textContent = `${e.target.value}%`;
            }

            this.updateVolumeIcon();
        });

        volumeSlider.value = this.volume * 100;

        if (volumeValue) {
            volumeValue.textContent = `${Math.round(this.volume * 100)}%`;
        }

        this.updateVolumeIcon();
    }

    // =====================================================
    // CONFIGURATION - setupSleepTimerUI()
    // =====================================================
    setupSleepTimerUI() {
        const settingsBtn = document.getElementById('settingsBtn');
        const overlay = document.getElementById('settingsOverlay');
        const panel = document.getElementById('settingsPanel');
        const closeBtn = document.getElementById('settingsCloseBtn');
        const sleepSelect = document.getElementById('sleepTimerSelect');
        const startBtn = document.getElementById('sleepTimerStartBtn');
        const cancelBtn = document.getElementById('sleepTimerCancelBtn');
        const autoResumeCheckbox = document.getElementById('autoResumeCheckbox');

        if (!settingsBtn || !overlay || !panel) {
            return;
        }

        const openPanel = () => {
            overlay.style.display = 'flex';
            this.updateSleepTimerInfo();
            if (autoResumeCheckbox) {
                autoResumeCheckbox.checked = this.autoResumeEnabled;
            }
        };

        const closePanel = () => {
            overlay.style.display = 'none';
        };

        settingsBtn.addEventListener('click', openPanel);

        if (closeBtn) {
            closeBtn.addEventListener('click', closePanel);
        }

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closePanel();
            }
        });

        if (startBtn) {
            startBtn.addEventListener('click', () => {
                // Si un minuteur est déjà actif, l'annuler
                if (this.sleepTimerEndTime) {
                    this.cancelSleepTimer();
                    this.updateSleepTimerInfo();
                    this.showToast('Minuteur arrêté');
                    return;
                }

                // Mode DURÉE
                if (this.sleepTimerMode === 'delay') {
                    const minutes = parseInt(sleepSelect.value, 10);

                    if (isNaN(minutes) || minutes <= 0) {
                        this.showToast('⚠️ Sélectionnez une durée');
                    } else {
                        this.startSleepTimer(minutes);
                        this.updateSleepTimerInfo();
                    }
                } 
                // Mode HEURE PRÉCISE
                else if (this.sleepTimerMode === 'time') {
                    const sleepTimerTime = document.getElementById('sleepTimerTime');
                    const timeValue = sleepTimerTime ? sleepTimerTime.value : '';

                    if (!timeValue) {
                        this.showToast('⚠️ Sélectionnez une heure');
                    } else {
                        this.startSleepTimerAtTime(timeValue);
                        this.updateSleepTimerInfo();
                    }
                }
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cancelSleepTimer();
                this.updateSleepTimerInfo();
                this.showToast('Minuteur annulé');
            });
        }

        if (autoResumeCheckbox) {
            autoResumeCheckbox.checked = this.autoResumeEnabled;
            autoResumeCheckbox.addEventListener('change', (e) => {
                this.autoResumeEnabled = e.target.checked;
                localStorage.setItem('autoResumeLastStation', this.autoResumeEnabled ? 'true' : 'false');
                this.showToast(this.autoResumeEnabled ? 'Reprise automatique activée' : 'Reprise automatique désactivée');
            });
        }

        const startOnFavoritesCheckbox = document.getElementById('startOnFavoritesCheckbox');
		if (startOnFavoritesCheckbox) {
			startOnFavoritesCheckbox.checked = this.startOnFavorites;
			startOnFavoritesCheckbox.addEventListener('change', (e) => {
				this.startOnFavorites = e.target.checked;
				localStorage.setItem('startOnFavorites', this.startOnFavorites ? 'true' : 'false');
				this.showToast(this.startOnFavorites ? 'Démarrage sur Favoris activé' : 'Démarrage sur Radios');
			});
		}

		// === MINI PLAYER ACCUEIL ===
		const miniPlayerCheckbox = document.getElementById('miniPlayerEnabledCheckbox');
		if (miniPlayerCheckbox) {
			// Charger l'état sauvegardé (activé par défaut)
			const miniPlayerEnabled = localStorage.getItem('miniPlayerEnabled') !== 'false';
			miniPlayerCheckbox.checked = miniPlayerEnabled;
			
			miniPlayerCheckbox.addEventListener('change', () => {
				localStorage.setItem('miniPlayerEnabled', miniPlayerCheckbox.checked);
				this.showToast(miniPlayerCheckbox.checked ? 'Mini player activé' : 'Mini player désactivé');
			});
		}

		this.restoreSleepTimerFromStorage();
    }

    // =====================================================
    // CONFIGURATION - setupThemeToggle()
    // =====================================================
    setupThemeToggle() {
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        const themeIcon = themeToggleBtn?.querySelector('.material-icons');

        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            if (themeIcon) themeIcon.textContent = 'light_mode';
        }

        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                themeToggleBtn.classList.add('rotating');
                setTimeout(() => themeToggleBtn.classList.remove('rotating'), 500);

                document.body.style.transition = 'none';
                const allElements = document.querySelectorAll('*');
                allElements.forEach(el => el.style.transition = 'none');

                document.body.classList.toggle('dark-theme');
                const isDark = document.body.classList.contains('dark-theme');

                setTimeout(() => {
                    document.body.style.transition = '';
                    allElements.forEach(el => el.style.transition = '');
                }, 50);

                if (themeIcon) {
                    themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
                }

                localStorage.setItem('theme', isDark ? 'dark' : 'light');
                this.showToast(isDark ? '🌙 Thème sombre activé' : '☀️ Thème clair activé');
            });
        }
    }

    // =====================================================
    // CONFIGURATION - setupSwipeNavigation()
    // =====================================================
    setupSwipeNavigation() {
        const tabsSlider = document.getElementById('tabsSlider');
        if (!tabsSlider) return;

        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        let currentX = 0;
        let isDragging = false;
        let startTranslateX = 0;

        const getCurrentTranslateX = () => {
            const transform = window.getComputedStyle(tabsSlider).transform;
            if (transform === 'none') return 0;
            const matrix = transform.match(/matrix.*\((.+)\)/);
            if (matrix) {
                const values = matrix[1].split(', ');
                return parseFloat(values[4]) || 0;
            }
            return 0;
        };

        tabsSlider.addEventListener('touchstart', (e) => {
            if (e.target.closest('.radios-grid') || e.target.closest('.favoris-container')) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchStartTime = Date.now();
                isDragging = false;
                startTranslateX = getCurrentTranslateX();
                tabsSlider.classList.add('no-transition');
            }
        }, { passive: true });

        tabsSlider.addEventListener('touchmove', (e) => {
            if (!touchStartX) return;

            currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;

            const deltaX = currentX - touchStartX;
            const deltaY = currentY - touchStartY;

            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
                isDragging = true;

                let newTranslateX = startTranslateX + deltaX;

                const maxTranslate = 0;
                const minTranslate = -tabsSlider.offsetWidth / 2;
                newTranslateX = Math.max(minTranslate, Math.min(maxTranslate, newTranslateX));

                tabsSlider.style.transform = `translateX(${newTranslateX}px)`;
            }
        }, { passive: true });

        tabsSlider.addEventListener('touchend', (e) => {
            if (!touchStartX) return;

            const deltaX = currentX - touchStartX;
            const deltaY = e.changedTouches[0].clientY - touchStartY;
            const swipeTime = Date.now() - touchStartTime;

            tabsSlider.classList.remove('no-transition');

            if (isDragging &&
                Math.abs(deltaX) > Math.abs(deltaY) &&
                Math.abs(deltaX) > 50 &&
                swipeTime < 500) {

                if (deltaX < 0) {
                    this.switchToTab('favoris');
                } else {
                    this.switchToTab('radios');
                }
            } else {
                const currentTab = document.querySelector('.tab-button.active').dataset.tab;
                this.switchToTab(currentTab);
            }

            touchStartX = 0;
            touchStartY = 0;
            currentX = 0;
            isDragging = false;
        });
    }

    // =====================================================
    // CONFIGURATION - setupPWA()
    // =====================================================
    setupPWA() {
        const banner = document.getElementById('pwaInstallBanner');
        const installBtn = document.getElementById('pwaInstallBtn');
        const dismissBtn = document.getElementById('pwaDismissBtn');

        const isAlreadyInstalled =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;

        if (isAlreadyInstalled && banner) {
            banner.style.display = 'none';
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;

            const dismissed = localStorage.getItem('pwaInstallDismissed') === 'true';
            const installed =
                window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone === true;

            if (!dismissed && !installed && banner) {
                banner.style.display = 'block';
            }

            console.log('PWA peut être installée');
        });

        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (!this.deferredPrompt) {
                    return;
                }

                this.deferredPrompt.prompt();

                const choiceResult = await this.deferredPrompt.userChoice;

                if (choiceResult.outcome === 'accepted') {
                    console.log("L'utilisateur a accepté l'installation");
                } else {
                    console.log("L'utilisateur a refusé l'installation");
                }

                this.deferredPrompt = null;

                if (banner) {
                    banner.style.display = 'none';
                }

                localStorage.setItem('pwaInstallDismissed', 'true');
            });
        }

        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                if (banner) {
                    banner.style.display = 'none';
                }
                localStorage.setItem('pwaInstallDismissed', 'true');
            });
        }

        window.addEventListener('appinstalled', () => {
            console.log('PWA installée');
            this.showToast('Application installée avec succès !');
            if (banner) {
                banner.style.display = 'none';
            }
            localStorage.setItem('pwaInstallDismissed', 'true');
        });

        // Reprendre la dernière radio (si option activée et pas de radio partagée)
        const lastStation = localStorage.getItem('lastStation');
        const hasSharedRadio = new URLSearchParams(window.location.search).has('radio');

        if (this.autoResumeEnabled && lastStation && !hasSharedRadio) {
            const station = this.stations.find(s => s.id === lastStation);
            if (station) {
                this.currentStation = station;
                this.audioPlayer.src = station.url;
                this.isPlaying = false;

                this.playerContainer.style.display = 'block';
                this.playerContainer.classList.remove('minimized');
                this.updatePlayerInfo();
                this.updatePlayerUI();
                this.updateRadioCards();

                const overlay = document.getElementById('autoResumeOverlay');
                const title = document.getElementById('autoResumeTitle');
                const text = document.getElementById('autoResumeText');
                const resumeBtn = document.getElementById('autoResumeBtn');
                const cancelBtn = document.getElementById('autoResumeCancelBtn');

                if (overlay && title && text && resumeBtn && cancelBtn) {
                    title.textContent = `Reprendre ${station.name}`;
                    text.textContent = station.description || 'Votre dernière radio est prête';
                    overlay.style.display = 'flex';

                    resumeBtn.onclick = () => {
                        overlay.style.display = 'none';
                        this.playRadio(station);
                        this.showToast(`Lecture de ${station.name}`);
                    };

                    cancelBtn.onclick = () => {
                        overlay.style.display = 'none';
                    };
                }
            }
        }
    }

    // =====================================================
    // CONFIGURATION - checkNetworkStatus()
    // =====================================================
    checkNetworkStatus() {
        if (!navigator.onLine) {
            this.showToast('Mode hors ligne');
        }
    }

    // =====================================================
    // RENDU UI - renderRadios()
    // =====================================================
    renderRadios() {
        this.radiosGrid.innerHTML = '';

        const filteredStations = this.currentCategory === 'toutes'
            ? this.stations
            : this.stations.filter(station => station.category === this.currentCategory);

        filteredStations.forEach(station => {
            const card = this.createRadioCard(station);
            this.radiosGrid.appendChild(card);
        });

        if (filteredStations.length === 0) {
            this.radiosGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">
                    <span class="material-icons" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">radio</span>
                    <p style="font-size: 1.1rem;">Aucune radio dans cette catégorie</p>
                </div>
            `;
        }
    }

    // =====================================================
    // RENDU UI - createRadioCard()
    // =====================================================
    createRadioCard(station) {
        const card = document.createElement('div');
        card.className = 'radio-card glass-effect';
        card.dataset.stationId = station.id;

        if (this.favorites.includes(station.id)) {
            card.classList.add('is-favorite');
        }

        if (this.currentStation && this.currentStation.id === station.id && this.isPlaying) {
            card.classList.add('playing');
        }

        // Nombre d'auditeurs pour cette radio
        const listenersCount = this.listenersPerRadio[station.id] || 0;

        card.innerHTML = `
            <img class="radio-logo" src="${station.logo}" alt="${station.name}" 
                 loading="eager"
                 decoding="async"
                 onerror="this.src='images/radios-logos/default.png'">
            <div class="radio-info">
                <span class="radio-name">${station.name}</span>
                <span class="radio-description">${station.description}</span>
            </div>
            <div class="radio-badges">
                <span class="material-icons favorite-indicator">favorite</span>
                <span class="radio-card-chat-badge radio-badge-${station.id}" style="display: none;">0</span>
                <span class="radio-card-listeners-badge listeners-badge-${station.id}" style="display: ${listenersCount > 0 ? 'flex' : 'none'};">
                    <span class="material-icons" style="font-size: 12px;">headphones</span>
                    <span class="listeners-count">${listenersCount}</span>
                </span>
            </div>
        `;

        card.addEventListener('click', () => this.playRadio(station));

        // Long press pour menu contextuel
        let pressTimer;
        let longPress = false;
        let touchStartX = 0;
        let touchStartY = 0;
        let hasMoved = false;

        card.addEventListener('mousedown', (e) => {
            longPress = false;
            pressTimer = setTimeout(() => {
                longPress = true;
                this.showContextMenu(e, station);
            }, 500);
        });

        card.addEventListener('mouseup', () => {
            clearTimeout(pressTimer);
            longPress = false;
        });

        card.addEventListener('mouseleave', () => {
            clearTimeout(pressTimer);
            longPress = false;
        });

        card.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches.length === 1) {
                const touch = e.touches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
                hasMoved = false;
                longPress = false;

                pressTimer = setTimeout(() => {
                    if (!hasMoved) {
                        longPress = true;
                        const fakeEvent = {
                            clientX: touch.clientX,
                            clientY: touch.clientY,
                            preventDefault: () => {}
                        };
                        this.showContextMenu(fakeEvent, station);

                        if (navigator.vibrate) {
                            navigator.vibrate(50);
                        }

                        e.preventDefault();
                    }
                }, 600);
            }
        });

        card.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches.length === 1) {
                const touch = e.touches[0];
                const deltaX = Math.abs(touch.clientX - touchStartX);
                const deltaY = Math.abs(touch.clientY - touchStartY);

                if (deltaX > 10 || deltaY > 10) {
                    hasMoved = true;
                    clearTimeout(pressTimer);
                }
            }
        });

        card.addEventListener('touchend', () => {
            clearTimeout(pressTimer);

            if (longPress) {
                longPress = false;
                return;
            }

            longPress = false;
        });

        card.addEventListener('touchcancel', () => {
            clearTimeout(pressTimer);
            longPress = false;
        });

        card.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, station);
        });

        return card;
    }

    // =====================================================
    // RENDU UI - renderFavorites()
    // =====================================================
    renderFavorites() {
        if (this.favorites.length === 0) {
            this.favorisEmpty.style.display = 'block';
            this.favorisGrid.style.display = 'none';
            return;
        }

        this.favorisEmpty.style.display = 'none';
        this.favorisGrid.style.display = 'grid';
        this.favorisGrid.innerHTML = '';

        this.favorites.forEach(stationId => {
            const station = this.stations.find(s => s.id === stationId);
            if (station) {
                const card = this.createRadioCard(station);
                this.favorisGrid.appendChild(card);
            }
        });
    }

    // =====================================================
    // RENDU UI - updatePlayerUI()
    // =====================================================
    updatePlayerUI() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const icon = playPauseBtn.querySelector('.material-icons');

        if (this.isPlaying) {
            icon.textContent = 'pause';
            document.getElementById('playerStatus').textContent = 'En lecture';
        } else {
            icon.textContent = 'play_arrow';
            document.getElementById('playerStatus').textContent = 'En pause';
        }
    }

    // =====================================================
    // RENDU UI - updatePlayerInfo()
    // =====================================================
    updatePlayerInfo() {
        if (!this.currentStation) return;

        document.getElementById('playerLogo').src = this.currentStation.logo;
        document.getElementById('playerTitle').textContent = this.currentStation.name;
    }

    // =====================================================
    // RENDU UI - updateRadioCards()
    // =====================================================
    updateRadioCards() {
        document.querySelectorAll('.radio-card').forEach(card => {
            card.classList.remove('playing');
        });

        if (this.currentStation && this.isPlaying) {
            document.querySelectorAll(`[data-station-id="${this.currentStation.id}"]`).forEach(card => {
                card.classList.add('playing');
            });
        }
    }

    // =====================================================
    // RENDU UI - applyStartupTab()
    // =====================================================
    applyStartupTab() {
        if (this.startOnFavorites) {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            const favButton = document.querySelector('[data-tab="favoris"]');
            const favContent = document.getElementById('favoris-tab');

            if (favButton && favContent) {
                favButton.classList.add('active');
                favContent.classList.add('active');
            }

            this.toggleCategoryFilter('favoris');
        } else {
            this.toggleCategoryFilter('radios');
        }
    }

    // =====================================================
    // RENDU UI - switchToTab()
    // =====================================================
    switchToTab(tabName) {
        const tabsSlider = document.getElementById('tabsSlider');

        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        const button = document.querySelector(`[data-tab="${tabName}"]`);
        const content = document.getElementById(`${tabName}-tab`);

        if (button && content) {
            button.classList.add('active');
            content.classList.add('active');
        }

        if (tabsSlider) {
            if (tabName === 'radios') {
                tabsSlider.style.transform = 'translateX(0)';
            } else if (tabName === 'favoris') {
                tabsSlider.style.transform = 'translateX(-50%)';
            }
        }

        this.toggleCategoryFilter(tabName);
    }

    // =====================================================
    // RENDU UI - toggleCategoryFilter()
    // =====================================================
    toggleCategoryFilter(tab) {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;

        if (tab === 'favoris') {
            categoryFilter.classList.add('hidden');
        } else {
            categoryFilter.classList.remove('hidden');
        }
    }

    // =====================================================
    // LECTURE AUDIO - playRadio()
    // =====================================================
    playRadio(station) {
        // Tracking Google Tag Manager
        if (window.dataLayer) {
            window.dataLayer.push({
                'event': 'radio_play',
                'radio_name': station.name,
                'radio_category': station.category || 'non-categorisée'
            });
        }

        // Si c'est la même station
        if (this.currentStation && this.currentStation.id === station.id) {
            if (this.isPlaying) {
                this.pauseRadio();
            } else {
                this.resumeRadio();
            }
            return;
        }

        // Si on change de radio, se désabonner de l'ancienne
        if (this.currentStation && this.currentStation.id !== station.id) {
            this.unsubscribeFromChat();
        }

        this.errorCount = 0;
        this.currentStation = station;
        this.audioPlayer.src = station.url;

        this.audioPlayer.play().catch(error => {
            console.error('Erreur lecture:', error);
            this.showToast('Impossible de lire cette radio');
        });

        // S'abonner au chat de cette radio (même si panneau fermé)
        this.subscribeToChat(station.id);

        // Mettre à jour la présence globale (pour le compteur d'auditeurs)
        this.updateGlobalPresence(station.id);

        // Notification persistante pour Android
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            if (Notification.permission === 'default') {
                this.requestNotificationPermission().then(granted => {
                    if (granted) {
                        navigator.serviceWorker.controller.postMessage({
                            type: 'KEEP_ALIVE',
                            stationName: station.name
                        });
                    }
                });
            } else if (Notification.permission === 'granted') {
                navigator.serviceWorker.controller.postMessage({
                    type: 'KEEP_ALIVE',
                    stationName: station.name
                });
            }
        }

        this.playerContainer.style.display = 'block';
		document.body.classList.add('player-visible');
		this.updatePlayerInfo();

        localStorage.setItem('lastStation', station.id);
		localStorage.setItem('lastStationData', JSON.stringify({
			id: station.id,
			name: station.name,
			url: station.url,
			logo: station.logo
		}));

        // Démarrer la récupération du titre en cours
        this.startNowPlayingPolling();

        this.showToast(`Lecture de ${station.name}`);
    }

    // =====================================================
    // LECTURE AUDIO - pauseRadio()
    // =====================================================
    pauseRadio() {
        this.audioPlayer.pause();
    }

    // =====================================================
    // LECTURE AUDIO - resumeRadio()
    // =====================================================
    resumeRadio() {
        if (this.audioPlayer.src) {
            this.audioPlayer.play();
        }
    }

    // =====================================================
    // LECTURE AUDIO - stopRadio()
    // =====================================================
    stopRadio() {
        this.isStopping = true;

        if (this.isCasting && window.cast && window.cast.framework) {
            try {
                const context = cast.framework.CastContext.getInstance();
                context.endCurrentSession(true);
            } catch (e) {
                console.error('Erreur arrêt Cast:', e);
            }
        }

        this.isCasting = false;
        this.isPlaying = false;
        this.audioPlayer.pause();
        this.audioPlayer.src = '';

        // Arrêter la notification
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'STOP_NOTIFICATION'
            });
        }

        // Se désabonner du chat (car on arrête la radio)
        this.unsubscribeFromChat();

		// Arrêter la récupération du titre en cours
        this.stopNowPlayingPolling();
		
        // Retirer la présence globale (on n'écoute plus)
        this.updateGlobalPresence(null);

        this.currentStation = null;
        this.errorCount = 0;

        // Fermer le panneau chat si ouvert
        const chatOverlay = document.getElementById('chatOverlay');
        if (chatOverlay) {
            chatOverlay.style.display = 'none';
            this.chatOpen = false;
        }

        this.playerContainer.style.display = 'none';
		document.body.classList.remove('player-visible');
		this.updateRadioCards();
        this.stopVisualizer();
        this.updateCastButtonUI();

        setTimeout(() => {
            this.isStopping = false;
        }, 500);
    }

    // =====================================================
    // LECTURE AUDIO - togglePlayerSize()
    // =====================================================
    togglePlayerSize() {
        const playerContainer = document.getElementById('playerContainer');
        const toggleBtn = document.getElementById('togglePlayerBtn');
        const icon = toggleBtn.querySelector('.material-icons');

        this.playerMinimized = !this.playerMinimized;

        if (this.playerMinimized) {
            playerContainer.classList.add('minimized');
            icon.textContent = 'expand_less';
        } else {
            playerContainer.classList.remove('minimized');
            icon.textContent = 'expand_more';
        }
    }

    // =====================================================
    // VISUALISEUR - startVisualizer()
    // =====================================================
    startVisualizer() {
        const visualizer = document.getElementById('visualizer');
        visualizer.classList.add('active');
    }

    // =====================================================
    // VISUALISEUR - stopVisualizer()
    // =====================================================
    stopVisualizer() {
        const visualizer = document.getElementById('visualizer');
        visualizer.classList.remove('active');
    }

    // =====================================================
    // VOLUME - toggleMute()
    // =====================================================
    toggleMute() {
        if (this.isMuted) {
            this.isMuted = false;
            this.audioPlayer.volume = this.previousVolume;
            this.volume = this.previousVolume;
        } else {
            this.isMuted = true;
            this.previousVolume = this.volume;
            this.audioPlayer.volume = 0;
        }

        this.updateVolumeIcon();

        const volumeSlider = document.getElementById('volumeSlider');
        const volumeValue = document.querySelector('.volume-value');

        if (volumeSlider && volumeValue) {
            volumeSlider.value = this.isMuted ? 0 : this.volume * 100;
            volumeValue.textContent = `${Math.round(this.isMuted ? 0 : this.volume * 100)}%`;
        }
    }

    // =====================================================
    // VOLUME - updateVolumeIcon()
    // =====================================================
    updateVolumeIcon() {
        const muteBtn = document.getElementById('muteBtn');
        if (!muteBtn) return;

        const icon = muteBtn.querySelector('.material-icons');
        if (!icon) return;

        if (this.isMuted || this.volume === 0) {
            icon.textContent = 'volume_off';
            muteBtn.classList.add('muted');
        } else if (this.volume < 0.5) {
            icon.textContent = 'volume_down';
            muteBtn.classList.remove('muted');
        } else {
            icon.textContent = 'volume_up';
            muteBtn.classList.remove('muted');
        }
    }

    // =====================================================
    // CHROMECAST - setupCast()
    // =====================================================
    setupCast() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) {
            console.log('Cast désactivé sur iOS');
            return;
        }

        if (this.castInitialized) {
            return;
        }

        if (window.cast && window.cast.framework && window.chrome && chrome.cast) {
            this.initCastContext();
        } else {
            window.__onGCastApiAvailable = (isAvailable) => {
                if (isAvailable) {
                    this.initCastContext();
                } else {
                    console.log('Google Cast non disponible');
                }
            };
        }
    }

    // =====================================================
    // CHROMECAST - initCastContext()
    // =====================================================
    initCastContext() {
        try {
            const context = cast.framework.CastContext.getInstance();
            context.setOptions({
                receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
                autoJoinPolicy: chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED
            });

            context.addEventListener(
                cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
                this.onCastSessionStateChanged.bind(this)
            );

            this.castInitialized = true;
            console.log('Chromecast initialisé');
        } catch (error) {
            console.error('Erreur init Cast:', error);
        }
    }

    // =====================================================
    // CHROMECAST - onCastSessionStateChanged()
    // =====================================================
    onCastSessionStateChanged(event) {
        const context = cast.framework.CastContext.getInstance();

        switch (event.sessionState) {
            case cast.framework.SessionState.SESSION_STARTED:
            case cast.framework.SessionState.SESSION_RESUMED:
                this.castSession = context.getCurrentSession();
                this.isCasting = true;
                this.updateCastButtonUI();

                if (this.currentStation) {
                    this.castLoadCurrentStation();
                }
                break;

            case cast.framework.SessionState.SESSION_ENDED:
                this.castSession = null;
                this.isCasting = false;
                this.updateCastButtonUI();
                break;
        }
    }

    // =====================================================
    // CHROMECAST - toggleCast()
    // =====================================================
    toggleCast() {
        if (!window.cast || !window.cast.framework || !window.chrome || !chrome.cast) {
            this.showToast('Chromecast non disponible sur ce navigateur');
            return;
        }

        const context = cast.framework.CastContext.getInstance();

        if (this.isCasting) {
            context.endCurrentSession(true);
        } else {
            context.requestSession().then(
                () => {
                    console.log('Session Chromecast démarrée');
                    if (this.currentStation) {
                        this.castLoadCurrentStation();
                    }
                },
                (error) => {
                    if (error !== 'cancel') {
                        console.error('Erreur Cast:', error);
                        this.showToast('Impossible de se connecter à Chromecast');
                    }
                }
            );
        }
    }

    // =====================================================
    // CHROMECAST - castLoadCurrentStation()
    // =====================================================
    castLoadCurrentStation() {
        if (!this.castSession || !this.currentStation) {
            return;
        }

        const mediaInfo = new chrome.cast.media.MediaInfo(
            this.currentStation.url,
            'audio/mpeg'
        );

        const metadata = new chrome.cast.media.GenericMediaMetadata();
        metadata.title = this.currentStation.name;
        metadata.subtitle = this.currentStation.description || 'Radio en ligne';
        metadata.images = [
            new chrome.cast.Image(window.location.origin + '/' + this.currentStation.logo)
        ];

        mediaInfo.metadata = metadata;
        mediaInfo.streamType = chrome.cast.media.StreamType.LIVE;

        const request = new chrome.cast.media.LoadRequest(mediaInfo);
        request.autoplay = true;

        this.castSession.loadMedia(request).then(
            () => {
                console.log('Radio diffusée sur Chromecast');
                const deviceName = this.castSession.getCastDevice().friendlyName;
                this.showToast('Diffusion sur ' + deviceName);
            },
            (error) => {
                console.error('Erreur de diffusion Cast:', error);
                this.showToast('Erreur lors de la diffusion');
            }
        );
    }

    // =====================================================
    // CHROMECAST - updateCastButtonUI()
    // =====================================================
    updateCastButtonUI() {
        const castBtn = document.getElementById('castBtn');
        if (!castBtn) return;

        const icon = castBtn.querySelector('.material-icons');

        if (this.isCasting) {
            castBtn.classList.add('casting');
            if (icon) icon.textContent = 'cast_connected';
        } else {
            castBtn.classList.remove('casting');
            if (icon) icon.textContent = 'cast';
        }
    }

    // =====================================================
    // FAVORIS - loadFavorites()
    // =====================================================
    loadFavorites() {
        const stored = localStorage.getItem('favorites');
        return stored ? JSON.parse(stored) : [];
    }

    // =====================================================
    // FAVORIS - saveFavorites()
    // =====================================================
    saveFavorites() {
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
    }

    // =====================================================
    // FAVORIS - toggleFavorite()
    // =====================================================
    toggleFavorite(stationId) {
        const index = this.favorites.indexOf(stationId);

        if (index === -1) {
            this.favorites.push(stationId);
            this.showToast('Ajouté aux favoris');
        } else {
            this.favorites.splice(index, 1);
            this.showToast('Retiré des favoris');
        }

        this.saveFavorites();
        this.renderRadios();
        this.renderFavorites();
    }

	// =====================================================
    // MODE D'AFFICHAGE - applyViewMode()
    // =====================================================
    applyViewMode(mode) {
        const radiosGrid = document.getElementById('radiosGrid');
        const favorisGrid = document.getElementById('favorisGrid');
        
        // Appliquer aux deux grilles
        [radiosGrid, favorisGrid].forEach(grid => {
            if (grid) {
                if (mode === 'list') {
                    grid.classList.add('list-view');
                } else {
                    grid.classList.remove('list-view');
                }
            }
        });
        
        // Mettre à jour le bouton actif
        document.querySelectorAll('.view-btn').forEach(btn => {
            if (btn.dataset.view === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
	
	// =====================================================
    // THÈME COULEUR - applyColorTheme()
    // =====================================================
    applyColorTheme(theme) {
        // Supprimer tous les thèmes couleur existants
        document.body.classList.remove(
            'theme-ocean',
            'theme-nature', 
            'theme-sunset',
            'theme-rose',
            'theme-turquoise',
            'theme-midnight'
        );
        
        // Appliquer le nouveau thème (sauf si default)
        if (theme && theme !== 'default') {
            document.body.classList.add(`theme-${theme}`);
        }
    }
	
	// =====================================================
    // MINUTEUR SOMMEIL - updateSleepPopupUI()
    // =====================================================
    updateSleepPopupUI() {
        const cancelBtn = document.getElementById('sleepOptionCancel');
        const statusDiv = document.getElementById('sleepPopupStatus');
        const statusText = document.getElementById('sleepPopupStatusText');
        const options = document.querySelectorAll('.sleep-option[data-minutes]');
        
        if (this.sleepTimerEndTime) {
            // Minuteur actif
            if (cancelBtn) cancelBtn.style.display = 'flex';
            if (statusDiv) statusDiv.style.display = 'flex';
            
            // Mettre à jour le texte du statut
            const remainingMs = this.sleepTimerEndTime - Date.now();
            const remainingMinutes = Math.round(remainingMs / 60000);
            const endDate = new Date(this.sleepTimerEndTime);
            const endTimeStr = endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            
            if (statusText) {
                if (remainingMinutes >= 60) {
                    const hours = Math.floor(remainingMinutes / 60);
                    const mins = remainingMinutes % 60;
                    statusText.textContent = `Arrêt à ${endTimeStr} (${hours}h${mins > 0 ? mins : ''})`;
                } else {
                    statusText.textContent = `Arrêt à ${endTimeStr} (${remainingMinutes} min)`;
                }
            }
            
            // Marquer l'option active si elle correspond
            options.forEach(opt => {
                opt.classList.remove('active');
            });
        } else {
            // Pas de minuteur
            if (cancelBtn) cancelBtn.style.display = 'none';
            if (statusDiv) statusDiv.style.display = 'none';
            
            options.forEach(opt => {
                opt.classList.remove('active');
            });
        }
    }

    // =====================================================
    // MINUTEUR SOMMEIL - updateSleepTimerBadge()
    // =====================================================
    updateSleepTimerBadge() {
        const btn = document.getElementById('sleepTimerBtn');
        const badge = document.getElementById('sleepTimerBadge');
        
        if (!btn || !badge) return;
        
        if (this.sleepTimerEndTime) {
            const remainingMs = this.sleepTimerEndTime - Date.now();
            const remainingMinutes = Math.round(remainingMs / 60000);
            
            btn.classList.add('active');
            badge.style.display = 'block';
            
            if (remainingMinutes >= 60) {
                const hours = Math.floor(remainingMinutes / 60);
                const mins = remainingMinutes % 60;
                badge.textContent = `${hours}h${mins > 0 ? mins : ''}`;
            } else {
                badge.textContent = `${remainingMinutes}m`;
            }
        } else {
            btn.classList.remove('active');
            badge.style.display = 'none';
        }
    }
	
    // =====================================================
    // MINUTEUR SOMMEIL - startSleepTimer()
    // =====================================================
    startSleepTimer(minutes) {
        this.cancelSleepTimer();

        const now = Date.now();
        this.sleepTimerEndTime = now + minutes * 60 * 1000;

        localStorage.setItem('sleepTimerEndTime', String(this.sleepTimerEndTime));

        const remainingMs = this.sleepTimerEndTime - now;

        this.sleepTimerId = setTimeout(() => {
            this.stopRadio();
            this.sleepTimerId = null;
            this.sleepTimerEndTime = null;
            localStorage.removeItem('sleepTimerEndTime');
            this.updateSleepTimerInfo();
            this.updateSleepTimerBadge();
            this.showToast('⏰ Minuteur terminé - Radio arrêtée');
        }, remainingMs);
        
        // Mettre à jour le badge
        this.updateSleepTimerBadge();
        this.showToast(`⏱️ Arrêt dans ${minutes} min`);
    }

    // =====================================================
    // MINUTEUR SOMMEIL - startSleepTimerAtTime()
    // =====================================================
    startSleepTimerAtTime(timeString) {
        this.cancelSleepTimer();

        const [hours, minutes] = timeString.split(':').map(Number);
        const now = new Date();
        const target = new Date();
        
        target.setHours(hours, minutes, 0, 0);
        
        // Si l'heure est déjà passée, programmer pour demain
        if (target <= now) {
            target.setDate(target.getDate() + 1);
        }

        this.sleepTimerEndTime = target.getTime();
        localStorage.setItem('sleepTimerEndTime', String(this.sleepTimerEndTime));

        const remainingMs = this.sleepTimerEndTime - now.getTime();

        this.sleepTimerId = setTimeout(() => {
            this.stopRadio();
            this.sleepTimerId = null;
            this.sleepTimerEndTime = null;
            localStorage.removeItem('sleepTimerEndTime');
            this.updateSleepTimerInfo();
            this.showToast('⏰ Minuteur terminé - Radio arrêtée');
        }, remainingMs);

        // Mettre à jour le badge
        this.updateSleepTimerBadge();
        
        // Afficher si c'est pour aujourd'hui ou demain
        const isToday = target.getDate() === now.getDate();
        const dayText = isToday ? "aujourd'hui" : "demain";
        this.showToast(`⏰ Arrêt programmé ${dayText} à ${timeString}`);
    }

    // =====================================================
    // MINUTEUR SOMMEIL - cancelSleepTimer()
    // =====================================================
    cancelSleepTimer() {
        if (this.sleepTimerId) {
            clearTimeout(this.sleepTimerId);
        }
        this.sleepTimerId = null;
        this.sleepTimerEndTime = null;
        localStorage.removeItem('sleepTimerEndTime');
        this.updateSleepTimerBadge();
    }

    // =====================================================
    // MINUTEUR SOMMEIL - restoreSleepTimerFromStorage()
    // =====================================================
    restoreSleepTimerFromStorage() {
        const storedEndTime = localStorage.getItem('sleepTimerEndTime');

        if (!storedEndTime) {
            this.sleepTimerEndTime = null;
            this.sleepTimerId = null;
            this.updateSleepTimerInfo();
            return;
        }

        const endTime = parseInt(storedEndTime, 10);
        if (Number.isNaN(endTime)) {
            localStorage.removeItem('sleepTimerEndTime');
            this.sleepTimerEndTime = null;
            this.sleepTimerId = null;
            this.updateSleepTimerInfo();
            return;
        }

        const remainingMs = endTime - Date.now();

        if (remainingMs <= 0) {
            localStorage.removeItem('sleepTimerEndTime');
            this.sleepTimerEndTime = null;
            this.sleepTimerId = null;
            this.updateSleepTimerInfo();
            return;
        }

        this.sleepTimerEndTime = endTime;
        this.sleepTimerId = setTimeout(() => {
            this.stopRadio();
            this.sleepTimerId = null;
            this.sleepTimerEndTime = null;
            localStorage.removeItem('sleepTimerEndTime');
            this.updateSleepTimerInfo();
            this.updateSleepTimerBadge();
        }, remainingMs);

        this.updateSleepTimerInfo();
        this.updateSleepTimerBadge();
    }

    // =====================================================
    // MINUTEUR SOMMEIL - updateSleepTimerInfo()
    // =====================================================
    updateSleepTimerInfo() {
        const info = document.getElementById('sleepTimerInfo');
        const settingsBtn = document.getElementById('settingsBtn');
        const indicator = document.getElementById('sleepTimerIndicator');
        const startBtn = document.getElementById('sleepTimerStartBtn');
        const cancelBtn = document.getElementById('sleepTimerCancelBtn');

        if (!info) return;

        if (!this.sleepTimerEndTime) {
            info.textContent = 'Aucun minuteur actif';

            if (startBtn) {
                startBtn.innerHTML = '<span class="material-icons">timer</span> Démarrer le minuteur';
                startBtn.classList.remove('active-timer');
            }
            if (cancelBtn) {
                cancelBtn.style.display = 'none';
            }
            if (settingsBtn) {
                settingsBtn.removeAttribute('title');
            }
            if (indicator) {
                indicator.classList.remove('active');
            }
            return;
        }

        const remainingMs = this.sleepTimerEndTime - Date.now();

        if (remainingMs <= 0) {
            info.textContent = 'Aucun minuteur actif';

            if (startBtn) {
                startBtn.innerHTML = '<span class="material-icons">timer</span> Démarrer le minuteur';
                startBtn.classList.remove('active-timer');
            }
            if (cancelBtn) {
                cancelBtn.style.display = 'none';
            }
            if (settingsBtn) {
                settingsBtn.removeAttribute('title');
            }
            if (indicator) {
                indicator.classList.remove('active');
            }
            return;
        }

        const remainingMinutes = Math.round(remainingMs / 60000);
        
        // Formater l'heure d'arrêt
        const endDate = new Date(this.sleepTimerEndTime);
        const endTimeStr = endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        if (remainingMinutes >= 60) {
            const hours = Math.floor(remainingMinutes / 60);
            const mins = remainingMinutes % 60;
            info.textContent = `Arrêt à ${endTimeStr} (dans ${hours}h${mins > 0 ? mins + 'min' : ''})`;
        } else {
            info.textContent = `Arrêt à ${endTimeStr} (dans ${remainingMinutes} min)`;
        }

        if (startBtn) {
            startBtn.innerHTML = '<span class="material-icons">stop</span> Arrêter le minuteur';
            startBtn.classList.add('active-timer');
        }
        if (cancelBtn) {
            cancelBtn.style.display = 'inline-flex';
        }
        if (settingsBtn) {
            settingsBtn.title = `Minuteur actif : arrêt dans environ ${remainingMinutes} min`;
        }
        if (indicator) {
            indicator.classList.add('active');
        }
    }

    // =====================================================
    // PARTAGE SOCIAL - shareStation()
    // =====================================================
    shareStation(station) {
        const shareData = {
            title: `J'écoute ${station.name} sur RadioFM`,
            text: `🎵 En ce moment j'écoute ${station.name} - ${station.description}\n\nÉcoutez gratuitement sur RadioFM !`,
            url: `https://radiofm.ovh?radio=${station.id}`
        };

        if (navigator.share) {
            navigator.share(shareData)
                .then(() => {
                    this.showToast('Merci pour le partage ! 🎉');

                    if (window.dataLayer) {
                        window.dataLayer.push({
                            'event': 'radio_share',
                            'radio_name': station.name,
                            'share_method': 'native'
                        });
                    }
                })
                .catch((error) => {
                    if (error.name !== 'AbortError') {
                        console.error('Erreur partage:', error);
                        this.fallbackShare(station);
                    }
                });
        } else {
            this.fallbackShare(station);
        }
    }

    // =====================================================
    // PARTAGE SOCIAL - fallbackShare()
    // =====================================================
    fallbackShare(station) {
        const shareText = `🎵 J'écoute ${station.name} sur RadioFM !\n👉 https://radiofm.ovh?radio=${station.id}`;

        navigator.clipboard.writeText(shareText)
            .then(() => {
                this.showToast('Lien copié ! Collez-le où vous voulez 📋');

                if (window.dataLayer) {
                    window.dataLayer.push({
                        'event': 'radio_share',
                        'radio_name': station.name,
                        'share_method': 'clipboard'
                    });
                }
            })
            .catch(() => {
                this.showToast('Partagez : https://radiofm.ovh');
            });
    }

    // =====================================================
    // PARTAGE SOCIAL - checkSharedRadio()
    // =====================================================
    checkSharedRadio() {
        console.log('🔍 Vérification radio partagée...');

        const urlParams = new URLSearchParams(window.location.search);
        const radioId = urlParams.get('radio');

        console.log('📻 Radio ID dans URL:', radioId);

        if (!radioId) {
            console.log('❌ Pas de radio dans l\'URL');
            return false;
        }

        const station = this.stations.find(s => s.id === radioId);

        console.log('🎵 Station trouvée:', station);

        if (!station) {
            console.log('❌ Radio non trouvée:', radioId);
            this.showToast('Radio introuvable');
            return false;
        }

        this.currentStation = station;
        this.audioPlayer.src = station.url;
        this.isPlaying = false;

        this.playerContainer.style.display = 'block';
        this.playerContainer.classList.remove('minimized');
        this.updatePlayerInfo();
        this.updatePlayerUI();
        this.updateRadioCards();

        const overlay = document.getElementById('autoResumeOverlay');
        const title = document.getElementById('autoResumeTitle');
        const text = document.getElementById('autoResumeText');
        const resumeBtn = document.getElementById('autoResumeBtn');
        const cancelBtn = document.getElementById('autoResumeCancelBtn');

        if (overlay && title && text && resumeBtn && cancelBtn) {
            title.textContent = `🎵 ${station.name}`;
            text.textContent = `${station.description || 'Radio partagée'}\n\nCliquez pour démarrer la lecture`;
            overlay.style.display = 'flex';

            resumeBtn.onclick = () => {
                overlay.style.display = 'none';
                this.playRadio(station);
                console.log('▶️ Lecture lancée par l\'utilisateur');
            };

            cancelBtn.onclick = () => {
                overlay.style.display = 'none';
            };
        }

        if (window.history && window.history.replaceState) {
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }

        return true;
    }

    // =====================================================
    // CHAT EN DIRECT - getOrCreateUsername()
    // =====================================================
    getOrCreateUsername() {
        let username = localStorage.getItem('radio_chat_username');

        if (!username) {
            const adjectives = ['Cool', 'Super', 'Mega', 'Ultra', 'Top', 'Pro', 'Happy', 'Fun'];
            const nouns = ['Auditeur', 'Fan', 'Musicien', 'Radio', 'Listener', 'Player'];
            const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
            const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
            const randomNum = Math.floor(Math.random() * 999);

            username = `${randomAdj}${randomNoun}${randomNum}`;
            localStorage.setItem('radio_chat_username', username);
        }

        return username;
    }

    // =====================================================
    // CHAT EN DIRECT - openChat()
    // =====================================================
    openChat() {
        console.log('🚪 openChat() appelée');
        console.log('📻 Station:', this.currentStation);

        if (!this.currentStation) {
            this.showToast('Lancez une radio pour accéder au chat');
            return;
        }

        const overlay = document.getElementById('chatOverlay');
        const radioNameSpan = document.getElementById('chatRadioName');

        if (overlay && radioNameSpan) {
            radioNameSpan.textContent = this.currentStation.name;
            overlay.style.display = 'flex';
            this.chatOpen = true;

            // Marquer comme lu DÈS L'OUVERTURE
            this.markChatAsRead(this.currentStation.id);

            // S'abonner seulement si pas déjà abonné
            if (!this.chatSubscription) {
                this.subscribeToChat(this.currentStation.id);
            }

            // Charger les messages existants
            this.loadChatMessages(this.currentStation.id);

            // Focus sur l'input
            setTimeout(() => {
                const input = document.getElementById('chatInput');
                if (input) input.focus();
            }, 300);
        }
    }

    // =====================================================
    // CHAT EN DIRECT - closeChat()
    // =====================================================
    closeChat() {
        const overlay = document.getElementById('chatOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            this.chatOpen = false;

            // Marquer comme lu
            if (this.currentStation) {
                this.markChatAsRead(this.currentStation.id);
            }

            // NE PAS se désabonner ici !
            // On reste abonné pour recevoir les nouveaux messages
            // et afficher le badge quand le chat est fermé
        }
    }

    // =====================================================
    // CHAT EN DIRECT - subscribeToChat()
    // =====================================================
    async subscribeToChat(radioId) {
        // D'abord se désabonner si déjà abonné
        this.unsubscribeFromChat();

        // S'abonner aux nouveaux messages
        this.chatSubscription = supabaseClient
            .channel(`radio_chat_${radioId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'radio_chat_messages',
                    filter: `radio_id=eq.${radioId}`
                },
                (payload) => {
                    this.handleNewChatMessage(payload.new);
                }
            )
            .subscribe();

        console.log(`✅ Abonné au chat de ${radioId}`);

        // S'abonner à la présence pour compter les utilisateurs
        this.joinPresence(radioId);
    }

    // =====================================================
    // CHAT EN DIRECT - joinPresence() [NOUVEAU]
    // =====================================================
    joinPresence(radioId) {
        // Se désabonner de l'ancien canal de présence
        this.leavePresence();

        // Créer un canal de présence pour cette radio
        this.presenceChannel = supabaseClient.channel(`presence_${radioId}`, {
            config: {
                presence: {
                    key: this.getUserId()
                }
            }
        });

        // Écouter les changements de présence
        this.presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = this.presenceChannel.presenceState();
                this.onlineUsers = Object.keys(state).length;
                this.updateOnlineCount();
                console.log(`👥 Utilisateurs en ligne: ${this.onlineUsers}`);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log(`👋 ${key} a rejoint le chat`);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log(`👋 ${key} a quitté le chat`);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Envoyer notre présence
                    await this.presenceChannel.track({
                        username: this.username,
                        online_at: new Date().toISOString()
                    });
                    console.log(`✅ Présence activée pour ${radioId}`);
                }
            });
    }

    // =====================================================
    // CHAT EN DIRECT - leavePresence() [NOUVEAU]
    // =====================================================
    leavePresence() {
        if (this.presenceChannel) {
            this.presenceChannel.untrack();
            supabaseClient.removeChannel(this.presenceChannel);
            this.presenceChannel = null;
            this.onlineUsers = 0;
            this.updateOnlineCount();
        }
    }

    // =====================================================
    // CHAT EN DIRECT - updateOnlineCount() [NOUVEAU]
    // =====================================================
    updateOnlineCount() {
        const countElement = document.getElementById('chatOnlineCount');
        if (countElement) {
            countElement.textContent = `${this.onlineUsers} personne${this.onlineUsers > 1 ? 's' : ''}`;
        }
    }

    // =====================================================
    // CHAT EN DIRECT - unsubscribeFromChat()
    // =====================================================
    unsubscribeFromChat() {
        if (this.chatSubscription) {
            supabaseClient.removeChannel(this.chatSubscription);
            this.chatSubscription = null;
            console.log('🔌 Désabonné du chat');
        }

        // Quitter la présence aussi
        this.leavePresence();
    }

    // =====================================================
    // CHAT EN DIRECT - loadChatMessages()
    // =====================================================
    async loadChatMessages(radioId) {
        try {
            const { data, error } = await supabaseClient
                .from('radio_chat_messages')
                .select('*')
                .eq('radio_id', radioId)
                .order('created_at', { ascending: true })
                .limit(50);

            if (error) throw error;

            this.chatMessages = data || [];
            this.renderChatMessages();
            this.scrollChatToBottom();

        } catch (error) {
            console.error('Erreur chargement messages:', error);
            this.showToast('Erreur de chargement du chat');
        }
    }

    // =====================================================
    // CHAT EN DIRECT - handleNewChatMessage()
    // =====================================================
    handleNewChatMessage(message) {
        console.log('💬 Nouveau message reçu (canal radio):', message);

        this.chatMessages.push(message);

        if (this.chatMessages.length > 50) {
            this.chatMessages.shift();
        }

        this.renderChatMessages();
        this.scrollChatToBottom();

        // Les badges sont gérés par handleGlobalNewMessage()
        // Ici on gère seulement l'affichage des messages dans le panneau chat
    }

    // =====================================================
    // CHAT EN DIRECT - renderChatMessages()
    // =====================================================
    renderChatMessages() {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        if (this.chatMessages.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <span class="material-icons" style="font-size: 48px; opacity: 0.5;">chat_bubble_outline</span>
                    <p>Aucun message pour le moment</p>
                    <p style="font-size: 0.9rem;">Soyez le premier à écrire ! 👋</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.chatMessages.map(msg => `
            <div class="chat-message ${this.isAdmin ? 'is-admin' : ''}">
                <div class="chat-message-header">
                    <span class="chat-message-username">
                        ${this.escapeHtml(msg.username)}
                        ${msg.user_id === this.getUserId() ? '<span class="admin-badge">Vous</span>' : ''}
                    </span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="chat-message-time">${this.formatChatTime(msg.created_at)}</span>
                        <button class="chat-message-delete" onclick="window.radioApp.deleteMessage('${msg.id}')" title="Supprimer">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="chat-message-text">${this.escapeHtml(msg.message)}</div>
            </div>
        `).join('');
    }

    // =====================================================
    // CHAT EN DIRECT - sendChatMessage()
    // =====================================================
    async sendChatMessage() {
        if (!this.currentStation) return;

        const input = document.getElementById('chatInput');
        if (!input) return;

        const message = input.value.trim();

        if (!message) {
            this.showToast('Écrivez un message');
            return;
        }

        if (message.length > 500) {
            this.showToast('Message trop long (max 500 caractères)');
            return;
        }

        // Utiliser le nom admin si connecté en admin, sinon le username normal
        const displayUsername = this.isAdmin ? 'Admin_ActuMedia' : this.username;

        try {
            const { error } = await supabaseClient
                .from('radio_chat_messages')
                .insert([
                    {
                        radio_id: this.currentStation.id,
                        radio_name: this.currentStation.name,
                        username: displayUsername,
                        message: message,
                        user_id: this.getUserId()
                    }
                ]);

            if (error) throw error;

            input.value = '';

            if (window.dataLayer) {
                window.dataLayer.push({
                    'event': 'chat_message_sent',
                    'radio_name': this.currentStation.name
                });
            }

        } catch (error) {
            console.error('Erreur envoi message:', error);
            this.showToast('Erreur d\'envoi du message');
        }
    }

    // =====================================================
    // CHAT EN DIRECT - deleteMessage()
    // =====================================================
    async deleteMessage(messageId) {
        if (!this.isAdmin) {
            this.showToast('Action non autorisée');
            return;
        }

        if (!confirm('Supprimer ce message ?')) {
            return;
        }

        try {
            const { error } = await supabaseClient
                .from('radio_chat_messages')
                .delete()
                .eq('id', messageId);

            if (error) throw error;

            this.chatMessages = this.chatMessages.filter(m => m.id !== messageId);
            this.renderChatMessages();

            this.showToast('Message supprimé');

        } catch (error) {
            console.error('Erreur suppression message:', error);
            this.showToast('Erreur de suppression');
        }
    }

    // =====================================================
    // CHAT EN DIRECT - scrollChatToBottom()
    // =====================================================
    scrollChatToBottom() {
        const container = document.getElementById('chatMessages');
        if (container) {
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 100);
        }
    }

    // =====================================================
    // CHAT EN DIRECT - getUserId()
    // =====================================================
    getUserId() {
        let userId = localStorage.getItem('radio_user_id');

        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('radio_user_id', userId);
        }

        return userId;
    }

    // =====================================================
    // CHAT EN DIRECT - playChatNotificationSound()
    // =====================================================
    playChatNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Pas grave si ça échoue
        }
    }

    // =====================================================
    // ADMIN - hashPassword()
    // =====================================================
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // =====================================================
    // ADMIN - checkAdminSession()
    // =====================================================
    checkAdminSession() {
        const adminSession = localStorage.getItem('radio_admin_session');

        if (adminSession) {
            try {
                const session = JSON.parse(adminSession);
                this.isAdmin = true;
                this.adminUsername = session.username;
                this.updateAdminUI();
                console.log('👑 Session admin active:', session.username);
            } catch (e) {
                localStorage.removeItem('radio_admin_session');
            }
        }
    }

    // =====================================================
    // ADMIN - loginAdmin()
    // =====================================================
    async loginAdmin() {
        const usernameInput = document.getElementById('adminUsername');
        const passwordInput = document.getElementById('adminPassword');

        if (!usernameInput || !passwordInput) return;

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            this.showToast('Remplissez tous les champs');
            return;
        }

        try {
            const passwordHash = await this.hashPassword(password);

            const { data, error } = await supabaseClient
                .from('radio_admins')
                .select('*')
                .eq('username', username)
                .eq('password', passwordHash)
                .single();

            if (error || !data) {
                this.showToast('Identifiants incorrects');
                passwordInput.value = '';
                return;
            }

            this.isAdmin = true;
            this.adminUsername = username;

            localStorage.setItem('radio_admin_session', JSON.stringify({
                username: username,
                loginTime: Date.now()
            }));

            this.updateAdminUI();
            this.showToast('👑 Connecté en tant qu\'admin');

            usernameInput.value = '';
            passwordInput.value = '';

        } catch (error) {
            console.error('Erreur connexion admin:', error);
            this.showToast('Erreur de connexion');
        }
    }

    // =====================================================
    // ADMIN - logoutAdmin()
    // =====================================================
    logoutAdmin() {
        this.isAdmin = false;
        this.adminUsername = null;
        localStorage.removeItem('radio_admin_session');
        this.updateAdminUI();
        this.showToast('Déconnecté');
    }

    // =====================================================
    // ADMIN - updateAdminUI()
    // =====================================================
    updateAdminUI() {
        const loginForm = document.getElementById('adminLoginForm');
        const adminPanel = document.getElementById('adminPanel');
        const usernameDisplay = document.getElementById('adminUsernameDisplay');

        if (this.isAdmin) {
            if (loginForm) loginForm.style.display = 'none';
            if (adminPanel) adminPanel.style.display = 'block';
            if (usernameDisplay) usernameDisplay.textContent = this.adminUsername || 'Admin';
        } else {
            if (loginForm) loginForm.style.display = 'block';
            if (adminPanel) adminPanel.style.display = 'none';
        }
    }

    // =====================================================
    // NOTIFICATIONS - requestNotificationPermission()
    // =====================================================
    async requestNotificationPermission() {
        const isAndroid = /Android/i.test(navigator.userAgent);

        if (!isAndroid) {
            return false;
        }

        if (Notification.permission === 'granted') {
            console.log('✅ Permission notifications déjà accordée');
            return true;
        }

        if (Notification.permission === 'denied') {
            console.log('❌ Permission notifications refusée');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('✅ Permission notifications accordée');
                this.showToast('Notifications activées pour la lecture en arrière-plan');
                return true;
            } else {
                console.log('❌ Permission notifications refusée par l\'utilisateur');
                return false;
            }
        } catch (error) {
            console.error('Erreur demande permission:', error);
            return false;
        }
    }

    // =====================================================
    // NOTIFICATIONS - updateNotificationStatus()
    // =====================================================
    updateNotificationStatus() {
        const statusElement = document.getElementById('notificationStatus');
        const buttonElement = document.getElementById('enableNotificationsBtn');

        if (!statusElement || !buttonElement) return;

        if (Notification.permission === 'granted') {
            statusElement.textContent = '✅ Notifications activées';
            statusElement.style.color = '#4caf50';
            buttonElement.style.display = 'none';
        } else if (Notification.permission === 'denied') {
            statusElement.textContent = '❌ Notifications refusées (réactivez dans les paramètres Android)';
            statusElement.style.color = '#f44336';
            buttonElement.style.display = 'none';
        } else {
            statusElement.textContent = '⚠️ Notifications non activées';
            statusElement.style.color = '#ffc107';
            buttonElement.style.display = 'block';
        }
    }

    // =====================================================
    // BADGES CHAT - updateChatBadges() [CORRIGÉ]
    // =====================================================
    async updateChatBadges() {
        try {
            for (const station of this.stations) {
                // CORRIGÉ : Utiliser la même clé que markChatAsRead()
                const lastVisitKey = `radio_chat_last_read_${station.id}`;
                const lastVisit = localStorage.getItem(lastVisitKey);

                if (!lastVisit) {
                    continue;
                }

                const { count, error } = await supabaseClient
                    .from('radio_chat_messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('radio_id', station.id)
                    .gt('created_at', lastVisit);

                if (error) {
                    console.error('Erreur comptage messages:', error);
                    continue;
                }

                const badges = document.querySelectorAll(`.radio-badge-${station.id}`);
                badges.forEach(badge => {
                    if (count > 0) {
                        badge.textContent = count > 99 ? '99+' : count;
                        badge.style.display = 'block';
                    } else {
                        badge.style.display = 'none';
                    }
                });
            }
        } catch (error) {
            console.error('Erreur updateChatBadges:', error);
        }
    }

    // =====================================================
    // BADGES CHAT - markChatAsRead()
    // =====================================================
    markChatAsRead(radioId) {
        console.log('🎯 markChatAsRead() appelée pour:', radioId);

        const now = new Date().toISOString();
        localStorage.setItem(`radio_chat_last_read_${radioId}`, now);

        // Réinitialiser le compteur
        this.unreadMessages = 0;

        // Cacher le badge sur la carte radio
        const cardBadges = document.querySelectorAll(`.radio-badge-${radioId}`);
        cardBadges.forEach(badge => {
            badge.style.display = 'none';
            badge.textContent = '0';
        });
        console.log('✅ Badges carte cachés');

        // Cacher le badge sur le bouton chat du player
        const playerBadge = document.getElementById('chatBadge');
        if (playerBadge) {
            playerBadge.style.display = 'none';
            playerBadge.textContent = '0';
            console.log('✅ Badge player caché');
        }

        console.log(`✅ Chat marqué comme lu pour ${radioId}`);
    }

    // =====================================================
    // BADGES CHAT - subscribeToAllChats() [NOUVEAU]
    // =====================================================
    subscribeToAllChats() {
        // Se désabonner si déjà abonné
        if (this.globalChatSubscription) {
            supabaseClient.removeChannel(this.globalChatSubscription);
        }

        // S'abonner à TOUS les nouveaux messages (sans filtre sur radio_id)
        this.globalChatSubscription = supabaseClient
            .channel('global_chat_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'radio_chat_messages'
                },
                (payload) => {
                    this.handleGlobalNewMessage(payload.new);
                }
            )
            .subscribe();

        console.log('🌍 Abonné à TOUS les chats (global)');
    }

    // =====================================================
    // BADGES CHAT - handleGlobalNewMessage() [NOUVEAU]
    // =====================================================
    handleGlobalNewMessage(message) {
        console.log('🌍 Nouveau message global:', message.radio_id, message.message);

        const radioId = message.radio_id;

        // Si c'est la radio en cours ET le chat est ouvert, ne pas afficher de badge
        if (this.currentStation && this.currentStation.id === radioId && this.chatOpen) {
            console.log('📭 Chat ouvert pour cette radio, pas de badge');
            return;
        }

        // Vérifier si le message est plus récent que la dernière lecture
        const lastReadKey = `radio_chat_last_read_${radioId}`;
        const lastRead = localStorage.getItem(lastReadKey);

        if (lastRead && new Date(message.created_at) <= new Date(lastRead)) {
            console.log('📭 Message déjà lu, pas de badge');
            return;
        }

        // Mettre à jour le badge sur la carte de cette radio
        const cardBadges = document.querySelectorAll(`.radio-badge-${radioId}`);
        cardBadges.forEach(badge => {
            let currentCount = parseInt(badge.textContent) || 0;
            currentCount++;
            badge.textContent = currentCount > 99 ? '99+' : currentCount;
            badge.style.display = 'block';
        });

        console.log('✅ Badge mis à jour pour:', radioId);

        // Si c'est la radio en cours (mais chat fermé), mettre à jour le badge du player
        if (this.currentStation && this.currentStation.id === radioId && !this.chatOpen) {
            this.unreadMessages++;
            const playerBadge = document.getElementById('chatBadge');
            if (playerBadge) {
                playerBadge.style.display = 'block';
                playerBadge.textContent = this.unreadMessages > 99 ? '99+' : this.unreadMessages;
            }

            // Son de notification si ce n'est pas notre message
            if (message.username !== this.username) {
                this.playChatNotificationSound();
            }
        }
    }

    // =====================================================
    // BADGES CHAT - startBadgePolling() [NOUVEAU]
    // =====================================================
    startBadgePolling() {
        // Polling toutes les 30 secondes (backup si l'abonnement global échoue)
        this.badgePollingInterval = setInterval(() => {
            this.updateChatBadges();
        }, 30000);

        console.log('⏱️ Polling des badges démarré (30s)');
    }

    // =====================================================
    // BADGES CHAT - stopBadgePolling() [NOUVEAU]
    // =====================================================
    stopBadgePolling() {
        if (this.badgePollingInterval) {
            clearInterval(this.badgePollingInterval);
            this.badgePollingInterval = null;
        }
    }

    // =====================================================
    // ANDROID - setupAndroidBackButton() [NOUVEAU]
    // =====================================================
    setupAndroidBackButton() {
        // Détecter si c'est Android
        const isAndroid = /Android/i.test(navigator.userAgent);
        if (!isAndroid) return;

        // Créer un historique factice pour intercepter le bouton retour
        history.pushState({ page: 'main' }, '', '');

        window.addEventListener('popstate', (event) => {
            // Empêcher la fermeture de l'app
            history.pushState({ page: 'main' }, '', '');

            // Si le chat est ouvert, le fermer
            if (this.chatOpen) {
                this.closeChat();
                return;
            }

            // Si les paramètres sont ouverts, les fermer
            const settingsOverlay = document.getElementById('settingsOverlay');
            if (settingsOverlay && settingsOverlay.style.display === 'flex') {
                settingsOverlay.style.display = 'none';
                return;
            }

            // Si le menu contextuel est ouvert, le fermer
            if (this.contextMenu && this.contextMenu.style.display === 'block') {
                this.hideContextMenu();
                return;
            }

            // Si une radio joue, afficher un toast
            if (this.isPlaying) {
                this.showToast('Utilisez le bouton Home pour minimiser');
            }
        });

        console.log('📱 Gestion bouton retour Android activée');
    }

    // =====================================================
    // PRÉSENCE GLOBALE - joinGlobalPresence() [NOUVEAU]
    // =====================================================
    joinGlobalPresence() {
        // Se désabonner si déjà abonné
        if (this.globalPresenceChannel) {
            supabaseClient.removeChannel(this.globalPresenceChannel);
        }

        // Créer un canal de présence global pour TOUS les auditeurs
        this.globalPresenceChannel = supabaseClient.channel('global_listeners', {
            config: {
                presence: {
                    key: this.getUserId()
                }
            }
        });

        // Écouter les changements de présence
        this.globalPresenceChannel
            .on('presence', { event: 'sync' }, () => {
                this.updateListenersBadges();
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log(`🎧 Nouvel auditeur:`, newPresences);
                this.updateListenersBadges();
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log(`👋 Auditeur parti:`, leftPresences);
                this.updateListenersBadges();
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('🌍 Présence globale activée');
                }
            });
    }

	// =====================================================
// AUTO RESUME - Reprendre depuis le mini player
// =====================================================
checkAutoResume() {
    // Vérifier si l'option de reprise auto est activée
    const autoResumeEnabled = localStorage.getItem('autoResumeLastStation') === 'true';
    const lastStationData = localStorage.getItem('lastStationData');
    
    if (lastStationData && autoResumeEnabled) {
        try {
            const stationData = JSON.parse(lastStationData);
            const station = this.stations.find(s => s.id === stationData.id);
            
            if (station && !this.isPlaying) {
                // Utiliser l'overlay existant
                const overlay = document.getElementById('autoResumeOverlay');
                const title = document.getElementById('autoResumeTitle');
                const text = document.getElementById('autoResumeText');
                const resumeBtn = document.getElementById('autoResumeBtn');
                const cancelBtn = document.getElementById('autoResumeCancelBtn');
                
                if (overlay && resumeBtn) {
                    if (title) title.textContent = station.name;
                    if (text) text.textContent = 'Reprendre la lecture ?';
                    
                    overlay.style.display = 'flex';
                    
                    // Bouton reprendre
                    resumeBtn.onclick = () => {
                        overlay.style.display = 'none';
                        this.playRadio(station);
                    };
                    
                    // Bouton annuler
                    if (cancelBtn) {
                        cancelBtn.onclick = () => {
                            overlay.style.display = 'none';
                        };
                    }
                }
            }
        } catch (e) {
            console.error('Erreur auto resume:', e);
        }
    }
}

    // =====================================================
    // PRÉSENCE GLOBALE - updateGlobalPresence() [NOUVEAU]
    // =====================================================
    async updateGlobalPresence(radioId) {
        if (!this.globalPresenceChannel) return;

        try {
            if (radioId) {
                // On écoute une radio
                await this.globalPresenceChannel.track({
                    radioId: radioId,
                    username: this.username,
                    listening_since: new Date().toISOString()
                });
                console.log(`🎧 Présence mise à jour: écoute ${radioId}`);
            } else {
                // On n'écoute plus rien
                await this.globalPresenceChannel.untrack();
                console.log('🎧 Présence retirée');
            }
        } catch (error) {
            console.error('Erreur mise à jour présence:', error);
        }
    }

    // =====================================================
    // PRÉSENCE GLOBALE - updateListenersBadges() [NOUVEAU]
    // =====================================================
    updateListenersBadges() {
        if (!this.globalPresenceChannel) return;

        const state = this.globalPresenceChannel.presenceState();
        
        // Réinitialiser les compteurs
        this.listenersPerRadio = {};

        // Compter les auditeurs par radio
        Object.values(state).forEach(presences => {
            presences.forEach(presence => {
                if (presence.radioId) {
                    this.listenersPerRadio[presence.radioId] = 
                        (this.listenersPerRadio[presence.radioId] || 0) + 1;
                }
            });
        });

        console.log('👥 Auditeurs par radio:', this.listenersPerRadio);

        // Mettre à jour les badges sur les cartes
        this.stations.forEach(station => {
            const count = this.listenersPerRadio[station.id] || 0;
            const badges = document.querySelectorAll(`.listeners-badge-${station.id}`);
            
            badges.forEach(badge => {
                if (count > 0) {
                    badge.style.display = 'flex';
                    const countSpan = badge.querySelector('.listeners-count');
                    if (countSpan) {
                        countSpan.textContent = count;
                    }
                } else {
                    badge.style.display = 'none';
                }
            });
        });
    }

// =====================================================
    // NOW PLAYING - fetchNowPlaying()
    // =====================================================
    async fetchNowPlaying() {
        if (!this.currentStation || !this.isPlaying) {
            this.hideNowPlaying();
            return;
        }

        try {
            const encodedUrl = encodeURIComponent(this.currentStation.url);
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

    // =====================================================
    // NOW PLAYING - showNowPlaying()
    // =====================================================
    showNowPlaying(title) {
        const container = document.getElementById('playerNowPlaying');
        const textSpan = document.getElementById('nowPlayingText');
        
        if (!container || !textSpan) return;

        // Ne mettre à jour que si le titre a changé
        if (title !== this.lastNowPlaying) {
            this.lastNowPlaying = title;
            textSpan.textContent = title;
            container.style.display = 'flex';
            
            // Animation de changement
            container.style.animation = 'none';
            setTimeout(() => {
                container.style.animation = 'fadeInSlide 0.3s ease';
            }, 10);
        }
    }

    // =====================================================
    // NOW PLAYING - hideNowPlaying()
    // =====================================================
    hideNowPlaying() {
        const container = document.getElementById('playerNowPlaying');
        if (container) {
            container.style.display = 'none';
        }
        this.lastNowPlaying = '';
    }

    // =====================================================
    // NOW PLAYING - startNowPlayingPolling()
    // =====================================================
    startNowPlayingPolling() {
        // Arrêter le polling précédent s'il existe
        this.stopNowPlayingPolling();

        // Récupérer immédiatement
        this.fetchNowPlaying();

        // Puis toutes les 15 secondes
        this.nowPlayingInterval = setInterval(() => {
            this.fetchNowPlaying();
        }, 15000);
    }

    // =====================================================
    // NOW PLAYING - stopNowPlayingPolling()
    // =====================================================
    stopNowPlayingPolling() {
        if (this.nowPlayingInterval) {
            clearInterval(this.nowPlayingInterval);
            this.nowPlayingInterval = null;
        }
        this.hideNowPlaying();
    }
	
    // =====================================================
    // UTILITAIRES - showToast()
    // =====================================================
    showToast(message) {
        this.toast.textContent = message;
        this.toast.classList.add('show');

        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    // =====================================================
    // UTILITAIRES - hideContextMenu()
    // =====================================================
    hideContextMenu() {
        this.contextMenu.style.display = 'none';
    }

    // =====================================================
    // UTILITAIRES - showContextMenu()
    // =====================================================
    showContextMenu(event, station) {
        if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }

        const x = event.clientX || event.pageX || 0;
        const y = event.clientY || event.pageY || 0;

        const menuWidth = 200;
        const menuHeight = 150;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let finalX = x;
        let finalY = y;

        if (x + menuWidth > windowWidth) {
            finalX = windowWidth - menuWidth - 10;
        }

        if (y + menuHeight > windowHeight) {
            finalY = windowHeight - menuHeight - 10;
        }

        this.contextMenu.style.left = `${finalX}px`;
        this.contextMenu.style.top = `${finalY}px`;
        this.contextMenu.style.display = 'block';

		// Empêcher la fermeture immédiate
		if (this.setContextMenuJustOpened) {
			this.setContextMenuJustOpened();
		}

        const addBtn = document.getElementById('addToFavorites');
        const removeBtn = document.getElementById('removeFromFavorites');

        if (this.favorites.includes(station.id)) {
            addBtn.style.display = 'none';
            removeBtn.style.display = 'flex';
        } else {
            addBtn.style.display = 'flex';
            removeBtn.style.display = 'none';
        }

        this.contextMenu.dataset.stationId = station.id;
    }

    // =====================================================
    // UTILITAIRES - escapeHtml()
    // =====================================================
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // =====================================================
    // UTILITAIRES - formatChatTime()
    // =====================================================
    formatChatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Il y a ${diffHours}h`;

        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// =====================================================
// C. INITIALISATION DOMContentLoaded
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    window.radioApp = new RadioPlayerApp();
});