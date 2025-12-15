// seasonal-events.js - Gestion des événements saisonniers AMÉLIORÉ V2

class SeasonalEvents {
    constructor() {
        this.events = [
            // ═══════════════════════════════════════════════════════════════
            // JANVIER
            // ═══════════════════════════════════════════════════════════════
            {
                name: 'Nouvel An',
                startOffset: 5,
                date: { month: 1, day: 1 },
                emoji: '🎊',
                secondaryEmoji: '🥂',
                animation: 'firework',
                position: 'top-right',
                message: 'Bonne année 2025 !',
                subMessage: 'Que cette nouvelle année vous apporte bonheur et santé',
                particles: 'confetti',
                theme: 'gold'
            },
            {
                name: 'Épiphanie',
                startOffset: 2,
                date: { month: 1, day: 6 },
                emoji: '👑',
                secondaryEmoji: '🥧',
                animation: 'shine',
                position: 'top-left',
                message: 'Vive les Rois !',
                subMessage: 'Qui aura la fève ?',
                theme: 'gold'
            },
            {
                name: 'Blue Monday',
                startOffset: 1,
                date: { month: 1, day: 20 },
                emoji: '💙',
                animation: 'pulse',
                position: 'bottom-left',
                message: 'Blue Monday',
                subMessage: 'Gardez le sourire !',
                theme: 'blue'
            },

            // ═══════════════════════════════════════════════════════════════
            // FÉVRIER
            // ═══════════════════════════════════════════════════════════════
            {
                name: 'Chandeleur',
                startOffset: 3,
                date: { month: 2, day: 2 },
                emoji: '🥞',
                secondaryEmoji: '🕯️',
                animation: 'flip',
                position: 'bottom-left',
                message: 'C\'est la Chandeleur !',
                subMessage: 'À vos poêles !',
                theme: 'warm'
            },
            {
                name: 'Saint-Valentin',
                startOffset: 7,
                date: { month: 2, day: 14 },
                emoji: '💕',
                secondaryEmoji: '🌹',
                animation: 'heartbeat',
                position: 'top-left',
                message: 'Joyeuse Saint-Valentin',
                subMessage: 'L\'amour est dans l\'air',
                particles: 'hearts',
                theme: 'love'
            },
            {
                name: 'Mardi Gras',
                startOffset: 5,
                emoji: '🎭',
                secondaryEmoji: '🎪',
                animation: 'wiggle',
                position: 'bottom-right',
                message: 'Joyeux Mardi Gras !',
                subMessage: 'Sortez les déguisements !',
                isCalculated: true,
                particles: 'confetti',
                theme: 'carnival'
            },

            // ═══════════════════════════════════════════════════════════════
            // MARS
            // ═══════════════════════════════════════════════════════════════
            {
                name: 'Journée de la Femme',
                startOffset: 2,
                date: { month: 3, day: 8 },
                emoji: '👩',
                secondaryEmoji: '💜',
                animation: 'bloom',
                position: 'top-left',
                message: 'Journée de la Femme',
                subMessage: 'Célébrons les femmes !',
                particles: 'hearts',
                theme: 'purple'
            },
            {
                name: 'Saint-Patrick',
                startOffset: 3,
                date: { month: 3, day: 17 },
                emoji: '☘️',
                secondaryEmoji: '🍀',
                animation: 'bounce',
                position: 'bottom-left',
                message: 'Happy St. Patrick\'s Day!',
                subMessage: 'Sláinte !',
                particles: 'clovers',
                theme: 'green'
            },
            {
                name: 'Printemps',
                startOffset: 3,
                date: { month: 3, day: 20 },
                emoji: '🌸',
                secondaryEmoji: '🦋',
                animation: 'bloom',
                position: 'top-right',
                message: 'C\'est le Printemps !',
                subMessage: 'La nature se réveille',
                particles: 'petals',
                theme: 'spring'
            },

            // ═══════════════════════════════════════════════════════════════
            // AVRIL
            // ═══════════════════════════════════════════════════════════════
            {
                name: 'Poisson d\'Avril',
                startOffset: 1,
                date: { month: 4, day: 1 },
                emoji: '🐟',
                secondaryEmoji: '😜',
                animation: 'swim',
                position: 'bottom-right',
                message: 'Poisson d\'Avril !',
                subMessage: 'Attention aux blagues !',
                particles: 'fish',
                theme: 'blue'
            },
            {
                name: 'Pâques',
                startOffset: 7,
                emoji: '🐰',
                secondaryEmoji: '🥚',
                animation: 'hop',
                position: 'bottom-left',
                message: 'Joyeuses Pâques !',
                subMessage: 'Bonne chasse aux œufs !',
                isCalculated: true,
                particles: 'eggs',
                theme: 'pastel'
            },
            {
                name: 'Journée de la Terre',
                startOffset: 2,
                date: { month: 4, day: 22 },
                emoji: '🌍',
                secondaryEmoji: '🌱',
                animation: 'rotate',
                position: 'top-left',
                message: 'Journée de la Terre',
                subMessage: 'Protégeons notre planète',
                particles: 'leaves',
                theme: 'green'
            },

            // ═══════════════════════════════════════════════════════════════
            // MAI
            // ═══════════════════════════════════════════════════════════════
            {
                name: 'Fête du Travail',
                startOffset: 2,
                date: { month: 5, day: 1 },
                emoji: '🌺',
                secondaryEmoji: '💐',
                animation: 'grow',
                position: 'top-left',
                message: 'Bon 1er Mai !',
                subMessage: 'Du muguet porte-bonheur',
                particles: 'petals',
                theme: 'spring'
            },
            {
                name: 'Victoire 1945',
                startOffset: 1,
                date: { month: 5, day: 8 },
                emoji: '🇫🇷',
                secondaryEmoji: '🕊️',
                animation: 'wave',
                position: 'top-right',
                message: '8 Mai 1945',
                subMessage: 'Devoir de mémoire',
                theme: 'france'
            },
            {
                name: 'Ascension',
                startOffset: 3,
                emoji: '☁️',
                secondaryEmoji: '✨',
                animation: 'float',
                position: 'top-right',
                message: 'Jeudi de l\'Ascension',
                subMessage: 'Bon week-end prolongé !',
                isCalculated: true,
                theme: 'sky'
            },
            {
                name: 'Fête des Mères',
                startOffset: 5,
                emoji: '💐',
                secondaryEmoji: '❤️',
                animation: 'bloom',
                position: 'top-left',
                message: 'Bonne fête Maman !',
                subMessage: 'Merci pour tout',
                isCalculated: true,
                particles: 'hearts',
                theme: 'love'
            },
            {
                name: 'Pentecôte',
                startOffset: 3,
                emoji: '🕊️',
                animation: 'float',
                position: 'top-left',
                message: 'Joyeuse Pentecôte',
                subMessage: 'Bon lundi férié !',
                isCalculated: true,
                theme: 'sky'
            },

            // ═══════════════════════════════════════════════════════════════
            // JUIN
            // ═══════════════════════════════════════════════════════════════
            {
                name: 'Fête des Pères',
                startOffset: 5,
                emoji: '👨‍👧‍👦',
                secondaryEmoji: '🎁',
                animation: 'bounce',
                position: 'top-right',
                message: 'Bonne fête Papa !',
                subMessage: 'Super héros du quotidien',
                isCalculated: true,
                particles: 'confetti',
                theme: 'blue'
            },
            {
                name: 'Fête de la Musique',
                startOffset: 3,
                date: { month: 6, day: 21 },
                emoji: '🎵',
                secondaryEmoji: '🎸',
                animation: 'dance',
                position: 'bottom-left',
                message: 'Fête de la Musique !',
                subMessage: 'Faites du bruit !',
                particles: 'notes',
                theme: 'music'
            },
            {
                name: 'Été',
                startOffset: 3,
                date: { month: 6, day: 21 },
                emoji: '☀️',
                secondaryEmoji: '🏖️',
                animation: 'shine',
                position: 'top-right',
                message: 'C\'est l\'Été !',
                subMessage: 'Vive les vacances !',
                particles: 'sun',
                theme: 'summer'
            },

            // ═══════════════════════════════════════════════════════════════
            // JUILLET
            // ═══════════════════════════════════════════════════════════════
            {
                name: 'Fête Nationale',
                startOffset: 5,
                date: { month: 7, day: 14 },
                emoji: '🇫🇷',
                secondaryEmoji: '🎆',
                animation: 'wave',
                position: 'top-right',
                message: 'Joyeux 14 Juillet !',
                subMessage: 'Vive la France !',
                particles: 'fireworks',
                theme: 'france'
            },

            // ═══════════════════════════════════════════════════════════════
            // AOÛT
            // ═══════════════════════════════════════════════════════════════
            {
                name: 'Assomption',
                startOffset: 2,
                date: { month: 8, day: 15 },
                emoji: '⛪',
                secondaryEmoji: '🌟',
                animation: 'float',
                position: 'top-left',
                message: 'Bonne fête de l\'Assomption',
                subMessage: 'Jour férié',
                theme: 'sky'
            },
            {
                name: 'Étoiles Filantes',
                startOffset: 3,
                date: { month: 8, day: 12 },
                emoji: '🌠',
                secondaryEmoji: '✨',
                animation: 'shooting',
                position: 'top-right',
                message: 'Nuit des Étoiles !',
                subMessage: 'Faites un vœu',
                particles: 'stars',
                theme: 'night'
            },

            // ═══════════════════════════════════════════════════════════════
            // SEPTEMBRE
            // ═══════════════════════════════════════════════════════════════
            {
                name: 'Rentrée',
                startOffset: 3,
                date: { month: 9, day: 1 },
                emoji: '🎒',
                secondaryEmoji: '📚',
                animation: 'swing',
                position: 'bottom-left',
                message: 'Bonne rentrée !',
                subMessage: 'C\'est reparti !',
                theme: 'school'
            },
            {
                name: 'Automne',
                startOffset: 3,
                date: { month: 9, day: 22 },
                emoji: '🍂',
                secondaryEmoji: '🍁',
                animation: 'fall',
                position: 'top-right',
                message: 'C\'est l\'Automne !',
                subMessage: 'Les feuilles tombent',
                particles: 'leaves',
                theme: 'autumn'
            },
            {
                name: 'Journées du Patrimoine',
                startOffset: 2,
                date: { month: 9, day: 21 },
                emoji: '🏰',
                secondaryEmoji: '🗝️',
                animation: 'shine',
                position: 'bottom-right',
                message: 'Journées du Patrimoine',
                subMessage: 'Découvrez l\'histoire',
                theme: 'gold'
            },

            // ═══════════════════════════════════════════════════════════════
            // OCTOBRE
            // ═══════════════════════════════════════════════════════════════
            {
                name: 'Octobre Rose',
                startOffset: 31,
                date: { month: 10, day: 31 },
                emoji: '🎀',
                secondaryEmoji: '💗',
                animation: 'pulse',
                position: 'top-left',
                message: 'Octobre Rose',
                subMessage: 'Ensemble contre le cancer',
                theme: 'pink'
            },
            {
                name: 'Halloween',
                startOffset: 10,
                date: { month: 10, day: 31 },
                emoji: '🎃',
                secondaryEmoji: '👻',
                animation: 'spooky',
                position: 'bottom-left',
                message: 'Joyeux Halloween !',
                subMessage: 'Des bonbons ou un sort ?',
                particles: 'bats',
                theme: 'halloween'
            },

            // ═══════════════════════════════════════════════════════════════
            // NOVEMBRE
            // ═══════════════════════════════════════════════════════════════
            {
                name: 'Toussaint',
                startOffset: 2,
                date: { month: 11, day: 1 },
                emoji: '🕯️',
                secondaryEmoji: '💐',
                animation: 'flicker',
                position: 'top-left',
                message: 'Toussaint',
                subMessage: 'En mémoire de nos proches',
                theme: 'candle'
            },
            {
                name: 'Armistice 1918',
                startOffset: 1,
                date: { month: 11, day: 11 },
                emoji: '🇫🇷',
                secondaryEmoji: '🕊️',
                animation: 'wave',
                position: 'top-right',
                message: '11 Novembre 1918',
                subMessage: 'Devoir de mémoire',
                theme: 'france'
            },
            {
                name: 'Beaujolais Nouveau',
                startOffset: 2,
                date: { month: 11, day: 21 },
                emoji: '🍷',
                secondaryEmoji: '🍇',
                animation: 'swing',
                position: 'bottom-right',
                message: 'Le Beaujolais est arrivé !',
                subMessage: 'Santé !',
                theme: 'wine'
            },
            {
                name: 'Black Friday',
                startOffset: 3,
                emoji: '🛒',
                secondaryEmoji: '💰',
                animation: 'bounce',
                position: 'bottom-left',
                message: 'Black Friday !',
                subMessage: 'C\'est les soldes !',
                isCalculated: true,
                theme: 'dark'
            },

            // ═══════════════════════════════════════════════════════════════
            // DÉCEMBRE
            // ═══════════════════════════════════════════════════════════════
            {
                name: 'Avent',
                startOffset: 1,
                date: { month: 12, day: 1 },
                emoji: '🎄',
                secondaryEmoji: '📆',
                animation: 'twinkle',
                position: 'top-left',
                message: 'Début de l\'Avent !',
                subMessage: 'Ouvrez la première case',
                particles: 'snowflakes',
                theme: 'christmas'
            },
            {
                name: 'Saint-Nicolas',
                startOffset: 2,
                date: { month: 12, day: 6 },
                emoji: '🎅',
                secondaryEmoji: '🍬',
                animation: 'bounce',
                position: 'bottom-right',
                message: 'Saint-Nicolas',
                subMessage: 'Pour les enfants sages',
                theme: 'christmas'
            },
            {
                name: 'Hiver',
                startOffset: 2,
                date: { month: 12, day: 21 },
                emoji: '❄️',
                secondaryEmoji: '⛄',
                animation: 'snow',
                position: 'top-right',
                message: 'C\'est l\'Hiver !',
                subMessage: 'Au chaud !',
                particles: 'snowflakes',
                theme: 'winter'
            },
            {
                name: 'Noël',
                startOffset: 20,
                date: { month: 12, day: 25 },
                emoji: '🎄',
                secondaryEmoji: '🎁',
                animation: 'twinkle',
                position: 'bottom-right',
                message: 'Joyeux Noël !',
                subMessage: 'Magie des fêtes',
                particles: 'snowflakes',
                theme: 'christmas'
            },
            {
                name: 'Réveillon',
                startOffset: 3,
                date: { month: 12, day: 31 },
                emoji: '🎆',
                secondaryEmoji: '🥳',
                animation: 'firework',
                position: 'top-right',
                message: 'Bon réveillon !',
                subMessage: 'À l\'année prochaine !',
                particles: 'fireworks',
                theme: 'newyear'
            },

            // ═══════════════════════════════════════════════════════════════
            // ÉVÉNEMENTS LOCAUX BOURGOGNE
            // ═══════════════════════════════════════════════════════════════
            {
                name: 'Carnaval de Chalon',
                startOffset: 7,
                date: { month: 3, day: 9 },
                emoji: '🎪',
                secondaryEmoji: '🎭',
                animation: 'wiggle',
                position: 'bottom-right',
                message: 'Carnaval de Chalon !',
                subMessage: 'Défilé et confettis',
                particles: 'confetti',
                theme: 'carnival'
            },
            {
                name: 'Paulée de la Côte Chalonnaise',
                startOffset: 3,
                date: { month: 4, day: 7 },
                emoji: '🍷',
                secondaryEmoji: '🥂',
                animation: 'swing',
                position: 'bottom-left',
                message: 'Paulée de la Côte Chalonnaise',
                subMessage: 'Fête des vignerons',
                theme: 'wine'
            }
        ];
        
        this.storageKey = 'seasonalEvents_seen';
        this.themeColors = {
            gold: { primary: '#FFD700', secondary: '#FFA500', accent: '#FF8C00', bg: 'linear-gradient(135deg, #1a1a2e 0%, #2d1810 100%)' },
            love: { primary: '#FF1493', secondary: '#FF69B4', accent: '#FFB6C1', bg: 'linear-gradient(135deg, #2d1f2f 0%, #4a1942 100%)' },
            carnival: { primary: '#FF6B35', secondary: '#9B5DE5', accent: '#00F5D4', bg: 'linear-gradient(135deg, #1a1a2e 0%, #2e1065 100%)' },
            green: { primary: '#00D084', secondary: '#00B371', accent: '#7ED321', bg: 'linear-gradient(135deg, #0d2818 0%, #1a4028 100%)' },
            spring: { primary: '#FF9FF3', secondary: '#FECA57', accent: '#48DBFB', bg: 'linear-gradient(135deg, #2d2040 0%, #1a3a2e 100%)' },
            blue: { primary: '#0984E3', secondary: '#74B9FF', accent: '#81ECEC', bg: 'linear-gradient(135deg, #0c1a2e 0%, #1a3a5c 100%)' },
            purple: { primary: '#A55EEA', secondary: '#8854D0', accent: '#D980FA', bg: 'linear-gradient(135deg, #1a1030 0%, #2d1f4a 100%)' },
            france: { primary: '#0055A4', secondary: '#FFFFFF', accent: '#EF4135', bg: 'linear-gradient(135deg, #0c1a2e 0%, #1a1a2e 100%)' },
            sky: { primary: '#87CEEB', secondary: '#E0F6FF', accent: '#FFFFFF', bg: 'linear-gradient(135deg, #1a2a3a 0%, #2a4a6a 100%)' },
            summer: { primary: '#FF9F43', secondary: '#FECA57', accent: '#FF6B6B', bg: 'linear-gradient(135deg, #2a2010 0%, #4a3010 100%)' },
            music: { primary: '#9B59B6', secondary: '#E056FD', accent: '#686DE0', bg: 'linear-gradient(135deg, #1a1030 0%, #2a1040 100%)' },
            school: { primary: '#F39C12', secondary: '#E67E22', accent: '#D35400', bg: 'linear-gradient(135deg, #1a1a10 0%, #2a2010 100%)' },
            autumn: { primary: '#D35400', secondary: '#E67E22', accent: '#F39C12', bg: 'linear-gradient(135deg, #2a1a10 0%, #3a2010 100%)' },
            pink: { primary: '#FF6B9D', secondary: '#FF8AC4', accent: '#FFB3D9', bg: 'linear-gradient(135deg, #2d1020 0%, #4a1a30 100%)' },
            halloween: { primary: '#FF6B00', secondary: '#8B00FF', accent: '#00FF00', bg: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 100%)' },
            candle: { primary: '#FFD700', secondary: '#FF8C00', accent: '#FF4500', bg: 'linear-gradient(135deg, #1a1008 0%, #2a1810 100%)' },
            wine: { primary: '#722F37', secondary: '#9B2335', accent: '#C41E3A', bg: 'linear-gradient(135deg, #1a0a10 0%, #2a1018 100%)' },
            dark: { primary: '#2C3E50', secondary: '#34495E', accent: '#95A5A6', bg: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)' },
            christmas: { primary: '#C41E3A', secondary: '#228B22', accent: '#FFD700', bg: 'linear-gradient(135deg, #1a0a0a 0%, #0a1a0a 100%)' },
            winter: { primary: '#A5F3FC', secondary: '#E0F2FE', accent: '#FFFFFF', bg: 'linear-gradient(135deg, #0a1a2a 0%, #1a2a3a 100%)' },
            newyear: { primary: '#FFD700', secondary: '#C0C0C0', accent: '#FFFFFF', bg: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%)' },
            pastel: { primary: '#FFB5E8', secondary: '#B5DEFF', accent: '#E7FFAC', bg: 'linear-gradient(135deg, #2a2030 0%, #302a40 100%)' },
            night: { primary: '#191970', secondary: '#483D8B', accent: '#FFD700', bg: 'linear-gradient(135deg, #000010 0%, #0a0a2a 100%)' },
            warm: { primary: '#FF6B35', secondary: '#F7931E', accent: '#FFD700', bg: 'linear-gradient(135deg, #2a1810 0%, #3a2018 100%)' }
        };
    }

    init() {
        this.injectStyles();
        this.checkAndDisplayEvent();
        setInterval(() => this.checkAndDisplayEvent(), 3600000);
        this.scheduleMiddleightReset();
    }

    injectStyles() {
        if (!document.getElementById('seasonal-dynamic-styles')) {
            const style = document.createElement('style');
            style.id = 'seasonal-dynamic-styles';
            document.head.appendChild(style);
        }
    }

    scheduleMiddleightReset() {
        const now = new Date();
        const night = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
        const msToMidnight = night.getTime() - now.getTime();
        
        setTimeout(() => {
            this.resetDailyView();
            this.scheduleMiddleightReset();
        }, msToMidnight);
    }

    resetDailyView() {
        const today = this.getTodayKey();
        const seenData = this.getSeenData();
        
        Object.keys(seenData).forEach(key => {
            if (key !== today) delete seenData[key];
        });
        
        localStorage.setItem(this.storageKey, JSON.stringify(seenData));
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
        
        if (!seenData[todayKey]) seenData[todayKey] = {};
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
            
            if (hasSeenToday) {
                const existing = document.getElementById('seasonalEvent');
                if (existing) existing.remove();
                return;
            }
            
            this.displayEvent(currentEvent, true);
        } else {
            const existing = document.getElementById('seasonalEvent');
            if (existing) existing.remove();
        }
    }

    getCurrentEvent(today) {
        for (let event of this.events) {
            if (this.isEventActive(event, today)) return event;
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
        if (event.isCalculated) return this.calculateSpecialDate(event.name, year);
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
            case 'Black Friday':
                // 4ème vendredi de novembre
                return this.getNthFridayOfMonth(year, 10, 4);
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

    getNthFridayOfMonth(year, month, n) {
        const firstDay = new Date(year, month, 1);
        const firstFriday = firstDay.getDay() <= 5 ? 6 - firstDay.getDay() : 6;
        return new Date(year, month, firstFriday + (n - 1) * 7);
    }

    displayEvent(event, showPopup) {
        const existing = document.getElementById('seasonalEvent');
        if (existing) existing.remove();

        const theme = this.themeColors[event.theme] || this.themeColors.gold;
        
        const eventDiv = document.createElement('div');
        eventDiv.id = 'seasonalEvent';
        eventDiv.className = `seasonal-event ${event.position} ${event.animation}`;
        
        if (!showPopup) eventDiv.classList.add('discrete-mode');
        
        // Double emoji avec effet de profondeur
        eventDiv.innerHTML = `
            <div class="seasonal-emoji-container" title="${event.message}">
                <div class="seasonal-emoji-shadow">${event.emoji}</div>
                <div class="seasonal-emoji-main">${event.emoji}</div>
                ${event.secondaryEmoji ? `<div class="seasonal-emoji-secondary">${event.secondaryEmoji}</div>` : ''}
            </div>
        `;

        eventDiv.querySelector('.seasonal-emoji-container').onclick = () => {
            this.showEventMessage(event);
            if (event.particles) this.createParticles(event.particles, theme);
        };

        document.body.appendChild(eventDiv);
        
        if (showPopup) {
            setTimeout(() => {
                this.showEventMessage(event);
                if (event.particles) this.createParticles(event.particles, theme);
                this.markAsSeen(event.name);
            }, 8000);
        }
        
        console.log(`🎉 Événement actif : ${event.name}`);
    }

    showEventMessage(event) {
        // Supprimer popup existant
        const existingPopup = document.querySelector('.seasonal-message-popup');
        if (existingPopup) existingPopup.remove();
        
        const theme = this.themeColors[event.theme] || this.themeColors.gold;
        
        const message = document.createElement('div');
        message.className = 'seasonal-message-popup';
        message.innerHTML = `
            <div class="seasonal-popup-bg"></div>
            <div class="seasonal-popup-content">
                <div class="seasonal-popup-glow"></div>
                <div class="seasonal-popup-emojis">
                    <span class="popup-emoji-left">${event.secondaryEmoji || event.emoji}</span>
                    <span class="popup-emoji-main">${event.emoji}</span>
                    <span class="popup-emoji-right">${event.secondaryEmoji || event.emoji}</span>
                </div>
                <h2 class="seasonal-popup-title">${event.message}</h2>
                ${event.subMessage ? `<p class="seasonal-popup-subtitle">${event.subMessage}</p>` : ''}
                <div class="seasonal-popup-buttons">
                    <button class="popup-btn popup-btn-close">
                        <span>✨</span> Fermer
                    </button>
                    <button class="popup-btn popup-btn-hide">
                        <span>🙈</span> Masquer aujourd'hui
                    </button>
                </div>
            </div>
        `;
        
        // Appliquer les couleurs du thème
        const style = document.createElement('style');
        style.textContent = `
            .seasonal-message-popup {
                --popup-primary: ${theme.primary};
                --popup-secondary: ${theme.secondary};
                --popup-accent: ${theme.accent};
                --popup-bg: ${theme.bg};
            }
        `;
        message.appendChild(style);
        
        // Événements
        message.querySelector('.popup-btn-close').onclick = () => message.remove();
        message.querySelector('.popup-btn-hide').onclick = () => {
            message.remove();
            this.markAsSeen(event.name);
            const eventDiv = document.getElementById('seasonalEvent');
            if (eventDiv) eventDiv.remove();
        };
        
        // Fermer en cliquant sur le fond
        message.querySelector('.seasonal-popup-bg').onclick = () => message.remove();
        
        document.body.appendChild(message);
        
        // Auto-fermeture après 12 secondes
        setTimeout(() => {
            if (message.parentNode) message.remove();
        }, 12000);
    }

    createParticles(type, theme) {
        const container = document.createElement('div');
        container.className = 'particles-container';
        document.body.appendChild(container);
        
        const particleCount = 60;
        const particleEmojis = {
            hearts: ['❤️', '💕', '💖', '💗', '💝', '💘'],
            confetti: ['🎊', '🎉', '✨', '⭐', '🌟', '💫'],
            snowflakes: ['❄️', '❅', '❆', '🌨️', '⛄'],
            leaves: ['🍂', '🍁', '🍃', '🌿'],
            petals: ['🌸', '🌺', '🌷', '💮', '🏵️'],
            eggs: ['🥚', '🐣', '🐰', '🌷', '🌸'],
            fish: ['🐟', '🐠', '🐡', '🦈', '💦'],
            clovers: ['☘️', '🍀', '💚', '✨'],
            notes: ['🎵', '🎶', '🎼', '🎤', '🎸'],
            stars: ['⭐', '🌟', '✨', '💫', '🌠'],
            bats: ['🦇', '👻', '💀', '🕷️', '🕸️'],
            fireworks: ['🎆', '🎇', '✨', '💥', '🌟'],
            sun: ['☀️', '🌞', '🌻', '✨', '💛']
        };
        
        const emojis = particleEmojis[type] || particleEmojis.confetti;
        
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = `particle particle-${type}`;
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 2 + 's';
                particle.style.animationDuration = (3 + Math.random() * 3) + 's';
                particle.style.fontSize = (20 + Math.random() * 15) + 'px';
                particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                
                container.appendChild(particle);
                setTimeout(() => particle.remove(), 6000);
            }, i * 80);
        }
        
        setTimeout(() => container.remove(), 12000);
    }
}

// Initialiser
const seasonalEvents = new SeasonalEvents();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🎉 Initialisation des événements saisonniers...');
        seasonalEvents.init();
    });
} else {
    console.log('🎉 Initialisation immédiate des événements saisonniers...');
    seasonalEvents.init();
}

window.seasonalEvents = seasonalEvents;
