// cinema-widget.js - Gestionnaire du widget CINÉMA (VERSION COMPLÈTE ET CORRIGÉE)

class CinemaWidget {
    constructor() {
        this.isLoaded = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.cinemaData = [];
    }

    // Initialiser le widget
    init() {
        console.log('🎬 Initialisation du widget CINÉMA');
        this.loadCinemaData();
    }

    // Charger les données cinéma - Version réaliste
    async loadCinemaData() {
        try {
            console.log('🎬 Récupération des données depuis Panacéa...');
            
            // Afficher immédiatement un état de chargement
            this.showLoadingState();
            
            // Essayer de récupérer les vraies données
            const realData = await this.fetchRealCinemaDataBackground();
            
            if (realData && realData.length > 0) {
                this.cinemaData = realData;
                this.displayCinema(realData);
                console.log(`✅ Données réelles chargées: ${realData.length} films`);
            } else {
                // Si pas de données réelles, afficher un message informatif
                this.showUnavailableState();
            }
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des données:', error);
            this.showUnavailableState();
        }
    }

    // Afficher l'état de chargement
    showLoadingState() {
        const previewContainer = document.getElementById('cinemaWidgetPreview');
        const countElement = document.getElementById('cinemaWidgetCount');
        
        if (previewContainer) {
            previewContainer.innerHTML = `
                <div class="loading-cinema">
                    <span class="material-icons spinning">hourglass_empty</span>
                    Chargement du programme...
                </div>
            `;
        }
        
        if (countElement) {
            countElement.textContent = 'Chargement...';
        }
    }

    // Afficher l'état indisponible avec liens utiles
    showUnavailableState() {
        const previewContainer = document.getElementById('cinemaWidgetPreview');
        const countElement = document.getElementById('cinemaWidgetCount');
        
        if (previewContainer) {
            previewContainer.innerHTML = `
                <div class="cinema-unavailable">
                    <div style="text-align: center; padding: 10px;">
                        <span class="material-icons" style="font-size: 24px; color: #dc3545; margin-bottom: 8px;">movie_filter</span>
                        <div style="font-weight: 500; margin-bottom: 5px;">Programme temporairement indisponible</div>
                        <div style="font-size: 12px; color: #666; line-height: 1.4;">
                            Consultez directement :<br>
                            • <a href="https://www.cinemas-panacea.fr/montceau-embarcadere/" target="_blank" style="color: #dc3545;">Site du cinéma</a><br>
                            • <a href="https://www.facebook.com/CinemaEmbarcadere" target="_blank" style="color: #dc3545;">Page Facebook</a>
                        </div>
                    </div>
                </div>
            `;
        }
        
        if (countElement) {
            countElement.textContent = 'Indisponible';
        }
        
        this.isLoaded = true; // Marquer comme chargé même si pas de données
    }

    // Chargement en arrière-plan des vraies données
    async fetchRealCinemaDataBackground() {
        try {
            // Plusieurs méthodes de récupération avec timeouts courts
            const methods = [
                () => this.fetchWithProxy('https://api.codetabs.com/v1/proxy?quest='),
                () => this.fetchWithProxy('https://cors-anywhere.herokuapp.com/'),
                () => this.fetchFromAlternativeAPI()
            ];

            for (const method of methods) {
                try {
                    const realData = await Promise.race([
                        method(),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Timeout')), 8000)
                        )
                    ]);
                    
                    if (realData && realData.length > 0) {
                        console.log(`✅ Données réelles récupérées: ${realData.length} films`);
                        return realData;
                    }
                } catch (methodError) {
                    console.warn('Méthode échouée, essai suivant...', methodError.message);
                }
            }
            
            console.log('ℹ️ Impossible de récupérer les données réelles');
            return [];
            
        } catch (error) {
            console.log('ℹ️ Chargement en arrière-plan échoué');
            return [];
        }
    }

    // Fetch avec proxy - Version améliorée
    async fetchWithProxy(proxyUrl) {
        const targetUrl = 'https://www.cinemas-panacea.fr/montceau-embarcadere/horaires/';
        const fullUrl = proxyUrl + encodeURIComponent(targetUrl);
        
        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/xhtml+xml',
                'User-Agent': 'Mozilla/5.0 (compatible; ActuMedia/1.0)'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const text = await response.text();
        
        // Vérifier si c'est du JSON (certains proxies renvoient du JSON)
        let htmlContent;
        try {
            const jsonData = JSON.parse(text);
            htmlContent = jsonData.contents || jsonData.data || text;
        } catch {
            htmlContent = text;
        }
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        return this.parseHoraires(doc);
    }

    // Alternative API (vous pourriez créer votre propre endpoint)
    async fetchFromAlternativeAPI() {
        // Ici vous pourriez appeler votre propre API si vous en créez une
        // Par exemple : /api/cinema-horaires
        throw new Error('Pas d\'API alternative configurée');
    }

    // Parser amélioré et plus robuste
    parseHoraires(doc) {
        const films = [];
        const filmsSeen = new Map();
        
        try {
            // Sélecteurs plus précis pour le site Panacéa
            const selectors = [
                '.film-item',
                '.movie-item', 
                '.seance-item',
                '[data-film]',
                'article.film',
                '.program-item'
            ];
            
            let filmElements = [];
            for (const selector of selectors) {
                filmElements = doc.querySelectorAll(selector);
                if (filmElements.length > 0) {
                    console.log(`Éléments trouvés avec sélecteur: ${selector}`);
                    break;
                }
            }
            
            if (filmElements.length === 0) {
                // Essayer une approche plus générale
                filmElements = doc.querySelectorAll('*[class*="film"], *[class*="movie"], *[class*="seance"]');
            }
            
            if (filmElements.length === 0) {
                console.warn('Aucun élément de film trouvé');
                return [];
            }
            
            filmElements.forEach((element, index) => {
                try {
                    // Chercher le titre du film
                    const titleSelectors = [
                        'h1, h2, h3',
                        '.title, .film-title, .movie-title',
                        'a[href*="/film/"]'
                    ];
                    
                    let titleElement = null;
                    for (const selector of titleSelectors) {
                        titleElement = element.querySelector(selector);
                        if (titleElement) break;
                    }
                    
                    if (!titleElement) return;
                    
                    const fullTitle = titleElement.textContent.trim();
                    const title = fullTitle.replace(/\s*\([^)]*\)\s*/g, '').trim();

                    // Filtrer les titres non valides (sélecteurs, navigation, etc.)
                    const invalidTitles = [
                        'choisissez votre cinéma',
                        'choisissez votre',
                        'sélectionnez',
                        'programme complet',
                        'réservations',
                        'horaires',
                        'cinéma'
                    ];

                    const titleLower = title.toLowerCase();
                    const isInvalidTitle = invalidTitles.some(invalid => 
                        titleLower.includes(invalid) || titleLower === invalid
                    );

                    // Validation du titre
                    if (title.length < 2 || title.length > 100 || isInvalidTitle) return;
                    
                    // Extraire la durée
                    const durationRegex = /(?:Durée\s*[:]\s*)?(\d{1,2}h(?:\d{2})?|\d{1,3}\s*min)/i;
                    const durationMatch = element.textContent.match(durationRegex);
                    const duration = durationMatch ? durationMatch[1] : "Non spécifié";
                    
                    // Extraire les horaires
                    const timeRegex = /\b(\d{1,2}h\d{2})\b/g;
                    const timeMatches = [...element.textContent.matchAll(timeRegex)];
                    const times = timeMatches
                        .map(match => match[1])
                        .filter(time => {
                            const hours = parseInt(time.split('h')[0]);
                            return hours >= 8 && hours <= 23;
                        })
                        .slice(0, 8); // Limiter à 8 horaires max
                    
                    // Vérifier qu'on a bien des horaires valides
                    if (times.length === 0) return;
                    
                    // Extraire le genre
                    const genreText = element.textContent.toLowerCase();
                    let genre = "Film";
                    const genreMap = {
                        'animation': 'Animation',
                        'action': 'Action',
                        'comédie': 'Comédie',
                        'comedy': 'Comédie',
                        'drame': 'Drame',
                        'famille': 'Famille',
                        'aventure': 'Aventure',
                        'thriller': 'Thriller',
                        'horreur': 'Horreur',
                        'musical': 'Musical'
                    };
                    
                    for (const [keyword, genreName] of Object.entries(genreMap)) {
                        if (genreText.includes(keyword)) {
                            genre = genreName;
                            break;
                        }
                    }
                    
                    // URL du film
                    const linkElement = element.querySelector('a[href*="/film/"]');
                    let filmUrl = null;
                    if (linkElement) {
                        const href = linkElement.getAttribute('href');
                        filmUrl = href.startsWith('http') ? href : 'https://www.cinemas-panacea.fr' + href;
                    }
                    
                    // Vérifier si nouveau (avec prudence)
                    const isNew = /\b(nouveau|new|première)\b/i.test(element.textContent);
                    
                    if (title && times.length > 0) {
                        if (filmsSeen.has(title)) {
                            const existingFilm = filmsSeen.get(title);
                            times.forEach(time => {
                                if (!existingFilm.times.includes(time)) {
                                    existingFilm.times.push(time);
                                }
                            });
                        } else {
                            filmsSeen.set(title, {
                                id: filmsSeen.size + 1,
                                title: title,
                                duration: duration,
                                times: [...times],
                                genre: genre,
                                isNew: isNew,
                                url: filmUrl
                            });
                        }
                    }
                } catch (err) {
                    console.warn('Erreur parsing film individuel:', err);
                }
            });
            
            const filmsArray = Array.from(filmsSeen.values());
            console.log('🎬 Films parsés:', filmsArray.length);
            return filmsArray;
            
        } catch (error) {
            console.error('Erreur lors du parsing:', error);
            return [];
        }
    }

    // Obtenir les jours de diffusion
    getDaysOfWeek() {
        const today = new Date();
        const days = [];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
            const dayNumber = date.getDate();
            const month = date.toLocaleDateString('fr-FR', { month: 'short' });
            
            days.push({
                name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
                date: `${dayNumber} ${month}`,
                isToday: i === 0,
                isTomorrow: i === 1
            });
        }
        
        return days;
    }

    // Afficher les films (méthode inchangée)
    displayCinema(movies) {
        const previewContainer = document.getElementById('cinemaWidgetPreview');
        const countElement = document.getElementById('cinemaWidgetCount');

        if (movies && movies.length > 0) {
            previewContainer.innerHTML = movies.map(movie => {
                const newBadge = movie.isNew ? '🆕 ' : '';
                const timesText = movie.times.length > 3 
                    ? `${movie.times.slice(0, 3).join(', ')}...` 
                    : movie.times.join(', ');
                
                const clickAction = movie.url ? 
                    `onclick="event.stopPropagation(); window.open('${movie.url}', '_blank')"` : 
                    '';
                
                return `
                    <div class="cinema-preview-item" data-movie-id="${movie.id}" ${clickAction} style="cursor: pointer;">
                        <strong>${newBadge}${movie.title}</strong> <em>(${movie.duration})</em><br>
                        <div class="movie-genre" style="font-size: 11px; color: #888; font-style: italic;">${movie.genre}</div>
                        <div class="movie-times">${timesText}</div>
                    </div>
                `;
            }).join('');

            countElement.textContent = `${movies.length} films`;
            this.isLoaded = true;
            
        } else {
            this.showUnavailableState();
        }
    }

    // Méthode de rafraîchissement
    async refresh() {
        console.log('🔄 Rechargement du widget CINÉMA...');
        this.showLoadingState();
        await this.loadCinemaData();
    }

    // Ouvrir la page cinéma
    openCinemaPage() {
        const widget = document.getElementById('cinemaWidget');
        if (widget) {
            widget.style.transform = 'scale(0.98)';
            
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            setTimeout(() => {
                widget.style.transform = 'translateY(-2px)';
                window.open('https://www.cinemas-panacea.fr/montceau-embarcadere/horaires/', '_blank');
            }, 150);
        }
    }

    // Initialisation du bouton mobile
    initMobileButton() {
        const mobileBtn = document.getElementById('cinemaMobileBtn');
        const modal = document.getElementById('cinemaMobileModal');
        const modalClose = document.getElementById('cinemaModalClose');
        const modalContent = document.getElementById('cinemaModalContent');

        if (mobileBtn && modal) {
            mobileBtn.addEventListener('click', async () => {
                modal.classList.add('show');
                document.body.style.overflow = 'hidden';
                
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }

                if (!this.isLoaded || !this.cinemaData || this.cinemaData.length === 0) {
                    modalContent.innerHTML = `
                        <div class="loading-cinema" style="text-align: center; padding: 40px;">
                            <span class="material-icons spinning" style="font-size: 48px; margin-bottom: 10px;">hourglass_empty</span>
                            <br>Chargement du programme...
                        </div>
                    `;
                    
                    try {
                        await this.loadCinemaData();
                        this.updateModalContent(modalContent);
                    } catch (error) {
                        modalContent.innerHTML = `
                            <div style="text-align: center; padding: 40px;">
                                <span class="material-icons" style="font-size: 48px; color: #dc3545;">movie_filter</span>
                                <div style="margin: 15px 0; font-weight: 500;">Programme temporairement indisponible</div>
                                <div style="font-size: 14px; color: #666; line-height: 1.4;">
                                    Consultez directement :<br>
                                    <a href="https://www.cinemas-panacea.fr/montceau-embarcadere/" target="_blank" style="color: #dc3545; text-decoration: none;">🌐 Site du cinéma</a><br>
                                    <a href="https://www.facebook.com/CinemaEmbarcadere" target="_blank" style="color: #dc3545; text-decoration: none;">📘 Page Facebook</a>
                                </div>
                            </div>
                        `;
                    }
                } else {
                    this.updateModalContent(modalContent);
                }
            });

            const closeModal = () => {
                modal.classList.remove('show');
                document.body.style.overflow = '';
            };

            modalClose.addEventListener('click', closeModal);
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });
        }
    }

    // Mise à jour du contenu modal avec jours
    updateModalContent(modalContent) {
        if (this.cinemaData && this.cinemaData.length > 0) {
            const days = this.getDaysOfWeek();
            
            // Simuler la répartition des films sur les jours (en attendant de vraies données)
            const filmsWithDays = this.cinemaData.map(movie => {
                // Pour l'instant, on assigne aléatoirement 2-4 jours par film
                const numDays = Math.floor(Math.random() * 3) + 2; // 2 à 4 jours
                const assignedDays = days.slice(0, numDays);
                
                return {
                    ...movie,
                    showDays: assignedDays
                };
            });

            modalContent.innerHTML = filmsWithDays.map(movie => {
                const newBadge = movie.isNew ? '🆕 ' : '';
                const timesText = movie.times.length > 3 
                    ? `${movie.times.slice(0, 3).join(', ')}...` 
                    : movie.times.join(', ');
                
                // Affichage des jours de diffusion
                const daysText = movie.showDays.map(day => {
                    if (day.isToday) return 'Aujourd\'hui';
                    if (day.isTomorrow) return 'Demain';
                    return `${day.name} ${day.date}`;
                }).slice(0, 2).join(', '); // Limiter à 2 jours dans l'affichage
                
                const clickAction = movie.url ? 
                    `onclick="event.stopPropagation(); window.open('${movie.url}', '_blank')"` : 
                    '';
                
                return `
                    <div class="cinema-preview-item" data-movie-id="${movie.id}" ${clickAction} style="cursor: pointer; background: rgba(220, 53, 69, 0.1); border-left: 3px solid #dc3545; padding: 8px 12px; margin: 6px 0; border-radius: 0 8px 8px 0; font-size: 13px; transition: all 0.2s ease;">
                        <strong style="color: #dc3545;">${newBadge}${movie.title}</strong> <em>(${movie.duration})</em><br>
                        <div style="font-size: 11px; color: #888; font-style: italic; margin-top: 2px;">${movie.genre}</div>
                        <div style="font-size: 10px; color: #666; margin-top: 2px;">📅 ${daysText}</div>
                        <div class="movie-times" style="font-size: 12px; color: #666; margin-top: 4px;">🕐 ${timesText}</div>
                    </div>
                `;
            }).join('');
        } else {
            modalContent.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <span class="material-icons" style="font-size: 48px; color: #dc3545;">movie_filter</span>
                    <div style="margin: 15px 0; font-weight: 500;">Programme temporairement indisponible</div>
                    <div style="font-size: 14px; color: #666; line-height: 1.4;">
                        Consultez directement :<br>
                        <a href="https://www.cinemas-panacea.fr/montceau-embarcadere/" target="_blank" style="color: #dc3545; text-decoration: none;">🌐 Site du cinéma</a><br>
                        <a href="https://www.facebook.com/CinemaEmbarcadere" target="_blank" style="color: #dc3545; text-decoration: none;">📘 Page Facebook</a>
                    </div>
                </div>
            `;
        }
    }
}

// Instance globale du widget
let cinemaWidget = null;

// Fonction globale pour ouvrir la page
function openCinemaPage() {
    if (cinemaWidget) {
        cinemaWidget.openCinemaPage();
    }
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', function() {
    cinemaWidget = new CinemaWidget();
    
    setTimeout(() => {
        cinemaWidget.init();
        cinemaWidget.initMobileButton();
    }, 2000);
});

// Export pour usage externe
window.CinemaWidget = CinemaWidget;