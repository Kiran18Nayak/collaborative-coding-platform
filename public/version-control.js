/**
 * Version Control Integration Module
 * 
 * This module provides Git integration features for the collaborative coding platform.
 * It allows users to initialize repositories, commit changes, push/pull from remote repositories,
 * view commit history, and manage branches.
 */

class VersionControl {
    constructor(socket, roomId, username) {
        this.socket = socket;
        this.roomId = roomId;
        this.username = username;
        this.isOpen = false;
        this.currentRepo = null;
        this.branches = [];
        this.commitHistory = [];
        this.stagedFiles = [];
        this.changedFiles = [];
        
        // Create UI elements
        this.createVersionControlPanel();
        
        // Initialize event listeners
        this.setupEventListeners();
    }
    
    /**
     * Creates the version control panel UI
     */
    createVersionControlPanel() {
        // Create the main panel container
        const panel = document.createElement('div');
        panel.id = 'versionControlPanel';
        panel.className = 'side-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <h3><i class="fas fa-code-branch"></i> Version Control</h3>
                <button id="closeVersionControl" class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="panel-content">
                <div class="repo-info">
                    <div class="repo-status">
                        <span id="repoStatusIndicator" class="status-indicator"></span>
                        <span id="currentRepoName">No repository</span>
                    </div>
                    <div class="repo-actions">
                        <button id="initRepo" class="btn-primary"><i class="fas fa-plus"></i> Init Repo</button>
                        <button id="cloneRepo" class="btn-primary"><i class="fas fa-download"></i> Clone</button>
                    </div>
                </div>
                
                <div class="branch-section">
                    <div class="section-header">
                        <h4>Current Branch</h4>
                        <div class="branch-selector">
                            <select id="branchSelect" disabled>
                                <option value="">Select branch</option>
                            </select>
                            <button id="createBranch" class="btn-secondary" disabled><i class="fas fa-code-branch"></i> New</button>
                        </div>
                    </div>
                </div>
                
                <div class="changes-section">
                    <div class="section-header">
                        <h4>Changes</h4>
                        <button id="refreshChanges" class="btn-secondary"><i class="fas fa-sync"></i></button>
                    </div>
                    <div class="file-list" id="changedFilesList">
                        <div class="empty-state">No changes detected</div>
                    </div>
                    <div class="staging-actions">
                        <button id="stageAllChanges" class="btn-secondary" disabled><i class="fas fa-plus"></i> Stage All</button>
                        <button id="unstageAllChanges" class="btn-secondary" disabled><i class="fas fa-minus"></i> Unstage All</button>
                    </div>
                </div>
                
                <div class="staged-section">
                    <div class="section-header">
                        <h4>Staged Changes</h4>
                    </div>
                    <div class="file-list" id="stagedFilesList">
                        <div class="empty-state">No staged changes</div>
                    </div>
                </div>
                
                <div class="commit-section">
                    <textarea id="commitMessage" placeholder="Commit message" disabled></textarea>
                    <button id="commitChanges" class="btn-primary" disabled><i class="fas fa-check"></i> Commit</button>
                </div>
                
                <div class="remote-section">
                    <div class="section-header">
                        <h4>Remote</h4>
                    </div>
                    <div class="remote-actions">
                        <button id="pullChanges" class="btn-secondary" disabled><i class="fas fa-download"></i> Pull</button>
                        <button id="pushChanges" class="btn-secondary" disabled><i class="fas fa-upload"></i> Push</button>
                    </div>
                    <div class="remote-url">
                        <input type="text" id="remoteUrl" placeholder="Remote URL" disabled />
                        <button id="setRemote" class="btn-secondary" disabled><i class="fas fa-link"></i> Set</button>
                    </div>
                </div>
                
                <div class="history-section">
                    <div class="section-header">
                        <h4>Commit History</h4>
                        <button id="refreshHistory" class="btn-secondary" disabled><i class="fas fa-sync"></i></button>
                    </div>
                    <div class="commit-list" id="commitHistoryList">
                        <div class="empty-state">No commit history</div>
                    </div>
                </div>
            </div>
        `;
        
        // Add the panel to the document body
        document.body.appendChild(panel);
    }
    
    /**
     * Sets up event listeners for the version control panel
     */
    setupEventListeners() {
        // Close button
        document.getElementById('closeVersionControl').addEventListener('click', () => {
            this.close();
        });
        
        // Repository actions
        document.getElementById('initRepo').addEventListener('click', () => {
            this.initRepository();
        });
        
        document.getElementById('cloneRepo').addEventListener('click', () => {
            this.showCloneDialog();
        });
        
        // Branch actions
        document.getElementById('branchSelect').addEventListener('change', (e) => {
            this.switchBranch(e.target.value);
        });
        
        document.getElementById('createBranch').addEventListener('click', () => {
            this.showCreateBranchDialog();
        });
        
        // Changes actions
        document.getElementById('refreshChanges').addEventListener('click', () => {
            this.refreshChanges();
        });
        
        document.getElementById('stageAllChanges').addEventListener('click', () => {
            this.stageAllChanges();
        });
        
        document.getElementById('unstageAllChanges').addEventListener('click', () => {
            this.unstageAllChanges();
        });
        
        // Commit actions
        document.getElementById('commitChanges').addEventListener('click', () => {
            this.commitStagedChanges();
        });
        
        // Remote actions
        document.getElementById('pullChanges').addEventListener('click', () => {
            this.pullChanges();
        });
        
        document.getElementById('pushChanges').addEventListener('click', () => {
            this.pushChanges();
        });
        
        document.getElementById('setRemote').addEventListener('click', () => {
            this.setRemoteUrl();
        });
        
        // History actions
        document.getElementById('refreshHistory').addEventListener('click', () => {
            this.refreshCommitHistory();
        });
    }
    
    /**
     * Opens the version control panel
     */
    open() {
        const panel = document.getElementById('versionControlPanel');
        if (panel) {
            panel.classList.add('open');
            this.isOpen = true;
            
            // Refresh data when opening
            this.checkRepositoryStatus();
            this.refreshChanges();
            this.refreshCommitHistory();
        }
    }
    
    /**
     * Closes the version control panel
     */
    close() {
        const panel = document.getElementById('versionControlPanel');
        if (panel) {
            panel.classList.remove('open');
            this.isOpen = false;
        }
    }
    
    /**
     * Initializes a new Git repository
     */
    async initRepository() {
        try {
            const response = await this.sendCommand('git init');
            if (response.success) {
                this.showNotification('Repository initialized successfully', 'success');
                this.currentRepo = this.roomId;
                this.updateRepoStatus(true);
                this.enableRepoFeatures();
                this.refreshChanges();
                this.refreshBranches();
            } else {
                this.showNotification('Failed to initialize repository: ' + response.error, 'error');
            }
        } catch (error) {
            console.error('Error initializing repository:', error);
            this.showNotification('Error initializing repository', 'error');
        }
    }
    
    /**
     * Shows the clone repository dialog
     */
    showCloneDialog() {
        const url = prompt('Enter the repository URL to clone:');
        if (url) {
            this.cloneRepository(url);
        }
    }
    
    /**
     * Clones a repository from a URL
     * @param {string} url - The repository URL
     */
    async cloneRepository(url) {
        try {
            this.showNotification('Cloning repository...', 'info');
            const response = await this.sendCommand(`git clone ${url} .`);
            if (response.success) {
                this.showNotification('Repository cloned successfully', 'success');
                this.currentRepo = url.split('/').pop().replace('.git', '');
                this.updateRepoStatus(true);
                this.enableRepoFeatures();
                this.refreshChanges();
                this.refreshBranches();
                this.refreshCommitHistory();
            } else {
                this.showNotification('Failed to clone repository: ' + response.error, 'error');
            }
        } catch (error) {
            console.error('Error cloning repository:', error);
            this.showNotification('Error cloning repository', 'error');
        }
    }
    
    /**
     * Checks the status of the current repository
     */
    async checkRepositoryStatus() {
        try {
            const response = await this.sendCommand('git status');
            const hasRepo = response.success && !response.output.includes('not a git repository');
            
            this.updateRepoStatus(hasRepo);
            
            if (hasRepo) {
                // Extract repository name
                const nameResponse = await this.sendCommand('git rev-parse --show-toplevel');
                if (nameResponse.success) {
                    this.currentRepo = nameResponse.output.trim().split('/').pop();
                    this.enableRepoFeatures();
                    this.refreshBranches();
                }
            } else {
                this.disableRepoFeatures();
            }
            
            return hasRepo;
        } catch (error) {
            console.error('Error checking repository status:', error);
            this.updateRepoStatus(false);
            this.disableRepoFeatures();
            return false;
        }
    }
    
    /**
     * Updates the repository status indicator
     * @param {boolean} hasRepo - Whether a repository exists
     */
    updateRepoStatus(hasRepo) {
        const indicator = document.getElementById('repoStatusIndicator');
        const repoName = document.getElementById('currentRepoName');
        
        if (indicator) {
            indicator.className = 'status-indicator ' + (hasRepo ? 'active' : 'inactive');
        }
        
        if (repoName) {
            repoName.textContent = hasRepo ? this.currentRepo || 'Repository' : 'No repository';
        }
    }
    
    /**
     * Enables repository-specific features in the UI
     */
    enableRepoFeatures() {
        document.getElementById('branchSelect').disabled = false;
        document.getElementById('createBranch').disabled = false;
        document.getElementById('stageAllChanges').disabled = false;
        document.getElementById('unstageAllChanges').disabled = false;
        document.getElementById('commitMessage').disabled = false;
        document.getElementById('commitChanges').disabled = false;
        document.getElementById('pullChanges').disabled = false;
        document.getElementById('pushChanges').disabled = false;
        document.getElementById('remoteUrl').disabled = false;
        document.getElementById('setRemote').disabled = false;
        document.getElementById('refreshHistory').disabled = false;
    }
    
    /**
     * Disables repository-specific features in the UI
     */
    disableRepoFeatures() {
        document.getElementById('branchSelect').disabled = true;
        document.getElementById('createBranch').disabled = true;
        document.getElementById('stageAllChanges').disabled = true;
        document.getElementById('unstageAllChanges').disabled = true;
        document.getElementById('commitMessage').disabled = true;
        document.getElementById('commitChanges').disabled = true;
        document.getElementById('pullChanges').disabled = true;
        document.getElementById('pushChanges').disabled = true;
        document.getElementById('remoteUrl').disabled = true;
        document.getElementById('setRemote').disabled = true;
        document.getElementById('refreshHistory').disabled = true;
    }
    
    /**
     * Refreshes the list of branches
     */
    async refreshBranches() {
        try {
            const response = await this.sendCommand('git branch');
            if (response.success) {
                const branchSelect = document.getElementById('branchSelect');
                branchSelect.innerHTML = '';
                
                const branches = response.output.split('\n')
                    .map(b => b.trim())
                    .filter(b => b.length > 0);
                
                this.branches = branches.map(b => {
                    const isCurrent = b.startsWith('*');
                    const name = b.replace('*', '').trim();
                    return { name, isCurrent };
                });
                
                // Add branches to select
                this.branches.forEach(branch => {
                    const option = document.createElement('option');
                    option.value = branch.name;
                    option.textContent = branch.name;
                    option.selected = branch.isCurrent;
                    branchSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error refreshing branches:', error);
        }
    }
    
    /**
     * Shows dialog to create a new branch
     */
    showCreateBranchDialog() {
        const branchName = prompt('Enter new branch name:');
        if (branchName) {
            this.createBranch(branchName);
        }
    }
    
    /**
     * Creates a new branch
     * @param {string} branchName - The name of the new branch
     */
    async createBranch(branchName) {
        try {
            const response = await this.sendCommand(`git checkout -b ${branchName}`);
            if (response.success) {
                this.showNotification(`Branch '${branchName}' created successfully`, 'success');
                this.refreshBranches();
            } else {
                this.showNotification('Failed to create branch: ' + response.error, 'error');
            }
        } catch (error) {
            console.error('Error creating branch:', error);
            this.showNotification('Error creating branch', 'error');
        }
    }
    
    /**
     * Switches to a different branch
     * @param {string} branchName - The name of the branch to switch to
     */
    async switchBranch(branchName) {
        if (!branchName) return;
        
        try {
            const response = await this.sendCommand(`git checkout ${branchName}`);
            if (response.success) {
                this.showNotification(`Switched to branch '${branchName}'`, 'success');
                this.refreshChanges();
                this.refreshCommitHistory();
            } else {
                this.showNotification('Failed to switch branch: ' + response.error, 'error');
                // Reset the select to the current branch
                this.refreshBranches();
            }
        } catch (error) {
            console.error('Error switching branch:', error);
            this.showNotification('Error switching branch', 'error');
            this.refreshBranches();
        }
    }
    
    /**
     * Refreshes the list of changed files
     */
    async refreshChanges() {
        try {
            const response = await this.sendCommand('git status --porcelain');
            if (response.success) {
                const changedFilesList = document.getElementById('changedFilesList');
                const stagedFilesList = document.getElementById('stagedFilesList');
                
                changedFilesList.innerHTML = '';
                stagedFilesList.innerHTML = '';
                
                this.changedFiles = [];
                this.stagedFiles = [];
                
                if (!response.output.trim()) {
                    changedFilesList.innerHTML = '<div class="empty-state">No changes detected</div>';
                    stagedFilesList.innerHTML = '<div class="empty-state">No staged changes</div>';
                    return;
                }
                
                const files = response.output.split('\n')
                    .filter(line => line.trim().length > 0)
                    .map(line => {
                        const status = line.substring(0, 2);
                        const filename = line.substring(3);
                        const isStaged = status[0] !== ' ' && status[0] !== '?';
                        const isUnstaged = status[1] !== ' ';
                        
                        return { filename, status, isStaged, isUnstaged };
                    });
                
                // Separate staged and unstaged files
                this.stagedFiles = files.filter(f => f.isStaged);
                this.changedFiles = files.filter(f => f.isUnstaged || (!f.isStaged && status[0] === '?'));
                
                // Populate changed files list
                if (this.changedFiles.length === 0) {
                    changedFilesList.innerHTML = '<div class="empty-state">No unstaged changes</div>';
                } else {
                    this.changedFiles.forEach(file => {
                        const fileItem = document.createElement('div');
                        fileItem.className = 'file-item';
                        fileItem.innerHTML = `
                            <span class="file-status ${this.getStatusClass(file.status)}"></span>
                            <span class="file-name">${file.filename}</span>
                            <button class="file-action stage-btn"><i class="fas fa-plus"></i></button>
                        `;
                        
                        // Add event listener to stage button
                        fileItem.querySelector('.stage-btn').addEventListener('click', () => {
                            this.stageFile(file.filename);
                        });
                        
                        changedFilesList.appendChild(fileItem);
                    });
                }
                
                // Populate staged files list
                if (this.stagedFiles.length === 0) {
                    stagedFilesList.innerHTML = '<div class="empty-state">No staged changes</div>';
                } else {
                    this.stagedFiles.forEach(file => {
                        const fileItem = document.createElement('div');
                        fileItem.className = 'file-item';
                        fileItem.innerHTML = `
                            <span class="file-status ${this.getStatusClass(file.status)}"></span>
                            <span class="file-name">${file.filename}</span>
                            <button class="file-action unstage-btn"><i class="fas fa-minus"></i></button>
                        `;
                        
                        // Add event listener to unstage button
                        fileItem.querySelector('.unstage-btn').addEventListener('click', () => {
                            this.unstageFile(file.filename);
                        });
                        
                        stagedFilesList.appendChild(fileItem);
                    });
                }
                
                // Update button states
                document.getElementById('stageAllChanges').disabled = this.changedFiles.length === 0;
                document.getElementById('unstageAllChanges').disabled = this.stagedFiles.length === 0;
                document.getElementById('commitChanges').disabled = this.stagedFiles.length === 0;
            }
        } catch (error) {
            console.error('Error refreshing changes:', error);
        }
    }
    
    /**
     * Gets the CSS class for a file status
     * @param {string} status - The Git status code
     * @returns {string} - The CSS class
     */
    getStatusClass(status) {
        if (status.includes('A')) return 'added';
        if (status.includes('M')) return 'modified';
        if (status.includes('D')) return 'deleted';
        if (status.includes('R')) return 'renamed';
        if (status.includes('C')) return 'copied';
        if (status.includes('U')) return 'updated';
        if (status.includes('?')) return 'untracked';
        return 'unknown';
    }
    
    /**
     * Stages a single file
     * @param {string} filename - The file to stage
     */
    async stageFile(filename) {
        try {
            const response = await this.sendCommand(`git add "${filename}"`);
            if (response.success) {
                this.showNotification(`Staged '${filename}'`, 'success');
                this.refreshChanges();
            } else {
                this.showNotification('Failed to stage file: ' + response.error, 'error');
            }
        } catch (error) {
            console.error('Error staging file:', error);
            this.showNotification('Error staging file', 'error');
        }
    }
    
    /**
     * Unstages a single file
     * @param {string} filename - The file to unstage
     */
    async unstageFile(filename) {
        try {
            const response = await this.sendCommand(`git reset HEAD "${filename}"`);
            if (response.success) {
                this.showNotification(`Unstaged '${filename}'`, 'success');
                this.refreshChanges();
            } else {
                this.showNotification('Failed to unstage file: ' + response.error, 'error');
            }
        } catch (error) {
            console.error('Error unstaging file:', error);
            this.showNotification('Error unstaging file', 'error');
        }
    }
    
    /**
     * Stages all changed files
     */
    async stageAllChanges() {
        try {
            const response = await this.sendCommand('git add .');
            if (response.success) {
                this.showNotification('Staged all changes', 'success');
                this.refreshChanges();
            } else {
                this.showNotification('Failed to stage changes: ' + response.error, 'error');
            }
        } catch (error) {
            console.error('Error staging changes:', error);
            this.showNotification('Error staging changes', 'error');
        }
    }
    
    /**
     * Unstages all files
     */
    async unstageAllChanges() {
        try {
            const response = await this.sendCommand('git reset HEAD');
            if (response.success) {
                this.showNotification('Unstaged all changes', 'success');
                this.refreshChanges();
            } else {
                this.showNotification('Failed to unstage changes: ' + response.error, 'error');
            }
        } catch (error) {
            console.error('Error unstaging changes:', error);
            this.showNotification('Error unstaging changes', 'error');
        }
    }
    
    /**
     * Commits staged changes
     */
    async commitStagedChanges() {
        const message = document.getElementById('commitMessage').value.trim();
        if (!message) {
            this.showNotification('Please enter a commit message', 'warning');
            return;
        }
        
        try {
            const response = await this.sendCommand(`git commit -m "${message}"`);
            if (response.success) {
                this.showNotification('Changes committed successfully', 'success');
                document.getElementById('commitMessage').value = '';
                this.refreshChanges();
                this.refreshCommitHistory();
            } else {
                this.showNotification('Failed to commit changes: ' + response.error, 'error');
            }
        } catch (error) {
            console.error('Error committing changes:', error);
            this.showNotification('Error committing changes', 'error');
        }
    }
    
    /**
     * Sets the remote repository URL
     */
    async setRemoteUrl() {
        const url = document.getElementById('remoteUrl').value.trim();
        if (!url) {
            this.showNotification('Please enter a remote URL', 'warning');
            return;
        }
        
        try {
            // Check if remote exists
            const checkResponse = await this.sendCommand('git remote');
            let command = '';
            
            if (checkResponse.success && checkResponse.output.includes('origin')) {
                command = `git remote set-url origin ${url}`;
            } else {
                command = `git remote add origin ${url}`;
            }
            
            const response = await this.sendCommand(command);
            if (response.success) {
                this.showNotification('Remote URL set successfully', 'success');
            } else {
                this.showNotification('Failed to set remote URL: ' + response.error, 'error');
            }
        } catch (error) {
            console.error('Error setting remote URL:', error);
            this.showNotification('Error setting remote URL', 'error');
        }
    }
    
    /**
     * Pulls changes from the remote repository
     */
    async pullChanges() {
        try {
            this.showNotification('Pulling changes...', 'info');
            const response = await this.sendCommand('git pull');
            if (response.success) {
                this.showNotification('Changes pulled successfully', 'success');
                this.refreshChanges();
                this.refreshCommitHistory();
            } else {
                this.showNotification('Failed to pull changes: ' + response.error, 'error');
            }
        } catch (error) {
            console.error('Error pulling changes:', error);
            this.showNotification('Error pulling changes', 'error');
        }
    }
    
    /**
     * Pushes local commits to the remote repository
     */
    async pushChanges() {
        try {
            this.showNotification('Pushing changes...', 'info');
            const response = await this.sendCommand('git push');
            if (response.success) {
                this.showNotification('Changes pushed successfully', 'success');
            } else {
                this.showNotification('Failed to push changes: ' + response.error, 'error');
            }
        } catch (error) {
            console.error('Error pushing changes:', error);
            this.showNotification('Error pushing changes', 'error');
        }
    }
    
    /**
     * Refreshes the commit history
     */
    async refreshCommitHistory() {
        try {
            const response = await this.sendCommand('git log --pretty=format:"%h|%an|%ar|%s" -10');
            const historyList = document.getElementById('commitHistoryList');
            
            if (response.success && response.output.trim()) {
                historyList.innerHTML = '';
                
                const commits = response.output.split('\n')
                    .filter(line => line.trim().length > 0)
                    .map(line => {
                        const [hash, author, time, subject] = line.split('|');
                        return { hash, author, time, subject };
                    });
                
                this.commitHistory = commits;
                
                commits.forEach(commit => {
                    const commitItem = document.createElement('div');
                    commitItem.className = 'commit-item';
                    commitItem.innerHTML = `
                        <div class="commit-header">
                            <span class="commit-hash">${commit.hash}</span>
                            <span class="commit-time">${commit.time}</span>
                        </div>
                        <div class="commit-subject">${commit.subject}</div>
                        <div class="commit-author">${commit.author}</div>
                    `;
                    
                    historyList.appendChild(commitItem);
                });
            } else {
                historyList.innerHTML = '<div class="empty-state">No commit history</div>';
            }
        } catch (error) {
            console.error('Error refreshing commit history:', error);
        }
    }
    
    /**
     * Sends a Git command to the server
     * @param {string} command - The Git command to execute
     * @returns {Promise<Object>} - The command result
     */
    async sendCommand(command) {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject(new Error('Socket not connected'));
                return;
            }
            
            this.socket.emit('git-command', {
                roomId: this.roomId,
                command: command
            }, (response) => {
                resolve(response);
            });
        });
    }
    
    /**
     * Shows a notification message
     * @param {string} message - The message to show
     * @param {string} type - The notification type (success, error, warning, info)
     */
    showNotification(message, type = 'info') {
        // Use the platform's notification system if available
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
            
            // Create a simple notification if the platform doesn't have one
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('show');
            }, 10);
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }
    }
}

// Initialize version control when the document is ready
function initializeVersionControl(socket, roomId, username) {
    const versionControl = new VersionControl(socket, roomId, username);
    return versionControl;
}

// Export the initialization function
window.initializeVersionControl = initializeVersionControl;