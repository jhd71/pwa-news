// js/supabase-client.js
const supabaseUrl = 'https://aqedqlzsguvkopucyqbb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZWRxbHpzZ3V2a29wdWN5cWJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1MDAxNzUsImV4cCI6MjA1MjA3NjE3NX0.tjdnqCIW0dgmzn3VYx0ugCrISLPFMLhOQJBnnC5cfoo';

// Créer le client Supabase
const supabase = supabaseClient.createClient(supabaseUrl, supabaseAnonKey);

// Exporter pour utilisation dans d'autres scripts
window.supabase = supabase;
// Fonctions utilitaires d'authentification
export async function signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function signUpWithEmail(email, password, profile = {}) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: profile }
    });

    if (error) throw error;
    return data;
}
