import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PodiumPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFinalResults = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await axios.get(`http://localhost:8000/api/game/${code}/leaderboard/`, {
          headers: { Authorization: `Token ${token}` }
        });
        setPlayers(res.data.players);
      } catch (err) {
        setError('Failed to fetch final scores');
      } finally {
        setLoading(false);
      }
    };

    fetchFinalResults();
  }, [code]);

  if (loading) return <div className="text-white text-center mt-12">Loading results...</div>;
  if (error) return <div className="text-red-500 text-center mt-12">{error}</div>;
  if (players.length === 0) return <div className="text-white text-center mt-12">No players found.</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-700 via-yellow-500 to-yellow-300 text-white px-4">
      <h1 className="text-4xl font-bold mb-6">🏆 Game Over - Podium</h1>

      <div className="flex gap-8 justify-center items-end mb-8">
        {/* 2nd place */}
        {players[1] && (
          <div className="flex flex-col items-center">
            <div className="text-3xl">🥈</div>
            <div className="text-xl font-bold">{players[1].username}</div>
            <div className="text-white/80">{players[1].score} pts</div>
          </div>
        )}

        {/* 1st place */}
        {players[0] && (
          <div className="flex flex-col items-center transform scale-125">
            <div className="text-5xl">🥇</div>
            <div className="text-2xl font-bold">{players[0].username}</div>
            <div className="text-white/90 text-lg">{players[0].score} pts</div>
          </div>
        )}

        {/* 3rd place */}
        {players[2] && (
          <div className="flex flex-col items-center">
            <div className="text-2xl">🥉</div>
            <div className="text-xl font-bold">{players[2].username}</div>
            <div className="text-white/80">{players[2].score} pts</div>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/')}
        className="mt-8 px-6 py-3 bg-white text-yellow-700 font-bold rounded-lg shadow-lg hover:bg-yellow-200 transition"
      >
        Back to Home
      </button>
    </div>
  );
};

export default PodiumPage;
