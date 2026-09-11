const STORAGE_KEY = 'kanban_flow_tasks_v3';

let state = {
    tasks: [
        { id: '1', title: 'Initialize Repository', description: 'Setup base configuration and directory layout.', status: 'todo', priority: 'high', createdAt: Date.now() - 86400000 * 2 },
        { id: '2', title: 'Implement DOM Drag and Drop', description: 'Add native drag and drop handlers for task migration.', status: 'in-progress', priority: 'medium', createdAt: Date.now() - 86400000 },
        { id: '3', title: 'Design Persistence Layer', description: 'Ensure local storage synchronization works reliably.', status: 'done', priority: 'low', createdAt: Date.now() - 43200000 },
        { id: '4', title: 'Analytics & Metrics Hook', description: 'Track task completion velocity and priority distribution.', status: 'todo', priority: 'high', createdAt: Date.now() }
    ],
    filter: {
        search: '',
        priority: 'all'
    }
};

function init() {
    loadTasks();
    setupEventListeners();
    render();
}

function loadTasks() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                state.tasks = parsed;
            }
        }
    } catch (error) {
        console.error('Failed to load tasks from localStorage:', error);
    }
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
    } catch (error) {
        console.error('Failed to save tasks to localStorage:', error);
    }
}

function setupEventListeners() {
    document.getElementById('add-task-btn').addEventListener('click', () => openModal());
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('cancel-modal-btn').addEventListener('click', closeModal);
    document.getElementById('task-form').addEventListener('submit', handleTaskSubmit);
    
    document.getElementById('search-input').addEventListener('input', (e) => {
        state.filter.search = e.target.value.trim().toLowerCase();
        render();
    });

    document.getElementById('priority-filter').addEventListener('change', (e) => {
        state.filter.priority = e.target.value;
        render();
    });

    document.getElementById('export-btn').addEventListener('click', exportTasks);
    document.getElementById('import-file').addEventListener('change', importTasks);
    document.getElementById('reset-btn').addEventListener('click', resetTasks);

    document.querySelectorAll('.kanban-column').forEach(column => {
        const status = column.dataset.status;
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
            if (taskId) {
                updateTaskStatus(taskId, status);
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            if (e.key === 'Escape') {
                e.target.blur();
                closeModal();
            }
            return;
        }

        if (e.key === 'n' || e.key === 'N') {
            e.preventDefault();
            openModal();
        } else if (e.key === '/') {
            e.preventDefault();
            document.getElementById('search-input').focus();
        } else if (e.key === 'e' || e.key === 'E') {
            e.preventDefault();
            exportTasks();
        } else if (e.key === 'Escape') {
            closeModal();
        }
    });

    document.getElementById('task-modal').addEventListener('click', (e) => {
        if (e.target.id === 'task-modal') {
            closeModal();
        }
    });
}

function openModal(task = null) {
    const modal = document.getElementById('task-modal');
    const modalTitle = document.getElementById('modal-title');
    const taskIdInput = document.getElementById('task-id');
    const taskTitleInput = document.getElementById('task-title-input');
    const taskDescInput = document.getElementById('task-desc-input');
    const taskPriorityInput = document.getElementById('task-priority-input');

    if (task) {
        modalTitle.textContent = 'Edit Task';
        taskIdInput.value = task.id;
        taskTitleInput.value = task.title;
        taskDescInput.value = task.description;
        taskPriorityInput.value = task.priority;
    } else {
        modalTitle.textContent = 'Create New Task';
        taskIdInput.value = '';
        taskTitleInput.value = '';
        taskDescInput.value = '';
        taskPriorityInput.value = 'medium';
    }

    modal.classList.add('active');
    taskTitleInput.focus();
}

function closeModal() {
    document.getElementById('task-modal').classList.remove('active');
    document.getElementById('task-form').reset();
}

function handleTaskSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('task-id').value;
    const title = document.getElementById('task-title-input').value.trim();
    const description = document.getElementById('task-desc-input').value.trim();
    const priority = document.getElementById('task-priority-input').value;

    if (!title) return;

    if (id) {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            task.title = title;
            task.description = description;
            task.priority = priority;
        }
    } else {
        const newTask = {
            id: Date.now().toString(),
            title,
            description,
            status: 'todo',
            priority,
            createdAt: Date.now()
        };
        state.tasks.push(newTask);
    }

    saveTasks();
    render();
    closeModal();
}

function updateTaskStatus(taskId, newStatus) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
        task.status = newStatus;
        saveTasks();
        render();
    }
}

function deleteTask(taskId) {
    state.tasks = state.tasks.filter(t => t.id !== taskId);
    saveTasks();
    render();
}

function exportTasks() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `kanban_flow_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importTasks(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const imported = JSON.parse(event.target.result);
            if (Array.isArray(imported)) {
                state.tasks = imported;
                saveTasks();
                render();
            } else {
                alert('Invalid JSON structure. Expected an array of tasks.');
            }
        } catch (err) {
            alert('Failed to parse JSON file.');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function resetTasks() {
    if (confirm('Are you sure you want to reset all tasks to default?')) {
        localStorage.removeItem(STORAGE_KEY);
        state.tasks = [
            { id: '1', title: 'Initialize Repository', description: 'Setup base configuration and directory layout.', status: 'todo', priority: 'high', createdAt: Date.now() - 86400000 * 2 },
            { id: '2', title: 'Implement DOM Drag and Drop', description: 'Add native drag and drop handlers for task migration.', status: 'in-progress', priority: 'medium', createdAt: Date.now() - 86400000 },
            { id: '3', title: 'Design Persistence Layer', description: 'Ensure local storage synchronization works reliably.', status: 'done', priority: 'low', createdAt: Date.now() - 43200000 }
        ];
        saveTasks();
        render();
    }
}

function render() {
    const columns = {
        todo: document.getElementById('column-todo'),
        'in-progress': document.getElementById('column-in-progress'),
        done: document.getElementById('column-done')
    };

    const counts = {
        todo: 0,
        'in-progress': 0,
        done: 0
    };

    Object.values(columns).forEach(col => col.innerHTML = '');

    const filteredTasks = state.tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(state.filter.search) || 
                              task.description.toLowerCase().includes(state.filter.search);
        const matchesPriority = state.filter.priority === 'all' || task.priority === state.filter.priority;
        return matchesSearch && matchesPriority;
    });

    filteredTasks.forEach(task => {
        counts[task.status]++;
        const card = createTaskCard(task);
        if (columns[task.status]) {
            columns[task.status].appendChild(card);
        }
    });

    document.getElementById('count-todo').textContent = counts.todo;
    document.getElementById('count-in-progress').textContent = counts['in-progress'];
    document.getElementById('count-done').textContent = counts.done;

    updateMetrics();
}

function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;
    card.dataset.id = task.id;

    card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', task.id);
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
    });

    const dateStr = new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    card.innerHTML = `
        <div class="task-header">
            <span class="task-title">${escapeHTML(task.title)}</span>
            <div class="task-actions">
                <button class="task-action-btn edit" title="Edit Task">✏️</button>
                <button class="task-action-btn delete" title="Delete Task">🗑️</button>
            </div>
        </div>
        ${task.description ? `<div class="task-description">${escapeHTML(task.description)}</div>` : ''}
        <div class="task-footer">
            <span class="priority-badge priority-${task.priority}">${task.priority}</span>
            <span class="task-date">${dateStr}</span>
        </div>
    `;

    card.querySelector('.edit').addEventListener('click', () => openModal(task));
    card.querySelector('.delete').addEventListener('click', () => deleteTask(task.id));

    return card;
}

function updateMetrics() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.status === 'done').length;
    const urgent = state.tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('metric-total').textContent = total;
    document.getElementById('metric-completed').textContent = `${completionRate}%`;
    document.getElementById('metric-urgent').textContent = urgent;
}

function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', init);
