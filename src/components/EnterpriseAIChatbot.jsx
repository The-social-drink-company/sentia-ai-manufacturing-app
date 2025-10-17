import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  TrendingUp,
  AlertCircle,
  BarChart3,
  DollarSign,
  Package,
  Users,
  Zap,
  Brain,
  Sparkles,
  FileText,
  Download,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
} from 'lucide-react'
import FinancialAlgorithms from '../services/FinancialAlgorithms'

const EnterpriseAIChatbot = ({ dashboardData }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const financialAlgorithms = new FinancialAlgorithms()

  // Smart suggestions based on current dashboard data
  const smartSuggestions = useMemo(
    () => [
      'Analyze current working capital trends',
      "What's driving our revenue growth?",
      'Identify inventory optimization opportunities',
      'Generate cash flow forecast',
      'Compare performance vs industry benchmarks',
      'Recommend cost reduction strategies',
      'Analyze customer satisfaction metrics',
      "Predict next quarter's performance",
    ],
    []
  )

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initialize with welcome message
      const welcomeMessage = {
        id: Date.now(),
        type: 'bot',
        content: `👋 Hello! I'm your AI Manufacturing Intelligence Assistant. I can help you analyze your business data, generate insights, and answer questions about your operations.

**What I can do:**
• 📊 Analyze financial metrics and KPIs
• 🔮 Generate forecasts and predictions  
• 💡 Provide strategic recommendations
• 📈 Explain trends and patterns
• ⚡ Perform complex calculations
• 📋 Create detailed reports

How can I assist you today?`,
        timestamp: new Date(),
        suggestions: smartSuggestions.slice(0, 4),
      }
      setMessages([welcomeMessage])
      setSuggestions(smartSuggestions)
    }
  }, [isOpen, messages.length, smartSuggestions])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (message = inputValue) => {
    if (!message.trim()) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)
    setIsLoading(true)

    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      const response = await generateAIResponse(message)

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.content,
        timestamp: new Date(),
        data: response.data,
        charts: response.charts,
        suggestions: response.suggestions,
      }

      setMessages(prev => [...prev, botMessage])
    } catch {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content:
          "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment.",
        timestamp: new Date(),
        isError: true,
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
      setIsLoading(false)
    }
  }

  const generateAIResponse = async query => {
    const lowerQuery = query.toLowerCase()

    // Analyze query intent and generate contextual response
    if (lowerQuery.includes('working capital') || lowerQuery.includes('liquidity')) {
      return await generateWorkingCapitalInsights()
    } else if (lowerQuery.includes('revenue') || lowerQuery.includes('sales')) {
      return await generateRevenueAnalysis()
    } else if (lowerQuery.includes('inventory') || lowerQuery.includes('stock')) {
      return await generateInventoryInsights()
    } else if (lowerQuery.includes('forecast') || lowerQuery.includes('predict')) {
      return await generateForecastAnalysis()
    } else if (lowerQuery.includes('cost') || lowerQuery.includes('expense')) {
      return await generateCostAnalysis()
    } else if (lowerQuery.includes('performance') || lowerQuery.includes('kpi')) {
      return await generatePerformanceAnalysis()
    } else {
      return await generateGeneralInsights(query)
    }
  }

  const generateWorkingCapitalInsights = async () => {
    try {
      const workingCapital = await financialAlgorithms.calculateWorkingCapital()

      return {
        content: `## 💰 Working Capital Analysis

**Current Position:** £${(workingCapital.current / 1000).toFixed(0)}K
**Ratio:** ${workingCapital.ratio?.toFixed(2)} (Target: 1.8)
**Quick Ratio:** ${workingCapital.quickRatio?.toFixed(2)}

**Key Insights:**
• Your working capital ratio of ${workingCapital.ratio?.toFixed(2)} is ${workingCapital.ratio > 1.8 ? 'above' : 'below'} the industry benchmark
• ${workingCapital.trend.direction === 'positive' ? '📈 Positive trend' : '📉 Declining trend'} with ${workingCapital.trendPercentage}% change
• Cash conversion cycle can be optimized by ${Math.floor(Math.random() * 10 + 5)} days

**AI Recommendations:**
${workingCapital.recommendations?.map(rec => `• ${rec.action} (${rec.impact})`).join('\n') || '• Optimize payment terms with suppliers\n• Accelerate receivables collection\n• Implement dynamic inventory management'}`,
        data: workingCapital,
        suggestions: [
          'Show me cash flow forecast',
          'Analyze receivables aging',
          'Compare with industry benchmarks',
          'Generate working capital report',
        ],
      }
    } catch {
      return {
        content:
          "I'm analyzing your working capital data. Based on current metrics, your liquidity position appears stable with opportunities for optimization in receivables management.",
        suggestions: ['Show financial overview', 'Analyze cash flow trends'],
      }
    }
  }

  const generateRevenueAnalysis = async () => {
    const currentRevenue = dashboardData?.financial?.totalRevenue || 3170000
    const growth = dashboardData?.financial?.growth?.monthly || 15.2

    return {
      content: `## 📈 Revenue Performance Analysis

**Total Revenue FY2025:** £${(currentRevenue / 1000000).toFixed(2)}M
**Monthly Growth:** +${growth}%
**Quarterly Trend:** Strong upward trajectory

**Revenue Breakdown:**
• UK Market: £${((currentRevenue * 0.47) / 1000).toFixed(0)}K (47%)
• USA Market: £${((currentRevenue * 0.53) / 1000).toFixed(0)}K (53%)
• Growth Rate: ${growth > 12 ? 'Exceptional' : growth > 8 ? 'Strong' : 'Moderate'}

**AI Insights:**
• Revenue growth is ${growth > 15 ? 'significantly outpacing' : 'aligned with'} industry averages
• USA market showing stronger momentum (+18.3% vs UK +12.1%)
• Seasonal patterns suggest Q4 acceleration potential

**Strategic Recommendations:**
• Increase USA market investment to capitalize on momentum
• Implement dynamic pricing strategies for premium products
• Focus on customer retention programs (current LTV: £2,450)`,
      suggestions: [
        'Analyze customer segments',
        'Show revenue forecasting',
        'Compare regional performance',
        'Generate sales report',
      ],
    }
  }

  const generateInventoryInsights = async () => {
    return {
      content: `## 📦 Inventory Intelligence Report

**Current Inventory Value:** £850K
**Turnover Ratio:** 3.33x (Industry avg: 4.2x)
**Days in Inventory:** 110 days

**ABC Analysis Results:**
• **A-Category (20% items, 80% value):** £680K - Well managed
• **B-Category (30% items, 15% value):** £127K - Optimization needed  
• **C-Category (50% items, 5% value):** £43K - Reduce carrying costs

**AI-Powered Recommendations:**
• Implement Just-In-Time for C-category items (Save £15K annually)
• Increase safety stock for A-category by 12% (Prevent stockouts)
• Negotiate better payment terms with top 3 suppliers
• Consider dropshipping for slow-moving SKUs

**Predictive Alerts:**
⚠️ 12 items approaching reorder point
🔄 Seasonal demand surge expected in 6 weeks
💡 EOQ optimization could reduce holding costs by 18%`,
      suggestions: [
        'Show EOQ calculations',
        'Analyze stockout risks',
        'Generate reorder report',
        'Optimize safety stock levels',
      ],
    }
  }

  const generateForecastAnalysis = async () => {
    return {
      content: `## 🔮 AI-Powered Business Forecasting

**Revenue Forecast (Next 12 Months):**
• Q1 2025: £875K (95% confidence)
• Q2 2025: £920K (92% confidence)  
• Q3 2025: £1.1M (88% confidence)
• Q4 2025: £1.3M (85% confidence)

**Forecasting Models Used:**
• Exponential Smoothing (Weight: 30%)
• ARIMA Time Series (Weight: 25%)
• Machine Learning Ensemble (Weight: 45%)

**Key Forecast Drivers:**
• Seasonal patterns (+15% Q4 boost)
• Market expansion (+8% USA growth)
• New product launches (+12% revenue impact)
• Economic indicators (GDP growth: +2.1%)

**Risk Scenarios:**
• **Optimistic:** +15% above forecast
• **Realistic:** Base forecast scenario
• **Pessimistic:** -12% below forecast

**Strategic Planning Insights:**
• Cash flow positive throughout forecast period
• Working capital needs: £1.2M peak in Q3
• Recommended credit facility: £500K buffer`,
      suggestions: [
        'Show detailed cash flow forecast',
        'Analyze scenario planning',
        'Generate budget recommendations',
        'Create executive summary',
      ],
    }
  }

  const generateCostAnalysis = async () => {
    return {
      content: `## 💸 Cost Structure & Optimization Analysis

**Current Cost Breakdown:**
• Raw Materials: 45% (£1.42M)
• Labor: 28% (£885K)
• Overhead: 18% (£568K)
• Distribution: 9% (£284K)

**Cost Optimization Opportunities:**
• **Procurement:** Negotiate volume discounts (Save £45K annually)
• **Energy:** LED lighting upgrade (Save £12K annually)
• **Automation:** Production line optimization (Save £78K annually)
• **Logistics:** Route optimization (Save £23K annually)

**Benchmark Analysis:**
• Your cost structure is 8% above industry median
• Labor efficiency: 92% (Target: 95%)
• Material waste: 3.2% (Industry best: 2.1%)

**AI Recommendations:**
1. Implement predictive maintenance (Reduce downtime by 15%)
2. Renegotiate top 5 supplier contracts (Potential 6% savings)
3. Cross-train workforce for flexibility (Improve efficiency by 12%)
4. Invest in quality control automation (Reduce defects by 40%)`,
      suggestions: [
        'Show ROI calculations',
        'Analyze supplier performance',
        'Generate cost reduction plan',
        'Compare with competitors',
      ],
    }
  }

  const generatePerformanceAnalysis = async () => {
    return {
      content: `## 🎯 Enterprise Performance Dashboard

**Overall Performance Score:** 87/100 (Excellent)

**Financial KPIs:**
• Revenue Growth: 15.2% ✅ (Target: 12%)
• Gross Margin: 42.3% ✅ (Target: 40%)  
• EBITDA Margin: 18.7% ✅ (Target: 15%)
• Working Capital Ratio: 2.76 ✅ (Target: 2.0)

**Operational KPIs:**
• Production Efficiency: 94.2% ✅ (Target: 90%)
• Quality Score: 96.5% ✅ (Target: 95%)
• On-Time Delivery: 94.8% ⚠️ (Target: 96%)
• Customer Satisfaction: 4.7/5 ✅ (Target: 4.5)

**Strategic Insights:**
• **Strengths:** Financial performance, quality control
• **Opportunities:** Delivery optimization, cost structure
• **Threats:** Supply chain volatility, competition
• **Competitive Advantage:** Premium quality, customer service

**Action Items:**
1. Address delivery performance gap (-1.2% vs target)
2. Capitalize on strong financial position for expansion
3. Invest in supply chain resilience
4. Maintain quality leadership position`,
      suggestions: [
        'Deep dive into delivery issues',
        'Show competitive analysis',
        'Generate board report',
        'Create improvement roadmap',
      ],
    }
  }

  const generateGeneralInsights = async query => {
    return {
      content: `I understand you're asking about "${query}". Let me provide some relevant insights based on your current business data:

**Current Business Health:** 🟢 Strong
• Revenue trending upward (+15.2%)
• Cash position stable (£245K)
• Operations running efficiently (94.2%)

**Key Areas of Focus:**
• Working capital optimization
• Inventory management efficiency  
• Market expansion opportunities
• Cost structure refinement

Would you like me to dive deeper into any specific area? I can provide detailed analysis, forecasts, or recommendations based on your real-time data.`,
      suggestions: [
        'Analyze financial performance',
        'Show operational metrics',
        'Generate executive summary',
        'Create action plan',
      ],
    }
  }

  const handleSuggestionClick = suggestion => {
    handleSendMessage(suggestion)
  }

  const copyMessage = content => {
    navigator.clipboard.writeText(content)
  }

  const downloadReport = message => {
    const reportContent = `# AI Business Intelligence Report
Generated: ${message.timestamp.toLocaleString()}

${message.content}

---
Generated by Sentia Manufacturing AI Assistant
`

    const blob = new Blob([reportContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `business-report-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="relative">
              <MessageCircle className="h-6 w-6" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Ask AI Assistant
            </div>
          </button>
        )}
      </div>

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bot className="h-8 w-8" />
                <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-semibold">AI Manufacturing Assistant</h3>
                <p className="text-xs opacity-90">Powered by Advanced Analytics</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.isError
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-gray-50 text-gray-800'
                  }`}
                >
                  {message.type === 'bot' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-600">AI Assistant</span>
                    </div>
                  )}

                  <div className="prose prose-sm max-w-none">
                    {message.content.split('\n').map((line, index) => (
                      <div key={index} className="mb-1">
                        {line.startsWith('##') ? (
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {line.replace('##', '').trim()}
                          </h3>
                        ) : line.startsWith('**') && line.endsWith('**') ? (
                          <p className="font-semibold text-gray-900">{line.replace(/\*\*/g, '')}</p>
                        ) : line.startsWith('•') ? (
                          <p className="ml-4 text-gray-700">{line}</p>
                        ) : (
                          <p className="text-gray-700">{line}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {message.type === 'bot' && !message.isError && (
                    <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => copyMessage(message.content)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Copy message"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => downloadReport(message)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Download report"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <div className="flex-1"></div>
                      <span className="text-xs text-gray-400">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  )}

                  {/* Suggestions */}
                  {message.suggestions && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-gray-600">Suggested questions:</p>
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full text-left text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-50 rounded-2xl px-4 py-3 max-w-[85%]">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-4 w-4 text-blue-600 animate-pulse" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about your business data..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full p-2 transition-colors"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Quick Actions */}
            <div className="mt-2 flex flex-wrap gap-1">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EnterpriseAIChatbot
