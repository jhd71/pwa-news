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
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(145deg, #4CAF50, #45a049);
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        z-index: 10002;
        font-weight: bold;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        text-align: center;
        border: 2px solid rgba(255,255,255,0.3);
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
            const countElement = document.getElementById('newsWidgetCount');

            if (news && news.length > 0) {
                
                // Afficher les actualités avec liens spécifiques
                previewContainer.innerHTML = news.map(item => {
                    const featuredIcon = item.featured ? '⭐ ' : '';
                    const shortContent = this.truncateText(item.content, 60); // Réduit pour plus d'actualités
                    return `
                        <div class="news-preview-item" data-news-id="${item.id}" onclick="openSpecificNews(${item.id})" style="cursor: pointer;">
                            <strong>${featuredIcon}${item.title}</strong><br>
                            <span style="font-size: 13px;">${shortContent}...</span>
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

// ✅ SOLUTION CORRIGÉE - Hash des URLs longues
async function fetchLocalNewsForWidget() {
    try {
        console.log('📰 Récupération actualités locales pour widget...');
        const supabase = window.getSupabaseClient();
        if (!supabase) {
            console.warn('❌ Supabase non disponible');
            return;
        }

        // Utiliser votre API Vercel existante
        const response = await fetch('/api/getNews');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const articles = await response.json();
        console.log(`📡 ${articles.length} articles récupérés depuis l'API`);

        // Traiter chaque article pour créer un résumé original
        for (const article of articles.slice(0, 5)) { // Limiter à 5 pour le widget
            try {
                // ✅ CORRECTION : Créer un hash court de l'URL pour éviter l'erreur 400
                const urlHash = btoa(article.link).substring(0, 50); // Hash base64 tronqué
                
                // Vérifier si l'article existe déjà avec le hash
                const { data: existing } = await supabase
                    .from('local_news')
                    .select('id')
                    .eq('url_hash', urlHash)
                    .single();

                if (!existing) {
                    // Créer un résumé original basé sur le titre et la source
                    const originalSummary = createOriginalSummary(article);
                    
                    // ✅ CORRECTION : Utiliser url_hash au lieu de source_url longue
                    const { error } = await supabase
                        .from('local_news')
                        .insert({
                            title: article.title,
                            content: originalSummary,
                            url_hash: urlHash, // Hash court au lieu de l'URL complète
                            source_url: article.link, // URL complète stockée mais pas utilisée pour les requêtes
                            source: article.source,
                            is_published: true,
                            featured: isLocalSource(article.source),
                            created_at: new Date(article.date || Date.now()).toISOString()
                        });

                    if (!error) {
                        console.log(`➕ Widget: ${article.title.substring(0, 50)}...`);
                    } else {
                        console.warn('❌ Erreur insertion:', error);
                    }
                } else {
                    console.log(`⏭️ Article existant: ${article.title.substring(0, 30)}...`);
                }
            } catch (articleError) {
                console.warn('❌ Erreur traitement article:', articleError);
            }
        }

        // Recharger le widget
        if (newsWidget) {
            setTimeout(() => {
                newsWidget.refresh();
            }, 1500);
        }

    } catch (error) {
        console.error('❌ Erreur récupération actualités widget:', error);
    }
}

// ✅ FONCTION - Créer résumé original (pas de copie)
function createOriginalSummary(article) {
    const summaries = {
        'Montceau News': `Nouvelle information rapportée par Montceau News concernant les événements locaux de Montceau-les-Mines et environs.`,
        'Le JSL': `Le Journal de Saône-et-Loire signale cette actualité concernant notre région.`,
        'L\'Informateur': `L'Informateur de Bourgogne relaie cette information locale importante.`,
        'Creusot-Infos': `Creusot-Infos rapporte cette actualité du bassin minier du Creusot et Montceau.`,
        'France Bleu': `France Bleu Bourgogne couvre cette actualité régionale.`,
        'default': `Actualité locale rapportée par ${article.source}.`
    };

    let baseSummary = summaries[article.source] || summaries['default'];
    
    // Ajouter contexte selon mots-clés du titre
    if (article.title.toLowerCase().includes('montceau')) {
        baseSummary += ' Cette information concerne directement Montceau-les-Mines.';
    } else if (article.title.toLowerCase().includes('saône')) {
        baseSummary += ' Cette actualité touche le département de Saône-et-Loire.';
    } else if (article.title.toLowerCase().includes('chalon')) {
        baseSummary += ' Cette information concerne Chalon-sur-Saône et sa région.';
    }
    
    baseSummary += ` Consultez l'article complet sur ${article.source} pour plus de détails.`;
    
    return baseSummary;
}

// ✅ FONCTION - Identifier sources locales
function isLocalSource(source) {
    const localSources = ['Montceau News', 'Le JSL', 'L\'Informateur', 'Creusot-Infos'];
    return localSources.includes(source);
}

// ✅ FONCTION - Nettoyage automatique ancien contenu CORRIGÉE
async function cleanupOldNews() {
    try {
        const supabase = window.getSupabaseClient();
        if (!supabase) return;

        // Supprimer les actualités de plus de 7 jours
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { error } = await supabase
            .from('local_news')
            .delete()
            .lt('created_at', sevenDaysAgo.toISOString());

        if (!error) {
            console.log('🧹 Nettoyage automatique des anciennes actualités');
        }
    } catch (error) {
        console.warn('❌ Erreur nettoyage:', error);
    }
}

// ✅ FONCTION - Créer résumé original (pas de copie)
function createOriginalSummary(article) {
    const summaries = {
        'Montceau News': `Nouvelle information rapportée par Montceau News concernant les événements locaux de Montceau-les-Mines et environs.`,
        'Le JSL': `Le Journal de Saône-et-Loire signale cette actualité concernant notre région.`,
        'L\'Informateur': `L'Informateur de Bourgogne relaie cette information locale importante.`,
        'Creusot-Infos': `Creusot-Infos rapporte cette actualité du bassin minier du Creusot et Montceau.`,
        'France Bleu': `France Bleu Bourgogne couvre cette actualité régionale.`,
        'default': `Actualité locale rapportée par ${article.source}.`
    };

    let baseSummary = summaries[article.source] || summaries['default'];
    
    // Ajouter contexte selon mots-clés du titre
    if (article.title.toLowerCase().includes('montceau')) {
        baseSummary += ' Cette information concerne directement Montceau-les-Mines.';
    } else if (article.title.toLowerCase().includes('saône')) {
        baseSummary += ' Cette actualité touche le département de Saône-et-Loire.';
    } else if (article.title.toLowerCase().includes('chalon')) {
        baseSummary += ' Cette information concerne Chalon-sur-Saône et sa région.';
    }
    
    baseSummary += ` Consultez l'article complet sur ${article.source} pour plus de détails.`;
    
    return baseSummary;
}

// ✅ FONCTION - Identifier sources locales
function isLocalSource(source) {
    const localSources = ['Montceau News', 'Le JSL', 'L\'Informateur', 'Creusot-Infos'];
    return localSources.includes(source);
}

// ✅ FONCTION - Nettoyage automatique ancien contenu
async function cleanupOldNews() {
    try {
        const supabase = window.getSupabaseClient();
        if (!supabase) return;

        // Supprimer les actualités de plus de 7 jours
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { error } = await supabase
            .from('local_news')
            .delete()
            .lt('created_at', sevenDaysAgo.toISOString());

        if (!error) {
            console.log('🧹 Nettoyage automatique des anciennes actualités');
        }
    } catch (error) {
        console.warn('❌ Erreur nettoyage:', error);
    }
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
            clockElement.title = 'Horloge • Cliquez pour alarme & minuteur ⏰';
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

// Fonction pour afficher la popup visiteurs avec un graphique dynamique
function showVisitorsPopup(labels, dataPoints, totalUniqueVisitors) {
    const existing = document.getElementById('visitorsPopup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'visitorsPopup';
    popup.innerHTML = `
        <div class="visitors-popup-overlay" onclick="document.getElementById('visitorsPopup')?.remove()"></div>
        <div class="visitors-popup-content">
            <div class="visitors-popup-header">
                <span>👥 Visiteurs actifs sur 24h</span>
                <span class="close-btn" onclick="document.getElementById('visitorsPopup')?.remove()">✕</span>
            </div>
            <canvas id="visitorsChart" height="200"></canvas>
            <div class="visitors-popup-footer">
                <strong>${totalUniqueVisitors}</strong> visiteurs uniques sur les 24 dernières heures
            </div>
        </div>
        <style>
        #visitorsPopup {
            position: fixed;
            top: 0; left: 0;
            width: 100vw; height: 100vh;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .visitors-popup-overlay {
            position: absolute;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.5);
        }
        .visitors-popup-content {
            position: relative;
            background: var(--popup-bg, white);
            color: var(--popup-color, #111);
            border-radius: 16px;
            padding: 20px;
            max-width: 90vw;
            width: 420px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.4);
        }
        .visitors-popup-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 10px;
        }
        .close-btn {
            cursor: pointer;
            font-size: 18px;
        }
        .visitors-popup-footer {
            text-align: center;
            margin-top: 15px;
            font-size: 14px;
        }
        @media (max-width: 480px) {
            .visitors-popup-content {
                width: 95vw;
                padding: 15px;
            }
        }
        :root[data-theme='dark'] {
            --popup-bg: #1e1e1e;
            --popup-color: #f1f1f1;
        }
        </style>
    `;
    document.body.appendChild(popup);

    new Chart(document.getElementById("visitorsChart"), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: "Visiteurs",
                data: dataPoints,
                borderColor: "#e53935",
                backgroundColor: "rgba(229,57,53,0.1)",
                pointBackgroundColor: "#e53935",
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
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
    
    // Message de confirmation stylé
    const confirmation = document.createElement('div');
    confirmation.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ff4444;
        color: white;
        padding: 20px 25px;
        border-radius: 15px;
        z-index: 10001;
        font-weight: bold;
        box-shadow: 0 8px 25px rgba(0,0,0,0.4);
        font-size: 16px;
        text-align: center;
        border: 2px solid rgba(255,255,255,0.3);
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
    
    // Message de confirmation pour minuteur
    setTimeout(() => {
        const confirmation = document.createElement('div');
        confirmation.style.cssText = `
            position: fixed;
            top: 10px;
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

function updateTimerStatus() {
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
                // ✅ VERSION MOBILE : 2 boutons séparés
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
                        background: linear-gradient(145deg, #FF6B35, #e53935);
                        color: white;
                        padding: 8px 5px;
                        border-radius: 12px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.4);
                        cursor: pointer;
                        font-size: 14px;
                        text-align: center;
                        border: 2px solid rgba(255,255,255,0.3);
                        min-width: 80px;
                    " onclick="createAlarmPopup()">
                        <div style="font-size: 16px; margin-bottom: 2px;" id="timerTimeDisplay">⏱️ --:--</div>
                        <div style="font-size: 9px; opacity: 0.9; line-height: 1;">Toucher pour ouvrir</div>
                    </div>
                    <button style="
                        background: #ff4444;
                        color: white;
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
                // ✅ VERSION DESKTOP : Clic droit classique
                timerFloating.style.cssText = `
                    position: fixed;
                    top: 240px;
                    right: 10px;
                    background: linear-gradient(145deg, #FF6B35, #e53935);
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
                    border: 2px solid rgba(255,255,255,0.3);
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
                <div style="font-size: 9px; opacity: 0.9; line-height: 1;">Clic droit = stop</div>
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
    
    window.open('https://www.google.com/search?q=météo+montceau+les+mines+détaillée', '_blank', 'noopener,noreferrer');
    console.log('🌡️ Météo détaillée ouverte');
}

// Initialisation des widgets (version corrigée)
function initHeaderWidgets() {
    fetchTemperatureOptimized(); // ✅ Au lieu de fetchTemperature()
    updateVisitorsCount();
    
    setInterval(fetchTemperatureOptimized, 300000); // ✅ Changez ici aussi
    setInterval(updateVisitorsCount, 45000);
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

// ✅ AUTOMATISATION INTELLIGENTE
document.addEventListener('DOMContentLoaded', function() {
    // Lancement initial après 5 secondes
    setTimeout(() => {
        console.log('🚀 Chargement initial actualités widget');
        fetchLocalNewsForWidget();
    }, 5000);

    // Puis toutes les 30 minutes (plus fréquent pour widget)
    setInterval(() => {
        console.log('🔄 Mise à jour automatique widget (30min)');
        fetchLocalNewsForWidget();
    }, 30 * 60 * 1000);

    // Nettoyage quotidien
    setInterval(() => {
        cleanupOldNews();
    }, 24 * 60 * 60 * 1000);
});

// ✅ BOUTON TEST pour vérifier
function testWidgetUpdate() {
    console.log('🧪 Test manuel widget news');
    fetchLocalNewsForWidget();
}

window.testWidgetUpdate = testWidgetUpdate;

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

// Export pour usage externe
window.NewsWidget = NewsWidget;