// js/football-widget.js - Widget Football SIMPLE pour Actu&Média
class FootballWidget {
    constructor() {
        this.currentLeague = 'ligue1'; // Toujours Ligue 1 au démarrage
    }

    // Informations des ligues avec juste les liens
    getLeagues() {
        return {
            ligue1: { 
                name: 'Ligue 1', 
                flag: '🇫🇷',
                urls: {
                    classements: 'https://www.fotmob.com/fr/leagues/53/table/ligue-1',
                    scores: 'https://www.fotmob.com/fr/leagues/53/matches/ligue-1',
                    actualites: 'https://www.fotmob.com/fr/leagues/53/news/ligue-1',
                    transferts: 'https://www.fotmob.com/fr/leagues/53/transfers/ligue-1'
                }
            },
            ligue2: { 
                name: 'Ligue 2', 
                flag: '🇫🇷',
                urls: {
                    classements: 'https://www.fotmob.com/fr/leagues/110/table/ligue-2',
                    scores: 'https://www.fotmob.com/fr/leagues/110/matches/ligue-2',
                    actualites: 'https://www.fotmob.com/fr/leagues/110/news/ligue-2',
                    transferts: 'https://www.fotmob.com/fr/leagues/110/transfers/ligue-2'
                }
            },
            tout: {  // Changé de 'live' à 'tout'
            name: 'Tout le foot',  // Changé de 'Tous les matchs'
            flag: '⚽',  // Emoji ballon au lieu du globe
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
                
                <div class="league-tabs">
    <button class="league-tab active" data-league="ligue1">L1</button>
    <button class="league-tab" data-league="ligue2">L2</button>
    <button class="league-tab" data-league="tout">TOUT</button>  <!-- Changé de LIVE à TOUT -->
			</div>
            </div>
            
            <div class="football-widget-preview" id="footballWidgetPreview">
                <div class="current-league" id="currentLeague">
                    🇫🇷 Ligue 1
                </div>
                
                <div class="football-features" id="footballFeatures">
                    <div class="feature-item" data-action="classements">
                        <span class="feature-icon">📊</span>
                        <span>Classements</span>
                    </div>
                    <div class="feature-item" data-action="scores">
                        <span class="feature-icon">⚽</span>
                        <span>Matchs & Scores</span>
                    </div>
                    <div class="feature-item" data-action="actualites">
                        <span class="feature-icon">📰</span>
                        <span>Actualités</span>
                    </div>
                    <div class="feature-item" data-action="transferts">
                        <span class="feature-icon">💰</span>
                        <span>Transferts</span>
                    </div>
                </div>
            </div>
            
            <div class="football-widget-footer">
                <div class="football-widget-count">FotMob</div>
            </div>
        `;

        this.setupEventListeners(widget);
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
                
                // Vibration tactile
                if (navigator.vibrate) navigator.vibrate(30);
                
                // Mise à jour visuelle
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Changer la ligue
                const league = tab.dataset.league;
                this.currentLeague = league;
                
                // Mettre à jour l'affichage
                const leagueInfo = leagues[league];
                currentLeagueDisplay.innerHTML = `${leagueInfo.flag} ${leagueInfo.name}`;
                
                // Mettre à jour les boutons
                this.updateFeatures(league);
                
                // Animation
                currentLeagueDisplay.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    currentLeagueDisplay.style.transform = 'scale(1)';
                }, 200);
            });
        });

        // Clic sur les features
        this.setupFeatureEvents(widget);

        // Clic sur le badge FotMob
        const fotmobBadge = widget.querySelector('.football-widget-count');
        if (fotmobBadge) {
            fotmobBadge.style.cursor = 'pointer';
            
            fotmobBadge.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Animation
                fotmobBadge.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    fotmobBadge.style.transform = 'scale(1)';
                }, 150);
                
                if (navigator.vibrate) navigator.vibrate(50);
                
                // Ouvrir FotMob
                let url = 'https://www.fotmob.com/fr';
                if (this.currentLeague === 'ligue1') {
                    url = 'https://www.fotmob.com/fr/leagues/53/table/ligue-1';
                } else if (this.currentLeague === 'ligue2') {
                    url = 'https://www.fotmob.com/fr/leagues/110/table/ligue-2';
                }
                
                window.open(url, '_blank');
                this.showToast('Ouverture FotMob...');
            });
        }
    }

    // Mettre à jour les features selon la ligue
    updateFeatures(league) {
    const featuresContainer = document.getElementById('footballFeatures');
    if (!featuresContainer) return;

    if (league === 'tout') {  // Changé de 'live' à 'tout'
        // Mode TOUT : pas de classement car multiples championnats
        featuresContainer.innerHTML = `
            <div class="feature-item" data-action="scores">
                <span class="feature-icon">⚽</span>
                <span>Tous les matchs</span>
            </div>
            <div class="feature-item" data-action="actualites">
                <span class="feature-icon">📰</span>
                <span>Actualités mondiales</span>
            </div>
            <div class="feature-item" data-action="transferts">
                <span class="feature-icon">💰</span>
                <span>Tous les transferts</span>
            </div>
        `;
    } else {
            // Mode Ligue 1 ou 2
            featuresContainer.innerHTML = `
                <div class="feature-item" data-action="classements">
                    <span class="feature-icon">📊</span>
                    <span>Classements</span>
                </div>
                <div class="feature-item" data-action="scores">
                    <span class="feature-icon">⚽</span>
                    <span>Matchs & Scores</span>
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
                
                if (!url) {
                    // Pour LIVE, pas de classement
                    if (action === 'classements' && this.currentLeague === 'live') {
                        window.open('https://www.fotmob.com/fr', '_blank');
                    }
                    return;
                }
                
                // Animation
                item.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    item.style.transform = 'scale(1)';
                }, 150);
                
                if (navigator.vibrate) navigator.vibrate(50);
                
                window.open(url, '_blank');
                
                // Message toast simple
                const actionNames = {
                    classements: 'Classements',
                    scores: 'Matchs',
                    actualites: 'Actualités',
                    transferts: 'Transferts'
                };
                this.showToast(`Ouverture ${actionNames[action] || action}...`);
            });
        });
    }

    showToast(message) {
        // Vérifier si contentManager existe
        if (typeof window.contentManager !== 'undefined' && 
            window.contentManager.showToast && 
            typeof window.contentManager.showToast === 'function') {
            window.contentManager.showToast(message);
            return;
        }
        
        // Sinon créer un toast simple
        const existingToast = document.querySelector('.football-toast');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = 'football-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 13px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
        }, 2000);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 2300);
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
        
        // Déterminer le mode d'affichage
        const shouldUseWidgetMode = () => {
            const width = window.innerWidth;
            return width >= 1200; // Desktop large
        };
        
        const addFootballWidget = () => {
            // Supprimer widget existant si présent
            const existingWidget = document.getElementById('footballWidget');
            if (existingWidget) {
                existingWidget.closest('.football-widget-container, .football-widget-container-in-tiles')?.remove();
            }
            
            if (shouldUseWidgetMode()) {
                // Desktop : dans la ligne de widgets
                addFootballToWidgetsRow();
            } else {
                // Mobile : dans les tuiles
                addFootballToTiles();
            }
        };
        
        // Ajouter immédiatement
        addFootballWidget();
        
        // Gérer le redimensionnement
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                addFootballWidget();
            }, 250);
        });
        
    }, 800); // Délai pour laisser la page se charger
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
    console.log('⚽ Widget Football ajouté (DESKTOP)');
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
        // Si pas trouvé, l'ajouter à la fin
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
        
        tileContainer.appendChild(footballContainer);
        console.log('⚽ Widget Football ajouté à la fin (MOBILE)');
        return;
    }
    
    // Créer le conteneur
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
    
    // Insérer avant Réseaux Sociaux
    socialSeparator.parentNode.insertBefore(footballContainer, socialSeparator);
    console.log('⚽ Widget Football ajouté avant Réseaux Sociaux (MOBILE)');
}

// Écouter les changements de thème
document.addEventListener('themeChanged', function(e) {
    const footballWidget = document.getElementById('footballWidget');
    if (footballWidget) {
        // Juste une petite animation
        footballWidget.style.transition = 'all 0.5s ease';
        footballWidget.style.transform = 'scale(1.02)';
        setTimeout(() => {
            footballWidget.style.transform = 'scale(1)';
        }, 300);
        console.log('⚽ Widget Football - Thème mis à jour:', e.detail?.theme);
    }
});

// Message de chargement
console.log('⚽ Widget Football Simple chargé avec succès');