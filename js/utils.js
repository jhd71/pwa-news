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