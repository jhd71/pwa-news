class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Configuration de la grille
        this.gridSize = 20;
        this.tileCount = 20;
        
        // État du jeu
        this.snake = [];
        this.food = {};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('snakeBestScore')) || 0;
        this.isPlaying = false;
        this.gameLoop = null;
        this.speed = 'normal';
        
        // Vitesses (ms entre chaque frame)
		this.speeds = {
		slow: 300,     // Vraiment lent pour débuter
		normal: 200,   // Vitesse confortable
		fast: 125       // Rapide mais jouable
	};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.updateUI();
        this.resetGame();
        this.drawGame();
    }

    setupEventListeners() {
        // Clavier
        document.addEventListener('keydown', (e) => {
            if (!this.isPlaying && e.code === 'Space') {
                this.startGame();
                return;
            }
            
            if (this.isPlaying) {
                this.handleKeyPress(e);
            }
        });

        // Overlay
        document.getElementById('gameOverlay').addEventListener('click', () => {
            this.startGame();
        });

        // Boutons de vitesse
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.isPlaying) return;
                
                document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.speed = e.currentTarget.dataset.speed;
                this.updateSpeedDisplay();
            });
        });

        // Contrôles mobiles
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const direction = e.currentTarget.dataset.direction;
                this.handleMobileControl(direction);
            });
        });

        // Touch/Swipe
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            if (!this.isPlaying) {
                this.startGame();
                return;
            }
            
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        this.canvas.addEventListener('touchend', (e) => {
            if (!this.isPlaying) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Mouvement horizontal
                if (deltaX > 30 && this.dx === 0) {
                    this.dx = 1;
                    this.dy = 0;
                } else if (deltaX < -30 && this.dx === 0) {
                    this.dx = -1;
                    this.dy = 0;
                }
            } else {
                // Mouvement vertical
                if (deltaY > 30 && this.dy === 0) {
                    this.dy = 1;
                    this.dx = 0;
                } else if (deltaY < -30 && this.dy === 0) {
                    this.dy = -1;
                    this.dx = 0;
                }
            }
        }, { passive: true });

        // Modal
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.closeModal();
            document.getElementById('gameInfo').textContent = 'Choisissez la vitesse et touchez pour commencer';
        });

        document.getElementById('closeModalBtn').addEventListener('click', () => {
            window.location.href = '/';
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.cycleTheme();
        });
    }

    handleKeyPress(e) {
        const key = e.code;
        
        // Empêcher le défilement de la page
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            e.preventDefault();
        }

        switch(key) {
            case 'ArrowUp':
                if (this.dy === 0) {
                    this.dx = 0;
                    this.dy = -1;
                }
                break;
            case 'ArrowDown':
                if (this.dy === 0) {
                    this.dx = 0;
                    this.dy = 1;
                }
                break;
            case 'ArrowLeft':
                if (this.dx === 0) {
                    this.dx = -1;
                    this.dy = 0;
                }
                break;
            case 'ArrowRight':
                if (this.dx === 0) {
                    this.dx = 1;
                    this.dy = 0;
                }
                break;
        }
    }

    handleMobileControl(direction) {
        if (!this.isPlaying) return;

        switch(direction) {
            case 'up':
                if (this.dy === 0) {
                    this.dx = 0;
                    this.dy = -1;
                }
                break;
            case 'down':
                if (this.dy === 0) {
                    this.dx = 0;
                    this.dy = 1;
                }
                break;
            case 'left':
                if (this.dx === 0) {
                    this.dx = -1;
                    this.dy = 0;
                }
                break;
            case 'right':
                if (this.dx === 0) {
                    this.dx = 1;
                    this.dy = 0;
                }
                break;
        }
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
        this.resetGame();
        this.isPlaying = true;
        document.getElementById('gameOverlay').classList.add('hidden');
        document.getElementById('gameInfo').textContent = 'C\'est parti !';
        
        this.gameLoop = setInterval(() => {
            this.update();
            this.drawGame();
        }, this.speeds[this.speed]);
    }

    resetGame() {
        // Position initiale du serpent
        this.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        
        this.dx = 1;
        this.dy = 0;
        this.score = 0;
        this.updateUI();
        this.generateFood();
    }

    update() {
        // Nouvelle tête du serpent
        const head = {
            x: this.snake[0].x + this.dx,
            y: this.snake[0].y + this.dy
        };

        // Vérifier les collisions avec les murs
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }

        // Vérifier les collisions avec soi-même
        for (let segment of this.snake) {
            if (head.x === segment.x && head.y === segment.y) {
                this.gameOver();
                return;
            }
        }

        // Ajouter la nouvelle tête
        this.snake.unshift(head);

        // Vérifier si on mange la nourriture
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            this.updateUI();
            this.generateFood();
            
            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                localStorage.setItem('snakeBestScore', this.bestScore);
            }

            // Vibration
            if (navigator.vibrate) {
                navigator.vibrate(30);
            }
        } else {
            // Retirer la queue si on n'a pas mangé
            this.snake.pop();
        }
    }

    generateFood() {
        let newFood;
        let isValid = false;

        while (!isValid) {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };

            // Vérifier que la nourriture n'est pas sur le serpent
            isValid = true;
            for (let segment of this.snake) {
                if (newFood.x === segment.x && newFood.y === segment.y) {
                    isValid = false;
                    break;
                }
            }
        }

        this.food = newFood;
    }

    drawGame() {
        // Couleurs selon le thème
        const theme = document.documentElement.getAttribute('data-theme');
        let bgColor, snakeColor, foodColor;

        switch(theme) {
            case 'dark':
                bgColor = '#334155';
                snakeColor = '#10b981';
                foodColor = '#f59e0b';
                break;
            case 'bleuciel':
                bgColor = 'white';
                snakeColor = '#0ea5e9';
                foodColor = '#f43f5e';
                break;
            case 'light':
                bgColor = 'white';
                snakeColor = '#7c3aed';
                foodColor = '#ec4899';
                break;
            default: // rouge
                bgColor = 'white';
                snakeColor = '#10b981';
                foodColor = '#ef4444';
        }

        // Nettoyer le canvas
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Dessiner la grille légère
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }

        // Dessiner le serpent
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = snakeColor;
            
            if (index === 0) {
                // Tête plus foncée
                this.ctx.fillStyle = this.darkenColor(snakeColor);
            }
            
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });

        // Dessiner la nourriture
        this.ctx.fillStyle = foodColor;
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    darkenColor(color) {
        const colors = {
            '#10b981': '#059669',
            '#0ea5e9': '#0284c7',
            '#7c3aed': '#6d28d9',
            '#ef4444': '#dc2626'
        };
        return colors[color] || color;
    }

    gameOver() {
        this.isPlaying = false;
        clearInterval(this.gameLoop);
        
        // Vibration
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
        
        setTimeout(() => {
            this.showGameOverModal();
        }, 500);
    }

    showGameOverModal() {
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('modalBestScore').textContent = this.bestScore;
        
        const message = this.score === 0 
            ? 'Vous n\'avez pas mangé !' 
            : this.score < 5 
            ? 'Pas mal pour un début !'
            : this.score < 10 
            ? 'Bien joué !'
            : this.score < 20
            ? 'Excellent !'
            : 'Incroyable !';
            
        document.getElementById('gameOverMessage').textContent = message;
        document.getElementById('gameOverModal').classList.add('active');
        
        // Marquer la vitesse actuelle dans le modal
        document.querySelectorAll('.modal-speed-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.speed === this.speed) {
                btn.classList.add('active');
            }
            
            // Event listener pour changer la vitesse
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.modal-speed-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.speed = e.currentTarget.dataset.speed;
                
                // Mettre à jour les boutons principaux
                document.querySelectorAll('.speed-btn').forEach(b => {
                    b.classList.remove('active');
                    if (b.dataset.speed === this.speed) {
                        b.classList.add('active');
                    }
                });
                
                this.updateSpeedDisplay();
            });
        });
    }

    closeModal() {
        document.getElementById('gameOverModal').classList.remove('active');
        document.getElementById('gameOverlay').classList.remove('hidden');
    }

    updateUI() {
        document.getElementById('currentScore').textContent = this.score;
        document.getElementById('bestScore').textContent = this.bestScore;
        this.updateSpeedDisplay();
    }

    updateSpeedDisplay() {
        const speedText = {
            slow: '0.5x',
            normal: '1x',
            fast: '2x'
        };
        document.getElementById('speed').textContent = speedText[this.speed];
    }
}

// Initialiser le jeu
const game = new SnakeGame();