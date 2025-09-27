import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Minimize2,
  Maximize2,
  RotateCcw,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  DollarSign,
  Factory,
  Settings
} from 'lucide-react';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "👋 Hello! I'm your AI Manufacturing Assistant. I can help you analyze production data, identify optimization opportunities, and answer questions about your operations. What would you like to explore?",
      timestamp: new Date(),
      suggestions: [
        "Show me today's production metrics",
        "Analyze quality control trends",
        "What are the biggest cost savings opportunities?",
        "Check inventory levels"
      ]
    }
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const botResponse = generateAIResponse(message);
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const generateAIResponse = (userInput) => {
    const input = userInput.toLowerCase();
    let response = "";
    let suggestions = [];
    let insights = [];

    if (input.includes('production') || input.includes('metrics')) {
      response = "📊 **Current Production Metrics:**\n\n• **Overall Equipment Effectiveness (OEE):** 87.3% (+2.1% vs yesterday)\n• **Production Rate:** 1,247 units/hour (Target: 1,200)\n• **Downtime:** 23 minutes (Planned maintenance)\n• **Quality Rate:** 98.7% (Above target)\n\n**Key Insight:** Production Line 4 is performing exceptionally well at 99.5% efficiency. Consider replicating its setup on other lines.";
      suggestions = ["Analyze downtime causes", "Compare line performance", "Show quality trends"];
      insights = [
        { type: 'success', text: 'Production exceeding targets by 3.9%' },
        { type: 'opportunity', text: 'Line 2 has 15% improvement potential' }
      ];
    } else if (input.includes('quality') || input.includes('defect')) {
      response = "🔍 **Quality Control Analysis:**\n\n• **Overall Quality:** 98.7% (↑0.3% from yesterday)\n• **Defect Rate:** 1.3% (↓0.2% improvement)\n• **Top Defect Categories:**\n  - Dimensional: 32% (trending down)\n  - Surface Finish: 24% (needs attention)\n  - Material: 20% (stable)\n\n**AI Recommendation:** Focus on surface finish processes. Implementing automated inspection could reduce defects by 40%.";
      suggestions = ["Show defect root causes", "Recommend quality improvements", "Schedule quality review"];
      insights = [
        { type: 'warning', text: 'Surface finish defects increasing 12%' },
        { type: 'opportunity', text: 'Automated inspection ROI: $89K annually' }
      ];
    } else if (input.includes('cost') || input.includes('saving') || input.includes('money')) {
      response = "💰 **Cost Optimization Opportunities:**\n\n**Immediate Savings (30 days):**\n• Energy optimization: $28,000\n• Inventory reduction: $67,000\n• Process efficiency: $45,000\n\n**Medium-term (90 days):**\n• Predictive maintenance: $125,000\n• Quality improvements: $89,000\n\n**Total Potential:** $354,000 annually\n\n**Next Action:** I recommend starting with energy optimization - it has the quickest payback period.";
      suggestions = ["Show energy usage breakdown", "Create savings roadmap", "Calculate ROI scenarios"];
      insights = [
        { type: 'success', text: '$354K total optimization potential identified' },
        { type: 'action', text: 'Energy optimization can start immediately' }
      ];
    } else if (input.includes('inventory') || input.includes('stock')) {
      response = "📦 **Inventory Analysis:**\n\n• **Current Stock Value:** $2.1M\n• **Turnover Rate:** 8.2x annually (Industry avg: 6.5x)\n• **Excess Inventory:** $340K (16% of total)\n• **Stockouts Risk:** 3 items (Low priority)\n\n**AI Insight:** Your inventory management is above average, but there's $67K in optimization potential through better demand forecasting and supplier coordination.";
      suggestions = ["Show excess inventory details", "Optimize reorder points", "Forecast demand trends"];
      insights = [
        { type: 'success', text: 'Inventory turnover 26% above industry average' },
        { type: 'opportunity', text: '$67K excess inventory optimization' }
      ];
    } else if (input.includes('help') || input.includes('what can you')) {
      response = "🤖 **I'm your AI Manufacturing Intelligence Assistant!**\n\nI can help you with:\n\n**📊 Analytics & Reporting**\n• Production metrics and KPIs\n• Quality control analysis\n• Financial performance insights\n\n**🔍 Optimization**\n• Cost reduction opportunities\n• Process improvement recommendations\n• Predictive maintenance insights\n\n**📈 Strategic Planning**\n• Capacity planning\n• Investment ROI analysis\n• Market trend analysis\n\nJust ask me anything about your manufacturing operations!";
      suggestions = ["Analyze today's performance", "Find cost savings", "Check equipment health", "Review quality metrics"];
    } else {
      response = "🤔 I understand you're asking about manufacturing operations. Let me provide some relevant insights:\n\n**Current Status:**\n• All systems operational\n• Production running at 103.9% of target\n• Quality metrics within acceptable range\n\n**Quick Recommendations:**\n• Review Line 2 efficiency (15% below optimal)\n• Consider predictive maintenance for Equipment #7\n• Inventory optimization opportunity identified\n\nCould you be more specific about what you'd like to analyze?";
      suggestions = ["Show production overview", "Analyze equipment performance", "Review cost opportunities"];
    }

    return {
      id: Date.now(),
      type: 'bot',
      content: response,
      timestamp: new Date(),
      suggestions,
      insights
    };
  };

  const handleSuggestionClick = (suggestion) => {
    setMessage(suggestion);
    handleSendMessage();
  };

  const formatMessage = (content) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <div key={index} className="font-semibold text-gray-900 mt-2 mb-1">{line.slice(2, -2)}</div>;
      } else if (line.startsWith('• ')) {
        return <div key={index} className="ml-4 text-gray-700">{line}</div>;
      } else if (line.startsWith('  - ')) {
        return <div key={index} className="ml-8 text-gray-600 text-sm">{line}</div>;
      } else {
        return <div key={index} className="text-gray-700">{line}</div>;
      }
    });
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'action': return <Zap className="h-4 w-4 text-purple-500" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'opportunity': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'action': return 'bg-purple-50 border-purple-200 text-purple-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 group"
            >
              <MessageCircle className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 100 }}
            className={`fixed bottom-6 right-6 z-50 ${
              isMinimized ? 'w-80' : 'w-96'
            } transition-all duration-200`}
          >
            <Card className="shadow-2xl border-0 overflow-hidden">
              {/* Header */}
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">AI Assistant</CardTitle>
                      <p className="text-blue-100 text-sm">Manufacturing Intelligence</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="text-white hover:bg-white/20 p-1"
                    >
                      {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="text-white hover:bg-white/20 p-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Chat Content */}
              {!isMinimized && (
                <CardContent className="p-0">
                  {/* Messages */}
                  <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] ${msg.type === 'user' ? 'order-2' : 'order-1'}`}>
                          <div className={`flex items-start space-x-2 ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              msg.type === 'user' ? 'bg-blue-600' : 'bg-gray-600'
                            }`}>
                              {msg.type === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
                            </div>
                            <div className={`rounded-lg p-3 ${
                              msg.type === 'user' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white border border-gray-200'
                            }`}>
                              <div className="text-sm">
                                {msg.type === 'user' ? msg.content : formatMessage(msg.content)}
                              </div>
                              <div className={`text-xs mt-1 ${
                                msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {msg.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>

                          {/* AI Insights */}
                          {msg.insights && msg.insights.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {msg.insights.map((insight, index) => (
                                <div key={index} className={`flex items-center space-x-2 p-2 rounded-lg border text-xs ${getInsightColor(insight.type)}`}>
                                  {getInsightIcon(insight.type)}
                                  <span>{insight.text}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Suggestions */}
                          {msg.suggestions && msg.suggestions.length > 0 && (
                            <div className="mt-3 space-y-1">
                              {msg.suggestions.map((suggestion, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="text-xs h-8 w-full justify-start text-left hover:bg-blue-50"
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="flex items-start space-x-2">
                          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                          <div className="bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t bg-white">
                    <div className="flex space-x-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask about production, quality, costs..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || isTyping}
                        className="bg-blue-600 hover:bg-blue-700 px-3"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>Powered by AI Manufacturing Intelligence</span>
                      <Badge variant="secondary" className="text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                        Online
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
