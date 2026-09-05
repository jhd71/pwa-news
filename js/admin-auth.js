/* ============================================================================
   Authentification des pages d'administration — Actu & Média
   ----------------------------------------------------------------------------
   Remplace la vérification du mot de passe qui se faisait dans le navigateur.
   Jusqu'ici, admin-hub.html, admin-news.html et admin-sport.html comparaient
   l'empreinte SHA-256 du mot de passe à une constante écrite en dur dans la
   page — or ces pages sont servies publiquement, donc cette empreinte était
   lisible par tout le monde et cassable hors ligne.

   Désormais c'est Supabase qui vérifie les identifiants et délivre un jeton de
   session à durée limitée, renouvelé tout seul. Plus aucun secret ne se
   promène dans le navigateur, et ce jeton servira aussi à identifier
   l'administrateur auprès des règles de la base et de l'API de notifications.
   ========================================================================== */
window.AdminAuth = (function () {
    'use strict';

    var SUPABASE_URL = 'https://ekjgfiyhkythqcnmhzea.supabase.co';
    // Clé publique : elle est faite pour être connue. Ce qu'elle permet de
    // faire est décidé par les règles RLS de chaque table.
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramdmaXloa3l0aHFjbm1oemVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzYxNDIsImV4cCI6MjA1ODI1MjE0Mn0.V0j_drb6GiTojgwxC6ydjnyJDRRT9lUbSc1E7bFE2Z4';

    var MEMOIRE_EMAIL = 'adminEmail';
    // Anciennes clés de session, devenues sans objet : on les efface au
    // passage pour ne pas laisser traîner l'ancien mot de passe en clair.
    var ANCIENNES_CLES = ['adminHubAuth', 'adminNewsAuth', 'adminNewsKey',
                          'adminSportAuth', 'admin_session', 'adminAuth'];

    var client = null;

    function sb() {
        if (!client) {
            if (!window.supabase || !window.supabase.createClient) {
                throw new Error('supabase-js n\'est pas chargé sur cette page');
            }
            client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
        return client;
    }

    function menageAncienneSession() {
        ANCIENNES_CLES.forEach(function (k) {
            try { localStorage.removeItem(k); } catch (e) {}
        });
    }

    function messageErreur(error) {
        var m = ((error && error.message) || '').toLowerCase();
        if (m.indexOf('invalid login') >= 0)      return 'Identifiants incorrects';
        if (m.indexOf('email not confirmed') >= 0) return 'Adresse non confirmée dans Supabase';
        if (m.indexOf('failed to fetch') >= 0)     return 'Pas de connexion au serveur';
        if (m.indexOf('rate limit') >= 0)          return 'Trop de tentatives, réessayez dans un instant';
        return (error && error.message) ? error.message : 'Connexion impossible';
    }

    /* La session en cours, ou null. Supabase la garde et la renouvelle seul. */
    async function session() {
        try {
            var r = await sb().auth.getSession();
            return (r && r.data && r.data.session) ? r.data.session : null;
        } catch (e) { return null; }
    }

    async function connecte() {
        return (await session()) !== null;
    }

    async function connexion(email, motDePasse) {
        var r;
        try {
            r = await sb().auth.signInWithPassword({ email: email, password: motDePasse });
        } catch (e) {
            return { ok: false, message: messageErreur(e) };
        }
        if (r.error) return { ok: false, message: messageErreur(r.error) };
        try { localStorage.setItem(MEMOIRE_EMAIL, email); } catch (e) {}
        menageAncienneSession();
        return { ok: true, session: r.data.session };
    }

    async function deconnexion() {
        try { await sb().auth.signOut(); } catch (e) {}
        menageAncienneSession();
    }

    /* Le jeton à envoyer à nos routes serveur pour prouver qu'on est admin. */
    async function jeton() {
        var s = await session();
        return s ? s.access_token : null;
    }

    /* L'adresse saisie la dernière fois, pour ne la retaper qu'une fois par
       appareil. Elle n'est jamais écrite dans les fichiers du site. */
    function emailMemorise() {
        try { return localStorage.getItem(MEMOIRE_EMAIL) || ''; } catch (e) { return ''; }
    }

    /* Prévient à chaque changement (connexion, déconnexion, renouvellement du
       jeton) — pratique pour garder une variable de jeton toujours à jour. */
    function surChangement(fn) {
        try {
            sb().auth.onAuthStateChange(function (evenement, s) { fn(s, evenement); });
        } catch (e) {}
    }

    return {
        client: sb,
        session: session,
        connecte: connecte,
        connexion: connexion,
        deconnexion: deconnexion,
        jeton: jeton,
        emailMemorise: emailMemorise,
        surChangement: surChangement
    };
})();
