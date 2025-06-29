// visitor-tracker-active.js - Compteur visiteurs ACTIFS en temps réel
document.addEventListener('DOMContentLoaded', async () => {
    const supabase = window.getSupabaseClient();
    if (!supabase) {
        console.error("Supabase client n'est pas initialisé.");
        return;
    }

    // Générer ou récupérer un ID unique pour ce visiteur
    let deviceId = localStorage.getItem('visitor_device_id');
    if (!deviceId) {
        deviceId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('visitor_device_id', deviceId);
    }

    // Fonction pour compter les visiteurs ACTIFS (5 dernières minutes)
    const getActiveVisitors = async () => {
        try {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            
            const { data: visitors, error } = await supabase
                .from('visitor_history')
                .select('device_id')
                .gte('created_at', fiveMinutesAgo);

            if (error) {
                console.error('Erreur lors de la récupération des visiteurs actifs:', error);
                return 0;
            }

            // Compter les visiteurs uniques actifs
            const uniqueDevices = new Set(visitors.map(v => v.device_id));
            return uniqueDevices.size;
        } catch (err) {
            console.error('Erreur:', err);
            return 0;
        }
    };

    // Fonction pour compter les visiteurs sur 24h (pour la popup)
    const getUniqueVisitors24h = async () => {
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            
            const { data: visitors, error } = await supabase
                .from('visitor_history')
                .select('device_id')
                .gte('created_at', twentyFourHoursAgo);

            if (error) {
                console.error('Erreur lors de la récupération des visiteurs 24h:', error);
                return 0;
            }

            const uniqueDevices = new Set(visitors.map(v => v.device_id));
            return uniqueDevices.size;
        } catch (err) {
            console.error('Erreur:', err);
            return 0;
        }
    };

    // Fonction pour mettre à jour l'affichage du compteur (visiteurs actifs)
    const updateVisitorDisplay = async () => {
        const count = await getActiveVisitors();
        const visitorsCountElement = document.getElementById('visitorsCount');
        
        if (visitorsCountElement) {
            if (count === 0) {
                visitorsCountElement.textContent = '--';
            } else {
                visitorsCountElement.textContent = count;
            }
            
            console.log(`🔄 Visiteurs actifs: ${count} (dernières 5 minutes)`);
        }
    };

    // Fonction pour enregistrer une visite (heartbeat)
    const recordVisit = async () => {
        try {
            const { data, error } = await supabase
                .from('visitor_history')
                .insert([
                    {
                        device_id: deviceId,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) {
                console.error('Erreur lors de l\'enregistrement de la visite:', error);
            } else {
                console.log('💓 Heartbeat envoyé');
                // Mettre à jour immédiatement après enregistrement
                await updateVisitorDisplay();
            }
        } catch (err) {
            console.error('Erreur:', err);
        }
    };

    // Enregistrer la visite immédiatement
    await recordVisit();

    // 🚀 HEARTBEAT : Envoyer un signal toutes les 30 secondes pour rester "actif"
    const heartbeatInterval = setInterval(async () => {
        await recordVisit();
    }, 30000); // 30 secondes

    // Mettre à jour l'affichage toutes les 10 secondes
    setInterval(updateVisitorDisplay, 10000);

    // 🚀 TEMPS RÉEL : Écouter les nouvelles insertions
    const channel = supabase
        .channel('visitor_updates')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'visitor_history'
            },
            (payload) => {
                console.log('🔴 Activité détectée !', payload);
                // Mettre à jour immédiatement
                updateVisitorDisplay();
            }
        )
        .subscribe();

    console.log('🎯 Compteur visiteurs ACTIFS en temps réel activé');

    // Nettoyer les anciennes données au démarrage (garder seulement 24h)
    const cleanOldData = async () => {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        try {
            const { error } = await supabase
                .from('visitor_history')
                .delete()
                .lt('created_at', twentyFourHoursAgo);

            if (error) {
                console.error('Erreur lors du nettoyage:', error);
            } else {
                console.log('🧹 Anciennes données nettoyées');
            }
        } catch (err) {
            console.error('Erreur nettoyage:', err);
        }
    };

    // Nettoyer au démarrage
    setTimeout(cleanOldData, 5000);

    // Fonction pour la popup (affiche les stats 24h)
    function attachVisitorClickEvent() {
        const visitorsElement = document.getElementById('visitorsCounter');
        
        if (!visitorsElement) {
            console.log('⏳ visitorsCounter pas encore trouvé, nouvelle tentative dans 500ms...');
            setTimeout(attachVisitorClickEvent, 500);
            return;
        }
        
        console.log('✅ visitorsCounter trouvé ! Ajout de l\'événement click');
        
        visitorsElement.style.cursor = 'pointer'; // S'assurer que le curseur montre que c'est cliquable
        
        visitorsElement.addEventListener('click', async function (event) {
    // ✅ VÉRIFICATION ADMIN
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const chatPseudo = localStorage.getItem('chatPseudo');
    
    if (!isAdmin || chatPseudo !== 'Admin_ActuMedia') {
        console.log('👥 Statistiques détaillées réservées aux administrateurs');
        return; // Bloquer l'accès si pas admin
    }
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation(); // Arrêt complet de la propagation
            
            console.log('🎯 Clic sur le compteur de visiteurs détecté !');
            
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

            // Récupérer les données 24h pour le graphique
            let { data: visitors24h, error } = await supabase
                .from('visitor_history')
                .select('created_at, device_id')
                .gte('created_at', twentyFourHoursAgo)
                .order('created_at', { ascending: true });

            // Récupérer les visiteurs actifs (5 min)
            let { data: visitorsActive } = await supabase
                .from('visitor_history')
                .select('device_id')
                .gte('created_at', fiveMinutesAgo);

            if (error) {
                alert("Erreur lors de la récupération de l'historique des visiteurs.");
                console.error(error);
                return;
            }

            // Préparation des données pour le graphique (par heure)
            let hours = [];
            let hourMap = {};
            
            for (let i = 0; i < 24; i++) {
                let d = new Date(Date.now() - (23 - i) * 60 * 60 * 1000);
                let hour = d.getHours().toString().padStart(2, '0') + 'h';
                hours.push(hour);
                hourMap[hour] = new Set();
            }

            // Grouper les visiteurs par heure
            visitors24h.forEach(v => {
                let d = new Date(v.created_at);
                let hour = d.getHours().toString().padStart(2, '0') + 'h';
                if (hourMap[hour]) {
                    hourMap[hour].add(v.device_id);
                }
            });

            let dataPoints = hours.map(hour => hourMap[hour] ? hourMap[hour].size : 0);

            // Calculs
            const visiteurs24h = new Set(visitors24h.map(v => v.device_id)).size;
            const visiteursActifs = new Set(visitorsActive.map(v => v.device_id)).size;
            const maxVisiteurs = Math.max(...dataPoints);
            const totalVisites = visitors24h.length;

            // Création de la popup améliorée
            const modal = document.createElement('div');
            modal.className = 'visitors-popup-overlay';
            
            const box = document.createElement('div');
            box.className = 'visitors-popup-box';

            // Contenu HTML amélioré
            box.innerHTML = `
                <div class="visitors-popup-header">
                    <div class="visitors-popup-title">
                        <span class="material-icons">analytics</span>
                        <span>Statistiques visiteurs</span>
                    </div>
                    <button class="visitors-popup-close">×</button>
                </div>

                <!-- Cartes de stats principales -->
                <div class="visitors-stats-grid">
                    <div class="visitors-stat-card active">
                        <div class="visitors-stat-value">
                            <span class="visitors-stat-icon">🟢</span>${visiteursActifs}
                        </div>
                        <div class="visitors-stat-label">Actifs maintenant</div>
                    </div>
                    <div class="visitors-stat-card">
                        <div class="visitors-stat-value">${visiteurs24h}</div>
                        <div class="visitors-stat-label">Visiteurs 24h</div>
                    </div>
                    <div class="visitors-stat-card">
                        <div class="visitors-stat-value">${maxVisiteurs}</div>
                        <div class="visitors-stat-label">Pic horaire</div>
                    </div>
                    <div class="visitors-stat-card">
                        <div class="visitors-stat-value">${totalVisites}</div>
                        <div class="visitors-stat-label">Visites totales</div>
                    </div>
                </div>

                <!-- Zone du graphique -->
                <div class="visitors-chart-container">
                    <div class="visitors-chart-header">
                        <div class="visitors-chart-title">Évolution sur 24 heures</div>
                        <div class="visitors-chart-legend">
                            <div class="visitors-chart-legend-item">
                                <div class="visitors-chart-legend-dot"></div>
                                <span>Visiteurs/h</span>
                            </div>
                        </div>
                    </div>
                    <canvas id="visitorsChart" height="200"></canvas>
                    <div class="visitors-chart-info" id="chartInfo">
                        <div class="visitors-chart-info-title">💡 Astuce mobile</div>
                        Glissez sur le graphique pour voir les détails
                    </div>
                </div>

                <!-- Résumé détaillé -->
                <div class="visitors-popup-summary">
                    <div class="visitors-summary-row">
                        <span class="visitors-summary-label">Moyenne par heure</span>
                        <span class="visitors-summary-value">${Math.round(visiteurs24h / 24)}</span>
                    </div>
                    <div class="visitors-summary-row">
                        <span class="visitors-summary-label">Taux d'activité</span>
                        <span class="visitors-summary-value">${Math.round((visiteursActifs / visiteurs24h) * 100)}%</span>
                    </div>
                    <div style="text-align: center;">
                        <div class="visitors-realtime-badge">
                            <div class="visitors-realtime-dot"></div>
                            Temps réel
                        </div>
                    </div>
                </div>
            `;

            // Assemblage
            modal.appendChild(box);
            document.body.appendChild(modal);
            
            // Animation d'apparition
            requestAnimationFrame(() => {
                modal.classList.add('visible');
            });

            // Logique de fermeture
            const closeBtn = box.querySelector('.visitors-popup-close');
            const closeModal = () => {
                modal.classList.remove('visible');
                modal.addEventListener('transitionend', () => modal.remove(), { once: true });
            };
            
            closeBtn.onclick = closeModal;
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });

            // Configuration du graphique améliorée pour mobile
            const canvas = box.querySelector('#visitorsChart');
            const ctx = canvas.getContext('2d');
            
            const computedStyle = getComputedStyle(box);
            const chartLineColor = computedStyle.getPropertyValue('--chart-line-color').trim();
            const chartAreaBg = computedStyle.getPropertyValue('--chart-area-bg').trim();
            const chartGridColor = computedStyle.getPropertyValue('--chart-grid-color').trim();
            const chartLabelColor = computedStyle.getPropertyValue('--popup-text').trim();

            // Afficher l'info mobile sur petits écrans
            if (window.innerWidth <= 480) {
                const chartInfo = box.querySelector('#chartInfo');
                chartInfo.classList.add('show');
                setTimeout(() => {
                    chartInfo.classList.remove('show');
                }, 3000);
            }

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: hours,
                    datasets: [{
                        label: 'Visiteurs',
                        data: dataPoints,
                        fill: true,
                        borderColor: chartLineColor || '#007BFF',
                        backgroundColor: chartAreaBg || 'rgba(0,123,255,0.1)',
                        tension: 0.4,
                        pointRadius: window.innerWidth > 480 ? 4 : 2,
                        pointBackgroundColor: chartLineColor || '#007BFF',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        borderWidth: 3,
                        pointHoverRadius: 6,
                        pointHoverBorderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    },
                    plugins: { 
                        legend: { display: false },
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(0,0,0,0.85)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            cornerRadius: 8,
                            padding: 12,
                            displayColors: false,
                            titleFont: { size: 14, weight: 'bold' },
                            bodyFont: { size: 13 },
                            callbacks: {
                                title: function(context) {
                                    return 'Heure : ' + context[0].label;
                                },
                                label: function(context) {
                                    return 'Visiteurs : ' + context.parsed.y;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { 
                                display: false,
                                drawBorder: false
                            },
                            ticks: { 
                                color: chartLabelColor || '#666',
                                font: { 
                                    size: window.innerWidth > 480 ? 11 : 10
                                },
                                maxRotation: 0,
                                autoSkip: true,
                                maxTicksLimit: window.innerWidth > 480 ? 12 : 8
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { 
                                color: chartGridColor || '#e0e0e0',
                                drawBorder: false,
                                lineWidth: 1
                            },
                            ticks: {
                                stepSize: 1,
                                precision: 0,
                                color: chartLabelColor || '#666',
                                font: { size: 11 },
                                padding: 8
                            },
                            suggestedMax: Math.max(...dataPoints, 3) + 1
                        }
                    }
                }
            });
        }, true); // Le 'true' force la capture de l'événement
    }

    // Lancer la recherche de l'élément
    attachVisitorClickEvent();

    // Nettoyer à la fermeture
    window.addEventListener('beforeunload', () => {
        clearInterval(heartbeatInterval);
        if (channel) {
            supabase.removeChannel(channel);
        }
    });
});