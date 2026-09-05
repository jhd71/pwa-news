// api/fff.js — Relais de lecture pour les pages publiques de la FFF
//
// POURQUOI CE FICHIER
// Le scraper sport tourne sur GitHub Actions, et la FFF refuse les requêtes
// venant des serveurs de GitHub (HTTP 403, page anti-robot). Vercel, lui,
// passe. Ce relais lit donc la page pour le scraper et lui renvoie
// uniquement les données utiles.
//
// CE QU'IL FAIT
// Les pages epreuves.fff.fr embarquent leurs données dans un bloc
// <script id="ng-state">. On extrait ce bloc et on ne garde que les
// entrées concernant les matchs et le classement — le reste (vidéos,
// navigation, publicités) est jeté, ce qui évite de transporter 500 Ko.
//
// SÉCURITÉ : seul le domaine epreuves.fff.fr est joignable, et uniquement
// les chemins commençant par /competition/. Ce relais ne peut donc pas
// servir à interroger autre chose.

const FFF_SITE = 'https://epreuves.fff.fr';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    // 5 min de cache CDN : le scraper ne passe que quelques fois par jour,
    // mais si plusieurs appels arrivent groupés la FFF n'est lue qu'une fois
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=1800');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const chemin = String((req.query && req.query.path) || '');

    if (!/^\/competition\/[A-Za-z0-9\/_.%-]*$/.test(chemin)) {
        return res.status(400).json({ error: 'Chemin non autorisé (doit commencer par /competition/)' });
    }

    try {
        const reponse = await fetch(FFF_SITE + chemin, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'fr-FR,fr;q=0.9'
            }
        });

        const html = await reponse.text();
        const bloc = html.match(/<script id="ng-state" type="application\/json">([\s\S]*?)<\/script>/);

        if (!bloc) {
            return res.status(502).json({
                error: 'Bloc ng-state absent',
                status: reponse.status,
                taille: html.length,
                extrait: html.replace(/\s+/g, ' ').slice(0, 200)
            });
        }

        let etat;
        try {
            etat = JSON.parse(bloc[1]);
        } catch (e) {
            return res.status(502).json({ error: 'ng-state illisible: ' + e.message });
        }

        // On ne renvoie que les matchs et le classement
        const utile = {};
        for (const cle of Object.keys(etat)) {
            if (!cle.startsWith('analog_GET|')) continue;
            if (cle.includes('/api/data/matches') || cle.toLowerCase().includes('classement')) {
                utile[cle] = etat[cle];
            }
        }

        return res.status(200).json({
            status: reponse.status,
            cles: Object.keys(utile).length,
            state: utile
        });

    } catch (err) {
        return res.status(502).json({ error: String(err.message).slice(0, 200) });
    }
}
