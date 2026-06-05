// Code Snippets Library
class SnippetsLibrary {
    constructor(socket, roomId, username) {
        this.socket = socket;
        this.roomId = roomId;
        this.username = username;
        this.snippets = [];
        this.userSnippets = [];
        this.currentFilter = 'all';
        this.currentLanguage = 'all';
        this.searchQuery = '';
        
        this.init();
    }
    
    init() {
        this.setupUI();
        this.setupEventListeners();
        this.loadSnippets();
    }
    
    setupUI() {
        // Create snippets library panel
        const snippetsPanel = document.createElement('div');
        snippetsPanel.id = 'snippetsLibraryPanel';
        snippetsPanel.className = 'snippets-library-panel';
        snippetsPanel.innerHTML = `
            <div class="snippets-header">
                <div class="snippets-title">
                    <h3><i class="fas fa-code"></i> Code Snippets</h3>
                    <button id="closeSnippetsLibrary" class="close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="snippets-controls">
                    <button id="addSnippet" class="btn-primary">
                        <i class="fas fa-plus"></i> Add Snippet
                    </button>
                    <button id="refreshSnippets" class="btn-secondary">
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                </div>
            </div>
            
            <div class="snippets-filters">
                <div class="search-container">
                    <input type="text" id="snippetSearch" placeholder="Search snippets...">
                    <i class="fas fa-search"></i>
                </div>
                <div class="filter-controls">
                    <select id="languageFilter">
                        <option value="all">All Languages</option>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="php">PHP</option>
                        <option value="sql">SQL</option>
                    </select>
                    <select id="categoryFilter">
                        <option value="all">All Categories</option>
                        <option value="public">Public</option>
                        <option value="my">My Snippets</option>
                        <option value="favorites">Favorites</option>
                    </select>
                </div>
            </div>
            
            <div class="snippets-tabs">
                <button class="tab-btn active" data-tab="browse">
                    <i class="fas fa-th-large"></i> Browse
                </button>
                <button class="tab-btn" data-tab="my-snippets">
                    <i class="fas fa-user"></i> My Snippets
                </button>
                <button class="tab-btn" data-tab="favorites">
                    <i class="fas fa-heart"></i> Favorites
                </button>
            </div>
            
            <div class="snippets-content">
                <div class="tab-content active" id="browseTab">
                    <div id="snippetsList" class="snippets-list"></div>
                </div>
                <div class="tab-content" id="mySnippetsTab">
                    <div id="mySnippetsList" class="snippets-list"></div>
                </div>
                <div class="tab-content" id="favoritesTab">
                    <div id="favoritesList" class="snippets-list"></div>
                </div>
            </div>
        `;
        
        // Add to main layout
        const mainLayout = document.querySelector('.main-layout');
        if (mainLayout) {
            mainLayout.appendChild(snippetsPanel);
        }
    }
    
    setupEventListeners() {
        // Close button
        document.getElementById('closeSnippetsLibrary').addEventListener('click', () => {
            this.close();
        });
        
        // Add snippet button
        document.getElementById('addSnippet').addEventListener('click', () => {
            this.showAddSnippetModal();
        });
        
        // Refresh button
        document.getElementById('refreshSnippets').addEventListener('click', () => {
            this.loadSnippets();
        });
        
        // Search input
        document.getElementById('snippetSearch').addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.filterSnippets();
        });
        
        // Language filter
        document.getElementById('languageFilter').addEventListener('change', (e) => {
            this.currentLanguage = e.target.value;
            this.filterSnippets();
        });
        
        // Category filter
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.filterSnippets();
        });
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
    }
    
    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab content
        document.getElementById(`${tabName}Tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Load appropriate snippets
        switch(tabName) {
            case 'browse':
                this.loadSnippets();
                break;
            case 'my-snippets':
                this.loadUserSnippets();
                break;
            case 'favorites':
                this.loadFavoriteSnippets();
                break;
        }
    }
    
    async loadSnippets() {
        try {
            const response = await fetch('/api/snippets');
            const data = await response.json();
            
            if (data.success) {
                this.snippets = data.snippets;
                this.renderSnippets();
            }
        } catch (error) {
            console.error('Error loading snippets:', error);
            this.showError('Failed to load snippets');
        }
    }
    
    async loadUserSnippets() {
        try {
            const response = await fetch(`/api/snippets/user/${this.username}`);
            const data = await response.json();
            
            if (data.success) {
                this.userSnippets = data.snippets;
                this.renderUserSnippets();
            }
        } catch (error) {
            console.error('Error loading user snippets:', error);
            this.showError('Failed to load your snippets');
        }
    }
    
    async loadFavoriteSnippets() {
        // This would load user's favorite snippets
        // For now, we'll show a placeholder
        const favoritesList = document.getElementById('favoritesList');
        favoritesList.innerHTML = '<div class="empty-state">No favorite snippets yet</div>';
    }
    
    renderSnippets() {
        const snippetsList = document.getElementById('snippetsList');
        snippetsList.innerHTML = '';
        
        if (this.snippets.length === 0) {
            snippetsList.innerHTML = '<div class="empty-state">No snippets found</div>';
            return;
        }
        
        this.snippets.forEach(snippet => {
            const snippetElement = this.createSnippetElement(snippet);
            snippetsList.appendChild(snippetElement);
        });
    }
    
    renderUserSnippets() {
        const mySnippetsList = document.getElementById('mySnippetsList');
        mySnippetsList.innerHTML = '';
        
        if (this.userSnippets.length === 0) {
            mySnippetsList.innerHTML = '<div class="empty-state">You haven\'t created any snippets yet</div>';
            return;
        }
        
        this.userSnippets.forEach(snippet => {
            const snippetElement = this.createSnippetElement(snippet, true);
            mySnippetsList.appendChild(snippetElement);
        });
    }
    
    createSnippetElement(snippet, isOwner = false) {
        const snippetDiv = document.createElement('div');
        snippetDiv.className = 'snippet-item';
        snippetDiv.innerHTML = `
            <div class="snippet-header">
                <div class="snippet-title">
                    <h4>${snippet.title}</h4>
                    <span class="snippet-language">${snippet.language}</span>
                </div>
                <div class="snippet-actions">
                    <button class="btn-icon" onclick="snippetsLibrary.useSnippet('${snippet._id}')" title="Use Snippet">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn-icon" onclick="snippetsLibrary.copySnippet('${snippet._id}')" title="Copy Code">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn-icon" onclick="snippetsLibrary.toggleFavorite('${snippet._id}')" title="Add to Favorites">
                        <i class="fas fa-heart"></i>
                    </button>
                    ${isOwner ? `
                        <button class="btn-icon" onclick="snippetsLibrary.editSnippet('${snippet._id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon danger" onclick="snippetsLibrary.deleteSnippet('${snippet._id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="snippet-description">
                ${snippet.description || 'No description provided'}
            </div>
            <div class="snippet-code">
                <pre><code class="language-${snippet.language}">${this.escapeHtml(snippet.code)}</code></pre>
            </div>
            <div class="snippet-footer">
                <div class="snippet-tags">
                    ${snippet.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="snippet-stats">
                    <span class="stat">
                        <i class="fas fa-eye"></i> ${snippet.usageCount}
                    </span>
                    <span class="stat">
                        <i class="fas fa-heart"></i> ${snippet.likes}
                    </span>
                    <span class="stat">
                        <i class="fas fa-calendar"></i> ${new Date(snippet.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        `;
        
        return snippetDiv;
    }
    
    showAddSnippetModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add New Snippet</h3>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="snippetTitle">Title</label>
                        <input type="text" id="snippetTitle" placeholder="Enter snippet title">
                    </div>
                    <div class="form-group">
                        <label for="snippetDescription">Description</label>
                        <textarea id="snippetDescription" placeholder="Enter snippet description"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="snippetLanguage">Language</label>
                        <select id="snippetLanguage">
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                            <option value="html">HTML</option>
                            <option value="css">CSS</option>
                            <option value="php">PHP</option>
                            <option value="sql">SQL</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="snippetCode">Code</label>
                        <textarea id="snippetCode" rows="10" placeholder="Enter your code here"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="snippetTags">Tags (comma-separated)</label>
                        <input type="text" id="snippetTags" placeholder="e.g., function, utility, helper">
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="snippetPublic">
                            <span class="checkmark"></span>
                            Make this snippet public
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button class="btn-primary" onclick="snippetsLibrary.saveSnippet()">Save Snippet</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    async saveSnippet() {
        const title = document.getElementById('snippetTitle').value;
        const description = document.getElementById('snippetDescription').value;
        const language = document.getElementById('snippetLanguage').value;
        const code = document.getElementById('snippetCode').value;
        const tags = document.getElementById('snippetTags').value.split(',').map(tag => tag.trim());
        const isPublic = document.getElementById('snippetPublic').checked;
        
        if (!title || !code) {
            this.showError('Title and code are required');
            return;
        }
        
        try {
            const response = await fetch('/api/snippets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    description,
                    language,
                    code,
                    tags,
                    isPublic,
                    userId: this.username
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Snippet saved successfully');
                document.querySelector('.modal').remove();
                this.loadSnippets();
            } else {
                this.showError(data.error || 'Failed to save snippet');
            }
        } catch (error) {
            console.error('Error saving snippet:', error);
            this.showError('Failed to save snippet');
        }
    }
    
    async useSnippet(snippetId) {
        try {
            const snippet = this.snippets.find(s => s._id === snippetId) || 
                           this.userSnippets.find(s => s._id === snippetId);
            
            if (snippet) {
                // Insert code into editor
                if (window.editor) {
                    const position = window.editor.getPosition();
                    window.editor.executeEdits('insert-snippet', [{
                        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                        text: snippet.code
                    }]);
                }
                
                // Increment usage count
                await fetch(`/api/snippets/${snippetId}/use`, { method: 'POST' });
                
                this.showSuccess('Snippet inserted into editor');
            }
        } catch (error) {
            console.error('Error using snippet:', error);
            this.showError('Failed to use snippet');
        }
    }
    
    async copySnippet(snippetId) {
        try {
            const snippet = this.snippets.find(s => s._id === snippetId) || 
                           this.userSnippets.find(s => s._id === snippetId);
            
            if (snippet) {
                await navigator.clipboard.writeText(snippet.code);
                this.showSuccess('Code copied to clipboard');
            }
        } catch (error) {
            console.error('Error copying snippet:', error);
            this.showError('Failed to copy snippet');
        }
    }
    
    async toggleFavorite(snippetId) {
        // This would toggle favorite status
        this.showSuccess('Added to favorites');
    }
    
    async editSnippet(snippetId) {
        // This would open edit modal
        this.showSuccess('Edit functionality coming soon');
    }
    
    async deleteSnippet(snippetId) {
        if (confirm('Are you sure you want to delete this snippet?')) {
            try {
                const response = await fetch(`/api/snippets/${snippetId}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.showSuccess('Snippet deleted successfully');
                    this.loadUserSnippets();
                } else {
                    this.showError(data.error || 'Failed to delete snippet');
                }
            } catch (error) {
                console.error('Error deleting snippet:', error);
                this.showError('Failed to delete snippet');
            }
        }
    }
    
    filterSnippets() {
        let filteredSnippets = this.snippets;
        
        // Filter by search query
        if (this.searchQuery) {
            filteredSnippets = filteredSnippets.filter(snippet =>
                snippet.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                snippet.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                snippet.code.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                snippet.tags.some(tag => tag.toLowerCase().includes(this.searchQuery.toLowerCase()))
            );
        }
        
        // Filter by language
        if (this.currentLanguage !== 'all') {
            filteredSnippets = filteredSnippets.filter(snippet => snippet.language === this.currentLanguage);
        }
        
        // Filter by category
        if (this.currentFilter === 'public') {
            filteredSnippets = filteredSnippets.filter(snippet => snippet.isPublic);
        } else if (this.currentFilter === 'my') {
            filteredSnippets = this.userSnippets;
        }
        
        // Render filtered snippets
        const snippetsList = document.getElementById('snippetsList');
        snippetsList.innerHTML = '';
        
        if (filteredSnippets.length === 0) {
            snippetsList.innerHTML = '<div class="empty-state">No snippets match your criteria</div>';
            return;
        }
        
        filteredSnippets.forEach(snippet => {
            const snippetElement = this.createSnippetElement(snippet);
            snippetsList.appendChild(snippetElement);
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    open() {
        const panel = document.getElementById('snippetsLibraryPanel');
        if (panel) {
            panel.classList.add('open');
        }
    }
    
    close() {
        const panel = document.getElementById('snippetsLibraryPanel');
        if (panel) {
            panel.classList.remove('open');
        }
    }
}

// Export for global access
window.SnippetsLibrary = SnippetsLibrary;
