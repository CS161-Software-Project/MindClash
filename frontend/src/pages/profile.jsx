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
    bio: '',
    firstName: '',
    lastName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwordError, setPasswordError] = useState('');

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
        const res = await axios.get('https://mindclash-mm6g.onrender.com/api/profile/', {
          headers: { Authorization: `Token ${token}` }
        });
        
        if (res.data.success) {
          const userData = JSON.parse(localStorage.getItem('user')) || {};
          userData.profile = res.data.profile;
          setUser(userData);
          setFormData({
            bio: res.data.profile.bio || '',
            firstName: res.data.profile.first_name || '',
            lastName: res.data.profile.last_name || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
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
      const updateData = {
        bio: formData.bio,
        first_name: formData.firstName,
        last_name: formData.lastName
      };

      // Only include password fields if they're being changed
      if (showPasswordFields) {
        if (formData.newPassword !== formData.confirmPassword) {
          setPasswordError('New passwords do not match');
          return;
        }
        if (formData.newPassword.length < 8) {
          setPasswordError('Password must be at least 8 characters long');
          return;
        }
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await axios.post('https://mindclash-mm6g.onrender.com/api/profile/update/', 
        updateData,
        { headers: { Authorization: `Token ${token}` } }
      );

      if (response.data.success) {
        // Update local user data
        const updatedUserData = { ...user };
        updatedUserData.profile = response.data.profile;
        setUser(updatedUserData);
        localStorage.setItem('user', JSON.stringify(updatedUserData));

        setIsEditing(false);
        setShowPasswordFields(false);
        setPasswordError('');
        
        // Show success animation
        const successEl = document.getElementById('successAnimation');
        successEl.classList.add('active');
        setTimeout(() => {
          successEl.classList.remove('active');
        }, 2000);

        // If password was changed, redirect to login
        if (showPasswordFields) {
          setTimeout(() => {
            handleLogout();
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      if (err.response?.data?.message) {
        setPasswordError(err.response.data.message);
      }
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

  // Add profile menu state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

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
              <div className="relative" ref={profileMenuRef}>
                <div 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-16 h-16 rounded-full cursor-pointer overflow-hidden border-2 border-indigo-600 hover:border-indigo-400 transition-all duration-300"
                >
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
                
                {showProfileMenu && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ${
                    isDarkMode ? 'bg-[#0B1026]/90 backdrop-blur-md' : 'bg-white/90 backdrop-blur-md'
                  }`}>
                    <div className="py-1">
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
                <div className="flex flex-col items-center space-y-4">
                  {user?.username && (
                    <motion.h2 
                      className={`text-2xl font-bold ${
                        isDarkMode ? 'text-indigo-200' : 'text-indigo-800'
                      }`}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      {user.username}
                    </motion.h2>
                  )}
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
              </div>

              {/* Profile Information */}
              <motion.div 
                className="w-full max-w-2xl space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="grid grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 rounded-lg bg-white/5 border ${
                        isDarkMode ? 'border-white/20 text-white' : 'border-gray-200 text-gray-900'
                      } focus:ring-2 focus:ring-indigo-500 transition-all duration-300`}
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 rounded-lg bg-white/5 border ${
                        isDarkMode ? 'border-white/20 text-white' : 'border-gray-200 text-gray-900'
                      } focus:ring-2 focus:ring-indigo-500 transition-all duration-300`}
                    />
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="4"
                    className={`w-full px-4 py-2 rounded-lg bg-white/5 border ${
                      isDarkMode ? 'border-white/20 text-white' : 'border-gray-200 text-gray-900'
                    } focus:ring-2 focus:ring-indigo-500 transition-all duration-300`}
                  />
                </motion.div>

                {/* Password Change Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="space-y-4"
                >
                  <button
                    onClick={() => setShowPasswordFields(!showPasswordFields)}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors duration-300"
                  >
                    {showPasswordFields ? 'Hide Password Change' : 'Change Password'}
                  </button>

                  {showPasswordFields && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <input
                        type="password"
                        name="currentPassword"
                        placeholder="Current Password"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 rounded-lg bg-white/5 border ${
                          isDarkMode ? 'border-white/20' : 'border-gray-200'
                        } focus:ring-2 focus:ring-indigo-500 transition-all duration-300`}
                      />
                      <input
                        type="password"
                        name="newPassword"
                        placeholder="New Password"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 rounded-lg bg-white/5 border ${
                          isDarkMode ? 'border-white/20' : 'border-gray-200'
                        } focus:ring-2 focus:ring-indigo-500 transition-all duration-300`}
                      />
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm New Password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 rounded-lg bg-white/5 border ${
                          isDarkMode ? 'border-white/20' : 'border-gray-200'
                        } focus:ring-2 focus:ring-indigo-500 transition-all duration-300`}
                      />
                      {passwordError && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-red-400 text-sm"
                        >
                          {passwordError}
                        </motion.p>
                      )}
                    </motion.div>
                  )}
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="flex justify-end space-x-4"
                >
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setShowPasswordFields(false);
                          setPasswordError('');
                        }}
                        className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdate}
                        className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-300"
                      >
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-300"
                    >
                      Edit Profile
                    </button>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;