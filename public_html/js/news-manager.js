// news-manager.js
(function() {
    let retryCount = 0; // Compteur de tentatives
    const MAX_RETRIES = 3; // Maximum 3 tentatives
    
    // Charger les actualités
    async function loadTopNews() {
        const swiperWrapper = document.getElementById('swiperWrapper');
        const swiperContainer = document.querySelector('.swiper-container');
        
        if (!swiperWrapper || !swiperContainer) return;
        
        // Assurer la visibilité du conteneur
        swiperContainer.style.display = 'block';
        swiperContainer.style.visibility = 'visible';
        swiperContainer.style.opacity = '1';
        
        try {
            console.log(`📰 Chargement des actualités (tentative ${retryCount + 1}/${MAX_RETRIES})`);
            
            // ✅ Timeout de 15 secondes pour la requête
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            const response = await fetch('/api/getNationalNews?t=' + Date.now(), {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const articles = await response.json();
            
            // ✅ Réinitialiser le compteur en cas de succès
            retryCount = 0;
            
            swiperWrapper.innerHTML = '';
            
            if (articles.length === 0) {
                swiperWrapper.innerHTML = '<div class="swiper-slide"><div class="slide-content"><p>Aucune actualité disponible.</p></div></div>';
                return;
            }
            
            // Mélanger pour avoir de la variété
            const shuffled = articles.sort(() => Math.random() - 0.5);
            const limitedArticles = shuffled.slice(0, 16);
            
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
            
            console.log(`✅ Swiper: ${limitedArticles.length} articles chargés`);

            window.swiper = new Swiper('.swiper', {
                loop: isLoopingEnabled,
                grabCursor: true,
                autoplay: { delay: 5000, disableOnInteraction: false },
                pagination: { el: '.swiper-pagination', clickable: true },
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
                slidesPerView: 1,
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
            console.error('❌ Erreur chargement actualités:', error);
            
            if (swiperWrapper) {
                // ✅ Réessayer automatiquement si possible
                if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    const delay = retryCount * 2000; // Délai progressif: 2s, 4s, 6s
                    
                    swiperWrapper.innerHTML = `
                        <div class="swiper-slide">
                            <div class="slide-content" style="text-align: center; padding: 40px 20px;">
                                <p style="font-size: 18px; margin-bottom: 15px;">⏳ Chargement des actualités...</p>
                                <p style="font-size: 14px; opacity: 0.8;">Tentative ${retryCount}/${MAX_RETRIES}</p>
                            </div>
                        </div>
                    `;
                    
                    setTimeout(() => {
                        console.log(`🔄 Nouvelle tentative dans ${delay/1000}s...`);
                        loadTopNews();
                    }, delay);
                } else {
                    // Après 3 tentatives, afficher un message d'erreur
                    swiperWrapper.innerHTML = `
                        <div class="swiper-slide">
                            <div class="slide-content" style="text-align: center; padding: 40px 20px;">
                                <p style="font-size: 18px; margin-bottom: 15px;">⚠️ Impossible de charger les actualités</p>
                                <button onclick="window.location.reload()" style="padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                                    🔄 Actualiser la page
                                </button>
                            </div>
                        </div>
                    `;
                    retryCount = 0; // Réinitialiser pour la prochaine fois
                }
            }
        }
    }

    // Fonction pour s'assurer que le swiper est correctement affiché sur tablette
    function ensureTabletSwiper() {
        const isTabletPortrait = window.innerWidth >= 600 && 
                                window.innerWidth <= 1100 && 
                                window.innerHeight > window.innerWidth;
        
        if (isTabletPortrait) {
            console.log("✅ Vérification Swiper tablette");
            
            const swiperContainer = document.querySelector('.swiper-container');
            const swiperElement = document.querySelector('.swiper');
            
            if (swiperContainer && swiperElement) {
                swiperContainer.style.display = 'block';
                swiperContainer.style.visibility = 'visible';
                swiperContainer.style.opacity = '1';
                
                swiperElement.style.display = 'block';
                swiperElement.style.visibility = 'visible';
                swiperElement.style.height = '250px';
                swiperElement.style.opacity = '1';
                
                if (window.swiper) {
                    window.swiper.update();
                } else {
                    loadTopNews();
                }
            }
        }
    }

    // Initialisation
    function init() {
        window.refreshNews = function() {
            console.log('🔄 Actualisation des nouvelles...');
            retryCount = 0; // Réinitialiser le compteur
            loadTopNews();
            setTimeout(ensureTabletSwiper, 300);
        };
        
        window.addEventListener('resize', ensureTabletSwiper);
        
        document.addEventListener('DOMContentLoaded', function() {
            loadTopNews();
            setTimeout(ensureTabletSwiper, 500);
            
            const refreshButton = document.getElementById('refreshButton');
            if (refreshButton) {
                refreshButton.addEventListener('click', window.refreshNews);
            }
        });
    }
    
    init();
})();