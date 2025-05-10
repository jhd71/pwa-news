document.addEventListener('DOMContentLoaded', function() {
    // Récupérer une instance valide du client Supabase
    let supabaseClient = null;
    
    // Méthode 1: Utiliser l'instance du chatManager
    if (window.chatManager && window.chatManager.supabase) {
        supabaseClient = window.chatManager.supabase;
        console.log("Utilisation du client Supabase du chatManager");
    } 
    // Méthode 2: Créer une nouvelle instance si nécessaire
    else {
        console.log("Création d'un nouveau client Supabase pour le sondage");
        supabaseClient = supabase.createClient(
            'https://ekjgfiyhkythqcnmhzea.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramdmaXloa3l0aHFjbm1oemVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzYxNDIsImV4cCI6MjA1ODI1MjE0Mn0.V0j_drb6GiTojgwxC6ydjnyJDRRT9lUbSc1E7bFE2Z4'
        );
    }
    
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
        preference: {},
        nouvelle_fonctionnalite: {},
        frequence: {}
    };
    
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
            // Obtenir l'ID de l'appareil
            const deviceId = getDeviceId();
            
            console.log('Vérification de participation avec ID:', deviceId);
            
            // 1. Vérifier d'abord dans localStorage (rapide)
            const hasCompletedLocally = localStorage.getItem('surveyCompleted') === 'true';
            if (hasCompletedLocally) {
                console.log('Appareil marqué comme ayant participé dans localStorage');
                return true;
            }
            
            // 2. Vérifier l'IP actuelle si chatManager est disponible
            let currentIP = '';
            if (window.chatManager && typeof window.chatManager.getClientRealIP === 'function') {
                try {
                    currentIP = await window.chatManager.getClientRealIP() || '';
                    console.log('IP obtenue pour vérification:', currentIP);
                    
                    if (currentIP) {
                        // Vérifier si cette IP a déjà participé
                        const { data: ipData, error: ipError } = await supabaseClient
                            .from('survey_participants')
                            .select('id')
                            .eq('ip_address', currentIP)
                            .maybeSingle();
                        
                        if (!ipError && ipData) {
                            console.log('IP a déjà participé au sondage:', ipData);
                            localStorage.setItem('surveyCompleted', 'true');
                            return true;
                        }
                    }
                } catch (e) {
                    console.log('Impossible d\'obtenir l\'IP via chatManager:', e);
                }
            }
            
            // 3. Vérifier dans la base de données avec l'ID de l'appareil
            const { data, error } = await supabaseClient
                .from('survey_participants')
                .select('id')
                .eq('device_id', deviceId)
                .maybeSingle();
                
            if (error) {
                console.error('Erreur vérification participation:', error);
                return hasCompletedLocally; // Fallback sur localStorage
            }
            
            // Si des données sont trouvées, l'appareil a déjà participé
            if (data) {
                console.log('Appareil a déjà participé au sondage:', data);
                // Mettre à jour localStorage aussi pour cohérence
                localStorage.setItem('surveyCompleted', 'true');
                return true;
            }
            
            // 4. Vérifier si l'user agent correspond à un participant existant
            const userAgent = navigator.userAgent;
            if (userAgent) {
                const { data: uaData, error: uaError } = await supabaseClient
                    .from('survey_participants')
                    .select('id, user_agent')
                    .ilike('user_agent', `%${userAgent.substring(0, 50)}%`) // Recherche partielle
                    .limit(1);
                    
                if (!uaError && uaData && uaData.length > 0) {
                    // Vérifier si l'user agent est très similaire (présomption d'être le même appareil)
                    const similarity = calculateSimilarity(userAgent, uaData[0].user_agent);
                    if (similarity > 0.9) { // 90% de similarité
                        console.log('User agent très similaire trouvé, probable même utilisateur:', similarity);
                        localStorage.setItem('surveyCompleted', 'true');
                        return true;
                    }
                }
            }
            
            console.log('Aucune participation antérieure détectée');
            return false;
        } catch (error) {
            console.error('Erreur hasAlreadyParticipated:', error);
            return localStorage.getItem('surveyCompleted') === 'true'; // Fallback
        }
    }

    // Fonction pour enregistrer la participation de cet appareil
    async function recordParticipation() {
        try {
            // Obtenir l'ID de l'appareil
            const deviceId = getDeviceId();
            
            // Tenter d'obtenir l'adresse IP du client
            let ipAddress = '';
            
            // Utiliser l'IP du chatManager si disponible
            if (window.chatManager && typeof window.chatManager.getClientRealIP === 'function') {
                try {
                    ipAddress = await window.chatManager.getClientRealIP() || '';
                    console.log('IP obtenue via chatManager:', ipAddress);
                } catch (e) {
                    console.log('Impossible d\'obtenir l\'IP via chatManager:', e);
                }
            }
            
            // Obtenir le user agent
            const userAgent = navigator.userAgent || '';
            
            // Obtenir des informations supplémentaires pour une meilleure identification
            const screenInfo = `${screen.width}x${screen.height}x${screen.colorDepth}`;
            const languages = navigator.languages ? navigator.languages.join(',') : navigator.language;
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            
            const additionalInfo = {
                screen: screenInfo,
                languages: languages,
                timezone: timezone
            };
            
            console.log('Enregistrement de la participation:', {
                device_id: deviceId,
                ip_address: ipAddress,
                user_agent: userAgent.substring(0, 250),
                additional_info: additionalInfo
            });
            
            // Enregistrer dans la base de données
            const { data, error } = await supabaseClient
                .from('survey_participants')
                .insert({
                    device_id: deviceId,
                    ip_address: ipAddress,
                    user_agent: userAgent.substring(0, 250),
                    additional_info: JSON.stringify(additionalInfo).substring(0, 500)
                });
                
            if (error) {
                // Si l'erreur est due à un conflit (déjà enregistré), c'est ok
                if (error.code === '23505') { // Code PostgreSQL pour violation de contrainte unique
                    console.log('Appareil déjà enregistré (contrainte unique)');
                    return true;
                }
                
                console.error('Erreur enregistrement participation:', error);
                return false;
            }
            
            console.log('Participation enregistrée avec succès');
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
    
    // Fonction pour ouvrir le modal du sondage
    async function openSurveyModal() {
        console.log("Ouverture du modal de sondage...");
        
        // Vérifier si l'utilisateur a déjà participé
        const alreadyParticipated = await hasAlreadyParticipated();
        
        // Charger les données du sondage
        const loaded = await loadSurveyData();
        if (!loaded) {
            console.warn("Impossible de charger les données du sondage");
            // Continue quand même pour permettre de participer au sondage
        }
        
        surveyModal.classList.add('show');
        
        // Si l'utilisateur a déjà répondu, montrer les résultats directement
        if (alreadyParticipated) {
            console.log("Utilisateur a déjà participé, affichage des résultats");
            surveyQuestions.style.display = 'none';
            thankYouMessage.style.display = 'block';
            showResults();
        } else {
            // Réinitialiser l'affichage pour un nouveau participant
            surveyQuestions.style.display = 'block';
            thankYouMessage.style.display = 'none';
            
            // Réinitialiser les sélections
            document.querySelectorAll('.survey-option').forEach(option => {
                option.classList.remove('selected');
            });
        }
    }
    
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
        surveyQuestions.style.display = 'none';
        thankYouMessage.style.display = 'block';
        
        // Générer les résultats
        surveyResults.innerHTML = '';
        
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
            
            // Labels pour les valeurs
            const valueLabels = {
                // Preference
                'actualites': 'Actualités locales',
                'sports': 'Sports',
                'radio': 'Radio',
                'tv': 'TV en direct',
                'meteo': 'Météo',
                
                // Nouvelles fonctionnalités
                'agenda': 'Agenda événements',
                'petites_annonces': 'Petites annonces',
                'tribune': 'Tribune libre',
                'alertes': 'Alertes locales',
                'carte': 'Carte interactive',
                
                // Fréquence
                'quotidien': 'Tous les jours',
                'hebdomadaire': 'Plusieurs fois/semaine',
                'mensuel': 'Quelques fois/mois',
                'occasionnel': 'Occasionnellement',
                'premiere': 'Première visite'
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
    
    // Soumission du sondage
    surveySubmit.addEventListener('click', async function() {
        // Vérifier si l'utilisateur a déjà participé
        const alreadyParticipated = await hasAlreadyParticipated();
        if (alreadyParticipated) {
            alert('Vous avez déjà participé à ce sondage.');
            showResults();
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
        
        // Enregistrer la participation avant de soumettre les réponses
        const participationRecorded = await recordParticipation();
        if (!participationRecorded) {
            console.warn("Erreur lors de l'enregistrement de la participation");
            // On continue quand même, puisque le localStorage servira de fallback
        }
        
        // Désactiver le bouton pendant l'envoi
        surveySubmit.disabled = true;
        surveySubmit.textContent = 'Envoi en cours...';
        
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
        
        // Marquer comme complété dans localStorage
        localStorage.setItem('surveyCompleted', 'true');
        
        // Réactiver le bouton
        surveySubmit.disabled = false;
        surveySubmit.textContent = 'Envoyer mes réponses';
        
        // Recharger les données du sondage pour s'assurer d'avoir les derniers résultats
        await loadSurveyData();
        
        // Afficher les résultats
        showResults();
        
        // Afficher un message selon le succès des opérations
        if (successCount === 0) {
            console.error('Aucune réponse n\'a pu être enregistrée');
            // Ne pas afficher d'alerte pour ne pas perturber l'utilisateur
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
});