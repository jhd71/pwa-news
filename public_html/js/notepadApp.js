// notepadApp.js - Application Bloc-notes intégrée - VERSION CORRIGÉE
class NotepadWidget {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('userNotes')) || [];
        this.currentNoteIndex = null;
        this.popupOpen = false;
    }

    init() {
        this.cleanCorruptedData(); // Nettoyer d'abord
        
        setTimeout(() => {
            this.createNotepadTile();
            this.createPopup();
        }, 2000);
    }

    createNotepadTile() {
        // Chercher le séparateur Espace+
        const espaceSeparator = Array.from(document.querySelectorAll('.separator'))
            .find(sep => sep && sep.textContent && sep.textContent.includes('Espace+'));
        
        if (!espaceSeparator) {
            console.warn('Séparateur Espace+ non trouvé, réessai dans 1 seconde');
            setTimeout(() => this.createNotepadTile(), 1000);
            return;
        }

        // Vérifier si la tuile existe déjà 
        if (document.querySelector('.notepad-app-tile')) {
            console.log('Tuile Bloc-notes déjà présente');
            return;
        }

        // Trouver la tuile Lecteur Radio
        const radioTile = document.querySelector('.tile[data-category="Espace+"]');
        
        // Créer la tuile Bloc-notes
        const tileElement = document.createElement('div');
        tileElement.className = 'tile notepad-app-tile';
        tileElement.setAttribute('data-category', 'Espace+');
        
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
                    </div>
                    
                    <!-- Éditeur de note -->
                    <div class="note-editor">
                        <input type="text" 
                               id="noteTitle" 
                               class="note-title-input" 
                               placeholder="Titre de la note..."
                               maxlength="50">
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
                    <p>💾 Les notes sont sauvegardées localement sur votre appareil</p>
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
                // ✅ Sauvegarder seulement si la note n'est pas vide
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
    }      

    // CORRECTION : Gestion d'erreurs pour les event listeners
    setupEventListeners() {
        try {
            // Fermer la popup - AMÉLIORÉ
            const closeBtn = document.getElementById('closeNotepadPopup');
            if (closeBtn) {
                // Utiliser touchend pour mobile ET click pour desktop
                ['click', 'touchend'].forEach(eventType => {
                    closeBtn.addEventListener(eventType, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // ✅ Sauvegarder seulement si la note n'est pas vide
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
                        // ✅ Sauvegarder seulement si la note n'est pas vide
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
                    // ✅ Sauvegarder la note actuelle seulement si elle n'est pas vide
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

            // Sauvegarder la note (bouton explicite)
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

            // Auto-save amélioré pendant la frappe
            let autoSaveTimer;
            const autoSave = () => {
                clearTimeout(autoSaveTimer);
                autoSaveTimer = setTimeout(() => {
                    if (this.currentNoteIndex !== null) {
                        this.saveCurrentNote(true); // Sauvegarde silencieuse
                        // Afficher un petit indicateur de sauvegarde
                        const dateElement = document.getElementById('noteDate');
                        if (dateElement) {
                            const originalText = dateElement.textContent;
                            dateElement.textContent = '💾 Sauvegarde automatique...';
                            setTimeout(() => {
                                dateElement.textContent = originalText;
                            }, 1000);
                        }
                    }
                }, 2000); // Sauvegarde après 2 secondes d'inactivité
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
                        // Sauvegarder la note actuelle avant de changer
                        this.saveCurrentNote(true);
                    }
                });
            }
            
            // Raccourcis clavier
            document.addEventListener('keydown', (e) => {
                // Ctrl+S ou Cmd+S pour sauvegarder
                if ((e.ctrlKey || e.metaKey) && e.key === 's' && this.popupOpen) {
                    e.preventDefault();
                    this.saveCurrentNote();
                }
                
                // Ctrl+N ou Cmd+N pour nouvelle note
                if ((e.ctrlKey || e.metaKey) && e.key === 'n' && this.popupOpen) {
                    e.preventDefault();
                    if (this.currentNoteIndex !== null) {
                        this.saveCurrentNote(true);
                    }
                    this.createNewNote();
                }
            });
            
        } catch (error) {
            console.error('Erreur lors de la configuration des event listeners:', error);
        }
    }

    // MODIFICATION : Toujours ouvrir sur une note vide
    openPopup() {
        try {
            const popup = document.getElementById('notepadPopup');
            if (!popup) return;
            
            popup.classList.add('active');
            document.body.classList.add('notepad-popup-open');
            this.popupOpen = true;
            
            // Empêcher le scroll sur mobile
            if (window.innerWidth <= 768) {
                document.body.style.overflow = 'hidden';
            }
            
            this.loadNotesList();
            
            // ✅ TOUJOURS créer une nouvelle note à l'ouverture
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
            
            // Restaurer le scroll sur mobile
            if (window.innerWidth <= 768) {
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
                
                // Forcer la fermeture après l'animation
                setTimeout(() => {
                    popup.style.display = 'none';
                    setTimeout(() => {
                        popup.style.display = ''; // Réinitialiser pour la prochaine ouverture
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
            
            // Nettoyer les notes corrompues
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
                
                noteItem.innerHTML = `
                    <div class="note-item-title">${note.title || 'Sans titre'}</div>
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
            
            // Sauvegarder la note actuelle avant de charger une nouvelle
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
            
            // Mettre à jour la liste
            this.updateNotesList();
            
            // Focus sur la zone de texte
            setTimeout(() => {
                if (contentTextarea) contentTextarea.focus();
            }, 100);
        } catch (error) {
            console.error('Erreur lors du chargement de la note:', error);
        }
    }

    createNewNote() {
        try {
            // ✅ Ne pas créer de note dans le tableau, juste préparer l'interface
            this.currentNoteIndex = null; // Pas d'index car pas encore sauvegardée
            
            const titleInput = document.getElementById('noteTitle');
            const contentTextarea = document.getElementById('noteContent');
            const dateElement = document.getElementById('noteDate');
            
            if (titleInput) titleInput.value = '';
            if (contentTextarea) contentTextarea.value = '';
            if (dateElement) dateElement.textContent = 'Nouvelle note';
            
            // ✅ Pas de sauvegarde automatique d'une note vide
            this.loadNotesList(); // Rafraîchir la liste (sans la nouvelle note vide)
            
            // Focus sur le titre
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
            
            // ✅ Ne pas sauvegarder si la note est complètement vide
            if (!title && !content) {
                return; // Sortir sans sauvegarder
            }
            
            // Si c'est une nouvelle note (currentNoteIndex = null), la créer
            if (this.currentNoteIndex === null) {
                const newNote = {
                    title: title || 'Sans titre',
                    content: content,
                    date: new Date().toISOString()
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
            
            // Vérifier si la note existante a changé
            const currentNote = this.notes[this.currentNoteIndex];
            if (currentNote.title === title && currentNote.content === content) {
                return; // Pas de changement
            }
            
            // Mettre à jour la note existante
            this.notes[this.currentNoteIndex] = {
                title: title || 'Sans titre',
                content: content,
                date: new Date().toISOString()
            };
            
            this.saveToLocalStorage();
            this.loadNotesList();
            
            // Mettre à jour la date affichée
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
                this.showToast('Note supprimée');
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
            // Supprimer les toasts existants
            const existingToasts = document.querySelectorAll('.notepad-toast');
            existingToasts.forEach(toast => toast.remove());
            
            const toast = document.createElement('div');
            toast.className = 'notepad-toast';
            toast.innerHTML = `
                <span class="toast-icon">${message.includes('✅') ? '✅' : '💾'}</span>
                <span class="toast-message">${message}</span>
            `;
            document.body.appendChild(toast);
            
            // Forcer le reflow pour l'animation
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

// CORRECTION : Initialisation protégée contre les erreurs
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Vérifier que l'environnement est prêt
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