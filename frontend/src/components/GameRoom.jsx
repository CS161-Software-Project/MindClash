import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import GameService from '../services/GameService';
import WebSocketService from '../services/WebSocketService';

const GameRoom = () => {
    const { gameCode } = useParams();
    const navigate = useNavigate();
    
    const [user, setUser] = useState(null);
    const [gameState, setGameState] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [totalTime, setTotalTime] = useState(30); // Default time per question
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [isHost, setIsHost] = useState(false);
    const [allPlayersAnswered, setAllPlayersAnswered] = useState(false);
    const [scoreAnimation, setScoreAnimation] = useState(false);
    const [answerResult, setAnswerResult] = useState(null); // 'correct', 'incorrect', or null
    const [showResults, setShowResults] = useState(false);
    
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);

    // Initialize user data from localStorage
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                if (parsedUser && parsedUser.id) {
                    setUser(parsedUser);
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, []);

    // Determine if current user is the host of the game
    useEffect(() => {
        if (user && gameState && user.id && gameState.host_id) {
            console.log('Checking host status:', user.id, gameState.host_id);
            setIsHost(user.id === gameState.host_id);
        } else {
            console.log('Missing data for host check:', { user, gameState });
            setIsHost(false);
        }
    }, [user, gameState]);
    
    // Initialize game and WebSocket connection
    useEffect(() => {
        if (!gameCode) return;
        
        const initGame = async () => {
            try {
                setLoading(true);
                
                // Get initial game state
                const response = await GameService.getGameStatus(gameCode);
                
                if (response.success) {
                    const game = response.game;
                    setGameState(game);
                    
                    // If game is in progress, get current question
                    if (game.status === 'in_progress' && game.current_question_data) {
                        setCurrentQuestion(game.current_question_data);
                        const timePerQuestion = game.quiz_data?.timePerQuestion || 30;
                        setTotalTime(timePerQuestion);
                        setTimeLeft(timePerQuestion); // Start timer at full time
                    }
                } else {
                    setError(response.error || 'Failed to get game state');
                }
                
                // Start polling for game updates
                WebSocketService.connect(gameCode)
                    .on('gameStateUpdate', handleGameStateUpdate)
                    .on('gameStarted', handleGameStarted)
                    .on('nextQuestion', handleNextQuestion)
                    .on('answerSubmitted', handleAnswerSubmitted);
                
            } catch (err) {
                setError(err.error || 'Failed to connect to game');
            } finally {
                setLoading(false);
            }
        };
        
        initGame();
        
        // Cleanup
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            WebSocketService.disconnect();
        };
    }, [gameCode, user]);

    // Game state update handler
    const handleGameStateUpdate = (data) => {
        // Make sure data is what we expect
        const game = data && (data.game || data);
        
        if (!game) {
            console.error('Invalid game data received:', data);
            return;
        }
        
        console.log('Game state update received:', game);
        setGameState(game);
        
        // Check if all players have answered
        if (game.status === 'in_progress') {
            const allAnswered = game.players && game.players.every(player => player.has_answered);
            setAllPlayersAnswered(allAnswered);
        }
    };
    
    const handleGameStarted = (data) => {
        // Make sure data is what we expect
        const game = data && (data.game || data);
        
        if (!game) {
            console.error('Invalid game data received:', data);
            return;
        }
        
        setGameState(game);
        setCurrentQuestion(game.current_question_data);
        const timePerQuestion = game.quiz_data?.timePerQuestion || 30;
        setTotalTime(timePerQuestion);
        setTimeLeft(timePerQuestion);
        startTimeRef.current = Date.now();
        startTimer();
    };
    
    const handleNextQuestion = (data) => {
        // Make sure data is what we expect
        const game = data && (data.game || data);
        
        if (!game) {
            console.error('Invalid game data received:', data);
            return;
        }
        
        setGameState(game);
        setCurrentQuestion(game.current_question_data);
        setSelectedAnswer(null);
        setAnswerResult(null);
        setShowResults(false);
        
        const timePerQuestion = game.quiz_data?.timePerQuestion || 30;
        setTotalTime(timePerQuestion);
        setTimeLeft(timePerQuestion);
        startTimeRef.current = Date.now();
        startTimer();
        
        // Reset state for next question
        setAllPlayersAnswered(false);
    };
    
    const handleAnswerSubmitted = (data) => {
        // Update UI when someone answers
        const updatedPlayers = gameState.players.map(player => {
            if (player.username === data.player) {
                return { ...player, has_answered: true };
            }
            return player;
        });
        
        setGameState(prev => ({
            ...prev,
            players: updatedPlayers
        }));
        
        // Check if all players have answered
        const allAnswered = updatedPlayers.every(player => player.has_answered);
        setAllPlayersAnswered(allAnswered);
    };

    // Timer logic
    const startTimer = () => {
        // Clear any existing timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        
        startTimeRef.current = Date.now();
        
        timerRef.current = setInterval(() => {
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            const remaining = Math.max(0, totalTime - elapsed);
            
            setTimeLeft(remaining);
            
            if (remaining <= 0) {
                clearInterval(timerRef.current);
                handleTimeUp();
            }
        }, 100); // Update more frequently for smoother countdown
    };
    
    const handleTimeUp = () => {
        // Auto-submit if no answer selected
        if (selectedAnswer === null && gameState?.status === 'in_progress') {
            handleSubmitAnswer(-1); // -1 indicates no answer
        }
    };

    // User interactions
    const handleAnswerSelect = (answerIndex) => {
        if (selectedAnswer !== null || gameState?.status !== 'in_progress') return;
        
        setSelectedAnswer(answerIndex);
        handleSubmitAnswer(answerIndex);
    };
    
    const handleSubmitAnswer = async (answerIndex) => {
        try {
            if (!gameCode || gameState?.status !== 'in_progress') return;
            
            // Calculate time taken to answer
            const answerTime = totalTime - timeLeft;
            
            // Submit answer to server
            const response = await GameService.submitAnswer(
                gameCode, 
                answerIndex, 
                answerTime
            );
            
            // Show animation for score
            if (response.success) {
                setScoreAnimation(true);
                setTimeout(() => setScoreAnimation(false), 1500);
                
                // Check if answer was correct (this requires backend to return correct/incorrect)
                if (response.correct === true) {
                    setAnswerResult('correct');
                } else if (response.correct === false) {
                    setAnswerResult('incorrect');
                }
            }
            
        } catch (err) {
            console.error("Failed to submit answer:", err);
        }
    };
    
    const handleNextQuestionClick = async () => {
        try {
            if (!gameCode || !isHost) return;
            
            await GameService.nextQuestion(gameCode);
            
        } catch (err) {
            console.error("Failed to move to next question:", err);
        }
    };
    
    const handleStartGameClick = async () => {
        try {
            if (!gameCode || !isHost) return;
            
            const response = await GameService.startGame(gameCode);
            
            if (!response.success) {
                // Handle specific error cases
                if (response.error === 'Game has already started or ended') {
                    // If game is already started, just refresh the game state
                    await fetchGameStatus();
                } else {
                    setError(response.error || 'Failed to start game');
                }
            }
            
        } catch (err) {
            console.error("Failed to start game:", err);
            setError(err.error || 'Failed to start game. Please try again.');
        }
    };
    
    const handleLeaveGame = () => {
        navigate('/');
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B1026] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-[#0B1026] flex items-center justify-center">
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-8 text-red-200 max-w-md text-center">
                    <h2 className="text-xl font-bold mb-4">Error</h2>
                    <p>{error}</p>
                    <button 
                        onClick={handleLeaveGame} 
                        className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // Game not found or loaded
    if (!gameState) {
        return (
            <div className="min-h-screen bg-[#0B1026] flex items-center justify-center">
                <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 text-indigo-200 max-w-md text-center">
                    <h2 className="text-xl font-bold mb-4">Game Not Found</h2>
                    <p>The game you are looking for does not exist or has ended.</p>
                    <button 
                        onClick={handleLeaveGame} 
                        className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B1026] relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full filter blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl"></div>
            </div>

            {/* Main Content */}
            <div className="relative min-h-screen flex flex-col" style={{ zIndex: 2 }}>
                {/* Header */}
                <header className="bg-white/10 backdrop-blur-lg border-b border-indigo-500/20 py-4 px-6">
                    <div className="flex items-center justify-between max-w-7xl mx-auto">
                        <div className="text-indigo-200">
                            Game: <span className="font-bold">{gameCode}</span>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            {gameState?.status === 'in_progress' && (
                                <div className="text-indigo-200">
                                    Question: <span className="font-bold">{gameState.current_question + 1}</span>
                                </div>
                            )}
                            
                            {gameState?.status === 'in_progress' && timeLeft > 0 && (
                                <div className="text-indigo-200 flex items-center">
                                    Time: 
                                    <div 
                                        className={`ml-2 font-mono font-bold ${
                                            timeLeft < 5 ? 'text-red-400' : timeLeft < 10 ? 'text-yellow-400' : 'text-green-400'
                                        }`}
                                    >
                                        {Math.ceil(timeLeft)}s
                                    </div>
                                    
                                    {/* Timer progress bar */}
                                    <div className="w-24 h-2 bg-white/10 rounded-full ml-2 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${
                                                timeLeft < 5 ? 'bg-red-500' : timeLeft < 10 ? 'bg-yellow-500' : 'bg-green-500'
                                            }`}
                                            style={{ width: `${(timeLeft / totalTime) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                            
                            <button
                                onClick={handleLeaveGame}
                                className="px-4 py-1 bg-white/10 hover:bg-white/20 text-indigo-200 rounded-md transition-colors"
                            >
                                Leave Game
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content - Different views based on game state */}
                <main className="flex-grow container mx-auto py-8 px-4">
                    {/* Waiting Room */}
                    {gameState.status === 'waiting' && (
                        <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-indigo-500/20">
                            <h2 className="text-3xl font-bold text-indigo-200 mb-6 text-center">
                                Waiting for Players
                            </h2>
                            
                            <div className="mb-8 text-center">
                                <div className="text-indigo-300 mb-2">Game Code:</div>
                                <div className="text-4xl font-bold text-indigo-200 tracking-wider">
                                    {gameCode}
                                </div>
                                <div className="text-indigo-400 text-sm mt-2">
                                    Share this code with friends to join
                                </div>
                            </div>
                            
                            <div className="mb-8">
                                <h3 className="text-xl font-semibold text-indigo-200 mb-4">
                                    Players ({gameState.players.length})
                                </h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {gameState.players.map((player, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                                        >
                                            <div className="flex items-center">
                                                <span className="text-indigo-200 font-medium">
                                                    {player.username}
                                                </span>
                                                {player.username === gameState.host && (
                                                    <span className="ml-2 text-xs px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full">
                                                        Host
                                                    </span>
                                                )}
                                            </div>
                                            {player.is_ready && (
                                                <span className="text-green-400 text-sm">Ready</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {isHost ? (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleStartGameClick}
                                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                                >
                                    Start Game
                                </motion.button>
                            ) : (
                                <div className="text-center text-indigo-300">
                                    Waiting for host to start the game...
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Game in Progress */}
                    {gameState.status === 'in_progress' && currentQuestion && (
                        <div className="max-w-3xl mx-auto">
                            {/* Question Card */}
                            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-indigo-500/20 mb-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-semibold text-indigo-200">
                                        Question {gameState.current_question + 1}
                                    </h3>
                                    {timeLeft > 0 && (
                                        <div className={`text-2xl font-bold ${
                                            timeLeft < 5 ? 'text-red-400' : timeLeft < 10 ? 'text-yellow-400' : 'text-green-400'
                                        }`}>
                                            {Math.ceil(timeLeft)}
                                        </div>
                                    )}
                                </div>
                                
                                <h2 className="text-2xl font-bold text-indigo-200 mb-8">
                                    {currentQuestion.question}
                                </h2>
                                
                                <div className="grid grid-cols-1 gap-4">
                                    {currentQuestion.options.map((option, index) => (
                                        <motion.button
                                            key={index}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleAnswerSelect(index)}
                                            disabled={selectedAnswer !== null || timeLeft <= 0}
                                            className={`w-full p-4 rounded-lg text-left transition-all ${
                                                selectedAnswer === index
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-white/5 text-indigo-200 hover:bg-white/10'
                                            } ${
                                                selectedAnswer !== null || timeLeft <= 0
                                                    ? 'opacity-80 cursor-not-allowed'
                                                    : 'cursor-pointer'
                                            }`}
                                        >
                                            <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
                                            {option}
                                        </motion.button>
                                    ))}
                                </div>
                                
                                {/* Answer result feedback */}
                                {answerResult && (
                                    <div className={`mt-6 p-4 rounded-lg text-center ${
                                        answerResult === 'correct' 
                                            ? 'bg-green-500/20 border border-green-500/30 text-green-300' 
                                            : 'bg-red-500/20 border border-red-500/30 text-red-300'
                                    }`}>
                                        {answerResult === 'correct' 
                                            ? 'Correct answer! Good job!' 
                                            : 'Incorrect answer!'}
                                    </div>
                                )}
                                
                                {/* Next question button for host */}
                                {isHost && allPlayersAnswered && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleNextQuestionClick}
                                        className="w-full mt-8 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                                    >
                                        Next Question
                                    </motion.button>
                                )}
                            </div>
                            
                            {/* Players Status */}
                            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-indigo-500/20">
                                <h3 className="text-xl font-semibold text-indigo-200 mb-4">
                                    Players
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {gameState.players.map((player, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-center justify-between p-3 rounded-lg ${
                                                player.has_answered 
                                                    ? 'bg-green-500/10 border border-green-500/20' 
                                                    : 'bg-white/5'
                                            }`}
                                        >
                                            <span className="text-indigo-200">
                                                {player.username}
                                                {player.username === gameState.host && ' (Host)'}
                                            </span>
                                            <div className="flex items-center">
                                                <span className={`text-sm ${
                                                    player.has_answered ? 'text-green-400' : 'text-indigo-400'
                                                }`}>
                                                    {player.has_answered ? 'Answered' : 'Waiting'}
                                                </span>
                                                <div className="ml-2 text-indigo-200 font-semibold">
                                                    {player.score || 0}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Game Completed - Show Leaderboard */}
                    {gameState.status === 'completed' && (
                        <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-indigo-500/20">
                            <h2 className="text-3xl font-bold text-indigo-200 mb-6 text-center">
                                Game Over!
                            </h2>
                            
                            <div className="mb-8">
                                <h3 className="text-xl font-semibold text-indigo-200 mb-4 text-center">
                                    Final Scores
                                </h3>
                                
                                <div className="space-y-3 max-w-md mx-auto">
                                    {/* Sort players by score */}
                                    {[...gameState.players]
                                        .sort((a, b) => b.score - a.score)
                                        .map((player, index) => (
                                            <div
                                                key={index}
                                                className={`flex items-center justify-between p-4 bg-white/5 rounded-lg ${
                                                    index === 0 ? 'border border-yellow-500/50 bg-yellow-500/10' : ''
                                                }`}
                                            >
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 flex items-center justify-center font-bold mr-3 rounded-full bg-indigo-500/20 text-indigo-300">
                                                        {index + 1}
                                                    </div>
                                                    <span className="text-indigo-200 font-medium">
                                                        {player.username}
                                                        {player.username === gameState.host && ' (Host)'}
                                                    </span>
                                                </div>
                                                <span className="text-indigo-200 font-bold">
                                                    {player.score || 0} pts
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                            
                            <div className="flex justify-center">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleLeaveGame}
                                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                                >
                                    Back to Home
                                </motion.button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default GameRoom; 