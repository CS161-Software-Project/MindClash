import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import sunnySound from '../assets/sunny.mp3';
import rainSound from '../assets/rain.mp3';
import logo from '../assets/logo.png';
import '../styles/Home.css'

// Icons can be imported from react-icons when needed
// import { FaMoon, FaSun, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const generateStars = (count) => {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const style = {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 3}s`,
      animationDuration: `${Math.random() * 3 + 2}s`
    };
    stars.push(<div key={i} className="star" style={style} />);
  }
  return stars;
};

// Sample quiz categories with images
const quizCategories = [
  {
    id: 1,
    title: 'Harry Potter',
    description: 'Test your knowledge of the wizarding world',
    image: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 2,
    title: 'Batman',
    description: 'How well do you know the Dark Knight?',
    image: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 3,
    title: 'Cricket',
    description: 'Questions about the gentleman\'s game',
    image: 'https://images.unsplash.com/photo-1595435742656-5087ab7b6ed5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
  }
];

const Home = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const sunnyAudioRef = useRef(null);
  const rainAudioRef = useRef(null);

  useEffect(() => {
    sunnyAudioRef.current = new Audio(sunnySound);
    rainAudioRef.current = new Audio(rainSound);
    sunnyAudioRef.current.volume = isMuted ? 0 : volume;
    rainAudioRef.current.volume = isMuted ? 0 : volume;
    
    if (!isMuted) {
      if (isDarkMode) {
        rainAudioRef.current.play();
        sunnyAudioRef.current.pause();
      } else {
        sunnyAudioRef.current.play();
        rainAudioRef.current.pause();
      }
    } else {
      sunnyAudioRef.current.pause();
      rainAudioRef.current.pause();
    }
    
    return () => {
      sunnyAudioRef.current.pause();
      rainAudioRef.current.pause();
    };
  }, [volume, isDarkMode, isMuted]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className={`home-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Stars Background */}
      <div className="stars-container">
        {isDarkMode && generateStars(100)}
      </div>

      {/* Animated Background Elements */}
      <div className="animated-bg">
        <div className="floating-circle floating-circle-1"></div>
        <div className="floating-circle floating-circle-2"></div>
        <div className="floating-circle floating-circle-3"></div>
      </div>

      {/* Quiz-themed animated particles */}
      <div className="quiz-particle quiz-particle-1"></div>
      <div className="quiz-particle quiz-particle-2"></div>
      <div className="quiz-particle quiz-particle-3"></div>

      <nav className="navbar">
        <h1 className="navbar-title">Mind Clash</h1>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/login">Login</Link></li>
          <li><Link to="/leaderboard">Leaderboard</Link></li>
        </ul>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={toggleMute} className="volume-control">
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
          <button onClick={toggleTheme} className="theme-toggle">
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </nav>
      
      <main className="main-content">
        <img src={logo} alt="Mind Clash Logo" className="logo" />
        <h2>Welcome to Mind Clash - Your Ultimate Quiz Experience!</h2>
        <p>This is a game of your wits about different themes like Harry Potter, Batman, or Cricket. We offer a great experience for you guys. Disclaimer: once you get into it, you don't wanna get out of it.</p>
        
        <div className="game-modules">
          <button className="game-button">Join Game</button>
          <button className="game-button">Create Game</button>
        </div>

        <h3 style={{ margin: '3rem 0 1rem', fontSize: '1.8rem' }}>Choose Your Quiz Category</h3>
        
        <div className="category-cards">
          {quizCategories.map(category => (
            <div key={category.id} className="category-card">
              <img 
                src={category.image} 
                alt={category.title} 
                className="category-card-image" 
              />
              <div className="category-card-content">
                <h4 className="category-card-title">{category.title}</h4>
                <p className="category-card-description">{category.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      
      <footer className="team-info">
        <p>CREATED BY TEAM: Manchi Peru Pettandi Ayya</p>
        <p>The Founder and Leader: Pranay</p>
        <p>The Tech Geek: Prudhvi</p>
        <p>That CS Student: Hima</p>
      </footer>
    </div>
  );
};

export default Home;