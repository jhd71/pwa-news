// quiz-local.js - Quiz avec Supabase
if (typeof window.QuizLocal === 'undefined') {
    class QuizLocal {
        constructor() {
            this.currentQuiz = null;
            this.currentQuestion = 0;
            this.score = 0;
            this.answers = [];
            this.timeLeft = 20;
            this.timer = null;
            this.playerName = localStorage.getItem('quizUsername') || '';
            this.supabaseClient = null;
            
            // 10 questions
            this.quizData = {
                week: this.getCurrentWeek(),
                title: "Quiz de la semaine",
                questions: [
                    {
                        question: "Quelle est la population approximative de Montceau-les-Mines?",
                        options: ["15 000 habitants", "19 000 habitants", "25 000 habitants", "30 000 habitants"],
                        correct: 1,
                        points: 10
                    },
                    {
                        question: "Dans quel département se trouve Montceau-les-Mines?",
                        options: ["Côte-d'Or", "Saône-et-Loire", "Nièvre", "Yonne"],
                        correct: 1,
                        points: 10
                    },
                    {
                        question: "Quel est le nom du maire actuel de Montceau?",
                        options: ["Marie Durand", "Jean Martin", "Marie-Claude Jarrot", "Pierre Dubois"],
                        correct: 2,
                        points: 10
                    },
                    {
                        question: "Quelle rivière traverse Montceau-les-Mines?",
                        options: ["La Saône", "La Bourbince", "La Loire", "L'Arroux"],
                        correct: 1,
                        points: 10
                    },
                    {
                        question: "Quel sport est particulièrement populaire à Montceau?",
                        options: ["Le tennis", "Le rugby", "Le football", "Le handball"],
                        correct: 2,
                        points: 10
                    },
                    {
                        question: "Quelle était l'activité historique principale de Montceau?",
                        options: ["L'agriculture", "Le textile", "L'extraction minière", "La métallurgie"],
                        correct: 2,
                        points: 10
                    },
                    {
                        question: "En quelle année les dernières mines ont-elles fermé?",
                        options: ["1992", "2000", "1985", "2008"],
                        correct: 0,
                        points: 10
                    },
                    {
                        question: "Quel est le nom du lac proche de Montceau?",
                        options: ["Lac du Plessis", "Lac de Torcy", "Lac du Creusot", "Lac de Chalon"],
                        correct: 0,
                        points: 10
                    },
                    {
                        question: "Combien de communes compte la communauté urbaine?",
                        options: ["27", "34", "42", "51"],
                        correct: 1,
                        points: 10
                    },
                    {
                        question: "Quel célèbre musée se trouve à Montceau?",
                        options: ["Musée des Beaux-Arts", "Musée de la Mine", "Musée de la Photographie", "Musée du Vin"],
                        correct: 1,
                        points: 10
                    }
                ]
            };
        }
        
        async initSupabase() {  // CORRECTION ICI - async était manquant
            if (!this.supabaseClient && window.getSupabaseClient) {
                this.supabaseClient = window.getSupabaseClient();
            }
        }
        
        getCurrentWeek() {
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 1);
            const diff = now - start;
            const oneWeek = 1000 * 60 * 60 * 24 * 7;
            return Math.floor(diff / oneWeek);
        }
        
        init() {
            this.initSupabase();
        }
        
		getDeviceId() {
    let deviceId = localStorage.getItem('quiz_device_id');
    if (!deviceId) {
        // Créer un fingerprint plus stable basé sur les caractéristiques du navigateur
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 0,
            navigator.platform
        ].join('|');
        
        // Hash simple du fingerprint
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        deviceId = 'device_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
        localStorage.setItem('quiz_device_id', deviceId);
    }
    return deviceId;
}

        // quiz-local.js

async canPlayThisWeek() {
    const currentWeek = this.getCurrentWeek().toString();
    
    // 1. VÉRIFICATION DE L'IP EN PREMIER (la plus fiable)
    const ipOk = await this.checkIPLimit(currentWeek);
    if (!ipOk) {
        // L'alerte est déjà gérée dans checkIPLimit
        return false; // Bloque immédiatement si la limite d'IP est atteinte
    }
    
    // 2. ENSUITE, VÉRIFICATION DU PSEUDO (si un pseudo est connu)
    let username = localStorage.getItem('quizUsername') || '';
    
    // Essayer de récupérer le pseudo depuis le champ de saisie s'il est vide
    if (!username) {
        const inputField = document.getElementById('quizUsername');
        if (inputField && inputField.value) {
            username = inputField.value.trim();
        }
    }
    
    // Si on a un pseudo, on vérifie s'il a déjà joué
    if (username) {
        const canPlayByUsername = await this.checkServerParticipation(username, currentWeek);
        if (!canPlayByUsername) {
            // Ce pseudo a déjà joué, on met à jour le local storage au cas où et on bloque
            localStorage.setItem('lastQuizWeek', currentWeek);
            localStorage.setItem('quizUsername', username);
            return false;
        }
    }
    
    // Si la limite d'IP n'est pas atteinte ET que le pseudo (s'il existe) n'a pas joué, alors c'est bon
    return true;
}

	async checkServerParticipation(username, weekNumber) {
    if (!this.supabaseClient) {
        await this.initSupabase();
    }
    
    if (!this.supabaseClient) return true; // Si pas de connexion, on autorise
    
    try {
        const { data, error } = await this.supabaseClient
            .from('quiz_participations')
            .select('id')
            .eq('username', username)
            .eq('week_number', parseInt(weekNumber));
        
        // Si on trouve au moins une participation, le joueur a déjà joué
        if (data && data.length > 0) {
            console.log('Participation trouvée pour', username, 'semaine', weekNumber);
            return false; // NE PEUT PAS jouer
        }
        
        // Si aucune participation trouvée
        console.log('Aucune participation trouvée pour', username, 'semaine', weekNumber);
        return true; // PEUT jouer
        
    } catch (e) {
        console.error('Erreur vérification participation:', e);
        return true; // En cas d'erreur, on autorise par défaut
    }

}
     
	 async checkDeviceLimit(deviceId, weekNumber) {
    if (!this.supabaseClient) {
        await this.initSupabase();
    }
    
    if (!this.supabaseClient) return true;
    
    try {
        const { data } = await this.supabaseClient
            .from('quiz_participations')
            .select('id')
            .eq('device_id', deviceId)
            .eq('week_number', parseInt(weekNumber));
        
        // Maximum 3 participations par appareil par semaine
        const limit = 3;
        
        if (data && data.length >= limit) {
            console.log(`Limite atteinte: ${data.length} participations sur cet appareil`);
            return false;
        }
        
        console.log(`${data ? data.length : 0} participation(s) sur cet appareil`);
        return true;
        
    } catch (e) {
        console.error('Erreur vérification limite appareil:', e);
        return true; // En cas d'erreur, on autorise
    }
}

	 async recordParticipation() {
    if (!this.playerName) return;
    
    if (!this.supabaseClient) {
        await this.initSupabase();
    }
    
    if (!this.supabaseClient) return;
    
    try {
        let ipAddress = '';
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            ipAddress = data.ip;
        } catch (e) {
            console.log('IP non récupérée');
        }
        
        const { error } = await this.supabaseClient
            .from('quiz_participations')
            .insert({
                username: this.playerName,
                device_id: this.getDeviceId(),
                ip_address: ipAddress,
                week_number: this.getCurrentWeek()
            });
            
        if (error) {
            if (error.code === '23505') {
                // Erreur de duplication - c'est normal si déjà participé
                console.log('Participation déjà enregistrée pour ce joueur');
            } else {
                console.error('Erreur enregistrement participation:', error);
            }
        } else {
            console.log('Nouvelle participation enregistrée');
        }
    } catch (e) {
        console.error('Erreur:', e);
    }
}

        openQuizModal() {
            let modal = document.getElementById('quizModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'quizModal';
                modal.className = 'quiz-modal';
                document.body.appendChild(modal);
            }
            
            this.showWelcomeScreen(modal);
            modal.classList.add('show');
        }
        
        async showWelcomeScreen(modal) {
    const savedUsername = localStorage.getItem('quizUsername') || '';
    
    // Afficher un loader pendant la vérification
    modal.innerHTML = `
        <div class="quiz-content">
            <button class="quiz-close" onclick="quizLocal.closeModal()">×</button>
            <div style="text-align: center; padding: 40px;">
                <h2>Chargement du quiz...</h2>
                <div class="loader"></div>
            </div>
        </div>
    `;
    
    // Vérifier si peut jouer (avec vérification serveur)
    const canPlay = await this.canPlayThisWeek();
    
    // Récupérer les scores
    const weeklyScore = await this.getWeeklyScore(savedUsername);
    const totalScore = await this.getTotalScore(savedUsername);
    
    // Afficher le vrai contenu
    modal.innerHTML = `
        <div class="quiz-content">
            <button class="quiz-close" onclick="quizLocal.closeModal()">×</button>
            
            <div class="quiz-welcome">
                <h2>🎯 Quiz Actualités Locales</h2>
                <p>Testez vos connaissances sur Montceau et sa région!</p>
                
                <input type="text" 
                       class="quiz-username-input" 
                       id="quizUsername"
                       placeholder="Entrez votre pseudo"
                       value="${savedUsername}"
                       maxlength="20">
                
                <div class="quiz-stats">
                    <div class="stat-box">
                        <span class="stat-label">Score Total</span>
                        <span class="stat-value">${totalScore} pts</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">Cette Semaine</span>
                        <span class="stat-value">${weeklyScore} pts</span>
                    </div>
                </div>
                
                ${canPlay ? `
                    <button class="quiz-start-btn" onclick="quizLocal.startQuizWithUsername()">
                        Commencer le Quiz
                    </button>
                    <p class="quiz-info">10 questions • 20 secondes par question • 100 points possibles</p>                   
                    <p class="quiz-limit-info">Limite : 5 participations par connexion et par semaine.</p>

                ` : `
                    <div class="quiz-played">
                        <p>✅ Vous avez déjà joué cette semaine!</p>
                        <p>Revenez la semaine prochaine pour un nouveau quiz</p>
                    </div>
                `}
                
                <button class="quiz-leaderboard-btn" onclick="quizLocal.showLeaderboard()">
                    🏆 Classement
                </button>
            </div>
        </div>
    `;
		setTimeout(() => {
		this.validateUsername();
		}, 100);
	}
        
        // quiz-local.js

async startQuizWithUsername() {
    const usernameInput = document.getElementById('quizUsername');
    const username = usernameInput.value.trim();
    
    if (!username) {
        alert('Veuillez entrer un pseudo pour commencer!');
        usernameInput.focus();
        return;
    }
    
    // Mettre à jour le pseudo pour que la vérification finale l'utilise
    localStorage.setItem('quizUsername', username);
    this.playerName = username;
    
    // On relance la validation COMPLÈTE (IP + Pseudo) juste avant de commencer
    const canPlay = await this.canPlayThisWeek();
    
    if (!canPlay) {
        // Si la vérification échoue, l'alerte a déjà été affichée par les fonctions de vérification.
        // On rafraîchit simplement l'écran d'accueil pour afficher le bon message.
        this.showWelcomeScreen(document.getElementById('quizModal'));
        return;
    }
    
    // Si tout est bon, on lance le quiz
    this.startQuiz();
}
      
	 async validateUsername() {
    const usernameInput = document.getElementById('quizUsername');
    if (!usernameInput) return;
    
    usernameInput.addEventListener('blur', async () => {
        const username = usernameInput.value.trim();
        if (username && username !== localStorage.getItem('quizUsername')) {
            // Nouveau pseudo entré, vérifier s'il peut jouer
            const currentWeek = this.getCurrentWeek().toString();
            const canPlay = await this.checkServerParticipation(username, currentWeek);
            
            if (!canPlay) {
                const startBtn = document.querySelector('.quiz-start-btn');
                if (startBtn) {
                    startBtn.disabled = true;
                    startBtn.textContent = 'Ce pseudo a déjà joué cette semaine';
                    startBtn.style.opacity = '0.5';
                }
            }
        }
    });
} 
        startQuiz() {
            this.currentQuestion = 0;
            this.score = 0;
            this.answers = [];
            this.showQuestion();
        }
        
        showQuestion() {
            const modal = document.getElementById('quizModal');
            const question = this.quizData.questions[this.currentQuestion];
            
            modal.innerHTML = `
                <div class="quiz-content">
                    <button class="quiz-close" onclick="quizLocal.closeModal()">×</button>
                    
                    <div class="quiz-header">
                        <div class="quiz-progress">
                            Question ${this.currentQuestion + 1} sur ${this.quizData.questions.length}
                        </div>
                        <div class="quiz-timer" id="quizTimer">
                            <span class="timer-icon">⏱️</span>
                            <span id="timeLeft">20</span>s
                        </div>
                    </div>
                    
                    <div class="quiz-question">
                        <h3>${question.question}</h3>
                        
                        <div class="quiz-options">
                            ${question.options.map((option, index) => `
                                <button class="quiz-option" onclick="quizLocal.selectAnswer(${index})">
                                    ${option}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="quiz-footer">
                        <div class="quiz-score">Score: ${this.score} pts</div>
                    </div>
                </div>
            `;
            
            this.startTimer();
        }
        
        startTimer() {
            this.timeLeft = 20;
            clearInterval(this.timer);
            
            this.timer = setInterval(() => {
                this.timeLeft--;
                const timerEl = document.getElementById('timeLeft');
                if (timerEl) {
                    timerEl.textContent = this.timeLeft;
                    
                    if (this.timeLeft <= 5) {
                        timerEl.parentElement.classList.add('timer-warning');
                    }
                    
                    if (this.timeLeft <= 0) {
                        clearInterval(this.timer);
                        this.selectAnswer(-1);
                    }
                }
            }, 1000);
        }
        
        selectAnswer(index) {
            clearInterval(this.timer);
            
            const question = this.quizData.questions[this.currentQuestion];
            const correct = index === question.correct;
            
            if (correct) {
                const bonus = Math.max(0, Math.floor(this.timeLeft / 2));
                this.score += question.points + bonus;
            }
            
            this.answers.push({
                question: this.currentQuestion,
                selected: index,
                correct: question.correct,
                points: correct ? question.points : 0
            });
            
            this.showAnswerResult(index, question.correct);
            
            setTimeout(() => {
                this.currentQuestion++;
                if (this.currentQuestion < this.quizData.questions.length) {
                    this.showQuestion();
                } else {
                    this.showResults();
                }
            }, 2000);
        }
        
        showAnswerResult(selected, correct) {
            const options = document.querySelectorAll('.quiz-option');
            
            options.forEach((option, index) => {
                option.disabled = true;
                if (index === correct) {
                    option.classList.add('correct');
                } else if (index === selected) {
                    option.classList.add('wrong');
                }
            });
        }
        
        async showResults() {
    // Enregistrer la participation AVANT de sauver le score
    await this.recordParticipation();
    
    // Sauvegarder le score
    await this.saveScore();
    
    // Sauvegarder localement aussi
    localStorage.setItem('lastQuizWeek', this.getCurrentWeek().toString());
            
            const modal = document.getElementById('quizModal');
            
            const percentage = Math.round((this.score / 100) * 100);
            let message = '';
            if (percentage >= 80) message = 'Excellent! Vous êtes un expert local! 🏆';
            else if (percentage >= 60) message = 'Très bien! Vous connaissez bien votre région! 👍';
            else if (percentage >= 40) message = 'Pas mal! Continuez à suivre l\'actualité! 📰';
            else message = 'Consultez plus souvent Actu & Média! 😊';
            
            modal.innerHTML = `
                <div class="quiz-content">
                    <button class="quiz-close" onclick="quizLocal.closeModal()">×</button>
                    
                    <div class="quiz-results">
                        <h2>Quiz Terminé!</h2>
                        
                        <div class="quiz-final-score">
                            <div class="score-circle">
                                <span class="score-big">${this.score}</span>
                                <span class="score-label">points</span>
                            </div>
                        </div>
                        
                        <p class="quiz-message">${message}</p>
                        
                        <div class="quiz-summary">
                            ${this.quizData.questions.map((q, i) => `
                                <div class="summary-item ${this.answers[i] && this.answers[i].selected === this.answers[i].correct ? 'correct' : 'wrong'}">
                                    <span>Q${i + 1}</span>
                                    <span>${this.answers[i] && this.answers[i].selected === this.answers[i].correct ? '✓' : '✗'}</span>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="quiz-actions">
                            <button class="quiz-share-btn" onclick="quizLocal.shareResults()">
                                Partager mes résultats
                            </button>
                            <button class="quiz-close-btn" onclick="quizLocal.closeModal()">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        async saveScore() {
    if (!this.playerName) {
        console.warn('Pas de pseudo pour sauvegarder le score');
        return;
    }
    
    // Initialiser Supabase si nécessaire
    if (!this.supabaseClient) {
        await this.initSupabase();
    }
    
    if (!this.supabaseClient) {
        console.warn('Client Supabase non disponible');
        return;
    }
    
    try {
        const scoreData = {
            username: this.playerName,
            score: this.score,
            week_number: this.getCurrentWeek(),
            device_id: this.getDeviceId()
        };
        
        console.log('Tentative de sauvegarde:', scoreData);
        
        const { data, error } = await this.supabaseClient
            .from('quiz_scores')
            .insert([scoreData])
            .select();
            
        if (error) {
            console.error('Erreur sauvegarde score:', error);
            // Afficher un message d'erreur plus user-friendly
            if (error.code === '42501') {
                console.log('Note: Score non sauvegardé en ligne, mais enregistré localement');
            }
        } else {
            console.log('Score sauvegardé avec succès:', data);
        }
    } catch (e) {
        console.error('Erreur lors de la sauvegarde:', e);
    }
}
        
        async getWeeklyScore(username) {
            if (!this.supabaseClient || !username) return 0;
            
            try {
                const { data } = await this.supabaseClient
                    .from('quiz_scores')
                    .select('score')
                    .eq('username', username)
                    .eq('week_number', this.getCurrentWeek());
                    
                return data ? data.reduce((sum, item) => sum + item.score, 0) : 0;
            } catch (e) {
                return 0;
            }
        }
        
        async getTotalScore(username) {
            if (!this.supabaseClient || !username) return 0;
            
            try {
                const { data } = await this.supabaseClient
                    .from('quiz_scores')
                    .select('score')
                    .eq('username', username);
                    
                return data ? data.reduce((sum, item) => sum + item.score, 0) : 0;
            } catch (e) {
                return 0;
            }
        }
        
        async showLeaderboard() {
            const playerName = localStorage.getItem('quizUsername') || 'Anonyme';
            let leaderboard = [];
            
            if (this.supabaseClient) {
                try {
                    const { data } = await this.supabaseClient
                        .from('quiz_scores')
                        .select('username, score')
                        .eq('week_number', this.getCurrentWeek())
                        .order('score', { ascending: false })
                        .limit(10);
                    
                    if (data && data.length > 0) {
                        const scores = {};
                        data.forEach(item => {
                            scores[item.username] = (scores[item.username] || 0) + item.score;
                        });
                        
                        leaderboard = Object.entries(scores)
                            .map(([name, score]) => ({ 
                                name, 
                                score,
                                isPlayer: name === playerName
                            }))
                            .sort((a, b) => b.score - a.score)
                            .slice(0, 5);
                    }
                } catch (e) {
                    console.error('Erreur chargement classement:', e);
                }
            }
            
            if (leaderboard.length === 0) {
                leaderboard = [
                    { name: "Soyez le premier!", score: 0 }
                ];
            }
            
            const modal = document.getElementById('quizModal');
            modal.innerHTML = `
                <div class="quiz-content">
                    <button class="quiz-close" onclick="quizLocal.closeModal()">×</button>
                    
                    <div class="quiz-leaderboard">
                        <h2>🏆 Classement de la Semaine</h2>
                        
                        <div class="leaderboard-list">
                            ${leaderboard.map((player, index) => `
                                <div class="leaderboard-item ${player.isPlayer ? 'is-player' : ''}">
                                    <span class="rank">#${index + 1}</span>
                                    <span class="name">${player.name}</span>
                                    <span class="score">${player.score} pts</span>
                                </div>
                            `).join('')}
                        </div>
                        
                        <button class="quiz-back-btn" onclick="quizLocal.showWelcomeScreen(document.getElementById('quizModal'))">
                            Retour
                        </button>
                    </div>
                </div>
            `;
        }
        
        async checkIPLimit(weekNumber) {
    if (!this.supabaseClient) {
        await this.initSupabase();
    }
    
    if (!this.supabaseClient) return true;
    
    try {
        // Récupérer l'IP
        let ipAddress = '';
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            ipAddress = data.ip;
        } catch (e) {
            console.log('IP non récupérée');
            return true; // Si pas d'IP, on autorise
        }
        
        const { data } = await this.supabaseClient
            .from('quiz_participations')
            .select('id')
            .eq('ip_address', ipAddress)
            .eq('week_number', parseInt(weekNumber));
        
        // Maximum 5 participations par IP par semaine (pour permettre les familles)
        const limit = 5;
        
        if (data && data.length >= limit) {
            console.log(`Limite IP atteinte: ${data.length} participations depuis cette IP`);
            return false;
        }
        
        console.log(`${data ? data.length : 0} participation(s) depuis cette IP`);
        return true;
        
    } catch (e) {
        console.error('Erreur vérification limite IP:', e);
        return true;
    }
}
        
        shareResults() {
            const text = `J'ai marqué ${this.score} points au Quiz Actu & Média de Montceau! 🎯`;
            
            if (navigator.share) {
                navigator.share({
                    title: 'Quiz Actu & Média',
                    text: text,
                    url: 'https://actuetmedia.fr'
                });
            } else {
                navigator.clipboard.writeText(text);
                alert('Résultat copié!');
            }
        }
        
        closeModal() {
            clearInterval(this.timer);
            const modal = document.getElementById('quizModal');
            if (modal) {
                modal.classList.remove('show');
            }
        }
    }
    
    window.QuizLocal = QuizLocal;
    window.quizLocal = new QuizLocal();
    window.openQuizModal = function() {
        if (window.quizLocal) {
            window.quizLocal.openQuizModal();
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.quizLocal.init();
        });
    } else {
        window.quizLocal.init();
    }
}