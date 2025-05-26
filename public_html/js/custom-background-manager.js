// js/custom-background-manager.js - Gestionnaire de fonds d'écran personnalisés

class CustomBackgroundManager {
    constructor() {
        this.customBackgrounds = JSON.parse(localStorage.getItem('customBackgrounds') || '[]');
        this.currentCustomBackground = localStorage.getItem('currentCustomBackground') || null;
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        this.init();
    }

    init() {
        this.createUploadModal();
        this.setupEventListeners();
        this.loadCurrentBackground();
    }

    createUploadModal() {
    const modalHTML = `
        <div id="backgroundUploadModal" class="background-upload-modal" style="display: none;">
            <div class="modal-overlay"></div>
            <div class="modal-container">
                <div class="modal-header">
                    <h2>🎨 Ajouter un fond d'écran personnalisé</h2>
                    <button id="closeBackgroundModal" class="close-modal-btn">×</button>
                </div>
                <div class="modal-content">
                    <div class="upload-section">
                        <div class="upload-area" id="uploadArea">
                            <div class="upload-icon">📁</div>
                            <p>Glissez-déposez votre image ici</p>
                            <p class="upload-info">ou cliquez pour choisir un fichier</p>
                            <p class="file-requirements">
                                Formats acceptés : JPG, PNG, WEBP<br>
                                Taille max : 5MB
                            </p>
                            <input type="file" id="backgroundFileInput" accept="image/*" style="display: none;">
                        </div>
                        <div id="imagePreview" class="image-preview" style="display: none;">
                            <div class="preview-container" id="previewContainer">
                                <img id="previewImg" src="" alt="Aperçu" draggable="false">
                                <div class="drag-hint">🖱️ Glissez pour repositionner</div>
                            </div>
                            <div class="image-controls">
                                <div class="control-group">
                                    <label>Position:</label>
                                    <select id="positionSelect">
                                        <option value="center">Centre</option>
                                        <option value="top">Haut</option>
                                        <option value="bottom">Bas</option>
                                        <option value="left">Gauche</option>
                                        <option value="right">Droite</option>
                                        <option value="custom">Personnalisée</option>
                                    </select>
                                </div>
                                <div class="control-group">
                                    <label>Taille:</label>
                                    <select id="sizeSelect">
                                        <option value="cover">Couvrir (recommandé)</option>
                                        <option value="contain">Contenir</option>
                                        <option value="stretch">Étirer</option>
                                    </select>
                                </div>
                                <div class="control-group">
                                    <label>Zoom: <span id="zoomValue">100%</span></label>
                                    <input type="range" id="zoomSlider" min="50" max="200" value="100">
                                </div>
                                <div class="control-group">
                                    <label>Opacité: <span id="opacityValue">100%</span></label>
                                    <input type="range" id="opacitySlider" min="20" max="100" value="100">
                                </div>
                                <div class="control-group position-controls" id="positionControls" style="display: none;">
                                    <label>Position X: <span id="positionXValue">50%</span></label>
                                    <input type="range" id="positionXSlider" min="0" max="100" value="50">
                                    <label>Position Y: <span id="positionYValue">50%</span></label>
                                    <input type="range" id="positionYSlider" min="0" max="100" value="50">
                                </div>
                            </div>
                            <div class="preview-actions">
                                <button id="resetPosition" class="btn-reset">🔄 Centrer</button>
                                <button id="confirmUpload" class="btn-primary">✅ Appliquer ce fond</button>
                                <button id="cancelUpload" class="btn-secondary">❌ Annuler</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="custom-backgrounds-section">
                        <h3>🖼️ Vos fonds d'écran personnalisés</h3>
                        <div id="customBackgroundsList" class="custom-backgrounds-grid">
                            <!-- Les fonds personnalisés seront affichés ici -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

    setupEventListeners() {
    // Upload area
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('backgroundFileInput');

    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });
    }

    // Image controls - avec vérification d'existence
    setTimeout(() => {
        const positionSelect = document.getElementById('positionSelect');
        const sizeSelect = document.getElementById('sizeSelect');
        const zoomSlider = document.getElementById('zoomSlider');
        const opacitySlider = document.getElementById('opacitySlider');
        const positionXSlider = document.getElementById('positionXSlider');
        const positionYSlider = document.getElementById('positionYSlider');
        const resetPositionBtn = document.getElementById('resetPosition');

        if (positionSelect) {
            positionSelect.addEventListener('change', (e) => {
                const positionControls = document.getElementById('positionControls');
                if (e.target.value === 'custom') {
                    positionControls.style.display = 'block';
                } else {
                    positionControls.style.display = 'none';
                }
                this.updatePreview();
            });
        }

        if (sizeSelect) {
            sizeSelect.addEventListener('change', () => this.updatePreview());
        }

        if (zoomSlider) {
            zoomSlider.addEventListener('input', (e) => {
                const zoomValue = document.getElementById('zoomValue');
                if (zoomValue) {
                    zoomValue.textContent = e.target.value + '%';
                }
                this.updatePreview();
            });
        }

        if (opacitySlider) {
            opacitySlider.addEventListener('input', (e) => {
                const opacityValue = document.getElementById('opacityValue');
                if (opacityValue) {
                    opacityValue.textContent = e.target.value + '%';
                }
                this.updatePreview();
            });
        }

        if (positionXSlider) {
            positionXSlider.addEventListener('input', (e) => {
                const positionXValue = document.getElementById('positionXValue');
                if (positionXValue) {
                    positionXValue.textContent = e.target.value + '%';
                }
                this.updatePreview();
            });
        }

        if (positionYSlider) {
            positionYSlider.addEventListener('input', (e) => {
                const positionYValue = document.getElementById('positionYValue');
                if (positionYValue) {
                    positionYValue.textContent = e.target.value + '%';
                }
                this.updatePreview();
            });
        }

        if (resetPositionBtn) {
            resetPositionBtn.addEventListener('click', () => {
                this.resetImagePosition();
            });
        }

        // Ajouter le drag & drop sur l'image
        this.setupImageDrag();
    }, 500);

    // Modal controls
    const closeBtn = document.getElementById('closeBackgroundModal');
    const confirmBtn = document.getElementById('confirmUpload');
    const cancelBtn = document.getElementById('cancelUpload');
    const overlay = document.querySelector('#backgroundUploadModal .modal-overlay');

    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
    if (confirmBtn) confirmBtn.addEventListener('click', () => this.confirmUpload());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.cancelUpload());
    if (overlay) overlay.addEventListener('click', () => this.closeModal());
}

// 3. Nouvelle méthode pour gérer le glisser-déposer de l'image :
setupImageDrag() {
    setTimeout(() => {
        const previewContainer = document.getElementById('previewContainer');
        const previewImg = document.getElementById('previewImg');
        
        if (!previewContainer || !previewImg) return;

        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialX = 50;
        let initialY = 50;

        // Variables pour gérer à la fois souris et touch
        const getEventPos = (e) => {
            if (e.touches && e.touches[0]) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            return { x: e.clientX, y: e.clientY };
        };

        // Événements souris
        previewContainer.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);

        // Événements tactiles
        previewContainer.addEventListener('touchstart', startDrag, { passive: false });
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('touchend', endDrag);

        function startDrag(e) {
            e.preventDefault();
            isDragging = true;
            previewContainer.style.cursor = 'grabbing';
            
            const pos = getEventPos(e);
            startX = pos.x;
            startY = pos.y;
            
            const positionXSlider = document.getElementById('positionXSlider');
            const positionYSlider = document.getElementById('positionYSlider');
            
            if (positionXSlider && positionYSlider) {
                initialX = parseInt(positionXSlider.value);
                initialY = parseInt(positionYSlider.value);
            }

            // Passer en mode personnalisé
            const positionSelect = document.getElementById('positionSelect');
            if (positionSelect && positionSelect.value !== 'custom') {
                positionSelect.value = 'custom';
                const positionControls = document.getElementById('positionControls');
                if (positionControls) {
                    positionControls.style.display = 'block';
                }
            }
        }

        function drag(e) {
            if (!isDragging) return;
            
            e.preventDefault();
            const pos = getEventPos(e);
            
            const deltaX = pos.x - startX;
            const deltaY = pos.y - startY;
            
            // Convertir le mouvement en pourcentage
            const containerRect = previewContainer.getBoundingClientRect();
            const deltaXPercent = (deltaX / containerRect.width) * 100;
            const deltaYPercent = (deltaY / containerRect.height) * 100;
            
            let newX = initialX + deltaXPercent;
            let newY = initialY + deltaYPercent;
            
            // Limiter les valeurs
            newX = Math.max(0, Math.min(100, newX));
            newY = Math.max(0, Math.min(100, newY));
            
            // Mettre à jour les sliders
            const positionXSlider = document.getElementById('positionXSlider');
            const positionYSlider = document.getElementById('positionYSlider');
            const positionXValue = document.getElementById('positionXValue');
            const positionYValue = document.getElementById('positionYValue');
            
            if (positionXSlider) {
                positionXSlider.value = Math.round(newX);
                if (positionXValue) positionXValue.textContent = Math.round(newX) + '%';
            }
            if (positionYSlider) {
                positionYSlider.value = Math.round(newY);
                if (positionYValue) positionYValue.textContent = Math.round(newY) + '%';
            }
            
            this.updatePreview();
        }

        function endDrag() {
            isDragging = false;
            previewContainer.style.cursor = 'grab';
        }

        // Style du curseur
        previewContainer.style.cursor = 'grab';
        previewContainer.style.userSelect = 'none';
    }, 100);
}

// 4. Nouvelle méthode pour réinitialiser la position :
resetImagePosition() {
    const positionXSlider = document.getElementById('positionXSlider');
    const positionYSlider = document.getElementById('positionYSlider');
    const positionXValue = document.getElementById('positionXValue');
    const positionYValue = document.getElementById('positionYValue');
    const positionSelect = document.getElementById('positionSelect');

    if (positionXSlider) {
        positionXSlider.value = 50;
        if (positionXValue) positionXValue.textContent = '50%';
    }
    if (positionYSlider) {
        positionYSlider.value = 50;
        if (positionYValue) positionYValue.textContent = '50%';
    }
    if (positionSelect) {
        positionSelect.value = 'center';
        const positionControls = document.getElementById('positionControls');
        if (positionControls) {
            positionControls.style.display = 'none';
        }
    }

    this.updatePreview();
}

    openModal() {
        console.log('🎨 Ouverture de la modal de fond personnalisé');
        const modal = document.getElementById('backgroundUploadModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.classList.add('modal-open');
            this.updateCustomBackgroundsList();
        } else {
            console.error('❌ Modal backgroundUploadModal non trouvée');
        }
    }

    closeModal() {
        const modal = document.getElementById('backgroundUploadModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
            this.resetUploadArea();
        }
    }

    handleFileSelect(file) {
        // Validation
        if (!this.allowedTypes.includes(file.type)) {
            this.showToast('❌ Format non supporté. Utilisez JPG, PNG ou WEBP.', 'error');
            return;
        }

        if (file.size > this.maxFileSize) {
            this.showToast('❌ Fichier trop volumineux. Maximum 5MB.', 'error');
            return;
        }

        this.showToast('⏳ Traitement de l\'image...', 'info');
        this.loadImagePreview(file);
    }

    // 5. Modifiez loadImagePreview() pour initialiser le drag :
loadImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewImg = document.getElementById('previewImg');
        if (previewImg) {
            previewImg.src = e.target.result;
            previewImg.dataset.originalData = e.target.result;
            
            const uploadArea = document.getElementById('uploadArea');
            const imagePreview = document.getElementById('imagePreview');
            
            if (uploadArea) uploadArea.style.display = 'none';
            if (imagePreview) imagePreview.style.display = 'block';
            
            // Réinitialiser les contrôles
            const positionSelect = document.getElementById('positionSelect');
            const sizeSelect = document.getElementById('sizeSelect');
            const zoomSlider = document.getElementById('zoomSlider');
            const opacitySlider = document.getElementById('opacitySlider');
            const zoomValue = document.getElementById('zoomValue');
            const opacityValue = document.getElementById('opacityValue');
            const positionXSlider = document.getElementById('positionXSlider');
            const positionYSlider = document.getElementById('positionYSlider');
            const positionXValue = document.getElementById('positionXValue');
            const positionYValue = document.getElementById('positionYValue');
            
            if (positionSelect) positionSelect.value = 'center';
            if (sizeSelect) sizeSelect.value = 'cover';
            if (zoomSlider) zoomSlider.value = '100';
            if (opacitySlider) opacitySlider.value = '100';
            if (zoomValue) zoomValue.textContent = '100%';
            if (opacityValue) opacityValue.textContent = '100%';
            if (positionXSlider) positionXSlider.value = '50';
            if (positionYSlider) positionYSlider.value = '50';
            if (positionXValue) positionXValue.textContent = '50%';
            if (positionYValue) positionYValue.textContent = '50%';
            
            // Réinitialiser le drag après un délai
            setTimeout(() => {
                this.setupImageDrag();
            }, 100);
            
            this.updatePreview();
        }
    };
    reader.readAsDataURL(file);
}

    // 6. Modifiez updatePreview() pour gérer la position personnalisée :
updatePreview() {
    const previewImg = document.getElementById('previewImg');
    const positionSelect = document.getElementById('positionSelect');
    const sizeSelect = document.getElementById('sizeSelect');
    const zoomSlider = document.getElementById('zoomSlider');
    const opacitySlider = document.getElementById('opacitySlider');
    const positionXSlider = document.getElementById('positionXSlider');
    const positionYSlider = document.getElementById('positionYSlider');

    if (!previewImg) return;

    const position = positionSelect ? positionSelect.value : 'center';
    const size = sizeSelect ? sizeSelect.value : 'cover';
    const zoom = zoomSlider ? zoomSlider.value / 100 : 1;
    const opacity = opacitySlider ? opacitySlider.value / 100 : 1;

    // Gérer la position
    let backgroundPosition = 'center';

    if (position === 'custom') {
        const posX = positionXSlider ? positionXSlider.value : 50;
        const posY = positionYSlider ? positionYSlider.value : 50;
        backgroundPosition = `${posX}% ${posY}%`;
    } else {
        switch (position) {
            case 'top':
                backgroundPosition = 'center top';
                break;
            case 'bottom':
                backgroundPosition = 'center bottom';
                break;
            case 'left':
                backgroundPosition = 'left center';
                break;
            case 'right':
                backgroundPosition = 'right center';
                break;
            default:
                backgroundPosition = 'center';
        }
    }

    previewImg.style.opacity = opacity;
    previewImg.style.transform = `scale(${zoom})`;
    previewImg.style.objectFit = size === 'stretch' ? 'fill' : size;
    previewImg.style.objectPosition = backgroundPosition.replace('center ', '');
}

    // 7. Modifiez confirmUpload() pour sauvegarder les coordonnées :
confirmUpload() {
    const previewImg = document.getElementById('previewImg');
    if (!previewImg) {
        this.showToast('❌ Erreur lors du traitement de l\'image', 'error');
        return;
    }

    const imageData = previewImg.dataset.originalData;
    if (!imageData) {
        this.showToast('❌ Erreur lors du traitement de l\'image', 'error');
        return;
    }

    // Récupérer les paramètres
    const positionSelect = document.getElementById('positionSelect');
    const sizeSelect = document.getElementById('sizeSelect');
    const zoomSlider = document.getElementById('zoomSlider');
    const opacitySlider = document.getElementById('opacitySlider');
    const positionXSlider = document.getElementById('positionXSlider');
    const positionYSlider = document.getElementById('positionYSlider');

    const position = positionSelect ? positionSelect.value : 'center';
    const size = sizeSelect ? sizeSelect.value : 'cover';
    const zoom = zoomSlider ? zoomSlider.value : '100';
    const opacity = opacitySlider ? opacitySlider.value : '100';
    const positionX = positionXSlider ? positionXSlider.value : '50';
    const positionY = positionYSlider ? positionYSlider.value : '50';

    // Créer un ID unique pour l'image
    const backgroundId = 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Sauvegarder avec les paramètres
    const newBackground = {
        id: backgroundId,
        data: imageData,
        position: position,
        size: size,
        zoom: zoom,
        opacity: opacity,
        positionX: positionX,
        positionY: positionY,
        name: `Fond personnalisé ${this.customBackgrounds.length + 1}`,
        createdAt: new Date().toISOString()
    };

    this.customBackgrounds.push(newBackground);
    localStorage.setItem('customBackgrounds', JSON.stringify(this.customBackgrounds));

    // Appliquer immédiatement
    this.applyCustomBackground(backgroundId);
    
    this.showToast('✅ Fond d\'écran ajouté et appliqué !', 'success');
    this.updateCustomBackgroundsList();
    this.resetUploadArea();
}

    cancelUpload() {
        this.resetUploadArea();
    }

    resetUploadArea() {
        const uploadArea = document.getElementById('uploadArea');
        const imagePreview = document.getElementById('imagePreview');
        const fileInput = document.getElementById('backgroundFileInput');

        if (uploadArea) uploadArea.style.display = 'block';
        if (imagePreview) imagePreview.style.display = 'none';
        if (fileInput) fileInput.value = '';
    }

    // 8. Modifiez applyCustomBackground() pour utiliser les coordonnées :
applyCustomBackground(backgroundId) {
    const background = this.customBackgrounds.find(bg => bg.id === backgroundId);
    if (!background) return;

    // Supprimer tous les anciens styles de fond
    document.body.classList.remove('has-bg-image');
    document.body.className = document.body.className
        .split(' ')
        .filter(cls => !cls.startsWith('bg-'))
        .join(' ');
    
    // Supprimer les anciens styles personnalisés
    const existingStyle = document.getElementById('customBackgroundStyle');
    if (existingStyle) {
        existingStyle.remove();
    }

    // Créer le nouveau style CSS avec toutes les options
    let backgroundSize = 'cover';
    let backgroundPosition = 'center';
    const zoom = background.zoom ? background.zoom / 100 : 1;

    switch (background.size) {
        case 'contain':
            backgroundSize = zoom !== 1 ? `${zoom * 100}%` : 'contain';
            break;
        case 'stretch':
            backgroundSize = zoom !== 1 ? `${zoom * 100}% ${zoom * 100}%` : '100% 100%';
            break;
        default:
            backgroundSize = zoom !== 1 ? `${zoom * 100}%` : 'cover';
    }

    // Gérer la position
    if (background.position === 'custom' && background.positionX && background.positionY) {
        backgroundPosition = `${background.positionX}% ${background.positionY}%`;
    } else {
        switch (background.position) {
            case 'top':
                backgroundPosition = 'center top';
                break;
            case 'bottom':
                backgroundPosition = 'center bottom';
                break;
            case 'left':
                backgroundPosition = 'left center';
                break;
            case 'right':
                backgroundPosition = 'right center';
                break;
            default:
                backgroundPosition = 'center';
        }
    }

    const style = document.createElement('style');
    style.id = 'customBackgroundStyle';
    style.textContent = `
        body.custom-background::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url("${background.data}");
            background-size: ${backgroundSize};
            background-position: ${backgroundPosition};
            background-repeat: no-repeat;
            background-attachment: fixed;
            opacity: ${background.opacity / 100};
            z-index: -1;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);

    // Appliquer la classe
    document.body.classList.add('custom-background');
    
    // Sauvegarder
    this.currentCustomBackground = backgroundId;
    localStorage.setItem('currentCustomBackground', backgroundId);
    localStorage.setItem('selectedBackground', 'custom');
    
    console.log('✅ Fond d\'écran personnalisé appliqué:', backgroundId);
}

    removeCustomBackground(backgroundId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce fond d\'écran ?')) {
            // Supprimer de la liste
            this.customBackgrounds = this.customBackgrounds.filter(bg => bg.id !== backgroundId);
            localStorage.setItem('customBackgrounds', JSON.stringify(this.customBackgrounds));

            // Si c'était le fond actuel, revenir au fond par défaut
            if (this.currentCustomBackground === backgroundId) {
                this.resetToDefaultBackground();
            }

            this.updateCustomBackgroundsList();
            this.showToast('🗑️ Fond d\'écran supprimé', 'info');
        }
    }

    updateCustomBackgroundsList() {
        const container = document.getElementById('customBackgroundsList');
        if (!container) return;
        
        if (this.customBackgrounds.length === 0) {
            container.innerHTML = '<p class="no-custom-bg">Aucun fond personnalisé. Ajoutez-en un ci-dessus !</p>';
            return;
        }

        container.innerHTML = this.customBackgrounds.map(bg => `
            <div class="custom-bg-item ${this.currentCustomBackground === bg.id ? 'active' : ''}">
                <div class="bg-preview" style="background-image: url(${bg.data}); background-size: cover; background-position: center;"></div>
                <div class="bg-info">
                    <span class="bg-name">${bg.name}</span>
                    <div class="bg-actions">
                        <button onclick="customBackgroundManager.applyCustomBackground('${bg.id}')" class="btn-use">
                            ${this.currentCustomBackground === bg.id ? '✅ Actuel' : '🎨 Utiliser'}
                        </button>
                        <button onclick="customBackgroundManager.removeCustomBackground('${bg.id}')" class="btn-delete">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    loadCurrentBackground() {
        if (this.currentCustomBackground) {
            this.applyCustomBackground(this.currentCustomBackground);
        }
    }

    resetToDefaultBackground() {
        // Supprimer les styles personnalisés
        const existingStyle = document.getElementById('customBackgroundStyle');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        document.body.classList.remove('custom-background');
        this.currentCustomBackground = null;
        localStorage.removeItem('currentCustomBackground');
        localStorage.setItem('selectedBackground', 'none');
        
        // Notifier le sélecteur de fond principal
        if (window.backgroundSelector) {
            window.backgroundSelector.resetBackground();
        }
    }

    showToast(message, type = 'info') {
        // Supprimer les toasts existants
        const existingToast = document.querySelector('.custom-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `custom-toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
} // ← ACCOLADE DE FERMETURE DE LA CLASSE

// CSS dynamique pour les styles
const customBackgroundStyles = `
<style id="customBackgroundStyles">
/* Modal de fond d'écran personnalisé - Design adaptatif aux thèmes */
.background-upload-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10000;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(5px);
}

.background-upload-modal .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
}

.background-upload-modal .modal-container {
    position: relative;
    z-index: 2;
    width: 95%;
    max-width: 900px;
    height: 90vh;
    margin: 2.5vh auto;
    background: var(--card-bg, white);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    animation: modalSlideIn 0.3s ease;
}

/* ADAPTATION AUX THÈMES */
[data-theme="dark"] .background-upload-modal .modal-container {
    background: var(--card-bg, #2d2d2d);
    color: var(--text-color, white);
}

[data-theme="light"] .background-upload-modal .modal-container {
    background: var(--card-bg, white);
    color: var(--text-color, #333);
}

[data-theme="rouge"] .background-upload-modal .modal-container {
    background: var(--card-bg, #fafafa);
    color: var(--text-color, #333);
}

[data-theme="bleuciel"] .background-upload-modal .modal-container {
    background: var(--card-bg, #f8fdff);
    color: var(--text-color, #333);
}

@keyframes modalSlideIn {
    from { transform: translateY(30px) scale(0.95); opacity: 0; }
    to { transform: translateY(0) scale(1); opacity: 1; }
}

.background-upload-modal .modal-header {
    background: linear-gradient(135deg, var(--primary-color, #7c4dff), var(--accent-color, #9c27b0));
    color: white;
    padding: 15px 25px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    flex-shrink: 0;
}

/* Adaptation des en-têtes selon les thèmes */
[data-theme="dark"] .background-upload-modal .modal-header {
    background: linear-gradient(135deg, #1a237e, #283593);
}

[data-theme="light"] .background-upload-modal .modal-header {
    background: linear-gradient(135deg, #7E57C2, #9575CD);
}

[data-theme="rouge"] .background-upload-modal .modal-header {
    background: linear-gradient(135deg, #bc3a34, #a32f2a);
}

[data-theme="bleuciel"] .background-upload-modal .modal-header {
    background: linear-gradient(135deg, #4FB3E8, #3F97C7);
}

.background-upload-modal .modal-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
}

.background-upload-modal .modal-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    background: var(--background-color, #f8f9fa);
}

/* Adaptation du contenu selon les thèmes */
[data-theme="dark"] .background-upload-modal .modal-content {
    background: var(--background-color, #1e1e1e);
}

[data-theme="light"] .background-upload-modal .modal-content {
    background: var(--background-color, #f8f9fa);
}

[data-theme="rouge"] .background-upload-modal .modal-content {
    background: var(--background-color, #fafafa);
}

[data-theme="bleuciel"] .background-upload-modal .modal-content {
    background: var(--background-color, #f8fdff);
}

.upload-area {
    border: 3px dashed var(--primary-color, #7c4dff);
    border-radius: 12px;
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, rgba(124, 77, 255, 0.05), rgba(156, 39, 176, 0.05));
    margin-bottom: 20px;
}

.upload-area:hover, .upload-area.drag-over {
    border-color: var(--accent-color, #9c27b0);
    background: linear-gradient(135deg, rgba(124, 77, 255, 0.1), rgba(156, 39, 176, 0.1));
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(124, 77, 255, 0.2);
}

.upload-icon {
    font-size: 48px;
    margin-bottom: 15px;
}

.upload-area p {
    font-size: 16px;
    font-weight: 500;
    margin: 8px 0;
    color: var(--text-color, #333);
}

.file-requirements {
    font-size: 13px;
    color: var(--text-muted, #666);
    margin-top: 10px;
}

.image-preview {
    background: var(--card-bg, white);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    margin-bottom: 20px;
}

/* Adaptation de la prévisualisation selon les thèmes */
[data-theme="dark"] .image-preview {
    background: var(--card-bg, #2d2d2d);
}

.preview-container {
    position: relative;
    max-width: 100%;
    margin-bottom: 20px;
    border-radius: 8px;
    overflow: hidden;
}

.preview-container img {
    width: 100%;
    max-height: 300px;
    object-fit: cover;
    border-radius: 8px;
    transition: all 0.3s ease;
}

.image-controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
    padding: 15px;
    background: var(--background-color, #f8f9fa);
    border-radius: 8px;
}

/* Adaptation des contrôles selon les thèmes */
[data-theme="dark"] .image-controls {
    background: var(--background-color, #1e1e1e);
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.control-group label {
    font-weight: 600;
    color: var(--text-color, #333);
    font-size: 14px;
}

.control-group select,
.control-group input[type="range"] {
    padding: 8px 12px;
    border: 2px solid var(--border-color, #ddd);
    border-radius: 6px;
    background: var(--card-bg, white);
    color: var(--text-color, #333);
    font-size: 14px;
    transition: border-color 0.3s ease;
}

/* Adaptation des champs selon les thèmes */
[data-theme="dark"] .control-group select,
[data-theme="dark"] .control-group input[type="range"] {
    background: var(--card-bg, #2d2d2d);
    color: var(--text-color, white);
    border-color: var(--border-color, #555);
}

.control-group select:focus,
.control-group input[type="range"]:focus {
    outline: none;
    border-color: var(--primary-color, #7c4dff);
}

.preview-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
    padding: 12px 24px;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    font-weight: 600;
    font-size: 15px;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 160px;
    justify-content: center;
}

.btn-primary {
    background: linear-gradient(135deg, #4CAF50, #45a049);
    color: white;
    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
}

.btn-secondary {
    background: linear-gradient(135deg, #f44336, #d32f2f);
    color: white;
    box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
}

.btn-secondary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4);
}

.custom-backgrounds-section {
    background: var(--card-bg, white);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

/* Adaptation de la section selon les thèmes */
[data-theme="dark"] .custom-backgrounds-section {
    background: var(--card-bg, #2d2d2d);
}

.custom-backgrounds-section h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: var(--primary-color, #7c4dff);
    font-size: 18px;
    font-weight: 600;
}

.custom-backgrounds-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
}

.custom-bg-item {
    border: 2px solid var(--border-color, #ddd);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
    background: var(--card-bg, white);
}

/* Adaptation des éléments selon les thèmes */
[data-theme="dark"] .custom-bg-item {
    background: var(--card-bg, #2d2d2d);
    border-color: var(--border-color, #555);
}

.custom-bg-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.custom-bg-item.active {
    border-color: var(--primary-color, #7c4dff);
    box-shadow: 0 0 20px rgba(124, 77, 255, 0.3);
}

.bg-preview {
    height: 120px;
    background-size: cover;
    background-position: center;
}

.bg-info {
    padding: 12px;
}

.bg-name {
    font-weight: 600;
    color: var(--text-color, #333);
    display: block;
    margin-bottom: 10px;
}

.bg-actions {
    display: flex;
    gap: 8px;
}

.btn-use, .btn-delete {
    flex: 1;
    padding: 8px 12px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.3s ease;
}

.btn-use {
    background: var(--primary-color, #7c4dff);
    color: white;
}

.btn-use:hover {
    background: var(--accent-color, #9c27b0);
}

.btn-delete {
    background: #f44336;
    color: white;
}

.btn-delete:hover {
    background: #d32f2f;
}

.close-modal-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    font-size: 18px;
}

.close-modal-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
}

.no-custom-bg {
    text-align: center;
    color: var(--text-muted, #666);
    font-style: italic;
    padding: 40px 20px;
    background: var(--background-color, #f8f9fa);
    border-radius: 8px;
}

/* Adaptation selon les thèmes */
[data-theme="dark"] .no-custom-bg {
    background: var(--background-color, #1e1e1e);
    color: var(--text-muted, #888);
}

/* RESPONSIVE - SUPPRESSION DE L'ESPACE BLANC */
@media (max-width: 768px) {
    .background-upload-modal .modal-container {
        width: 100%;
        height: 100vh;
        margin: 0;
        border-radius: 0;
    }
    
    .background-upload-modal .modal-header {
        padding: 12px 20px;
    }
    
    .background-upload-modal .modal-header h2 {
        font-size: 18px;
    }
    
    .background-upload-modal .modal-content {
        padding: 15px;
    }
    
    .upload-area {
        padding: 30px 15px;
    }
    
    .upload-icon {
        font-size: 40px;
    }
    
    .image-controls {
        grid-template-columns: 1fr;
        gap: 10px;
    }
    
    .preview-actions {
        flex-direction: column;
    }
    
    .btn-primary, .btn-secondary {
        width: 100%;
    }
    
    .custom-backgrounds-grid {
        grid-template-columns: 1fr;
    }
}

/* Animations */
@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}

/* Hint de glisser sur l'image */
.drag-hint {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 5px 10px;
    border-radius: 15px;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 10;
}

.preview-container:hover .drag-hint {
    opacity: 1;
}

/* Contrôles de position personnalisée */
.position-controls {
    grid-column: 1 / -1;
    background: rgba(124, 77, 255, 0.1);
    padding: 15px;
    border-radius: 8px;
    border: 2px solid var(--primary-color, #7c4dff);
}

.position-controls label {
    color: var(--primary-color, #7c4dff);
    font-weight: 700;
}

/* Bouton de réinitialisation */
.btn-reset {
    padding: 12px 20px;
    border: 2px solid var(--primary-color, #7c4dff);
    border-radius: 25px;
    background: transparent;
    color: var(--primary-color, #7c4dff);
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.btn-reset:hover {
    background: var(--primary-color, #7c4dff);
    color: white;
    transform: translateY(-2px);
}

/* Container de prévisualisation amélioré */
.preview-container {
    position: relative;
    max-width: 100%;
    margin-bottom: 20px;
    border-radius: 8px;
    overflow: hidden;
    border: 3px solid var(--primary-color, #7c4dff);
    box-shadow: 0 4px 15px rgba(124, 77, 255, 0.2);
}

.preview-container img {
    width: 100%;
    max-height: 300px;
    object-fit: cover;
    border-radius: 8px;
    transition: all 0.3s ease;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

/* Animation lors du glisser */
.preview-container.dragging {
    box-shadow: 0 8px 25px rgba(124, 77, 255, 0.4);
}

.preview-container.dragging img {
    transition: none;
}

/* Adaptation responsive pour les contrôles */
@media (max-width: 768px) {
    .drag-hint {
        font-size: 11px;
        padding: 4px 8px;
        top: 5px;
        right: 5px;
    }
    
    .position-controls {
        padding: 10px;
    }
    
    .btn-reset {
        width: 100%;
        justify-content: center;
        margin-bottom: 10px;
    }
    
    .preview-actions {
        flex-direction: column;
        gap: 10px;
    }
}

/* Curseur personnalisé pour le glisser */
.preview-container[style*="cursor: grab"] {
    cursor: grab !important;
}

.preview-container[style*="cursor: grabbing"] {
    cursor: grabbing !important;
}

/* Adaptation aux thèmes pour les nouveaux éléments */
[data-theme="dark"] .position-controls {
    background: rgba(26, 35, 126, 0.2);
    border-color: var(--primary-color, #1a237e);
}

[data-theme="rouge"] .position-controls {
    background: rgba(188, 58, 52, 0.2);
    border-color: var(--primary-color, #bc3a34);
}

[data-theme="bleuciel"] .position-controls {
    background: rgba(79, 179, 232, 0.2);
    border-color: var(--primary-color, #4fb3e8);
}

</style>
`;

// Injecter les styles
document.head.insertAdjacentHTML('beforeend', customBackgroundStyles);

// Initialiser automatiquement si le DOM est prêt
function initCustomBackgroundManager() {
    if (!window.customBackgroundManager) {
        console.log('🎨 Initialisation du CustomBackgroundManager');
        window.customBackgroundManager = new CustomBackgroundManager();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCustomBackgroundManager);
} else {
    initCustomBackgroundManager();
}

// Sécurité supplémentaire
window.addEventListener('load', () => {
    setTimeout(initCustomBackgroundManager, 1000);
});

// Intégration avec le système de thème existant
setTimeout(() => {
    if (window.backgroundSelector && !window.backgroundSelector.addCustomOption) {
        window.backgroundSelector.addCustomOption = function() {
            if (window.customBackgroundManager) {
                window.customBackgroundManager.openModal();
            }
        };
    }
}, 2000);