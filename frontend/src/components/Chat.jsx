import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import PropTypes from 'prop-types';

const Chat = ({ pin, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const lastMessageCount = useRef(0);

  const commonEmojis = ['😊', '😂', '❤️', '👍', '🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎪', '🎯', '🎲', '🎮', '🎪', '🎨', '🎭'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/get_messages/${pin}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        
        // Update unread count if chat is closed and there are new messages
        if (!isOpen && response.data.messages.length > lastMessageCount.current) {
          setUnreadCount(prev => prev + (response.data.messages.length - lastMessageCount.current));
        }
        
        setMessages(response.data.messages);
        lastMessageCount.current = response.data.messages.length;
        setError(null);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages');
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [pin, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/send_message/`,
        { pin, message: newMessage },
        { headers: { Authorization: `Token ${token}` } }
      );
      setNewMessage('');
      setError(null);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const handleOpenChat = () => {
    setIsOpen(true);
    setUnreadCount(0); // Clear unread count when opening chat
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <div className="relative">
          <button
            onClick={handleOpenChat}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg relative"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-xl w-80 h-96 flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Game Chat</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {error && (
            <div className="p-2 bg-red-100 text-red-600 text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === currentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-2 ${
                    msg.sender === currentUser
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {msg.sender}
                  </div>
                  <div>{msg.message}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  😊
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-12 right-0 bg-white border rounded-lg shadow-lg p-2 grid grid-cols-4 gap-1">
                    {commonEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => addEmoji(emoji)}
                        className="hover:bg-gray-100 p-1 rounded"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

Chat.propTypes = {
  pin: PropTypes.string.isRequired,
  currentUser: PropTypes.number.isRequired
};

export default Chat; 