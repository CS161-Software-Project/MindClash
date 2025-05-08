import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import '../styles/Profile.css';
import axios from 'axios';
import '@google/model-viewer';
import { FaMoon, FaSun, FaMusic, FaUser, FaChartLine, FaSignOutAlt, FaRobot, FaEdit } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [formData, setFormData] = useState({
    bio: ''
  });

  // Three.js references
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const particlesRef = useRef(null);

  // Apply theme on mount
  useEffect(() => {
    document.body.classList.toggle('light-mode', !isDarkMode);
    document.body.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  // Fetch latest profile from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const res = await axios.get('http://localhost:8000/api/profile/', {
          headers: { Authorization: `Token ${token}` }
        });
        const userData = JSON.parse(localStorage.getItem('user')) || {};
        userData.profile = res.data.profile;
        setUser(userData);
        setFormData({
          bio: res.data.profile.bio || ''
        });
      } catch (err) {
        navigate('/login');
      }
    };
    fetchProfile();
  }, [navigate]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.patch('http://localhost:8000/api/profile/', 
        { bio: formData.bio },
        { headers: { Authorization: `Token ${token}` } }
      );
      setIsEditing(false);
    // Show success animation
    const successEl = document.getElementById('successAnimation');
    successEl.classList.add('active');
    setTimeout(() => {
      successEl.classList.remove('active');
    }, 2000);
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  const handleAvatarClick = () => {
    navigate('/avatar');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('light-mode', !isDarkMode);
    document.body.classList.toggle('dark-mode', isDarkMode);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className={`min-h-screen overflow-hidden relative ${isDarkMode ? 'bg-[#0B1026]' : 'bg-[#f0f4ff]'}`}>
      {/* Navbar */}
      <nav className={`transition-colors duration-300 ${
        isDarkMode ? 'border-indigo-500/20' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link 
              to="/" 
              className="cursor-pointer group"
            >
              <motion.h1 
                className={`text-2xl font-bold relative ${
                  isDarkMode 
                    ? 'text-indigo-200 hover:text-indigo-100' 
                    : 'text-indigo-800 hover:text-indigo-600'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">MindClash</span>
              </motion.h1>
            </Link>
          </div>
          
          <ul className="flex items-center space-x-8">
            <li>
              <Link to="/leaderboard" className={`hover:text-indigo-300 transition-colors text-base ${
                isDarkMode ? 'text-indigo-200' : 'text-indigo-800'
              }`}>
                Leaderboard
              </Link>
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
              <div className="w-16 h-16 rounded-full cursor-pointer overflow-hidden border-2 border-indigo-600 hover:border-indigo-400 transition-all duration-300">
                {user?.profile?.avatar_url ? (
                  <model-viewer 
                    src={user.profile.avatar_url} 
                    alt="3D Avatar" 
                    camera-controls 
                    style={{ 
                      width: '64px', 
                      height: '64px', 
                      borderRadius: '50%', 
                      background: 'transparent',
                      transform: 'scale(1.2) translateY(-10%)',
                      transition: 'transform 0.3s ease'
                    }} 
                  />
                ) : (
                  <img
                    src={user?.profileImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    alt="Profile"
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                )}
              </div>
            </li>
          </ul>
        </div>
      </nav>
      
      {/* Content */}
      <div className="relative z-10 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Success notification */}
          <div id="successAnimation" className="success-notification">
            Profile updated successfully!
          </div>
          
          <div className={`glass-effect rounded-2xl p-8 shadow-2xl border ${
            isDarkMode ? 'border-white/20' : 'border-indigo-200'
          }`}>
            <div className="flex flex-col items-center space-y-8">
              {/* Profile Image */}
              <div className="flex items-center space-x-8">
                <motion.div 
                  className="relative w-72 h-72"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="relative w-full h-full rounded-2xl overflow-hidden">
                    {user?.profile?.avatar_url ? (
                      <model-viewer
                        src={user.profile.avatar_url}
                        alt="3D Avatar"
                        camera-controls
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '1rem',
                          background: 'transparent',
                          transform: 'scale(1.1)',
                          transition: 'transform 0.3s ease'
                        }}
                      />
                    ) : (
                      <img
                        src={user?.profileImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                        alt="Profile"
                        className="w-full h-full object-cover rounded-2xl hover:scale-110 transition-transform duration-300"
                      />
                    )}
                  </div>
                </motion.div>
                <motion.button 
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                      : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAvatarClick}
                >
                  Change Avatar
                </motion.button>
              </div>

              {/* Profile Info */}
              <div className="w-full space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-center"
                >
                  <h2 className={`text-4xl font-bold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-indigo-900'
                  }`}>{user?.name || 'User'}</h2>
                  {isEditing ? (
                    <div className="flex flex-col items-center space-y-4">
                      <textarea
                        name="bio"
                        value={formData.bio}
                    onChange={handleInputChange}
                        rows="3"
                        placeholder="Tell us about yourself..."
                        className={`w-full max-w-md rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300 ${
                          isDarkMode 
                            ? 'bg-white/20 text-white' 
                            : 'bg-white/80 text-indigo-900'
                        }`}
                      />
                      <div className="flex space-x-4">
                        <button
                          onClick={handleUpdate}
                          className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
                            isDarkMode 
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                              : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                          }`}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
                            isDarkMode 
                              ? 'bg-white/20 hover:bg-white/30 text-white' 
                              : 'bg-white/80 hover:bg-white/90 text-indigo-900'
                          }`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <motion.p 
                        className={`text-lg ${
                          isDarkMode ? 'text-indigo-200' : 'text-indigo-700'
                        }`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                      >
                        {user?.bio || 'No bio yet'}
                      </motion.p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className={`flex items-center space-x-2 transition-colors duration-300 ${
                          isDarkMode 
                            ? 'text-indigo-300 hover:text-indigo-200' 
                            : 'text-indigo-600 hover:text-indigo-500'
                        }`}
                      >
                        <FaEdit />
                        <span>Edit Bio</span>
                      </button>
                    </div>
                  )}
                </motion.div>

                {/* Stats */}
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <div className={`rounded-xl p-4 text-center ${
                    isDarkMode ? 'bg-white/5' : 'bg-white/80'
                  }`}>
                    <h3 className={`text-2xl font-bold ${
                      isDarkMode ? 'text-indigo-300' : 'text-indigo-600'
                    }`}>{user?.quizzesTaken || 0}</h3>
                    <p className={isDarkMode ? 'text-indigo-200' : 'text-indigo-700'}>Quizzes Taken</p>
                  </div>
                  <div className={`rounded-xl p-4 text-center ${
                    isDarkMode ? 'bg-white/5' : 'bg-white/80'
                  }`}>
                    <h3 className={`text-2xl font-bold ${
                      isDarkMode ? 'text-indigo-300' : 'text-indigo-600'
                    }`}>{user?.averageScore || 0}%</h3>
                    <p className={isDarkMode ? 'text-indigo-200' : 'text-indigo-700'}>Average Score</p>
                  </div>
                  <div className={`rounded-xl p-4 text-center ${
                    isDarkMode ? 'bg-white/5' : 'bg-white/80'
                  }`}>
                    <h3 className={`text-2xl font-bold ${
                      isDarkMode ? 'text-indigo-300' : 'text-indigo-600'
                    }`}>{user?.rank || 'N/A'}</h3>
                    <p className={isDarkMode ? 'text-indigo-200' : 'text-indigo-700'}>Global Rank</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;