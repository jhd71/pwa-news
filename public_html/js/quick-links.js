// Modifier votre code JavaScript pour les liens rapides
document.addEventListener('DOMContentLoaded', function() {
  const quickLinksSidebar = document.querySelector('.quick-links-sidebar');
  const quickLinksToggle = document.querySelector('.quick-links-toggle');
  const quickLinksShowBtn = document.getElementById('quickLinksShowBtn');
  
  // Vérifier si on est sur mobile
  const isMobile = window.innerWidth < 768;
  
  // Sur mobile, toujours commencer avec le widget fermé
  if (isMobile) {
    quickLinksSidebar.classList.add('hidden');
    quickLinksShowBtn.classList.add('visible');
    localStorage.setItem('quickLinksHidden', 'true');
  } else {
    // Sur desktop, vérifier l'état enregistré
    const quickLinksHidden = localStorage.getItem('quickLinksHidden') === 'true';
    
    if (quickLinksHidden) {
      quickLinksSidebar.classList.add('hidden');
      quickLinksShowBtn.classList.add('visible');
    }
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