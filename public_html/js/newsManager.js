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

    // Limiter à 5 articles maximum
    const limitedArticles = articles.slice(0, 5);

    limitedArticles.forEach(article => {
      if (article.title && article.link) {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';

        // Vérification si l'image est bien présente
        const imageSrc = article.image ? article.image : 'images/default-news.jpg';

        slide.innerHTML = `
          slide.innerHTML = `
  <a href="${article.link}" target="_blank" style="color:white; text-decoration:none; padding:15px; display:flex; align-items:center; justify-content:center; text-align:center; flex-direction:column; height:100%;">
    ${article.image ? `<img src="${article.image}" alt="Image" style="width: 100%; height: 150px; object-fit: cover; border-radius: 10px; margin-bottom: 10px;">` : ''}
    <div style="font-weight:bold; font-size:16px; margin-bottom:8px;">${article.title}</div>
    <div style="font-size:14px; opacity:0.8; color:#ff9800;">${article.source || 'Source'}</div>
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
