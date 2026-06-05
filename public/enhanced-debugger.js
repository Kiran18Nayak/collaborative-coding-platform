// Enhanced Collaborative Debugging System
// Builds upon the existing debugging foundation with advanced features

class EnhancedCollaborativeDebugger {
    constructor(editor, socket, roomId, username) {
        this.editor = editor
        this.socket = socket
        this.roomId = roomId
        this.username = username
        this.breakpoints = new Map() // Map of id -> breakpoint
        this.watchExpressions = new Map() // Map of id -> watch expression
        this.nextBreakpointId = 1
        this.nextWatchId = 1
        this.isDebugging = false
        this.debugState = null
        this.debugHistory = [] // Track debugging session history
        this.performanceMetrics = {
            startTime: null,
            stepCount: 0,
            breakpointHits: 0
        }

        this.init()
    }

    init() {
        this.setupEnhancedDebuggerUI()
        this.setupBreakpointListeners()
        this.setupDebuggerListeners()
        this.setupAdvancedFeatures()
        this.addTestingStyles()
    }

    setupEnhancedDebuggerUI() {
        // Create enhanced debugger panel
        const debuggerPanel = document.createElement("div")
        debuggerPanel.id = "enhancedDebuggerPanel"
        debuggerPanel.className = "enhanced-debugger-panel"
        debuggerPanel.innerHTML = `
            <div class="debugger-header">
                <div class="debugger-title">
                    <h3><i class="fas fa-bug"></i> Enhanced Debugger</h3>
                    <div class="debug-status" id="debugStatus">
                        <span class="status-indicator" id="statusIndicator"></span>
                        <span id="statusText">Ready</span>
                    </div>
                </div>
                <div class="debugger-controls">
                    <button id="startDebug" class="debug-btn primary">
                        <i class="fas fa-play"></i> Start
                    </button>
                    <button id="pauseDebug" class="debug-btn" disabled>
                        <i class="fas fa-pause"></i> Pause
                    </button>
                    <button id="stopDebug" class="debug-btn danger" disabled>
                        <i class="fas fa-stop"></i> Stop
                    </button>
                    <div class="debug-separator"></div>
                    <button id="stepOver" class="debug-btn" disabled>
                        <i class="fas fa-step-forward"></i> Step Over
                    </button>
                    <button id="stepInto" class="debug-btn" disabled>
                        <i class="fas fa-level-down-alt"></i> Step Into
                    </button>
                    <button id="stepOut" class="debug-btn" disabled>
                        <i class="fas fa-level-up-alt"></i> Step Out
                    </button>
                    <button id="continue" class="debug-btn" disabled>
                        <i class="fas fa-forward"></i> Continue
                    </button>
                </div>
            </div>
            
            <div class="debugger-tabs">
                <button class="tab-btn active" data-tab="variables">
                    <i class="fas fa-list"></i> Variables
                </button>
                <button class="tab-btn" data-tab="watch">
                    <i class="fas fa-eye"></i> Watch
                </button>
                <button class="tab-btn" data-tab="callstack">
                    <i class="fas fa-sitemap"></i> Call Stack
                </button>
                <button class="tab-btn" data-tab="breakpoints">
                    <i class="fas fa-circle"></i> Breakpoints
                </button>
                <button class="tab-btn" data-tab="performance">
                    <i class="fas fa-chart-line"></i> Performance
                </button>
                <button class="tab-btn" data-tab="testing">
                    <i class="fas fa-vial"></i> Testing
                </button>
            </div>

            <div class="debugger-content">
                <!-- Variables Tab -->
                <div class="tab-content active" id="variablesTab">
                    <div class="variables-header">
                        <h4>Variables</h4>
                        <div class="variables-controls">
                            <button id="expandAllVars" class="small-btn">
                                <i class="fas fa-expand-arrows-alt"></i> Expand All
                            </button>
                            <button id="collapseAllVars" class="small-btn">
                                <i class="fas fa-compress-arrows-alt"></i> Collapse All
                            </button>
                        </div>
                    </div>
                    <div id="variablesList" class="variables-list"></div>
                </div>

                <!-- Watch Tab -->
                <div class="tab-content" id="watchTab">
                    <div class="watch-header">
                        <h4>Watch Expressions</h4>
                        <div class="watch-input-container">
                            <input type="text" id="watchExpressionInput" placeholder="Enter expression to watch...">
                            <button id="addWatchExpression" class="small-btn primary">
                                <i class="fas fa-plus"></i> Add
                            </button>
                        </div>
                    </div>
                    <div id="watchExpressionsList" class="watch-expressions-list"></div>
                </div>

                <!-- Call Stack Tab -->
                <div class="tab-content" id="callstackTab">
                    <div class="callstack-header">
                        <h4>Call Stack</h4>
                        <div class="callstack-controls">
                            <button id="refreshCallStack" class="small-btn">
                                <i class="fas fa-sync"></i> Refresh
                            </button>
                        </div>
                    </div>
                    <div id="callStackList" class="call-stack-list"></div>
                </div>

                <!-- Breakpoints Tab -->
                <div class="tab-content" id="breakpointsTab">
                    <div class="breakpoints-header">
                        <h4>Breakpoints</h4>
                        <div class="breakpoints-controls">
                            <button id="removeAllBreakpoints" class="small-btn danger">
                                <i class="fas fa-trash"></i> Remove All
                            </button>
                            <button id="exportBreakpoints" class="small-btn">
                                <i class="fas fa-download"></i> Export
                            </button>
                        </div>
                    </div>
                    <div id="breakpointsList" class="breakpoints-list"></div>
                </div>

                <!-- Performance Tab -->
                <div class="tab-content" id="performanceTab">
                    <div class="performance-header">
                        <h4>Performance Metrics</h4>
                        <div class="performance-controls">
                            <button id="resetMetrics" class="small-btn">
                                <i class="fas fa-redo"></i> Reset
                            </button>
                        </div>
                    </div>
                    <div id="performanceMetrics" class="performance-metrics">
                        <div class="metric-item">
                            <span class="metric-label">Session Duration:</span>
                            <span id="sessionDuration" class="metric-value">00:00:00</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Steps Executed:</span>
                            <span id="stepCount" class="metric-value">0</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Breakpoints Hit:</span>
                            <span id="breakpointHits" class="metric-value">0</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Current Line:</span>
                            <span id="currentLine" class="metric-value">-</span>
                        </div>
                    </div>
                </div>
                
                <!-- Testing Tab -->
                <div class="tab-content" id="testingTab">
                    <div class="testing-header">
                        <h4>Test Runner</h4>
                        <div class="testing-controls">
                            <button id="runAllTests" class="small-btn primary">
                                <i class="fas fa-play"></i> Run All Tests
                            </button>
                            <button id="runSelectedTest" class="small-btn" disabled>
                                <i class="fas fa-play-circle"></i> Run Selected
                            </button>
                            <button id="clearTestResults" class="small-btn">
                                <i class="fas fa-trash"></i> Clear Results
                            </button>
                        </div>
                    </div>
                    <div class="testing-content">
                        <div class="test-files-section">
                            <h5>Test Files</h5>
                            <div class="test-files-list" id="testFilesList">
                                <div class="test-file-item active" data-file="demo-test.js">
                                    <i class="fas fa-file-code"></i> demo-test.js
                                </div>
                            </div>
                            <div class="test-add-controls">
                                <button id="addTestFile" class="small-btn">
                                    <i class="fas fa-plus"></i> Add Test File
                                </button>
                            </div>
                        </div>
                        <div class="test-results-section">
                            <h5>Test Results</h5>
                            <div class="test-summary" id="testSummary">
                                <div class="test-stat">
                                    <span class="test-stat-label">Total:</span>
                                    <span class="test-stat-value" id="totalTests">0</span>
                                </div>
                                <div class="test-stat passed">
                                    <span class="test-stat-label">Passed:</span>
                                    <span class="test-stat-value" id="passedTests">0</span>
                                </div>
                                <div class="test-stat failed">
                                    <span class="test-stat-label">Failed:</span>
                                    <span class="test-stat-value" id="failedTests">0</span>
                                </div>
                                <div class="test-stat">
                                    <span class="test-stat-label">Duration:</span>
                                    <span class="test-stat-value" id="testDuration">0ms</span>
                                </div>
                            </div>
                            <div class="test-results-list" id="testResultsList"></div>
                        </div>
                    </div>
                </div>
            </div>
        `

        // Add to the main layout
        const mainLayout = document.querySelector(".main-layout")
        if (mainLayout) {
            mainLayout.appendChild(debuggerPanel)
        }

        this.setupEventListeners()
    }

    setupEventListeners() {
        // Debug control buttons
        document.getElementById("startDebug").addEventListener("click", () => this.startDebugging())
        document.getElementById("pauseDebug").addEventListener("click", () => this.pauseDebugging())
        document.getElementById("stopDebug").addEventListener("click", () => this.stopDebugging())
        document.getElementById("stepOver").addEventListener("click", () => this.stepOver())
        document.getElementById("stepInto").addEventListener("click", () => this.stepInto())
        document.getElementById("stepOut").addEventListener("click", () => this.stepOut())
        document.getElementById("continue").addEventListener("click", () => this.continueExecution())

        // Tab switching
        document.querySelectorAll(".tab-btn").forEach(btn => {
            btn.addEventListener("click", (e) => this.switchTab(e.target.dataset.tab))
        })

        // Variables controls
        document.getElementById("expandAllVars").addEventListener("click", () => this.expandAllVariables())
        document.getElementById("collapseAllVars").addEventListener("click", () => this.collapseAllVariables())

        // Watch expressions
        document.getElementById("addWatchExpression").addEventListener("click", () => this.addWatchExpression())
        document.getElementById("watchExpressionInput").addEventListener("keypress", (e) => {
            if (e.key === "Enter") this.addWatchExpression()
        })

        // Breakpoints controls
        document.getElementById("removeAllBreakpoints").addEventListener("click", () => this.removeAllBreakpoints())
        document.getElementById("exportBreakpoints").addEventListener("click", () => this.exportBreakpoints())

        // Performance controls
        document.getElementById("resetMetrics").addEventListener("click", () => this.resetPerformanceMetrics())

        // Call stack controls
        document.getElementById("refreshCallStack").addEventListener("click", () => this.refreshCallStack())
        
        // Testing controls
        document.getElementById("runAllTests").addEventListener("click", () => this.runAllTests())
        document.getElementById("runSelectedTest").addEventListener("click", () => this.runSelectedTest())
        document.getElementById("clearTestResults").addEventListener("click", () => this.clearTestResults())
        document.getElementById("addTestFile").addEventListener("click", () => this.addTestFile())
        
        // Test file selection
        document.querySelectorAll(".test-file-item").forEach(item => {
            item.addEventListener("click", (e) => this.selectTestFile(e.currentTarget.dataset.file))
        })
    }

    setupAdvancedFeatures() {
        // Add glyph margin to editor for breakpoints
        if (this.editor && monaco) {
            this.editor.updateOptions({
                glyphMargin: true,
            })

            // Enhanced breakpoint click handler
            this.editor.onMouseDown((e) => {
                if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
                    this.toggleBreakpoint(e.target.position.lineNumber)
                }
            })

            // Add right-click context menu for breakpoints
            this.editor.onContextMenu((e) => {
                if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
                    this.showBreakpointContextMenu(e.browserEvent, e.target.position.lineNumber)
                }
            })
        }
    }

    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll(".tab-content").forEach(content => {
            content.classList.remove("active")
        })

        // Remove active class from all tab buttons
        document.querySelectorAll(".tab-btn").forEach(btn => {
            btn.classList.remove("active")
        })

        // Show selected tab content
        document.getElementById(`${tabName}Tab`).classList.add("active")
        document.querySelector(`[data-tab="${tabName}"]`).classList.add("active")
    }

    toggleBreakpoint(lineNumber) {
        const existingBreakpoint = Array.from(this.breakpoints.values()).find(
            (bp) => bp.lineNumber === lineNumber && bp.fileName === currentFile
        )

        if (existingBreakpoint) {
            this.removeBreakpoint(existingBreakpoint.id, true)
        } else {
            const id = this.nextBreakpointId++
            this.addBreakpoint(lineNumber, id, true)
        }
    }

    addBreakpoint(lineNumber, id, emitToServer, condition = null) {
        if (!this.editor || !monaco) return

        // Create decoration for the breakpoint
        const decorations = this.editor.deltaDecorations([], [{
            range: new monaco.Range(lineNumber, 1, lineNumber, 1),
            options: {
                isWholeLine: false,
                glyphMarginClassName: "breakpoint-glyph",
                hoverMessage: condition ? { value: `Condition: ${condition}` } : null
            }
        }])

        // Store breakpoint
        const breakpoint = {
            id,
            lineNumber,
            fileName: currentFile,
            decorationId: decorations[0],
            enabled: true,
            condition: condition,
            hitCount: 0,
            createdAt: new Date().toISOString()
        }

        this.breakpoints.set(id, breakpoint)

        // Update breakpoints list
        this.updateBreakpointsList()

        // Emit to server if needed
        if (emitToServer && this.socket && this.socket.connected) {
            this.socket.emit("add-breakpoint", {
                roomId: this.roomId,
                lineNumber,
                fileName: currentFile,
                id,
                condition
            })
        }
    }

    removeBreakpoint(id, emitToServer) {
        const breakpoint = this.breakpoints.get(id)
        if (!breakpoint || !this.editor) return

        // Remove decoration
        this.editor.deltaDecorations([breakpoint.decorationId], [])

        // Remove from map
        this.breakpoints.delete(id)

        // Update breakpoints list
        this.updateBreakpointsList()

        // Emit to server if needed
        if (emitToServer && this.socket && this.socket.connected) {
            this.socket.emit("remove-breakpoint", {
                roomId: this.roomId,
                id,
                fileName: currentFile
            })
        }
    }

    addWatchExpression() {
        const input = document.getElementById("watchExpressionInput")
        const expression = input.value.trim()
        
        if (!expression) return

        const id = this.nextWatchId++
        const watchExpression = {
            id,
            expression,
            value: null,
            type: null,
            error: null,
            createdAt: new Date().toISOString()
        }

        this.watchExpressions.set(id, watchExpression)
        this.updateWatchExpressionsList()
        input.value = ""

        // Emit to server
        if (this.socket && this.socket.connected) {
            this.socket.emit("add-watch-expression", {
                roomId: this.roomId,
                expression,
                id
            })
        }
    }

    removeWatchExpression(id) {
        this.watchExpressions.delete(id)
        this.updateWatchExpressionsList()

        // Emit to server
        if (this.socket && this.socket.connected) {
            this.socket.emit("remove-watch-expression", {
                roomId: this.roomId,
                id
            })
        }
    }

    startDebugging() {
        if (this.isDebugging) return

        this.isDebugging = true
        this.performanceMetrics.startTime = Date.now()
        this.performanceMetrics.stepCount = 0
        this.performanceMetrics.breakpointHits = 0

        // Update UI
        this.updateDebuggerUI(true)
        this.updateStatus("Running", "running")

        // Get all breakpoints for the current file
        const fileBreakpoints = Array.from(this.breakpoints.values())
            .filter((bp) => bp.fileName === currentFile)
            .map(({ id, lineNumber, fileName, condition }) => ({ id, lineNumber, fileName, condition }))

        // Emit debug start event
        if (this.socket && this.socket.connected) {
            this.socket.emit("start-enhanced-debugging", {
                roomId: this.roomId,
                fileName: currentFile,
                breakpoints: fileBreakpoints,
                watchExpressions: Array.from(this.watchExpressions.values())
            })
        }

        // Start performance timer
        this.startPerformanceTimer()

        // For demo purposes, simulate hitting the first breakpoint
        setTimeout(() => {
            if (fileBreakpoints.length > 0) {
                const firstBreakpoint = fileBreakpoints[0]
                this.handleDebugPaused({
                    lineNumber: firstBreakpoint.lineNumber,
                    variables: this.generateSampleVariables(),
                    callStack: this.generateSampleCallStack(),
                    watchValues: this.evaluateWatchExpressions()
                })
            }
        }, 1000)
    }

    pauseDebugging() {
        if (!this.isDebugging) return

        this.updateStatus("Paused", "paused")
        
        if (this.socket && this.socket.connected) {
            this.socket.emit("pause-enhanced-debugging", {
                roomId: this.roomId
            })
        }
    }

    stopDebugging() {
        if (!this.isDebugging) return

        this.isDebugging = false
        this.debugState = null

        // Update UI
        this.updateDebuggerUI(false)
        this.updateStatus("Stopped", "stopped")
        this.clearDebugState()

        // Stop performance timer
        this.stopPerformanceTimer()

        // Emit debug stop event
        if (this.socket && this.socket.connected) {
            this.socket.emit("stop-enhanced-debugging", {
                roomId: this.roomId
            })
        }
    }

    stepOver() {
        if (!this.isDebugging || !this.debugState) return

        this.performanceMetrics.stepCount++
        this.updatePerformanceMetrics()

        if (this.socket && this.socket.connected) {
            this.socket.emit("enhanced-debug-step", {
                roomId: this.roomId,
                stepType: "step-over"
            })
        }

        // Simulate stepping to the next line
        const currentLine = this.debugState.lineNumber
        setTimeout(() => {
            this.handleDebugStepCompleted({
                lineNumber: currentLine + 1,
                variables: this.generateSampleVariables(),
                callStack: this.debugState.callStack,
                watchValues: this.evaluateWatchExpressions()
            })
        }, 500)
    }

    stepInto() {
        if (!this.isDebugging || !this.debugState) return

        this.performanceMetrics.stepCount++
        this.updatePerformanceMetrics()

        if (this.socket && this.socket.connected) {
            this.socket.emit("enhanced-debug-step", {
                roomId: this.roomId,
                stepType: "step-into"
            })
        }

        // Simulate stepping into a function
        setTimeout(() => {
            const newCallStack = [
                { name: "innerFunction", line: 15, file: currentFile },
                ...this.debugState.callStack
            ]

            this.handleDebugStepCompleted({
                lineNumber: 15,
                variables: this.generateSampleVariables(),
                callStack: newCallStack,
                watchValues: this.evaluateWatchExpressions()
            })
        }, 500)
    }

    stepOut() {
        if (!this.isDebugging || !this.debugState) return

        this.performanceMetrics.stepCount++
        this.updatePerformanceMetrics()

        if (this.socket && this.socket.connected) {
            this.socket.emit("enhanced-debug-step", {
                roomId: this.roomId,
                stepType: "step-out"
            })
        }

        // Simulate stepping out of a function
        setTimeout(() => {
            const newCallStack = [...this.debugState.callStack]
            if (newCallStack.length > 1) {
                newCallStack.shift()
            }

            this.handleDebugStepCompleted({
                lineNumber: newCallStack[0].line,
                variables: this.generateSampleVariables(),
                callStack: newCallStack,
                watchValues: this.evaluateWatchExpressions()
            })
        }, 500)
    }

    continueExecution() {
        if (!this.isDebugging || !this.debugState) return

        this.updateStatus("Running", "running")

        if (this.socket && this.socket.connected) {
            this.socket.emit("enhanced-debug-step", {
                roomId: this.roomId,
                stepType: "continue"
            })
        }

        // Simulate hitting another breakpoint or finishing
        const fileBreakpoints = Array.from(this.breakpoints.values())
            .filter((bp) => bp.fileName === currentFile && bp.lineNumber > this.debugState.lineNumber)
            .sort((a, b) => a.lineNumber - b.lineNumber)

        setTimeout(() => {
            if (fileBreakpoints.length > 0) {
                const nextBreakpoint = fileBreakpoints[0]
                this.performanceMetrics.breakpointHits++
                this.updatePerformanceMetrics()

                this.handleDebugPaused({
                    lineNumber: nextBreakpoint.lineNumber,
                    variables: this.generateSampleVariables(),
                    callStack: this.debugState.callStack,
                    watchValues: this.evaluateWatchExpressions()
                })
            } else {
                this.handleDebugStopped()
            }
        }, 1000)
    }

    handleDebugPaused(data) {
        if (!this.editor || !monaco) return

        this.debugState = data
        this.updateStatus("Paused", "paused")

        // Highlight the current line
        const decorations = this.editor.deltaDecorations([], [{
            range: new monaco.Range(data.lineNumber, 1, data.lineNumber, 1),
            options: {
                isWholeLine: true,
                className: "debug-current-line"
            }
        }])

        this.debugState.lineDecoration = decorations[0]

        // Update all displays
        this.updateVariablesDisplay(data.variables)
        this.updateCallStackDisplay(data.callStack)
        this.updateWatchExpressionsDisplay(data.watchValues)
        this.updatePerformanceMetrics()

        // Update UI buttons
        this.updateDebuggerUI(true)
    }

    handleDebugStepCompleted(data) {
        if (!this.editor || !monaco) return

        // Clear previous line highlight
        if (this.debugState && this.debugState.lineDecoration) {
            this.editor.deltaDecorations([this.debugState.lineDecoration], [])
        }

        this.debugState = data

        // Highlight the new current line
        const decorations = this.editor.deltaDecorations([], [{
            range: new monaco.Range(data.lineNumber, 1, data.lineNumber, 1),
            options: {
                isWholeLine: true,
                className: "debug-current-line"
            }
        }])

        this.debugState.lineDecoration = decorations[0]

        // Update all displays
        this.updateVariablesDisplay(data.variables)
        this.updateCallStackDisplay(data.callStack)
        this.updateWatchExpressionsDisplay(data.watchValues)
        this.updatePerformanceMetrics()

        // Update UI buttons
        this.updateDebuggerUI(true)
    }

    handleDebugStopped() {
        this.isDebugging = false
        this.updateDebuggerUI(false)
        this.updateStatus("Stopped", "stopped")
        this.clearDebugState()
        this.stopPerformanceTimer()
    }

    updateVariablesDisplay(variables) {
        const variablesList = document.getElementById("variablesList")
        if (!variablesList) return

        variablesList.innerHTML = ""

        for (const [name, value] of Object.entries(variables)) {
            const varElement = this.createVariableElement(name, value)
            variablesList.appendChild(varElement)
        }
    }

    createVariableElement(name, value, depth = 0) {
        const varElement = document.createElement("div")
        varElement.className = "variable-item"
        varElement.style.paddingLeft = `${depth * 20}px`

        const isObject = typeof value === "object" && value !== null
        const isArray = Array.isArray(value)

        if (isObject || isArray) {
            varElement.innerHTML = `
                <div class="variable-header" onclick="this.parentElement.classList.toggle('expanded')">
                    <span class="variable-expand-icon">
                        <i class="fas fa-chevron-right"></i>
                    </span>
                    <span class="variable-name">${name}:</span>
                    <span class="variable-type">${isArray ? 'Array' : 'Object'}</span>
                    <span class="variable-preview">${isArray ? `[${value.length} items]` : `{${Object.keys(value).length} properties}`}</span>
                </div>
                <div class="variable-children" style="display: none;">
                    ${Object.entries(value).map(([key, val]) => 
                        this.createVariableElement(key, val, depth + 1).outerHTML
                    ).join('')}
                </div>
            `
        } else {
            varElement.innerHTML = `
                <div class="variable-simple">
                    <span class="variable-name">${name}:</span>
                    <span class="variable-value">${this.formatValue(value)}</span>
                    <span class="variable-type">${typeof value}</span>
                </div>
            `
        }

        return varElement
    }

    formatValue(value) {
        if (typeof value === "string") {
            return `"${value}"`
        } else if (typeof value === "boolean") {
            return value.toString()
        } else if (value === null) {
            return "null"
        } else if (value === undefined) {
            return "undefined"
        } else {
            return value.toString()
        }
    }

    updateCallStackDisplay(callStack) {
        const callStackList = document.getElementById("callStackList")
        if (!callStackList) return

        callStackList.innerHTML = ""

        callStack.forEach((frame, index) => {
            const frameElement = document.createElement("div")
            frameElement.className = `call-stack-item ${index === 0 ? 'current' : ''}`
            frameElement.innerHTML = `
                <div class="call-stack-frame">
                    <span class="call-stack-name">${frame.name}</span>
                    <span class="call-stack-location">${frame.file}:${frame.line}</span>
                </div>
                <div class="call-stack-actions">
                    <button class="small-btn" onclick="this.navigateToFrame('${frame.file}', ${frame.line})">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                </div>
            `
            callStackList.appendChild(frameElement)
        })
    }

    updateWatchExpressionsList() {
        const watchList = document.getElementById("watchExpressionsList")
        if (!watchList) return

        watchList.innerHTML = ""

        this.watchExpressions.forEach((watch, id) => {
            const watchElement = document.createElement("div")
            watchElement.className = "watch-expression-item"
            watchElement.innerHTML = `
                <div class="watch-expression-header">
                    <span class="watch-expression-text">${watch.expression}</span>
                    <button class="small-btn danger" onclick="this.removeWatchExpression(${id})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="watch-expression-value">
                    ${watch.error ? 
                        `<span class="error">Error: ${watch.error}</span>` :
                        `<span class="value">${this.formatValue(watch.value)}</span>`
                    }
                </div>
            `
            watchList.appendChild(watchElement)
        })
    }

    updateWatchExpressionsDisplay(watchValues) {
        this.watchExpressions.forEach((watch, id) => {
            if (watchValues && watchValues[id]) {
                watch.value = watchValues[id].value
                watch.error = watchValues[id].error
            }
        })
        this.updateWatchExpressionsList()
    }

    updateBreakpointsList() {
        const breakpointsList = document.getElementById("breakpointsList")
        if (!breakpointsList) return

        breakpointsList.innerHTML = ""

        this.breakpoints.forEach((breakpoint, id) => {
            const bpElement = document.createElement("div")
            bpElement.className = "breakpoint-item"
            bpElement.innerHTML = `
                <div class="breakpoint-info">
                    <span class="breakpoint-file">${breakpoint.fileName}</span>
                    <span class="breakpoint-line">Line ${breakpoint.lineNumber}</span>
                    ${breakpoint.condition ? `<span class="breakpoint-condition">Condition: ${breakpoint.condition}</span>` : ''}
                    <span class="breakpoint-hits">Hits: ${breakpoint.hitCount}</span>
                </div>
                <div class="breakpoint-actions">
                    <button class="small-btn" onclick="this.editBreakpoint(${id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="small-btn danger" onclick="this.removeBreakpoint(${id}, true)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `
            breakpointsList.appendChild(bpElement)
        })
    }

    updatePerformanceMetrics() {
        document.getElementById("stepCount").textContent = this.performanceMetrics.stepCount
        document.getElementById("breakpointHits").textContent = this.performanceMetrics.breakpointHits
        document.getElementById("currentLine").textContent = this.debugState ? this.debugState.lineNumber : "-"
    }

    updateStatus(text, status) {
        const statusText = document.getElementById("statusText")
        const statusIndicator = document.getElementById("statusIndicator")
        
        if (statusText) statusText.textContent = text
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${status}`
        }
    }

    updateDebuggerUI(isDebugging) {
        const startBtn = document.getElementById("startDebug")
        const pauseBtn = document.getElementById("pauseDebug")
        const stopBtn = document.getElementById("stopDebug")
        const stepBtns = ["stepOver", "stepInto", "stepOut", "continue"]

        if (startBtn) startBtn.disabled = isDebugging
        if (pauseBtn) pauseBtn.disabled = !isDebugging
        if (stopBtn) stopBtn.disabled = !isDebugging

        stepBtns.forEach(id => {
            const btn = document.getElementById(id)
            if (btn) btn.disabled = !isDebugging || !this.debugState
        })
    }

    clearDebugState() {
        if (this.debugState && this.debugState.lineDecoration && this.editor) {
            this.editor.deltaDecorations([this.debugState.lineDecoration], [])
        }

        this.debugState = null

        // Clear displays
        const variablesList = document.getElementById("variablesList")
        const callStackList = document.getElementById("callStackList")
        if (variablesList) variablesList.innerHTML = ""
        if (callStackList) callStackList.innerHTML = ""
    }

    // Utility methods
    generateSampleVariables() {
        return {
            x: 10,
            y: 20,
            result: 30,
            user: {
                name: "John Doe",
                age: 25,
                email: "john@example.com"
            },
            items: [1, 2, 3, 4, 5],
            isActive: true
        }
    }

    generateSampleCallStack() {
        return [
            { name: "calculate", line: 15, file: currentFile },
            { name: "processData", line: 8, file: currentFile },
            { name: "main", line: 1, file: currentFile }
        ]
    }

    evaluateWatchExpressions() {
        const results = {}
        this.watchExpressions.forEach((watch, id) => {
            try {
                // In a real implementation, this would evaluate the expression
                // For demo purposes, return mock values
                results[id] = {
                    value: `Result of: ${watch.expression}`,
                    error: null
                }
            } catch (error) {
                results[id] = {
                    value: null,
                    error: error.message
                }
            }
        })
        return results
    }

    startPerformanceTimer() {
        this.performanceTimer = setInterval(() => {
            if (this.performanceMetrics.startTime) {
                const duration = Date.now() - this.performanceMetrics.startTime
                const hours = Math.floor(duration / 3600000)
                const minutes = Math.floor((duration % 3600000) / 60000)
                const seconds = Math.floor((duration % 60000) / 1000)
                
                document.getElementById("sessionDuration").textContent = 
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            }
        }, 1000)
    }

    stopPerformanceTimer() {
        if (this.performanceTimer) {
            clearInterval(this.performanceTimer)
            this.performanceTimer = null
        }
    }

    // Additional utility methods
    expandAllVariables() {
        document.querySelectorAll(".variable-item").forEach(item => {
            item.classList.add("expanded")
            const children = item.querySelector(".variable-children")
            if (children) children.style.display = "block"
        })
    }

    collapseAllVariables() {
        document.querySelectorAll(".variable-item").forEach(item => {
            item.classList.remove("expanded")
            const children = item.querySelector(".variable-children")
            if (children) children.style.display = "none"
        })
    }

    removeAllBreakpoints() {
        if (confirm("Are you sure you want to remove all breakpoints?")) {
            this.breakpoints.forEach((bp, id) => {
                this.removeBreakpoint(id, true)
            })
        }
    }

    exportBreakpoints() {
        const breakpointsData = Array.from(this.breakpoints.values()).map(bp => ({
            fileName: bp.fileName,
            lineNumber: bp.lineNumber,
            condition: bp.condition,
            enabled: bp.enabled
        }))

        const dataStr = JSON.stringify(breakpointsData, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = 'breakpoints.json'
        link.click()
        
        URL.revokeObjectURL(url)
    }

    resetPerformanceMetrics() {
        this.performanceMetrics = {
            startTime: this.isDebugging ? Date.now() : null,
            stepCount: 0,
            breakpointHits: 0
        }
        this.updatePerformanceMetrics()
    }

    refreshCallStack() {
        if (this.debugState && this.debugState.callStack) {
            this.updateCallStackDisplay(this.debugState.callStack)
        }
    }
    
    // Testing functionality
    runAllTests() {
        this.clearTestResults()
        const startTime = performance.now()
        
        // Get all test files
        const testFiles = this.getTestFiles()
        let totalTests = 0
        let passedTests = 0
        let failedTests = 0
        
        // For demo purposes, simulate running tests
        setTimeout(() => {
            testFiles.forEach(file => {
                const testResults = this.runTestsInFile(file)
                totalTests += testResults.total
                passedTests += testResults.passed
                failedTests += testResults.failed
            })
            
            const endTime = performance.now()
            const duration = Math.round(endTime - startTime)
            
            // Update test summary
            document.getElementById("totalTests").textContent = totalTests
            document.getElementById("passedTests").textContent = passedTests
            document.getElementById("failedTests").textContent = failedTests
            document.getElementById("testDuration").textContent = `${duration}ms`
            
            // Enable/disable run selected button based on test results
            document.getElementById("runSelectedTest").disabled = false
        }, 500)
    }
    
    /* CSS Styles for Testing Tab */
    addTestingStyles() {
        const style = document.createElement('style')
        style.textContent = `
            /* Test Files Section */
            .test-files-section {
                flex: 0 0 30%;
                border-right: 1px solid #444;
                padding: 10px;
                overflow-y: auto;
            }
            
            .test-files-list {
                margin-top: 10px;
                max-height: 200px;
                overflow-y: auto;
            }
            
            .test-file-item {
                padding: 6px 10px;
                margin-bottom: 4px;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .test-file-item:hover {
                background-color: #383838;
            }
            
            .test-file-item.active {
                background-color: #2a5885;
            }
            
            /* Test Results Section */
            .test-results-section {
                flex: 1;
                padding: 10px;
                overflow-y: auto;
            }
            
            .test-summary {
                display: flex;
                justify-content: space-between;
                padding: 8px;
                background-color: #2d2d2d;
                border-radius: 4px;
                margin-bottom: 10px;
            }
            
            .test-stat {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .test-stat.passed .test-stat-value {
                color: #4caf50;
            }
            
            .test-stat.failed .test-stat-value {
                color: #f44336;
            }
            
            .test-stat-label {
                font-size: 11px;
                color: #aaa;
            }
            
            .test-stat-value {
                font-size: 16px;
                font-weight: bold;
            }
            
            .test-results-list {
                margin-top: 10px;
            }
            
            .test-result {
                margin-bottom: 8px;
                border-radius: 4px;
                background-color: #2d2d2d;
                overflow: hidden;
            }
            
            .test-result-header {
                display: flex;
                justify-content: space-between;
                padding: 8px 12px;
                background-color: #333;
            }
            
            .test-status.passed {
                color: #4caf50;
            }
            
            .test-status.failed {
                color: #f44336;
            }
            
            .test-error {
                padding: 8px 12px;
                background-color: rgba(244, 67, 54, 0.1);
                border-left: 3px solid #f44336;
                margin: 8px 0;
            }
            
            .test-error pre {
                margin: 0;
                white-space: pre-wrap;
                font-family: monospace;
                font-size: 12px;
            }
            
            .test-duration {
                padding: 4px 12px;
                text-align: right;
                font-size: 11px;
                color: #aaa;
            }
            
            .testing-content {
                display: flex;
                height: 100%;
                overflow: hidden;
            }
        `
        document.head.appendChild(style)
    }
    
    runSelectedTest() {
        const selectedFile = document.querySelector(".test-file-item.active")?.dataset.file
        if (!selectedFile) return
        
        this.clearTestResults()
        const startTime = performance.now()
        
        // For demo purposes, simulate running selected test
        setTimeout(() => {
            const testResults = this.runTestsInFile(selectedFile)
            
            const endTime = performance.now()
            const duration = Math.round(endTime - startTime)
            
            // Update test summary
            document.getElementById("totalTests").textContent = testResults.total
            document.getElementById("passedTests").textContent = testResults.passed
            document.getElementById("failedTests").textContent = testResults.failed
            document.getElementById("testDuration").textContent = `${duration}ms`
        }, 300)
    }
    
    clearTestResults() {
        // Reset test summary
        document.getElementById("totalTests").textContent = "0"
        document.getElementById("passedTests").textContent = "0"
        document.getElementById("failedTests").textContent = "0"
        document.getElementById("testDuration").textContent = "0ms"
        
        // Clear test results list
        const testResultsList = document.getElementById("testResultsList")
        if (testResultsList) {
            testResultsList.innerHTML = ""
        }
    }
    
    addTestFile() {
        // In a real implementation, this would open a dialog to create or select a test file
        // For demo purposes, we'll add a new test file to the list
        const testFilesList = document.getElementById("testFilesList")
        if (!testFilesList) return
        
        const newFileName = `test-${Math.floor(Math.random() * 1000)}.js`
        const fileItem = document.createElement("div")
        fileItem.className = "test-file-item"
        fileItem.dataset.file = newFileName
        fileItem.innerHTML = `<i class="fas fa-file-code"></i> ${newFileName}`
        
        fileItem.addEventListener("click", (e) => this.selectTestFile(e.currentTarget.dataset.file))
        testFilesList.appendChild(fileItem)
    }
    
    selectTestFile(fileName) {
        // Remove active class from all test files
        document.querySelectorAll(".test-file-item").forEach(item => {
            item.classList.remove("active")
        })
        
        // Add active class to selected test file
        const selectedFile = document.querySelector(`.test-file-item[data-file="${fileName}"]`)
        if (selectedFile) {
            selectedFile.classList.add("active")
            document.getElementById("runSelectedTest").disabled = false
        }
    }
    
    getTestFiles() {
        // In a real implementation, this would scan the project for test files
        // For demo purposes, return a list of test files
        return ["demo-test.js", "unit-tests.js", "integration-tests.js"]
    }
    
    runTestsInFile(fileName) {
        // In a real implementation, this would execute the tests in the file
        // For demo purposes, generate random test results
        const testResultsList = document.getElementById("testResultsList")
        if (!testResultsList) return { total: 0, passed: 0, failed: 0 }
        
        // Generate random number of tests (3-8)
        const numTests = Math.floor(Math.random() * 6) + 3
        let passed = 0
        let failed = 0
        
        for (let i = 1; i <= numTests; i++) {
            // 80% chance of test passing
            const isPassed = Math.random() < 0.8
            if (isPassed) {
                passed++
            } else {
                failed++
            }
            
            const testResult = document.createElement("div")
            testResult.className = `test-result ${isPassed ? 'passed' : 'failed'}`
            testResult.innerHTML = `
                <div class="test-result-header">
                    <span class="test-name">${fileName.replace('.js', '')} - Test ${i}</span>
                    <span class="test-status ${isPassed ? 'passed' : 'failed'}">
                        <i class="fas ${isPassed ? 'fa-check' : 'fa-times'}"></i> ${isPassed ? 'Passed' : 'Failed'}
                    </span>
                </div>
                ${!isPassed ? `
                <div class="test-error">
                    <pre>Error: ${this.generateRandomError()}</pre>
                </div>
                ` : ''}
                <div class="test-duration">${Math.floor(Math.random() * 100) + 5}ms</div>
            `
            
            testResultsList.appendChild(testResult)
        }
        
        return {
            total: numTests,
            passed: passed,
            failed: failed
        }
    }
    
    generateRandomError() {
        const errors = [
            "Expected 42 but received 41",
            "Cannot read property 'length' of undefined",
            "Assertion failed: result should be true",
            "Timeout exceeded (2000ms)",
            "TypeError: undefined is not a function"
        ]
        
        return errors[Math.floor(Math.random() * errors.length)]
    }
}

// Export the enhanced debugger
window.EnhancedCollaborativeDebugger = EnhancedCollaborativeDebugger
