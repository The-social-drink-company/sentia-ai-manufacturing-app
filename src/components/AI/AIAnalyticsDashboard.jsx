import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const AIAnalyticsDashboard = () => {
  const [aiStatus, setAiStatus] = useState({
    connected: true,
    models: ['GPT-4', 'Claude 3.5', 'Custom ML Models'],
    activeProcesses: 3,
    lastUpdate: new Date().toLocaleTimeString()
  });

  const [predictions, setPredictions] = useState([
    { category: 'Sales Forecast', value: '+23%', confidence: 92, trend: 'up' },
    { category: 'Inventory Optimization', value: '-15%', confidence: 88, trend: 'down' },
    { category: 'Production Efficiency', value: '+8%', confidence: 95, trend: 'up' },
    { category: 'Quality Score', value: '98.5%', confidence: 97, trend: 'stable' }
  ]);

  const [anomalies, setAnomalies] = useState([
    { id: 1, type: 'warning', title: 'Unusual Order Pattern', description: 'Detected 43% increase in orders from Region B', timestamp: '2 hours ago', severity: 'medium' },
    { id: 2, type: 'critical', title: 'Quality Deviation', description: 'Product line C showing 2.3 sigma deviation', timestamp: '4 hours ago', severity: 'high' },
    { id: 3, type: 'info', title: 'Demand Spike', description: 'Expected 30% demand increase next week', timestamp: '6 hours ago', severity: 'low' }
  ]);

  const [automatedActions, setAutomatedActions] = useState([
    { id: 1, action: 'Inventory Reorder', status: 'completed', impact: 'Saved $12,000', time: '10:30 AM' },
    { id: 2, action: 'Production Schedule Optimization', status: 'in-progress', impact: 'Est. 15% efficiency gain', time: '11:15 AM' },
    { id: 3, action: 'Price Adjustment', status: 'pending', impact: 'Projected +$8,000 revenue', time: '11:45 AM' }
  ]);

  const [mcpConnection, setMcpConnection] = useState({
    status: 'connecting',
    latency: 0,
    requests: 0,
    errors: 0
  });

  // Simulate MCP server connection check
  useEffect(() => {
    const checkMCPConnection = async () => {
      try {
        const response = await fetch('/api/mcp/health');
        if (response.ok) {
          setMcpConnection({
            status: 'connected',
            latency: Math.floor(Math.random() * 50) + 10,
            requests: Math.floor(Math.random() * 1000) + 500,
            errors: Math.floor(Math.random() * 5)
          });
        } else {
          setMcpConnection(prev => ({ ...prev, status: 'error' }));
        }
      } catch (error) {
        setMcpConnection(prev => ({ ...prev, status: 'disconnected' }));
      }
    };

    checkMCPConnection();
    const interval = setInterval(checkMCPConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const runAIAnalysis = () => {
    // Simulate running AI analysis
    setAiStatus(prev => ({ ...prev, activeProcesses: prev.activeProcesses + 1 }));
    setTimeout(() => {
      setAiStatus(prev => ({
        ...prev,
        activeProcesses: prev.activeProcesses - 1,
        lastUpdate: new Date().toLocaleTimeString()
      }));
      // Update predictions with new values
      setPredictions(prev => prev.map(p => ({
        ...p,
        value: p.trend === 'up' ? `+${Math.floor(Math.random() * 30 + 10)}%` :
                p.trend === 'down' ? `-${Math.floor(Math.random() * 20 + 5)}%` :
                `${Math.floor(Math.random() * 5 + 95)}%`,
        confidence: Math.floor(Math.random() * 15 + 85)
      })));
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Analytics Central</h1>
          <p className="text-gray-600 mt-1">Powered by MCP Server & Multiple AI Models</p>
        </div>
        <button
          onClick={runAIAnalysis}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          Run AI Analysis
        </button>
      </div>

      {/* MCP Server Status */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>MCP Server Connection</span>
            <span className={`text-sm px-3 py-1 rounded-full ${
              mcpConnection.status === 'connected' ? 'bg-green-100 text-green-800' :
              mcpConnection.status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {mcpConnection.status === 'connected' ? '● Connected' :
               mcpConnection.status === 'connecting' ? '◐ Connecting...' :
               '○ Disconnected'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-600">Latency</p>
              <p className="text-xl font-bold text-purple-700">{mcpConnection.latency}ms</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">API Requests</p>
              <p className="text-xl font-bold text-purple-700">{mcpConnection.requests}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Errors</p>
              <p className="text-xl font-bold text-red-600">{mcpConnection.errors}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Active Models</p>
              <p className="text-xl font-bold text-purple-700">{aiStatus.models.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Models Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {aiStatus.models.map((model, index) => (
          <Card key={index} className="bg-gradient-to-br from-gray-50 to-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-2xl">🤖</div>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Active</span>
              </div>
              <h3 className="font-medium text-gray-900">{model}</h3>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Processing</span>
                  <span className="text-gray-900 font-medium">
                    {index === 0 ? '423 req/min' : index === 1 ? '312 req/min' : '156 req/min'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Accuracy</span>
                  <span className="text-gray-900 font-medium">
                    {index === 0 ? '96.2%' : index === 1 ? '94.8%' : '92.3%'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Predictions */}
      <Card>
        <CardHeader>
          <CardTitle>AI Predictions & Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {predictions.map((prediction, index) => (
              <div key={index} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-medium text-gray-700">{prediction.category}</h4>
                  <span className={`text-xl ${
                    prediction.trend === 'up' ? 'text-green-600' :
                    prediction.trend === 'down' ? 'text-red-600' :
                    'text-blue-600'
                  }`}>
                    {prediction.trend === 'up' ? '↑' :
                     prediction.trend === 'down' ? '↓' : '→'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{prediction.value}</p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Confidence</span>
                    <span>{prediction.confidence}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${prediction.confidence}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anomaly Detection */}
        <Card>
          <CardHeader>
            <CardTitle>Anomaly Detection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalies.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className={`p-4 rounded-lg border ${
                    anomaly.severity === 'high' ? 'bg-red-50 border-red-200' :
                    anomaly.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{anomaly.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{anomaly.description}</p>
                      <p className="text-xs text-gray-500 mt-2">{anomaly.timestamp}</p>
                    </div>
                    <span className={`text-2xl ${
                      anomaly.severity === 'high' ? 'text-red-500' :
                      anomaly.severity === 'medium' ? 'text-yellow-500' :
                      'text-blue-500'
                    }`}>
                      {anomaly.severity === 'high' ? '⚠️' :
                       anomaly.severity === 'medium' ? '⚡' : 'ℹ️'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Automated Actions */}
        <Card>
          <CardHeader>
            <CardTitle>AI-Driven Automated Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {automatedActions.map((action) => (
                <div key={action.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{action.action}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      action.status === 'completed' ? 'bg-green-100 text-green-800' :
                      action.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {action.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{action.impact}</p>
                  <p className="text-xs text-gray-500 mt-2">Executed at {action.time}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium">
                View All Automated Actions →
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>AI System Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Total Predictions</p>
              <p className="text-2xl font-bold text-gray-900">12,543</p>
              <p className="text-xs text-green-600 mt-1">+23% this week</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Accuracy Rate</p>
              <p className="text-2xl font-bold text-gray-900">94.7%</p>
              <p className="text-xs text-green-600 mt-1">+2.3% improvement</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Processing Time</p>
              <p className="text-2xl font-bold text-gray-900">1.2s</p>
              <p className="text-xs text-blue-600 mt-1">Avg response time</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cost Savings</p>
              <p className="text-2xl font-bold text-gray-900">$45.2K</p>
              <p className="text-xs text-green-600 mt-1">This month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAnalyticsDashboard;