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

                // Filtrer les titres non valides
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
                    .slice(0, 8);
                
                // Vérifier qu'on a bien des horaires valides
                if (times.length === 0) return;
                
                // **NOUVEAU** : Extraire les vraies dates de diffusion
                const realDates = this.extractRealDates(element);
                
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
                
                // Vérifier si nouveau
                const isNew = /\b(nouveau|new|première)\b/i.test(element.textContent);
                
                if (title && times.length > 0) {
                    if (filmsSeen.has(title)) {
                        const existingFilm = filmsSeen.get(title);
                        // Ajouter les nouveaux horaires
                        times.forEach(time => {
                            if (!existingFilm.times.includes(time)) {
                                existingFilm.times.push(time);
                            }
                        });
                        // Ajouter les nouvelles dates
                        realDates.forEach(date => {
                            if (!existingFilm.realDates.some(d => d.dateString === date.dateString)) {
                                existingFilm.realDates.push(date);
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
                            realDates: realDates // **NOUVEAU** : Vraies dates
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

    // **NOUVELLE MÉTHODE** : Extraire les vraies dates du site Panacéa
extractRealDates(element) {
    const dates = [];
    const seenDates = new Set(); // Pour éviter les doublons
    const today = new Date();
    
    try {
        // Chercher les dates dans le texte de l'élément
        const text = element.textContent;
        
        // Regex améliorée pour capturer les patterns de dates
        const datePatterns = [
            // Format: "jeudi 12", "samedi 14", etc.
            /\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+(\d{1,2})\b/gi,
            // Format: "12 décembre", "14 janvier", etc.
            /\b(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/gi
        ];
        
        const monthNames = {
            'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
            'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
        };
        
        const dayNames = {
            'lundi': 1, 'mardi': 2, 'mercredi': 3, 'jeudi': 4, 'vendredi': 5, 'samedi': 6, 'dimanche': 0
        };
        
        // Pattern 1: "jeudi 12", "samedi 14"
        let matches = [...text.matchAll(datePatterns[0])];
        
        matches.forEach((match) => {
            const dayName = match[1].toLowerCase();
            const dayNumber = parseInt(match[2]);
            
            if (dayNames[dayName] !== undefined && dayNumber >= 1 && dayNumber <= 31) {
                // Créer une clé unique pour cette date
                const dateKey = `${dayName}-${dayNumber}`;
                
                // Éviter les doublons
                if (seenDates.has(dateKey)) {
                    return; // Ignore silencieusement les doublons
                }
                seenDates.add(dateKey);
                
                // Créer la date (essayer mois actuel puis suivant)
                let date = new Date(today.getFullYear(), today.getMonth(), dayNumber);
                
                // Vérifier si la date est passée
                const daysDiff = (today - date) / (1000 * 60 * 60 * 24);
                
                if (daysDiff > 2) {
                    // Si plus de 2 jours dans le passé, essayer le mois suivant
                    date.setMonth(date.getMonth() + 1);
                    
                    // Vérifier à nouveau si c'est cohérent (pas trop loin dans le futur)
                    const futureDays = (date - today) / (1000 * 60 * 60 * 24);
                    if (futureDays > 60) {
                        // Si c'est plus de 2 mois dans le futur, probablement faux
                        return;
                    }
                }
                
                // Vérifier que le jour de la semaine correspond
                if (date.getDay() !== dayNames[dayName]) {
                    // Ajuster pour trouver le bon jour
                    const targetDay = dayNames[dayName];
                    
                    // Essayer le mois suivant
                    date.setMonth(date.getMonth() + 1);
                    // Si toujours pas bon, ignorer cette date
                    if (date.getDay() !== targetDay) {
                        return;
                    }
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
                    isTomorrow: isTomorrow,
                    dayName: dayName,
                    dayNumber: dayNumber
                });
            }
        });
        
        // Pattern 2: "12 décembre", si aucune date trouvée avec le premier pattern
        if (dates.length === 0) {
            matches = [...text.matchAll(datePatterns[1])];
            
            matches.forEach((match) => {
                const dayNumber = parseInt(match[1]);
                const monthName = match[2].toLowerCase();
                
                if (monthNames[monthName] !== undefined && dayNumber >= 1 && dayNumber <= 31) {
                    const monthIndex = monthNames[monthName];
                    const dateKey = `${dayNumber}-${monthIndex}`;
                    
                    if (seenDates.has(dateKey)) return;
                    seenDates.add(dateKey);
                    
                    let date = new Date(today.getFullYear(), monthIndex, dayNumber);
                    
                    // ✅ LOGIQUE CINÉMA RÉALISTE
                    const daysDiff = (today - date) / (1000 * 60 * 60 * 24);
                    
                    if (daysDiff > 2) {
                        // Si c'est plus de 2 jours dans le passé, ignorer complètement
                        // Les cinémas ne gardent pas les vieilles infos
                        console.log(`⚠️ Date passée ignorée: ${dayNumber} ${monthName} (${Math.round(daysDiff)} jours passés)`);
                        return;
                    }
                    
                    // Vérifier que la date n'est pas trop loin dans le futur (max 3 mois)
                    const futureDays = (date - today) / (1000 * 60 * 60 * 24);
                    if (futureDays > 90) {
                        console.log(`⚠️ Date trop lointaine ignorée: ${dayNumber} ${monthName} (${Math.round(futureDays)} jours dans le futur)`);
                        return;
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
                                    `${dayNumber} ${monthName}`,
                        isToday: isToday,
                        isTomorrow: isTomorrow,
                        dayNumber: dayNumber,
                        monthName: monthName
                    });
                }
            });
        }
        
        // Log propre - Une seule ligne par film
        const filmTitle = element.querySelector('h1, h2, h3, strong')?.textContent?.trim() || 'Film';
        if (dates.length > 0) {
            console.log(`🎬 ${filmTitle}: ${dates.map(d => d.displayName).join(', ')}`);
        }
        
        // Si toujours aucune date trouvée, créer des dates par défaut
        if (dates.length === 0) {
            console.log(`⚠️ Aucune date valide trouvée pour ${filmTitle}, utilisation des dates par défaut`);
            
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            
            // Dates par défaut réalistes pour un cinéma
            const dayAfterTomorrow = new Date(today);
            dayAfterTomorrow.setDate(today.getDate() + 2);
            
            dates.push(
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
                },
                {
                    date: dayAfterTomorrow,
                    dateString: dayAfterTomorrow.toISOString().split('T')[0],
                    displayName: dayAfterTomorrow.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' }),
                    isToday: false,
                    isTomorrow: false
                }
            );
        }
        
        // Trier les dates par ordre chronologique
        dates.sort((a, b) => a.date - b.date);
        
        // Limiter à 5 dates maximum pour l'affichage
        return dates.slice(0, 5);
        
    } catch (error) {
        console.error('❌ Erreur extraction dates:', error);
        return [{
            date: today,
            dateString: today.toISOString().split('T')[0],
            displayName: 'Aujourd\'hui',
            isToday: true,
            isTomorrow: false
        }];
    }
}

// Méthode utilitaire pour comparer les dates
isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

    // Afficher les films avec vraies dates (WIDGET PRINCIPAL PC)
displayCinema(movies) {
    const previewContainer = document.getElementById('cinemaWidgetPreview');
    const countElement = document.getElementById('cinemaWidgetCount');

    if (movies && movies.length > 0) {
        previewContainer.innerHTML = movies.map(movie => {
            const newBadge = movie.isNew ? '🆕 ' : '';
            const timesText = movie.times.length > 3 
                ? `${movie.times.slice(0, 3).join(', ')}...` 
                : movie.times.join(', ');
            
            // **NOUVEAU** : Afficher les vraies dates
            let datesText = '';
            if (movie.realDates && movie.realDates.length > 0) {
                const displayDates = movie.realDates.slice(0, 2).map(d => d.displayName);
                datesText = `<div class="movie-dates" style="font-size: 12px; color: #666; margin-top: 2px;">📅 ${displayDates.join(', ')}</div>`;
            }
            
            const clickAction = movie.url ? 
                `onclick="event.stopPropagation(); window.open('${movie.url}', '_blank')"` : 
                '';
            
            return `
                <div class="cinema-preview-item" data-movie-id="${movie.id}" ${clickAction} style="cursor: pointer;">
                    <strong>${newBadge}${movie.title}</strong> <em>(${movie.duration})</em><br>
                    <div class="movie-genre" style="font-size: 13px; color: #888; font-style: italic;">${movie.genre}</div>
                    ${datesText}
                    <div class="movie-times" style="font-size: 12px; color: #666; margin-top: 2px;">🕐 ${timesText}</div>
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

    // Mise à jour du contenu modal avec vraies dates (MOBILE)
updateModalContent(modalContent) {
    if (this.cinemaData && this.cinemaData.length > 0) {
        modalContent.innerHTML = this.cinemaData.map(movie => {
            const newBadge = movie.isNew ? '🆕 ' : '';
            const timesText = movie.times.length > 3 
                ? `${movie.times.slice(0, 3).join(', ')}...` 
                : movie.times.join(', ');
            
            // **NOUVEAU** : Utiliser les vraies dates au lieu des données simulées
            let datesText = 'Dates à confirmer';
            if (movie.realDates && movie.realDates.length > 0) {
                const displayDates = movie.realDates.slice(0, 3).map(d => d.displayName);
                datesText = displayDates.join(', ');
                
                // Si plus de 3 dates, ajouter "..."
                if (movie.realDates.length > 3) {
                    datesText += '...';
                }
            }
            
            const clickAction = movie.url ? 
                `onclick="event.stopPropagation(); window.open('${movie.url}', '_blank')"` : 
                '';
            
            return `
                <div class="cinema-preview-item" data-movie-id="${movie.id}" ${clickAction} style="cursor: pointer; background: rgba(220, 53, 69, 0.1); border-left: 3px solid #dc3545; padding: 8px 12px; margin: 6px 0; border-radius: 0 8px 8px 0; font-size: 13px; transition: all 0.2s ease;">
                    <strong style="color: #dc3545;">${newBadge}${movie.title}</strong> <em>(${movie.duration})</em><br>
                    <div style="font-size: 11px; color: #888; font-style: italic; margin-top: 2px;">${movie.genre}</div>
                    <div style="font-size: 11px; color: #666; margin-top: 2px;">📅 ${datesText}</div>
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