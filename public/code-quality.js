// Code Quality Metrics System
class CodeQualityMetrics {
    constructor(editor, socket, roomId, username) {
        this.editor = editor;
        this.socket = socket;
        this.roomId = roomId;
        this.username = username;
        this.qualityPanel = null;
        this.currentMetrics = null;
        this.qualityHistory = [];
        
        this.init();
    }
    
    init() {
        this.setupQualityUI();
        this.setupEventListeners();
        this.setupSocketListeners();
    }
    
    setupQualityUI() {
        // Create quality metrics panel
        this.qualityPanel = document.createElement('div');
        this.qualityPanel.id = 'codeQualityPanel';
        this.qualityPanel.className = 'code-quality-panel';
        this.qualityPanel.innerHTML = `
            <div class="quality-header">
                <h3><i class="fas fa-chart-line"></i> Code Quality</h3>
                <button id="closeQualityPanel" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="quality-content">
                <div class="quality-controls">
                    <button id="analyzeCode" class="btn-primary">
                        <i class="fas fa-search"></i> Analyze Current File
                    </button>
                    <button id="analyzeAllFiles" class="btn-secondary">
                        <i class="fas fa-folder"></i> Analyze All Files
                    </button>
                    <button id="refreshQuality" class="btn-secondary">
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                </div>
                
                <div class="quality-tabs">
                    <button class="tab-btn active" data-tab="overview">
                        <i class="fas fa-tachometer-alt"></i> Overview
                    </button>
                    <button class="tab-btn" data-tab="issues">
                        <i class="fas fa-exclamation-triangle"></i> Issues
                    </button>
                    <button class="tab-btn" data-tab="suggestions">
                        <i class="fas fa-lightbulb"></i> Suggestions
                    </button>
                    <button class="tab-btn" data-tab="trends">
                        <i class="fas fa-chart-area"></i> Trends
                    </button>
                </div>
                
                <div class="quality-tab-content">
                    <!-- Overview Tab -->
                    <div class="tab-content active" id="overviewTab">
                        <div class="quality-metrics-grid">
                            <div class="metric-card">
                                <div class="metric-header">
                                    <h4>Complexity</h4>
                                    <i class="fas fa-cogs"></i>
                                </div>
                                <div class="metric-value" id="complexityScore">-</div>
                                <div class="metric-bar">
                                    <div class="metric-fill" id="complexityBar"></div>
                                </div>
                                <div class="metric-description">Code complexity score</div>
                            </div>
                            
                            <div class="metric-card">
                                <div class="metric-header">
                                    <h4>Maintainability</h4>
                                    <i class="fas fa-tools"></i>
                                </div>
                                <div class="metric-value" id="maintainabilityScore">-</div>
                                <div class="metric-bar">
                                    <div class="metric-fill" id="maintainabilityBar"></div>
                                </div>
                                <div class="metric-description">How easy to maintain</div>
                            </div>
                            
                            <div class="metric-card">
                                <div class="metric-header">
                                    <h4>Readability</h4>
                                    <i class="fas fa-eye"></i>
                                </div>
                                <div class="metric-value" id="readabilityScore">-</div>
                                <div class="metric-bar">
                                    <div class="metric-fill" id="readabilityBar"></div>
                                </div>
                                <div class="metric-description">Code readability score</div>
                            </div>
                            
                            <div class="metric-card">
                                <div class="metric-header">
                                    <h4>Lines of Code</h4>
                                    <i class="fas fa-file-code"></i>
                                </div>
                                <div class="metric-value" id="linesOfCode">-</div>
                                <div class="metric-description">Total lines of code</div>
                            </div>
                            
                            <div class="metric-card">
                                <div class="metric-header">
                                    <h4>Cyclomatic Complexity</h4>
                                    <i class="fas fa-project-diagram"></i>
                                </div>
                                <div class="metric-value" id="cyclomaticComplexity">-</div>
                                <div class="metric-description">Control flow complexity</div>
                            </div>
                            
                            <div class="metric-card">
                                <div class="metric-header">
                                    <h4>Code Duplication</h4>
                                    <i class="fas fa-copy"></i>
                                </div>
                                <div class="metric-value" id="codeDuplication">-</div>
                                <div class="metric-bar">
                                    <div class="metric-fill" id="duplicationBar"></div>
                                </div>
                                <div class="metric-description">Percentage of duplicated code</div>
                            </div>
                        </div>
                        
                        <div class="quality-summary">
                            <h4>Quality Summary</h4>
                            <div id="qualitySummary" class="summary-content">
                                <p>Click "Analyze Current File" to see code quality metrics.</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Issues Tab -->
                    <div class="tab-content" id="issuesTab">
                        <div class="issues-header">
                            <h4>Code Issues</h4>
                            <div class="issues-filters">
                                <select id="issueTypeFilter">
                                    <option value="all">All Issues</option>
                                    <option value="error">Errors</option>
                                    <option value="warning">Warnings</option>
                                    <option value="info">Info</option>
                                </select>
                            </div>
                        </div>
                        <div id="issuesList" class="issues-list">
                            <div class="empty-state">No issues found. Click "Analyze Current File" to check for issues.</div>
                        </div>
                    </div>
                    
                    <!-- Suggestions Tab -->
                    <div class="tab-content" id="suggestionsTab">
                        <div class="suggestions-header">
                            <h4>Improvement Suggestions</h4>
                            <div class="suggestions-filters">
                                <select id="suggestionPriorityFilter">
                                    <option value="all">All Priorities</option>
                                    <option value="high">High Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="low">Low Priority</option>
                                </select>
                            </div>
                        </div>
                        <div id="suggestionsList" class="suggestions-list">
                            <div class="empty-state">No suggestions available. Click "Analyze Current File" to get suggestions.</div>
                        </div>
                    </div>
                    
                    <!-- Trends Tab -->
                    <div class="tab-content" id="trendsTab">
                        <div class="trends-header">
                            <h4>Quality Trends</h4>
                            <div class="trends-controls">
                                <select id="trendsTimeRange">
                                    <option value="7">Last 7 days</option>
                                    <option value="30">Last 30 days</option>
                                    <option value="90">Last 90 days</option>
                                </select>
                            </div>
                        </div>
                        <div id="trendsChart" class="trends-chart">
                            <div class="empty-state">No trend data available. Analyze files to see trends.</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add to main layout
        const mainLayout = document.querySelector('.main-layout');
        if (mainLayout) {
            mainLayout.appendChild(this.qualityPanel);
        }
    }
    
    setupEventListeners() {
        // Close button
        document.getElementById('closeQualityPanel').addEventListener('click', () => {
            this.close();
        });
        
        // Analyze buttons
        document.getElementById('analyzeCode').addEventListener('click', () => {
            this.analyzeCurrentFile();
        });
        
        document.getElementById('analyzeAllFiles').addEventListener('click', () => {
            this.analyzeAllFiles();
        });
        
        document.getElementById('refreshQuality').addEventListener('click', () => {
            this.refreshQuality();
        });
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Filters
        document.getElementById('issueTypeFilter').addEventListener('change', () => {
            this.filterIssues();
        });
        
        document.getElementById('suggestionPriorityFilter').addEventListener('change', () => {
            this.filterSuggestions();
        });
        
        document.getElementById('trendsTimeRange').addEventListener('change', () => {
            this.loadTrends();
        });
    }
    
    setupSocketListeners() {
        if (!this.socket) return;
        
        // Listen for quality analysis updates
        this.socket.on('quality-analysis-complete', (data) => {
            this.handleQualityAnalysisComplete(data);
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
            case 'trends':
                this.loadTrends();
                break;
        }
    }
    
    async analyzeCurrentFile() {
        if (!this.editor || !currentFile) {
            this.showNotification('No file selected for analysis', 'warning');
            return;
        }
        
        const code = this.editor.getValue();
        const language = this.getFileLanguage(currentFile);
        
        this.showNotification('Analyzing code quality...', 'info');
        
        try {
            const response = await fetch('/api/quality/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code,
                    language,
                    fileName: currentFile
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentMetrics = data.metrics;
                this.updateQualityDisplay();
                this.showNotification('Code analysis complete!', 'success');
            } else {
                this.showNotification(data.error || 'Failed to analyze code', 'error');
            }
        } catch (error) {
            console.error('Error analyzing code:', error);
            this.showNotification('Failed to analyze code', 'error');
        }
    }
    
    async analyzeAllFiles() {
        this.showNotification('Analyzing all files...', 'info');
        
        // This would analyze all files in the room
        // For now, we'll just analyze the current file
        this.analyzeCurrentFile();
    }
    
    async refreshQuality() {
        if (this.currentMetrics) {
            this.analyzeCurrentFile();
        } else {
            this.showNotification('No analysis to refresh', 'warning');
        }
    }
    
    updateQualityDisplay() {
        if (!this.currentMetrics) return;
        
        const metrics = this.currentMetrics;
        
        // Update metric values
        document.getElementById('complexityScore').textContent = metrics.complexity;
        document.getElementById('maintainabilityScore').textContent = metrics.maintainability;
        document.getElementById('readabilityScore').textContent = metrics.readability;
        document.getElementById('linesOfCode').textContent = metrics.linesOfCode;
        document.getElementById('cyclomaticComplexity').textContent = metrics.cyclomaticComplexity;
        document.getElementById('codeDuplication').textContent = metrics.codeDuplication + '%';
        
        // Update progress bars
        this.updateProgressBar('complexityBar', metrics.complexity);
        this.updateProgressBar('maintainabilityBar', metrics.maintainability);
        this.updateProgressBar('readabilityBar', metrics.readability);
        this.updateProgressBar('duplicationBar', metrics.codeDuplication, true); // Inverted (lower is better)
        
        // Update quality summary
        this.updateQualitySummary(metrics);
        
        // Update issues and suggestions
        this.updateIssuesDisplay(metrics.issues);
        this.updateSuggestionsDisplay(metrics.suggestions);
    }
    
    updateProgressBar(barId, value, inverted = false) {
        const bar = document.getElementById(barId);
        if (!bar) return;
        
        const percentage = inverted ? (100 - value) : value;
        bar.style.width = percentage + '%';
        
        // Set color based on value
        let color = '#4CAF50'; // Green
        if (percentage < 30) {
            color = '#F44336'; // Red
        } else if (percentage < 60) {
            color = '#FF9800'; // Orange
        }
        
        bar.style.backgroundColor = color;
    }
    
    updateQualitySummary(metrics) {
        const summaryContainer = document.getElementById('qualitySummary');
        if (!summaryContainer) return;
        
        let summary = '';
        let overallScore = (metrics.complexity + metrics.maintainability + metrics.readability) / 3;
        
        if (overallScore >= 80) {
            summary = '<div class="summary-good"><i class="fas fa-check-circle"></i> Excellent code quality!</div>';
        } else if (overallScore >= 60) {
            summary = '<div class="summary-warning"><i class="fas fa-exclamation-triangle"></i> Good code quality with room for improvement.</div>';
        } else {
            summary = '<div class="summary-error"><i class="fas fa-times-circle"></i> Code quality needs improvement.</div>';
        }
        
        summary += `
            <div class="summary-details">
                <p><strong>Overall Score:</strong> ${Math.round(overallScore)}/100</p>
                <p><strong>Issues Found:</strong> ${metrics.issues.length}</p>
                <p><strong>Suggestions:</strong> ${metrics.suggestions.length}</p>
                <p><strong>Code Duplication:</strong> ${metrics.codeDuplication}%</p>
            </div>
        `;
        
        summaryContainer.innerHTML = summary;
    }
    
    updateIssuesDisplay(issues) {
        const issuesList = document.getElementById('issuesList');
        if (!issuesList) return;
        
        if (issues.length === 0) {
            issuesList.innerHTML = '<div class="empty-state">No issues found! 🎉</div>';
            return;
        }
        
        issuesList.innerHTML = '';
        
        issues.forEach(issue => {
            const issueElement = document.createElement('div');
            issueElement.className = `issue-item ${issue.type}`;
            issueElement.innerHTML = `
                <div class="issue-header">
                    <span class="issue-type">${issue.type.toUpperCase()}</span>
                    <span class="issue-location">Line ${issue.line}</span>
                </div>
                <div class="issue-message">${issue.message}</div>
                <div class="issue-rule">Rule: ${issue.rule}</div>
                <div class="issue-actions">
                    <button class="btn-small" onclick="codeQuality.goToLine(${issue.line})">
                        <i class="fas fa-external-link-alt"></i> Go to Line
                    </button>
                </div>
            `;
            
            issuesList.appendChild(issueElement);
        });
    }
    
    updateSuggestionsDisplay(suggestions) {
        const suggestionsList = document.getElementById('suggestionsList');
        if (!suggestionsList) return;
        
        if (suggestions.length === 0) {
            suggestionsList.innerHTML = '<div class="empty-state">No suggestions available.</div>';
            return;
        }
        
        suggestionsList.innerHTML = '';
        
        suggestions.forEach(suggestion => {
            const suggestionElement = document.createElement('div');
            suggestionElement.className = `suggestion-item ${suggestion.priority}`;
            suggestionElement.innerHTML = `
                <div class="suggestion-header">
                    <span class="suggestion-type">${suggestion.type}</span>
                    <span class="suggestion-priority ${suggestion.priority}">${suggestion.priority.toUpperCase()}</span>
                </div>
                <div class="suggestion-message">${suggestion.message}</div>
                ${suggestion.line ? `<div class="suggestion-location">Line ${suggestion.line}</div>` : ''}
                <div class="suggestion-actions">
                    ${suggestion.line ? `
                        <button class="btn-small" onclick="codeQuality.goToLine(${suggestion.line})">
                            <i class="fas fa-external-link-alt"></i> Go to Line
                        </button>
                    ` : ''}
                </div>
            `;
            
            suggestionsList.appendChild(suggestionElement);
        });
    }
    
    filterIssues() {
        const filter = document.getElementById('issueTypeFilter').value;
        const issues = document.querySelectorAll('.issue-item');
        
        issues.forEach(issue => {
            if (filter === 'all' || issue.classList.contains(filter)) {
                issue.style.display = 'block';
            } else {
                issue.style.display = 'none';
            }
        });
    }
    
    filterSuggestions() {
        const filter = document.getElementById('suggestionPriorityFilter').value;
        const suggestions = document.querySelectorAll('.suggestion-item');
        
        suggestions.forEach(suggestion => {
            if (filter === 'all' || suggestion.classList.contains(filter)) {
                suggestion.style.display = 'block';
            } else {
                suggestion.style.display = 'none';
            }
        });
    }
    
    async loadTrends() {
        const timeRange = document.getElementById('trendsTimeRange').value;
        const trendsChart = document.getElementById('trendsChart');
        
        try {
            const response = await fetch(`/api/quality/trends?fileName=${currentFile}&days=${timeRange}`);
            const data = await response.json();
            
            if (data.success && data.trends.length > 0) {
                this.renderTrendsChart(data.trends);
            } else {
                trendsChart.innerHTML = '<div class="empty-state">No trend data available for the selected period.</div>';
            }
        } catch (error) {
            console.error('Error loading trends:', error);
            trendsChart.innerHTML = '<div class="empty-state">Failed to load trend data.</div>';
        }
    }
    
    renderTrendsChart(trends) {
        const trendsChart = document.getElementById('trendsChart');
        
        // Simple chart implementation (in a real app, you'd use Chart.js or similar)
        let chartHTML = '<div class="trends-chart-container">';
        
        trends.forEach(trend => {
            const date = new Date(trend.analyzedAt).toLocaleDateString();
            chartHTML += `
                <div class="trend-item">
                    <div class="trend-date">${date}</div>
                    <div class="trend-metrics">
                        <div class="trend-metric">
                            <span class="metric-label">Complexity:</span>
                            <span class="metric-value">${trend.metrics.complexity}</span>
                        </div>
                        <div class="trend-metric">
                            <span class="metric-label">Maintainability:</span>
                            <span class="metric-value">${trend.metrics.maintainability}</span>
                        </div>
                        <div class="trend-metric">
                            <span class="metric-label">Readability:</span>
                            <span class="metric-value">${trend.metrics.readability}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        chartHTML += '</div>';
        trendsChart.innerHTML = chartHTML;
    }
    
    goToLine(lineNumber) {
        if (this.editor) {
            this.editor.setPosition({ lineNumber, column: 1 });
            this.editor.revealLineInCenter(lineNumber);
            this.editor.focus();
        }
    }
    
    getFileLanguage(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        const languageMap = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'html': 'html',
            'css': 'css',
            'php': 'php',
            'sql': 'sql'
        };
        return languageMap[extension] || 'javascript';
    }
    
    handleQualityAnalysisComplete(data) {
        if (data.fileName === currentFile) {
            this.currentMetrics = data.metrics;
            this.updateQualityDisplay();
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
        this.qualityPanel.classList.add('open');
        if (this.currentMetrics) {
            this.updateQualityDisplay();
        }
    }
    
    close() {
        this.qualityPanel.classList.remove('open');
    }
}

// Export for global access
window.CodeQualityMetrics = CodeQualityMetrics;
