import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  ChartBarIcon,
  CubeIcon,
  BanknotesIcon,
  CogIcon,
  LightBulbIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { logDebug, logInfo, logWarn, logError } from '../../utils/logger';


const AISupportChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'ðŸ¤– Hello! I\'m your **Sentia Manufacturing AI Copilot**. I have deep access to your business data and can help you:\n\nðŸ“Š **Analyze** your performance metrics and KPIs\nðŸ“ˆ **Explore** inventory levels and forecasting data\nðŸ’° **Review** financial performance and working capital\nðŸ” **Investigate** production issues and quality metrics\nðŸ’¡ **Recommend** optimization strategies\nðŸ“‹ **Generate** custom reports and insights\n\nWhat would you like to explore today? Ask me about any aspect of your business!',
      timestamp: new Date(),
      enhanced: true
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch real-time business data for context
  const { data: businessData, refetch: refetchBusinessData } = useQuery({
    queryKey: ['business-overview'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/dashboard/overview');
        if (!response.ok) throw new Error('Failed to fetch business data');
        return await response.json();
      } catch (error) {
        logWarn('Business data not available:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Generate contextual suggested questions based on business data
    if (businessData && messages.length === 1) {
      const suggestions = generateSuggestedQuestions(businessData);
      setSuggestedQuestions(suggestions);
    }
  }, [businessData, messages.length]);

  const generateSuggestedQuestions = (data) => {
    const questions = [];
    
    if (data?.workingCapital?.currentRatio < 2.0) {
      questions.push("Why is my current ratio low and how can I improve it?");
    }
    if (data?.inventory?.totalValue > 100000) {
      questions.push("How can I optimize my inventory levels to free up cash?");
    }
    if (data?.sales?.growth < 0) {
      questions.push("What's causing my sales decline and what should I do?");
    }
    if (data?.production?.efficiency < 85) {
      questions.push("How can I improve my production efficiency?");
    }
    
    // Always include these general suggestions
    questions.push(
      "Show me my key performance indicators for this month",
      "What are my biggest risks and opportunities right now?",
      "Generate a financial health report",
      "What should I focus on to improve profitability?"
    );
    
    return questions.slice(0, 4);
  };

  const sendMessage = async (messageText = inputMessage, isQuickQuestion = false) => {
    const messageToSend = messageText.trim();
    if (!messageToSend || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!isQuickQuestion) setInputMessage('');
    setIsLoading(true);
    setCurrentAnalysis('Analyzing your request...');

    try {
      // Enhanced AI processing with business data context
      const response = await fetch('/api/mcp/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          context: 'sentia_copilot',
          business_data: businessData,
          conversation_history: messages.slice(-10), // More context for better responses
          request_type: 'business_analysis',
          capabilities_needed: ['data-analysis', 'business-intelligence', 'recommendations']
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCurrentAnalysis('Processing insights...');

      // Enhanced response with structured data analysis
      const enhancedResponse = await enhanceResponseWithAnalysis(data, messageToSend);
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: enhancedResponse.content,
        timestamp: new Date(),
        enhanced: true,
        analysis: enhancedResponse.analysis,
        recommendations: enhancedResponse.recommendations,
        visualizations: enhancedResponse.visualizations
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Generate new contextual suggestions based on the conversation
      if (enhancedResponse.suggestedFollowUp) {
        setSuggestedQuestions(enhancedResponse.suggestedFollowUp);
      }

    } catch (error) {
      logError('Chatbot API error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'ðŸš¨ I\'m experiencing technical difficulties accessing the AI analysis engine. Please try again in a moment. In the meantime, you can:\n\nâ€¢ Check your dashboard directly\nâ€¢ Use the navigation menu to access specific reports\nâ€¢ Contact support if this issue persists',
        timestamp: new Date(),
        enhanced: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setCurrentAnalysis(null);
    }
  };

  const enhanceResponseWithAnalysis = async (aiResponse, originalMessage) => {
    // Detect what type of analysis is needed based on the message
    const messageType = detectMessageType(originalMessage);
    
    let enhancedContent = aiResponse.response || 'I apologize, but I couldn\'t process your request properly.';
    let analysis = null;
    let recommendations = [];
    let visualizations = [];
    let suggestedFollowUp = [];

    try {
      // Add real-time data analysis based on message type
      if (messageType.includes('financial') && businessData) {
        analysis = analyzeFinancialMetrics(businessData);
        recommendations.push(...generateFinancialRecommendations(businessData));
      }
      
      if (messageType.includes('inventory') && businessData) {
        analysis = analyzeInventoryMetrics(businessData);
        recommendations.push(...generateInventoryRecommendations(businessData));
      }

      if (messageType.includes('production') && businessData) {
        analysis = analyzeProductionMetrics(businessData);
        recommendations.push(...generateProductionRecommendations(businessData));
      }

      // Generate contextual follow-up questions
      suggestedFollowUp = generateContextualFollowUp(messageType, businessData);

      // Add data visualization suggestions
      visualizations = generateVisualizationSuggestions(messageType);

    } catch (error) {
      logError('Error enhancing response:', error);
    }

    return {
      content: enhancedContent,
      analysis,
      recommendations,
      visualizations,
      suggestedFollowUp
    };
  };

  const detectMessageType = (message) => {
    const lowerMessage = message.toLowerCase();
    const types = [];
    
    if (lowerMessage.includes('financial') || lowerMessage.includes('cash') || lowerMessage.includes('revenue') || lowerMessage.includes('profit')) {
      types.push('financial');
    }
    if (lowerMessage.includes('inventory') || lowerMessage.includes('stock') || lowerMessage.includes('SKU')) {
      types.push('inventory');
    }
    if (lowerMessage.includes('production') || lowerMessage.includes('manufacturing') || lowerMessage.includes('efficiency')) {
      types.push('production');
    }
    if (lowerMessage.includes('sales') || lowerMessage.includes('demand') || lowerMessage.includes('forecast')) {
      types.push('sales');
    }
    if (lowerMessage.includes('quality') || lowerMessage.includes('defect') || lowerMessage.includes('compliance')) {
      types.push('quality');
    }
    
    return types;
  };

  const analyzeFinancialMetrics = (data) => {
    if (!data?.financial) return null;
    
    return {
      type: 'financial_analysis',
      metrics: {
        currentRatio: data.financial.currentRatio || 0,
        workingCapital: data.financial.workingCapital || 0,
        cashFlow: data.financial.cashFlow || 0,
        profitMargin: data.financial.profitMargin || 0
      },
      trends: {
        revenueGrowth: data.financial.revenueGrowth || 0,
        costTrend: data.financial.costTrend || 0
      }
    };
  };

  const generateFinancialRecommendations = (data) => {
    const recommendations = [];
    
    if (data?.financial?.currentRatio < 2.0) {
      recommendations.push({
        priority: 'high',
        category: 'liquidity',
        action: 'Improve current ratio by reducing current liabilities or increasing current assets',
        impact: 'Better financial stability and creditworthiness'
      });
    }
    
    if (data?.financial?.workingCapital < 0) {
      recommendations.push({
        priority: 'critical',
        category: 'cash_flow',
        action: 'Address negative working capital immediately - accelerate collections and delay payments where possible',
        impact: 'Prevent potential cash flow crisis'
      });
    }
    
    return recommendations;
  };

  const analyzeInventoryMetrics = (data) => {
    if (!data?.inventory) return null;
    
    return {
      type: 'inventory_analysis',
      metrics: {
        totalValue: data.inventory.totalValue || 0,
        turnoverRate: data.inventory.turnoverRate || 0,
        stockoutRisk: data.inventory.stockoutRisk || 'low',
        excessStock: data.inventory.excessStock || 0
      }
    };
  };

  const generateInventoryRecommendations = (data) => {
    const recommendations = [];
    
    if (data?.inventory?.turnoverRate < 4) {
      recommendations.push({
        priority: 'medium',
        category: 'inventory_optimization',
        action: 'Improve inventory turnover by identifying slow-moving items and implementing better demand forecasting',
        impact: 'Free up working capital and reduce storage costs'
      });
    }
    
    return recommendations;
  };

  const analyzeProductionMetrics = (data) => {
    if (!data?.production) return null;
    
    return {
      type: 'production_analysis',
      metrics: {
        efficiency: data.production.efficiency || 0,
        oee: data.production.oee || 0,
        defectRate: data.production.defectRate || 0,
        downtime: data.production.downtime || 0
      }
    };
  };

  const generateProductionRecommendations = (data) => {
    const recommendations = [];
    
    if (data?.production?.efficiency < 85) {
      recommendations.push({
        priority: 'high',
        category: 'efficiency',
        action: 'Analyze bottlenecks and implement lean manufacturing principles to improve efficiency',
        impact: 'Increase output and reduce unit costs'
      });
    }
    
    return recommendations;
  };

  const generateContextualFollowUp = (messageTypes, data) => {
    const followUps = [];
    
    if (messageTypes.includes('financial')) {
      followUps.push('How can I improve my cash flow cycle?');
      followUps.push('Show me a detailed working capital analysis');
    }
    
    if (messageTypes.includes('inventory')) {
      followUps.push('Which items should I reorder first?');
      followUps.push('What is my optimal stock level for top products?');
    }
    
    if (messageTypes.includes('production')) {
      followUps.push('Where are my biggest production bottlenecks?');
      followUps.push('How can I reduce manufacturing costs?');
    }
    
    return followUps.slice(0, 3);
  };

  const generateVisualizationSuggestions = (messageTypes) => {
    const suggestions = [];
    
    if (messageTypes.includes('financial')) {
      suggestions.push({
        type: 'chart',
        title: 'Cash Flow Trend',
        description: 'Monthly cash flow analysis with projections'
      });
    }
    
    return suggestions;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickQuestion = (question) => {
    sendMessage(question, true);
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      refetchBusinessData(); // Refresh data when opening
    }
  };

  const renderEnhancedMessage = (message) => {
    const isBot = message.type === 'bot';
    
    return (
      <div key={message.id} className={`flex ${!isBot ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs sm:max-w-sm ${!isBot ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'} px-4 py-3 rounded-lg shadow-sm`}>
          
          {/* Message Content */}
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content.split('**').map((part, index) => 
              index % 2 === 1 ? <strong key={index}>{part}</strong> : part
            )}
          </div>

          {/* Enhanced Features for Bot Messages */}
          {isBot && message.enhanced && (
            <>
              {/* Analysis Data */}
              {message.analysis && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-2 border-blue-400">
                  <div className="flex items-center mb-2">
                    <ChartBarIcon className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">DATA ANALYSIS</span>
                  </div>
                  <div className="text-xs text-gray-700 dark:text-gray-300">
                    {message.analysis.type === 'financial_analysis' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>Current Ratio: <span className="font-mono">{message.analysis.metrics.currentRatio}</span></div>
                        <div>Working Capital: <span className="font-mono">${message.analysis.metrics.workingCapital.toLocaleString()}</span></div>
                      </div>
                    )}
                    {message.analysis.type === 'inventory_analysis' && (
                      <div className="grid grid-cols-1 gap-1">
                        <div>Total Value: <span className="font-mono">${message.analysis.metrics.totalValue.toLocaleString()}</span></div>
                        <div>Turnover Rate: <span className="font-mono">{message.analysis.metrics.turnoverRate}x</span></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {message.recommendations && message.recommendations.length > 0 && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-l-2 border-amber-400">
                  <div className="flex items-center mb-2">
                    <LightBulbIcon className="h-4 w-4 text-amber-600 mr-2" />
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">RECOMMENDATIONS</span>
                  </div>
                  <div className="space-y-2">
                    {message.recommendations.slice(0, 2).map((rec, index) => (
                      <div key={index} className="text-xs">
                        <div className={`inline-block px-2 py-1 rounded text-white text-xs mb-1 ${
                          rec.priority === 'critical' ? 'bg-red-500' :
                          rec.priority === 'high' ? 'bg-orange-500' :
                          rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}>
                          {rec.priority.toUpperCase()}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{rec.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Timestamp */}
          <div className="flex items-center justify-between mt-2 text-xs opacity-70">
            <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {isBot && businessData && (
              <span className="flex items-center">
                <ArrowPathIcon className="h-3 w-3 mr-1" />
                Live Data
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Enhanced Chatbot Toggle Button */}
      {!isOpen && (
        <div className="relative">
          <button
            onClick={toggleChatbot}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-4 shadow-xl transition-all duration-300 flex items-center space-x-3 group"
            aria-label="Open AI Business Copilot"
          >
            <div className="relative">
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
              {businessData && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              )}
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-semibold">AI Copilot</span>
              <div className="text-xs opacity-90">Business Intelligence</div>
            </div>
          </button>
          
          {/* Status Indicator */}
          {businessData && (
            <div className="absolute -top-2 -left-2 bg-green-500 text-white rounded-full px-2 py-1 text-xs font-bold shadow-lg">
              LIVE
            </div>
          )}
        </div>
      )}

      {/* Enhanced Chatbot Window */}
      {isOpen && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-80 sm:w-96 h-[32rem] flex flex-col">
          
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/80 rounded-full flex items-center justify-center relative">
                <span className="text-sm font-bold">ðŸ§ </span>
                {businessData && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Business Copilot</h3>
                <p className="text-xs text-blue-100">
                  {businessData ? 'Connected to Live Data' : 'Ready to Assist'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {currentAnalysis && (
                <div className="text-xs bg-blue-500/50 px-2 py-1 rounded-full animate-pulse">
                  Analyzing...
                </div>
              )}
              <button
                onClick={toggleChatbot}
                className="hover:bg-blue-500/50 rounded-full p-1 transition-colors"
                aria-label="Close chat"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map(renderEnhancedMessage)}
            
            {/* Loading Animation */}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-lg shadow-sm max-w-xs">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    {currentAnalysis && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">{currentAnalysis}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {suggestedQuestions.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-3">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Suggested Questions:</div>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.slice(0, 2).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickQuestion(question)}
                    disabled={isLoading}
                    className="text-xs bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/70 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full transition-colors disabled:opacity-50"
                  >
                    {question.length > 30 ? question.substring(0, 30) + '...' : question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your business..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg p-2 transition-all duration-200 disabled:cursor-not-allowed shadow-lg"
                aria-label="Send message"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>ðŸš€ Powered by AI Central Nervous System</span>
              {businessData && (
                <span className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                  Live Data
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISupportChatbot;
