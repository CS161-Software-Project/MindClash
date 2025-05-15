import React from 'react';

const CorrectAnswer = ({ distribution = [], correctAnswer = '', userAnswer = null }) => {
  const maxCount = Math.max(...distribution.map(opt => opt.count), 1);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/5 p-6 rounded-xl border border-indigo-500/30 text-indigo-200 shadow-xl">
      <h2 className="text-2xl font-bold text-center mb-6">Answer Breakdown</h2>
      <div className="space-y-4">
        {distribution.map((option, index) => {
          const isCorrect = option.answer === correctAnswer;
          const isUser = option.answer === userAnswer;
          const barWidth = `${(option.count / maxCount) * 100}%`;

          return (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 transition-all duration-300 ${
                isCorrect ? 'border-green-500 bg-green-900/10' :
                isUser ? 'border-blue-500 bg-blue-900/10' : 'border-gray-600 bg-white/10'
              }`}
            >
              <div className="flex justify-between mb-1">
                <span className="font-medium text-lg">{option.answer}</span>
                <span className="text-sm">{option.count} player(s)</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
                <div
                  className={`${
                    isCorrect ? 'bg-green-500' : isUser ? 'bg-blue-500' : 'bg-gray-500'
                  } h-2.5 rounded-full`}
                  style={{ width: barWidth }}
                ></div>
              </div>
              {isCorrect && (
                <p className="text-green-400 text-sm font-semibold flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Correct Answer
                </p>
              )}
              {isUser && !isCorrect && (
                <p className="text-blue-400 text-sm font-semibold flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Your Answer
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CorrectAnswer;
