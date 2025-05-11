import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';

const ResultsPage = () => {
  const { pin } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${API_URL}/leaderboard/${pin}/`, {
          headers: { Authorization: `Token ${token}` }
        });

        setResults(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching results:', error);
        setError('Failed to load results');
        setLoading(false);
      }
    };

    fetchResults();
  }, [pin, navigate]);

  if (loading) return <div className="text-center p-8">Loading results...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!results) return <div className="text-center p-8">No results found</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6">Game Results</h1>
        <div className="space-y-4">
          {results.leaderboard.map((player, index) => (
            <div 
              key={player.id} 
              className={`flex items-center justify-between p-4 rounded ${
                index === 0 ? 'bg-yellow-100' : 
                index === 1 ? 'bg-gray-100' : 
                index === 2 ? 'bg-orange-100' : 'bg-white'
              }`}
            >
              <div className="flex items-center space-x-4">
                <span className="text-xl font-bold">{index + 1}</span>
                <span className="font-semibold">{player.username}</span>
              </div>
              <span className="text-lg font-bold">{player.score}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-6 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default ResultsPage; 