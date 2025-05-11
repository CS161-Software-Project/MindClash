import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateGame = () => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleCreate = async () => {
    if (!topic.trim()) return alert('Please enter a quiz topic.');

    setLoading(true);

    try {
      const avatar_url = localStorage.getItem('avatar_url') || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
      
      const res = await fetch('http://localhost:8000/api/create_game_room/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ topic, difficulty, count, avatar_url }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error ${res.status}: ${text || res.statusText}`);
      }

      const data = await res.json();
      if (data.pin) {
        navigate(`/lobby/${data.pin}`);
      } else {
        alert('Unexpected response from server.');
      }
    } catch (err) {
      alert(err.message || 'Failed to create game.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold mb-6">Create a Game</h2>

      <input
        type="text"
        placeholder="Enter quiz topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        disabled={loading}
        className="w-full max-w-md p-2 mb-4 border border-gray-300 rounded"
      />

      <select
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
        disabled={loading}
        className="w-full max-w-md p-2 mb-4 border border-gray-300 rounded"
      >
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>

      <select
        value={count}
        onChange={(e) => setCount(Number(e.target.value))}
        disabled={loading}
        className="w-full max-w-md p-2 mb-4 border border-gray-300 rounded"
      >
        <option value={5}>5 Questions</option>
        <option value={10}>10 Questions</option>
        <option value={15}>15 Questions</option>
      </select>

      <button
        onClick={handleCreate}
        disabled={loading}
        className={`w-full max-w-md p-2 text-white rounded ${
          loading ? 'bg-gray-400' : 'bg-indigo-500 hover:bg-indigo-600'
        }`}
      >
        {loading ? 'Creating...' : 'Create Game'}
      </button>
    </div>
  );
};

export default CreateGame;
