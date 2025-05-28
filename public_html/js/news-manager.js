// news-manager.js
(function() {
    // Charger les actualités
    async function loadTopNews() {
        const swiperWrapper = document.getElementById('swiperWrapper');
        const swiperContainer = document.querySelector('.swiper-container');
        
        if (!swiperWrapper || !swiperContainer) return;
        
        // Rendre le conteneur Swiper visible, en particulier sur les tablettes
        swiperContainer.style.display = 'block';
        swiperContainer.style.visibility = 'visible';
        swiperContainer.style.opacity = '1';
        
        try {
            console.log('Début du chargement des actualités');
            
            const response = await fetch('/api/getNationalNews.js');
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const articles = await response.json();
            swiperWrapper.innerHTML = '';
            
            if (articles.length === 0) {
                swiperWrapper.innerHTML = '<div class="swiper-slide"><div class="slide-content"><p>Aucune actualité disponible pour le moment.</p></div></div>';
                console.log('Aucun article trouvé');
                return;
            }
            
            // Limiter à 5 articles pour éviter l'avertissement de loop
            const limitedArticles = articles.slice(0, 5);
            console.log(`Nombre d'articles à afficher: ${limitedArticles.length}`);
            
            limitedArticles.forEach(article => {
                if (article.title && article.link) {
                    const slide = document.createElement('div');
                    slide.className = 'swiper-slide';
                    
                    // Structure HTML simplifiée et robuste
                    let slideHTML = `<a href="${article.link}" target="_blank">`;
                    
                    // Ajouter l'image si disponible
                    if (article.image && article.image !== "images/default-news.jpg") {
                        slideHTML += `<img src="${article.image}" alt="${article.title}">`;
                    } else {
                        // Image de remplacement si pas d'image disponible
                        slideHTML += `<img src="images/default-news.jpg" alt="Image par défaut">`;
                    }
                    
                    // Overlay avec titre et source
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
            
            // Détruire l'instance précédente si elle existe
            if (window.swiper) {
                window.swiper.destroy(true, true);
            }
            
            // Vérifier si nous sommes sur une tablette en mode portrait
            const isTabletPortrait = window.innerWidth >= 600 && 
                                    window.innerWidth <= 1100 && 
                                    window.innerHeight > window.innerWidth;
            
            // Paramètres spécifiques pour les tablettes en portrait
            const swiperOptions = {
                loop: limitedArticles.length > 1,
                autoplay: { 
                    delay: 5000,
                    disableOnInteraction: false
                },
                pagination: { 
                    el: '.swiper-pagination', 
                    clickable: true 
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev'
                },
                slidesPerView: 1,
                spaceBetween: 0,
                grabCursor: true,
                observer: true,
                observeParents: true,
                updateOnWindowResize: true,
                on: {
                    init: function() {
                        console.log('Swiper initialisé avec succès');
                        
                        // Force la visibilité sur les tablettes
                        if (isTabletPortrait) {
                            console.log('Mode tablette portrait détecté - force la visibilité du Swiper');
                            setTimeout(() => {
                                // Forcer la visibilité après un court délai
                                const swiperElement = document.querySelector('.swiper');
                                if (swiperElement) {
                                    swiperElement.style.display = 'block';
                                    swiperElement.style.visibility = 'visible';
                                    swiperElement.style.opacity = '1';
                                    swiperElement.style.height = '250px';
                                }
                            }, 200);
                        }
                    }
                }
            };
            
            // Initialiser le nouveau Swiper avec les paramètres
            window.swiper = new Swiper('.swiper', swiperOptions);
            
            // Forcer un rafraîchissement du swiper après un court délai
            setTimeout(() => {
                if (window.swiper) {
                    window.swiper.update();
                }
            }, 500);
            
        } catch (error) {
            console.error('Erreur chargement actualités:', error);
            if (swiperWrapper) {
                swiperWrapper.innerHTML = '<div class="swiper-slide"><div class="slide-content"><p>Erreur lors du chargement des actualités.</p></div></div>';
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