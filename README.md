# 📰 Agrégateur d'Actualités Locales

Système automatique de veille d'actualités locales pour Actu & Média.

## Fonctionnement

1. **GitHub Actions** scrape les flux RSS toutes les 3 heures
2. Les titres et liens sont stockés dans **Supabase**
3. Le **widget** affiche les actualités sur le site

**100% légal** : on ne copie que les titres et liens, pas le contenu des articles.

---

## Installation

### 1. Créer la table Supabase

```sql
CREATE TABLE news_feed (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,
    source TEXT NOT NULL,
    source_icon TEXT,
    description TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    category TEXT DEFAULT 'general',
    is_visible BOOLEAN DEFAULT true
);

CREATE INDEX idx_news_feed_published ON news_feed(published_at DESC);
CREATE INDEX idx_news_feed_source ON news_feed(source);

ALTER TABLE news_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique news" ON news_feed
    FOR SELECT USING (is_visible = true);

CREATE POLICY "Insertion news" ON news_feed
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Update news" ON news_feed
    FOR UPDATE USING (true);
```

### 2. Ajouter les secrets GitHub

Dans ton repo GitHub → Settings → Secrets and variables → Actions :

| Secret | Valeur |
|--------|--------|
| `SUPABASE_URL` | `https://ekjgfiyhkythqcnmhzea.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Ta clé service_role (pas anon !) |

Pour trouver la clé service_role :
- Supabase Dashboard → Settings → API → service_role (secret)

### 3. Copier les fichiers du scraper

```
ton-repo/
├── news-scraper/
│   ├── scrape-news.js
│   └── package.json
└── .github/
    └── workflows/
        └── scrape-news.yml
```

### 4. Intégrer le widget sur ton site

**Dans index.html - HEAD :**
```html
<link rel="stylesheet" href="css/news-widget.css">
```

**Dans index.html - Où tu veux afficher les actualités :**
```html
<!-- Section Actualités Locales -->
<section class="news-section">
    <div class="news-section-header">
        <h2 class="news-section-title">
            <span class="material-icons">newspaper</span>
            Actualités locales
        </h2>
        <a href="#" class="news-see-all" id="newsRefreshBtn">
            <span class="material-icons">refresh</span>
            Actualiser
        </a>
    </div>
    <div id="newsContainer">
        <!-- Les actualités seront chargées ici -->
    </div>
</section>
```

**Dans index.html - Avant </body> :**
```html
<script src="js/news-widget.js"></script>
```

### 5. Mettre à jour le Service Worker

Ajouter au cache :
```javascript
'/css/news-widget.css',
'/js/news-widget.js'
```

---

## Sources d'actualités

| Source | Type | Zone |
|--------|------|------|
| France 3 Bourgogne | RSS | Régional (filtré) |
| Le JSL - Montceau | RSS | Local |
| Le JSL - Le Creusot | RSS | Local |
| Le JSL - Général | RSS | Départemental (filtré) |
| Info Chalon | RSS | Local (filtré) |

### Ajouter une source

Dans `scrape-news.js`, ajouter à `NEWS_SOURCES` :

```javascript
{
    name: 'Nom de la source',
    type: 'rss',
    url: 'https://exemple.com/rss',
    icon: '📰',
    filter: ['Montceau', 'Creusot'] // ou null pour tout garder
}
```

---

## Planning du scraper

- **6h, 9h, 12h, 15h, 18h, 21h** (6 fois par jour)
- Peut être lancé manuellement depuis GitHub Actions

---

## Maintenance

### Voir les logs
GitHub → Actions → Scraper Actualités Locales → Dernière exécution

### Nettoyer manuellement les anciennes actualités
```sql
DELETE FROM news_feed WHERE published_at < NOW() - INTERVAL '30 days';
```

### Masquer une actualité
```sql
UPDATE news_feed SET is_visible = false WHERE id = 'xxx';
```
