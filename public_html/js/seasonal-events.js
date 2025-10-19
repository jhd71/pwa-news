// seasonal-events.js - Gestion des événements saisonniers AMÉLIORÉ

class SeasonalEvents {
    constructor() {
        this.events = [
            // HIVER
            {
                name: 'Nouvel An',
                startOffset: 5,
                date: { month: 1, day: 1 },
                emoji: '🎊',
                animation: 'firework',
                position: 'top-right',
                message: 'Bonne année !',
                particles: 'confetti'
            },
            {
                name: 'Épiphanie',
                startOffset: 2,
                date: { month: 1, day: 6 },
                emoji: '👑',
                animation: 'shine',
                position: 'top-left',
                message: 'Galette des rois'
            },
            {
                name: 'Chandeleur',
                startOffset: 3,
                date: { month: 2, day: 2 },
                emoji: '🥞',
                animation: 'flip',
                position: 'bottom-left',
                message: 'C\'est la Chandeleur !'
            },
            {
                name: 'Saint-Valentin',
                startOffset: 7,
                date: { month: 2, day: 14 },
                emoji: '💕',
                animation: 'heartbeat',
                position: 'top-left',
                message: 'Joyeuse Saint-Valentin',
                particles: 'hearts'
            },
            {
                name: 'Mardi Gras',
                startOffset: 5,
                emoji: '🎭',
                animation: 'wiggle',
                position: 'bottom-right',
                message: 'Joyeux Mardi Gras !',
                isCalculated: true,
                particles: 'confetti'
            },
            
            // PRINTEMPS
            {
                name: 'Pâques',
                startOffset: 7,
                emoji: '🐰',
                animation: 'hop',
                position: 'bottom-left',
                message: 'Joyeuses Pâques !',
                isCalculated: true
            },
            {
                name: 'Poisson d\'Avril',
                startOffset: 1,
                date: { month: 4, day: 1 },
                emoji: '🐟',
                animation: 'swim',
                position: 'bottom-right',
                message: 'Poisson d\'Avril !'
            },
            {
                name: 'Fête du Travail',
                startOffset: 2,
                date: { month: 5, day: 1 },
                emoji: '🌺',
                animation: 'grow',
                position: 'top-left',
                message: 'Bon 1er Mai'
            },
            {
                name: 'Victoire 1945',
                startOffset: 1,
                date: { month: 5, day: 8 },
                emoji: '🇫🇷',
                animation: 'wave',
                position: 'top-right',
                message: '8 Mai 1945'
            },
            {
                name: 'Ascension',
                startOffset: 3,
                emoji: '☁️',
                animation: 'float',
                position: 'top-right',
                message: 'Jeudi de l\'Ascension',
                isCalculated: true
            },
            {
                name: 'Fête des Mères',
                startOffset: 5,
                emoji: '💐',
                animation: 'bloom',
                position: 'top-left',
                message: 'Bonne fête Maman !',
                isCalculated: true,
                particles: 'hearts'
            },
            {
                name: 'Pentecôte',
                startOffset: 3,
                emoji: '🕊️',
                animation: 'float',
                position: 'top-left',
                message: 'Joyeuse Pentecôte',
                isCalculated: true
            },
            {
                name: 'Fête des Pères',
                startOffset: 5,
                emoji: '👨‍👧‍👦',
                animation: 'bounce',
                position: 'top-right',
                message: 'Bonne fête Papa !',
                isCalculated: true
            },
            
            // ÉTÉ
            {
                name: 'Fête de la Musique',
                startOffset: 3,
                date: { month: 6, day: 21 },
                emoji: '🎵',
                animation: 'dance',
                position: 'bottom-left',
                message: 'Fête de la Musique'
            },
            {
                name: 'Fête Nationale',
                startOffset: 5,
                date: { month: 7, day: 14 },
                emoji: '🇫🇷',
                animation: 'wave',
                position: 'top-right',
                message: 'Joyeux 14 Juillet !',
                particles: 'confetti'
            },
            
            // AUTOMNE
            {
                name: 'Rentrée',
                startOffset: 3,
                date: { month: 9, day: 1 },
                emoji: '🎒',
                animation: 'swing',
                position: 'bottom-left',
                message: 'Bonne rentrée !'
            },
            {
                name: 'Halloween',
                startOffset: 10,
                date: { month: 10, day: 31 },
                emoji: '🎃',
                animation: 'spooky',
                position: 'bottom-left',
                message: 'Joyeux Halloween !',
                particles: 'leaves'
            },
            {
                name: 'Toussaint',
                startOffset: 2,
                date: { month: 11, day: 1 },
                emoji: '🕯️',
                animation: 'flicker',
                position: 'top-left',
                message: 'Toussaint'
            },
            {
                name: 'Armistice 1918',
                startOffset: 1,
                date: { month: 11, day: 11 },
                emoji: '🇫🇷',
                animation: 'wave',
                position: 'top-right',
                message: '11 Novembre 1918'
            },
            
            // HIVER (fin d'année)
            {
                name: 'Noël',
                startOffset: 20,
                date: { month: 12, day: 25 },
                emoji: '🎄',
                animation: 'snow',
                position: 'bottom-right',
                message: 'Joyeux Noël !',
                particles: 'snowflakes'
            },
            {
                name: 'Réveillon',
                startOffset: 3,
                date: { month: 12, day: 31 },
                emoji: '🎆',
                animation: 'firework',
                position: 'top-right',
                message: 'Bon réveillon !',
                particles: 'confetti'
            },
            // 🧪 TEST TOUJOURS ACTIF (jusqu'en 2099)
            {
                name: 'Test Événements',
                startOffset: 27375, // 75 ans avant = toujours actif
                date: { month: 12, day: 31 }, // 31 décembre 2099
                emoji: '🧪',
                animation: 'bounce',
                position: 'bottom-right',
                message: 'Test réussi ! 🎉',
                particles: 'confetti'
            },
            // ÉVÉNEMENTS LOCAUX CHALON-SUR-SAÔNE
            {
                name: 'Carnaval de Chalon',
                startOffset: 7,
                date: { month: 3, day: 15 }, // Ajustez la date selon le vrai carnaval
                emoji: '🎪',
                animation: 'wiggle',
                position: 'bottom-right',
                message: 'Carnaval de Chalon !',
                particles: 'confetti'
            }
        ];
        
        this.storageKey = 'seasonalEvents_seen';
    }

    init() {
        this.checkAndDisplayEvent();
        // Vérifier toutes les heures
        setInterval(() => this.checkAndDisplayEvent(), 3600000);
        
        // Réinitialiser à minuit
        this.scheduleMiddleightReset();
    }

    scheduleMiddleightReset() {
        const now = new Date();
        const night = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1, // Demain
            0, 0, 0 // Minuit
        );
        const msToMidnight = night.getTime() - now.getTime();
        
        setTimeout(() => {
            this.resetDailyView();
            // Replanifier pour la prochaine nuit
            this.scheduleMiddleightReset();
        }, msToMidnight);
    }

    resetDailyView() {
        const today = this.getTodayKey();
        const seenData = this.getSeenData();
        
        // Supprimer les anciennes entrées
        Object.keys(seenData).forEach(key => {
            if (key !== today) {
                delete seenData[key];
            }
        });
        
        localStorage.setItem(this.storageKey, JSON.stringify(seenData));
        
        // Réafficher l'événement du jour
        this.checkAndDisplayEvent();
    }

    getTodayKey() {
        const today = new Date();
        return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    }

    getSeenData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : {};
    }

    markAsSeen(eventName) {
        const seenData = this.getSeenData();
        const todayKey = this.getTodayKey();
        
        if (!seenData[todayKey]) {
            seenData[todayKey] = {};
        }
        
        seenData[todayKey][eventName] = true;
        localStorage.setItem(this.storageKey, JSON.stringify(seenData));
    }

    hasSeenToday(eventName) {
        const seenData = this.getSeenData();
        const todayKey = this.getTodayKey();
        
        return seenData[todayKey] && seenData[todayKey][eventName];
    }

    checkAndDisplayEvent() {
        const today = new Date();
        const currentEvent = this.getCurrentEvent(today);
        
        if (currentEvent) {
            const hasSeenToday = this.hasSeenToday(currentEvent.name);
            this.displayEvent(currentEvent, !hasSeenToday);
        } else {
            // Supprimer l'événement si la période est passée
            const existing = document.getElementById('seasonalEvent');
            if (existing) existing.remove();
        }
    }

    getCurrentEvent(today) {
        for (let event of this.events) {
            if (this.isEventActive(event, today)) {
                return event;
            }
        }
        return null;
    }

    isEventActive(event, today) {
        const eventDate = this.getEventDate(event, today.getFullYear());
        if (!eventDate) return false;

        const startDate = new Date(eventDate);
        startDate.setDate(startDate.getDate() - event.startOffset);

        return today >= startDate && today <= eventDate;
    }

    getEventDate(event, year) {
        if (event.isCalculated) {
            return this.calculateSpecialDate(event.name, year);
        }
        return new Date(year, event.date.month - 1, event.date.day);
    }

    calculateSpecialDate(eventName, year) {
        switch (eventName) {
            case 'Pâques':
                return this.calculateEaster(year);
            
            case 'Mardi Gras':
                const easter = this.calculateEaster(year);
                const mardiGras = new Date(easter);
                mardiGras.setDate(easter.getDate() - 47);
                return mardiGras;
            
            case 'Ascension':
                const easterAsc = this.calculateEaster(year);
                const ascension = new Date(easterAsc);
                ascension.setDate(easterAsc.getDate() + 39);
                return ascension;
            
            case 'Pentecôte':
                const easterPent = this.calculateEaster(year);
                const pentecote = new Date(easterPent);
                pentecote.setDate(easterPent.getDate() + 49);
                return pentecote;
            
            case 'Fête des Mères':
                return this.getLastSundayOfMonth(year, 4);
            
            case 'Fête des Pères':
                return this.getNthSundayOfMonth(year, 5, 3);
            
            default:
                return null;
        }
    }

    calculateEaster(year) {
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        return new Date(year, month - 1, day);
    }

    getLastSundayOfMonth(year, month) {
        const lastDay = new Date(year, month + 1, 0);
        const day = lastDay.getDay();
        const diff = day === 0 ? 0 : 7 - day;
        return new Date(year, month, lastDay.getDate() - diff);
    }

    getNthSundayOfMonth(year, month, n) {
        const firstDay = new Date(year, month, 1);
        const firstSunday = firstDay.getDay() === 0 ? 1 : 8 - firstDay.getDay();
        return new Date(year, month, firstSunday + (n - 1) * 7);
    }

    displayEvent(event, showPopup) {
        const existing = document.getElementById('seasonalEvent');
        if (existing) existing.remove();

        const eventDiv = document.createElement('div');
        eventDiv.id = 'seasonalEvent';
        eventDiv.className = `seasonal-event ${event.position} ${event.animation}`;
        
        // Mode discret si déjà vu
        if (!showPopup) {
            eventDiv.classList.add('discrete-mode');
        }
        
        eventDiv.innerHTML = `
            <div class="seasonal-emoji" title="${event.message}">${event.emoji}</div>
            <button class="hide-event-btn" title="Ne plus montrer aujourd'hui">×</button>
        `;

        // Clic sur l'emoji pour afficher le message
        eventDiv.querySelector('.seasonal-emoji').onclick = () => {
            this.showEventMessage(event);
            if (event.particles) {
                this.createParticles(event.particles);
            }
        };
        
        // Bouton pour masquer
        eventDiv.querySelector('.hide-event-btn').onclick = (e) => {
            e.stopPropagation();
            this.markAsSeen(event.name);
            eventDiv.remove();
        };

        document.body.appendChild(eventDiv);
        
        // Afficher le popup automatiquement si première fois
        if (showPopup) {
            setTimeout(() => {
                this.showEventMessage(event);
                if (event.particles) {
                    this.createParticles(event.particles);
                }
                this.markAsSeen(event.name);
            }, 1000);
        }
        
        console.log(`🎉 Événement actif : ${event.name}`);
    }

    showEventMessage(event) {
    const colors = this.getThemeColors();
    
    const message = document.createElement('div');
    message.className = 'seasonal-message-popup';
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(145deg, ${colors.primary}, ${colors.secondary});
        color: white;
        padding: 30px 40px;
        border-radius: 20px;
        z-index: 10002;
        font-weight: bold;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        text-align: center;
        border: 3px solid ${colors.accent};
        min-width: 280px;
        max-width: 90%;
        animation: popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;
    
    message.innerHTML = `
        <div style="font-size: 60px; margin-bottom: 15px;">${event.emoji}</div>
        <div style="font-size: 22px; margin-bottom: 20px;">${event.message}</div>
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button class="popup-btn-close" style="
                background: rgba(255,255,255,0.2);
                border: 2px solid white;
                color: white;
                padding: 10px 20px;
                border-radius: 10px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: all 0.3s;
            ">
                Fermer
            </button>
            <button class="popup-btn-hide" style="
                background: rgba(255,255,255,0.3);
                border: 2px solid white;
                color: white;
                padding: 10px 20px;
                border-radius: 10px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: all 0.3s;
            ">
                Ne plus montrer aujourd'hui
            </button>
        </div>
    `;
    
    // Bouton Fermer - ferme juste le popup
    message.querySelector('.popup-btn-close').onclick = () => {
        message.remove();
    };
    
    // Effets hover pour le bouton Fermer
    const closeBtn = message.querySelector('.popup-btn-close');
    closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255,255,255,0.3)';
    closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255,255,255,0.2)';
    
    // Bouton Ne plus montrer - masque l'emoji pour la journée
    message.querySelector('.popup-btn-hide').onclick = () => {
        message.remove();
        this.markAsSeen(event.name);
        const eventDiv = document.getElementById('seasonalEvent');
        if (eventDiv) eventDiv.remove();
    };
    
    // Effets hover pour le bouton Ne plus montrer
    const hideBtn = message.querySelector('.popup-btn-hide');
    hideBtn.onmouseover = () => hideBtn.style.background = 'rgba(255,100,100,0.5)';
    hideBtn.onmouseout = () => hideBtn.style.background = 'rgba(255,255,255,0.3)';
    
    document.body.appendChild(message);
    
    // Fermeture automatique après 10 secondes (popup seulement)
    setTimeout(() => {
        if (message.parentNode) message.remove();
    }, 10000);
}

    createParticles(type) {
        const container = document.createElement('div');
        container.className = 'particles-container';
        document.body.appendChild(container);
        
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = `particle particle-${type}`;
                
                // Position aléatoire
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 2 + 's';
                particle.style.animationDuration = (3 + Math.random() * 2) + 's';
                
                // Emoji selon le type
                switch(type) {
                    case 'hearts':
                        particle.textContent = ['❤️', '💕', '💖', '💗'][Math.floor(Math.random() * 4)];
                        break;
                    case 'confetti':
                        particle.textContent = ['🎊', '🎉', '✨', '⭐'][Math.floor(Math.random() * 4)];
                        break;
                    case 'snowflakes':
                        particle.textContent = ['❄️', '⛄', '☃️'][Math.floor(Math.random() * 3)];
                        break;
                    case 'leaves':
                        particle.textContent = ['🍂', '🍁', '🎃'][Math.floor(Math.random() * 3)];
                        break;
                }
                
                container.appendChild(particle);
                
                // Supprimer après l'animation
                setTimeout(() => particle.remove(), 5000);
            }, i * 100);
        }
        
        // Supprimer le container après toutes les animations
        setTimeout(() => container.remove(), 10000);
    }

    getThemeColors() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'rouge';
        
        const themes = {
            'rouge': { primary: '#841b0a', secondary: '#a92317', accent: '#c62828' },
            'dark': { primary: '#212121', secondary: '#424242', accent: '#616161' },
            'bleuciel': { primary: '#1976d2', secondary: '#42a5f5', accent: '#64b5f6' },
            'light': { primary: '#7b1fa2', secondary: '#ab47bc', accent: '#ce93d8' }
        };
        
        return themes[currentTheme] || themes['rouge'];
    }
}

// Initialiser
const seasonalEvents = new SeasonalEvents();

// Initialisation immédiate ou au chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🎉 Initialisation des événements saisonniers...');
        seasonalEvents.init();
    });
} else {
    // Le DOM est déjà chargé
    console.log('🎉 Initialisation immédiate des événements saisonniers...');
    seasonalEvents.init();
}

window.seasonalEvents = seasonalEvents;