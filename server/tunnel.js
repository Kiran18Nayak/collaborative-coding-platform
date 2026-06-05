const { spawn } = require("child_process")
const fs = require("fs")
const path = require("path")
const ngrok = require("ngrok")
const os = require("os")
require("dotenv").config()

// Default port
const PORT = process.env.PORT || 3000

// Start the server in a child process
console.log("Starting the server...")
const serverProcess = spawn("node", [path.join(__dirname, "server.js")], { stdio: "inherit" })

// Handle server process exit
serverProcess.on("close", (code) => {
    console.log(`Server process exited with code ${code}`)
    process.exit(code)
})

// Function to start ngrok
async function startNgrok() {
    try {
        console.log("Starting ngrok tunnel...")

        // Get authtoken from environment variable. If missing, attempt ephemeral tunnel.
        const authtoken = process.env.NGROK_AUTHTOKEN

        let url
        if (!authtoken) {
            console.warn("⚠️ NGROK_AUTHTOKEN not found in environment variables.")
            console.warn("⚠️ Attempting to create an ephemeral ngrok tunnel (no auth).")
            // Connect without auth token (ephemeral tunnel). This may be rate-limited by ngrok.
            url = await ngrok.connect({
                addr: PORT,
                region: "us",
            })
        } else {
            // Connect to ngrok with authentication for more stable tunnels
            url = await ngrok.connect({
                addr: PORT,
                authtoken: authtoken,
                region: "us",
            })
        }

        console.log(`✅ Tunnel established successfully!`)
        console.log(`🌐 Public URL: ${url}`)

        // Update the public URL in a config file for the client to access
        const configData = JSON.stringify({
            publicUrl: url,
            timestamp: new Date().toISOString(),
        })

        // Ensure the public directory exists
        const publicDir = path.join(__dirname, "../public")
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true })
        }

        fs.writeFileSync(path.join(publicDir, "config.json"), configData)
        console.log("📝 Config file updated with public URL")

        // Handle process termination
        process.on("SIGINT", async() => {
            console.log("Shutting down ngrok tunnel...")
            await ngrok.kill()
            process.exit(0)
        })
    } catch (error) {
        console.error("❌ Error starting ngrok:", error)
        console.log("Continuing with local server only...")
        console.log(`💻 You can still access the application at http://localhost:${PORT}`)
    }
}

// Start ngrok
startNgrok().catch((error) => {
    console.error("❌ Unexpected ngrok error:", error)
    console.log("Continuing with local server only...")
    console.log(`💻 You can still access the application at http://localhost:${PORT}`)
})

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason)
})

process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err)
})