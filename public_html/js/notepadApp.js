// notepadApp.js - Application Bloc-notes intégrée avec EXPORT/IMPORT
class NotepadWidget {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('userNotes')) || [];
        this.currentNoteIndex = null;
        this.popupOpen = false;
        this.backgrounds = [
            { id: 'default', name: 'Défaut', color: '#ffffff', pattern: null },
            { id: 'yellow', name: 'Jaune', color: '#fff9c4', pattern: null },
            { id: 'orange', name: 'Orange', color: '#ffe0b2', pattern: null },
            { id: 'pink', name: 'Rose', color: '#fce4ec', pattern: null },
            { id: 'purple', name: 'Violet', color: '#e1bee7', pattern: null },
            { id: 'blue', name: 'Bleu', color: '#bbdefb', pattern: null },
            { id: 'teal', name: 'Turquoise', color: '#b2dfdb', pattern: null },
            { id: 'green', name: 'Vert', color: '#c8e6c9', pattern: null },
            { id: 'gray', name: 'Gris', color: '#eeeeee', pattern: null },
            { id: 'dots', name: 'Points', color: '#f5f5f5', pattern: 'dots' },
            { id: 'lines', name: 'Lignes', color: '#fafafa', pattern: 'lines' },
            { id: 'grid', name: 'Grille', color: '#fff', pattern: 'grid' }
        ];
    }

    init() {
    this.cleanCorruptedData();
    
    // Créer immédiatement si le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            this.createNotepadTile();
            this.createPopup();
        });
    } else {
        // Le DOM est déjà chargé
        this.createNotepadTile();
        this.createPopup();
    }
}

    createNotepadTile() {
    // Vérifier si la tuile existe déjà
    if (document.querySelector('.notepad-app-tile')) {
        console.log('Tuile Bloc-notes déjà présente');
        return;
    }

    // Chercher le séparateur Espace+
    const espaceSeparator = Array.from(document.querySelectorAll('.separator'))
        .find(sep => sep && sep.textContent && sep.textContent.includes('Espace+'));
    
    if (!espaceSeparator) {
        // Si pas trouvé, observer le DOM pour l'ajouter dès qu'il apparaît
        const observer = new MutationObserver(() => {
            const separator = Array.from(document.querySelectorAll('.separator'))
                .find(sep => sep && sep.textContent && sep.textContent.includes('Espace+'));
            if (separator) {
                observer.disconnect();
                this.createNotepadTile();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        return;
    }

        // Trouver la tuile Lecteur Radio
        const radioTile = document.querySelector('.tile[data-category="notepad"]');
        
        // Créer la tuile Bloc-notes
        const tileElement = document.createElement('div');
        tileElement.className = 'tile notepad-app-tile';
        tileElement.setAttribute('data-category', 'notepad');
        
        // Adapter le style selon le thème actuel
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'rouge';
        let gradientStyle = '';
        
        switch(currentTheme) {
            case 'rouge':
                gradientStyle = 'linear-gradient(135deg, #940000, #c41e3a)';
                break;
            case 'dark':
                gradientStyle = 'linear-gradient(135deg, #ff6b6b, #ff8787)';
                break;
            case 'bleuciel':
                gradientStyle = 'linear-gradient(135deg, #17a2b8, #20c997)';
                break;
            case 'light':
                gradientStyle = 'linear-gradient(135deg, #6f42c1, #e83e8c)';
                break;
            default:
                gradientStyle = 'linear-gradient(135deg, #667eea, #764ba2)';
        }
        
        tileElement.style.cssText = `
            background: ${gradientStyle};
            color: white;
            position: relative;
        `;
        
        tileElement.innerHTML = `
            <div class="tile-content">
                <div class="tile-title" style="color: white; font-weight: bold;">
                    📝 Bloc-notes
                </div>
            </div>
        `;

        // Ajouter le gestionnaire de clic
        tileElement.addEventListener('click', () => {
            this.openPopup();
        });

        // Insérer la tuile
        if (radioTile) {
            radioTile.insertAdjacentElement('afterend', tileElement);
            console.log('Tuile Bloc-notes ajoutée après Lecteur Radio');
        } else {
            espaceSeparator.insertAdjacentElement('afterend', tileElement);
            console.log('Tuile Bloc-notes ajoutée après le séparateur');
        }
        
        // Observer les changements de thème
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    this.updateTileTheme();
                }
            });
        });
        
        observer.observe(document.documentElement, { 
            attributes: true, 
            attributeFilter: ['data-theme'] 
        });
    }

    updateTileTheme() {
        const tile = document.querySelector('.notepad-app-tile');
        if (!tile) return;
        
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'rouge';
        let gradientStyle = '';
        
        switch(currentTheme) {
            case 'rouge':
                gradientStyle = 'linear-gradient(135deg, #940000, #c41e3a)';
                break;
            case 'dark':
                gradientStyle = 'linear-gradient(135deg, #ff6b6b, #ff8787)';
                break;
            case 'bleuciel':
                gradientStyle = 'linear-gradient(135deg, #17a2b8, #20c997)';
                break;
            case 'light':
                gradientStyle = 'linear-gradient(135deg, #6f42c1, #e83e8c)';
                break;
            default:
                gradientStyle = 'linear-gradient(135deg, #667eea, #764ba2)';
        }
        
        tile.style.background = gradientStyle;
    }

    cleanCorruptedData() {
        const saved = localStorage.getItem('userNotes');
        if (saved) {
            try {
                const notes = JSON.parse(saved);
                const cleanNotes = notes.filter(note => 
                    note && typeof note === 'object' && 
                    (note.title || note.content)
                );
                
                if (cleanNotes.length !== notes.length) {
                    console.log('Données corrompues nettoyées');
                    this.notes = cleanNotes;
                    this.saveToLocalStorage();
                }
            } catch (e) {
                console.error('Données corrompues, réinitialisation');
                this.notes = [];
                this.saveToLocalStorage();
            }
        }
    }

    createPopup() {
        const popup = document.createElement('div');
        popup.id = 'notepadPopup';
        popup.className = 'notepad-popup-overlay';
        popup.innerHTML = `
            <div class="notepad-popup-content">
                <div class="notepad-popup-header">
                    <h2>📝 Bloc-notes</h2>
                    <button class="notepad-popup-close" id="closeNotepadPopup">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                
                <div class="notepad-popup-body">
                    <!-- Liste des notes -->
                    <div class="notes-sidebar">
                        <div class="notes-list-header">
                            <h3>Mes notes</h3>
                            <button class="add-note-btn" id="addNoteBtn">
                                <span class="material-icons">add</span>
                            </button>
                        </div>
                        <div class="notes-list" id="notesList"></div>
                        
                        <!-- NOUVEAU: Boutons Export/Import -->
                        <div class="notes-backup-section">
                            <button class="backup-btn export-btn" id="exportNotesBtn">
                                <span class="material-icons">download</span>
                                Exporter
                            </button>
                            <button class="backup-btn import-btn" id="importNotesBtn">
                                <span class="material-icons">upload</span>
                                Importer
                            </button>
                            <input type="file" id="importFileInput" accept=".json" style="display: none;">
                        </div>
                    </div>
                    
                    <!-- Éditeur de note -->
                    <div class="note-editor">
                        <input type="text" 
                               id="noteTitle" 
                               class="note-title-input" 
                               placeholder="Titre de la note..."
                               maxlength="50">
                        
                        <!-- NOUVEAU: Sélecteur d'arrière-plan -->
                        <div class="note-background-selector">
                            <button class="background-btn" id="backgroundToggleBtn" title="Changer l'arrière-plan">
                                <span class="material-icons">palette</span>
                            </button>
                            <div class="background-options" id="backgroundOptions">
                                <div class="background-options-grid"></div>
                            </div>
                        </div>
                        
                        <textarea id="noteContent" 
                                  class="note-content-area" 
                                  placeholder="Écrivez votre note ici..."></textarea>
                        <div class="note-actions">
                            <span class="note-date" id="noteDate"></span>
                            <div class="note-buttons">
                                <button class="note-btn save-btn" id="saveNoteBtn">
                                    <span class="material-icons">save</span>
                                    Sauvegarder
                                </button>
                                <button class="note-btn delete-btn" id="deleteNoteBtn">
                                    <span class="material-icons">delete</span>
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="notepad-popup-footer">
                    <p>💾 Les notes sont sauvegardées localement | 📥 Exportez pour les conserver</p>
                </div>           
        </div>
    `;

        document.body.appendChild(popup);

        // Ajouter le bouton de fermeture mobile APRÈS la création
        if (window.innerWidth <= 768) {
            const mobileCloseBtn = document.createElement('button');
            mobileCloseBtn.className = 'mobile-close-btn';
            mobileCloseBtn.id = 'mobileCloseBtn';
            mobileCloseBtn.textContent = 'Fermer le bloc-notes';
            popup.querySelector('.notepad-popup-content').appendChild(mobileCloseBtn);
            
            // Ajouter directement l'événement
            mobileCloseBtn.addEventListener('click', () => {
                if (this.currentNoteIndex !== null) {
                    const title = document.getElementById('noteTitle')?.value.trim() || '';
                    const content = document.getElementById('noteContent')?.value.trim() || '';
                    if (title || content) {
                        this.saveCurrentNote(true);
                    }
                }
                this.closePopup();
            });
        }
        
        this.setupEventListeners();
        this.initializeBackgroundSelector();
    }

    // NOUVELLE FONCTION: Initialiser le sélecteur d'arrière-plan
    initializeBackgroundSelector() {
        const grid = document.querySelector('.background-options-grid');
        const toggleBtn = document.getElementById('backgroundToggleBtn');
        const options = document.getElementById('backgroundOptions');
        
        if (!grid || !toggleBtn || !options) return;
        
        // Créer les options d'arrière-plan
        this.backgrounds.forEach(bg => {
            const option = document.createElement('div');
            option.className = 'background-option';
            option.dataset.bgId = bg.id;
            option.title = bg.name;
            
            // Appliquer le style de l'arrière-plan
            option.style.background = bg.color;
            
            // Ajouter les motifs si nécessaire
            if (bg.pattern === 'dots') {
                option.style.backgroundImage = `radial-gradient(circle, #00000015 1px, transparent 1px)`;
                option.style.backgroundSize = '10px 10px';
            } else if (bg.pattern === 'lines') {
                option.style.backgroundImage = `repeating-linear-gradient(45deg, transparent, transparent 10px, #00000008 10px, #00000008 20px)`;
            } else if (bg.pattern === 'grid') {
                option.style.backgroundImage = `
                    repeating-linear-gradient(0deg, #00000008, #00000008 1px, transparent 1px, transparent 20px),
                    repeating-linear-gradient(90deg, #00000008, #00000008 1px, transparent 1px, transparent 20px)
                `;
            }
            
            // Ajouter une icône de check pour l'option sélectionnée
            const checkIcon = document.createElement('span');
            checkIcon.className = 'material-icons background-check';
            checkIcon.textContent = 'check';
            option.appendChild(checkIcon);
            
            // Gestionnaire de clic
            option.addEventListener('click', () => {
                this.selectBackground(bg.id);
                options.classList.remove('show');
            });
            
            grid.appendChild(option);
        });
        
        // Toggle du panneau
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            options.classList.toggle('show');
        });
        
        // Fermer le panneau en cliquant ailleurs
        document.addEventListener('click', (e) => {
            if (!options.contains(e.target) && e.target !== toggleBtn) {
                options.classList.remove('show');
            }
        });
    }

    // NOUVELLE FONCTION: Sélectionner un arrière-plan
    selectBackground(bgId) {
        const bg = this.backgrounds.find(b => b.id === bgId);
        if (!bg) return;
        
        // Appliquer l'arrière-plan à l'éditeur
        const noteContent = document.getElementById('noteContent');
        const noteEditor = document.querySelector('.note-editor');
        
        if (noteContent && noteEditor) {
            // Réinitialiser les styles
            noteContent.style.background = bg.color;
            noteEditor.dataset.background = bgId;
            
            // Appliquer les motifs
            if (bg.pattern === 'dots') {
                noteContent.style.backgroundImage = `radial-gradient(circle, #00000015 1px, transparent 1px)`;
                noteContent.style.backgroundSize = '10px 10px';
            } else if (bg.pattern === 'lines') {
                noteContent.style.backgroundImage = `repeating-linear-gradient(45deg, transparent, transparent 10px, #00000008 10px, #00000008 20px)`;
            } else if (bg.pattern === 'grid') {
                noteContent.style.backgroundImage = `
                    repeating-linear-gradient(0deg, #00000008, #00000008 1px, transparent 1px, transparent 20px),
                    repeating-linear-gradient(90deg, #00000008, #00000008 1px, transparent 1px, transparent 20px)
                `;
            } else {
                noteContent.style.backgroundImage = 'none';
            }
            
            // Ajuster la couleur du texte pour un meilleur contraste
            const isDark = this.isColorDark(bg.color);
            noteContent.style.color = isDark ? '#ffffff' : '#333333';
        }
        
        // Mettre à jour les indicateurs de sélection
        document.querySelectorAll('.background-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.bgId === bgId);
        });
    }

    // NOUVELLE FONCTION: Déterminer si une couleur est foncée
    isColorDark(color) {
        // Convertir la couleur hex en RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Calculer la luminosité
        const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return brightness < 128;
    }

    setupEventListeners() {
        try {
            // Fermer la popup
            const closeBtn = document.getElementById('closeNotepadPopup');
            if (closeBtn) {
                ['click', 'touchend'].forEach(eventType => {
                    closeBtn.addEventListener(eventType, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (this.currentNoteIndex !== null) {
                            const title = document.getElementById('noteTitle')?.value.trim() || '';
                            const content = document.getElementById('noteContent')?.value.trim() || '';
                            if (title || content) {
                                this.saveCurrentNote(true);
                            }
                        }
                        this.closePopup();
                    });
                });
            }

            // Fermer en cliquant à l'extérieur (desktop uniquement)
            const popup = document.getElementById('notepadPopup');
            if (popup) {
                popup.addEventListener('click', (e) => {
                    if (e.target.id === 'notepadPopup' && window.innerWidth > 768) {
                        if (this.currentNoteIndex !== null) {
                            const title = document.getElementById('noteTitle')?.value.trim() || '';
                            const content = document.getElementById('noteContent')?.value.trim() || '';
                            if (title || content) {
                                this.saveCurrentNote(true);
                            }
                        }
                        this.closePopup();
                    }
                });
            }

            // Ajouter une nouvelle note
            const addNoteBtn = document.getElementById('addNoteBtn');
            if (addNoteBtn) {
                addNoteBtn.addEventListener('click', () => {
                    if (this.currentNoteIndex !== null) {
                        const title = document.getElementById('noteTitle')?.value.trim() || '';
                        const content = document.getElementById('noteContent')?.value.trim() || '';
                        if (title || content) {
                            this.saveCurrentNote(true);
                        }
                    }
                    this.createNewNote();
                });
            }

            // Sauvegarder la note
            const saveNoteBtn = document.getElementById('saveNoteBtn');
            if (saveNoteBtn) {
                saveNoteBtn.addEventListener('click', () => {
                    this.saveCurrentNote();
                });
            }

            // Supprimer la note
            const deleteNoteBtn = document.getElementById('deleteNoteBtn');
            if (deleteNoteBtn) {
                deleteNoteBtn.addEventListener('click', () => {
                    this.deleteCurrentNote();
                });
            }

            // NOUVEAU: Export des notes
            const exportBtn = document.getElementById('exportNotesBtn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    this.exportNotes();
                });
            }

            // NOUVEAU: Import des notes
            const importBtn = document.getElementById('importNotesBtn');
            const fileInput = document.getElementById('importFileInput');
            
            if (importBtn && fileInput) {
                importBtn.addEventListener('click', () => {
                    fileInput.click();
                });
                
                fileInput.addEventListener('change', (e) => {
                    this.importNotes(e.target.files[0]);
                });
            }

            // Auto-save amélioré
            let autoSaveTimer;
            const autoSave = () => {
                clearTimeout(autoSaveTimer);
                autoSaveTimer = setTimeout(() => {
                    if (this.currentNoteIndex !== null) {
                        this.saveCurrentNote(true);
                        const dateElement = document.getElementById('noteDate');
                        if (dateElement) {
                            const originalText = dateElement.textContent;
                            dateElement.textContent = '💾 Sauvegarde automatique...';
                            setTimeout(() => {
                                dateElement.textContent = originalText;
                            }, 1000);
                        }
                    }
                }, 2000);
            };

            const noteContent = document.getElementById('noteContent');
            const noteTitle = document.getElementById('noteTitle');
            if (noteContent) noteContent.addEventListener('input', autoSave);
            if (noteTitle) noteTitle.addEventListener('input', autoSave);
            
            // Sauvegarder quand on change de note
            const notesList = document.getElementById('notesList');
            if (notesList) {
                notesList.addEventListener('click', (e) => {
                    const noteItem = e.target.closest('.note-item');
                    if (noteItem && this.currentNoteIndex !== null) {
                        this.saveCurrentNote(true);
                    }
                });
            }
            
            // Raccourcis clavier
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 's' && this.popupOpen) {
                    e.preventDefault();
                    this.saveCurrentNote();
                }
                
                if ((e.ctrlKey || e.metaKey) && e.key === 'n' && this.popupOpen) {
                    e.preventDefault();
                    if (this.currentNoteIndex !== null) {
                        this.saveCurrentNote(true);
                    }
                    this.createNewNote();
                }
                
                // NOUVEAU: Raccourci pour export (Ctrl/Cmd + E)
                if ((e.ctrlKey || e.metaKey) && e.key === 'e' && this.popupOpen) {
                    e.preventDefault();
                    this.exportNotes();
                }
            });
            
        } catch (error) {
            console.error('Erreur lors de la configuration des event listeners:', error);
        }
    }

    // NOUVELLE FONCTION: Exporter les notes
    exportNotes() {
        try {
            // Sauvegarder la note actuelle avant l'export
            if (this.currentNoteIndex !== null) {
                const title = document.getElementById('noteTitle')?.value.trim() || '';
                const content = document.getElementById('noteContent')?.value.trim() || '';
                if (title || content) {
                    this.saveCurrentNote(true);
                }
            }

            // Créer l'objet d'export avec métadonnées
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                notesCount: this.notes.length,
                notes: this.notes
            };

            // Convertir en JSON
            const jsonStr = JSON.stringify(exportData, null, 2);
            
            // Créer un blob et un lien de téléchargement
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Créer un élément de téléchargement
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
            a.download = `bloc-notes-export-${date}.json`;
            
            // Déclencher le téléchargement
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Libérer l'URL
            URL.revokeObjectURL(url);
            
            this.showToast(`📥 ${this.notes.length} notes exportées avec succès`);
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            this.showToast('❌ Erreur lors de l\'export');
        }
    }

    // NOUVELLE FONCTION: Importer les notes
    importNotes(file) {
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                // Vérifier la validité du fichier
                if (!importData.notes || !Array.isArray(importData.notes)) {
                    throw new Error('Format de fichier invalide');
                }
                
                // Options d'import
                const options = confirm(
                    `📤 Fichier d'import détecté:\n` +
                    `- ${importData.notesCount || importData.notes.length} notes\n` +
                    `- Exporté le: ${importData.exportDate ? new Date(importData.exportDate).toLocaleDateString('fr-FR') : 'Date inconnue'}\n\n` +
                    `Voulez-vous REMPLACER toutes vos notes actuelles?\n` +
                    `(OK = Remplacer | Annuler = Fusionner avec les notes existantes)`
                );
                
                if (options) {
                    // Remplacer toutes les notes
                    this.notes = importData.notes;
                } else {
                    // Fusionner avec les notes existantes
                    const importedNotes = importData.notes;
                    
                    // Ajouter un préfixe aux notes importées pour les identifier
                    importedNotes.forEach(note => {
                        note.title = `[Importé] ${note.title || 'Sans titre'}`;
                        note.importDate = new Date().toISOString();
                    });
                    
                    // Ajouter les notes importées au début
                    this.notes = [...importedNotes, ...this.notes];
                }
                
                // Sauvegarder et rafraîchir
                this.saveToLocalStorage();
                this.loadNotesList();
                
                // Charger la première note importée
                if (this.notes.length > 0) {
                    this.loadNote(0);
                }
                
                this.showToast(`✅ ${importData.notes.length} notes importées avec succès`);
                
                // Réinitialiser l'input file
                document.getElementById('importFileInput').value = '';
                
            } catch (error) {
                console.error('Erreur lors de l\'import:', error);
                this.showToast('❌ Erreur: Fichier invalide ou corrompu');
            }
        };
        
        reader.onerror = () => {
            this.showToast('❌ Erreur lors de la lecture du fichier');
        };
        
        reader.readAsText(file);
    }

    openPopup() {
        try {
            const popup = document.getElementById('notepadPopup');
            if (!popup) return;
            
            popup.classList.add('active');
            document.body.classList.add('notepad-popup-open');
            this.popupOpen = true;
            
            if (window.innerWidth <= 768) {
                document.body.style.overflow = 'hidden';
            }
            
            this.loadNotesList();
            this.createNewNote();
            
        } catch (error) {
            console.error('Erreur lors de l\'ouverture du bloc-notes:', error);
        }
    }

    closePopup() {
        try {
            const popup = document.getElementById('notepadPopup');
            if (!popup) return;
            
            popup.classList.remove('active');
            document.body.classList.remove('notepad-popup-open');
            this.popupOpen = false;
            
            if (window.innerWidth <= 768) {
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
                
                setTimeout(() => {
                    popup.style.display = 'none';
                    setTimeout(() => {
                        popup.style.display = '';
                    }, 100);
                }, 300);
            }
        } catch (error) {
            console.error('Erreur lors de la fermeture du bloc-notes:', error);
        }
    }

    loadNotesList() {
        try {
            const notesList = document.getElementById('notesList');
            if (!notesList) return;
            
            notesList.innerHTML = '';
            
            this.notes = this.notes.filter(note => {
                return note && typeof note === 'object' && 
                       (note.title !== undefined || note.content !== undefined);
            });
            
            this.notes.forEach((note, index) => {
                const noteItem = document.createElement('div');
                noteItem.className = 'note-item';
                if (index === this.currentNoteIndex) {
                    noteItem.classList.add('active');
                }
                
                // Appliquer l'arrière-plan de la note à l'aperçu
                if (note.background) {
                    const bg = this.backgrounds.find(b => b.id === note.background);
                    if (bg) {
                        noteItem.style.background = bg.color;
                        if (bg.pattern === 'dots') {
                            noteItem.style.backgroundImage = `radial-gradient(circle, #00000015 1px, transparent 1px)`;
                            noteItem.style.backgroundSize = '10px 10px';
                        } else if (bg.pattern === 'lines') {
                            noteItem.style.backgroundImage = `repeating-linear-gradient(45deg, transparent, transparent 10px, #00000008 10px, #00000008 20px)`;
                        } else if (bg.pattern === 'grid') {
                            noteItem.style.backgroundImage = `
                                repeating-linear-gradient(0deg, #00000008, #00000008 1px, transparent 1px, transparent 20px),
                                repeating-linear-gradient(90deg, #00000008, #00000008 1px, transparent 1px, transparent 20px)
                            `;
                        }
                        
                        // Ajuster la couleur du texte
                        const isDark = this.isColorDark(bg.color);
                        noteItem.style.color = isDark ? '#ffffff' : '#333333';
                    }
                }
                
                // Ajouter un indicateur pour les notes importées
                const isImported = note.title && note.title.includes('[Importé]');
                
                noteItem.innerHTML = `
                    <div class="note-item-title">
                        ${isImported ? '📤 ' : ''}${note.title || 'Sans titre'}
                    </div>
                    <div class="note-item-preview">${this.truncateText(note.content || '', 50)}</div>
                    <div class="note-item-date">${this.formatDate(note.date || new Date().toISOString())}</div>
                `;
                
                noteItem.addEventListener('click', () => {
                    this.loadNote(index);
                });
                
                notesList.appendChild(noteItem);
            });
        } catch (error) {
            console.error('Erreur lors du chargement de la liste des notes:', error);
        }
    }

    loadNote(index) {
        try {
            if (index < 0 || index >= this.notes.length) return;
            
            if (this.currentNoteIndex !== null && this.currentNoteIndex !== index) {
                this.saveCurrentNote(true);
            }
            
            this.currentNoteIndex = index;
            const note = this.notes[index];
            
            const titleInput = document.getElementById('noteTitle');
            const contentTextarea = document.getElementById('noteContent');
            const dateElement = document.getElementById('noteDate');
            
            if (titleInput) titleInput.value = note.title || '';
            if (contentTextarea) contentTextarea.value = note.content || '';
            if (dateElement) dateElement.textContent = `Modifié le ${this.formatDate(note.date)}`;
            
            // Charger l'arrière-plan de la note
            if (note.background) {
                this.selectBackground(note.background);
            } else {
                this.selectBackground('default');
            }
            
            this.updateNotesList();
            
            setTimeout(() => {
                if (contentTextarea) contentTextarea.focus();
            }, 100);
        } catch (error) {
            console.error('Erreur lors du chargement de la note:', error);
        }
    }

    createNewNote() {
        try {
            this.currentNoteIndex = null;
            
            const titleInput = document.getElementById('noteTitle');
            const contentTextarea = document.getElementById('noteContent');
            const dateElement = document.getElementById('noteDate');
            
            if (titleInput) titleInput.value = '';
            if (contentTextarea) contentTextarea.value = '';
            if (dateElement) dateElement.textContent = 'Nouvelle note';
            
            // Réinitialiser l'arrière-plan
            this.selectBackground('default');
            
            this.loadNotesList();
            
            setTimeout(() => {
                if (titleInput) titleInput.focus();
            }, 100);
        } catch (error) {
            console.error('Erreur lors de la création d\'une nouvelle note:', error);
        }
    }

    saveCurrentNote(silent = false) {
        try {
            const titleInput = document.getElementById('noteTitle');
            const contentTextarea = document.getElementById('noteContent');
            
            if (!titleInput || !contentTextarea) return;
            
            const title = titleInput.value.trim();
            const content = contentTextarea.value.trim();
            
            // Récupérer l'arrière-plan sélectionné
            const selectedBg = document.querySelector('.note-editor').dataset.background || 'default';
            
            if (!title && !content) {
                return;
            }
            
            if (this.currentNoteIndex === null) {
                const newNote = {
                    title: title || 'Sans titre',
                    content: content,
                    date: new Date().toISOString(),
                    background: selectedBg
                };
                
                this.notes.unshift(newNote);
                this.currentNoteIndex = 0;
                this.saveToLocalStorage();
                this.loadNotesList();
                
                if (!silent) {
                    this.showToast('✅ Nouvelle note sauvegardée');
                }
                return;
            }
            
            const currentNote = this.notes[this.currentNoteIndex];
            if (currentNote.title === title && currentNote.content === content && currentNote.background === selectedBg) {
                return;
            }
            
            this.notes[this.currentNoteIndex] = {
                title: title || 'Sans titre',
                content: content,
                date: new Date().toISOString(),
                background: selectedBg
            };
            
            this.saveToLocalStorage();
            this.loadNotesList();
            
            const dateElement = document.getElementById('noteDate');
            if (dateElement) {
                dateElement.textContent = `Modifié le ${this.formatDate(this.notes[this.currentNoteIndex].date)}`;
            }
            
            if (!silent) {
                this.showToast('✅ Note sauvegardée');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    }

    deleteCurrentNote() {
        try {
            if (this.currentNoteIndex === null) return;
            
            if (confirm('Supprimer cette note ?')) {
                this.notes.splice(this.currentNoteIndex, 1);
                this.saveToLocalStorage();
                
                if (this.notes.length > 0) {
                    this.loadNote(0);
                } else {
                    this.createNewNote();
                }
                
                this.loadNotesList();
                this.showToast('🗑️ Note supprimée');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
        }
    }

    updateNotesList() {
        try {
            const noteItems = document.querySelectorAll('.note-item');
            noteItems.forEach((item, index) => {
                if (index === this.currentNoteIndex) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la liste:', error);
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('userNotes', JSON.stringify(this.notes));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde en localStorage:', error);
        }
    }

    truncateText(text, maxLength) {
        if (!text) return 'Note vide';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diff = now - date;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            
            if (days === 0) {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                if (hours === 0) {
                    const minutes = Math.floor(diff / (1000 * 60));
                    return minutes <= 1 ? "À l'instant" : `Il y a ${minutes} min`;
                }
                return hours === 1 ? 'Il y a 1 heure' : `Il y a ${hours} heures`;
            } else if (days === 1) {
                return 'Hier';
            } else if (days < 7) {
                return `Il y a ${days} jours`;
            } else {
                return date.toLocaleDateString('fr-FR');
            }
        } catch (error) {
            console.error('Erreur lors du formatage de la date:', error);
            return 'Date inconnue';
        }
    }

    showToast(message) {
        try {
            const existingToasts = document.querySelectorAll('.notepad-toast');
            existingToasts.forEach(toast => toast.remove());
            
            const toast = document.createElement('div');
            toast.className = 'notepad-toast';
            toast.innerHTML = `
                <span class="toast-message">${message}</span>
            `;
            document.body.appendChild(toast);
            
            void toast.offsetHeight;
            
            setTimeout(() => {
                toast.classList.add('show');
            }, 10);
            
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 2500);
        } catch (error) {
            console.error('Erreur lors de l\'affichage du toast:', error);
        }
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    try {
        if (typeof localStorage !== 'undefined') {
            window.notepadInstance = new NotepadWidget();
            window.notepadInstance.init();
        } else {
            console.error('localStorage non disponible');
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation du bloc-notes:', error);
    }
});

// Exposer la fonction globalement pour content.js
window.openNotepadApp = function() {
    if (window.notepadInstance) {
        window.notepadInstance.openPopup();
    }
};