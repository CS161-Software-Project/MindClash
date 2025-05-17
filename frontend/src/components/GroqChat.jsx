import React, { useState } from 'react';
import axios from 'axios';
import '../styles/GroqChat.css';

const GroqChat = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await axios.post('https://mindclash-mm6g.onrender.com/api/groq-chat/', { prompt });
      setResponse(result.data.response);
    } catch (err) {
      console.error('Error with GROQ API:', err);
      setError(err.response?.data?.error || 'Failed to get response from GROQ API');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="groq-chat-container">
      <h2>GROQ AI Chat</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="prompt">Your prompt:</label>
          <textarea 
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            rows={5}
            className="prompt-input"
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-button" 
          disabled={loading || !prompt.trim()}
        >
          {loading ? 'Generating...' : 'Generate Response'}
        </button>
      </form>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {response && (
        <div className="response-container">
          <h3>Response:</h3>
          <div className="response-content">
            {response.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroqChat; 