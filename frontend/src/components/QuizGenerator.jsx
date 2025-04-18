import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBrain, FaSpinner, FaLightbulb } from 'react-icons/fa';

const QuizGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [category, setCategory] = useState('general knowledge');
  const [difficulty, setDifficulty] = useState('medium');
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [serviceStatus, setServiceStatus] = useState('unknown');
  const [hints, setHints] = useState([]);
  const [showHints, setShowHints] = useState(false);
  const [hintsLoading, setHintsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Custom categories to match your app's theme
  const categories = [
    'general knowledge',
    'harry potter',
    'batman',
    'cricket',
    'science',
    'history',
    'geography',
    'literature'
  ];

  const difficulties = ['easy', 'medium', 'hard'];

  // Check the status of the LlamaFile service on component mount
  useEffect(() => {
    checkServiceStatus();
  }, []);

  const checkServiceStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/llamafile/status/');
      const data = await response.json();
      setServiceStatus(data.status);
    } catch (error) {
      console.error('Error checking LlamaFile service status:', error);
      setServiceStatus('error');
    }
  };

  const startService = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('You must be logged in to start the LlamaFile service');
        return;
      }

      const response = await fetch('http://localhost:8000/api/llamafile/start/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        }
      });
      
      if (response.ok) {
        checkServiceStatus();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to start service');
      }
    } catch (error) {
      console.error('Error starting LlamaFile service:', error);
      setError('Network error when starting service');
    }
  };

  const generateQuestion = async () => {
    setIsGenerating(true);
    setError(null);
    setQuizQuestion(null);
    setSelectedAnswer('');
    setShowExplanation(false);
    setHints([]);
    setShowHints(false);
    
    try {
      const response = await fetch('http://localhost:8000/api/quiz/generate-question/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category,
          difficulty
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.question && data.options && data.correct_answer) {
          setQuizQuestion(data);
        } else if (data.raw_response) {
          setError('The AI provided an invalid response format. Please try again.');
          console.error('Invalid response:', data.raw_response);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate question');
      }
    } catch (error) {
      console.error('Error generating question:', error);
      setError('Network error when generating question');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateHints = async () => {
    if (!quizQuestion) return;
    
    setHintsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/quiz/generate-hints/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: quizQuestion.question,
          options: quizQuestion.options,
          correct_answer: quizQuestion.correct_answer
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.hint1 && data.hint2) {
          setHints([data.hint1, data.hint2]);
          setShowHints(true);
        } else {
          setError('Could not generate hints');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate hints');
      }
    } catch (error) {
      console.error('Error generating hints:', error);
      setError('Network error when generating hints');
    } finally {
      setHintsLoading(false);
    }
  };

  const handleSelectAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowExplanation(true);
  };

  const isCorrectAnswer = () => {
    return selectedAnswer === quizQuestion?.correct_answer;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-8 text-center">
        <motion.h2 
          className="text-3xl font-bold mb-3 text-indigo-100"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FaBrain className="inline-block mr-2 text-indigo-400" /> AI-Powered Quiz Generator
        </motion.h2>
        <p className="text-indigo-300">
          Using LlamaFile to create custom quiz questions just for you
        </p>

        {/* Service Status Indicator */}
        <div className="mt-4 flex justify-center items-center">
          <div className={`px-4 py-2 rounded-full flex items-center ${
            serviceStatus === 'running' 
              ? 'bg-green-500/20 text-green-400' 
              : serviceStatus === 'error' 
                ? 'bg-red-500/20 text-red-400'
                : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            <div className={`w-3 h-3 rounded-full mr-2 ${
              serviceStatus === 'running' 
                ? 'bg-green-400' 
                : serviceStatus === 'error'
                  ? 'bg-red-400'
                  : 'bg-yellow-400'
            }`}></div>
            LlamaFile Service: {serviceStatus === 'running' ? 'Online' : 'Offline'}
          </div>
          
          {serviceStatus !== 'running' && (
            <motion.button
              onClick={startService}
              className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Service
            </motion.button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
          <p>Error: {error}</p>
        </div>
      )}

      <div className="glass-effect rounded-xl p-6 shadow-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-indigo-300 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/10 text-white rounded-lg p-3 border border-indigo-600/30 focus:border-indigo-500 focus:outline-none"
              disabled={isGenerating}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-indigo-300 mb-2">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-white/10 text-white rounded-lg p-3 border border-indigo-600/30 focus:border-indigo-500 focus:outline-none"
              disabled={isGenerating}
            >
              {difficulties.map(diff => (
                <option key={diff} value={diff}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <motion.button
          onClick={generateQuestion}
          disabled={isGenerating || serviceStatus !== 'running'}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center
            ${isGenerating || serviceStatus !== 'running'
              ? 'bg-indigo-800/50 text-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40'
            }`}
          whileHover={{ scale: serviceStatus === 'running' ? 1.02 : 1 }}
          whileTap={{ scale: serviceStatus === 'running' ? 0.98 : 1 }}
        >
          {isGenerating ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Generating Question...
            </>
          ) : (
            'Generate New Question'
          )}
        </motion.button>
      </div>

      {quizQuestion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-effect rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-xl font-bold mb-6 text-white">{quizQuestion.question}</h3>
          
          <div className="grid grid-cols-1 gap-3 mb-6">
            {quizQuestion.options.map((option, index) => (
              <motion.button
                key={index}
                onClick={() => handleSelectAnswer(option)}
                disabled={showExplanation}
                className={`p-4 rounded-lg text-left transition-all duration-300 ${
                  selectedAnswer === option
                    ? selectedAnswer === quizQuestion.correct_answer
                      ? 'bg-green-600/30 border border-green-500'
                      : 'bg-red-600/30 border border-red-500'
                    : showExplanation && option === quizQuestion.correct_answer
                      ? 'bg-green-600/30 border border-green-500'
                      : 'bg-white/10 border border-white/20 hover:bg-white/20'
                } ${showExplanation ? 'cursor-default' : 'cursor-pointer'}`}
                whileHover={{ scale: showExplanation ? 1 : 1.02 }}
                whileTap={{ scale: showExplanation ? 1 : 0.98 }}
              >
                {option}
              </motion.button>
            ))}
          </div>

          {!showExplanation && (
            <div className="flex justify-between">
              <motion.button
                onClick={generateHints}
                disabled={hintsLoading}
                className={`py-2 px-4 rounded-lg font-medium transition-all duration-300 flex items-center
                  ${hintsLoading
                    ? 'bg-indigo-800/50 text-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600/80 hover:bg-indigo-600 text-white'
                  }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {hintsLoading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Loading Hints...
                  </>
                ) : (
                  <>
                    <FaLightbulb className="mr-2" />
                    {showHints ? 'Hide Hints' : 'Need a Hint?'}
                  </>
                )}
              </motion.button>
            </div>
          )}

          {showHints && hints.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="mt-4 p-4 bg-indigo-900/50 rounded-lg border border-indigo-700"
            >
              <p className="font-medium text-yellow-300 mb-2">Hints:</p>
              <ul className="list-disc list-inside space-y-2">
                {hints.map((hint, index) => (
                  <li key={index} className="text-yellow-200">
                    <span className="text-yellow-100">{hint}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className={`mt-4 p-4 rounded-lg ${
                isCorrectAnswer()
                  ? 'bg-green-900/30 border border-green-700'
                  : 'bg-red-900/30 border border-red-700'
              }`}
            >
              <p className="font-medium mb-2">
                {isCorrectAnswer()
                  ? '✅ Correct!'
                  : `❌ Incorrect. The correct answer is: ${quizQuestion.correct_answer}`}
              </p>
              <p>{quizQuestion.explanation}</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default QuizGenerator; 