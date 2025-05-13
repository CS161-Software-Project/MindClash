import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Confetti from 'react-confetti';

const PodiumPage = () => {
  const { pin } = useParams();
  const navigate = useNavigate();
  const [winners, setWinners] = useState([null, null, null]);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    console.log('PodiumPage mounted with pin:', pin);
    
    // Handle window resize
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    // Fetch results
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`http://localhost:8000/api/game-room/${pin}/results/`, {
          headers: { 
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }


        const data = await response.json();
        console.log('Raw API response:', data);
        
        // Handle the data structure from your logs
        const leaderboard = data.leaderboard || data.winners || [];
        console.log('Leaderboard data:', leaderboard);
        
        // Process and sort the leaderboard
        const processedWinners = leaderboard
          .map(player => ({
            ...player,
            score: Number(player.score) || 0
          }))
          .sort((a, b) => b.score - a.score);
        
        console.log('Processed and sorted winners:', processedWinners);
        
        // Take top 3 and fill with null if needed
        const top3 = [...processedWinners.slice(0, 3)];
        while (top3.length < 3) top3.push(null);
        
        setWinners(top3);
        
      } catch (error) {
        console.error('Error fetching results:', error);
        toast.error('Failed to load game results');
      }
    };

    fetchResults();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [pin, navigate]);

  const handleNewGame = () => {
    navigate('/create');
  };

  const handleHome = () => {
    navigate('/');
  };

  // Debug info
  console.log('Rendering with winners:', winners);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 flex flex-col items-center justify-center p-8">
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        numberOfPieces={200}
        recycle={false}
      />

      <h1 className="text-4xl font-bold text-white mb-12">Game Over!</h1>

      <div className="relative flex items-end justify-center gap-8 mb-12 h-96">
        {/* Base podium */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gray-100 rounded-t-3xl"></div>
        
        {/* First Place - Gold (Left) */}
        {winners[0] && (
          <div className="relative flex flex-col items-center z-30" style={{ height: '100%' }}>
            <div className="w-40 h-40 bg-yellow-300 rounded-full flex items-center justify-center mb-4">
              <span className="text-5xl">{winners[0].username[0].toUpperCase()}</span>
            </div>
            <div className="relative z-20 bg-yellow-200 p-4 rounded-t-lg text-center w-full">
              <div className="text-2xl font-bold text-yellow-800">1st</div>
              <div className="text-xl font-semibold">{winners[0].username}</div>
              <div className="text-lg text-yellow-600">{winners[0].score} pts</div>
            </div>
            <div className="w-full bg-yellow-400 rounded-t-lg" style={{ height: '100%' }}></div>
          </div>
        )}

        {/* Second Place - Silver (Middle) */}
        {winners[1] && (
          <div className="relative flex flex-col items-center z-20" style={{ height: '80%' }}>
            <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">{winners[1].username[0].toUpperCase()}</span>
            </div>
            <div className="relative z-20 bg-gray-200 p-4 rounded-t-lg text-center w-full">
              <div className="text-2xl font-bold text-gray-800">2nd</div>
              <div className="text-xl font-semibold">{winners[1].username}</div>
              <div className="text-lg text-gray-600">{winners[1].score} pts</div>
            </div>
            <div className="w-full bg-gray-400 rounded-t-lg" style={{ height: '100%' }}></div>
          </div>
        )}

        {/* Third Place - Bronze (Right) */}
        {winners[2] && (
          <div className="relative flex flex-col items-center z-10" style={{ height: '60%' }}>
            <div className="w-32 h-32 bg-orange-300 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">{(winners[2].username || '?')[0].toUpperCase()}</span>
            </div>
            <div className="relative z-20 bg-orange-200 p-4 rounded-t-lg text-center w-full">
              <div className="text-2xl font-bold text-orange-800">3rd</div>
              <div className="text-xl font-semibold">{winners[2].username || 'N/A'}</div>
              <div className="text-lg text-orange-600">{winners[2].score} pts</div>
            </div>
            <div className="w-full bg-orange-400 rounded-t-lg" style={{ height: '100%' }}></div>
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
