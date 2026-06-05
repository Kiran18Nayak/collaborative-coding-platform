// Custom Themes System
class CustomThemes {
    constructor(editor, socket, roomId, username) {
        this.editor = editor;
        this.socket = socket;
        this.roomId = roomId;
        this.username = username;
        this.themesPanel = null;
        this.customThemes = [];
        this.currentTheme = 'vs-dark';
        
        this.init();
    }
    
    init() {
        this.setupThemesUI();
        this.setupEventListeners();
        this.setupSocketListeners();
        this.loadThemes();
    }
    
    setupThemesUI() {
        // Create themes panel
        this.themesPanel = document.createElement('div');
        this.themesPanel.id = 'customThemesPanel';
        this.themesPanel.className = 'custom-themes-panel';
        this.themesPanel.innerHTML = `
            <div class="themes-header">
                <h3><i class="fas fa-palette"></i> Custom Themes</h3>
                <button id="closeThemesPanel" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="themes-content">
                <div class="themes-controls">
                    <button id="createTheme" class="btn-primary">
                        <i class="fas fa-plus"></i> Create Theme
                    </button>
                    <button id="importTheme" class="btn-secondary">
                        <i class="fas fa-upload"></i> Import Theme
                    </button>
                    <button id="exportTheme" class="btn-secondary">
                        <i class="fas fa-download"></i> Export Theme
                    </button>
                </div>
                
                <div class="themes-tabs">
                    <button class="tab-btn active" data-tab="browse">
                        <i class="fas fa-th-large"></i> Browse
                    </button>
                    <button class="tab-btn" data-tab="my-themes">
                        <i class="fas fa-user"></i> My Themes
                    </button>
                    <button class="tab-btn" data-tab="editor">
                        <i class="fas fa-edit"></i> Theme Editor
                    </button>
                </div>
                
                <div class="themes-tab-content">
                    <!-- Browse Tab -->
                    <div class="tab-content active" id="browseTab">
                        <div class="themes-filters">
                            <div class="search-container">
                                <input type="text" id="themeSearch" placeholder="Search themes...">
                                <i class="fas fa-search"></i>
                            </div>
                            <div class="filter-controls">
                                <select id="themeCategoryFilter">
                                    <option value="all">All Categories</option>
                                    <option value="dark">Dark Themes</option>
                                    <option value="light">Light Themes</option>
                                    <option value="colorful">Colorful Themes</option>
                                    <option value="minimal">Minimal Themes</option>
                                </select>
                                <select id="themeLanguageFilter">
                                    <option value="all">All Languages</option>
                                    <option value="javascript">JavaScript</option>
                                    <option value="python">Python</option>
                                    <option value="java">Java</option>
                                    <option value="cpp">C++</option>
                                    <option value="html">HTML</option>
                                    <option value="css">CSS</option>
                                </select>
                            </div>
                        </div>
                        <div id="themesList" class="themes-list">
                            <div class="empty-state">Loading themes...</div>
                        </div>
                    </div>
                    
                    <!-- My Themes Tab -->
                    <div class="tab-content" id="myThemesTab">
                        <div class="my-themes-header">
                            <h4>My Custom Themes</h4>
                            <div class="my-themes-controls">
                                <button id="refreshMyThemes" class="btn-secondary">
                                    <i class="fas fa-sync"></i> Refresh
                                </button>
                            </div>
                        </div>
                        <div id="myThemesList" class="themes-list">
                            <div class="empty-state">No custom themes created yet</div>
                        </div>
                    </div>
                    
                    <!-- Theme Editor Tab -->
                    <div class="tab-content" id="editorTab">
                        <div class="theme-editor">
                            <div class="editor-header">
                                <h4>Theme Editor</h4>
                                <div class="editor-controls">
                                    <button id="saveTheme" class="btn-primary">
                                        <i class="fas fa-save"></i> Save Theme
                                    </button>
                                    <button id="previewTheme" class="btn-secondary">
                                        <i class="fas fa-eye"></i> Preview
                                    </button>
                                    <button id="resetTheme" class="btn-secondary">
                                        <i class="fas fa-undo"></i> Reset
                                    </button>
                                </div>
                            </div>
                            
                            <div class="theme-editor-content">
                                <div class="theme-basic-info">
                                    <div class="form-group">
                                        <label for="themeName">Theme Name</label>
                                        <input type="text" id="themeName" placeholder="Enter theme name">
                                    </div>
                                    <div class="form-group">
                                        <label for="themeDescription">Description</label>
                                        <textarea id="themeDescription" placeholder="Enter theme description"></textarea>
                                    </div>
                                    <div class="form-group">
                                        <label for="themeCategory">Category</label>
                                        <select id="themeCategory">
                                            <option value="dark">Dark</option>
                                            <option value="light">Light</option>
                                            <option value="colorful">Colorful</option>
                                            <option value="minimal">Minimal</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="theme-colors">
                                    <h4>Color Settings</h4>
                                    <div class="color-sections">
                                        <div class="color-section">
                                            <h5>Background Colors</h5>
                                            <div class="color-inputs">
                                                <div class="color-input">
                                                    <label for="backgroundColor">Background</label>
                                                    <input type="color" id="backgroundColor" value="#1e1e1e">
                                                </div>
                                                <div class="color-input">
                                                    <label for="foregroundColor">Foreground</label>
                                                    <input type="color" id="foregroundColor" value="#d4d4d4">
                                                </div>
                                                <div class="color-input">
                                                    <label for="selectionColor">Selection</label>
                                                    <input type="color" id="selectionColor" value="#264f78">
                                                </div>
                                                <div class="color-input">
                                                    <label for="cursorColor">Cursor</label>
                                                    <input type="color" id="cursorColor" value="#aeafad">
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="color-section">
                                            <h5>Syntax Highlighting</h5>
                                            <div class="color-inputs">
                                                <div class="color-input">
                                                    <label for="keywordColor">Keywords</label>
                                                    <input type="color" id="keywordColor" value="#569cd6">
                                                </div>
                                                <div class="color-input">
                                                    <label for="stringColor">Strings</label>
                                                    <input type="color" id="stringColor" value="#ce9178">
                                                </div>
                                                <div class="color-input">
                                                    <label for="commentColor">Comments</label>
                                                    <input type="color" id="commentColor" value="#6a9955">
                                                </div>
                                                <div class="color-input">
                                                    <label for="numberColor">Numbers</label>
                                                    <input type="color" id="numberColor" value="#b5cea8">
                                                </div>
                                                <div class="color-input">
                                                    <label for="functionColor">Functions</label>
                                                    <input type="color" id="functionColor" value="#dcdcaa">
                                                </div>
                                                <div class="color-input">
                                                    <label for="variableColor">Variables</label>
                                                    <input type="color" id="variableColor" value="#9cdcfe">
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="color-section">
                                            <h5>UI Elements</h5>
                                            <div class="color-inputs">
                                                <div class="color-input">
                                                    <label for="lineNumberColor">Line Numbers</label>
                                                    <input type="color" id="lineNumberColor" value="#858585">
                                                </div>
                                                <div class="color-input">
                                                    <label for="gutterColor">Gutter</label>
                                                    <input type="color" id="gutterColor" value="#1e1e1e">
                                                </div>
                                                <div class="color-input">
                                                    <label for="bracketColor">Brackets</label>
                                                    <input type="color" id="bracketColor" value="#ffd700">
                                                </div>
                                                <div class="color-input">
                                                    <label for="errorColor">Errors</label>
                                                    <input type="color" id="errorColor" value="#f44747">
                                                </div>
                                                <div class="color-input">
                                                    <label for="warningColor">Warnings</label>
                                                    <input type="color" id="warningColor" value="#ffcc02">
                                                </div>
                                                <div class="color-input">
                                                    <label for="infoColor">Info</label>
                                                    <input type="color" id="infoColor" value="#3794ff">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="theme-preview">
                                    <h4>Preview</h4>
                                    <div id="themePreview" class="preview-editor">
                                        <pre><code class="language-javascript">
// Theme Preview
function calculateSum(a, b) {
    // This is a comment
    const result = a + b;
    return result;
}

const numbers = [1, 2, 3, 4, 5];
const sum = calculateSum(numbers[0], numbers[1]);

console.log("Sum:", sum);
                                        </code></pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add to main layout
        const mainLayout = document.querySelector('.main-layout');
        if (mainLayout) {
            mainLayout.appendChild(this.themesPanel);
        }
    }
    
    setupEventListeners() {
        // Close button
        document.getElementById('closeThemesPanel').addEventListener('click', () => {
            this.close();
        });
        
        // Theme controls
        document.getElementById('createTheme').addEventListener('click', () => {
            this.showCreateThemeModal();
        });
        
        document.getElementById('importTheme').addEventListener('click', () => {
            this.importTheme();
        });
        
        document.getElementById('exportTheme').addEventListener('click', () => {
            this.exportTheme();
        });
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Theme editor controls
        document.getElementById('saveTheme').addEventListener('click', () => {
            this.saveTheme();
        });
        
        document.getElementById('previewTheme').addEventListener('click', () => {
            this.previewTheme();
        });
        
        document.getElementById('resetTheme').addEventListener('click', () => {
            this.resetTheme();
        });
        
        // Color input changes
        document.querySelectorAll('input[type="color"]').forEach(input => {
            input.addEventListener('change', () => {
                this.updatePreview();
            });
        });
        
        // Search and filters
        document.getElementById('themeSearch').addEventListener('input', (e) => {
            this.filterThemes();
        });
        
        document.getElementById('themeCategoryFilter').addEventListener('change', () => {
            this.filterThemes();
        });
        
        document.getElementById('themeLanguageFilter').addEventListener('change', () => {
            this.filterThemes();
        });
        
        // Refresh my themes
        document.getElementById('refreshMyThemes').addEventListener('click', () => {
            this.loadMyThemes();
        });
    }
    
    setupSocketListeners() {
        if (!this.socket) return;
        
        // Listen for theme updates
        this.socket.on('theme-created', (data) => {
            this.handleThemeCreated(data);
        });
        
        this.socket.on('theme-updated', (data) => {
            this.handleThemeUpdated(data);
        });
        
        this.socket.on('theme-deleted', (data) => {
            this.handleThemeDeleted(data);
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
        
        // Load tab-specific data
        switch(tabName) {
            case 'browse':
                this.loadThemes();
                break;
            case 'my-themes':
                this.loadMyThemes();
                break;
            case 'editor':
                this.loadThemeEditor();
                break;
        }
    }
    
    async loadThemes() {
        try {
            const response = await fetch('/api/themes');
            const data = await response.json();
            
            if (data.success) {
                this.customThemes = data.themes;
                this.renderThemes();
            }
        } catch (error) {
            console.error('Error loading themes:', error);
            this.showNotification('Failed to load themes', 'error');
        }
    }
    
    async loadMyThemes() {
        try {
            const response = await fetch(`/api/themes/user/${this.username}`);
            const data = await response.json();
            
            if (data.success) {
                this.myThemes = data.themes;
                this.renderMyThemes();
            }
        } catch (error) {
            console.error('Error loading my themes:', error);
            this.showNotification('Failed to load your themes', 'error');
        }
    }
    
    loadThemeEditor() {
        // Load default theme values
        this.loadDefaultTheme();
    }
    
    renderThemes() {
        const themesList = document.getElementById('themesList');
        themesList.innerHTML = '';
        
        if (this.customThemes.length === 0) {
            themesList.innerHTML = '<div class="empty-state">No themes found</div>';
            return;
        }
        
        this.customThemes.forEach(theme => {
            const themeElement = this.createThemeElement(theme);
            themesList.appendChild(themeElement);
        });
    }
    
    renderMyThemes() {
        const myThemesList = document.getElementById('myThemesList');
        myThemesList.innerHTML = '';
        
        if (this.myThemes && this.myThemes.length === 0) {
            myThemesList.innerHTML = '<div class="empty-state">You haven\'t created any themes yet</div>';
            return;
        }
        
        this.myThemes.forEach(theme => {
            const themeElement = this.createThemeElement(theme, true);
            myThemesList.appendChild(themeElement);
        });
    }
    
    createThemeElement(theme, isOwner = false) {
        const themeDiv = document.createElement('div');
        themeDiv.className = 'theme-item';
        themeDiv.innerHTML = `
            <div class="theme-preview">
                <div class="theme-colors">
                    <div class="color-swatch" style="background-color: ${theme.colors.background}"></div>
                    <div class="color-swatch" style="background-color: ${theme.colors.foreground}"></div>
                    <div class="color-swatch" style="background-color: ${theme.colors.selection}"></div>
                    <div class="color-swatch" style="background-color: ${theme.colors.keyword}"></div>
                    <div class="color-swatch" style="background-color: ${theme.colors.string}"></div>
                    <div class="color-swatch" style="background-color: ${theme.colors.comment}"></div>
                </div>
            </div>
            <div class="theme-info">
                <div class="theme-header">
                    <h4>${theme.name}</h4>
                    <span class="theme-category">${theme.category}</span>
                </div>
                <div class="theme-description">
                    ${theme.description || 'No description provided'}
                </div>
                <div class="theme-stats">
                    <span class="stat">
                        <i class="fas fa-download"></i> ${theme.downloads || 0}
                    </span>
                    <span class="stat">
                        <i class="fas fa-heart"></i> ${theme.likes || 0}
                    </span>
                    <span class="stat">
                        <i class="fas fa-calendar"></i> ${new Date(theme.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
            <div class="theme-actions">
                <button class="btn-primary" onclick="customThemes.applyTheme('${theme.id}')">
                    <i class="fas fa-check"></i> Apply
                </button>
                <button class="btn-secondary" onclick="customThemes.previewTheme('${theme.id}')">
                    <i class="fas fa-eye"></i> Preview
                </button>
                <button class="btn-secondary" onclick="customThemes.downloadTheme('${theme.id}')">
                    <i class="fas fa-download"></i> Download
                </button>
                ${isOwner ? `
                    <button class="btn-secondary" onclick="customThemes.editTheme('${theme.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-danger" onclick="customThemes.deleteTheme('${theme.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                ` : ''}
            </div>
        `;
        
        return themeDiv;
    }
    
    showCreateThemeModal() {
        // Switch to editor tab
        this.switchTab('editor');
        this.loadDefaultTheme();
    }
    
    loadDefaultTheme() {
        // Load default theme values
        const defaultTheme = {
            name: '',
            description: '',
            category: 'dark',
            colors: {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
                selection: '#264f78',
                cursor: '#aeafad',
                keyword: '#569cd6',
                string: '#ce9178',
                comment: '#6a9955',
                number: '#b5cea8',
                function: '#dcdcaa',
                variable: '#9cdcfe',
                lineNumber: '#858585',
                gutter: '#1e1e1e',
                bracket: '#ffd700',
                error: '#f44747',
                warning: '#ffcc02',
                info: '#3794ff'
            }
        };
        
        // Set form values
        document.getElementById('themeName').value = defaultTheme.name;
        document.getElementById('themeDescription').value = defaultTheme.description;
        document.getElementById('themeCategory').value = defaultTheme.category;
        
        // Set color values
        Object.entries(defaultTheme.colors).forEach(([key, value]) => {
            const input = document.getElementById(key + 'Color');
            if (input) {
                input.value = value;
            }
        });
        
        this.updatePreview();
    }
    
    updatePreview() {
        const preview = document.getElementById('themePreview');
        if (!preview) return;
        
        const colors = this.getCurrentThemeColors();
        
        // Apply colors to preview
        preview.style.backgroundColor = colors.background;
        preview.style.color = colors.foreground;
        
        // Update syntax highlighting in preview
        const code = preview.querySelector('code');
        if (code) {
            code.style.color = colors.foreground;
            
            // Apply syntax highlighting colors
            const keywords = code.querySelectorAll('.keyword');
            keywords.forEach(el => el.style.color = colors.keyword);
            
            const strings = code.querySelectorAll('.string');
            strings.forEach(el => el.style.color = colors.string);
            
            const comments = code.querySelectorAll('.comment');
            comments.forEach(el => el.style.color = colors.comment);
            
            const numbers = code.querySelectorAll('.number');
            numbers.forEach(el => el.style.color = colors.number);
            
            const functions = code.querySelectorAll('.function');
            functions.forEach(el => el.style.color = colors.function);
            
            const variables = code.querySelectorAll('.variable');
            variables.forEach(el => el.style.color = colors.variable);
        }
    }
    
    getCurrentThemeColors() {
        return {
            background: document.getElementById('backgroundColor').value,
            foreground: document.getElementById('foregroundColor').value,
            selection: document.getElementById('selectionColor').value,
            cursor: document.getElementById('cursorColor').value,
            keyword: document.getElementById('keywordColor').value,
            string: document.getElementById('stringColor').value,
            comment: document.getElementById('commentColor').value,
            number: document.getElementById('numberColor').value,
            function: document.getElementById('functionColor').value,
            variable: document.getElementById('variableColor').value,
            lineNumber: document.getElementById('lineNumberColor').value,
            gutter: document.getElementById('gutterColor').value,
            bracket: document.getElementById('bracketColor').value,
            error: document.getElementById('errorColor').value,
            warning: document.getElementById('warningColor').value,
            info: document.getElementById('infoColor').value
        };
    }
    
    async saveTheme() {
        const name = document.getElementById('themeName').value;
        const description = document.getElementById('themeDescription').value;
        const category = document.getElementById('themeCategory').value;
        const colors = this.getCurrentThemeColors();
        
        if (!name) {
            this.showNotification('Theme name is required', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/themes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    description,
                    category,
                    colors,
                    userId: this.username,
                    isPublic: true
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Theme saved successfully', 'success');
                this.loadMyThemes();
            } else {
                this.showNotification(data.error || 'Failed to save theme', 'error');
            }
        } catch (error) {
            console.error('Error saving theme:', error);
            this.showNotification('Failed to save theme', 'error');
        }
    }
    
    previewTheme() {
        const colors = this.getCurrentThemeColors();
        this.applyThemeColors(colors);
        this.showNotification('Theme preview applied', 'info');
    }
    
    resetTheme() {
        this.loadDefaultTheme();
        this.showNotification('Theme reset to default', 'info');
    }
    
    async applyTheme(themeId) {
        try {
            const theme = this.customThemes.find(t => t.id === themeId) || 
                         this.myThemes.find(t => t.id === themeId);
            
            if (theme) {
                this.applyThemeColors(theme.colors);
                this.currentTheme = themeId;
                
                // Save theme preference
                localStorage.setItem('selectedTheme', themeId);
                
                this.showNotification(`Applied theme: ${theme.name}`, 'success');
            }
        } catch (error) {
            console.error('Error applying theme:', error);
            this.showNotification('Failed to apply theme', 'error');
        }
    }
    
    applyThemeColors(colors) {
        if (this.editor) {
            // Apply theme to Monaco editor
            monaco.editor.defineTheme('custom-theme', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                    { token: 'keyword', foreground: colors.keyword },
                    { token: 'string', foreground: colors.string },
                    { token: 'comment', foreground: colors.comment },
                    { token: 'number', foreground: colors.number },
                    { token: 'function', foreground: colors.function },
                    { token: 'variable', foreground: colors.variable }
                ],
                colors: {
                    'editor.background': colors.background,
                    'editor.foreground': colors.foreground,
                    'editor.selectionBackground': colors.selection,
                    'editorCursor.foreground': colors.cursor,
                    'editorLineNumber.foreground': colors.lineNumber,
                    'editorGutter.background': colors.gutter,
                    'editorBracketMatch.background': colors.bracket,
                    'editorError.foreground': colors.error,
                    'editorWarning.foreground': colors.warning,
                    'editorInfo.foreground': colors.info
                }
            });
            
            monaco.editor.setTheme('custom-theme');
        }
        
        // Apply theme to UI elements
        document.documentElement.style.setProperty('--bg-color', colors.background);
        document.documentElement.style.setProperty('--text-color', colors.foreground);
        document.documentElement.style.setProperty('--selection-color', colors.selection);
    }
    
    async downloadTheme(themeId) {
        try {
            const theme = this.customThemes.find(t => t.id === themeId) || 
                         this.myThemes.find(t => t.id === themeId);
            
            if (theme) {
                const themeData = JSON.stringify(theme, null, 2);
                const blob = new Blob([themeData], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `${theme.name.replace(/\s+/g, '-').toLowerCase()}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                this.showNotification('Theme downloaded', 'success');
            }
        } catch (error) {
            console.error('Error downloading theme:', error);
            this.showNotification('Failed to download theme', 'error');
        }
    }
    
    importTheme() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const theme = JSON.parse(e.target.result);
                        this.loadThemeIntoEditor(theme);
                        this.showNotification('Theme imported successfully', 'success');
                    } catch (error) {
                        this.showNotification('Invalid theme file', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }
    
    exportTheme() {
        const colors = this.getCurrentThemeColors();
        const theme = {
            name: document.getElementById('themeName').value || 'Untitled Theme',
            description: document.getElementById('themeDescription').value || '',
            category: document.getElementById('themeCategory').value,
            colors: colors,
            createdAt: new Date().toISOString()
        };
        
        const themeData = JSON.stringify(theme, null, 2);
        const blob = new Blob([themeData], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${theme.name.replace(/\s+/g, '-').toLowerCase()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        this.showNotification('Theme exported', 'success');
    }
    
    loadThemeIntoEditor(theme) {
        document.getElementById('themeName').value = theme.name;
        document.getElementById('themeDescription').value = theme.description || '';
        document.getElementById('themeCategory').value = theme.category || 'dark';
        
        Object.entries(theme.colors).forEach(([key, value]) => {
            const input = document.getElementById(key + 'Color');
            if (input) {
                input.value = value;
            }
        });
        
        this.updatePreview();
    }
    
    filterThemes() {
        const searchQuery = document.getElementById('themeSearch').value.toLowerCase();
        const categoryFilter = document.getElementById('themeCategoryFilter').value;
        const languageFilter = document.getElementById('themeLanguageFilter').value;
        
        let filteredThemes = this.customThemes;
        
        if (searchQuery) {
            filteredThemes = filteredThemes.filter(theme =>
                theme.name.toLowerCase().includes(searchQuery) ||
                theme.description.toLowerCase().includes(searchQuery)
            );
        }
        
        if (categoryFilter !== 'all') {
            filteredThemes = filteredThemes.filter(theme => theme.category === categoryFilter);
        }
        
        // Render filtered themes
        const themesList = document.getElementById('themesList');
        themesList.innerHTML = '';
        
        if (filteredThemes.length === 0) {
            themesList.innerHTML = '<div class="empty-state">No themes match your criteria</div>';
            return;
        }
        
        filteredThemes.forEach(theme => {
            const themeElement = this.createThemeElement(theme);
            themesList.appendChild(themeElement);
        });
    }
    
    handleThemeCreated(data) {
        if (data.roomId === this.roomId) {
            this.showNotification(`${data.username} created a new theme: ${data.theme.name}`, 'info');
            this.loadThemes();
        }
    }
    
    handleThemeUpdated(data) {
        if (data.roomId === this.roomId) {
            this.showNotification(`${data.username} updated theme: ${data.theme.name}`, 'info');
            this.loadThemes();
        }
    }
    
    handleThemeDeleted(data) {
        if (data.roomId === this.roomId) {
            this.showNotification(`${data.username} deleted theme: ${data.theme.name}`, 'info');
            this.loadThemes();
        }
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
        this.themesPanel.classList.add('open');
        this.loadThemes();
    }
    
    close() {
        this.themesPanel.classList.remove('open');
    }
}

// Export for global access
window.CustomThemes = CustomThemes;
