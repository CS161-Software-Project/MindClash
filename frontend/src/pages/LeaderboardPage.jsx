import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const LeaderboardPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(15);
  const [isHost, setIsHost] = useState(false);

  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/game/${code}/leaderboard/`, {
          headers: { Authorization: `Token ${token}` }
        });
        setData(res.data);
    
        if (res.data.players[0]?.username === user?.username) {
          setIsHost(true);
        }
    
        // ✅ Redirect to podium if game is finished
        if (res.data.status === 'FINISHED') {
          navigate(`/podium/${code}`);
          return;
        }
    
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load leaderboard.');
      }
    };
    

    fetchLeaderboard();
  }, [code, token, user]);

  // Countdown and automatic next
  useEffect(() => {
    if (countdown <= 0) {
      if (isHost) {
        axios.post(`http://localhost:8000/api/game/${code}/next/`, {}, {
          headers: { Authorization: `Token ${token}` }
        }).catch((err) => console.error("Failed to go to next question:", err));
      }
      navigate(`/game/${code}`);
      return;
    }

    const timerId = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timerId);
  }, [countdown, isHost, code, token, navigate]);

  if (error) return <div className="text-red-500 text-center mt-12">{error}</div>;
  if (!data) return <div className="text-white text-center mt-12">Loading leaderboard...</div>;

  const options = ['A', 'B', 'C', 'D'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 text-white px-4">
      <h1 className="text-3xl font-bold mb-6">Leaderboard - Question {data.question_index + 1}</h1>

      <div className="mb-4 text-xl">
        Next question in <span className="font-mono">{countdown}s</span>
        <div className="w-full bg-white/10 h-2 rounded-full mt-2 overflow-hidden">
          <div
            className="bg-indigo-400 h-full transition-all"
            style={{ width: `${(15 - countdown) / 15 * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white/10 p-6 rounded-xl w-full max-w-2xl mb-8 shadow-lg">
        <h2 className="text-xl mb-4">Answer Stats</h2>
        <ul className="space-y-2">
          {options.map((opt) => (
            <li
              key={opt}
              className={`p-3 rounded-md flex justify-between items-center ${
                opt === data.correct ? 'bg-green-600' : 'bg-white/10'
              }`}
            >
              <span className="font-bold">Option {opt}</span>
              <span>{data.stats[opt] || 0} player(s)</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white/10 p-6 rounded-xl w-full max-w-2xl shadow-lg">
        <h2 className="text-xl mb-4">Top Players</h2>
        <ol className="space-y-2">
          {data.players.map((player, index) => (
            <li
              key={index}
              className="flex justify-between items-center bg-white/5 p-3 rounded-md"
            >
              <span className="flex items-center gap-2">
                <span className="text-indigo-300 font-mono w-6 text-right">{index + 1}.</span>
                {player.avatar ? (
                  <img src={player.avatar} className="w-6 h-6 rounded-full" alt="avatar" />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-indigo-400 text-xs flex items-center justify-center">
                    {player.username[0].toUpperCase()}
                  </span>
                )}
                <span>{player.username}</span>
              </span>
              <span className="text-indigo-200 font-bold">{player.score} pts</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default LeaderboardPage;
