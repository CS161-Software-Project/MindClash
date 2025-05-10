import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const QuizGamePage = () => {
  const { code } = useParams();
  const navigate = useNavigate();

  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timer, setTimer] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState([]);

  const token = localStorage.getItem('authToken');

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/game/${code}/info/`, {
          headers: { Authorization: `Token ${token}` }
        });
        setGameData(response.data);
        setMessages(response.data.messages);
        setTimer(response.data.timer);

        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch game data');
        setLoading(false);
      }
    };

    fetchGameData();
    const interval = setInterval(fetchGameData, 1000);
    return () => clearInterval(interval);
  }, [code, token]);

  const handleAnswerSubmit = async (answer) => {
    if (selectedAnswer !== null || timer <= 0) return;

    setSelectedAnswer(answer);
    try {
      await axios.post(
        `http://localhost:8000/api/game/${code}/answer/`,
        {
          question_index: gameData.question_index,
          answer: answer,
          time_taken: 30 - timer
        },
        { headers: { Authorization: `Token ${token}` } }
      );

      // ✅ Redirect to waiting screen after answering
      navigate(`/waiting/${code}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit answer');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    try {
      await axios.post(
        `http://localhost:8000/api/game/${code}/chat/`,
        { content: chatMessage },
        { headers: { Authorization: `Token ${token}` } }
      );
      setChatMessage('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-white">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!gameData) return <div>Game not found</div>;

  const currentQuestion = gameData.current_question;

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Main Game Area */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Question Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                Question {gameData.question_index + 1} of {gameData.total_questions}
              </h2>
              <div className="text-3xl font-bold text-yellow-400">{timer}s</div>
            </div>
            <h1 className="text-4xl font-bold mt-4">{currentQuestion.question}</h1>
          </div>

          {/* Answer Grid */}
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSubmit(option)}
                disabled={selectedAnswer !== null || timer <= 0}
                className="p-6 text-2xl font-bold rounded-lg transition-all bg-gray-800 hover:bg-gray-700"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="w-80 bg-gray-800 p-4 flex flex-col">
        <h3 className="text-xl font-bold mb-4">Chat</h3>
        <div className="flex-1 overflow-y-auto mb-4">
          {messages
            .filter((msg) => msg.message_type === 'CHAT') // ✅ Only show real chat messages
            .map((msg, index) => (
              <div key={index} className="mb-2">
                <span className="font-bold">{msg.username}: </span>
                <span>{msg.content}</span>
              </div>
            ))}
        </div>
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 rounded px-3 py-2"
          />
          <button
            type="submit"
            className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuizGamePage;
