import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import useWindowSize from '../hooks/useWindowSize';

const PodiumStep = ({ position, player, isActive, delay }) => {
  const height = [200, 300, 250]; // Heights for 2nd, 1st, 3rd place
  const colors = [
    'from-gray-400 to-gray-600', // 2nd place
    'from-yellow-300 to-yellow-500', // 1st place
    'from-amber-600 to-amber-800', // 3rd place
  ];
  const medals = ['🥈', '🥇', '🥉'];

  return (
    <motion.div 
      className={`flex flex-col items-center justify-end mx-1 ${position === 1 ? 'z-10' : 'z-0'}`}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        duration: 0.8, 
        delay: delay,
        type: 'spring',
        stiffness: 100,
        damping: 10
      }}
    >
      <div className="text-center mb-2">
        <div className="text-4xl">{medals[position - 1]}</div>
        <div className="text-2xl font-bold text-white">{player?.username || 'Player'}</div>
        <div className="text-xl font-semibold text-blue-300">{player?.score || 0} pts</div>
      </div>
      <motion.div
        className={`w-24 md:w-32 h-${height[position - 1] / 10} rounded-t-lg bg-gradient-to-b ${colors[position - 1]} shadow-lg border-t border-opacity-30 border-white`}
        initial={{ height: 0 }}
        animate={{ height: height[position - 1] }}
        transition={{ 
          duration: 0.8, 
          delay: delay + 0.3,
          type: 'spring',
          stiffness: 100,
          damping: 10
        }}
      >
        <div className="absolute bottom-0 left-0 right-0 text-center text-4xl font-bold text-white opacity-80">
          {position}
        </div>
      </motion.div>
    </motion.div>
  );
};

const ResultsPage = () => {
  const { pin } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();
  const [animationStage, setAnimationStage] = useState(0); // 0: initial, 1: show 3rd, 2: show 2nd, 3: show 1st

  // Animate the podium steps one by one
  useEffect(() => {
    if (animationStage < 3) {
      const timer = setTimeout(() => {
        setAnimationStage(prev => prev + 1);
        if (animationStage === 2) {
          setShowConfetti(true);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [animationStage]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${API_URL}/leaderboard/${pin}/`, {
          headers: { Authorization: `Token ${token}` }
        });

        // Sort by score in descending order
        const sortedResults = {
          ...response.data,
          leaderboard: [...response.data.leaderboard].sort((a, b) => b.score - a.score)
        };

        setResults(sortedResults);
        setLoading(false);
        
        // Start the animation sequence
        setAnimationStage(1);
      } catch (error) {
        console.error('Error fetching results:', error);
        setError('Failed to load results');
        setLoading(false);
      }
    };

    fetchResults();
  }, [pin, navigate]);

  const getTopPlayers = useCallback(() => {
    if (!results) return [null, null, null];
    return [
      results.leaderboard[1] || null, // 2nd place
      results.leaderboard[0] || null, // 1st place
      results.leaderboard[2] || null, // 3rd place
    ];
  }, [results]);

  const getOtherPlayers = useCallback(() => {
    if (!results) return [];
    return results.leaderboard.slice(3);
  }, [results]);

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-2xl">Loading results...</div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-red-500 text-2xl">{error}</div>
    </div>
  );
  
  if (!results) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-2xl">No results found</div>
    </div>
  );

  const [secondPlace, firstPlace, thirdPlace] = getTopPlayers();
  const otherPlayers = getOtherPlayers();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-12 px-4">
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.2}
        />
      )}
      
      <div className="max-w-4xl mx-auto">
        <motion.h1 
          className="text-4xl md:text-5xl font-bold text-center text-white mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Game Results
        </motion.h1>
        
        {/* Podium */}
        <div className="flex justify-center items-end h-96 mb-16">
          {/* 2nd Place */}
          {animationStage >= 1 && (
            <PodiumStep position={2} player={secondPlace} isActive={true} delay={0} />
          )}
          
          {/* 1st Place */}
          {animationStage >= 2 && (
            <PodiumStep position={1} player={firstPlace} isActive={true} delay={0.8} />
          )}
          
          {/* 3rd Place */}
          {animationStage >= 3 && (
            <PodiumStep position={3} player={thirdPlace} isActive={true} delay={1.6} />
          )}
        </div>
        
        {/* Other Players */}
        {otherPlayers.length > 0 && (
          <motion.div 
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-700/50 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.4, duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-gray-300 mb-4">Other Players</h2>
            <div className="space-y-3">
              {otherPlayers.map((player, index) => (
                <div 
                  key={player.id}
                  className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-400 w-6 text-right">{index + 4}</span>
                    <span className="text-gray-200">{player.username}</span>
                  </div>
                  <span className="font-semibold text-blue-300">{player.score} pts</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.7, duration: 0.5 }}
        >
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full font-semibold 
                      hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 
                      shadow-lg hover:shadow-xl"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default ResultsPage;