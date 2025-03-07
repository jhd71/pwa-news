async function fetchNationalNews() {
    try {
        const response = await fetch('/api/getNationalNews.js');
        const newsData = await response.json();

        const swiperWrapper = document.querySelector('.swiper-wrapper');
        swiperWrapper.innerHTML = ''; // Vide l'ancien contenu

        newsData.forEach(news => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';

            slide.innerHTML = `
                <div class="news-slide">
                    ${news.image ? `<img src="${news.image}" alt="${news.title}" class="news-image">` : ''}
                    <div class="news-text">
                        <h3>${news.title}</h3>
                        <a href="${news.link}" target="_blank" class="news-source">(${news.source})</a>
                    </div>
                </div>
            `;

            swiperWrapper.appendChild(slide);
        });

        // ✅ Réinitialise Swiper après avoir ajouté les slides
        new Swiper('.swiper-container', {
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
        });

    } catch (error) {
        console.error('Erreur lors du chargement des actualités nationales:', error);
    }
}

// ✅ Appeler la fonction au chargement de la page
document.addEventListener('DOMContentLoaded', fetchNationalNews);
