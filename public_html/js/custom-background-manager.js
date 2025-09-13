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
                            <p class="upload-info">ou choisissez une option ci-dessous</p>
                            <p class="file-requirements">
                                Formats acceptés : JPG, PNG, WEBP<br>
                                Taille max : 5MB
                            </p>
                            <input type="file" id="backgroundFileInput" accept="image/*" style="display: none;">
                            
                            <!-- NOUVEAUX BOUTONS D'UPLOAD -->
                            <div class="upload-options">
                                <button class="upload-btn file-btn" id="chooseFileBtn">
                                    <span class="btn-icon">📂</span>
                                    <span>Choisir un fichier</span>
                                </button>
                                <button class="upload-btn camera-btn" id="takePictureBtn">
                                    <span class="btn-icon">📷</span>
                                    <span>Prendre une photo</span>
                                </button>
                            </div>
                        </div>
                        
                        <!-- CAMÉRA SECTION -->
                        <div id="cameraSection" class="camera-section" style="display: none;">
                            <div class="camera-container">
                                <video id="cameraVideo" autoplay playsinline></video>
                                <canvas id="cameraCanvas" style="display: none;"></canvas>
                                <div class="camera-controls">
    <button id="switchCameraBtn" class="camera-control-btn">
        <span class="camera-icon">🔄</span>
        <span class="camera-text">Basculer</span>
    </button>
    <button id="captureBtn" class="capture-btn">
        <span class="capture-ring"></span>
        <span class="capture-inner"></span>
    </button>
    <button id="closeCameraBtn" class="camera-control-btn">
        <span class="camera-icon">❌</span>
        <span class="camera-text">Fermer</span>
    </button>
	</div>
                            </div>
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
        uploadArea.addEventListener('click', (e) => {
    // Ne pas ouvrir l'input si on clique sur un bouton à l'intérieur
    if (!e.target.closest('.upload-btn')) {
        fileInput.click();
    }
});
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
		const chooseFileBtn = document.getElementById('chooseFileBtn');
		const takePictureBtn = document.getElementById('takePictureBtn');
		const switchCameraBtn = document.getElementById('switchCameraBtn');
		const captureBtn = document.getElementById('captureBtn');
		const closeCameraBtn = document.getElementById('closeCameraBtn');

    if (chooseFileBtn) {
    chooseFileBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Empêche la propagation vers l'uploadArea
        fileInput.click();
    });
}

    if (takePictureBtn) {
        takePictureBtn.addEventListener('click', () => this.openCamera());
    }

    if (switchCameraBtn) {
        switchCameraBtn.addEventListener('click', () => this.switchCamera());
    }

    if (captureBtn) {
        captureBtn.addEventListener('click', () => this.capturePhoto());
    }

    if (closeCameraBtn) {
        closeCameraBtn.addEventListener('click', () => this.closeCamera());
    }

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
            previewContainer.classList.add('dragging');
            
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
            
            // CORRECTION : Appliquer visuellement la nouvelle position immédiatement
            const zoom = document.getElementById('zoomSlider') ? document.getElementById('zoomSlider').value / 100 : 1;
            const opacity = document.getElementById('opacitySlider') ? document.getElementById('opacitySlider').value / 100 : 1;
            const sizeSelect = document.getElementById('sizeSelect');
            const size = sizeSelect ? sizeSelect.value : 'cover';
            
            // Appliquer directement les styles pour un aperçu instantané
            previewImg.style.objectPosition = `${Math.round(newX)}% ${Math.round(newY)}%`;
            previewImg.style.transform = `scale(${zoom})`;
            previewImg.style.opacity = opacity;
            previewImg.style.objectFit = size === 'stretch' ? 'fill' : size;
        }

        function endDrag() {
            isDragging = false;
            previewContainer.style.cursor = 'grab';
            previewContainer.classList.remove('dragging');
        }

        // Style du curseur
        previewContainer.style.cursor = 'grab';
        previewContainer.style.userSelect = 'none';
        
        // Empêcher la sélection du texte lors du glisser
        previewContainer.addEventListener('selectstart', (e) => e.preventDefault());
        previewContainer.addEventListener('dragstart', (e) => e.preventDefault());
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
    // Fermer la caméra si elle est active
    this.closeCamera();
    
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
    let objectPosition = 'center';

    if (position === 'custom') {
        const posX = positionXSlider ? positionXSlider.value : 50;
        const posY = positionYSlider ? positionYSlider.value : 50;
        objectPosition = `${posX}% ${posY}%`;
    } else {
        switch (position) {
            case 'top':
                objectPosition = 'center top';
                break;
            case 'bottom':
                objectPosition = 'center bottom';
                break;
            case 'left':
                objectPosition = 'left center';
                break;
            case 'right':
                objectPosition = 'right center';
                break;
            default:
                objectPosition = 'center';
        }
    }

    // Appliquer tous les styles
    previewImg.style.opacity = opacity;
    previewImg.style.transform = `scale(${zoom})`;
    previewImg.style.objectFit = size === 'stretch' ? 'fill' : size;
    previewImg.style.objectPosition = objectPosition;
    
    // Ajouter une transition fluide quand on n'est pas en train de glisser
    if (!previewImg.closest('.preview-container').classList.contains('dragging')) {
        previewImg.style.transition = 'all 0.3s ease';
    } else {
        previewImg.style.transition = 'none';
    }
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
	
	async openCamera() {
    this.currentFacingMode = 'environment'; // Caméra arrière par défaut
    this.stream = null;
    
    try {
        console.log('🎥 Ouverture de la caméra...');
        this.showToast('📷 Ouverture de la caméra...', 'info');
        
        // Cacher la zone d'upload et afficher la caméra
        document.getElementById('uploadArea').style.display = 'none';
        document.getElementById('cameraSection').style.display = 'block';
        
        await this.startCamera();
        
    } catch (error) {
        console.error('Erreur d\'accès à la caméra:', error);
        this.showToast('❌ Impossible d\'accéder à la caméra', 'error');
        this.closeCamera();
    }
}

async startCamera() {
    const video = document.getElementById('cameraVideo');
    
    // Arrêter le stream précédent s'il existe
    if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
    }
    
    try {
        const constraints = {
            video: {
                facingMode: this.currentFacingMode,
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        };
        
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = this.stream;
        
        console.log('✅ Caméra démarrée');
        this.showToast('✅ Caméra prête !', 'success');
        
    } catch (error) {
        console.error('Erreur démarrage caméra:', error);
        throw error;
    }
}

async switchCamera() {
    if (!this.stream) return;
    
    try {
        this.showToast('🔄 Basculement de caméra...', 'info');
        
        // Alterner entre caméra avant et arrière
        this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
        
        await this.startCamera();
        
        const cameraName = this.currentFacingMode === 'environment' ? 'arrière' : 'avant';
        this.showToast(`📱 Caméra ${cameraName} activée`, 'success');
        
    } catch (error) {
        console.error('Erreur basculement caméra:', error);
        this.showToast('⚠️ Basculement impossible', 'error');
    }
}

capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const ctx = canvas.getContext('2d');
    
    // Définir les dimensions du canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Capturer l'image
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convertir en data URL
    const dataURL = canvas.toDataURL('image/jpeg', 0.9);
    
    // Animation de flash
    this.showCameraFlash();
    
    // Traiter l'image capturée
    this.processCapturedImage(dataURL);
    
    this.showToast('📸 Photo capturée !', 'success');
}

showCameraFlash() {
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: white;
        z-index: 11000;
        opacity: 0.8;
        pointer-events: none;
        animation: cameraFlash 0.3s ease;
    `;
    
    document.body.appendChild(flash);
    
    setTimeout(() => {
        flash.remove();
    }, 300);
}

processCapturedImage(dataURL) {
    // Fermer la caméra
    this.closeCamera();
    
    // Afficher l'aperçu avec l'image capturée
    const previewImg = document.getElementById('previewImg');
    if (previewImg) {
        previewImg.src = dataURL;
        previewImg.dataset.originalData = dataURL;
        
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview) {
            imagePreview.style.display = 'block';
        }
        
        // Réinitialiser les contrôles
        this.resetImageControls();
        
        // Configurer le drag après un délai
        setTimeout(() => {
            this.setupImageDrag();
        }, 100);
        
        this.updatePreview();
    }
}

resetImageControls() {
    const controls = {
        positionSelect: 'center',
        sizeSelect: 'cover',
        zoomSlider: '100',
        opacitySlider: '100',
        positionXSlider: '50',
        positionYSlider: '50'
    };
    
    Object.entries(controls).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
    });
    
    // Mettre à jour les labels
    const zoomValue = document.getElementById('zoomValue');
    const opacityValue = document.getElementById('opacityValue');
    const positionXValue = document.getElementById('positionXValue');
    const positionYValue = document.getElementById('positionYValue');
    
    if (zoomValue) zoomValue.textContent = '100%';
    if (opacityValue) opacityValue.textContent = '100%';
    if (positionXValue) positionXValue.textContent = '50%';
    if (positionYValue) positionYValue.textContent = '50%';
}

closeCamera() {
    console.log('🔒 Fermeture de la caméra');
    
    // Arrêter le stream vidéo
    if (this.stream) {
        this.stream.getTracks().forEach(track => {
            track.stop();
            console.log('📷 Track arrêté:', track.kind);
        });
        this.stream = null;
    }
    
    // Remettre l'interface normale
    const uploadArea = document.getElementById('uploadArea');
    const cameraSection = document.getElementById('cameraSection');
    
    if (uploadArea) uploadArea.style.display = 'block';
    if (cameraSection) cameraSection.style.display = 'none';
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
    overflow: hidden;
    width: 100vw;
    height: 100vh;
}

.background-upload-modal .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    width: 100%;
    height: 100%;
}

/* MODAL CONTAINER - SANS ESPACE BLANC */
.background-upload-modal .modal-container {
    position: relative;
    z-index: 2;
    width: 100vw;
    height: 100vh;
    margin: 0;
    background: var(--card-bg, white);
    border-radius: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: none;
    animation: modalSlideIn 0.3s ease;
    box-sizing: border-box;
}

/* Desktop - Modal centrée SANS espace blanc */
@media (min-width: 769px) {
    .background-upload-modal .modal-container {
        width: 100vw;
        height: 100vh;
        margin: 0;
        border-radius: 0;
        box-shadow: none;
    }
}

/* ADAPTATION PARFAITE AUX THÈMES */
[data-theme="dark"] .background-upload-modal .modal-container {
    background: var(--card-bg, #1a1a1a);
    color: var(--text-color, #ffffff);
}

[data-theme="light"] .background-upload-modal .modal-container {
    background: var(--card-bg, #ffffff);
    color: var(--text-color, #333333);
}

[data-theme="rouge"] .background-upload-modal .modal-container {
    background: var(--card-bg, #fafafa);
    color: var(--text-color, #333333);
}

[data-theme="bleuciel"] .background-upload-modal .modal-container {
    background: var(--card-bg, #f8fdff);
    color: var(--text-color, #333333);
}

/* Animation d'entrée */
@keyframes modalSlideIn {
    from { 
        transform: translateY(100%);
        opacity: 0; 
    }
    to { 
        transform: translateY(0);
        opacity: 1; 
    }
}

@media (min-width: 769px) {
    @keyframes modalSlideIn {
        from { 
            opacity: 0; 
        }
        to { 
            opacity: 1; 
        }
    }
}

/* EN-TÊTE ADAPTATIF */
.background-upload-modal .modal-header {
    background: linear-gradient(135deg, var(--primary-color, #7c4dff), var(--accent-color, #9c27b0));
    color: white;
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    flex-shrink: 0;
    width: 100%;
    box-sizing: border-box;
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

/* CONTENU PRINCIPAL */
.background-upload-modal .modal-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    overflow-x: hidden;
    background: var(--background-color, #f8f9fa);
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    max-width: 100%;
}

/* Desktop - Contenu en 2 colonnes pour éviter l'espace blanc */
@media (min-width: 769px) {
    .background-upload-modal .modal-content {
        flex-direction: row;
        gap: 30px;
        padding: 30px;
    }
    
    .upload-section {
        flex: 1;
        max-width: 60%;
    }
    
    .custom-backgrounds-section {
        flex: 0 0 35%;
        max-width: 35%;
    }
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

/* ZONE D'UPLOAD */
.upload-area {
    border: 3px dashed var(--primary-color, #7c4dff);
    border-radius: 12px;
    padding: 30px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, rgba(124, 77, 255, 0.05), rgba(156, 39, 176, 0.05));
    margin-bottom: 20px;
    width: 100%;
    box-sizing: border-box;
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

/* PRÉVISUALISATION D'IMAGE */
.image-preview {
    background: var(--card-bg, white);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    margin-bottom: 20px;
    width: 100%;
    box-sizing: border-box;
}

[data-theme="dark"] .image-preview {
    background: var(--card-bg, #2d2d2d);
}

/* Container de prévisualisation */
.preview-container {
    position: relative;
    width: 100%;
    margin-bottom: 20px;
    border-radius: 8px;
    overflow: hidden;
    border: 3px solid var(--primary-color, #7c4dff);
    box-shadow: 0 4px 15px rgba(124, 77, 255, 0.2);
    background: #f0f0f0;
    min-height: 250px;
    max-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab !important;
    box-sizing: border-box;
}

.preview-container img {
    width: 100%;
    max-height: 380px;
    object-fit: cover;
    border-radius: 5px;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    transition: all 0.3s ease;
}

/* États du glisser */
.preview-container:hover {
    border-color: var(--accent-color, #9c27b0);
    box-shadow: 0 6px 20px rgba(124, 77, 255, 0.3);
}

.preview-container.dragging {
    border-color: #FFD700 !important;
    box-shadow: 0 8px 25px rgba(255, 215, 0, 0.5) !important;
    background: #fff9e6 !important;
    cursor: grabbing !important;
}

.preview-container.dragging img {
    transition: none !important;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.preview-container:active {
    transform: scale(0.99);
    cursor: grabbing !important;
}

/* Hint de glisser */
.drag-hint {
    position: absolute;
    top: 10px;
    right: 10px;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6));
    color: white;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    opacity: 0;
    transition: all 0.3s ease;
    pointer-events: none;
    z-index: 10;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.preview-container:hover .drag-hint {
    opacity: 1;
    transform: translateY(-2px);
}

.preview-container.dragging .drag-hint {
    opacity: 1;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.9), rgba(255, 193, 7, 0.8));
    color: #333;
    transform: scale(1.1);
}

/* GRILLE DE CONTRÔLES */
.image-controls {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 20px;
    padding: 20px;
    background: var(--background-color, #f8f9fa);
    border-radius: 8px;
    width: 100%;
    box-sizing: border-box;
}

@media (max-width: 768px) {
    .image-controls {
        grid-template-columns: 1fr;
        gap: 15px;
        padding: 15px;
    }
}

[data-theme="dark"] .image-controls {
    background: var(--background-color, #1e1e1e);
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    box-sizing: border-box;
}

.control-group label {
    font-weight: 600;
    color: var(--text-color, #333);
    font-size: 14px;
}

.control-group select,
.control-group input[type="range"] {
    padding: 10px 12px;
    border: 2px solid var(--border-color, #ddd);
    border-radius: 8px;
    background: var(--card-bg, white);
    color: var(--text-color, #333);
    font-size: 14px;
    transition: border-color 0.3s ease;
    width: 100%;
    box-sizing: border-box;
}

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
    box-shadow: 0 0 0 3px rgba(124, 77, 255, 0.1);
}

/* CONTRÔLES DE POSITION - VERSION VISIBLE */
.position-controls {
    grid-column: 1 / -1;
    background: linear-gradient(135deg, rgba(124, 77, 255, 0.15), rgba(156, 39, 176, 0.1));
    padding: 25px;
    border-radius: 12px;
    border: 3px solid var(--primary-color, #7c4dff);
    margin-top: 15px;
    position: relative;
    overflow: visible;
    width: 100%;
    box-sizing: border-box;
    box-shadow: 0 4px 15px rgba(124, 77, 255, 0.2);
}

.position-controls::before {
    content: '📍 Position personnalisée';
    position: absolute;
    top: -15px;
    left: 25px;
    background: var(--primary-color, #7c4dff);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 3px 10px rgba(124, 77, 255, 0.4);
    z-index: 10;
}

.position-controls label {
    color: var(--primary-color, #7c4dff);
    font-weight: 700;
    font-size: 15px;
    display: block;
    margin-bottom: 8px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.position-controls input[type="range"] {
    width: 100%;
    height: 8px;
    background: linear-gradient(to right, #ddd 0%, var(--primary-color, #7c4dff) 50%, #ddd 100%);
    border-radius: 6px;
    outline: none;
    margin: 8px 0 20px 0;
    box-sizing: border-box;
    border: 2px solid rgba(124, 77, 255, 0.3);
}

.position-controls input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 22px;
    height: 22px;
    background: var(--primary-color, #7c4dff);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 3px 8px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
    border: 3px solid white;
}

.position-controls input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.3);
    box-shadow: 0 5px 15px rgba(124, 77, 255, 0.6);
}

/* Adaptation des contrôles selon les thèmes */
[data-theme="dark"] .position-controls {
    background: linear-gradient(135deg, rgba(26, 35, 126, 0.25), rgba(26, 35, 126, 0.15));
    border-color: var(--primary-color, #1a237e);
}

[data-theme="dark"] .position-controls::before {
    background: var(--primary-color, #1a237e);
}

[data-theme="rouge"] .position-controls {
    background: linear-gradient(135deg, rgba(188, 58, 52, 0.25), rgba(188, 58, 52, 0.15));
    border-color: var(--primary-color, #bc3a34);
}

[data-theme="rouge"] .position-controls::before {
    background: var(--primary-color, #bc3a34);
}

[data-theme="bleuciel"] .position-controls {
    background: linear-gradient(135deg, rgba(79, 179, 232, 0.25), rgba(79, 179, 232, 0.15));
    border-color: var(--primary-color, #4fb3e8);
}

[data-theme="bleuciel"] .position-controls::before {
    background: var(--primary-color, #4fb3e8);
}

/* BOUTONS D'ACTION - VERSION STYLISÉE */
.preview-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
    width: 100%;
    margin-top: 25px;
}

.btn-primary, .btn-secondary, .btn-reset {
    padding: 16px 32px;
    border: none;
    border-radius: 30px;
    cursor: pointer;
    font-weight: 700;
    font-size: 16px;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-width: 180px;
    box-sizing: border-box;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    position: relative;
    overflow: hidden;
}

.btn-primary {
    background: linear-gradient(135deg, #4CAF50, #45a049, #388e3c);
    color: white;
    box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
    border: 2px solid transparent;
}

.btn-primary::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transition: left 0.6s ease;
}

.btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(76, 175, 80, 0.5);
    background: linear-gradient(135deg, #66BB6A, #4CAF50, #43A047);
}

.btn-primary:hover::before {
    left: 100%;
}

.btn-secondary {
    background: linear-gradient(135deg, #f44336, #d32f2f, #c62828);
    color: white;
    box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4);
    border: 2px solid transparent;
}

.btn-secondary::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    transition: left 0.6s ease;
}

.btn-secondary:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(244, 67, 54, 0.5);
    background: linear-gradient(135deg, #EF5350, #f44336, #E53935);
}

.btn-secondary:hover::before {
    left: 100%;
}

.btn-reset {
    border: 3px solid var(--primary-color, #7c4dff);
    background: linear-gradient(135deg, rgba(124, 77, 255, 0.1), rgba(156, 39, 176, 0.05));
    color: var(--primary-color, #7c4dff);
    box-shadow: 0 6px 20px rgba(124, 77, 255, 0.3);
    position: relative;
}

.btn-reset::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(124, 77, 255, 0.2), transparent);
    transition: left 0.6s ease;
}

.btn-reset:hover {
    background: var(--primary-color, #7c4dff);
    color: white;
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(124, 77, 255, 0.5);
}

.btn-reset:hover::before {
    left: 100%;
}

@media (max-width: 768px) {
    .preview-actions {
        flex-direction: column;
        gap: 15px;
    }
    
    .btn-primary, .btn-secondary, .btn-reset {
        width: 100%;
        min-width: auto;
    }
}

/* SECTION DES FONDS PERSONNALISÉS */
.custom-backgrounds-section {
    background: var(--card-bg, white);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    width: 100%;
    box-sizing: border-box;
    margin-top: 20px;
}

@media (min-width: 769px) {
    .custom-backgrounds-section {
        margin-top: 0;
    }
}

[data-theme="dark"] .custom-backgrounds-section {
    background: var(--card-bg, #2d2d2d);
}

.custom-backgrounds-section h3 {
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 18px;
    font-weight: 600;
}

.custom-backgrounds-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 15px;
}

@media (min-width: 769px) {
    .custom-backgrounds-grid {
        grid-template-columns: 1fr;
        gap: 12px;
    }
}

.custom-bg-item {
    border: 2px solid var(--border-color, #ddd);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
    background: var(--card-bg, white);
}

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
    height: 80px;
    background-size: cover;
    background-position: center;
}

.bg-info {
    padding: 10px;
}

.bg-name {
    font-weight: 600;
    color: var(--text-color, #333);
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
}

.bg-actions {
    display: flex;
    gap: 6px;
}

.btn-use, .btn-delete {
    flex: 1;
    padding: 6px 10px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
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
    width: 44px;
    height: 44px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    font-size: 30px;
    font-weight: bold;
}

.close-modal-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
}

.no-custom-bg {
    text-align: center;
    color: var(--text-muted, #666);
    font-style: italic;
    padding: 30px 15px;
    background: var(--background-color, #f8f9fa);
    border-radius: 8px;
    font-size: 14px;
}

[data-theme="dark"] .no-custom-bg {
    background: var(--background-color, #1e1e1e);
    color: var(--text-muted, #888);
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

.btn-primary:active, .btn-secondary:active, .btn-reset:active {
    animation: buttonPulse 0.3s ease;
}

@keyframes buttonPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

/* RESPONSIVE MOBILE */
@media (max-width: 768px) {
    .background-upload-modal .modal-content {
        flex-direction: column;
        padding: 15px;
    }
    
    .upload-section, .custom-backgrounds-section {
        max-width: 100%;
        flex: none;
    }
    
    .preview-container {
        min-height: 200px;
        max-height: 300px;
    }
    
    .preview-container img {
        max-height: 280px;
    }
    
    .position-controls {
        padding: 20px;
    }
    
    .position-controls::before {
        font-size: 12px;
        padding: 6px 12px;
        top: -12px;
        left: 20px;
    }
    
    .drag-hint {
        font-size: 11px;
        padding: 6px 10px;
        top: 5px;
        right: 5px;
    }
}

/* Boutons d'upload dans la zone de glisser-déposer */
.upload-options {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 20px;
    flex-wrap: wrap;
}

.upload-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 20px 25px;
    border: 2px solid var(--primary-color, #7c4dff);
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(124, 77, 255, 0.1), rgba(156, 39, 176, 0.05));
    color: var(--primary-color, #7c4dff);
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
    min-width: 120px;
    position: relative;
    overflow: hidden;
}

.upload-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(124, 77, 255, 0.2), transparent);
    transition: left 0.5s ease;
}

.upload-btn:hover::before {
    left: 100%;
}

.upload-btn:hover {
    background: var(--primary-color, #7c4dff);
    color: white;
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(124, 77, 255, 0.4);
}

.btn-icon {
    font-size: 24px;
}

.camera-btn {
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(67, 160, 71, 0.05));
    border-color: #4CAF50;
    color: #4CAF50;
}

.camera-btn:hover {
    background: #4CAF50;
    color: white;
    box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4);
}

/* Section caméra */
.camera-section {
    background: #000;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.camera-container {
    position: relative;
    width: 100%;
    max-width: 100%;
    background: #000;
}

#cameraVideo {
    width: 100%;
    height: auto;
    max-height: 60vh;
    object-fit: cover;
    border-radius: 12px;
    background: #000;
}

.camera-controls {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 30px;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(10px);
    padding: 15px 25px;
    border-radius: 50px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.camera-control-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: white;
    width: 70px;
    height: 70px;
    border-radius: 15px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 600;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    padding: 8px 4px;
}

.camera-icon {
    font-size: 20px;
    line-height: 1;
}

.camera-text {
    font-size: 10px !important;
    line-height: 1 !important;
    white-space: nowrap !important;
    text-align: center !important;
    color: white !important;
    font-weight: 600 !important;
}

/* Forcer la couleur blanche sur tous les éléments des contrôles caméra */
.camera-control-btn,
.camera-control-btn *,
.camera-control-btn span,
.camera-control-btn .camera-text,
.camera-controls button,
.camera-controls button *,
.camera-controls button span {
    color: white !important;
}

/* Règle spécifique pour contrer styles.css */
.background-upload-modal .camera-controls .camera-control-btn,
.background-upload-modal .camera-controls .camera-control-btn *,
.background-upload-modal .camera-controls button,
.background-upload-modal .camera-controls button * {
    color: white !important;
}


.camera-control-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
    box-shadow: 0 4px 15px rgba(255, 255, 255, 0.3);
}

/* Bouton de capture stylisé */
.capture-btn {
    background: transparent;
    border: none;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    cursor: pointer;
    position: relative;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.capture-ring {
    position: absolute;
    width: 70px;
    height: 70px;
    border: 4px solid white;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.capture-inner {
    width: 50px;
    height: 50px;
    background: white;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.capture-btn:hover .capture-ring {
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
}

.capture-btn:hover .capture-inner {
    transform: scale(0.8);
}

.capture-btn:active {
    transform: scale(0.95);
}

.capture-btn:active .capture-inner {
    background: #ff4444;
}

/* Animation de flash */
@keyframes cameraFlash {
    0% { opacity: 0; }
    50% { opacity: 0.8; }
    100% { opacity: 0; }
}

/* Responsive mobile pour la caméra */
@media (max-width: 768px) {
    .upload-options {
        flex-direction: column;
        gap: 12px;
    }
    
    .upload-btn {
        width: 100%;
        flex-direction: row;
        justify-content: center;
        padding: 15px 20px;
        min-width: auto;
    }
    
    .btn-icon {
        font-size: 20px;
    }
    
    #cameraVideo {
        max-height: 50vh;
    }
    
    .camera-controls {
        gap: 15px;
        padding: 12px 20px;
        bottom: 15px;
    }
    
    .camera-control-btn {
        width: 60px;
        height: 60px;
        font-size: 9px;
        gap: 2px;
        padding: 6px 2px;
    }
    
    .camera-icon {
        font-size: 16px;
    }
    
    .camera-text {
        font-size: 9px;
    }
    
    .capture-btn {
        width: 70px;
        height: 70px;
    }
    
    .capture-ring {
        width: 60px;
        height: 60px;
    }
    
    .capture-inner {
        width: 40px;
        height: 40px;
    }
}

/* Adaptation aux thèmes */
[data-theme="dark"] .upload-btn {
    background: linear-gradient(135deg, rgba(26, 35, 126, 0.2), rgba(26, 35, 126, 0.1));
    border-color: var(--primary-color, #1a237e);
    color: var(--primary-color, #1a237e);
}

[data-theme="dark"] .upload-btn:hover {
    background: var(--primary-color, #1a237e);
}

[data-theme="rouge"] .upload-btn {
    background: linear-gradient(135deg, rgba(188, 58, 52, 0.2), rgba(188, 58, 52, 0.1));
    border-color: var(--primary-color, #bc3a34);
    color: var(--primary-color, #bc3a34);
}

[data-theme="rouge"] .upload-btn:hover {
    background: var(--primary-color, #bc3a34);
}

[data-theme="bleuciel"] .upload-btn {
    background: linear-gradient(135deg, rgba(79, 179, 232, 0.2), rgba(79, 179, 232, 0.1));
    border-color: var(--primary-color, #4fb3e8);
    color: var(--primary-color, #4fb3e8);
}

[data-theme="bleuciel"] .upload-btn:hover {
    background: var(--primary-color, #4fb3e8);
}

/* Indicateur de caméra active */
/* Indicateur de caméra active */
.camera-container::before {
    content: '🔴 LIVE';
    position: absolute;
    top: 15px;
    right: 15px;
    background: rgba(255, 0, 0, 0.9);
    color: white;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: bold;
    z-index: 100;
    animation: liveBlink 2s infinite;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Assurer que le container a une position relative */
.camera-container {
    position: relative;
    width: 100%;
    max-width: 100%;
    background: #000;
    border-radius: 12px;
    overflow: hidden;
}

/* Responsive pour l'indicateur LIVE */
@media (max-width: 768px) {
    .camera-container::before {
        top: 10px;
        right: 10px;
        padding: 4px 8px;
        font-size: 10px;
        border-radius: 15px;
    }
}

@keyframes liveBlink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.5; }
}

/* Override général pour contrer la règle styles.css dans la modal de fond */
.background-upload-modal .camera-section *,
.background-upload-modal .camera-controls *,
.background-upload-modal .camera-control-btn *,
.background-upload-modal .camera-text {
    color: white !important;
}

/* Spécifiquement pour les spans et textes des boutons caméra */
.camera-controls span.camera-text,
.camera-controls .camera-text,
button.camera-control-btn span.camera-text,
button.camera-control-btn .camera-text {
    color: white !important;
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