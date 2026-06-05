// AI-Powered Code Assistant
// Provides intelligent code completion, suggestions, review, and more

class AICodeAssistant {
    constructor(editor, socket, roomId, username) {
        this.editor = editor;
        this.socket = socket;
        this.roomId = roomId;
        this.username = username;
        this.isEnabled = false;
        this.apiKey = null; // Will be set by user or loaded from config
        this.suggestionDelay = 500; // ms delay before requesting suggestions
        this.suggestionTimeout = null;
        this.lastSuggestionQuery = '';
        this.currentSuggestions = [];
        this.suggestionWidget = null;
        this.reviewInProgress = false;
        this.codeExplanationPanel = null;

        // Initialize the assistant
        this.init();
    }

    init() {
        this.createUI();
        this.setupEventListeners();
        this.setupSocketListeners();

        // Check for API key in localStorage
        this.apiKey = localStorage.getItem('aiAssistantApiKey');
        if (this.apiKey) {
            this.enableAssistant();
        } else {
            this.promptForApiKey();
        }
    }

    createUI() {
        // Create the main panel for AI Assistant
        this.createMainPanel();

        // Create suggestion widget
        this.createSuggestionWidget();

        // Create code explanation panel
        this.createCodeExplanationPanel();

        // Add toolbar button
        this.addToolbarButton();
    }

    createMainPanel() {
        const panel = document.createElement('div');
        panel.id = 'aiAssistantPanel';
        panel.className = 'ai-assistant-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <h3><i class="fas fa-robot"></i> AI Code Assistant</h3>
                <button id="closeAiAssistant" class="panel-close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="panel-content">
                <div class="assistant-tabs">
                    <button class="tab-btn active" data-tab="suggestions">Suggestions</button>
                    <button class="tab-btn" data-tab="review">Code Review</button>
                    <button class="tab-btn" data-tab="explain">Explain Code</button>
                    <button class="tab-btn" data-tab="refactor">Refactor</button>
                </div>
                <div class="tab-content active" id="suggestionsTab">
                    <div class="suggestions-controls">
                        <button id="requestSuggestions" class="assistant-btn">
                            <i class="fas fa-lightbulb"></i> Get Suggestions
                        </button>
                        <div class="toggle-container">
                            <label for="autoSuggestToggle">Auto-suggest</label>
                            <label class="switch">
                                <input type="checkbox" id="autoSuggestToggle">
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>
                    <div id="suggestionsList" class="suggestions-list">
                        <div class="empty-state">
                            <i class="fas fa-lightbulb"></i>
                            <p>Type in the editor to get code suggestions</p>
                        </div>
                    </div>
                </div>
                <div class="tab-content" id="reviewTab">
                    <div class="review-controls">
                        <button id="startCodeReview" class="assistant-btn">
                            <i class="fas fa-check-double"></i> Review Current File
                        </button>
                    </div>
                    <div id="reviewResults" class="review-results">
                        <div class="empty-state">
                            <i class="fas fa-check-double"></i>
                            <p>Click the button above to start a code review</p>
                        </div>
                    </div>
                </div>
                <div class="tab-content" id="explainTab">
                    <div class="explain-controls">
                        <button id="explainSelection" class="assistant-btn">
                            <i class="fas fa-info-circle"></i> Explain Selected Code
                        </button>
                    </div>
                    <div id="explanationResults" class="explanation-results">
                        <div class="empty-state">
                            <i class="fas fa-info-circle"></i>
                            <p>Select code in the editor and click the button above to get an explanation</p>
                        </div>
                    </div>
                </div>
                <div class="tab-content" id="refactorTab">
                    <div class="refactor-controls">
                        <button id="suggestRefactoring" class="assistant-btn">
                            <i class="fas fa-magic"></i> Suggest Refactoring
                        </button>
                    </div>
                    <div id="refactoringResults" class="refactoring-results">
                        <div class="empty-state">
                            <i class="fas fa-magic"></i>
                            <p>Click the button above to get refactoring suggestions</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="panel-footer">
                <div class="api-key-section">
                    <button id="updateApiKey" class="small-btn">
                        <i class="fas fa-key"></i> Update API Key
                    </button>
                    <span id="apiKeyStatus"></span>
                </div>
                <div class="assistant-status">
                    <span id="assistantStatusIndicator" class="status-indicator"></span>
                    <span id="assistantStatusText">Ready</span>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
        this.panel = panel;

        // Initially hide the panel
        panel.style.display = 'none';
    }

    createSuggestionWidget() {
        // This will be created dynamically when needed
        // Monaco editor has built-in suggestion widget capabilities
    }

    createCodeExplanationPanel() {
        const panel = document.createElement('div');
        panel.id = 'codeExplanationPanel';
        panel.className = 'code-explanation-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <h3><i class="fas fa-info-circle"></i> Code Explanation</h3>
                <button id="closeExplanation" class="panel-close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="explanation-content" id="explanationContent"></div>
        `;

        document.body.appendChild(panel);
        this.codeExplanationPanel = panel;

        // Initially hide the panel
        panel.style.display = 'none';
    }

    addToolbarButton() {
        // Check if the toolbar exists
        const toolbar = document.querySelector('.toolbar');
        if (!toolbar) return;

        // Create the button
        const button = document.createElement('button');
        button.id = 'toggleAiAssistant';
        button.className = 'feature-toggle';
        button.innerHTML = '<i class="fas fa-robot"></i> AI Assistant';

        // Add the button to the toolbar
        toolbar.appendChild(button);
    }

    setupEventListeners() {
        // Toggle AI Assistant panel
        const toggleButton = document.getElementById('toggleAiAssistant');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.togglePanel());
        }

        // Close panel button
        const closeButton = document.getElementById('closeAiAssistant');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.hidePanel());
        }

        // Tab switching
        const tabButtons = document.querySelectorAll('.assistant-tabs .tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Remove active class from all tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

                // Add active class to clicked tab
                e.target.classList.add('active');
                const tabName = e.target.getAttribute('data-tab');
                document.getElementById(`${tabName}Tab`).classList.add('active');
            });
        });

        // API Key update
        const updateApiKeyButton = document.getElementById('updateApiKey');
        if (updateApiKeyButton) {
            updateApiKeyButton.addEventListener('click', () => this.promptForApiKey());
        }

        // Auto-suggest toggle
        const autoSuggestToggle = document.getElementById('autoSuggestToggle');
        if (autoSuggestToggle) {
            autoSuggestToggle.addEventListener('change', (e) => {
                this.toggleAutoSuggest(e.target.checked);
            });
        }

        // Request suggestions button
        const requestSuggestionsButton = document.getElementById('requestSuggestions');
        if (requestSuggestionsButton) {
            requestSuggestionsButton.addEventListener('click', () => this.requestCodeSuggestions());
        }

        // Start code review button
        const startCodeReviewButton = document.getElementById('startCodeReview');
        if (startCodeReviewButton) {
            startCodeReviewButton.addEventListener('click', () => this.startCodeReview());
        }

        // Explain selection button
        const explainSelectionButton = document.getElementById('explainSelection');
        if (explainSelectionButton) {
            explainSelectionButton.addEventListener('click', () => this.explainSelectedCode());
        }

        // Suggest refactoring button
        const suggestRefactoringButton = document.getElementById('suggestRefactoring');
        if (suggestRefactoringButton) {
            suggestRefactoringButton.addEventListener('click', () => this.suggestCodeRefactoring());
        }

        // Close explanation panel
        const closeExplanationButton = document.getElementById('closeExplanation');
        if (closeExplanationButton) {
            closeExplanationButton.addEventListener('click', () => this.hideExplanationPanel());
        }

        // Editor content change event for auto-suggestions
        if (this.editor) {
            this.editor.onDidChangeModelContent(() => {
                if (this.isEnabled && document.getElementById('autoSuggestToggle').checked) {
                    this.debounceSuggestionRequest();
                }
            });
        }
    }

    setupSocketListeners() {
        if (!this.socket) return;

        // Listen for AI assistant events from other users
        this.socket.on('ai-suggestion-shared', (data) => {
            if (data.roomId === this.roomId && data.socketId !== this.socket.id) {
                this.displaySharedSuggestion(data);
            }
        });

        this.socket.on('ai-review-shared', (data) => {
            if (data.roomId === this.roomId && data.socketId !== this.socket.id) {
                this.displaySharedReview(data);
            }
        });
    }

    togglePanel() {
        if (this.panel.style.display === 'none') {
            this.showPanel();
        } else {
            this.hidePanel();
        }
    }

    showPanel() {
        this.panel.style.display = 'block';
    }

    hidePanel() {
        this.panel.style.display = 'none';
    }

    promptForApiKey() {
        const currentKey = this.apiKey || '';
        const apiKey = prompt('Enter your AI Assistant API Key:', currentKey);

        if (apiKey !== null) { // User didn't cancel
            this.setApiKey(apiKey);
        }
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('aiAssistantApiKey', apiKey);

        // Update status indicator
        const statusIndicator = document.getElementById('apiKeyStatus');
        if (statusIndicator) {
            if (apiKey) {
                statusIndicator.textContent = 'API Key: ✓';
                statusIndicator.className = 'status-success';
                this.enableAssistant();
            } else {
                statusIndicator.textContent = 'API Key: ✗';
                statusIndicator.className = 'status-error';
                this.disableAssistant();
            }
        }
    }

    enableAssistant() {
        this.isEnabled = true;

        // Update status
        const statusIndicator = document.getElementById('assistantStatusIndicator');
        const statusText = document.getElementById('assistantStatusText');

        if (statusIndicator && statusText) {
            statusIndicator.className = 'status-indicator active';
            statusText.textContent = 'Active';
        }

        // Enable auto-suggest if checked
        const autoSuggestToggle = document.getElementById('autoSuggestToggle');
        if (autoSuggestToggle && autoSuggestToggle.checked) {
            this.toggleAutoSuggest(true);
        }
    }

    disableAssistant() {
        this.isEnabled = false;

        // Update status
        const statusIndicator = document.getElementById('assistantStatusIndicator');
        const statusText = document.getElementById('assistantStatusText');

        if (statusIndicator && statusText) {
            statusIndicator.className = 'status-indicator';
            statusText.textContent = 'Disabled';
        }
    }

    toggleAutoSuggest(enabled) {
        // This will be handled by the editor content change event
        console.log(`Auto-suggest ${enabled ? 'enabled' : 'disabled'}`);
    }

    debounceSuggestionRequest() {
        // Clear any existing timeout
        if (this.suggestionTimeout) {
            clearTimeout(this.suggestionTimeout);
        }

        // Set a new timeout
        this.suggestionTimeout = setTimeout(() => {
            this.requestCodeSuggestions();
        }, this.suggestionDelay);
    }

    async requestCodeSuggestions() {
        if (!this.isEnabled || !this.apiKey) return;

        try {
            // Get current editor content and cursor position
            const model = this.editor.getModel();
            if (!model) return;

            const content = model.getValue();
            const position = this.editor.getPosition();

            // Get the file extension to determine language
            const fileName = window.currentFile || '';
            const fileExtension = fileName.split('.').pop() || 'js';

            // Get the content up to the cursor position
            const contentUpToCursor = model.getValueInRange({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            });

            // Check if the query is the same as the last one
            if (contentUpToCursor === this.lastSuggestionQuery) return;
            this.lastSuggestionQuery = contentUpToCursor;

            // Update status
            this.updateStatus('Generating suggestions...', 'pending');

            // Make API request to get suggestions
            const response = await fetch('/api/ai/suggest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    code: content,
                    language: fileExtension,
                    cursorPosition: position,
                    prefix: contentUpToCursor
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            const data = await response.json();

            // Process and display suggestions
            this.processSuggestions(data.suggestions);

            // Update status
            this.updateStatus('Suggestions ready', 'success');

        } catch (error) {
            console.error('Error getting code suggestions:', error);
            this.updateStatus(`Error: ${error.message}`, 'error');
        }
    }

    processSuggestions(suggestions) {
        this.currentSuggestions = suggestions;

        // Display suggestions in the panel
        const suggestionsList = document.getElementById('suggestionsList');
        if (!suggestionsList) return;

        if (!suggestions || suggestions.length === 0) {
            suggestionsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-info-circle"></i>
                    <p>No suggestions available for current code</p>
                </div>
            `;
            return;
        }

        // Create suggestion elements
        let suggestionsHTML = '';
        suggestions.forEach((suggestion, index) => {
            suggestionsHTML += `
                <div class="suggestion-item">
                    <div class="suggestion-header">
                        <span class="suggestion-type">${suggestion.type}</span>
                        <div class="suggestion-actions">
                            <button class="apply-suggestion" data-index="${index}">
                                <i class="fas fa-check"></i> Apply
                            </button>
                            <button class="share-suggestion" data-index="${index}">
                                <i class="fas fa-share"></i> Share
                            </button>
                        </div>
                    </div>
                    <pre class="suggestion-code">${this.escapeHTML(suggestion.code)}</pre>
                </div>
            `;
        });

        suggestionsList.innerHTML = suggestionsHTML;

        // Add event listeners to buttons
        const applyButtons = suggestionsList.querySelectorAll('.apply-suggestion');
        applyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.applySuggestion(index);
            });
        });

        const shareButtons = suggestionsList.querySelectorAll('.share-suggestion');
        shareButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.shareSuggestion(index);
            });
        });
    }

    applySuggestion(index) {
        const suggestion = this.currentSuggestions[index];
        if (!suggestion) return;

        // Apply the suggestion to the editor
        const position = this.editor.getPosition();
        const range = suggestion.range || {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column
        };

        // Create an edit operation
        const edit = {
            range: range,
            text: suggestion.code,
            forceMoveMarkers: true
        };

        // Execute the edit
        this.editor.executeEdits('ai-suggestion', [edit]);

        // Update status
        this.updateStatus('Suggestion applied', 'success');
    }

    shareSuggestion(index) {
        const suggestion = this.currentSuggestions[index];
        if (!suggestion || !this.socket) return;

        // Emit the suggestion to other users in the room
        this.socket.emit('ai-suggestion-shared', {
            roomId: this.roomId,
            socketId: this.socket.id,
            username: this.username,
            suggestion: suggestion,
            fileName: window.currentFile || ''
        });

        // Update status
        this.updateStatus('Suggestion shared with room', 'success');
    }

    displaySharedSuggestion(data) {
        // Create a notification
        this.showNotification(`${data.username} shared a code suggestion`, 'info');

        // Add to suggestions list if panel is open
        if (this.panel.style.display !== 'none') {
            const suggestionsList = document.getElementById('suggestionsList');
            if (!suggestionsList) return;

            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item shared';
            suggestionItem.innerHTML = `
                <div class="suggestion-header">
                    <span class="suggestion-type">${data.suggestion.type}</span>
                    <span class="shared-by">Shared by ${data.username}</span>
                    <div class="suggestion-actions">
                        <button class="apply-shared-suggestion">
                            <i class="fas fa-check"></i> Apply
                        </button>
                    </div>
                </div>
                <pre class="suggestion-code">${this.escapeHTML(data.suggestion.code)}</pre>
            `;

            // Add to the top of the list
            if (suggestionsList.firstChild) {
                suggestionsList.insertBefore(suggestionItem, suggestionsList.firstChild);
            } else {
                suggestionsList.appendChild(suggestionItem);
            }

            // Add event listener to apply button
            const applyButton = suggestionItem.querySelector('.apply-shared-suggestion');
            if (applyButton) {
                applyButton.addEventListener('click', () => {
                    // Apply the shared suggestion
                    const position = this.editor.getPosition();
                    const range = data.suggestion.range || {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column
                    };

                    // Create an edit operation
                    const edit = {
                        range: range,
                        text: data.suggestion.code,
                        forceMoveMarkers: true
                    };

                    // Execute the edit
                    this.editor.executeEdits('ai-suggestion', [edit]);
                });
            }
        }
    }

    async startCodeReview() {
        if (!this.isEnabled || !this.apiKey || this.reviewInProgress) return;

        try {
            this.reviewInProgress = true;

            // Get current editor content
            const model = this.editor.getModel();
            if (!model) return;

            const content = model.getValue();

            // Get the file extension to determine language
            const fileName = window.currentFile || '';
            const fileExtension = fileName.split('.').pop() || 'js';

            // Update status
            this.updateStatus('Reviewing code...', 'pending');

            // Update review results with loading state
            const reviewResults = document.getElementById('reviewResults');
            if (reviewResults) {
                reviewResults.innerHTML = `
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p>Analyzing code...</p>
                    </div>
                `;
            }

            // Make API request to get code review
            const response = await fetch('/api/ai/review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    code: content,
                    language: fileExtension,
                    fileName: fileName
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            const data = await response.json();

            // Process and display review results
            this.processReviewResults(data.review);

            // Update status
            this.updateStatus('Code review completed', 'success');

        } catch (error) {
            console.error('Error during code review:', error);
            this.updateStatus(`Error: ${error.message}`, 'error');

            // Update review results with error
            const reviewResults = document.getElementById('reviewResults');
            if (reviewResults) {
                reviewResults.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Error during code review: ${error.message}</p>
                    </div>
                `;
            }
        } finally {
            this.reviewInProgress = false;
        }
    }

    processReviewResults(review) {
            // Display review results in the panel
            const reviewResults = document.getElementById('reviewResults');
            if (!reviewResults) return;

            if (!review || (!review.issues && !review.suggestions)) {
                reviewResults.innerHTML = `
                <div class="success-state">
                    <i class="fas fa-check-circle"></i>
                    <p>No issues found in your code!</p>
                </div>
            `;
                return;
            }

            // Create review elements
            let reviewHTML = '';

            // Add summary section
            reviewHTML += `
            <div class="review-summary">
                <h4>Code Review Summary</h4>
                <div class="review-metrics">
                    <div class="metric">
                        <span class="metric-value">${review.issues?.length || 0}</span>
                        <span class="metric-label">Issues</span>
                    </div>
                    <div class="metric">
                        <span class="metric-value">${review.suggestions?.length || 0}</span>
                        <span class="metric-label">Suggestions</span>
                    </div>
                    <div class="metric">
                        <span class="metric-value">${review.score || 'N/A'}</span>
                        <span class="metric-label">Score</span>
                    </div>
                </div>
                <div class="review-actions">
                    <button id="shareReview" class="assistant-btn">
                        <i class="fas fa-share"></i> Share Review
                    </button>
                </div>
            </div>
        `;

            // Add issues section
            if (review.issues && review.issues.length > 0) {
                reviewHTML += `<div class="review-section"><h4>Issues</h4>`;

                review.issues.forEach((issue, index) => {
                            reviewHTML += `
                    <div class="review-item issue">
                        <div class="review-item-header">
                            <span class="issue-severity ${issue.severity}">${issue.severity}</span>
                            <span class="issue-location">${issue.location || 'Unknown location'}</span>
                            <div class="review-item-actions">
                                <button class="goto-issue" data-line="${issue.line}">
                                    <i class="fas fa-arrow-right"></i> Go to
                                </button>
                                <button class="fix-issue" data-index="${index}">
                                    <i class="fas fa-wrench"></i> Fix
                                </button>
                            </div>
                        </div>
                        <div class="review-item-content">
                            <p class="issue-description">${issue.description}</p>
                            ${issue.code ? `<pre class="issue-code">${this.escapeHTML(issue.code)}</pre>` : ''}
                        </div>
                    </div>
                `;
            });
            
            reviewHTML += `</div>`;
        }
        
        // Add suggestions section
        if (review.suggestions && review.suggestions.length > 0) {
            reviewHTML += `<div class="review-section"><h4>Suggestions</h4>`;
            
            review.suggestions.forEach((suggestion, index) => {
                reviewHTML += `
                    <div class="review-item suggestion">
                        <div class="review-item-header">
                            <span class="suggestion-type">${suggestion.type || 'Improvement'}</span>
                            <span class="suggestion-location">${suggestion.location || 'General'}</span>
                            <div class="review-item-actions">
                                ${suggestion.line ? `
                                    <button class="goto-suggestion" data-line="${suggestion.line}">
                                        <i class="fas fa-arrow-right"></i> Go to
                                    </button>
                                ` : ''}
                                ${suggestion.fix ? `
                                    <button class="apply-suggestion" data-index="${index}">
                                        <i class="fas fa-check"></i> Apply
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <div class="review-item-content">
                            <p class="suggestion-description">${suggestion.description}</p>
                            ${suggestion.before ? `
                                <div class="code-diff">
                                    <div class="diff-before">
                                        <span class="diff-label">Before:</span>
                                        <pre>${this.escapeHTML(suggestion.before)}</pre>
                                    </div>
                                    <div class="diff-after">
                                        <span class="diff-label">After:</span>
                                        <pre>${this.escapeHTML(suggestion.after || suggestion.fix || '')}</pre>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            });
            
            reviewHTML += `</div>`;
        }
        
        reviewResults.innerHTML = reviewHTML;
        
        // Add event listeners
        const gotoIssueButtons = reviewResults.querySelectorAll('.goto-issue');
        gotoIssueButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const line = parseInt(e.target.getAttribute('data-line'));
                if (line) this.gotoLine(line);
            });
        });
        
        const fixIssueButtons = reviewResults.querySelectorAll('.fix-issue');
        fixIssueButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.fixIssue(review.issues[index]);
            });
        });
        
        const gotoSuggestionButtons = reviewResults.querySelectorAll('.goto-suggestion');
        gotoSuggestionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const line = parseInt(e.target.getAttribute('data-line'));
                if (line) this.gotoLine(line);
            });
        });
        
        const applySuggestionButtons = reviewResults.querySelectorAll('.apply-suggestion');
        applySuggestionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.applySuggestionFix(review.suggestions[index]);
            });
        });
        
        const shareReviewButton = document.getElementById('shareReview');
        if (shareReviewButton) {
            shareReviewButton.addEventListener('click', () => {
                this.shareReview(review);
            });
        }
    }
    
    gotoLine(line) {
        if (!this.editor || !line) return;
        
        // Reveal the line in the editor
        this.editor.revealLineInCenter(line);
        
        // Set cursor position to the beginning of the line
        this.editor.setPosition({ lineNumber: line, column: 1 });
        
        // Focus the editor
        this.editor.focus();
    }
    
    fixIssue(issue) {
        if (!issue || !issue.fix) {
            this.showNotification('No automatic fix available for this issue', 'warning');
            return;
        }
        
        // Apply the fix to the editor
        const line = issue.line || 1;
        const model = this.editor.getModel();
        if (!model) return;
        
        // Get the content of the line
        const lineContent = model.getLineContent(line);
        
        // Create a range for the line
        const range = {
            startLineNumber: line,
            startColumn: 1,
            endLineNumber: line,
            endColumn: lineContent.length + 1
        };
        
        // Create an edit operation
        const edit = {
            range: range,
            text: issue.fix,
            forceMoveMarkers: true
        };
        
        // Execute the edit
        this.editor.executeEdits('ai-fix', [edit]);
        
        // Update status
        this.updateStatus('Issue fixed', 'success');
    }
    
    applySuggestionFix(suggestion) {
        if (!suggestion || (!suggestion.fix && !suggestion.after)) {
            this.showNotification('No automatic fix available for this suggestion', 'warning');
            return;
        }
        
        const fix = suggestion.fix || suggestion.after;
        const line = suggestion.line || 1;
        const model = this.editor.getModel();
        if (!model) return;
        
        // If we have a specific range, use it
        if (suggestion.range) {
            const edit = {
                range: suggestion.range,
                text: fix,
                forceMoveMarkers: true
            };
            
            // Execute the edit
            this.editor.executeEdits('ai-suggestion', [edit]);
        } else {
            // Otherwise, replace the entire line
            const lineContent = model.getLineContent(line);
            
            const range = {
                startLineNumber: line,
                startColumn: 1,
                endLineNumber: line,
                endColumn: lineContent.length + 1
            };
            
            const edit = {
                range: range,
                text: fix,
                forceMoveMarkers: true
            };
            
            // Execute the edit
            this.editor.executeEdits('ai-suggestion', [edit]);
        }
        
        // Update status
        this.updateStatus('Suggestion applied', 'success');
    }
    
    shareReview(review) {
        if (!review || !this.socket) return;
        
        // Emit the review to other users in the room
        this.socket.emit('ai-review-shared', {
            roomId: this.roomId,
            socketId: this.socket.id,
            username: this.username,
            review: review,
            fileName: window.currentFile || ''
        });
        
        // Update status
        this.updateStatus('Review shared with room', 'success');
    }
    
    displaySharedReview(data) {
        // Create a notification
        this.showNotification(`${data.username} shared a code review for ${data.fileName}`, 'info');
        
        // We could implement a more complex UI to show shared reviews
        // For now, just show a notification and let the user know
    }
    
    async explainSelectedCode() {
        if (!this.isEnabled || !this.apiKey) return;
        
        try {
            // Get selected text from editor
            const selection = this.editor.getSelection();
            const model = this.editor.getModel();
            if (!model || !selection) return;
            
            const selectedText = model.getValueInRange(selection);
            
            if (!selectedText || selectedText.trim() === '') {
                this.showNotification('Please select some code to explain', 'warning');
                return;
            }
            
            // Get the file extension to determine language
            const fileName = window.currentFile || '';
            const fileExtension = fileName.split('.').pop() || 'js';
            
            // Update status
            this.updateStatus('Generating explanation...', 'pending');
            
            // Update explanation results with loading state
            const explanationResults = document.getElementById('explanationResults');
            if (explanationResults) {
                explanationResults.innerHTML = `
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p>Analyzing code...</p>
                    </div>
                `;
            }
            
            // Make API request to get code explanation
            const response = await fetch('/api/ai/explain', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    code: selectedText,
                    language: fileExtension,
                    fileName: fileName
                })
            });
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Process and display explanation
            this.processExplanation(data.explanation, selectedText);
            
            // Update status
            this.updateStatus('Explanation generated', 'success');
            
        } catch (error) {
            console.error('Error explaining code:', error);
            this.updateStatus(`Error: ${error.message}`, 'error');
            
            // Update explanation results with error
            const explanationResults = document.getElementById('explanationResults');
            if (explanationResults) {
                explanationResults.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Error generating explanation: ${error.message}</p>
                    </div>
                `;
            }
        }
    }
    
    processExplanation(explanation, code) {
        // Display explanation in the panel
        const explanationResults = document.getElementById('explanationResults');
        if (!explanationResults) return;
        
        if (!explanation) {
            explanationResults.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>No explanation generated</p>
                </div>
            `;
            return;
        }
        
        // Create explanation element
        let explanationHTML = `
            <div class="explanation-container">
                <div class="explanation-header">
                    <h4>Code Explanation</h4>
                    <div class="explanation-actions">
                        <button id="showInPanel" class="assistant-btn">
                            <i class="fas fa-external-link-alt"></i> Show in Panel
                        </button>
                    </div>
                </div>
                <div class="explanation-content">
                    <div class="code-section">
                        <h5>Code</h5>
                        <pre class="code-block">${this.escapeHTML(code)}</pre>
                    </div>
                    <div class="explanation-section">
                        <h5>Explanation</h5>
                        <div class="explanation-text">${explanation.html || explanation.text}</div>
                    </div>
                </div>
            </div>
        `;
        
        explanationResults.innerHTML = explanationHTML;
        
        // Add event listener to show in panel button
        const showInPanelButton = document.getElementById('showInPanel');
        if (showInPanelButton) {
            showInPanelButton.addEventListener('click', () => {
                this.showExplanationInPanel(explanation, code);
            });
        }
    }
    
    showExplanationInPanel(explanation, code) {
        if (!this.codeExplanationPanel) return;
        
        // Update the panel content
        const explanationContent = document.getElementById('explanationContent');
        if (!explanationContent) return;
        
        explanationContent.innerHTML = `
            <div class="explanation-container">
                <div class="code-section">
                    <h5>Code</h5>
                    <pre class="code-block">${this.escapeHTML(code)}</pre>
                </div>
                <div class="explanation-section">
                    <h5>Explanation</h5>
                    <div class="explanation-text">${explanation.html || explanation.text}</div>
                </div>
            </div>
        `;
        
        // Show the panel
        this.codeExplanationPanel.style.display = 'block';
    }
    
    hideExplanationPanel() {
        if (this.codeExplanationPanel) {
            this.codeExplanationPanel.style.display = 'none';
        }
    }
    
    async suggestCodeRefactoring() {
        if (!this.isEnabled || !this.apiKey) return;
        
        try {
            // Get current editor content
            const model = this.editor.getModel();
            if (!model) return;
            
            const content = model.getValue();
            
            // Get the file extension to determine language
            const fileName = window.currentFile || '';
            const fileExtension = fileName.split('.').pop() || 'js';
            
            // Update status
            this.updateStatus('Analyzing code for refactoring...', 'pending');
            
            // Update refactoring results with loading state
            const refactoringResults = document.getElementById('refactoringResults');
            if (refactoringResults) {
                refactoringResults.innerHTML = `
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p>Analyzing code...</p>
                    </div>
                `;
            }
            
            // Make API request to get refactoring suggestions
            const response = await fetch('/api/ai/refactor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    code: content,
                    language: fileExtension,
                    fileName: fileName
                })
            });
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Process and display refactoring suggestions
            this.processRefactoringSuggestions(data.refactorings);
            
            // Update status
            this.updateStatus('Refactoring suggestions ready', 'success');
            
        } catch (error) {
            console.error('Error getting refactoring suggestions:', error);
            this.updateStatus(`Error: ${error.message}`, 'error');
            
            // Update refactoring results with error
            const refactoringResults = document.getElementById('refactoringResults');
            if (refactoringResults) {
                refactoringResults.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Error generating refactoring suggestions: ${error.message}</p>
                    </div>
                `;
            }
        }
    }
    
    processRefactoringSuggestions(refactorings) {
        // Display refactoring suggestions in the panel
        const refactoringResults = document.getElementById('refactoringResults');
        if (!refactoringResults) return;
        
        if (!refactorings || refactorings.length === 0) {
            refactoringResults.innerHTML = `
                <div class="success-state">
                    <i class="fas fa-check-circle"></i>
                    <p>No refactoring suggestions found. Your code looks good!</p>
                </div>
            `;
            return;
        }
        
        // Create refactoring elements
        let refactoringHTML = `
            <div class="refactoring-summary">
                <h4>Refactoring Suggestions</h4>
                <p>${refactorings.length} potential improvements found</p>
            </div>
        `;
        
        refactorings.forEach((refactoring, index) => {
            refactoringHTML += `
                <div class="refactoring-item">
                    <div class="refactoring-header">
                        <span class="refactoring-type">${refactoring.type || 'Refactoring'}</span>
                        <span class="refactoring-location">${refactoring.location || 'General'}</span>
                        <div class="refactoring-actions">
                            ${refactoring.line ? `
                                <button class="goto-refactoring" data-line="${refactoring.line}">
                                    <i class="fas fa-arrow-right"></i> Go to
                                </button>
                            ` : ''}
                            ${refactoring.refactoredCode ? `
                                <button class="apply-refactoring" data-index="${index}">
                                    <i class="fas fa-check"></i> Apply
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="refactoring-content">
                        <p class="refactoring-description">${refactoring.description}</p>
                        ${refactoring.originalCode ? `
                            <div class="code-diff">
                                <div class="diff-before">
                                    <span class="diff-label">Original:</span>
                                    <pre>${this.escapeHTML(refactoring.originalCode)}</pre>
                                </div>
                                <div class="diff-after">
                                    <span class="diff-label">Refactored:</span>
                                    <pre>${this.escapeHTML(refactoring.refactoredCode || '')}</pre>
                                </div>
                            </div>
                        ` : ''}
                        ${refactoring.benefits ? `
                            <div class="refactoring-benefits">
                                <h5>Benefits:</h5>
                                <ul>
                                    ${refactoring.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        refactoringResults.innerHTML = refactoringHTML;
        
        // Add event listeners
        const gotoRefactoringButtons = refactoringResults.querySelectorAll('.goto-refactoring');
        gotoRefactoringButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const line = parseInt(e.target.getAttribute('data-line'));
                if (line) this.gotoLine(line);
            });
        });
        
        const applyRefactoringButtons = refactoringResults.querySelectorAll('.apply-refactoring');
        applyRefactoringButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.applyRefactoring(refactorings[index]);
            });
        });
    }
    
    applyRefactoring(refactoring) {
        if (!refactoring || !refactoring.refactoredCode) {
            this.showNotification('No refactored code available', 'warning');
            return;
        }
        
        // Apply the refactoring to the editor
        const model = this.editor.getModel();
        if (!model) return;
        
        // If we have a specific range, use it
        if (refactoring.range) {
            const edit = {
                range: refactoring.range,
                text: refactoring.refactoredCode,
                forceMoveMarkers: true
            };
            
            // Execute the edit
            this.editor.executeEdits('ai-refactoring', [edit]);
        } else if (refactoring.startLine && refactoring.endLine) {
            // If we have start and end lines, create a range
            const startLineContent = model.getLineContent(refactoring.startLine);
            const endLineContent = model.getLineContent(refactoring.endLine);
            
            const range = {
                startLineNumber: refactoring.startLine,
                startColumn: 1,
                endLineNumber: refactoring.endLine,
                endColumn: endLineContent.length + 1
            };
            
            const edit = {
                range: range,
                text: refactoring.refactoredCode,
                forceMoveMarkers: true
            };
            
            // Execute the edit
            this.editor.executeEdits('ai-refactoring', [edit]);
        } else {
            // Otherwise, we might need to replace the entire file
            // This is dangerous, so let's show a confirmation dialog
            if (confirm('This refactoring will replace the entire file. Continue?')) {
                const range = {
                    startLineNumber: 1,
                    startColumn: 1,
                    endLineNumber: model.getLineCount(),
                    endColumn: model.getLineMaxColumn(model.getLineCount())
                };
                
                const edit = {
                    range: range,
                    text: refactoring.refactoredCode,
                    forceMoveMarkers: true
                };
                
                // Execute the edit
                this.editor.executeEdits('ai-refactoring', [edit]);
            } else {
                return;
            }
        }
        
        // Update status
        this.updateStatus('Refactoring applied', 'success');
    }
    
    updateStatus(message, type = 'info') {
        const statusIndicator = document.getElementById('assistantStatusIndicator');
        const statusText = document.getElementById('assistantStatusText');
        
        if (statusIndicator && statusText) {
            statusIndicator.className = `status-indicator ${type}`;
            statusText.textContent = message;
            
            // Reset status after a delay for success/error messages
            if (type === 'success' || type === 'error') {
                setTimeout(() => {
                    statusIndicator.className = 'status-indicator active';
                    statusText.textContent = 'Active';
                }, 3000);
            }
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getIconForType(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Add close button event listener
        const closeButton = notification.querySelector('.notification-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                notification.remove();
            });
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 5000);
    }
    
    getIconForType(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            case 'info':
            default: return 'fa-info-circle';
        }
    }
    
    escapeHTML(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

// Initialize the AI Code Assistant when the editor is ready
document.addEventListener('editorReady', (event) => {
    const { editor, socket, roomId, username } = event.detail;
    if (editor && socket) {
        window.aiCodeAssistant = new AICodeAssistant(editor, socket, roomId, username);
        console.log('AI Code Assistant initialized');
    }
});

// Add CSS for AI Assistant
const aiAssistantStyles = document.createElement('style');
aiAssistantStyles.textContent = `
    /* AI Assistant Panel */
    .ai-assistant-panel {
        position: absolute;
        top: 60px;
        right: 20px;
        width: 400px;
        max-height: 80vh;
        background-color: var(--panel-bg);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        z-index: 1000;
        overflow: hidden;
    }
    
    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background-color: var(--header-bg);
        border-bottom: 1px solid var(--border-color);
    }
    
    .panel-header h3 {
        margin: 0;
        font-size: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .panel-close-btn {
        background: none;
        border: none;
        color: var(--text-color);
        cursor: pointer;
        font-size: 16px;
        padding: 4px;
    }
    
    .panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
    }
    
    .panel-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background-color: var(--header-bg);
        border-top: 1px solid var(--border-color);
    }
    
    /* Tabs */
    .assistant-tabs {
        display: flex;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: 16px;
    }
    
    .tab-btn {
        padding: 8px 16px;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--text-color);
        cursor: pointer;
        font-size: 14px;
    }
    
    .tab-btn.active {
        border-bottom-color: var(--accent-color);
        font-weight: bold;
    }
    
    .tab-content {
        display: none;
    }
    
    .tab-content.active {
        display: block;
    }
    
    /* Controls */
    .suggestions-controls,
    .review-controls,
    .explain-controls,
    .refactor-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }
    
    .assistant-btn {
        padding: 8px 12px;
        background-color: var(--accent-color);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    
    .assistant-btn:hover {
        background-color: var(--accent-hover);
    }
    
    .small-btn {
        padding: 4px 8px;
        background-color: transparent;
        color: var(--text-color);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
    }
    
    .small-btn:hover {
        background-color: var(--hover-bg);
    }
    
    /* Toggle Switch */
    .toggle-container {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .switch {
        position: relative;
        display: inline-block;
        width: 40px;
        height: 20px;
    }
    
    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }
    
    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
        border-radius: 34px;
    }
    
    .slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 2px;
        bottom: 2px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
    }
    
    input:checked + .slider {
        background-color: var(--accent-color);
    }
    
    input:checked + .slider:before {
        transform: translateX(20px);
    }
    
    /* Suggestions List */
    .suggestions-list {
        max-height: 400px;
        overflow-y: auto;
    }
    
    .suggestion-item {
        margin-bottom: 16px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        overflow: hidden;
    }
    
    .suggestion-item.shared {
        border-left: 3px solid var(--accent-color);
    }
    
    .suggestion-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background-color: var(--header-bg);
        border-bottom: 1px solid var(--border-color);
    }
    
    .suggestion-type {
        font-size: 12px;
        font-weight: bold;
        padding: 2px 6px;
        background-color: var(--accent-color);
        color: white;
        border-radius: 4px;
    }
    
    .shared-by {
        font-size: 12px;
        color: var(--text-muted);
        font-style: italic;
    }
    
    .suggestion-actions {
        display: flex;
        gap: 8px;
    }
    
    .suggestion-code {
        padding: 12px;
        margin: 0;
        background-color: var(--code-bg);
        font-family: monospace;
        font-size: 13px;
        white-space: pre-wrap;
        overflow-x: auto;
    }
    
    /* Review Results */
    .review-results {
        max-height: 400px;
        overflow-y: auto;
    }
    
    .review-summary {
        margin-bottom: 16px;
        padding: 12px;
        background-color: var(--header-bg);
        border-radius: 6px;
    }
    
    .review-metrics {
        display: flex;
        justify-content: space-around;
        margin: 12px 0;
    }
    
    .metric {
        text-align: center;
    }
    
    .metric-value {
        font-size: 24px;
        font-weight: bold;
        display: block;
    }
    
    .metric-label {
        font-size: 12px;
        color: var(--text-muted);
    }
    
    .review-section {
        margin-bottom: 16px;
    }
    
    .review-section h4 {
        margin-top: 0;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border-color);
    }
    
    .review-item {
        margin-bottom: 16px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        overflow: hidden;
    }
    
    .review-item.issue {
        border-left: 3px solid #e74c3c;
    }
    
    .review-item.suggestion {
        border-left: 3px solid #3498db;
    }
    
    .review-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background-color: var(--header-bg);
        border-bottom: 1px solid var(--border-color);
    }
    
    .issue-severity {
        font-size: 12px;
        font-weight: bold;
        padding: 2px 6px;
        color: white;
        border-radius: 4px;
    }
    
    .issue-severity.high {
        background-color: #e74c3c;
    }
    
    .issue-severity.medium {
        background-color: #f39c12;
    }
    
    .issue-severity.low {
        background-color: #3498db;
    }
    
    .issue-location,
    .suggestion-location {
        font-size: 12px;
        color: var(--text-muted);
    }
    
    .review-item-actions {
        display: flex;
        gap: 8px;
    }
    
    .review-item-content {
        padding: 12px;
    }
    
    .issue-description,
    .suggestion-description {
        margin-top: 0;
        margin-bottom: 12px;
    }
    
    .issue-code {
        padding: 8px;
        margin: 0;
        background-color: var(--code-bg);
        font-family: monospace;
        font-size: 13px;
        white-space: pre-wrap;
        overflow-x: auto;
        border-left: 3px solid #e74c3c;
    }
    
    .code-diff {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 12px;
        padding: 8px;
        background-color: var(--code-bg);
        border-radius: 4px;
    }
    
    .diff-before,
    .diff-after {
        position: relative;
    }
    
    .diff-label {
        font-size: 12px;
        font-weight: bold;
        display: block;
        margin-bottom: 4px;
    }
    
    .diff-before pre,
    .diff-after pre {
        margin: 0;
        padding: 8px;
        font-family: monospace;
        font-size: 13px;
        white-space: pre-wrap;
        overflow-x: auto;
    }
    
    .diff-before pre {
        background-color: rgba(231, 76, 60, 0.1);
        border-left: 3px solid #e74c3c;
    }
    
    .diff-after pre {
        background-color: rgba(46, 204, 113, 0.1);
        border-left: 3px solid #2ecc71;
    }
    
    /* Explanation Results */
    .explanation-results {
        max-height: 400px;
        overflow-y: auto;
    }
    
    .explanation-container {
        border: 1px solid var(--border-color);
        border-radius: 6px;
        overflow: hidden;
    }
    
    .explanation-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background-color: var(--header-bg);
        border-bottom: 1px solid var(--border-color);
    }
    
    .explanation-content {
        padding: 12px;
    }
    
    .code-section,
    .explanation-section {
        margin-bottom: 16px;
    }
    
    .code-section h5,
    .explanation-section h5 {
        margin-top: 0;
        margin-bottom: 8px;
    }
    
    .code-block {
        padding: 12px;
        margin: 0;
        background-color: var(--code-bg);
        font-family: monospace;
        font-size: 13px;
        white-space: pre-wrap;
        overflow-x: auto;
        border-radius: 4px;
    }
    
    .explanation-text {
        line-height: 1.5;
    }
    
    /* Code Explanation Panel */
    .code-explanation-panel {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80%;
        max-width: 800px;
        max-height: 80vh;
        background-color: var(--panel-bg);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        z-index: 1100;
        overflow: hidden;
    }
    
    /* Refactoring Results */
    .refactoring-results {
        max-height: 400px;
        overflow-y: auto;
    }
    
    .refactoring-summary {
        margin-bottom: 16px;
        padding: 12px;
        background-color: var(--header-bg);
        border-radius: 6px;
    }
    
    .refactoring-item {
        margin-bottom: 16px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        overflow: hidden;
        border-left: 3px solid #9b59b6;
    }
    
    .refactoring-benefits {
        margin-top: 12px;
        padding: 8px;
        background-color: rgba(155, 89, 182, 0.1);
        border-radius: 4px;
    }
    
    .refactoring-benefits h5 {
        margin-top: 0;
        margin-bottom: 8px;
    }
    
    .refactoring-benefits ul {
        margin: 0;
        padding-left: 20px;
    }
    
    /* Status Indicator */
    .status-indicator {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-right: 6px;
        background-color: #ccc;
    }
    
    .status-indicator.active {
        background-color: #2ecc71;
    }
    
    .status-indicator.pending {
        background-color: #f39c12;
    }
    
    .status-indicator.error {
        background-color: #e74c3c;
    }
    
    .status-indicator.success {
        background-color: #2ecc71;
    }
    
    /* API Key Status */
    .api-key-section {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .status-success {
        color: #2ecc71;
    }
    
    .status-error {
        color: #e74c3c;
    }
    
    /* Empty States */
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        text-align: center;
        color: var(--text-muted);
    }
    
    .empty-state i {
        font-size: 32px;
        margin-bottom: 12px;
    }
    
    /* Loading State */
    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        text-align: center;
    }
    
    .spinner {
        width: 30px;
        height: 30px;
        border: 3px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top-color: var(--accent-color);
        animation: spin 1s ease-in-out infinite;
        margin-bottom: 12px;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    /* Error State */
    .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        text-align: center;
        color: #e74c3c;
    }
    
    .error-state i {
        font-size: 32px;
        margin-bottom: 12px;
    }
    
    /* Success State */
    .success-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        text-align: center;
        color: #2ecc71;
    }
    
    .success-state i {
        font-size: 32px;
        margin-bottom: 12px;
    }
    
    /* Notification */
    .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 16px;
        background-color: var(--panel-bg);
        border-left: 4px solid var(--accent-color);
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 2000;
        min-width: 300px;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    }
    
    .notification.success {
        border-left-color: #2ecc71;
    }
    
    .notification.error {
        border-left-color: #e74c3c;
    }
    
    .notification.warning {
        border-left-color: #f39c12;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: var(--text-color);
        cursor: pointer;
        padding: 4px;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    /* Dark Mode Compatibility */
    [data-theme="dark"] .ai-assistant-panel {
        --panel-bg: #2d2d2d;
        --header-bg: #1e1e1e;
        --border-color: #444;
        --text-color: #eee;
        --text-muted: #aaa;
        --code-bg: #1a1a1a;
        --accent-color: #3498db;
        --accent-hover: #2980b9;
        --hover-bg: #333;
    }
    
    /* Light Mode Compatibility */
    [data-theme="light"] .ai-assistant-panel,
    :root .ai-assistant-panel {
        --panel-bg: #fff;
        --header-bg: #f5f5f5;
        --border-color: #ddd;
        --text-color: #333;
        --text-muted: #777;
        --code-bg: #f8f8f8;
        --accent-color: #3498db;
        --accent-hover: #2980b9;
        --hover-bg: #f0f0f0;
    }
}
`;

document.head.appendChild(aiAssistantStyles);
// End of file