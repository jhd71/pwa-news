async function fetchNationalNews() {
    try {
        const response = await fetch('/api/getNationalNews');
        const articles = await response.json();
        const swiperWrapper = document.getElementById('swiperWrapper');
        
        swiperWrapper.innerHTML = '';

        if (articles.length === 0) {
            swiperWrapper.innerHTML = '<div class="swiper-slide"><p>Aucune actualité disponible.</p></div>';
            return;
        }

        // Limiter à 5 articles
        const limitedArticles = articles.slice(0, 5);

        limitedArticles.forEach(article => {
            if (article.title && article.link) {
                const slide = document.createElement('div');
                slide.className = 'swiper-slide';

                slide.innerHTML = `
                    <a href="${article.link}" target="_blank" style="color:white; text-decoration:none; padding:15px; display:flex; align-items:center; justify-content:center; text-align:center; flex-direction:column; height:100%;">
                        ${article.image ? `<img src="${article.image}" alt="${article.title}" style="max-width:90%; height:auto; border-radius:8px; margin-bottom:10px;">` : ''}
                        <div style="font-weight:bold; font-size:16px; margin-bottom:8px;">${article.title}</div>
                        <div style="font-size:14px; opacity:0.8; color:#ff9800;">${article.source || 'Source inconnue'}</div>
                    </a>
                `;
                swiperWrapper.appendChild(slide);
            }
        });

        // Réinitialisation Swiper
        new Swiper('.swiper', {
            loop: false, // Désactiver loop si moins de 5 articles
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
        console.error('Erreur de chargement des actualités:', error);
        document.getElementById('swiperWrapper').innerHTML = '<div class="swiper-slide"><p>Erreur lors du chargement des actualités.</p></div>';
    }
}

// Charger les actualités au chargement de la page
document.addEventListener('DOMContentLoaded', fetchNationalNews);
