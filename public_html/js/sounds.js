class SoundManager {
    constructor() {
        this.enabled = localStorage.getItem('soundEnabled') !== 'false';
        this.sounds = new Map();
        this.loaded = false;
        this.loadPromise = this.loadSounds();
    }

    async checkSoundExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.error(`Erreur vérification son ${url}:`, error);
            return false;
        }
    }

    async loadSounds() {
        const soundFiles = {
            'message': '/sounds/message.mp3',
            'notification': '/sounds/notification.mp3',
            'click': '/sounds/click.mp3',
            'error': '/sounds/erreur.mp3',
            'sent': '/sounds/sent.mp3',
            'success': '/sounds/success.mp3'
        };

        for (const [name, path] of Object.entries(soundFiles)) {
            try {
                if (await this.checkSoundExists(path)) {
                    const audio = new Audio(path);
                    await new Promise((resolve, reject) => {
                        audio.addEventListener('loadeddata', () => resolve(), { once: true });
                        audio.addEventListener('error', (e) => reject(e), { once: true });
                    });
                    this.sounds.set(name, audio);
                    console.log(`Son ${name} chargé avec succès`);
                } else {
                    console.warn(`Fichier son ${path} non trouvé`);
                }
            } catch (error) {
                console.error(`Erreur chargement son ${name}:`, error);
            }
        }

        this.loaded = this.sounds.size > 0;
        console.log('Chargement des sons terminé:', this.loaded ? 'succès' : 'échec partiel');
    }

    isEnabled() {
        return this.enabled && this.loaded;
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('soundEnabled', this.enabled);
        return this.enabled;
    }

    async play(soundName) {
        try {
            await this.loadPromise;
            
            if (!this.enabled || !this.sounds.has(soundName)) {
                return;
            }
            
            const sound = this.sounds.get(soundName).cloneNode();
            await sound.play().catch(error => {
                console.warn(`Lecture son ${soundName} impossible:`, error);
            });
        } catch (error) {
            console.error(`Erreur lecture son ${soundName}:`, error);
        }
    }
}

const soundManager = new SoundManager();
export default soundManager;