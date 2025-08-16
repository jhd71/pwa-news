// js/football-widget.js - Widget Football avec API pour Ligue 1
class FootballWidget {
    constructor() {
        this.currentLeague = 'ligue1';
        this.updateInterval = null;
        this.notificationsEnabled = localStorage.getItem('footballNotifications') === 'true';
        this.lastScores = {};
        this.checkInterval = null;
        this.liveMatches = [];
    }

    // Informations des ligues
    getLeagues() {
        return {
            ligue1: { 
                name: 'Ligue 1', 
                flag: '🇫🇷',
                apiId: 'FL1', // Pour l'API
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
                
                <!-- Bouton notifications (visible seulement sur L1) -->
                <button class="notif-toggle" id="notifToggle" title="Notifications de buts" style="display: none;">
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
                
                <!-- Badge API (visible seulement pour L1) -->
                <div class="api-badge" id="apiBadge">
                    <span class="api-indicator">●</span>
                    <span>Données en direct</span>
                </div>
                
				
                <!-- Zone des scores (seulement pour L1) -->
                <div class="live-scores-container" id="liveScoresContainer" style="display: block;">
                    <div class="loading">Chargement des matchs...</div>
                </div>
                
                <div class="football-features" id="footballFeatures">
                    <div class="feature-item" data-action="classements">
                        <span class="feature-icon">📊</span>
                        <span>Classements en direct</span>
                    </div>
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
        `;

        this.setupEventListeners(widget);
        
        // IMPORTANT : Charger les matchs immédiatement après un court délai
        setTimeout(() => {
            if (this.currentLeague === 'ligue1') {
                this.showNotificationButton();
                this.initializeAPI();
            }
            
            // Restaurer l'état du bouton notifications
            if (this.notificationsEnabled && this.currentLeague === 'ligue1') {
                const notifToggle = widget.querySelector('#notifToggle');
                if (notifToggle) {
                    notifToggle.classList.add('active');
                    notifToggle.style.display = 'block';
                }
            }
        }, 500); // Délai de 500ms pour laisser le DOM se stabiliser
        
        return widget;
    }

    // Initialiser la connexion API (seulement pour L1)
    async initializeAPI() {
        if (this.currentLeague !== 'ligue1') return;
        
        // Afficher un message de chargement
        const container = document.getElementById('liveScoresContainer');
        if (container) {
            container.style.display = 'block';
            container.innerHTML = '<div class="loading">⚽ Chargement des matchs...</div>';
        }
        
        // Essayer de charger avec retry en cas d'échec
        let retryCount = 0;
        const maxRetries = 3;
        
        const tryLoad = async () => {
            try {
                await this.loadTodayMatches();
                console.log('⚽ Matchs chargés avec succès');
            } catch (error) {
                console.error(`Tentative ${retryCount + 1} échouée:`, error);
                retryCount++;
                
                if (retryCount < maxRetries) {
                    // Réessayer après 2 secondes
                    setTimeout(() => tryLoad(), 2000);
                } else {
                    // Afficher un message d'erreur après 3 tentatives
                    if (container) {
                        container.innerHTML = `
                            <div class="error-message">
                                <span>⚠️ Impossible de charger les matchs</span>
                                <br>
                                <small>Cliquez sur un onglet pour réessayer</small>
                            </div>
                        `;
                    }
                    document.getElementById('liveMatchCount').textContent = 'Erreur de connexion';
                }
            }
        };
        
        // Lancer le premier chargement
        await tryLoad();
        
        // Si le chargement initial réussit, configurer l'actualisation automatique
        if (retryCount < maxRetries) {
            // Nettoyer l'ancien interval s'il existe
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }
            
            // Actualiser toutes les 60 secondes
            this.updateInterval = setInterval(() => {
                if (this.currentLeague === 'ligue1') {
                    this.loadTodayMatches();
                }
            }, 60000);
        }
    }
	
	// Charger les matchs du jour (seulement L1)
    async loadTodayMatches() {
        const container = document.getElementById('liveScoresContainer');
        const apiBadge = document.getElementById('apiBadge');
        
        // Seulement pour Ligue 1
        if (this.currentLeague !== 'ligue1') {
            if (container) container.style.display = 'none';
            if (apiBadge) apiBadge.style.display = 'none';
            return;
        }
        
        // Afficher les éléments L1
        if (container) container.style.display = 'block';
        if (apiBadge) apiBadge.style.display = 'flex';
        
        try {
            const response = await fetch(`/api/football-data?competition=FL1&endpoint=matches`);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.matches) {
                throw new Error('Pas de données de matchs');
            }
            
            this.liveMatches = data.matches;
            this.displayLiveMatches();
            
            // Vérifier les buts si notifications activées
            if (this.notificationsEnabled) {
                this.checkForGoals();
            }
            
            console.log(`⚽ Matchs Ligue 1 chargés`);
            
        } catch (error) {
            console.error('Erreur chargement matchs:', error);
            if (container) {
                container.innerHTML = `
                    <div class="error-message">
                        <span>⚠️ Erreur de chargement</span>
                    </div>
                `;
            }
            document.getElementById('liveMatchCount').textContent = 'Erreur';
        }
    }

    // Version SIMPLIFIÉE - Matchs du jour sans prétendre au "LIVE"
displayLiveMatches() {
    const container = document.getElementById('liveScoresContainer');
    if (!container || this.currentLeague !== 'ligue1') return;
    
    // Obtenir la date d'aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Filtrer les matchs d'aujourd'hui
    const todayMatches = this.liveMatches.filter(match => {
        const matchDate = new Date(match.utcDate);
        return matchDate >= today && matchDate < tomorrow;
    });
    
    // Trier par heure
    todayMatches.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
    
    if (todayMatches.length === 0) {
        container.innerHTML = `
            <div class="no-matches">
                <div>Aucun match de Ligue 1 aujourd'hui</div>
                <button onclick="window.open('https://www.fotmob.com/fr/leagues/53/matches/ligue-1', '_blank')" 
                        style="margin-top: 10px; padding: 5px 10px; background: rgba(255,255,255,0.1); 
                               border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; 
                               color: rgba(255,255,255,0.7); cursor: pointer;">
                    Voir le calendrier →
                </button>
            </div>
        `;
        document.getElementById('liveMatchCount').textContent = 'Aucun match';
        return;
    }
    
    // Générer le HTML simplifié
    let html = '<div class="matches-today">';
    
    todayMatches.forEach(match => {
        const matchTime = new Date(match.utcDate);
        const now = new Date();
        const hasStarted = now > matchTime;
        const homeScore = match.score?.fullTime?.home ?? '-';
        const awayScore = match.score?.fullTime?.away ?? '-';
        
        // Statut simple
        let status;
        if (match.status === 'FINISHED' || match.status === 'FULL_TIME') {
            status = 'Terminé';
        } else if (hasStarted) {
            status = 'En cours'; // Pas précis mais honnête
        } else {
            status = matchTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        }
        
        html += `
            <div class="match-card ${hasStarted ? 'match-started' : 'match-scheduled'}">
                <div class="match-header">
                    <span class="match-status">${status}</span>
                </div>
                <div class="match-teams-simple">
                    <div class="team-row">
                        <span class="team-name">${match.homeTeam.shortName || match.homeTeam.name}</span>
                        <span class="team-score">${homeScore}</span>
                    </div>
                    <div class="team-row">
                        <span class="team-name">${match.awayTeam.shortName || match.awayTeam.name}</span>
                        <span class="team-score">${awayScore}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
        <div class="matches-footer">
            <small style="color: rgba(255,255,255,0.5); font-size: 10px;">
                Scores actualisés toutes les 5 min
            </small>
            <button onclick="window.open('https://www.fotmob.com/fr/leagues/53/matches/ligue-1', '_blank')" 
                    style="margin-top: 8px; padding: 4px 8px; background: rgba(0,230,118,0.1); 
                           border: 1px solid rgba(0,230,118,0.3); border-radius: 6px; 
                           color: rgba(0,230,118,0.9); cursor: pointer; font-size: 11px;">
                Scores en temps réel →
            </button>
        </div>
    </div>`;
    
    container.innerHTML = html;
    
    // Compteur simple
    const matchText = todayMatches.length === 1 ? '1 match' : `${todayMatches.length} matchs`;
    document.getElementById('liveMatchCount').textContent = `${matchText} aujourd'hui`;
    
    // Désactiver les notifications car pas fiable
    if (this.notificationsEnabled) {
        console.log('Notifications désactivées - API trop lente');
    }
}
	
	setupEventListeners(widget) {
        const leagues = this.getLeagues();
        const currentLeagueDisplay = widget.querySelector('#currentLeague');
        
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
                
                // Gérer l'affichage selon l'onglet
                const container = document.getElementById('liveScoresContainer');
                const apiBadge = document.getElementById('apiBadge');
                const matchCount = document.getElementById('liveMatchCount');
                
                if (league === 'ligue1') {
                    // Afficher les éléments L1
                    if (container) container.style.display = 'block';
                    if (apiBadge) apiBadge.style.display = 'flex';
                    this.showNotificationButton();
                    this.initializeAPI();
                } else {
                    // Masquer pour L2 et LIVE
                    if (container) container.style.display = 'none';
                    if (apiBadge) apiBadge.style.display = 'none';
                    if (notifToggle) notifToggle.style.display = 'none';
                    if (matchCount) matchCount.textContent = '';
                    
                    // Arrêter les mises à jour
                    if (this.updateInterval) {
                        clearInterval(this.updateInterval);
                        this.updateInterval = null;
                    }
                }
                
                this.updateFeatures(league);
                
                currentLeagueDisplay.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    currentLeagueDisplay.style.transform = 'scale(1)';
                }, 200);
            });
        });

        // Clic sur les feature-items
        this.setupFeatureEvents(widget);

        // Clic UNIQUEMENT sur le badge FotMob dans le footer
        const fotmobBadge = widget.querySelector('.football-widget-count');
        if (fotmobBadge) {
            fotmobBadge.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Animation
                fotmobBadge.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    fotmobBadge.style.transform = 'scale(1)';
                }, 150);
                
                if (navigator.vibrate) navigator.vibrate(50);
                
                // Ouvrir FotMob selon l'onglet actuel
                const currentLeagueInfo = leagues[this.currentLeague];
                let url;
                
                if (this.currentLeague === 'live') {
                    url = 'https://www.fotmob.com/fr';
                } else if (this.currentLeague === 'ligue1') {
                    url = 'https://www.fotmob.com/fr/leagues/53/table/ligue-1';
                } else if (this.currentLeague === 'ligue2') {
                    url = 'https://www.fotmob.com/fr/leagues/110/table/ligue-2';
                }
                
                if (url) {
                    window.open(url, '_blank');
                    this.showToast('Ouverture FotMob...');
                }
            });
            
            // Ajouter un style pour montrer que c'est cliquable
            fotmobBadge.style.cursor = 'pointer';
        }
		
    }  // Fin de setupEventListeners   

    // Mettre à jour les features selon la ligue
    updateFeatures(league) {
        const featuresContainer = document.getElementById('footballFeatures');
        if (!featuresContainer) return;

        if (league === 'live') {
            featuresContainer.innerHTML = `
                <div class="feature-item" data-action="scores">
                    <span class="feature-icon">🔴</span>
                    <span>Matchs en direct</span>
                </div>
                <div class="feature-item" data-action="actualites">
                    <span class="feature-icon">📰</span>
                    <span>Actualités mondiales</span>
                </div>
                <div class="feature-item" data-action="transferts">
                    <span class="feature-icon">💰</span>
                    <span>Derniers transferts</span>
                </div>
            `;
        } else {
            featuresContainer.innerHTML = `
                <div class="feature-item" data-action="classements">
                    <span class="feature-icon">📊</span>
                    <span>Classements</span>
                </div>
                <div class="feature-item" data-action="scores">
                    <span class="feature-icon">⚽</span>
                    <span>Scores live</span>
                </div>
                <div class="feature-item" data-action="actualites">
                    <span class="feature-icon">📰</span>
                    <span>Actualités</span>
                </div>
                <div class="feature-item" data-action="transferts">
                    <span class="feature-icon">💰</span>
                    <span>Transferts</span>
                </div>
            `;
        }

        this.setupFeatureEvents(featuresContainer);
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
                
                if (!url) return;
                
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
        
        if (url) {
            window.open(url, '_blank');
            this.showToast(`Ouverture ${currentLeagueInfo.name}...`);
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

// Fonction pour intégrer le widget (reste identique)
window.addFootballToWidgets = function() {
    setTimeout(() => {
        if (document.getElementById('footballWidget')) {
            console.log('⚽ Widget Football déjà présent');
            return;
        }
        
        const shouldUseWidgetMode = () => {
            const width = window.innerWidth;
            return width >= 1200;
        };
        
        const addFootballWidget = () => {
            const existingWidget = document.getElementById('footballWidget');
            if (existingWidget) {
                existingWidget.closest('.football-widget-container, .football-widget-container-in-tiles')?.remove();
            }
            
            if (shouldUseWidgetMode()) {
                addFootballToWidgetsRow();
            } else {
                addFootballToTiles();
            }
        };
        
        addFootballWidget();
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                addFootballWidget();
            }, 150);
        });
    }, 800);
};

// Fonctions helper (restent identiques)
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

function addFootballToTiles() {
    const tileContainer = document.getElementById('tileContainer');
    if (!tileContainer) {
        console.warn('⚠️ Conteneur tuiles non trouvé');
        return;
    }
    
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
    
    socialSeparator.parentNode.insertBefore(footballContainer, socialSeparator);
    console.log('⚽ Widget Football ajouté avant Réseaux Sociaux (MOBILE)');
}

// Listener pour les changements de thème
document.addEventListener('themeChanged', function(e) {
    const footballWidget = document.getElementById('footballWidget');
    if (footballWidget) {
        footballWidget.style.transition = 'all 0.5s ease';
        footballWidget.style.transform = 'scale(1.02)';
        setTimeout(() => {
            footballWidget.style.transform = 'scale(1)';
        }, 300);
        console.log('⚽ Widget Football mis à jour pour le thème:', e.detail.theme);
    }
});

console.log('⚽ Football Widget avec API Ligue 1 chargé avec succès');