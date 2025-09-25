import React, { useState, useEffect, useRef } from 'react';
import { 
  ChatBubbleLeftIcon, 
  MicrophoneIcon, 
  PaperAirplaneIcon, 
  SparklesIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { intelligenceService } from '../../services/intelligenceService';

const ConversationalAssistant = ({ 
  position = 'bottom-right',
  initiallyMinimized = false,
  context = {},
  onActionExecuted = () => {},
  enableVoice = false 
}) => {
  const [isOpen, setIsOpen] = useState(!initiallyMinimized);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestedQueries, setSuggestedQueries] = useState([]);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize suggested queries
    setSuggestedQueries([
      "What's my production efficiency today?",
      "Show me quality trends for this week",
      "Predict next month's demand",
      "What are the current bottlenecks?",
      "Generate a performance report"
    ]);

    // Initialize voice recognition if enabled
    if (enableVoice && 'webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    // Welcome message
    addMessage({
      role: 'assistant',
      content: "Hi! I'm your AI manufacturing assistant. I can help you analyze data, predict trends, and optimize operations. What would you like to know?",
      timestamp: new Date().toISOString()
    });

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [enableVoice]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (message) => {
    setConversation(prev => [...prev, message]);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const userMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    addMessage(userMessage);
    setInputValue('');
    setIsProcessing(true);

    try {
      // Process the query with AI
      const response = await intelligenceService.processNaturalQuery(
        inputValue,
        {
          ...context,
          sessionId,
          history: conversation
        }
      );

      // Add AI response
      const assistantMessage = {
        role: 'assistant',
        content: response.answer || response.text,
        data: response.data,
        visualizations: response.visualizations,
        timestamp: new Date().toISOString()
      };

      addMessage(assistantMessage);

      // Update suggested queries based on context
      if (response.followUp && response.followUp.length > 0) {
        setSuggestedQueries(response.followUp);
      }

      // Execute any actions if specified
      if (response.actions) {
        response.actions.forEach(action => {
          onActionExecuted(action);
        });
      }
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: "I encountered an error processing your request. Please try rephrasing or try again later.",
        error: true,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestedQuery = (query) => {
    setInputValue(query);
    handleSubmit();
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed ${getPositionClasses()} z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110`}
      >
        <ChatBubbleLeftIcon className="h-6 w-6" />
        <span className="absolute top-0 right-0 h-3 w-3 bg-green-400 rounded-full animate-pulse"></span>
      </button>
    );
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50 transition-all duration-300 ${isMinimized ? 'w-80' : 'w-96'}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="h-5 w-5" />
              <h3 className="font-semibold">AI Assistant</h3>
              {isProcessing && (
                <div className="animate-pulse text-xs">Thinking...</div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-white/20 p-1 rounded"
              >
                {isMinimized ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-1 rounded"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {conversation.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.error
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Data visualization preview */}
                    {message.visualizations && message.visualizations.length > 0 && (
                      <div className="mt-2 flex space-x-2">
                        {message.visualizations.map((viz, vIndex) => (
                          <span
                            key={vIndex}
                            className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded"
                          >
                            {viz}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Queries */}
            {suggestedQueries.length > 0 && (
              <div className="px-4 py-2 border-t dark:border-gray-700">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {suggestedQueries.slice(0, 3).map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuery(query)}
                      disabled={isProcessing}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 whitespace-nowrap flex-shrink-0"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything..."
                  disabled={isProcessing}
                  className="flex-1 px-3 py-2 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {enableVoice && recognitionRef.current && (
                  <button
                    type="button"
                    onClick={toggleVoice}
                    className={`p-2 rounded-lg transition-colors ${
                      isListening 
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <MicrophoneIcon className="h-5 w-5" />
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isProcessing}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ConversationalAssistant;
