// js/supabase-client.js
const supabaseUrl = 'https://aqedqlzsguvkopucyqbb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxZWRxbHpzZ3V2a29wdWN5cWJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1MDAxNzUsImV4cCI6MjA1MjA3NjE3NX0.tjdnqCIW0dgmzn3VYx0ugCrISLPFMLhOQJBnnC5cfoo';

// Initialiser Supabase
try {
  window.supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);
  console.log('Client Supabase initialisé avec succès');
} catch (error) {
  console.error('Erreur lors de l\'initialisation de Supabase:', error);
}

// Fonctions d'authentification - sans export
window.signInWithEmail = async function(email, password) {
  try {
    const { data, error } = await window.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur de connexion:', error);
    throw error;
  }
}
