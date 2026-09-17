// api/getTrafic.js
// Bloc « Circulation » d'actuetmedia.fr
// Lit le récapitulatif Bison Futé, garde la Saône-et-Loire (71),
// puis seulement ce qui concerne le secteur Montceau / Le Creusot.

const SOURCE_URL = 'https://tipi.bison-fute.gouv.fr/bison-fute-ouvert/publicationsDIR/Evenementiel-DIR/cnir/RecapTraficFranceEntiere.html';
const CACHE_MS = 10 * 60 * 1000;   // 10 minutes
const LONG_JOURS = 30;             // au-delà : chantier long (affiché en second)

// N70 (RCEA) : toujours gardée, elle traverse tout le secteur.
// Les autres routes (N80, A6…) ne sont gardées que si l'événement
// cite une des communes ci-dessous.
const ROUTE_N70 = /\b(?:R?N)\s?70\b/;

// Communes surveillées (en minuscules, SANS accents)
const COMMUNES = [
  'montceau-les-mines', 'le creusot', 'blanzy', 'saint-vallier',
  'sanvignes-les-mines', 'ciry-le-noble', 'torcy', 'montchanin',
  'ecuisses', 'genelard', 'perrecy-les-forges', 'saint-eusebe',
  'pouilloux', 'gourdon', 'le breuil', 'saint-firmin', 'marmagne',
  'saint-sernin-du-bois', 'saint-berain-sous-sanvignes'
];

let cache = { data: null, time: 0 };

// ---------- Outils texte ----------

function sansAccents(t) {
  return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

const ENTITES = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  rsquo: '’', lsquo: '‘', laquo: '«', raquo: '»', deg: '°',
  eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë',
  agrave: 'à', acirc: 'â', ccedil: 'ç', icirc: 'î', iuml: 'ï',
  ocirc: 'ô', ugrave: 'ù', ucirc: 'û', uuml: 'ü',
  Eacute: 'É', Egrave: 'È', Agrave: 'À', Ccedil: 'Ç', oelig: 'œ'
};

function decoderEntites(t) {
  return t
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, nom) => (nom in ENTITES ? ENTITES[nom] : m));
}

function htmlVersTexte(html) {
  const texte = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(br|hr)\b[^>]*>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  return decoderEntites(texte).replace(/[ \t\u00a0]+/g, ' ');
}

// ---------- Lecture de la page ----------

function lireMiseAJour(texte) {
  const m = texte.match(/R[ée]capitulatif par d[ée]partements\s+du\s+(.+?\d{1,2}h\d{2})/);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

function extraireSection71(texte) {
  const debut = texte.search(/D[ée]partement\s+71\b/);
  if (debut === -1) return '';
  const reste = texte.slice(debut + 15);
  const fin = reste.search(/D[ée]partement\s+\d{2}[AB]?\b/);
  return fin === -1 ? texte.slice(debut) : texte.slice(debut, debut + 15 + fin);
}

function concerneLeSecteur(brut) {
  if (ROUTE_N70.test(brut)) return true;
  // On ignore le sens de circulation (« de Chalon-sur-Saône vers Le Creusot ») :
  // seul le lieu de l'événement compte.
  const lieu = brut.replace(/\bde [^,;]+? vers [^,;]+/g, ' ');
  const norm = sansAccents(lieu);
  return COMMUNES.some(c => new RegExp('(^|[^a-z-])' + c + '([^a-z-]|$)').test(norm));
}

function nettoyer(t) {
  return t
    .replace(/,?\s*applicable à tous les véhicules/gi, '')
    .replace(/,?\s*La mesure est (obligatoire|conseillée)/gi, '')
    .replace(/entre les PR [\d+\-]+ et [\d+\-]+\s*/g, '')
    .replace(/au PR [\d+\-]+,?\s*/g, '')
    .replace(/prévu jusqu[’']au \d{2}\/\d{2}\/\d{4}( à \d{1,2}h\d{0,2})?,?\s*/g, '')
    .replace(/prévu jusqu[’']à \d{1,2}h\d{0,2},?\s*/g, '')
    .replace(/\s*\(sens [^)]+\)/g, '')
    .replace(/,\s*\(sur/g, ' (sur')
    .replace(/\s+,/g, ',')
    .replace(/,(\s*,)+/g, ',')
    .replace(/[,;\s]+$/, '')
    .trim();
}

function lireDate(j, m, a) {
  return new Date(Number(a), Number(m) - 1, Number(j), 23, 59);
}

function analyserEvenement(brut, origine, maintenant) {
  let texte = brut.replace(/\s+/g, ' ').trim();

  // Niveau d'importance : *** grave, ** moyen, * mineur
  const etoiles = texte.match(/^(\*{1,3})\s*/);
  const niveau = etoiles ? etoiles[1].length : 1;
  texte = texte.replace(/^\*{1,3}\s*/, '');

  // On n'affiche que le premier sous-événement (les suivants sont des détails)
  let principal = texte.split(/\s+;\s+/)[0];

  // Heure de signalement éventuelle : « À 12h25, »
  let heure = null;
  const h = principal.match(/^À (\d{1,2}h\d{2}),\s*/);
  if (h) {
    heure = h[1];
    principal = principal.slice(h[0].length);
  }
  principal = principal.replace(/^Le \d{2}\/\d{2}\/\d{4} à \d{1,2}h\d{2},\s*/, '');

  principal = nettoyer(principal);
  const virgule = principal.indexOf(',');
  const type = virgule === -1 ? principal : principal.slice(0, virgule).trim();
  const detail = virgule === -1 ? '' : principal.slice(virgule + 1).trim();

  // Date de fin : « jusqu'au 31/01/2027 » ou « au 16/10/2026 »
  let fin = null;
  let long = false;
  const f = texte.match(/(?:jusqu[’']au|\bau)\s+(\d{2})\/(\d{2})\/(\d{4})/);
  if (f) {
    fin = `${f[1]}/${f[2]}/${f[3]}`;
    const jours = (lireDate(f[1], f[2], f[3]) - maintenant) / 86400000;
    long = jours > LONG_JOURS;
  }

  // Fin dans la journée : « prévu jusqu'à 21h »
  let finHeure = null;
  const fh = texte.match(/jusqu[’']à (\d{1,2}h\d{0,2})/);
  if (fh) finHeure = fh[1];

  // Événement pas encore commencé : « du 05/10/2026 »
  let debut = null;
  const d = texte.match(/\bdu\s+(\d{2})\/(\d{2})\/(\d{4})/);
  if (d && lireDate(d[1], d[2], d[3]) > maintenant) {
    debut = `${d[1]}/${d[2]}/${d[3]}`;
  }

  return { niveau, heure, type, detail, fin, finHeure, debut, long, origine };
}

function analyserPage(html, maintenant = new Date()) {
  const texte = htmlVersTexte(html);
  const miseAJour = lireMiseAJour(texte);
  const section = extraireSection71(texte);
  if (!section) return { miseAJour, evenements: [], section71Trouvee: false };

  // Chaque événement se termine par « [Origine : ...] »
  const morceaux = section
    .replace(/^D[ée]partement\s+71\s*(\([^)]*\))?/, '')
    .split(/\[\s*Origine\s*:\s*([^\]]+)\]/);

  const evenements = [];
  for (let i = 0; i + 1 < morceaux.length; i += 2) {
    const brut = morceaux[i].replace(/-{3,}/g, ' ');
    if (!concerneLeSecteur(brut)) continue;
    evenements.push(analyserEvenement(brut, morceaux[i + 1].trim(), maintenant));
  }

  // Tri : le récent / court d'abord, puis le plus grave
  evenements.sort((a, b) => (a.long - b.long) || (b.niveau - a.niveau));

  return { miseAJour, evenements, section71Trouvee: true };
}

// ---------- Téléchargement ----------

async function telechargerPage() {
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), 8000);
  try {
    const rep = await fetch(SOURCE_URL, {
      signal: controleur.signal,
      headers: { 'User-Agent': 'actuetmedia.fr (bloc circulation)' }
    });
    if (!rep.ok) throw new Error('HTTP ' + rep.status);
    const octets = Buffer.from(await rep.arrayBuffer());
    let html = octets.toString('utf8');
    // Page encodée en Latin-1 ? On relit avec le bon décodage
    if (html.includes('\uFFFD')) {
      html = new TextDecoder('windows-1252').decode(octets);
    }
    return html;
  } finally {
    clearTimeout(minuteur);
  }
}

// ---------- Route Vercel ----------

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');

  if (cache.data && Date.now() - cache.time < CACHE_MS) {
    return res.status(200).json(cache.data);
  }

  try {
    const html = await telechargerPage();
    const resultat = analyserPage(html);
    const data = {
      ok: true,
      miseAJour: resultat.miseAJour,
      source: 'Bison Futé',
      sourceUrl: SOURCE_URL + '#71',
      evenements: resultat.evenements
    };
    cache = { data, time: Date.now() };
    return res.status(200).json(data);
  } catch (err) {
    console.error('getTrafic :', err.message);
    // En cas de panne : on renvoie l'ancien résultat s'il existe
    if (cache.data) return res.status(200).json(cache.data);
    return res.status(200).json({ ok: false, evenements: [] });
  }
}
