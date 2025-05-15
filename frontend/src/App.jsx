import React, { useEffect, useState } from 'react'
import Signup from './components/Signup'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './components/Login'
import Loader from "./pages/Loader"
import Avatar from './components/Avatar'
import Home from './pages/Home'
import Profile from './pages/profile'
import AIQuiz from './pages/AIQuiz'
import GroqChat from './components/GroqChat'
import QuizGenerator from './components/QuizGenerator'
import GroqTester from './components/GroqTester'
import CreateGame from './components/CreateGame'
import JoinGame from './components/JoinGame'
import GameRoom from './components/GameRoom'
import Stats from './components/Stats'

function App() {
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    setTimeout(()=>{
      setLoading(false);
    },7000);
  },[]);

  if(loading){
    return <Loader text='Initializing MindClash...'/>
  }

  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/ai-quiz' element={<AIQuiz />} />
        <Route 
          path="/avatar" 
          element={<Avatar />}
        />
        <Route path="/groq-chat" element={<GroqChat />} />
        <Route path="/quiz-generator" element={<QuizGenerator />} />
        <Route path="/test-groq" element={<GroqTester />} />
        
        {/* Game related routes */}
        <Route path="/create-game" element={<CreateGame />} />
        <Route path="/join-game" element={<JoinGame />} />
        <Route path="/game/:gameCode" element={<GameRoom />} />
        <Route path="/stats" element={<Stats />} />
      </Routes>
    </Router>
  )
}

export default App