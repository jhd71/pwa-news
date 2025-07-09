// social-share.js - Gestion du partage sur les réseaux sociaux

class SocialShare {
    constructor() {
        this.init();
    }

    init() {
        // Ajouter les boutons de partage sur les articles
        this.addShareButtons();
    }

    addShareButtons() {
        // Pour la page des actualités
        if (window.location.pathname.includes('news-locale')) {
            this.addShareToNewsArticles();
        }
    }

    addShareToNewsArticles() {
        // Observer pour ajouter les boutons quand les articles sont chargés
        const observer = new MutationObserver(() => {
            const articles = document.querySelectorAll('.news-article:not(.share-added)');
            
            articles.forEach(article => {
                const shareDiv = this.createShareButtons(article);
                const contentDiv = article.querySelector('.news-article-content');
                
                if (contentDiv) {
                    contentDiv.insertAdjacentHTML('afterend', shareDiv);
                    article.classList.add('share-added');
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    createShareButtons(article) {
        const title = article.querySelector('.news-article-title')?.textContent || 'Actualité Montceau';
        const url = `${window.location.origin}/news-locale.html#${article.getAttribute('data-news-id')}`;
        
        return `
            <div class="social-share-buttons" style="
                margin-top: 20px;
                padding: 15px;
                background: #f5f5f5;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
            ">
                <span style="font-weight: bold; color: #666;">Partager :</span>
                
                <!-- Facebook -->
                <button onclick="socialShare.shareOnFacebook('${encodeURIComponent(url)}', '${encodeURIComponent(title)}')" 
                        style="background: #1877f2; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                </button>
                
                <!-- Twitter -->
                <button onclick="socialShare.shareOnTwitter('${encodeURIComponent(url)}', '${encodeURIComponent(title)}')" 
                        style="background: #1da1f2; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    Twitter
                </button>
                
                <!-- WhatsApp -->
                <button onclick="socialShare.shareOnWhatsApp('${encodeURIComponent(url)}', '${encodeURIComponent(title)}')" 
                        style="background: #25d366; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    WhatsApp
                </button>
                
                <!-- Email -->
                <button onclick="socialShare.shareByEmail('${encodeURIComponent(url)}', '${encodeURIComponent(title)}')" 
                        style="background: #666; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                    Email
                </button>
                
                <!-- Copier le lien -->
                <button onclick="socialShare.copyLink('${encodeURIComponent(url)}')" 
                        style="background: #940000; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                    Copier
                </button>
            </div>
        `;
    }

    shareOnFacebook(url, title) {
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${title}`;
        window.open(shareUrl, 'facebook-share', 'width=580,height=296');
    }

    shareOnTwitter(url, title) {
        const shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}&hashtags=Montceau,ActuMedia`;
        window.open(shareUrl, 'twitter-share', 'width=550,height=420');
    }

    shareOnWhatsApp(url, title) {
        const text = `${decodeURIComponent(title)} - ${decodeURIComponent(url)}`;
        const shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(shareUrl, '_blank');
    }

    shareByEmail(url, title) {
        const subject = `Actualité Montceau : ${decodeURIComponent(title)}`;
        const body = `Je voulais partager cette actualité avec vous :\n\n${decodeURIComponent(title)}\n\nLire la suite : ${decodeURIComponent(url)}\n\nSource : Actu & Média`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    async copyLink(url) {
        const decodedUrl = decodeURIComponent(url);
        try {
            await navigator.clipboard.writeText(decodedUrl);
            this.showToast('Lien copié !');
        } catch (err) {
            // Fallback pour les anciens navigateurs
            const textArea = document.createElement('textarea');
            textArea.value = decodedUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Lien copié !');
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            z-index: 10000;
            animation: fadeInOut 2s ease;
        `;
        toast.textContent = message;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, 20px); }
                20% { opacity: 1; transform: translate(-50%, 0); }
                80% { opacity: 1; transform: translate(-50%, 0); }
                100% { opacity: 0; transform: translate(-50%, -20px); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
}

// Initialiser au chargement
const socialShare = new SocialShare();