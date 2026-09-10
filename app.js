const STORAGE_KEY = 'kanban_flow_tasks_v2';

let state = {
    tasks: [
        { id: '1', title: 'Initialize Repository', description: 'Setup base configuration and directory layout.', status: 'todo', priority: 'high' },
        { id: '2', title: 'Implement DOM Drag and Drop', description: 'Add native drag and drop handlers for task migration.', status: 'in-progress', priority: 'medium' },
        { id: '3', title: 'Design Persistence Layer', description: 'Ensure local storage synchronization works reliably.', status: 'done', priority: 'low' },
        { id: '4', title: 'Analytics & Metrics HUD', description: 'Build real-time progress widgets for the dashboard.', status: 'todo', priority: 'medium' }
    ],
    filterText: '',
    filterPriority: 'all'
};

let editingTaskId = null;

// DOM Elements
const boardEl = document.getElementById('kanban-board');
const searchInput = document.getElementById('search-input');
const priorityFilter = document.getElementById('priority-filter');
const addTaskBtn = document.getElementById('add-task-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFileInput = document.getElementById('import-file');
const taskModal = document.getElementById('task-modal');
const modalTitle = document.getElementById('modal-title');
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title-input');
const taskDescInput = document.getElementById('task-desc-input');
const taskPriorityInput = document.getElementById('task-priority-input');
const taskStatusInput = document.getElementById('task-status-input');
const cancelModalBtn = document.getElementById('cancel-modal');

// Stats Elements
const statTotal = document.getElementById('stat-total');
const statCompleted = document.getElementById('stat-completed');
const statUrgent = document.getElementById('stat-urgent');
const progressBar = document.getElementById('progress-bar');

function init() {
    loadFromStorage();
    setupEventListeners();
    render();
}

function loadFromStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                state.tasks = parsed;
            }
        }
    } catch (err) {
        console.error('Failed to load tasks from localStorage:', err);
    }
}

function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
    } catch (err) {
        console.error('Failed to save tasks to localStorage:', err);
    }
}

function setupEventListeners() {
    addTaskBtn.addEventListener('click', () => openModal());
    cancelModalBtn.addEventListener('click', () => closeModal());
    taskForm.addEventListener('submit', handleFormSubmit);
    
    searchInput.addEventListener('input', (e) => {
        state.filterText = e.target.value.trim().toLowerCase();
        renderTasks();
    });

    priorityFilter.addEventListener('change', (e) => {
        state.filterPriority = e.target.value;
        renderTasks();
    });

    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', importData);

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        if (e.key === 'n' || e.key === 'N') {
            e.preventDefault();
            openModal();
        } else if (e.key === '/') {
            e.preventDefault();
            searchInput.focus();
        } else if (e.key === 'e' || e.key === 'E') {
            e.preventDefault();
            exportData();
        }
    });

    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) closeModal();
    });
}

function openModal(task = null) {
    editingTaskId = task ? task.id : null;
    modalTitle.textContent = task ? 'Edit Task' : 'Create New Task';
    
    if (task) {
        taskTitleInput.value = task.title;
        taskDescInput.value = task.description;
        taskPriorityInput.value = task.priority;
        taskStatusInput.value = task.status;
    } else {
        taskForm.reset();
        taskStatusInput.value = 'todo';
        taskPriorityInput.value = 'medium';
    }
    
    taskModal.classList.add('active');
    taskTitleInput.focus();
}

function closeModal() {
    taskModal.classList.remove('active');
    editingTaskId = null;
    taskForm.reset();
}

function handleFormSubmit(e) {
    e.preventDefault();
    const title = taskTitleInput.value.trim();
    const description = taskDescInput.value.trim();
    const priority = taskPriorityInput.value;
    const status = taskStatusInput.value;

    if (!title) return;

    if (editingTaskId) {
        state.tasks = state.tasks.map(t => t.id === editingTaskId ? { ...t, title, description, priority, status } : t);
    } else {
        const newTask = {
            id: '_' + Math.random().toString(36).substr(2, 9),
            title,
            description,
            priority,
            status
        };
        state.tasks.push(newTask);
    }

    saveToStorage();
    closeModal();
    render();
}

function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        state.tasks = state.tasks.filter(t => t.id !== id);
        saveToStorage();
        render();
    }
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `kanban_flow_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedTasks = JSON.parse(event.target.result);
            if (Array.isArray(importedTasks)) {
                state.tasks = importedTasks;
                saveToStorage();
                render();
                alert('Tasks imported successfully!');
            } else {
                alert('Invalid JSON file format.');
            }
        } catch (err) {
            alert('Error parsing JSON file.');
        }
        importFileInput.value = '';
    };
    reader.readAsText(file);
}

function render() {
    renderTasks();
    updateStats();
}

function renderTasks() {
    const columns = ['todo', 'in-progress', 'done'];
    
    columns.forEach(status => {
        const container = document.getElementById(`tasks-${status}`);
        const countBadge = document.getElementById(`count-${status}`);
        
        const filteredTasks = state.tasks.filter(task => {
            const matchesStatus = task.status === status;
            const matchesText = task.title.toLowerCase().includes(state.filterText) || task.description.toLowerCase().includes(state.filterText);
            const matchesPriority = state.filterPriority === 'all' || task.priority === state.filterPriority;
            return matchesStatus && matchesText && matchesPriority;
        });

        countBadge.textContent = filteredTasks.length;
        container.innerHTML = '';

        if (filteredTasks.length === 0) {
            container.innerHTML = `<div class="empty-column-msg">No tasks found</div>`;
            return;
        }

        filteredTasks.forEach(task => {
            const card = document.createElement('div');
            card.className = `task-card priority-${task.priority}`;
            card.setAttribute('draggable', 'true');
            card.dataset.id = task.id;

            card.innerHTML = `
                <div class="task-header">
                    <span class="badge priority-badge-${task.priority}">${task.priority.toUpperCase()}</span>
                    <div class="task-actions">
                        <button class="icon-btn edit-btn" title="Edit Task">✏️</button>
                        <button class="icon-btn delete-btn" title="Delete Task">🗑️</button>
                    </div>
                </div>
                <h4 class="task-title">${escapeHTML(task.title)}</h4>
                <p class="task-desc">${escapeHTML(task.description)}</p>
            `;

            // Drag and Drop events
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', task.id);
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                document.querySelectorAll('.kanban-column').forEach(col => col.classList.remove('drag-over'));
            });

            // Button handlers
            card.querySelector('.edit-btn').addEventListener('click', () => openModal(task));
            card.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));

            container.appendChild(card);
        });
    });

    setupDropZones();
}

function setupDropZones() {
    const columns = document.querySelectorAll('.kanban-column');

    columns.forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            column.classList.add('drag-over');
        });

        column.addEventListener('dragleave', () => {
            column.classList.remove('drag-over');
        });

        column.addEventListener('drop', (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');
            const taskId = e.dataTransfer.getData('text/plain');
            const newStatus = column.dataset.status;

            if (taskId && newStatus) {
                state.tasks = state.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
                saveToStorage();
                render();
            }
        });
    });
}

function updateStats() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.status === 'done').length;
    const urgent = state.tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    statTotal.textContent = total;
    statCompleted.textContent = completed;
    statUrgent.textContent = urgent;
    progressBar.style.width = `${percent}%`;
}

function escapeHTML(str) {
    return str.replace(/[&<>'"/]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
        '/': '&#x2F;'
    }[tag] || tag));
}

window.addEventListener('DOMContentLoaded', init);
