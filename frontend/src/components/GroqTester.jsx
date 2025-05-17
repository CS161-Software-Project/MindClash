import React, { useState } from 'react';
import axios from 'axios';

const GroqTester = () => {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testConnection = async () => {
    setLoading(true);
    setError('');
    setResponse('');
    
    try {
      const result = await axios.post('https://mindclash-mm6g.onrender.com/api/groq-chat/', { 
        prompt: 'Say hello in 5 different languages'
      });
      setResponse(result.data.response);
    } catch (err) {
      console.error('Error testing GROQ API:', err);
      setError(err.response?.data?.error || err.message || 'Failed to connect to GROQ API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '600px', 
      margin: '0 auto',
      backgroundColor: '#1a1a2e',
      color: '#e6e6e6',
      borderRadius: '10px',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)'
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        color: '#e6e6e6',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
      }}>GROQ API Test</h2>
      
      <button 
        onClick={testConnection}
        disabled={loading}
        style={{
          padding: '10px 20px',
          background: loading ? '#484866' : '#6c63ff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px',
          width: '100%'
        }}
      >
        {loading ? 'Testing...' : 'Test GROQ Connection'}
      </button>
      
      {error && (
        <div style={{ 
          padding: '10px', 
          background: '#3d2836', 
          color: '#ff7b8f',
          borderRadius: '4px',
          marginBottom: '20px',
          borderLeft: '4px solid #ff4d6d'
        }}>
          <p>Error: {error}</p>
        </div>
      )}
      
      {response && (
        <div style={{ 
          padding: '15px', 
          background: '#2a2a3c', 
          borderRadius: '4px',
          borderLeft: '4px solid #6c63ff'
        }}>
          <h3 style={{
            color: '#e6e6e6',
            marginTop: 0
          }}>Response:</h3>
          <p style={{ 
            whiteSpace: 'pre-wrap',
            color: '#c8c8d7'
          }}>{response}</p>
        </div>
      )}
    </div>
  );
};

export default GroqTester; 