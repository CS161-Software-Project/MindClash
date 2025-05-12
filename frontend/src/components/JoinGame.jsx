import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import GameService from '../services/GameService';

const JoinGame = () => {
    const navigate = useNavigate();
    const [gameCode, setGameCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleJoinGame = async (e) => {
        e.preventDefault();
        
        if (!gameCode) {
            setError('Please enter a game code');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const response = await GameService.joinGame(gameCode);
            
            if (response.success) {
                // Navigate to the game room
                navigate(`/game/${gameCode}`);
            } else {
                setError(response.error || 'Failed to join game');
            }
        } catch (err) {
            setError(err.error || 'Failed to join game. Please check the code and try again.');
        } finally {
            setLoading(false);
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
                        <h1 className="text-2xl font-bold text-indigo-200">Join Game</h1>
                        <div></div> {/* Empty div for spacing */}
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-grow container mx-auto py-16 px-4 flex items-center justify-center">
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-indigo-500/20 w-full max-w-md">
                        <h2 className="text-3xl font-bold text-indigo-200 mb-6 text-center">
                            Enter Game Code
                        </h2>
                        
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 text-red-200">
                                {error}
                            </div>
                        )}
                        
                        <form onSubmit={handleJoinGame}>
                            <div className="mb-6">
                                <label 
                                    htmlFor="gameCode" 
                                    className="block text-indigo-300 text-sm font-medium mb-2"
                                >
                                    Game Code
                                </label>
                                <input
                                    type="text"
                                    id="gameCode"
                                    value={gameCode}
                                    onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                                    className="w-full bg-white/10 border border-indigo-500/30 rounded-lg px-4 py-3 text-indigo-100 text-xl tracking-wider text-center uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter code"
                                    maxLength={6}
                                    autoComplete="off"
                                />
                            </div>
                            
                            <div className="flex space-x-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="button"
                                    onClick={handleGoBack}
                                    className="flex-1 py-3 px-4 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg font-medium transition-colors duration-200"
                                >
                                    Cancel
                                </motion.button>
                                
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center"
                                >
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        'Join Game'
                                    )}
                                </motion.button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default JoinGame; 