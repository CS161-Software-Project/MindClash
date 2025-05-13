import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './styles/multiplayer.css';

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

  return (
    <div className="multiplayer-container">
      {isLoading ? (
        <div className="multiplayer-loading">
          <div className="multiplayer-loading-spinner"></div>
        </div>
      ) : error ? (
        <div className="multiplayer-error">{error}</div>
      ) : (
        <div className="multiplayer-card">
          <div className="flex justify-between items-center mb-6">
            <h1 className="multiplayer-title">Game Lobby</h1>
            <div className="multiplayer-stats">
              <div className="multiplayer-stat-card">
                <div className="multiplayer-stat-label">PIN</div>
                <div className="multiplayer-stat-value">{pin}</div>
              </div>
              <div className="multiplayer-stat-card">
                <div className="multiplayer-stat-label">Players</div>
                <div className="multiplayer-stat-value">{players.length}/{room?.max_players || 4}</div>
              </div>
            </div>
          </div>
          <div className="multiplayer-list">
            {players.map((player) => (
              <div key={player.id} className="multiplayer-list-item">
                <img
                  src={player.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
                  alt="Player avatar"
                  className="multiplayer-avatar"
                />
                <div>
                  <h3 className="font-semibold">{player.username}</h3>
                  <p className="text-sm text-gray-500">Score: {player.score}</p>
                </div>
                <span className="multiplayer-status">
                  {room?.started ? 'Playing' : 'Waiting'}
                </span>
              </div>
            ))}
          </div>
          {isCreator && !room?.started && (
            <button
              onClick={handleStartGame}
              disabled={players.length < 2}
              className={`multiplayer-button mt-6 ${
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
          {!isCreator && !room?.started && (
            <div className="text-center text-gray-600">
              Waiting for host to start the game...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LobbyPage;
