const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const path = require("path")
const fs = require("fs")
const cors = require("cors")
const axios = require("axios")
require("dotenv").config()
const aiAssistantRouter = require('./ai-assistant')
const gitService = require('./git-service')
const {
    createRoom,
    joinRoom,
    removeUser,
    getRoomUsers,
    getRoomCode,
    setRoomCode,
    getRoomFiles,
    addFileToRoom,
    updateFileInRoom,
    hasFilePermission,
    requestFilePermission,
    respondToPermissionRequest,
    getFileOwner,
    deleteFile,
    getRoomFilePermissions,
    grantPermissionToAll,
    createFolderPath,
    getFolderStructure,
    addAnnotation,
    getAnnotations,
    deleteAnnotation,
    addBreakpoint,
    getBreakpoints,
    removeBreakpoint,
    addTerminal,
    removeTerminal,
    getTerminals,
    updateTerminalHistory,
    getTerminalHistory,
    setTerminalShell,
    getTerminalShell,
} = require("./room")

const app = express()
const server = http.createServer(app)

// Improved CORS configuration for Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
    },
    // Improved connection settings
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e8, // 100MB
})

// Middleware
app.use(express.json({ limit: "10mb" })) // For parsing application/json with larger limit
app.use(express.static(path.join(__dirname, "../public")))

// Add CORS middleware for Express
app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["Content-Type", "X-Requested-With", "Authorization"],
    }),
)

// Create a default config.json if it doesn't exist
const configPath = path.join(__dirname, "../public/config.json")
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ publicUrl: "" }))
}

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`)
    next()
})

// Register AI Assistant router
app.use('/api/ai', aiAssistantRouter)

const JDoodleClientID = process.env.JDOODLE_CLIENT_ID
const JDoodleClientSecret = process.env.JDOODLE_CLIENT_SECRET

// CRITICAL FIX: Direct proxy to JDoodle backend
app.post("/api/execute", async(req, res) => {
    try {
        const { language, script, stdin } = req.body

        if (!language || !script) {
            return res.status(400).json({
                success: false,
                output: "Language and code are required",
                error: true,
            })
        }

        console.log(`Executing ${language} code...`)

        // Forward the request to the JDoodle backend
        try {
            const jdoodleBackendUrl = "http://localhost:3001/run"
            const jdoodleResponse = await axios.post(
                jdoodleBackendUrl, {
                    language: language,
                    script: script,
                    stdin: stdin || "", // Pass stdin to JDoodle backend
                }, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            )

            console.log("JDoodle Response:", jdoodleResponse.data)
            return res.json(jdoodleResponse.data)
        } catch (apiError) {
            console.error("JDoodle API Error:", apiError.message)
            return res.status(500).json({
                success: false,
                output: `Error executing code: ${apiError.response?.data?.output || apiError.message}`,
                error: true,
            })
        }
    } catch (error) {
        console.error("Server Error:", error)
        return res.status(500).json({
            success: false,
            output: "Server error while processing execution request: " + error.message,
            error: true,
        })
    }
})

// Socket.io connection handling
io.on("connection", (socket) => {
    console.log("New user connected", socket.id)

    socket.on("create-room", ({ roomId, password, username }) => {
        createRoom(roomId, password, username, socket.id)
        socket.join(roomId)
        io.to(roomId).emit("room-update", getRoomUsers(roomId))
        socket.emit("joined-room")
        console.log(`${username} created room ${roomId}`)
    })

    socket.on("join-room", ({ roomId, password, username }) => {
        console.log(`Attempt to join room: ${roomId} by ${username}`)
        const success = joinRoom(roomId, password, username, socket.id)
        if (success) {
            socket.join(roomId)

            // Notify all users in the room about the new user
            io.to(roomId).emit("room-update", getRoomUsers(roomId))

            // Notify all other users in the room about the new user
            socket.to(roomId).emit("user-joined", username)

            // Notify the joining user that they've joined successfully
            socket.emit("joined-room")

            console.log(`${username} joined room ${roomId}`)
        } else {
            console.log(`Failed to join room: ${roomId} by ${username}`)
            socket.emit("room-error", "Invalid Room ID or Password")
        }
    })

    socket.on("send-message", ({ roomId, username, message }) => {
        console.log(`Message in room ${roomId} from ${username}: ${message}`)
        socket.to(roomId).emit("receive-message", { username, message })
    })

    socket.on("code-change", ({ roomId, fileName, code }) => {
        // Check if user has permission to edit this file
        if (hasFilePermission(roomId, fileName, socket.id)) {
            // Store the code in the room
            if (roomId && fileName) {
                console.log(`Received code change for ${fileName} in room ${roomId}`)
                updateFileInRoom(roomId, fileName, code, socket.id)
                    // Broadcast to all clients in the room except the sender
                socket.to(roomId).emit("code-update", { fileName, code })
            }
        } else {
            // Notify user they need permission
            socket.emit("permission-required", {
                fileName,
                message: "You need permission to edit this file",
            })

            // Send the original content back to the user to revert their changes
            const originalContent = getRoomFiles(roomId)[fileName].content || ""
            socket.emit("code-update", { fileName, code: originalContent })
        }
    })

    // Handle cursor position updates
    socket.on("cursor-position", ({ roomId, fileName, position }) => {
        if (roomId && fileName && position) {
            // Get username safely
            const user = getRoomUsers(roomId).find((user) => user.socketId === socket.id)
            const username = user ? user.username : null

            if (username) {
                // Broadcast cursor position to all clients in the room except the sender
                socket.to(roomId).emit("cursor-position-update", {
                    socketId: socket.id,
                    username: username,
                    fileName: fileName,
                    position: position,
                })
            }
        }
    })

    // Handle annotation updates
    socket.on("annotation-update", ({ roomId, fileName, lineNumber, annotation }) => {
        if (roomId && fileName && lineNumber && annotation) {
            // Add annotation to room
            addAnnotation(roomId, fileName, lineNumber, annotation)

            // Broadcast to all clients in the room except the sender
            socket.to(roomId).emit("annotation-update", {
                fileName: fileName,
                lineNumber: lineNumber,
                annotation: annotation,
            })
        }
    })

    // Handle annotation deletion
    socket.on("annotation-delete", ({ roomId, fileName, lineNumber, annotation }) => {
        if (roomId && fileName && lineNumber && annotation) {
            // Delete annotation from room
            deleteAnnotation(roomId, fileName, lineNumber, annotation)

            // Broadcast to all clients in the room except the sender
            socket.to(roomId).emit("annotation-delete", {
                fileName: fileName,
                lineNumber: lineNumber,
                annotation: annotation,
            })
        }
    })

    // Handle breakpoint updates
    socket.on("breakpoint-update", ({ roomId, fileName, breakpoints }) => {
        if (roomId && fileName && breakpoints) {
            // Update breakpoints in room
            if (breakpoints.length > 0) {
                addBreakpoint(roomId, fileName, breakpoints)
            } else {
                removeBreakpoint(roomId, fileName)
            }

            // Broadcast to all clients in the room except the sender
            socket.to(roomId).emit("breakpoint-update", {
                fileName: fileName,
                breakpoints: breakpoints,
            })
        }
    })

    // Handle voice chat events
    socket.on("voice-chat-join", ({ roomId, username }) => {
        if (roomId && username) {
            // Broadcast to all clients in the room
            io.to(roomId).emit("voice-chat-join", {
                socketId: socket.id,
                username: username,
            })
        }
    })

    socket.on("voice-chat-leave", ({ roomId, username }) => {
        if (roomId && username) {
            // Broadcast to all clients in the room
            io.to(roomId).emit("voice-chat-leave", {
                socketId: socket.id,
                username: username,
            })
        }
    })

    socket.on("voice-chat-offer", ({ roomId, offer, targetSocketId }) => {
        if (roomId && offer && targetSocketId) {
            // Forward offer to target client
            io.to(targetSocketId).emit("voice-chat-offer", {
                socketId: socket.id,
                offer: offer,
            })
        }
    })

    socket.on("voice-chat-answer", ({ roomId, answer, targetSocketId }) => {
        if (roomId && answer && targetSocketId) {
            // Forward answer to target client
            io.to(targetSocketId).emit("voice-chat-answer", {
                socketId: socket.id,
                answer: answer,
            })
        }
    })

    socket.on("voice-chat-ice-candidate", ({ roomId, candidate, targetSocketId }) => {
        if (roomId && candidate && targetSocketId) {
            // Forward ICE candidate to target client
            io.to(targetSocketId).emit("voice-chat-ice-candidate", {
                socketId: socket.id,
                candidate: candidate,
            })
        }
    })
    
    // Handle video conferencing events
    socket.on("join-video-conference", ({ roomId, userId }) => {
        if (roomId && userId) {
            // Add user to video conference participants
            console.log(`User ${userId} joined video conference in room ${roomId}`)
            
            // Notify other users in the room that a new user has joined
            socket.to(roomId).emit("user-joined-video", {
                userId: userId
            })
        }
    })
    
    socket.on("leave-video-conference", ({ roomId, userId }) => {
        if (roomId && userId) {
            // Remove user from video conference participants
            console.log(`User ${userId} left video conference in room ${roomId}`)
            
            // Notify other users in the room that a user has left
            socket.to(roomId).emit("user-left-video", {
                userId: userId
            })
        }
    })
    
    socket.on("request-video-connection", ({ roomId, userId, targetUserId }) => {
        if (roomId && userId && targetUserId) {
            // Forward connection request to target user
            console.log(`User ${userId} requested video connection with ${targetUserId} in room ${roomId}`)
            
            // Find the socket ID of the target user
            const targetUser = getRoomUsers(roomId).find(user => user.username === targetUserId)
            if (targetUser) {
                io.to(targetUser.socketId).emit("video-connection-request", {
                    userId: userId
                })
            }
        }
    })
    
    socket.on("ice-candidate", ({ roomId, userId, targetUserId, candidate }) => {
        if (roomId && userId && targetUserId && candidate) {
            // Forward ICE candidate to target user
            console.log(`Forwarding ICE candidate from ${userId} to ${targetUserId} in room ${roomId}`)
            
            // Find the socket ID of the target user
            const targetUser = getRoomUsers(roomId).find(user => user.username === targetUserId)
            if (targetUser) {
                io.to(targetUser.socketId).emit("ice-candidate", {
                    userId: userId,
                    candidate: candidate
                })
            }
        }
    })
    
    socket.on("video-offer", ({ roomId, userId, targetUserId, offer }) => {
        if (roomId && userId && targetUserId && offer) {
            // Forward video offer to target user
            console.log(`Forwarding video offer from ${userId} to ${targetUserId} in room ${roomId}`)
            
            // Find the socket ID of the target user
            const targetUser = getRoomUsers(roomId).find(user => user.username === targetUserId)
            if (targetUser) {
                io.to(targetUser.socketId).emit("video-offer", {
                    userId: userId,
                    offer: offer
                })
            }
        }
    })
    
    socket.on("video-answer", ({ roomId, userId, targetUserId, answer }) => {
        if (roomId && userId && targetUserId && answer) {
            // Forward video answer to target user
            console.log(`Forwarding video answer from ${userId} to ${targetUserId} in room ${roomId}`)
            
            // Find the socket ID of the target user
            const targetUser = getRoomUsers(roomId).find(user => user.username === targetUserId)
            if (targetUser) {
                io.to(targetUser.socketId).emit("video-answer", {
                    userId: userId,
                    answer: answer
                })
            }
        }
    })

    // Handle terminal events
    socket.on("terminal-created", ({ roomId, terminalId, shell }) => {
        if (roomId && terminalId) {
            // Add terminal to room
            addTerminal(roomId, terminalId, shell)

            // Broadcast to all clients in the room except the sender
            socket.to(roomId).emit("terminal-created", {
                socketId: socket.id,
                terminalId: terminalId,
                shell: shell,
            })
        }
    })

    socket.on("terminal-closed", ({ roomId, terminalId }) => {
        if (roomId && terminalId) {
            // Remove terminal from room
            removeTerminal(roomId, terminalId)

            // Broadcast to all clients in the room except the sender
            socket.to(roomId).emit("terminal-closed", {
                terminalId: terminalId,
            })
        }
    })

    socket.on("terminal-input", ({ roomId, terminalId, input }) => {
        if (roomId && terminalId && input) {
            // Process terminal input and generate output
            // This would typically involve executing the command in a shell
            // For demo purposes, we'll just echo the input
            const output = `$ ${input}\nCommand executed: ${input}`

            // Broadcast output to all clients in the room
            io.to(roomId).emit("terminal-output", {
                terminalId: terminalId,
                output: output,
            })
        }
    })

    socket.on("terminal-history-update", ({ roomId, terminalId, history }) => {
        if (roomId && terminalId && history) {
            // Update terminal history in room
            updateTerminalHistory(roomId, terminalId, history)

            // Broadcast to all clients in the room except the sender
            socket.to(roomId).emit("terminal-history-update", {
                terminalId: terminalId,
                history: history,
            })
        }
    })

    socket.on("terminal-shell-change", ({ roomId, terminalId, shell }) => {
        if (roomId && terminalId && shell) {
            // Update terminal shell in room
            setTerminalShell(roomId, terminalId, shell)

            // Broadcast to all clients in the room except the sender
            socket.to(roomId).emit("terminal-shell-change", {
                terminalId: terminalId,
                shell: shell,
            })
        }
    })

    // Handle project management events
    socket.on("project-created", ({ roomId, project }) => {
        if (roomId && project) {
            console.log(`Project created in room ${roomId}: ${project.name}`)
            
            // Broadcast to all clients in the room except the sender
            socket.to(roomId).emit("project-created", {
                project: project
            })
        }
    })
    
    socket.on("project-updated", ({ roomId, project }) => {
        if (roomId && project) {
            console.log(`Project updated in room ${roomId}: ${project.name}`)
            
            // Broadcast to all clients in the room except the sender
            socket.to(roomId).emit("project-updated", {
                project: project
            })
        }
    })
    
    socket.on("project-deleted", ({ roomId, projectId }) => {
        if (roomId && projectId) {
            console.log(`Project deleted in room ${roomId}: ${projectId}`)
            
            // Broadcast to all clients in the room except the sender
            socket.to(roomId).emit("project-deleted", {
                projectId: projectId
            })
        }
    })
    
    socket.on("task-created", ({ roomId, projectId, task }) => {
        if (roomId && projectId && task) {
            console.log(`Task created in project ${projectId} in room ${roomId}: ${task.title}`)
            
            // Broadcast to all clients in the room except the sender
            socket.to(roomId).emit("task-created", {
                projectId: projectId,
                task: task
            })
        }
    })
    
    socket.on("task-updated", ({ roomId, projectId, task }) => {
        if (roomId && projectId && task) {
            console.log(`Task updated in project ${projectId} in room ${roomId}: ${task.title}`)
            
            // Broadcast to all clients in the room except the sender
            socket.to(roomId).emit("task-updated", {
                projectId: projectId,
                task: task
            })
        }
    })
    
    socket.on("task-deleted", ({ roomId, projectId, taskId }) => {
        if (roomId && projectId && taskId) {
            console.log(`Task deleted in project ${projectId} in room ${roomId}: ${taskId}`)
            
            // Broadcast to all clients in the room except the sender
            socket.to(roomId).emit("task-deleted", {
                projectId: projectId,
                taskId: taskId
            })
        }
    })

    socket.on("file-created", ({ roomId, fileName, content, shareWithAll = false, folderPath = "/" }) => {
        // Add the file to the room with the creator as owner
        console.log(`File created: ${fileName} in room ${roomId}, shareWithAll: ${shareWithAll}`)
        addFileToRoom(roomId, fileName, content, socket.id, folderPath)

        // If shareWithAll is true, grant permission to all users
        if (shareWithAll) {
            grantPermissionToAll(roomId, fileName)

            // Broadcast updated permissions to all users
            const permissions = getRoomFilePermissions(roomId)
            io.to(roomId).emit("sync-file-permissions", {
                [roomId]: permissions,
            })
        }

        // Get the owner information
        const owner = getFileOwner(roomId, fileName)

        // Broadcast to all clients in the room except the sender
        socket.to(roomId).emit("file-created", {
            fileName,
            content,
            folderPath,
            shareWithAll,
            owner: owner,
        })

        // Send updated file owners to all clients
        const fileOwnersInfo = {}
        const files = getRoomFiles(roomId)
        Object.keys(files).forEach((file) => {
            const owner = getFileOwner(roomId, file)
            if (owner) {
                fileOwnersInfo[file] = owner
            }
        })
        io.to(roomId).emit("sync-file-owners", fileOwnersInfo)

        // Send folder structure update to all clients
        const folderStructure = getFolderStructure(roomId)
        io.to(roomId).emit("sync-folder-structure", folderStructure)
    })

    socket.on("create-folder", ({ roomId, folderPath }) => {
        console.log(`Creating folder: ${folderPath} in room ${roomId}`)
        createFolderPath(roomId, folderPath)

        // Send folder structure update to all clients
        const folderStructure = getFolderStructure(roomId)
        io.to(roomId).emit("sync-folder-structure", folderStructure)
    })

    socket.on("import-folder", ({ roomId, files }) => {
        console.log(`Importing folder with ${files.length} files to room ${roomId}`)

        // Process each file
        files.forEach((file) => {
            const { path, content } = file
            const folderPath = path.substring(0, path.lastIndexOf("/"))
            const fileName = path.substring(path.lastIndexOf("/") + 1)

            // Create folder structure if needed
            createFolderPath(roomId, folderPath)

            // Add file to room
            addFileToRoom(roomId, fileName, content, socket.id, folderPath)

            // Grant permission to all users
            grantPermissionToAll(roomId, fileName)
        })

        // Broadcast updated permissions to all users
        const permissions = getRoomFilePermissions(roomId)
        io.to(roomId).emit("sync-file-permissions", {
            [roomId]: permissions,
        })

        // Send updated file owners to all clients
        const fileOwnersInfo = {}
        const roomFiles = getRoomFiles(roomId)
        Object.keys(roomFiles).forEach((file) => {
            const owner = getFileOwner(roomId, file)
            if (owner) {
                fileOwnersInfo[file] = owner
            }
        })
        io.to(roomId).emit("sync-file-owners", fileOwnersInfo)

        // Send folder structure update to all clients
        const folderStructure = getFolderStructure(roomId)
        io.to(roomId).emit("sync-folder-structure", folderStructure)

        // Broadcast all files to all clients
        io.to(roomId).emit("sync-files", roomFiles)
    })

    socket.on("request-files", ({ roomId }) => {
        const files = getRoomFiles(roomId)
        if (files) {
            console.log(`Sending files for room ${roomId}`)
            socket.emit("sync-files", files)

            // Also send file ownership information
            const fileOwnersInfo = {}
            Object.keys(files).forEach((fileName) => {
                const owner = getFileOwner(roomId, fileName)
                if (owner) {
                    fileOwnersInfo[fileName] = owner
                }
            })

            socket.emit("sync-file-owners", fileOwnersInfo)

            // Also send file permissions information
            const permissions = getRoomFilePermissions(roomId)
            socket.emit("sync-file-permissions", {
                [roomId]: permissions,
            })

            // Send folder structure
            const folderStructure = getFolderStructure(roomId)
            socket.emit("sync-folder-structure", folderStructure)

            // Send annotations
            const annotations = getAnnotations(roomId)
            socket.emit("sync-annotations", annotations)

            // Send breakpoints
            const breakpoints = getBreakpoints(roomId)
            socket.emit("sync-breakpoints", breakpoints)

            // Send terminals
            const terminals = getTerminals(roomId)
            if (terminals) {
                terminals.forEach((terminal) => {
                    socket.emit("terminal-created", {
                        terminalId: terminal.id,
                        shell: terminal.shell,
                    })

                    // Send terminal history
                    const history = getTerminalHistory(roomId, terminal.id)
                    if (history) {
                        socket.emit("terminal-history-update", {
                            terminalId: terminal.id,
                            history: history,
                        })
                    }
                })
            }
        }
    })

    socket.on("request-file-permission", ({ roomId, fileName }) => {
        console.log(`Permission request for ${fileName} in room ${roomId} from ${socket.id}`)
        const result = requestFilePermission(roomId, fileName, socket.id)

        if (result.success) {
            // Notify the file owner about the permission request
            io.to(result.ownerSocketId).emit("permission-request", {
                fileName,
                requesterSocketId: socket.id,
                requesterName: result.requesterName,
            })

            // Notify the requester that their request was sent
            socket.emit("permission-request-sent", {
                fileName,
                ownerName: result.ownerName,
            })
        } else {
            socket.emit("permission-request-error", {
                fileName,
                message: result.message,
            })
        }
    })

    socket.on("respond-to-permission", ({ roomId, fileName, requesterSocketId, approved }) => {
        console.log(`Permission response for ${fileName} in room ${roomId}: ${approved ? "approved" : "denied"}`)
        const result = respondToPermissionRequest(roomId, fileName, requesterSocketId, socket.id, approved)

        if (result.success) {
            // Notify the requester about the decision
            io.to(requesterSocketId).emit("permission-response", {
                fileName,
                approved,
                message: approved ? `Permission granted to edit ${fileName}` : `Permission denied to edit ${fileName}`,
            })

            // Broadcast updated permissions to all users in the room
            const permissions = getRoomFilePermissions(roomId)
            io.to(roomId).emit("sync-file-permissions", {
                [roomId]: permissions,
            })
        }
    })

    socket.on("delete-file", ({ roomId, fileName }) => {
        console.log(`Request to delete ${fileName} in room ${roomId}`)
        const result = deleteFile(roomId, fileName, socket.id)

        if (result.success) {
            // Notify all users in the room about the file deletion
            io.to(roomId).emit("file-deleted", { fileName })

            // Send updated folder structure
            const folderStructure = getFolderStructure(roomId)
            io.to(roomId).emit("sync-folder-structure", folderStructure)

            console.log(`File ${fileName} deleted successfully`)
        } else {
            socket.emit("file-operation-error", {
                operation: "delete",
                fileName,
                message: result.message,
            })
            console.log(`File deletion failed: ${result.message}`)
        }
    })

    // Enhanced debugging events
    socket.on("start-enhanced-debugging", ({ roomId, fileName, breakpoints, watchExpressions }) => {
        if (roomId && fileName) {
            console.log(`Enhanced debugging started for ${fileName} in room ${roomId}`)
            // Broadcast to all users in the room
            io.to(roomId).emit("enhanced-debug-started", {
                fileName,
                breakpoints,
                watchExpressions,
                startedBy: socket.id
            })
        }
    })

    socket.on("pause-enhanced-debugging", ({ roomId }) => {
        if (roomId) {
            console.log(`Enhanced debugging paused in room ${roomId}`)
            io.to(roomId).emit("enhanced-debug-paused", {
                pausedBy: socket.id
            })
        }
    })

    socket.on("stop-enhanced-debugging", ({ roomId }) => {
        if (roomId) {
            console.log(`Enhanced debugging stopped in room ${roomId}`)
            io.to(roomId).emit("enhanced-debug-stopped", {
                stoppedBy: socket.id
            })
        }
    })

    socket.on("enhanced-debug-step", ({ roomId, stepType, data }) => {
        if (roomId) {
            console.log(`Enhanced debug step: ${stepType} in room ${roomId}`)
            io.to(roomId).emit("enhanced-debug-step-completed", {
                stepType,
                data,
                executedBy: socket.id
            })
        }
    })

    socket.on("add-watch-expression", ({ roomId, expression, id }) => {
        if (roomId && expression) {
            console.log(`Watch expression added: ${expression} in room ${roomId}`)
            io.to(roomId).emit("watch-expression-added", {
                expression,
                id,
                addedBy: socket.id
            })
        }
    })

    socket.on("remove-watch-expression", ({ roomId, id }) => {
        if (roomId && id) {
            console.log(`Watch expression removed: ${id} in room ${roomId}`)
            io.to(roomId).emit("watch-expression-removed", {
                id,
                removedBy: socket.id
            })
        }
    })

    socket.on("heartbeat", ({ roomId }) => {
        // Just acknowledge the heartbeat
        socket.emit("heartbeat-ack", { timestamp: Date.now() })
    })

    socket.on("disconnect", () => {
        const roomId = removeUser(socket.id)
        if (roomId) {
            io.to(roomId).emit("room-update", getRoomUsers(roomId))
            console.log(`User disconnected from room ${roomId}`)
        } else {
            console.log(`User disconnected (not in any room)`)
        }
    })

    // Handle connection errors
    socket.on("error", (error) => {
        console.error(`Socket error for ${socket.id}:`, error)
    })
    
    // Git version control events
    socket.on("git-init", async ({ roomId }) => {
        console.log(`Initializing Git repository for room ${roomId}`)
        try {
            // Ensure project directory exists
            const projectPath = await gitService.ensureProjectDirectory(roomId)
            
            // Initialize Git service for this room
            gitService.initGitService(roomId, projectPath)
            
            // Execute git init command
            const result = await gitService.handleGitCommand(roomId, 'git init')
            
            // Send result back to client
            socket.emit("git-response", result)
            
            // Broadcast Git status update to all clients in the room
            io.to(roomId).emit("git-status-update", { isInitialized: gitService.getGitStatus(roomId) })
        } catch (error) {
            console.error(`Error initializing Git for room ${roomId}:`, error)
            socket.emit("git-response", { success: false, error: error.message })
        }
    })
    
    socket.on("git-command", async ({ roomId, command }) => {
        console.log(`Executing Git command for room ${roomId}: ${command}`)
        try {
            // Execute the Git command
            const result = await gitService.handleGitCommand(roomId, command)
            
            // Send result back to client
            socket.emit("git-response", result)
            
            // Broadcast Git status update to all clients in the room
            io.to(roomId).emit("git-status-update", { isInitialized: gitService.getGitStatus(roomId) })
        } catch (error) {
            console.error(`Error executing Git command for room ${roomId}:`, error)
            socket.emit("git-response", { success: false, error: error.message })
        }
    })
    
    socket.on("git-status", async ({ roomId }) => {
        console.log(`Getting Git status for room ${roomId}`)
        try {
            // Check if Git is initialized
            const isInitialized = gitService.getGitStatus(roomId)
            
            // If initialized, get current status
            let statusResult = { isInitialized };
            
            if (isInitialized) {
                const result = await gitService.handleGitCommand(roomId, 'git status');
                statusResult.status = result.output;
            }
            
            // Send status back to client
            socket.emit("git-status-response", statusResult)
        } catch (error) {
            console.error(`Error getting Git status for room ${roomId}:`, error)
            socket.emit("git-status-response", { success: false, error: error.message })
        }
    })
})

// Default route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"))
})

// API endpoint to get server info
app.get("/api/server-info", (req, res) => {
    let publicUrl = ""
    try {
        const configData = fs.readFileSync(configPath, "utf8")
        const config = JSON.parse(configData)
        publicUrl = config.publicUrl || ""
    } catch (error) {
        console.error("Error reading config:", error)
    }

    res.json({
        localUrl: `http://localhost:${PORT}`,
        networkUrl: `http://${getLocalIpAddress()}:${PORT}`,
        publicUrl: publicUrl,
    })
})

// Test endpoint to check if server is running
app.get("/api/test", (req, res) => {
    res.json({ status: "ok", message: "Server is running" })
})

const PORT = process.env.PORT || 3000
const HOST = "0.0.0.0" // Listen on all network interfaces

const { networkInterfaces } = require("os")

function getLocalIpAddress() {
    const nets = networkInterfaces()
    const results = Object.create(null) // Or just '{}', an empty object

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === "IPv4" && !net.internal) {
                if (!results[name]) {
                    results[name] = []
                }
                results[name].push(net.address)
            }
        }
    }

    // For simplicity, return the first IPv4 address found
    for (const name of Object.keys(results)) {
        return results[name][0]
    }

    return "localhost" // Default to localhost if no external IP is found
}

// Start the server
server.listen(PORT, HOST, () => {
  console.log(`Server running at http://localhost:${PORT}`)
  console.log("Server is now running and will stay active until manually stopped.")
})

// Handle process termination
process.on("SIGINT", () => {
  console.log("Received SIGINT. Shutting down gracefully...")
  server.close(() => {
    console.log("Server closed.")
    process.exit(0)
  })
})

process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Shutting down gracefully...")
  server.close(() => {
    console.log("Server closed.")
    process.exit(0)
  })
})

// Prevent the process from exiting on uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err)
  // Don't exit the process
})

// Log when the process exits
process.on("exit", (code) => {
  console.log(`Process exiting with code: ${code}`)
})
