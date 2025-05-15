import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import _ from 'lodash';
import { Star } from 'lucide-react';

const LeaderboardItem = ({ player, index }) => {
  const isTopPlayer = index < 3;
  console.log(player)

  return (
    <motion.div
      className={`leaderboard-item relative overflow-hidden flex items-center gap-3 p-4 rounded-lg transition-all duration-300 ${
        isTopPlayer 
          ? 'bg-gradient-to-r from-blue-900/60 to-indigo-900/60 shadow-lg transform hover:scale-102'
          : 'bg-gray-800/40 hover:bg-gray-700/40'
      }`}
      style={{
        animation: isTopPlayer ? 'pulse 2s infinite' : 'none',
      }}
    >
      <div className={`text-2xl font-bold flex justify-center items-center h-10 w-10 rounded-full ${
        index === 0 ? 'bg-yellow-500/30 text-yellow-300' :
        index === 1 ? 'bg-gray-400/30 text-gray-200' :
        index === 2 ? 'bg-amber-700/30 text-amber-500' :
        'bg-gray-700/30 text-gray-400'
      }`}>
        {index + 1}
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className={`font-bold text-lg ${
            index === 0 ? 'text-yellow-300' :
            index === 1 ? 'text-gray-200' :
            index === 2 ? 'text-amber-500' :
            'text-white'
          }`}>
            {player.username}
          </span>
          <span className="text-green-400 font-bold text-xl">
            {player.score.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <div className="flex items-center gap-1 text-yellow-300">
            <Star size={14} />
            <span>Best: {player.best_streak || 0}</span>
          </div>
          <div className="flex items-center gap-1 text-orange-300">
            <Star size={14} />
            <span>Streak: {player.current_streak || 0}</span>
          </div>
          <div className="flex items-center gap-1 text-green-300">
            <Star size={14} />
            <span>Correct: {player.correct_answers || 0}</span>
          </div>
          <div className="flex items-center gap-1 text-blue-300">
            <Star size={14} />
            <span>Time: {(player.average_time || 0).toFixed(1)}s</span>
          </div>
        </div>
      </div>

      {isTopPlayer && (
        <div 
          className="absolute -rotate-45 w-10 h-64 top-0 -left-20 bg-white/10"
          style={{
            animation: `shine ${5 + index}s infinite`,
            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)',
          }}
        />
      )}
    </motion.div>
  );
};

const Leaderboard = ({ players = [], title = 'Leaderboard' }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const sortedPlayers = _.orderBy(players, ['score'], ['desc']).slice(0, 8);

  return (
    <div className="relative flex flex-col items-center p-4 min-h-screen bg-gradient-to-b from-gray-900 to-blue-900">
      <div 
        className={`w-full max-w-2xl transition-all duration-700 ease-out transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
        }`}
      >
        <div className="text-center mb-8 mt-4">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
            {title}
          </h1>
          <div className="h-1 w-32 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
        </div>

        <div className="space-y-3">
          {sortedPlayers.length === 0 ? (
            <div className="text-center p-6 bg-gray-800/40 rounded-lg">
              <p className="text-gray-400">No players yet</p>
            </div>
          ) : (
            sortedPlayers.map((player, index) => (
              <div 
                key={player.user_id || player.username || index}
                className="transition-all duration-500 ease-out transform"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
                  transitionDelay: `${index * 100}ms`
                }}
              >
                <LeaderboardItem player={player} index={index} />
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(79, 70, 229, 0); }
          100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
        }

        @keyframes shine {
          0% { left: -100px; }
          20% { left: 100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;