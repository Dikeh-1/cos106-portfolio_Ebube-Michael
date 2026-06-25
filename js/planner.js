document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskCategory = document.getElementById('task-category');
    const taskPriority = document.getElementById('task-priority');
    
    const zones = {
        todo: document.getElementById('zone-todo'),
        progress: document.getElementById('zone-progress'),
        done: document.getElementById('zone-done')
    };
    
    const counts = {
        todo: document.getElementById('count-todo'),
        progress: document.getElementById('count-progress'),
        done: document.getElementById('count-done')
    };

    const stats = {
        total: document.getElementById('stat-total'),
        todo: document.getElementById('stat-todo'),
        progress: document.getElementById('stat-progress'),
        done: document.getElementById('stat-done')
    };
    const progressFill = document.getElementById('progress-fill');

    // --- State Management ---
    // Load tasks from localStorage or initialize empty array
    let tasks = JSON.parse(localStorage.getItem('planner_tasks')) || [];

    // Save to local storage
    function saveTasks() {
        localStorage.setItem('planner_tasks', JSON.stringify(tasks));
    }

    // --- Core Logic ---
    // Add new task
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const text = taskInput.value.trim();
        const category = taskCategory.value;
        const priority = taskPriority.value;

        if (!text || !category || !priority) return;

        const newTask = {
            id: Date.now().toString(),
            text: text,
            category: category,
            priority: priority,
            status: 'todo' // Default status
        };

        tasks.push(newTask);
        saveTasks();
        render();

        // Reset form
        taskInput.value = '';
        taskCategory.value = '';
        taskPriority.value = '';
        taskInput.focus();
    });

    // Delete task
    window.deleteTask = function(id) {
        tasks = tasks.filter(t => t.id !== String(id));
        saveTasks();
        render();
    };

    // --- Render Logic ---
    function render() {
        // Clear all zones
        Object.values(zones).forEach(zone => zone.innerHTML = '');

        // Counters for stats
        let tally = { todo: 0, progress: 0, done: 0 };

        // Render each task into its respective column
        tasks.forEach(task => {
            if (tally[task.status] !== undefined) {
                tally[task.status]++;
                const card = createTaskCard(task);
                zones[task.status].appendChild(card);
            }
        });

        // Update Column Badges
        counts.todo.textContent = tally.todo;
        counts.progress.textContent = tally.progress;
        counts.done.textContent = tally.done;

        // Update Dashboard Stats
        const total = tasks.length;
        stats.total.textContent = total;
        stats.todo.textContent = tally.todo;
        stats.progress.textContent = tally.progress;
        stats.done.textContent = tally.done;

        // Update Progress Bar
        const percent = total === 0 ? 0 : Math.round((tally.done / total) * 100);
        progressFill.style.width = percent + '%';
    }

    function createTaskCard(task) {
        const div = document.createElement('div');
        div.className = 'kanban-card';
        div.draggable = true;
        div.dataset.id = task.id;

        div.innerHTML = `
            <div class="k-card-header">
                <span class="k-badge ${task.category}">${task.category}</span>
                <div class="k-priority ${task.priority}" title="Priority: ${task.priority}"></div>
            </div>
            <div class="k-card-title">${escapeHTML(task.text)}</div>
            <div class="k-card-footer">
                <button class="btn-delete-card" onclick="deleteTask(${task.id})" aria-label="Delete task">Delete</button>
            </div>
        `;

        // Drag events for this card
        div.addEventListener('dragstart', handleDragStart);
        div.addEventListener('dragend', handleDragEnd);

        return div;
    }

    // --- Drag and Drop Logic ---
    let draggedTaskId = null;

    function handleDragStart(e) {
        draggedTaskId = this.dataset.id;
        this.classList.add('dragging');
        // Set data for Firefox compatibility
        e.dataTransfer.setData('text/plain', draggedTaskId);
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragEnd(e) {
        this.classList.remove('dragging');
        draggedTaskId = null;
        Object.values(zones).forEach(z => z.classList.remove('drag-over'));
    }

    // Setup drop zones
    Object.values(zones).forEach(zone => {
        zone.addEventListener('dragover', e => {
            e.preventDefault(); // Necessary to allow dropping
            e.dataTransfer.dropEffect = 'move';
            zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            
            const newStatus = zone.dataset.status;
            if (draggedTaskId && newStatus) {
                // Update task status in array
                const taskIndex = tasks.findIndex(t => t.id === draggedTaskId);
                if (taskIndex > -1 && tasks[taskIndex].status !== newStatus) {
                    tasks[taskIndex].status = newStatus;
                    saveTasks();
                    render();
                }
            }
        });
    });

    // --- Utilities ---
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.innerText = str;
        return div.innerHTML;
    }

    // Initial render
    render();
});
