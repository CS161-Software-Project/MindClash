import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateGamePage = () => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreateGame = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // 1. Generate quiz using AI endpoint
      const quizRes = await axios.post('http://localhost:8000/api/generate-quiz/', {
        topic,
        difficulty,
        count
      }, {
        headers: { Authorization: `Token ${token}` }
      });

      if (!quizRes.data || !quizRes.data.quiz) {
        throw new Error('Failed to generate quiz. Please try again.');
      }

      const quiz_data = quizRes.data.quiz;

      // 2. Create game with quiz_data
      const res = await axios.post('http://localhost:8000/api/game/create/', {
        quiz_data
      }, {
        headers: { Authorization: `Token ${token}` }
      });

      if (!res.data || !res.data.code) {
        throw new Error('Failed to create game. Please try again.');
      }

      const code = res.data.code;
      localStorage.setItem('gameCode', code);
      navigate(`/lobby/${code}`);
    } catch (err) {
      console.error('Error creating game:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create game. Please check your input and try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-md bg-white/10 dark:bg-gray-800/80 rounded-2xl p-8 shadow-xl border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6">Create a Multiplayer Quiz Game</h2>
        <form onSubmit={handleCreateGame} className="space-y-4">
          <div>
            <label className="block text-white mb-1">Quiz Topic</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/20 dark:bg-gray-800/40 text-white placeholder-indigo-200"
              placeholder="e.g. Harry Potter, Cricket, Batman"
              required
            />
          </div>
          <div>
            <label className="block text-white mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/20 dark:bg-gray-800/40 text-white"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-white mb-1">Number of Questions</label>
            <input
              type="number"
              min={3}
              max={20}
              value={count}
              onChange={e => setCount(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg bg-white/20 dark:bg-gray-800/40 text-white"
              required
            />
          </div>
          {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-bold shadow-lg hover:from-indigo-600 hover:to-purple-600 transition-all"
          >
            {loading ? 'Creating Game...' : 'Create Game'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGamePage; 