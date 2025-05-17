import axios from 'axios';

const API_URL = 'https://mindclash-mm6g.onrender.com';

class WebSocketService {
    constructor() {
        this.polling = false;
        this.pollInterval = null;
        this.gameCode = null;
        this._prevGameState = null;
        this._prevQuestion = null;
        this.listeners = {
            gameStateUpdate: [],
            gameStarted: [],
            nextQuestion: [],
            answerSubmitted: [],
            gameEnded: []
        };
    }

    connect(gameCode) {
        if (this.polling) {
            this.disconnect();
        }

        this.gameCode = gameCode;
        this.polling = true;
        
        // Start polling for game state updates
        this.pollInterval = setInterval(() => this.pollGameState(), 2000); // Poll every 2 seconds
        
        // Initial poll to get the current state
        this.pollGameState();
        
        console.log('Started polling for game updates');
        
        return this;
    }
    
    async pollGameState() {
        if (!this.polling || !this.gameCode) return;
        
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                this.disconnect();
                throw new Error('Authentication required');
            }
            
            const response = await axios.get(`${API_URL}/api/game/${this.gameCode}/status/`, {
                headers: { Authorization: `Token ${token}` }
            });
            
            if (response.data && response.data.success && response.data.game) {
                const gameData = response.data.game;
                if (!gameData) {
                    console.error('No game data in response:', response.data);
                    return;
                }
                
                // Ensure we have basic game state
                if (!gameData.status || !gameData.host) {
                    console.error('Missing required game state data:', gameData);
                    return;
                }
                
                // Transform player data to ensure consistent structure
                if (gameData.players) {
                    gameData.players = gameData.players.map(player => {
                        // Ensure player has required fields
                        const normalizedPlayer = {
                            ...player,
                            username: player.username || 'Unknown Player',
                            score: player.score || 0,
                            has_answered: player.has_answered || false
                        };
                        
                        // Add is_host flag if not present
                        if (gameData.host === player.username) {
                            normalizedPlayer.is_host = true;
                        }
                        
                        return normalizedPlayer;
                    });
                }
                
                // Track previous game state for detecting changes
                const prevStatus = this._prevGameState?.status;
                
                // Deep clone the game data to avoid reference issues
                this._prevGameState = JSON.parse(JSON.stringify(gameData));
                
                // Always notify about game state updates
                this.notifyListeners('gameStateUpdate', gameData);
                
                // Notify about specific state changes only when they happen
                if (gameData.status === 'in_progress' && prevStatus !== 'in_progress') {
                    console.log('Game started detected');
                    this.notifyListeners('gameStarted', gameData);
                } else if (gameData.status === 'completed' && prevStatus !== 'completed') {
                    console.log('Game ended detected');
                    this.notifyListeners('gameEnded', gameData);
                }
                
                // Check for question changes
                const prevQuestion = this._prevQuestion;
                const currentQuestion = gameData.current_question;
                
                if (prevQuestion !== undefined && 
                    currentQuestion !== undefined && 
                    prevQuestion !== currentQuestion) {
                    // console.log('Question change detected:', prevQuestion, '->', currentQuestion);
                    this.notifyListeners('nextQuestion', gameData);
                }
                
                this._prevQuestion = currentQuestion;
            } else if (response.data && response.data.error) {
                console.error('Server error while polling game:', response.data.error);
            }
        } catch (error) {
            console.error('Error polling game state:', error);
            if (error.response && error.response.status === 404) {
                // Game not found - might have ended or been deleted
                console.log('Game not found, stopping polling');
                this.disconnect();
            }
        }
    }

    disconnect() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        this.polling = false;
        this.gameCode = null;
        this._prevGameState = null;
        this._prevQuestion = null;
        console.log('Polling disconnected');
    }

    // Event emitters using HTTP requests instead of WebSockets
    async setPlayerReady(isReady = true) {
        if (!this.polling || !this.gameCode) return;
        
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            
            const response = await axios.post(
                `${API_URL}/api/game/${this.gameCode}/player/ready/`, 
                { is_ready: isReady },
                { headers: { Authorization: `Token ${token}` }}
            );
            
            // Refresh game state immediately after action
            this.pollGameState();
            return response.data;
            
        } catch (error) {
            console.error('Error setting player ready:', error);
            return { success: false, error: error.response?.data?.error || 'Failed to set ready status' };
        }
    }

    async startGame() {
        if (!this.polling || !this.gameCode) return;
        
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            
            const response = await axios.post(
                `${API_URL}/api/game/${this.gameCode}/start/`, 
                {},
                { headers: { Authorization: `Token ${token}` }}
            );
            
            // Refresh game state immediately after action
            this.pollGameState();
            return response.data;
            
        } catch (error) {
            console.error('Error starting game:', error);
            return { success: false, error: error.response?.data?.error || 'Failed to start game' };
        }
    }

    async submitAnswer(answer, answerTime) {
        if (!this.polling || !this.gameCode) return;
        
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            
            const response = await axios.post(
                `${API_URL}/api/game/${this.gameCode}/answer/`, 
                { answer, answer_time: answerTime },
                { headers: { Authorization: `Token ${token}` }}
            );
            
            // Refresh game state immediately after action
            this.pollGameState();
            return response.data;
            
        } catch (error) {
            console.error('Error submitting answer:', error);
            return { success: false, error: error.response?.data?.error || 'Failed to submit answer' };
        }
    }

    async nextQuestion() {
        if (!this.polling || !this.gameCode) return;
        
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            
            const response = await axios.post(
                `${API_URL}/api/game/${this.gameCode}/next/`, 
                {},
                { headers: { Authorization: `Token ${token}` }}
            );
            
            // Refresh game state immediately after action
            this.pollGameState();
            return response.data;
            
        } catch (error) {
            console.error('Error moving to next question:', error);
            return { success: false, error: error.response?.data?.error || 'Failed to advance to next question' };
        }
    }

    // Event listeners
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
        return this; // Allow chaining
    }

    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
        return this; // Allow chaining
    }

    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}

// Create singleton instance
const webSocketService = new WebSocketService();
export default webSocketService; 