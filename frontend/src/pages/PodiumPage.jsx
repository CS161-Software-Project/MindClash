import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Confetti from 'react-confetti';

const PodiumPage = () => {
  const { pin } = useParams();
  const navigate = useNavigate();
  const [winners, setWinners] = useState([]);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const fetchResults = async () => {
      try {
    const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const res = await fetch(`http://localhost:8000/api/game-room/${pin}/results/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const data = await res.json();
        setWinners(data.winners);
      } catch (err) {
        console.error('Error fetching results:', err);
        toast.error('Failed to fetch game results');
        navigate('/');
      }
    };

    fetchResults();

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pin, navigate]);

  const handleNewGame = () => {
    navigate('/create');
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 flex flex-col items-center justify-center p-8">
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        numberOfPieces={200}
        recycle={false}
      />

      <h1 className="text-4xl font-bold text-white mb-12">Game Over!</h1>

      <div className="flex items-end justify-center gap-8 mb-12">
        {/* Second Place */}
        {winners[1] && (
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center mb-4">
              {winners[1].avatar_url ? (
                <img
                  src={winners[1].avatar_url}
                  alt={winners[1].username}
                  className="w-full h-full rounded-full"
                />
              ) : (
                <span className="text-4xl">{winners[1].username[0].toUpperCase()}</span>
              )}
            </div>
            <div className="bg-gray-200 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-800">2nd</div>
              <div className="text-xl font-semibold">{winners[1].username}</div>
              <div className="text-lg text-gray-600">{winners[1].score} pts</div>
            </div>
          </div>
        )}

        {/* First Place */}
        {winners[0] && (
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 bg-yellow-300 rounded-full flex items-center justify-center mb-4">
              {winners[0].avatar_url ? (
                <img
                  src={winners[0].avatar_url}
                  alt={winners[0].username}
                  className="w-full h-full rounded-full"
                />
              ) : (
                <span className="text-5xl">{winners[0].username[0].toUpperCase()}</span>
              )}
            </div>
            <div className="bg-yellow-200 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-800">1st</div>
              <div className="text-xl font-semibold">{winners[0].username}</div>
              <div className="text-lg text-yellow-600">{winners[0].score} pts</div>
            </div>
          </div>
        )}

        {/* Third Place */}
        {winners[2] && (
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 bg-orange-300 rounded-full flex items-center justify-center mb-4">
              {winners[2].avatar_url ? (
                <img
                  src={winners[2].avatar_url}
                  alt={winners[2].username}
                  className="w-full h-full rounded-full"
                />
              ) : (
                <span className="text-4xl">{winners[2].username[0].toUpperCase()}</span>
              )}
            </div>
            <div className="bg-orange-200 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-800">3rd</div>
              <div className="text-xl font-semibold">{winners[2].username}</div>
              <div className="text-lg text-orange-600">{winners[2].score} pts</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleNewGame}
          className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          New Game
        </button>
        <button
          onClick={handleHome}
          className="px-6 py-3 bg-white text-indigo-500 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Home
        </button>
      </div>
    </div>
  );
};

export default PodiumPage;
