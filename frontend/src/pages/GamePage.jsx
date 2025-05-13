import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../config';
import Chat from '../components/Chat';
import '../styles/multiplayer.css';

export default function GamePage() {
  const { pin } = useParams();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [lastQuestionIndex, setLastQuestionIndex] = useState(null);
  const [waitingForPlayers, setWaitingForPlayers] = useState(false);
  const [showAnswerResults, setShowAnswerResults] = useState(false);
  const [answerResults, setAnswerResults] = useState(null);
  const [answerResultsTimer, setAnswerResultsTimer] = useState(null);
  const [playerScores, setPlayerScores] = useState({});
  
  // Use refs to track state that shouldn't trigger re-renders
  const isPolling = useRef(false);
  const pollTimeout = useRef(null);
  const lastUpdateTime = useRef(Date.now());

  const updatePlayerScores = useCallback((players) => {
    const newScores = {};
    players.forEach(player => {
      newScores[player.id] = {
        username: player.username,
        score: player.score,
        hasAnswered: player.has_answered
      };
    });
    setPlayerScores(newScores);
  }, []);

  const fetchGameState = useCallback(async (force = false) => {
    if (isPolling.current) return;
    
    const now = Date.now();
    if (!force && now - lastUpdateTime.current < 2000) return;

    isPolling.current = true;
    lastUpdateTime.current = now;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/game-room/${pin}/`, {
        headers: { Authorization: `Token ${token}` },
        params: { force: force ? Date.now() : undefined }
      });

      console.log('Game State Response:', {
        score: response.data.score,
        current_answer: response.data.current_answer,
        has_answered: response.data.has_answered,
        all_answered: response.data.all_answered,
        players: response.data.players
      });

      // Update player scores whenever we get new game state
      if (response.data.players) {
        updatePlayerScores(response.data.players);
      }

      if (response.data.current_question_index !== lastQuestionIndex) {
        setLastQuestionIndex(response.data.current_question_index);
        setCurrentQuestion(response.data.current_question);
        setShowLeaderboard(false);
        setSelectedAnswer(null);
        setWaitingForPlayers(false);
        setShowAnswerResults(false);
      }

      setRoomData(response.data);
      setIsCreator(response.data.creator === response.data.current_user_id);

      const isLastQuestion = response.data.current_question_index === response.data.question_count - 1;

      if (response.data.finished && response.data.all_answered) {
        navigate(`/results/${pin}`);
        return;
      }

      // If all players have answered and we're waiting, show results
      if (response.data.all_answered && waitingForPlayers && !showAnswerResults && !isLastQuestion) {
        const answerDistribution = await axios.get(`${API_URL}/answer_distribution/${pin}/`, {
          headers: { Authorization: `Token ${token}` }
        });

        console.log('Answer Distribution Response (from fetchGameState):', {
          distribution: answerDistribution.data.distribution,
          correct_answer: answerDistribution.data.correct_answer,
          score: response.data.score
        });

        // Get user's answer from selectedAnswer state
        const userAnswer = selectedAnswer;

        console.log('User Answer from State:', userAnswer);

        // Calculate score based on correct answer
        const isCorrect = userAnswer === answerDistribution.data.correct_answer;
        const newScore = isCorrect ? (response.data.score || 0) + 100 : response.data.score || 0;

        setAnswerResults({
          distribution: answerDistribution.data.distribution,
          correctAnswer: answerDistribution.data.correct_answer,
          score: newScore,
          allAnswered: true,
          userAnswer: userAnswer // Store user's answer from state
        });
        setShowAnswerResults(true);
        setWaitingForPlayers(false);

        // Update room data with new score
        setRoomData(prevData => ({
          ...prevData,
          score: newScore
        }));

        // Move to leaderboard after 10 seconds
        const timer = setTimeout(async () => {
          const leaderboardResponse = await axios.get(`${API_URL}/leaderboard/${pin}/`, {
            headers: { Authorization: `Token ${token}` }
          });
          setShowAnswerResults(false);
          setLeaderboardData(leaderboardResponse.data.leaderboard);
          setShowLeaderboard(true);
        }, 10000);
        setAnswerResultsTimer(timer);
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching game state:', error);
      setError('Failed to load game state');
      return null;
    } finally {
      isPolling.current = false;
    }
  }, [pin, navigate, lastQuestionIndex, updatePlayerScores, waitingForPlayers, showAnswerResults, selectedAnswer]);

  useEffect(() => {
    let isMounted = true;

    const initializeGame = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const userResponse = await axios.get(`${API_URL}/current_user/`, {
          headers: { Authorization: `Token ${token}` }
        });

        const gameData = await fetchGameState(true);
        if (gameData && isMounted) {
          setIsCreator(userResponse.data.id === gameData.creator);
          setLastQuestionIndex(gameData.current_question_index);
        }

        if (isMounted) {
          setLoading(false);
        }

        // Start polling with a more efficient strategy
        const poll = async () => {
          if (!isMounted) return;
          
          await fetchGameState(false);
          
          // Schedule next poll
          pollTimeout.current = setTimeout(poll, 2000);
        };

        pollTimeout.current = setTimeout(poll, 2000);

      } catch (error) {
        console.error('Error initializing game:', error);
        if (isMounted) {
          setError('Failed to load game data');
          setLoading(false);
        }
      }
    };

    initializeGame();

    return () => {
      isMounted = false;
      if (pollTimeout.current) {
        clearTimeout(pollTimeout.current);
      }
    };
  }, [pin, navigate, fetchGameState]);

  const handleAnswer = async (answer) => {
    try {
      const token = localStorage.getItem('token');
      setSelectedAnswer(answer);
      
      // Submit answer
      const response = await axios.post(
        `${API_URL}/submit_answer/`,
        { pin, answer },
        { headers: { Authorization: `Token ${token}` } }
      );

      console.log('Submit Answer Response:', {
        score: response.data.score,
        all_answered: response.data.all_answered,
        players: response.data.players,
        current_answer: response.data.current_answer
      });

      // Update room data with new score
      setRoomData(prevData => ({
        ...prevData,
        score: response.data.score,
        players: response.data.players,
        current_answer: answer // Store the answer
      }));

      const isLastQuestion = roomData.current_question_index === roomData.question_count - 1;

      if (isLastQuestion) {
        if (response.data.all_answered) {
          navigate(`/results/${pin}`);
        } else {
          setWaitingForPlayers(true);
        }
      } else {
        if (response.data.all_answered) {
          // Get answer distribution when all players have answered
          const answerDistribution = await axios.get(`${API_URL}/answer_distribution/${pin}/`, {
            headers: { Authorization: `Token ${token}` }
          });

          console.log('Answer Distribution Response:', {
            distribution: answerDistribution.data.distribution,
            correct_answer: answerDistribution.data.correct_answer,
            score: response.data.score
          });

          // Calculate score based on correct answer
          const isCorrect = answer === answerDistribution.data.correct_answer;
          const newScore = isCorrect ? (response.data.score || 0) + 100 : response.data.score || 0;

          // Show results review
          setAnswerResults({
            distribution: answerDistribution.data.distribution,
            correctAnswer: answerDistribution.data.correct_answer,
            score: newScore,
            allAnswered: true,
            userAnswer: answer // Store user's answer
          });
          setShowAnswerResults(true);
          setWaitingForPlayers(false);

          // Update room data with new score
          setRoomData(prevData => ({
            ...prevData,
            score: newScore
          }));

          // Move to leaderboard after 10 seconds
          const timer = setTimeout(async () => {
            const leaderboardResponse = await axios.get(`${API_URL}/leaderboard/${pin}/`, {
              headers: { Authorization: `Token ${token}` }
            });
            setShowAnswerResults(false);
            setLeaderboardData(leaderboardResponse.data.leaderboard);
            setShowLeaderboard(true);
          }, 10000);
          setAnswerResultsTimer(timer);
        } else {
          // Just show waiting message while others answer
          setWaitingForPlayers(true);
          setShowAnswerResults(false);
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer');
    }
  };

  const handleNextQuestion = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_URL}/game-room/${pin}/`, {
        headers: { Authorization: `Token ${token}` }
      });

      const isLastQuestion = response.data.current_question_index === response.data.question_count - 1;
      
      if (isLastQuestion) {
        const verifyResponse = await axios.get(`${API_URL}/game-room/${pin}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        
        if (!verifyResponse.data.all_answered) {
          toast.error('Not all players have answered yet');
          return;
        }
      } else if (!response.data.all_answered) {
        toast.error('Not all players have answered yet');
        return;
      }
      
      const nextResponse = await axios.post(
        `${API_URL}/next_question/`,
        { pin },
        { headers: { Authorization: `Token ${token}` } }
      );

      if (!nextResponse.data.current_question) {
        console.error('No question data in response');
        toast.error('Failed to load next question');
        return;
      }

      // Update player scores with new data
      if (nextResponse.data.players) {
        updatePlayerScores(nextResponse.data.players);
      }

      setShowLeaderboard(false);
      setSelectedAnswer(null);
      setCurrentQuestion(nextResponse.data.current_question);
      setLastQuestionIndex(nextResponse.data.current_question_index);
      setRoomData(nextResponse.data);

      await fetchGameState(true);
    } catch (error) {
      console.error('Error moving to next question:', error);
      toast.error('Failed to move to next question');
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/leaderboard/${pin}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setLeaderboardData(response.data.leaderboard);
      setShowLeaderboard(true);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (answerResultsTimer) {
        clearTimeout(answerResultsTimer);
      }
    };
  }, [answerResultsTimer]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-center border border-gray-700">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg font-medium transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading game data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto p-4 max-w-4xl">
        {waitingForPlayers ? (
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 text-center transform transition-all duration-300 hover:scale-[1.01] border border-gray-700">
            <div className="animate-bounce mb-6">
              <svg className="w-16 h-16 text-indigo-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Waiting for Other Players
            </h2>
            <p className="text-lg text-gray-300 mb-6">You've answered the question!</p>
            <div className="relative pt-1">
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
                <div 
                  style={{ width: '100%' }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse"
                ></div>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-4">Please wait while other players finish answering...</p>
          </div>
        ) : showAnswerResults ? (
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 transform transition-all duration-300 hover:scale-[1.01] border border-gray-700">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Question Results
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 mx-auto mt-2 rounded-full"></div>
            </div>
            
            <div className="space-y-4 mb-8">
              {answerResults.distribution.map((option, index) => (
                <div 
                  key={index}
                  className={`p-5 rounded-xl transition-all duration-200 transform hover:scale-[1.01] border-l-4 ${
                    option.answer === answerResults.correctAnswer 
                      ? 'bg-gray-800 border-green-500 shadow-lg' 
                      : option.answer === answerResults.userAnswer
                      ? 'bg-gray-800 border-blue-500 shadow-lg'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-lg font-medium ${
                      option.answer === answerResults.correctAnswer 
                        ? 'text-green-400' 
                        : option.answer === answerResults.userAnswer
                        ? 'text-blue-400'
                        : 'text-gray-300'
                    }`}>
                      {option.answer}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-700 text-gray-200">
                      {option.count} {option.count === 1 ? 'player' : 'players'}
                    </span>
                  </div>
                  <div className="mt-3 w-full bg-gray-700 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        option.answer === answerResults.correctAnswer 
                          ? 'bg-green-500' 
                          : option.answer === answerResults.userAnswer
                          ? 'bg-blue-500'
                          : 'bg-gray-600'
                      }`} 
                      style={{ width: `${(option.count / Math.max(...answerResults.distribution.map(o => o.count))) * 100}%` }}
                    ></div>
                  </div>
                  {option.answer === answerResults.correctAnswer && (
                    <div className="mt-2 flex items-center text-green-400 font-semibold">
                      <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Correct Answer!
                    </div>
                  )}
                  {option.answer === answerResults.userAnswer && option.answer !== answerResults.correctAnswer && (
                    <div className="mt-2 flex items-center text-blue-400 font-semibold">
                      <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Your Answer
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-center border border-gray-700">
              <p className="text-2xl font-bold text-white mb-2">
                Your Score: <span className="text-indigo-400">{answerResults.score || 0}</span>
              </p>
              <div className="flex items-center justify-center space-x-2 text-indigo-400">
                <svg className="animate-pulse w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <p className="font-medium">
                  Moving to leaderboard in a few seconds...
                </p>
              </div>
            </div>
          </div>
        ) : showLeaderboard ? (
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 transform transition-all duration-300 hover:scale-[1.01] border border-gray-700">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                Leaderboard
              </h2>
              <div className="w-32 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto mt-3 rounded-full"></div>
              <p className="text-gray-400 mt-3 text-lg">Current Standings</p>
            </div>
            
            <div className="space-y-4 mb-8">
              {leaderboardData.map((player, index) => (
                <div 
                  key={player.id} 
                  className={`flex items-center justify-between p-5 rounded-xl transition-all duration-200 transform hover:scale-[1.01] backdrop-blur-sm ${
                    index === 0 
                      ? 'bg-gradient-to-r from-amber-900/30 to-amber-800/20 border border-amber-500/30 shadow-lg' 
                      : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg' :
                      index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                      index === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-900' :
                      'bg-gradient-to-br from-gray-600 to-gray-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex items-center space-x-4">
                      <img 
                        src={player.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.username)}&background=random`} 
                        alt={player.username} 
                        className={`w-12 h-12 rounded-full border-2 ${
                          index === 0 ? 'border-amber-400' : 'border-gray-600'
                        } shadow-lg`} 
                      />
                      <div className="text-left">
                        <span className={`block text-lg font-semibold ${
                          index === 0 ? 'text-amber-300' : 'text-white'
                        }`}>
                          {player.username}
                        </span>
                        <span className="text-sm text-gray-400">
                          {player.score} points
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-lg font-bold px-4 py-2 rounded-lg ${
                      index === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' : 
                      'bg-gray-700/50 text-gray-300 border border-gray-600/30'
                    }`}>
                      {player.score} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {isCreator && !roomData.finished && (
              <button
                onClick={() => handleNextQuestion()}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:from-amber-600 hover:to-orange-600 transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-3 group"
              >
                <span>Next Question</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}
            
            {!isCreator && !roomData.finished && (
              <div className="bg-gray-800/50 rounded-xl p-5 text-center border border-gray-700 backdrop-blur-sm">
                <div className="flex items-center justify-center space-x-3 text-gray-300">
                  <svg className="animate-pulse w-6 h-6 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <p className="text-lg font-medium">
                    Waiting for host to continue...
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 transform transition-all duration-300 hover:scale-[1.01] border border-gray-700">
            <div className="flex justify-between items-center mb-8">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-full text-sm font-semibold shadow-lg">
                Question {roomData.current_question_index + 1} of {roomData.question_count}
              </div>
              <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Score: {roomData.score || 0}
              </div>
            </div>
            
            {currentQuestion && (
              <>
                <div className="mb-8">
                  <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-4">
                    {currentQuestion.question}
                  </h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"></div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 mb-6">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === option;
                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswer(option)}
                        disabled={selectedAnswer !== null}
                        className={`p-5 text-left rounded-xl transition-all duration-200 transform hover:scale-[1.02] ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg border border-blue-400/30'
                            : 'bg-gray-700/50 text-gray-200 hover:bg-gray-700 border border-gray-600/50 hover:border-blue-500/50'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                            isSelected ? 'bg-white/20' : 'bg-gray-600/50'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className={`text-lg ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                            {option}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            
            {selectedAnswer && !waitingForPlayers && (
              <div className="bg-blue-900/20 border border-blue-800/30 rounded-xl p-4 text-center backdrop-blur-sm">
                <div className="flex items-center justify-center space-x-2 text-blue-300">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-medium">Waiting for other players to answer...</span>
                </div>
                <div className="mt-2 text-sm text-blue-300">
                  You've selected: <span className="font-semibold text-white">{selectedAnswer}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Chat Component */}
      <div className="fixed bottom-6 right-6 z-10">
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700 shadow-2xl">
          <Chat pin={pin} currentUser={roomData?.current_user_id} />
        </div>
      </div>
      
      {/* Game Pin Indicator */}
      <div className="fixed top-4 right-4 bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-300">Game PIN:</span>
          <span className="font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent text-lg">
            {pin}
          </span>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(pin);
              toast.success('Game PIN copied to clipboard!');
            }}
            className="text-gray-400 hover:text-blue-400 transition-colors"
            title="Copy PIN"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
