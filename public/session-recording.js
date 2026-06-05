// Session Recording System
class SessionRecording {
    constructor(socket, roomId, username) {
        this.socket = socket;
        this.roomId = roomId;
        this.username = username;
        this.isRecording = false;
        this.recordingData = [];
        this.startTime = null;
        this.recordingPanel = null;
        this.recordings = [];
        
        this.init();
    }
    
    init() {
        this.setupRecordingUI();
        this.setupEventListeners();
        this.setupSocketListeners();
        this.loadRecordings();
    }
    
    setupRecordingUI() {
        // Create recording panel
        this.recordingPanel = document.createElement('div');
        this.recordingPanel.id = 'sessionRecordingPanel';
        this.recordingPanel.className = 'session-recording-panel';
        this.recordingPanel.innerHTML = `
            <div class="recording-header">
                <h3><i class="fas fa-video"></i> Session Recording</h3>
                <button id="closeRecordingPanel" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="recording-content">
                <div class="recording-controls">
                    <div class="recording-status">
                        <div class="status-indicator" id="recordingStatus">
                            <i class="fas fa-circle"></i>
                            <span id="recordingStatusText">Ready to Record</span>
                        </div>
                        <div class="recording-timer" id="recordingTimer">00:00:00</div>
                    </div>
                    <div class="recording-buttons">
                        <button id="startRecording" class="btn-primary">
                            <i class="fas fa-play"></i> Start Recording
                        </button>
                        <button id="stopRecording" class="btn-danger" disabled>
                            <i class="fas fa-stop"></i> Stop Recording
                        </button>
                        <button id="pauseRecording" class="btn-secondary" disabled>
                            <i class="fas fa-pause"></i> Pause
                        </button>
                    </div>
                </div>
                
                <div class="recording-settings">
                    <h4>Recording Settings</h4>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="recordCodeChanges" checked>
                                <span class="checkmark"></span>
                                Record code changes
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="recordCursorMovement" checked>
                                <span class="checkmark"></span>
                                Record cursor movement
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="recordChat" checked>
                                <span class="checkmark"></span>
                                Record chat messages
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="recordVoiceChat" checked>
                                <span class="checkmark"></span>
                                Record voice chat
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="recordFileOperations" checked>
                                <span class="checkmark"></span>
                                Record file operations
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="recordDebugging" checked>
                                <span class="checkmark"></span>
                                Record debugging sessions
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="recording-tabs">
                    <button class="tab-btn active" data-tab="recordings">
                        <i class="fas fa-list"></i> Recordings
                    </button>
                    <button class="tab-btn" data-tab="playback">
                        <i class="fas fa-play-circle"></i> Playback
                    </button>
                    <button class="tab-btn" data-tab="export">
                        <i class="fas fa-download"></i> Export
                    </button>
                </div>
                
                <div class="recording-tab-content">
                    <!-- Recordings Tab -->
                    <div class="tab-content active" id="recordingsTab">
                        <div class="recordings-header">
                            <h4>Session Recordings</h4>
                            <div class="recordings-controls">
                                <button id="refreshRecordings" class="btn-secondary">
                                    <i class="fas fa-sync"></i> Refresh
                                </button>
                                <button id="deleteAllRecordings" class="btn-danger">
                                    <i class="fas fa-trash"></i> Delete All
                                </button>
                            </div>
                        </div>
                        <div id="recordingsList" class="recordings-list">
                            <div class="empty-state">No recordings found</div>
                        </div>
                    </div>
                    
                    <!-- Playback Tab -->
                    <div class="tab-content" id="playbackTab">
                        <div class="playback-header">
                            <h4>Playback Controls</h4>
                            <div class="playback-controls">
                                <button id="playRecording" class="btn-primary" disabled>
                                    <i class="fas fa-play"></i> Play
                                </button>
                                <button id="pausePlayback" class="btn-secondary" disabled>
                                    <i class="fas fa-pause"></i> Pause
                                </button>
                                <button id="stopPlayback" class="btn-secondary" disabled>
                                    <i class="fas fa-stop"></i> Stop
                                </button>
                                <button id="resetPlayback" class="btn-secondary" disabled>
                                    <i class="fas fa-undo"></i> Reset
                                </button>
                            </div>
                        </div>
                        <div class="playback-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" id="playbackProgress"></div>
                            </div>
                            <div class="playback-time">
                                <span id="playbackCurrentTime">00:00:00</span> / <span id="playbackTotalTime">00:00:00</span>
                            </div>
                        </div>
                        <div class="playback-info">
                            <div id="playbackInfo" class="info-content">
                                Select a recording to start playback
                            </div>
                        </div>
                    </div>
                    
                    <!-- Export Tab -->
                    <div class="tab-content" id="exportTab">
                        <div class="export-header">
                            <h4>Export Recordings</h4>
                        </div>
                        <div class="export-options">
                            <div class="export-format">
                                <label for="exportFormat">Export Format:</label>
                                <select id="exportFormat">
                                    <option value="json">JSON</option>
                                    <option value="csv">CSV</option>
                                    <option value="html">HTML Report</option>
                                    <option value="video">Video (MP4)</option>
                                </select>
                            </div>
                            <div class="export-range">
                                <label for="exportRange">Export Range:</label>
                                <select id="exportRange">
                                    <option value="all">All Recordings</option>
                                    <option value="selected">Selected Recording</option>
                                    <option value="date">Date Range</option>
                                </select>
                            </div>
                            <div class="export-date-range" id="exportDateRange" style="display: none;">
                                <label for="startDate">Start Date:</label>
                                <input type="date" id="startDate">
                                <label for="endDate">End Date:</label>
                                <input type="date" id="endDate">
                            </div>
                        </div>
                        <div class="export-actions">
                            <button id="exportRecordings" class="btn-primary">
                                <i class="fas fa-download"></i> Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add to main layout
        const mainLayout = document.querySelector('.main-layout');
        if (mainLayout) {
            mainLayout.appendChild(this.recordingPanel);
        }
    }
    
    setupEventListeners() {
        // Close button
        document.getElementById('closeRecordingPanel').addEventListener('click', () => {
            this.close();
        });
        
        // Recording controls
        document.getElementById('startRecording').addEventListener('click', () => {
            this.startRecording();
        });
        
        document.getElementById('stopRecording').addEventListener('click', () => {
            this.stopRecording();
        });
        
        document.getElementById('pauseRecording').addEventListener('click', () => {
            this.pauseRecording();
        });
        
        // Playback controls
        document.getElementById('playRecording').addEventListener('click', () => {
            this.playRecording();
        });
        
        document.getElementById('pausePlayback').addEventListener('click', () => {
            this.pausePlayback();
        });
        
        document.getElementById('stopPlayback').addEventListener('click', () => {
            this.stopPlayback();
        });
        
        document.getElementById('resetPlayback').addEventListener('click', () => {
            this.resetPlayback();
        });
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Export controls
        document.getElementById('exportFormat').addEventListener('change', () => {
            this.updateExportOptions();
        });
        
        document.getElementById('exportRange').addEventListener('change', () => {
            this.updateExportOptions();
        });
        
        document.getElementById('exportRecordings').addEventListener('click', () => {
            this.exportRecordings();
        });
        
        // Refresh recordings
        document.getElementById('refreshRecordings').addEventListener('click', () => {
            this.loadRecordings();
        });
        
        // Delete all recordings
        document.getElementById('deleteAllRecordings').addEventListener('click', () => {
            this.deleteAllRecordings();
        });
    }
    
    setupSocketListeners() {
        if (!this.socket) return;
        
        // Listen for recording events
        this.socket.on('recording-started', (data) => {
            this.handleRecordingStarted(data);
        });
        
        this.socket.on('recording-stopped', (data) => {
            this.handleRecordingStopped(data);
        });
        
        this.socket.on('recording-data', (data) => {
            this.handleRecordingData(data);
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
            case 'recordings':
                this.loadRecordings();
                break;
        }
    }
    
    startRecording() {
        if (this.isRecording) return;
        
        this.isRecording = true;
        this.startTime = Date.now();
        this.recordingData = [];
        
        // Update UI
        this.updateRecordingStatus('Recording...', 'recording');
        document.getElementById('startRecording').disabled = true;
        document.getElementById('stopRecording').disabled = false;
        document.getElementById('pauseRecording').disabled = false;
        
        // Start timer
        this.startTimer();
        
        // Start recording events
        this.startEventRecording();
        
        // Notify server
        this.socket.emit('start-recording', {
            roomId: this.roomId,
            username: this.username,
            settings: this.getRecordingSettings()
        });
        
        this.showNotification('Recording started', 'success');
    }
    
    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        const endTime = Date.now();
        const duration = endTime - this.startTime;
        
        // Update UI
        this.updateRecordingStatus('Recording stopped', 'stopped');
        document.getElementById('startRecording').disabled = false;
        document.getElementById('stopRecording').disabled = true;
        document.getElementById('pauseRecording').disabled = true;
        
        // Stop timer
        this.stopTimer();
        
        // Stop recording events
        this.stopEventRecording();
        
        // Save recording
        this.saveRecording(duration);
        
        // Notify server
        this.socket.emit('stop-recording', {
            roomId: this.roomId,
            username: this.username,
            duration: duration,
            data: this.recordingData
        });
        
        this.showNotification('Recording saved', 'success');
    }
    
    pauseRecording() {
        // Toggle pause state
        if (this.isPaused) {
            this.resumeRecording();
        } else {
            this.pauseRecording();
        }
    }
    
    pauseRecording() {
        this.isPaused = true;
        this.updateRecordingStatus('Paused', 'paused');
        document.getElementById('pauseRecording').innerHTML = '<i class="fas fa-play"></i> Resume';
        this.stopTimer();
    }
    
    resumeRecording() {
        this.isPaused = false;
        this.updateRecordingStatus('Recording...', 'recording');
        document.getElementById('pauseRecording').innerHTML = '<i class="fas fa-pause"></i> Pause';
        this.startTimer();
    }
    
    startEventRecording() {
        // Record code changes
        if (document.getElementById('recordCodeChanges').checked) {
            this.recordCodeChanges();
        }
        
        // Record cursor movement
        if (document.getElementById('recordCursorMovement').checked) {
            this.recordCursorMovement();
        }
        
        // Record chat messages
        if (document.getElementById('recordChat').checked) {
            this.recordChatMessages();
        }
        
        // Record file operations
        if (document.getElementById('recordFileOperations').checked) {
            this.recordFileOperations();
        }
        
        // Record debugging sessions
        if (document.getElementById('recordDebugging').checked) {
            this.recordDebuggingSessions();
        }
    }
    
    stopEventRecording() {
        // Remove event listeners
        // This would be implemented based on the specific events being recorded
    }
    
    recordCodeChanges() {
        // Record code changes in the editor
        if (window.editor) {
            window.editor.onDidChangeModelContent((e) => {
                if (this.isRecording && !this.isPaused) {
                    this.recordEvent('code-change', {
                        timestamp: Date.now(),
                        changes: e.changes,
                        model: e.model
                    });
                }
            });
        }
    }
    
    recordCursorMovement() {
        // Record cursor position changes
        if (window.editor) {
            window.editor.onDidChangeCursorPosition((e) => {
                if (this.isRecording && !this.isPaused) {
                    this.recordEvent('cursor-move', {
                        timestamp: Date.now(),
                        position: e.position,
                        source: e.source
                    });
                }
            });
        }
    }
    
    recordChatMessages() {
        // Record chat messages
        if (this.socket) {
            this.socket.on('chat-message', (data) => {
                if (this.isRecording && !this.isPaused) {
                    this.recordEvent('chat-message', {
                        timestamp: Date.now(),
                        message: data
                    });
                }
            });
        }
    }
    
    recordFileOperations() {
        // Record file operations
        // This would be implemented based on the file management system
    }
    
    recordDebuggingSessions() {
        // Record debugging sessions
        // This would be implemented based on the debugging system
    }
    
    recordEvent(type, data) {
        this.recordingData.push({
            type: type,
            timestamp: Date.now(),
            data: data
        });
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.isRecording && !this.isPaused) {
                const elapsed = Date.now() - this.startTime;
                document.getElementById('recordingTimer').textContent = this.formatTime(elapsed);
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    
    updateRecordingStatus(text, status) {
        const statusElement = document.getElementById('recordingStatus');
        const statusText = document.getElementById('recordingStatusText');
        
        statusText.textContent = text;
        statusElement.className = `status-indicator ${status}`;
    }
    
    getRecordingSettings() {
        return {
            recordCodeChanges: document.getElementById('recordCodeChanges').checked,
            recordCursorMovement: document.getElementById('recordCursorMovement').checked,
            recordChat: document.getElementById('recordChat').checked,
            recordVoiceChat: document.getElementById('recordVoiceChat').checked,
            recordFileOperations: document.getElementById('recordFileOperations').checked,
            recordDebugging: document.getElementById('recordDebugging').checked
        };
    }
    
    async saveRecording(duration) {
        const recording = {
            id: Date.now().toString(),
            roomId: this.roomId,
            username: this.username,
            startTime: this.startTime,
            duration: duration,
            data: this.recordingData,
            settings: this.getRecordingSettings(),
            createdAt: new Date()
        };
        
        try {
            const response = await fetch('/api/recordings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(recording)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.recordings.push(recording);
                this.loadRecordings();
            }
        } catch (error) {
            console.error('Error saving recording:', error);
            this.showNotification('Failed to save recording', 'error');
        }
    }
    
    async loadRecordings() {
        try {
            const response = await fetch(`/api/recordings/${this.roomId}`);
            const data = await response.json();
            
            if (data.success) {
                this.recordings = data.recordings;
                this.renderRecordings();
            }
        } catch (error) {
            console.error('Error loading recordings:', error);
            this.showNotification('Failed to load recordings', 'error');
        }
    }
    
    renderRecordings() {
        const recordingsList = document.getElementById('recordingsList');
        recordingsList.innerHTML = '';
        
        if (this.recordings.length === 0) {
            recordingsList.innerHTML = '<div class="empty-state">No recordings found</div>';
            return;
        }
        
        this.recordings.forEach(recording => {
            const recordingElement = this.createRecordingElement(recording);
            recordingsList.appendChild(recordingElement);
        });
    }
    
    createRecordingElement(recording) {
        const recordingDiv = document.createElement('div');
        recordingDiv.className = 'recording-item';
        recordingDiv.innerHTML = `
            <div class="recording-header">
                <div class="recording-info">
                    <h4>Session ${recording.id}</h4>
                    <span class="recording-date">${new Date(recording.createdAt).toLocaleString()}</span>
                </div>
                <div class="recording-actions">
                    <button class="btn-icon" onclick="sessionRecording.playRecording('${recording.id}')" title="Play">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn-icon" onclick="sessionRecording.downloadRecording('${recording.id}')" title="Download">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn-icon" onclick="sessionRecording.deleteRecording('${recording.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="recording-details">
                <div class="recording-stat">
                    <span class="stat-label">Duration:</span>
                    <span class="stat-value">${this.formatTime(recording.duration)}</span>
                </div>
                <div class="recording-stat">
                    <span class="stat-label">Events:</span>
                    <span class="stat-value">${recording.data.length}</span>
                </div>
                <div class="recording-stat">
                    <span class="stat-label">Recorded by:</span>
                    <span class="stat-value">${recording.username}</span>
                </div>
            </div>
        `;
        
        return recordingDiv;
    }
    
    playRecording(recordingId) {
        const recording = this.recordings.find(r => r.id === recordingId);
        if (!recording) return;
        
        this.currentPlayback = recording;
        this.playbackIndex = 0;
        this.playbackStartTime = Date.now();
        
        // Update UI
        document.getElementById('playRecording').disabled = false;
        document.getElementById('pausePlayback').disabled = false;
        document.getElementById('stopPlayback').disabled = false;
        document.getElementById('resetPlayback').disabled = false;
        
        // Start playback
        this.startPlayback();
    }
    
    startPlayback() {
        if (!this.currentPlayback) return;
        
        this.isPlaying = true;
        this.playbackInterval = setInterval(() => {
            this.updatePlayback();
        }, 100);
        
        this.showNotification('Playback started', 'info');
    }
    
    updatePlayback() {
        if (!this.currentPlayback || !this.isPlaying) return;
        
        const currentTime = Date.now() - this.playbackStartTime;
        const progress = (currentTime / this.currentPlayback.duration) * 100;
        
        // Update progress bar
        document.getElementById('playbackProgress').style.width = progress + '%';
        
        // Update time display
        document.getElementById('playbackCurrentTime').textContent = this.formatTime(currentTime);
        document.getElementById('playbackTotalTime').textContent = this.formatTime(this.currentPlayback.duration);
        
        // Process events
        this.processPlaybackEvents(currentTime);
        
        // Check if playback is complete
        if (progress >= 100) {
            this.stopPlayback();
        }
    }
    
    processPlaybackEvents(currentTime) {
        if (!this.currentPlayback) return;
        
        // Process events that should occur at the current time
        const events = this.currentPlayback.data.filter(event => {
            const eventTime = event.timestamp - this.currentPlayback.startTime;
            return eventTime <= currentTime && eventTime > (currentTime - 100);
        });
        
        events.forEach(event => {
            this.replayEvent(event);
        });
    }
    
    replayEvent(event) {
        // Replay the event based on its type
        switch (event.type) {
            case 'code-change':
                // Replay code changes
                break;
            case 'cursor-move':
                // Replay cursor movement
                break;
            case 'chat-message':
                // Replay chat messages
                break;
            // Add more event types as needed
        }
    }
    
    pausePlayback() {
        if (this.isPlaying) {
            this.isPlaying = false;
            clearInterval(this.playbackInterval);
            this.showNotification('Playback paused', 'info');
        }
    }
    
    stopPlayback() {
        this.isPlaying = false;
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }
        
        // Reset UI
        document.getElementById('playbackProgress').style.width = '0%';
        document.getElementById('playbackCurrentTime').textContent = '00:00:00';
        
        this.showNotification('Playback stopped', 'info');
    }
    
    resetPlayback() {
        this.stopPlayback();
        this.playbackStartTime = Date.now();
        this.playbackIndex = 0;
    }
    
    async downloadRecording(recordingId) {
        const recording = this.recordings.find(r => r.id === recordingId);
        if (!recording) return;
        
        try {
            const response = await fetch(`/api/recordings/${recordingId}/download`);
            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `recording-${recordingId}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showNotification('Recording downloaded', 'success');
        } catch (error) {
            console.error('Error downloading recording:', error);
            this.showNotification('Failed to download recording', 'error');
        }
    }
    
    async deleteRecording(recordingId) {
        if (!confirm('Are you sure you want to delete this recording?')) return;
        
        try {
            const response = await fetch(`/api/recordings/${recordingId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.recordings = this.recordings.filter(r => r.id !== recordingId);
                this.renderRecordings();
                this.showNotification('Recording deleted', 'success');
            }
        } catch (error) {
            console.error('Error deleting recording:', error);
            this.showNotification('Failed to delete recording', 'error');
        }
    }
    
    async deleteAllRecordings() {
        if (!confirm('Are you sure you want to delete all recordings?')) return;
        
        try {
            const response = await fetch(`/api/recordings/${this.roomId}/all`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.recordings = [];
                this.renderRecordings();
                this.showNotification('All recordings deleted', 'success');
            }
        } catch (error) {
            console.error('Error deleting all recordings:', error);
            this.showNotification('Failed to delete all recordings', 'error');
        }
    }
    
    updateExportOptions() {
        const format = document.getElementById('exportFormat').value;
        const range = document.getElementById('exportRange').value;
        const dateRange = document.getElementById('exportDateRange');
        
        if (range === 'date') {
            dateRange.style.display = 'block';
        } else {
            dateRange.style.display = 'none';
        }
    }
    
    async exportRecordings() {
        const format = document.getElementById('exportFormat').value;
        const range = document.getElementById('exportRange').value;
        
        try {
            let exportData = this.recordings;
            
            if (range === 'selected' && this.currentPlayback) {
                exportData = [this.currentPlayback];
            } else if (range === 'date') {
                const startDate = new Date(document.getElementById('startDate').value);
                const endDate = new Date(document.getElementById('endDate').value);
                exportData = this.recordings.filter(r => {
                    const date = new Date(r.createdAt);
                    return date >= startDate && date <= endDate;
                });
            }
            
            const response = await fetch('/api/recordings/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    format: format,
                    data: exportData
                })
            });
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `recordings-export.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showNotification('Recordings exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting recordings:', error);
            this.showNotification('Failed to export recordings', 'error');
        }
    }
    
    handleRecordingStarted(data) {
        if (data.roomId === this.roomId) {
            this.showNotification(`${data.username} started recording`, 'info');
        }
    }
    
    handleRecordingStopped(data) {
        if (data.roomId === this.roomId) {
            this.showNotification(`${data.username} stopped recording`, 'info');
        }
    }
    
    handleRecordingData(data) {
        if (data.roomId === this.roomId && this.isRecording) {
            this.recordEvent('remote-event', data);
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
        this.recordingPanel.classList.add('open');
        this.loadRecordings();
    }
    
    close() {
        this.recordingPanel.classList.remove('open');
    }
}

// Export for global access
window.SessionRecording = SessionRecording;
