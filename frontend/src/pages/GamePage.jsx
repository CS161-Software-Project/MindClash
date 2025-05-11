import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../config';

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
  
  // Use refs to track state that shouldn't trigger re-renders
  const isPolling = useRef(false);
  const pollTimeout = useRef(null);
  const lastUpdateTime = useRef(Date.now());

  const fetchGameState = useCallback(async (force = false) => {
    // Prevent concurrent polling
    if (isPolling.current) return;
    
    // Don't poll if we've updated in the last 2 seconds (unless forced)
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

      // Only update if the question index has changed
      if (response.data.current_question_index !== lastQuestionIndex) {
        setLastQuestionIndex(response.data.current_question_index);
        setCurrentQuestion(response.data.current_question);
        setShowLeaderboard(false);
        setSelectedAnswer(null);
        setWaitingForPlayers(false);
      }

      // Always update room data to ensure score is current
      setRoomData(response.data);
      setIsCreator(response.data.creator === response.data.current_user_id);

      // Check if this is the last question
      const isLastQuestion = response.data.current_question_index === response.data.question_count - 1;

      // If game is finished and all players have answered, navigate to results page
      if (response.data.finished && response.data.all_answered) {
        navigate(`/results/${pin}`);
        return;
      }

      // For the last question, only show waiting page if player has answered AND others haven't
      if (isLastQuestion && response.data.has_answered && !response.data.all_answered) {
        setWaitingForPlayers(true);
        setShowLeaderboard(false);
      }

      // Only show leaderboard if all players have answered and it's not already showing
      if (response.data.all_answered && !showLeaderboard && !isLastQuestion) {
        const leaderboardResponse = await axios.get(`${API_URL}/leaderboard/${pin}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        setLeaderboardData(leaderboardResponse.data.leaderboard);
        setShowLeaderboard(true);
        setWaitingForPlayers(false);
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching game state:', error);
      setError('Failed to load game state');
      return null;
    } finally {
      isPolling.current = false;
    }
  }, [pin, navigate, lastQuestionIndex, showLeaderboard]);

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
      
      const response = await axios.post(
        `${API_URL}/submit_answer/`,
        { pin, answer },
        { headers: { Authorization: `Token ${token}` } }
      );

      // Update the player's score immediately from the response
      if (response.data.score !== undefined) {
        // Update both roomData and local state
        setRoomData(prevData => ({
          ...prevData,
          score: response.data.score
        }));
        
        // Also update the score in the leaderboard data if it exists
        setLeaderboardData(prevData => 
          prevData.map(player => 
            player.id === response.data.player_id 
              ? { ...player, score: response.data.score }
              : player
          )
        );
      }

      // Check if this is the last question
      const isLastQuestion = roomData.current_question_index === roomData.question_count - 1;

      if (isLastQuestion) {
        if (response.data.all_answered) {
          // If all players have answered the last question, navigate to results
          navigate(`/results/${pin}`);
        }
      } else if (response.data.all_answered) {
        // For non-last questions, show leaderboard when all have answered
        await fetchLeaderboard();
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer');
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

  const handleNextQuestion = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Check if we can move to next question
      const response = await axios.get(`${API_URL}/game-room/${pin}/`, {
        headers: { Authorization: `Token ${token}` }
      });

      // For the last question, we need to ensure all players have answered
      const isLastQuestion = response.data.current_question_index === response.data.question_count - 1;
      
      if (isLastQuestion) {
        // Double check the game state to ensure all players have answered
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

      // Reset states for next question
      setShowLeaderboard(false);
      setSelectedAnswer(null);
      
      // Update current question immediately
      setCurrentQuestion(nextResponse.data.current_question);
      setLastQuestionIndex(nextResponse.data.current_question_index);
      
      // Update room data
      setRoomData(nextResponse.data);

      // Force an immediate game state update
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
    <div className="container mx-auto p-4">
      {waitingForPlayers ? (
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Waiting for Other Players</h2>
          <p className="text-gray-600 mb-4">You&apos;ve answered the final question!</p>
          <p className="text-gray-600">Please wait while other players finish answering...</p>
          <div className="mt-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
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
                        ? option === currentQuestion.answer
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
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
  );
};

export default GamePage;
