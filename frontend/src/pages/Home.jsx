  import React, { useEffect, useState, useRef } from 'react';
  import { Link, useNavigate } from 'react-router-dom';
  import { FaMoon, FaSun, FaMusic, FaUser, FaSignOutAlt, FaRobot } from 'react-icons/fa';
  import { Brain, Sparkles, Gamepad2, Trophy, Users, Clock } from 'lucide-react';
  import '../styles/Home.css';
  import Test from '../components/Test';
  import { motion } from 'framer-motion';
  import "@google/model-viewer";
  import axios from 'axios';
  import avatarImage from '../assets/avatar.png'; // Import the avatar image

  const Home = () => {
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [showStars, setShowStars] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [user, setUser] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef(null);

    // Feature cards for the homepage
    const featureCards = [
      {
        icon: <Trophy size={32} />,
        title: "Competitive Battles",
        description: "Challenge friends and strangers in real-time quiz competitions"
      },
      {
        icon: <Brain size={32} />,
        title: "Knowledge Expansion",
        description: "Explore diverse topics and expand your knowledge horizons"
      },
      {
        icon: <FaRobot size={32} />,
        title: "AI-Powered Quizzes",
        description: "Experience adaptive quizzes tailored to your skill level"
      },
      {
        icon: <Users size={32} />,
        title: "Global Community",
        description: "Connect with trivia enthusiasts from around the world"
      }
    ];


    const toggleMusic = () => {
      setIsMusicPlaying(!isMusicPlaying);
    };


    //getting a token and user data from the local storage if it exists 
    useEffect(() => {
      const token = localStorage.getItem('authToken');
      const userData = JSON.parse(localStorage.getItem('user'));
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

    
    const toggleTheme = () => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      document.body.classList.toggle('light-mode', !newMode);
      document.body.classList.toggle('dark-mode', newMode);
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
          const res = await axios.get('https://mindclash-mm6g.onrender.com/api/profile/', {
            headers: { Authorization: `Token ${token}` }
          });
          const userData = JSON.parse(localStorage.getItem('user')) || {};
          userData.profile = res.data.profile;
          setUser(userData);
        } catch (e) {}
      };
      fetchProfile();
    }, []);

    const handleCreateGameClick = () => {
      navigate('/create-game');
    };

    const handleJoinGameClick = () => {
      navigate('/join-game');
    };

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

        {/* Main Content */}
        <div className="relative min-h-screen flex flex-col" style={{ zIndex: 2 }}>
          {/* Navbar */}
          <nav className={`flex items-center justify-between py-6 px-8 backdrop-blur-lg border-b transition-all duration-300 ${
            isDarkMode ? 'bg-[#0B1026]/80 border-indigo-500/20' : 'bg-white/80 border-gray-200'
          }`}>
            <div className="flex items-center">
              <Link 
                to="/" 
                onClick={handleHomeClick}
                className="cursor-pointer group"
              >
                <motion.h1 
                  className={`text-4xl font-bold relative ${
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
                </motion.h1>
              </Link>
            </div>
            
            <ul className="flex items-center space-x-8">
              {/* <li>
                <Link to="/leaderboard" className={`hover:text-indigo-300 transition-colors text-lg ${
                  isDarkMode ? 'text-indigo-200' : 'text-indigo-800'
                }`}>
                  Leaderboard
                </Link>
              </li> */}
              <li>
              <Link to="/stats" className={`hover:text-indigo-300 transition-colors text-lg ${
                  isDarkMode ? 'text-indigo-200' : 'text-indigo-800'
                }`}>
                  Stats
                </Link>
              </li>
              <li>
                <button 
                  onClick={toggleTheme} 
                  className={`hover:text-indigo-300 transition-colors ${
                    isDarkMode ? 'text-indigo-200' : 'text-indigo-800'
                  }`}
                >
                  {isDarkMode ? <FaSun size={24} /> : <FaMoon size={24} />}
                </button>
              </li>
              <li>
                {isLoggedIn ? (
                  <div className="relative" ref={profileMenuRef}>
                    <div
                        onClick={handleProfileClick}
                        className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-600 transition-all duration-300"
                        title="Profile"
                      >
                      {user?.profile?.avatar_url ? (
                        <model-viewer 
                          src={user.profile.avatar_url} 
                          alt="3D Avatar" 
                          camera-controls 
                          style={{ 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: '50%', 
                            background: 'transparent'
                          }} 
                        />
                      ) : (
                        <img
                          src={user?.profileImage || avatarImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    
                    {showProfileMenu && (
                      <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ${
                        isDarkMode ? 'bg-[#0B1026]/90 backdrop-blur-md' : 'bg-white/90 backdrop-blur-md'
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
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200 text-lg"
                  >
                    Login
                  </button>
                )}
              </li>
            </ul>
          </nav>

            {/* Hero Section with Avatar */}
            <section className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 md:px-12 xl:px-24 py-10 md:py-20 gap-8 md:gap-12">
              {/* Hero Text Section */}
              <div className="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left">
                <h2 
                  className={`text-4xl md:text-6xl font-bold mb-6 whitespace-nowrap ${
                    isDarkMode ? 'text-indigo-100' : 'text-indigo-900'
                  }`}
                  style={{ lineHeight: 1.1 }}
                >
                  Welcome to MindClash
                </h2>
                <p className={`text-lg md:text-xl max-w-2xl mb-10 ${
                  isDarkMode 
                    ? 'text-indigo-300' 
                    : 'text-indigo-700'
                }`}>
                  Challenge your mind with our ultimate quiz experience. Test your knowledge, battle with friends, and climb the leaderboards.
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleJoinGameClick}
                    className={`px-8 py-3 text-white rounded-lg font-medium transition-all duration-300 ${
                      isDarkMode 
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30' 
                      : 'bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20'
                    }`}
                  >
                    Join Game
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCreateGameClick}
                    className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 ${
                      isDarkMode 
                      ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' 
                      : 'bg-white/60 hover:bg-white/80 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    Create Game
                  </motion.button>
                  {/* <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAIQuizNavigation}
                    className={`px-8 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center ${
                      isDarkMode 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30' 
                      : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/20'
                    }`}
                  >
                    <FaRobot className="mr-2" />
                    AI Quiz
                  </motion.button> */}
                </div>
              </div>

              {/* Avatar Section */}
              <div className="flex-1 flex justify-center items-center">
                {/* Subtle glow effect */}
                <div className={`absolute inset-0 pointer-events-none ${
                  isDarkMode
                    ? 'shadow-[0_0_100px_30px_rgba(99,102,241,0.25)]'
                    : 'shadow-[0_0_100px_30px_rgba(99,102,241,0.1)]'
                }`}></div>

                {/* Image container without circle mask */}
                <div className="w-[200px] sm:w-[350px] md:w-[600px] lg:w-[500px] -ml-6 mr-5 transition-transform duration-700 hover:scale-110">
                  <img 
                    src={avatarImage} 
                    alt="Avatar" 
                    className="w-full object-contain" 
                    style={{ backgroundColor: 'transparent' }}
                  />
                </div>
              </div>

            </section>
          {/* Feature Cards */}
          <div className={`px-4 py-16 backdrop-blur-md transition-colors duration-500 ${
            isDarkMode ? 'bg-white/5' : 'bg-indigo-50/70'
          }`}>
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h3 className={`text-3xl font-bold ${
                  isDarkMode ? 'text-indigo-100' : 'text-indigo-900'
                }`}>
                  Experience The Ultimate Quiz Platform
                </h3>
                <div className={`h-1 w-24 mx-auto mt-4 ${
                  isDarkMode ? 'bg-indigo-500' : 'bg-indigo-600'
                }`}></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {featureCards.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                    className={`p-6 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                      isDarkMode 
                        ? 'bg-white/10 border border-white/20 shadow-lg shadow-indigo-500/10' 
                        : 'bg-white/80 border border-indigo-100 shadow-lg shadow-indigo-500/5'
                    }`}
                  >
                    <div className={`mb-4 p-3 rounded-full inline-block ${
                      isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-100'
                    }`}>
                      <span className={isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}>
                        {feature.icon}
                      </span>
                    </div>
                    <h4 className={`text-xl font-bold mb-2 ${
                      isDarkMode ? 'text-white' : 'text-indigo-900'
                    }`}>
                      {feature.title}
                    </h4>
                    <p className={`${
                      isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
                    }`}>
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Footer */}
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