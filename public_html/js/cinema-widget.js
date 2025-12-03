// cinema-widget.js - Widget CINÉMA Le Capitole (Version Information)
// Note: Le site du Capitole utilise JavaScript dynamique (Webedia Movies Pro)
// et ne peut pas être scrapé automatiquement sans service payant

class CinemaWidget {
    constructor() {
        this.isLoaded = false;
        this.cinemaData = [];
    }

    init() {
        console.log('🎬 Initialisation du widget CINÉMA Le Capitole');
        this.displayInfoWidget();
    }

    displayInfoWidget() {
        const preview = document.getElementById('cinemaWidgetPreview');
        const count = document.getElementById('cinemaWidgetCount');

        if (preview) {
            preview.innerHTML = `
                <div class="cinema-info-widget" style="text-align: center; padding: 10px;">
                    <div style="font-size: 24px; margin-bottom: 8px;">🎬</div>
                    <div style="font-weight: 600; margin-bottom: 6px;">Ouverture du Capitole !</div>
                    <div style="font-size: 12px; line-height: 1.5; margin-bottom: 10px;">
                        Le nouveau cinéma de Montceau-les-Mines<br>
                        4 salles • 589 places • Son Dolby Atmos
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
        
        if (count) {
            count.textContent = 'Voir le programme';
            count.style.cursor = 'pointer';
        }
        
        this.isLoaded = true;
    }

    async refresh() {
        console.log('🔄 Rechargement...');
        this.displayInfoWidget();
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
            mobileBtn.addEventListener('click', () => {
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
        modalContent.innerHTML = `
            <div class="cinema-welcome-card" style="text-align: center; padding: 30px 20px;">
                <div style="font-size: 64px; margin-bottom: 16px;">🎬</div>
                <h2 style="color: #dc3545; margin: 0 0 8px 0; font-size: 22px;">Le Capitole</h2>
                <p style="color: #666; margin: 0 0 20px 0; font-size: 14px;">
                    Le nouveau cinéma de Montceau-les-Mines
                </p>
                
                <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 24px;">
                    <div style="background: #f8f9fa; padding: 10px 16px; border-radius: 10px; text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: #dc3545;">4</div>
                        <div style="font-size: 11px; color: #666;">Salles</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 10px 16px; border-radius: 10px; text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: #dc3545;">589</div>
                        <div style="font-size: 11px; color: #666;">Places</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 10px 16px; border-radius: 10px; text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: #dc3545;">4K</div>
                        <div style="font-size: 11px; color: #666;">Laser</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 10px 16px; border-radius: 10px; text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: #dc3545;">🔊</div>
                        <div style="font-size: 11px; color: #666;">Dolby Atmos</div>
                    </div>
                </div>
                
                <div style="background: linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%); padding: 16px; border-radius: 12px; margin-bottom: 20px;">
                    <div style="font-size: 13px; color: #666; margin-bottom: 4px;">📍 Adresse</div>
                    <div style="font-size: 14px; color: #333; font-weight: 500;">30 Quai Jules Chagot</div>
                    <div style="font-size: 13px; color: #666;">71300 Montceau-les-Mines</div>
                </div>
            </div>
            
            <div class="cinema-footer-button" style="padding: 0 20px 20px;">
                <a href="https://www.cinemacapitole-montceau.fr/horaires/" target="_blank" 
                   style="display: flex; align-items: center; justify-content: center; gap: 8px;
                          background: linear-gradient(135deg, #dc3545 0%, #b02a37 100%);
                          color: white; padding: 14px 20px; border-radius: 12px; text-decoration: none;
                          font-weight: 600; font-size: 15px; margin-bottom: 10px;
                          box-shadow: 0 4px 12px rgba(220,53,69,0.3);">
                    <span class="material-icons">movie</span>
                    Voir le programme complet
                </a>
                <a href="https://www.allocine.fr/seance/salle_gen_csalle=G0FNC.html" target="_blank"
                   style="display: flex; align-items: center; justify-content: center; gap: 8px;
                          background: white; color: #333; padding: 12px 20px; border-radius: 12px;
                          text-decoration: none; font-weight: 500; font-size: 14px;
                          border: 2px solid #dee2e6;">
                    <span class="material-icons">theaters</span>
                    Voir sur AlloCiné
                </a>
            </div>
        `;
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