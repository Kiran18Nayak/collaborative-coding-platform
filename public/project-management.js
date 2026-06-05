/**
 * Project Management Module
 * 
 * This module provides project management functionality for the collaborative coding platform.
 * It allows users to create and manage tasks, track progress, set deadlines, and assign tasks to team members.
 */

class ProjectManagement {
    constructor() {
        this.projects = {};
        this.currentProject = null;
        this.socket = null;
        this.roomId = null;
        this.userId = null;
        this.isInitialized = false;
        this.projectPanel = null;
    }

    /**
     * Initialize the project management module
     * @param {Object} socket - The socket.io connection
     * @param {string} roomId - The room ID
     * @param {string} userId - The user ID
     */
    async initialize(socket, roomId, userId) {
        if (this.isInitialized) return;
        
        this.socket = socket;
        this.roomId = roomId;
        this.userId = userId;
        
        // Create project panel if it doesn't exist
        this.createProjectPanel();
        
        // Set up socket event listeners
        this.setupSocketListeners();
        
        // Set up UI event listeners
        this.setupUIListeners();
        
        // Load existing projects for this room
        await this.loadProjects();
        
        this.isInitialized = true;
        console.log('Project management initialized');
    }

    /**
     * Create the project management panel
     */
    createProjectPanel() {
        // Check if panel already exists
        this.projectPanel = document.getElementById('projectManagementPanel');
        if (this.projectPanel) return;
        
        // Create panel container
        this.projectPanel = document.createElement('aside');
        this.projectPanel.id = 'projectManagementPanel';
        this.projectPanel.className = 'project-management-panel';
        
        // Create panel header
        const panelHeader = document.createElement('div');
        panelHeader.className = 'panel-header';
        panelHeader.innerHTML = `
            <h3>Project Management</h3>
            <button id="closeProjectManagement" class="panel-close-btn"><i class="fas fa-times"></i></button>
        `;
        
        // Create project selector
        const projectSelector = document.createElement('div');
        projectSelector.className = 'project-selector';
        projectSelector.innerHTML = `
            <div class="selector-header">
                <h4>Projects</h4>
                <button id="createNewProject" class="btn-small"><i class="fas fa-plus"></i> New Project</button>
            </div>
            <select id="projectSelect">
                <option value="">Select a project...</option>
            </select>
        `;
        
        // Create task board
        const taskBoard = document.createElement('div');
        taskBoard.id = 'taskBoard';
        taskBoard.className = 'task-board';
        
        // Create task columns
        const taskColumns = document.createElement('div');
        taskColumns.className = 'task-columns';
        taskColumns.innerHTML = `
            <div class="task-column" id="todoTasks">
                <div class="column-header">
                    <h4>To Do</h4>
                    <button class="add-task-btn" data-status="todo"><i class="fas fa-plus"></i></button>
                </div>
                <div class="tasks-container" id="todoTasksContainer"></div>
            </div>
            <div class="task-column" id="inProgressTasks">
                <div class="column-header">
                    <h4>In Progress</h4>
                    <button class="add-task-btn" data-status="inProgress"><i class="fas fa-plus"></i></button>
                </div>
                <div class="tasks-container" id="inProgressTasksContainer"></div>
            </div>
            <div class="task-column" id="completedTasks">
                <div class="column-header">
                    <h4>Completed</h4>
                    <button class="add-task-btn" data-status="completed"><i class="fas fa-plus"></i></button>
                </div>
                <div class="tasks-container" id="completedTasksContainer"></div>
            </div>
        `;
        
        taskBoard.appendChild(taskColumns);
        
        // Create project details section
        const projectDetails = document.createElement('div');
        projectDetails.id = 'projectDetails';
        projectDetails.className = 'project-details';
        projectDetails.innerHTML = `
            <div class="project-info">
                <h4>Project Details</h4>
                <div id="projectInfo">Select a project to view details</div>
            </div>
            <div class="project-stats">
                <div class="stat-item">
                    <span class="stat-label">Total Tasks:</span>
                    <span class="stat-value" id="totalTasks">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Completed:</span>
                    <span class="stat-value" id="completedTasksCount">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Progress:</span>
                    <div class="progress-bar">
                        <div class="progress" id="projectProgress" style="width: 0%;"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Assemble panel
        this.projectPanel.appendChild(panelHeader);
        this.projectPanel.appendChild(projectSelector);
        this.projectPanel.appendChild(taskBoard);
        this.projectPanel.appendChild(projectDetails);
        
        // Add panel to the main layout
        const mainLayout = document.querySelector('.main-layout');
        if (mainLayout) {
            mainLayout.appendChild(this.projectPanel);
        } else {
            // Fallback to editor container if main-layout doesn't exist
            const editorContainer = document.querySelector('.editor-container');
            if (editorContainer) {
                editorContainer.appendChild(this.projectPanel);
            } else {
                // Last resort, add to body
                document.body.appendChild(this.projectPanel);
            }
        }
    }

    /**
     * Set up socket event listeners
     */
    setupSocketListeners() {
        // When a new project is created
        this.socket.on('project-created', (data) => {
            console.log('Project created:', data.project);
            this.projects[data.project.id] = data.project;
            this.updateProjectSelector();
        });
        
        // When a project is updated
        this.socket.on('project-updated', (data) => {
            console.log('Project updated:', data.project);
            this.projects[data.project.id] = data.project;
            
            if (this.currentProject && this.currentProject.id === data.project.id) {
                this.currentProject = data.project;
                this.renderProject();
            }
        });
        
        // When a project is deleted
        this.socket.on('project-deleted', (data) => {
            console.log('Project deleted:', data.projectId);
            delete this.projects[data.projectId];
            
            if (this.currentProject && this.currentProject.id === data.projectId) {
                this.currentProject = null;
                this.clearTaskBoard();
            }
            
            this.updateProjectSelector();
        });
        
        // When a task is created
        this.socket.on('task-created', (data) => {
            console.log('Task created:', data.task);
            
            if (this.currentProject && this.currentProject.id === data.projectId) {
                // Add task to current project
                if (!this.currentProject.tasks) {
                    this.currentProject.tasks = [];
                }
                
                this.currentProject.tasks.push(data.task);
                this.renderTask(data.task);
                this.updateProjectStats();
            }
        });
        
        // When a task is updated
        this.socket.on('task-updated', (data) => {
            console.log('Task updated:', data.task);
            
            if (this.currentProject && this.currentProject.id === data.projectId) {
                // Update task in current project
                const taskIndex = this.currentProject.tasks.findIndex(task => task.id === data.task.id);
                if (taskIndex !== -1) {
                    this.currentProject.tasks[taskIndex] = data.task;
                    this.renderProject();
                }
            }
        });
        
        // When a task is deleted
        this.socket.on('task-deleted', (data) => {
            console.log('Task deleted:', data.taskId);
            
            if (this.currentProject && this.currentProject.id === data.projectId) {
                // Remove task from current project
                this.currentProject.tasks = this.currentProject.tasks.filter(task => task.id !== data.taskId);
                
                // Remove task element from DOM
                const taskElement = document.getElementById(`task-${data.taskId}`);
                if (taskElement) {
                    taskElement.remove();
                }
                
                this.updateProjectStats();
            }
        });
    }

    /**
     * Set up UI event listeners
     */
    setupUIListeners() {
        // Toggle project management panel
        const toggleBtn = document.getElementById('toggleProjectManagement');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleProjectPanel());
        }
        
        // Close project management panel
        const closeBtn = document.getElementById('closeProjectManagement');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideProjectPanel());
        }
        
        // Create new project
        const createProjectBtn = document.getElementById('createNewProject');
        if (createProjectBtn) {
            createProjectBtn.addEventListener('click', () => this.showCreateProjectModal());
        }
        
        // Project selection
        const projectSelect = document.getElementById('projectSelect');
        if (projectSelect) {
            projectSelect.addEventListener('change', (e) => {
                const projectId = e.target.value;
                if (projectId) {
                    this.selectProject(projectId);
                } else {
                    this.clearTaskBoard();
                }
            });
        }
        
        // Add task buttons
        const addTaskBtns = document.querySelectorAll('.add-task-btn');
        addTaskBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const status = e.target.closest('.add-task-btn').dataset.status;
                this.showCreateTaskModal(status);
            });
        });
    }

    /**
     * Toggle the project management panel
     */
    toggleProjectPanel() {
        if (this.projectPanel.classList.contains('active')) {
            this.hideProjectPanel();
        } else {
            this.showProjectPanel();
        }
    }

    /**
     * Show the project management panel
     */
    showProjectPanel() {
        this.projectPanel.classList.add('active');
        document.getElementById('toggleProjectManagement').classList.add('active');
    }

    /**
     * Hide the project management panel
     */
    hideProjectPanel() {
        this.projectPanel.classList.remove('active');
        document.getElementById('toggleProjectManagement').classList.remove('active');
    }

    /**
     * Load projects for the current room
     */
    async loadProjects() {
        // In a real implementation, this would fetch projects from the server
        // For now, we'll create some sample projects
        
        const sampleProjects = [
            {
                id: 'project-1',
                name: 'Sample Project',
                description: 'A sample project for demonstration purposes',
                createdBy: this.userId,
                createdAt: new Date().toISOString(),
                tasks: [
                    {
                        id: 'task-1',
                        title: 'Implement login functionality',
                        description: 'Create login form and authentication logic',
                        status: 'todo',
                        assignedTo: this.userId,
                        createdBy: this.userId,
                        createdAt: new Date().toISOString(),
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        priority: 'high'
                    },
                    {
                        id: 'task-2',
                        title: 'Design database schema',
                        description: 'Create ER diagram and define table structures',
                        status: 'inProgress',
                        assignedTo: this.userId,
                        createdBy: this.userId,
                        createdAt: new Date().toISOString(),
                        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                        priority: 'medium'
                    },
                    {
                        id: 'task-3',
                        title: 'Set up CI/CD pipeline',
                        description: 'Configure GitHub Actions for automated testing and deployment',
                        status: 'completed',
                        assignedTo: this.userId,
                        createdBy: this.userId,
                        createdAt: new Date().toISOString(),
                        completedAt: new Date().toISOString(),
                        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                        priority: 'low'
                    }
                ]
            }
        ];
        
        // Add sample projects to the projects object
        sampleProjects.forEach(project => {
            this.projects[project.id] = project;
        });
        
        // Update the project selector
        this.updateProjectSelector();
    }

    /**
     * Update the project selector dropdown
     */
    updateProjectSelector() {
        const projectSelect = document.getElementById('projectSelect');
        if (!projectSelect) return;
        
        // Clear existing options except the default one
        while (projectSelect.options.length > 1) {
            projectSelect.remove(1);
        }
        
        // Add projects to the selector
        Object.values(this.projects).forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
    }

    /**
     * Select a project and display its tasks
     * @param {string} projectId - The ID of the project to select
     */
    selectProject(projectId) {
        this.currentProject = this.projects[projectId];
        if (!this.currentProject) return;
        
        this.renderProject();
    }

    /**
     * Render the current project's tasks and details
     */
    renderProject() {
        if (!this.currentProject) return;
        
        // Clear the task board
        this.clearTaskBoard();
        
        // Render project info
        const projectInfo = document.getElementById('projectInfo');
        if (projectInfo) {
            projectInfo.innerHTML = `
                <h5>${this.currentProject.name}</h5>
                <p>${this.currentProject.description}</p>
                <p><strong>Created by:</strong> ${this.currentProject.createdBy}</p>
                <p><strong>Created at:</strong> ${new Date(this.currentProject.createdAt).toLocaleString()}</p>
            `;
        }
        
        // Render tasks
        if (this.currentProject.tasks) {
            this.currentProject.tasks.forEach(task => {
                this.renderTask(task);
            });
        }
        
        // Update project stats
        this.updateProjectStats();
    }

    /**
     * Render a task in the appropriate column
     * @param {Object} task - The task to render
     */
    renderTask(task) {
        const containerId = `${task.status}TasksContainer`;
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Check if task already exists
        const existingTask = document.getElementById(`task-${task.id}`);
        if (existingTask) {
            existingTask.remove();
        }
        
        // Create task element
        const taskElement = document.createElement('div');
        taskElement.id = `task-${task.id}`;
        taskElement.className = `task-card priority-${task.priority}`;
        taskElement.draggable = true;
        
        // Format due date
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        const isOverdue = dueDate < today && task.status !== 'completed';
        
        // Create task content
        taskElement.innerHTML = `
            <div class="task-header">
                <h5 class="task-title">${task.title}</h5>
                <div class="task-actions">
                    <button class="task-action-btn edit-task" data-task-id="${task.id}"><i class="fas fa-edit"></i></button>
                    <button class="task-action-btn delete-task" data-task-id="${task.id}"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="task-description">${task.description}</div>
            <div class="task-meta">
                <div class="task-assignee">
                    <i class="fas fa-user"></i> ${task.assignedTo}
                </div>
                <div class="task-due-date ${isOverdue ? 'overdue' : ''}">
                    <i class="fas fa-calendar"></i> ${dueDate.toLocaleDateString()}
                </div>
            </div>
        `;
        
        // Add event listeners for task actions
        taskElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
        });
        
        // Add task to container
        container.appendChild(taskElement);
        
        // Add event listeners for task actions
        const editBtn = taskElement.querySelector('.edit-task');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.showEditTaskModal(task));
        }
        
        const deleteBtn = taskElement.querySelector('.delete-task');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));
        }
    }

    /**
     * Clear the task board
     */
    clearTaskBoard() {
        const containers = [
            document.getElementById('todoTasksContainer'),
            document.getElementById('inProgressTasksContainer'),
            document.getElementById('completedTasksContainer')
        ];
        
        containers.forEach(container => {
            if (container) {
                container.innerHTML = '';
            }
        });
        
        // Clear project info
        const projectInfo = document.getElementById('projectInfo');
        if (projectInfo) {
            projectInfo.textContent = 'Select a project to view details';
        }
        
        // Reset project stats
        this.updateProjectStats();
    }

    /**
     * Update project statistics
     */
    updateProjectStats() {
        if (!this.currentProject || !this.currentProject.tasks) {
            // Reset stats
            document.getElementById('totalTasks').textContent = '0';
            document.getElementById('completedTasksCount').textContent = '0';
            document.getElementById('projectProgress').style.width = '0%';
            return;
        }
        
        const totalTasks = this.currentProject.tasks.length;
        const completedTasks = this.currentProject.tasks.filter(task => task.status === 'completed').length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasksCount').textContent = completedTasks;
        document.getElementById('projectProgress').style.width = `${progress}%`;
    }

    /**
     * Show the create project modal
     */
    showCreateProjectModal() {
        // Create modal if it doesn't exist
        let modal = document.getElementById('createProjectModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'createProjectModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>Create New Project</h3>
                    <form id="createProjectForm">
                        <div class="form-group">
                            <label for="projectName">Project Name</label>
                            <input type="text" id="projectName" required>
                        </div>
                        <div class="form-group">
                            <label for="projectDescription">Description</label>
                            <textarea id="projectDescription" rows="3"></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Create</button>
                            <button type="button" id="cancelCreateProject" class="btn-secondary">Cancel</button>
                        </div>
                    </form>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add event listeners
            document.getElementById('createProjectForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.createProject();
            });
            
            document.getElementById('cancelCreateProject').addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        // Show modal
        modal.style.display = 'block';
    }

    /**
     * Create a new project
     */
    createProject() {
        const name = document.getElementById('projectName').value;
        const description = document.getElementById('projectDescription').value;
        
        if (!name) return;
        
        const projectId = 'project-' + Date.now();
        const project = {
            id: projectId,
            name: name,
            description: description,
            createdBy: this.userId,
            createdAt: new Date().toISOString(),
            tasks: []
        };
        
        // Add project to projects object
        this.projects[projectId] = project;
        
        // Update project selector
        this.updateProjectSelector();
        
        // Select the new project
        document.getElementById('projectSelect').value = projectId;
        this.selectProject(projectId);
        
        // Hide modal
        document.getElementById('createProjectModal').style.display = 'none';
        
        // Emit project created event
        this.socket.emit('project-created', {
            roomId: this.roomId,
            project: project
        });
    }

    /**
     * Show the create task modal
     * @param {string} status - The initial status for the task
     */
    showCreateTaskModal(status) {
        if (!this.currentProject) {
            alert('Please select a project first');
            return;
        }
        
        // Create modal if it doesn't exist
        let modal = document.getElementById('createTaskModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'createTaskModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>Create New Task</h3>
                    <form id="createTaskForm">
                        <div class="form-group">
                            <label for="taskTitle">Task Title</label>
                            <input type="text" id="taskTitle" required>
                        </div>
                        <div class="form-group">
                            <label for="taskDescription">Description</label>
                            <textarea id="taskDescription" rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="taskStatus">Status</label>
                            <select id="taskStatus">
                                <option value="todo">To Do</option>
                                <option value="inProgress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="taskAssignee">Assigned To</label>
                            <input type="text" id="taskAssignee" value="${this.userId}">
                        </div>
                        <div class="form-group">
                            <label for="taskDueDate">Due Date</label>
                            <input type="date" id="taskDueDate">
                        </div>
                        <div class="form-group">
                            <label for="taskPriority">Priority</label>
                            <select id="taskPriority">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Create</button>
                            <button type="button" id="cancelCreateTask" class="btn-secondary">Cancel</button>
                        </div>
                    </form>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add event listeners
            document.getElementById('createTaskForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.createTask();
            });
            
            document.getElementById('cancelCreateTask').addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        // Set initial status
        document.getElementById('taskStatus').value = status;
        
        // Set default due date (7 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        document.getElementById('taskDueDate').valueAsDate = dueDate;
        
        // Show modal
        modal.style.display = 'block';
    }

    /**
     * Create a new task
     */
    createTask() {
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDescription').value;
        const status = document.getElementById('taskStatus').value;
        const assignedTo = document.getElementById('taskAssignee').value;
        const dueDate = document.getElementById('taskDueDate').value;
        const priority = document.getElementById('taskPriority').value;
        
        if (!title) return;
        
        const taskId = 'task-' + Date.now();
        const task = {
            id: taskId,
            title: title,
            description: description,
            status: status,
            assignedTo: assignedTo,
            createdBy: this.userId,
            createdAt: new Date().toISOString(),
            dueDate: dueDate ? new Date(dueDate).toISOString() : null,
            priority: priority
        };
        
        // Add task to current project
        if (!this.currentProject.tasks) {
            this.currentProject.tasks = [];
        }
        
        this.currentProject.tasks.push(task);
        
        // Render the task
        this.renderTask(task);
        
        // Update project stats
        this.updateProjectStats();
        
        // Hide modal
        document.getElementById('createTaskModal').style.display = 'none';
        
        // Emit task created event
        this.socket.emit('task-created', {
            roomId: this.roomId,
            projectId: this.currentProject.id,
            task: task
        });
    }

    /**
     * Show the edit task modal
     * @param {Object} task - The task to edit
     */
    showEditTaskModal(task) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('editTaskModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'editTaskModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>Edit Task</h3>
                    <form id="editTaskForm">
                        <input type="hidden" id="editTaskId">
                        <div class="form-group">
                            <label for="editTaskTitle">Task Title</label>
                            <input type="text" id="editTaskTitle" required>
                        </div>
                        <div class="form-group">
                            <label for="editTaskDescription">Description</label>
                            <textarea id="editTaskDescription" rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="editTaskStatus">Status</label>
                            <select id="editTaskStatus">
                                <option value="todo">To Do</option>
                                <option value="inProgress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="editTaskAssignee">Assigned To</label>
                            <input type="text" id="editTaskAssignee">
                        </div>
                        <div class="form-group">
                            <label for="editTaskDueDate">Due Date</label>
                            <input type="date" id="editTaskDueDate">
                        </div>
                        <div class="form-group">
                            <label for="editTaskPriority">Priority</label>
                            <select id="editTaskPriority">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Save</button>
                            <button type="button" id="cancelEditTask" class="btn-secondary">Cancel</button>
                        </div>
                    </form>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add event listeners
            document.getElementById('editTaskForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateTask();
            });
            
            document.getElementById('cancelEditTask').addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        // Fill form with task data
        document.getElementById('editTaskId').value = task.id;
        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskDescription').value = task.description;
        document.getElementById('editTaskStatus').value = task.status;
        document.getElementById('editTaskAssignee').value = task.assignedTo;
        document.getElementById('editTaskPriority').value = task.priority;
        
        // Set due date
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            document.getElementById('editTaskDueDate').valueAsDate = dueDate;
        } else {
            document.getElementById('editTaskDueDate').value = '';
        }
        
        // Show modal
        modal.style.display = 'block';
    }

    /**
     * Update a task
     */
    updateTask() {
        const taskId = document.getElementById('editTaskId').value;
        const title = document.getElementById('editTaskTitle').value;
        const description = document.getElementById('editTaskDescription').value;
        const status = document.getElementById('editTaskStatus').value;
        const assignedTo = document.getElementById('editTaskAssignee').value;
        const dueDate = document.getElementById('editTaskDueDate').value;
        const priority = document.getElementById('editTaskPriority').value;
        
        if (!taskId || !title) return;
        
        // Find task in current project
        const taskIndex = this.currentProject.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) return;
        
        const task = this.currentProject.tasks[taskIndex];
        
        // Update task properties
        task.title = title;
        task.description = description;
        
        // Check if status changed to completed
        if (status === 'completed' && task.status !== 'completed') {
            task.completedAt = new Date().toISOString();
        } else if (status !== 'completed') {
            delete task.completedAt;
        }
        
        task.status = status;
        task.assignedTo = assignedTo;
        task.dueDate = dueDate ? new Date(dueDate).toISOString() : null;
        task.priority = priority;
        
        // Update task in current project
        this.currentProject.tasks[taskIndex] = task;
        
        // Re-render project
        this.renderProject();
        
        // Hide modal
        document.getElementById('editTaskModal').style.display = 'none';
        
        // Emit task updated event
        this.socket.emit('task-updated', {
            roomId: this.roomId,
            projectId: this.currentProject.id,
            task: task
        });
    }

    /**
     * Delete a task
     * @param {string} taskId - The ID of the task to delete
     */
    deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) return;
        
        // Remove task from current project
        this.currentProject.tasks = this.currentProject.tasks.filter(task => task.id !== taskId);
        
        // Remove task element from DOM
        const taskElement = document.getElementById(`task-${taskId}`);
        if (taskElement) {
            taskElement.remove();
        }
        
        // Update project stats
        this.updateProjectStats();
        
        // Emit task deleted event
        this.socket.emit('task-deleted', {
            roomId: this.roomId,
            projectId: this.currentProject.id,
            taskId: taskId
        });
    }
}

// Create and export the project management instance
const projectManagement = new ProjectManagement();

// Add toggle button to the toolbar
document.addEventListener('DOMContentLoaded', () => {
    const toolbar = document.querySelector('.toolbar');
    if (toolbar) {
        // Check if the button already exists
        if (!document.getElementById('toggleProjectManagement')) {
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'toggleProjectManagement';
            toggleBtn.className = 'feature-toggle';
            toggleBtn.innerHTML = '<i class="fas fa-tasks"></i> Project';
            
            // Insert before the file owner indicator
            const fileOwnerIndicator = document.getElementById('fileOwnerIndicator');
            if (fileOwnerIndicator) {
                toolbar.insertBefore(toggleBtn, fileOwnerIndicator);
            } else {
                toolbar.appendChild(toggleBtn);
            }
        }
    }
});

// Initialize project management when a user joins a room
document.addEventListener('joined-room', async () => {
    const socket = window.socket;
    const roomId = document.getElementById('room-id').value;
    const username = document.getElementById('username').value;
    
    if (socket && roomId && username) {
        await projectManagement.initialize(socket, roomId, username);
    }
});