// ============================================
// VISITOR TRACKER - Version améliorée
// ============================================

class VisitorTracker {
    constructor() {
        this.supabase = null;
        this.deviceId = null;
        this.heartbeatInterval = null;
        this.displayInterval = null;
        this.channel = null;
        this.chartInstance = null;
        this.currentView = '24h'; // '24h' ou '7d'
        
        this.init();
    }

    async init() {
        this.supabase = window.getSupabaseClient();
        if (!this.supabase) {
            console.error("Supabase non initialisé");
            return;
        }

        this.deviceId = this.getOrCreateDeviceId();
        
        // Démarrage
        await this.recordVisit();
        this.startHeartbeat();
        this.startDisplayUpdates();
        this.setupRealtimeListener();
        this.attachClickEvent();
        
        // Nettoyage périodique
        setTimeout(() => this.cleanOldData(), 5000);
        
        // Cleanup à la fermeture
        window.addEventListener('beforeunload', () => this.cleanup());
        
        console.log('✅ Visitor Tracker initialisé');
    }

    getOrCreateDeviceId() {
        let id = localStorage.getItem('visitor_device_id');
        if (!id) {
            id = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('visitor_device_id', id);
        }
        return id;
    }

    // ============================================
    // GESTION DES DONNÉES
    // ============================================

    async getActiveVisitors() {
        try {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            
            const { data, error } = await this.supabase
                .from('visitor_history')
                .select('device_id')
                .gte('created_at', fiveMinutesAgo);

            if (error) throw error;
            
            return new Set(data.map(v => v.device_id)).size;
        } catch (err) {
            console.error('Erreur getActiveVisitors:', err);
            return 0;
        }
    }

    async getVisitors24h() {
    try {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        
        const { data, error } = await this.supabase
            .from('visitor_history')
            .select('device_id, created_at')
            .gte('created_at', twentyFourHoursAgo);

        if (error) throw error;
        
        // Compter les visiteurs uniques
        const uniqueDevices = new Set(data.map(v => v.device_id));
        
        return {
            unique: uniqueDevices.size,
            total: data.length,
            data: data
        };
    } catch (err) {
        console.error('Erreur getVisitors24h:', err);
        return { unique: 0, total: 0, data: [] };
    }
}

    async getVisitors7d() {
    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        
        const { data, error } = await this.supabase
            .from('visitor_history')
            .select('device_id, created_at')
            .gte('created_at', sevenDaysAgo);

        if (error) throw error;
        
        // Compter les visiteurs uniques
        const uniqueDevices = new Set(data.map(v => v.device_id));
        
        return {
            unique: uniqueDevices.size,
            total: data.length,
            data: data
        };
    } catch (err) {
        console.error('Erreur getVisitors7d:', err);
        return { unique: 0, total: 0, data: [] };
    }
}

    async recordVisit() {
        try {
            const { error } = await this.supabase
                .from('visitor_history')
                .insert([{
                    device_id: this.deviceId,
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;
            
            console.log('💚 Heartbeat envoyé');
            await this.updateDisplay();
        } catch (err) {
            console.error('Erreur recordVisit:', err);
        }
    }

    async cleanOldData() {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        try {
            const { error } = await this.supabase
                .from('visitor_history')
                .delete()
                .lt('created_at', twentyFourHoursAgo);

            if (!error) console.log('🧹 Données nettoyées');
        } catch (err) {
            console.error('Erreur nettoyage:', err);
        }
    }

    // ============================================
    // AFFICHAGE
    // ============================================

    async updateDisplay() {
        const count = await this.getActiveVisitors();
        const element = document.getElementById('visitorsCount');
        
        if (element) {
            element.textContent = count === 0 ? '--' : count;
        }
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.recordVisit();
        }, 30000); // 30 secondes
    }

    startDisplayUpdates() {
        this.displayInterval = setInterval(() => {
            this.updateDisplay();
        }, 10000); // 10 secondes
    }

    setupRealtimeListener() {
        this.channel = this.supabase
            .channel('visitor_updates')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'visitor_history'
            }, () => {
                console.log('🔴 Nouvelle activité détectée');
                this.updateDisplay();
            })
            .subscribe();
    }

    // ============================================
    // POPUP STATISTIQUES
    // ============================================

    attachClickEvent() {
        const element = document.getElementById('visitorsCounter');
        
        if (!element) {
            setTimeout(() => this.attachClickEvent(), 500);
            return;
        }
        
        element.style.cursor = 'pointer';
        element.addEventListener('click', (e) => this.handleClick(e), true);
    }

    async handleClick(event) {
        // Vérification admin
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        const chatPseudo = localStorage.getItem('chatPseudo');
        
        if (!isAdmin || chatPseudo !== 'Admin_ActuMedia') {
            console.log('❌ Accès réservé aux admins');
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        await this.showStatsModal();
    }

    async showStatsModal() {
        // Récupérer toutes les données
        const [active, stats24h, stats7d] = await Promise.all([
            this.getActiveVisitors(),
            this.getVisitors24h(),
            this.getVisitors7d()
        ]);

        // Calculer les statistiques
const avgPerHour = Math.round(stats24h.total / 24); // Visites par heure (pas uniques)
const activityRate = stats24h.unique > 0 ? Math.round((active / stats24h.unique) * 100) : 0;
const avgPerDay = Math.round(stats7d.total / 7); // Visites par jour (pas uniques)

// Vérifier la cohérence des données
console.log('📊 Stats debug:', {
    'Actifs maintenant': active,
    'Uniques 24h': stats24h.unique,
    'Total visites 24h': stats24h.total,
    'Uniques 7j': stats7d.unique,
    'Total visites 7j': stats7d.total,
    'Moyenne/heure': avgPerHour,
    'Moyenne/jour': avgPerDay
});
        
        // Créer la modal
        const modal = this.createModal();
        const box = this.createModalBox(active, stats24h, stats7d, avgPerHour, activityRate, avgPerDay);
        
        modal.appendChild(box);
        document.body.appendChild(modal);
        
        // Bloquer le scroll
        document.body.style.overflow = 'hidden';
        
        // Animation
        requestAnimationFrame(() => modal.classList.add('visible'));
        
        // Event listeners
        this.setupModalEvents(modal);
        
        // Créer le graphique
        setTimeout(() => {
            this.createChart(this.currentView === '24h' ? stats24h.data : stats7d.data);
        }, 100);
    }

    createModal() {
        const modal = document.createElement('div');
        modal.className = 'visitors-popup-overlay';
        return modal;
    }

    createModalBox(active, stats24h, stats7d, avgPerHour, activityRate, avgPerDay) {
        const box = document.createElement('div');
        box.className = 'visitors-popup-box';
        
        box.innerHTML = `
            <div class="visitors-popup-header">
                <div class="visitors-popup-title">
                    <span class="material-icons">analytics</span>
                    <span>Statistiques visiteurs</span>
                </div>
                <button class="visitors-popup-close">×</button>
            </div>

            <div class="visitors-popup-content">
                <!-- Stats principales -->
                <div class="visitors-stats-grid">
                    <div class="visitors-stat-card active">
                        <div class="visitors-stat-value">
                            <span class="visitors-stat-icon">🟢</span>${active}
                        </div>
                        <div class="visitors-stat-label">En ligne</div>
                        <div class="visitors-stat-trend up">
                            <span class="material-icons">trending_up</span>
                            Temps réel
                        </div>
                    </div>

                    <div class="visitors-stat-card">
                        <div class="visitors-stat-value">${stats24h.unique}</div>
                        <div class="visitors-stat-label">Visiteurs 24h</div>
                        <div class="visitors-stat-trend">
                            ${stats24h.total} visites
                        </div>
                    </div>

                    <div class="visitors-stat-card">
    <div class="visitors-stat-value">${stats7d.total}</div>
    <div class="visitors-stat-label">Visites 7j</div>
    <div class="visitors-stat-trend">
        ${stats7d.unique} uniques
    </div>
</div>

                    <div class="visitors-stat-card">
                        <div class="visitors-stat-value">${activityRate}%</div>
                        <div class="visitors-stat-label">Taux d'activité</div>
                        <div class="visitors-stat-trend ${activityRate > 10 ? 'up' : ''}">
                            <span class="material-icons">${activityRate > 10 ? 'trending_up' : 'remove'}</span>
                            Actifs/Total
                        </div>
                    </div>
                </div>

                <!-- Graphique -->
                <div class="visitors-chart-container">
                    <div class="visitors-chart-header">
                        <div class="visitors-chart-title">Évolution des visites</div>
                        <div class="visitors-chart-tabs">
                            <button class="visitors-chart-tab active" data-view="24h">24h</button>
                            <button class="visitors-chart-tab" data-view="7d">7 jours</button>
                        </div>
                    </div>
                    <canvas id="visitorsChart" height="200"></canvas>
                </div>

                <!-- Stats additionnelles -->
                <div class="visitors-additional-stats">
                    <div class="visitors-stat-item">
                        <div class="visitors-stat-item-icon">
                            <span class="material-icons">schedule</span>
                        </div>
                        <div class="visitors-stat-item-content">
    <div class="visitors-stat-item-label">Visites/jour</div>
    <div class="visitors-stat-item-value">${avgPerDay}</div>
</div>
                    </div>

                    <div class="visitors-stat-item">
                        <div class="visitors-stat-item-icon">
                            <span class="material-icons">today</span>
                        </div>
                        <div class="visitors-stat-item-content">
                            <div class="visitors-stat-item-label">Moyenne/jour</div>
                            <div class="visitors-stat-item-value">${avgPerDay}</div>
                        </div>
                    </div>
                </div>

                <!-- Badge temps réel -->
                <div style="text-align: center; margin-top: 16px;">
                    <div class="visitors-realtime-badge">
                        <div class="visitors-realtime-dot"></div>
                        Mise à jour en temps réel
                    </div>
                </div>
            </div>
        `;
        
        return box;
    }

    setupModalEvents(modal) {
        const closeBtn = modal.querySelector('.visitors-popup-close');
        const tabs = modal.querySelectorAll('.visitors-chart-tab');
        
        const closeModal = () => {
            modal.classList.remove('visible');
            document.body.style.overflow = '';
            setTimeout(() => modal.remove(), 300);
            if (this.chartInstance) {
                this.chartInstance.destroy();
                this.chartInstance = null;
            }
        };
        
        closeBtn.onclick = closeModal;
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };
        
        tabs.forEach(tab => {
            tab.onclick = async () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                this.currentView = tab.dataset.view;
                
                const data = this.currentView === '24h' 
                    ? (await this.getVisitors24h()).data
                    : (await this.getVisitors7d()).data;
                
                this.updateChart(data);
            };
        });
    }

    async createChart(data) {
        const canvas = document.getElementById('visitorsChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const { labels, dataPoints } = this.prepareChartData(data);
        
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
        
        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Visiteurs',
                    data: dataPoints,
                    fill: true,
                    borderColor: '#007BFF',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4,
                    pointRadius: window.innerWidth > 480 ? 4 : 2,
                    pointBackgroundColor: '#007BFF',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    borderWidth: 3,
                    pointHoverRadius: 7,
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
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        cornerRadius: 8,
                        padding: 12,
                        displayColors: false,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        callbacks: {
                            title: (context) => {
                                return this.currentView === '24h' 
                                    ? `Heure : ${context[0].label}`
                                    : `Jour : ${context[0].label}`;
                            },
                            label: (context) => {
                                return `Visiteurs : ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: {
                            color: '#666',
                            font: { size: window.innerWidth > 480 ? 11 : 9 },
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: window.innerWidth > 480 ? 12 : 6
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            stepSize: 1,
                            precision: 0,
                            color: '#666',
                            font: { size: 11 },
                            padding: 8
                        }
                    }
                }
            }
        });
    }

    updateChart(data) {
        if (!this.chartInstance) return;
        
        const { labels, dataPoints } = this.prepareChartData(data);
        
        this.chartInstance.data.labels = labels;
        this.chartInstance.data.datasets[0].data = dataPoints;
        this.chartInstance.update();
    }

    prepareChartData(data) {
        if (this.currentView === '24h') {
            return this.prepare24hData(data);
        } else {
            return this.prepare7dData(data);
        }
    }

    prepare24hData(data) {
        const hours = [];
        const hourMap = {};
        
        for (let i = 0; i < 24; i++) {
            const d = new Date(Date.now() - (23 - i) * 60 * 60 * 1000);
            const hour = d.getHours().toString().padStart(2, '0') + 'h';
            hours.push(hour);
            hourMap[hour] = new Set();
        }
        
        data.forEach(v => {
            const d = new Date(v.created_at);
            const hour = d.getHours().toString().padStart(2, '0') + 'h';
            if (hourMap[hour]) {
                hourMap[hour].add(v.device_id);
            }
        });
        
        return {
            labels: hours,
            dataPoints: hours.map(h => hourMap[h].size)
        };
    }

    prepare7dData(data) {
        const days = [];
        const dayMap = {};
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const day = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
            const key = d.toDateString();
            days.push(day);
            dayMap[key] = new Set();
        }
        
        data.forEach(v => {
            const key = new Date(v.created_at).toDateString();
            if (dayMap[key]) {
                dayMap[key].add(v.device_id);
            }
        });
        
        return {
            labels: days,
            dataPoints: Object.values(dayMap).map(set => set.size)
        };
    }

    // ============================================
    // CLEANUP
    // ============================================

    cleanup() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        if (this.displayInterval) clearInterval(this.displayInterval);
        if (this.channel) this.supabase.removeChannel(this.channel);
        if (this.chartInstance) this.chartInstance.destroy();
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.visitorTracker = new VisitorTracker();
});