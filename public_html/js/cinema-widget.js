// cinema-widget.js - Gestionnaire du widget CINÉMA Le Capitole
// Version avec support multi-sources (Site officiel + AlloCiné)

class CinemaWidget {
    constructor() {
        this.isLoaded = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.cinemaData = [];
    }

    // Initialiser le widget
    init() {
        console.log('🎬 Initialisation du widget CINÉMA Le Capitole');
        this.loadCinemaData();
    }

    // Charger les données cinéma
    async loadCinemaData() {
        try {
            console.log('🎬 Récupération des données depuis Le Capitole...');
            
            this.showLoadingState();
            
            const realData = await this.fetchRealCinemaDataBackground();
            
            if (realData && realData.length > 0) {
                this.cinemaData = realData;
                this.displayCinema(realData);
                console.log(`✅ Données réelles chargées: ${realData.length} films`);
            } else {
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
                        <div style="font-size: 12px; color: #000000; line-height: 1.4;">
                            Consultez directement :<br>
                            • <a href="https://www.cinemacapitole-montceau.fr/horaires/" target="_blank" style="color: #dc3545;">Site du cinéma</a><br>
                            • <a href="https://www.allocine.fr/seance/salle_gen_csalle=G0FNC.html" target="_blank" style="color: #dc3545;">AlloCiné</a>
                        </div>
                    </div>
                </div>
            `;
        }
        
        if (countElement) {
            countElement.textContent = 'Indisponible';
        }
        
        this.isLoaded = true;
    }

    // Chargement en arrière-plan des vraies données
    async fetchRealCinemaDataBackground() {
        try {
            // Essayer d'abord notre API Vercel
            try {
                const realData = await this.fetchFromVercelAPI();
                if (realData && realData.length > 0) {
                    console.log(`✅ Données récupérées via API Vercel: ${realData.length} films`);
                    return realData;
                }
            } catch (vercelError) {
                console.warn('API Vercel non disponible:', vercelError.message);
            }
            
            // Si Firefox ou API échoue, essayer les proxies
            if (!navigator.userAgent.toLowerCase().includes('firefox')) {
                const methods = [
                    () => this.fetchWithProxy('https://api.codetabs.com/v1/proxy?quest='),
                    () => this.fetchWithProxy('https://cors-anywhere.herokuapp.com/')
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
            }
            
            console.log('ℹ️ Impossible de récupérer les données réelles');
            return [];
            
        } catch (error) {
            console.log('ℹ️ Chargement en arrière-plan échoué');
            return [];
        }
    }

    // Fetch depuis l'API Vercel
    async fetchFromVercelAPI() {
        const response = await fetch('/api/cinema-horaires', {
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/xhtml+xml',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const html = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Détecter la source et utiliser le bon parser
        if (html.includes('allocine.fr') || html.includes('AlloCiné')) {
            console.log('📍 Source détectée: AlloCiné');
            return this.parseAllocine(doc);
        } else {
            console.log('📍 Source détectée: Site officiel');
            return this.parseHoraires(doc);
        }
    }

    // Fetch avec proxy
    async fetchWithProxy(proxyUrl) {
        const targetUrl = 'https://www.cinemacapitole-montceau.fr/horaires/';
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

    // Parser pour AlloCiné
    parseAllocine(doc) {
        const films = [];
        const filmsSeen = new Map();
        
        try {
            // Sélecteurs AlloCiné
            const movieCards = doc.querySelectorAll('.card-entity, .movie-card, .card-movie, [class*="movie"], [class*="film"]');
            
            console.log(`AlloCiné: ${movieCards.length} éléments trouvés`);
            
            movieCards.forEach((card) => {
                try {
                    // Titre du film
                    const titleElement = card.querySelector('.meta-title, .title, h2, h3, a[href*="/film/"]');
                    if (!titleElement) return;
                    
                    let title = titleElement.textContent.trim();
                    title = title.replace(/\s*\([^)]*\)\s*/g, '').trim();
                    
                    // Filtrer les titres invalides
                    if (title.length < 2 || title.length > 100) return;
                    if (/séance|horaire|cinéma|réserver/i.test(title)) return;
                    
                    // Durée
                    const durationElement = card.querySelector('.meta-body-item, [class*="duration"], [class*="runtime"]');
                    let duration = "Non spécifié";
                    if (durationElement) {
                        const durationMatch = durationElement.textContent.match(/(\d+h\s*\d*|\d+\s*min)/i);
                        if (durationMatch) duration = durationMatch[1];
                    }
                    
                    // Horaires
                    const showtimeElements = card.querySelectorAll('.showtimes-hour, .showtime, [class*="seance"], time');
                    const times = [];
                    showtimeElements.forEach(el => {
                        const timeMatch = el.textContent.match(/(\d{1,2}[h:]\d{2})/);
                        if (timeMatch) {
                            let time = timeMatch[1].replace(':', 'h');
                            const hours = parseInt(time.split('h')[0]);
                            if (hours >= 8 && hours <= 23 && !times.includes(time)) {
                                times.push(time);
                            }
                        }
                    });
                    
                    if (times.length === 0) return;
                    
                    // Genre
                    const genreElement = card.querySelector('.meta-body-info, [class*="genre"]');
                    let genre = "Film";
                    if (genreElement) {
                        const genreText = genreElement.textContent.toLowerCase();
                        const genreMap = {
                            'animation': 'Animation', 'action': 'Action', 'comédie': 'Comédie',
                            'drame': 'Drame', 'famille': 'Famille', 'aventure': 'Aventure',
                            'thriller': 'Thriller', 'horreur': 'Horreur', 'science-fiction': 'SF'
                        };
                        for (const [key, value] of Object.entries(genreMap)) {
                            if (genreText.includes(key)) { genre = value; break; }
                        }
                    }
                    
                    // URL du film
                    const linkElement = card.querySelector('a[href*="/film/"]');
                    let filmUrl = null;
                    if (linkElement) {
                        const href = linkElement.getAttribute('href');
                        filmUrl = href.startsWith('http') ? href : 'https://www.allocine.fr' + href;
                    }
                    
                    // Éviter les doublons
                    if (filmsSeen.has(title)) {
                        const existing = filmsSeen.get(title);
                        times.forEach(t => { if (!existing.times.includes(t)) existing.times.push(t); });
                    } else {
                        filmsSeen.set(title, {
                            id: filmsSeen.size + 1,
                            title: title,
                            duration: duration,
                            times: times,
                            genre: genre,
                            isNew: false,
                            url: filmUrl,
                            realDates: this.getDefaultDates()
                        });
                    }
                    
                } catch (err) {
                    console.warn('Erreur parsing film AlloCiné:', err);
                }
            });
            
            const filmsArray = Array.from(filmsSeen.values());
            console.log('🎬 Films AlloCiné parsés:', filmsArray.length);
            return filmsArray;
            
        } catch (error) {
            console.error('Erreur parsing AlloCiné:', error);
            return [];
        }
    }

    // Parser pour le site officiel Le Capitole
    parseHoraires(doc) {
        const films = [];
        const filmsSeen = new Map();
        
        try {
            const selectors = [
                '.film-item', '.movie-item', '.seance-item', '[data-film]',
                'article.film', '.program-item', '.film-card', '.movie-card'
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
                filmElements = doc.querySelectorAll('*[class*="film"], *[class*="movie"], *[class*="seance"]');
            }
            
            if (filmElements.length === 0) {
                console.warn('Aucun élément de film trouvé');
                return [];
            }
            
            filmElements.forEach((element) => {
                try {
                    const titleSelectors = ['h1, h2, h3', '.title, .film-title, .movie-title', 'a[href*="/film/"]'];
                    
                    let titleElement = null;
                    for (const selector of titleSelectors) {
                        titleElement = element.querySelector(selector);
                        if (titleElement) break;
                    }
                    
                    if (!titleElement) return;
                    
                    const fullTitle = titleElement.textContent.trim();
                    const title = fullTitle.replace(/\s*\([^)]*\)\s*/g, '').trim();

                    const invalidTitles = ['choisissez', 'sélectionnez', 'programme', 'réservations', 'horaires', 'cinéma', 'le capitole'];
                    const titleLower = title.toLowerCase();
                    if (invalidTitles.some(inv => titleLower.includes(inv))) return;
                    if (title.length < 2 || title.length > 100) return;
                    
                    // Durée
                    const durationMatch = element.textContent.match(/(\d{1,2}h(?:\d{2})?|\d{1,3}\s*min)/i);
                    const duration = durationMatch ? durationMatch[1] : "Non spécifié";
                    
                    // Horaires
                    const timeMatches = [...element.textContent.matchAll(/\b(\d{1,2}h\d{2})\b/g)];
                    const times = timeMatches
                        .map(match => match[1])
                        .filter(time => {
                            const hours = parseInt(time.split('h')[0]);
                            return hours >= 8 && hours <= 23;
                        })
                        .slice(0, 8);
                    
                    if (times.length === 0) return;
                    
                    // Dates
                    const realDates = this.extractRealDates(element);
                    
                    // Genre
                    const genreText = element.textContent.toLowerCase();
                    let genre = "Film";
                    const genreMap = {
                        'animation': 'Animation', 'action': 'Action', 'comédie': 'Comédie',
                        'drame': 'Drame', 'famille': 'Famille', 'aventure': 'Aventure',
                        'thriller': 'Thriller', 'horreur': 'Horreur', 'musical': 'Musical'
                    };
                    for (const [key, value] of Object.entries(genreMap)) {
                        if (genreText.includes(key)) { genre = value; break; }
                    }
                    
                    // URL
                    const linkElement = element.querySelector('a[href*="/film/"]');
                    let filmUrl = null;
                    if (linkElement) {
                        const href = linkElement.getAttribute('href');
                        filmUrl = href.startsWith('http') ? href : 'https://www.cinemacapitole-montceau.fr' + href;
                    }
                    
                    const isNew = /\b(nouveau|new|première)\b/i.test(element.textContent);
                    
                    if (filmsSeen.has(title)) {
                        const existing = filmsSeen.get(title);
                        times.forEach(t => { if (!existing.times.includes(t)) existing.times.push(t); });
                        realDates.forEach(d => {
                            if (!existing.realDates.some(ed => ed.dateString === d.dateString)) {
                                existing.realDates.push(d);
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
                            url: filmUrl,
                            realDates: realDates
                        });
                    }
                } catch (err) {
                    console.warn('Erreur parsing film:', err);
                }
            });
            
            const filmsArray = Array.from(filmsSeen.values());
            console.log('🎬 Films parsés:', filmsArray.length);
            return filmsArray;
            
        } catch (error) {
            console.error('Erreur parsing:', error);
            return [];
        }
    }

    // Dates par défaut
    getDefaultDates() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        return [
            {
                date: today,
                dateString: today.toISOString().split('T')[0],
                displayName: 'Aujourd\'hui',
                isToday: true,
                isTomorrow: false
            },
            {
                date: tomorrow,
                dateString: tomorrow.toISOString().split('T')[0],
                displayName: 'Demain',
                isToday: false,
                isTomorrow: true
            }
        ];
    }

    // Extraire les vraies dates
    extractRealDates(element) {
        const dates = [];
        const seenDates = new Set();
        const today = new Date();
        
        try {
            const text = element.textContent;
            
            const datePatterns = [
                /\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})\b/gi,
                /\b(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/gi
            ];
            
            const monthNames = {
                'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
                'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
            };
            
            const dayNames = {
                'lundi': 1, 'mardi': 2, 'mercredi': 3, 'jeudi': 4, 'vendredi': 5, 'samedi': 6, 'dimanche': 0
            };
            
            // Pattern 1: "jeudi 12"
            let matches = [...text.matchAll(datePatterns[0])];
            
            matches.forEach((match) => {
                const dayName = match[1].toLowerCase();
                const dayNumber = parseInt(match[2]);
                
                if (dayNames[dayName] !== undefined && dayNumber >= 1 && dayNumber <= 31) {
                    const dateKey = `${dayName}-${dayNumber}`;
                    if (seenDates.has(dateKey)) return;
                    seenDates.add(dateKey);
                    
                    let date = new Date(today.getFullYear(), today.getMonth(), dayNumber);
                    const daysDiff = (today - date) / (1000 * 60 * 60 * 24);
                    
                    if (daysDiff > 2) {
                        date.setMonth(date.getMonth() + 1);
                    }
                    
                    const isToday = this.isSameDay(date, today);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(today.getDate() + 1);
                    const isTomorrow = this.isSameDay(date, tomorrow);
                    
                    dates.push({
                        date: date,
                        dateString: date.toISOString().split('T')[0],
                        displayName: isToday ? 'Aujourd\'hui' : 
                                    isTomorrow ? 'Demain' : 
                                    `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNumber}`,
                        isToday: isToday,
                        isTomorrow: isTomorrow
                    });
                }
            });
            
            if (dates.length === 0) {
                return this.getDefaultDates();
            }
            
            dates.sort((a, b) => a.date - b.date);
            return dates.slice(0, 5);
            
        } catch (error) {
            return this.getDefaultDates();
        }
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    // Afficher les films (WIDGET PC)
    displayCinema(movies) {
        const previewContainer = document.getElementById('cinemaWidgetPreview');
        const countElement = document.getElementById('cinemaWidgetCount');

        if (movies && movies.length > 0) {
            const sortedMovies = this.sortMoviesByDate(movies);
            
            previewContainer.innerHTML = sortedMovies.map(movie => {
                const newBadge = movie.isNew ? '🆕 ' : '';
                const timesText = movie.times.length > 3 
                    ? `${movie.times.slice(0, 3).join(', ')}...` 
                    : movie.times.join(', ');
                
                let datesText = '';
                if (movie.realDates && movie.realDates.length > 0) {
                    const displayDates = movie.realDates.slice(0, 2).map(d => d.displayName);
                    datesText = `<div class="movie-dates" style="font-size: 12px; color: #000000; margin-top: 2px;">📅 ${displayDates.join(', ')}</div>`;
                }
                
                const clickAction = movie.url ? 
                    `onclick="event.stopPropagation(); window.open('${movie.url}', '_blank')"` : '';
                
                return `
                    <div class="cinema-preview-item" data-movie-id="${movie.id}" ${clickAction} style="cursor: pointer;">
                        <strong>${newBadge}${movie.title}</strong> <em>(${movie.duration})</em><br>
                        <div class="movie-genre" style="font-size: 12px; color: #000000; font-style: italic;">${movie.genre}</div>
                        ${datesText}
                        <div class="movie-times" style="font-size: 12px; color: #000000; margin-top: 2px;">🕐 ${timesText}</div>
                    </div>
                `;
            }).join('');

            countElement.textContent = `${movies.length} films`;
            this.isLoaded = true;
        } else {
            this.showUnavailableState();
        }
    }

    sortMoviesByDate(movies) {
        return movies.sort((a, b) => {
            if (!a.realDates || a.realDates.length === 0) return 1;
            if (!b.realDates || b.realDates.length === 0) return -1;
            return a.realDates[0].date - b.realDates[0].date;
        });
    }

    async refresh() {
        console.log('🔄 Rechargement du widget CINÉMA...');
        this.showLoadingState();
        await this.loadCinemaData();
    }

    openCinemaPage() {
        const widget = document.getElementById('cinemaWidget');
        if (widget) {
            widget.style.transform = 'scale(0.98)';
            if (navigator.vibrate) navigator.vibrate(50);
            
            setTimeout(() => {
                widget.style.transform = 'translateY(-2px)';
                window.open('https://www.cinemacapitole-montceau.fr/horaires/', '_blank');
            }, 150);
        }
    }

    // Initialisation du bouton mobile
    initMobileButton() {
        const mobileBtn = document.getElementById('cinemaMobileBtn');
        const modal = document.getElementById('cinemaMobileModal');

        if (mobileBtn && modal) {
            mobileBtn.addEventListener('click', async () => {
                modal.classList.add('show');
                document.body.style.overflow = 'hidden';
                if (navigator.vibrate) navigator.vibrate(50);

                if (!modal.querySelector('.cinema-modal-header')) {
                    modal.innerHTML = `
                        <div class="cinema-modal-content">
                            <div class="cinema-modal-header">
                                <h3>
                                    <span class="material-icons">movie</span>
                                    CINÉMA Le Capitole
                                </h3>
                                <button class="cinema-modal-close" id="cinemaModalClose">
                                    <span class="material-icons">close</span>
                                </button>
                            </div>
                            <div id="cinemaModalContent"></div>
                        </div>
                    `;
                    
                    const newModalClose = modal.querySelector('#cinemaModalClose');
                    if (newModalClose) {
                        newModalClose.addEventListener('click', () => {
                            modal.classList.remove('show');
                            document.body.style.overflow = '';
                        });
                    }
                }

                const modalContent = modal.querySelector('#cinemaModalContent');

                if (!this.isLoaded || !this.cinemaData || this.cinemaData.length === 0) {
                    modalContent.innerHTML = `
                        <div class="loading-cinema" style="text-align: center; padding: 40px;">
                            <span class="material-icons spinning" style="font-size: 48px;">hourglass_empty</span>
                            <br>Chargement du programme...
                        </div>
                    `;
                    
                    try {
                        await this.loadCinemaData();
                        this.updateModalContent(modalContent);
                    } catch (error) {
                        this.updateModalContent(modalContent);
                    }
                } else {
                    this.updateModalContent(modalContent);
                }
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                    document.body.style.overflow = '';
                }
            });
        }
    }

    // Mise à jour du contenu modal (MOBILE)
    updateModalContent(modalContent) {
        if (this.cinemaData && this.cinemaData.length > 0) {
            const sortedMovies = this.sortMoviesByDate(this.cinemaData);
            
            let htmlContent = sortedMovies.map(movie => {
                const newBadge = movie.isNew ? '<span style="background: #4caf50; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-left: 8px;">NOUVEAU</span>' : '';
                
                let datesHTML = '';
                if (movie.realDates && movie.realDates.length > 0) {
                    const datesList = movie.realDates.map(d => {
                        const className = d.isToday ? 'today' : '';
                        return `<span class="cinema-date-badge ${className}">${d.displayName}</span>`;
                    }).join('');
                    
                    datesHTML = `
                        <div class="cinema-film-dates">
                            <div class="cinema-dates-title">📅 Séances</div>
                            <div>${datesList}</div>
                        </div>
                    `;
                }
                
                const timesHTML = movie.times.map(time => 
                    `<div class="cinema-time-slot">${time}</div>`
                ).join('');
                
                return `
                    <div class="cinema-film-card" ${movie.url ? `onclick="window.open('${movie.url}', '_blank')"` : ''}>
                        <div class="cinema-film-title">${movie.title}${newBadge}</div>
                        <div class="cinema-film-info">
                            <div class="cinema-film-info-item">
                                <span class="material-icons">category</span>
                                <span>${movie.genre}</span>
                            </div>
                            <div class="cinema-film-info-item">
                                <span class="material-icons">schedule</span>
                                <span>${movie.duration}</span>
                            </div>
                        </div>
                        ${datesHTML}
                        <div class="cinema-film-times">${timesHTML}</div>
                    </div>
                `;
            }).join('');
            
            htmlContent += `
                <div class="cinema-footer-button">
                    <a href="https://www.cinemacapitole-montceau.fr/horaires/" target="_blank" class="cinema-link-button">
                        <span class="material-icons">launch</span>
                        Programme complet & réservations
                    </a>
                </div>
            `;
            
            modalContent.innerHTML = htmlContent;
        } else {
            modalContent.innerHTML = `
                <div class="cinema-empty-state">
                    <span class="material-icons">movie_filter</span>
                    <h4>Programme temporairement indisponible</h4>
                    <p>Les horaires du cinéma ne sont pas accessibles pour le moment.</p>
                    <div class="cinema-links">
                        <a href="https://www.cinemacapitole-montceau.fr/horaires/" target="_blank" class="cinema-link-button">
                            <span class="material-icons">language</span>
                            Site officiel
                        </a>
                        <a href="https://www.allocine.fr/seance/salle_gen_csalle=G0FNC.html" target="_blank" class="cinema-link-button secondary">
                            <span class="material-icons">theaters</span>
                            AlloCiné
                        </a>
                    </div>
                </div>
            `;
        }
    }
}

// Instance globale
let cinemaWidget = null;

function openCinemaPage() {
    if (cinemaWidget) cinemaWidget.openCinemaPage();
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', function() {
    cinemaWidget = new CinemaWidget();
    setTimeout(() => {
        cinemaWidget.init();
        cinemaWidget.initMobileButton();
    }, 2000);
});

window.CinemaWidget = CinemaWidget;