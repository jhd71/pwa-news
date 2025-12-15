class SimonSays {
    constructor() {
        this.sequence = [];
        this.playerSequence = [];
        this.level = 1;
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('simonBestScore')) || 0;
        this.isPlaying = false;
        this.isShowingSequence = false;
        this.difficulty = 'easy';
        this.soundEnabled = true;
        
        // Vitesses selon difficulté (ms)
		this.speeds = {
		easy: 1000,    // 1 seconde - plus lent
		medium: 650,   // Moyen
		hard: 350      // Très rapide
	};
        
        // Fréquences audio pour chaque couleur
        this.audioContext = null;
        this.frequencies = {
            green: 329.63,   // E4
            red: 261.63,     // C4
            yellow: 392.00,  // G4
            blue: 220.00     // A3
        };
        
        this.init();
    }

    init() {
        this.setupAudio();
        this.setupEventListeners();
        this.setupTheme();
        this.updateUI();
    }

    setupAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    playSound(color) {
        if (!this.soundEnabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = this.frequencies[color];
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    setupEventListeners() {
        // Bouton Start
        document.getElementById('startBtn').addEventListener('click', () => {
            if (!this.isPlaying) {
                this.startGame();
            }
        });

        // Boutons Simon
        document.querySelectorAll('.simon-button').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.isPlaying && !this.isShowingSequence) {
                    const color = btn.dataset.color;
                    this.handlePlayerInput(color);
                }
            });
        });

        // Boutons difficulté
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.isPlaying) return;
                
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.difficulty = e.currentTarget.dataset.difficulty;
            });
        });

        // Toggle son
        document.getElementById('soundToggle').addEventListener('click', (e) => {
            this.soundEnabled = !this.soundEnabled;
            const btn = e.currentTarget;
            const icon = btn.querySelector('.material-icons');
            
            if (this.soundEnabled) {
                icon.textContent = 'volume_up';
                btn.textContent = '';
                btn.appendChild(icon);
                btn.appendChild(document.createTextNode(' Son activé'));
                btn.classList.remove('muted');
            } else {
                icon.textContent = 'volume_off';
                btn.textContent = '';
                btn.appendChild(icon);
                btn.appendChild(document.createTextNode(' Son coupé'));
                btn.classList.add('muted');
            }
        });

        // Modal - Rejouer ferme juste le modal
		document.getElementById('playAgainBtn').addEventListener('click', () => {
			this.closeModal();
		// Ne pas lancer automatiquement, laisser l'utilisateur choisir
    document.getElementById('gameInfo').textContent = 'Choisissez la difficulté et appuyez sur Démarrer';
		});

        document.getElementById('closeModalBtn').addEventListener('click', () => {
            window.location.href = '/';
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.cycleTheme();
        });
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'rouge';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    cycleTheme() {
        const themes = ['rouge', 'dark', 'bleuciel', 'light'];
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const currentIndex = themes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        const nextTheme = themes[nextIndex];
        
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('theme', nextTheme);
    }

    startGame() {
        this.sequence = [];
        this.playerSequence = [];
        this.level = 1;
        this.score = 0;
        this.isPlaying = true;
        
        document.getElementById('startBtn').classList.add('playing');
        document.getElementById('gameInfo').textContent = 'Mémorisez la séquence...';
        
        this.updateUI();
        this.nextRound();
    }

    nextRound() {
        this.playerSequence = [];
        this.addToSequence();
        this.showSequence();
    }

    addToSequence() {
        const colors = ['green', 'red', 'yellow', 'blue'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        this.sequence.push(randomColor);
    }

    async showSequence() {
        this.isShowingSequence = true;
        this.disableButtons();
        
        const speed = this.speeds[this.difficulty];
        
        for (let i = 0; i < this.sequence.length; i++) {
            await this.delay(speed);
            await this.flashButton(this.sequence[i]);
        }
        
        this.isShowingSequence = false;
        this.enableButtons();
        document.getElementById('gameInfo').textContent = 'À votre tour !';
    }

    async flashButton(color) {
        const btn = document.querySelector(`[data-color="${color}"]`);
        btn.classList.add('active');
        this.playSound(color);
        
        await this.delay(300);
        
        btn.classList.remove('active');
    }

    handlePlayerInput(color) {
        this.playerSequence.push(color);
        this.flashButton(color);
        
        const currentIndex = this.playerSequence.length - 1;
        
        // Vérifier si correct
        if (this.playerSequence[currentIndex] !== this.sequence[currentIndex]) {
            this.gameOver();
            return;
        }
        
        // Vérifier si séquence complète
        if (this.playerSequence.length === this.sequence.length) {
            this.score++;
            this.level = this.sequence.length;
            this.updateUI();
            
            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                localStorage.setItem('simonBestScore', this.bestScore);
            }
            
            document.getElementById('gameInfo').textContent = 'Bravo ! Niveau suivant...';
            
            setTimeout(() => {
                this.nextRound();
            }, 1500);
        }
    }

    gameOver() {
        this.isPlaying = false;
        this.disableButtons();
        
        document.getElementById('startBtn').classList.remove('playing');
        document.getElementById('gameInfo').textContent = 'Game Over !';
        
        // Vibration
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 100]);
        }
        
        setTimeout(() => {
            this.showGameOverModal();
        }, 1000);
    }
		
		showGameOverModal() {
    document.getElementById('finalScore').textContent = this.score;
    document.getElementById('modalBestScore').textContent = this.bestScore;
    
    const message = this.score === 0 
        ? 'Essayez encore !' 
        : this.score < 5 
        ? 'Pas mal !'
        : this.score < 10 
        ? 'Bien joué !'
        : 'Excellent !';
        
    document.getElementById('gameOverMessage').textContent = message;
    document.getElementById('gameOverModal').classList.add('active');
    
    // AJOUTER CES LIGNES - Marquer la difficulté actuelle
    document.querySelectorAll('.modal-difficulty-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.difficulty === this.difficulty) {
            btn.classList.add('active');
        }
        
        // Ajouter l'événement de changement
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.modal-difficulty-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            this.difficulty = e.currentTarget.dataset.difficulty;
            
            // Mettre à jour aussi les boutons principaux
            document.querySelectorAll('.difficulty-btn').forEach(b => {
                b.classList.remove('active');
                if (b.dataset.difficulty === this.difficulty) {
                    b.classList.add('active');
                }
            });
        });
    });
}
    

    closeModal() {
        document.getElementById('gameOverModal').classList.remove('active');
    }

    disableButtons() {
        document.querySelectorAll('.simon-button').forEach(btn => {
            btn.classList.add('disabled');
        });
    }

    enableButtons() {
        document.querySelectorAll('.simon-button').forEach(btn => {
            btn.classList.remove('disabled');
        });
    }

    updateUI() {
        document.getElementById('currentScore').textContent = this.score;
        document.getElementById('bestScore').textContent = this.bestScore;
        document.getElementById('level').textContent = this.level;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialiser le jeu
const game = new SimonSays();