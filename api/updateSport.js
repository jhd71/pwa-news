// api/updateSport.js - Scraper automatique FC Montceau Bourgogne
// Source: SportCorico (SSR, données fiables et à jour)
// Cron Vercel: tous les jours à 7h du matin

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ekjgfiyhkythqcnmhzea.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramdmaXloa3l0aHFjbm1oemVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzYxNDIsImV4cCI6MjA1ODI1MjE0Mn0.V0j_drb6GiTojgwxC6ydjnyJDRRT9lUbSc1E7bFE2Z4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// URL source : page club SportCorico (SSR = HTML complet côté serveur)
const SPORTCORICO_URL = 'https://www.sportcorico.com/clubs/fc-montceau-bourgogne/montceau-fc-bourgogn';

// Compétition à filtrer (uniquement le championnat)
const COMPETITION = 'REGIONAL 1 HERBELIN';

export const config = {
    maxDuration: 30,
};

// ============================================
// FETCH HTML
// ============================================
async function fetchHTML(url) {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.5',
        }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} pour ${url}`);
    return await response.text();
}

// ============================================
// NETTOYER LE TEXTE HTML
// ============================================
function cleanText(html) {
    return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// ============================================
// PARSER LE DERNIER MATCH ET PROCHAIN MATCH
// ============================================
function parseMatches(html) {
    const result = { lastMatch: null, nextMatch: null };

    // ---- DERNIER MATCH ----
    // Structure SportCorico SSR : ## Dernier Match ... contenu ... ## Prochain Match
    const dernierSection = html.match(/##\s*Dernier Match([\s\S]*?)##\s*Prochain Match/i);
    if (dernierSection) {
        const section = dernierSection[1];

        // Chercher le pattern : Team1 ... date ... score ... Team2
        // Ou : Team1 ... date ... heure ... Team2 (pas encore joué)
        const scoreMatch = section.match(/(\d{2}\/\d{2}\/\d{4})\s*(\d+)\s*-\s*(\d+)/);
        const noScoreMatch = section.match(/(\d{2}\/\d{2}\/\d{4})\s*(\d{2}:\d{2})/);

        // Extraire les noms d'équipes (après les logos)
        // Pattern : "logo TeamName 1]" suivi de texte
        const teamNames = [];
        const teamRegex = /(?:logo|!\[)[^\]]*\]\s*\n\s*([A-Z][\w\s'.()-]+\d)/gi;
        let tm;
        while ((tm = teamRegex.exec(section)) !== null) {
            teamNames.push(tm[1].trim());
        }

        // Alternative : chercher les noms entre les dates/scores
        if (teamNames.length < 2) {
            // Pattern plus simple : lignes avec noms d'équipe
            const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 2);
            const namePattern = /^[A-Z][\w\s'.()-]+\d$/;
            for (const line of lines) {
                if (namePattern.test(line) && !line.includes('http') && !line.includes('logo')) {
                    teamNames.push(line);
                }
            }
        }

        if (scoreMatch && teamNames.length >= 2) {
            const dateStr = scoreMatch[1]; // "14/02/2026"
            const [day, month, year] = dateStr.split('/');
            const isHome = teamNames[0].toLowerCase().includes('montceau');

            result.lastMatch = {
                date: `${year}-${month}-${day}`,
                homeTeam: isHome ? 'FC Montceau' : teamNames[0].replace(/\s*1$/, '').trim(),
                awayTeam: isHome ? teamNames[1].replace(/\s*1$/, '').trim() : 'FC Montceau',
                homeScore: parseInt(scoreMatch[2]),
                awayScore: parseInt(scoreMatch[3]),
                isHome: isHome,
            };
        } else if (noScoreMatch && teamNames.length >= 2) {
            // Match pas encore joué (affiché comme "dernier" mais sans score)
            // On ne met pas à jour le dernier match dans ce cas
        }
    }

    // ---- PROCHAIN MATCH ----
    const prochainSection = html.match(/##\s*Prochain Match([\s\S]*?)(?:##\s*Calendier|##\s*Classement|\[##\s*Calendier)/i);
    if (prochainSection) {
        const section = prochainSection[1];

        // Date et heure
        const dateTimeMatch = section.match(/(\d{2}\/\d{2}\/\d{4})\s*(\d{2}:\d{2})/);

        // Noms d'équipes
        const teamNames = [];
        const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 2);
        const namePattern = /^[A-Z][\w\s'.()-]+\d$/;
        for (const line of lines) {
            if (namePattern.test(line) && !line.includes('http') && !line.includes('logo')) {
                teamNames.push(line);
            }
        }

        if (dateTimeMatch && teamNames.length >= 2) {
            const dateStr = dateTimeMatch[1];
            const [day, month, year] = dateStr.split('/');
            const time = dateTimeMatch[2];
            const isHome = teamNames[0].toLowerCase().includes('montceau');

            result.nextMatch = {
                date: `${year}-${month}-${day}`,
                time: time,
                homeTeam: isHome ? 'FC Montceau' : teamNames[0].replace(/\s*1$/, '').trim(),
                awayTeam: isHome ? teamNames[1].replace(/\s*1$/, '').trim() : 'FC Montceau',
                isHome: isHome,
            };
        }
    }

    return result;
}

// ============================================
// PARSER TOUS LES RÉSULTATS DU CHAMPIONNAT
// ============================================
function parseAllResults(html) {
    const results = [];

    // Chercher tous les blocs de matchs REGIONAL 1 HERBELIN avec un score
    // Structure : REGIONAL 1 HERBELIN ... Team1 ... date ... score1 - score2 ... Team2
    // Les matchs sont dans des liens [...](...) 

    // Split par les liens de matchs
    const matchBlocks = html.split(/\[REGIONAL 1 HERBELIN/gi);

    for (let i = 1; i < matchBlocks.length; i++) {
        const block = matchBlocks[i];

        // Vérifier qu'il y a un score (match joué)
        const scoreMatch = block.match(/(\d{2}\/\d{2}\/\d{4})\s*(\d+)\s*-\s*(\d+)/);
        if (!scoreMatch) continue; // Match pas encore joué, on skip

        // Vérifier que c'est un match de Montceau
        if (!block.toLowerCase().includes('montceau')) continue;

        // Extraire les noms d'équipes
        const teamNames = [];
        const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 2);
        const namePattern = /^[A-Z][\w\s'.()-]+\d$/;
        for (const line of lines) {
            if (namePattern.test(line) && !line.includes('http') && !line.includes('logo')) {
                teamNames.push(line);
            }
        }

        if (teamNames.length >= 2) {
            const isHome = teamNames[0].toLowerCase().includes('montceau');
            const dateStr = scoreMatch[1];
            const [day, month, year] = dateStr.split('/');

            results.push({
                date: `${year}-${month}-${day}`,
                homeTeam: teamNames[0].trim(),
                awayTeam: teamNames[1].trim(),
                homeScore: parseInt(scoreMatch[2]),
                awayScore: parseInt(scoreMatch[3]),
                isHome: isHome,
            });
        }
    }

    return results;
}

// ============================================
// PARSER LA FORME (badges V/D/N dans le header)
// ============================================
function parseForm(html) {
    // Dans le header SportCorico, la forme est affichée comme :
    // Football\n\nV\n\nD\n\nV\n\nD\n\nD
    const formSection = html.match(/Football\s+((?:[VDN]\s+){2,}[VDN])/i);
    if (formSection) {
        const letters = formSection[1].match(/[VDN]/gi);
        if (letters && letters.length > 0) {
            return letters.map(l => l.toUpperCase()).join(',');
        }
    }

    // Alternative : chercher dans le texte brut
    const altForm = html.match(/(?:Forme|form)\s*[:\s]*([VDN](?:\s*[VDN]){2,})/i);
    if (altForm) {
        const letters = altForm[1].match(/[VDN]/gi);
        if (letters) return letters.map(l => l.toUpperCase()).join(',');
    }

    return null;
}

// ============================================
// CALCULER LES STATS DEPUIS LES RÉSULTATS
// ============================================
function computeStats(results) {
    let played = 0, won = 0, drawn = 0, lost = 0, goalsFor = 0, goalsAgainst = 0;

    for (const r of results) {
        played++;
        const fcmbScore = r.isHome ? r.homeScore : r.awayScore;
        const oppScore = r.isHome ? r.awayScore : r.homeScore;

        goalsFor += fcmbScore;
        goalsAgainst += oppScore;

        if (fcmbScore > oppScore) won++;
        else if (fcmbScore < oppScore) lost++;
        else drawn++;
    }

    return {
        played,
        won,
        drawn,
        lost,
        points: won * 3 + drawn,
        goalsFor,
        goalsAgainst,
    };
}

// ============================================
// CALCULER LA FORME DEPUIS LES RÉSULTATS
// ============================================
function computeFormFromResults(results) {
    const sorted = [...results].sort((a, b) => a.date.localeCompare(b.date));
    const last5 = sorted.slice(-5);

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
    const { data: existing } = await supabase
        .from('sport_data')
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

    const payload = {
        ...data,
        updated_at: new Date().toISOString(),
        updated_by: 'scraper-sportcorico',
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;
    const isAuthorized = !cronSecret ||
        authHeader === `Bearer ${cronSecret}` ||
        req.headers['x-vercel-cron'] === '1';

    if (!isAuthorized && req.method !== 'GET') {
        return res.status(401).json({ error: 'Non autorisé' });
    }

    try {
        console.log('⚽ Début scraping FC Montceau (SportCorico)...');
        const updateData = {};
        let logs = [];

        // === 1. FETCH LA PAGE SPORTCORICO ===
        const html = await fetchHTML(SPORTCORICO_URL);
        logs.push('✅ Page SportCorico récupérée (' + html.length + ' chars)');

        // === 2. PARSER DERNIER MATCH + PROCHAIN MATCH ===
        const { lastMatch, nextMatch } = parseMatches(html);

        if (lastMatch) {
            updateData.last_match_date = lastMatch.date;
            updateData.last_match_home_team = lastMatch.homeTeam;
            updateData.last_match_away_team = lastMatch.awayTeam;
            updateData.last_match_home_score = lastMatch.homeScore;
            updateData.last_match_away_score = lastMatch.awayScore;
            updateData.last_match_is_home = lastMatch.isHome;
            logs.push(`✅ Dernier match: ${lastMatch.homeTeam} ${lastMatch.homeScore}-${lastMatch.awayScore} ${lastMatch.awayTeam}`);
        } else {
            logs.push('⚠️ Dernier match: pas de score trouvé (match peut-être pas encore joué)');
        }

        if (nextMatch) {
            updateData.next_match_date = nextMatch.date;
            updateData.next_match_time = nextMatch.time;
            updateData.next_match_home_team = nextMatch.homeTeam;
            updateData.next_match_away_team = nextMatch.awayTeam;
            updateData.next_match_is_home = nextMatch.isHome;
            logs.push(`✅ Prochain match: ${nextMatch.homeTeam} vs ${nextMatch.awayTeam} le ${nextMatch.date} à ${nextMatch.time}`);
        } else {
            logs.push('⚠️ Prochain match non trouvé');
        }

        // === 3. PARSER TOUS LES RÉSULTATS DU CHAMPIONNAT ===
        const allResults = parseAllResults(html);
        logs.push(`📊 ${allResults.length} matchs de championnat trouvés`);

        if (allResults.length > 0) {
            // Calculer les stats
            const stats = computeStats(allResults);
            updateData.standing_points = stats.points;
            updateData.standing_played = stats.played;
            updateData.standing_won = stats.won;
            updateData.standing_drawn = stats.drawn;
            updateData.standing_lost = stats.lost;
            updateData.standing_goals_for = stats.goalsFor;
            updateData.standing_goals_against = stats.goalsAgainst;
            logs.push(`✅ Stats: ${stats.points} pts, ${stats.played}J, ${stats.won}V-${stats.drawn}N-${stats.lost}D, ${stats.goalsFor}bp-${stats.goalsAgainst}bc`);

            // Forme calculée depuis les résultats
            const computedForm = computeFormFromResults(allResults);
            if (computedForm) {
                updateData.form = computedForm;
                logs.push(`✅ Forme (calculée): ${computedForm}`);
            }

            // Dernier match depuis les résultats (si pas trouvé dans la section Dernier Match)
            if (!lastMatch) {
                const sorted = [...allResults].sort((a, b) => a.date.localeCompare(b.date));
                const latest = sorted[sorted.length - 1];
                if (latest) {
                    updateData.last_match_date = latest.date;
                    updateData.last_match_home_team = latest.isHome ? 'FC Montceau' : latest.homeTeam.replace(/\s*1$/, '');
                    updateData.last_match_away_team = latest.isHome ? latest.awayTeam.replace(/\s*1$/, '') : 'FC Montceau';
                    updateData.last_match_home_score = latest.homeScore;
                    updateData.last_match_away_score = latest.awayScore;
                    updateData.last_match_is_home = latest.isHome;
                    logs.push(`✅ Dernier match (depuis résultats): ${latest.homeTeam} ${latest.homeScore}-${latest.awayScore} ${latest.awayTeam}`);
                }
            }
        }

        // === 4. FORME DEPUIS LE HEADER (plus fiable si disponible) ===
        const headerForm = parseForm(html);
        if (headerForm) {
            updateData.form = headerForm; // Remplace la forme calculée
            logs.push(`✅ Forme (header SportCorico): ${headerForm}`);
        }

        // === 5. POSITION (ne peut pas être calculée sans les autres équipes) ===
        // On ne met PAS à jour standing_position ici
        // L'admin peut le mettre manuellement via admin-sport.html
        // Ou on garde la dernière valeur en base
        logs.push('ℹ️ Position: non modifiée (mise à jour manuelle via admin)');

        // === 6. METTRE À JOUR SUPABASE ===
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
            source: 'SportCorico',
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