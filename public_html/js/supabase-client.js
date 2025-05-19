// supabase-client.js
(function() {
    // Vérifier que la bibliothèque Supabase est chargée
    if (typeof supabase === 'undefined') {
        console.error('Erreur : La bibliothèque Supabase n\'est pas chargée.');
        alert('Erreur de chargement. Veuillez rafraîchir la page.');
        return;
    }
    
    const SUPABASE_URL = 'https://ekjgfiyhkythqcnmhzea.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramdmaXloa3l0aHFjbm1oemVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzYxNDIsImV4cCI6MjA1ODI1MjE0Mn0.V0j_drb6GiTojgwxC6ydjnyJDRRT9lUbSc1E7bFE2Z4';
    
    // Variable pour stocker l'instance
    let supabaseClient = null;
    
    // Fonction pour obtenir l'instance (crée l'instance s'il n'existe pas encore)
    window.getSupabaseClient = function() {
        if (!supabaseClient) {
            try {
                console.log('Initialisation du client Supabase partagé');
                supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            } catch (error) {
                console.error('Erreur lors de l\'initialisation de Supabase:', error);
                alert('Erreur de connexion à la base de données. Veuillez rafraîchir la page.');
            }
        }
        return supabaseClient;
    };
})();