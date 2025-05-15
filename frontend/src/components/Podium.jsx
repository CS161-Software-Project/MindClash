// import React from 'react';
// import { motion } from 'framer-motion';

// const Podium = ({ players }) => {
//     // Get top 3 players by score
//     const top3 = [...players]
//         .sort((a, b) => b.score - a.score)
//         .slice(0, 3);
    
//     // Order is important: second place (left), first place (center, tallest), third place (right)
//     const positions = ['second', 'first', 'third'];
    
//     // Different heights for each position
//     const heights = {
//         first: 'h-48',
//         second: 'h-36',
//         third: 'h-24'
//     };
    
//     return (
//         <div className="w-full my-8">
//             <h3 className="text-xl font-semibold text-indigo-200 mb-6 text-center">Current Standings</h3>
            
//             <div className="flex justify-center items-end gap-4">
//                 {positions.map((position, index) => {
//                     const player = top3[index] || { username: 'Empty', score: 0 };
//                     const delay = position === 'first' ? 0 : position === 'second' ? 0.2 : 0.4;
                    
//                     return (
//                         <div key={position} className="flex flex-col items-center">
//                             <motion.div
//                                 initial={{ scale: 0.8, opacity: 0 }}
//                                 animate={{ scale: 1, opacity: 1 }}
//                                 transition={{ delay: delay, type: 'spring', stiffness: 300 }}
//                                 className="mb-2 text-center"
//                             >
//                                 <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-1 mx-auto overflow-hidden border-2 border-indigo-500/30">
//                                     <span className="text-xl font-bold text-indigo-200">
//                                         {position === 'first' ? '1' : position === 'second' ? '2' : '3'}
//                                     </span>
//                                 </div>
//                                 <div className="text-indigo-200 font-semibold truncate w-20 text-center">
//                                     {player.username}
//                                 </div>
//                                 <div className="text-indigo-300 font-bold">
//                                     {player.score} pts
//                                 </div>
//                             </motion.div>
                            
//                             <motion.div 
//                                 className={`${heights[position]} w-20 rounded-t-lg ${
//                                     position === 'first' 
//                                         ? 'bg-yellow-500/30 border-yellow-500/50' 
//                                         : position === 'second'
//                                             ? 'bg-gray-300/30 border-gray-300/50'
//                                             : 'bg-amber-700/30 border-amber-700/50'
//                                 } border-t border-l border-r flex items-center justify-center`}
//                                 initial={{ y: 100, opacity: 0 }}
//                                 animate={{ y: 0, opacity: 1 }}
//                                 transition={{ 
//                                     delay: delay + 0.3, 
//                                     type: 'spring', 
//                                     damping: 15, 
//                                     stiffness: 100 
//                                 }}
//                             >
//                                 <span className="text-2xl font-bold">
//                                     {position === 'first' ? '1' : position === 'second' ? '2' : '3'}
//                                 </span>
//                             </motion.div>
//                         </div>
//                     );
//                 })}
//             </div>
//         </div>
//     );
// };

// export default Podium;


const Podium = ({ position, player, isActive, delay }) => {
  // Heights in pixels: [1st, 2nd, 3rd]
  const heights = [300, 220, 180];
  const colors = [
    'from-yellow-300 to-yellow-500', // 1st place
    'from-gray-400 to-gray-600',    // 2nd place
    'from-amber-600 to-amber-800',  // 3rd place
  ];
  const medals = ['🥇', '🥈', '🥉'];
  const zIndexes = [30, 20, 10];

  // Map position to array index (1st -> 0, 2nd -> 1, 3rd -> 2)
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

export default Podium;






{/* Game in Progress */}
// {gameState.status === 'in_progress' && currentQuestion && (
//   <div className="max-w-3xl mx-auto">
//       {/* Question Card */}
//       <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-indigo-500/20 mb-8">
//           <div className="flex justify-between items-center mb-6">
//               <h3 className="text-xl font-semibold text-indigo-200">
//                   Question {gameState.current_question + 1}
//               </h3>
//               {timeLeft > 0 && (
//                   <div className={`text-2xl font-bold ${
//                       timeLeft < 5 ? 'text-red-400' : timeLeft < 10 ? 'text-yellow-400' : 'text-green-400'
//                   }`}>
//                       {Math.ceil(timeLeft)}
//                   </div>
//               )}
//           </div>
          
//           <h2 className="text-2xl font-bold text-indigo-200 mb-8">
//               {currentQuestion.question}
//           </h2>
          
//           <div className="grid grid-cols-1 gap-4">
//               {currentQuestion.options.map((option, index) => (
//                   <motion.button
//                       key={index}
//                       whileHover={{ scale: 1.02 }}
//                       whileTap={{ scale: 0.98 }}
//                       onClick={() => handleAnswerSelect(index)}
//                       disabled={selectedAnswer !== null || timeLeft <= 0}
//                       className={`w-full p-4 rounded-lg text-left transition-all ${
//                           selectedAnswer === index
//                               ? 'bg-indigo-600 text-white'
//                               : 'bg-white/5 text-indigo-200 hover:bg-white/10'
//                       } ${
//                           selectedAnswer !== null || timeLeft <= 0
//                               ? 'opacity-80 cursor-not-allowed'
//                               : 'cursor-pointer'
//                       }`}
//                   >
//                       <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
//                       {option}
//                   </motion.button>
//               ))}
//           </div>
          
//           {/* Answer result feedback */}
//           {answerResult && (
//               <div className={`mt-6 p-4 rounded-lg text-center ${
//                   answerResult === 'correct' 
//                       ? 'bg-green-500/20 border border-green-500/30 text-green-300' 
//                       : 'bg-red-500/20 border border-red-500/30 text-red-300'
//               }`}>
//                   {answerResult === 'correct' 
//                       ? 'Correct answer! Good job!' 
//                       : 'Incorrect answer!'}
//               </div>
//           )}
          
//           {/* Next question button for host */}
//           {isHost && allPlayersAnswered && (
//               <motion.button
//                   whileHover={{ scale: 1.02 }}
//                   whileTap={{ scale: 0.98 }}
//                   onClick={handleNextQuestionClick}
//                   className="w-full mt-8 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
//               >
//                   Next Question
//               </motion.button>
//           )}
//       </div>
      
//       {/* Players Status */}
//       <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-indigo-500/20">
//           <h3 className="text-xl font-semibold text-indigo-200 mb-4">
//               Players
//           </h3>
//           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//               {gameState.players.map((player, index) => (
//                   <div
//                       key={index}
//                       className={`flex items-center justify-between p-3 rounded-lg ${
//                           player.has_answered 
//                               ? 'bg-green-500/10 border border-green-500/20' 
//                               : 'bg-white/5'
//                       }`}
//                   >
//                       <span className="text-indigo-200">
//                           {player.username}
//                           {player.username === gameState.host && ' (Host)'}
//                       </span>
//                       <div className="flex items-center">
//                           <span className={`text-sm ${
//                               player.has_answered ? 'text-green-400' : 'text-indigo-400'
//                           }`}>
//                               {player.has_answered ? 'Answered' : 'Waiting'}
//                           </span>
//                           <div className="ml-2 text-indigo-200 font-semibold">
//                               {player.score || 0}
//                           </div>
//                       </div>
//                   </div>
//               ))}
//           </div>
//       </div>
//   </div>
// )}