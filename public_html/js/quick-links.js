// Ajoutez ce code JavaScript à votre fichier principal ou créez un nouveau fichier quick-links.js

// Gestion du widget de liens rapides
document.addEventListener('DOMContentLoaded', function() {
  const quickLinksSidebar = document.querySelector('.quick-links-sidebar');
  const quickLinksToggle = document.querySelector('.quick-links-toggle');
  const quickLinksShowBtn = document.getElementById('quickLinksShowBtn');
  
  // Vérifier si l'état est enregistré
  const quickLinksHidden = localStorage.getItem('quickLinksHidden') === 'true';
  
  // Appliquer l'état initial
  if (quickLinksHidden) {
    quickLinksSidebar.classList.add('hidden');
    quickLinksShowBtn.classList.add('visible');
  }
  
  // Gérer le clic sur le bouton masquer
  quickLinksToggle.addEventListener('click', function() {
    quickLinksSidebar.classList.add('hidden');
    quickLinksShowBtn.classList.add('visible');
    localStorage.setItem('quickLinksHidden', 'true');
  });
  
  // Gérer le clic sur le bouton afficher
  quickLinksShowBtn.addEventListener('click', function() {
    quickLinksSidebar.classList.remove('hidden');
    quickLinksShowBtn.classList.remove('visible');
    localStorage.setItem('quickLinksHidden', 'false');
  });
});