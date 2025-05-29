// news-manager.js - Optimisé pour iOS
(function() {
    // Variables globales pour iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isIOSSafari = isIOS && /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
    
    let newsCache = [];
    let lastFetchTime = 0;
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    let retryCount = 0;
    const MAX_RETRIES = 3;
    
    // Charger les actualités avec optimisations iOS
    async function loadTopNews() {
        const swiperWrapper = document.getElementById('swiperWrapper');
        const swiperContainer = document.querySelector('.swiper-container');
        
        if (!swiperWrapper || !swiperContainer) {
            console.log('Éléments Swiper non trouvés');
            return;
        }
        
        // Vérifier si le Swiper doit être affiché (uniquement sur grand écran)
        const shouldShowSwiper = window.innerWidth > 1024;
        
        if (!shouldShowSwiper) {
            console.log('Swiper masqué sur cet écran (< 1024px)');
            swiperContainer.style.display = 'none';
            return;
        }
        
        // Rendre le conteneur Swiper visible pour les grands écrans
        swiperContainer.style.display = 'block';
        swiperContainer.style.visibility = 'visible';
        swiperContainer.style.opacity = '1';
        
        // Cache et optimisation réseau pour iOS
        const now = Date.now();
        if (newsCache.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
            console.log('Utilisation du cache pour les actualités');
            displayNewsFromCache();
            return;
        }
        
        try {
            console.log('Début du chargement des actualités');
            showLoadingState();
            
            // Timeout plus court pour iOS Safari
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), isIOSSafari ? 8000 : 10000);
            
            const response = await fetch('/api/getNationalNews.js', {
                signal: controller.signal,
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const articles = await response.json();
            
            // Validation et nettoyage des données pour iOS
            const validArticles = articles.filter(article => 
                article && 
                article.title && 
                article.title.trim() && 
                article.link &&
                article.link.startsWith('http')
            );
            
            if (validArticles.length === 0) {
                showEmptyState();
                return;
            }
            
            // Mise en cache
            newsCache = validArticles;
            lastFetchTime = now;
            retryCount = 0;
            
            displayNews(validArticles);
            
        } catch (error) {
            console.error('Erreur chargement actualités:', error);
            handleNewsError(error);
        }
    }
    
    // Afficher l'état de chargement
    function showLoadingState() {
        const swiperWrapper = document.getElementById('swiperWrapper');
        if (swiperWrapper) {
            swiperWrapper.innerHTML = `
                <div class="swiper-slide">
                    <div class="slide-content loading-slide">
                        <div class="loading-spinner"></div>
                        <p>Chargement des actualités...</p>
                    </div>
                </div>
            `;
        }
    }
    
    // Afficher l'état vide
    function showEmptyState() {
        const swiperWrapper = document.getElementById('swiperWrapper');
        if (swiperWrapper) {
            swiperWrapper.innerHTML = `
                <div class="swiper-slide">
                    <div class="slide-content empty-slide">
                        <span class="material-icons" style="font-size: 48px; opacity: 0.5;">article</span>
                        <p>Aucune actualité disponible pour le moment.</p>
                        <button onclick="window.refreshNews()" class="retry-btn">Réessayer</button>
                    </div>
                </div>
            `;
        }
    }
    
    // Afficher les actualités depuis le cache
    function displayNewsFromCache() {
        if (newsCache.length > 0) {
            displayNews(newsCache);
        }
    }
    
    // Afficher les actualités avec optimisations iOS
    function displayNews(articles) {
        const swiperWrapper = document.getElementById('swiperWrapper');
        if (!swiperWrapper) return;
        
        swiperWrapper.innerHTML = '';
        
        // Limiter à 5 articles pour éviter les problèmes de performance iOS
        const limitedArticles = articles.slice(0, 5);
        console.log(`Affichage de ${limitedArticles.length} articles`);
        
        limitedArticles.forEach((article, index) => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            
            // Optimisations pour iOS
            if (isIOS) {
                slide.style.transform = 'translateZ(0)';
                slide.style.webkitBackfaceVisibility = 'hidden';
                slide.style.backfaceVisibility = 'hidden';
            }
            
            // Structure HTML optimisée
            let slideHTML = `<a href="${escapeHtml(article.link)}" target="_blank" rel="noopener noreferrer">`;
            
            // Gestion des images avec lazy loading pour iOS
            if (article.image && article.image !== "images/default-news.jpg") {
                slideHTML += `
                    <img src="${escapeHtml(article.image)}" 
                         alt="${escapeHtml(article.title)}"
                         loading="lazy"
                         onerror="this.src='images/default-news.jpg'; this.onerror=null;"
                         style="object-fit: cover; width: 100%; height: 200px;">
                `;
            } else {
                slideHTML += `
                    <img src="images/default-news.jpg" 
                         alt="Image par défaut"
                         style="object-fit: cover; width: 100%; height: 200px;">
                `;
            }
            
            // Overlay avec titre et source optimisé
            slideHTML += `
                <div class="slide-content">
                    <div class="slide-overlay">
                        <div class="slide-title">${escapeHtml(article.title)}</div>
                        <div class="slide-source">${escapeHtml(article.source || 'Actualité')}</div>
                        <div class="slide-meta">
                            ${article.publishedAt ? `<span class="slide-date">${formatDate(article.publishedAt)}</span>` : ''}
                        </div>
                    </div>
                </div>
            </a>`;
            
            slide.innerHTML = slideHTML;
            swiperWrapper.appendChild(slide);
        });
        
        // Initialiser Swiper avec optimisations iOS
        initializeSwiper(limitedArticles.length);
    }
    
    // Initialiser Swiper avec configuration optimisée iOS
    function initializeSwiper(articleCount) {
        // Détruire l'instance précédente
        if (window.swiper) {
            try {
                window.swiper.destroy(true, true);
            } catch (e) {
                console.log('Erreur destruction Swiper:', e);
            }
        }
        
        // Configuration Swiper optimisée pour iOS
        const swiperOptions = {
            loop: articleCount > 1,
            autoplay: articleCount > 1 ? { 
                delay: isIOS ? 7000 : 5000, // Plus lent sur iOS pour la performance
                disableOnInteraction: false,
                pauseOnMouseEnter: true
            } : false,
            pagination: { 
                el: '.swiper-pagination', 
                clickable: true,
                dynamicBullets: true
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
            
            // Optimisations spécifiques iOS
            touchEventsTarget: 'container',
            simulateTouch: true,
            allowTouchMove: true,
            touchRatio: 1,
            touchAngle: 45,
            shortSwipes: true,
            longSwipes: true,
            followFinger: true,
            
            // Performance iOS
            watchSlidesProgress: true,
            watchSlidesVisibility: true,
            preloadImages: false,
            lazy: {
                loadPrevNext: true,
                loadOnTransitionStart: true
            },
            
            // Corrections iOS Safari
            touchStartPreventDefault: false,
            touchStartForcePreventDefault: false,
            touchMoveStopPropagation: false,
            
            on: {
                init: function() {
                    console.log('Swiper initialisé avec succès');
                    
                    // Optimisations post-initialisation pour iOS
                    if (isIOS) {
                        const slides = this.slides;
                        slides.forEach(slide => {
                            slide.style.transform = 'translateZ(0)';
                            slide.style.webkitBackfaceVisibility = 'hidden';
                        });
                    }
                    
                    // Force une mise à jour après initialisation
                    setTimeout(() => {
                        this.update();
                        this.updateSize();
                        this.updateSlides();
                    }, 100);
                },
                
                slideChange: function() {
                    // Optimisation performance iOS lors du changement de slide
                    if (isIOS) {
                        const activeSlide = this.slides[this.activeIndex];
                        if (activeSlide) {
                            activeSlide.style.transform = 'translateZ(0)';
                        }
                    }
                },
                
                touchStart: function() {
                    // Pause autoplay lors du touch sur iOS
                    if (isIOS && this.autoplay && this.autoplay.running) {
                        this.autoplay.stop();
                    }
                },
                
                touchEnd: function() {
                    // Reprendre autoplay après touch sur iOS
                    if (isIOS && this.autoplay && !this.autoplay.running) {
                        setTimeout(() => {
                            this.autoplay.start();
                        }, 3000);
                    }
                }
            }
        };
        
        try {
            // Initialiser le nouveau Swiper
            window.swiper = new Swiper('.swiper', swiperOptions);
            
            // Update supplémentaire pour iOS avec délai
            if (isIOS) {
                setTimeout(() => {
                    if (window.swiper) {
                        window.swiper.update();
                        window.swiper.updateSize();
                        window.swiper.updateSlides();
                    }
                }, isIOSSafari ? 1000 : 500);
            }
            
        } catch (error) {
            console.error('Erreur initialisation Swiper:', error);
        }
    }
    
    // Gestion des erreurs avec retry pour iOS
    function handleNewsError(error) {
        console.error('Erreur news:', error);
        
        const swiperWrapper = document.getElementById('swiperWrapper');
        if (!swiperWrapper) return;
        
        // Utiliser le cache si disponible
        if (newsCache.length > 0) {
            console.log('Utilisation du cache suite à l\'erreur');
            displayNewsFromCache();
            return;
        }
        
        // Retry automatique sur iOS (connexion parfois instable)
        if (isIOS && retryCount < MAX_RETRIES && 
            (error.name === 'AbortError' || error.name === 'TypeError')) {
            retryCount++;
            console.log(`Tentative ${retryCount}/${MAX_RETRIES} de rechargement`);
            setTimeout(() => {
                loadTopNews();
            }, 2000 * retryCount);
            return;
        }
        
        // Affichage de l'erreur
        swiperWrapper.innerHTML = `
            <div class="swiper-slide">
                <div class="slide-content error-slide">
                    <span class="material-icons" style="font-size: 48px; color: #f44336;">error_outline</span>
                    <h3>Erreur de chargement</h3>
                    <p>Impossible de charger les actualités.</p>
                    ${isIOS ? '<p><small>Vérifiez votre connexion internet.</small></p>' : ''}
                    <button onclick="window.refreshNews()" class="retry-btn">Réessayer</button>
                </div>
            </div>
        `;
    }
    
    // Fonction utilitaire pour échapper le HTML
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Formater la date
    function formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '';
        }
    }
    
    // Vérification intelligente pour l'affichage du Swiper
    function checkSwiperDisplay() {
        const shouldShowSwiper = window.innerWidth > 1024;
        const swiperContainer = document.querySelector('.swiper-container');
        
        if (!swiperContainer) return;
        
        if (shouldShowSwiper) {
            console.log("Grand écran détecté - Swiper activé");
            swiperContainer.style.display = 'block';
            swiperContainer.style.visibility = 'visible';
            swiperContainer.style.opacity = '1';
            
            // Charger les news si pas encore fait
            if (!window.swiper || window.swiper.destroyed) {
                loadTopNews();
            }
        } else {
            console.log("Petit/moyen écran détecté - Swiper masqué");
            swiperContainer.style.display = 'none';
            
            // Détruire Swiper pour libérer la mémoire sur mobile
            if (window.swiper && !window.swiper.destroyed) {
                window.swiper.destroy(true, true);
            }
        }
    }
    
    // Nettoyage pour iOS (éviter les fuites mémoire)
    function cleanup() {
        if (window.swiper && !window.swiper.destroyed) {
            window.swiper.destroy(true, true);
        }
        newsCache = [];
        lastFetchTime = 0;
        retryCount = 0;
    }
    
    // Initialisation avec optimisations iOS
    function init() {
        console.log(`News Manager initialisé - iOS: ${isIOS}, Safari: ${isIOSSafari}`);
        
        // Exposer les fonctions pour d'autres scripts
        window.refreshNews = function() {
            console.log('Actualisation manuelle des nouvelles...');
            retryCount = 0;
            lastFetchTime = 0; // Force le rechargement
            loadTopNews();
        };
        
        // Gestionnaire de redimensionnement avec debounce
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                checkSwiperDisplay();
                
                // Recalculer les hauteurs iOS après rotation
                if (isIOS && window.setIOSVH) {
                    window.setIOSVH();
                }
            }, 250);
        });
        
        // Gestionnaire de rotation pour iOS
        if (isIOS) {
            window.addEventListener('orientationchange', function() {
                setTimeout(() => {
                    checkSwiperDisplay();
                    if (window.swiper && !window.swiper.destroyed) {
                        window.swiper.update();
                    }
                }, 500);
            });
        }
        
        // Nettoyage avant fermeture (iOS)
        window.addEventListener('beforeunload', cleanup);
        
        // Gestion de la visibilité de la page (iOS Background App Refresh)
        if (document.visibilityState !== undefined) {
            document.addEventListener('visibilitychange', function() {
                if (document.visibilityState === 'visible' && isIOS) {
                    // Recharger les news si la page redevient visible après 5 minutes
                    if (Date.now() - lastFetchTime > CACHE_DURATION) {
                        setTimeout(loadTopNews, 1000);
                    }
                }
            });
        }
        
        // Initialisation différée pour iOS
        document.addEventListener('DOMContentLoaded', function() {
            if (isIOS) {
                // Délai plus long sur iOS pour s'assurer que tout est chargé
                setTimeout(() => {
                    checkSwiperDisplay();
                }, 1000);
            } else {
                checkSwiperDisplay();
            }
            
            // Configurer le bouton de rafraîchissement
            const refreshButton = document.getElementById('refreshButton');
            if (refreshButton) {
                refreshButton.addEventListener('click', window.refreshNews);
                
                // Optimisation iOS pour le bouton
                if (isIOS) {
                    refreshButton.style.webkitTapHighlightColor = 'rgba(0,0,0,0.1)';
                    refreshButton.style.webkitTouchCallout = 'none';
                }
            }
        });
    }
    
    // Lancer l'initialisation
    init();
})();