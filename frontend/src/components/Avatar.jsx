import React, { useState } from 'react';
import { AvatarCreator } from '@readyplayerme/react-avatar-creator';

const AvatarPage = () => {
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle successful avatar creation
  const handleAvatarExported = (url) => {
    setAvatarUrl(url);
    setLoading(false);
    console.log('Avatar created successfully:', url);
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
    <div className="flex flex-col items-center p-4 min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Create Your 3D Avatar</h1>
      
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden">
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
        <div className="mt-4 text-blue-600">
          Loading avatar creator...
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 text-red-600">
          Error: {error}
        </div>
      )}

      {/* Display the created avatar */}
      {avatarUrl && (
        <div className="mt-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Your Created Avatar</h2>
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
              className="text-blue-600 hover:underline"
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

