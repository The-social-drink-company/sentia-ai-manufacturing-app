import React, { useState, useEffect, useRef } from 'react';
import { 
  ChatBubbleLeftIcon, 
  MicrophoneIcon, 
  PaperAirplaneIcon, 
  SparklesIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BookOpenIcon,
  LightBulbIcon,
  AcademicCapIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

const SentiaAIChatbot = ({ 
  position = 'bottom-right',
  initiallyMinimized = false,
  enableVoice = false 
}) => {
  const [isOpen, setIsOpen] = useState(!initiallyMinimized);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestedQueries, setSuggestedQueries] = useState([]);
  const [sessionId] = useState(() => `sentia_session_${Date.now()}`);
  const [knowledgeBase, setKnowledgeBase] = useState({});
  const [userInteractions, setUserInteractions] = useState([]);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // MCP Server configuration
  const MCP_SERVER_URL = process.env.NODE_ENV === 'production' 
    ? 'https://sentia-mcp-server-production.up.railway.app'
    : process.env.NODE_ENV === 'development'
    ? 'https://splendid-warmth-development.up.railway.app' 
    : 'http://localhost:9001';

  useEffect(() => {
    // Initialize Sentia-specific suggested queries
    setSuggestedQueries([
      "How do I set up demand forecasting?",
      "Explain working capital management",
      "What are the key manufacturing KPIs?",
      "How to import data into Sentia?",
      "What's the difference between basic and enhanced dashboards?",
      "Guide me through inventory optimization",
      "How to use what-if analysis?",
      "Explain quality control features"
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

    // Initialize knowledge base
    initializeKnowledgeBase();

    // Welcome message with Sentia branding
    addMessage({
      role: 'assistant',
      content: `👋 Welcome to Sentia's AI Support Assistant!

I'm your dedicated 24/7 help desk, trained specifically on the Sentia Manufacturing Dashboard. I can help you with:

🎯 **Software Training & Onboarding**
📊 **Dashboard Navigation & Features**  
🔧 **Technical Support & Troubleshooting**
💡 **Business Process Optimization**
📈 **Manufacturing Best Practices**

What would you like to learn about today?`,
      timestamp: new Date().toISOString(),
      type: 'welcome'
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

  const initializeKnowledgeBase = () => {
    setKnowledgeBase({
      dashboard: {
        features: ['KPI Strip', 'Demand Forecasting', 'Working Capital', 'Quality Control', 'Production Tracking'],
        navigation: 'Use the sidebar navigation or keyboard shortcuts (G+O for dashboard, G+F for forecasting, etc.)',
        layouts: 'Enterprise enhanced dashboard with drag-and-drop widgets and customizable layouts'
      },
      workingCapital: {
        purpose: 'Financial management and cash flow optimization',
        features: ['AR/AP Management', 'Cash Flow Forecasting', 'Working Capital Ratios', 'Financial Reports'],
        access: 'Available at /working-capital route or via header quick actions'
      },
      whatIfAnalysis: {
        purpose: 'Scenario modeling and strategic planning',
        features: ['Interactive sliders', 'Financial projections', 'Risk assessment', 'Sensitivity analysis'],
        access: 'Navigate to /what-if or use the What-If Analysis button'
      },
      dataImport: {
        formats: ['Excel/CSV files', 'API integrations', 'Shopify', 'Amazon SP-API', 'Xero'],
        templates: 'Import templates available at /templates',
        process: 'Upload data via /data-import dashboard'
      },
      manufacturing: {
        kpis: ['Production Efficiency', 'Quality Metrics', 'Inventory Turnover', 'OEE', 'Defect Rates'],
        processes: ['Demand Planning', 'Capacity Planning', 'Quality Management', 'Inventory Optimization'],
        automation: 'AI-powered forecasting and optimization features'
      }
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (message) => {
    setConversation(prev => [...prev, message]);
    
    // Store user interactions for learning
    if (message.role === 'user') {
      setUserInteractions(prev => [...prev, {
        query: message.content,
        timestamp: message.timestamp,
        sessionId
      }]);
    }
  };

  const callMCPServer = async (query, context = {}) => {
    try {
      const response = await fetch(`${MCP_SERVER_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          context: {
            ...context,
            sessionId,
            knowledgeBase,
            userInteractions: userInteractions.slice(-5), // Last 5 interactions for context
            domain: 'sentia-manufacturing',
            supportMode: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`MCP Server error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('MCP Server connection failed:', error);
      // Fallback to local knowledge base
      return generateLocalResponse(query);
    }
  };

  const generateLocalResponse = (query) => {
    const queryLower = query.toLowerCase();
    
    // Knowledge base pattern matching
    if (queryLower.includes('working capital')) {
      return {
        answer: `Working Capital Management in Sentia:

📊 **Purpose**: ${knowledgeBase.workingCapital?.purpose}

🔧 **Key Features**:
${knowledgeBase.workingCapital?.features?.map(f => `• ${f}`).join('\n')}

🎯 **How to Access**: ${knowledgeBase.workingCapital?.access}

Need specific help with cash flow analysis or financial ratios?`,
        followUp: ["How to optimize cash flow?", "What are good working capital ratios?", "Export financial reports"]
      };
    }
    
    if (queryLower.includes('what-if') || queryLower.includes('scenario')) {
      return {
        answer: `What-If Analysis in Sentia:

🎯 **Purpose**: ${knowledgeBase.whatIfAnalysis?.purpose}

🔧 **Features**:
${knowledgeBase.whatIfAnalysis?.features?.map(f => `• ${f}`).join('\n')}

📍 **Access**: ${knowledgeBase.whatIfAnalysis?.access}

The what-if analysis tool helps you model different business scenarios and understand their potential impact.`,
        followUp: ["Show me scenario examples", "How to create projections?", "Risk assessment features"]
      };
    }
    
    if (queryLower.includes('dashboard') || queryLower.includes('navigation')) {
      return {
        answer: `Sentia Dashboard Navigation:

🎛️ **Layout**: ${knowledgeBase.dashboard?.layouts}

🧭 **Navigation**: ${knowledgeBase.dashboard?.navigation}

📊 **Key Features**:
${knowledgeBase.dashboard?.features?.map(f => `• ${f}`).join('\n')}

Pro tip: Use keyboard shortcuts for faster navigation!`,
        followUp: ["Keyboard shortcut list", "Customize dashboard layout", "Widget explanations"]
      };
    }
    
    if (queryLower.includes('data') && queryLower.includes('import')) {
      return {
        answer: `Data Import in Sentia:

📁 **Supported Formats**: ${knowledgeBase.dataImport?.formats?.join(', ')}

📋 **Templates**: ${knowledgeBase.dataImport?.templates}

⚙️ **Process**: ${knowledgeBase.dataImport?.process}

The system supports both manual file uploads and automated API integrations for seamless data flow.`,
        followUp: ["Download import templates", "API integration setup", "Data validation rules"]
      };
    }
    
    // Generic manufacturing knowledge
    if (queryLower.includes('manufacturing') || queryLower.includes('kpi')) {
      return {
        answer: `Sentia Manufacturing Intelligence:

📈 **Key KPIs**:
${knowledgeBase.manufacturing?.kpis?.map(kpi => `• ${kpi}`).join('\n')}

⚙️ **Core Processes**:
${knowledgeBase.manufacturing?.processes?.map(p => `• ${p}`).join('\n')}

🤖 **AI Features**: ${knowledgeBase.manufacturing?.automation}`,
        followUp: ["OEE calculation method", "Quality control setup", "Demand forecasting accuracy"]
      };
    }
    
    return {
      answer: `I'm here to help you with the Sentia Manufacturing Dashboard! 

I can provide guidance on:
• Dashboard navigation and features
• Working capital management
• What-if analysis and forecasting
• Data import and integration
• Manufacturing KPIs and best practices
• Software troubleshooting

Please ask me about any specific feature or process you'd like to learn about.`,
      followUp: suggestedQueries.slice(0, 3)
    };
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
      // Call MCP Server for AI response
      const response = await callMCPServer(inputValue, {
        history: conversation,
        userRole: 'manufacturing-user',
        supportLevel: 'comprehensive'
      });

      // Add AI response
      const assistantMessage = {
        role: 'assistant',
        content: response.answer || response.message,
        data: response.data,
        visualizations: response.visualizations,
        timestamp: new Date().toISOString(),
        source: response.source || 'mcp-ai'
      };

      addMessage(assistantMessage);

      // Update suggested queries based on response
      if (response.followUp && response.followUp.length > 0) {
        setSuggestedQueries(response.followUp);
      }

      // Learn from interaction
      await learnFromInteraction(inputValue, response);

    } catch (error) {
      addMessage({
        role: 'assistant',
        content: "I encountered an error processing your request. Let me try to help you with my knowledge base instead. Please rephrase your question or try asking about specific Sentia features.",
        error: true,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const learnFromInteraction = async (query, response) => {
    try {
      // Store interaction for learning (could be sent to MCP server for training)
      const interaction = {
        query,
        response: response.answer,
        timestamp: new Date().toISOString(),
        sessionId,
        topic: extractTopicFromQuery(query)
      };

      // For now, store locally (could be enhanced to sync with backend)
      const existingLearning = JSON.parse(localStorage.getItem('sentia-ai-learning') || '[]');
      existingLearning.push(interaction);
      localStorage.setItem('sentia-ai-learning', JSON.stringify(existingLearning.slice(-100))); // Keep last 100

    } catch (error) {
      console.error('Failed to store learning interaction:', error);
    }
  };

  const extractTopicFromQuery = (query) => {
    const topics = ['dashboard', 'working-capital', 'what-if', 'data-import', 'manufacturing', 'forecasting', 'inventory', 'quality'];
    return topics.find(topic => query.toLowerCase().includes(topic.replace('-', ' '))) || 'general';
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
        className={`fixed ${getPositionClasses()} z-50 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 group`}
        title="Sentia AI Support Assistant"
      >
        <ChatBubbleLeftIcon className="h-6 w-6" />
        <span className="absolute top-0 right-0 h-3 w-3 bg-green-400 rounded-full animate-pulse"></span>
        <div className="absolute -top-12 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          24/7 AI Support
        </div>
      </button>
    );
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50 transition-all duration-300 ${isMinimized ? 'w-80' : 'w-96'}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <SparklesIcon className="h-5 w-5" />
                <BoltIcon className="h-4 w-4 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-semibold">Sentia AI Support</h3>
                <p className="text-xs opacity-90">24/7 Manufacturing Assistant</p>
              </div>
              {isProcessing && (
                <div className="flex items-center space-x-1 text-xs">
                  <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                  <span>Thinking...</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-white/20 p-1 rounded"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-1 rounded"
                title="Close"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
              {conversation.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : message.error
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        : message.type === 'welcome'
                        ? 'bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 text-gray-900 dark:text-gray-100 shadow border border-green-200 dark:border-green-800'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    
                    {/* AI Source indicator */}
                    {message.source === 'mcp-ai' && (
                      <div className="flex items-center space-x-1 mt-2 text-xs opacity-70">
                        <BoltIcon className="h-3 w-3" />
                        <span>AI-powered response</span>
                      </div>
                    )}
                    
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
                    
                    <div className="text-xs opacity-70 mt-2 flex items-center justify-between">
                      <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                      {message.role === 'assistant' && !message.error && (
                        <div className="flex items-center space-x-1">
                          <AcademicCapIcon className="h-3 w-3" />
                          <span>Learning enabled</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Queries */}
            {suggestedQueries.length > 0 && (
              <div className="px-4 py-2 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center space-x-2 mb-2">
                  <LightBulbIcon className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Suggested questions:</span>
                </div>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {suggestedQueries.slice(0, 3).map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuery(query)}
                      disabled={isProcessing}
                      className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full hover:from-blue-200 hover:to-purple-200 dark:hover:from-blue-800/30 dark:hover:to-purple-800/30 whitespace-nowrap flex-shrink-0 transition-all duration-200 border border-blue-200 dark:border-blue-700 hover:shadow-sm"
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
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about Sentia features, processes, or get help..."
                    disabled={isProcessing}
                    className="w-full px-3 py-2 pr-8 border dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <BookOpenIcon className="h-4 w-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2" />
                </div>
                
                {enableVoice && recognitionRef.current && (
                  <button
                    type="button"
                    onClick={toggleVoice}
                    className={`p-2 rounded-lg transition-colors ${
                      isListening 
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 animate-pulse' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title={isListening ? "Stop listening" : "Start voice input"}
                  >
                    <MicrophoneIcon className="h-5 w-5" />
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isProcessing}
                  className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                  title="Send message"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Connected to MCP AI Server</span>
                <span className="flex items-center space-x-1">
                  <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Learning mode active</span>
                </span>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default SentiaAIChatbot;