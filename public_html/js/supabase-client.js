// js/supabase-client.js
const supabaseUrl = 'https://aqedqlzsguvkopucyqbb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZWRxbHpzZ3V2a29wdWN5cWJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1MDAxNzUsImV4cCI6MjA1MjA3NjE3NX0.tjdnqCIW0dgmzn3VYx0ugCrISLPFMLhOQJBnnC5cfoo';

// S'assurer que la bibliothèque Supabase est disponible
if (typeof supabase === 'undefined') {
  console.error('La bibliothèque Supabase n\'est pas chargée correctement');
}

// Créer une instance Supabase si elle n'existe pas déjà
try {
  if (typeof window.supabaseInstance === 'undefined') {
    window.supabaseInstance = supabase.createClient(supabaseUrl, supabaseAnonKey);
    console.log('Client Supabase initialisé');
  }
} catch (error) {
  console.error('Erreur lors de l\'initialisation de Supabase:', error);
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
