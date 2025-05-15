import React, { useState, useEffect } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { Brain, Sparkles, Gamepad2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Test from './Test';
import Loader from '../pages/Loader';
import AuthService from '../services/AuthService';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password1: '',
    password2: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showStars, setShowStars] = useState(true);

  // Handle WebGL context loss by disabling stars when necessary
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setError('');
    
  //   // Basic validation
  //   if (formData.password1 !== formData.password2) {
  //     setError('Passwords do not match');
  //     return;
  //   }
    
  //   if (formData.password1.length < 6) {
  //     console.log(formData.password1.length)
  //     setError('Password must be at least 6 characters');
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     // Prepare data for API - remove confirmPassword as backend won't need it
  //     const userData = {
  //       username: formData.username,
  //       email: formData.email,
  //       password1: formData.password1,
  //       password2:formData.password2
  //     };
      
  //     console.log("About to register with:", userData);
      
  //     // Call registration service
  //     const response = await AuthService.register(userData);
  //     console.log("Registration successful:", response);
      
  //     // Add a delay to see console logs before redirecting
  //     setTimeout(() => {
  //       // If successful, redirect to dashboard or home
  //       navigate('/');
  //     }, 1000);
  //   } catch (err) {
  //     console.error("Submit error:", err);
  //     setError(err.message || 'Registration failed. Please try again.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (formData.password1 !== formData.password2) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password1.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
  
    try {
      setLoading(true);
      // Prepare data for API - include both password fields
      const userData = {
        username: formData.username,
        email: formData.email,
        password1: formData.password1,
        password2: formData.password2
      };
      
      console.log("About to register with:", userData);
      
      // Call registration service
      const response = await AuthService.register(userData);
      console.log("Registration successful:", response);
      
      // Add a delay to see console logs before redirecting
      setTimeout(() => {
        // If successful, redirect to dashboard or home
        navigate('/avatar');
      }, 1000);
    } catch (err) {
      console.error("Submit error:", err);
      
      // Initialize default error message
      let errorMessage = 'Registration failed. Please try again.';
      
      try {
        // Check if the error object has a message property that's a JSON string
        if (err.message && typeof err.message === 'string') {
          try {
            // Attempt to parse the JSON string in the message
            const parsedMessage = JSON.parse(err.message);
            
            // Check for specific field errors
            if (parsedMessage.username) {
              errorMessage = parsedMessage.username[0].message || 'Username error';
            } else if (parsedMessage.email) {
              errorMessage = parsedMessage.email[0].message || 'Email error';
            } else if (parsedMessage.password1) {
              errorMessage = parsedMessage.password1[0].message || 'Password error';
            } else if (parsedMessage.password2) {
              errorMessage = parsedMessage.password2[0].message || 'Password confirmation error';
            } else if (parsedMessage.non_field_errors) {
              errorMessage = parsedMessage.non_field_errors[0];
            }
          } catch (parseError) {
            // If parsing fails, use the raw message
            errorMessage = err.message;
          }
        } 
        // If there's no message property but there's an error property
        else if (err.error) {
          errorMessage = err.error;
          
          // Check if there's a more detailed message
          if (err.message) {
            try {
              // Try to parse the message if it's a JSON string
              const detailedMessage = JSON.parse(err.message);
              
              // Look for field-specific errors
              if (detailedMessage.username) {
                errorMessage = detailedMessage.username[0].message || 'Username error';
              } else if (detailedMessage.email) {
                errorMessage = detailedMessage.email[0].message || 'Email error';
              } else if (detailedMessage.password1) {
                errorMessage = detailedMessage.password1[0].message || 'Password error';
              } else if (detailedMessage.password2) {
                errorMessage = detailedMessage.password2[0].message || 'Password confirmation error';
              } else if (detailedMessage.non_field_errors) {
                errorMessage = detailedMessage.non_field_errors[0];
              }
            } catch (parseError) {
              // If parsing fails, use the error message as is
              errorMessage = err.error;
            }
          }
        }
      } catch (e) {
        // If any error occurs during the parsing process, use a generic message
        console.error("Error parsing error message:", e);
        errorMessage = 'Registration failed. Please try again.';
      }
      
      // Log the extracted error message for debugging
      console.log("Displaying error message:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader text="Creating your account..." />;
  }
  
  return (
    <div className="min-h-screen bg-[#0B1026] relative overflow-hidden">
      {/* Stars canvas container - only show if WebGL is working */}
      {showStars && (
        <div className="fixed inset-0" style={{ zIndex: 0 }}>
          <Test />
        </div>
      )}

      {/* Floating Icons with new animations */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
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

      {/* Main Content - higher z-index to be above stars */}
      <div className="relative min-h-screen flex items-center justify-center px-4" style={{ zIndex: 2, position: 'relative' }}>
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-2 animate-glow">MindClash</h1>
            <p className="text-xl text-indigo-300">Battle of Wits</p>
          </div>

          {/* Form Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl animate-fadeIn border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Join the Battle</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-white">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all"
                  required
                />
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
                  name="password1"
                  placeholder="Password"
                  value={formData.password1}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all"
                  required
                />
                <input
                  type="password"
                  name="password2"
                  placeholder="Confirm Password"
                  value={formData.password2}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Sign Up
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
              Already have an account?
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 ml-1">Login</Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        .animate-float-slow {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-medium {
          animation: float 5s ease-in-out infinite;
        }

        .animate-float-fast {
          animation: float 4s ease-in-out infinite;
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }

        @keyframes glow {
          0%, 100% { text-shadow: 0 0 20px rgba(129, 140, 248, 0.5); }
          50% { text-shadow: 0 0 30px rgba(129, 140, 248, 0.8); }
        }

        .star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          animation: twinkle var(--duration, 3s) infinite;
          opacity: 0;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Signup;