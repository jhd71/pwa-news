/**
 * console-filter.js - Filtre les messages indésirables de la console
 * Ce fichier doit être chargé en premier, avant tout autre script
 */
(function() {
    // Vérifier si le filtre est déjà installé pour éviter les doublons
    if (window.consoleFilterInstalled) return;
    window.consoleFilterInstalled = true;
    
    // Liste des filtres à bloquer
    var filtersToBlock = [
        "Banner not shown",
        "beforeinstallpromptevent.preventDefault",
        "Unchecked runtime.lastError",
        "Deprecated API for given entry type",
        "A listener indicated an asynchronous response",
        "Error: Promised response",
        "message channel closed before a response"
    ];
    
    // Fonction qui vérifie si un message contient l'un des filtres
    function shouldBlock(args) {
        if (!args || args.length === 0) return false;
        
        var firstArg = args[0];
        if (typeof firstArg !== 'string') return false;
        
        for (var i = 0; i < filtersToBlock.length; i++) {
            if (firstArg.indexOf(filtersToBlock[i]) !== -1) {
                return true;
            }
        }
        
        return false;
    }
    
    // Sauvegarder les fonctions originales
    var originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info,
        debug: console.debug
    };
    
    // Redéfinir les méthodes avec un code compatible avec tous les navigateurs
    console.log = function() {
        if (!shouldBlock(arguments)) {
            originalConsole.log.apply(console, arguments);
        }
    };
    
    console.warn = function() {
        if (!shouldBlock(arguments)) {
            originalConsole.warn.apply(console, arguments);
        }
    };
    
    console.error = function() {
        if (!shouldBlock(arguments)) {
            originalConsole.error.apply(console, arguments);
        }
    };
    
    console.info = function() {
        if (!shouldBlock(arguments)) {
            originalConsole.info.apply(console, arguments);
        }
    };
    
    console.debug = function() {
        if (!shouldBlock(arguments)) {
            originalConsole.debug.apply(console, arguments);
        }
    };
    
    // Intercepter également les erreurs non capturées
    window.addEventListener('error', function(e) {
        if (e && e.message && shouldBlock([e.message])) {
            e.preventDefault();
            e.stopPropagation();
            return true;
        }
    }, true);
    
    // Intercepter spécifiquement les problèmes liés à beforeinstallprompt
    var originalAddEventListener = window.addEventListener;
    window.addEventListener = function(type, listener, options) {
        if (type === 'beforeinstallprompt') {
            var wrappedListener = function(e) {
                // Intercepter l'erreur potentielle avant qu'elle n'atteigne la console
                try {
                    return listener.call(this, e);
                } catch (error) {
                    // Si l'erreur est liée à nos filtres, on la supprime
                    if (shouldBlock([error.message])) {
                        return false;
                    }
                    // Sinon, la propager
                    throw error;
                }
            };
            return originalAddEventListener.call(this, type, wrappedListener, options);
        }
        return originalAddEventListener.call(this, type, listener, options);
    };
    
    // Indiquer que le filtre est installé
    console.log("Filtre console installé - les messages d'erreur courants seront masqués");
})();