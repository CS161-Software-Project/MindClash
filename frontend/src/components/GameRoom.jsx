import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import GameService from '../services/GameService';
import WebSocketService from '../services/WebSocketService';
import Leaderboard from './Leaderboard';
import Chat from "./Chat"
import ResultsPage from "./ResultsPage"
import CorrectAnswer from './CorrectAnswer';
import axios from 'axios';

const GameRoom = () => {
    const { gameCode } = useParams();
    const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(30);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [allPlayersAnswered, setAllPlayersAnswered] = useState(false);
  const [scoreAnimation, setScoreAnimation] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [answerDistribution, setAnswerDistribution] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState('');

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (showResults && gameState?.status === 'in_progress') {
      fetchAnswerDistribution();
      setShowCorrectAnswer(true);

      const timer = setTimeout(() => {
        setShowCorrectAnswer(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showResults, gameState?.status]);

  const fetchAnswerDistribution = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`https://mindclash-mm6g.onrender.com/api/answer_distribution/${gameCode}/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAnswerDistribution(response.data.distribution || []);
      setCorrectAnswer(response.data.correct_answer);
    } catch (error) {
      console.error('Failed to fetch answer distribution:', error);
    }
  };

  useEffect(() => {
    const loadUser = () => {
      try {
        let userData =
          sessionStorage.getItem('user') ||
          localStorage.getItem('user') ||
          localStorage.getItem('userData');

        if (userData) {
          const parsedUser = JSON.parse(userData);
          if (!parsedUser.username && parsedUser.email) {
            parsedUser.username = parsedUser.email.split('@')[0];
          }
          setUser(parsedUser);
          return true;
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
      return false;
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (user && gameState && user.username) {
      const isUserHost = user.username.toLowerCase() === gameState.host?.toLowerCase();
      setIsHost(isUserHost);
    }
  }, [user, gameState]);

  useEffect(() => {
    if (!gameCode) return;

    const initGame = async () => {
      try {
        setLoading(true);
        const response = await GameService.getGameStatus(gameCode);
        if (response.success) {
          const game = response.game;
          setGameState(game);
          if (game.status === 'in_progress' && game.current_question_data) {
            setCurrentQuestion(game.current_question_data);
            const timePerQuestion = game.quiz_data?.timePerQuestion || 30;
            setTotalTime(timePerQuestion);
            setTimeLeft(timePerQuestion);
          }
        }

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

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      WebSocketService.disconnect();
    };
  }, [gameCode, user]);

  const handleGameStateUpdate = (data) => {
    const game = data && (data.game || data);
    if (!game) return;

    setGameState(game);
    if (game.current_question_data) setCurrentQuestion(game.current_question_data);

    const allAnswered = game.players.every((p) => p.has_answered);
    setAllPlayersAnswered(allAnswered);
    if (allAnswered) setShowResults(true);
  };

  const handleGameStarted = (data) => {
    const game = data && (data.game || data);
    if (!game) return;
    setGameState(game);
    setCurrentQuestion(game.current_question_data);
    const timePerQuestion = game.quiz_data?.timePerQuestion || 30;
    setTotalTime(timePerQuestion);
    setTimeLeft(timePerQuestion);
    startTimeRef.current = Date.now();
    startTimer();
  };

  const handleNextQuestion = (data) => {
    const game = data && (data.game || data);
    if (!game) return;
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
    setAllPlayersAnswered(false);
  };

  const handleAnswerSubmitted = (data) => {
    console.log('Answer submitted by', data.player);
  };

  const handleStartGameClick = async () => {
    try {
      if (!gameCode || !isHost) return;
      const response = await GameService.startGame(gameCode);
      if (!response.success) {
        setError(response.error || 'Failed to start game');
      }
    } catch (err) {
      console.error('Start game error:', err);
      setError(err.message || 'Failed to start game');
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, totalTime - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        handleTimeUp();
      }
    }, 100);
  };

  const handleTimeUp = () => {
    if (selectedAnswer === null && gameState?.status === 'in_progress') {
      handleSubmitAnswer(-1);
    }
  };

  const handleAnswerSelect = (index) => {
    if (selectedAnswer !== null || gameState?.status !== 'in_progress') return;
    setSelectedAnswer(index);
    handleSubmitAnswer(index);
  };

  const handleSubmitAnswer = async (index) => {
    try {
      if (!gameCode || gameState?.status !== 'in_progress') return;
      const answerTime = totalTime - timeLeft;
      const response = await GameService.submitAnswer(gameCode, index, answerTime);
      if (response.success) {
        setScoreAnimation(true);
        setTimeout(() => setScoreAnimation(false), 1500);
        if (response.correct === true) setAnswerResult('correct');
        else if (response.correct === false) setAnswerResult('incorrect');
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

  const handleLeaveGame = () => navigate('/');

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
                          {/* Question Card or Leaderboard View */}
                          {!showResults ? (
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
                          )  :showCorrectAnswer ? (
                            <CorrectAnswer
                              distribution={answerDistribution}
                              correctAnswer={correctAnswer}
                              userAnswer={currentQuestion?.options[selectedAnswer] || null}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center space-y-8">
                              <Leaderboard players={gameState.players} title="Question Results" />
                              {isHost && allPlayersAnswered && (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={handleNextQuestionClick}
                                  className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-lg font-semibold"
                                >
                                  Next Question
                                </motion.button>
                              )}
                            </div>
                          )}

                          {/* Players Status */}
                          {!showResults && (
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
                                      <div className="ml-2 text-yellow-400 text-sm font-semibold">
  🔥 Streak: {player.current_streak || 0}
</div>
                                    </div>  
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                     {/* Chat Component */}
                     <div className="fixed bottom-6 right-6 z-40">
                    <Chat 
                        pin={gameCode} 
                        currentUser={user?.id} 
                    />
                    </div>
                    
                    
                    {/* Game Completed - Show Leaderboard */}
                    {gameState.status === 'completed' && (

                            <ResultsPage
                                players={gameState.players}
                                title="Final Scores"
                                onBack={handleLeaveGame}
                            />
                    )}
                </main>
            </div>
        </div>
    );
};

export default GameRoom; 