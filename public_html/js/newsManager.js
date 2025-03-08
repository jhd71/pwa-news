async function loadTopNews() {
    const swiperWrapper = document.getElementById('swiperWrapper');

    try {
        console.log("⏳ Chargement des actualités...");
        const response = await fetch('/api/getNationalNews.js');
        const articles = await response.json();

        swiperWrapper.innerHTML = ''; // Nettoyer avant d'ajouter les nouvelles actualités

        if (articles.length === 0) {
            swiperWrapper.innerHTML = '<div class="swiper-slide"><p>Aucune actualité disponible.</p></div>';
            return;
        }

        // Limiter à 5 articles pour éviter un carrousel trop long
        const limitedArticles = articles.slice(0, 5);

        limitedArticles.forEach(article => {
            if (article.title && article.link) {
                const slide = document.createElement('div');
                slide.className = 'swiper-slide';

                slide.innerHTML = `
                    <a href="${article.link}" target="_blank" style="color:white; text-decoration:none; padding:15px; display:flex; align-items:center; justify-content:center; text-align:center; flex-direction:column; height:100%;">
                        <img src="${article.image}" alt="Illustration" style="width:100%; height:auto; max-height:180px; object-fit:cover; border-radius:10px;">
                        <div style="font-weight:bold; font-size:16px; margin-top:10px;">${article.title}</div>
                        <div style="font-size:14px; opacity:0.8; color:#ff9800;">${article.source || 'Source inconnue'}</div>
                    </a>
                `;
                swiperWrapper.appendChild(slide);
            }
        });

        // Réinitialiser Swiper après ajout dynamique
        new Swiper('.swiper', {
            loop: true,
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

// Fonction de rafraîchissement automatique des news
function autoRefreshNews(interval = 60000) { // 60 secondes par défaut
    setInterval(() => {
        console.log("🔄 Rafraîchissement automatique des actualités...");
        loadTopNews();
    }, interval);
}

document.addEventListener('DOMContentLoaded', () => {
    loadTopNews();
    autoRefreshNews(); // Active le rafraîchissement auto
});
