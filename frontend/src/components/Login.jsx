import React, { useState } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { Brain, Sparkles, Gamepad2 } from 'lucide-react';
import '../styles/Auth.css';
import { Link, useNavigate } from 'react-router-dom';
import Test from './Test';
import AuthService from '../services/AuthService';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { success, user, error, token } = await AuthService.login(formData.email, formData.password);

      if (success && token) {
        // Save token to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        console.log('Logged in user:', user);
        navigate('/');
      } else {
        throw new Error(error || 'Login failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Invalid Credentials or Something went wrong!');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1026] relative overflow-hidden">
      <div className="fixed inset-0" style={{ zIndex: 0 }}>
        <Test />
      </div>

      {/* Floating Icons */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 animate-float-slow">
          <Brain size={48} className="text-pink-500 opacity-60" />
        </div>
        <div className="absolute top-1/3 right-1/4 animate-float-medium">
          <Sparkles size={48} className="text-indigo-400 opacity-60" />
        </div>
        <div className="absolute bottom-1/4 left-1/3 animate-float-fast">
          <Gamepad2 size={48} className="text-purple-400 opacity-60" />
        </div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-2 animate-glow">MindClash</h1>
            <p className="text-xl text-indigo-300">Battle of Wits</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl animate-fadeIn border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Join the Battle</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all"
                  required
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Login
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#0B1026] text-white/60">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors duration-200 border border-white/10"
              >
                <FaGoogle />
                <span>Google</span>
              </button>
            </form>

            <p className="mt-6 text-center text-white/60">
              Don't have an account?
              <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 ml-1">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;