import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuizService from '../services/QuizService';
import '../styles/QuizGenerator.css';

const QuizGenerator = () => {
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Sample topics for inspiration
  const sampleTopics = [
    'Harry Potter', 
    'Marvel Superheroes', 
    'World History',
    'Science Fiction Movies', 
    'Geography', 
    'Computer Programming',
    'Famous Scientists', 
    'Classic Literature',
    'Space Exploration'
  ];

  const handleTopicChange = (e) => {
    setTopic(e.target.value);
  };

  const handleNumQuestionsChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 3 && value <= 15) {
      setNumQuestions(value);
    }
  };

  const selectSampleTopic = (sampleTopic) => {
    setTopic(sampleTopic);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const data = await QuizService.generateQuiz(topic, numQuestions);
      navigate(`/quiz/${data.quiz_id}`);
    } catch (err) {
      console.error('Error generating quiz:', err);
      setError('Failed to generate quiz. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="quiz-generator-container">
      <h1>Create a Custom Quiz</h1>
      <p className="subtitle">
        Generate quiz questions on any topic using AI-powered question generation
      </p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="quiz-form">
        <div className="form-group">
          <label htmlFor="topic">Quiz Topic:</label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={handleTopicChange}
            placeholder="Enter a topic (e.g., Harry Potter, World History)"
            disabled={isGenerating}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="numQuestions">Number of Questions:</label>
          <div className="number-input">
            <button 
              type="button" 
              onClick={() => numQuestions > 3 && setNumQuestions(numQuestions - 1)}
              disabled={isGenerating || numQuestions <= 3}
            >-</button>
            <input
              type="number"
              id="numQuestions"
              value={numQuestions}
              onChange={handleNumQuestionsChange}
              min="3"
              max="15"
              disabled={isGenerating}
            />
            <button 
              type="button" 
              onClick={() => numQuestions < 15 && setNumQuestions(numQuestions + 1)}
              disabled={isGenerating || numQuestions >= 15}
            >+</button>
          </div>
        </div>
        
        <button 
          type="submit" 
          className="generate-button"
          disabled={isGenerating || !topic.trim()}
        >
          {isGenerating ? (
            <>
              <span className="generating-spinner"></span>
              Generating Quiz...
            </>
          ) : 'Generate Quiz'}
        </button>
      </form>
      
      <div className="sample-topics">
        <h3>Need inspiration? Try these topics:</h3>
        <div className="topic-chips">
          {sampleTopics.map((sampleTopic, index) => (
            <button
              key={index}
              className="topic-chip"
              onClick={() => selectSampleTopic(sampleTopic)}
              disabled={isGenerating}
            >
              {sampleTopic}
            </button>
          ))}
        </div>
      </div>
      
      <div className="info-section">
        <h3>How It Works</h3>
        <p>
          Our AI-powered quiz generator creates custom quizzes on virtually any topic.
          Just enter a subject, choose the number of questions, and we'll create a
          challenging quiz with multiple-choice questions.
        </p>
        <p>
          <strong>Note:</strong> Quiz generation typically takes 15-30 seconds depending on the topic.
        </p>
      </div>
    </div>
  );
};

export default QuizGenerator; 