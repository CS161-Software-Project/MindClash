import { api } from './AuthService';

const API_URL = 'https://mindclash-mm6g.onrender.com';

const GameService = {
    /**
     * Create a new game with the provided quiz data
     * @param {Object} quizData - The quiz data to use for the game
     * @returns {Promise} - A promise that resolves with the game code
     */
    createGame: async (quizData) => {
        try {
            console.log('Sending quiz data to server:', JSON.stringify(quizData, null, 2));
            
            const response = await api.post('/api/game/create/', { 
                quiz_data: quizData 
            });
            
            // console.log('Server response:', response.data);
            return response.data;
            
        } catch (error) {
            console.error('Error creating game:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText,
                headers: error.response?.headers,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    data: error.config?.data,
                    headers: error.config?.headers
                }
            });
            
            // Return a more detailed error object
            return { 
                error: error.response?.data?.error || 
                      error.response?.data?.message || 
                      error.message || 
                      'Failed to create game',
                status: error.response?.status,
                details: error.response?.data
            };
        }
    },

    /**
     * Join an existing game using a game code
     * @param {string} gameCode - The code of the game to join
     * @returns {Promise} - A promise that resolves when successfully joined
     */
    joinGame: async (gameCode) => {
        try {
            const response = await api.post('/api/game/join/', { 
                game_code: gameCode 
            });
            
            // console.log('Join game response:', response.data);
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
            const response = await api.get(`/api/game/${gameCode}/status/`);
            // console.log('Game status response:', response.data);
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
            const response = await api.post(`/api/game/${gameCode}/start/`, {});
            // console.log('Start game response:', response.data);
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
            console.log(`[GameService] Submitting answer: ${answer} (time: ${answerTime})`);
            const response = await api.post(`/api/game/${gameCode}/answer/`, { 
                answer, 
                answer_time: answerTime 
            });
            console.log('[GameService] Success response:', response.data);
            
            // console.log('Submit answer response:', response.data);
            return response.data;
        } catch (error) {
            console.error('[GameService] Submit failed:', error.response?.data || error.message);
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
            const response = await api.post(`/api/game/${gameCode}/next/`, {});
            // console.log('Next question response:', response.data);
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
            const response = await api.get(`/api/game/${gameCode}/leaderboard/`);
            console.log('Leaderboard response:', response.data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { error: 'Failed to get leaderboard' };
        }
    }
};

export default GameService;