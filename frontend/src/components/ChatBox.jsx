import React from 'react';

const ChatBox = () => {
  return (
    <div className="w-full">
      <div className="bg-white/10 dark:bg-gray-700/80 rounded-lg p-4 h-32 overflow-y-auto mb-2">
        {/* Placeholder chat messages */}
        <div className="mb-1 text-indigo-200">PlayerA: Hello! 👋</div>
        <div className="mb-1 text-pink-200">PlayerB: Good luck! 🍀</div>
        <div className="mb-1 text-purple-200">PlayerC: 😎</div>
      </div>
      <input className="w-full px-3 py-2 rounded-lg bg-white/20 dark:bg-gray-800/40 text-white placeholder-indigo-200" placeholder="Type a message or emoji..." />
    </div>
  );
};

export default ChatBox; 