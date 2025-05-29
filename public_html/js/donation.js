// Attendre que le DOM soit entièrement chargé
document.addEventListener('DOMContentLoaded', function () {
  const donateButton = document.getElementById('donateButton');
  const donationPopup = document.getElementById('donationPopup');
  const closeBtn = document.getElementById('donationClose');

  // Fonction pour ouvrir la popup
  function openDonationPopup() {
    donationPopup.classList.add('visible');
  }

  // Fonction pour fermer la popup
  function closeDonationPopup() {
    donationPopup.classList.remove('visible');
  }

  // Afficher la popup quand on clique sur "Soutenir"
  if (donateButton) {
    donateButton.addEventListener('click', openDonationPopup);
  }

  // Fermer la popup quand on clique sur la croix
  if (closeBtn) {
    closeBtn.addEventListener('click', closeDonationPopup);
  }

  // Fermer la popup si on clique en dehors
  donationPopup.addEventListener('click', function (e) {
    if (e.target === donationPopup) {
      closeDonationPopup();
    }
  });

  // Fermer la popup avec la touche Echap
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && donationPopup.classList.contains('visible')) {
      closeDonationPopup();
    }
  });
});
