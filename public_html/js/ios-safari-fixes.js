/**
 * Corrections spécifiques pour iOS Safari
 */

// Détection iOS
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);

if (isIOS) {
    console.log('iOS détecté - Application des fixes iOS');
    
    // Fix 1: Hauteur viewport pour iOS Safari
    function setVH() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    // Appliquer au chargement
    setVH();
    
    // Réappliquer lors des changements
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', function() {
        setTimeout(setVH, 500); // Délai pour iOS
    });
    
    // Fix 2: Empêcher le zoom sur les inputs
    function preventZoom() {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (parseFloat(getComputedStyle(input).fontSize) < 16) {
                input.style.fontSize = '16px';
            }
        });
    }
    
    // Fix 3: Améliorer les performances de scroll
    function improveScrolling() {
        const scrollElements = document.querySelectorAll('.swiper-wrapper, .panel-content, .sidebar, .news-panel');
        scrollElements.forEach(element => {
            element.style.webkitOverflowScrolling = 'touch';
            element.style.transform = 'translateZ(0)';
        });
    }
    
    // Fix 4: Gestion du clavier virtuel iOS
    function handleVirtualKeyboard() {
        const inputs = document.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                // Scroll vers l'input avec un délai pour iOS
                setTimeout(() => {
                    this.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }, 300);
            });
            
            input.addEventListener('blur', function() {
                // Remettre le viewport à sa taille normale
                setTimeout(() => {
                    window.scrollTo(0, 0);
                    setVH();
                }, 300);
            });
        });
    }
    
    // Fix 5: Gestion des événements touch
    function improveTouchEvents() {
        // Ajouter le support passif pour les événements touch
        document.addEventListener('touchstart', function(){}, {passive: true});
        document.addEventListener('touchmove', function(){}, {passive: true});
        
        // Fix pour les boutons qui ne répondent pas
        const buttons = document.querySelectorAll('button, .nav-item, .menu-item a, .clickable');
        buttons.forEach(button => {
            button.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
            }, {passive: true});
            
            button.addEventListener('touchend', function() {
                this.style.transform = 'scale(1)';
            }, {passive: true});
        });
    }
    
    // Fix 6: Corrections pour les modales et sidebars
    function fixModalsAndSidebars() {
        const sidebar = document.getElementById('sidebar');
        const newsPanel = document.getElementById('newsPanel');
        
        if (sidebar) {
            sidebar.addEventListener('touchmove', function(e) {
                e.stopPropagation();
            }, {passive: false});
        }
        
        if (newsPanel) {
            newsPanel.addEventListener('touchmove', function(e) {
                e.stopPropagation();
            }, {passive: false});
        }
    }
    
    // Fix 7: Améliorer le Swiper sur iOS
    function fixSwiper() {
        // Attendre que Swiper soit initialisé
        setTimeout(() => {
            const swiperContainer = document.querySelector('.swiper');
            if (swiperContainer && window.swiper) {
                // Réinitialiser Swiper avec les bonnes options pour iOS
                window.swiper.destroy(true, true);
                
                window.swiper = new Swiper('.swiper', {
                    slidesPerView: 1,
                    spaceBetween: 0,
                    loop: true,
                    autoplay: {
                        delay: 8000,
                        disableOnInteraction: false,
                    },
                    pagination: {
                        el: '.swiper-pagination',
                        clickable: true,
                    },
                    navigation: {
                        nextEl: '.swiper-button-next',
                        prevEl: '.swiper-button-prev',
                    },
                    // Options spécifiques iOS
                    touchEventsTarget: 'container',
                    simulateTouch: true,
                    allowTouchMove: true,
                    touchRatio: 1,
                    touchAngle: 45,
                    shortSwipes: true,
                    longSwipes: true,
                    followFinger: true,
                });
            }
        }, 1000);
    }
    
    // Fix 8: Performance et memory management
    function optimizePerformance() {
        // Utiliser requestAnimationFrame pour les animations
        const animatedElements = document.querySelectorAll('.swiper-slide, .modal, .sidebar');
        animatedElements.forEach(element => {
            element.style.willChange = 'transform';
            element.style.transform = 'translateZ(0)';
        });
        
        // Nettoyer les event listeners inutiles
        let scrollTimer = null;
        window.addEventListener('scroll', function() {
            if (scrollTimer !== null) {
                clearTimeout(scrollTimer);
            }
            scrollTimer = setTimeout(function() {
                // Actions après scroll terminé
            }, 150);
        }, {passive: true});
    }
    
    // Fix 9: Gestion des erreurs réseau sur iOS
    function handleNetworkErrors() {
        window.addEventListener('online', function() {
            console.log('Connexion rétablie sur iOS');
            // Recharger les données si nécessaire
        });
        
        window.addEventListener('offline', function() {
            console.log('Perte de connexion sur iOS');
            // Afficher un message d'erreur
        });
    }
    
    // Fix 10: Correction spécifique pour les tuiles non-cliquables
    function fixTileClicks() {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            // Supprimer les anciens event listeners
            tile.removeEventListener('touchstart', handleTileTouch);
            tile.removeEventListener('touchend', handleTileTouch);
            tile.removeEventListener('click', handleTileClick);
            
            // Ajouter les nouveaux
            tile.addEventListener('touchstart', handleTileTouch, {passive: true});
            tile.addEventListener('touchend', handleTileTouch, {passive: true});
            tile.addEventListener('click', handleTileClick, {passive: false});
        });
    }

    function handleTileTouch(e) {
        const tile = e.currentTarget;
        if (e.type === 'touchstart') {
            tile.style.transform = 'scale(0.95)';
            tile.style.opacity = '0.8';
        } else if (e.type === 'touchend') {
            setTimeout(() => {
                tile.style.transform = '';
                tile.style.opacity = '';
            }, 150);
        }
    }

    function handleTileClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const tile = e.currentTarget;
        const url = tile.dataset.url;
        
        if (url) {
            // Feedback visuel
            tile.style.transform = 'scale(0.9)';
            setTimeout(() => {
                window.open(url, '_blank');
                tile.style.transform = '';
            }, 100);
        }
    }

    // Fix 11: Correction pour le Swiper qui ne glisse pas sur iOS
    function fixSwiperIOS() {
        setTimeout(() => {
            if (window.swiper) {
                // Détruire et recréer avec de meilleures options pour iOS
                window.swiper.destroy(true, true);
                
                window.swiper = new Swiper('.swiper', {
                    slidesPerView: 1,
                    spaceBetween: 0,
                    loop: true,
                    autoplay: {
                        delay: 8000,
                        disableOnInteraction: false,
                    },
                    pagination: {
                        el: '.swiper-pagination',
                        clickable: true,
                    },
                    navigation: {
                        nextEl: '.swiper-button-next',
                        prevEl: '.swiper-button-prev',
                    },
                    // Options critiques pour iOS
                    touchEventsTarget: 'container',
                    simulateTouch: true,
                    allowTouchMove: true,
                    touchRatio: 1,
                    touchAngle: 45,
                    shortSwipes: true,
                    longSwipes: true,
                    followFinger: true,
                    threshold: 10,
                    touchMoveStopPropagation: false,
                    touchStartPreventDefault: false,
                    touchStartForcePreventDefault: false,
                    touchReleaseOnEdges: true,
                    iOSEdgeSwipeDetection: true,
                    iOSEdgeSwipeThreshold: 20,
                    observer: true,
                    observeParents: true,
                    // Performance
                    watchSlidesProgress: true,
                    watchSlidesVisibility: true,
                    preloadImages: false,
                    lazy: true
                });
            }
        }, 2000);
    }

    // Fix 12: Correction pour les boutons de navigation
    function fixNavigationButtons() {
        const navButtons = document.querySelectorAll('.nav-item, .menu-button, .settings-button');
        navButtons.forEach(button => {
            button.addEventListener('touchstart', function() {
                this.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }, {passive: true});
            
            button.addEventListener('touchend', function() {
                setTimeout(() => {
                    this.style.backgroundColor = '';
                }, 200);
            }, {passive: true});
        });
    }
    
    // Initialisation de tous les fixes
    document.addEventListener('DOMContentLoaded', function() {
        preventZoom();
        improveScrolling();
        handleVirtualKeyboard();
        improveTouchEvents();
        fixModalsAndSidebars();
        optimizePerformance();
        handleNetworkErrors();
        
        // Délai pour le fix Swiper
        setTimeout(fixSwiper, 2000);
        
        // Appliquer les nouveaux fixes
        setTimeout(() => {
            fixTileClicks();
            fixSwiperIOS();
            fixNavigationButtons();
            
            console.log('Fixes iOS supplémentaires appliqués');
        }, 1000);
        
        console.log('Tous les fixes iOS ont été appliqués');
    });
    
    // Fix pour iOS en cas de rotation d'écran
    window.addEventListener('orientationchange', function() {
        setTimeout(function() {
            setVH();
            // Forcer un refresh des éléments
            document.body.style.height = window.innerHeight + 'px';
            setTimeout(() => {
                document.body.style.height = '';
            }, 500);
        }, 500);
    });
    
} else {
    console.log('Non-iOS - Fixes iOS ignorés');
}