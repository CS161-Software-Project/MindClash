import React, { useState } from 'react';
import axios from 'axios';

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
      const result = await axios.post('http://localhost:8000/api/groq-chat/', { prompt });
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
      
      <style jsx>{`
        .groq-chat-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: bold;
        }
        
        .prompt-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 16px;
          font-family: inherit;
        }
        
        .submit-button {
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 12px 20px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .submit-button:hover:not(:disabled) {
          background-color: #0069d9;
        }
        
        .submit-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .error-message {
          margin-top: 20px;
          padding: 12px;
          background-color: #f8d7da;
          color: #721c24;
          border-radius: 4px;
        }
        
        .response-container {
          margin-top: 30px;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 4px;
          border-left: 4px solid #007bff;
        }
        
        .response-content {
          white-space: pre-wrap;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default GroqChat; 