import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarCreator } from '@readyplayerme/react-avatar-creator';
import axios from 'axios';

const AvatarPage = () => {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle successful avatar creation
  const handleAvatarExported = async (event) => {
    const url = event?.data?.url || event; // fallback if event is just the url
    setAvatarUrl(url);
    setLoading(true);
    setError(null);
  
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Authentication token not found');
  
      const response = await axios.post(
        'https://mindclash-mm6g.onrender.com/api/profile/update/',
        { avatar_url: url },
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      navigate('/');
    } catch (err) {
      // ...error handling
    } finally {
      setLoading(false);
    }
  };

  // Handle any errors during avatar creation
  const handleError = (err) => {
    setError(err.message || 'An error occurred during avatar creation');
    setLoading(false);
    console.error('Avatar creation error:', err);
  };

  // Handle when the creator starts loading
  const handleLoading = () => {
    setLoading(true);
    setError(null);
  };

  return (
    <div className="flex flex-col items-center p-4 min-h-screen bg-[#1a1a2e]">
      <h1 className="text-3xl font-bold mb-6 text-white">Create Your 3D Avatar</h1>
      
      <div className="w-full max-w-4xl bg-[#2a2a3c] rounded-lg shadow-lg overflow-hidden border border-indigo-500/20">
        {/* Avatar Creator Component */}
        <div className="h-96 md:h-[600px]">
          <AvatarCreator
            subdomain="demo" // Replace with your subdomain
            onAvatarExported={handleAvatarExported}
            onError={handleError}
            onLoading={handleLoading}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="mt-4 text-indigo-400">
          {avatarUrl ? 'Saving your avatar...' : 'Loading avatar creator...'}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500/20 rounded-lg text-red-400">
          Error: {error}
        </div>
      )}

      {/* Display the created avatar */}
      {avatarUrl && !loading && (
        <div className="mt-8 text-center">
          <h2 className="text-xl font-semibold mb-4 text-white">Your Created Avatar</h2>
          <img 
            src={avatarUrl} 
            alt="Your 3D Avatar" 
            className="h-64 rounded-lg shadow-md"
          />
          <p className="mt-4">
            <a 
              href={avatarUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 hover:underline"
            >
              View full avatar
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

export default AvatarPage;

