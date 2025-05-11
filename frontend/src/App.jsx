import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './components/Signup';
import Loader from './pages/Loader';
import Avatar from './components/Avatar';
import Profile from './pages/profile';
import AIQuiz from './pages/AIQuiz';
import GroqChat from './components/GroqChat';
import QuizGenerator from './components/QuizGenerator';
import GroqTester from './components/GroqTester';
import JoinGame from './pages/JoinGame';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import PodiumPage from './pages/PodiumPage';
import CreateGame from './pages/CreateGame';
import Home from './pages/Home';
import Login from './components/Login';
import ResultsPage from './pages/ResultsPage';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 7000);
  }, []);

  if (loading) {
    return <Loader text="Initializing MindClash..." />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/ai-quiz" element={<AIQuiz />} />
        <Route path="/avatar" element={<Avatar />} />
        <Route path="/groq-chat" element={<GroqChat />} />
        <Route path="/quiz-generator" element={<QuizGenerator />} />
        <Route path="/test-groq" element={<GroqTester />} />
        
        {/* Multiplayer Game Routes */}
        <Route path="/join" element={<JoinGame />} />
        <Route path="/lobby/:pin" element={<LobbyPage />} />
        <Route path="/game/:pin" element={<PrivateRoute><GamePage /></PrivateRoute>} />
        <Route path="/podium/:pin" element={<PodiumPage />} />
        <Route path="/create" element={<CreateGame />} />
        <Route path="/results/:pin" element={<PrivateRoute><ResultsPage /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
