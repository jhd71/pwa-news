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
                        <h2>📸 Ajouter un fond d'écran personnalisé</h2>
                        <button id="closeBackgroundModal" class="close-modal-btn">
                            <i class="material-icons">close</i>
                        </button>
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
                                <img id="previewImg" src="" alt="Aperçu">
                                <div class="preview-actions">
                                    <button id="confirmUpload" class="btn-primary">✅ Utiliser cette image</button>
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
        // Bouton pour ouvrir la modal depuis le sélecteur de fond existant
        const bgSelectorBtn = document.getElementById('bgSelectorBtn');
        if (bgSelectorBtn) {
            // Ajouter un bouton "Ajouter fond personnalisé" au menu existant
            const customBgBtn = document.createElement('button');
            customBgBtn.innerHTML = `
                <span class="material-icons">add_photo_alternate</span>
                <span>Fond personnalisé</span>
            `;
            customBgBtn.className = 'menu-link custom-bg-btn';
            customBgBtn.style.cssText = 'display: flex; align-items: center; text-decoration: none; color: white; padding: 12px 30px; background: transparent; border: none; width: 100%; cursor: pointer;';
            
            // Insérer après le bouton fond d'écran existant
            bgSelectorBtn.parentNode.insertAdjacentElement('afterend', customBgBtn);
            
            customBgBtn.addEventListener('click', () => this.openModal());
        }

        // Upload area
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('backgroundFileInput');

        // Click to upload
        uploadArea.addEventListener('click', () => fileInput.click());

        // Drag and drop
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

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        // Modal controls
        document.getElementById('closeBackgroundModal').addEventListener('click', () => this.closeModal());
        document.getElementById('confirmUpload').addEventListener('click', () => this.confirmUpload());
        document.getElementById('cancelUpload').addEventListener('click', () => this.cancelUpload());

        // Close modal on overlay click
        document.querySelector('#backgroundUploadModal .modal-overlay').addEventListener('click', () => this.closeModal());
    }

    openModal() {
        const modal = document.getElementById('backgroundUploadModal');
        modal.style.display = 'block';
        document.body.classList.add('modal-open');
        this.updateCustomBackgroundsList();
    }

    closeModal() {
        const modal = document.getElementById('backgroundUploadModal');
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        this.resetUploadArea();
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

        // Redimensionner et optimiser l'image
        this.processImage(file).then(processedImageData => {
            const previewImg = document.getElementById('previewImg');
            previewImg.src = processedImageData;
            previewImg.dataset.fileData = processedImageData;
            
            document.getElementById('uploadArea').style.display = 'none';
            document.getElementById('imagePreview').style.display = 'block';
            this.showImageEffectControls();
        }).catch(error => {
            console.error('Erreur traitement image:', error);
            this.showToast('❌ Erreur lors du traitement de l\'image', 'error');
        });
    }

    async processImage(file) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculer les dimensions optimales
                const maxWidth = 1920;
                const maxHeight = 1080;
                let { width, height } = img;

                // Redimensionner si nécessaire
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;

                // Dessiner l'image redimensionnée
                ctx.drawImage(img, 0, 0, width, height);

                // Convertir en format optimisé (qualité réduite pour économiser l'espace)
                const processedData = canvas.toDataURL('image/jpeg', 0.8);
                resolve(processedData);
            };

            img.onerror = () => reject('Erreur de chargement de l\'image');
            img.src = URL.createObjectURL(file);
        });
    }

    showImageEffectControls() {
        const effectsHTML = `
            <div class="image-effects-panel">
                <h4>🎨 Effets d'image</h4>
                <div class="effects-grid">
                    <div class="effect-option" data-effect="none">
                        <div class="effect-preview original"></div>
                        <span>Original</span>
                    </div>
                    <div class="effect-option" data-effect="blur">
                        <div class="effect-preview blur"></div>
                        <span>Flou artistique</span>
                    </div>
                    <div class="effect-option" data-effect="darken">
                        <div class="effect-preview darken"></div>
                        <span>Assombri</span>
                    </div>
                    <div class="effect-option" data-effect="sepia">
                        <div class="effect-preview sepia"></div>
                        <span>Sépia vintage</span>
                    </div>
                    <div class="effect-option" data-effect="gradient">
                        <div class="effect-preview gradient"></div>
                        <span>Dégradé overlay</span>
                    </div>
                    <div class="effect-option" data-effect="pattern">
                        <div class="effect-preview pattern"></div>
                        <span>Motif géométrique</span>
                    </div>
                </div>
                <div class="effect-controls">
                    <label>Opacité: <span id="opacityValue">100%</span></label>
                    <input type="range" id="opacitySlider" min="20" max="100" value="100">
                </div>
            </div>
        `;

        const imagePreview = document.getElementById('imagePreview');
        const existingEffects = imagePreview.querySelector('.image-effects-panel');
        if (existingEffects) {
            existingEffects.remove();
        }

        imagePreview.insertAdjacentHTML('beforeend', effectsHTML);
        this.setupEffectControls();
    }

    setupEffectControls() {
        const effectOptions = document.querySelectorAll('.effect-option');
        const opacitySlider = document.getElementById('opacitySlider');
        const opacityValue = document.getElementById('opacityValue');
        const previewImg = document.getElementById('previewImg');

        let selectedEffect = 'none';
        let opacity = 100;

        // Gestion des effets
        effectOptions.forEach(option => {
            option.addEventListener('click', () => {
                effectOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                selectedEffect = option.dataset.effect;
                this.applyImageEffect(previewImg, selectedEffect, opacity);
            });
        });

        // Gestion de l'opacité
        opacitySlider.addEventListener('input', (e) => {
            opacity = parseInt(e.target.value);
            opacityValue.textContent = `${opacity}%`;
            this.applyImageEffect(previewImg, selectedEffect, opacity);
        });

        // Sélectionner l'effet "Original" par défaut
        effectOptions[0].classList.add('selected');
    }

    applyImageEffect(imgElement, effect, opacity) {
        let filter = '';
        let background = '';
        let backgroundBlendMode = 'normal';

        switch (effect) {
            case 'blur':
                filter = 'blur(1px)';
                background = `rgba(0,0,0,${(100-opacity)/200})`;
                backgroundBlendMode = 'overlay';
                break;
            case 'darken':
                background = `rgba(0,0,0,${(100-opacity)/100})`;
                backgroundBlendMode = 'multiply';
                break;
            case 'sepia':
                filter = 'sepia(70%) saturate(0.8)';
                background = `rgba(139,69,19,${(100-opacity)/300})`;
                backgroundBlendMode = 'overlay';
                break;
            case 'gradient':
                background = `linear-gradient(135deg, rgba(74,144,226,${(100-opacity)/200}), rgba(142,68,173,${(100-opacity)/200}))`;
                backgroundBlendMode = 'overlay';
                break;
            case 'pattern':
                background = `
                    radial-gradient(circle at 20% 20%, rgba(120,119,198,${(100-opacity)/300}) 0%, transparent 20%),
                    radial-gradient(circle at 80% 80%, rgba(255,119,198,${(100-opacity)/300}) 0%, transparent 20%),
                    radial-gradient(circle at 40% 40%, rgba(120,219,98,${(100-opacity)/300}) 0%, transparent 20%)
                `;
                break;
            default:
                // Effet original avec opacité ajustable
                background = `rgba(255,255,255,${(100-opacity)/100})`;
                backgroundBlendMode = 'normal';
        }

        imgElement.style.filter = filter;
        imgElement.style.background = background;
        imgElement.style.backgroundBlendMode = backgroundBlendMode;
        imgElement.dataset.effect = effect;
        imgElement.dataset.opacity = opacity;
    }

    confirmUpload() {
        const previewImg = document.getElementById('previewImg');
        const imageData = previewImg.dataset.fileData;
        
        if (!imageData) {
            this.showToast('❌ Erreur lors du traitement de l\'image', 'error');
            return;
        }

        // Récupérer les paramètres d'effet
        const effect = previewImg.dataset.effect || 'none';
        const opacity = previewImg.dataset.opacity || '100';

        // Créer un ID unique pour l'image
        const backgroundId = 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Sauvegarder dans localStorage avec les effets
        const newBackground = {
            id: backgroundId,
            data: imageData,
            effect: effect,
            opacity: opacity,
            name: this.getEffectName(effect),
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

    getEffectName(effect) {
        const effectNames = {
            'none': 'Fond personnalisé',
            'blur': 'Fond flou artistique',
            'darken': 'Fond assombri',
            'sepia': 'Fond sépia vintage',
            'gradient': 'Fond avec dégradé',
            'pattern': 'Fond avec motifs'
        };
        return effectNames[effect] || 'Fond personnalisé';
    }

    cancelUpload() {
        this.resetUploadArea();
    }

    resetUploadArea() {
        document.getElementById('uploadArea').style.display = 'block';
        document.getElementById('imagePreview').style.display = 'none';
        document.getElementById('backgroundFileInput').value = '';
    }

    applyCustomBackground(backgroundId) {
        const background = this.customBackgrounds.find(bg => bg.id === backgroundId);
        if (!background) return;

        // Créer un élément temporaire pour appliquer les effets
        const tempImg = document.createElement('div');
        tempImg.style.backgroundImage = `url(${background.data})`;
        tempImg.style.backgroundSize = 'cover';
        tempImg.style.backgroundPosition = 'center';
        tempImg.style.backgroundRepeat = 'no-repeat';
        tempImg.style.backgroundAttachment = 'fixed';

        // Appliquer les effets sauvegardés
        if (background.effect && background.effect !== 'none') {
            this.applyBackgroundEffect(tempImg, background.effect, background.opacity || 100);
        }

        // Copier les styles vers le body
        const computedStyle = window.getComputedStyle(tempImg);
        document.body.style.backgroundImage = computedStyle.backgroundImage;
        document.body.style.backgroundSize = computedStyle.backgroundSize;
        document.body.style.backgroundPosition = computedStyle.backgroundPosition;
        document.body.style.backgroundRepeat = computedStyle.backgroundRepeat;
        document.body.style.backgroundAttachment = computedStyle.backgroundAttachment;

        // Appliquer les effets au body
        if (background.effect && background.effect !== 'none') {
            this.applyBackgroundEffect(document.body, background.effect, background.opacity || 100);
        } else {
            // Reset des effets
            document.body.style.filter = '';
            document.body.classList.remove('background-effect');
        }

        // Sauvegarder la sélection
        this.currentCustomBackground = backgroundId;
        localStorage.setItem('currentCustomBackground', backgroundId);
        localStorage.setItem('selectedBackground', 'custom');

        // Ajouter une classe pour identifier les fonds personnalisés
        document.body.classList.add('custom-background');
        document.body.classList.remove('default-background');
    }

    applyBackgroundEffect(element, effect, opacity) {
        element.classList.add('background-effect');
        
        switch (effect) {
            case 'blur':
                element.style.filter = 'blur(1px)';
                element.style.setProperty('--bg-overlay', `rgba(0,0,0,${(100-opacity)/200})`);
                break;
            case 'darken':
                element.style.setProperty('--bg-overlay', `rgba(0,0,0,${(100-opacity)/100})`);
                break;
            case 'sepia':
                element.style.filter = 'sepia(70%) saturate(0.8)';
                element.style.setProperty('--bg-overlay', `rgba(139,69,19,${(100-opacity)/300})`);
                break;
            case 'gradient':
                element.style.setProperty('--bg-overlay', 
                    `linear-gradient(135deg, rgba(74,144,226,${(100-opacity)/200}), rgba(142,68,173,${(100-opacity)/200}))`);
                break;
            case 'pattern':
                element.style.setProperty('--bg-overlay', `
                    radial-gradient(circle at 20% 20%, rgba(120,119,198,${(100-opacity)/300}) 0%, transparent 20%),
                    radial-gradient(circle at 80% 80%, rgba(255,119,198,${(100-opacity)/300}) 0%, transparent 20%),
                    radial-gradient(circle at 40% 40%, rgba(120,219,98,${(100-opacity)/300}) 0%, transparent 20%)
                `);
                break;
        }
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
        
        if (this.customBackgrounds.length === 0) {
            container.innerHTML = '<p class="no-custom-bg">Aucun fond personnalisé. Ajoutez-en un ci-dessus !</p>';
            return;
        }

        container.innerHTML = this.customBackgrounds.map(bg => `
            <div class="custom-bg-item ${this.currentCustomBackground === bg.id ? 'active' : ''}">
                <div class="bg-preview" style="background-image: url(${bg.data})"></div>
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
        document.body.style.backgroundImage = '';
        document.body.classList.remove('custom-background');
        document.body.classList.add('default-background');
        this.currentCustomBackground = null;
        localStorage.removeItem('currentCustomBackground');
        localStorage.setItem('selectedBackground', 'default');
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
}

// CSS dynamique pour les styles
const customBackgroundStyles = `
<style id="customBackgroundStyles">
/* Modal de fond d'écran personnalisé */
.background-upload-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.8);
}

.background-upload-modal .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
}

.background-upload-modal .modal-container {
    position: relative;
    z-index: 2;
    width: 90%;
    max-width: 900px;
    height: 90vh;
    margin: 5vh auto;
    background: var(--card-bg, white);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.background-upload-modal .modal-header {
    background: var(--primary-color, #7c4dff);
    color: white;
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.background-upload-modal .modal-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
}

.upload-area {
    border: 3px dashed var(--border-color, #ddd);
    border-radius: 12px;
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: var(--background-color, #f9f9f9);
}

.upload-area:hover, .upload-area.drag-over {
    border-color: var(--primary-color, #7c4dff);
    background: rgba(124, 77, 255, 0.1);
}

.upload-icon {
    font-size: 48px;
    margin-bottom: 15px;
}

.file-requirements {
    font-size: 12px;
    color: var(--text-muted, #666);
    margin-top: 10px;
}

.image-preview {
    text-align: center;
}

.image-preview img {
    max-width: 100%;
    max-height: 300px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
}

.preview-actions {
    margin-top: 15px;
    display: flex;
    gap: 10px;
    justify-content: center;
}

/* Panneau d'effets d'image */
.image-effects-panel {
    margin-top: 20px;
    padding: 20px;
    background: var(--card-bg, #f8f9fa);
    border-radius: 12px;
    border: 1px solid var(--border-color, #e9ecef);
}

.image-effects-panel h4 {
    margin: 0 0 15px 0;
    color: var(--text-color, #333);
    font-size: 18px;
}

.effects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
}

.effect-option {
    text-align: center;
    cursor: pointer;
    padding: 10px;
    border-radius: 8px;
    transition: all 0.3s ease;
    border: 2px solid transparent;
    background: var(--card-bg, white);
}

.effect-option:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.effect-option.selected {
    border-color: var(--primary-color, #7c4dff);
    background: rgba(124, 77, 255, 0.1);
}

.effect-preview {
    width: 80px;
    height: 50px;
    border-radius: 6px;
    margin: 0 auto 8px;
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
    background-size: 400% 400%;
    animation: gradientMove 3s ease infinite;
}

.effect-preview.original {
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
}

.effect-preview.blur {
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
    filter: blur(1px);
    position: relative;
}

.effect-preview.blur::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.2);
    border-radius: 6px;
}

.effect-preview.darken {
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
    position: relative;
}

.effect-preview.darken::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.4);
    border-radius: 6px;
}

.effect-preview.sepia {
    background: linear-gradient(45deg, #d2b48c, #daa520);
    filter: sepia(70%) saturate(0.8);
}

.effect-preview.gradient {
    background: 
        linear-gradient(135deg, rgba(74,144,226,0.6), rgba(142,68,173,0.6)),
        linear-gradient(45deg, #ff6b6b, #4ecdc4);
}

.effect-preview.pattern {
    background: 
        radial-gradient(circle at 20% 20%, rgba(120,119,198,0.4) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(255,119,198,0.4) 0%, transparent 50%),
        linear-gradient(45deg, #ff6b6b, #4ecdc4);
}

.effect-option span {
    font-size: 12px;
    color: var(--text-color, #333);
    font-weight: 500;
}

.effect-controls {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    background: rgba(124, 77, 255, 0.05);
    border-radius: 8px;
}

.effect-controls label {
    font-weight: 500;
    color: var(--text-color, #333);
    white-space: nowrap;
}

.effect-controls input[type="range"] {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: var(--border-color, #ddd);
    outline: none;
    -webkit-appearance: none;
}

.effect-controls input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--primary-color, #7c4dff);
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

.effect-controls input[type="range"]::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--primary-color, #7c4dff);
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

@keyframes gradientMove {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

/* Effets appliqués au body */
.background-effect::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-overlay, transparent);
    pointer-events: none;
    z-index: -1;
}

.btn-primary, .btn-secondary {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.btn-primary {
    background: var(--primary-color, #4caf50);
    color: white;
}

.btn-primary:hover {
    background: var(--accent-color, #45a049);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.btn-secondary {
    background: #f44336;
    color: white;
}

.btn-secondary:hover {
    background: #d32f2f;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
}

.custom-backgrounds-section {
    margin-top: 30px;
    border-top: 1px solid var(--border-color, #eee);
    padding-top: 20px;
}

.custom-backgrounds-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
    margin-top: 15px;
}

.custom-bg-item {
    border: 2px solid transparent;
    border-radius: 8px;
    overflow: hidden;
    background: var(--card-bg, white);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
}

.custom-bg-item.active {
    border-color: var(--primary-color, #4caf50);
    box-shadow: 0 4px 16px rgba(124, 77, 255, 0.3);
}

.bg-preview {
    height: 120px;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
}

.bg-info {
    padding: 10px;
}

.bg-name {
    font-weight: 500;
    color: var(--text-color, #333);
}

.bg-actions {
    display: flex;
    gap: 5px;
    margin-top: 8px;
}

.btn-use, .btn-delete {
    background: none;
    border: 1px solid var(--border-color, #ddd);
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
}

.btn-use:hover {
    background: var(--primary-color, #4caf50);
    color: white;
}

.btn-delete:hover {
    background: #f44336;
    color: white;
}

.no-custom-bg {
    text-align: center;
    color: var(--text-muted, #666);
    font-style: italic;
    padding: 20px;
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
    transition: all 0.2s;
}

.close-modal-btn:hover {
    background: rgba(255, 255, 255, 0.3);
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

/* Mobile responsive */
@media (max-width: 768px) {
    .custom-backgrounds-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 10px;
    }
    
    .upload-area {
        padding: 20px 10px;
    }
    
    .preview-actions {
        flex-direction: column;
    }
}
</style>
`;

// Injecter les styles
document.head.insertAdjacentHTML('beforeend', customBackgroundStyles);

// Initialiser automatiquement si le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.customBackgroundManager = new CustomBackgroundManager();
    });
} else {
    window.customBackgroundManager = new CustomBackgroundManager();
}

// Intégration avec le système de thème existant
if (window.backgroundSelector) {
    // Ajouter l'option personnalisée au sélecteur existant
    window.backgroundSelector.addCustomOption = function() {
        if (window.customBackgroundManager) {
            window.customBackgroundManager.openModal();
        }
    };
}