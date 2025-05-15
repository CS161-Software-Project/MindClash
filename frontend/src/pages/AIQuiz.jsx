import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Test from '../components/Test';
import QuizGenerator from '../components/QuizGenerator';
import { FaArrowLeft } from 'react-icons/fa';

const AIQuiz = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showStars, setShowStars] = useState(true);

  // Set dark mode on component mount
  useEffect(() => {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
    
    return () => {
      document.body.classList.remove('dark-mode');
    };
  }, []);
  
  // Handle WebGL context loss
  useEffect(() => {
    const handleContextLost = () => {
      console.log("WebGL context lost, disabling stars");
      setShowStars(false);
    };
    
    window.addEventListener('webglcontextlost', handleContextLost);
    
    return () => {
      window.removeEventListener('webglcontextlost', handleContextLost);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1026] relative overflow-hidden">
      {/* Stars background */}
      {showStars && (
        <div className="fixed inset-0" style={{ zIndex: 0 }}>
          <Test />
        </div>
      )}
      
      {/* Main Content */}
      <div className="relative min-h-screen flex flex-col" style={{ zIndex: 2 }}>
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-lg border-b border-indigo-500/20 py-4 px-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <motion.button
              onClick={() => navigate('/')}
              className="flex items-center text-indigo-200 hover:text-white transition-colors"
              whileHover={{ x: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaArrowLeft className="mr-2" />
              Back to Home
            </motion.button>
            
            <h1 className="text-2xl font-bold text-indigo-200">
              MindClash <span className="text-indigo-400">AI Quiz</span>
            </h1>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-grow container mx-auto py-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <QuizGenerator />
          </motion.div>
        </main>
        
        {/* Footer */}
        <footer className="py-6 px-6 backdrop-blur-lg border-t border-indigo-500/20 bg-white/5">
          <div className="max-w-7xl mx-auto text-center text-indigo-300 text-sm">
            <p>Powered by LlamaFile integration - AI-generated quiz questions for MindClash</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AIQuiz; 