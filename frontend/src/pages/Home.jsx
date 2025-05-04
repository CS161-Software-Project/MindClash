import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaMoon, FaSun, FaVolumeUp, FaVolumeMute, FaUser, FaChartLine, FaSignOutAlt, FaRobot } from 'react-icons/fa';
import { Brain, Sparkles, Gamepad2 } from 'lucide-react';
import sunnySound from '../assets/sunny.mp3';
import rainSound from '../assets/rain.mp3';
import '../styles/Home.css';
import Test from '../components/test';
import { motion } from 'framer-motion';
import "@google/model-viewer";
import axios from 'axios';

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
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=2934&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  }
];

const Home = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showStars, setShowStars] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const sunnyAudioRef = useRef(null);
  const rainAudioRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  //getting a token and user data from the local storage if it exists 
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('user'));
    console.log(token,userData)
    setIsLoggedIn(!!token);
    setUser(userData);
  }, []);
  
  // Track mouse position for parallax effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
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

  // Audio management
  useEffect(() => {
    // Initialize audio
    if (!sunnyAudioRef.current) {
      sunnyAudioRef.current = new Audio(sunnySound);
      sunnyAudioRef.current.loop = true;
    }
    
    if (!rainAudioRef.current) {
      rainAudioRef.current = new Audio(rainSound);
      rainAudioRef.current.loop = true;
    }
    
    // Set volume
    const currentVolume = isMuted ? 0 : volume;
    if (sunnyAudioRef.current) sunnyAudioRef.current.volume = currentVolume;
    if (rainAudioRef.current) rainAudioRef.current.volume = currentVolume;
    
    // Play correct audio based on theme
    const playCorrectAudio = async () => {
      try {
        if (isMuted) {
          if (sunnyAudioRef.current) sunnyAudioRef.current.pause();
          if (rainAudioRef.current) rainAudioRef.current.pause();
          return;
        }
        
        if (isDarkMode) {
          if (sunnyAudioRef.current) sunnyAudioRef.current.pause();
          if (rainAudioRef.current) await rainAudioRef.current.play();
        } else {
          if (rainAudioRef.current) rainAudioRef.current.pause();
          if (sunnyAudioRef.current) await sunnyAudioRef.current.play();
        }
      } catch (error) {
        console.error("Audio playback error:", error);
      }
    };
    
    playCorrectAudio();
    


    // Cleanup
    return () => {
      if (sunnyAudioRef.current) sunnyAudioRef.current.pause();
      if (rainAudioRef.current) rainAudioRef.current.pause();
    };
  }, [volume, isDarkMode, isMuted]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // Apply body class for global styling
    document.body.classList.toggle('light-mode', !isDarkMode);
    document.body.classList.toggle('dark-mode', isDarkMode);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleProfileNavigation = () => {
    setShowProfileMenu(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/login');
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calculate parallax position for elements
  const getParallaxStyle = (strength = 20) => {
    const x = (mousePosition.x - 0.5) * strength;
    const y = (mousePosition.y - 0.5) * strength;
    return {
      transform: `translate(${x}px, ${y}px)`
    };
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/', { replace: true });
  };

  const handleAIQuizNavigation = () => {
    navigate('/ai-quiz');
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      try {
        const res = await axios.get('http://localhost:8000/api/profile/', {
          headers: { Authorization: `Token ${token}` }
        });
        const userData = JSON.parse(localStorage.getItem('user')) || {};
        userData.profile = res.data.profile;
        setUser(userData);
      } catch (e) {}
    };
    fetchProfile();
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0B1026]' : 'bg-[#f0f4ff]'} relative overflow-hidden`}>
      {/* Stars canvas - only shown in dark mode */}
      {showStars && isDarkMode && (
        <div className="fixed inset-0" style={{ zIndex: 0 }}>
          <Test />
        </div>
      )}

      {/* Light mode background */}
      {!isDarkMode && (
        <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
          <div className="absolute top-0 right-0 w-full h-full opacity-30">
            <div className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-pink-200 to-pink-300 blur-3xl -top-20 -right-20"></div>
            <div className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-blue-200 to-indigo-200 blur-3xl top-1/3 -left-20"></div>
            <div className="absolute w-80 h-80 rounded-full bg-gradient-to-r from-purple-200 to-indigo-200 blur-3xl bottom-20 right-40"></div>
          </div>
        </div>
      )}

      {/* Floating Icons */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <div className="absolute top-1/4 left-1/4" style={getParallaxStyle(30)}>
          <Brain size={isDarkMode ? 48 : 60} className={`${isDarkMode ? 'text-pink-500 opacity-60' : 'text-pink-400 opacity-80'}`} />
        </div>
        <div className="absolute top-1/3 right-1/4" style={getParallaxStyle(20)}>
          <Sparkles size={isDarkMode ? 48 : 60} className={`${isDarkMode ? 'text-indigo-400 opacity-60' : 'text-indigo-500 opacity-80'}`} />
        </div>
        <div className="absolute bottom-1/4 left-1/3" style={getParallaxStyle(25)}>
          <Gamepad2 size={isDarkMode ? 48 : 60} className={`${isDarkMode ? 'text-purple-400 opacity-60' : 'text-purple-500 opacity-80'}`} />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative min-h-screen flex flex-col" style={{ zIndex: 2 }}>
        {/* Navbar */}
        <nav className={`flex items-center justify-between py-4 px-6 backdrop-blur-lg border-b transition-colors duration-300 ${
          isDarkMode ? 'bg-white/10 border-indigo-500/20' : 'bg-white/70 border-gray-200'
        }`}>
          <div className="flex items-center">
            <Link 
              to="/" 
              onClick={handleHomeClick}
              className="cursor-pointer group"
            >
              <motion.h1 
                className={`text-3xl font-bold relative ${
                  isDarkMode 
                    ? 'text-indigo-200 hover:text-indigo-100' 
                    : 'text-indigo-800 hover:text-indigo-600'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">MindClash</span>
                <motion.span 
                  className={`absolute inset-0 rounded-lg transition-opacity duration-300 ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 group-hover:opacity-100' 
                      : 'bg-gradient-to-r from-indigo-200 to-purple-200 group-hover:opacity-100'
                  }`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1.2, opacity: 1 }}
                />
                <motion.div 
                  className={`absolute -bottom-1 left-0 w-full h-0.5 transform transition-all duration-300 origin-left ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400' 
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                  }`}
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                />
              </motion.h1>
            </Link>
          </div>
          
          <ul className="flex items-center space-x-6">
            <li>
              <Link to="/leaderboard" className={`hover:text-indigo-300 transition-colors ${
                isDarkMode ? 'text-indigo-200' : 'text-indigo-800'
              }`}>
                Leaderboard
              </Link>
            </li>
            <li>
              <button 
                onClick={toggleMute} 
                className={`hover:text-indigo-300 transition-colors ${
                  isDarkMode ? 'text-indigo-200' : 'text-indigo-800'
                }`}
              >
                {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
              </button>
            </li>
            <li>
              <button 
                onClick={toggleTheme} 
                className={`hover:text-indigo-300 transition-colors ${
                  isDarkMode ? 'text-indigo-200' : 'text-indigo-800'
                }`}
              >
                {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
              </button>
            </li>
            <li>
              {isLoggedIn ? (
                <div className="relative" ref={profileMenuRef}>
                  <div
                    onClick={handleProfileClick}
                    className="w-8 h-8 rounded-full cursor-pointer overflow-hidden border-2 border-indigo-600"
                    title="Profile"
                  >
                    {user?.profile?.avatar_url ? (
                      <model-viewer src={user.profile.avatar_url} alt="3D Avatar" camera-controls style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'transparent' }} />
                    ) : (
                      <img
                        src={user?.profileImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  
                  {showProfileMenu && (
                    <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ${
                      isDarkMode ? 'bg-white/10' : 'bg-white'
                    }`}>
                      <div className="py-1">
                        <button
                          onClick={handleProfileNavigation}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            isDarkMode ? 'text-white hover:bg-white/20' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <FaUser className="inline-block mr-2" />
                          Profile
                        </button>
                        <button
                          onClick={handleLogout}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            isDarkMode ? 'text-white hover:bg-white/20' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <FaSignOutAlt className="inline-block mr-2" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleLoginClick}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Login
                </button>
              )}
            </li>
          </ul>
        </nav>

        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <motion.h2 
            className={`text-5xl font-bold mb-4 relative group ${
              isDarkMode ? 'text-indigo-100' : 'text-indigo-900'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <span className="relative z-10">Welcome to MindClash</span>
            <motion.span 
              className={`absolute inset-0 rounded-lg transition-opacity duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 group-hover:opacity-100' 
                  : 'bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 group-hover:opacity-100'
              }`}
              initial={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.2, opacity: 1 }}
            />
            <motion.div 
              className={`absolute -bottom-2 left-0 w-full h-1 transform transition-all duration-300 origin-left ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400' 
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
              }`}
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
            />
          </motion.h2>
          <motion.p 
            className={`text-xl max-w-2xl mb-10 ${
              isDarkMode 
                ? 'text-indigo-300 hover:text-indigo-200' 
                : 'text-indigo-700 hover:text-indigo-600'
            } transition-colors duration-300`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Challenge your mind with our ultimate quiz experience. 
            Test your knowledge, battle with friends, and climb the leaderboards.
          </motion.p>
          
          <div className="flex flex-wrap space-x-0 space-y-4 md:space-y-0 md:space-x-4 mb-16">
            <button className={`px-8 py-3 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
              isDarkMode 
              ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30' 
              : 'bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20'
            }`}>
              Join Game
            </button>
            <button className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
              isDarkMode 
              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' 
              : 'bg-white/60 hover:bg-white/80 text-indigo-700 border border-indigo-200'
            }`}>
              Create Game
            </button>
            <button 
              onClick={handleAIQuizNavigation}
              className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center ${
                isDarkMode 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30' 
                : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/20'
              }`}
            >
              <FaRobot className="mr-2" />
              AI Quiz
            </button>
          </div>
        </div>

        {/* Categories Section with animated cards */}
        <div className={`px-8 py-10 backdrop-blur-md transition-colors duration-500 ${
          isDarkMode ? 'bg-white/5' : 'bg-indigo-50/70'
        }`}>
          <h3 className={`text-3xl font-bold mb-8 text-center ${
            isDarkMode ? 'text-indigo-100' : 'text-indigo-900'
          }`}>
            Choose Your Quiz Category
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {quizCategories.map((category, index) => (
              <div 
                key={category.id} 
                className={`overflow-hidden transition-all duration-500 transform hover:scale-105 hover:-rotate-1 rounded-xl group ${
                  isDarkMode 
                  ? 'bg-white/10 backdrop-blur-lg border border-white/20' 
                  : 'bg-white/80 backdrop-blur-lg border border-indigo-100 shadow-lg'
                }`}
                style={{ 
                  animationDelay: `${index * 0.2}s`,
                  transform: `translateY(${Math.sin(index) * 5}px)`
                }}
              >
                <div className="overflow-hidden">
                  <img 
                    src={category.image} 
                    alt={category.title} 
                    className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                </div>
                <div className="p-5">
                  <h4 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-indigo-900'}`}>{category.title}</h4>
                  <p className={`mb-4 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>{category.description}</p>
                  <button className={`w-full py-2 text-white rounded-lg font-medium transition-all duration-300 ${
                    isDarkMode 
                    ? 'bg-indigo-600 hover:bg-indigo-700' 
                    : 'bg-indigo-500 hover:bg-indigo-600'
                  } transform hover:-translate-y-1`}>
                    Start Quiz
                  </button>
                </div>
                
                {/* Decorative overlay */}
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
                  style={{ 
                    background: isDarkMode 
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)' 
                      : 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)'
                  }}
                ></div>
              </div>
            ))}
          </div>
        </div>

          <footer className={`mt-auto py-8 px-6 backdrop-blur-lg border-t ${
          isDarkMode ? 'bg-white/5 border-indigo-500/20' : 'bg-white/60 border-indigo-200/40'
        }`}>
          <div
            className={`footer-container ${
              isDarkMode ? 'text-indigo-200' : 'text-indigo-900'
            }`}
            style={getParallaxStyle(5)}
          >
            <p className={`footer-title ${
              isDarkMode ? 'text-indigo-300' : 'text-indigo-600'
            }`}>
              ⚡ MindClash: The Battle of Wits
            </p>
            <p className="footer-subtitle">
              "Where questions spark chaos and knowledge reigns supreme."
            </p>
            <div className="footer-team">
              <div className="footer-role">🧠 Visionary & Strategist: <span>Pranay</span></div>
              <div className="footer-role">💻 Code Alchemist: <span>Prudhvi</span></div>
              <div className="footer-role">📚 AI Whisperer: <span>Hima</span></div>
            </div>
            <p className="footer-copy">
              © {new Date().getFullYear()} MindClash. All rights reserved.
            </p>
          </div>
        </footer>
      </div>

    </div>
  );
};

export default Home;

