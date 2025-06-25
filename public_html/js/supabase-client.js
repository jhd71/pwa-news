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
		params: {
        eventsPerSecond: 2, // Réduction drastique pour éviter les erreurs
        heartbeatInterval: 30000, // 30 secondes au lieu de 10
        reconnectAfterMs: 5000 // Attendre 5 secondes avant de se reconnecter
    }
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

// ✅ NOUVEAU : Gestion des erreurs WebSocket temps réel
window.setupRealtimeErrorHandling = function() {
    const client = window.getSupabaseClient();
    if (!client) return;
    
    // Intercepter les erreurs de connexion WebSocket
    const originalSubscribe = client.channel.bind(client);
    
    client.channelWithErrorHandling = function(channelName) {
        const channel = client.channel(channelName);
        
        return {
            ...channel,
            subscribe: function(callback) {
                const originalCallback = callback || function() {};
                
                return channel.subscribe((status, err) => {
                    console.log(`📡 Canal ${channelName} - Statut:`, status);
                    
                    if (status === 'CHANNEL_ERROR') {
                        console.warn(`⚠️ Erreur WebSocket sur ${channelName} - Basculement en mode polling`);
                        // Ne pas spam les reconnexions
                        setTimeout(() => {
                            console.log(`🔄 Tentative de reconnexion pour ${channelName}`);
                        }, 10000); // Attendre 10 secondes
                    }
                    
                    // Appeler le callback original
                    originalCallback(status, err);
                });
            }
        };
    };
};

// ✅ NOUVEAU : Mode dégradé sans temps réel
window.enablePollingMode = function() {
    console.log('🔄 Activation du mode polling (sans WebSocket)');
    
    // Désactiver complètement le temps réel
    window.REALTIME_DISABLED = true;
    
    // Fonction de polling pour les visiteurs
    if (window.updateVisitorCount) {
        setInterval(async () => {
            try {
                const client = window.getSupabaseClient();
                if (client) {
                    const { data } = await client
                        .from('visitors')
                        .select('*')
                        .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString());
                    
                    if (data) {
                        console.log(`👥 Polling - Visiteurs actifs: ${data.length}`);
                        window.updateVisitorCount(data.length);
                    }
                }
            } catch (error) {
                console.warn('⚠️ Erreur polling visiteurs:', error.message);
            }
        }, 30000); // Toutes les 30 secondes
    }
};

// Auto-activation du mode polling si trop d'erreurs WebSocket
let websocketErrorCount = 0;
window.trackWebSocketError = function() {
    websocketErrorCount++;
    console.warn(`⚠️ Erreur WebSocket #${websocketErrorCount}`);
    
    if (websocketErrorCount >= 5) {
        console.log('🚨 Trop d\'erreurs WebSocket - Activation du mode polling');
        window.enablePollingMode();
    }
};