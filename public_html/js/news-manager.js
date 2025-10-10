// news-manager.js
(function() {
    // Charger les actualités
    async function loadTopNews() {
    const swiperWrapper = document.getElementById('swiperWrapper');
    const swiperContainer = document.querySelector('.swiper-container');
    
    if (!swiperWrapper || !swiperContainer) return;
    
    // Assurer la visibilité du conteneur (uniquement sur tablette/PC maintenant)
    swiperContainer.style.display = 'block';
    swiperContainer.style.visibility = 'visible';
    swiperContainer.style.opacity = '1';
    
    try {
        console.log('Début du chargement des actualités (PC/Tablette)');
        
        const response = await fetch('/api/getNationalNews');
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const articles = await response.json();
        swiperWrapper.innerHTML = '';
        
        if (articles.length === 0) {
            swiperWrapper.innerHTML = '<div class="swiper-slide"><div class="slide-content"><p>Aucune actualité disponible.</p></div></div>';
            return;
        }
        
        const limitedArticles = articles.slice(0, 10);
        
        limitedArticles.forEach(article => {

            if (article.title && article.link) {
                const slide = document.createElement('div');
                slide.className = 'swiper-slide';
                let slideHTML = `<a href="${article.link}" target="_blank">`;
                if (article.image && article.image !== "images/default-news.jpg") {
				slideHTML += `<img src="${article.image}" alt="${article.title}" loading="lazy" style="object-position: center 30%;">`;
			} else {
				slideHTML += `<img src="images/default-news.jpg" alt="Image par défaut" loading="lazy" style="object-position: center center;">`;
			}
                slideHTML += `
                    <div class="slide-content">
                        <div class="slide-title">${article.title}</div>
                        <div class="slide-source">${article.source || 'Source'}</div>
                    </div>
                </a>`;
                slide.innerHTML = slideHTML;
                swiperWrapper.appendChild(slide);
            }
        });
        
        if (window.swiper) {
            window.swiper.destroy(true, true);
        }

        const slidesPerViewDesktop = 1;
        const isLoopingEnabled = limitedArticles.length > slidesPerViewDesktop;
        
        console.log(`Swiper Info: ${limitedArticles.length} articles chargés. Boucle ${isLoopingEnabled ? 'activée' : 'désactivée'}.`);

        window.swiper = new Swiper('.swiper', {
            loop: isLoopingEnabled,
            grabCursor: true,
            autoplay: { delay: 5000, disableOnInteraction: false },
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            slidesPerView: 1.2,
            spaceBetween: 15,
            centeredSlides: true,
            breakpoints: {
                768: { slidesPerView: 2.5, spaceBetween: 20 },
                1024: { slidesPerView: slidesPerViewDesktop, spaceBetween: 30, centeredSlides: false }
            },
            observer: true,
            observeParents: true,
        });

    } catch (error) {
        console.error('Erreur chargement actualités:', error);
        if (swiperWrapper) {
            swiperWrapper.innerHTML = '<div class="swiper-slide"><div class="slide-content"><p>Erreur chargement.</p></div></div>';
        }
    }
}

    // Fonction pour s'assurer que le swiper est correctement affiché sur tablette
    function ensureTabletSwiper() {
        // Vérifier si nous sommes sur une tablette portrait
        const isTabletPortrait = window.innerWidth >= 600 && 
                                window.innerWidth <= 1100 && 
                                window.innerHeight > window.innerWidth;
        
        if (isTabletPortrait) {
            console.log("Vérification/ajustement du Swiper pour tablette portrait");
            
            // Forcer la visibilité du conteneur
            const swiperContainer = document.querySelector('.swiper-container');
            const swiperElement = document.querySelector('.swiper');
            
            if (swiperContainer && swiperElement) {
                // Forcer l'affichage
                swiperContainer.style.display = 'block';
                swiperContainer.style.visibility = 'visible';
                swiperContainer.style.opacity = '1';
                
                swiperElement.style.display = 'block';
                swiperElement.style.visibility = 'visible';
                swiperElement.style.height = '250px';
                swiperElement.style.opacity = '1';
                
                // Mettre à jour le swiper si nécessaire
                if (window.swiper) {
                    window.swiper.update();
                } else {
                    // Si loadTopNews n'a pas encore été appelé, le faire maintenant
                    loadTopNews();
                }
            }
        }
    }

    // Initialisation
    function init() {
        // Exposer la fonction refreshNews pour d'autres scripts
        window.refreshNews = function() {
            console.log('Actualisation des nouvelles...');
            loadTopNews();
            setTimeout(ensureTabletSwiper, 300);
        };
        
        // Appeler la fonction de vérification du swiper au redimensionnement
        window.addEventListener('resize', ensureTabletSwiper);
        
        // Chargement initial des actualités
        document.addEventListener('DOMContentLoaded', function() {
            loadTopNews();
            setTimeout(ensureTabletSwiper, 500);
            
            // Configurer le bouton de rafraîchissement
            const refreshButton = document.getElementById('refreshButton');
            if (refreshButton) {
                refreshButton.addEventListener('click', window.refreshNews);
            }
        });
    }
    
    // Lancer l'initialisation
    init();
})();