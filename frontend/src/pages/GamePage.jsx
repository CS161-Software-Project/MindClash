import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../config';
import Chat from '../components/Chat';

const GamePage = () => {
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

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (answerResultsTimer) {
        clearTimeout(answerResultsTimer);
      }
    };
  }, [answerResultsTimer]);

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

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!roomData) return <div className="text-center p-8">Game not found</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        {waitingForPlayers ? (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Waiting for Other Players</h2>
            <p className="text-gray-600 mb-4">You&apos;ve answered the question!</p>
            <p className="text-gray-600">Please wait while other players finish answering...</p>
            <div className="mt-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          </div>
        ) : showAnswerResults ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Question Results</h2>
            <div className="space-y-4">
              {answerResults.distribution.map((option, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg ${
                    option.answer === answerResults.correctAnswer 
                      ? 'bg-green-100 border-2 border-green-500' 
                      : option.answer === answerResults.userAnswer
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{option.answer}</span>
                    <span className="text-gray-600">{option.count} players</span>
                  </div>
                  {option.answer === answerResults.correctAnswer && (
                    <div className="mt-2 text-green-600 font-semibold">
                      Correct Answer!
                    </div>
                  )}
                  {option.answer === answerResults.userAnswer && option.answer !== answerResults.correctAnswer && (
                    <div className="mt-2 text-blue-600 font-semibold">
                      Your Answer
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <p className="text-lg font-semibold">
                Your Score: {answerResults.score || 0}
              </p>
              <p className="text-gray-600 mt-2">
                Moving to leaderboard in a few seconds...
              </p>
            </div>
          </div>
        ) : showLeaderboard ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
            <div className="space-y-4">
              {leaderboardData.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-4 bg-gray-50 rounded">
                  <div className="flex items-center space-x-4">
                    <img src={player.avatar_url} alt={player.username} className="w-10 h-10 rounded-full" />
                    <span className="font-semibold">{player.username}</span>
                  </div>
                  <span className="text-lg font-bold">{player.score}</span>
                </div>
              ))}
            </div>
            {isCreator && !roomData.finished && (
              <button
                onClick={handleNextQuestion}
                className="mt-6 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Next Question
              </button>
            )}
            {!isCreator && !roomData.finished && (
              <div className="mt-6 text-center text-gray-600">
                Waiting for host to continue...
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-600">
                Question {roomData.current_question_index + 1} of {roomData.question_count}
              </h2>
              <div className="text-lg font-bold text-blue-600">
                Score: {roomData.score || 0}
              </div>
            </div>
            {currentQuestion && (
              <>
                <h3 className="text-2xl font-bold mb-6">{currentQuestion.question}</h3>
                <div className="grid grid-cols-1 gap-4">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(option)}
                      disabled={selectedAnswer !== null}
                      className={`p-4 text-left rounded-lg transition-colors ${
                        selectedAnswer === option
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            )}
            {selectedAnswer && !waitingForPlayers && (
              <div className="mt-6 text-center text-gray-600">
                Waiting for other players...
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Add Chat component */}
      <Chat pin={pin} currentUser={roomData?.current_user_id} />
    </div>
  );
};

export default GamePage;
