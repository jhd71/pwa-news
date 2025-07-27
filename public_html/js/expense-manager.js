// Gestion du bouton gestionnaire de dépenses avec tracking
function openExpenseManager() {
    // Tracking du clic
    trackExpenseManagerClick();
    
    const url = 'https://depenses.actuetmedia.fr/';
    const isInPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    window.navigator.standalone ||
                    document.referrer.includes('android-app://');
    
    if (isInPWA) {
        // Message d'aide pour PWA
        const newWindow = window.open(url, '_blank');
        
        setTimeout(() => {
            const message = '✨ L\'application Gestionnaire de Dépenses s\'est ouverte dans votre navigateur.\n\n';
            const instructions = '📱 Pour l\'installer :\n• Chrome/Edge : Menu ⋮ → "Installer"\n• Safari : Partager → "Sur l\'écran d\'accueil"';
            alert(message + instructions);
        }, 1500);
    } else {
        // Ouverture normale
        window.open(url, '_blank');
    }
}

// Fonction pour tracker les clics
function trackExpenseManagerClick() {
    // Récupérer le nombre actuel de clics
    let clickCount = parseInt(localStorage.getItem('expenseManagerClicks') || '0');
    clickCount++;
    
    // Sauvegarder le nouveau compte
    localStorage.setItem('expenseManagerClicks', clickCount);
    localStorage.setItem('lastExpenseManagerClick', new Date().toISOString());
    
    // Enregistrer aussi les clics par jour
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `expenseManagerClicks_${today}`;
    let dailyCount = parseInt(localStorage.getItem(dailyKey) || '0');
    dailyCount++;
    localStorage.setItem(dailyKey, dailyCount);
    
    console.log(`💰 Gestionnaire de dépenses - Clic #${clickCount} (${dailyCount} aujourd'hui)`);
    
    // Option : Envoyer à Supabase si vous voulez centraliser les stats
    if (window.getSupabaseClient) {
        sendClickToSupabase(clickCount, dailyCount);
    }
}

// Fonction pour visualiser les stats (pour vous en tant qu'admin)
function getExpenseManagerStats() {
    const totalClicks = localStorage.getItem('expenseManagerClicks') || '0';
    const lastClick = localStorage.getItem('lastExpenseManagerClick');
    const today = new Date().toISOString().split('T')[0];
    const todayClicks = localStorage.getItem(`expenseManagerClicks_${today}`) || '0';
    
    // Calculer les stats sur 7 jours
    let weekStats = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayClicks = localStorage.getItem(`expenseManagerClicks_${dateStr}`) || '0';
        weekStats.push({
            date: dateStr,
            clicks: parseInt(dayClicks)
        });
    }
    
    return {
        total: totalClicks,
        today: todayClicks,
        lastClick: lastClick,
        weekStats: weekStats
    };
}

// Option : Envoyer à Supabase pour centraliser
async function sendClickToSupabase(totalClicks, dailyClicks) {
    const supabase = window.getSupabaseClient();
    if (!supabase) return;
    
    try {
        const { data, error } = await supabase
            .from('app_clicks') // Vous devrez créer cette table
            .insert([
                {
                    app_name: 'expense_manager',
                    total_clicks: totalClicks,
                    daily_clicks: dailyClicks,
                    user_agent: navigator.userAgent,
                    is_pwa: window.matchMedia('(display-mode: standalone)').matches,
                    created_at: new Date().toISOString()
                }
            ]);
            
        if (error) {
            console.error('Erreur Supabase:', error);
        }
    } catch (err) {
        console.error('Erreur tracking:', err);
    }
}

// Ajouter une fonction admin pour voir les stats (accessible via console)
window.showExpenseManagerStats = function() {
    const stats = getExpenseManagerStats();
    
    console.log('📊 === STATS GESTIONNAIRE DE DÉPENSES ===');
    console.log(`Total clics: ${stats.total}`);
    console.log(`Clics aujourd'hui: ${stats.today}`);
    console.log(`Dernier clic: ${stats.lastClick ? new Date(stats.lastClick).toLocaleString('fr-FR') : 'Jamais'}`);
    console.log('\n📅 Stats sur 7 jours:');
    
    stats.weekStats.forEach(day => {
        const dayName = new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' });
        console.log(`${dayName} ${day.date}: ${day.clicks} clics`);
    });
    
    // Créer un graphique simple dans la console
    const maxClicks = Math.max(...stats.weekStats.map(d => d.clicks));
    console.log('\n📈 Graphique:');
    stats.weekStats.reverse().forEach(day => {
        const bars = '█'.repeat(Math.round((day.clicks / maxClicks) * 20) || 0);
        const dayName = new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' });
        console.log(`${dayName}: ${bars} ${day.clicks}`);
    });
};

// Auto-nettoyer les vieilles données (garder 30 jours)
function cleanOldClickData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Parcourir le localStorage et supprimer les vieilles entrées
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('expenseManagerClicks_')) {
            const dateStr = key.replace('expenseManagerClicks_', '');
            const date = new Date(dateStr);
            if (date < thirtyDaysAgo) {
                localStorage.removeItem(key);
            }
        }
    });
}

// Nettoyer au chargement
document.addEventListener('DOMContentLoaded', cleanOldClickData);