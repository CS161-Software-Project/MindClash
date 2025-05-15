import React, { useState, useEffect } from 'react';
import { api } from '../services/AuthService';
import '../styles/QuizGenerator.css';

const QuizGeneratorStandalone = ({ onQuizGenerated }) => {
  const [formData, setFormData] = useState({
    topic: '',
    count: 5,
    difficulty: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'count' ? parseInt(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { topic, count, difficulty } = formData;
      
      console.log('Sending quiz generation request with data:', { topic, count, difficulty });
      
      const result = await api.post('/api/generate-quiz/', {
        topic,
        count,
        difficulty
      });

      console.log('Quiz generation response:', result);

      if (result.data && result.data.success) {
        const quizData = result.data.quiz;
        if (onQuizGenerated) {
          onQuizGenerated(quizData);
        }
      } else {
        throw new Error(result.data?.error || 'Failed to generate quiz');
      }

    } catch (err) {
      console.error('Quiz generation error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('You need to be logged in to generate quizzes');
    } else {
      setError('');
    }
  }, []);

  return (
    <div className="quiz-generator-container">
      <h2>Generate AI Quiz</h2>

      <form onSubmit={handleSubmit} className="quiz-form">
        <div className="form-group">
          <label htmlFor="topic">Topic:</label>
          <input
            type="text"
            id="topic"
            name="topic"
            value={formData.topic}
            onChange={handleInputChange}
            required
            className="form-control"
            placeholder="e.g., Python, Geography"
          />
        </div>

        <div className="form-group">
          <label htmlFor="count">Number of Questions:</label>
          <input
            type="number"
            id="count"
            name="count"
            value={formData.count}
            onChange={handleInputChange}
            min="1"
            max="10"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="difficulty">Difficulty:</label>
          <select
            id="difficulty"
            name="difficulty"
            value={formData.difficulty}
            onChange={handleInputChange}
            className="form-control"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="generate-btn"
          disabled={loading || !formData.topic.trim()}
        >
          {loading ? 'Generating...' : 'Generate Quiz'}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default QuizGeneratorStandalone;