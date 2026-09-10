const STORAGE_KEY = 'kanban_flow_tasks_v1';

let state = {
    tasks: [
        { id: '1', title: 'Initialize Repository', description: 'Setup base configuration and directory layout.', status: 'todo', priority: 'high' },
        { id: '2', title: 'Implement DOM Drag and Drop', description: 'Add native drag and drop handlers for task migration.', status: 'in-progress', priority: 'medium' },
        { id: '3', title: 'Design Persistence Layer', description: 'Ensure local storage synchronization works reliably.', status: 'done', priority: 'low' }
    ],
    filterText: '',
    filterPriority: 'all'
};

function init() {
    loadState();
    setupEventListeners();
    render();
}

function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                state.tasks = parsed;
            }
        }
    } catch (e) {
        console.error('Failed to load state from localStorage:', e);
    }
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
    } catch (e) {
        console.error('Failed to save state to localStorage:', e);
    }
}

function setupEventListeners() {
    const addTaskBtn = document.getElementById('add-task-btn');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    const searchInput = document.getElementById('search-input');
    const priorityFilter = document.getElementById('priority-filter');
    const taskModal = document.getElementById('task-modal');
    const taskForm = document.getElementById('task-form');
    const closeModalBtn = document.getElementById('close-modal-btn');

    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => openModal());
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }

    if (importBtn && importFile) {
        importBtn.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', importData);
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.filterText = e.target.value.toLowerCase();
            renderTasks();
        });
    }

    if (priorityFilter) {
        priorityFilter.addEventListener('change', (e) => {
            state.filterPriority = e.target.value;
            renderTasks();
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskSubmit);
    }

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === 'n' || e.key === 'N') {
            e.preventDefault();
            openModal();
        } else if (e.key === '/') {
            e.preventDefault();
            if (searchInput) searchInput.focus();
        } else if (e.key === 'e' || e.key === 'E') {
            e.preventDefault();
            exportData();
        }
    });

    setupDragAndDrop();
}

function openModal(task = null) {
    const modal = document.getElementById('task-modal');
    const modalTitle = document.getElementById('modal-title');
    const taskIdInput = document.getElementById('task-id');
    const titleInput = document.getElementById('task-title-input');
    const descInput = document.getElementById('task-desc-input');
    const priorityInput = document.getElementById('task-priority-input');
    const statusInput = document.getElementById('task-status-input');

    if (!modal) return;

    if (task) {
        modalTitle.textContent = 'Edit Task';
        taskIdInput.value = task.id;
        titleInput.value = task.title;
        descInput.value = task.description;
        priorityInput.value = task.priority;
        statusInput.value = task.status;
    } else {
        modalTitle.textContent = 'New Task';
        taskIdInput.value = '';
        titleInput.value = '';
        descInput.value = '';
        priorityInput.value = 'medium';
        statusInput.value = 'todo';
    }

    modal.style.display = 'flex';
    titleInput.focus();
}

function closeModal() {
    const modal = document.getElementById('task-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function handleTaskSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('task-id').value;
    const title = document.getElementById('task-title-input').value.trim();
    const description = document.getElementById('task-desc-input').value.trim();
    const priority = document.getElementById('task-priority-input').value;
    const status = document.getElementById('task-status-input').value;

    if (!title) return;

    if (id) {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            task.title = title;
            task.description = description;
            task.priority = priority;
            task.status = status;
        }
    } else {
        const newTask = {
            id: Date.now().toString(),
            title,
            description,
            priority,
            status
        };
        state.tasks.push(newTask);
    }

    saveState();
    closeModal();
    render();
}

function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        state.tasks = state.tasks.filter(t => t.id !== id);
        saveState();
        render();
    }
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `kanban_flow_export_${Date.now()}.json`);
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
            const imported = JSON.parse(event.target.result);
            if (Array.isArray(imported)) {
                state.tasks = imported;
                saveState();
                render();
                alert('Tasks imported successfully!');
            } else {
                alert('Invalid JSON structure for tasks.');
            }
        } catch (err) {
            alert('Failed to parse JSON file.');
        }
        e.target.value = '';
    };
    reader.readAsText(file);
}

function setupDragAndDrop() {
    const columns = document.querySelectorAll('.kanban-column');

    columns.forEach(column => {
        column.addEventListener('dragover', e => {
            e.preventDefault();
            column.classList.add('drag-over');
        });

        column.addEventListener('dragleave', () => {
            column.classList.remove('drag-over');
        });

        column.addEventListener('drop', e => {
            e.preventDefault();
            column.classList.remove('drag-over');
            const taskId = e.dataTransfer.getData('text/plain');
            const newStatus = column.dataset.status;

            const task = state.tasks.find(t => t.id === taskId);
            if (task && task.status !== newStatus) {
                task.status = newStatus;
                saveState();
                render();
            }
        });
    });
}

function render() {
    renderTasks();
    updateCounts();
}

function renderTasks() {
    const statuses = ['todo', 'in-progress', 'done'];

    statuses.forEach(status => {
        const container = document.getElementById(`tasks-${status}`);
        if (!container) return;

        container.innerHTML = '';

        const filteredTasks = state.tasks.filter(task => {
            const matchesStatus = task.status === status;
            const matchesText = task.title.toLowerCase().includes(state.filterText) || task.description.toLowerCase().includes(state.filterText);
            const matchesPriority = state.filterPriority === 'all' || task.priority === state.filterPriority;
            return matchesStatus && matchesText && matchesPriority;
        });

        if (filteredTasks.length === 0) {
            container.innerHTML = '<div class="empty-state">No tasks</div>';
            return;
        }

        filteredTasks.forEach(task => {
            const card = document.createElement('div');
            card.className = `task-card priority-${task.priority}`;
            card.draggable = true;
            card.dataset.id = task.id;

            card.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', task.id);
                setTimeout(() => card.classList.add('dragging'), 0);
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });

            card.innerHTML = `
                <div class="task-header">
                    <span class="task-title">${escapeHTML(task.title)}</span>
                    <span class="badge priority-badge ${task.priority}">${task.priority}</span>
                </div>
                <p class="task-desc">${escapeHTML(task.description)}</p>
                <div class="task-footer">
                    <div class="task-actions">
                        <button class="btn-icon edit-btn" title="Edit Task">✏️</button>
                        <button class="btn-icon delete-btn" title="Delete Task">🗑️</button>
                    </div>
                </div>
            `;

            card.querySelector('.edit-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openModal(task);
            });

            card.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(task.id);
            });

            container.appendChild(card);
        });
    });
}

function updateCounts() {
    const statuses = ['todo', 'in-progress', 'done'];
    statuses.forEach(status => {
        const countEl = document.getElementById(`count-${status}`);
        if (countEl) {
            const count = state.tasks.filter(t => t.status === status).length;
            countEl.textContent = count;
        }
    });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

document.addEventListener('DOMContentLoaded', init);