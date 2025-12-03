// cinema-widget.js - Widget CINÉMA Le Capitole
// Récupère les données depuis le scraper GitHub Actions

class CinemaWidget {
    constructor() {
        this.isLoaded = false;
        this.cinemaData = [];
        // URL du fichier JSON généré par le scraper GitHub
        this.dataUrl = 'https://raw.githubusercontent.com/jhd71/scraper-cinema/main/data/cinema.json';
    }

    init() {
        console.log('🎬 Initialisation du widget CINÉMA Le Capitole');
        this.loadCinemaData();
    }

    async loadCinemaData() {
        try {
            console.log('🎬 Récupération des données depuis GitHub...');
            this.showLoadingState();
            
            // Récupérer les données depuis GitHub
            const response = await fetch(this.dataUrl + '?t=' + Date.now(), {
                cache: 'no-store'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`📍 Source: ${data.cinema?.nom || 'Le Capitole'}`);
            console.log(`📅 Dernière mise à jour: ${data.dateUpdate || data.date}`);
            
            if (data.films && data.films.length > 0) {
                this.cinemaData = this.formatFilms(data.films);
                this.displayCinema(this.cinemaData);
                console.log(`✅ ${data.films.length} films chargés`);
            } else {
                console.warn('⚠️ Pas de films dans les données');
                this.showUnavailableState();
            }
        } catch (error) {
            console.error('❌ Erreur:', error);
            this.showUnavailableState();
        }
    }

    formatFilms(films) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        return films.map((film, index) => ({
            id: index + 1,
            title: film.titre,
            duration: film.duree || 'Non spécifié',
            genre: film.genre || 'Film',
            poster: film.affiche || null,
            times: film.horaires || [],
            link: film.lien || null,
            realDates: [
                {
                    date: today,
                    displayName: 'Aujourd\'hui',
                    isToday: true
                },
                {
                    date: tomorrow,
                    displayName: 'Demain',
                    isTomorrow: true
                }
            ]
        }));
    }

    showLoadingState() {
        const preview = document.getElementById('cinemaWidgetPreview');
        const count = document.getElementById('cinemaWidgetCount');
        
        if (preview) {
            preview.innerHTML = `
                <div class="loading-cinema" style="text-align: center; padding: 20px;">
                    <span class="material-icons spinning" style="font-size: 24px; color: #dc3545;">hourglass_empty</span>
                    <div style="margin-top: 8px; color: #666; font-size: 13px;">Chargement du programme...</div>
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
                <div class="cinema-info-widget" style="text-align: center; padding: 10px;">
                    <div style="font-size: 24px; margin-bottom: 8px;">🎬</div>
                    <div style="font-weight: 600; color: #333; margin-bottom: 6px;">Le Capitole</div>
                    <div style="font-size: 12px; color: #666; line-height: 1.5; margin-bottom: 10px;">
                        4 salles • 589 places • Dolby Atmos
                    </div>
                    <div style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;">
                        <a href="https://www.cinemacapitole-montceau.fr/horaires/" target="_blank" 
                           style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 10px; 
                                  background: linear-gradient(135deg, #dc3545 0%, #b02a37 100%); 
                                  color: white; border-radius: 20px; font-size: 11px; text-decoration: none;
                                  font-weight: 500; box-shadow: 0 2px 4px rgba(220,53,69,0.3);">
                            <span class="material-icons" style="font-size: 14px;">movie</span>
                            Programme
                        </a>
                        <a href="https://www.allocine.fr/seance/salle_gen_csalle=G0FNC.html" target="_blank"
                           style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 10px;
                                  background: #f8f9fa; color: #333; border-radius: 20px; font-size: 11px; 
                                  text-decoration: none; font-weight: 500; border: 1px solid #dee2e6;">
                            <span class="material-icons" style="font-size: 14px;">theaters</span>
                            AlloCiné
                        </a>
                    </div>
                </div>
            `;
        }
        if (count) count.textContent = 'Voir le programme';
        this.isLoaded = true;
    }

    displayCinema(movies) {
        const preview = document.getElementById('cinemaWidgetPreview');
        const count = document.getElementById('cinemaWidgetCount');

        if (movies && movies.length > 0) {
            preview.innerHTML = movies.slice(0, 5).map(movie => {
                const timesText = movie.times.length > 3 
                    ? `${movie.times.slice(0, 3).join(', ')}...` 
                    : movie.times.join(', ');
                
                return `
                    <div class="cinema-preview-item" style="cursor: pointer; padding: 8px; border-bottom: 1px solid #eee;">
                        <strong style="color: #333;">${movie.title}</strong> 
                        <em style="color: #666; font-size: 12px;">(${movie.duration})</em><br>
                        <div style="font-size: 11px; color: #888; font-style: italic;">${movie.genre}</div>
                        <div style="font-size: 12px; color: #dc3545; margin-top: 4px; font-weight: 500;">
                            🕐 ${timesText}
                        </div>
                    </div>
                `;
            }).join('');

            count.textContent = `${movies.length} film${movies.length > 1 ? 's' : ''}`;
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
                            <span class="material-icons spinning" style="font-size: 48px; color: #dc3545;">hourglass_empty</span>
                            <div style="margin-top: 12px; color: #666;">Chargement...</div>
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
                const timesHTML = movie.times.map(t => 
                    `<span style="display: inline-block; background: #dc3545; color: white; 
                                  padding: 4px 10px; border-radius: 15px; font-size: 12px; 
                                  margin: 2px; font-weight: 500;">${t}</span>`
                ).join('');
                
                return `
                    <div style="background: white; border-radius: 12px; padding: 16px; margin-bottom: 12px;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                        <div style="font-weight: 600; font-size: 16px; color: #333; margin-bottom: 4px;">
                            ${movie.title}
                        </div>
                        <div style="display: flex; gap: 12px; font-size: 12px; color: #666; margin-bottom: 10px;">
                            <span>🎭 ${movie.genre}</span>
                            <span>⏱️ ${movie.duration}</span>
                        </div>
                        <div style="margin-top: 8px;">
                            ${timesHTML}
                        </div>
                    </div>
                `;
            }).join('');
            
            html += `
                <div style="padding: 16px; text-align: center;">
                    <a href="https://www.cinemacapitole-montceau.fr/horaires/" target="_blank" 
                       style="display: inline-flex; align-items: center; justify-content: center; gap: 8px;
                              background: linear-gradient(135deg, #dc3545 0%, #b02a37 100%);
                              color: white; padding: 14px 24px; border-radius: 25px; text-decoration: none;
                              font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(220,53,69,0.3);">
                        <span class="material-icons">movie</span>
                        Réserver sur le site officiel
                    </a>
                </div>
            `;
            
            modalContent.innerHTML = html;
        } else {
            modalContent.innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 64px; margin-bottom: 16px;">🎬</div>
                    <h3 style="color: #333; margin: 0 0 8px 0;">Le Capitole</h3>
                    <p style="color: #666; margin: 0 0 20px 0; font-size: 14px;">
                        Le nouveau cinéma de Montceau-les-Mines
                    </p>
                    
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 24px;">
                        <div style="background: #f8f9fa; padding: 12px 20px; border-radius: 12px;">
                            <div style="font-size: 24px; font-weight: bold; color: #dc3545;">4</div>
                            <div style="font-size: 11px; color: #666;">Salles</div>
                        </div>
                        <div style="background: #f8f9fa; padding: 12px 20px; border-radius: 12px;">
                            <div style="font-size: 24px; font-weight: bold; color: #dc3545;">589</div>
                            <div style="font-size: 11px; color: #666;">Places</div>
                        </div>
                    </div>
                    
                    <a href="https://www.cinemacapitole-montceau.fr/horaires/" target="_blank" 
                       style="display: inline-flex; align-items: center; gap: 8px;
                              background: linear-gradient(135deg, #dc3545 0%, #b02a37 100%);
                              color: white; padding: 14px 24px; border-radius: 25px; text-decoration: none;
                              font-weight: 600; margin-bottom: 12px;">
                        <span class="material-icons">movie</span>
                        Voir le programme
                    </a>
                    <br>
                    <a href="https://www.allocine.fr/seance/salle_gen_csalle=G0FNC.html" target="_blank"
                       style="color: #666; font-size: 13px; text-decoration: underline;">
                        ou consulter AlloCiné
                    </a>
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