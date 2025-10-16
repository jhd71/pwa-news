// seasonal-events.js - Gestion des événements saisonniers COMPLET

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
                message: 'Bonne année !'
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
                emoji: '💝',
                animation: 'heartbeat',
                position: 'top-left',
                message: 'Joyeuse Saint-Valentin'
            },
            {
                name: 'Mardi Gras',
                startOffset: 5,
                emoji: '🎭',
                animation: 'wiggle',
                position: 'bottom-right',
                message: 'Joyeux Mardi Gras !',
                isCalculated: true // Date variable
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
                name: 'Fête des Mères',
                startOffset: 5,
                emoji: '💐',
                animation: 'bloom',
                position: 'top-left',
                message: 'Bonne fête Maman !',
                isCalculated: true // Dernier dimanche de mai
            },
            {
                name: 'Fête des Pères',
                startOffset: 5,
                emoji: '👨‍👧‍👦',
                animation: 'bounce',
                position: 'top-right',
                message: 'Bonne fête Papa !',
                isCalculated: true // 3e dimanche de juin
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
                message: 'Joyeux 14 Juillet !'
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
                message: 'Joyeux Halloween !'
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
                message: 'Joyeux Noël !'
            },
            {
                name: 'Réveillon',
                startOffset: 3,
                date: { month: 12, day: 31 },
                emoji: '🎆',
                animation: 'firework',
                position: 'top-right',
                message: 'Bon réveillon !'
            }
        ];
    }

    init() {
        this.checkAndDisplayEvent();
        // Vérifier toutes les heures
        setInterval(() => this.checkAndDisplayEvent(), 3600000);
    }

    checkAndDisplayEvent() {
        const today = new Date();
        const currentEvent = this.getCurrentEvent(today);
        
        if (currentEvent) {
            this.displayEvent(currentEvent);
        } else {
            // Supprimer l'événement si la période est passée
            const existing = document.getElementById('seasonalEvent');
            if (existing) existing.remove();
        }
    }

    getCurrentEvent(today) {
        // Chercher l'événement prioritaire
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
            
            case 'Fête des Mères':
                // Dernier dimanche de mai
                return this.getLastSundayOfMonth(year, 4); // Mai = mois 4 (0-indexed)
            
            case 'Fête des Pères':
                // 3e dimanche de juin
                return this.getNthSundayOfMonth(year, 5, 3); // Juin = mois 5, 3e dimanche
            
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

    displayEvent(event) {
        const existing = document.getElementById('seasonalEvent');
        if (existing) existing.remove();

        const eventDiv = document.createElement('div');
        eventDiv.id = 'seasonalEvent';
        eventDiv.className = `seasonal-event ${event.position} ${event.animation}`;
        eventDiv.innerHTML = `
            <div class="seasonal-emoji" title="${event.message}">${event.emoji}</div>
        `;

        // Clic pour afficher le message
        eventDiv.onclick = () => {
            this.showEventMessage(event);
        };

        document.body.appendChild(eventDiv);
        
        console.log(`🎉 Événement actif : ${event.name} - ${event.message}`);
    }

    showEventMessage(event) {
        const colors = this.getThemeColors();
        
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(145deg, ${colors.primary}, ${colors.secondary});
            color: white;
            padding: 25px 35px;
            border-radius: 20px;
            z-index: 10002;
            font-weight: bold;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
            text-align: center;
            border: 3px solid ${colors.accent};
            min-width: 250px;
            animation: popIn 0.5s ease;
        `;
        
        message.innerHTML = `
            <div style="font-size: 50px; margin-bottom: 15px;">${event.emoji}</div>
            <div style="font-size: 20px; margin-bottom: 10px;">${event.message}</div>
            <div style="font-size: 14px; opacity: 0.9;">Cliquez pour fermer</div>
        `;
        
        message.onclick = () => message.remove();
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) message.remove();
        }, 5000);
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
document.addEventListener('DOMContentLoaded', () => {
    seasonalEvents.init();
});

window.seasonalEvents = seasonalEvents;