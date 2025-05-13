import React from 'react';
import { motion } from 'framer-motion';

const Podium = ({ players }) => {
    const top3 = [...players].sort((a, b) => b.score - a.score).slice(0, 3);
    const podiumStyles = ['second', 'first', 'third'];

    return (
        <div className="flex justify-center items-end h-48 mt-6 gap-6">
            {top3.map((player, index) => (
                <motion.div
                    key={player.username}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.2 }}
                    className={`flex flex-col items-center justify-end w-24 rounded-md bg-indigo-500/30 backdrop-blur p-2`}
                    style={{
                        height: `${100 - index * 20}px`,
                        border: '1px solid rgba(255,255,255,0.2)',
                    }}
                >
                    <div className="text-indigo-100 font-semibold mb-2">{player.username}</div>
                    <div className="text-yellow-300 font-bold text-lg">{player.score} pts</div>
                </motion.div>
            ))}
        </div>
    );
};

export default Podium;
