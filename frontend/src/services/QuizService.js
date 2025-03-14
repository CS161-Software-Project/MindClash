/**
 * Service for handling quiz-related API calls
 */
class QuizService {
  /**
   * Fetch a quiz by ID
   * @param {number} quizId - The quiz ID
   * @returns {Promise<Object>} - The quiz data
   */
  static async getQuiz(quizId) {
    try {
      const response = await fetch(`/api/quiz/${quizId}/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quiz: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching quiz:', error);
      throw error;
    }
  }
  
  /**
   * Generate a new quiz
   * @param {string} topic - The quiz topic
   * @param {number} numQuestions - Number of questions to generate
   * @returns {Promise<Object>} - The generated quiz data
   */
  static async generateQuiz(topic, numQuestions) {
    try {
      const response = await fetch(`/api/quiz/generate/?topic=${encodeURIComponent(topic)}&num_questions=${numQuestions}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate quiz: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw error;
    }
  }
  
  /**
   * Submit answers for a quiz
   * @param {number} quizId - The quiz ID
   * @param {Object} answers - The user's answers (question ID -> answer index)
   * @returns {Promise<Object>} - The quiz results
   */
  static async submitAnswers(quizId, answers) {
    try {
      const response = await fetch(`/api/quiz/${quizId}/check/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ answers })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to submit answers: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error submitting answers:', error);
      throw error;
    }
  }
}

export default QuizService;
