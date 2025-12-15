class MemoryGame {
    constructor() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.isProcessing = false;
        this.difficulty = 'easy';
        
        // Icônes Material Icons pour les cartes
        this.icons = [
            'favorite', 'star', 'pets', 'emoji_emotions',
            'local_florist', 'wb_sunny', 'nightlight', 'cloud',
            'ac_unit', 'park', 'water_drop', 'local_fire_department'
        ];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.startNewGame();
    }

    setupEventListeners() {
        // Bouton restart
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.startNewGame();
        });

        // Boutons de difficulté
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.difficulty = e.currentTarget.dataset.difficulty;
                this.startNewGame();
            });
        });

        // Modal
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.closeModal();
            this.startNewGame();
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

    startNewGame() {
        // Reset game state
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.timer = 0;
        this.isProcessing = false;

        // Clear timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        // Update UI
        this.updateStats();

        // Create cards
        this.createCards();

        // Start timer
        this.startTimer();
    }

    createCards() {
        const board = document.getElementById('gameBoard');
        board.innerHTML = '';

        // Nombre de paires selon difficulté
        let pairCount;
        switch(this.difficulty) {
            case 'easy':
                pairCount = 8;
                board.className = 'game-board easy';
                break;
            case 'medium':
                pairCount = 10;
                board.className = 'game-board medium';
                break;
            case 'hard':
                pairCount = 12;
                board.className = 'game-board hard';
                break;
        }

        // Créer les paires
        const selectedIcons = this.icons.slice(0, pairCount);
        const cardValues = [...selectedIcons, ...selectedIcons];
        
        // Mélanger
        cardValues.sort(() => Math.random() - 0.5);

        // Créer les éléments HTML
        this.cards = cardValues.map((icon, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.icon = icon;
            card.dataset.index = index;
            
				card.innerHTML = `
		<div class="card-front">
			<span class="material-icons">help_outline</span>
		</div>
		<div class="card-back">
			<span class="material-icons">${icon}</span>
		</div>
	`;

            card.addEventListener('click', () => this.flipCard(card));
            board.appendChild(card);
            
            return card;
        });
    }

    flipCard(card) {
        // Vérifications
        if (this.isProcessing) return;
        if (card.classList.contains('flipped')) return;
        if (card.classList.contains('matched')) return;
        if (this.flippedCards.length >= 2) return;

        // Retourner la carte
        card.classList.add('flipped');
        this.flippedCards.push(card);

        // Vibration
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }

        // Vérifier si 2 cartes retournées
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateStats();
            this.checkMatch();
        }
    }

    checkMatch() {
    this.isProcessing = true;
    const [card1, card2] = this.flippedCards;

    if (card1.dataset.icon === card2.dataset.icon) {
        // Match !
        setTimeout(() => {
            card1.classList.add('matched');
            card2.classList.add('matched');
            card1.classList.add('flipped');
            card2.classList.add('flipped');
            this.matchedPairs++;
            this.updateStats();
            this.flippedCards = [];
            this.isProcessing = false;

                // Vibration de succès
                if (navigator.vibrate) {
                    navigator.vibrate([50, 50, 50]);
                }

                // Vérifier si jeu terminé
                this.checkWin();
            }, 500);
        } else {
            // Pas de match
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                this.flippedCards = [];
                this.isProcessing = false;
            }, 1000);
        }
    }

    checkWin() {
        let totalPairs;
        switch(this.difficulty) {
            case 'easy': totalPairs = 8; break;
            case 'medium': totalPairs = 10; break;
            case 'hard': totalPairs = 12; break;
        }

        if (this.matchedPairs === totalPairs) {
            clearInterval(this.timerInterval);
            setTimeout(() => this.showWinModal(), 500);
        }
    }

    showWinModal() {
        const modal = document.getElementById('winModal');
        document.getElementById('finalTime').textContent = this.formatTime(this.timer);
        document.getElementById('finalMoves').textContent = `${this.moves} coups`;
        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('winModal').classList.remove('active');
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            document.getElementById('timer').textContent = this.formatTime(this.timer);
        }, 1000);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateStats() {
        document.getElementById('moves').textContent = this.moves;
        
        let totalPairs;
        switch(this.difficulty) {
            case 'easy': totalPairs = 8; break;
            case 'medium': totalPairs = 10; break;
            case 'hard': totalPairs = 12; break;
        }
        
        document.getElementById('pairs').textContent = `${this.matchedPairs}/${totalPairs}`;
    }
}

// Initialiser le jeu
const game = new MemoryGame();