import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

const ORCHESTRATOR_URL = import.meta.env.VITE_ORCHESTRATOR_URL || 'http://localhost:8102';

const AgentChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [capabilities, setCapabilities] = useState(['analyze']);
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const queryMutation = useMutation({
    mutationFn: async ({ query, capabilities }) => {
      const response = await axios.post(`${ORCHESTRATOR_URL}/query`, {
        query,
        capabilities,
        context: {
          timeRange: { start: '2024-01-01', end: '2024-12-31' },
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        type: 'agent',
        content: data.results,
        data: data.data,
        timestamp: data.timestamp,
      }]);
    },
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }]);
    
    // Send to AI orchestrator
    queryMutation.mutate({ query: input, capabilities });
    
    setInput('');
  };
  
  const renderMessage = (message) => {
    if (message.type === 'user') {
      return (
        <div className="flex justify-end mb-4">
          <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-2xl">
            {message.content}
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex justify-start mb-4">
        <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-2xl">
          {message.content.analysis && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">Analysis</h4>
              <p className="text-gray-600 whitespace-pre-wrap">{message.content.analysis}</p>
            </div>
          )}
          {message.content.forecast && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">Forecast</h4>
              <p className="text-gray-600 whitespace-pre-wrap">{message.content.forecast}</p>
            </div>
          )}
          {message.content.recommendations && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">Recommendations</h4>
              <p className="text-gray-600 whitespace-pre-wrap">{message.content.recommendations}</p>
            </div>
          )}
          {message.data && message.data.length > 0 && (
            <div className="mt-4">
              <details>
                <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                  View data ({message.data.length} records)
                </summary>
                <div className="mt-2 max-h-60 overflow-auto">
                  <pre className="text-xs bg-gray-50 p-2 rounded">
                    {JSON.stringify(message.data.slice(0, 5), null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-800">AI Financial Advisor</h1>
        <p className="text-gray-600 mt-1">
          Ask questions about liquidity, cash flow, and working capital optimization
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="mb-4">Welcome! I can help you with:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-700">Analysis</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Current liquidity position, trends, and risk indicators
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-700">Forecasting</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Cash flow predictions and scenario modeling
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-purple-700">Strategy</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Working capital optimization recommendations
                </p>
              </div>
            </div>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div key={index}>{renderMessage(message)}</div>
        ))}
        
        {queryMutation.isPending && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse w-2 h-2 bg-gray-400 rounded-full"></div>
                <div className="animate-pulse w-2 h-2 bg-gray-400 rounded-full delay-100"></div>
                <div className="animate-pulse w-2 h-2 bg-gray-400 rounded-full delay-200"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t px-6 py-4">
        <form onSubmit={handleSubmit}>
          <div className="flex space-x-2">
            <div className="flex space-x-2 mr-4">
              {['analyze', 'forecast', 'recommend'].map((cap) => (
                <label key={cap} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={capabilities.includes(cap)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCapabilities([...capabilities, cap]);
                      } else {
                        setCapabilities(capabilities.filter(c => c !== cap));
                      }
                    }}
                    className="mr-1"
                  />
                  <span className="text-sm text-gray-600 capitalize">{cap}</span>
                </label>
              ))}
            </div>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about liquidity, cash flow, or working capital..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <button
              type="submit"
              disabled={queryMutation.isPending}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgentChat;