import React from 'react';
import { motion } from 'framer-motion';

const Leaderboard = ({ players, title = 'Leaderboard' }) => {
    // Sort players by score (descending)
    const sortedPlayers = players?.sort((a, b) => b.score - a.score) || [];

    return (
        <motion.div 
            className="leaderboard-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <h2 className="leaderboard-title">{title}</h2>
            <div className="leaderboard-list">
                {sortedPlayers.map((player, index) => (
                    <motion.div
                        key={player.user_id || player.username}
                        className="leaderboard-item"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <div className="leaderboard-rank">{index + 1}</div>
                        <div className="leaderboard-player">
                            <span className="player-name">{player.username}</span>
                            <span className="player-score">{player.score}</span>
                        </div>
                        <div className="player-stats">
                            <span>Streak: {player.best_streak || 0}</span>
                            <span>Correct: {player.correct_answers || 0}</span>
                            <span>Time: {(player.average_time || 0).toFixed(1)}s</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default Leaderboard;
