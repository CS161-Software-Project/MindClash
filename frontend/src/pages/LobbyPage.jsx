import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const LobbyPage = () => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [starting, setStarting] = useState(false);
  const [localTimer, setLocalTimer] = useState(30);
  const [lastTimer, setLastTimer] = useState(30);
  const intervalRef = useRef(null);
  const navigate = useNavigate();
  const { code } = useParams();

  useEffect(() => {
    let stopped = false;
    const fetchGame = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await axios.get(`http://localhost:8000/api/game/${code}/info/`, {
          headers: { Authorization: `Token ${token}` }
        });
        if (!res.data || !res.data.code) {
          setError('Game not found or incomplete data.');
          setLoading(false);
          stopped = true;
          return;
        }
        setGame(res.data);
        const user = JSON.parse(localStorage.getItem('user'));
        console.log("Logged-in user:", user);
        console.log("Game host:", res.data.host);
        setIsHost(res.data.host === user?.username);

        if (res.data.timer > lastTimer) {
          setLocalTimer(res.data.timer);
        }
        setLastTimer(res.data.timer);
        if (res.data.finished) {
          stopped = true;
          navigate(`/podium/${code}`);
          return;
        }
        if (res.data.status === 'IN_PROGRESS') {
          stopped = true;
          navigate(`/game/${code}`);
          return;
        }
        setLoading(false);
      } catch {
        setError('Failed to fetch game info.');
        setLoading(false);
        stopped = true;
      }
    };

    fetchGame();
    intervalRef.current = setInterval(() => {
      if (!stopped) fetchGame();
    }, 2000);

    return () => clearInterval(intervalRef.current);
  }, [navigate, code, lastTimer]);

  useEffect(() => {
    if (game && !game.started && localTimer > 0) {
      const timerId = setTimeout(() => setLocalTimer(t => t - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [game, localTimer]);

  const handleStart = async () => {
    setStarting(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      await axios.post(`http://localhost:8000/api/game/${code}/start/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      navigate(`/game/${code}`);
    } catch (err) {
      console.error('Error starting game:', err.response?.data?.detail || err.message);
      setError(err.response?.data?.detail || 'Failed to start game.');
    }
    setStarting(false);
  };

  if (error) return <div className="flex items-center justify-center min-h-screen text-red-400">{error}</div>;
  if (loading) return <div className="flex items-center justify-center min-h-screen text-indigo-200">Loading lobby...</div>;
  if (!game) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-2xl bg-white/10 dark:bg-gray-800/80 rounded-2xl p-8 shadow-xl border border-white/20">
        <h1 className="text-3xl font-bold text-center mb-4 text-indigo-200 dark:text-indigo-100">Quiz Lobby</h1>
        <div className="flex flex-col items-center mb-6">
          <div className="text-lg text-indigo-300 dark:text-indigo-200">Game Code:</div>
          <div className="text-4xl font-mono font-bold text-indigo-400 dark:text-indigo-300 tracking-widest bg-white/10 px-6 py-2 rounded-lg mt-2">{game.code}</div>
        </div>
        <div className="mb-6">
          <div className="text-indigo-200 mb-2">Players:</div>
          <div className="flex flex-wrap gap-4 justify-center">
            {(game.players || []).map((p, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-white font-bold"
                style={{
                  background: p.is_host ? 'rgba(99,102,241,0.3)' : 'rgba(236,72,153,0.3)',
                  borderColor: p.is_host ? '#6366f1' : '#ec4899'
                }}
              >
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.username} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>{p.username ? p.username[0].toUpperCase() : '?'}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="mb-6 flex flex-col items-center">
          <div className="text-indigo-200 mb-1">Game starts in:</div>
          <div className="text-3xl font-mono text-indigo-300 dark:text-indigo-200">{localTimer}s</div>
        </div>
        <div className="mb-6">
          <div className="bg-white/10 dark:bg-gray-700/80 rounded-lg p-4 h-32 overflow-y-auto mb-2">Chat will appear here...</div>
          <input className="w-full px-3 py-2 rounded-lg bg-white/20 dark:bg-gray-800/40 text-white placeholder-indigo-200" placeholder="Type a message..." />
        </div>
        <div className="flex justify-center">
          {isHost && (
            <button
              onClick={handleStart}
              disabled={starting}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-bold shadow-lg hover:from-indigo-600 hover:to-purple-600 transition-all"
            >
              {starting ? 'Starting...' : 'Start Quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LobbyPage;
