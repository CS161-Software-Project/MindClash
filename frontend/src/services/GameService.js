import axios from 'axios';

const API_URL = 'http://localhost:8000';

const GameService = {
    /**
     * Create a new game with the provided quiz data
     * @param {Object} quizData - The quiz data to use for the game
     * @returns {Promise} - A promise that resolves with the game code
     */
    createGame: async (quizData) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Authentication required');

            const response = await axios.post(`${API_URL}/api/game/create/`, 
                { quiz_data: quizData },
                { headers: { Authorization: `Token ${token}` } }
            );
            
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to create game' };
        }
    },

    /**
     * Join an existing game using a game code
     * @param {string} gameCode - The code of the game to join
     * @returns {Promise} - A promise that resolves when successfully joined
     */
    joinGame: async (gameCode) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Authentication required');

            const response = await axios.post(`${API_URL}/api/game/join/`, 
                { game_code: gameCode },
                { headers: { Authorization: `Token ${token}` } }
            );
            
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to join game' };
        }
    },

    /**
     * Get the current status of a game
     * @param {string} gameCode - The code of the game
     * @returns {Promise} - A promise that resolves with the game status
     */
    getGameStatus: async (gameCode) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Authentication required');

            const response = await axios.get(`${API_URL}/api/game/${gameCode}/status/`, 
                { headers: { Authorization: `Token ${token}` } }
            );
            
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to get game status' };
        }
    },

    /**
     * Start a game (host only)
     * @param {string} gameCode - The code of the game to start
     * @returns {Promise} - A promise that resolves when the game is started
     */
    startGame: async (gameCode) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Authentication required');

            const response = await axios.post(`${API_URL}/api/game/${gameCode}/start/`, 
                {},
                { headers: { Authorization: `Token ${token}` } }
            );
            
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to start game' };
        }
    },

    /**
     * Submit an answer for the current question
     * @param {string} gameCode - The code of the game
     * @param {number} answer - The index of the selected answer
     * @param {number} answerTime - The time taken to answer (in seconds)
     * @returns {Promise} - A promise that resolves with the result
     */
    submitAnswer: async (gameCode, answer, answerTime) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Authentication required');

            const response = await axios.post(`${API_URL}/api/game/${gameCode}/answer/`, 
                { answer, answer_time: answerTime },
                { headers: { Authorization: `Token ${token}` } }
            );
            
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to submit answer' };
        }
    },

    /**
     * Move to the next question (host only)
     * @param {string} gameCode - The code of the game
     * @returns {Promise} - A promise that resolves when moved to the next question
     */
    nextQuestion: async (gameCode) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Authentication required');

            const response = await axios.post(`${API_URL}/api/game/${gameCode}/next/`, 
                {},
                { headers: { Authorization: `Token ${token}` } }
            );
            
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to move to next question' };
        }
    },

    /**
     * Get the leaderboard for a game
     * @param {string} gameCode - The code of the game
     * @returns {Promise} - A promise that resolves with the leaderboard data
     */
    getLeaderboard: async (gameCode) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Authentication required');

            const response = await axios.get(`${API_URL}/api/game/${gameCode}/leaderboard/`, 
                { headers: { Authorization: `Token ${token}` } }
            );
            
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to get leaderboard' };
        }
    }
};

export default GameService; 