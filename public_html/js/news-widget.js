// news-widget.js - Gestionnaire du widget NEWS Actu&Média

class NewsWidget {
    constructor() {
        this.isLoaded = false;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    // Initialiser le widget
    init() {
        // Attendre que Supabase soit disponible
        this.waitForSupabase();
    }

    // Attendre que Supabase soit disponible
    waitForSupabase() {
        if (typeof window.getSupabaseClient === 'function') {
            console.log('📰 Initialisation du widget NEWS');
            this.loadNews();
        } else if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`⏳ Attente de Supabase... (tentative ${this.retryCount}/${this.maxRetries})`);
            setTimeout(() => this.waitForSupabase(), 1000);
        } else {
            console.error('❌ Impossible de charger Supabase pour le widget NEWS');
            this.showError('Service temporairement indisponible');
        }
    }

    // Charger et afficher les actualités
    async loadNews() {
        try {
            const supabase = window.getSupabaseClient();
            if (!supabase) {
                throw new Error('Client Supabase non disponible');
            }

            // Récupérer toutes les actualités publiées (pas de limite)
	const { data: news, error } = await supabase
    .from('local_news')
    .select('id, title, content, created_at, featured')
    .eq('is_published', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            const previewContainer = document.getElementById('newsWidgetPreview');
            const countElement = document.getElementById('newsWidgetCount');

            if (news && news.length > 0) {
				
                // Afficher les actualités avec liens spécifiques
	previewContainer.innerHTML = news.map(item => {
    const featuredIcon = item.featured ? '⭐ ' : '';
    const shortContent = this.truncateText(item.content, 60); // Réduit pour plus d'actualités
    return `
        <div class="news-preview-item" data-news-id="${item.id}" onclick="openSpecificNews(${item.id})" style="cursor: pointer;">
            <strong>${featuredIcon}${item.title}</strong><br>
            <span style="font-size: 12px; opacity: 0.8;">${shortContent}...</span>
        </div>
    `;
	}).join('');

                // Compter toutes les actualités publiées
                const { count } = await supabase
                    .from('local_news')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_published', true);

                countElement.textContent = `${count || news.length} news`;
                this.isLoaded = true;
                console.log(`✅ Widget NEWS chargé: ${news.length} actualités affichées`);
            } else {
                // Aucune actualité
                this.showEmptyState();
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement des actualités:', error);
            this.showError('Erreur de chargement');
        }
    }

    // Afficher l'état vide
    showEmptyState() {
        const previewContainer = document.getElementById('newsWidgetPreview');
        const countElement = document.getElementById('newsWidgetCount');
        
        previewContainer.innerHTML = `
            <div class="news-preview-item">
                <strong>📝 Premières actualités bientôt disponibles</strong><br>
                Les actualités locales de Montceau-les-Mines et environs apparaîtront ici.
            </div>
        `;
        countElement.textContent = '0 news';
    }

    // Afficher une erreur
    showError(message) {
        const previewContainer = document.getElementById('newsWidgetPreview');
        if (previewContainer) {
            previewContainer.innerHTML = `
                <div class="loading-news">
                    <span class="material-icons">error</span>
                    ${message}
                </div>
            `;
        }
    }

    // Tronquer le texte
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim();
    }

    // Ouvrir la page des actualités
    openNewsPage() {
        const widget = document.getElementById('localNewsWidget');
        if (widget) {
            // Animation de clic
            widget.style.transform = 'scale(0.98)';
            
            // Vibration tactile si disponible
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            setTimeout(() => {
                widget.style.transform = 'translateY(-2px)';
                // Redirection vers la page des actualités
                window.location.href = 'news-locale.html';
            }, 150);
        }
    }

	// Ouvrir la page des actualités
	openNewsPage() {
    const widget = document.getElementById('localNewsWidget');
    if (widget) {
        // Animation de clic
        widget.style.transform = 'scale(0.98)';
        
        // Vibration tactile si disponible
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        setTimeout(() => {
            widget.style.transform = 'translateY(-2px)';
            // Redirection vers la page des actualités
            window.location.href = 'news-locale.html';
        }, 150);
    }
	}

	// NOUVELLE FONCTION - Ajoutez ceci juste après la fonction ci-dessus
	openSpecificNews(newsId) {
    // Animation de clic
    event.stopPropagation(); // Empêche l'ouverture du widget général
    
    // Vibration tactile si disponible
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    // Redirection avec l'ID de l'actualité
    window.location.href = `news-locale.html#news-${newsId}`;
	}
	
    // Recharger les actualités
    async refresh() {
        console.log('🔄 Rechargement du widget NEWS...');
        const previewContainer = document.getElementById('newsWidgetPreview');
        
        // Afficher le loader
        previewContainer.innerHTML = `
            <div class="loading-news">
                <span class="material-icons spinning">hourglass_empty</span>
                Actualisation...
            </div>
        `;
        
        // Recharger
        await this.loadNews();
    }
}

	// Instance globale du widget
	let newsWidget = null;

	// Fonction globale pour ouvrir la page (appelée depuis le HTML)
	function openLocalNewsPage() {
    if (newsWidget) {
        newsWidget.openNewsPage();
    }
	}

	// Fonction globale pour ouvrir la page (appelée depuis le HTML)
	function openLocalNewsPage() {
    if (newsWidget) {
        newsWidget.openNewsPage();
    }
	}

	// NOUVELLE FONCTION GLOBALE - Ajoutez ceci juste après
	function openSpecificNews(newsId) {
    event.stopPropagation();
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    window.location.href = `news-locale.html#news-${newsId}`;
	}

	// Initialisation automatique
	document.addEventListener('DOMContentLoaded', function() {
    // Créer l'instance du widget
    newsWidget = new NewsWidget();
    
    // Initialiser le widget après un délai pour s'assurer que Supabase est chargé
    setTimeout(() => {
        newsWidget.init();
    }, 1500);
});

	// Recharger le widget quand les actualités sont mises à jour (optionnel)
	window.addEventListener('newsUpdated', function() {
    if (newsWidget) {
        newsWidget.refresh();
    }
});

// Export pour usage externe
window.NewsWidget = NewsWidget;

// Fonction globale pour ouvrir une actualité spécifique
function openSpecificNews(newsId) {
    if (event) {
        event.stopPropagation();
    }
    
    // Vibration tactile si disponible
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    // Redirection avec l'ID de l'actualité
    window.location.href = `news-locale.html#news-${newsId}`;
}

// Rendre la fonction disponible globalement
window.openSpecificNews = openSpecificNews;