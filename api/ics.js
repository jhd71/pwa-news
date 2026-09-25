// api/ics.js
// Sert un événement de l'agenda au format iCalendar (RFC 5545).
//
// Pourquoi passer par le serveur plutôt que fabriquer le fichier
// dans le navigateur : servi avec l'en-tête « text/calendar », le
// fichier s'ouvre directement dans l'application Calendrier sur
// iPhone, au lieu d'atterrir dans les téléchargements où personne
// ne va le chercher.
//
// Appel : /api/ics?id=42

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ekjgfiyhkythqcnmhzea.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase = SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const JOURS_ICS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

// Dans un fichier .ics, ces quatre caractères doivent être protégés
function echapper(texte) {
    return String(texte || '')
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
}

// Lignes courtes imposées par le format, la suite commençant par une
// espace. On découpe par caractère : un emoji n'est jamais coupé en deux.
function plier(ligne) {
    const car = Array.from(ligne);
    if (car.length <= 70) return ligne;
    const morceaux = [car.slice(0, 70).join('')];
    for (let i = 70; i < car.length; i += 69) {
        morceaux.push(' ' + car.slice(i, i + 69).join(''));
    }
    return morceaux.join('\r\n');
}

const dateIcs = (d) => String(d).replace(/-/g, '');

// Pour un événement sans horaire, la date de fin est EXCLUSIVE
function jourSuivant(dateStr) {
    const d = new Date(dateStr + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    return d.getUTCFullYear()
         + String(d.getUTCMonth() + 1).padStart(2, '0')
         + String(d.getUTCDate()).padStart(2, '0');
}

function heureIcs(dateStr, timeStr) {
    const p = String(timeStr).split(':');
    return dateIcs(dateStr) + 'T'
         + (p[0] || '00').padStart(2, '0')
         + (p[1] || '00').padStart(2, '0') + '00';
}

function nomFichier(titre) {
    const base = String(titre || 'evenement')
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
    return (base || 'evenement') + '.ics';
}

export default async function handler(req, res) {
    const id = String(req.query.id || '').trim();

    if (!/^\d+$/.test(id)) {
        return res.status(400).send('Identifiant invalide');
    }
    if (!supabase) {
        console.error('getIcs : clé Supabase absente des variables Vercel.');
        return res.status(500).send('Configuration serveur incomplète');
    }

    try {
        // Lecture seule, colonnes nécessaires uniquement, et
        // UNIQUEMENT les événements publiés : la clé de service
        // contourne les règles de sécurité, il ne faut donc jamais
        // exposer une proposition en attente de modération.
        const { data: ev, error } = await supabase
            .from('events')
            .select('id, title, description, location, event_date, event_end_date, event_time, end_time, link, is_recurring, recurrence_days')
            .eq('id', id)
            .eq('status', 'approved')
            .maybeSingle();

        if (error) throw error;
        if (!ev) return res.status(404).send('Événement introuvable');

        const debut = ev.event_date;
        const fin = ev.event_end_date || ev.event_date;

        const lignesDate = ev.event_time
            ? ['DTSTART:' + heureIcs(debut, ev.event_time),
               'DTEND:' + heureIcs(fin, ev.end_time || ev.event_time)]
            : ['DTSTART;VALUE=DATE:' + dateIcs(debut),
               'DTEND;VALUE=DATE:' + jourSuivant(fin)];

        let description = ev.description || '';
        if (ev.link) description += (description ? '\n\n' : '') + ev.link;
        description += (description ? '\n\n' : '') + 'Via actuetmedia.fr';

        const horodatage = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        const lignes = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Actu & Media//Agenda//FR',
            'CALSCALE:GREGORIAN',
            'BEGIN:VEVENT',
            'UID:evenement-' + ev.id + '@actuetmedia.fr',
            'DTSTAMP:' + horodatage,
            ...lignesDate
        ];

        if (ev.is_recurring && ev.recurrence_days) {
            const jours = String(ev.recurrence_days).split(',')
                .map(d => JOURS_ICS[parseInt(d, 10)])
                .filter(Boolean);
            if (jours.length) lignes.push('RRULE:FREQ=WEEKLY;BYDAY=' + jours.join(','));
        }

        lignes.push('SUMMARY:' + echapper(ev.title));
        if (ev.location) lignes.push('LOCATION:' + echapper(ev.location));
        lignes.push('DESCRIPTION:' + echapper(description));
        if (ev.link) lignes.push('URL:' + ev.link);
        lignes.push('END:VEVENT', 'END:VCALENDAR');

        const contenu = lignes.map(plier).join('\r\n') + '\r\n';

        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${nomFichier(ev.title)}"`);
        res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
        return res.status(200).send(contenu);

    } catch (err) {
        console.error('getIcs :', err.message);
        return res.status(500).send('Erreur de génération');
    }
}
