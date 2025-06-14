// news-widget.js - Gestionnaire du widget NEWS Actu&Média

// ✅ Variables globales pour l'alarme (AU DÉBUT)
let alarmTime = null;
let timerInterval = null;
let timerSeconds = 0;
let alarmCheckInterval = null;
let alarmSoundInterval = null;
let alarmSoundCount = 0;

// Configuration des durées
const ALARM_SETTINGS = {
    ALARM_DURATION: 120,        // 2 minutes
    ALARM_REPEAT_INTERVAL: 5000, // 5 secondes
    TIMER_DURATION: 60,         // 1 minute
    TIMER_REPEAT_INTERVAL: 5000
};

// Configuration des sons
const SOUND_FILES = {
    // ✅ REMPLACEZ par vos vrais fichiers d'alarme :
    'beep': '/sounds/alarm-clock.mp3',        // Son d'alarme classique
    'bells': '/sounds/church-bells.mp3',      // Cloches d'église
    'alarm': '/sounds/fire-alarm.mp3',        // Alarme incendie
    'chime': '/sounds/wind-chimes.mp3',       // Carillon
    'digital': '/sounds/digital-beep.mp3',    // Bip digital
    
    // ✅ Ou gardez vos fichiers existants :
    // 'beep': '/sounds/click.mp3',
    // 'bells': '/sounds/notification.mp3',
    // 'alarm': '/sounds/erreur.mp3',
    // 'chime': '/sounds/success.mp3',
    // 'digital': '/sounds/sent.mp3'
};

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
            const countElement = document.getElementById('newsWidgetCount');

            if (news && news.length > 0) {
                
                // Afficher les actualités avec liens spécifiques
                previewContainer.innerHTML = news.map(item => {
                    const featuredIcon = item.featured ? '⭐ ' : '';
                    const shortContent = this.truncateText(item.content, 60); // Réduit pour plus d'actualités
                    return `
                        <div class="news-preview-item" data-news-id="${item.id}" onclick="openSpecificNews(${item.id})" style="cursor: pointer;">
                            <strong>${featuredIcon}${item.title}</strong><br>
                            <span style="font-size: 12px; opacity: 0.8;">${shortContent}...</span>
                        </div>
                    `;
                }).join('');

                // Compter toutes les actualités publiées
                const { count } = await supabase
                    .from('local_news')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_published', true);

                countElement.textContent = `${count || news.length} news`;
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
        const countElement = document.getElementById('newsWidgetCount');
        
        previewContainer.innerHTML = `
            <div class="news-preview-item">
                <strong>📝 Premières actualités bientôt disponibles</strong><br>
                Les actualités locales de Montceau-les-Mines et environs apparaîtront ici.
            </div>
        `;
        countElement.textContent = '0 news';
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

// Initialisation automatique
document.addEventListener('DOMContentLoaded', function() {
    // Créer l'instance du widget
    newsWidget = new NewsWidget();
    
    // Initialiser le widget après un délai pour s'assurer que Supabase est chargé
    setTimeout(() => {
        newsWidget.init();
    }, 1500);
});

// Recharger le widget quand les actualités sont mises à jour (optionnel)
window.addEventListener('newsUpdated', function() {
    if (newsWidget) {
        newsWidget.refresh();
    }
});

// Export pour usage externe
window.NewsWidget = NewsWidget;

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
    }
}

// Démarrer l'horloge
function initClock() {
    updateClock(); // Mise à jour immédiate
    setInterval(updateClock, 1000); // Mise à jour chaque seconde
}

// Démarrer quand le DOM est prêt
document.addEventListener('DOMContentLoaded', initClock);

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
            modalContent.innerHTML = cinemaWidgetPreview.innerHTML;
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
        window.open('https://www.cinemas-panacea.fr/montceau-embarcadere/horaires/', '_blank');
    }
}

// Variables globales pour la météo et les visiteurs
let currentTemp = '--°';
let visitorsCount = 0;

// Fonction pour récupérer la VRAIE température
async function fetchTemperature() {
    try {
        // API gratuite sans clé requise - OpenMeteo
        const url = 'https://api.open-meteo.com/v1/forecast?latitude=46.6747&longitude=4.3736&current_weather=true&timezone=Europe/Paris';
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.current_weather && data.current_weather.temperature !== undefined) {
            currentTemp = Math.round(data.current_weather.temperature) + '°';
            document.getElementById('tempValue').textContent = currentTemp;
            console.log(`🌡️ Vraie température Montceau: ${currentTemp}`);
        } else {
            throw new Error('Données météo indisponibles');
        }
        
    } catch (error) {
        console.log('❌ Impossible de récupérer la vraie météo:', error);
        // Masquer le widget météo au lieu d'afficher des fausses données
        const weatherWidget = document.getElementById('weatherTemp');
        if (weatherWidget) {
            weatherWidget.style.display = 'none';
            console.log('🌡️ Widget météo masqué');
        }
    }
}

// Fonction pour récupérer les VRAIS visiteurs (version corrigée)
async function updateVisitorsCount() {
    try {
        if (window.getSupabaseClient) {
            const supabase = window.getSupabaseClient();
            
            // Utiliser un device ID persistant ou en créer un une seule fois
            let deviceId = localStorage.getItem('deviceId');
            if (!deviceId) {
                deviceId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('deviceId', deviceId);
                console.log('👤 Nouveau visiteur créé:', deviceId);
            } else {
                console.log('👤 Visiteur existant:', deviceId);
            }
            
            // Mettre à jour le timestamp de ce visiteur (UPSERT)
            await supabase
                .from('active_visitors')
                .upsert({
                    device_id: deviceId,
                    last_seen: new Date().toISOString(),
                    page_url: window.location.href
                }, {
                    onConflict: 'device_id'
                });
            
            // Nettoyer les visiteurs inactifs (plus de 5 minutes)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            await supabase
                .from('active_visitors')
                .delete()
                .lt('last_seen', fiveMinutesAgo);
            
            // Compter les visiteurs actifs
            const { count } = await supabase
                .from('active_visitors')
                .select('*', { count: 'exact', head: true })
                .gte('last_seen', fiveMinutesAgo);
            
            if (count !== null) {
                visitorsCount = count;
                document.getElementById('visitorsCount').textContent = visitorsCount;
                console.log(`👥 Vrais visiteurs actifs: ${visitorsCount}`);
                return;
            }
        }
        
        throw new Error('Aucune méthode de comptage disponible');
        
    } catch (error) {
        console.log('❌ Impossible de récupérer les vrais visiteurs:', error);
        // Masquer le widget visiteurs au lieu d'afficher des fausses données
        const visitorsWidget = document.getElementById('visitorsCounter');
        if (visitorsWidget) {
            visitorsWidget.style.display = 'none';
            console.log('👥 Widget visiteurs masqué');
        }
    }
}

// Fonction de nettoyage automatique des visiteurs inactifs
async function cleanupInactiveVisitors() {
    try {
        if (window.getSupabaseClient) {
            const supabase = window.getSupabaseClient();
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
            
            const { count } = await supabase
                .from('active_visitors')
                .delete()
                .lt('last_seen', tenMinutesAgo);
            
            if (count > 0) {
                console.log(`🧹 ${count} visiteurs inactifs supprimés`);
            }
        }
    } catch (error) {
        console.log('Erreur nettoyage visiteurs:', error);
    }
}

// Fonction de debug pour vérifier les visiteurs
async function debugVisitors() {
    try {
        if (window.getSupabaseClient) {
            const supabase = window.getSupabaseClient();
            
            // Tous les visiteurs
            const { data: allVisitors } = await supabase
                .from('active_visitors')
                .select('*')
                .order('last_seen', { ascending: false });
            
            console.log('📊 TOUS LES VISITEURS:', allVisitors);
            
            // Visiteurs actifs (5 dernières minutes)
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const { data: activeVisitors } = await supabase
                .from('active_visitors')
                .select('*')
                .gte('last_seen', fiveMinutesAgo)
                .order('last_seen', { ascending: false });
            
            console.log('🟢 VISITEURS ACTIFS (5 min):', activeVisitors);
            console.log(`📈 Total actifs: ${activeVisitors?.length || 0}`);
            
            // Votre device ID
            const deviceId = localStorage.getItem('deviceId');
            console.log('👤 Votre device ID:', deviceId);
        }
    } catch (error) {
        console.error('❌ Erreur debug:', error);
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
                            <option value="beep">🔊 Bip (click.mp3)</option>
                            <option value="bells">🔔 Notification (notification.mp3)</option>
                            <option value="alarm">⏰ Alarme (erreur.mp3)</option>
                            <option value="chime">🎵 Succès (success.mp3)</option>
                            <option value="digital">📱 Digital (sent.mp3)</option>
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
                        
                        <!-- ✅ NOUVEAU : Choix de son pour le minuteur -->
                        <select id="timerSound">
                            <option value="beep">🔊 Bip (click.mp3)</option>
                            <option value="bells" selected>🔔 Notification (notification.mp3)</option>
                            <option value="alarm">⏰ Alarme (erreur.mp3)</option>
                            <option value="chime">🎵 Succès (success.mp3)</option>
                            <option value="digital">📱 Digital (sent.mp3)</option>
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
    
    console.log('🔍 Surveillance d\'alarme démarrée');
    alarmCheckInterval = setInterval(() => {
        checkAlarmTime();
    }, 1000); // Vérifier toutes les secondes
}

// Vérification de l'alarme
function checkAlarmTime() {
    if (!alarmTime) return;
    
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
        
        // ✅ Nettoyer les variables globales
        window.alarmProgrammed = false;
        window.alarmTimeSet = null;
        
        // Réinitialiser l'alarme
        alarmTime = null;
        updateClockIndicator(); // Mettre à jour l'indicateur
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

// Programmer une alarme
function setAlarm() {
    const alarmInput = document.getElementById('alarmTime');
    const alarmStatus = document.getElementById('alarmStatus');
    const soundSelect = document.getElementById('alarmSound');
    
    if (alarmInput && alarmStatus) {
        alarmTime = alarmInput.value;
        
        // Sauvegarder le son sélectionné globalement
        if (soundSelect) {
            window.selectedAlarmSound = soundSelect.value;
            console.log('💾 Son sauvegardé:', window.selectedAlarmSound);
        }
        
        // ✅ SAUVEGARDER le statut d'alarme pour l'afficher même après fermeture/réouverture
        window.alarmProgrammed = true;
        window.alarmTimeSet = alarmTime;
        
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
        if (alarmTime) {
            // Ajouter l'indicateur d'alarme
            clockElement.style.border = '2px solid #FFD230';
            clockElement.style.boxShadow = '0 0 10px rgba(255, 210, 48, 0.5)';
            clockElement.title = `Alarme programmée pour ${alarmTime}`;
        } else {
            // Supprimer l'indicateur
            clockElement.style.border = '1px solid var(--primary-color, #dc3545)';
            clockElement.style.boxShadow = 'none';
            clockElement.title = 'Cliquez pour plus d\'infos';
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
    let soundType = 'beep';
    
    if (soundSelect) {
        soundType = soundSelect.value;
        console.log('🔊 Son sélectionné:', soundType);
    } else {
        soundType = window.selectedAlarmSound || 'beep';
        console.log('🔊 Son sauvegardé:', soundType);
    }
    
    // ✅ Utiliser la nouvelle configuration
    const soundFile = SOUND_FILES[soundType];
    console.log('🎵 Fichier son à jouer:', soundFile);
    
    if (soundFile) {
        const audio = new Audio(soundFile);
        audio.volume = 0.8;
        
        audio.play().then(() => {
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

// Démarrer le minuteur
function startTimer() {
    const minutesInput = document.getElementById('timerMinutes');
    const timerDisplay = document.getElementById('timerDisplay');
    const timerSoundSelect = document.getElementById('timerSound');
    
    if (minutesInput && timerDisplay) {
        timerSeconds = parseInt(minutesInput.value) * 60;
        
        // Sauvegarder le son du minuteur
        if (timerSoundSelect) {
            window.selectedTimerSound = timerSoundSelect.value;
            console.log('⏱️💾 Son minuteur sauvegardé:', window.selectedTimerSound);
        }
        
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        timerInterval = setInterval(() => {
            if (timerSeconds <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                
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
            timerSeconds--;
        }, 1000);
        
        // ✅ NOUVEAU : Ajouter bouton ANNULER dans la popup si ouverte
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
        
        // ✅ Insérer le bouton dans .timer-inputs au lieu de .timer-section
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

// ✅ 2. NOUVELLE FONCTION : Annuler le minuteur
function cancelTimer() {
    console.log('❌ Annulation du minuteur demandée');
    
    // Arrêter le minuteur
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
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
    
    // Supprimer le bouton annuler
    const cancelButton = document.getElementById('cancelTimerBtn');
    if (cancelButton) {
        cancelButton.remove();
    }
    
    // Message de confirmation
    const confirmation = document.createElement('div');
    confirmation.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 10001;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    confirmation.textContent = '❌ Minuteur annulé';
    document.body.appendChild(confirmation);
    
    setTimeout(() => {
        if (confirmation.parentNode) {
            confirmation.parentNode.removeChild(confirmation);
        }
    }, 3000);
}

// ✅ NOUVELLE FONCTION : Déclencher alarme du minuteur
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
    const soundType = window.selectedTimerSound || 'bells';
    
    // ✅ Utiliser la nouvelle configuration
    const soundFile = SOUND_FILES[soundType];
    console.log('⏱️🎵 Fichier son minuteur à jouer:', soundFile);
    
    if (soundFile) {
        const audio = new Audio(soundFile);
        audio.volume = 0.7; // Volume plus doux pour le minuteur
        
        audio.play().then(() => {
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
    // Supprimer bouton existant
    const existingButton = document.getElementById('timerStopButton');
    if (existingButton) {
        existingButton.remove();
    }
    
    const stopButton = document.createElement('div');
    stopButton.id = 'timerStopButton';
    stopButton.innerHTML = `
        <div class="stop-alarm-overlay">
            <div class="stop-alarm-content" style="background: linear-gradient(145deg, #FF6B35, #e53935);">
                <h3>⏱️ MINUTEUR TERMINÉ</h3>
                <p>Minuteur sonnera pendant 1 minute</p>
                <button class="stop-alarm-btn" onclick="stopTimerAlarm()">
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
    console.log('🛑 Arrêt du minuteur demandé');
    
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
    
    // Message de confirmation pour minuteur
    setTimeout(() => {
        const confirmation = document.createElement('div');
        confirmation.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #FF6B35;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 10001;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
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
            <div class="stop-alarm-content">
                <h3>🚨 ALARME EN COURS</h3>
                <p>Alarme sonnera pendant 2 minutes</p>
                <button class="stop-alarm-btn" onclick="stopAlarm()">
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
    console.log('🛑 Arrêt de l\'alarme demandé');
    
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
    
    // Afficher message de confirmation
    setTimeout(() => {
        const confirmation = document.createElement('div');
        confirmation.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 10001;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
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

// NOUVELLE FONCTION : Annuler l'alarme
function cancelAlarm() {
    // Arrêter la surveillance
    if (alarmCheckInterval) {
        clearInterval(alarmCheckInterval);
        alarmCheckInterval = null;
    }
    
    // Réinitialiser l'alarme
    alarmTime = null;
    
    // ✅ NETTOYER les variables globales
    window.alarmProgrammed = false;
    window.alarmTimeSet = null;
    
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

// NOUVELLE FONCTION : Afficher statut minuteur même popup fermée
function updateTimerStatus() {
    // Si un minuteur est en cours et que la popup est fermée
    if (timerInterval && !document.getElementById('alarmPopup')) {
        // Créer un petit indicateur flottant
        let timerFloating = document.getElementById('timerFloating');
        if (!timerFloating) {
            timerFloating = document.createElement('div');
            timerFloating.id = 'timerFloating';
            timerFloating.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: linear-gradient(145deg, #FF6B35, #e53935);
                color: white;
                padding: 10px 15px;
                border-radius: 10px;
                z-index: 1000;
                font-weight: bold;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                cursor: pointer;
                font-size: 14px;
                text-align: center;
            `;
            
            // ✅ NOUVEAU : Clic gauche = ouvrir popup, clic droit = annuler
            timerFloating.onclick = () => {
                createAlarmPopup();
            };
            
            timerFloating.oncontextmenu = (e) => {
                e.preventDefault();
                cancelTimer();
            };
            
            // ✅ AJOUT : Tooltip explicatif
            timerFloating.title = 'Clic gauche: ouvrir | Clic droit: annuler';
            
            document.body.appendChild(timerFloating);
        }
        
        // Mettre à jour l'affichage avec indication d'annulation
        const minutes = Math.floor(timerSeconds / 60);
        const seconds = timerSeconds % 60;
        timerFloating.innerHTML = `
            ⏱️ ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}<br>
            <span style="font-size: 10px; opacity: 0.8;">Clic droit: annuler</span>
        `;
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
    
    window.open('https://www.google.com/search?q=météo+montceau+les+mines+détaillée', '_blank', 'noopener,noreferrer');
    console.log('🌡️ Météo détaillée ouverte');
}

// Initialisation des widgets (version corrigée)
function initHeaderWidgets() {
    fetchTemperature();
    updateVisitorsCount();
    
    // Mise à jour périodique
    setInterval(fetchTemperature, 300000); // 5 minutes - météo
    setInterval(updateVisitorsCount, 45000); // 45 secondes - visiteurs
    setInterval(cleanupInactiveVisitors, 120000); // 2 minutes - nettoyage
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

// Démarrer au chargement
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initHeaderWidgets, 2000);
});