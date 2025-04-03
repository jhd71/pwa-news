	// js/lazyLoading.js
	class LazyLoader {
	  constructor() {
		this.images = [];
		this.setupIntersectionObserver();
		this.setupMutationObserver();
	  }

	  setupIntersectionObserver() {
  // Options de l'IntersectionObserver
  const options = {
    root: null, // viewport
    rootMargin: '50px', // marge autour du viewport pour précharger un peu en avance
    threshold: 0.1 // 10% de l'élément doit être visible
  };

  // Log pour le débogage
  console.log('[LazyLoader] Configuration de l\'IntersectionObserver pour le lazy loading');

  // Créer l'observateur
  this.observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        console.log('[LazyLoader] Image dans la vue:', entry.target.dataset.src || entry.target.src);
        const img = entry.target;
        
        // Si l'image a un attribut data-src, le transférer vers src
        if (img.dataset.src) {
          console.log('[LazyLoader] Chargement de l\'image:', img.dataset.src);
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        
        // Si l'image a un attribut data-srcset, le transférer vers srcset
        if (img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
          img.removeAttribute('data-srcset');
        }
        
        // Ne plus observer cette image
        observer.unobserve(img);
      }
    });
  }, options);
}

	  setupMutationObserver() {
		// Observer les changements dans le DOM pour trouver de nouvelles images
		const mutationObserver = new MutationObserver((mutations) => {
		  mutations.forEach(mutation => {
			if (mutation.type === 'childList') {
			  // Pour chaque noeud ajouté
			  mutation.addedNodes.forEach(node => {
				// Si c'est un élément HTML
				if (node.nodeType === 1) {
				  // Si c'est une image
				  if (node.tagName === 'IMG') {
					this.prepareImage(node);
				  } else {
					// Chercher des images à l'intérieur
					const images = node.querySelectorAll('img');
					images.forEach(img => this.prepareImage(img));
				  }
				}
			  });
			}
		  });
		});

		// Observer tout le document
		mutationObserver.observe(document.body, {
		  childList: true,
		  subtree: true
		});
	  }

	  prepareImage(img) {
  // Ne pas traiter les images déjà préparées ou chargées
  if (img.hasAttribute('data-lazy-handled') || img.hasAttribute('loading')) {
    return;
  }

  // Marquer l'image comme traitée
  img.setAttribute('data-lazy-handled', 'true');

  // 1. Utiliser l'attribut loading natif si possible
  img.setAttribute('loading', 'lazy');

  // 2. Pour un support plus large, utiliser aussi l'IntersectionObserver
  if (!img.complete && !img.hasAttribute('data-src')) {
    // Sauvegarder le src original dans data-src
    const originalSrc = img.src;
    if (originalSrc && !originalSrc.startsWith('data:')) {
      console.log('[LazyLoader] Préparation de l\'image:', originalSrc);
      img.dataset.src = originalSrc;
      // Utiliser une image placeholder très petite en attendant
      img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";
      // Observer cette image
      this.observer.observe(img);
    }
  }
}

	  // Initialiser en traitant toutes les images existantes
	  init() {
		const images = document.querySelectorAll('img');
		images.forEach(img => this.prepareImage(img));
		console.log(`[LazyLoader] ${images.length} images préparées pour le lazy loading`);
	  }
	}

	export default LazyLoader;