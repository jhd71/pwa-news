// utils.js

/**
 * Affiche une notification toast
 * @param {string} message - Le message à afficher
 * @param {number} duration - La durée d'affichage en ms (défaut: 3000ms)
 * @param {string} type - Le type de toast ('success', 'error', 'info')
 */
export function showToast(message, duration = 3000, type = 'info') {
    const toast = document.getElementById('toast') || createToastElement();
    
    // Ajouter la classe de type
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Afficher le toast
    toast.classList.remove('hidden');
    
    // Masquer après la durée spécifiée
    clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}

/**
 * Crée l'élément toast s'il n'existe pas
 */
function createToastElement() {
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast hidden';
    document.body.appendChild(toast);
    return toast;
}

/**
 * Fonction debounce pour limiter l'exécution d'une fonction
 * @param {Function} func - La fonction à debounce
 * @param {number} wait - Le délai d'attente en ms
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Fonction throttle pour limiter la fréquence d'exécution
 * @param {Function} func - La fonction à throttle
 * @param {number} limit - La limite de temps en ms
 */
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Observe un élément jusqu'à ce qu'il soit visible, puis exécute un callback.
 * @param {HTMLElement} element - L'élément à observer.
 * @param {Function} callback - La fonction à appeler une fois l'élément visible.
 */
export function onElementVisible(element, callback) {
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                callback();
                obs.unobserve(element); // Arrête d'observer après la première fois
            }
        });
    });
    observer.observe(element);
}

/**
 * Valide une URL
 * @param {string} url - L'URL à valider
 * @returns {boolean} - true si l'URL est valide
 */
export function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        try {
            new URL(`http://${url}`);
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * Formate une URL en ajoutant le protocole si nécessaire
 * @param {string} url - L'URL à formater
 * @returns {string} - L'URL formatée
 */
export function formatUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
    }
    return url;
}

/**
 * Vérifie si l'appareil est tactile
 * @returns {boolean} - true si l'appareil est tactile
 */
export function isTouchDevice() {
    return ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0) ||
           (navigator.msMaxTouchPoints > 0);
}

/**
 * Anime un élément avec une transition fluide
 * @param {HTMLElement} element - L'élément à animer
 * @param {Object} properties - Les propriétés CSS à animer
 * @param {number} duration - La durée de l'animation en ms
 */
export function animateElement(element, properties, duration = 300) {
    element.style.transition = `all ${duration}ms ease`;
    Object.assign(element.style, properties);
    
    return new Promise(resolve => {
        setTimeout(() => {
            element.style.transition = '';
            resolve();
        }, duration);
    });
}

/**
 * Copie un texte dans le presse-papier
 * @param {string} text - Le texte à copier
 * @returns {Promise<boolean>} - true si la copie a réussi
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copié dans le presse-papier');
        return true;
    } catch {
        return false;
    }
}

/**
 * Génère un ID unique
 * @returns {string} - L'ID généré
 */
export function generateUniqueId() {
    return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Charge une image et retourne une promesse
 * @param {string} src - L'URL de l'image
 * @returns {Promise<HTMLImageElement>} - L'élément image chargé
 */
export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Vérifie si un élément est visible dans le viewport
 * @param {HTMLElement} element - L'élément à vérifier
 * @returns {boolean} - true si l'élément est visible
 */
export function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Sauvegarde des données dans le localStorage avec expiration
 * @param {string} key - La clé de stockage
 * @param {any} value - La valeur à stocker
 * @param {number} expirationInMinutes - La durée de validité en minutes
 */
export function setWithExpiry(key, value, expirationInMinutes) {
    const item = {
        value: value,
        expiry: Date.now() + (expirationInMinutes * 60 * 1000)
    };
    localStorage.setItem(key, JSON.stringify(item));
}

/**
 * Récupère des données du localStorage en vérifiant l'expiration
 * @param {string} key - La clé de stockage
 * @returns {any} - La valeur stockée ou null si expirée
 */
export function getWithExpiry(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    if (Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
    }
    return item.value;
}

/**
 * Détecte le thème système (clair/sombre)
 * @returns {boolean} - true si le thème système est sombre
 */
export function isSystemDarkMode() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Convertit une taille en bytes en format lisible
 * @param {number} bytes - Le nombre de bytes
 * @returns {string} - La taille formatée
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}