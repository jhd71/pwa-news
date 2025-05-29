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