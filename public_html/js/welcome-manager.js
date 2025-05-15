// welcome-manager.js
document.addEventListener('DOMContentLoaded', function() {
    const welcomeMessage = document.querySelector('.welcome-message');
    const closeButton = document.querySelector('.welcome-close');
    
    if (!welcomeMessage || !closeButton) return;
    
    // Vérifier si l'utilisateur a déjà fermé le message
    const isWelcomeClosed = localStorage.getItem('welcomeClosed');
    
    if (isWelcomeClosed === 'true') {
        welcomeMessage.style.display = 'none';
    }
    
    // Gérer la fermeture du message
    closeButton.addEventListener('click', function() {
        welcomeMessage.style.display = 'none';
        localStorage.setItem('welcomeClosed', 'true');
    });
});