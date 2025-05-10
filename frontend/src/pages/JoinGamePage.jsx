import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const JoinGamePage = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      await axios.post(`http://localhost:8000/api/game/${code}/join/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      localStorage.setItem('gameCode', code);
      navigate(`/lobby/${code}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to join game.');
    }    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-md bg-white/10 dark:bg-gray-800/80 rounded-2xl p-8 shadow-xl border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6">Join a Game</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
            className="w-full px-4 py-2 rounded-lg bg-white/20 dark:bg-gray-800/40 text-white placeholder-indigo-200"
            maxLength={6}
            required
          />
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-bold shadow-lg hover:from-indigo-600 hover:to-purple-600 transition-all"
          >
            {loading ? 'Joining...' : 'Join Game'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinGamePage; 