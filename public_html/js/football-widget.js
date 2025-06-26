// js/football-widget.js - Widget Football responsive pour Actu&Média
class FootballWidget {
    constructor() {
        this.currentLeague = 'live'; // 🆕 LIVE par défaut au lieu de ligue1
        this.updateInterval = null;
    }

    // Informations des ligues françaises + LIVE avec URLs CORRECTES
    getLeagues() {
        return {
            ligue1: { 
                name: 'Ligue 1', 
                flag: '🇫🇷', // ✅ Emoji drapeau français correct
                urls: {
                    classements: 'https://www.fotmob.com/fr/leagues/53/table/ligue-1',
                    scores: 'https://www.fotmob.com/fr/leagues/53/matches/ligue-1?group=by-date',
                    actualites: 'https://www.fotmob.com/fr/leagues/53/news/ligue-1'
                }
            },
            ligue2: { 
                name: 'Ligue 2', 
                flag: '🇫🇷', // ✅ Même emoji pour la cohérence
                urls: {
                    classements: 'https://www.fotmob.com/fr/leagues/110/table/ligue-2',
                    scores: 'https://www.fotmob.com/fr/leagues/110/matches/ligue-2?group=by-date',
                    actualites: 'https://www.fotmob.com/fr/leagues/110/news/ligue-2'
                }
            },
            live: {
                name: 'Tous les matchs',
                flag: '🌍',
                urls: {
                    classements: 'https://www.fotmob.com/fr', // Matchs en direct
                    scores: 'https://www.fotmob.com/fr', // Matchs en direct (même lien)
                    actualites: 'https://www.fotmob.com/fr/news', // 🆕 Actualités mondiales
                    transferts: 'https://www.fotmob.com/fr/transfers' // 🆕 Derniers transferts
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
                <span class="material-icons football-icon">sports_soccer</span>
                <span class="football-widget-title">⚽ FOOTBALL</span>
                <div class="league-tabs">
                    <button class="league-tab" data-league="ligue1">L1</button>
                    <button class="league-tab" data-league="ligue2">L2</button>
                    <button class="league-tab active" data-league="live">LIVE</button>
                </div>
            </div>
            
            <div class="football-widget-preview" id="footballWidgetPreview">
                <div class="current-league" id="currentLeague">
                    🌍 Tous les matchs
                </div>
                <div class="football-features" id="footballFeatures">
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
                </div>
            </div>
            
            <div class="football-widget-footer">
                <span class="football-widget-tap">👆 Classements & résultats en direct</span>
                <div class="football-widget-count" id="footballWidgetCount">FotMob</div>
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
                
                // Animation tactile
                if (navigator.vibrate) {
                    navigator.vibrate(30);
                }
                
                // Mise à jour visuelle des onglets
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Mettre à jour la ligue sélectionnée
                const league = tab.dataset.league;
                this.currentLeague = league;
                
                // Mettre à jour l'affichage
                const leagueInfo = leagues[league];
                currentLeagueDisplay.innerHTML = `${leagueInfo.flag} ${leagueInfo.name}`;
                
                // Mettre à jour les features selon la ligue sélectionnée
                this.updateFeatures(league);
                
                // Animation du changement
                currentLeagueDisplay.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    currentLeagueDisplay.style.transform = 'scale(1)';
                }, 200);
                
                // Mise à jour du badge
                const countDisplay = widget.querySelector('#footballWidgetCount');
                if (countDisplay) {
                    countDisplay.textContent = 'FotMob';
                }
                
                console.log(`⚽ Ligue sélectionnée: ${leagueInfo.name}`);
            });
        });

        // Clic sur les feature-items - utiliser la nouvelle méthode
        this.setupFeatureEvents(widget);

        // Clic sur le widget entier (footer ou zone vide) - ouvre les classements par défaut
        widget.addEventListener('click', (e) => {
            // Ne pas déclencher si on clique sur les onglets ou les feature-items
            if (e.target.closest('.league-tab') || e.target.closest('.feature-item[data-action]')) return;
            
            this.openFootballDetails(widget);
        });
    }

    // Nouvelle méthode pour mettre à jour les features selon la ligue
    updateFeatures(league) {
        const featuresContainer = document.getElementById('footballFeatures');
        if (!featuresContainer) return;

        if (league === 'live') {
            // Mode LIVE : Matchs en direct, Actualités mondiales, Derniers transferts
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
            // Mode Ligue 1/2 : features spécifiques
            featuresContainer.innerHTML = `
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
                    <span>Actualités foot</span>
                </div>
            `;
        }

        // Remettre les événements sur les nouveaux éléments
        this.setupFeatureEvents(featuresContainer);
    }

    // Méthode pour configurer les événements des features
    setupFeatureEvents(container) {
        const leagues = this.getLeagues();
        const featureItems = container.querySelectorAll('.feature-item[data-action]');
        
        featureItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const action = item.dataset.action;
                const currentLeagueInfo = leagues[this.currentLeague];
                const url = currentLeagueInfo.urls[action];
                
                // Animation de clic sur l'item
                item.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    item.style.transform = 'scale(1)';
                }, 150);
                
                // Animation tactile
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                
                // Ouvrir le lien spécifique
                window.open(url, '_blank');
                
                // Log et notification selon le mode
                if (this.currentLeague === 'live') {
                    const actionNames = {
                        scores: 'Matchs en direct',
                        actualites: 'Actualités mondiales',
                        transferts: 'Derniers transferts'
                    };
                    console.log(`⚽ Ouverture ${actionNames[action]} - FotMob Live`);
                    this.showToast(`Ouverture ${actionNames[action]}...`);
                } else {
                    const actionNames = {
                        classements: 'Classements',
                        scores: 'Scores live',
                        actualites: 'Actualités'
                    };
                    console.log(`⚽ Ouverture ${actionNames[action]} - ${currentLeagueInfo.name}`);
                    this.showToast(`Ouverture ${actionNames[action]} ${currentLeagueInfo.name}...`);
                }
            });
        });
    }

    openFootballDetails(widget) {
        const leagues = this.getLeagues();
        
        // Animation de clic sur le widget
        widget.style.transform = 'scale(0.98)';
        setTimeout(() => {
            widget.style.transform = 'scale(1)';
        }, 150);
        
        // Animation tactile
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Ouvrir selon le mode sélectionné
        const currentLeagueInfo = leagues[this.currentLeague];
        let url, actionName;
        
        if (this.currentLeague === 'live') {
            // Mode LIVE : ouvre les matchs en direct par défaut
            url = currentLeagueInfo.urls.scores;
            actionName = 'Matchs en direct';
        } else {
            // Mode Ligue 1/2 : ouvre les classements par défaut
            url = currentLeagueInfo.urls.classements;
            actionName = 'Classements';
        }
        
        window.open(url, '_blank');
        
        // Log et notification
        const leagueName = currentLeagueInfo.name;
        console.log(`⚽ Ouverture ${actionName} - ${leagueName}`);
        
        // Afficher une notification discrète
        this.showToast(`Ouverture ${actionName}...`);
    }

    showToast(message) {
        // Vérifier si une fonction toast existe globalement
        if (typeof window.contentManager !== 'undefined' && 
            window.contentManager.showToast && 
            typeof window.contentManager.showToast === 'function') {
            window.contentManager.showToast(message);
            return;
        }
        
        // Sinon, créer une notification simple
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
            font-family: 'Roboto', sans-serif;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animation d'apparition
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

// Fonction pour intégrer le widget dans la structure existante
window.addFootballToWidgets = function() {
    // Attendre que les widgets soient chargés
    setTimeout(() => {
        // Chercher le conteneur des widgets
        const widgetsRow = document.querySelector('.widgets-row');
        if (!widgetsRow) {
            console.warn('⚠️ Conteneur widgets-row non trouvé');
            return;
        }
        
        // Vérifier si le widget existe déjà
        if (document.getElementById('footballWidget')) {
            console.log('⚽ Widget Football déjà présent');
            return;
        }
        
        // Créer le conteneur pour le widget football
        const footballContainer = document.createElement('div');
        footballContainer.className = 'football-widget-container';
        
        // Créer le widget
        const footballWidget = window.createFootballWidget();
        footballContainer.appendChild(footballWidget);
        
        // Ajouter au conteneur des widgets
        widgetsRow.appendChild(footballContainer);
        
        console.log('⚽ Widget Football ajouté avec succès aux widgets');
        
    }, 1000); // Délai pour s'assurer que les autres widgets sont chargés
};

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