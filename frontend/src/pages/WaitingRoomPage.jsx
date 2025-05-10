import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const WaitingRoomPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();

  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('authToken');

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/game/${code}/info/`, {
          headers: { Authorization: `Token ${token}` }
        });

        const game = res.data;

        setTimer(game.timer);
        setAnsweredCount(game.answered_count || 0); // backend must include this
        setTotalPlayers(game.total_players || 0);
        setLoading(false);

        if (game.status === 'SHOWING_LEADERBOARD') {
          navigate(`/leaderboard/${code}`);
        }
      } catch (err) {
        setError('Failed to load waiting room.');
        setLoading(false);
      }
    };

    fetchInfo();
    const interval = setInterval(fetchInfo, 1000);
    return () => clearInterval(interval);
  }, [code, navigate, token]);

  if (loading) return <div className="text-white text-center mt-12">Loading...</div>;
  if (error) return <div className="text-red-500 text-center mt-12">{error}</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white px-4">
      <div className="text-4xl font-bold mb-6 animate-pulse">Waiting for others...</div>

      <div className="text-lg mb-4">
        <span className="font-bold">{answeredCount}</span> of <span className="font-bold">{totalPlayers}</span> players have answered.
      </div>

      <div className="text-xl mb-4">Time left: <span className="text-yellow-300 font-bold">{timer}s</span></div>

      <div className="w-full max-w-sm h-2 bg-white/20 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-yellow-400 transition-all"
          style={{ width: `${(30 - timer) / 30 * 100}%` }}
        />
      </div>

      <div className="mt-4 text-sm text-white/60 italic">
        You will be taken to the leaderboard automatically
      </div>
    </div>
  );
};

export default WaitingRoomPage;
