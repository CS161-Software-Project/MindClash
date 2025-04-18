import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import '../styles/Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    bio: ''
  });
  const [loading, setLoading] = useState(true);
  
  // Three.js references
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const particlesRef = useRef(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(userData);
    setFormData({
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      age: userData.age || '',
      bio: userData.bio || ''
    });
    setLoading(false);
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

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Setup scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Setup camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 20;
    cameraRef.current = camera;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    
    const posArray = new Float32Array(particlesCount * 3);
    const colorArray = new Float32Array(particlesCount * 3);
    
    for(let i = 0; i < particlesCount * 3; i++) {
      // Position
      posArray[i] = (Math.random() - 0.5) * 50;
      
      // Color - indigo to purple gradient
      if(i % 3 === 0) colorArray[i] = 0.4 + Math.random() * 0.2; // R
      if(i % 3 === 1) colorArray[i] = 0.1 + Math.random() * 0.1; // G
      if(i % 3 === 2) colorArray[i] = 0.7 + Math.random() * 0.3; // B
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      blending: THREE.AdditiveBlending
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    particlesRef.current = particlesMesh;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (particlesRef.current) {
        particlesRef.current.rotation.x += 0.0005;
        particlesRef.current.rotation.y += 0.0005;
      }
      
      renderer.render(scene, camera);
    };
    
    animate();

    // Handle resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      scene.clear();
    };
  }, []);

  // Update particles based on mouse movement
  useEffect(() => {
    if (particlesRef.current && mousePosition.x && mousePosition.y) {
      const targetX = (mousePosition.x - 0.5) * 2;
      const targetY = (mousePosition.y - 0.5) * -2;
      
      particlesRef.current.rotation.x += (targetY - particlesRef.current.rotation.x) * 0.01;
      particlesRef.current.rotation.y += (targetX - particlesRef.current.rotation.y) * 0.01;
    }
  }, [mousePosition]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdate = () => {
    const updatedUser = {
      ...user,
      ...formData
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    
    // Show success animation
    const successEl = document.getElementById('successAnimation');
    successEl.classList.add('active');
    setTimeout(() => {
      successEl.classList.remove('active');
    }, 2000);
  };

  // Calculate parallax position for elements
  const getParallaxStyle = (strength = 20) => {
    const x = (mousePosition.x - 0.5) * strength;
    const y = (mousePosition.y - 0.5) * strength;
    return {
      transform: `translate(${x}px, ${y}px)`
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="animate-spin w-16 h-16 border-4 border-indigo-400 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Three.js background container */}
      <div ref={mountRef} className="absolute inset-0 -z-10"></div>
      
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 -z-5"></div>
      
      {/* Content */}
      <div className="relative z-10 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
          style={getParallaxStyle(5)}
        >
          {/* Success notification */}
          <div id="successAnimation" className="success-notification">
            Profile updated successfully!
          </div>
          
          <div className="glass-effect rounded-2xl p-8 shadow-2xl border border-white/20">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
              <motion.div
                whileHover={{ scale: 1.05, rotate: [0, -2, 2, -2, 0] }}
                whileTap={{ scale: 0.95 }}
                className="profile-image-container w-48 h-48 rounded-full overflow-hidden border-4 border-indigo-400 relative group animate-float animate-glow flex-shrink-0"
                style={getParallaxStyle(10)}
              >
                <img
                  src={user?.profileImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                  alt="Profile"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                  <span className="text-white text-sm font-medium">Change Photo</span>
                </div>
              </motion.div>
              
              <div className="flex flex-col items-center md:items-start">
                <motion.h2 
                  className="text-3xl font-bold text-white mb-2 glow-text"
                  whileHover={{ scale: 1.05 }}
                >
                  {user?.firstName} {user?.lastName}
                </motion.h2>
                <p className="text-indigo-200 text-center md:text-left max-w-md">
                  {formData.bio || "No bio yet. Share something about yourself!"}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col"
                >
                  <label className="text-indigo-200 mb-2 text-lg">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="bg-white/20 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300 hover:bg-white/30"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col"
                >
                  <label className="text-indigo-200 mb-2 text-lg">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="bg-white/20 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300 hover:bg-white/30"
                  />
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col max-w-xs"
              >
                <label className="text-indigo-200 mb-2 text-lg">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="bg-white/20 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300 hover:bg-white/30"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col"
              >
                <label className="text-indigo-200 mb-2 text-lg">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Tell us about yourself..."
                  className="bg-white/20 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300 hover:bg-white/30"
                />
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(99, 102, 241, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleUpdate}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden"
              >
                <span className="relative z-10">Update Profile</span>
                <span className="button-glow"></span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;