    import React, { useState } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import QuizGeneratorStandalone from './QuizGeneratorStandalone';
    import GameService from '../services/GameService';

    const CreateGame = () => {
        const navigate = useNavigate();
        const [quizData, setQuizData] = useState(null);
        const [gameCode, setGameCode] = useState(null);
        const [error, setError] = useState('');
        const [loading, setLoading] = useState(false);

        const handleQuizGenerated = async (data) => {
            try {
                // Log the data directly instead of the state variable
                console.log('Generated quiz data:', data);
                
                // Ensure the quiz data is properly formatted
                const formattedQuizData = {
                    title: data.title || 'Quiz',
                    questions: (data.questions || []).map(question => ({
                        question: question.question || '',
                        options: question.options || [],
                        correctAnswer: question.correctAnswer || '',
                        explanation: question.explanation || ''
                    })),
                    recommendedTimeInMinutes: data.recommendedTimeInMinutes || 10
                };
                
                setQuizData(formattedQuizData);
                setLoading(true);
                setError('');

                // Create a new game with the generated quiz
                const response = await GameService.createGame(formattedQuizData);
                
                console.log('Create game response:', response);
                
                if (response && response.game_code) {
                    setGameCode(response.game_code);
                } else {
                    setError(response?.error || 'Failed to create game. Please try again.');
                }
            } catch (err) {
                console.error('Error in handleQuizGenerated:', err);
                setError(
                    err.error?.message || 
                    err.error || 
                    (typeof err === 'string' ? err : 'Failed to create game. Please try again.')
                );
            } finally {
                setLoading(false);
            }
        };

        const handleStartGame = async () => {
            try {
                if (!gameCode) return;
                
                // Navigate to the game room
                navigate(`/game/${gameCode}`);
            } catch (err) {
                setError(err.error || 'Failed to start game. Please try again.');
            }
        };

        const handleGoBack = () => {
            navigate('/');
        };

        return (
            <div className="min-h-screen bg-[#0B1026] relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full filter blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl"></div>
                </div>

                {/* Main Content */}
                <div className="relative min-h-screen flex flex-col" style={{ zIndex: 2 }}>
                    {/* Header */}
                    <header className="bg-white/10 backdrop-blur-lg border-b border-indigo-500/20 py-4 px-6">
                        <div className="flex items-center justify-between max-w-7xl mx-auto">
                            <button 
                                onClick={handleGoBack}
                                className="text-indigo-200 hover:text-indigo-100 transition-colors"
                            >
                                ← Back to Home
                            </button>
                            <h1 className="text-2xl font-bold text-indigo-200">Create New Game</h1>
                            <div></div> {/* Empty div for spacing */}
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="flex-grow container mx-auto py-8 px-4">
                        <div className="max-w-4xl mx-auto">
                            {!quizData ? (
                                <>
                                    <div className="mb-8 text-center">
                                        <h2 className="text-3xl font-bold text-indigo-200 mb-4">
                                            Generate Quiz Questions
                                        </h2>
                                        <p className="text-indigo-300">
                                            First, create quiz questions for your multiplayer game
                                        </p>
                                    </div>
                                    <QuizGeneratorStandalone onQuizGenerated={handleQuizGenerated} />
                                </>
                            ) : loading ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mb-8"></div>
                                    <p className="text-indigo-300 text-lg">Creating your game...</p>
                                </div>
                            ) : gameCode ? (
                                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-indigo-500/20 text-center">
                                    <h2 className="text-3xl font-bold text-indigo-200 mb-4">
                                        Game Created!
                                    </h2>
                                    <p className="text-indigo-300 mb-8">
                                        Share this code with your friends to join the game:
                                    </p>
                                    
                                    <div className="bg-indigo-900/50 backdrop-blur-lg rounded-lg p-6 mb-8 max-w-xs mx-auto">
                                        <h3 className="text-xl font-semibold text-indigo-300 mb-2">Game Code</h3>
                                        <div className="text-4xl font-bold text-indigo-200 tracking-wider">
                                            {gameCode}
                                        </div>
                                    </div>
                                    
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleStartGame}
                                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                                    >
                                        Enter Game Lobby
                                    </motion.button>
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    {error && (
                                        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 text-red-200">
                                            {error}
                                        </div>
                                    )}
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setQuizData(null)}
                                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                                    >
                                        Try Again
                                    </motion.button>
                                </div>
                            )} 
                        </div>
                    </main>
                </div>
            </div>
        );
    };

    export default CreateGame; 


    