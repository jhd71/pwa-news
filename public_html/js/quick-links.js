// Gestion du widget de liens rapides
document.addEventListener('DOMContentLoaded', function() {
  const quickLinksSidebar = document.querySelector('.quick-links-sidebar');
  const quickLinksToggle = document.querySelector('.quick-links-toggle');
  const quickLinksShowBtn = document.getElementById('quickLinksShowBtn');
  
  // Vérifier si l'état est enregistré
  const quickLinksHidden = localStorage.getItem('quickLinksHidden') === 'true';
  
  // Sur mobile, masquer par défaut
  if (window.innerWidth < 768) {
    quickLinksSidebar.classList.add('hidden');
    quickLinksShowBtn.classList.add('visible');
    localStorage.setItem('quickLinksHidden', 'true');
  } else if (quickLinksHidden) {
    // Sur desktop, respecter l'état enregistré
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