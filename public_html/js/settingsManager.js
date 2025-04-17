/**
 * SettingsManager - Gère les préférences utilisateur pour Actu&Média
 * Responsable de la sauvegarde, du chargement et de l'application des paramètres de thème, 
 * d'accessibilité et d'affichage
 */
import { showToast, isSystemDarkMode, debounce, animateElement } from './utils.js';

export class SettingsManager {
    constructor() {
        this.defaultSettings = {
            theme: {
                mode: 'light',
                colors: {
                    primary: '#1e3a8a',
                    gradientStart: '#1e3a8a',
                    gradientEnd: '#1e1b4b'
                },
                fontSize: 'normal',
                layout: 'standard'
            },
            accessibility: {
                reducedMotion: false,
                highContrast: false,
                largeText: false
            },
            display: {
                showFavorites: true,
                showRecent: true,
                compactMode: false
            },
            notifications: {
                enabled: true,
                sound: true,
                desktop: true
            }
        };

        this.settings = this.loadSettings();
        this.initializeSettings();
    }

    /**
     * Charge les paramètres depuis le stockage local
     * @returns {Object} Les paramètres chargés, fusionnés avec les paramètres par défaut
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('settings');
            return savedSettings ? { ...this.defaultSettings, ...JSON.parse(savedSettings) } : this.defaultSettings;
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error);
            return this.defaultSettings;
        }
    }

    /**
     * Sauvegarde les paramètres dans le stockage local et les applique
     */
    saveSettings() {
        localStorage.setItem('settings', JSON.stringify(this.settings));
        this.applySettings();
    }

    /**
     * Initialise les paramètres et configure les préférences système
     */
    initializeSettings() {
        this.applySettings();
        this.setupSystemPreferences();
    }

    /**
     * Configure les écouteurs pour les préférences système (thème sombre, mouvement réduit)
     */
    setupSystemPreferences() {
        // Écouter les changements de thème système
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.settings.theme.mode = e.matches ? 'dark' : 'light';
                this.applySettings();
            }
        });

        // Utiliser le thème système si aucun n'est défini
        if (!localStorage.getItem('theme')) {
            this.settings.theme.mode = isSystemDarkMode() ? 'dark' : 'light';
        }

        // Écouter les préférences de mouvement réduit
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            if (!localStorage.getItem('reducedMotion')) {
                this.settings.accessibility.reducedMotion = e.matches;
                this.applySettings();
            }
        });
    }

    /**
     * Applique les paramètres actuels au DOM
     */
    applySettings() {
        // Appliquer le thème
        document.documentElement.dataset.theme = this.settings.theme.mode;
        
        // Appliquer les couleurs personnalisées
        const root = document.documentElement;
        root.style.setProperty('--primary-color', this.settings.theme.colors.primary);
        root.style.setProperty('--gradient-start', this.settings.theme.colors.gradientStart);
        root.style.setProperty('--gradient-end', this.settings.theme.colors.gradientEnd);

        // Appliquer la taille de police
        let fontSizeMultiplier;
        switch (this.settings.theme.fontSize) {
            case 'small': fontSizeMultiplier = '0.875'; break;
            case 'large': fontSizeMultiplier = '1.125'; break;
            default: fontSizeMultiplier = '1';
        }
        root.style.setProperty('--font-size-base', `calc(16px * ${fontSizeMultiplier})`);

        // Appliquer les paramètres d'accessibilité
        document.body.classList.toggle('reduced-motion', this.settings.accessibility.reducedMotion);
        document.body.classList.toggle('high-contrast', this.settings.accessibility.highContrast);
        document.body.classList.toggle('large-text', this.settings.accessibility.largeText);

        // Appliquer les paramètres d'affichage
        document.body.classList.toggle('compact', this.settings.display.compactMode);
        
        // Émettre un événement personnalisé pour informer les autres composants
        window.dispatchEvent(new CustomEvent('settings-updated', {
            detail: { settings: this.settings }
        }));
    }

    /**
     * Affiche la modale des paramètres
     */
    showSettings() {
        // Supprimer la modale existante si elle existe
        const existingModal = document.querySelector('.settings-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal settings-modal';
        modal.innerHTML = this.createSettingsModalContent();
        
        document.body.appendChild(modal);
        
        // Animation d'entrée avec la fonction utilitaire
        animateElement(modal, {
            opacity: '1',
            visibility: 'visible'
        }, 300);
        
        this.setupSettingsEventListeners(modal);
    }

    /**
     * Crée le contenu HTML de la modale des paramètres
     * @returns {string} Le contenu HTML
     */
    createSettingsModalContent() {
        return `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Paramètres</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="settings-content">
                    <section class="settings-section">
                        <h4>Thème</h4>
                        <div class="color-picker">
                            <label>
                                Couleur principale
                                <input type="color" id="primaryColor" value="${this.settings.theme.colors.primary}">
                            </label>
                            <label>
                                Dégradé début
                                <input type="color" id="gradientStart" value="${this.settings.theme.colors.gradientStart}">
                            </label>
                            <label>
                                Dégradé fin
                                <input type="color" id="gradientEnd" value="${this.settings.theme.colors.gradientEnd}">
                            </label>
                        </div>
                        <div class="theme-mode">
                            <label>
                                <input type="radio" name="themeMode" value="light" 
                                    ${this.settings.theme.mode === 'light' ? 'checked' : ''}>
                                Clair
                            </label>
                            <label>
                                <input type="radio" name="themeMode" value="dark" 
                                    ${this.settings.theme.mode === 'dark' ? 'checked' : ''}>
                                Sombre
                            </label>
                            <label>
                                <input type="radio" name="themeMode" value="system" 
                                    ${!localStorage.getItem('theme') ? 'checked' : ''}>
                                Système
                            </label>
                        </div>
                    </section>

                    <section class="settings-section">
                        <h4 style="text-align: center;">Taille du texte</h4>
                        <div class="settings-tiles-container">
                            <div class="font-size-tile ${this.settings.theme.fontSize === 'small' ? 'active' : ''}" 
                                data-size="small">
                                <span class="material-icons">text_decrease</span>
                                <span>S</span>
                            </div>
                            <div class="font-size-tile ${this.settings.theme.fontSize === 'normal' ? 'active' : ''}" 
                                data-size="normal">
                                <span class="material-icons">text_fields</span>
                                <span>M</span>
                            </div>
                            <div class="font-size-tile ${this.settings.theme.fontSize === 'large' ? 'active' : ''}" 
                                data-size="large">
                                <span class="material-icons">text_increase</span>
                                <span>L</span>
                            </div>
                        </div>
                    </section>
                    
                    <section class="settings-section">
                        <h4>Accessibilité</h4>
                        <label class="switch-label">
                            <span>Réduire les animations</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="reducedMotion" 
                                    ${this.settings.accessibility.reducedMotion ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </div>
                        </label>
                        <label class="switch-label">
                            <span>Contraste élevé</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="highContrast" 
                                    ${this.settings.accessibility.highContrast ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </div>
                        </label>
                    </section>

                    <section class="settings-section">
                        <h4>Notifications</h4>
                        <label class="switch-label">
                            <span>Activer les notifications</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="notificationsEnabled" 
                                    ${this.settings.notifications.enabled ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </div>
                        </label>
                        <label class="switch-label">
                            <span>Son de notification</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="notificationsSound" 
                                    ${this.settings.notifications.sound ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </div>
                        </label>
                        <label class="switch-label">
                            <span>Notifications bureau</span>
                            <div class="toggle-switch">
                                <input type="checkbox" id="notificationsDesktop" 
                                    ${this.settings.notifications.desktop ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </div>
                        </label>
                    </section>

                    <section class="settings-section">
                        <h4>Données</h4>
                        <div class="settings-buttons">
                            <button id="exportSettings" class="btn primary">
                                <span class="material-icons">download</span>
                                Exporter les paramètres
                            </button>
                            <button id="importSettings" class="btn secondary">
                                <span class="material-icons">upload</span>
                                Importer les paramètres
                            </button>
                            <button id="resetSettings" class="btn danger">
                                <span class="material-icons">refresh</span>
                                Réinitialiser
                            </button>
                        </div>
                        <input type="file" id="importInput" accept=".json" hidden>
                    </section>
                </div>
            </div>
        `;
    }

    /**
     * Configure les écouteurs d'événements pour la modale des paramètres
     * @param {HTMLElement} modal - L'élément modal
     */
    setupSettingsEventListeners(modal) {
        // Fermeture de la modale avec animation
        const closeModal = () => {
            animateElement(modal, {
                opacity: '0',
                visibility: 'hidden'
            }, 300).then(() => {
                modal.remove();
            });
        };
        
        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        // Touche Echap pour fermer
        const escKeyHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escKeyHandler);
            }
        };
        document.addEventListener('keydown', escKeyHandler);

        // Couleurs
        ['primaryColor', 'gradientStart', 'gradientEnd'].forEach(id => {
            const input = modal.querySelector(`#${id}`);
            input.addEventListener('change', () => {
                this.settings.theme.colors[id.charAt(0).toLowerCase() + id.slice(1)] = input.value;
                this.saveSettings();
            });
        });

        // Thème
        modal.querySelectorAll('input[name="themeMode"]').forEach(input => {
            input.addEventListener('change', () => {
                if (input.value === 'system') {
                    localStorage.removeItem('theme');
                    this.settings.theme.mode = isSystemDarkMode() ? 'dark' : 'light';
                } else {
                    this.settings.theme.mode = input.value;
                    localStorage.setItem('theme', input.value);
                }
                this.saveSettings();
            });
        });

        // Gestion des tuiles de taille de police avec debounce pour éviter les multiples déclenchements
        modal.querySelectorAll('.font-size-tile').forEach(tile => {
            tile.addEventListener('click', debounce(() => {
                const size = tile.dataset.size;
                this.settings.theme.fontSize = size;
                // Mettre à jour l'UI
                modal.querySelectorAll('.font-size-tile').forEach(t => 
                    t.classList.toggle('active', t.dataset.size === size)
                );
                this.saveSettings();
            }, 300));
        });

        // Accessibilité
        ['reducedMotion', 'highContrast'].forEach(id => {
            const input = modal.querySelector(`#${id}`);
            input.addEventListener('change', () => {
                this.settings.accessibility[id] = input.checked;
                this.saveSettings();
            });
        });

        // Notifications
        ['notificationsEnabled', 'notificationsSound', 'notificationsDesktop'].forEach(id => {
            const input = modal.querySelector(`#${id}`);
            input.addEventListener('change', () => {
                const key = id.replace('notifications', '').toLowerCase();
                this.settings.notifications[key === 'enabled' ? key : key.toLowerCase()] = input.checked;
                this.saveSettings();
            });
        });

        // Gestion des données
        modal.querySelector('#exportSettings').addEventListener('click', () => this.exportSettings());
        modal.querySelector('#importSettings').addEventListener('click', () => {
            modal.querySelector('#importInput').click();
        });
        modal.querySelector('#importInput').addEventListener('change', (e) => {
            this.importSettings(e.target.files[0]);
        });
        modal.querySelector('#resetSettings').addEventListener('click', () => {
            if (confirm('Voulez-vous vraiment réinitialiser tous les paramètres ?')) {
                this.resetSettings();
                closeModal();
            }
        });
    }

    /**
     * Exporte les paramètres dans un fichier JSON
     */
    async exportSettings() {
        const settingsBlob = new Blob([JSON.stringify(this.settings, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(settingsBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `actuetmedia-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Importe les paramètres depuis un fichier JSON
     * @param {File} file - Le fichier à importer
     */
    async importSettings(file) {
        try {
            const text = await file.text();
            const newSettings = JSON.parse(text);
            this.settings = { ...this.defaultSettings, ...newSettings };
            this.saveSettings();
            
            // Feedback visuel avec la fonction utilitaire
            showToast('Paramètres importés avec succès', 3000, 'success');
            
            setTimeout(() => location.reload(), 1000);
        } catch (error) {
            console.error('Erreur lors de l\'importation des paramètres:', error);
            
            // Feedback d'erreur avec la fonction utilitaire
            showToast('Erreur lors de l\'importation des paramètres', 3000, 'error');
        }
    }

    /**
     * Réinitialise les paramètres aux valeurs par défaut
     */
    resetSettings() {
        this.settings = { ...this.defaultSettings };
        this.saveSettings();
        
        // Feedback visuel avec la fonction utilitaire
        showToast('Paramètres réinitialisés', 3000, 'info');
        
        setTimeout(() => location.reload(), 1000);
    }

    /**
     * Retourne le thème actuel
     * @returns {string} Le mode de thème ('light' ou 'dark')
     */
    getTheme() {
        return this.settings.theme.mode;
    }

    /**
     * Indique si le mode motion réduit est activé
     * @returns {boolean} 
     */
    isReducedMotion() {
        return this.settings.accessibility.reducedMotion;
    }

    /**
     * Indique si le mode contraste élevé est activé
     * @returns {boolean}
     */
    isHighContrast() {
        return this.settings.accessibility.highContrast;
    }

    /**
     * Indique si les notifications sont activées
     * @returns {boolean}
     */
    areNotificationsEnabled() {
        return this.settings.notifications.enabled;
    }
}

// Code pour initialiser automatiquement le gestionnaire de paramètres
// et associer le bouton de paramètres
document.addEventListener('DOMContentLoaded', () => {
    // Créer une instance du gestionnaire
    window.settingsManager = new SettingsManager();
    
    // Associer le bouton de paramètres
    const settingsButton = document.getElementById('settingsButton');
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            window.settingsManager.showSettings();
        });
    }
    
    // Associer le bouton de mode sombre dans la barre de navigation
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            // Inverser le thème actuel
            const currentTheme = window.settingsManager.getTheme();
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            // Mettre à jour les paramètres
            window.settingsManager.settings.theme.mode = newTheme;
            localStorage.setItem('theme', newTheme);
            window.settingsManager.saveSettings();
            
            // Mettre à jour l'icône et le texte du bouton
            const icon = darkModeToggle.querySelector('.material-icons');
            const text = darkModeToggle.querySelector('span:not(.material-icons)');
            
            if (icon) {
                icon.textContent = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
            }
            
            if (text) {
                text.textContent = newTheme === 'dark' ? 'Clair' : 'Sombre';
            }
        });
        
        // Initialiser le texte et l'icône du bouton en fonction du thème actuel
        const currentTheme = window.settingsManager.getTheme();
        const icon = darkModeToggle.querySelector('.material-icons');
        const text = darkModeToggle.querySelector('span:not(.material-icons)');
        
        if (icon) {
            icon.textContent = currentTheme === 'dark' ? 'light_mode' : 'dark_mode';
        }
        
        if (text) {
            text.textContent = currentTheme === 'dark' ? 'Clair' : 'Sombre';
        }
    }
});