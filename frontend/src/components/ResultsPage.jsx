import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import useWindowSize from '../hooks/useWindowSize';

const PodiumStep = ({ position, player, isActive, delay }) => {
  const heights = [300, 220, 180];
  const colors = [
    'from-yellow-300 to-yellow-500',
    'from-gray-400 to-gray-600',
    'from-amber-600 to-amber-800',
  ];
  const medals = ['🥇', '🥈', '🥉'];
  const zIndexes = [30, 20, 10];

  const index = position - 1;
  const height = heights[index];
  const color = colors[index];
  const medal = medals[index];
  const zIndex = zIndexes[index];

  return (
    <motion.div 
      className={`flex flex-col items-center justify-end mx-1`}
      style={{ zIndex }}
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
        <div className="text-4xl">{medal}</div>
        <div className="text-2xl font-bold text-white">{player?.username || 'Player'}</div>
        <div className="text-xl font-semibold text-blue-300">{player?.score || 0} pts</div>
      </div>
      <motion.div
        className={`w-24 md:w-32 rounded-t-lg bg-gradient-to-b ${color} shadow-lg border-t border-opacity-30 border-white`}
        style={{ height: 0 }}
        animate={{ height: height }}
        transition={{ 
          duration: 0.8, 
          delay: delay + 0.3,
          type: 'spring',
          stiffness: 100,
          damping: 10
        }}
      >
        <div className="absolute bottom-0 left-0 right-0 text-center text-4xl font-bold text-white opacity-80">
          {position === 1 ? '1st' : position === 2 ? '2nd' : '3rd'}
        </div>
      </motion.div>
    </motion.div>
  );
};

const ResultsPage = ({ players = [], title = 'Final Results', onBack = () => {} }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [animationStage, setAnimationStage] = useState(0);
  const { width, height } = useWindowSize();

  useEffect(() => {
    if (animationStage < 3) {
      const timer = setTimeout(() => {
        setAnimationStage(prev => prev + 1);
        if (animationStage === 2) {
          setShowConfetti(true);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [animationStage]);

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const [firstPlace, secondPlace, thirdPlace] = [sorted[0], sorted[1], sorted[2]];
  const otherPlayers = sorted.slice(3);

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
          {title}
        </motion.h1>

        {/* Podium */}
        <div className="flex justify-center items-end h-96 mb-16">
          {animationStage >= 2 && (
            <PodiumStep position={2} player={secondPlace} isActive delay={0.3} />
          )}
          {animationStage >= 3 && (
            <PodiumStep position={1} player={firstPlace} isActive delay={0} />
          )}
          {animationStage >= 1 && (
            <PodiumStep position={3} player={thirdPlace} isActive delay={0} />
          )}
        </div>

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
                  key={player.id || player.username}
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
            onClick={onBack}
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
