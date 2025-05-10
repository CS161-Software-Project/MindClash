import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './components/Signup';
import Login from './components/Login';
import Loader from "./pages/Loader";
import Avatar from './components/Avatar';
import Home from './pages/home';
import Profile from './pages/profile';
import AIQuiz from './pages/AIQuiz';
import GroqChat from './components/GroqChat';
import QuizGenerator from './components/QuizGenerator';
import GroqTester from './components/GroqTester';
import LobbyPage from './pages/LobbyPage';
import JoinGamePage from './pages/JoinGamePage';
import QuizGamePage from './pages/QuizGamePage';
import LeaderboardPage from './pages/LeaderboardPage';
import PodiumPage from './pages/PodiumPage';
import CreateGamePage from './pages/CreateGamePage';
import React, { useEffect, useState } from 'react';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 7000);
  }, []);

  if (loading) {
    return <Loader text='Initializing MindClash...' />;
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
        <Route path="/lobby/:code" element={<LobbyPage />} />
        <Route path="/join-game" element={<JoinGamePage />} />
        <Route path="/create-game" element={<CreateGamePage />} />
        <Route path="/game/:code" element={<QuizGamePage />} />
        <Route path="/leaderboard/:code" element={<LeaderboardPage />} />
        <Route path="/podium/:code" element={<PodiumPage />} />
        <Route path="/waiting/:code" element={<WaitingRoomPage />} />

      </Routes>
    </Router>
  );
}

export default App;
