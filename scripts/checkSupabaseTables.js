// scripts/checkSupabaseTables.js
// Script pour vérifier la santé des tables Supabase
// Exécutez avec: node scripts/checkSupabaseTables.js

require('dotenv').config(); // Charger les variables d'environnement

const { createClient } = require('@supabase/supabase-js');

// Configuration de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Créer un client avec la clé anonyme (limitée)
const supabase = createClient(supabaseUrl, supabaseKey);
// Créer un client avec la clé de service (accès complet)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Tables à vérifier
const TABLES = [
  'users',
  'messages',
  'banned_ips',
  'banned_words',
  'push_subscriptions'
];

// Fonction utilitaire pour loguer avec couleur
function logColor(message, color = 'white') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Fonction principale
async function checkTables() {
  logColor('=== Vérification des tables Supabase ===', 'cyan');
  logColor(`URL Supabase: ${supabaseUrl}`, 'blue');
  
  // Vérifier que les clés sont définies
  if (!supabaseKey) {
    logColor('ERREUR: Clé anonyme Supabase non définie!', 'red');
    process.exit(1);
  }
  
  if (!supabaseServiceKey) {
    logColor('ATTENTION: Clé de service Supabase non définie, certaines opérations ne fonctionneront pas', 'yellow');
  }
  
  // Test de connexion
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    logColor('✓ Connexion à Supabase réussie', 'green');
  } catch (error) {
    logColor(`× Erreur de connexion à Supabase: ${error.message}`, 'red');
    process.exit(1);
  }
  
  // Vérifier chaque table
  for (const table of TABLES) {
    try {
      // Essayer de compter les enregistrements
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        logColor(`× Table ${table}: ERREUR - ${error.message}`, 'red');
      } else {
        logColor(`✓ Table ${table}: OK`, 'green');
        
        // Tester la structure (uniquement pour les tables principales)
        if (table === 'users' || table === 'messages') {
          const { data, error: structError } = await supabase
            .from(table)
            .select()
            .limit(1);
          
          if (structError) {
            logColor(`  └ Structure: ERREUR - ${structError.message}`, 'red');
          } else if (data && data.length > 0) {
            logColor(`  └ Structure: OK - ${Object.keys(data[0]).join(', ')}`, 'green');
          } else {
            logColor(`  └ Structure: OK (table vide)`, 'yellow');
          }
        }
      }
    } catch (error) {
      logColor(`× Table ${table}: ERREUR - ${error.message}`, 'red');
    }
  }
  
  // Vérifier si l'administrateur existe
  try {
    const { data: adminUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('pseudo', 'jhd71')
      .single();
    
    if (error) {
      logColor(`× Utilisateur administrateur: ERREUR - ${error.message}`, 'red');
    } else if (adminUser) {
      logColor(`✓ Utilisateur administrateur (jhd71): OK - is_admin: ${adminUser.is_admin}`, 'green');
    } else {
      logColor(`× Utilisateur administrateur (jhd71) introuvable!`, 'red');
      
      // Si l'administrateur n'existe pas, proposer de le créer
      logColor(`  └ Voulez-vous créer l'utilisateur administrateur ? (o/n)`, 'yellow');
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('> ', async (answer) => {
        if (answer.toLowerCase() === 'o') {
          try {
            const { data, error } = await supabaseAdmin
              .from('users')
              .insert({
                pseudo: 'jhd71',
                is_admin: true,
                requires_password: true,
                last_active: new Date().toISOString()
              })
              .select();
            
            if (error) {
              logColor(`× Échec de création de l'administrateur: ${error.message}`, 'red');
            } else {
              logColor(`✓ Administrateur créé avec succès!`, 'green');
            }
          } catch (error) {
            logColor(`× Erreur lors de la création de l'administrateur: ${error.message}`, 'red');
          }
        }
        
        readline.close();
      });
    }
  } catch (error) {
    logColor(`× Vérification administrateur: ERREUR - ${error.message}`, 'red');
  }
}

// Exécuter la vérification
checkTables().catch(error => {
  logColor(`Erreur globale: ${error.message}`, 'red');
  console.error(error);
});