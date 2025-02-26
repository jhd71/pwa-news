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

    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('settings');
            return savedSettings ? { ...this.defaultSettings, ...JSON.parse(savedSettings) } : this.defaultSettings;
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error);
            return this.defaultSettings;
        }
    }

    saveSettings() {
        localStorage.setItem('settings', JSON.stringify(this.settings));
        this.applySettings();
    }

    initializeSettings() {
        this.applySettings();
        this.setupSystemPreferences();
    }

    setupSystemPreferences() {
        // Écouter les changements de thème système
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.settings.theme.mode = e.matches ? 'dark' : 'light';
                this.applySettings();
            }
        });

        // Écouter les préférences de mouvement réduit
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            if (!localStorage.getItem('reducedMotion')) {
                this.settings.accessibility.reducedMotion = e.matches;
                this.applySettings();
            }
        });
    }

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
    }

    showSettings() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = this.createSettingsModalContent();
        
        document.body.appendChild(modal);
        this.setupSettingsEventListeners(modal);
    }

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
                        <label>
                            <input type="checkbox" id="reducedMotion" 
                                ${this.settings.accessibility.reducedMotion ? 'checked' : ''}>
                            Réduire les animations
                        </label>
                        <label>
                            <input type="checkbox" id="highContrast" 
                                ${this.settings.accessibility.highContrast ? 'checked' : ''}>
                            Contraste élevé
                        </label>
                    </section>

                    <section class="settings-section">
                        <h4>Notifications</h4>
                        <label>
                            <input type="checkbox" id="notificationsEnabled" 
                                ${this.settings.notifications.enabled ? 'checked' : ''}>
                            Activer les notifications
                        </label>
                        <label>
                            <input type="checkbox" id="notificationsSound" 
                                ${this.settings.notifications.sound ? 'checked' : ''}>
                            Son de notification
                        </label>
                        <label>
                            <input type="checkbox" id="notificationsDesktop" 
                                ${this.settings.notifications.desktop ? 'checked' : ''}>
                            Notifications bureau
                        </label>
                    </section>

                    <section class="settings-section">
                        <h4>Données</h4>
                        <div class="settings-buttons">
                            <button id="exportSettings">Exporter les paramètres</button>
                            <button id="importSettings">Importer les paramètres</button>
                            <button id="resetSettings">Réinitialiser les paramètres</button>
                        </div>
                        <input type="file" id="importInput" accept=".json" hidden>
                    </section>
                </div>
            </div>
        `;
    }

    setupSettingsEventListeners(modal) {
        // Fermeture de la modale
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

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
                    this.settings.theme.mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 
                        'dark' : 'light';
                } else {
                    this.settings.theme.mode = input.value;
                    localStorage.setItem('theme', input.value);
                }
                this.saveSettings();
            });
        });
// Gestion des tuiles de taille de police
modal.querySelectorAll('.font-size-tile').forEach(tile => {
    tile.addEventListener('click', () => {
        const size = tile.dataset.size;
        this.settings.theme.fontSize = size;
        // Mettre à jour l'UI
        modal.querySelectorAll('.font-size-tile').forEach(t => 
            t.classList.toggle('active', t.dataset.size === size)
        );
        this.saveSettings();
    });
});

// Fermeture au clic à l'extérieur
document.addEventListener('click', (e) => {
    if (!modal.contains(e.target) && !e.target.matches('#settingsButton, #settingsButton *')) {
        modal.remove();
    }
}, { once: true });
        // Affichage
        ['showFavorites', 'showRecent', 'compactMode'].forEach(id => {
            const input = modal.querySelector(`#${id}`);
            input.addEventListener('change', () => {
                this.settings.display[id] = input.checked;
                this.saveSettings();
            });
        });

        // Taille de police
        modal.querySelector('#fontSize').addEventListener('change', (e) => {
            this.settings.theme.fontSize = e.target.value;
            this.saveSettings();
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
                this.settings.notifications[key] = input.checked;
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
                modal.remove();
            }
        });
    }

    async exportSettings() {
        const settingsBlob = new Blob([JSON.stringify(this.settings, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(settingsBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jhd71-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async importSettings(file) {
        try {
            const text = await file.text();
            const newSettings = JSON.parse(text);
            this.settings = { ...this.defaultSettings, ...newSettings };
            this.saveSettings();
            location.reload();
        } catch (error) {
            console.error('Erreur lors de l\'importation des paramètres:', error);
            alert('Erreur lors de l\'importation des paramètres');
        }
    }

    resetSettings() {
        this.settings = { ...this.defaultSettings };
        this.saveSettings();
        location.reload();
    }

    // Getters
    getTheme() {
        return this.settings.theme.mode;
    }

    isReducedMotion() {
        return this.settings.accessibility.reducedMotion;
    }

    isHighContrast() {
        return this.settings.accessibility.highContrast;
    }

    areNotificationsEnabled() {
        return this.settings.notifications.enabled;
    }
}