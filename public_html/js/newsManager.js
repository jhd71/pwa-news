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

        const limitedArticles = articles.slice(0, 5);

        limitedArticles.forEach(article => {
            if (article.title && article.link) {
                const slide = document.createElement('div');
                slide.className = 'swiper-slide';

                let imageUrl = article.image ? article.image : "images/default-news.jpg"; // Image par défaut si manquante

                slide.innerHTML = `
                    <a href="${article.link}" target="_blank">
                        <img src="${imageUrl}" alt="${article.title}" class="news-image">
                        <div class="news-text">
                            <h3>${article.title}</h3>
                            <p class="news-source">(${article.source || 'Source inconnue'})</p>
                        </div>
                    </a>
                `;
                swiperWrapper.appendChild(slide);
            }
        });

        // Réinitialisation Swiper après ajout dynamique
        new Swiper('.swiper', {
            loop: true, // Active le loop
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
            spaceBetween: 10
        });

    } catch (error) {
        console.error('Erreur chargement actualités:', error);
        document.getElementById('swiperWrapper').innerHTML = '<div class="swiper-slide"><p>Erreur lors du chargement des actualités.</p></div>';
    }
}

document.addEventListener('DOMContentLoaded', fetchNationalNews);
