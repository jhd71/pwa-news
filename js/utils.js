/**
 * ============================================
 * UTILITAIRES PARTAGÉS - Actu & Média
 *
 * Fonctions utilisées par plusieurs pages.
 * À charger AVANT app.js et avant les scripts
 * en ligne des pages qui s'en servent.
 *
 * Pages concernées : index.html, infos.html, agenda.html
 * ============================================
 */

/**
 * Échappe les caractères HTML pour éviter toute injection
 * quand on insère du texte fourni par un visiteur.
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Transforme les URLs d'un texte en liens cliquables.
 * Le texte affiché est le nom du site (déduit du domaine),
 * pas l'adresse complète : "Montceau News" plutôt que
 * "https://montceau-news.com/montceau_et_sa_region/884285-...".
 */
function linkifyContent(text) {
    if (!text) return '';

    // D'abord échapper le HTML
    let safe = escapeHtml(text);

    // Puis convertir les URLs en liens cliquables
    const urlRegex = /(https?:\/\/[^\s<]+)/g;

    return safe.replace(urlRegex, (url) => {
        let libelle = url;
        try {
            const hote = new URL(url).hostname.replace(/^www\./, '');
            libelle = hote
                .split('.')[0]
                .split('-')
                .map(mot => mot.charAt(0).toUpperCase() + mot.slice(1))
                .join(' ');
        } catch (e) {
            // URL non analysable : on garde l'adresse brute
        }
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="community-link">${libelle}</a>`;
    });
}

/**
 * Déplie ou replie la description d'une publication.
 * Utilisée par index.html et infos.html, qui ont le même
 * balisage de bouton : <span>texte</span><span>icône</span>
 */
function toggleSeeMore(id) {
    const descEl = document.getElementById(`desc-${id}`);
    const btnEl = document.getElementById(`see-more-${id}`);

    if (!descEl || !btnEl) return;

    const isExpanded = descEl.classList.contains('expanded');

    descEl.classList.toggle('expanded', !isExpanded);
    btnEl.classList.toggle('expanded', !isExpanded);
    btnEl.querySelector('span:first-child').textContent = isExpanded ? 'Voir plus' : 'Voir moins';
}

/**
 * Compte les CLICS réels sur les infos de la communauté :
 * « Voir plus », « Voir le lien », photo, « Commenter », « Partager », like…
 * Un clic est compté au plus une fois par visiteur, par info et par jour
 * (vérifié côté serveur par la fonction Postgres enregistrer_clic_info).
 * Ce chiffre est PRIVÉ : il n'est jamais affiché sur le site, seulement dans l'admin.
 *
 * conteneur     : l'élément qui contient les cartes (il n'est pas remplacé au rechargement)
 * selecteurCarte: '.community-item' sur l'accueil, '.info-card' sur infos.html
 * client        : le client Supabase de la page
 */
function suivreClicsInfos(conteneur, selecteurCarte, client) {
    if (!conteneur || !client || conteneur.dataset.suiviClics) return;
    conteneur.dataset.suiviClics = '1';

    const dejaComptees = new Set();

    // Phase de capture : le clic est vu AVANT les boutons qui font
    // event.stopPropagation(), sinon il ne remonterait jamais jusqu'ici.
    conteneur.addEventListener('click', (e) => {
        const action = e.target.closest('a, button, img, [onclick]');
        if (!action || !conteneur.contains(action)) return;

        const carte = action.closest(selecteurCarte + '[data-id]');
        if (!carte) return;

        const id = Number(carte.dataset.id);
        if (!id || dejaComptees.has(id)) return;
        dejaComptees.add(id);

        try {
            const empreinte = (typeof getUserFingerprint === 'function') ? getUserFingerprint() : null;
            if (!empreinte) return;
            client.rpc('enregistrer_clic_info', { p_submission_id: id, p_fingerprint: empreinte })
                .then(({ error }) => { if (error) console.log('⚠️ Clic info non compté :', error.message); });
        } catch (err) {
            console.log('⚠️ Clic info non compté :', err);
        }
    }, true);
}
