/**
 * Video Conferencing Module
 * 
 * This module provides video conferencing functionality for the collaborative coding platform.
 * It uses WebRTC for peer-to-peer video and audio communication.
 */

class VideoConferencing {
    constructor() {
        this.localStream = null;
        this.peers = {};
        this.isInitialized = false;
        this.isAudioEnabled = true;
        this.isVideoEnabled = true;
        this.isScreenSharing = false;
        this.screenStream = null;
        this.socket = null;
        this.roomId = null;
        this.userId = null;
        this.peerConnections = {};
        this.videoPanel = null;
        
        // Configuration for RTCPeerConnection
        this.peerConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
            ]
        };
    }

    /**
     * Initialize the video conferencing module
     * @param {Object} socket - The socket.io connection
     * @param {string} roomId - The room ID
     * @param {string} userId - The user ID
     */
    async initialize(socket, roomId, userId) {
        if (this.isInitialized) return;
        
        this.socket = socket;
        this.roomId = roomId;
        this.userId = userId;
        
        // Create video panel if it doesn't exist
        this.createVideoPanel();
        
        // Set up socket event listeners
        this.setupSocketListeners();
        
        // Set up UI event listeners
        this.setupUIListeners();
        
        this.isInitialized = true;
        console.log('Video conferencing initialized');
    }

    /**
     * Create the video conferencing panel
     */
    createVideoPanel() {
        // Check if panel already exists
        this.videoPanel = document.getElementById('videoConferencingPanel');
        if (this.videoPanel) return;
        
        // Create panel container
        this.videoPanel = document.createElement('aside');
        this.videoPanel.id = 'videoConferencingPanel';
        this.videoPanel.className = 'video-conferencing-panel';
        
        // Create panel header
        const panelHeader = document.createElement('div');
        panelHeader.className = 'panel-header';
        panelHeader.innerHTML = `
            <h3>Video Conferencing</h3>
            <button id="closeVideoConferencing" class="panel-close-btn"><i class="fas fa-times"></i></button>
        `;
        
        // Create video grid
        const videoGrid = document.createElement('div');
        videoGrid.id = 'videoGrid';
        videoGrid.className = 'video-grid';
        
        // Create local video container
        const localVideoContainer = document.createElement('div');
        localVideoContainer.className = 'video-container local-video-container';
        
        const localVideo = document.createElement('video');
        localVideo.id = 'localVideo';
        localVideo.autoplay = true;
        localVideo.muted = true;
        localVideo.playsInline = true;
        
        const localVideoLabel = document.createElement('div');
        localVideoLabel.className = 'video-label';
        localVideoLabel.textContent = 'You';
        
        localVideoContainer.appendChild(localVideo);
        localVideoContainer.appendChild(localVideoLabel);
        
        videoGrid.appendChild(localVideoContainer);
        
        // Create video controls
        const videoControls = document.createElement('div');
        videoControls.className = 'video-conferencing-controls';
        videoControls.innerHTML = `
            <button id="toggleVideoConferencingMic" class="video-control-btn"><i class="fas fa-microphone"></i></button>
            <button id="toggleVideoConferencingCamera" class="video-control-btn"><i class="fas fa-video"></i></button>
            <button id="toggleScreenShare" class="video-control-btn"><i class="fas fa-desktop"></i></button>
            <button id="leaveVideoConference" class="video-control-btn danger"><i class="fas fa-phone-slash"></i></button>
        `;
        
        // Assemble panel
        this.videoPanel.appendChild(panelHeader);
        this.videoPanel.appendChild(videoGrid);
        this.videoPanel.appendChild(videoControls);
        
        // Add panel to the main layout
        const mainLayout = document.querySelector('.main-layout');
        if (mainLayout) {
            mainLayout.appendChild(this.videoPanel);
        } else {
            // Fallback to editor container if main-layout doesn't exist
            const editorContainer = document.querySelector('.editor-container');
            if (editorContainer) {
                editorContainer.appendChild(this.videoPanel);
            } else {
                // Last resort, add to body
                document.body.appendChild(this.videoPanel);
            }
        }
    }

    /**
     * Set up socket event listeners
     */
    setupSocketListeners() {
        // When a new user joins the room
        this.socket.on('user-joined-video', async (data) => {
            console.log('User joined video:', data.userId);
            await this.addPeer(data.userId, false);
            this.socket.emit('request-video-connection', {
                roomId: this.roomId,
                userId: this.userId,
                targetUserId: data.userId
            });
        });
        
        // When receiving a request to connect
        this.socket.on('video-connection-request', async (data) => {
            console.log('Video connection request from:', data.userId);
            await this.addPeer(data.userId, true);
        });
        
        // When receiving an ICE candidate
        this.socket.on('ice-candidate', (data) => {
            console.log('Received ICE candidate from:', data.userId);
            const candidate = new RTCIceCandidate(data.candidate);
            if (this.peerConnections[data.userId]) {
                this.peerConnections[data.userId].addIceCandidate(candidate)
                    .catch(error => console.error('Error adding ICE candidate:', error));
            }
        });
        
        // When receiving an offer
        this.socket.on('video-offer', async (data) => {
            console.log('Received video offer from:', data.userId);
            if (!this.peerConnections[data.userId]) {
                await this.addPeer(data.userId, false);
            }
            
            try {
                await this.peerConnections[data.userId].setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await this.peerConnections[data.userId].createAnswer();
                await this.peerConnections[data.userId].setLocalDescription(answer);
                
                this.socket.emit('video-answer', {
                    roomId: this.roomId,
                    userId: this.userId,
                    targetUserId: data.userId,
                    answer: answer
                });
            } catch (error) {
                console.error('Error handling video offer:', error);
            }
        });
        
        // When receiving an answer
        this.socket.on('video-answer', async (data) => {
            console.log('Received video answer from:', data.userId);
            try {
                await this.peerConnections[data.userId].setRemoteDescription(new RTCSessionDescription(data.answer));
            } catch (error) {
                console.error('Error handling video answer:', error);
            }
        });
        
        // When a user leaves
        this.socket.on('user-left-video', (data) => {
            console.log('User left video:', data.userId);
            this.removePeer(data.userId);
        });
    }

    /**
     * Set up UI event listeners
     */
    setupUIListeners() {
        // Toggle video conferencing panel
        const toggleBtn = document.getElementById('toggleVideoConferencing');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleVideoPanel());
        }
        
        // Close video conferencing panel
        const closeBtn = document.getElementById('closeVideoConferencing');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideVideoPanel());
        }
        
        // Toggle microphone
        const micBtn = document.getElementById('toggleVideoConferencingMic');
        if (micBtn) {
            micBtn.addEventListener('click', () => this.toggleAudio());
        }
        
        // Toggle camera
        const cameraBtn = document.getElementById('toggleVideoConferencingCamera');
        if (cameraBtn) {
            cameraBtn.addEventListener('click', () => this.toggleVideo());
        }
        
        // Toggle screen sharing
        const screenShareBtn = document.getElementById('toggleScreenShare');
        if (screenShareBtn) {
            screenShareBtn.addEventListener('click', () => this.toggleScreenSharing());
        }
        
        // Leave video conference
        const leaveBtn = document.getElementById('leaveVideoConference');
        if (leaveBtn) {
            leaveBtn.addEventListener('click', () => this.leaveConference());
        }
    }

    /**
     * Toggle the video conferencing panel
     */
    async toggleVideoPanel() {
        if (this.videoPanel.classList.contains('active')) {
            this.hideVideoPanel();
        } else {
            await this.showVideoPanel();
        }
    }

    /**
     * Show the video conferencing panel and start the local stream
     */
    async showVideoPanel() {
        try {
            // Start local stream if not already started
            if (!this.localStream) {
                this.localStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                
                const localVideo = document.getElementById('localVideo');
                if (localVideo) {
                    localVideo.srcObject = this.localStream;
                }
            }
            
            // Show the panel
            this.videoPanel.classList.add('active');
            
            // Notify other users that we've joined the video conference
            this.socket.emit('join-video-conference', {
                roomId: this.roomId,
                userId: this.userId
            });
            
            // Update UI
            document.getElementById('toggleVideoConferencing').classList.add('active');
        } catch (error) {
            console.error('Error starting video conference:', error);
            alert('Could not access camera or microphone. Please check your permissions.');
        }
    }

    /**
     * Hide the video conferencing panel and stop the local stream
     */
    hideVideoPanel() {
        // Hide the panel
        this.videoPanel.classList.remove('active');
        
        // Update UI
        document.getElementById('toggleVideoConferencing').classList.remove('active');
        
        // We don't stop the streams here to maintain the connections
        // Users can toggle the panel without leaving the conference
    }

    /**
     * Add a peer connection
     * @param {string} userId - The user ID of the peer
     * @param {boolean} isInitiator - Whether this peer is the initiator of the connection
     */
    async addPeer(userId, isInitiator) {
        if (this.peerConnections[userId]) return;
        
        console.log(`Adding peer ${userId}, initiator: ${isInitiator}`);
        
        // Create a new RTCPeerConnection
        const peerConnection = new RTCPeerConnection(this.peerConfig);
        this.peerConnections[userId] = peerConnection;
        
        // Add local stream tracks to the connection
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream);
            });
        }
        
        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', {
                    roomId: this.roomId,
                    userId: this.userId,
                    targetUserId: userId,
                    candidate: event.candidate
                });
            }
        };
        
        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
            console.log(`Connection state for ${userId}:`, peerConnection.connectionState);
        };
        
        // Handle track events (receiving remote streams)
        peerConnection.ontrack = (event) => {
            console.log(`Received track from ${userId}`);
            
            // Create or get remote video element
            let remoteVideo = document.getElementById(`remoteVideo-${userId}`);
            
            if (!remoteVideo) {
                // Create remote video container
                const remoteVideoContainer = document.createElement('div');
                remoteVideoContainer.className = 'video-container remote-video-container';
                remoteVideoContainer.id = `remoteVideoContainer-${userId}`;
                
                remoteVideo = document.createElement('video');
                remoteVideo.id = `remoteVideo-${userId}`;
                remoteVideo.autoplay = true;
                remoteVideo.playsInline = true;
                
                const remoteVideoLabel = document.createElement('div');
                remoteVideoLabel.className = 'video-label';
                remoteVideoLabel.textContent = userId;
                
                remoteVideoContainer.appendChild(remoteVideo);
                remoteVideoContainer.appendChild(remoteVideoLabel);
                
                document.getElementById('videoGrid').appendChild(remoteVideoContainer);
            }
            
            // Set the remote stream as the source for the video element
            if (remoteVideo.srcObject !== event.streams[0]) {
                remoteVideo.srcObject = event.streams[0];
            }
        };
        
        // If this peer is the initiator, create and send an offer
        if (isInitiator) {
            try {
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                
                this.socket.emit('video-offer', {
                    roomId: this.roomId,
                    userId: this.userId,
                    targetUserId: userId,
                    offer: offer
                });
            } catch (error) {
                console.error('Error creating offer:', error);
            }
        }
    }

    /**
     * Remove a peer connection
     * @param {string} userId - The user ID of the peer to remove
     */
    removePeer(userId) {
        // Close the peer connection
        if (this.peerConnections[userId]) {
            this.peerConnections[userId].close();
            delete this.peerConnections[userId];
        }
        
        // Remove the remote video element
        const remoteVideoContainer = document.getElementById(`remoteVideoContainer-${userId}`);
        if (remoteVideoContainer) {
            remoteVideoContainer.remove();
        }
    }

    /**
     * Toggle audio on/off
     */
    toggleAudio() {
        if (!this.localStream) return;
        
        const audioTracks = this.localStream.getAudioTracks();
        if (audioTracks.length === 0) return;
        
        this.isAudioEnabled = !this.isAudioEnabled;
        audioTracks.forEach(track => {
            track.enabled = this.isAudioEnabled;
        });
        
        // Update UI
        const micBtn = document.getElementById('toggleVideoConferencingMic');
        if (micBtn) {
            const icon = micBtn.querySelector('i');
            if (this.isAudioEnabled) {
                icon.className = 'fas fa-microphone';
                micBtn.classList.remove('disabled');
            } else {
                icon.className = 'fas fa-microphone-slash';
                micBtn.classList.add('disabled');
            }
        }
    }

    /**
     * Toggle video on/off
     */
    toggleVideo() {
        if (!this.localStream) return;
        
        const videoTracks = this.localStream.getVideoTracks();
        if (videoTracks.length === 0) return;
        
        this.isVideoEnabled = !this.isVideoEnabled;
        videoTracks.forEach(track => {
            track.enabled = this.isVideoEnabled;
        });
        
        // Update UI
        const cameraBtn = document.getElementById('toggleVideoConferencingCamera');
        if (cameraBtn) {
            const icon = cameraBtn.querySelector('i');
            if (this.isVideoEnabled) {
                icon.className = 'fas fa-video';
                cameraBtn.classList.remove('disabled');
            } else {
                icon.className = 'fas fa-video-slash';
                cameraBtn.classList.add('disabled');
            }
        }
    }

    /**
     * Toggle screen sharing on/off
     */
    async toggleScreenSharing() {
        if (this.isScreenSharing) {
            // Stop screen sharing
            if (this.screenStream) {
                this.screenStream.getTracks().forEach(track => track.stop());
                this.screenStream = null;
            }
            
            // Replace screen share tracks with camera tracks
            if (this.localStream) {
                const videoTracks = this.localStream.getVideoTracks();
                if (videoTracks.length > 0) {
                    // Replace the track in all peer connections
                    Object.values(this.peerConnections).forEach(pc => {
                        const senders = pc.getSenders();
                        const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
                        if (videoSender) {
                            videoSender.replaceTrack(videoTracks[0]);
                        }
                    });
                    
                    // Update local video
                    const localVideo = document.getElementById('localVideo');
                    if (localVideo) {
                        localVideo.srcObject = this.localStream;
                    }
                }
            }
            
            this.isScreenSharing = false;
            
            // Update UI
            const screenShareBtn = document.getElementById('toggleScreenShare');
            if (screenShareBtn) {
                screenShareBtn.classList.remove('active');
            }
        } else {
            try {
                // Start screen sharing
                this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true
                });
                
                // When user stops screen sharing using the browser UI
                this.screenStream.getVideoTracks()[0].onended = () => {
                    this.toggleScreenSharing();
                };
                
                // Replace camera tracks with screen share tracks in all peer connections
                const screenTrack = this.screenStream.getVideoTracks()[0];
                Object.values(this.peerConnections).forEach(pc => {
                    const senders = pc.getSenders();
                    const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
                    if (videoSender) {
                        videoSender.replaceTrack(screenTrack);
                    }
                });
                
                // Update local video
                const localVideo = document.getElementById('localVideo');
                if (localVideo) {
                    localVideo.srcObject = this.screenStream;
                }
                
                this.isScreenSharing = true;
                
                // Update UI
                const screenShareBtn = document.getElementById('toggleScreenShare');
                if (screenShareBtn) {
                    screenShareBtn.classList.add('active');
                }
            } catch (error) {
                console.error('Error starting screen sharing:', error);
            }
        }
    }

    /**
     * Leave the video conference
     */
    leaveConference() {
        // Stop all streams
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
            this.screenStream = null;
        }
        
        // Close all peer connections
        Object.keys(this.peerConnections).forEach(userId => {
            this.peerConnections[userId].close();
        });
        this.peerConnections = {};
        
        // Clear the video grid
        const videoGrid = document.getElementById('videoGrid');
        if (videoGrid) {
            // Keep only the local video container
            const localVideoContainer = document.querySelector('.local-video-container');
            videoGrid.innerHTML = '';
            if (localVideoContainer) {
                videoGrid.appendChild(localVideoContainer);
                
                // Clear the local video
                const localVideo = document.getElementById('localVideo');
                if (localVideo) {
                    localVideo.srcObject = null;
                }
            }
        }
        
        // Notify other users that we've left the video conference
        this.socket.emit('leave-video-conference', {
            roomId: this.roomId,
            userId: this.userId
        });
        
        // Hide the panel
        this.hideVideoPanel();
        
        // Reset state
        this.isAudioEnabled = true;
        this.isVideoEnabled = true;
        this.isScreenSharing = false;
        
        // Update UI
        const micBtn = document.getElementById('toggleVideoConferencingMic');
        if (micBtn) {
            micBtn.querySelector('i').className = 'fas fa-microphone';
            micBtn.classList.remove('disabled');
        }
        
        const cameraBtn = document.getElementById('toggleVideoConferencingCamera');
        if (cameraBtn) {
            cameraBtn.querySelector('i').className = 'fas fa-video';
            cameraBtn.classList.remove('disabled');
        }
        
        const screenShareBtn = document.getElementById('toggleScreenShare');
        if (screenShareBtn) {
            screenShareBtn.classList.remove('active');
        }
    }
}

// Create and export the video conferencing instance
const videoConferencing = new VideoConferencing();

// Video conferencing is initialized by scripts.js
// The toggle button is already in the toolbar

// Initialize video conferencing when a user joins a room
document.addEventListener('joined-room', async () => {
    const socket = window.socket;
    const roomId = document.getElementById('room-id').value;
    const username = document.getElementById('username').value;
    
    if (socket && roomId && username) {
        await videoConferencing.initialize(socket, roomId, username);
    }
});