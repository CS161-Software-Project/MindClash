import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QuizService from '../services/QuizService';
import '../styles/Quiz.css';

const Quiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [timerActive, setTimerActive] = useState(true);

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const data = await QuizService.getQuiz(quizId);
        setQuiz(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError('Failed to load quiz. Please try again later.');
        setLoading(false);
      }
    };

    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  // Set up timer
  useEffect(() => {
    if (!timerActive || !quiz) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setTimerActive(false);
          handleSubmit(); // Auto-submit when time runs out
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, quiz]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId, optionIndex) => {
    if (results) return; // Can't change answers after submission
    
    setAnswers({
      ...answers,
      [questionId]: optionIndex + 1, // Store 1-indexed option (to match backend)
    });
  };

  // Submit answers
  const handleSubmit = async () => {
    if (isSubmitting || results) return;

    setIsSubmitting(true);
    setTimerActive(false);
    
    try {
      const data = await QuizService.submitAnswers(quizId, answers);
      setResults(data);
    } catch (err) {
      console.error('Error submitting answers:', err);
      setError('Failed to submit answers. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle starting a new quiz
  const handleNewQuiz = () => {
    navigate('/');  // Navigate back to the home/quiz generator page
  };

  if (loading) {
    return (
      <div className="quiz-container loading">
        <div className="loading-spinner"></div>
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-container error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={handleNewQuiz}>Try a Different Quiz</button>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="quiz-container error">
        <h2>Quiz Not Found</h2>
        <p>Sorry, we couldn't find the quiz you're looking for.</p>
        <button onClick={handleNewQuiz}>Browse Quizzes</button>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h1>{quiz.title}</h1>
        <p className="quiz-description">{quiz.description}</p>
        <div className="quiz-timer">
          Time Remaining: <span className={timeLeft < 60 ? 'timer-warning' : ''}>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="questions-container">
        {quiz.questions.map((question, qIndex) => (
          <div 
            key={question.id} 
            className={`question-card ${results ? (
              results.results.find(r => r.question_id === question.id)?.is_correct 
                ? 'correct-answer' 
                : 'incorrect-answer'
            ) : ''}`}
          >
            <h3>Question {qIndex + 1}</h3>
            <p className="question-text">{question.text}</p>
            
            <div className="options-container">
              {question.options.map((option, oIndex) => {
                const isSelected = answers[question.id] === (oIndex + 1);
                const resultData = results?.results.find(r => r.question_id === question.id);
                const isCorrect = resultData?.correct_option === (oIndex + 1);
                
                return (
                  <div 
                    key={oIndex}
                    className={`option ${isSelected ? 'selected' : ''} ${
                      results ? (
                        isCorrect ? 'correct' : (isSelected ? 'incorrect' : '')
                      ) : ''
                    }`}
                    onClick={() => handleAnswerSelect(question.id, oIndex)}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + oIndex)}</span>
                    <span className="option-text">{option}</span>
                    {results && isCorrect && <span className="check-icon">✓</span>}
                    {results && isSelected && !isCorrect && <span className="x-icon">✗</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="quiz-actions">
        {!results ? (
          <button 
            className="submit-button" 
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(answers).length < quiz.questions.length}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answers'}
          </button>
        ) : (
          <div className="results-summary">
            <h2>Quiz Results</h2>
            <p className="score">Your Score: <span>{results.score}%</span></p>
            <p>You got {results.correct_count} out of {results.total_questions} questions correct</p>
            <button onClick={handleNewQuiz}>Try Another Quiz</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz; 