import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const JoinGame = () => {
  const [pin, setPin] = useState('');
  const navigate = useNavigate();

  const handleJoin = async () => {
    const avatar_url = localStorage.getItem('avatar_url') || ''; // or prompt
    const token = localStorage.getItem('token');

    const res = await fetch('/api/join_game_room/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ pin, avatar_url }),
    });

    if (res.ok) {
      navigate(`/lobby/${pin}`);
    } else {
      alert('Invalid PIN or failed to join.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold mb-6">Join a Game</h2>
      <input
        type="text"
        maxLength={6}
        placeholder="Enter 6-digit PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        className="w-full max-w-md p-2 mb-4 border border-gray-300 rounded"
      />
      <button
        onClick={handleJoin}
        className="w-full max-w-md p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Join Game
      </button>
    </div>
  );
};

export default JoinGame;
