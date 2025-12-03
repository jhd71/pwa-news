// cinema-widget.js - Widget CINÉMA Le Capitole (Version API JSON)

class CinemaWidget {
    constructor() {
        this.isLoaded = false;
        this.cinemaData = [];
    }

    init() {
        console.log('🎬 Initialisation du widget CINÉMA Le Capitole');
        this.loadCinemaData();
    }

    async loadCinemaData() {
        try {
            console.log('🎬 Récupération des données depuis Le Capitole...');
            this.showLoadingState();
            
            const films = await this.fetchFromAPI();
            
            if (films && films.length > 0) {
                this.cinemaData = films;
                this.displayCinema(films);
                console.log(`✅ ${films.length} films chargés`);
            } else {
                this.showUnavailableState();
            }
        } catch (error) {
            console.error('❌ Erreur:', error);
            this.showUnavailableState();
        }
    }

    showLoadingState() {
        const preview = document.getElementById('cinemaWidgetPreview');
        const count = document.getElementById('cinemaWidgetCount');
        
        if (preview) {
            preview.innerHTML = `
                <div class="loading-cinema">
                    <span class="material-icons spinning">hourglass_empty</span>
                    Chargement du programme...
                </div>
            `;
        }
        if (count) count.textContent = 'Chargement...';
    }

    showUnavailableState() {
        const preview = document.getElementById('cinemaWidgetPreview');
        const count = document.getElementById('cinemaWidgetCount');
        
        if (preview) {
            preview.innerHTML = `
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
        if (count) count.textContent = 'Indisponible';
        this.isLoaded = true;
    }

    async fetchFromAPI() {
        try {
            // Appeler notre API Vercel qui retourne du JSON
            const response = await fetch('/api/cinema-horaires', {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.films && data.films.length > 0) {
                console.log(`📍 Source: ${data.source}`);
                return this.formatFilms(data.films);
            }
            
            return [];
        } catch (error) {
            console.warn('API Vercel échouée:', error.message);
            return [];
        }
    }

    formatFilms(films) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        return films.map((film, index) => ({
            id: index + 1,
            title: film.title,
            duration: film.duration || 'Non spécifié',
            genre: film.genre || 'Film',
            times: film.times || [],
            isNew: false,
            url: null,
            realDates: [
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
            ]
        }));
    }

    displayCinema(movies) {
        const preview = document.getElementById('cinemaWidgetPreview');
        const count = document.getElementById('cinemaWidgetCount');

        if (movies && movies.length > 0) {
            preview.innerHTML = movies.slice(0, 5).map(movie => {
                const timesText = movie.times.length > 3 
                    ? `${movie.times.slice(0, 3).join(', ')}...` 
                    : movie.times.join(', ');
                
                let datesText = '';
                if (movie.realDates && movie.realDates.length > 0) {
                    const displayDates = movie.realDates.slice(0, 2).map(d => d.displayName);
                    datesText = `<div style="font-size: 12px; color: #000000; margin-top: 2px;">📅 ${displayDates.join(', ')}</div>`;
                }
                
                return `
                    <div class="cinema-preview-item" style="cursor: pointer; padding: 8px; border-bottom: 1px solid #eee;">
                        <strong>${movie.title}</strong> <em>(${movie.duration})</em><br>
                        <div style="font-size: 12px; color: #666; font-style: italic;">${movie.genre}</div>
                        ${datesText}
                        <div style="font-size: 12px; color: #000000; margin-top: 2px;">🕐 ${timesText}</div>
                    </div>
                `;
            }).join('');

            count.textContent = `${movies.length} films`;
            this.isLoaded = true;
        } else {
            this.showUnavailableState();
        }
    }

    async refresh() {
        console.log('🔄 Rechargement...');
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
                    
                    modal.querySelector('#cinemaModalClose')?.addEventListener('click', () => {
                        modal.classList.remove('show');
                        document.body.style.overflow = '';
                    });
                }

                const modalContent = modal.querySelector('#cinemaModalContent');

                if (!this.isLoaded || !this.cinemaData.length) {
                    modalContent.innerHTML = `
                        <div style="text-align: center; padding: 40px;">
                            <span class="material-icons spinning" style="font-size: 48px;">hourglass_empty</span>
                            <br>Chargement...
                        </div>
                    `;
                    await this.loadCinemaData();
                }
                
                this.updateModalContent(modalContent);
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                    document.body.style.overflow = '';
                }
            });
        }
    }

    updateModalContent(modalContent) {
        if (this.cinemaData && this.cinemaData.length > 0) {
            let html = this.cinemaData.map(movie => {
                let datesHTML = '';
                if (movie.realDates && movie.realDates.length > 0) {
                    const datesList = movie.realDates.map(d => {
                        const cls = d.isToday ? 'today' : '';
                        return `<span class="cinema-date-badge ${cls}">${d.displayName}</span>`;
                    }).join('');
                    datesHTML = `
                        <div class="cinema-film-dates">
                            <div class="cinema-dates-title">📅 Séances</div>
                            <div>${datesList}</div>
                        </div>
                    `;
                }
                
                const timesHTML = movie.times.map(t => 
                    `<div class="cinema-time-slot">${t}</div>`
                ).join('');
                
                return `
                    <div class="cinema-film-card">
                        <div class="cinema-film-title">${movie.title}</div>
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
            
            html += `
                <div class="cinema-footer-button">
                    <a href="https://www.cinemacapitole-montceau.fr/horaires/" target="_blank" class="cinema-link-button">
                        <span class="material-icons">launch</span>
                        Programme complet & réservations
                    </a>
                </div>
            `;
            
            modalContent.innerHTML = html;
        } else {
            modalContent.innerHTML = `
                <div class="cinema-empty-state">
                    <span class="material-icons">movie_filter</span>
                    <h4>Programme temporairement indisponible</h4>
                    <p>Les horaires ne sont pas accessibles pour le moment.</p>
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

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    cinemaWidget = new CinemaWidget();
    setTimeout(() => {
        cinemaWidget.init();
        cinemaWidget.initMobileButton();
    }, 2000);
});

window.CinemaWidget = CinemaWidget;