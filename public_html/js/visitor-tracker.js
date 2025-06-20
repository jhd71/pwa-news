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
    const visitorsElement = document.getElementById('visitorsCounter');
    if (!visitorsElement) return;

    visitorsElement.addEventListener('click', async function (event) {
        event.stopPropagation();
        
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

        // Création de la popup
        const modal = document.createElement('div');
        modal.className = 'visitors-popup-overlay';
        
        const box = document.createElement('div');
        box.className = 'visitors-popup-box';

        // Entête
        const header = document.createElement('div');
        header.className = 'visitors-popup-header';

        const title = document.createElement('div');
        title.className = 'visitors-popup-title';
        title.innerHTML = `<span class="material-icons">analytics</span><span>Statistiques visiteurs</span>`;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'visitors-popup-close';
        closeBtn.innerHTML = `×`;

        header.append(title, closeBtn);

        // Zone pour le graphique
        const canvas = document.createElement('canvas');
        canvas.id = 'visitorsChart';
        canvas.style.height = '200px';
        
        // Résumé avec stats actifs + 24h
        const summary = document.createElement('div');
        summary.className = 'visitors-popup-summary';
        summary.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <div>
                    <strong style="color: #28a745; font-size: 1.2em;">🟢 ${visiteursActifs}</strong>
                    <br><small>actifs maintenant</small>
                </div>
                <div>
                    <strong style="font-size: 1.2em;">${visiteurs24h}</strong>
                    <br><small>sur 24h</small>
                </div>
            </div>
            <div style="font-size: 0.85em; opacity: 0.8; text-align: center;">
                ${visitors24h.length} visites totales • Temps réel 🔴
            </div>
        `;

        // Assemblage
        box.append(header, canvas, summary);
        modal.appendChild(box);
        document.body.appendChild(modal);
        
        // Animation d'apparition
        requestAnimationFrame(() => {
            modal.classList.add('visible');
        });

        // Logique de fermeture
        const closeModal = () => {
            modal.classList.remove('visible');
            modal.addEventListener('transitionend', () => modal.remove(), { once: true });
        };
        
        closeBtn.onclick = closeModal;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Graphique
        const computedStyle = getComputedStyle(box);
        const chartLineColor = computedStyle.getPropertyValue('--chart-line-color').trim();
        const chartAreaBg = computedStyle.getPropertyValue('--chart-area-bg').trim();
        const chartGridColor = computedStyle.getPropertyValue('--chart-grid-color').trim();
        const chartLabelColor = computedStyle.getPropertyValue('--popup-text').trim();

        new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: hours,
                datasets: [{
                    label: 'Visiteurs uniques par heure (24h)',
                    data: dataPoints,
                    fill: true,
                    borderColor: chartLineColor || '#007BFF',
                    backgroundColor: chartAreaBg || 'rgba(0,123,255,0.1)',
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: chartLineColor || '#007BFF',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        cornerRadius: 8,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { 
                            color: chartLabelColor || '#666',
                            font: { size: 11 }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { 
                            color: chartGridColor || '#e0e0e0',
                            drawBorder: false,
                        },
                        ticks: {
                            stepSize: 1,
                            precision: 0,
                            color: chartLabelColor || '#666',
                            font: { size: 11 }
                        },
                        suggestedMax: Math.max(...dataPoints, 3)
                    }
                }
            }
        });
    });

    // Nettoyer à la fermeture
    window.addEventListener('beforeunload', () => {
        clearInterval(heartbeatInterval);
        if (channel) {
            supabase.removeChannel(channel);
        }
    });
});