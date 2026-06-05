/**
 * Git Service
 * 
 * This module provides server-side Git functionality for the collaborative coding platform.
 * It handles Git commands sent from clients and executes them in the appropriate project directory.
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

// Store Git repositories by room ID
const gitRepos = {};

/**
 * Initialize Git service for a room
 * @param {string} roomId - The room ID
 * @param {string} projectPath - The project directory path
 */
function initGitService(roomId, projectPath) {
    if (!gitRepos[roomId]) {
        gitRepos[roomId] = {
            projectPath: projectPath,
            isInitialized: false
        };
        
        // Check if Git is already initialized in this directory
        checkGitStatus(roomId);
    }
}

/**
 * Check if a Git repository is already initialized
 * @param {string} roomId - The room ID
 */
async function checkGitStatus(roomId) {
    if (!gitRepos[roomId]) return;
    
    try {
        const result = await executeGitCommand(roomId, 'git status');
        gitRepos[roomId].isInitialized = !result.output.includes('not a git repository');
    } catch (error) {
        console.error(`Error checking Git status for room ${roomId}:`, error);
        gitRepos[roomId].isInitialized = false;
    }
}

/**
 * Execute a Git command in the project directory
 * @param {string} roomId - The room ID
 * @param {string} command - The Git command to execute
 * @returns {Promise<Object>} - The command result
 */
async function executeGitCommand(roomId, command) {
    return new Promise((resolve, reject) => {
        if (!gitRepos[roomId]) {
            reject(new Error(`No Git repository found for room ${roomId}`));
            return;
        }
        
        const projectPath = gitRepos[roomId].projectPath;
        
        // Execute the command in the project directory
        exec(command, { cwd: projectPath }, (error, stdout, stderr) => {
            if (error && !stderr.includes('warning:')) {
                console.error(`Git command error for room ${roomId}:`, error);
                resolve({
                    success: false,
                    error: stderr || error.message,
                    output: stdout
                });
                return;
            }
            
            resolve({
                success: true,
                output: stdout,
                error: stderr
            });
        });
    });
}

/**
 * Handle a Git command from a client
 * @param {string} roomId - The room ID
 * @param {string} command - The Git command to execute
 * @returns {Promise<Object>} - The command result
 */
async function handleGitCommand(roomId, command) {
    // Security check: Only allow git commands
    if (!command.trim().startsWith('git')) {
        return {
            success: false,
            error: 'Only Git commands are allowed'
        };
    }
    
    try {
        // Execute the command
        const result = await executeGitCommand(roomId, command);
        
        // Update Git status if needed
        if (command.includes('git init') || command.includes('git clone')) {
            gitRepos[roomId].isInitialized = true;
        }
        
        return result;
    } catch (error) {
        console.error(`Error handling Git command for room ${roomId}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Create a project directory for a room if it doesn't exist
 * @param {string} roomId - The room ID
 * @returns {string} - The project directory path
 */
async function ensureProjectDirectory(roomId) {
    const projectsDir = path.join(__dirname, '..', 'projects');
    const projectPath = path.join(projectsDir, roomId);
    
    try {
        // Create projects directory if it doesn't exist
        await fs.ensureDir(projectsDir);
        
        // Create project directory if it doesn't exist
        await fs.ensureDir(projectPath);
        
        return projectPath;
    } catch (error) {
        console.error(`Error creating project directory for room ${roomId}:`, error);
        throw error;
    }
}

/**
 * Get the Git status for a room
 * @param {string} roomId - The room ID
 * @returns {boolean} - Whether Git is initialized
 */
function getGitStatus(roomId) {
    return gitRepos[roomId] ? gitRepos[roomId].isInitialized : false;
}

module.exports = {
    initGitService,
    handleGitCommand,
    ensureProjectDirectory,
    getGitStatus
};