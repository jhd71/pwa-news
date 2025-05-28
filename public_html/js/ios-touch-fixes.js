/**
 * Corrections spécifiques pour les problèmes de touch sur iOS
 */

(function() {
    'use strict';
    
    // Détecter iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (!isIOS) return;
    
    console.log('Chargement des corrections touch iOS');
    
    // Fix pour les éléments qui ne répondent pas au touch
    function addTouchSupport() {
        const touchElements = document.querySelectorAll([
            '.tile',
            '.nav-item', 
            '.menu-button',
            '.settings-button',
            '.separator',
            'button',
            '.clickable',
            'a'
        ].join(','));
        
        touchElements.forEach(element => {
            // Ajouter cursor pointer
            element.style.cursor = 'pointer';
            
            // Événements touch pour feedback visuel
            element.addEventListener('touchstart', function(e) {
                this.classList.add('ios-touch-active');
            }, {passive: true});
            
            element.addEventListener('touchend', function(e) {
                setTimeout(() => {
                    this.classList.remove('ios-touch-active');
                }, 150);
            }, {passive: true});
            
            element.addEventListener('touchcancel', function(e) {
                this.classList.remove('ios-touch-active');
            }, {passive: true});
        });
    }
    
    // Fix pour les problèmes de scroll
    function fixScrolling() {
        // Empêcher le bounce sur le body
        document.body.addEventListener('touchmove', function(e) {
            if (e.target === document.body) {
                e.preventDefault();
            }
        }, {passive: false});
        
        // Améliorer le scroll des éléments scrollables
        const scrollableElements = document.querySelectorAll([
            '.news-panel .panel-content',
            '.sidebar',
            '.settings-menu',
            '.chat-messages',
            '.modal-content'
        ].join(','));
        
        scrollableElements.forEach(element => {
            element.style.webkitOverflowScrolling = 'touch';
            element.style.overflowScrolling = 'touch';
        });
    }
    
    // Fix pour les inputs
    function fixInputs() {
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            // Empêcher le zoom
            if (!input.style.fontSize || parseFloat(input.style.fontSize) < 16) {
                input.style.fontSize = '16px';
            }
            
            // Fix pour le clavier virtuel
            input.addEventListener('focus', function() {
                setTimeout(() => {
                    this.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }, 300);
            });
        });
    }
    
    // Fix pour les menus contextuels
    function fixContextMenus() {
        document.addEventListener('contextmenu', function(e) {
            // Empêcher le menu contextuel natif sur les éléments UI
            if (e.target.closest('.tile, .nav-item, .menu-button, .settings-button')) {
                e.preventDefault();
            }
        });
    }
    
    // Fix pour les performances
    function optimizePerformance() {
        // Ajouter will-change aux éléments animés
        const animatedElements = document.querySelectorAll([
            '.tile',
            '.swiper-slide',
            '.sidebar',
            '.settings-menu',
            '.modal',
            '.news-panel'
        ].join(','));
        
        animatedElements.forEach(element => {
            element.style.willChange = 'transform';
            element.style.transform = 'translateZ(0)';
        });
    }
    
    // Initialisation
    function initIOSTouchFixes() {
        addTouchSupport();
        fixScrolling();
        fixInputs();
        fixContextMenus();
        optimizePerformance();
        
        console.log('Corrections touch iOS appliquées');
    }
    
    // Démarrer quand le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initIOSTouchFixes);
    } else {
        initIOSTouchFixes();
    }
    
    // Réappliquer après chargement des tuiles
    window.addEventListener('tilesLoaded', initIOSTouchFixes);
    
})();