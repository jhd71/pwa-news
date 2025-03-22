// js/debug.js
console.log("Script de débogage chargé");

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM chargé, démarrage du débogage");
    
    // Déboguer le bouton de chat
    const chatBtn = document.getElementById('chatToggleBtn');
    if (chatBtn) {
        console.log('Bouton de chat trouvé:', chatBtn);
        
        // Ajouter un écouteur direct
        chatBtn.addEventListener('click', function() {
            console.log('Clic sur le bouton de chat détecté directement');
            
            // Force l'ouverture du chat
            const chatContainer = document.getElementById('chat-container');
            if (chatContainer) {
                console.log('Conteneur de chat trouvé, suppression de hidden');
                chatContainer.classList.remove('hidden');
            } else {
                console.error('ERREUR: Conteneur de chat non trouvé');
                
                // Créer un chat d'urgence
                const emergencyChat = document.createElement('div');
                emergencyChat.id = 'chat-container';
                emergencyChat.className = 'chat-container';
                emergencyChat.style.cssText = `
                    position: fixed;
                    bottom: 80px;
                    right: 20px;
                    width: 300px;
                    height: 400px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.2);
                    display: flex;
                    flex-direction: column;
                    z-index: 1000;
                `;
                
                emergencyChat.innerHTML = `
                    <div style="background: #4051b5; color: white; padding: 10px; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between;">
                        <h3 style="margin: 0;">Chat (mode secours)</h3>
                        <button id="emergencyCloseBtn" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
                    </div>
                    <div id="chatMessages" style="flex: 1; overflow-y: auto; padding: 10px; background: #f5f5f5;">
                        <div style="background: white; padding: 8px; border-radius: 8px; margin-bottom: 10px;">
                            <div>Message de secours: le chat original ne fonctionne pas.</div>
                            <div style="font-size: 0.8em; color: gray; text-align: right;">${new Date().toLocaleTimeString()}</div>
                        </div>
                    </div>
                    <form id="emergencyChatForm" style="display: flex; padding: 10px; border-top: 1px solid #ddd;">
                        <input type="text" placeholder="Votre message..." style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <button type="submit" style="background: #4051b5; color: white; border: none; padding: 8px 12px; margin-left: 8px; border-radius: 4px;">Envoyer</button>
                    </form>
                `;
                
                document.body.appendChild(emergencyChat);
                
                // Ajouter des écouteurs d'événements de base
                document.getElementById('emergencyCloseBtn').addEventListener('click', function() {
                    emergencyChat.style.display = 'none';
                });
                
                document.getElementById('emergencyChatForm').addEventListener('submit', function(e) {
                    e.preventDefault();
                    const input = this.querySelector('input');
                    const message = input.value.trim();
                    
                    if (message) {
                        const messagesContainer = document.getElementById('chatMessages');
                        const messageEl = document.createElement('div');
                        messageEl.style.cssText = 'background: #e3f2fd; padding: 8px; border-radius: 8px; margin-bottom: 10px; margin-left: auto; max-width: 80%;';
                        messageEl.innerHTML = `
                            <div>${message}</div>
                            <div style="font-size: 0.8em; color: gray; text-align: right;">${new Date().toLocaleTimeString()}</div>
                        `;
                        messagesContainer.appendChild(messageEl);
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        input.value = '';
                        
                        console.log('Message envoyé (mode secours):', message);
                    }
                });
            }
        });
    } else {
        console.error('ERREUR: Bouton de chat non trouvé');
    }
    
    // Déboguer le bouton de modération
    const moderationBtn = document.getElementById('moderationBtn');
    if (moderationBtn) {
        console.log('Bouton de modération trouvé:', moderationBtn);
        
        // Remplacer le comportement par défaut
        moderationBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Clic sur le bouton de modération intercepté');
            
            // URL correcte
            const url = window.location.origin + '/moderation.html';
            console.log('Tentative de redirection vers:', url);
            
            // Redirection contrôlée
            window.location.href = url;
        });
    }
    
    // Déboguer la structure de la page
    console.log('Structure actuelle:', {
        'chatToggleBtn': document.getElementById('chatToggleBtn'),
        'chat-container': document.getElementById('chat-container'),
        'chatMessages': document.getElementById('chatMessages'),
        'moderationBtn': document.getElementById('moderationBtn')
    });
});

// Fonction pour diagnostiquer la base de données
async function checkDatabase() {
    console.log("Vérification de la base de données...");
    try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log("Utilisateur connecté:", user);
        
        // Tester les tables
        const tables = ['messages', 'profiles', 'forbidden_words', 'moderators'];
        for (const table of tables) {
            try {
                const { data, error } = await supabase.from(table).select('count').limit(1);
                console.log(`Table ${table}:`, { data, error });
            } catch (e) {
                console.error(`Erreur avec la table ${table}:`, e);
            }
        }
    } catch (e) {
        console.error("Erreur de base de données:", e);
    }
}

// Exécuter après le chargement
setTimeout(checkDatabase, 2000);
