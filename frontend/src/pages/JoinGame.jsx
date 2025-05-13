import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles/multiplayer.css";

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
    <div className="multiplayer-container flex flex-col items-center justify-center">
      <div className="multiplayer-card">
        <h2 className="multiplayer-title">Join a Game</h2>
        <input
          type="text"
          maxLength={6}
          placeholder="Enter 6-digit PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="multiplayer-input"
        />
        <button
          onClick={handleJoin}
          className="multiplayer-button mt-4"
        >
          Join Game
        </button>
      </div>
    </div>
  );
};

export default JoinGame;
