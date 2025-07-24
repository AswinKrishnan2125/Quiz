// src/components/ChatWithAI.jsx
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Font Awesome imports ---
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
// --- End Font Awesome imports ---

const ChatWithAI = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim()) {
      return;
    }

    const newMessage = { role: 'user', content: inputMessage };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputMessage('');

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        import.meta.env.VITE_API_BASE_URL + '/chat',
        {
          messages: [...messages, newMessage],
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const aiResponseContent = response.data.reply;
      setMessages((prevMessages) => [...prevMessages, { role: 'assistant', content: aiResponseContent }]);

    } catch (err) {
      console.error('Error chatting with AI:', err.response?.data?.msg || err.message);
      setError(err.response?.data?.msg || 'Failed to get a response from AI. Please try again.');
      setMessages((prevMessages) => prevMessages.slice(0, prevMessages.length - 1));
    } finally {
      setLoading(false);
    }
  };

  return (
    // --- KEY CHANGES HERE: h-screen and removed mt- classes ---
    <div className="max-w-xl lg:max-w-3xl mx-auto p-4 sm:p-6 bg-white shadow-lg rounded-lg flex flex-col h-screen sm:h-[70vh] min-h-[400px]">
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-3 sm:mb-4 text-gray-800">Chat with AI</h2>

      <div className="flex-1 overflow-y-auto p-3 border border-gray-200 rounded-md bg-gray-50 mb-4 custom-scrollbar">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 mt-10 text-sm sm:text-base">Ask me anything about your quiz topics!</p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-3 p-2 rounded-lg text-sm sm:text-base ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white self-end ml-auto'
                  : 'bg-gray-200 text-gray-800 self-start mr-auto'
              } w-fit max-w-[90%] sm:max-w-[80%]`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
            </div>
          ))
        )}
        {loading && (
          <div className="mb-3 p-2 rounded-lg bg-gray-200 text-gray-800 self-start mr-auto max-w-[90%] sm:max-w-[80%] animate-pulse text-sm sm:text-base">
            AI is typing...
          </div>
        )}
        {error && (
            <div className="text-red-600 text-xs sm:text-sm mt-2 text-center">
                {error}
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
          disabled={loading}
        />
        <button
          type="submit"
          className={`px-4 py-2 rounded-lg font-semibold transition duration-200 text-sm sm:text-base ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
          } w-auto flex items-center justify-center`}
          disabled={loading}
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              <FontAwesomeIcon icon={faPaperPlane} className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Send</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatWithAI;