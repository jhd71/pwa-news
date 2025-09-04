// todoApp.js - Gestionnaire de tâches complet avec planification
// Gestion des notifications Push
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('Les notifications ne sont pas supportées');
        return false;
    }
    
    if (Notification.permission === 'granted') {
        return true;
    }
    
    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    
    return false;
}

async function subscribeToPush() {
    try {
        const registration = await navigator.serviceWorker.ready;
        
        // Votre clé publique VAPID depuis votre environnement
        const vapidPublicKey = 'BNJAn0qV6OEagpKJrvmRfR1U7Og4ql_Qg6alTcaLRuOyYvJj0uGhJHxNLQjzqfIcGiKm6h7UWBRxlPjBCpRSQqg';
        
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidPublicKey
        });
        
        // Sauvegarder l'abonnement dans Supabase
        await saveSubscription(subscription);
        
        return subscription;
    } catch (error) {
        console.error('Erreur lors de l\'abonnement aux notifications:', error);
        return null;
    }
}

async function saveSubscription(subscription) {
    try {
        const response = await fetch('/api/save-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                subscription: subscription,
                userId: localStorage.getItem('todoUserId') || 'todo_user_' + Date.now()
            })
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de l\'enregistrement');
        }
        
        console.log('✅ Abonnement aux notifications enregistré');
    } catch (error) {
        console.error('Erreur:', error);
    }
}

async function sendTaskNotification(task, notificationType = 'reminder') {
    try {
        let title, body;
        
        switch(notificationType) {
            case 'today':
                title = '📅 Tâche du jour';
                body = task.title;
                break;
            case 'overdue':
                title = '⚠️ Tâche en retard!';
                body = task.title;
                break;
            case 'reminder':
                title = '🔔 Rappel de tâche';
                body = `${task.title} - ${task.dueTime || 'Aujourd\'hui'}`;
                break;
            default:
                title = '✔ Todo List';
                body = task.title;
        }
        
        const response = await fetch('/api/send-notification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                body: body,
                userId: localStorage.getItem('todoUserId') || 'todo_user',
                icon: '/images/todo-icon.png',
                data: {
                    url: '/?action=opentodo',
                    taskId: task.id,
                    type: 'todo'
                }
            })
        });
        
        if (!response.ok) {
            throw new Error('Erreur envoi notification');
        }
        
        console.log('✅ Notification envoyée pour:', task.title);
    } catch (error) {
        console.error('Erreur envoi notification:', error);
    }
}

class TodoListWidget {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('userTasks')) || [];
        this.categories = ['Personnel', 'Travail', 'Urgent', 'Important', 'Courses', 'Projets'];
        this.currentView = 'list'; // list, board, calendar
        this.currentFilter = 'all'; // all, today, week, month, completed
        this.popupOpen = false;
        this.editingTaskId = null;
        this.lastAutoSave = Date.now();
        this.initAutoSave();
    }

    init() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            this.createTodoTile();
            this.createPopup();
            this.checkAndNotifyBackup();
            this.updateTileNotifications();
            
            // Initialiser les notifications Push
            this.initializePushNotifications();
            
            // Vérifier les tâches toutes les 5 minutes
            setInterval(() => {
                this.updateTileNotifications();
                this.checkTasksWithPushNotifications();
            }, 300000);
            
            // Vérifier immédiatement au chargement
            setTimeout(() => {
                this.checkTasksWithPushNotifications();
            }, 2000);
        });
    } else {
        this.createTodoTile();
        this.createPopup();
        this.checkAndNotifyBackup();
        this.updateTileNotifications();
        
        this.initializePushNotifications();
        
        setInterval(() => {
            this.updateTileNotifications();
            this.checkTasksWithPushNotifications();
        }, 300000);
        
        setTimeout(() => {
            this.checkTasksWithPushNotifications();
        }, 2000);
    }
}

async initializePushNotifications() {
    // Créer un ID utilisateur unique pour les todos si pas existant
    if (!localStorage.getItem('todoUserId')) {
        localStorage.setItem('todoUserId', 'todo_user_' + Date.now());
    }
    
    // Demander la permission et s'abonner
    const hasPermission = await requestNotificationPermission();
    if (hasPermission) {
        const subscription = await subscribeToPush();
        if (subscription) {
            console.log('✅ Notifications Push activées pour Todo List');
            this.pushNotificationsEnabled = true;
        }
    }
}

async checkTasksWithPushNotifications() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    for (const task of this.tasks) {
        if (!task.completed && task.dueDate) {
            const taskDate = new Date(task.dueDate + 'T00:00:00');
            const timeDiff = taskDate - today;
            const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            
            // Tâche du jour - notification à 8h du matin
            if (daysDiff === 0 && !task.todayNotified) {
                const now = new Date();
                if (now.getHours() >= 8) {
                    await sendTaskNotification(task, 'today');
                    task.todayNotified = true;
                    this.saveToLocalStorage();
                }
            }
            
            // Tâche en retard
            else if (daysDiff < 0 && !task.overdueNotified) {
                await sendTaskNotification(task, 'overdue');
                task.overdueNotified = true;
                this.saveToLocalStorage();
            }
            
            // Rappel pour tâche avec heure spécifique
            if (task.dueTime && daysDiff === 0 && !task.timeNotified) {
                const [hours, minutes] = task.dueTime.split(':');
                const taskDateTime = new Date(today);
                taskDateTime.setHours(parseInt(hours), parseInt(minutes));
                
                // Envoyer notification 15 minutes avant
                const reminderTime = new Date(taskDateTime.getTime() - 15 * 60 * 1000);
                if (now >= reminderTime && now < taskDateTime) {
                    await sendTaskNotification(task, 'reminder');
                    task.timeNotified = true;
                    this.saveToLocalStorage();
                }
            }
        }
    }
}

    initAutoSave() {
    // Sauvegarde automatique toutes les 30 secondes
    setInterval(() => {
        this.saveToLocalStorage();
        this.lastAutoSave = Date.now();
    }, 30000);
    
    // Vérifier les notifications toutes les minutes
    setInterval(() => {
        if (this.popupOpen) {
            this.checkTasksNotifications();
        }
    }, 60000);

    // Sauvegarde avant fermeture de la page
    window.addEventListener('beforeunload', () => {
        this.saveToLocalStorage();
    });
}

    checkAndNotifyBackup() {
        const lastBackup = localStorage.getItem('lastTaskBackup');
        const daysSinceBackup = lastBackup ? 
            Math.floor((Date.now() - parseInt(lastBackup)) / (1000 * 60 * 60 * 24)) : 999;
        
        // Suggérer une sauvegarde tous les 7 jours
        if (daysSinceBackup > 7 && this.tasks.length > 0) {
            setTimeout(() => {
                if (this.popupOpen) {
                    this.showToast('💾 Pensez à exporter vos tâches pour les sauvegarder !', 5000);
                }
            }, 3000);
        }
    }

    createTodoTile() {
    // Vérifier si la tuile existe déjà
    if (document.querySelector('.todo-app-tile')) {
        return;
    }

    const espaceSeparator = Array.from(document.querySelectorAll('.separator'))
        .find(sep => sep && sep.textContent && sep.textContent.includes('Espace+'));
    
    if (!espaceSeparator) {
        // Observer le DOM pour détecter quand le séparateur apparaît
        const observer = new MutationObserver(() => {
            const separator = Array.from(document.querySelectorAll('.separator'))
                .find(sep => sep && sep.textContent && sep.textContent.includes('Espace+'));
            if (separator) {
                observer.disconnect();
                this.createTodoTile();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        return;
    }

        const tileElement = document.createElement('div');
        tileElement.className = 'tile todo-app-tile';
        tileElement.setAttribute('data-category', 'Espace+');
        
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'rouge';
        let gradientStyle = '';
        
        switch(currentTheme) {
            case 'rouge':
                gradientStyle = 'linear-gradient(135deg, #d32f2f, #f44336)';
                break;
            case 'dark':
                gradientStyle = 'linear-gradient(135deg, #424242, #616161)';
                break;
            case 'bleuciel':
                gradientStyle = 'linear-gradient(135deg, #0288d1, #03a9f4)';
                break;
            case 'light':
                gradientStyle = 'linear-gradient(135deg, #7b1fa2, #9c27b0)';
                break;
            default:
                gradientStyle = 'linear-gradient(135deg, #5e35b1, #673ab7)';
        }
        
        tileElement.style.cssText = `
            background: ${gradientStyle};
            color: white;
            position: relative;
        `;
        
        // Compter les tâches du jour
        const todayTasks = this.getTasksForToday().length;
        const urgentTasks = this.tasks.filter(t => t.priority === 'high' && !t.completed).length;
        
        tileElement.innerHTML = `
            <div class="tile-content">
                <div class="tile-title" style="color: white; font-weight: bold;">
                    ✓ Todo List
                </div>
                ${todayTasks > 0 ? `<div style="font-size: 11px; margin-top: 5px; opacity: 0.9;">${todayTasks} tâche(s) aujourd'hui</div>` : ''}
                ${urgentTasks > 0 ? `<div style="position: absolute; top: 5px; right: 5px; background: #ff5252; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">${urgentTasks}</div>` : ''}
            </div>
        `;

        tileElement.addEventListener('click', () => {
            this.openPopup();
        });

        const existingTiles = document.querySelectorAll('.tile[data-category="Espace+"]');
        if (existingTiles.length > 0) {
            const lastTile = existingTiles[existingTiles.length - 1];
            lastTile.insertAdjacentElement('afterend', tileElement);
        } else {
            espaceSeparator.insertAdjacentElement('afterend', tileElement);
        }
        
        // Observer les changements de thème
        const observer = new MutationObserver(() => {
            this.updateTileTheme();
        });
        
        observer.observe(document.documentElement, { 
            attributes: true, 
            attributeFilter: ['data-theme'] 
        });
    }

    updateTileTheme() {
        const tile = document.querySelector('.todo-app-tile');
        if (!tile) return;
        
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'rouge';
        let gradientStyle = '';
        
        switch(currentTheme) {
            case 'rouge':
                gradientStyle = 'linear-gradient(135deg, #d32f2f, #f44336)';
                break;
            case 'dark':
                gradientStyle = 'linear-gradient(135deg, #ff9800, #ff9800)';
                break;
            case 'bleuciel':
                gradientStyle = 'linear-gradient(135deg, #0288d1, #03a9f4)';
                break;
            case 'light':
                gradientStyle = 'linear-gradient(135deg, #7b1fa2, #9c27b0)';
                break;
            default:
                gradientStyle = 'linear-gradient(135deg, #5e35b1, #673ab7)';
        }
        
        tile.style.background = gradientStyle;
    }
	
	createPopup() {
        const popup = document.createElement('div');
        popup.id = 'todoPopup';
        popup.className = 'todo-popup-overlay';
        popup.innerHTML = `
            <div class="todo-popup-content">
                <div class="todo-popup-header">
                    <h2>✓ Gestionnaire de tâches</h2>
                    <button class="todo-popup-close" id="closeTodoPopup">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                
                <div class="todo-controls">
                    <div class="view-switcher">
                        <button class="view-btn active" data-view="list">
                            <span class="material-icons">list</span>
                            Liste
                        </button>
                        <button class="view-btn" data-view="board">
                            <span class="material-icons">dashboard</span>
                            Tableau
                        </button>
                        <button class="view-btn" data-view="calendar">
                            <span class="material-icons">calendar_month</span>
                            Calendrier
                        </button>
                    </div>
                    
                    <div class="filter-controls">
                        <select id="filterSelect" class="filter-select">
                            <option value="all">Toutes les tâches</option>
                            <option value="today">Aujourd'hui</option>
                            <option value="week">Cette semaine</option>
                            <option value="month">Ce mois</option>
                            <option value="overdue">En retard</option>
                            <option value="completed">Terminées</option>
                        </select>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="action-btn add-task-btn" id="addTaskBtn">
                            <span class="material-icons">add</span>
                            Nouvelle tâche
                        </button>
                        <button class="action-btn export-btn" id="exportTasksBtn">
                            <span class="material-icons">download</span>
                        </button>
                        <button class="action-btn import-btn" id="importTasksBtn">
                            <span class="material-icons">upload</span>
                        </button>
                        <input type="file" id="importFileInput" accept=".json" style="display: none;">
                    </div>
                </div>
                
                <div class="todo-popup-body">
                    <div id="tasksContainer" class="tasks-container"></div>
                </div>
                
                <div class="todo-popup-footer">
                    <div class="stats-bar">
                        <span id="totalTasks">0 tâches</span>
                        <span id="completedTasks">0 terminées</span>
                        <span id="pendingTasks">0 en cours</span>
                        <span class="auto-save-indicator">
                            <span class="material-icons">save</span>
                            Sauvegarde auto
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Modal pour ajouter/éditer une tâche -->
            <div id="taskModal" class="task-modal">
                <div class="task-modal-content">
                    <div class="task-modal-header">
                        <h3 id="modalTitle">Nouvelle tâche</h3>
                        <button class="close-modal" id="closeTaskModal">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                    <div class="task-modal-body">
                        <div class="form-group">
                            <label>Titre de la tâche *</label>
                            <input type="text" id="taskTitle" placeholder="Ex: Préparer la réunion" maxlength="100">
                        </div>
                        
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="taskDescription" placeholder="Détails de la tâche..." rows="3"></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Date d'échéance</label>
                                <input type="date" id="taskDueDate">
                            </div>
                            
                            <div class="form-group">
                                <label>Heure</label>
                                <input type="time" id="taskDueTime">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Priorité</label>
                                <select id="taskPriority">
                                    <option value="low">Basse</option>
                                    <option value="medium" selected>Moyenne</option>
                                    <option value="high">Haute</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Catégorie</label>
                                <select id="taskCategory">
                                    <option value="Personnel">Personnel</option>
                                    <option value="Travail">Travail</option>
                                    <option value="Urgent">Urgent</option>
                                    <option value="Important">Important</option>
                                    <option value="Courses">Courses</option>
                                    <option value="Projets">Projets</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Récurrence</label>
                            <select id="taskRecurrence">
                                <option value="none">Aucune</option>
                                <option value="daily">Quotidienne</option>
                                <option value="weekly">Hebdomadaire</option>
                                <option value="monthly">Mensuelle</option>
                            </select>
                        </div>
                    </div>
                    <div class="task-modal-footer">
                        <button class="modal-btn cancel-btn" id="cancelTaskBtn">Annuler</button>
                        <button class="modal-btn save-btn" id="saveTaskBtn">Sauvegarder</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(popup);
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Fermeture de la popup
        document.getElementById('closeTodoPopup')?.addEventListener('click', () => {
            this.closePopup();
        });

        // Changement de vue
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                e.target.closest('.view-btn').classList.add('active');
                this.currentView = e.target.closest('.view-btn').dataset.view;
                this.renderTasks();
            });
        });

        // Filtrage
        document.getElementById('filterSelect')?.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.renderTasks();
        });

        // Nouvelle tâche
        document.getElementById('addTaskBtn')?.addEventListener('click', () => {
            this.openTaskModal();
        });

        // Export
        document.getElementById('exportTasksBtn')?.addEventListener('click', () => {
            this.exportTasks();
        });

        // Import
        document.getElementById('importTasksBtn')?.addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });

        document.getElementById('importFileInput')?.addEventListener('change', (e) => {
            this.importTasks(e.target.files[0]);
        });

        // Modal tâche
        document.getElementById('closeTaskModal')?.addEventListener('click', () => {
            this.closeTaskModal();
        });

        document.getElementById('cancelTaskBtn')?.addEventListener('click', () => {
            this.closeTaskModal();
        });

        document.getElementById('saveTaskBtn')?.addEventListener('click', () => {
            this.saveTask();
        });

        // Fermeture modal en cliquant dehors
		document.getElementById('taskModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'taskModal') {
        this.closeTaskModal();
    }
});

		// Fermeture popup principale en cliquant dehors
		document.getElementById('todoPopup')?.addEventListener('click', (e) => {
    if (e.target.id === 'todoPopup') {
        this.closePopup();
    }
});

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (!this.popupOpen) return;
            
            if (e.key === 'Escape') {
                if (document.getElementById('taskModal').classList.contains('show')) {
                    this.closeTaskModal();
                } else {
                    this.closePopup();
                }
            }
            
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.openTaskModal();
            }
            
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.exportTasks();
            }
        });
    }
	
	openPopup() {
        const popup = document.getElementById('todoPopup');
        if (!popup) return;
        
        popup.classList.add('active');
        document.body.classList.add('todo-popup-open');
        this.popupOpen = true;
        
        this.renderTasks();
        this.updateStats();
        this.checkAndNotifyBackup();
        this.checkTasksNotifications(); // AJOUT - seule ligne à ajouter
    }

    closePopup() {
        const popup = document.getElementById('todoPopup');
        if (!popup) return;
        
        this.saveToLocalStorage();
        popup.classList.remove('active');
        document.body.classList.remove('todo-popup-open');
        this.popupOpen = false;
    }

    openTaskModal(taskId = null) {
        const modal = document.getElementById('taskModal');
        const modalTitle = document.getElementById('modalTitle');
        
        if (taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                modalTitle.textContent = 'Modifier la tâche';
                document.getElementById('taskTitle').value = task.title;
                document.getElementById('taskDescription').value = task.description || '';
                document.getElementById('taskDueDate').value = task.dueDate || '';
                document.getElementById('taskDueTime').value = task.dueTime || '';
                document.getElementById('taskPriority').value = task.priority;
                document.getElementById('taskCategory').value = task.category;
                document.getElementById('taskRecurrence').value = task.recurrence || 'none';
                this.editingTaskId = taskId;
            }
        } else {
            modalTitle.textContent = 'Nouvelle tâche';
            document.getElementById('taskTitle').value = '';
            document.getElementById('taskDescription').value = '';
            document.getElementById('taskDueDate').value = '';
            document.getElementById('taskDueTime').value = '';
            document.getElementById('taskPriority').value = 'medium';
            document.getElementById('taskCategory').value = 'Personnel';
            document.getElementById('taskRecurrence').value = 'none';
            this.editingTaskId = null;
        }
        
        modal.classList.add('show');
        document.getElementById('taskTitle').focus();
    }

    closeTaskModal() {
        const modal = document.getElementById('taskModal');
        modal.classList.remove('show');
        this.editingTaskId = null;
    }

    saveTask() {
        const title = document.getElementById('taskTitle').value.trim();
        if (!title) {
            this.showToast('❌ Le titre est obligatoire');
            return;
        }
        
        const taskData = {
            title,
            description: document.getElementById('taskDescription').value.trim(),
            dueDate: document.getElementById('taskDueDate').value,
            dueTime: document.getElementById('taskDueTime').value,
            priority: document.getElementById('taskPriority').value,
            category: document.getElementById('taskCategory').value,
            recurrence: document.getElementById('taskRecurrence').value,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        if (this.editingTaskId) {
            const taskIndex = this.tasks.findIndex(t => t.id === this.editingTaskId);
            if (taskIndex !== -1) {
                this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...taskData };
                this.showToast('✅ Tâche modifiée');
            }
        } else {
            taskData.id = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            this.tasks.unshift(taskData);
            this.showToast('✅ Tâche ajoutée');
            
            // Si récurrence, créer les prochaines occurrences
            if (taskData.recurrence !== 'none' && taskData.dueDate) {
                this.createRecurringTasks(taskData);
            }
        }
        
        this.saveToLocalStorage();
        this.renderTasks();
        this.updateStats();
        this.closeTaskModal();
    }

    createRecurringTasks(originalTask) {
        const maxOccurrences = 10; // Créer 10 occurrences futures max
        const baseDate = new Date(originalTask.dueDate);
        
        for (let i = 1; i <= maxOccurrences; i++) {
            let nextDate = new Date(baseDate);
            
            switch (originalTask.recurrence) {
                case 'daily':
                    nextDate.setDate(nextDate.getDate() + i);
                    break;
                case 'weekly':
                    nextDate.setDate(nextDate.getDate() + (i * 7));
                    break;
                case 'monthly':
                    nextDate.setMonth(nextDate.getMonth() + i);
                    break;
            }
            
            // Ne pas créer de tâches trop loin dans le futur (max 3 mois)
            if (nextDate > new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) break;
            
            const recurringTask = {
                ...originalTask,
                id: 'task_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 9),
                dueDate: nextDate.toISOString().split('T')[0],
                parentId: originalTask.id
            };
            
            this.tasks.push(recurringTask);
        }
    }

    toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveToLocalStorage();
            this.renderTasks();
            this.updateStats();
            this.showToast(task.completed ? '✅ Tâche terminée' : '↩️ Tâche réouverte');
        }
    }

    deleteTask(taskId) {
        if (confirm('Supprimer cette tâche ?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveToLocalStorage();
            this.renderTasks();
            this.updateStats();
            this.showToast('🗑️ Tâche supprimée');
        }
    }

	checkTasksNotifications() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        this.tasks.forEach(task => {
            if (!task.completed && task.dueDate && !task.notified) {
                const taskDate = new Date(task.dueDate + 'T00:00:00');
                const timeDiff = taskDate - today;
                const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                
                if (daysDiff === 0) {
		this.showToast(`⏰ Tâche du jour: ${task.title}`, 5000);
		this.playNotificationSound(); // Ajoutez cette ligne
		task.notified = true;
		this.saveToLocalStorage();
	} else if (daysDiff < 0) {
		this.showToast(`⚠️ EN RETARD: ${task.title}`, 6000);
		this.playNotificationSound(); // Ajoutez cette ligne aussi si vous voulez
	}
            }
        });
    }

    playNotificationSound() {
    // Essayer d'abord le son personnalisé
    const audio = new Audio('/sounds/notification.mp3'); // Notez le / au début pour le chemin absolu
    audio.volume = 0.4;
    audio.play().catch(e => {
        // Si le fichier n'existe pas, utiliser le son synthétique
        console.log('Son personnalisé non trouvé, utilisation du son par défaut');
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Audio non disponible:', error);
        }
    });
}

scheduleTimeNotification(task) {
    if (!task.dueTime) return;
    
    const [hours, minutes] = task.dueTime.split(':');
    const now = new Date();
    const taskTime = new Date();
    taskTime.setHours(parseInt(hours), parseInt(minutes), 0);
    
    const timeDiff = taskTime - now;
    
    if (timeDiff > 0) {
        setTimeout(() => {
            this.showToast(`🔔 C'est l'heure! ${task.title}`, 10000);
            // Son de notification optionnel
            this.playNotificationSound();
        }, timeDiff);
    }
}

updateTileNotifications() {
    const tile = document.querySelector('.todo-app-tile');
    if (!tile) return;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let overdueCount = 0;
    let todayCount = 0;
    
    this.tasks.forEach(task => {
        if (!task.completed && task.dueDate) {
            const taskDate = new Date(task.dueDate + 'T00:00:00');
            if (taskDate < today) overdueCount++;
            else if (taskDate.toDateString() === today.toDateString()) todayCount++;
        }
    });
    
    // Mettre à jour le contenu de la tuile
    const tileContent = tile.querySelector('.tile-content');
    if (tileContent) {
        let badgeHtml = '';
        if (overdueCount > 0) {
            badgeHtml = `<div style="position: absolute; top: 5px; right: 5px; background: #ff0000; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; animation: pulse 2s infinite;">${overdueCount}</div>`;
        } else if (todayCount > 0) {
            badgeHtml = `<div style="position: absolute; top: 5px; right: 5px; background: #ff9800; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">${todayCount}</div>`;
        }
        
        tileContent.innerHTML = `
            <div class="tile-title" style="color: white; font-weight: bold;">
                ✓ Todo List
            </div>
            ${todayCount > 0 ? `<div style="font-size: 11px; margin-top: 5px; opacity: 0.9;">${todayCount} tâche(s) aujourd'hui</div>` : ''}
            ${overdueCount > 0 ? `<div style="font-size: 11px; margin-top: 2px; color: #ffcccc; font-weight: bold;">⚠ ${overdueCount} en retard!</div>` : ''}
            ${badgeHtml}
        `;
    }
}

    getFilteredTasks() {
        let filtered = [...this.tasks];
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (this.currentFilter) {
            case 'today':
    filtered = filtered.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate + 'T00:00:00');
        return taskDate.toDateString() === today.toDateString();
    });
    break;
                
            case 'week':
                const weekEnd = new Date(today);
                weekEnd.setDate(weekEnd.getDate() + 7);
                filtered = filtered.filter(task => {
                    if (!task.dueDate) return false;
                    const taskDate = new Date(task.dueDate);
                    return taskDate >= today && taskDate <= weekEnd;
                });
                break;
                
            case 'month':
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                filtered = filtered.filter(task => {
                    if (!task.dueDate) return false;
                    const taskDate = new Date(task.dueDate);
                    return taskDate >= today && taskDate <= monthEnd;
                });
                break;
                
            case 'overdue':
                filtered = filtered.filter(task => {
                    if (!task.dueDate || task.completed) return false;
                    const taskDate = new Date(task.dueDate);
                    return taskDate < today;
                });
                break;
                
            case 'completed':
                filtered = filtered.filter(task => task.completed);
                break;
                
            case 'all':
            default:
                // Pas de filtre
                break;
        }
        
        // Tri par priorité et date
        filtered.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            if (a.priority !== b.priority) return priorityOrder[a.priority] - priorityOrder[b.priority];
            if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
            return 0;
        });
        
        return filtered;
    }

    getTasksForToday() {
        const today = new Date().toDateString();
        return this.tasks.filter(task => {
            if (task.completed) return false;
            if (!task.dueDate) return false;
            return new Date(task.dueDate).toDateString() === today;
        });
    }

    renderTasks() {
        const container = document.getElementById('tasksContainer');
        if (!container) return;
        
        const tasks = this.getFilteredTasks();
        
        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons" style="font-size: 48px; opacity: 0.3;">task_alt</span>
                    <p>Aucune tâche à afficher</p>
                    <button class="action-btn" onclick="window.todoInstance.openTaskModal()">
                        Créer une tâche
                    </button>
                </div>
            `;
            return;
        }
        
        switch (this.currentView) {
            case 'board':
                this.renderBoardView(tasks);
                break;
            case 'calendar':
                this.renderCalendarView(tasks);
                break;
            case 'list':
            default:
                this.renderListView(tasks);
                break;
        }
    }

    renderListView(tasks) {
        const container = document.getElementById('tasksContainer');
        container.className = 'tasks-container list-view';
        
        let html = '<div class="tasks-list">';
        
        tasks.forEach(task => {
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
            const priorityClass = `priority-${task.priority}`;
            
            html += `
                <div class="task-item ${task.completed ? 'completed' : ''} ${priorityClass} ${isOverdue ? 'overdue' : ''}">
                    <div class="task-checkbox">
                        <input type="checkbox" id="check_${task.id}" ${task.completed ? 'checked' : ''} 
                               onchange="window.todoInstance.toggleTaskComplete('${task.id}')">
                        <label for="check_${task.id}"></label>
                    </div>
                    <div class="task-content">
                        <div class="task-header">
                            <h4 class="task-title">${this.escapeHtml(task.title)}</h4>
							${task.priority === 'high' ? '<span class="priority-badge high">🔥 Urgent</span>' : ''}
							${task.priority === 'medium' ? '<span class="priority-badge medium">⚡ Important</span>' : ''}
                            <span class="task-category">${task.category}</span>
                        </div>
                        ${task.description ? `<p class="task-description">${this.escapeHtml(task.description)}</p>` : ''}
                        <div class="task-meta">
                            ${task.dueDate ? `
                                <span class="task-date ${isOverdue ? 'overdue' : ''}">
                                    <span class="material-icons">event</span>
                                    ${this.formatDate(task.dueDate)}
                                    ${task.dueTime ? ` à ${task.dueTime}` : ''}
                                </span>
                            ` : ''}
                            ${task.recurrence !== 'none' ? `
                                <span class="task-recurrence">
                                    <span class="material-icons">repeat</span>
                                    ${this.getRecurrenceLabel(task.recurrence)}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-btn" onclick="window.todoInstance.openTaskModal('${task.id}')" title="Modifier">
                            <span class="material-icons">edit</span>
                        </button>
                        <button class="task-btn delete" onclick="window.todoInstance.deleteTask('${task.id}')" title="Supprimer">
                            <span class="material-icons">delete</span>
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    renderBoardView(tasks) {
        const container = document.getElementById('tasksContainer');
        container.className = 'tasks-container board-view';
        
        const columns = {
            'À faire': tasks.filter(t => !t.completed && t.priority !== 'high'),
            'Urgent': tasks.filter(t => !t.completed && t.priority === 'high'),
            'En cours': tasks.filter(t => !t.completed && this.isTaskInProgress(t)),
            'Terminé': tasks.filter(t => t.completed)
        };
        
        let html = '<div class="board-columns">';
        
        for (const [columnName, columnTasks] of Object.entries(columns)) {
            html += `
                <div class="board-column">
                    <div class="column-header">
                        <h3>${columnName}</h3>
                        <span class="column-count">${columnTasks.length}</span>
                    </div>
                    <div class="column-tasks">
            `;
            
            columnTasks.forEach(task => {
                html += `
                    <div class="board-task priority-${task.priority}" draggable="true">
                        <div class="board-task-header">
                            <input type="checkbox" ${task.completed ? 'checked' : ''} 
                                   onchange="window.todoInstance.toggleTaskComplete('${task.id}')">
                            <span class="board-task-title">${this.escapeHtml(task.title)}</span>
                        </div>
                        ${task.dueDate ? `
                            <div class="board-task-date">
                                <span class="material-icons">event</span>
                                ${this.formatDate(task.dueDate)}
                            </div>
                        ` : ''}
                        <div class="board-task-footer">
                            <span class="task-category-badge">${task.category}</span>
                            <div class="board-task-actions">
                                <button onclick="window.todoInstance.openTaskModal('${task.id}')" class="board-btn">
                                    <span class="material-icons">edit</span>
                                </button>
                                <button onclick="window.todoInstance.deleteTask('${task.id}')" class="board-btn">
                                    <span class="material-icons">delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        container.innerHTML = html;
    }
	
	renderCalendarView(tasks) {
        const container = document.getElementById('tasksContainer');
        container.className = 'tasks-container calendar-view';
        
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const prevLastDay = new Date(currentYear, currentMonth, 0);
        
        const firstDayIndex = firstDay.getDay() || 7; // Lundi = 1
        const lastDayIndex = lastDay.getDate();
        const prevLastDayIndex = prevLastDay.getDate();
        
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                           'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        
        let html = `
            <div class="calendar-header">
                <button onclick="window.todoInstance.previousMonth()" class="calendar-nav">
                    <span class="material-icons">chevron_left</span>
                </button>
                <h3>${monthNames[currentMonth]} ${currentYear}</h3>
                <button onclick="window.todoInstance.nextMonth()" class="calendar-nav">
                    <span class="material-icons">chevron_right</span>
                </button>
            </div>
            <div class="calendar-grid">
                <div class="calendar-weekdays">
                    <div>Lun</div><div>Mar</div><div>Mer</div><div>Jeu</div>
                    <div>Ven</div><div>Sam</div><div>Dim</div>
                </div>
                <div class="calendar-days">
        `;
        
        // Jours du mois précédent
        for (let i = firstDayIndex - 2; i >= 0; i--) {
            html += `<div class="calendar-day other-month">${prevLastDayIndex - i}</div>`;
        }
        
        // Jours du mois actuel
        for (let day = 1; day <= lastDayIndex; day++) {
            const date = new Date(currentYear, currentMonth, day);
            // Utiliser l'année, mois et jour locaux pour éviter le décalage UTC
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');
const dayNum = String(date.getDate()).padStart(2, '0');
const dateStr = `${year}-${month}-${dayNum}`;
            const dayTasks = tasks.filter(t => {
    if (!t.dueDate) return false;
    return t.dueDate === dateStr;
});
            const isToday = date.toDateString() === today.toDateString();
            
            html += `
                <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
                    <div class="day-number">${day}</div>
                    ${dayTasks.length > 0 ? `
                        <div class="day-tasks">
                            ${dayTasks.slice(0, 3).map(task => `
                                <div class="day-task priority-${task.priority} ${task.completed ? 'completed' : ''}"
                                     onclick="window.todoInstance.openTaskModal('${task.id}')">
                                    ${this.escapeHtml(task.title)}
                                </div>
                            `).join('')}
                            ${dayTasks.length > 3 ? `
                                <div class="day-more">+${dayTasks.length - 3} autres</div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        // Jours du mois suivant
        const remainingDays = 42 - (firstDayIndex - 1 + lastDayIndex);
        for (let day = 1; day <= remainingDays; day++) {
            html += `<div class="calendar-day other-month">${day}</div>`;
        }
        
        html += `
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
       } 
	   
	   // Stocker le mois actuel pour la navigation
        container.dataset.month = currentMonth;
        container.dataset.year = currentYear;
    }

    previousMonth() {
        const container = document.getElementById('tasksContainer');
        let month = parseInt(container.dataset.month);
        let year = parseInt(container.dataset.year);
        
        month--;
        if (month < 0) {
            month = 11;
            year--;
        }
        
        container.dataset.month = month;
        container.dataset.year = year;
        this.renderCalendarView(this.getFilteredTasks());
    }

    nextMonth() {
        const container = document.getElementById('tasksContainer');
        let month = parseInt(container.dataset.month);
        let year = parseInt(container.dataset.year);
        
        month++;
        if (month > 11) {
            month = 0;
            year++;
        }
        
        container.dataset.month = month;
        container.dataset.year = year;
        this.renderCalendarView(this.getFilteredTasks());
    }

    isTaskInProgress(task) {
        // Logique pour déterminer si une tâche est "en cours"
        // Par exemple, si elle a une date d'échéance dans les 3 prochains jours
        if (!task.dueDate || task.completed) return false;
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
        return dueDate >= today && dueDate <= threeDaysFromNow;
    }

    formatDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
            return "Aujourd'hui";
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return "Demain";
        } else {
            const options = { day: 'numeric', month: 'short' };
            if (date.getFullYear() !== today.getFullYear()) {
                options.year = 'numeric';
            }
            return date.toLocaleDateString('fr-FR', options);
        }
    }

    getRecurrenceLabel(recurrence) {
        const labels = {
            daily: 'Quotidien',
            weekly: 'Hebdomadaire',
            monthly: 'Mensuel'
        };
        return labels[recurrence] || '';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        
        document.getElementById('totalTasks').textContent = `${total} tâche${total > 1 ? 's' : ''}`;
        document.getElementById('completedTasks').textContent = `${completed} terminée${completed > 1 ? 's' : ''}`;
        document.getElementById('pendingTasks').textContent = `${pending} en cours`;
    }

    exportTasks() {
        try {
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                tasksCount: this.tasks.length,
                tasks: this.tasks,
                categories: this.categories
            };

            const jsonStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
            a.download = `todo-list-export-${date}.json`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            // Mettre à jour la date de dernière sauvegarde
            localStorage.setItem('lastTaskBackup', Date.now().toString());
            
            this.showToast(`📥 ${this.tasks.length} tâches exportées avec succès`);
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            this.showToast('❌ Erreur lors de l\'export');
        }
    }

    importTasks(file) {
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                if (!importData.tasks || !Array.isArray(importData.tasks)) {
                    throw new Error('Format de fichier invalide');
                }
                
                const options = confirm(
                    `📤 Fichier d'import détecté:\n` +
                    `- ${importData.tasksCount || importData.tasks.length} tâches\n` +
                    `- Exporté le: ${importData.exportDate ? new Date(importData.exportDate).toLocaleDateString('fr-FR') : 'Date inconnue'}\n\n` +
                    `Voulez-vous REMPLACER toutes vos tâches actuelles?\n` +
                    `(OK = Remplacer | Annuler = Fusionner avec les tâches existantes)`
                );
                
                if (options) {
                    this.tasks = importData.tasks;
                } else {
                    const importedTasks = importData.tasks.map(task => ({
                        ...task,
                        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        imported: true
                    }));
                    this.tasks = [...importedTasks, ...this.tasks];
                }
                
                if (importData.categories) {
                    this.categories = [...new Set([...this.categories, ...importData.categories])];
                }
                
                this.saveToLocalStorage();
                this.renderTasks();
                this.updateStats();
                
                this.showToast(`✅ ${importData.tasks.length} tâches importées avec succès`);
                
                document.getElementById('importFileInput').value = '';
                
            } catch (error) {
                console.error('Erreur lors de l\'import:', error);
                this.showToast('❌ Erreur: Fichier invalide ou corrompu');
            }
        };
        
        reader.onerror = () => {
            this.showToast('❌ Erreur lors de la lecture du fichier');
        };
        
        reader.readAsText(file);
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('userTasks', JSON.stringify(this.tasks));
            
            // Indicateur visuel de sauvegarde
            const indicator = document.querySelector('.auto-save-indicator');
            if (indicator) {
                indicator.classList.add('saving');
                setTimeout(() => {
                    indicator.classList.remove('saving');
                }, 1000);
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            this.showToast('⚠️ Erreur de sauvegarde locale');
        }
    }

    showToast(message, duration = 3000) {
        const existingToasts = document.querySelectorAll('.todo-toast');
        existingToasts.forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = 'todo-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    try {
        if (typeof localStorage !== 'undefined') {
            window.todoInstance = new TodoListWidget();
            window.todoInstance.init();
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la Todo List:', error);
    }
});
	