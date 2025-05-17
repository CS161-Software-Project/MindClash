
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

const Chat = ({ pin, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const lastMessageCount = useRef(0);

  const API_URL = 'https://mindclash-mm6g.onrender.com/api';

  const commonEmojis = [
    '😊', '😂', '❤️', '👍', '🎮', '🎯', '🎲', '🎪', '🎨', '🎭',
    '🔥', '👏', '🎉', '🤔', '😎', '🤯', '👀', '💯', '🙌', '🤝'
  ];

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 100;

    if (isNearBottom) {
      scrollToBottom('auto');
    }
  }, [scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`${API_URL}/chat/${pin}/`, {
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
      const token = localStorage.getItem('authToken');
      await axios.post(
        `${API_URL}/chat/send/`,
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
      <AnimatePresence>
        {!isOpen ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <button
              onClick={handleOpenChat}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full p-4 shadow-xl relative transition-all duration-300 transform hover:rotate-12"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center border-2 border-white"
                >
                  {unreadCount}
                </motion.span>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl w-80 h-[500px] flex flex-col overflow-hidden border border-gray-100"
          >
            <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Game Chat
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-1 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2 bg-red-100 text-red-600 text-sm text-center border-b border-red-200"
              >
                {error}
              </motion.div>
            )}

            <div
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
            >
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No messages yet. Say hi! 👋
                </div>
              ) : (
                messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${msg.sender === currentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 ${
                        msg.sender === currentUser
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-none'
                          : 'bg-white shadow-sm text-gray-800 rounded-bl-none border border-gray-100'
                      }`}
                    >
                      <div className={`text-xs mb-1 ${msg.sender === currentUser ? 'text-blue-100' : 'text-gray-500'}`}>
                        {msg.sender}
                      </div>
                      <div className="break-words">{msg.message}</div>
                      <div className={`text-2xs mt-1 text-right ${msg.sender === currentUser ? 'text-blue-200' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t">
              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      setIsTyping(true);
                      if (typingTimeout) clearTimeout(typingTimeout);
                      setTypingTimeout(setTimeout(() => setIsTyping(false), 2000));
                    }}
                    onFocus={() => scrollToBottom('auto')}
                    placeholder="Type a message..."
                    className="w-full border border-gray-200 rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className={`p-1 rounded-full transition-all ${newMessage.trim() ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-300'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      className="absolute bottom-14 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-2 w-48 grid grid-cols-6 gap-1 z-10"
                    >
                      {commonEmojis.map((emoji, index) => (
                        <motion.button
                          key={index}
                          type="button"
                          onClick={() => {
                            addEmoji(emoji);
                            setShowEmojiPicker(false);
                          }}
                          whileHover={{ scale: 1.2, rotate: Math.random() * 20 - 10 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-xl p-1 rounded hover:bg-gray-100 transition-colors"
                        >
                          {emoji}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {isTyping && (
                <div className="text-xs text-gray-400 mt-1 ml-2 flex items-center">
                  <div className="typing-indicator flex space-x-1 items-center">
                    <span>•</span>
                    <span>•</span>
                    <span>•</span>
                  </div>
                </div>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

Chat.propTypes = {
  pin: PropTypes.string.isRequired,
  currentUser: PropTypes.number.isRequired
};

export default Chat; 
  