async function loadTopNews() {
  const swiperWrapper = document.getElementById('swiperWrapper');
  try {
    const response = await fetch('/api/getNationalNews.js');
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

        slide.innerHTML = `
          <a href="${article.link}" target="_blank" class="news-slide">
            <img src="${article.image || 'images/default-news.jpg'}" class="news-image" alt="Image de l'actualité">
            <div class="news-text">
              <h3>${article.title}</h3>
              <div class="news-source">${article.source || 'Source inconnue'}</div>
            </div>
          </a>
        `;

        swiperWrapper.appendChild(slide);
      }
    });

    // Réinitialiser Swiper après ajout dynamique
    new Swiper('.swiper', {
      loop: false,
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
      spaceBetween: 20
    });
  } catch (error) {
    console.error('Erreur chargement actualités:', error);
    swiperWrapper.innerHTML = '<div class="swiper-slide"><p>Erreur lors du chargement des actualités.</p></div>';
  }
}
document.addEventListener('DOMContentLoaded', loadTopNews);
