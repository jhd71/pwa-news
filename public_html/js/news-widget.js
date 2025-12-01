// news-widget.js - Gestionnaire du widget NEWS Actu&Média

// ✅ Variables globales pour l'alarme (AU DÉBUT)
let alarmTime = null;
let timerInterval = null;
let timerSeconds = 0;
let alarmCheckInterval = null;
let alarmSoundInterval = null;
let alarmSoundCount = 0;

// ✅ Variables pour contrôler les sons
let currentAlarmAudio = null;
let currentTimerAudio = null;

// Configuration des durées
const ALARM_SETTINGS = {
    ALARM_DURATION: 120,        // 2 minutes
    ALARM_REPEAT_INTERVAL: 5000, // 5 secondes
    TIMER_DURATION: 60,         // 1 minute
    TIMER_REPEAT_INTERVAL: 5000
};

// Configuration des sons - VOS FICHIERS
const SOUND_FILES = {
    'suara': '/sounds/suara.mp3',           // Son suara
    'college': '/sounds/college.mp3',         // Son collège  
    'pixel': '/sounds/pixel.mp3',            // Son pixel/rétro
    'modern': '/sounds/modern.mp3',            // Son modern
    'ringtone': '/sounds/ringtone.mp3'       // Sonnerie classique
};

function getThemeColors() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'rouge';
    
    const themes = {
        'rouge': {
            primary: '#841b0a',
            secondary: '#a92317',
            accent: '#c62828',
            light: 'rgba(255, 255, 255, 0.9)',
            dark: 'rgba(255, 255, 255, 0.2)'
        },
        'dark': {
            primary: '#212121',
            secondary: '#424242',
            accent: '#616161',
            light: '#ffffff',
            dark: 'rgba(255, 255, 255, 0.1)'
        },
        'bleuciel': {
            primary: '#1976d2',
            secondary: '#42a5f5',
            accent: '#64b5f6',
            light: 'rgba(255, 255, 255, 0.9)',
            dark: 'rgba(255, 255, 255, 0.2)'
        },
        'light': {
            primary: '#7b1fa2',
            secondary: '#ab47bc',
            accent: '#ce93d8',
            light: 'rgba(255, 255, 255, 0.9)',
            dark: 'rgba(255, 255, 255, 0.2)'
        }
    };
    
    return themes[currentTheme] || themes['rouge'];
}

// ✅ ========== FONCTIONS DE PERSISTANCE AJOUTÉES (NOUVELLES) ==========

// Fonctions de sauvegarde et restauration
function saveAlarmState() {
    const alarmState = {
        alarmTime: alarmTime,
        alarmProgrammed: window.alarmProgrammed || false,
        selectedAlarmSound: window.selectedAlarmSound || 'suara',
        timestamp: Date.now()
    };
    localStorage.setItem('alarmState', JSON.stringify(alarmState));
}

function saveTimerState() {
    if (timerInterval && timerSeconds > 0) {
        const timerState = {
            remainingSeconds: timerSeconds,
            selectedTimerSound: window.selectedTimerSound || 'suara',
            isActive: true,
            timestamp: Date.now()
        };
        localStorage.setItem('timerState', JSON.stringify(timerState));
    } else {
        localStorage.removeItem('timerState');
    }
}

function restoreAlarmState() {
    try {
        const savedState = localStorage.getItem('alarmState');
        if (savedState) {
            const alarmState = JSON.parse(savedState);
            
            // Vérifier que la sauvegarde n'est pas trop ancienne (24h max)
            const hoursSinceGave = (Date.now() - alarmState.timestamp) / (1000 * 60 * 60);
            if (hoursSinceGave > 24) {
                localStorage.removeItem('alarmState');
                return;
            }
            
            // Restaurer l'alarme
            if (alarmState.alarmTime && alarmState.alarmProgrammed) {
                alarmTime = alarmState.alarmTime;
                window.alarmProgrammed = true;
                window.selectedAlarmSound = alarmState.selectedAlarmSound;
                
                // Redémarrer la surveillance
                startAlarmChecker();
                updateClockIndicator();
                
                // Afficher notification de restauration
                showRestoreNotification('⏰ Alarme restaurée', `Programmée pour ${alarmTime}`);
            }
        }
    } catch (error) {
        localStorage.removeItem('alarmState');
    }
}

function restoreTimerState() {
    try {
        const savedState = localStorage.getItem('timerState');
        if (savedState) {
            const timerState = JSON.parse(savedState);
            
            // Calculer le temps écoulé depuis la sauvegarde
            const elapsedSeconds = Math.floor((Date.now() - timerState.timestamp) / 1000);
            const remainingSeconds = timerState.remainingSeconds - elapsedSeconds;
            
            // Si il reste du temps, restaurer le minuteur
            if (remainingSeconds > 0 && timerState.isActive) {
                timerSeconds = remainingSeconds;
                window.selectedTimerSound = timerState.selectedTimerSound;
                
                // Redémarrer le minuteur
                startTimerFromRestore();
                
                const minutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60;
                
                // Afficher notification de restauration
                showRestoreNotification('⏱️ Minuteur restauré', `${minutes}:${seconds.toString().padStart(2, '0')} restant`);
            } else {
                // Temps écoulé, supprimer la sauvegarde
                localStorage.removeItem('timerState');
            }
        }
    } catch (error) {
        localStorage.removeItem('timerState');
    }
}

function startTimerFromRestore() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timerInterval = setInterval(() => {
        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            localStorage.removeItem('timerState');
            
            // Supprimer l'indicateur flottant
            const timerFloating = document.getElementById('timerFloating');
            if (timerFloating) {
                timerFloating.remove();
            }
            
            triggerTimerAlarm();
            return;
        }
        
        // Mettre à jour l'affichage
        updateTimerStatus();
        
        // Sauvegarder l'état régulièrement
        saveTimerState();
        
        timerSeconds--;
    }, 1000);
}

function showRestoreNotification(title, message) {
    const colors = getThemeColors();
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(145deg, ${colors.primary}, ${colors.secondary});
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        z-index: 10002;
        font-weight: bold;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        text-align: center;
        border: 2px solid ${colors.dark};
        min-width: 250px;
        animation: slideInDown 0.5s ease;
    `;
    
    notification.innerHTML = `
        <div style="font-size: 16px; margin-bottom: 5px;">${title}</div>
        <div style="font-size: 14px; opacity: 0.9;">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Supprimer après 4 secondes
    setTimeout(() => {
        notification.style.animation = 'slideOutUp 0.5s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 4000);
}

// ✅ ========== TOUTES VOS CLASSES ET FONCTIONS EXISTANTES (CONSERVÉES) ==========

class NewsWidget {
    constructor() {
        this.isLoaded = false;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    // Initialiser le widget
    init() {
        // Attendre que Supabase soit disponible
        this.waitForSupabase();
    }

    // Attendre que Supabase soit disponible
    waitForSupabase() {
        if (typeof window.getSupabaseClient === 'function') {
            console.log('📰 Initialisation du widget NEWS');
            this.loadNews();
        } else if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`⏳ Attente de Supabase... (tentative ${this.retryCount}/${this.maxRetries})`);
            setTimeout(() => this.waitForSupabase(), 1000);
        } else {
            console.error('❌ Impossible de charger Supabase pour le widget NEWS');
            this.showError('Service temporairement indisponible');
        }
    }

    // Charger et afficher les actualités
    async loadNews() {
    try {
        const supabase = window.getSupabaseClient();
        if (!supabase) {
            throw new Error('Client Supabase non disponible');
        }

        // Récupérer toutes les actualités publiées (pas de limite)
        const { data: news, error } = await supabase
            .from('local_news')
            .select('id, title, content, created_at, featured')
            .eq('is_published', true)
            .order('featured', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        const previewContainer = document.getElementById('newsWidgetPreview');

        if (news && news.length > 0) {
            
            // Afficher les actualités avec liens spécifiques
            previewContainer.innerHTML = news.map(item => {
                const featuredIcon = item.featured ? '⭐ ' : '';
                const shortContent = this.truncateText(item.content, 60);
                return `
                    <div class="news-preview-item" data-news-id="${item.id}" onclick="openSpecificNews(${item.id})" style="cursor: pointer;">
                        <strong>${featuredIcon}${item.title}</strong><br>
                        <span style="font-size: 13px;">${shortContent}...</span>
                    </div>
                `;
            }).join('');

            // ✅ SUPPRIMÉ : Plus besoin de mettre à jour newsWidgetCount
            
            this.isLoaded = true;
            console.log(`✅ Widget NEWS chargé: ${news.length} actualités affichées`);
        } else {
            // Aucune actualité
            this.showEmptyState();
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement des actualités:', error);
        this.showError('Erreur de chargement');
    }
}

    // Afficher l'état vide
    showEmptyState() {
    const previewContainer = document.getElementById('newsWidgetPreview');
    
    previewContainer.innerHTML = `
        <div class="news-preview-item">
            <strong>📰 Premières actualités bientôt disponibles</strong><br>
            Les actualités locales de Montceau-les-Mines et environs apparaîtront ici.
        </div>
    `;
    
    // ✅ SUPPRIMÉ : Plus de compteur de news
}

    // Afficher une erreur
    showError(message) {
        const previewContainer = document.getElementById('newsWidgetPreview');
        if (previewContainer) {
            previewContainer.innerHTML = `
                <div class="loading-news">
                    <span class="material-icons">error</span>
                    ${message}
                </div>
            `;
        }
    }

    // Tronquer le texte
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim();
    }

    // ✅ UNE SEULE version de openNewsPage
    openNewsPage() {
        const widget = document.getElementById('localNewsWidget');
        if (widget) {
            // Animation de clic
            widget.style.transform = 'scale(0.98)';
            
            // Vibration tactile si disponible
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            setTimeout(() => {
                widget.style.transform = 'translateY(-2px)';
                // Redirection vers la page des actualités
                window.location.href = 'news-locale.html';
            }, 150);
        }
    }

    // NOUVELLE FONCTION - Ajoutez ceci juste après la fonction ci-dessus
    openSpecificNews(newsId) {
        // Animation de clic
        event.stopPropagation(); // Empêche l'ouverture du widget général
        
        // Vibration tactile si disponible
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Redirection avec l'ID de l'actualité
        window.location.href = `news-locale.html#news-${newsId}`;
    }
    
    // Recharger les actualités
    async refresh() {
        console.log('🔄 Rechargement du widget NEWS...');
        const previewContainer = document.getElementById('newsWidgetPreview');
        
        // Afficher le loader
        previewContainer.innerHTML = `
            <div class="loading-news">
                <span class="material-icons spinning">hourglass_empty</span>
                Actualisation...
            </div>
        `;
        
        // Recharger
        await this.loadNews();
    }
}

// Instance globale du widget
let newsWidget = null;

// ✅ UNE SEULE version de openLocalNewsPage
function openLocalNewsPage() {
    if (newsWidget) {
        newsWidget.openNewsPage();
    }
}

// ✅ UNE SEULE version de openSpecificNews globale
function openSpecificNews(newsId) {
    if (event) {
        event.stopPropagation();
    }
    
    // Vibration tactile si disponible
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    // Redirection avec l'ID de l'actualité
    window.location.href = `news-locale.html#news-${newsId}`;
}

// Fonction pour mettre à jour l'horloge
function updateClock() {
    const now = new Date();
    const timeElement = document.getElementById('clockTime');
    const dateElement = document.getElementById('clockDate');
    
    if (timeElement && dateElement) {
        // Format heure : 14:23
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        timeElement.textContent = `${hours}:${minutes}`;
        
        // Format date : Ven 13
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const dayName = days[now.getDay()];
        const dayNumber = now.getDate();
        dateElement.textContent = `${dayName} ${dayNumber}`;
        
        // ✅ NOUVEAU : Mettre à jour le titre par défaut de l'horloge
        const clockElement = document.getElementById('newsWidgetClock');
        if (clockElement && !alarmTime) {
            clockElement.title = '🕐 Horloge interactive • Cliquez pour alarme & minuteur';
        }
    }
}

// Démarrer l'horloge
function initClock() {
    updateClock(); // Mise à jour immédiate
    setInterval(updateClock, 1000); // Mise à jour chaque seconde
    
    // ✅ NOUVEAU : Initialiser le titre de l'horloge
    setTimeout(() => {
        const clockElement = document.getElementById('newsWidgetClock');
        if (clockElement) {
            clockElement.title = 'Horloge • Cliquez pour alarme & minuteur ⏰';
        }
    }, 100);
}

// Fonction pour ouvrir la galerie photos
function openGalleryPage() {
    // Arrêter la propagation pour éviter d'ouvrir le widget news
    if (event) {
        event.stopPropagation();
    }
    
    // Vibration tactile si disponible
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    // Redirection vers votre page galerie
    window.location.href = 'photos-gallery.html';
    
    console.log('📸 Bouton Photos cliqué');
}

// Fonction pour ouvrir le widget cinéma (version mobile)
function openCinemaModal() {
    // Arrêter la propagation pour éviter d'ouvrir le widget news
    if (event) {
        event.stopPropagation();
    }
    
    // Vibration tactile si disponible
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    // Ouvrir la modal cinéma mobile directement
    const modal = document.getElementById('cinemaMobileModal');
    const modalContent = document.getElementById('cinemaModalContent');
    
    if (modal && modalContent) {
        // Afficher la modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        console.log('🎬 Modal cinéma ouverte depuis le bouton header');
        
        // Copier le contenu du widget cinéma
        const cinemaWidgetPreview = document.getElementById('cinemaWidgetPreview');
        if (cinemaWidgetPreview) {
            modalContent.innerHTML = `
                ${cinemaWidgetPreview.innerHTML}
                <div class="cinema-footer-button-home">
                    <button onclick="goBackHome()" class="cinema-home-button">
                        <span class="material-icons">home</span>
                        <span>Retour à l'accueil</span>
                    </button>
                </div>
            `;
        }
        
        // Événements de fermeture
        const modalClose = document.getElementById('cinemaModalClose');
        if (modalClose) {
            modalClose.onclick = () => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            };
        }
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
        };
        
    } else {
        console.warn('Modal cinéma introuvable');
        window.open('https://www.cinemacapitole-montceau.fr/horaires/', '_blank');
    }
}

// Variables globales pour la météo et les visiteurs
let currentTemp = '--°';
let visitorsCount = 0;

// ✅ REMPLACEZ la fonction fetchTemperature() dans news-widget.js par celle-ci :

async function fetchTemperature() {
    try {
        // ✅ Utiliser la même API que votre widget météo
        const apiKey = "4b79472c165b42f690790252242112";
        const city = "Montceau-les-Mines";
        const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&lang=fr`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.current && data.current.temp_c !== undefined) {
            currentTemp = Math.round(data.current.temp_c) + '°';
            const tempElement = document.getElementById('tempValue');
            if (tempElement) {
                tempElement.textContent = currentTemp;
            }
            console.log(`🌡️ Vraie température Montceau (WeatherAPI): ${currentTemp}`);
        } else {
            throw new Error('Données météo indisponibles');
        }
        
    } catch (error) {
        console.log('❌ Impossible de récupérer la météo WeatherAPI:', error);
        
        // ✅ Fallback vers OpenMeteo si WeatherAPI échoue
        try {
            const fallbackUrl = 'https://api.open-meteo.com/v1/forecast?latitude=46.6747&longitude=4.3736&current_weather=true&timezone=Europe/Paris';
            const fallbackResponse = await fetch(fallbackUrl);
            const fallbackData = await fallbackResponse.json();
            
            if (fallbackData.current_weather && fallbackData.current_weather.temperature !== undefined) {
                currentTemp = Math.round(fallbackData.current_weather.temperature) + '°';
                const tempElement = document.getElementById('tempValue');
                if (tempElement) {
                    tempElement.textContent = currentTemp;
                }
                console.log(`🌡️ Température Montceau (OpenMeteo fallback): ${currentTemp}`);
            } else {
                throw new Error('Données météo de secours indisponibles');
            }
            
        } catch (fallbackError) {
            console.log('❌ Impossible de récupérer la météo de secours:', fallbackError);
            // Masquer le widget météo si tout échoue
            const weatherWidget = document.getElementById('weatherTemp');
            if (weatherWidget) {
                weatherWidget.style.display = 'none';
                console.log('🌡️ Widget météo masqué');
            }
        }
    }
}

// ✅ ALTERNATIVE : Si vous préférez partager les données entre les deux widgets

// Fonction pour récupérer les données météo une seule fois et les partager
async function getSharedWeatherData() {
    try {
        const apiKey = "4b79472c165b42f690790252242112";
        const city = "Montceau-les-Mines";
        const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&lang=fr`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.current) {
            // Sauvegarder globalement pour partage
            window.sharedWeatherData = {
                temperature: Math.round(data.current.temp_c),
                condition: data.current.condition.text,
                humidity: data.current.humidity,
                wind: Math.round(data.current.wind_kph),
                lastUpdate: new Date().getTime()
            };
            
            return window.sharedWeatherData;
        }
        
        throw new Error('Données météo indisponibles');
        
    } catch (error) {
        console.log('❌ Erreur météo partagée:', error);
        return null;
    }
}

// ✅ Version optimisée de fetchTemperature utilisant les données partagées
async function fetchTemperatureOptimized() {
    try {
        // Vérifier si on a des données récentes (moins de 5 minutes)
        const now = new Date().getTime();
        if (window.sharedWeatherData && 
            (now - window.sharedWeatherData.lastUpdate) < 300000) { // 5 minutes
            
            // Utiliser les données en cache
            currentTemp = window.sharedWeatherData.temperature + '°';
            const tempElement = document.getElementById('tempValue');
            if (tempElement) {
                tempElement.textContent = currentTemp;
            }
            console.log(`🌡️ Température en cache: ${currentTemp}`);
            return;
        }
        
        // Récupérer de nouvelles données
        const weatherData = await getSharedWeatherData();
        if (weatherData) {
            currentTemp = weatherData.temperature + '°';
            const tempElement = document.getElementById('tempValue');
            if (tempElement) {
                tempElement.textContent = currentTemp;
            }
            console.log(`🌡️ Nouvelle température: ${currentTemp}`);
        } else {
            throw new Error('Impossible de récupérer les données météo');
        }
        
    } catch (error) {
        console.log('❌ Erreur température optimisée:', error);
        // Masquer le widget si échec
        const weatherWidget = document.getElementById('weatherTemp');
        if (weatherWidget) {
            weatherWidget.style.display = 'none';
        }
    }
}

// ===== SAINT DU JOUR =====
async function fetchSaintDuJour() {
    try {
        const today = new Date();
        const saintName = getSaintFromLocalDB(today.getMonth() + 1, today.getDate());
        updateSaintDisplay(saintName);
        console.log(`🎂 Saint du jour : ${saintName}`);
    } catch (error) {
        console.log('⚠️ Erreur saint du jour:', error);
    }
}

// ===== POPUP BONNE FÊTE =====
function openSaintPopup() {
    if (event) {
        event.stopPropagation();
    }
    
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    const saintWidget = document.getElementById('saintWidget');
    const saintName = saintWidget ? saintWidget.dataset.fullName : 'tous les saints';
    
    showSaintPopup(saintName);
}

function showSaintPopup(saintName) {
    const colors = getThemeColors();
    const today = new Date();
    
    // Supprimer popup existante
    const existing = document.getElementById('saintPopup');
    if (existing) existing.remove();
    
    // Créer la popup
    const popup = document.createElement('div');
    popup.id = 'saintPopup';
    popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
        animation: fadeIn 0.3s ease;
        padding: 10px;
        overflow-y: auto;
    `;
    
    popup.innerHTML = `
        <div class="saint-popup-content" style="
            background: linear-gradient(145deg, ${colors.primary}, ${colors.secondary});
            border: 3px solid ${colors.accent};
            border-radius: 20px;
            padding: 25px;
            max-width: 500px;
            width: 95%;
            max-height: 90vh;
            color: white;
            text-align: center;
            box-shadow: 0 15px 40px rgba(0,0,0,0.5);
            animation: slideInUp 0.4s ease;
            overflow-y: auto;
        ">
            <!-- En-tête -->
            <div style="margin-bottom: 20px;">
                <div style="font-size: 50px; margin-bottom: 15px;">🎂</div>
                <h2 style="margin: 0 0 10px 0; font-size: 22px; font-weight: bold;">
                    Bonne fête ${saintName} !
                </h2>
                <p style="margin: 10px 0; font-size: 14px; opacity: 0.95;">
                    Aujourd'hui : ${today.toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                    })}
                </p>
            </div>
            
            <!-- Calendrier -->
            <div id="saintCalendar" style="
                background: rgba(255,255,255,0.15);
                border-radius: 15px;
                padding: 15px;
                margin: 20px 0;
            ">
                <!-- Le calendrier sera injecté ici -->
            </div>
            
            <button onclick="closeSaintPopup()" style="
                background: white;
                color: ${colors.primary};
                border: none;
                padding: 12px 30px;
                border-radius: 25px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                margin-top: 10px;
                transition: all 0.3s ease;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                Fermer
            </button>
        </div>
    `;
    
    // Fermer au clic sur l'overlay
    popup.onclick = (e) => {
        if (e.target === popup) {
            closeSaintPopup();
        }
    };
    
    // Empêcher la fermeture au clic sur le contenu
    const content = popup.querySelector('.saint-popup-content');
    content.onclick = (e) => {
        e.stopPropagation();
    };
    
    document.body.appendChild(popup);
    
    // Générer le calendrier
    generateSaintCalendar(today);
    
    console.log(`🎂 Popup calendrier des saints ouverte`);
}

// ===== GÉNÉRATION DU CALENDRIER =====
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

function generateSaintCalendar(date) {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    currentCalendarMonth = month;
    currentCalendarYear = year;
    
    const today = new Date();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    const colors = getThemeColors();
    
    let calendarHTML = `
        <!-- Navigation du mois -->
        <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding: 0 5px;
        ">
            <button onclick="changeCalendarMonth(-1)" style="
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                border-radius: 50%;
                width: 35px;
                height: 35px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 18px;
                transition: all 0.3s ease;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                ◀
            </button>
            
            <h3 style="
                margin: 0;
                font-size: 18px;
                font-weight: bold;
            ">
                ${monthNames[month]} ${year}
            </h3>
            
            <button onclick="changeCalendarMonth(1)" style="
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                border-radius: 50%;
                width: 35px;
                height: 35px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 18px;
                transition: all 0.3s ease;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                ▶
            </button>
        </div>
        
        <!-- Grille des jours -->
        <div style="
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 5px;
            margin-bottom: 10px;
        ">
    `;
    
    // En-têtes des jours
    dayNames.forEach(day => {
        calendarHTML += `
            <div style="
                font-size: 11px;
                font-weight: bold;
                padding: 5px 2px;
                opacity: 0.8;
            ">${day}</div>
        `;
    });
    
    // Cases vides avant le premier jour
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarHTML += `<div style="min-height: 50px;"></div>`;
    }
    
    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
        const saintName = getSaintFromLocalDB(month + 1, day);
        const isToday = (
            day === today.getDate() && 
            month === today.getMonth() && 
            year === today.getFullYear()
        );
        
        const cellStyle = isToday 
            ? `background: rgba(255,255,255,0.4); border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);`
            : `background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2);`;
        
        calendarHTML += `
            <div style="
                ${cellStyle}
                border-radius: 8px;
                padding: 8px 4px;
                min-height: 50px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                transition: all 0.2s ease;
                cursor: pointer;
            " 
            onmouseover="this.style.background='rgba(255,255,255,0.35)'; this.style.transform='scale(1.05)'"
            onmouseout="this.style.background='${isToday ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}'; this.style.transform='scale(1)'"
            title="${saintName}">
                <div style="
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 3px;
                ">${day}</div>
                <div style="
                    font-size: 9px;
                    line-height: 1.1;
                    text-align: center;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    max-width: 100%;
                    opacity: 0.9;
                ">${saintName}</div>
            </div>
        `;
    }
    
    calendarHTML += `</div>`;
    
    // Légende
    calendarHTML += `
        <div style="
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid rgba(255,255,255,0.3);
            font-size: 12px;
            opacity: 0.9;
        ">
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <div style="
                    width: 15px;
                    height: 15px;
                    background: rgba(255,255,255,0.4);
                    border: 2px solid white;
                    border-radius: 3px;
                "></div>
                <span>Aujourd'hui</span>
            </div>
        </div>
    `;
    
    const calendarDiv = document.getElementById('saintCalendar');
    if (calendarDiv) {
        calendarDiv.innerHTML = calendarHTML;
    }
}

function changeCalendarMonth(direction) {
    currentCalendarMonth += direction;
    
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    } else if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    
    const newDate = new Date(currentCalendarYear, currentCalendarMonth, 1);
    generateSaintCalendar(newDate);
}

function closeSaintPopup() {
    const popup = document.getElementById('saintPopup');
    if (popup) {
        popup.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 300);
    }
}

function updateSaintDisplay(saintName) {
    // ✅ NOUVEAUX IDs pour le footer
    const saintElement = document.getElementById('saintValue');
    const saintLabel = document.getElementById('saintLabel');
    const saintWidget = document.getElementById('saintWidget');
    
    if (saintElement && saintLabel) {
        // Afficher le nom complet
        saintElement.textContent = saintName;
        saintLabel.textContent = 'Bonne fête';
        
        // Stocker le nom complet pour la popup
        if (saintWidget) {
            saintWidget.dataset.fullName = saintName;
        }
        
        console.log(`🎂 Saint du jour mis à jour : ${saintName}`);
    } else {
        console.error('❌ Éléments saint introuvables dans le footer');
    }
}

// Base de données complète des saints
function getSaintFromLocalDB(month, day) {
    const saints = {
        // JANVIER
        '1-1': 'Marie', '1-2': 'Basile', '1-3': 'Geneviève', '1-4': 'Odilon',
        '1-5': 'Édouard', '1-6': 'Mélaine', '1-7': 'Raymond', '1-8': 'Lucien',
        '1-9': 'Alix', '1-10': 'Guillaume', '1-11': 'Paulin', '1-12': 'Tatiana',
        '1-13': 'Yvette', '1-14': 'Nina', '1-15': 'Rémi', '1-16': 'Marcel',
        '1-17': 'Roseline', '1-18': 'Prisca', '1-19': 'Marius', '1-20': 'Sébastien',
        '1-21': 'Agnès', '1-22': 'Vincent', '1-23': 'Barnard', '1-24': 'François',
        '1-25': 'Paul', '1-26': 'Paule', '1-27': 'Angèle', '1-28': 'Thomas',
        '1-29': 'Gildas', '1-30': 'Martine', '1-31': 'Marcelle',
        
        // FÉVRIER
        '2-1': 'Ella', '2-2': 'Théophane', '2-3': 'Blaise', '2-4': 'Véronique',
        '2-5': 'Agathe', '2-6': 'Gaston', '2-7': 'Eugénie', '2-8': 'Jacqueline',
        '2-9': 'Apolline', '2-10': 'Arnaud', '2-11': 'Héloïse', '2-12': 'Félix',
        '2-13': 'Béatrice', '2-14': 'Valentin', '2-15': 'Claude', '2-16': 'Julienne',
        '2-17': 'Alexis', '2-18': 'Bernadette', '2-19': 'Gabin', '2-20': 'Aimée',
        '2-21': 'Damien', '2-22': 'Isabelle', '2-23': 'Lazare', '2-24': 'Modeste',
        '2-25': 'Roméo', '2-26': 'Nestor', '2-27': 'Honorine', '2-28': 'Romain',
        '2-29': 'Auguste',
        
        // MARS
        '3-1': 'Aubin', '3-2': 'Charles', '3-3': 'Guénolé', '3-4': 'Casimir',
        '3-5': 'Olive', '3-6': 'Colette', '3-7': 'Félicité', '3-8': 'Jean',
        '3-9': 'Françoise', '3-10': 'Vivien', '3-11': 'Rosine', '3-12': 'Justine',
        '3-13': 'Rodrigue', '3-14': 'Mathilde', '3-15': 'Louise', '3-16': 'Bénédicte',
        '3-17': 'Patrick', '3-18': 'Cyrille', '3-19': 'Joseph', '3-20': 'Herbert',
        '3-21': 'Clémence', '3-22': 'Léa', '3-23': 'Victorien', '3-24': 'Catherine',
        '3-25': 'Humbert', '3-26': 'Larissa', '3-27': 'Habib', '3-28': 'Gontran',
        '3-29': 'Gwladys', '3-30': 'Amédée', '3-31': 'Benjamin',
        
        // AVRIL
        '4-1': 'Hugues', '4-2': 'Sandrine', '4-3': 'Richard', '4-4': 'Isidore',
        '4-5': 'Irène', '4-6': 'Marcellin', '4-7': 'Jean-Baptiste', '4-8': 'Julie',
        '4-9': 'Gautier', '4-10': 'Fulbert', '4-11': 'Stanislas', '4-12': 'Jules',
        '4-13': 'Ida', '4-14': 'Maxime', '4-15': 'Paterne', '4-16': 'Benoît-Joseph',
        '4-17': 'Anicet', '4-18': 'Parfait', '4-19': 'Emma', '4-20': 'Odette',
        '4-21': 'Anselme', '4-22': 'Alexandre', '4-23': 'Georges', '4-24': 'Fidèle',
        '4-25': 'Marc', '4-26': 'Alida', '4-27': 'Zita', '4-28': 'Valérie',
        '4-29': 'Catherine', '4-30': 'Robert',
        
        // MAI
        '5-1': 'Fête du Travail', '5-2': 'Boris', '5-3': 'Philippe', '5-4': 'Sylvain',
        '5-5': 'Judith', '5-6': 'Prudence', '5-7': 'Gisèle', '5-8': 'Victoire 1945',
        '5-9': 'Pacôme', '5-10': 'Solange', '5-11': 'Estelle', '5-12': 'Achille',
        '5-13': 'Rolande', '5-14': 'Matthias', '5-15': 'Denise', '5-16': 'Honoré',
        '5-17': 'Pascal', '5-18': 'Éric', '5-19': 'Yves', '5-20': 'Bernardin',
        '5-21': 'Constantin', '5-22': 'Émile', '5-23': 'Didier', '5-24': 'Donatien',
        '5-25': 'Sophie', '5-26': 'Bérenger', '5-27': 'Augustin', '5-28': 'Germain',
        '5-29': 'Aymar', '5-30': 'Ferdinand', '5-31': 'Pétronille',
        
        // JUIN
        '6-1': 'Justin', '6-2': 'Blandine', '6-3': 'Kévin', '6-4': 'Clotilde',
        '6-5': 'Igor', '6-6': 'Norbert', '6-7': 'Gilbert', '6-8': 'Médard',
        '6-9': 'Diane', '6-10': 'Landry', '6-11': 'Barnabé', '6-12': 'Guy',
        '6-13': 'Antoine', '6-14': 'Élisée', '6-15': 'Germaine', '6-16': 'Jean-François',
        '6-17': 'Hervé', '6-18': 'Léonce', '6-19': 'Romuald', '6-20': 'Silvère',
        '6-21': 'Rodolphe', '6-22': 'Alban', '6-23': 'Audrey', '6-24': 'Jean-Baptiste',
        '6-25': 'Prosper', '6-26': 'Anthelme', '6-27': 'Fernand', '6-28': 'Irénée',
        '6-29': 'Pierre', '6-30': 'Martial',
        
        // JUILLET
        '7-1': 'Thierry', '7-2': 'Martinien', '7-3': 'Thomas', '7-4': 'Florent',
        '7-5': 'Antoine', '7-6': 'Mariette', '7-7': 'Raoul', '7-8': 'Thibault',
        '7-9': 'Amandine', '7-10': 'Ulrich', '7-11': 'Benoît', '7-12': 'Olivier',
        '7-13': 'Henri', '7-14': 'Fête Nationale', '7-15': 'Donald', '7-16': 'Carmen',
        '7-17': 'Charlotte', '7-18': 'Frédéric', '7-19': 'Arsène', '7-20': 'Marina',
        '7-21': 'Victor', '7-22': 'Marie-Madeleine', '7-23': 'Brigitte', '7-24': 'Christine',
        '7-25': 'Jacques', '7-26': 'Anne', '7-27': 'Nathalie', '7-28': 'Samson',
        '7-29': 'Marthe', '7-30': 'Juliette', '7-31': 'Ignace',
        
        // AOÛT
        '8-1': 'Alphonse', '8-2': 'Julien', '8-3': 'Lydie', '8-4': 'Jean-Marie',
        '8-5': 'Abel', '8-6': 'Transfiguration', '8-7': 'Gaëtan', '8-8': 'Dominique',
        '8-9': 'Amour', '8-10': 'Laurent', '8-11': 'Claire', '8-12': 'Clarisse',
        '8-13': 'Hippolyte', '8-14': 'Évrard', '8-15': 'Marie', '8-16': 'Armel',
        '8-17': 'Hyacinthe', '8-18': 'Hélène', '8-19': 'Jean', '8-20': 'Bernard',
        '8-21': 'Christophe', '8-22': 'Fabrice', '8-23': 'Rose', '8-24': 'Barthélémy',
        '8-25': 'Louis', '8-26': 'Natacha', '8-27': 'Monique', '8-28': 'Augustin',
        '8-29': 'Sabine', '8-30': 'Fiacre', '8-31': 'Aristide',
        
        // SEPTEMBRE
        '9-1': 'Gilles', '9-2': 'Ingrid', '9-3': 'Grégoire', '9-4': 'Rosalie',
        '9-5': 'Raïssa', '9-6': 'Bertrand', '9-7': 'Reine', '9-8': 'Nativité',
        '9-9': 'Alain', '9-10': 'Inès', '9-11': 'Adelphe', '9-12': 'Apollinaire',
        '9-13': 'Aimé', '9-14': 'Croix', '9-15': 'Roland', '9-16': 'Édith',
        '9-17': 'Renaud', '9-18': 'Nadège', '9-19': 'Émilie', '9-20': 'Davy',
        '9-21': 'Matthieu', '9-22': 'Maurice', '9-23': 'Constant', '9-24': 'Thècle',
        '9-25': 'Hermann', '9-26': 'Côme', '9-27': 'Vincent', '9-28': 'Venceslas',
        '9-29': 'Michel', '9-30': 'Jérôme',
        
        // OCTOBRE
        '10-1': 'Thérèse', '10-2': 'Léger', '10-3': 'Gérard', '10-4': 'François',
        '10-5': 'Fleur', '10-6': 'Bruno', '10-7': 'Serge', '10-8': 'Pélagie',
        '10-9': 'Denis', '10-10': 'Ghislain', '10-11': 'Firmin', '10-12': 'Wilfried',
        '10-13': 'Géraud', '10-14': 'Juste', '10-15': 'Thérèse', '10-16': 'Edwige',
        '10-17': 'Baudouin', '10-18': 'Luc', '10-19': 'René', '10-20': 'Adeline',
        '10-21': 'Céline', '10-22': 'Élodie', '10-23': 'Jean', '10-24': 'Florentin',
        '10-25': 'Crépin', '10-26': 'Dimitri', '10-27': 'Émeline', '10-28': 'Simon',
        '10-29': 'Narcisse', '10-30': 'Bienvenue', '10-31': 'Quentin',
        
        // NOVEMBRE
        '11-1': 'Toussaint', '11-2': 'Défunts', '11-3': 'Hubert', '11-4': 'Charles',
        '11-5': 'Sylvie', '11-6': 'Bertille', '11-7': 'Carine', '11-8': 'Geoffroy',
        '11-9': 'Théodore', '11-10': 'Léon', '11-11': 'Martin', '11-12': 'Christian',
        '11-13': 'Brice', '11-14': 'Sidoine', '11-15': 'Albert', '11-16': 'Marguerite',
        '11-17': 'Élisabeth', '11-18': 'Aude', '11-19': 'Tanguy', '11-20': 'Edmond',
        '11-21': 'Rufus', '11-22': 'Cécile', '11-23': 'Clément', '11-24': 'Flora',
        '11-25': 'Catherine', '11-26': 'Delphine', '11-27': 'Séverin', '11-28': 'Jacques',
        '11-29': 'Saturnin', '11-30': 'André',
        
        // DÉCEMBRE
        '12-1': 'Florence', '12-2': 'Viviane', '12-3': 'Xavier', '12-4': 'Barbara',
        '12-5': 'Gérald', '12-6': 'Nicolas', '12-7': 'Ambroise', '12-8': 'Immaculée',
        '12-9': 'Pierre', '12-10': 'Romaric', '12-11': 'Daniel', '12-12': 'Jeanne',
        '12-13': 'Lucie', '12-14': 'Odile', '12-15': 'Ninon', '12-16': 'Alice',
        '12-17': 'Gaël', '12-18': 'Gatien', '12-19': 'Urbain', '12-20': 'Théophile',
        '12-21': 'Pierre', '12-22': 'Françoise', '12-23': 'Armand', '12-24': 'Adèle',
        '12-25': 'Noël', '12-26': 'Étienne', '12-27': 'Jean', '12-28': 'Innocents',
        '12-29': 'David', '12-30': 'Roger', '12-31': 'Sylvestre'
    };
    
    const key = `${month}-${day}`;
    return saints[key] || 'Tous les saints';
}

// Fonction pour récupérer les VRAIS visiteurs (version corrigée)
// ✅ GARDER - Fonction de comptage simple
async function updateVisitorsCount() {
    try {
        if (window.getSupabaseClient) {
            const supabase = window.getSupabaseClient();
            
            let deviceId = localStorage.getItem('deviceId');
            if (!deviceId) {
                deviceId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('deviceId', deviceId);
            }
            
            await supabase
                .from('active_visitors')
                .upsert({
                    device_id: deviceId,
                    last_seen: new Date().toISOString(),
                    page_url: window.location.href
                }, {
                    onConflict: 'device_id'
                });
            
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            await supabase
                .from('active_visitors')
                .delete()
                .lt('last_seen', fiveMinutesAgo);
            
            const { count } = await supabase
                .from('active_visitors')
                .select('*', { count: 'exact', head: true })
                .gte('last_seen', fiveMinutesAgo);
            
            if (count !== null) {
                visitorsCount = count;
                const element = document.getElementById('visitorsCount');
                if (element) {
                    element.textContent = visitorsCount;
                }
            }
        }
    } catch (error) {
        console.log('Erreur comptage visiteurs:', error);
    }
}

// ✅ GARDER - Nettoyage
async function cleanupInactiveVisitors() {
    try {
        if (window.getSupabaseClient) {
            const supabase = window.getSupabaseClient();
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
            
            await supabase
                .from('active_visitors')
                .delete()
                .lt('last_seen', tenMinutesAgo);
        }
    } catch (error) {
        console.log('Erreur nettoyage:', error);
    }
}

// ✅ GARDER - Debug
async function debugVisitors() {
    try {
        if (window.getSupabaseClient) {
            const supabase = window.getSupabaseClient();
            
            const { data: allVisitors } = await supabase
                .from('active_visitors')
                .select('*')
                .order('last_seen', { ascending: false });
            
            console.log('📊 VISITEURS:', allVisitors);
            
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const { data: activeVisitors } = await supabase
                .from('active_visitors')
                .select('*')
                .gte('last_seen', fiveMinutesAgo);
            
            console.log('🟢 ACTIFS:', activeVisitors?.length || 0);
        }
    } catch (error) {
        console.error('Erreur debug:', error);
    }
}

// ===== SECTION ALARME & MINUTEUR =====

// Fonction pour créer une alarme intégrée
function openTimeWidget() {
    if (event) {
        event.stopPropagation();
    }
    
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    // Créer une popup HTML personnalisée
    createAlarmPopup();
    
    console.log('⏰ Alarme intégrée ouverte');
}

// Fonction pour créer la popup d'alarme personnalisée
function createAlarmPopup() {
    // Démarrer la surveillance d'alarme dès l'ouverture
    startAlarmChecker();
    
    // Empêcher la propagation d'événements
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('alarm-popup-overlay')) {
            e.stopPropagation();
        }
    });
    
    // Supprimer popup existante si présente
    const existingPopup = document.getElementById('alarmPopup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Créer la popup
    const popup = document.createElement('div');
    popup.id = 'alarmPopup';
    popup.innerHTML = `
        <div class="alarm-popup-overlay" onclick="event.stopPropagation()">
            <div class="alarm-popup-content">
                <div class="alarm-header">
                    <h3>⏰ Alarme & Minuteur</h3>
                    <button class="alarm-close" onclick="closeAlarmPopup()">✕</button>
                </div>
                
                <div class="current-time" id="currentTimeDisplay">--:--:--</div>
                
                <div class="alarm-section">
                    <h4>🔔 Alarme</h4>
                    <div class="alarm-inputs">
                        <input type="time" id="alarmTime" value="08:00">
                        
                        <select id="alarmSound">
                            <option value="suara" selected>🎵 suara (suara.mp3)</option>
                            <option value="college">🎓 College (college.mp3)</option>
                            <option value="pixel">🎮 Pixel (pixel.mp3)</option>
                            <option value="modern">🔔 modern (modern.mp3)</option>
                            <option value="ringtone">📱 Ringtone (ringtone.mp3)</option>
                        </select>
                        
                        <button id="setAlarmBtn" onclick="setAlarm()">Programmer l'alarme</button>
                    </div>
                    <div id="alarmStatus">Aucune alarme programmée</div>
                </div>
                
                <div class="timer-section">
                    <h4>⏱️ Minuteur</h4>
                    <div class="timer-inputs">
                        <select id="timerMinutes">
                            <option value="1">1 minute</option>
                            <option value="2">2 minutes</option>
                            <option value="3">3 minutes</option>
                            <option value="5" selected>5 minutes</option>
                            <option value="10">10 minutes</option>
                            <option value="15">15 minutes</option>
                            <option value="20">20 minutes</option>
                            <option value="25">25 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="45">45 minutes</option>
                            <option value="60">60 minutes</option>
                        </select>
                        
                        <select id="timerSound">
                            <option value="suara" selected>🎵 suara (suara.mp3)</option>
                            <option value="college">🎓 College (college.mp3)</option>
                            <option value="pixel">🎮 Pixel (pixel.mp3)</option>
                            <option value="modern">🔔 modern (modern.mp3)</option>
                            <option value="ringtone">📱 Ringtone (ringtone.mp3)</option>
                        </select>
                        
                        <button id="startTimerBtn" onclick="startTimer()">Démarrer</button>
                    </div>
                    <div id="timerDisplay">00:00</div>
                </div>
            </div>
        </div>
    `;
    
    popup.innerHTML += `<style>/* Styles déplacés dans news-widget.css */</style>`;
    
    document.body.appendChild(popup);
    
    // ✅ NOUVEAU : Restaurer le statut d'alarme si elle était programmée
    if (window.alarmProgrammed && alarmTime) {
        const alarmInput = document.getElementById('alarmTime');
        const alarmStatus = document.getElementById('alarmStatus');
        const soundSelect = document.getElementById('alarmSound');
        
        if (alarmInput) {
            alarmInput.value = alarmTime;
        }
        
        if (soundSelect && window.selectedAlarmSound) {
            soundSelect.value = window.selectedAlarmSound;
        }
        
        if (alarmStatus) {
            alarmStatus.innerHTML = `
                ✅ Alarme programmée pour ${alarmTime}
                <button onclick="cancelAlarm()" style="
                    background: #f6d34f; 
                    color: #070100; 
                    border: none; 
                    border-radius: 4px; 
                    padding: 4px 8px; 
                    margin-left: 10px; 
                    cursor: pointer;
                    font-size: 11px;
                ">Annuler</button>
            `;
            alarmStatus.style.color = '#FFD230';
        }
    }
    
    // Démarrer l'horloge dans la popup
    updateCurrentTime();
    const clockInterval = setInterval(() => {
        if (document.getElementById('currentTimeDisplay')) {
            updateCurrentTime();
        } else {
            clearInterval(clockInterval);
        }
    }, 1000);
}

// Surveillance d'alarme en arrière-plan
function startAlarmChecker() {
    if (alarmCheckInterval) {
        clearInterval(alarmCheckInterval);
    }
    
    alarmCheckInterval = setInterval(() => {
        checkAlarmTime();
    }, 1000); // Vérifier toutes les secondes
}

// Vérification de l'alarme
function checkAlarmTime() {
    if (!alarmTime || !window.alarmProgrammed) return;
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // Format HH:MM
    
    if (currentTime === alarmTime) {
        console.log('🚨 ALARME DÉCLENCHÉE ! Heure actuelle:', currentTime, 'Alarme programmée:', alarmTime);
        triggerAlarm();
        
        // Arrêter la surveillance après déclenchement
        if (alarmCheckInterval) {
            clearInterval(alarmCheckInterval);
            alarmCheckInterval = null;
        }
        
        // ✅ Nettoyer les variables globales SEULEMENT après déclenchement
        window.alarmProgrammed = false;
        window.alarmTimeSet = null;
        alarmTime = null;
        
        // Mettre à jour l'indicateur
        updateClockIndicator();
    }
}

// Mettre à jour l'heure actuelle dans la popup
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('fr-FR', { hour12: false });
    const timeDisplay = document.getElementById('currentTimeDisplay');
    
    if (timeDisplay) {
        timeDisplay.textContent = timeString;
    }
}

// ✅ FONCTION MODIFIÉE AVEC PERSISTANCE - Programmer une alarme
function setAlarm() {
    const alarmInput = document.getElementById('alarmTime');
    const alarmStatus = document.getElementById('alarmStatus');
    const soundSelect = document.getElementById('alarmSound');
    
    if (alarmInput && alarmStatus) {
        alarmTime = alarmInput.value;
        
        // Sauvegarder le son sélectionné globalement
        if (soundSelect) {
            window.selectedAlarmSound = soundSelect.value;
        }
        
        // SAUVEGARDER le statut d'alarme pour l'afficher même après fermeture/réouverture
        window.alarmProgrammed = true;
        window.alarmTimeSet = alarmTime;
        
        // ✅ NOUVEAU : Sauvegarder dans localStorage
        saveAlarmState();
        
        // Affichage avec bouton annuler
        alarmStatus.innerHTML = `
            ✅ Alarme programmée pour ${alarmTime}
            <button onclick="cancelAlarm()" style="
                background: #ff4444; 
                color: white; 
                border: none; 
                border-radius: 4px; 
                padding: 4px 8px; 
                margin-left: 10px; 
                cursor: pointer;
                font-size: 11px;
            ">Annuler</button>
        `;
        alarmStatus.style.color = '#FFD230';
        
        console.log('⏰ Alarme programmée pour:', alarmTime);
        
        // Mettre à jour l'indicateur sur l'horloge
        updateClockIndicator();
        
        // S'assurer que la surveillance est active
        startAlarmChecker();
    }
}

// Indicateur visuel sur l'horloge
function updateClockIndicator() {
    const clockElement = document.getElementById('newsWidgetClock');
    
    if (clockElement) {
        // ✅ CORRECTION : Vérifier aussi window.alarmProgrammed
        if (alarmTime && window.alarmProgrammed) {
            // Ajouter l'indicateur d'alarme
            clockElement.style.border = '2px solid #FFD230';
            clockElement.style.boxShadow = '0 0 10px rgba(255, 210, 48, 0.5)';
            clockElement.title = `Alarme programmée pour ${alarmTime} • Cliquez pour gérer ⏰`;
            
            // ✅ NOUVELLE APPROCHE : Ajouter une classe CSS au lieu de JavaScript
            const timeElement = document.getElementById('clockTime');
            
            if (timeElement) {
                timeElement.classList.add('alarm-active');
            }
        } else {
            // Supprimer l'indicateur
            clockElement.style.border = '1px solid var(--primary-color, #dc3545)';
            clockElement.style.boxShadow = 'none';
            clockElement.title = 'Horloge • Cliquez pour alarme & minuteur ⏰';
            
            // ✅ NOUVELLE APPROCHE : Supprimer la classe CSS
            const timeElement = document.getElementById('clockTime');
            if (timeElement) {
                timeElement.classList.remove('alarm-active');
            }
        }
    }
}

// Déclencher l'alarme avec son immédiat
function triggerAlarm() {
    console.log('🚨 ALARME DÉCLENCHÉE !');
    
    playAlarmSound();
    
    if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 500]);
    }
    
    createStopAlarmButton();
    
    alarmSoundCount = 0;
    
    if (alarmSoundInterval) {
        clearInterval(alarmSoundInterval);
    }
    
    // ✅ Utiliser la configuration
    const maxRepeats = Math.floor(ALARM_SETTINGS.ALARM_DURATION / (ALARM_SETTINGS.ALARM_REPEAT_INTERVAL / 1000));
    
    alarmSoundInterval = setInterval(() => {
        playAlarmSound();
        alarmSoundCount++;
        
        if (alarmSoundCount >= maxRepeats) {
            clearInterval(alarmSoundInterval);
            stopAlarm();
            console.log(`🔇 Alarme arrêtée après ${ALARM_SETTINGS.ALARM_DURATION} secondes`);
        }
    }, ALARM_SETTINGS.ALARM_REPEAT_INTERVAL);
    
    const alarmStatus = document.getElementById('alarmStatus');
    if (alarmStatus) {
        alarmStatus.textContent = `🚨 ALARME EN COURS ! (${ALARM_SETTINGS.ALARM_DURATION/60} min)`;
        alarmStatus.style.color = '#FFD230';
    }
}

// Jouer des sons depuis votre dossier /sounds/
function playAlarmSound() {
    const soundSelect = document.getElementById('alarmSound');
    let soundType = 'suara';
    
    if (soundSelect) {
        soundType = soundSelect.value;
        console.log('🔊 Son sélectionné:', soundType);
    } else {
        soundType = window.selectedAlarmSound || 'suara';
        console.log('🔊 Son sauvegardé:', soundType);
    }
    
    // ✅ Arrêter le son précédent s'il y en a un
    if (currentAlarmAudio) {
        currentAlarmAudio.pause();
        currentAlarmAudio.currentTime = 0;
        currentAlarmAudio = null;
    }
    
    // ✅ Utiliser la nouvelle configuration
    const soundFile = SOUND_FILES[soundType];
    console.log('🎵 Fichier son à jouer:', soundFile);
    
    if (soundFile) {
        currentAlarmAudio = new Audio(soundFile);
        currentAlarmAudio.volume = 0.8;
        
        currentAlarmAudio.play().then(() => {
            console.log('✅ Son joué avec succès');
        }).catch(error => {
            console.log('❌ Erreur lecture son:', error);
            playGeneratedSound();
        });
    } else {
        playGeneratedSound();
    }
}

// Son de secours généré
function playGeneratedSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Impossible de jouer un son:', error);
    }
}

// ✅ FONCTION MODIFIÉE AVEC PERSISTANCE - Démarrer le minuteur
function startTimer() {
    const minutesInput = document.getElementById('timerMinutes');
    const timerDisplay = document.getElementById('timerDisplay');
    const timerSoundSelect = document.getElementById('timerSound');
    
    if (minutesInput && timerDisplay) {
        timerSeconds = parseInt(minutesInput.value) * 60;
        
        // Sauvegarder le son du minuteur
        if (timerSoundSelect) {
            window.selectedTimerSound = timerSoundSelect.value;
        }
        
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        timerInterval = setInterval(() => {
            if (timerSeconds <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                
                // ✅ NOUVEAU : Supprimer la sauvegarde
                localStorage.removeItem('timerState');
                
                // Supprimer l'indicateur flottant
                const timerFloating = document.getElementById('timerFloating');
                if (timerFloating) {
                    timerFloating.remove();
                }
                
                // Afficher dans la popup si ouverte
                if (timerDisplay) {
                    timerDisplay.textContent = '⏰ FINI !';
                }
                
                triggerTimerAlarm();
                return;
            }
            
            const minutes = Math.floor(timerSeconds / 60);
            const seconds = timerSeconds % 60;
            const timeText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Mettre à jour dans la popup si ouverte
            if (timerDisplay) {
                timerDisplay.textContent = timeText;
            }
            
            updateTimerStatus();
            
            // ✅ NOUVEAU : Sauvegarder l'état toutes les 10 secondes
            if (timerSeconds % 10 === 0) {
                saveTimerState();
            }
            
            timerSeconds--;
        }, 1000);
        
        // ✅ NOUVEAU : Sauvegarder l'état initial
        saveTimerState();
        
        // NOUVEAU : Ajouter bouton ANNULER dans la popup si ouverte
        const timerSection = document.querySelector('.timer-section');
        if (timerSection) {
            let cancelButton = document.getElementById('cancelTimerBtn');
            if (!cancelButton) {
                cancelButton = document.createElement('button');
                cancelButton.id = 'cancelTimerBtn';
                cancelButton.textContent = '❌ Annuler le minuteur';
                cancelButton.onclick = cancelTimer;
                cancelButton.style.cssText = `
                    background: #ff4444;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    padding: 8px;
                    width: 200px;
                    margin: 10px auto 0 auto;
                    cursor: pointer;
                    font-weight: bold;
                    display: block;
                    text-align: center;
                `;
                
                const timerInputs = document.querySelector('.timer-inputs');
                if (timerInputs) {
                    timerInputs.appendChild(cancelButton);
                } else {
                    timerSection.appendChild(cancelButton);
                }
            }
        }
        
        console.log(`⏱️ Minuteur démarré pour ${minutesInput.value} minutes`);
    }
}

// ✅ FONCTION MODIFIÉE AVEC PERSISTANCE - Annuler l'alarme
function cancelAlarm() {
    // Arrêter la surveillance
    if (alarmCheckInterval) {
        clearInterval(alarmCheckInterval);
        alarmCheckInterval = null;
    }
    
    // Réinitialiser l'alarme
    alarmTime = null;
    
    // NETTOYER les variables globales
    window.alarmProgrammed = false;
    window.alarmTimeSet = null;
    
    // ✅ NOUVEAU : Supprimer la sauvegarde
    localStorage.removeItem('alarmState');
    
    // Mettre à jour le statut
    const alarmStatus = document.getElementById('alarmStatus');
    if (alarmStatus) {
        alarmStatus.textContent = '❌ Alarme annulée';
        alarmStatus.style.color = '#ff4444';
        
        setTimeout(() => {
            if (alarmStatus) {
                alarmStatus.textContent = 'Aucune alarme programmée';
                alarmStatus.style.color = 'white';
            }
        }, 2000);
    }
    
    // Supprimer l'indicateur sur l'horloge
    updateClockIndicator();
    
    console.log('❌ Alarme annulée par l\'utilisateur');
}

// ✅ FONCTION MODIFIÉE AVEC PERSISTANCE - Annuler le minuteur
function cancelTimer() {
    const colors = getThemeColors();
    
    console.log('❌ Annulation du minuteur demandée');
    
    // Confirmation sur mobile pour éviter les annulations accidentelles
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     ('ontouchstart' in window) || 
                     window.innerWidth <= 768;
    
    if (isMobile) {
        // Vibration de confirmation
        if (navigator.vibrate) {
            navigator.vibrate([50, 50, 50]);
        }
        
        const confirm = window.confirm('Voulez-vous vraiment arrêter le minuteur ?');
        if (!confirm) {
            return;
        }
    }
    
    // Arrêter le minuteur
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // ✅ NOUVEAU : Supprimer la sauvegarde
    localStorage.removeItem('timerState');
    
    // Supprimer l'indicateur flottant
    const timerFloating = document.getElementById('timerFloating');
    if (timerFloating) {
        timerFloating.remove();
    }
    
    // Remettre l'affichage à zéro dans la popup si ouverte
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
        timerDisplay.textContent = '00:00';
    }
    
    // Supprimer le bouton annuler dans la popup
    const cancelButton = document.getElementById('cancelTimerBtn');
    if (cancelButton) {
        cancelButton.remove();
    }
    
    // Message de confirmation stylé AVEC THÈME
    const confirmation = document.createElement('div');
    confirmation.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(145deg, ${colors.primary}, ${colors.secondary});
        color: white;
        padding: 20px 25px;
        border-radius: 15px;
        z-index: 10001;
        font-weight: bold;
        box-shadow: 0 8px 25px rgba(0,0,0,0.4);
        font-size: 16px;
        text-align: center;
        border: 2px solid ${colors.dark};
    `;
    confirmation.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 8px;">⏱️</div>
        <div>Minuteur arrêté</div>
    `;
    document.body.appendChild(confirmation);
    
    // Animation de disparition
    setTimeout(() => {
        confirmation.style.opacity = '0';
        confirmation.style.transform = 'translate(-50%, -50%) scale(0.8)';
        confirmation.style.transition = 'all 0.3s ease';
    }, 1500);
    
    setTimeout(() => {
        if (confirmation.parentNode) {
            confirmation.parentNode.removeChild(confirmation);
        }
    }, 2000);
}

// ✅ NOUVELLES FONCTIONS : Déclencher alarme du minuteur
function triggerTimerAlarm() {
    console.log('⏱️🚨 MINUTEUR TERMINÉ !');
    
    playTimerSound();
    
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
    }
    
    createTimerStopButton();
    
    // ✅ Utiliser la configuration
    const maxRepeats = Math.floor(ALARM_SETTINGS.TIMER_DURATION / (ALARM_SETTINGS.TIMER_REPEAT_INTERVAL / 1000));
    
    let timerSoundCount = 0;
    let timerSoundInterval = setInterval(() => {
        playTimerSound();
        timerSoundCount++;
        
        if (timerSoundCount >= maxRepeats) {
            clearInterval(timerSoundInterval);
            stopTimerAlarm();
            console.log(`🔇 Minuteur arrêté après ${ALARM_SETTINGS.TIMER_DURATION} secondes`);
        }
    }, ALARM_SETTINGS.TIMER_REPEAT_INTERVAL);
    
    window.timerSoundInterval = timerSoundInterval;
}

// ✅ NOUVELLE FONCTION : Jouer son du minuteur
function playTimerSound() {
    const soundType = window.selectedTimerSound || 'suara';
    
    // ✅ Arrêter le son précédent s'il y en a un
    if (currentTimerAudio) {
        currentTimerAudio.pause();
        currentTimerAudio.currentTime = 0;
        currentTimerAudio = null;
    }
    
    // ✅ Utiliser la nouvelle configuration
    const soundFile = SOUND_FILES[soundType];
    console.log('⏱️🎵 Fichier son minuteur à jouer:', soundFile);
    
    if (soundFile) {
        currentTimerAudio = new Audio(soundFile);
        currentTimerAudio.volume = 0.7; // Volume plus doux pour le minuteur
        
        currentTimerAudio.play().then(() => {
            console.log('✅ Son minuteur joué avec succès');
        }).catch(error => {
            console.log('❌ Erreur lecture son minuteur:', error);
            playGeneratedSound();
        });
    } else {
        playGeneratedSound();
    }
}

// ✅ NOUVELLE FONCTION : Bouton STOP pour minuteur
function createTimerStopButton() {
    const colors = getThemeColors();
    
    // Supprimer bouton existant
    const existingButton = document.getElementById('timerStopButton');
    if (existingButton) {
        existingButton.remove();
    }
    
    const stopButton = document.createElement('div');
    stopButton.id = 'timerStopButton';
    stopButton.innerHTML = `
        <div class="stop-alarm-overlay">
            <div class="stop-alarm-content" style="background: linear-gradient(145deg, ${colors.primary}, ${colors.secondary}); border: 2px solid ${colors.accent};">
                <h3>⏱️ MINUTEUR TERMINÉ</h3>
                <p>Minuteur sonnera pendant 1 minute</p>
                <button class="stop-alarm-btn" onclick="stopTimerAlarm()" style="background: ${colors.light}; color: ${colors.primary};">
                    🛑 ARRÊTER LE MINUTEUR
                </button>
                <div class="alarm-timer" id="timerStopTimer">1:00</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(stopButton);
    
    // Compte à rebours de 1 minute
    let timeLeft = 60;
    const timerDisplay = document.getElementById('timerStopTimer');
    
    const countdownInterval = setInterval(() => {
        timeLeft--;
        const seconds = timeLeft;
        
        if (timerDisplay) {
            timerDisplay.textContent = `0:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);
    
    window.timerCountdownInterval = countdownInterval;
}

// ✅ NOUVELLE FONCTION : Arrêter alarme minuteur
function stopTimerAlarm() {
    const colors = getThemeColors();
    
    console.log('🛑 Arrêt du minuteur demandé');
    
    // ✅ NOUVEAU : Arrêter immédiatement le son en cours
    if (currentTimerAudio) {
        currentTimerAudio.pause();
        currentTimerAudio.currentTime = 0;
        currentTimerAudio = null;
        console.log('🔇 Son de minuteur arrêté immédiatement');
    }
    
    // Arrêter les sons du minuteur
    if (window.timerSoundInterval) {
        clearInterval(window.timerSoundInterval);
        window.timerSoundInterval = null;
    }
    
    // Arrêter le compte à rebours
    if (window.timerCountdownInterval) {
        clearInterval(window.timerCountdownInterval);
    }
    
    // Supprimer le bouton STOP
    const stopButton = document.getElementById('timerStopButton');
    if (stopButton) {
        stopButton.remove();
    }
    
    // Message de confirmation pour minuteur AVEC THÈME
    setTimeout(() => {
        const confirmation = document.createElement('div');
        confirmation.style.cssText = `
            position: fixed;
            top: 10px;
            right: 20px;
            background: linear-gradient(145deg, ${colors.primary}, ${colors.secondary});
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 10001;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 2px solid ${colors.dark};
        `;
        confirmation.textContent = '✅ Minuteur arrêté avec succès';
        document.body.appendChild(confirmation);
        
        setTimeout(() => {
            if (confirmation.parentNode) {
                confirmation.parentNode.removeChild(confirmation);
            }
        }, 3000);
    }, 500);
}

// Fermer la popup SANS arrêter l'alarme
function closeAlarmPopup() {
    const popup = document.getElementById('alarmPopup');
    if (popup) {
        popup.remove();
    }
    
    // ✅ NE PAS arrêter le minuteur si il est en cours
    // L'alarme et le minuteur continuent en arrière-plan
    console.log('🔒 Popup fermée, alarme reste active:', alarmTime);
    console.log('⏱️ Minuteur reste actif:', timerInterval ? 'OUI' : 'NON');
}

// Créer bouton STOP pour alarme
function createStopAlarmButton() {
    const colors = getThemeColors();
    
    // Supprimer bouton existant si présent
    const existingButton = document.getElementById('stopAlarmButton');
    if (existingButton) {
        existingButton.remove();
    }
    
    // Créer le bouton STOP flottant
    const stopButton = document.createElement('div');
    stopButton.id = 'stopAlarmButton';
    stopButton.innerHTML = `
        <div class="stop-alarm-overlay">
            <div class="stop-alarm-content" style="background: linear-gradient(145deg, ${colors.primary}, ${colors.secondary}); border: 2px solid ${colors.accent};">
                <h3>🚨 ALARME EN COURS</h3>
                <p>Alarme sonnera pendant 2 minutes</p>
                <button class="stop-alarm-btn" onclick="stopAlarm()" style="background: ${colors.light}; color: ${colors.primary};">
                    🛑 ARRÊTER L'ALARME
                </button>
                <div class="alarm-timer" id="alarmTimer">2:00</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(stopButton);
    
    // Démarrer le compte à rebours
    let timeLeft = 120; // 2 minutes en secondes
    const timerDisplay = document.getElementById('alarmTimer');
    
    const countdownInterval = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        if (timerDisplay) {
            timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);
    
    // Sauvegarder l'interval pour pouvoir l'arrêter
    window.alarmCountdownInterval = countdownInterval;
}

// Arrêter l'alarme
function stopAlarm() {
    const colors = getThemeColors();
    
    console.log('🛑 Arrêt de l\'alarme demandé');
    
    // ✅ NOUVEAU : Arrêter immédiatement le son en cours
    if (currentAlarmAudio) {
        currentAlarmAudio.pause();
        currentAlarmAudio.currentTime = 0;
        currentAlarmAudio = null;
        console.log('🔇 Son d\'alarme arrêté immédiatement');
    }
    
    // Arrêter les sons
    if (alarmSoundInterval) {
        clearInterval(alarmSoundInterval);
        alarmSoundInterval = null;
    }
    
    // Arrêter le compte à rebours
    if (window.alarmCountdownInterval) {
        clearInterval(window.alarmCountdownInterval);
    }
    
    // Supprimer le bouton STOP
    const stopButton = document.getElementById('stopAlarmButton');
    if (stopButton) {
        stopButton.remove();
    }
    
    // Mettre à jour le statut si la popup est ouverte
    const alarmStatus = document.getElementById('alarmStatus');
    if (alarmStatus) {
        alarmStatus.textContent = '✅ Alarme arrêtée';
        alarmStatus.style.color = '#4CAF50';
        
        setTimeout(() => {
            if (alarmStatus) {
                alarmStatus.textContent = 'Aucune alarme programmée';
                alarmStatus.style.color = 'white';
            }
        }, 3000);
    }
    
    // Supprimer l'indicateur sur l'horloge
    updateClockIndicator();
    
    // Afficher message de confirmation AVEC THÈME
    setTimeout(() => {
        const confirmation = document.createElement('div');
        confirmation.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(145deg, ${colors.primary}, ${colors.secondary});
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 10001;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 2px solid ${colors.dark};
        `;
        confirmation.textContent = '✅ Alarme arrêtée avec succès';
        document.body.appendChild(confirmation);
        
        setTimeout(() => {
            if (confirmation.parentNode) {
                confirmation.parentNode.removeChild(confirmation);
            }
        }, 3000);
    }, 500);
}

function updateTimerStatus() {
    const colors = getThemeColors();
    
    // Si un minuteur est en cours et que la popup est fermée
    if (timerInterval && !document.getElementById('alarmPopup')) {
        // Créer un petit indicateur flottant
        let timerFloating = document.getElementById('timerFloating');
        if (!timerFloating) {
            timerFloating = document.createElement('div');
            timerFloating.id = 'timerFloating';
            
            // ✅ Détection mobile
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                             ('ontouchstart' in window) || 
                             window.innerWidth <= 768;
            
            if (isMobile) {
                // ✅ VERSION MOBILE : 2 boutons séparés AVEC THÈME
                timerFloating.style.cssText = `
                    position: fixed;
                    top: 120px;
                    right: 270px;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    gap: 0px;
                    font-weight: bold;
                    user-select: none;
                    -webkit-user-select: none;
                    -webkit-touch-callout: none;
                `;
                
                timerFloating.innerHTML = `
                    <div style="
                        background: linear-gradient(145deg, ${colors.primary}, ${colors.secondary});
                        color: white;
                        padding: 8px 5px;
                        border-radius: 12px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.4);
                        cursor: pointer;
                        font-size: 14px;
                        text-align: center;
                        border: 2px solid ${colors.dark};
                        min-width: 80px;
                    " onclick="createAlarmPopup()">
                        <div style="font-size: 16px; margin-bottom: 2px;" id="timerTimeDisplay">⏱️ --:--</div>
                        <div style="font-size: 12px; opacity: 0.9; line-height: 1;">Toucher pour ouvrir</div>
                    </div>
                    <button style="
                        background: #f6d34f;
                        color: #000000;
                        border: none;
                        padding: 4px 12px;
                        border-radius: 8px;
                        font-size: 12px;
                        font-weight: bold;
                        cursor: pointer;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        border: 1px solid rgba(255,255,255,0.3);
                        min-width: 80px;
                        text-align: center;
                    " onclick="cancelTimer()">
                        ❌ STOP
                    </button>
                `;
                
            } else {
                // ✅ VERSION DESKTOP : Clic droit classique AVEC THÈME
                timerFloating.style.cssText = `
                    position: fixed;
                    top: 240px;
                    right: 10px;
                    background: linear-gradient(145deg, ${colors.primary}, ${colors.secondary});
                    color: white;
                    padding: 12px 16px;
                    border-radius: 12px;
                    z-index: 1000;
                    font-weight: bold;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.4);
                    cursor: pointer;
                    font-size: 14px;
                    text-align: center;
                    user-select: none;
                    border: 2px solid ${colors.dark};
                    min-width: 80px;
                `;
                
                timerFloating.onclick = () => createAlarmPopup();
                timerFloating.oncontextmenu = (e) => {
                    e.preventDefault();
                    cancelTimer();
                };
                timerFloating.title = 'Clic gauche: ouvrir | Clic droit: annuler';
            }
            
            document.body.appendChild(timerFloating);
        }
        
        // ✅ Mettre à jour le temps affiché
        const minutes = Math.floor(timerSeconds / 60);
        const seconds = timerSeconds % 60;
        const timeText = `⏱️ ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                         ('ontouchstart' in window) || 
                         window.innerWidth <= 768;
        
        if (isMobile) {
            // Mettre à jour seulement le temps sur mobile
            const timeDisplay = document.getElementById('timerTimeDisplay');
            if (timeDisplay) {
                timeDisplay.textContent = timeText;
            }
        } else {
            // Mettre à jour le contenu complet sur desktop
            timerFloating.innerHTML = `
                <div style="font-size: 16px; margin-bottom: 2px;">${timeText}</div>
                <div style="font-size: 12px; opacity: 0.9; line-height: 1;">Clic droit = stop</div>
            `;
        }
        
    } else {
        // Supprimer l'indicateur si pas de minuteur
        const timerFloating = document.getElementById('timerFloating');
        if (timerFloating) {
            timerFloating.remove();
        }
    }
}

// Fonction pour ouvrir les détails météo
function openWeatherDetails() {
    if (event) {
        event.stopPropagation();
    }
    
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    // Ouvrir VOTRE widget météo au lieu de Google
    if (typeof window.showWeatherWidget === 'function') {
        window.showWeatherWidget();
    } else {
        console.warn('Widget météo non disponible');
    }
    
    console.log('Ouverture du widget météo interne');
}

// Initialisation des widgets (version corrigée)
function initHeaderWidgets() {
    fetchTemperatureOptimized();
    updateVisitorsCount();
    fetchSaintDuJour(); // 🆕 AJOUT
    
    setInterval(fetchTemperatureOptimized, 300000);
    setInterval(updateVisitorsCount, 45000);
    setInterval(fetchSaintDuJour, 3600000); // 🆕 AJOUT - Mise à jour toutes les heures
    setInterval(cleanupInactiveVisitors, 120000);
}

// ✅ ========== INITIALISATION AVEC PERSISTANCE ==========

// ✅ MODIFIÉE : Initialisation automatique avec restauration
document.addEventListener('DOMContentLoaded', function() {
    // Créer l'instance du widget
    newsWidget = new NewsWidget();
    
    // Initialiser le widget après un délai pour s'assurer que Supabase est chargé
    setTimeout(() => {
        newsWidget.init();
    }, 1500);
    
    // ✅ NOUVEAU : Restaurer les états sauvegardés
    setTimeout(() => {
        restoreAlarmState();
        restoreTimerState();
    }, 2000);
    
    // Initialiser l'horloge
    initClock();
    
    // Initialiser les widgets header après délai
    setTimeout(initHeaderWidgets, 2000);
});

// ✅ NOUVEAU : Sauvegarder avant fermeture de page
window.addEventListener('beforeunload', function() {
    if (alarmTime) {
        saveAlarmState();
    }
    if (timerInterval) {
        saveTimerState();
    }
});

// Recharger le widget quand les actualités sont mises à jour (optionnel)
window.addEventListener('newsUpdated', function() {
    if (newsWidget) {
        newsWidget.refresh();
    }
});

// ✅ AJOUTER les animations CSS (VERSION CORRIGÉE AVEC CLASSE)
const animationCSS = `
<style>
@keyframes slideInDown {
    from {
        opacity: 0;
        transform: translateX(-50%) translateY(-30px);
    }
    to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
}

@keyframes slideOutUp {
    from {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
    to {
        opacity: 0;
        transform: translateX(-50%) translateY(-30px);
    }
}

@keyframes blink-alarm {
    0%, 50% { 
        opacity: 1; 
        transform: scale(1);
        color: #FFD230;
    }
    51%, 100% { 
        opacity: 0.3; 
        transform: scale(0.9);
        color: #FFD230;
    }
}

/* ✅ NOUVELLE APPROCHE : Icône via CSS pseudo-element */
.clock-time.alarm-active::after {
    content: ' ⏰';
    font-size: 20px !important;
    color: #FFD230 !important;
    font-weight: bold !important;
    text-shadow: 0 0 5px rgba(255, 210, 48, 1) !important;
    animation: blink-alarm 1.5s infinite !important;
    margin-left: 3px !important;
    display: inline !important;
    position: relative !important;
    z-index: 9999 !important;
}

/* Style supplémentaire pour l'icône d'alarme */
.alarm-icon {
    color: #FFD230 !important;
    font-weight: bold !important;
    text-shadow: 0 0 3px rgba(255, 210, 48, 0.8) !important;
}
</style>
`;

// ✅ NOUVEAU : Vérifier si les styles ne sont pas déjà ajoutés
if (!document.head.querySelector('style[data-alarm-styles]')) {
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-alarm-styles', 'true');
    styleElement.innerHTML = `
@keyframes slideInDown {
    from {
        opacity: 0;
        transform: translateX(-50%) translateY(-30px);
    }
    to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
}

@keyframes slideOutUp {
    from {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
    to {
        opacity: 0;
        transform: translateX(-50%) translateY(-30px);
    }
}

@keyframes blink-alarm {
    0%, 50% { 
        opacity: 1; 
        transform: scale(1);
        color: #FFD230;
    }
    51%, 100% { 
        opacity: 0.3; 
        transform: scale(0.9);
        color: #FFD230;
    }
}

/* ✅ APPROCHE CSS PURE : Icône via pseudo-element */
.clock-time.alarm-active::after {
    content: ' ⏰' !important;
    font-size: 12px !important;
    color: #FFD230 !important;
    font-weight: bold !important;
    text-shadow: 0 0 5px rgba(255, 210, 48, 1) !important;
    animation: blink-alarm 1.5s infinite !important;
    margin-left: 3px !important;
    display: inline !important;
    position: relative !important;
    z-index: 9999 !important;
}

.alarm-icon {
    color: #FFD230 !important;
    font-weight: bold !important;
    text-shadow: 0 0 3px rgba(255, 210, 48, 0.8) !important;
}
    `;
    document.head.appendChild(styleElement);
}

document.head.insertAdjacentHTML('beforeend', animationCSS);

// Fonction pour retourner à l'accueil depuis la modal cinéma
function goBackHome() {
    // Fermer la modal d'abord
    const modal = document.getElementById('cinemaMobileModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    // Vibration tactile si disponible
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    // Navigation directe et sûre vers l'accueil
    const homeUrl = `${window.location.protocol}//${window.location.host}/`;
    
    console.log('Redirection vers accueil:', homeUrl);
    
    // Utiliser replace pour éviter les problèmes d'historique
    window.location.replace(homeUrl);
}

// ===== EXPORTS GLOBAUX =====
window.debugVisitors = debugVisitors;
window.openSpecificNews = openSpecificNews;
window.updateClock = updateClock;
window.openTimeWidget = openTimeWidget;
window.initClock = initClock;
window.openGalleryPage = openGalleryPage;
window.openCinemaModal = openCinemaModal;
window.openWeatherDetails = openWeatherDetails;
window.initHeaderWidgets = initHeaderWidgets;
window.createAlarmPopup = createAlarmPopup;
window.closeAlarmPopup = closeAlarmPopup;
window.setAlarm = setAlarm;
window.startTimer = startTimer;
window.updateClockIndicator = updateClockIndicator;
window.stopAlarm = stopAlarm;
window.cancelAlarm = cancelAlarm;
window.updateTimerStatus = updateTimerStatus;
window.triggerTimerAlarm = triggerTimerAlarm;
window.playTimerSound = playTimerSound;
window.createTimerStopButton = createTimerStopButton;
window.stopTimerAlarm = stopTimerAlarm;
window.cancelTimer = cancelTimer;
window.goBackHome = goBackHome;
window.openSaintPopup = openSaintPopup;
window.closeSaintPopup = closeSaintPopup;
window.changeCalendarMonth = changeCalendarMonth;

// Export pour usage externe
window.NewsWidget = NewsWidget;