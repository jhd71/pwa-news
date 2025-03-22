// js/debug.js
console.log("Script de débogage chargé");

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM chargé, démarrage du débogage");
    
    // Vérification de la structure de la page
    console.log('Structure actuelle:', {
        'bouton': document.getElementById('chatToggleBtn'),
        'conteneur': document.getElementById('chat-container'),
        'messages': document.getElementById('chatMessages'),
        'formulaire': document.getElementById('chatForm')
    });
});

// Fonction de diagnostic simplifiée sans dépendances
function checkDatabase() {
    console.log("Vérification de base de données basique");
    if (window.supabase) {
        console.log("Supabase est disponible globalement");
    } else {
        console.error("Supabase n'est pas disponible globalement");
    }
}

// Exécuter après un délai
setTimeout(checkDatabase, 2000);
