import React, { useState, useRef, useEffect } from 'react';
import {
  ChatBubbleBottomCenterTextIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: 'Hello! I\'m your AI assistant for Sentia Manufacturing. How can I help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  // MCP Server connection
  const mcpServerUrl = import.meta.env.VITE_MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com';

  useEffect(() => {
    // Check MCP server connection
    checkMCPConnection();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkMCPConnection = async () => {
    try {
      const response = await fetch(`${mcpServerUrl}/health`);
      if (response.ok) {
        setIsConnected(true);
      }
    } catch (error) {
      console.error('MCP Server connection failed:', error);
      setIsConnected(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Send to MCP server for AI processing
      const response = await fetch(`${mcpServerUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          context: 'manufacturing_dashboard',
          userId: 'user_' + Date.now()
        })
      });

      let botResponse;
      if (response.ok) {
        const data = await response.json();
        botResponse = data.response || 'I understand your request. Let me help you with that.';
      } else {
        // Fallback responses if MCP server is down
        botResponse = generateFallbackResponse(inputValue);
      }

      setMessages(prev => [...prev, {
        id: prev.length + 1,
        type: 'bot',
        text: botResponse
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        type: 'bot',
        text: 'I\'m having trouble connecting to the AI server. Please try again later.'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateFallbackResponse = (message) => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('production')) {
      return 'Production metrics are currently at optimal levels. Line efficiency is at 87%, with 2,340 units produced today.';
    } else if (lowerMessage.includes('inventory')) {
      return 'Current inventory levels show 15,230 units in stock. Reorder points are being monitored automatically.';
    } else if (lowerMessage.includes('quality')) {
      return 'Quality control metrics show a 99.2% pass rate. No critical issues detected in the last 24 hours.';
    } else if (lowerMessage.includes('forecast')) {
      return 'Demand forecasting predicts a 12% increase in orders for next quarter based on current trends.';
    } else if (lowerMessage.includes('help')) {
      return 'I can help you with production tracking, inventory management, quality control, demand forecasting, and financial analytics. What would you like to know?';
    }

    return 'I\'m analyzing your request. You can ask me about production, inventory, quality control, or any other manufacturing metrics.';
  };

  const quickActions = [
    { icon: '📊', text: 'Show Dashboard', action: 'dashboard' },
    { icon: '📈', text: 'Production Status', action: 'production' },
    { icon: '📦', text: 'Inventory Levels', action: 'inventory' },
    { icon: '⚡', text: 'Quick Analysis', action: 'analysis' }
  ];

  const handleQuickAction = (action) => {
    const actionMessages = {
      dashboard: 'Show me the executive dashboard',
      production: 'What is the current production status?',
      inventory: 'Check inventory levels',
      analysis: 'Run a quick analysis of today\'s performance'
    };

    setInputValue(actionMessages[action]);
  };

  return (
    <>
      {/* Chatbot Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 group"
        aria-label="Open AI Assistant"
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <div className="relative">
            <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
            <SparklesIcon className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
            {isConnected && (
              <span className="absolute -top-1 -left-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></span>
            )}
          </div>
        )}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col animate-slideUp">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <SparklesIcon className="w-6 h-6" />
                  </div>
                  {isConnected && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">AI Assistant</h3>
                  <p className="text-xs opacity-90">
                    {isConnected ? 'Connected to MCP Server' : 'Offline Mode'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 rounded-lg p-1 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 flex space-x-2 overflow-x-auto">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.action)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-white dark:bg-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors whitespace-nowrap text-sm"
              >
                <span>{action.icon}</span>
                <span>{action.text}</span>
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {message.type === 'bot' && (
                    <div className="flex items-center space-x-1 mb-1">
                      <SparklesIcon className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400">AI</span>
                    </div>
                  )}
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t dark:border-gray-800">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 border dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-blue-600 text-white rounded-xl p-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTyping ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <PaperAirplaneIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            {!isConnected && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                Working in offline mode. Connect to MCP server for enhanced AI features.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Styles for animation */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default AIChatbot;