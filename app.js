const STORAGE_KEY = 'kanban_flow_tasks_v1';

let state = {
    tasks: [
        { id: '1', title: 'Initialize Repository', description: 'Setup base configuration and directory layout.', status: 'done', priority: 'high' },
        { id: '2', title: 'Implement DOM Drag and Drop', description: 'Add native drag and drop handlers for task migration.', status: 'in-progress', priority: 'medium' },
        { id: '3', title: 'Design Persistence Layer', description: 'Ensure local storage synchronization works reliably.', status: 'todo', priority: 'low' }
    ]
};

function init() {
    loadState();
    setupEventListeners();
    renderBoard();
}

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            state.tasks = JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse local storage state', e);
        }
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function setupEventListeners() {
    document.getElementById('add-task-btn').addEventListener('click', () => openModal());
    document.getElementById('modal-cancel').addEventListener('click', () => closeModal());
    document.getElementById('task-form').addEventListener('submit', handleTaskFormSubmit);
    document.getElementById('clear-btn').addEventListener('click', handleResetBoard);
    document.getElementById('export-btn').addEventListener('click', handleExportJSON);
    document.getElementById('import-file').addEventListener('change', handleImportJSON);

    document.querySelectorAll('.task-list').forEach(list => {
        list.addEventListener('dragover', e => e.preventDefault());
        list.addEventListener('drop', handleDrop);
    });
}

function renderBoard() {
    const statuses = ['todo', 'in-progress', 'review', 'done'];
    
    statuses.forEach(status => {
        const container = document.querySelector(`.task-list[data-status="${status}"]`);
        const countEl = document.getElementById(`count-${status}`);
        const tasks = state.tasks.filter(t => t.status === status);
        
        container.innerHTML = '';
        countEl.textContent = tasks.length;

        tasks.forEach(task => {
            const card = createTaskCard(task);
            container.appendChild(card);
        });
    });
}

function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;
    card.dataset.id = task.id;

    card.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', task.id);
        setTimeout(() => card.classList.add('dragging'), 0);
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
    });

    const header = document.createElement('div');
    header.className = 'task-header';

    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;

    const badge = document.createElement('span');
    badge.className = `priority-badge priority-${task.priority}`;
    badge.textContent = task.priority;

    header.appendChild(title);
    header.appendChild(badge);
    card.appendChild(header);

    if (task.description) {
        const desc = document.createElement('p');
        desc.className = 'task-desc';
        desc.textContent = task.description;
        card.appendChild(desc);
    }

    const footer = document.createElement('div');
    footer.className = 'task-footer';

    const editBtn = document.createElement('button');
    editBtn.className = 'task-action-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openModal(task));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-action-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    footer.appendChild(editBtn);
    footer.appendChild(deleteBtn);
    card.appendChild(footer);

    return card;
}

function handleDrop(e) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const targetStatus = e.currentTarget.dataset.status;

    const task = state.tasks.find(t => t.id === taskId);
    if (task && task.status !== targetStatus) {
        task.status = targetStatus;
        saveState();
        renderBoard();
    }
}

function openModal(task = null) {
    const modal = document.getElementById('task-modal');
    const modalTitle = document.getElementById('modal-title');
    const idInput = document.getElementById('task-id');
    const titleInput = document.getElementById('task-title-input');
    const descInput = document.getElementById('task-desc-input');
    const priorityInput = document.getElementById('task-priority-input');

    if (task) {
        modalTitle.textContent = 'Edit Task';
        idInput.value = task.id;
        titleInput.value = task.title;
        descInput.value = task.description;
        priorityInput.value = task.priority;
    } else {
        modalTitle.textContent = 'Create Task';
        idInput.value = '';
        titleInput.value = '';
        descInput.value = '';
        priorityInput.value = 'medium';
    }

    modal.classList.remove('hidden');
    titleInput.focus();
}

function closeModal() {
    const modal = document.getElementById('task-modal');
    modal.classList.add('hidden');
}

function handleTaskFormSubmit(e) {
    e.preventDefault();
    const idInput = document.getElementById('task-id');
    const titleInput = document.getElementById('task-title-input');
    const descInput = document.getElementById('task-desc-input');
    const priorityInput = document.getElementById('task-priority-input');

    const id = idInput.value;
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const priority = priorityInput.value;

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
            priority
        };
        state.tasks.push(newTask);
    }

    saveState();
    renderBoard();
    closeModal();
}

function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveState();
    renderBoard();
}

function handleResetBoard() {
    if (window.confirm('Are you sure you want to reset the board? All tasks will be lost.')) {
        state.tasks = [];
        saveState();
        renderBoard();
    }
}

function handleExportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `kanban_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function handleImportJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedTasks = JSON.parse(event.target.result);
            if (Array.isArray(importedTasks)) {
                state.tasks = importedTasks;
                saveState();
                renderBoard();
            } else {
                alert('Invalid JSON format: Expected an array of tasks.');
            }
        } catch (err) {
            alert('Failed to parse JSON file.');
            console.error(err);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

document.addEventListener('DOMContentLoaded', init);
