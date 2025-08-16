// js/football-widget.js - Widget Football avec API pour Ligue 1
class FootballWidget {
    constructor() {
        this.currentLeague = 'ligue1';
        this.updateInterval = null;
        this.notificationsEnabled = localStorage.getItem('footballNotifications') === 'true';
        this.lastScores = {};
        this.checkInterval = null;
    }

    // Informations des ligues
    getLeagues() {
        return {
            ligue1: { 
                name: 'Ligue 1', 
                flag: '🇫🇷',
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
                <div class="football-widget-count">FotMob</div>
            </div>
        `;

        this.setupEventListeners(widget);
        
        // IMPORTANT : Charger les matchs immédiatement après un court délai
        setTimeout(() => {
            if (this.currentLeague === 'ligue1') {
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
                const matchCount = document.getElementById('liveMatchCount');
                
                if (league === 'ligue1') {
                    // Afficher les éléments L1
                    if (container) container.style.display = 'block';
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