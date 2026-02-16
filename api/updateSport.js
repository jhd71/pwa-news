// api/updateSport.js - Scraper automatique FC Montceau Bourgogne
// Source: statfootballclubfrance.fr (HTML propre, mis à jour après chaque journée)
// Cron Vercel: tous les jours à 7h du matin

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ekjgfiyhkythqcnmhzea.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramdmaXloa3l0aHFjbm1oemVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzYxNDIsImV4cCI6MjA1ODI1MjE0Mn0.V0j_drb6GiTojgwxC6ydjnyJDRRT9lUbSc1E7bFE2Z4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// URLs sources
const CLASSEMENT_URL = 'https://statfootballclubfrance.fr/bfc-r1-2026.php';
const RESULTATS_URL = 'https://statfootballclubfrance.fr/bfc-r1-gares-2026.php';

// Nom du club (tel qu'il apparaît dans les tableaux)
const CLUB_NAME = 'FC Montceau Bourgogne';
const CLUB_SHORT = 'Montceau';

export const config = {
    maxDuration: 30,
};

// ============================================
// FETCH HTML
// ============================================
async function fetchHTML(url) {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ActuMedia/2.0)',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'fr-FR,fr;q=0.9',
        }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} pour ${url}`);
    const buffer = await response.arrayBuffer();
    // Le site utilise UTF-8 ou ISO-8859-1, on essaye les deux
    let html;
    try {
        html = new TextDecoder('utf-8').decode(buffer);
    } catch {
        html = new TextDecoder('iso-8859-1').decode(buffer);
    }
    return html;
}

// ============================================
// PARSER LE CLASSEMENT (depuis bfc-r1-2026.php)
// ============================================
function parseClassement(html) {
    // Le tableau du classement Groupe A a cette structure :
    // | Rg | Équipe | Pts | J | G | N | P | Bp | Bc | Df |
    // On cherche la ligne contenant "Montceau"
    
    // Regex pour trouver les lignes du tableau de classement
    // Format: | rang | <a href="...">Nom Club</a> | pts | j | g | n | p | bp | bc | df |
    const rowRegex = /\|\s*(\d+)\s*\|[^|]*?(?:FC Montceau Bourgogne|Montceau)[^|]*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*-?\d+\s*\|/i;
    
    // Alternative: chercher dans les balises <td>
    // <td>3</td>...<td>Montceau</td>...<td>17</td>...
    const tdRegex = /<tr[^>]*>[\s\S]*?<td[^>]*>\s*(\d+)\s*<\/td>[\s\S]*?(?:Montceau|FC Montceau)[\s\S]*?<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>\s*(\d+)\s*<\/td>/i;
    
    const match = tdRegex.exec(html);
    
    if (match) {
        return {
            position: parseInt(match[1]),
            points: parseInt(match[2]),
            played: parseInt(match[3]),
            won: parseInt(match[4]),
            drawn: parseInt(match[5]),
            lost: parseInt(match[6]),
            goalsFor: parseInt(match[7]),
            goalsAgainst: parseInt(match[8]),
        };
    }
    
    console.log('⚠️ Classement non trouvé avec regex TD, essai alternatif...');
    
    // Méthode alternative: chercher tous les <tr> et analyser
    const allRows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    for (const row of allRows) {
        if (row.includes('Montceau') || row.includes('montceau')) {
            const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
            const values = cells.map(c => c.replace(/<[^>]+>/g, '').trim());
            
            // Trouver les valeurs numériques
            const nums = values.filter(v => /^\d+$/.test(v)).map(Number);
            if (nums.length >= 9) {
                return {
                    position: nums[0],
                    points: nums[1],
                    played: nums[2],
                    won: nums[3],
                    drawn: nums[4],
                    lost: nums[5],
                    goalsFor: nums[6],
                    goalsAgainst: nums[7],
                };
            }
        }
    }
    
    return null;
}

// ============================================
// PARSER LA PROCHAINE JOURNÉE
// ============================================
function parseNextMatch(html) {
    // Chercher la section de la prochaine journée qui contient "Montceau"
    // Format dans le HTML: 
    // <td>14/02-18h00</td><td>FC Montceau Bourgogne - Is-Selongey Football</td>
    
    // D'abord trouver le numéro de journée
    const journeeRegex = /(\d+)(?:ème|ère|e)\s*journée\s*\(([^)]+)\)/i;
    const journeeMatch = journeeRegex.exec(html);
    let matchday = '';
    if (journeeMatch) {
        matchday = 'Journée ' + journeeMatch[1];
    }
    
    // Chercher les matchs à venir (sans score, avec date-heure)
    // Pattern: date-heure | Equipe1 - Equipe2 | vide | vide
    const upcomingRegex = /<td[^>]*>\s*(\d{2}\/\d{2})-(\d{2}h\d{2})\s*<\/td>\s*<td[^>]*>\s*(.*?Montceau.*?)\s*<\/td>/gi;
    
    let match;
    while ((match = upcomingRegex.exec(html)) !== null) {
        const dateStr = match[1]; // "14/02"
        const timeStr = match[2].replace('h', ':'); // "18:00"
        const teamsStr = match[3].replace(/<[^>]+>/g, '').trim(); // "FC Montceau Bourgogne - Is-Selongey Football"
        
        // Séparer les équipes
        const teams = teamsStr.split(/\s*-\s*/);
        if (teams.length >= 2) {
            const homeTeam = teams[0].trim();
            const awayTeam = teams.slice(1).join(' - ').trim(); // Au cas où le nom contient un tiret
            
            const isHome = homeTeam.toLowerCase().includes('montceau');
            
            // Construire la date complète (année en cours ou prochaine)
            const [day, month] = dateStr.split('/').map(Number);
            const now = new Date();
            let year = now.getFullYear();
            const matchDate = new Date(year, month - 1, day);
            // Si la date est passée de plus de 6 mois, c'est l'année prochaine
            if (matchDate < new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)) {
                year++;
            }
            
            const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            return {
                date: fullDate,
                time: timeStr,
                matchday: matchday,
                homeTeam: isHome ? 'FC Montceau' : homeTeam.replace('Football', '').trim(),
                awayTeam: isHome ? awayTeam.replace('Football', '').trim() : 'FC Montceau',
                isHome: isHome,
            };
        }
    }
    
    return null;
}

// ============================================
// PARSER LES RÉSULTATS (depuis bfc-r1-gares-2026.php)
// ============================================
function parseResults(html) {
    // Chercher tous les matchs de Montceau avec un score
    // Format: <td>Equipe1</td><td>score1</td><td>score2</td><td>Equipe2</td>
    // ou: <td>date</td><td>Equipe1 score - score Equipe2</td>
    
    const results = [];
    
    // Pattern 1: lignes de résultats dans des tableaux
    // Chercher les lignes contenant Montceau avec des scores
    const allRows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    
    for (const row of allRows) {
        if (!row.toLowerCase().includes('montceau')) continue;
        
        const cells = (row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [])
            .map(c => c.replace(/<[^>]+>/g, '').trim());
        
        // Chercher un pattern avec des scores (deux chiffres côte à côte)
        for (let i = 0; i < cells.length - 3; i++) {
            const team1 = cells[i];
            const score1 = cells[i + 1];
            const score2 = cells[i + 2];
            const team2 = cells[i + 3];
            
            if (/^\d+$/.test(score1) && /^\d+$/.test(score2) && 
                (team1.toLowerCase().includes('montceau') || team2.toLowerCase().includes('montceau'))) {
                
                const isHome = team1.toLowerCase().includes('montceau');
                results.push({
                    homeTeam: isHome ? 'FC Montceau' : team1.replace(/Football$/i, '').trim(),
                    awayTeam: isHome ? team2.replace(/Football$/i, '').trim() : 'FC Montceau',
                    homeScore: parseInt(score1),
                    awayScore: parseInt(score2),
                    isHome: isHome,
                });
            }
        }
    }
    
    // Pattern 2: format "Equipe1 X - Y Equipe2" dans une même cellule
    const inlineScoreRegex = /(?:([^<]+?)\s+(\d+)\s*-\s*(\d+)\s+([^<]+?))/g;
    let inlineMatch;
    while ((inlineMatch = inlineScoreRegex.exec(html)) !== null) {
        const [, team1, s1, s2, team2] = inlineMatch;
        if (team1.toLowerCase().includes('montceau') || team2.toLowerCase().includes('montceau')) {
            const isHome = team1.toLowerCase().includes('montceau');
            // Éviter les doublons
            const existing = results.find(r => r.homeScore === parseInt(s1) && r.awayScore === parseInt(s2));
            if (!existing) {
                results.push({
                    homeTeam: isHome ? 'FC Montceau' : team1.trim(),
                    awayTeam: isHome ? team2.trim() : 'FC Montceau',
                    homeScore: parseInt(s1),
                    awayScore: parseInt(s2),
                    isHome: isHome,
                });
            }
        }
    }
    
    return results;
}

// ============================================
// CALCULER LA FORME (5 derniers résultats)
// ============================================
function computeForm(results) {
    // Prendre les 5 derniers résultats
    const last5 = results.slice(-5);
    
    return last5.map(r => {
        const fcmbScore = r.isHome ? r.homeScore : r.awayScore;
        const oppScore = r.isHome ? r.awayScore : r.homeScore;
        
        if (fcmbScore > oppScore) return 'V';
        if (fcmbScore < oppScore) return 'D';
        return 'N';
    }).join(',');
}

// ============================================
// MISE À JOUR SUPABASE
// ============================================
async function updateSupabase(data) {
    // Vérifier s'il y a déjà une entrée
    const { data: existing } = await supabase
        .from('sport_data')
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
    
    const payload = {
        ...data,
        updated_at: new Date().toISOString(),
        updated_by: 'scraper-auto',
    };
    
    if (existing) {
        const { error } = await supabase
            .from('sport_data')
            .update(payload)
            .eq('id', existing.id);
        
        if (error) throw error;
        return 'updated';
    } else {
        const { error } = await supabase
            .from('sport_data')
            .insert(payload);
        
        if (error) throw error;
        return 'inserted';
    }
}

// ============================================
// HANDLER PRINCIPAL
// ============================================
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    // Sécurité: vérifier le token pour les appels manuels (le cron Vercel passe automatiquement)
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;
    
    // Autoriser si: cron Vercel, ou token correct, ou pas de secret configuré
    const isAuthorized = !cronSecret || 
        authHeader === `Bearer ${cronSecret}` || 
        req.headers['x-vercel-cron'] === '1';
    
    if (!isAuthorized && req.method !== 'GET') {
        return res.status(401).json({ error: 'Non autorisé' });
    }
    
    try {
        console.log('⚽ Début scraping FC Montceau...');
        const updateData = {};
        let logs = [];
        
        // === 1. SCRAPER LE CLASSEMENT + PROCHAIN MATCH ===
        try {
            const classementHTML = await fetchHTML(CLASSEMENT_URL);
            logs.push('✅ Page classement récupérée');
            
            // Classement
            const classement = parseClassement(classementHTML);
            if (classement) {
                updateData.standing_position = classement.position;
                updateData.standing_points = classement.points;
                updateData.standing_played = classement.played;
                updateData.standing_won = classement.won;
                updateData.standing_drawn = classement.drawn;
                updateData.standing_lost = classement.lost;
                updateData.standing_goals_for = classement.goalsFor;
                updateData.standing_goals_against = classement.goalsAgainst;
                logs.push(`✅ Classement: ${classement.position}e, ${classement.points} pts`);
            } else {
                logs.push('⚠️ Classement non trouvé');
            }
            
            // Prochain match
            const nextMatch = parseNextMatch(classementHTML);
            if (nextMatch) {
                updateData.next_match_date = nextMatch.date;
                updateData.next_match_time = nextMatch.time;
                updateData.next_match_matchday = nextMatch.matchday;
                updateData.next_match_home_team = nextMatch.homeTeam;
                updateData.next_match_away_team = nextMatch.awayTeam;
                updateData.next_match_is_home = nextMatch.isHome;
                logs.push(`✅ Prochain match: ${nextMatch.homeTeam} vs ${nextMatch.awayTeam} le ${nextMatch.date}`);
            } else {
                logs.push('⚠️ Prochain match non trouvé');
            }
        } catch (err) {
            logs.push('❌ Erreur classement: ' + err.message);
        }
        
        // === 2. SCRAPER LES RÉSULTATS ===
        try {
            const resultatsHTML = await fetchHTML(RESULTATS_URL);
            logs.push('✅ Page résultats récupérée');
            
            const results = parseResults(resultatsHTML);
            
            if (results.length > 0) {
                // Dernier match
                const lastResult = results[results.length - 1];
                updateData.last_match_home_team = lastResult.homeTeam;
                updateData.last_match_away_team = lastResult.awayTeam;
                updateData.last_match_home_score = lastResult.homeScore;
                updateData.last_match_away_score = lastResult.awayScore;
                updateData.last_match_is_home = lastResult.isHome;
                logs.push(`✅ Dernier résultat: ${lastResult.homeTeam} ${lastResult.homeScore}-${lastResult.awayScore} ${lastResult.awayTeam}`);
                
                // Forme (5 derniers matchs)
                const form = computeForm(results);
                if (form) {
                    updateData.form = form;
                    logs.push(`✅ Forme: ${form}`);
                }
            } else {
                logs.push('⚠️ Aucun résultat trouvé');
            }
        } catch (err) {
            logs.push('⚠️ Erreur résultats: ' + err.message + ' (non bloquant)');
        }
        
        // === 3. METTRE À JOUR SUPABASE ===
        if (Object.keys(updateData).length > 0) {
            const action = await updateSupabase(updateData);
            logs.push(`✅ Supabase ${action}`);
        } else {
            logs.push('⚠️ Aucune donnée à mettre à jour');
        }
        
        console.log('⚽ Scraping terminé:', logs.join(' | '));
        
        return res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            logs: logs,
            data: updateData,
        });
        
    } catch (err) {
        console.error('❌ Erreur scraping sport:', err);
        return res.status(500).json({
            success: false,
            error: err.message,
        });
    }
}
