/* ============================================
   WIDGET ACTUALITÉS LOCALES
   Charge et affiche les actualités depuis Supabase
   ============================================ */

class NewsWidget {
    constructor(options = {}) {
        this.container = options.container || '#newsContainer';
        this.limit = options.limit || 5;
        this.showEmpty = options.showEmpty !== false;
        
        // Supabase (utilise l'instance existante si disponible)
        this.supabaseUrl = 'https://ekjgfiyhkythqcnmhzea.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramdmaXloa3l0aHFjbm1oemVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzYxNDIsImV4cCI6MjA1ODI1MjE0Mn0.V0j_drb6GiTojgwxC6ydjnyJDRRT9lUbSc1E7bFE2Z4';
        
        this.init();
    }

    async init() {
        const container = document.querySelector(this.container);
        if (!container) return;

        // Afficher le loading
        container.innerHTML = this.renderLoading();

        // Charger les actualités
        const news = await this.fetchNews();

        // Afficher
        if (news.length > 0) {
            container.innerHTML = this.renderNews(news);
        } else if (this.showEmpty) {
            container.innerHTML = this.renderEmpty();
        } else {
            container.innerHTML = '';
        }

        console.log(`📰 ${news.length} actualités chargées`);
    }

    async fetchNews() {
        try {
            const response = await fetch(
                `${this.supabaseUrl}/rest/v1/news_feed?select=*&is_visible=eq.true&order=published_at.desc&limit=${this.limit}`,
                {
                    headers: {
                        'apikey': this.supabaseKey,
                        'Authorization': `Bearer ${this.supabaseKey}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('❌ Erreur chargement actualités:', error);
            return [];
        }
    }

    renderLoading() {
        return `
            <div class="news-loading">
                <div class="spinner"></div>
                <span>Chargement des actualités...</span>
            </div>
        `;
    }

    renderEmpty() {
        return `
            <div class="news-empty">
                <span class="material-icons">article</span>
                <p>Aucune actualité pour le moment</p>
            </div>
        `;
    }

    renderNews(news) {
        const cards = news.map(item => this.renderCard(item)).join('');
        
        return `
            <div class="news-list">
                ${cards}
            </div>
        `;
    }

    renderCard(item) {
    const timeAgo = this.formatTimeAgo(item.published_at);
    const isNew = this.isRecent(item.published_at, 6); // Moins de 6h = nouveau
    
    // Icône selon la source
    let icon = 'article';
    if (item.source.includes('France 3')) icon = 'tv';
    else if (item.source.includes('JSL')) icon = 'newspaper';
    
    return `
        <a href="${item.url}" class="news-card" target="_blank" rel="noopener noreferrer">
            <div class="news-source-icon"><span class="material-icons">${icon}</span></div>
                <div class="news-content">
                    <div class="news-title">
                        ${this.escapeHtml(item.title)}
                        ${isNew ? '<span class="news-badge-new">Nouveau</span>' : ''}
                    </div>
                    <div class="news-meta">
                        <span class="news-source">${this.escapeHtml(item.source)}</span>
                        <span>•</span>
                        <span class="news-date">
                            <span class="material-icons">schedule</span>
                            ${timeAgo}
                        </span>
                    </div>
                </div>
                <div class="news-arrow">
                    <span class="material-icons">arrow_forward_ios</span>
                </div>
            </a>
        `;
    }

    formatTimeAgo(dateString) {
        if (!dateString) return 'Récent';

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays === 1) return 'Hier';
        if (diffDays < 7) return `Il y a ${diffDays} jours`;
        
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }

    isRecent(dateString, hours) {
        if (!dateString) return false;
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = diffMs / 3600000;
        return diffHours < hours;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Auto-initialisation si le conteneur existe
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('newsContainer');
    if (container) {
        window.newsWidget = new NewsWidget({
            container: '#newsContainer',
            limit: 5
        });
    }
});
