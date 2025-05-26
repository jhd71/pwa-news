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

    // Créer le nouveau style CSS
    const style = document.createElement('style');
    style.id = 'customBackgroundStyle';
    style.textContent = `
        body.custom-background {
            background-image: url("${background.data}") !important;
            background-size: cover !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            background-attachment: fixed !important;
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
    margin: 5vh auto;
    background: var(--card-bg, white);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
    from { transform: translateY(50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.background-upload-modal .modal-header {
    background: linear-gradient(135deg, var(--primary-color, #7c4dff), var(--accent-color, #9c27b0));
    color: white;
    padding: 20px 25px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.background-upload-modal .modal-header h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
}

.background-upload-modal .modal-content {
    flex: 1;
    padding: 25px;
    overflow-y: auto;
    background: var(--background-color, #f8f9fa);
}

.upload-area {
    border: 3px dashed var(--primary-color, #7c4dff);
    border-radius: 16px;
    padding: 50px 30px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, rgba(124, 77, 255, 0.05), rgba(156, 39, 176, 0.05));
    position: relative;
    overflow: hidden;
}

.upload-area::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(124, 77, 255, 0.1), transparent);
    transform: rotate(45deg);
    animation: shimmer 3s infinite;
}

@keyframes shimmer {
    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
    100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}

.upload-area:hover, .upload-area.drag-over {
    border-color: var(--accent-color, #9c27b0);
    background: linear-gradient(135deg, rgba(124, 77, 255, 0.1), rgba(156, 39, 176, 0.1));
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(124, 77, 255, 0.3);
}

.upload-icon {
    font-size: 64px;
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
}

.upload-area p {
    position: relative;
    z-index: 1;
    font-size: 18px;
    font-weight: 500;
    margin: 10px 0;
}

.file-requirements {
    font-size: 14px;
    color: var(--text-muted, #666);
    margin-top: 15px;
    position: relative;
    z-index: 1;
}

.image-preview {
    text-align: center;
    background: white;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.image-preview img {
    max-width: 100%;
    max-height: 400px;
    border-radius: 12px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    transition: transform 0.3s ease;
}

.image-preview img:hover {
    transform: scale(1.02);
}

.preview-actions {
    margin-top: 20px;
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
    padding: 14px 28px;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    font-weight: 600;
    font-size: 16px;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    position: relative;
    overflow: hidden;
}

.btn-primary {
    background: linear-gradient(135deg, #4CAF50, #45a049);
    color: white;
    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
}

.btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4);
}

.btn-secondary {
    background: linear-gradient(135deg, #f44336, #d32f2f);
    color: white;
    box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
}

.btn-secondary:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(244, 67, 54, 0.4);
}

.custom-backgrounds-section {
    margin-top: 35px;
    background: white;
    border-radius: 16px;
    padding: 25px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.custom-backgrounds-section h3 {
    margin-top: 0;
    color: var(--primary-color, #7c4dff);
    font-size: 20px;
    font-weight: 600;
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
    font-size: 20px;
}

.close-modal-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
}

/* MOBILE RESPONSIVE */
@media (max-width: 768px) {
    .background-upload-modal .modal-container {
        width: 100%;
        height: 100vh;
        margin: 0;
        border-radius: 0;
    }
    
    .background-upload-modal .modal-header {
        padding: 15px 20px;
        position: sticky;
        top: 0;
        z-index: 10;
    }
    
    .background-upload-modal .modal-header h2 {
        font-size: 18px;
    }
    
    .background-upload-modal .modal-content {
        padding: 20px 15px;
        padding-bottom: 100px;
    }
    
    .upload-area {
        padding: 30px 15px;
        border-radius: 12px;
    }
    
    .upload-icon {
        font-size: 48px;
    }
    
    .upload-area p {
        font-size: 16px;
    }
    
    .image-preview img {
        max-height: 250px;
    }
    
    .preview-actions {
        flex-direction: column;
    }
    
    .btn-primary, .btn-secondary {
        width: 100%;
        justify-content: center;
        padding: 16px 24px;
    }
    
    .custom-backgrounds-section {
        margin-top: 20px;
        padding: 20px 15px;
        border-radius: 12px;
    }
}

/* Animation pour les boutons */
@keyframes buttonPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

.btn-primary:active, .btn-secondary:active {
    animation: buttonPulse 0.3s ease;
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