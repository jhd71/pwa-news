// js/football-widget.js - Widget Football avec API Football-Data.org
class FootballWidget {
    constructor() {
    this.currentLeague = 'ligue1';
    this.updateInterval = null;
    // Charger l'état sauvegardé des notifications
    this.notificationsEnabled = localStorage.getItem('footballNotifications') === 'true';
    this.lastScores = {};
    this.checkInterval = null;
    this.liveMatches = [];
}

    // Configuration des ligues avec les IDs de l'API
    getLeagues() {
        return {
            ligue1: { 
                name: 'Ligue 1', 
                flag: '🇫🇷',
                apiId: 'FL1', // ID pour l'API
                urls: {
                    classements: 'https://www.fotmob.com/fr/leagues/53/table/ligue-1',
                    scores: 'https://www.fotmob.com/fr/leagues/53/matches/ligue-1?group=by-date',
                    actualites: 'https://www.fotmob.com/fr/leagues/53/news/ligue-1',
                    transferts: 'https://www.fotmob.com/fr/leagues/53/transfers/ligue-1'
                }
            },
            ligue2: { 
                name: 'Ligue 2', 
                flag: '🇫🇷',
                apiId: 'FL2', // Ligue 2 non disponible en gratuit
                urls: {
                    classements: 'https://www.fotmob.com/fr/leagues/110/table/ligue-2',
                    scores: 'https://www.fotmob.com/fr/leagues/110/matches/ligue-2?group=by-date',
                    actualites: 'https://www.fotmob.com/fr/leagues/110/news/ligue-2',
                    transferts: 'https://www.fotmob.com/fr/leagues/110/transfers/ligue-2'
                }
            },
            live: {
                name: 'Tous les matchs',
                flag: '🌍',
                apiId: 'FL1', // Par défaut sur Ligue 1
                urls: {
                    scores: 'https://www.fotmob.com/fr',
                    actualites: 'https://www.fotmob.com/fr/news',
                    transferts: 'https://www.fotmob.com/fr/transfers'
                }
            }
        };
    }

    createWidget() {
        const widget = document.createElement('div');
        widget.className = 'football-widget';
        widget.id = 'footballWidget';
        
        widget.innerHTML = `
            <div class="football-widget-header">
                <span class="football-widget-title">⚽ FOOTBALL</span>
                
                <!-- Bouton notifications -->
                <button class="notif-toggle" id="notifToggle" title="Notifications de buts">
                    🔔
                </button>
                
                <div class="league-tabs">
                    <button class="league-tab active" data-league="ligue1">L1</button>
                    <button class="league-tab" data-league="ligue2">L2</button>
                    <button class="league-tab" data-league="live">LIVE</button>
                </div>
            </div>
            
            <div class="football-widget-preview" id="footballWidgetPreview">
                <div class="current-league" id="currentLeague">
                    🇫🇷 Ligue 1
                </div>
                
                <!-- Zone des scores en direct -->
                <div class="live-scores-container" id="liveScoresContainer">
                    <!-- Les scores seront injectés ici -->
                </div>
                
                <div class="football-features" id="footballFeatures">                   
                    <div class="feature-item" data-action="scores">
                        <span class="feature-icon">⚽</span>
                        <span>Scores live</span>
                    </div>
                    <div class="feature-item" data-action="actualites">
                        <span class="feature-icon">📰</span>
                        <span>Actualités Foot</span>
                    </div>
                    <div class="feature-item" data-action="transferts">
                        <span class="feature-icon">💰</span>
                        <span>Derniers transferts</span>
                    </div>
                </div>
            </div>
            
            <div class="football-widget-footer">
    <span id="liveMatchCount" class="match-count">Chargement...</span>
    <div class="football-widget-count">FotMob</div>
	</div>
            </div>
        `;

// Restaurer l'état du bouton notifications
    setTimeout(() => {
        if (this.notificationsEnabled) {
            const notifToggle = widget.querySelector('#notifToggle');
            if (notifToggle) {
                notifToggle.classList.add('active');
            }
        }
    }, 100);
	
        this.setupEventListeners(widget);
        this.initializeAPI(); // Initialiser l'API
        return widget;
    }

    // Initialiser la connexion API
    async initializeAPI() {
        // Charger les matchs au démarrage
        await this.loadTodayMatches();
        
        // Actualiser toutes les 60 secondes
        this.updateInterval = setInterval(() => {
            this.loadTodayMatches();
        }, 60000);
    }

    // Remplacez TOUTE la méthode loadTodayMatches() par celle-ci :
async loadTodayMatches() {
    try {
        const leagues = this.getLeagues();
        const leagueId = leagues[this.currentLeague].apiId;
        
        // Si c'est la Ligue 2, on ne peut pas avec l'API gratuite
        if (leagueId === 'FL2') {
            this.displayMessage('⚠️ Ligue 2 non disponible avec l\'API gratuite');
            document.getElementById('liveMatchCount').textContent = 'Ligue 2 indisponible';
            return;
        }
        
        // Utiliser VOTRE proxy API sur Vercel
        const response = await fetch(`/api/football-data?competition=${leagueId}&endpoint=matches`);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Vérifier si on a des données
        if (!data.matches) {
            throw new Error('Pas de données de matchs');
        }
        
        this.liveMatches = data.matches;
        
        // Afficher les matchs réels
        this.displayLiveMatches();
        
        // Vérifier les buts si notifications activées
        if (this.notificationsEnabled) {
            this.checkForGoals();
        }
        
        console.log(`⚽ ${this.liveMatches.length} matchs chargés pour ${leagues[this.currentLeague].name}`);
        
    } catch (error) {
        console.error('Erreur chargement matchs:', error);
        this.displayError(error.message);
    }
}

// Ajouter cette méthode pour récupérer le classement
async loadStandings() {
    try {
        const leagues = this.getLeagues();
        const leagueId = leagues[this.currentLeague].apiId;
        
        if (leagueId === 'FL2') {
            console.log('Classement Ligue 2 non disponible');
            return;
        }
        
        // Appel via votre proxy
        const response = await fetch(`/api/football-data?competition=${leagueId}&endpoint=standings`);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.standings && data.standings[0]) {
            const table = data.standings[0].table;
            console.log(`📊 Classement ${leagues[this.currentLeague].name}:`, 
                table.slice(0, 5).map(team => `${team.position}. ${team.team.name} (${team.points}pts)`));
        }
        
    } catch (error) {
        console.error('Erreur chargement classement:', error);
    }
}

// Ajouter cette méthode pour afficher les erreurs proprement
displayError(errorMessage) {
    const container = document.getElementById('liveScoresContainer');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <span class="error-icon">⚠️</span>
                <div class="error-text">
                    <strong>Impossible de charger les matchs</strong>
                    <br>
                    <small>${errorMessage}</small>
                </div>
            </div>
        `;
    }
    document.getElementById('liveMatchCount').textContent = 'Erreur de chargement';
}

    // Afficher les matchs en direct
displayLiveMatches() {
    const container = document.getElementById('liveScoresContainer');
    if (!container) return;
    
    // Obtenir la date d'aujourd'hui (sans l'heure)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Filtrer les matchs qui sont VRAIMENT aujourd'hui
    const todayMatches = this.liveMatches.filter(match => {
        const matchDate = new Date(match.utcDate);
        return matchDate >= today && matchDate < tomorrow;
    });
    
    // Trier les matchs par heure
    todayMatches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
    
    if (todayMatches.length === 0) {
        container.innerHTML = '<div class="no-matches">Aucun match de Ligue 1 aujourd\'hui</div>';
        document.getElementById('liveMatchCount').textContent = 'Aucun match';
        return;
    }
    
    // Générer le HTML des matchs
    let html = '';
    let liveCount = 0;
    
    todayMatches.forEach(match => {
        const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED' || match.status === 'HALFTIME';
        const isFinished = match.status === 'FINISHED';
        if (isLive) liveCount++;
        
        const homeScore = match.score?.fullTime?.home ?? match.score?.halfTime?.home ?? '-';
        const awayScore = match.score?.fullTime?.away ?? match.score?.halfTime?.away ?? '-';
        const matchTime = this.getMatchTime(match);
        
        html += `
            <div class="live-score ${isLive ? 'match-active' : ''} ${isFinished ? 'match-finished' : ''}">
                <div class="match-teams">
                    <span class="team home">${match.homeTeam.shortName || match.homeTeam.name}</span>
                    <span class="score">${homeScore} - ${awayScore}</span>
                    <span class="team away">${match.awayTeam.shortName || match.awayTeam.name}</span>
                </div>
                <div class="match-info">
                    <span class="match-time">${matchTime}</span>
                    ${isLive ? '<span class="live-indicator">LIVE</span>' : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Mettre à jour le compteur avec le bon texte
    let countText;
    if (liveCount > 0) {
        countText = `🔴 ${liveCount} match${liveCount > 1 ? 's' : ''} en direct`;
    } else if (todayMatches.length === 1) {
        countText = '1 match aujourd\'hui';
    } else {
        countText = `${todayMatches.length} matchs aujourd\'hui`;
    }
    
    document.getElementById('liveMatchCount').textContent = countText;
}

// Amélioration de getMatchTime pour plus de détails
getMatchTime(match) {
    switch(match.status) {
        case 'IN_PLAY':
            return match.minute ? `${match.minute}'` : 'En cours';
        case 'HALFTIME':
            return 'Mi-temps';
        case 'PAUSED':
            return 'Pause';
        case 'FINISHED':
            return 'Terminé';
        case 'POSTPONED':
            return 'Reporté';
        case 'CANCELLED':
            return 'Annulé';
        case 'SCHEDULED':
        case 'TIMED':
            const date = new Date(match.utcDate);
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        default:
            return match.status;
    }
}

    // Vérifier les nouveaux buts
    checkForGoals() {
        this.liveMatches.forEach(match => {
            if (match.status !== 'IN_PLAY') return;
            
            const matchKey = `${match.homeTeam.id}-${match.awayTeam.id}`;
            const currentScore = `${match.score.fullTime?.home || 0}-${match.score.fullTime?.away || 0}`;
            
            // Si le score a changé
            if (this.lastScores[matchKey] && this.lastScores[matchKey] !== currentScore) {
                this.showGoalNotification({
                    home: match.homeTeam.name,
                    away: match.awayTeam.name,
                    homeScore: match.score.fullTime?.home || 0,
                    awayScore: match.score.fullTime?.away || 0
                });
            }
            
            this.lastScores[matchKey] = currentScore;
        });
    }

    // Afficher une notification de but
    showGoalNotification(match) {
        // Notification navigateur
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⚽ BUT en Ligue 1 !', {
                body: `${match.home} ${match.homeScore} - ${match.awayScore} ${match.away}`,
                icon: '/images/football-icon.png',
                tag: 'goal-notification',
                requireInteraction: false
            });
        }
        
        // Notification visuelle
        const notification = document.createElement('div');
        notification.className = 'goal-notification';
        notification.innerHTML = `
            <span class="goal-icon">⚽</span>
            <div class="goal-title">BUT !</div>
            <div class="goal-match">${match.home} ${match.homeScore} - ${match.awayScore} ${match.away}</div>
        `;
        
        document.body.appendChild(notification);
        
        // Vibration mobile
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
        
        // Son optionnel
        this.playGoalSound();
        
        // Supprimer après 5 secondes
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.5s';
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    // Jouer un son de but
    playGoalSound() {
        try {
            const audio = new Audio('data:audio/mp3;base64,SUQzAwAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjIwLjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAAFgABVVVVVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqqqqqqqv///////////////////////////');
            audio.volume = 0.3;
            audio.play().catch(() => {});
        } catch (e) {}
    }

    setupEventListeners(widget) {
        const leagues = this.getLeagues();
        const currentLeagueDisplay = widget.querySelector('#currentLeague');
        
        // Gestion du bouton notifications
        const notifToggle = widget.querySelector('#notifToggle');
        if (notifToggle) {
            notifToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    
    this.notificationsEnabled = !this.notificationsEnabled;
    notifToggle.classList.toggle('active', this.notificationsEnabled);
    
    // Sauvegarder l'état
    localStorage.setItem('footballNotifications', this.notificationsEnabled);
    
    if (this.notificationsEnabled) {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showToast('🔔 Notifications activées !');
                } else {
                    this.showToast('⚠️ Autorisez les notifications');
                    this.notificationsEnabled = false;
                    localStorage.setItem('footballNotifications', 'false');
                    notifToggle.classList.remove('active');
                }
            });
        }
    } else {
        this.showToast('🔕 Notifications désactivées');
    }
    
    if (navigator.vibrate) navigator.vibrate(50);
});
        }
        
        // Changement de ligue
        const tabs = widget.querySelectorAll('.league-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                
                if (navigator.vibrate) navigator.vibrate(30);
                
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const league = tab.dataset.league;
                this.currentLeague = league;
                
                const leagueInfo = leagues[league];
                currentLeagueDisplay.innerHTML = `${leagueInfo.flag} ${leagueInfo.name}`;
                
                // Recharger les matchs pour la nouvelle ligue
                this.loadTodayMatches();
                
                currentLeagueDisplay.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    currentLeagueDisplay.style.transform = 'scale(1)';
                }, 200);
            });
        });

        // Clic sur les features
        this.setupFeatureEvents(widget);

        // Clic sur le widget
        widget.addEventListener('click', (e) => {
            if (e.target.closest('.league-tab') || 
                e.target.closest('.feature-item') || 
                e.target.closest('.notif-toggle')) return;
            
            this.openFootballDetails(widget);
        });
    }

    setupFeatureEvents(container) {
        const leagues = this.getLeagues();
        const featureItems = container.querySelectorAll('.feature-item[data-action]');
        
        featureItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const action = item.dataset.action;
                const currentLeagueInfo = leagues[this.currentLeague];
                const url = currentLeagueInfo.urls[action];
                
                item.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    item.style.transform = 'scale(1)';
                }, 150);
                
                if (navigator.vibrate) navigator.vibrate(50);
                
                window.open(url, '_blank');
                
                this.showToast(`Ouverture ${action}...`);
            });
        });
    }

    openFootballDetails(widget) {
        const leagues = this.getLeagues();
        
        widget.style.transform = 'scale(0.98)';
        setTimeout(() => {
            widget.style.transform = 'scale(1)';
        }, 150);
        
        if (navigator.vibrate) navigator.vibrate(50);
        
        const currentLeagueInfo = leagues[this.currentLeague];
        const url = this.currentLeague === 'live' 
            ? currentLeagueInfo.urls.scores 
            : currentLeagueInfo.urls.classements;
        
        window.open(url, '_blank');
        this.showToast(`Ouverture ${currentLeagueInfo.name}...`);
    }

    displayMessage(message) {
        const container = document.getElementById('liveScoresContainer');
        if (container) {
            container.innerHTML = `<div class="info-message">${message}</div>`;
        }
    }

    showToast(message) {
        if (typeof window.contentManager !== 'undefined' && 
            window.contentManager.showToast && 
            typeof window.contentManager.showToast === 'function') {
            window.contentManager.showToast(message);
            return;
        }
        
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
        }, 2500);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }
}

// Fonction globale pour créer le widget
window.createFootballWidget = function() {
    const footballWidget = new FootballWidget();
    return footballWidget.createWidget();
};

// Fonction pour intégrer le widget selon la taille d'écran
window.addFootballToWidgets = function() {
    setTimeout(() => {
        // Vérifier si le widget existe déjà
        if (document.getElementById('footballWidget')) {
            console.log('⚽ Widget Football déjà présent');
            return;
        }
        
        // Fonction pour détecter le mode d'affichage optimal
        const shouldUseWidgetMode = () => {
            const width = window.innerWidth;
            // Mode widget seulement si vraiment large (3 widgets côte à côte)
            return width >= 1200;
        };
        
        const addFootballWidget = () => {
            // Supprimer le widget existant s'il y en a un
            const existingWidget = document.getElementById('footballWidget');
            if (existingWidget) {
                existingWidget.closest('.football-widget-container, .football-widget-container-in-tiles')?.remove();
            }
            
            if (shouldUseWidgetMode()) {
                // ✅ DESKTOP LARGE : Ajouter dans les widgets en haut
                addFootballToWidgetsRow();
            } else {
                // ✅ MOBILE/TABLET : Ajouter dans les tuiles après Sports
                addFootballToTiles();
            }
        };
        
        // Ajouter immédiatement
        addFootballWidget();
        
        // Écouter les changements de taille d'écran avec debounce
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                addFootballWidget();
            }, 150);
        });
        
    }, 800);
};

// Fonction pour ajouter dans les widgets (DESKTOP)
function addFootballToWidgetsRow() {
    const widgetsRow = document.querySelector('.widgets-row');
    if (!widgetsRow) {
        console.warn('⚠️ Conteneur widgets-row non trouvé');
        return;
    }
    
    const footballContainer = document.createElement('div');
    footballContainer.className = 'football-widget-container';
    
    const footballWidget = window.createFootballWidget();
    footballContainer.appendChild(footballWidget);
    
    widgetsRow.appendChild(footballContainer);
    console.log('⚽ Widget Football ajouté dans widgets-row (DESKTOP)');
}

// Fonction pour ajouter dans les tuiles (MOBILE)
function addFootballToTiles() {
    const tileContainer = document.getElementById('tileContainer');
    if (!tileContainer) {
        console.warn('⚠️ Conteneur tuiles non trouvé');
        return;
    }
    
    // Trouver le séparateur "Réseaux Sociaux"
    const separators = tileContainer.querySelectorAll('.separator');
    let socialSeparator = null;
    
    separators.forEach(sep => {
        if (sep.textContent.includes('Réseaux Sociaux')) {
            socialSeparator = sep;
        }
    });
    
    if (!socialSeparator) {
        console.warn('⚠️ Séparateur Réseaux Sociaux non trouvé');
        return;
    }
    
    // Créer le conteneur pour mobile
    const footballContainer = document.createElement('div');
    footballContainer.className = 'football-widget-container-in-tiles';
    footballContainer.style.cssText = `
        width: 100%;
        max-width: 800px;
        margin: 15px auto;
        padding: 0 10px;
    `;
    
    const footballWidget = window.createFootballWidget();
    footballContainer.appendChild(footballWidget);
    
    // Insérer AVANT le séparateur "Réseaux Sociaux"
    socialSeparator.parentNode.insertBefore(footballContainer, socialSeparator);
    console.log('⚽ Widget Football ajouté avant Réseaux Sociaux (MOBILE)');
}

// Écouter les changements de thème pour mettre à jour le widget
document.addEventListener('themeChanged', function(e) {
    const footballWidget = document.getElementById('footballWidget');
    if (footballWidget) {
        // Forcer la mise à jour du style
        footballWidget.style.transition = 'all 0.5s ease';
        
        // Animation subtile lors du changement de thème
        footballWidget.style.transform = 'scale(1.02)';
        setTimeout(() => {
            footballWidget.style.transform = 'scale(1)';
        }, 300);
        
        console.log('⚽ Widget Football mis à jour pour le thème:', e.detail.theme);
    }
});

console.log('⚽ Football Widget RÉEL chargé avec succès (FotMob + Responsive + Thèmes)');