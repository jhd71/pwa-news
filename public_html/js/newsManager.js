/**
 * newsManager.js - Gère le chargement et l'affichage des actualités dans le carrousel
 */

async function loadTopNews() {
  const swiperWrapper = document.getElementById('swiperWrapper');
  
  try {
    const response = await fetch('/api/getNationalNews.js');
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const articles = await response.json();
    swiperWrapper.innerHTML = '';
    
    if (articles.length === 0) {
      swiperWrapper.innerHTML = '<div class="swiper-slide"><p>Aucune actualité disponible pour le moment.</p></div>';
      return;
    }
    
    // Limiter à 5 articles pour éviter l'avertissement de loop
    const limitedArticles = articles.slice(0, 5);
    
    limitedArticles.forEach(article => {
      if (article.title && article.link) {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        
        // Créer le contenu de la slide avec l'image si disponible
        let slideContent = `
          <a href="${article.link}" target="_blank" style="color:white; text-decoration:none; padding:15px; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%;">
        `;
        
        // Ajouter l'image si disponible
        if (article.image && article.image !== "images/default-news.jpg") {
          slideContent += `<img src="${article.image}" alt="${article.title}" style="width:100%; max-height:150px; object-fit:cover; border-radius:10px; margin-bottom:10px;">`;
        }
        
        // Ajouter le titre et la source
        slideContent += `
            <div style="font-weight:bold; font-size:16px; margin-bottom:8px; text-align:center;">${article.title}</div>
            <div style="font-size:14px; opacity:0.8; color:#ff9800;">${article.source || 'Source'}</div>
          </a>
        `;
        
        slide.innerHTML = slideContent;
        swiperWrapper.appendChild(slide);
      }
    });
    
    // Réinitialiser Swiper après ajout dynamique
    if (window.swiper) {
      window.swiper.destroy(true, true);
    }
    
    window.swiper = new Swiper('.swiper', {
      loop: limitedArticles.length > 1, // Activer le loop seulement s'il y a plus d'un slide
      autoplay: { 
        delay: 5000,
        disableOnInteraction: false
      },
      pagination: { 
        el: '.swiper-pagination', 
        clickable: true 
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev'
      },
      slidesPerView: 1,
      spaceBetween: 20,
      on: {
        init: function() {
          console.log('Swiper initialisé avec succès');
        }
      }
    });
    
  } catch (error) {
    console.error('Erreur chargement actualités:', error);
    swiperWrapper.innerHTML = '<div class="swiper-slide"><p>Erreur lors du chargement des actualités.</p></div>';
  }
}

// Exposer la fonction pour pouvoir l'appeler depuis d'autres scripts
function refreshNews() {
  console.log('Actualisation des nouvelles...');
  loadTopNews();
}

// Exposer la fonction au contexte global
window.refreshNews = refreshNews;

// Charger les actualités au chargement de la page
document.addEventListener('DOMContentLoaded', loadTopNews);

// Désactiver l'initialisation manuelle du Swiper dans l'index.html
document.addEventListener('DOMContentLoaded', () => {
  // Ajouter un gestionnaire d'événements pour le bouton de rafraîchissement
  const refreshButton = document.getElementById('refreshButton');
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      refreshNews();
    });
  }
});
