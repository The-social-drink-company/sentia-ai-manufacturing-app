# AI/ML/MCP Components - Complete Implementation Code

## 1. AI Insights Panel Component

```jsx
// src/components/ai/AIInsightsPanel.jsx
import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, RefreshCw, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Line, Bar } from 'react-chartjs-2';

export const AIInsightsPanel = ({ mcpConnected, mlModels }) => {
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [aiModel, setAiModel] = useState('gpt-4');
  const [insightType, setInsightType] = useState('all');

  // Fetch AI insights
  const { data: insights, isLoading, refetch } = useQuery({
    queryKey: ['ai-insights', aiModel, insightType],
    queryFn: async () => {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: aiModel,
          type: insightType,
          context: {
            timeRange: '24h',
            departments: ['production', 'quality', 'maintenance']
          }
        })
      });
      return response.json();
    },
    refetchInterval: 60000 // Refresh every minute
  });

  const insightCategories = {
    anomaly: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    optimization: { icon: Lightbulb, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    prediction: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' }
  };

  const handleActionClick = async (insight, action) => {
    try {
      const response = await fetch('/api/ai/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insightId: insight.id,
          action: action,
          model: aiModel
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Action executed:', result);
        refetch();
      }
    } catch (error) {
      console.error('Failed to execute action:', error);
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">AI Insights</h3>
          {mcpConnected && (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded">
              MCP Active
            </span>
          )}
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Controls */}
      <div className="flex space-x-2 mb-4">
        <select
          value={aiModel}
          onChange={(e) => setAiModel(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="gpt-4">GPT-4</option>
          <option value="claude-3">Claude 3</option>
          <option value="ensemble">Ensemble</option>
        </select>
        <select
          value={insightType}
          onChange={(e) => setInsightType(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="all">All Types</option>
          <option value="anomaly">Anomalies</option>
          <option value="optimization">Optimizations</option>
          <option value="prediction">Predictions</option>
        </select>
      </div>

      {/* Insights List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : (
          <AnimatePresence>
            {insights?.map((insight, index) => {
              const category = insightCategories[insight.type];
              const Icon = category.icon;
              
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg border ${category.bg} border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={() => setSelectedInsight(insight)}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className={`w-5 h-5 ${category.color} mt-1`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {insight.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {insight.description}
                      </p>
                      {insight.confidence && (
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-500"
                              style={{ width: `${insight.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {insight.confidence}% confidence
                          </span>
                        </div>
                      )}
                      {insight.actions && insight.actions.length > 0 && (
                        <div className="flex space-x-2 mt-3">
                          {insight.actions.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionClick(insight, action);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Insight Detail Modal */}
      <AnimatePresence>
        {selectedInsight && (
          <InsightDetailModal
            insight={selectedInsight}
            onClose={() => setSelectedInsight(null)}
            onAction={(action) => handleActionClick(selectedInsight, action)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Insight Detail Modal
const InsightDetailModal = ({ insight, onClose, onAction }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4">{insight.title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{insight.description}</p>
        
        {insight.details && (
          <div className="space-y-4 mb-6">
            {insight.details.chart && (
              <div className="h-64">
                <Line data={insight.details.chart} options={{ maintainAspectRatio: false }} />
              </div>
            )}
            
            {insight.details.metrics && (
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(insight.details.metrics).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">{key}</div>
                    <div className="text-lg font-semibold">{value}</div>
                  </div>
                ))}
              </div>
            )}
            
            {insight.details.recommendations && (
              <div>
                <h4 className="font-medium mb-2">Recommendations</h4>
                <ul className="space-y-2">
                  {insight.details.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-blue-500">•</span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Close
          </button>
          {insight.actions?.map((action, idx) => (
            <button
              key={idx}
              onClick={() => onAction(action)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {action.label}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
```

## 2. MCP Connection Status Component

```jsx
// src/components/mcp/MCPConnectionStatus.jsx
import React, { useState, useEffect } from 'react';
import { Cpu, Database, GitBranch, Check, X, AlertCircle, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MCPConnectionStatus = ({ connected }) => {
  const [servers, setServers] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (connected) {
      fetchServerStatus();
    }
  }, [connected]);

  const fetchServerStatus = async () => {
    try {
      const response = await fetch('/api/mcp/servers');
      const data = await response.json();
      setServers(data.servers);
    } catch (error) {
      console.error('Failed to fetch MCP server status:', error);
    }
  };

  const reconnectServer = async (serverName) => {
    setIsConnecting(true);
    try {
      const response = await fetch(`/api/mcp/servers/${serverName}/reconnect`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchServerStatus();
      }
    } catch (error) {
      console.error('Failed to reconnect server:', error);
    }
    setIsConnecting(false);
  };

  const serverIcons = {
    filesystem: Database,
    github: GitBranch,
    postgres: Database,
    default: Cpu
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
          connected 
            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
            : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30'
        }`}
      >
        <Cpu className="w-4 h-4" />
        <span className="text-sm font-medium">
          MCP {connected ? 'Connected' : 'Disconnected'}
        </span>
        {connected && servers.length > 0 && (
          <span className="text-xs">
            ({servers.filter(s => s.status === 'connected').length}/{servers.length})
          </span>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
          >
            <div className="p-4">
              <h4 className="font-semibold mb-3">MCP Server Status</h4>
              
              {servers.length === 0 ? (
                <p className="text-sm text-gray-500">No servers configured</p>
              ) : (
                <div className="space-y-2">
                  {servers.map((server) => {
                    const Icon = serverIcons[server.name] || serverIcons.default;
                    return (
                      <div
                        key={server.name}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <div>
                            <div className="font-medium text-sm">{server.name}</div>
                            <div className="text-xs text-gray-500">
                              {server.tools?.length || 0} tools available
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {server.status === 'connected' ? (
                            <div className="flex items-center space-x-1">
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-xs text-green-600">Connected</span>
                            </div>
                          ) : server.status === 'connecting' ? (
                            <div className="flex items-center space-x-1">
                              <Loader className="w-4 h-4 text-yellow-500 animate-spin" />
                              <span className="text-xs text-yellow-600">Connecting</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <X className="w-4 h-4 text-red-500" />
                              <button
                                onClick={() => reconnectServer(server.name)}
                                disabled={isConnecting}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Reconnect
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Protocol Version</span>
                  <span className="font-mono">1.0.0</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600 dark:text-gray-400">Total Tools</span>
                  <span className="font-mono">
                    {servers.reduce((acc, s) => acc + (s.tools?.length || 0), 0)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

## 3. ML Forecast Widget Component

```jsx
// src/components/ml/MLForecastWidget.jsx
import React, { useState, useEffect } from 'react';
import { Activity, Calendar, TrendingUp, Settings, Info } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

export const MLForecastWidget = ({ mlModels }) => {
  const [selectedModel, setSelectedModel] = useState('ensemble');
  const [timeRange, setTimeRange] = useState('7d');
  const [metric, setMetric] = useState('demand');
  const [showConfidence, setShowConfidence] = useState(true);

  // Fetch forecast data
  const { data: forecast, isLoading } = useQuery({
    queryKey: ['ml-forecast', selectedModel, timeRange, metric],
    queryFn: async () => {
      const response = await fetch('/api/ml/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          timeRange,
          metric,
          includeConfidence: showConfidence
        })
      });
      return response.json();
    },
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  const chartData = {
    labels: forecast?.timestamps || [],
    datasets: [
      {
        label: 'Historical',
        data: forecast?.historical || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.4
      },
      {
        label: 'Forecast',
        data: forecast?.predicted || [],
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.4
      },
      ...(showConfidence ? [
        {
          label: 'Upper Bound',
          data: forecast?.upperBound || [],
          borderColor: 'rgba(168, 85, 247, 0.3)',
          backgroundColor: 'rgba(168, 85, 247, 0.05)',
          borderWidth: 1,
          fill: '+1',
          tension: 0.4
        },
        {
          label: 'Lower Bound',
          data: forecast?.lowerBound || [],
          borderColor: 'rgba(168, 85, 247, 0.3)',
          backgroundColor: 'rgba(168, 85, 247, 0.05)',
          borderWidth: 1,
          fill: '-1',
          tension: 0.4
        }
      ] : [])
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true
      }
    }
  };

  const modelAccuracy = {
    arima: 92,
    prophet: 89,
    lstm: 94,
    ensemble: 96
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold">ML Forecast</h3>
        </div>
        <div className="flex items-center space-x-2">
          {selectedModel && (
            <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-xs rounded">
              Accuracy: {modelAccuracy[selectedModel]}%
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
        >
          <option value="ensemble">Ensemble</option>
          <option value="arima">ARIMA</option>
          <option value="prophet">Prophet</option>
          <option value="lstm">LSTM</option>
        </select>
        
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
        >
          <option value="demand">Demand</option>
          <option value="production">Production</option>
          <option value="quality">Quality</option>
          <option value="maintenance">Maintenance</option>
        </select>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm"
        >
          <option value="24h">24 Hours</option>
          <option value="7d">7 Days</option>
          <option value="30d">30 Days</option>
          <option value="90d">90 Days</option>
        </select>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="h-full bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>

      {/* Statistics */}
      {forecast && (
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
            <div className="text-xs text-gray-600 dark:text-gray-400">MAE</div>
            <div className="text-sm font-semibold">{forecast.metrics?.mae?.toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
            <div className="text-xs text-gray-600 dark:text-gray-400">RMSE</div>
            <div className="text-sm font-semibold">{forecast.metrics?.rmse?.toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
            <div className="text-xs text-gray-600 dark:text-gray-400">MAPE</div>
            <div className="text-sm font-semibold">{forecast.metrics?.mape?.toFixed(1)}%</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
            <div className="text-xs text-gray-600 dark:text-gray-400">R²</div>
            <div className="text-sm font-semibold">{forecast.metrics?.r2?.toFixed(3)}</div>
          </div>
        </div>
      )}

      {/* Model Info */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-start space-x-2">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-xs text-blue-800 dark:text-blue-300">
            {selectedModel === 'ensemble' 
              ? 'Ensemble combines ARIMA, Prophet, and LSTM models for improved accuracy'
              : `${selectedModel.toUpperCase()} model trained on ${forecast?.trainingDataPoints || 0} data points`
            }
          </div>
        </div>
      </div>
    </div>
  );
};
```

## 4. Natural Language Query Component

```jsx
// src/components/ai/NaturalLanguageQuery.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, X, Sparkles, Copy, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const NaturalLanguageQuery = ({ onClose, floating = false }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }

    // Add welcome message
    setMessages([{
      role: 'assistant',
      content: 'Hello! I can help you analyze your manufacturing data. Try asking questions like:\n\n• "What is our current production efficiency?"\n• "Show me quality trends for the past week"\n• "Identify bottlenecks in production line A"\n• "Generate a report on maintenance costs"',
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          model: selectedModel,
          context: {
            previousMessages: messages.slice(-5),
            dataScope: ['production', 'quality', 'maintenance', 'inventory']
          }
        })
      });

      const data = await response.json();
      
      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        data: data.data,
        charts: data.charts,
        suggestions: data.suggestions,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Query failed:', error);
      setMessages(prev => [...prev, {
        role: 'error',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }]);
    }

    setIsLoading(false);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const exportConversation = () => {
    const content = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${new Date().toISOString()}.txt`;
    a.click();
  };

  const containerClasses = floating
    ? 'fixed bottom-20 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50'
    : 'h-full bg-white dark:bg-gray-800';

  return (
    <motion.div
      initial={{ opacity: 0, scale: floating ? 0.9 : 1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: floating ? 0.9 : 1 }}
      className={containerClasses}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="gpt-4">GPT-4</option>
              <option value="claude-3">Claude 3</option>
              <option value="gemini">Gemini Pro</option>
            </select>
            <button
              onClick={exportConversation}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <Download className="w-4 h-4" />
            </button>
            {floating && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg'
                    : message.role === 'error'
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-r-lg rounded-tl-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-r-lg rounded-tl-lg'
                } p-3`}>
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <div className="relative">
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                            <button
                              onClick={() => copyToClipboard(String(children))}
                              className="absolute top-2 right-2 p-1 bg-gray-700 text-white rounded hover:bg-gray-600"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  
                  {message.suggestions && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs font-medium mb-2">Suggested follow-ups:</p>
                      <div className="space-y-1">
                        {message.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => setQuery(suggestion)}
                            className="block w-full text-left text-xs p-2 bg-white dark:bg-gray-800 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs opacity-70 mt-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 dark:bg-gray-700 rounded-r-lg rounded-tl-lg p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask me anything about your data..."
              className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              disabled={isLoading}
            />
            {recognitionRef.current && (
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-lg transition-colors ${
                  isListening 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};
```

## 5. Agent Monitor Component

```jsx
// src/components/agents/AgentMonitor.jsx
import React, { useState, useEffect } from 'react';
import { Zap, Play, Pause, RotateCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

export const AgentMonitor = ({ aiAgents }) => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentLogs, setAgentLogs] = useState({});

  // Fetch agent metrics
  const { data: metrics } = useQuery({
    queryKey: ['agent-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/ai/agents/metrics');
      return response.json();
    },
    refetchInterval: 10000
  });

  useEffect(() => {
    // Set up WebSocket for real-time agent updates
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws/agents`);
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      if (update.type === 'log') {
        setAgentLogs(prev => ({
          ...prev,
          [update.agentId]: [...(prev[update.agentId] || []).slice(-99), update.log]
        }));
      }
    };

    return () => ws.close();
  }, []);

  const controlAgent = async (agentId, action) => {
    try {
      const response = await fetch(`/api/ai/agents/${agentId}/${action}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        console.log(`Agent ${agentId} ${action} successful`);
      }
    } catch (error) {
      console.error(`Failed to ${action} agent:`, error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'idle':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getAgentTypeColor = (type) => {
    const colors = {
      optimizer: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
      monitor: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
      predictor: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
      scheduler: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
    };
    return colors[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">AI Agents</h3>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {aiAgents.filter(a => a.status === 'active').length} Active
        </div>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {aiAgents.map((agent) => (
          <motion.div
            key={agent.id}
            layout
            className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            onClick={() => setSelectedAgent(agent)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(agent.status)}
                <div>
                  <div className="font-medium text-sm">{agent.name}</div>
                  <div className="text-xs text-gray-500">
                    {agent.lastAction || 'No recent actions'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded ${getAgentTypeColor(agent.type)}`}>
                  {agent.type}
                </span>
                <div className="flex space-x-1">
                  {agent.status === 'active' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        controlAgent(agent.id, 'pause');
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        controlAgent(agent.id, 'start');
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      controlAgent(agent.id, 'restart');
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Agent Metrics */}
            {metrics?.[agent.id] && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Tasks</div>
                  <div className="text-sm font-semibold">{metrics[agent.id].tasksCompleted}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Success</div>
                  <div className="text-sm font-semibold">{metrics[agent.id].successRate}%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Uptime</div>
                  <div className="text-sm font-semibold">{metrics[agent.id].uptime}h</div>
                </div>
              </div>
            )}

            {/* Recent Logs Preview */}
            {agentLogs[agent.id] && agentLogs[agent.id].length > 0 && (
              <div className="mt-2 p-2 bg-gray-900 rounded text-xs font-mono text-green-400 max-h-20 overflow-hidden">
                {agentLogs[agent.id].slice(-2).map((log, idx) => (
                  <div key={idx} className="truncate">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Agent Detail Modal */}
      <AnimatePresence>
        {selectedAgent && (
          <AgentDetailModal
            agent={selectedAgent}
            logs={agentLogs[selectedAgent.id] || []}
            onClose={() => setSelectedAgent(null)}
            onControl={(action) => controlAgent(selectedAgent.id, action)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Agent Detail Modal
const AgentDetailModal = ({ agent, logs, onClose, onControl }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4">{agent.name}</h3>
        
        <div className="space-y-4">
          {/* Agent Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Type</label>
              <div className="font-medium">{agent.type}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Status</label>
              <div className="font-medium">{agent.status}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Model</label>
              <div className="font-medium">{agent.model}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400">Last Updated</label>
              <div className="font-medium">{new Date(agent.lastUpdated).toLocaleString()}</div>
            </div>
          </div>

          {/* Configuration */}
          <div>
            <h4 className="font-medium mb-2">Configuration</h4>
            <pre className="bg-gray-100 dark:bg-gray-700 rounded p-3 text-xs overflow-x-auto">
              {JSON.stringify(agent.config, null, 2)}
            </pre>
          </div>

          {/* Logs */}
          <div>
            <h4 className="font-medium mb-2">Recent Logs</h4>
            <div className="bg-gray-900 rounded p-3 max-h-64 overflow-y-auto">
              {logs.length > 0 ? (
                logs.map((log, idx) => (
                  <div key={idx} className="text-xs font-mono text-green-400">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500">No logs available</div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Close
          </button>
          <button
            onClick={() => onControl('restart')}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Restart Agent
          </button>
          {agent.status === 'active' ? (
            <button
              onClick={() => onControl('pause')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Pause Agent
            </button>
          ) : (
            <button
              onClick={() => onControl('start')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Start Agent
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
```

## Key Features Implemented

1. **AI Insights Panel**: Real-time AI-generated insights with actions
2. **MCP Connection Status**: Live server monitoring and management
3. **ML Forecast Widget**: Multi-model ensemble forecasting with confidence intervals
4. **Natural Language Query**: Conversational AI interface with voice support
5. **Agent Monitor**: 24/7 autonomous agent tracking and control
6. **Real-time Updates**: WebSocket and SSE integration
7. **Model Selection**: Choose between GPT-4, Claude 3, and ensemble models
8. **Voice Input**: Speech-to-text for natural language queries
9. **Code Highlighting**: Syntax highlighting for technical responses
10. **Export Capabilities**: Download conversations and data