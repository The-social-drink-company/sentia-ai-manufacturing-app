import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { 
  CpuChipIcon, 
  ChartBarIcon, 
  BeakerIcon,
  CubeIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const AIEnhancedDashboard = () => {
  const { getToken } = useAuth();
  const [aiStatus, setAiStatus] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [maintenanceData, setMaintenanceData] = useState(null);
  const [qualityMetrics, setQualityMetrics] = useState(null);
  const [supplyChainData, setSupplyChainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isInitializing, setIsInitializing] = useState(false);

  // API base URL
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Fetch with authentication
  const fetchWithAuth = useCallback(async (url, options = {}) => {
    const token = await getToken();
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }, [getToken]);

  // Initialize AI Systems
  const initializeAISystems = async () => {
    setIsInitializing(true);
    try {
      const response = await fetchWithAuth(`${API_BASE}/ai/initialize`, {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok) {
        setAiStatus(data);
        await loadDashboardData();
      } else {
        throw new Error(data.error || 'Failed to initialize AI systems');
      }
    } catch (err) {
      console.error('AI initialization error:', err);
      setError(err.message);
    } finally {
      setIsInitializing(false);
    }
  };

  // Load Dashboard Data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch AI system status
      const statusResponse = await fetchWithAuth(`${API_BASE}/ai/status`);
      if (statusResponse.ok) {
        setAiStatus(await statusResponse.json());
      }

      // Fetch executive dashboard
      const dashboardResponse = await fetchWithAuth(`${API_BASE}/ai/dashboard/executive`);
      if (dashboardResponse.ok) {
        setDashboardData(await dashboardResponse.json());
      }

      // Fetch forecast for GABA Red
      const forecastResponse = await fetchWithAuth(`${API_BASE}/ai/forecast`, {
        method: 'POST',
        body: JSON.stringify({ 
          productSKU: 'GABA-RED-001',
          options: { horizon: 30 }
        })
      });
      if (forecastResponse.ok) {
        setForecast(await forecastResponse.json());
      }

      // Fetch maintenance dashboard
      const maintenanceResponse = await fetchWithAuth(`${API_BASE}/ai/maintenance/dashboard`);
      if (maintenanceResponse.ok) {
        setMaintenanceData(await maintenanceResponse.json());
      }

      // Fetch quality dashboard
      const qualityResponse = await fetchWithAuth(`${API_BASE}/ai/quality/dashboard`);
      if (qualityResponse.ok) {
        setQualityMetrics(await qualityResponse.json());
      }

      // Fetch supply chain dashboard
      const supplyChainResponse = await fetchWithAuth(`${API_BASE}/ai/supply-chain/dashboard`);
      if (supplyChainResponse.ok) {
        setSupplyChainData(await supplyChainResponse.json());
      }

    } catch (err) {
      console.error('Dashboard loading error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Send chat message
  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;

    const userMessage = { role: 'user', content: chatMessage };
    setChatHistory(prev => [...prev, userMessage]);
    setChatMessage('');

    try {
      const response = await fetchWithAuth(`${API_BASE}/ai/chat`, {
        method: 'POST',
        body: JSON.stringify({ 
          message: chatMessage,
          sessionId: Date.now().toString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: data.response,
          confidence: data.confidence,
          intent: data.intent
        }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request.' 
      }]);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // System Status Card
  const SystemStatusCard = ({ system, status }) => {
    const getStatusIcon = () => {
      if (status === 'operational') return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      if (status === 'degraded') return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    };

    const getSystemIcon = () => {
      const icons = {
        'mcp': <CubeIcon className="h-6 w-6" />,
        'forecasting': <ArrowTrendingUpIcon className="h-6 w-6" />,
        'maintenance': <WrenchScrewdriverIcon className="h-6 w-6" />,
        'quality': <EyeIcon className="h-6 w-6" />,
        'supplyChain': <TruckIcon className="h-6 w-6" />,
        'digitalTwin': <CpuChipIcon className="h-6 w-6" />,
        'agent': <ChatBubbleLeftRightIcon className="h-6 w-6" />,
        'analytics': <ChartBarIcon className="h-6 w-6" />,
        'execution': <BeakerIcon className="h-6 w-6" />
      };
      return icons[system] || <CpuChipIcon className="h-6 w-6" />;
    };

    return (
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-blue-600">{getSystemIcon()}</div>
          <div>
            <h3 className="font-semibold capitalize">{system.replace(/([A-Z])/g, ' $1').trim()}</h3>
            <p className="text-sm text-gray-500 capitalize">{status}</p>
          </div>
        </div>
        {getStatusIcon()}
      </div>
    );
  };

  // KPI Card Component
  const KPICard = ({ title, value, unit, trend, icon }) => (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">
            {value}
            {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
          </p>
          {trend && (
            <p className={`text-sm mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </p>
          )}
        </div>
        {icon && <div className="text-blue-600">{icon}</div>}
      </div>
    </div>
  );

  if (loading && !aiStatus) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading AI Systems...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto" />
          <p className="mt-4 text-red-600">Error: {error}</p>
          <button 
            onClick={initializeAISystems}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Initialize AI Systems
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <SparklesIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Sentia AI Manufacturing Dashboard
              </h1>
            </div>
            {!aiStatus?.initialized && (
              <button
                onClick={initializeAISystems}
                disabled={isInitializing}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isInitializing ? 'Initializing...' : 'Initialize AI Systems'}
              </button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-8 border-b">
            {['overview', 'forecasting', 'quality', 'maintenance', 'supply-chain', 'chat'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* AI Systems Status */}
            <div>
              <h2 className="text-lg font-semibold mb-4">AI Systems Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {aiStatus?.systems && Object.entries(aiStatus.systems).map(([system, status]) => (
                  <SystemStatusCard key={system} system={system} status={status} />
                ))}
              </div>
            </div>

            {/* KPIs */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Key Performance Indicators</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard 
                  title="Production Efficiency" 
                  value="94.5" 
                  unit="%" 
                  trend={2.3}
                  icon={<BeakerIcon className="h-6 w-6" />}
                />
                <KPICard 
                  title="Quality Score" 
                  value="98.7" 
                  unit="%" 
                  trend={1.2}
                  icon={<CheckCircleIcon className="h-6 w-6" />}
                />
                <KPICard 
                  title="On-Time Delivery" 
                  value="96.3" 
                  unit="%" 
                  trend={-0.5}
                  icon={<ClockIcon className="h-6 w-6" />}
                />
                <KPICard 
                  title="Inventory Turnover" 
                  value="12.4" 
                  unit="x" 
                  trend={3.1}
                  icon={<ArrowPathIcon className="h-6 w-6" />}
                />
              </div>
            </div>

            {/* Recent Alerts */}
            {dashboardData?.alerts && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Recent AI Alerts</h2>
                <div className="bg-white rounded-lg shadow">
                  <div className="divide-y">
                    {dashboardData.alerts.slice(0, 5).map((alert, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                          <div>
                            <p className="font-medium">{alert.title}</p>
                            <p className="text-sm text-gray-500">{alert.description}</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-400">{alert.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Forecasting Tab */}
        {activeTab === 'forecasting' && forecast && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">AI Ensemble Forecasting - GABA Red</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4">30-Day Demand Forecast</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Predicted Demand</span>
                    <span className="font-bold">{forecast.prediction?.value || 'N/A'} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confidence Level</span>
                    <span className="font-bold">{forecast.confidence || 'N/A'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Model Agreement</span>
                    <span className="font-bold">{forecast.modelAgreement || 'N/A'}%</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4">Seasonality Analysis</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peak Season</span>
                    <span className="font-bold">{forecast.seasonality?.peak || 'Summer'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trend Direction</span>
                    <span className="font-bold text-green-600">Upward</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Next Reorder Date</span>
                    <span className="font-bold">{forecast.reorderDate || 'In 14 days'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quality Tab */}
        {activeTab === 'quality' && qualityMetrics && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">AI Quality Control Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPICard title="Batch Pass Rate" value="99.2" unit="%" trend={0.5} />
              <KPICard title="Defect Detection" value="0.8" unit="%" trend={-2.1} />
              <KPICard title="Inspection Accuracy" value="99.7" unit="%" trend={0.3} />
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Recent Quality Inspections</h3>
              <div className="space-y-3">
                {['Ashwagandha Root - Batch #2401', 'Passionflower Extract - Batch #2402', 
                  'L-Theanine - Batch #2403'].map((batch, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>{batch}</span>
                    <span className="text-green-600 font-semibold">PASSED</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && maintenanceData && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Predictive Maintenance Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPICard title="Equipment Health" value="92" unit="%" trend={-1.2} />
              <KPICard title="MTBF" value="720" unit="hrs" trend={5.3} />
              <KPICard title="Maintenance Backlog" value="3" unit="tasks" trend={-25} />
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Equipment Predictions</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                  <span>Mixing Tank #1</span>
                  <span className="text-yellow-600">Maintenance in 48 hrs</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span>Bottling Line A</span>
                  <span className="text-green-600">Healthy - 95% RUL</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span>Packaging Unit</span>
                  <span className="text-green-600">Healthy - 88% RUL</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Supply Chain Tab */}
        {activeTab === 'supply-chain' && supplyChainData && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Supply Chain Intelligence</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KPICard title="Supplier Score" value="94" unit="%" trend={2.1} />
              <KPICard title="Lead Time" value="14" unit="days" trend={-7.2} />
              <KPICard title="Stock Coverage" value="45" unit="days" trend={3.5} />
              <KPICard title="Order Accuracy" value="98.5" unit="%" trend={1.2} />
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Botanical Inventory Status</h3>
              <div className="space-y-3">
                {[
                  { name: 'Ashwagandha', stock: 450, unit: 'kg', status: 'Optimal' },
                  { name: 'Passionflower', stock: 280, unit: 'kg', status: 'Optimal' },
                  { name: 'L-Theanine', stock: 95, unit: 'kg', status: 'Reorder Soon' },
                  { name: 'Hawthorn Berry', stock: 320, unit: 'kg', status: 'Optimal' }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>{item.name}</span>
                    <span>{item.stock} {item.unit}</span>
                    <span className={`font-semibold ${
                      item.status === 'Optimal' ? 'text-green-600' : 'text-yellow-600'
                    }`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow" style={{ height: '600px' }}>
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">AI Manufacturing Assistant</h2>
                <p className="text-sm text-gray-500">Ask questions about production, inventory, or operations</p>
              </div>
              
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {chatHistory.length === 0 && (
                  <div className="text-center text-gray-500 mt-8">
                    <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Start a conversation with your AI assistant</p>
                    <div className="mt-4 space-y-2">
                      <p className="text-sm">Try asking:</p>
                      <p className="text-sm italic">"What's our current inventory of Ashwagandha?"</p>
                      <p className="text-sm italic">"Show me production efficiency trends"</p>
                      <p className="text-sm italic">"Predict demand for GABA Gold next month"</p>
                    </div>
                  </div>
                )}
                
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p>{msg.content}</p>
                      {msg.confidence && (
                        <p className="text-xs mt-1 opacity-75">
                          Confidence: {msg.confidence}% | Intent: {msg.intent}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Type your question..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendChatMessage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIEnhancedDashboard;