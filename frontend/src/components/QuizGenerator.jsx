import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/QuizGenerator.css';

const QuizGenerator = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    topic: '',
    count: 5,
    difficulty: 'medium'
  });
  
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizActive, setQuizActive] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);

  // Handle timing
  useEffect(() => {
    let timer;
    if (quizActive && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && quizActive) {
      handleQuizEnd();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, quizActive]);

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
    setQuiz(null);
    setSelectedAnswers({});
    setQuizCompleted(false);
    
    try {
      const { topic, count, difficulty } = formData;
      
      // Use the dedicated backend endpoint for quiz generation
      const result = await axios.post('https://mindclash-mm6g.onrender.com/api/generate-quiz/', { 
        topic,
        count,
        difficulty
      });
      
      if (result.data.success) {
        const quizData = result.data.quiz;
        setQuiz(quizData);
        setCurrentQuestion(0);
        
        // Set up timer based on recommended time or default
        const timeInSeconds = (quizData.recommendedTimeInMinutes || 
          Math.max(1, Math.ceil(count / 2))) * 60;
        setTimeLeft(timeInSeconds);
        setQuizActive(true);
      } else {
        throw new Error(result.data.error || 'Failed to generate quiz');
      }
      
    } catch (err) {
      console.error('Error generating quiz:', err);
      setError(err.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: optionIndex
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const getOptionLetter = (index) => {
    return String.fromCharCode(65 + index); // A, B, C, D...
  };

  const handleQuizEnd = () => {
    setQuizActive(false);
    setQuizCompleted(true);
    
    // Calculate score
    let correctCount = 0;
    quiz.questions.forEach((question, index) => {
      const selectedOption = selectedAnswers[index];
      if (selectedOption !== undefined) {
        const correctLetter = question.correctAnswer.replace(/[^A-D]/g, '');
        const correctIndex = correctLetter.charCodeAt(0) - 65;
        if (selectedOption === correctIndex) {
          correctCount++;
        }
      }
    });
    
    setScore(correctCount);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const restartQuiz = () => {
    setQuizActive(true);
    setQuizCompleted(false);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    const timeInSeconds = (quiz.recommendedTimeInMinutes || 
      Math.max(1, Math.ceil(formData.count / 2))) * 60;
    setTimeLeft(timeInSeconds);
  };

  const newQuiz = () => {
    setQuiz(null);
    setQuizActive(false);
    setQuizCompleted(false);
  };

  return (
    <div className="quiz-generator-container">
      <h2>AI Quiz Generator</h2>
      
      {!quiz && (
        <form onSubmit={handleSubmit} className="quiz-form">
          <div className="form-group">
            <label htmlFor="topic">Quiz Topic:</label>
            <input
              type="text"
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleInputChange}
              placeholder="e.g., JavaScript, World History, Science"
              required
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="count">Number of Questions:</label>
            <input
              type="number"
              id="count"
              name="count"
              min="1"
              max="10"
              value={formData.count}
              onChange={handleInputChange}
              className="form-control"
            />
      </div>

          <div className="form-group">
            <label htmlFor="difficulty">Difficulty Level:</label>
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
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="generate-btn"
              disabled={loading || !formData.topic.trim()}
            >
              {loading ? 'Generating Quiz...' : 'Generate Quiz'}
            </button>
            
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError('')} className="dismiss-btn">Dismiss</button>
        </div>
      )}
      
      {quiz && !quizCompleted && (
        <div className="quiz-container">
          <div className="quiz-header">
            <h3>{quiz.title}</h3>
            <div className="timer">Time left: {formatTime(timeLeft)}</div>
      </div>

          <div className="question-navigation">
            <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
          </div>
          
          <div className="question-container">
            <p className="question-text">{quiz.questions[currentQuestion].question}</p>
            
            <div className="options-container">
              {quiz.questions[currentQuestion].options.map((option, optIndex) => (
                <div 
                  key={optIndex}
                  className={`option ${selectedAnswers[currentQuestion] === optIndex ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(currentQuestion, optIndex)}
                >
                  <span className="option-letter">{getOptionLetter(optIndex)}</span>
                  <span className="option-text">{option}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="navigation-buttons">
            <button 
              onClick={handlePrevQuestion} 
              disabled={currentQuestion === 0}
              className="nav-btn"
            >
              Previous
            </button>
            
            {currentQuestion < quiz.questions.length - 1 ? (
              <button 
                onClick={handleNextQuestion}
                className="nav-btn"
              >
                Next
              </button>
            ) : (
              <button 
                onClick={handleQuizEnd}
                className="finish-btn"
              >
                Finish Quiz
              </button>
            )}
          </div>
            </div>
          )}

      {quizCompleted && (
        <div className="results-container">
          <h3>Quiz Results</h3>
          <p className="score-display">
            Your Score: {score} / {quiz.questions.length} 
            ({Math.round((score / quiz.questions.length) * 100)}%)
          </p>
          
          <div className="results-details">
            <h4>Review Answers:</h4>
            {quiz.questions.map((question, qIndex) => {
              const selectedOption = selectedAnswers[qIndex];
              const correctLetter = question.correctAnswer.replace(/[^A-D]/g, '');
              const correctIndex = correctLetter.charCodeAt(0) - 65;
              const isCorrect = selectedOption === correctIndex;
              
              return (
                <div key={qIndex} className={`result-item ${isCorrect ? 'correct-item' : 'incorrect-item'}`}>
                  <p className="result-question">
                    {qIndex + 1}. {question.question}
                    {isCorrect ? ' ✅' : ' ❌'}
                  </p>
                  
                  <div className="result-options">
                    {question.options.map((option, optIndex) => (
                      <div 
                        key={optIndex}
                        className={`result-option ${optIndex === correctIndex ? 'correct' : ''} 
                          ${optIndex === selectedOption && optIndex !== correctIndex ? 'incorrect' : ''}
                          ${optIndex === selectedOption ? 'selected' : ''}`}
                      >
                        <span className="option-letter">{getOptionLetter(optIndex)}</span>
                        <span className="option-text">{option}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="explanation">
                    <p>{question.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="result-actions">
            <button onClick={restartQuiz} className="restart-btn">
              Restart Quiz
            </button>
            <button onClick={newQuiz} className="new-quiz-btn">
              Create New Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizGenerator; 