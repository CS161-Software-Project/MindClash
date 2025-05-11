import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const LobbyPage = () => {
  const { pin } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isCreator, setIsCreator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let pollInterval = null;

    const fetchUserAndRoom = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Get current user
        const userRes = await fetch('http://localhost:8000/api/current_user/', {
          headers: { Authorization: `Token ${token}` },
        });
        const userData = await userRes.json();

        // Get room data
        const roomRes = await fetch(`http://localhost:8000/api/game-room/${pin}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        
        if (!roomRes.ok) {
          if (roomRes.status === 404) {
            setError('Game room not found');
            setIsLoading(false);
            return;
          }
          throw new Error('Failed to fetch room data');
        }

        const roomData = await roomRes.json();
        setRoom(roomData);
        setPlayers(roomData.players || []);
        setIsCreator(userData.id === roomData.creator);
        setIsLoading(false);
        setError(null);

        // If game is already started, redirect to game page
        if (roomData.started) {
          navigate(`/game/${pin}`);
          return;
        }

        // Start polling for updates
        pollInterval = setInterval(async () => {
          try {
            const updatedRoomRes = await fetch(`http://localhost:8000/api/game-room/${pin}/`, {
              headers: { Authorization: `Token ${token}` },
            });
            
            if (!updatedRoomRes.ok) {
              if (updatedRoomRes.status === 404) {
                clearInterval(pollInterval);
                setError('Game room not found');
                return;
              }
              throw new Error('Failed to fetch room data');
            }

            const updatedRoomData = await updatedRoomRes.json();
            setRoom(updatedRoomData);
            setPlayers(updatedRoomData.players || []);

            if (updatedRoomData.started) {
              clearInterval(pollInterval);
              navigate(`/game/${pin}`);
            }
          } catch (err) {
            console.error('Error polling room state:', err);
            clearInterval(pollInterval);
            setError('Failed to fetch room updates');
          }
        }, 2000);
      } catch (err) {
        console.error('Error fetching user or room data:', err);
        setError('Failed to fetch room data');
        setIsLoading(false);
      }
    };

    fetchUserAndRoom();

    // Cleanup function
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pin, navigate]);

  const handleStartGame = async () => {
    if (!isCreator) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/start_game/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pin })
      });

      const data = await response.json();

      if (response.ok) {
        navigate(`/game/${pin}`);
      } else {
        toast.error(data.error || 'Failed to start game');
      }
    } catch (err) {
      console.error('Error starting game:', err);
      toast.error('Failed to start game');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-100 min-h-screen">
        <div className="text-xl font-semibold mb-4">Loading room...</div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-100 min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-100 min-h-screen">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold mb-4">Game Room: {pin}</h1>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Topic: {room.topic}</h2>
            <p className="text-gray-600">Difficulty: {room.difficulty}</p>
            <p className="text-gray-600">Questions: {room.question_count}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Players ({players.length})</h3>
            <div className="grid grid-cols-2 gap-4">
              {players.map(player => (
                <div key={player.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <img src={player.avatar_url} alt={player.username} className="w-8 h-8 rounded-full" />
                  <span>{player.username}</span>
                </div>
              ))}
            </div>
          </div>

          {isCreator && !room.started && (
            <button
              onClick={handleStartGame}
              disabled={players.length < 2}
              className={`w-full py-3 rounded-lg text-white font-semibold ${
                players.length < 2
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
            >
              {players.length < 2
                ? 'Need at least 2 players to start'
                : 'Start Game'}
            </button>
          )}

          {!isCreator && !room.started && (
            <div className="text-center text-gray-600">
              Waiting for host to start the game...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;
