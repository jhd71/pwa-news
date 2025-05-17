// Nouvelle approche: remplacer le modal par un panneau latéral

class BackgroundSelector {
    constructor() {
        this.storageKey = 'selectedBackground';
        this.init();
    }
    
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        this.createPanel();
        this.applySavedBackground();
        this.setupEventListeners();
        console.log('Sélecteur de fond d\'écran initialisé');
    }
    
    createPanel() {
        // Supprimer tout panel existant pour éviter les doublons
        const existingPanel = document.getElementById('bgSelectorPanel');
        if (existingPanel) {
            existingPanel.parentNode.removeChild(existingPanel);
        }
        
        // Créer un panneau latéral au lieu d'un modal
        const panel = document.createElement('div');
        panel.className = 'bg-selector-panel';
        panel.id = 'bgSelectorPanel';
        
        panel.innerHTML = `
            <div class="bg-selector-panel-content">
                <div class="bg-selector-header">
                    <h2>Choisir un fond d'écran</h2>
                    <button class="close-bg-selector" id="closeBgSelector">×</button>
                </div>
                
                <div class="bg-category">
                    <h3>Fonds unis</h3>
                    <div class="backgrounds-grid" id="solidBgs">
                        <div class="bg-thumbnail" data-bg="none" title="Couleur par défaut du thème">
                            <div class="bg-thumbnail-gradient" style="background-color: var(--primary-color);"></div>
                            <div class="bg-thumbnail-label">Par défaut</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-solid-light-blue" title="Fond bleu clair">
                            <div class="bg-thumbnail-gradient" style="background-color: #64B5F6;"></div>
                            <div class="bg-thumbnail-label">Bleu clair</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-solid-teal" title="Fond turquoise">
                            <div class="bg-thumbnail-gradient" style="background-color: #4DB6AC;"></div>
                            <div class="bg-thumbnail-label">Turquoise</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-solid-indigo" title="Fond indigo">
                            <div class="bg-thumbnail-gradient" style="background-color: #5C6BC0;"></div>
                            <div class="bg-thumbnail-label">Indigo</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-solid-green" title="Fond vert">
                            <div class="bg-thumbnail-gradient" style="background-color: #81C784;"></div>
                            <div class="bg-thumbnail-label">Vert</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-solid-amber" title="Fond ambre">
                            <div class="bg-thumbnail-gradient" style="background-color: #FFD54F;"></div>
                            <div class="bg-thumbnail-label">Ambre</div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-category">
                    <h3>Dégradés classiques</h3>
                    <div class="backgrounds-grid" id="gradientBgs">
                        <div class="bg-thumbnail" data-bg="bg-gradient-violet" data-theme="light" title="Dégradé Violet">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #9575CD, #7E57C2, #5E35B1);"></div>
                            <div class="bg-thumbnail-label">Violet</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-blue" data-theme="dark" title="Dégradé Bleu">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #283593, #1a237e, #0d1257);"></div>
                            <div class="bg-thumbnail-label">Bleu nuit</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-red" data-theme="rouge" title="Dégradé Rouge">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #e53935, #c62828, #b71c1c);"></div>
                            <div class="bg-thumbnail-label">Rouge</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-bleu-ciel" data-theme="bleuciel" title="Dégradé Bleu Ciel">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #4FC3F7, #4FB3E8, #3F97C7);"></div>
                            <div class="bg-thumbnail-label">Bleu ciel</div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-category">
                    <h3>Dégradés supplémentaires</h3>
                    <div class="backgrounds-grid" id="extraGradientBgs">
                        <div class="bg-thumbnail" data-bg="bg-gradient-sunset" title="Coucher de soleil">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #FF9E80, #FF6E40, #FF3D00);"></div>
                            <div class="bg-thumbnail-label">Coucher soleil</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-ocean" title="Océan">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #00BCD4, #0097A7, #006064);"></div>
                            <div class="bg-thumbnail-label">Océan</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-forest" title="Forêt">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #81C784, #4CAF50, #2E7D32);"></div>
                            <div class="bg-thumbnail-label">Forêt</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-lavender" title="Lavande">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #E1BEE7, #CE93D8, #AB47BC);"></div>
                            <div class="bg-thumbnail-label">Lavande</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-golden" title="Or">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #FFD54F, #FFC107, #FF8F00);"></div>
                            <div class="bg-thumbnail-label">Or</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-cherry" title="Cerise">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #F8BBD0, #F06292, #D81B60);"></div>
                            <div class="bg-thumbnail-label">Cerise</div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-category">
                    <h3>Dégradés diagonaux</h3>
                    <div class="backgrounds-grid" id="diagonalGradientBgs">
                        <div class="bg-thumbnail" data-bg="bg-gradient-diagonal-blue" title="Dégradé diagonal bleu">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(45deg, #2196F3, #0D47A1);"></div>
                            <div class="bg-thumbnail-label">Bleu</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-diagonal-green" title="Dégradé diagonal vert">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(45deg, #4CAF50, #1B5E20);"></div>
                            <div class="bg-thumbnail-label">Vert</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-diagonal-purple" title="Dégradé diagonal violet">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(45deg, #9C27B0, #4A148C);"></div>
                            <div class="bg-thumbnail-label">Violet</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-diagonal-orange" title="Dégradé diagonal orange">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(45deg, #FF9800, #E65100);"></div>
                            <div class="bg-thumbnail-label">Orange</div>
                        </div>
                    </div>
                </div>
                
                <button class="reset-bg-btn" id="resetBgBtn">Réinitialiser le fond</button>
            </div>
        `;
        
        document.body.appendChild(panel);
    }
    
    setupEventListeners() {
        const openBtn = document.getElementById('bgSelectorBtn');
        if (openBtn) {
            openBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openPanel();
                
                // Fermer la sidebar
                const sidebar = document.querySelector('.sidebar');
                if (sidebar && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            });
        }
        
        const closeBtn = document.getElementById('closeBgSelector');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closePanel();
            });
        }
        
        const resetBtn = document.getElementById('resetBgBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetBackground();
            });
        }
        
        const thumbnails = document.querySelectorAll('.bg-thumbnail');
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const bgClass = thumb.dataset.bg;
                this.setBackground(bgClass);
                this.selectThumbnail(thumb);
            });
        });
        
        // Fermer le panneau quand on clique en dehors
        document.addEventListener('click', (e) => {
            if (e.target.closest('.bg-selector-panel-content') || 
                e.target.closest('#bgSelectorBtn')) {
                return; // Clic à l'intérieur du panneau ou sur le bouton, ne rien faire
            }
            this.closePanel();
        });
        
        // Écouter la touche Echap pour fermer le panneau
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePanel();
            }
        });
        
        window.addEventListener('themeChanged', (e) => {
            this.updateSelectedThumbnail();
        });
    }
    
    openPanel() {
        const panel = document.getElementById('bgSelectorPanel');
        if (panel) {
            panel.classList.add('open');
            this.updateSelectedThumbnail();
        }
    }
    
    closePanel() {
        const panel = document.getElementById('bgSelectorPanel');
        if (panel) {
            panel.classList.remove('open');
        }
    }
    
    setBackground(bgClass) {
        // Supprimer toutes les classes de fond
        document.body.className = document.body.className
            .split(' ')
            .filter(cls => !cls.startsWith('bg-') && cls !== 'has-bg-image')
            .join(' ');
        
        // Ajouter la nouvelle classe
        if (bgClass && bgClass !== 'none') {
            document.body.classList.add('has-bg-image');
            document.body.classList.add(bgClass);
        }
        
        // Sauvegarder le choix
        localStorage.setItem(this.storageKey, bgClass || 'none');
        
        // Afficher une notification
        this.showToast('Fond d\'écran modifié');
    }
    
    resetBackground() {
        this.setBackground('none');
        this.updateSelectedThumbnail();
    }
    
    applySavedBackground() {
        const savedBg = localStorage.getItem(this.storageKey);
        if (savedBg && savedBg !== 'none') {
            document.body.classList.add('has-bg-image');
            document.body.classList.add(savedBg);
        }
    }
    
    selectThumbnail(thumbnail) {
        document.querySelectorAll('.bg-thumbnail.selected').forEach(thumb => {
            thumb.classList.remove('selected');
        });
        
        if (thumbnail) {
            thumbnail.classList.add('selected');
        }
    }
    
    updateSelectedThumbnail() {
        const savedBg = localStorage.getItem(this.storageKey) || 'none';
        const currentTheme = document.documentElement.getAttribute('data-theme');
        
        document.querySelectorAll('.bg-thumbnail').forEach(thumb => {
            thumb.classList.remove('selected');
            
            if (thumb.dataset.bg === savedBg) {
                if (!thumb.dataset.theme || thumb.dataset.theme === currentTheme) {
                    thumb.classList.add('selected');
                }
            }
        });
    }
    
    showToast(message) {
        if (window.contentManager && typeof window.contentManager.showToast === 'function') {
            window.contentManager.showToast(message);
        } else if (window.themeManager && typeof window.themeManager.showToast === 'function') {
            window.themeManager.showToast(message);
        } else {
            const existingToast = document.querySelector('.toast');
            if (existingToast) {
                existingToast.remove();
            }
            
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = message;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }
}

// Initialiser avec un délai pour s'assurer que tout est chargé
window.addEventListener('load', function() {
    setTimeout(function() {
        window.backgroundSelector = new BackgroundSelector();
    }, 1000);
});