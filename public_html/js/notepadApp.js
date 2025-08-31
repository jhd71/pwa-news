// notepadApp.js - Application Bloc-notes intégrée
class NotepadWidget {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('userNotes')) || [];
        this.currentNoteIndex = null;
        this.popupOpen = false;
    }

    init() {
        // Attendre que les tuiles soient créées
        setTimeout(() => {
            this.createNotepadTile();
            this.createPopup();
        }, 1500);
    }

    /* REMPLACEZ la fonction createNotepadTile() dans notepadApp.js (ligne ~18) par : */

createNotepadTile() {
    // Chercher le séparateur "Espace+" 
    const espaceSeparator = Array.from(document.querySelectorAll('.separator'))
        .find(sep => sep && sep.textContent && sep.textContent.includes('Espace+'));
    
    if (!espaceSeparator) {
        console.warn('Séparateur Espace+ non trouvé, nouvelle tentative dans 1 seconde');
        // Réessayer après un délai
        setTimeout(() => this.createNotepadTile(), 1000);
        return;
    }

    // Vérifier si la tuile existe déjà
    if (document.querySelector('.notepad-app-tile')) {
        return; // Ne pas créer de doublon
    }

    // Trouver la tuile Lecteur Radio qui est maintenant dans Espace+
    const radioTile = document.querySelector('.tile[data-category="Espace+"]');
    
    // Créer la tuile Bloc-notes
    const tileElement = document.createElement('div');
    tileElement.className = 'tile notepad-app-tile';
    tileElement.setAttribute('data-category', 'Espace+'); // Changé de 'radio' à 'Espace+'
    
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

    // Insérer après la tuile Radio ou après le séparateur
    if (radioTile) {
        radioTile.insertAdjacentElement('afterend', tileElement);
    } else {
        espaceSeparator.insertAdjacentElement('afterend', tileElement);
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
        this.setupEventListeners();
    }

    // 3. AMÉLIORATION des event listeners pour auto-save plus intelligent
setupEventListeners() {
    // Fermer la popup
    document.getElementById('closeNotepadPopup').addEventListener('click', () => {
        // Sauvegarder avant de fermer
        if (this.currentNoteIndex !== null) {
            this.saveCurrentNote(true);
        }
        this.closePopup();
    });

    // Fermer en cliquant à l'extérieur
    document.getElementById('notepadPopup').addEventListener('click', (e) => {
        if (e.target.id === 'notepadPopup') {
            // Sauvegarder avant de fermer
            if (this.currentNoteIndex !== null) {
                this.saveCurrentNote(true);
            }
            this.closePopup();
        }
    });

    // Ajouter une nouvelle note
    document.getElementById('addNoteBtn').addEventListener('click', () => {
        // Sauvegarder la note actuelle avant d'en créer une nouvelle
        if (this.currentNoteIndex !== null) {
            this.saveCurrentNote(true);
        }
        this.createNewNote();
    });

    // Sauvegarder la note (bouton explicite)
    document.getElementById('saveNoteBtn').addEventListener('click', () => {
        this.saveCurrentNote();
    });

    // Supprimer la note
    document.getElementById('deleteNoteBtn').addEventListener('click', () => {
        this.deleteCurrentNote();
    });

    // Auto-save amélioré pendant la frappe
    let autoSaveTimer;
    const autoSave = () => {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            if (this.currentNoteIndex !== null) {
                this.saveCurrentNote(true); // Sauvegarde silencieuse
                // Afficher un petit indicateur de sauvegarde
                const dateElement = document.getElementById('noteDate');
                const originalText = dateElement.textContent;
                dateElement.textContent = '💾 Sauvegarde automatique...';
                setTimeout(() => {
                    dateElement.textContent = originalText;
                }, 1000);
            }
        }, 2000); // Sauvegarde après 2 secondes d'inactivité
    };

    document.getElementById('noteContent').addEventListener('input', autoSave);
    document.getElementById('noteTitle').addEventListener('input', autoSave);
    
    // Sauvegarder quand on change de note
    document.getElementById('notesList').addEventListener('click', (e) => {
        const noteItem = e.target.closest('.note-item');
        if (noteItem && this.currentNoteIndex !== null) {
            // Sauvegarder la note actuelle avant de changer
            this.saveCurrentNote(true);
        }
    });
    
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
}

    openPopup() {
        const popup = document.getElementById('notepadPopup');
        popup.classList.add('active');
        document.body.classList.add('notepad-popup-open');
        this.popupOpen = true;
        
        // Empêcher le scroll sur mobile
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
        }
        
        this.loadNotesList();
        
        // Charger la première note ou créer une nouvelle
        if (this.notes.length > 0) {
            this.loadNote(0);
        } else {
            this.createNewNote();
        }
    }

    closePopup() {
        const popup = document.getElementById('notepadPopup');
        popup.classList.remove('active');
        document.body.classList.remove('notepad-popup-open');
        this.popupOpen = false;
        
        // Restaurer le scroll
        if (window.innerWidth <= 768) {
            document.body.style.overflow = '';
        }
    }

    loadNotesList() {
        const notesList = document.getElementById('notesList');
        notesList.innerHTML = '';
        
        this.notes.forEach((note, index) => {
            const noteItem = document.createElement('div');
            noteItem.className = 'note-item';
            if (index === this.currentNoteIndex) {
                noteItem.classList.add('active');
            }
            
            noteItem.innerHTML = `
                <div class="note-item-title">${note.title || 'Sans titre'}</div>
                <div class="note-item-preview">${this.truncateText(note.content, 50)}</div>
                <div class="note-item-date">${this.formatDate(note.date)}</div>
            `;
            
            noteItem.addEventListener('click', () => {
                this.loadNote(index);
            });
            
            notesList.appendChild(noteItem);
        });
    }

    // 4. AMÉLIORATION de loadNote pour éviter la perte de données
loadNote(index) {
    if (index < 0 || index >= this.notes.length) return;
    
    // Sauvegarder la note actuelle avant de charger une nouvelle
    if (this.currentNoteIndex !== null && this.currentNoteIndex !== index) {
        this.saveCurrentNote(true);
    }
    
    this.currentNoteIndex = index;
    const note = this.notes[index];
    
    document.getElementById('noteTitle').value = note.title || '';
    document.getElementById('noteContent').value = note.content || '';
    document.getElementById('noteDate').textContent = `Modifié le ${this.formatDate(note.date)}`;
    
    // Mettre à jour la liste
    this.updateNotesList();
    
    // Focus sur la zone de texte
    setTimeout(() => {
        document.getElementById('noteContent').focus();
    }, 100);
}

    createNewNote() {
        const newNote = {
            title: '',
            content: '',
            date: new Date().toISOString()
        };
        
        this.notes.unshift(newNote);
        this.currentNoteIndex = 0;
        
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        document.getElementById('noteDate').textContent = 'Nouvelle note';
        
        this.saveToLocalStorage();
        this.loadNotesList();
        
        // Focus sur le titre
        document.getElementById('noteTitle').focus();
    }

    // 2. AMÉLIORATION de la sauvegarde (déjà présente mais améliorée)
saveCurrentNote(silent = false) {
    if (this.currentNoteIndex === null) return;
    
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value;
    
    // Vérifier si la note a changé
    const currentNote = this.notes[this.currentNoteIndex];
    if (currentNote.title === title && currentNote.content === content) {
        // Pas de changement, pas besoin de sauvegarder
        return;
    }
    
    // Mettre à jour la note
    this.notes[this.currentNoteIndex] = {
        title: title || 'Sans titre',
        content: content,
        date: new Date().toISOString()
    };
    
    this.saveToLocalStorage();
    this.loadNotesList(); // Rafraîchir la liste
    
    // Mettre à jour la date affichée
    document.getElementById('noteDate').textContent = `Modifié le ${this.formatDate(this.notes[this.currentNoteIndex].date)}`;
    
    if (!silent) {
        this.showToast('✅ Note sauvegardée');
    }
}

    deleteCurrentNote() {
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
    }

    updateNotesList() {
        const noteItems = document.querySelectorAll('.note-item');
        noteItems.forEach((item, index) => {
            if (index === this.currentNoteIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    saveToLocalStorage() {
        localStorage.setItem('userNotes', JSON.stringify(this.notes));
    }

    truncateText(text, maxLength) {
        if (!text) return 'Note vide';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    formatDate(dateString) {
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
    }

    showToast(message) {
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
    toast.offsetHeight;
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500); // Plus long pour mobile
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    window.notepadInstance = new NotepadWidget();
    window.notepadInstance.init();
});