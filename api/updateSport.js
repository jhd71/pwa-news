// api/updateSport.js - Scraper automatique FC Montceau Bourgogne
// Source: SportCorico (SSR Nuxt.js, données fiables)
// Cron Vercel: tous les jours à 7h du matin

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ekjgfiyhkythqcnmhzea.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramdmaXloa3l0aHFjbm1oemVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzYxNDIsImV4cCI6MjA1ODI1MjE0Mn0.V0j_drb6GiTojgwxC6ydjnyJDRRT9lUbSc1E7bFE2Z4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SPORTCORICO_URL = 'https://www.sportcorico.com/clubs/fc-montceau-bourgogne/montceau-fc-bourgogn';
const COMPETITION = 'REGIONAL 1 HERBELIN';

export const config = { maxDuration: 30 };

// ============================================
// FETCH HTML
// ============================================
async function fetchHTML(url) {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'fr-FR,fr;q=0.9',
        }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
}

// ============================================
// NETTOYER HTML → TEXTE
// ============================================
function htmlToText(html) {
    return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // supprimer scripts
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // supprimer styles
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(?:div|p|h[1-6]|li|tr|td|th|a|section|article|header|footer)>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')  // supprimer toutes les balises
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#x27;/g, "'")
        .replace(/[ \t]+/g, ' ')   // espaces multiples → un seul
        .replace(/\n[ \t]+/g, '\n') // espaces en début de ligne
        .replace(/\n{3,}/g, '\n\n') // max 2 sauts de ligne
        .trim();
}

// ============================================
// PARSER DERNIER MATCH + PROCHAIN MATCH
// ============================================
function parseHeaderMatches(text) {
    const result = { lastMatch: null, nextMatch: null };

    // ---- DERNIER MATCH ----
    // Pattern dans le texte nettoyé:
    // "Dernier Match REGIONAL 1 HERBELIN ... TeamA 1 DD/MM/YYYY [HH:MM | score1 - score2] TeamB 1"
    const dernierRegex = /Dernier Match\s+REGIONAL 1 HERBELIN\s+([\s\S]*?)(?:Prochain Match|Calendier)/i;
    const dernierMatch = dernierRegex.exec(text);

    if (dernierMatch) {
        const block = dernierMatch[1];
        // Chercher: NomEquipe1 1  date  [score1 - score2 | heure]  NomEquipe2 1
        // Format texte: "Montceau 1 14/02/2026 18:00 Is-selongey 1" ou "Sens FC 1 07/02/2026 1 - 0 Montceau 1"
        const matchWithScore = block.match(/([\w\s'.()-]+\d)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d+)\s*-\s*(\d+)\s+([\w\s'.()-]+\d)/);
        const matchNoScore = block.match(/([\w\s'.()-]+\d)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})\s+([\w\s'.()-]+\d)/);

        if (matchWithScore) {
            const [, team1, dateStr, s1, s2, team2] = matchWithScore;
            const [day, month, year] = dateStr.split('/');
            const isHome = team1.trim().toLowerCase().includes('montceau');
            result.lastMatch = {
                date: `${year}-${month}-${day}`,
                homeTeam: isHome ? 'FC Montceau' : team1.replace(/\s*\d+$/, '').trim(),
                awayTeam: isHome ? team2.replace(/\s*\d+$/, '').trim() : 'FC Montceau',
                homeScore: parseInt(s1),
                awayScore: parseInt(s2),
                isHome: isHome,
            };
        }
        // Si pas de score (match reporté/pas joué), on ne met pas à jour
    }

    // ---- PROCHAIN MATCH ----
    const prochainRegex = /Prochain Match\s+REGIONAL 1 HERBELIN\s+([\s\S]*?)(?:Calendier|Classement)/i;
    const prochainMatch = prochainRegex.exec(text);

    if (prochainMatch) {
        const block = prochainMatch[1];
        // Format: "Garchizy AS 1 22/02/2026 14:30 Montceau 1"
        const matchNext = block.match(/([\w\s'.()-]+\d)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})\s+([\w\s'.()-]+\d)/);

        if (matchNext) {
            const [, team1, dateStr, time, team2] = matchNext;
            const [day, month, year] = dateStr.split('/');
            const isHome = team1.trim().toLowerCase().includes('montceau');
            result.nextMatch = {
                date: `${year}-${month}-${day}`,
                time: time,
                homeTeam: isHome ? 'FC Montceau' : team1.replace(/\s*\d+$/, '').trim(),
                awayTeam: isHome ? team2.replace(/\s*\d+$/, '').trim() : 'FC Montceau',
                isHome: isHome,
            };
        }
    }

    return result;
}

// ============================================
// PARSER TOUS LES MATCHS DE CHAMPIONNAT
// ============================================
function parseChampionnatResults(text) {
    const results = [];

    // Chercher tous les blocs "REGIONAL 1 HERBELIN ... Team1 X date X - Y Team2 X"
    // Dans le texte, chaque match apparaît comme :
    // REGIONAL 1 HERBELIN  TeamA 1  DD/MM/YYYY  score1 - score2  TeamB 1
    const matchRegex = /REGIONAL 1 HERBELIN\s+([\w\s'.()-]+?\d)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d+)\s*-\s*(\d+)\s+([\w\s'.()-]+?\d)/g;

    let m;
    while ((m = matchRegex.exec(text)) !== null) {
        const [, team1, dateStr, s1, s2, team2] = m;
        const t1 = team1.trim();
        const t2 = team2.trim();

        // Vérifier que c'est un match de Montceau
        if (!t1.toLowerCase().includes('montceau') && !t2.toLowerCase().includes('montceau')) continue;

        const [day, month, year] = dateStr.split('/');
        const isHome = t1.toLowerCase().includes('montceau');

        results.push({
            date: `${year}-${month}-${day}`,
            homeTeam: t1,
            awayTeam: t2,
            homeScore: parseInt(s1),
            awayScore: parseInt(s2),
            isHome: isHome,
        });
    }

    return results;
}

// ============================================
// PARSER LA FORME (header SportCorico)
// ============================================
function parseForm(text) {
    // Dans le header: "Football V D V D D Changer d'équipe"
    const formMatch = text.match(/Football\s+([VDN](?:\s+[VDN]){1,9})\s/i);
    if (formMatch) {
        const letters = formMatch[1].match(/[VDN]/gi);
        if (letters && letters.length >= 2) {
            return letters.map(l => l.toUpperCase()).join(',');
        }
    }
    return null;
}

// ============================================
// CALCULER STATS DEPUIS RÉSULTATS
// ============================================
function computeStats(results) {
    let played = 0, won = 0, drawn = 0, lost = 0, goalsFor = 0, goalsAgainst = 0;
    for (const r of results) {
        played++;
        const fcmb = r.isHome ? r.homeScore : r.awayScore;
        const opp = r.isHome ? r.awayScore : r.homeScore;
        goalsFor += fcmb;
        goalsAgainst += opp;
        if (fcmb > opp) won++;
        else if (fcmb < opp) lost++;
        else drawn++;
    }
    return { played, won, drawn, lost, points: won * 3 + drawn, goalsFor, goalsAgainst };
}

// ============================================
// FORME DEPUIS RÉSULTATS
// ============================================
function computeFormFromResults(results) {
    const sorted = [...results].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-5).map(r => {
        const fcmb = r.isHome ? r.homeScore : r.awayScore;
        const opp = r.isHome ? r.awayScore : r.homeScore;
        return fcmb > opp ? 'V' : fcmb < opp ? 'D' : 'N';
    }).join(',');
}

// ============================================
// MISE À JOUR SUPABASE
// ============================================
async function updateSupabase(data) {
    const { data: existing } = await supabase
        .from('sport_data')
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

    const payload = { ...data, updated_at: new Date().toISOString(), updated_by: 'scraper-sportcorico' };

    if (existing) {
        const { error } = await supabase.from('sport_data').update(payload).eq('id', existing.id);
        if (error) throw error;
        return 'updated';
    } else {
        const { error } = await supabase.from('sport_data').insert(payload);
        if (error) throw error;
        return 'inserted';
    }
}

// ============================================
// HANDLER PRINCIPAL
// ============================================
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        console.log('⚽ Début scraping FC Montceau (SportCorico)...');
        const updateData = {};
        const logs = [];

        // === 1. FETCH + NETTOYAGE ===
        const html = await fetchHTML(SPORTCORICO_URL);
        const text = htmlToText(html);
        logs.push(`✅ Page récupérée (${html.length} chars HTML → ${text.length} chars texte)`);

        // === 2. FORME (header) ===
        const headerForm = parseForm(text);
        if (headerForm) {
            updateData.form = headerForm;
            logs.push(`✅ Forme: ${headerForm}`);
        }

        // === 3. DERNIER MATCH + PROCHAIN MATCH (sections header) ===
        const { lastMatch, nextMatch } = parseHeaderMatches(text);

        if (lastMatch) {
            updateData.last_match_date = lastMatch.date;
            updateData.last_match_home_team = lastMatch.homeTeam;
            updateData.last_match_away_team = lastMatch.awayTeam;
            updateData.last_match_home_score = lastMatch.homeScore;
            updateData.last_match_away_score = lastMatch.awayScore;
            updateData.last_match_is_home = lastMatch.isHome;
            logs.push(`✅ Dernier match: ${lastMatch.homeTeam} ${lastMatch.homeScore}-${lastMatch.awayScore} ${lastMatch.awayTeam}`);
        } else {
            logs.push('⚠️ Dernier match: pas de score (match reporté ou pas encore joué)');
        }

        if (nextMatch) {
            updateData.next_match_date = nextMatch.date;
            updateData.next_match_time = nextMatch.time;
            updateData.next_match_home_team = nextMatch.homeTeam;
            updateData.next_match_away_team = nextMatch.awayTeam;
            updateData.next_match_is_home = nextMatch.isHome;
            logs.push(`✅ Prochain match: ${nextMatch.homeTeam} vs ${nextMatch.awayTeam} le ${nextMatch.date} à ${nextMatch.time}`);
        } else {
            logs.push('⚠️ Prochain match non trouvé dans le header');
        }

        // === 4. TOUS LES RÉSULTATS CHAMPIONNAT ===
        const allResults = parseChampionnatResults(text);
        logs.push(`📊 ${allResults.length} matchs de championnat R1 trouvés`);

        if (allResults.length > 0) {
            const stats = computeStats(allResults);
            updateData.standing_points = stats.points;
            updateData.standing_played = stats.played;
            updateData.standing_won = stats.won;
            updateData.standing_drawn = stats.drawn;
            updateData.standing_lost = stats.lost;
            updateData.standing_goals_for = stats.goalsFor;
            updateData.standing_goals_against = stats.goalsAgainst;
            logs.push(`✅ Stats: ${stats.points}pts, ${stats.played}J, ${stats.won}V-${stats.drawn}N-${stats.lost}D, BP${stats.goalsFor}-BC${stats.goalsAgainst}`);

            // Forme calculée (backup si header ne marche pas)
            if (!headerForm) {
                updateData.form = computeFormFromResults(allResults);
                logs.push(`✅ Forme (calculée): ${updateData.form}`);
            }

            // Dernier match depuis résultats (si header n'a pas de score)
            if (!lastMatch) {
                const sorted = [...allResults].sort((a, b) => a.date.localeCompare(b.date));
                const latest = sorted[sorted.length - 1];
                updateData.last_match_date = latest.date;
                updateData.last_match_home_team = latest.isHome ? 'FC Montceau' : latest.homeTeam.replace(/\s*\d+$/, '');
                updateData.last_match_away_team = latest.isHome ? latest.awayTeam.replace(/\s*\d+$/, '') : 'FC Montceau';
                updateData.last_match_home_score = latest.homeScore;
                updateData.last_match_away_score = latest.awayScore;
                updateData.last_match_is_home = latest.isHome;
                logs.push(`✅ Dernier match (résultats): ${latest.homeTeam} ${latest.homeScore}-${latest.awayScore} ${latest.awayTeam}`);
            }
        }

        // === 5. POSITION (pas calculable sans toutes les équipes) ===
        logs.push('ℹ️ Position: non modifiée (mise à jour manuelle via admin)');

        // === 6. SUPABASE ===
        if (Object.keys(updateData).length > 0) {
            const action = await updateSupabase(updateData);
            logs.push(`✅ Supabase ${action} (${Object.keys(updateData).length} champs)`);
        } else {
            logs.push('⚠️ Aucune donnée à mettre à jour');
        }

        console.log('⚽ Scraping terminé:', logs.join(' | '));
        return res.status(200).json({ success: true, timestamp: new Date().toISOString(), source: 'SportCorico', logs, data: updateData });

    } catch (err) {
        console.error('❌ Erreur scraping sport:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}