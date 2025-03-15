document.addEventListener('DOMContentLoaded', function() {
  // Récupérer les éléments
  const ticker = document.querySelector('.ticker-wrapper');
  const tickerContainer = document.querySelector('.news-ticker');
  
  // Si le ticker n'existe pas, ne rien faire
  if (!ticker || !tickerContainer) {
    console.error("Les éléments du ticker n'ont pas été trouvés");
    return;
  }
  
  // Variables pour l'animation
  let position = tickerContainer.offsetWidth;
  let speed = 50; // pixels par seconde
  let lastTime = 0;
  
  // Dupliquer le contenu pour assurer une animation continue
  ticker.innerHTML += ticker.innerHTML;
  
  // Fonction d'animation
  function animate(currentTime) {
    // Initialiser lastTime
    if (!lastTime) lastTime = currentTime;
    
    // Calculer le temps écoulé en secondes
    const delta = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Mettre à jour la position
    position -= speed * delta;
    
    // Si le contenu est complètement passé, le repositionner
    if (position < -ticker.offsetWidth / 2) {
      position = tickerContainer.offsetWidth;
    }
    
    // Appliquer la transformation
    ticker.style.transform = `translateX(${position}px)`;
    
    // Continuer l'animation
    requestAnimationFrame(animate);
  }
  
  // Démarrer l'animation
  ticker.style.transform = `translateX(${position}px)`;
  requestAnimationFrame(animate);
  
  console.log("Animation du ticker démarrée");
});
