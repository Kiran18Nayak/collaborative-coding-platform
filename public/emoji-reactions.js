// Emoji Reactions System
class EmojiReactions {
    constructor(editor, socket, roomId, username) {
        this.editor = editor;
        this.socket = socket;
        this.roomId = roomId;
        this.username = username;
        this.reactions = new Map(); // Map of lineNumber -> reactions
        this.reactionPanel = null;
        this.isReactionMode = false;
        
        this.init();
    }
    
    init() {
        this.setupReactionUI();
        this.setupEventListeners();
        this.setupSocketListeners();
    }
    
    setupReactionUI() {
        // Create reaction panel
        this.reactionPanel = document.createElement('div');
        this.reactionPanel.id = 'emojiReactionPanel';
        this.reactionPanel.className = 'emoji-reaction-panel';
        this.reactionPanel.innerHTML = `
            <div class="reaction-header">
                <h3><i class="fas fa-smile"></i> Emoji Reactions</h3>
                <button id="closeReactionPanel" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="reaction-content">
                <div class="reaction-instructions">
                    <p>Click on any line number to add an emoji reaction!</p>
                </div>
                <div class="emoji-picker">
                    <div class="emoji-category">
                        <h4>Popular</h4>
                        <div class="emoji-grid">
                            <button class="emoji-btn" data-emoji="👍">👍</button>
                            <button class="emoji-btn" data-emoji="👎">👎</button>
                            <button class="emoji-btn" data-emoji="❤️">❤️</button>
                            <button class="emoji-btn" data-emoji="😂">😂</button>
                            <button class="emoji-btn" data-emoji="😮">😮</button>
                            <button class="emoji-btn" data-emoji="😢">😢</button>
                            <button class="emoji-btn" data-emoji="😡">😡</button>
                            <button class="emoji-btn" data-emoji="🤔">🤔</button>
                        </div>
                    </div>
                    <div class="emoji-category">
                        <h4>Code Related</h4>
                        <div class="emoji-grid">
                            <button class="emoji-btn" data-emoji="🐛">🐛</button>
                            <button class="emoji-btn" data-emoji="✨">✨</button>
                            <button class="emoji-btn" data-emoji="🔥">🔥</button>
                            <button class="emoji-btn" data-emoji="💡">💡</button>
                            <button class="emoji-btn" data-emoji="🚀">🚀</button>
                            <button class="emoji-btn" data-emoji="⚡">⚡</button>
                            <button class="emoji-btn" data-emoji="🎯">🎯</button>
                            <button class="emoji-btn" data-emoji="💯">💯</button>
                        </div>
                    </div>
                    <div class="emoji-category">
                        <h4>More</h4>
                        <div class="emoji-grid">
                            <button class="emoji-btn" data-emoji="👏">👏</button>
                            <button class="emoji-btn" data-emoji="🙌">🙌</button>
                            <button class="emoji-btn" data-emoji="🎉">🎉</button>
                            <button class="emoji-btn" data-emoji="🤝">🤝</button>
                            <button class="emoji-btn" data-emoji="💪">💪</button>
                            <button class="emoji-btn" data-emoji="🎨">🎨</button>
                            <button class="emoji-btn" data-emoji="🔧">🔧</button>
                            <button class="emoji-btn" data-emoji="📝">📝</button>
                        </div>
                    </div>
                </div>
                <div class="reaction-stats">
                    <h4>Reaction Statistics</h4>
                    <div id="reactionStats" class="stats-container"></div>
                </div>
            </div>
        `;
        
        // Add to main layout
        const mainLayout = document.querySelector('.main-layout');
        if (mainLayout) {
            mainLayout.appendChild(this.reactionPanel);
        }
    }
    
    setupEventListeners() {
        // Close button
        document.getElementById('closeReactionPanel').addEventListener('click', () => {
            this.close();
        });
        
        // Emoji buttons
        document.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const emoji = e.target.dataset.emoji;
                this.addReactionToCurrentLine(emoji);
            });
        });
        
        // Editor click handler for line numbers
        if (this.editor) {
            this.editor.onMouseDown((e) => {
                if (this.isReactionMode && e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS) {
                    this.currentLineNumber = e.target.position.lineNumber;
                    this.showReactionTooltip(e.browserEvent, e.target.position.lineNumber);
                }
            });
        }
    }
    
    setupSocketListeners() {
        if (!this.socket) return;
        
        // Listen for reaction updates
        this.socket.on('reaction-added', (data) => {
            this.handleReactionAdded(data);
        });
        
        this.socket.on('reaction-removed', (data) => {
            this.handleReactionRemoved(data);
        });
        
        this.socket.on('reaction-stats-update', (data) => {
            this.updateReactionStats(data.stats);
        });
    }
    
    showReactionTooltip(event, lineNumber) {
        // Remove existing tooltip
        const existingTooltip = document.querySelector('.reaction-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'reaction-tooltip';
        tooltip.style.position = 'fixed';
        tooltip.style.left = event.clientX + 'px';
        tooltip.style.top = (event.clientY - 50) + 'px';
        tooltip.innerHTML = `
            <div class="tooltip-content">
                <p>Add reaction to line ${lineNumber}</p>
                <div class="quick-emojis">
                    <button class="quick-emoji" data-emoji="👍">👍</button>
                    <button class="quick-emoji" data-emoji="❤️">❤️</button>
                    <button class="quick-emoji" data-emoji="🐛">🐛</button>
                    <button class="quick-emoji" data-emoji="✨">✨</button>
                    <button class="quick-emoji" data-emoji="🔥">🔥</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(tooltip);
        
        // Add event listeners to quick emojis
        tooltip.querySelectorAll('.quick-emoji').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const emoji = e.target.dataset.emoji;
                this.addReaction(lineNumber, emoji);
                tooltip.remove();
            });
        });
        
        // Remove tooltip when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function removeTooltip() {
                tooltip.remove();
                document.removeEventListener('click', removeTooltip);
            });
        }, 100);
    }
    
    addReactionToCurrentLine(emoji) {
        if (this.currentLineNumber) {
            this.addReaction(this.currentLineNumber, emoji);
        } else {
            this.showNotification('Please click on a line number first', 'warning');
        }
    }
    
    async addReaction(lineNumber, emoji) {
        try {
            const response = await fetch('/api/reactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    roomId: this.roomId,
                    fileName: currentFile,
                    lineNumber: lineNumber,
                    emoji: emoji,
                    userId: this.username,
                    username: this.username
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.updateReactionsDisplay(lineNumber, data.reactions);
                this.showNotification(`Added ${emoji} reaction to line ${lineNumber}`, 'success');
            }
        } catch (error) {
            console.error('Error adding reaction:', error);
            this.showNotification('Failed to add reaction', 'error');
        }
    }
    
    async removeReaction(lineNumber, emoji) {
        try {
            const response = await fetch('/api/reactions', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    roomId: this.roomId,
                    fileName: currentFile,
                    lineNumber: lineNumber,
                    userId: this.username
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.updateReactionsDisplay(lineNumber, data.reactions);
                this.showNotification('Reaction removed', 'success');
            }
        } catch (error) {
            console.error('Error removing reaction:', error);
            this.showNotification('Failed to remove reaction', 'error');
        }
    }
    
    updateReactionsDisplay(lineNumber, reactions) {
        // Remove existing reactions for this line
        const existingReactions = document.querySelectorAll(`[data-line="${lineNumber}"]`);
        existingReactions.forEach(reaction => reaction.remove());
        
        if (reactions && reactions.length > 0) {
            // Create reaction display
            const reactionDisplay = document.createElement('div');
            reactionDisplay.className = 'line-reactions';
            reactionDisplay.dataset.line = lineNumber;
            
            // Group reactions by emoji
            const emojiGroups = {};
            reactions.forEach(reaction => {
                if (!emojiGroups[reaction.emoji]) {
                    emojiGroups[reaction.emoji] = [];
                }
                emojiGroups[reaction.emoji].push(reaction);
            });
            
            // Create reaction buttons
            Object.entries(emojiGroups).forEach(([emoji, emojiReactions]) => {
                const reactionBtn = document.createElement('button');
                reactionBtn.className = 'reaction-btn';
                reactionBtn.innerHTML = `
                    <span class="emoji">${emoji}</span>
                    <span class="count">${emojiReactions.length}</span>
                `;
                
                // Add click handler to toggle reaction
                reactionBtn.addEventListener('click', () => {
                    const userReaction = emojiReactions.find(r => r.userId === this.username);
                    if (userReaction) {
                        this.removeReaction(lineNumber, emoji);
                    } else {
                        this.addReaction(lineNumber, emoji);
                    }
                });
                
                // Highlight if user has reacted
                const userReaction = emojiReactions.find(r => r.userId === this.username);
                if (userReaction) {
                    reactionBtn.classList.add('user-reacted');
                }
                
                reactionDisplay.appendChild(reactionBtn);
            });
            
            // Position the reaction display
            this.positionReactionDisplay(reactionDisplay, lineNumber);
        }
    }
    
    positionReactionDisplay(reactionDisplay, lineNumber) {
        if (!this.editor) return;
        
        // Get line position in editor
        const position = this.editor.getScrolledVisiblePosition({ lineNumber, column: 1 });
        if (!position) return;
        
        // Position the reaction display
        reactionDisplay.style.position = 'absolute';
        reactionDisplay.style.left = '20px';
        reactionDisplay.style.top = position.top + 'px';
        reactionDisplay.style.zIndex = '1000';
        
        // Add to editor container
        const editorContainer = document.getElementById('editorContainer');
        if (editorContainer) {
            editorContainer.appendChild(reactionDisplay);
        }
    }
    
    handleReactionAdded(data) {
        if (data.fileName === currentFile) {
            this.updateReactionsDisplay(data.lineNumber, data.reactions);
        }
    }
    
    handleReactionRemoved(data) {
        if (data.fileName === currentFile) {
            this.updateReactionsDisplay(data.lineNumber, data.reactions);
        }
    }
    
    async updateReactionStats(stats) {
        const statsContainer = document.getElementById('reactionStats');
        if (!statsContainer) return;
        
        statsContainer.innerHTML = '';
        
        if (stats && stats.length > 0) {
            stats.forEach(stat => {
                const statElement = document.createElement('div');
                statElement.className = 'stat-item';
                statElement.innerHTML = `
                    <span class="emoji">${stat.emoji}</span>
                    <span class="count">${stat.count}</span>
                    <span class="users">${stat.uniqueUsers} users</span>
                `;
                statsContainer.appendChild(statElement);
            });
        } else {
            statsContainer.innerHTML = '<p>No reactions yet</p>';
        }
    }
    
    async loadReactionStats() {
        try {
            const response = await fetch(`/api/reactions/stats/${this.roomId}`);
            const data = await response.json();
            
            if (data.success) {
                this.updateReactionStats(data.stats);
            }
        } catch (error) {
            console.error('Error loading reaction stats:', error);
        }
    }
    
    enableReactionMode() {
        this.isReactionMode = true;
        this.showNotification('Reaction mode enabled - click on line numbers to add reactions', 'info');
    }
    
    disableReactionMode() {
        this.isReactionMode = false;
        this.showNotification('Reaction mode disabled', 'info');
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
        this.reactionPanel.classList.add('open');
        this.enableReactionMode();
        this.loadReactionStats();
    }
    
    close() {
        this.reactionPanel.classList.remove('open');
        this.disableReactionMode();
        
        // Remove all reaction displays
        document.querySelectorAll('.line-reactions').forEach(reaction => {
            reaction.remove();
        });
    }
}

// Export for global access
window.EmojiReactions = EmojiReactions;
