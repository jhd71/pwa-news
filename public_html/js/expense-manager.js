// Gestion du bouton gestionnaire de dépenses
function openExpenseManager() {
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