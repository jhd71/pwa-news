// supabase-client.js - Version optimisée pour chat, galerie, visiteurs
(function() {
    // Vérification pour s'assurer que la bibliothèque Supabase est bien chargée
    if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
        console.error('❌ Erreur fatale: La bibliothèque Supabase n\'est pas correctement chargée');
        // Remplacer alert par notification moins intrusive
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: #ff4444; color: white; padding: 15px 25px; border-radius: 8px;
            z-index: 10000; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.textContent = '⚠️ Erreur de connexion. Actualisez la page.';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
        return;
    }
    
    const SUPABASE_URL = 'https://ekjgfiyhkythqcnmhzea.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramdmaXloa3l0aHFjbm1oemVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzYxNDIsImV4cCI6MjA1ODI1MjE0Mn0.V0j_drb6GiTojgwxC6ydjnyJDRRT9lUbSc1E7bFE2Z4';
    
    // Variable pour stocker l'instance
    let supabaseClient = null;
    let initializationAttempts = 0;
    const MAX_ATTEMPTS = 3;
    
    // Fonction pour obtenir l'instance (crée l'instance s'il n'existe pas encore)
    window.getSupabaseClient = function() {
        if (!supabaseClient && initializationAttempts < MAX_ATTEMPTS) {
            try {
                initializationAttempts++;
                console.log(`🔄 Initialisation du client Supabase partagé (tentative ${initializationAttempts})`);
                
                supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: false, // Pas besoin de session pour votre usage public
                        detectSessionInUrl: false
                    },
                    realtime: {
    enabled: false // DÉSACTIVATION COMPLÈTE du temps réel
},
                    global: {
                        headers: {
                            'x-client-info': 'actuetmedia-app'
                        }
                    }
                });
                
                console.log('✅ Client Supabase initialisé avec succès');
                
                // Reset le compteur en cas de succès
                initializationAttempts = 0;
                
            } catch (error) {
                console.error(`❌ Erreur lors de l'initialisation de Supabase (tentative ${initializationAttempts}):`, error);
                
                if (initializationAttempts >= MAX_ATTEMPTS) {
                    console.error('❌ Échec d\'initialisation après 3 tentatives');
                    // Notification d'erreur plus discrète
                    if (document.body) {
                        const errorDiv = document.createElement('div');
                        errorDiv.style.cssText = `
                            position: fixed; bottom: 20px; right: 20px;
                            background: #ff4444; color: white; padding: 10px 15px;
                            border-radius: 6px; font-size: 14px; z-index: 9999;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        `;
                        errorDiv.textContent = '⚠️ Erreur de connexion BDD';
                        document.body.appendChild(errorDiv);
                        setTimeout(() => errorDiv.remove(), 4000);
                    }
                }
                
                return null;
            }
        }
        return supabaseClient;
    };
    
    // ✅ NOUVELLE FONCTION : Test de santé de la connexion
    window.testSupabaseHealth = async function() {
        const client = window.getSupabaseClient();
        if (!client) {
            console.warn('⚠️ Client Supabase non disponible pour le test');
            return false;
        }
        
        try {
            // Test simple qui ne nécessite pas de table spécifique
            const { error } = await client.auth.getSession();
            if (error && error.message !== 'Auth session missing!') {
                throw error;
            }
            
            console.log('✅ Connexion Supabase OK');
            return true;
        } catch (error) {
            console.error('❌ Test de santé Supabase échoué:', error);
            return false;
        }
    };
    
    // ✅ NOUVELLE FONCTION : Gestion centralisée des erreurs
    window.handleSupabaseError = function(error, context = 'Opération') {
        console.group(`❌ Erreur Supabase - ${context}`);
        console.error('Détails:', error);
        
        // Identification des erreurs communes
        if (error?.code === 'PGRST116') {
            console.warn('💡 Solution: Vérifiez le nom de la table/vue');
        } else if (error?.code === '42501') {
            console.warn('💡 Solution: Vérifiez les politiques RLS dans Supabase');
        } else if (error?.message?.includes('JWT')) {
            console.warn('💡 Solution: Problème d\'authentification, rechargez la page');
        } else if (error?.message?.includes('fetch')) {
            console.warn('💡 Solution: Vérifiez votre connexion internet');
        } else if (error?.message?.includes('Failed to fetch')) {
            console.warn('💡 Solution: Serveur Supabase temporairement indisponible');
        }
        
        console.groupEnd();
        return error;
    };
    
    // ✅ NOUVELLE FONCTION : Reset pour débogage
    window.resetSupabaseClient = function() {
        supabaseClient = null;
        initializationAttempts = 0;
        console.log('🔄 Client Supabase réinitialisé');
    };
    
    // ✅ Auto-test optionnel au chargement (décommentez si souhaité)
    // setTimeout(() => {
    //     window.testSupabaseHealth();
    // }, 2000);
    
})();

// Test immédiat pour vérifier que tout fonctionne
console.log('🧪 Test de la fonction getSupabaseClient:', typeof window.getSupabaseClient === 'function' ? '✅ OK' : '❌ ERREUR');

// ✅ NOUVEAU : Information de debug
console.log('📊 Supabase Client Manager chargé - Version optimisée pour chat, galerie, visiteurs');

// ✅ SYSTÈME DE POLLING POUR REMPLACER LE TEMPS RÉEL
window.PollingManager = {
    intervals: {},
    
    // Démarrer le polling pour les visiteurs
    startVisitorPolling: function() {
        if (this.intervals.visitors) return; // Éviter les doublons
        
        console.log('🔄 Démarrage du polling visiteurs (sans WebSocket)');
        
        this.intervals.visitors = setInterval(async () => {
            try {
                const client = window.getSupabaseClient();
                if (!client) return;
                
                const { data, error } = await client
                    .from('visitors')
                    .select('*')
                    .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString());
                
                if (error) throw error;
                
                const count = data ? data.length : 0;
                console.log(`👥 Polling - ${count} visiteurs actifs`);
                
                // Mettre à jour l'affichage si la fonction existe
                if (window.updateVisitorCount) {
                    window.updateVisitorCount(count);
                }
                
                // Mettre à jour l'élément HTML directement
                const visitorElement = document.querySelector('[data-visitor-count]');
                if (visitorElement) {
                    visitorElement.textContent = count;
                }
                
            } catch (error) {
                console.warn('⚠️ Erreur polling visiteurs:', error.message);
            }
        }, 15000); // Toutes les 15 secondes
    },
    
    // Démarrer le polling pour le chat
    startChatPolling: function() {
        if (this.intervals.chat) return;
        
        console.log('💬 Démarrage du polling chat (sans WebSocket)');
        
        this.intervals.chat = setInterval(async () => {
            try {
                const client = window.getSupabaseClient();
                if (!client) return;
                
                // Récupérer les derniers messages
                const { data, error } = await client
                    .from('messages')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);
                
                if (error) throw error;
                
                // Si une fonction de mise à jour du chat existe
                if (window.updateChatMessages && data) {
                    window.updateChatMessages(data);
                }
                
            } catch (error) {
                console.warn('⚠️ Erreur polling chat:', error.message);
            }
        }, 5000); // Toutes les 5 secondes pour le chat
    },
    
    // Arrêter tous les pollings
    stopAll: function() {
        Object.keys(this.intervals).forEach(key => {
            if (this.intervals[key]) {
                clearInterval(this.intervals[key]);
                delete this.intervals[key];
                console.log(`🛑 Polling ${key} arrêté`);
            }
        });
    }
};

// ✅ FONCTION DE REMPLACEMENT POUR LES SOUSCRIPTIONS TEMPS RÉEL
window.subscribeToChanges = function(table, callback) {
    console.log(`📡 Souscription ${table} convertie en polling`);
    
    if (table === 'visitors') {
        window.PollingManager.startVisitorPolling();
    } else if (table === 'messages') {
        window.PollingManager.startChatPolling();
    }
    
    // Retourner un objet compatible
    return {
        unsubscribe: () => {
            console.log(`🔌 Désouscription ${table}`);
        }
    };
};

// ✅ AUTO-DÉMARRAGE du polling après 3 secondes
setTimeout(() => {
    console.log('🚀 Démarrage automatique du polling système');
    window.PollingManager.startVisitorPolling();
    
    // Démarrer le chat polling seulement si nécessaire
    if (document.querySelector('[data-chat-container]') || window.chatEnabled) {
        window.PollingManager.startChatPolling();
    }
}, 3000);

// ✅ NETTOYAGE lors du déchargement de la page
window.addEventListener('beforeunload', () => {
    window.PollingManager.stopAll();
});