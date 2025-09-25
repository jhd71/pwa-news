document.addEventListener('DOMContentLoaded', function() {
    // Récupérer une instance valide du client Supabase
    let supabaseClient = window.getSupabaseClient();
    console.log("Utilisation du client Supabase partagé pour le sondage");
    
    // Vérifier que le client est valide
    if (!supabaseClient || typeof supabaseClient.from !== 'function') {
        console.error("Erreur: Client Supabase non valide ou manquant la méthode 'from'", supabaseClient);
        
        // Message d'erreur visible pour l'utilisateur
        const toastDiv = document.createElement('div');
        toastDiv.className = 'toast';
        toastDiv.textContent = "Le sondage est temporairement indisponible. Veuillez réessayer plus tard.";
        document.body.appendChild(toastDiv);
        setTimeout(() => {
            toastDiv.remove();
        }, 5000);
        return; // Sortir si le client n'est pas valide
    }
    
    // Éléments DOM
    const surveyBtn = document.getElementById('surveyBtn');
    const surveyModal = document.getElementById('surveyModal');
    const closeSurvey = document.getElementById('closeSurvey');
    const surveySubmit = document.getElementById('surveySubmit');
    const surveyQuestions = document.getElementById('surveyQuestions');
    const thankYouMessage = document.getElementById('thankYouMessage');
    const surveyResults = document.getElementById('surveyResults');
    const closeSurveyAfterSubmit = document.getElementById('closeSurveyAfterSubmit');
    
    // Stockage des réponses sélectionnées
    const selectedAnswers = {};
    
    // Structure pour stocker les résultats du sondage
    let surveyData = {
        utilisation: {},
        satisfaction: {},
        evolution: {}
    };
    
    // ========================================
    // NOUVEAU : Variables pour le système de badge "Nouveau"
    // ========================================
    let currentSurveyId = 'survey_2025_01_v2'; // CHANGEZ CETTE VALEUR POUR ACTIVER UN NOUVEAU SONDAGE
    let newSurveyAvailable = false;
	
	// ========================================
    // NOUVELLES FONCTIONS POUR LE BADGE "NOUVEAU"
    // ========================================
    
    /**
     * Vérifie s'il y a un nouveau sondage disponible
     */
    function checkForNewSurvey() {
        try {
            const lastSeenSurvey = localStorage.getItem('lastSeenSurvey') || '';
            
            // Vérifier si l'utilisateur a déjà vu ce sondage
            if (lastSeenSurvey !== currentSurveyId) {
                newSurveyAvailable = true;
                console.log('📊 Nouveau sondage détecté !');
                
                // Appliquer les effets visuels après un court délai
                setTimeout(() => {
                    applySurveyNewBadge();
                }, 500);
            } else {
                newSurveyAvailable = false;
                console.log('📊 Aucun nouveau sondage');
            }
        } catch (error) {
            console.error('Erreur vérification nouveau sondage:', error);
        }
    }
    
    /**
     * Applique le badge et les animations à la tuile sondage
     */
    function applySurveyNewBadge() {
        try {
            // Chercher la tuile sondage de plusieurs façons
            let surveyTile = null;
            
            // Méthode 1: Par classe survey-tile
            surveyTile = document.querySelector('.tile.survey-tile');
            
            // Méthode 2: Par contenu du texte si pas trouvée
            if (!surveyTile) {
                const allTiles = document.querySelectorAll('.tile');
                allTiles.forEach(tile => {
                    const title = tile.querySelector('.tile-title');
                    if (title && title.textContent.includes('Sondage')) {
                        surveyTile = tile;
                    }
                });
            }
            
            if (surveyTile) {
                addNewSurveyEffects(surveyTile);
            } else {
                console.warn('Tuile sondage non trouvée pour appliquer le badge');
            }
        } catch (error) {
            console.error('Erreur application badge sondage:', error);
        }
    }
    
    /**
     * Ajoute les effets visuels à une tuile
     */
    function addNewSurveyEffects(tile) {
        if (!tile) return;
        
        // Ajouter les classes CSS
        tile.classList.add('survey-tile', 'has-new-survey');
        
        // Forcer la tuile à être visible même avec transparence
        tile.style.opacity = '1';
        tile.style.zIndex = '10';
        
        console.log('✨ Effets "nouveau sondage" appliqués');
    }
    
    /**
     * Marquer le sondage comme vu (appelé quand l'utilisateur ouvre le modal)
     */
    function markSurveyAsSeen() {
        try {
            localStorage.setItem('lastSeenSurvey', currentSurveyId);
            localStorage.setItem('lastSurveyCheck', Date.now().toString());
            
            // Supprimer les effets visuels
            const surveyTiles = document.querySelectorAll('.tile.has-new-survey');
            surveyTiles.forEach(tile => {
                tile.classList.remove('has-new-survey');
                tile.style.opacity = '';
                tile.style.zIndex = '';
            });
            
            newSurveyAvailable = false;
            console.log('📊 Sondage marqué comme vu');
        } catch (error) {
            console.error('Erreur marquage sondage vu:', error);
        }
    }
    
    /**
     * Active un nouveau sondage (pour vos tests)
     */
    function activateNewSurvey(surveyId = null) {
        if (!surveyId) {
            surveyId = 'survey_' + Date.now();
        }
        
        currentSurveyId = surveyId;
        localStorage.removeItem('lastSeenSurvey');
        
        console.log(`📊 Nouveau sondage activé : ${surveyId}`);
        checkForNewSurvey();
    }
    
    /**
     * Réinitialise le système (pour tests)
     */
    function resetSurveySystem() {
        localStorage.removeItem('lastSeenSurvey');
        localStorage.removeItem('lastSurveyCheck');
        console.log('🔄 Système sondage réinitialisé');
        
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
	
	// Fonction pour obtenir un identifiant d'appareil stable
    function getDeviceId() {
        // Vérifier si un ID existe déjà dans localStorage
        let deviceId = localStorage.getItem('survey_device_id');
        
        // Si aucun ID n'existe, en créer un nouveau
        if (!deviceId) {
            // Utiliser une combinaison de l'user agent, la résolution d'écran et un nombre aléatoire
            const components = [
                navigator.userAgent,
                screen.width + 'x' + screen.height,
                navigator.language,
                new Date().getTimezoneOffset()
            ];
            
            // Créer un hash simple de ces composants
            const hashStr = components.join('|');
            let hash = 0;
            for (let i = 0; i < hashStr.length; i++) {
                const char = hashStr.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convertir en entier 32 bits
            }
            
            // Créer un ID avec un préfixe, le hash et un timestamp
            deviceId = 'survey_' + Math.abs(hash).toString(16) + '_' + Date.now().toString(36);
            localStorage.setItem('survey_device_id', deviceId);
            
            console.log('Nouvel identifiant de sondage généré:', deviceId);
        } else {
            console.log('Identifiant de sondage existant:', deviceId);
        }
        
        return deviceId;
    }

    // Fonction pour calculer la similarité entre deux chaînes (distance de Levenshtein)
    function calculateSimilarity(str1, str2) {
        if (!str1 || !str2) return 0;
        
        // Fonction pour calculer la distance de Levenshtein
        function levenshteinDistance(a, b) {
            const matrix = [];
            
            // Initialiser la matrice
            for (let i = 0; i <= b.length; i++) {
                matrix[i] = [i];
            }
            for (let j = 0; j <= a.length; j++) {
                matrix[0][j] = j;
            }
            
            // Remplir la matrice
            for (let i = 1; i <= b.length; i++) {
                for (let j = 1; j <= a.length; j++) {
                    if (b.charAt(i-1) === a.charAt(j-1)) {
                        matrix[i][j] = matrix[i-1][j-1];
                    } else {
                        matrix[i][j] = Math.min(
                            matrix[i-1][j-1] + 1, // substitution
                            matrix[i][j-1] + 1,   // insertion
                            matrix[i-1][j] + 1    // suppression
                        );
                    }
                }
            }
            
            return matrix[b.length][a.length];
        }
        
        const distance = levenshteinDistance(str1, str2);
        const maxLength = Math.max(str1.length, str2.length);
        
        // Normaliser pour obtenir une similarité entre 0 et 1
        return 1 - (distance / maxLength);
    }

    // Fonction pour vérifier si cet appareil a déjà participé
    async function hasAlreadyParticipated() {
        try {
            console.log('=== DÉBUT VÉRIFICATION PARTICIPATION ===');
            
            // 1. Vérification locale d'abord
            const hasCompletedLocally = localStorage.getItem('surveyCompleted') === 'true';
            console.log('Participation locale:', hasCompletedLocally);
            
            if (hasCompletedLocally) {
                console.log('✅ Participation confirmée localement');
                return true;
            }
            
            // 2. Vérification IP PRIORITAIRE
            let currentIP = '';
            if (window.chatManager && typeof window.chatManager.getClientRealIP === 'function') {
                try {
                    currentIP = await window.chatManager.getClientRealIP() || '';
                    console.log('IP obtenue:', currentIP);
                    
                    if (currentIP) {
                        const { data: ipData, error: ipError } = await supabaseClient
                            .from('survey_participants')
                            .select('id, created_at')
                            .eq('ip_address', currentIP)
                            .maybeSingle();
                        
                        if (!ipError && ipData) {
                            console.log('⛔ IP a déjà participé:', ipData);
                            // Marquer localement pour éviter les vérifications futures
                            localStorage.setItem('surveyCompleted', 'true');
                            localStorage.setItem('survey_device_id_confirmed', 'true');
                            return true;
                        } else {
                            console.log('✅ IP pas encore utilisée pour voter');
                        }
                    }
                } catch (e) {
                    console.log('Erreur récupération IP:', e);
                }
            }
            
            // 3. Vérification Device ID (secondaire)
            const deviceId = getDeviceId();
            console.log('Device ID:', deviceId);
            
            const { data: deviceData, error: deviceError } = await supabaseClient
                .from('survey_participants')
                .select('id, created_at')
                .eq('device_id', deviceId)
                .maybeSingle();
                
            if (!deviceError && deviceData) {
                console.log('⛔ Device ID a déjà participé:', deviceData);
                localStorage.setItem('surveyCompleted', 'true');
                localStorage.setItem('survey_device_id_confirmed', 'true');
                return true;
            }
            
            // 4. Vérification User Agent (moins fiable)
            const userAgent = navigator.userAgent;
            if (userAgent && userAgent.length > 50) {
                const { data: uaData, error: uaError } = await supabaseClient
                    .from('survey_participants')
                    .select('id, user_agent')
                    .ilike('user_agent', `%${userAgent.substring(0, 50)}%`)
                    .limit(1);
                    
                if (!uaError && uaData && uaData.length > 0) {
                    const similarity = calculateSimilarity(userAgent, uaData[0].user_agent);
                    if (similarity > 0.95) { // Augmenté à 95% pour être plus strict
                        console.log('⛔ User agent très similaire trouvé:', similarity);
                        localStorage.setItem('surveyCompleted', 'true');
                        localStorage.setItem('survey_device_id_confirmed', 'true');
                        return true;
                    }
                }
            }
            
            console.log('✅ Aucune participation détectée - AUTORISATION DE VOTER');
            return false;
            
        } catch (error) {
            console.error('Erreur vérification participation:', error);
            // En cas d'erreur, on vérifie au moins le localStorage
            return localStorage.getItem('surveyCompleted') === 'true';
        }
    }
	
	// Fonction pour enregistrer la participation de cet appareil
    async function recordParticipation() {
        try {
            console.log('=== ENREGISTREMENT PARTICIPATION ===');
            
            // Vérification finale avant enregistrement
            const alreadyExists = await hasAlreadyParticipated();
            if (alreadyExists) {
                console.log('⛔ Tentative de double participation bloquée');
                return false;
            }
            
            const deviceId = getDeviceId();
            let ipAddress = '';
            
            // Obtenir l'IP
            if (window.chatManager && typeof window.chatManager.getClientRealIP === 'function') {
                try {
                    ipAddress = await window.chatManager.getClientRealIP() || '';
                    console.log('IP pour enregistrement:', ipAddress);
                } catch (e) {
                    console.log('Impossible d\'obtenir l\'IP:', e);
                }
            }
            
            const userAgent = navigator.userAgent || '';
            const screenInfo = `${screen.width}x${screen.height}x${screen.colorDepth}`;
            const languages = navigator.languages ? navigator.languages.join(',') : navigator.language;
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            
            const additionalInfo = {
                screen: screenInfo,
                languages: languages,
                timezone: timezone,
                timestamp: new Date().toISOString()
            };
            
            // Tentative d'insertion avec gestion des doublons
            const { data, error } = await supabaseClient
                .from('survey_participants')
                .insert({
                    device_id: deviceId,
                    ip_address: ipAddress,
                    user_agent: userAgent.substring(0, 250),
                    additional_info: JSON.stringify(additionalInfo).substring(0, 500)
                })
                .select();
                
            if (error) {
                // Si c'est une violation de contrainte unique (déjà existant)
                if (error.code === '23505' || error.message.includes('duplicate')) {
                    console.log('⛔ Participation déjà enregistrée (contrainte unique)');
                    localStorage.setItem('surveyCompleted', 'true');
                    localStorage.setItem('survey_device_id_confirmed', 'true');
                    return false; // Empêcher le vote
                }
                
                console.error('Erreur enregistrement:', error);
                return false;
            }
            
            console.log('✅ Participation enregistrée avec succès:', data);
            
            // Marquer localement seulement APRÈS succès en base
            localStorage.setItem('surveyCompleted', 'true');
            localStorage.setItem('survey_device_id_confirmed', 'true');
            
            return true;
            
        } catch (error) {
            console.error('Erreur recordParticipation:', error);
            return false;
        }
    }
    
    // Fonction pour charger les données du sondage depuis Supabase
    async function loadSurveyData() {
        try {
            console.log("Début du chargement des données du sondage...");
            
            // Récupérer toutes les réponses de la table survey_responses
            const { data, error } = await supabaseClient
                .from('survey_responses')
                .select('*');
                
            if (error) {
                console.error('Erreur chargement des données du sondage:', error);
                return false;
            }
            
            console.log("Données récupérées:", data);
            
            // Réinitialiser les données du sondage
            surveyData = {
                preference: {},
                nouvelle_fonctionnalite: {},
                frequence: {}
            };
            
            // Organiser les données par question et réponse
            if (data && data.length > 0) {
                data.forEach(item => {
                    const { question, answer, count } = item;
                    
                    if (!surveyData[question]) {
                        surveyData[question] = {};
                    }
                    
                    surveyData[question][answer] = count;
                });
            }
            
            console.log("Données organisées:", surveyData);
            return true;
        } catch (error) {
            console.error('Erreur loadSurveyData:', error);
            return false;
        }
    }
    
    // Fonction pour mettre à jour une réponse dans Supabase
    async function updateSurveyResponse(question, answer) {
        try {
            console.log(`Mise à jour de la réponse: ${question} - ${answer}`);
            
            // Vérifier si cette réponse existe déjà 
            const { data, error: selectError } = await supabaseClient
                .from('survey_responses')
                .select('*')
                .eq('question', question)
                .eq('answer', answer)
                .maybeSingle();
                
            if (selectError) {
                console.error('Erreur vérification réponse existante:', selectError);
                return false;
            }
            
            console.log("Résultat de la recherche:", data);
            
            if (data) {
                // La réponse existe, incrémenter le compteur
                console.log(`Réponse existante trouvée avec ID: ${data.id}, compteur actuel: ${data.count}`);
                const { error: updateError } = await supabaseClient
                    .from('survey_responses')
                    .update({ 
                        count: data.count + 1,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', data.id);
                    
                if (updateError) {
                    console.error('Erreur mise à jour réponse:', updateError);
                    return false;
                }
            } else {
                // La réponse n'existe pas encore, l'insérer
                console.log("Insertion d'une nouvelle réponse");
                const { error: insertError } = await supabaseClient
                    .from('survey_responses')
                    .insert({
                        question: question,
                        answer: answer,
                        count: 1
                    });
                    
                if (insertError) {
                    console.error('Erreur insertion réponse:', insertError);
                    return false;
                }
            }
            
            console.log(`Réponse ${question}:${answer} mise à jour avec succès`);
            return true;
        } catch (error) {
            console.error('Erreur updateSurveyResponse:', error);
            return false;
        }
    }
	
	// Fonction pour ouvrir le modal du sondage (MODIFIÉE avec badge)
    async function openSurveyModal() {
        console.log("Ouverture du modal de sondage...");
        
        // 🆕 NOUVEAU : Marquer le sondage comme vu dès l'ouverture
        markSurveyAsSeen();
        
        // Forcer le message de remerciement à être caché au début
        if (thankYouMessage) {
            thankYouMessage.style.display = 'none';
            thankYouMessage.classList.remove('visible');
        }
        
        // Vérifier si l'utilisateur a déjà participé
        const alreadyParticipated = await hasAlreadyParticipated();
        
        // Charger les données du sondage
        const loaded = await loadSurveyData();
        if (!loaded) {
            console.warn("Impossible de charger les données du sondage");
        }
        
        // Afficher le modal
        surveyModal.classList.add('show');
        
        // Si l'utilisateur a déjà répondu, montrer les résultats directement
        if (alreadyParticipated) {
            console.log("Utilisateur a déjà participé, affichage des résultats");
            if (surveyQuestions) surveyQuestions.style.display = 'none';
            
            // Utiliser setTimeout pour être sûr que le message est bien masqué d'abord
            setTimeout(() => {
                showResults(); // Cette fonction affichera le message de remerciement
            }, 50);
        } else {
            // Réinitialiser l'affichage pour un nouveau participant
            if (surveyQuestions) surveyQuestions.style.display = 'block';
            
            // Réinitialiser les sélections
            document.querySelectorAll('.survey-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            // Vider les réponses sélectionnées
            Object.keys(selectedAnswers).forEach(key => {
                delete selectedAnswers[key];
            });
        }
    }

    // CETTE LIGNE EXISTE DÉJÀ - GARDER
    window.openSurveyModal = openSurveyModal;
    
    // Fonction pour fermer le modal du sondage
    function closeSurveyModal() {
        surveyModal.classList.remove('show');
    }
    
    // Gestion des clics sur les options
    document.querySelectorAll('.survey-option').forEach(option => {
        option.addEventListener('click', function() {
            const question = this.closest('.survey-question').dataset.question;
            const value = this.dataset.value;
            
            // Désélectionner les autres options dans la même question
            this.closest('.survey-options').querySelectorAll('.survey-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Sélectionner cette option
            this.classList.add('selected');
            
            // Stocker la réponse
            selectedAnswers[question] = value;
        });
    });
	
	// Fonction pour afficher les résultats
    function showResults() {
        // Assurer que la section des questions est cachée
        if (surveyQuestions) {
            surveyQuestions.style.display = 'none';
        }
        
        // Assurer que le message de remerciement est visible
        if (thankYouMessage) {
            thankYouMessage.style.display = 'block';
            
            // Ajouter la classe visible pour contrer le !important dans le CSS
            thankYouMessage.classList.add('visible');
        }
        
        // Vider le contenu des résultats actuels avant de les recréer
        if (surveyResults) {
            surveyResults.innerHTML = '';
        }
        
        // Vérifier s'il y a des données à afficher
        let hasAnyData = false;
        
        Object.keys(surveyData).forEach(question => {
            const questionData = surveyData[question];
            
            // Vérifier s'il y a des données pour cette question
            if (Object.keys(questionData).length === 0) {
                return; // Passer à la question suivante s'il n'y a pas de données
            }
            
            const total = Object.values(questionData).reduce((acc, val) => acc + val, 0);
            
            // S'il n'y a pas de réponses, passer
            if (total === 0) return;
            
            hasAnyData = true;
            
            // Label pour la question
            const questionLabel = {
                'preference': 'Rubriques préférées',
                'nouvelle_fonctionnalite': 'Fonctionnalités souhaitées',
                'frequence': 'Fréquence de visite'
            }[question] || question;
            
            const resultHeader = document.createElement('h5');
            resultHeader.textContent = questionLabel;
            surveyResults.appendChild(resultHeader);
            
            // Labels pour les valeurs - SONDAGE 2025
            const valueLabels = {
                // Question 1: Utilisation actuelle
                'actualites': 'Actualités locales',
                'radio': 'Widget radio/musique',
                'chat': 'Chat communautaire',
                'depenses': 'Gestionnaire de dépenses',
                'minuteur': 'Minuteur/alarmes',
                'meteo': 'Météo locale',
                
                // Question 2: Satisfaction
                'tres_utile': 'Très utile au quotidien',
                'utile_occasionnel': 'Utile occasionnellement',
                'plutot_pratique': 'Plutôt pratique',
                'peu_interet': 'Peu d\'intérêt',
                'decouvre': 'Je découvre le site',
                
                // Question 3: Évolution souhaitée
                'exclusives': 'Plus d\'actualités exclusives',
                'agenda': 'Agenda événements local',
                'petites_annonces': 'Petites annonces gratuites',
                'forum': 'Forum/tribune citoyenne',
                'app_mobile': 'Application mobile dédiée',
                'partenariats': 'Partenariats commerces locaux'
            };
            
            // Créer les barres de résultats
            Object.entries(questionData).forEach(([value, count]) => {
                const percentage = Math.round((count / total) * 100);
                
                const resultBar = document.createElement('div');
                resultBar.className = 'result-bar';
                
                const resultFill = document.createElement('div');
                resultFill.className = 'result-fill';
                
                const resultText = document.createElement('div');
                resultText.className = 'result-text';
                resultText.innerHTML = `<span>${valueLabels[value] || value}</span> <span>${percentage}%</span>`;
                
                resultBar.appendChild(resultFill);
                resultBar.appendChild(resultText);
                surveyResults.appendChild(resultBar);
                
                // Animation de la barre
                setTimeout(() => {
                    resultFill.style.width = `${percentage}%`;
                }, 100);
            });
        });
        
        // Si aucune donnée n'est disponible
        if (!hasAnyData) {
            const noDataMsg = document.createElement('p');
            noDataMsg.textContent = "Aucune donnée n'est encore disponible. Vous êtes parmi les premiers à participer!";
            noDataMsg.style.textAlign = 'center';
            noDataMsg.style.marginTop = '20px';
            surveyResults.appendChild(noDataMsg);
        }
    }
    
    // Fonction pour la soumission du sondage (correction)
    surveySubmit.addEventListener('click', async function() {
        // VÉRIFICATION FINALE avant traitement
        const alreadyParticipated = await hasAlreadyParticipated();
        if (alreadyParticipated) {
            console.log('⛔ Tentative de double vote bloquée');
            alert('Vous avez déjà participé à ce sondage.');
            
            // Forcer l'affichage des résultats
            if (surveyQuestions) surveyQuestions.style.display = 'none';
            setTimeout(() => {
                showResults();
            }, 50);
            return;
        }
        
        const questions = document.querySelectorAll('.survey-question');
        let allAnswered = true;
        
        // Vérifier si toutes les questions ont une réponse
        questions.forEach(question => {
            const questionId = question.dataset.question;
            if (!selectedAnswers[questionId]) {
                allAnswered = false;
                question.style.border = '2px solid rgba(255, 69, 69, 0.7)';
                setTimeout(() => {
                    question.style.border = 'none';
                }, 2000);
            }
        });
        
        if (!allAnswered) {
            alert('Merci de répondre à toutes les questions.');
            return;
        }
        
        // Désactiver le bouton pendant l'envoi
        surveySubmit.disabled = true;
        surveySubmit.textContent = 'Envoi en cours...';
        
        // Enregistrer la participation
        const participationRecorded = await recordParticipation();
        if (!participationRecorded) {
            console.warn("Erreur lors de l'enregistrement de la participation");
        }
        
        // Enregistrer les réponses dans Supabase
        let allSuccess = true;
        let successCount = 0;
        
        for (const [question, answer] of Object.entries(selectedAnswers)) {
            console.log(`Traitement de la réponse: ${question}=${answer}`);
            const success = await updateSurveyResponse(question, answer);
            if (success) {
                successCount++;
                
                // Mettre à jour les données locales pour l'affichage
                if (!surveyData[question]) {
                    surveyData[question] = {};
                }
                
                if (!surveyData[question][answer]) {
                    surveyData[question][answer] = 0;
                }
                
                surveyData[question][answer] += 1;
            } else {
                allSuccess = false;
            }
        }
        
        // Réactiver le bouton (au cas où il y a une erreur)
        surveySubmit.disabled = false;
        surveySubmit.textContent = 'Envoyer mes réponses';
        
        // Marquer comme complété
        localStorage.setItem('surveyCompleted', 'true');
        
        // IMPORTANT: Cacher la section des questions
        if (surveyQuestions) surveyQuestions.style.display = 'none';
        
        // Utiliser setTimeout pour s'assurer que le message de remerciement est bien caché avant
        setTimeout(() => {
            showResults(); // Cette fonction affichera le message de remerciement
        }, 50);
        
        // Message selon succès
        if (successCount === 0) {
            console.error('Aucune réponse n\'a pu être enregistrée');
        } else if (!allSuccess) {
            console.warn('Certaines réponses n\'ont pas pu être enregistrées');
        } else {
            console.log('Toutes les réponses ont été enregistrées avec succès');
        }
    });
	
	// Attacher les événements aux boutons
    if (surveyBtn) {
        surveyBtn.addEventListener('click', openSurveyModal);
    }
    
    if (closeSurvey) {
        closeSurvey.addEventListener('click', closeSurveyModal);
    }
    
    if (closeSurveyAfterSubmit) {
        closeSurveyAfterSubmit.addEventListener('click', closeSurveyModal);
    }
    
    // Fermer le modal en cliquant à l'extérieur
    surveyModal.addEventListener('click', function(e) {
        if (e.target === surveyModal) {
            closeSurveyModal();
        }
    });
    
    // Vérifier si l'utilisateur a déjà participé pour adapter l'UI
    hasAlreadyParticipated().then(hasParticipated => {
        if (hasParticipated && surveyBtn) {
            // Modifier l'apparence du bouton pour indiquer que l'utilisateur a déjà participé
            const surveyIcon = surveyBtn.querySelector('.material-icons');
            if (surveyIcon) {
                surveyIcon.style.animation = 'none';
                surveyIcon.style.color = 'white';
            }
            
            // Supprimer l'indicateur visuel (point rouge) si présent
            const style = document.createElement('style');
            style.textContent = `
                .survey-btn::after {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
        }
    });

    // Écouteur pour l'événement personnalisé depuis la tuile
    document.addEventListener('openSurvey', function() {
        console.log('Événement openSurvey déclenché depuis la tuile');
        openSurveyModal();
    });
    
    // ========================================
    // INITIALISATION DU SYSTÈME DE BADGE "NOUVEAU"
    // ========================================
    
    // Attendre que tout soit chargé puis vérifier s'il y a un nouveau sondage
    setTimeout(() => {
        console.log('🔍 Vérification des nouveaux sondages...');
        checkForNewSurvey();
    }, 1000);
    
    // Exposer les fonctions utiles pour les tests dans la console
    window.activateNewSurvey = activateNewSurvey;
    window.resetSurveySystem = resetSurveySystem;
    window.checkForNewSurvey = checkForNewSurvey;
    
    console.log('📊 Survey Manager initialisé avec système de badge "Nouveau"');
    console.log('💡 Fonctions de test disponibles : window.activateNewSurvey(), window.resetSurveySystem()');
    
});