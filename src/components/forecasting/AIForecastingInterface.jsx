import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertCircle,
  Activity,
  Zap,
  Eye,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  Layers,
  RefreshCw,
  Download
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ScatterChart, Scatter } from 'recharts';

const AIForecastingInterface = ({ data, onForecast, onScenarioChange, loading = false }) => {
  const [selectedProduct, setSelectedProduct] = useState('SENSIO_RED');
  const [selectedMarket, setSelectedMarket] = useState('UK');
  const [forecastHorizon, setForecastHorizon] = useState(90);
  const [confidenceLevel, setConfidenceLevel] = useState(95);
  const [agentMode, setAgentMode] = useState('ensemble');
  const [showExplanations, setShowExplanations] = useState(false);

  // FinanceFlo AI Forecasting Data Structure
  const forecastData = data || {
    aiAgents: {
      ensemble: { 
        name: 'Ensemble AI', 
        accuracy: 0.91, 
        confidence: 0.87, 
        status: 'active',
        lastRun: '2024-01-15T14:30:00Z',
        recommendation: 'Primary model - highest accuracy across all markets'
      },
      demandPredictor: { 
        name: 'Demand Predictor', 
        accuracy: 0.88, 
        confidence: 0.82, 
        status: 'active',
        lastRun: '2024-01-15T14:25:00Z',
        recommendation: 'Best for seasonal pattern recognition'
      },
      riskAssessment: { 
        name: 'Risk Assessment', 
        accuracy: 0.85, 
        confidence: 0.79, 
        status: 'active',
        lastRun: '2024-01-15T14:20:00Z',
        recommendation: 'Excels at volatility and uncertainty modeling'
      },
      marketIntelligence: { 
        name: 'Market Intelligence', 
        accuracy: 0.83, 
        confidence: 0.76, 
        status: 'learning',
        lastRun: '2024-01-15T14:15:00Z',
        recommendation: 'Improving - incorporating external market signals'
      }
    },
    currentForecast: {
      productId: 'SENSIO_RED',
      market: 'UK',
      horizon: 90,
      model: 'ensemble',
      generatedAt: '2024-01-15T14:30:00Z',
      demand: {
        predicted: [
          { date: '2024-02-01', demand: 520, lower: 470, upper: 580, confidence: 0.89 },
          { date: '2024-02-15', demand: 485, lower: 430, upper: 550, confidence: 0.87 },
          { date: '2024-03-01', demand: 510, lower: 460, upper: 570, confidence: 0.85 },
          { date: '2024-03-15', demand: 535, lower: 480, upper: 600, confidence: 0.83 },
          { date: '2024-04-01', demand: 560, lower: 500, upper: 630, confidence: 0.81 },
          { date: '2024-04-15', demand: 540, lower: 485, upper: 605, confidence: 0.82 }
        ],
        totalPredicted: 3150,
        seasonalFactors: {
          january: 0.95,
          february: 0.88,
          march: 1.02,
          april: 1.08
        }
      },
      insights: {
        trendDirection: 'stable_growth',
        seasonalityStrength: 'moderate',
        volatilityLevel: 'low',
        externalFactors: ['brexit_impact', 'economic_outlook'],
        riskFactors: [
          { factor: 'lead_time_variability', impact: 'medium', probability: 0.25 },
          { factor: 'currency_fluctuation', impact: 'low', probability: 0.15 },
          { factor: 'supply_chain_disruption', impact: 'high', probability: 0.05 }
        ]
      },
      accuracy: {
        mape: 8.3,
        rmse: 45.2,
        mae: 38.1,
        r2: 0.87
      }
    },
    scenarios: [
      {
        name: 'Baseline',
        description: 'Current market conditions continue',
        probability: 0.60,
        demandAdjustment: 1.0,
        workingCapitalImpact: 0,
        active: true
      },
      {
        name: 'Economic Downturn',
        description: '15% reduction in market demand',
        probability: 0.25,
        demandAdjustment: 0.85,
        workingCapitalImpact: -420000,
        active: false
      },
      {
        name: 'Market Growth',
        description: '20% increase driven by expansion',
        probability: 0.15,
        demandAdjustment: 1.20,
        workingCapitalImpact: 580000,
        active: false
      }
    ]
  };

  const getAgentStatusColor = (status) => {
    const colors = {
      'active': 'text-green-600 bg-green-50',
      'learning': 'text-blue-600 bg-blue-50',
      'inactive': 'text-gray-600 bg-gray-50',
      'error': 'text-red-600 bg-red-50'
    };
    return colors[status] || colors.inactive;
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 0.9) return 'text-green-600';
    if (accuracy >= 0.85) return 'text-blue-600';
    if (accuracy >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  };

  const getRiskColor = (impact, probability) => {
    const riskScore = probability * (impact === 'high' ? 3 : impact === 'medium' ? 2 : 1);
    if (riskScore >= 0.6) return 'text-red-600 bg-red-50';
    if (riskScore >= 0.3) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Forecasting Interface</h1>
          <p className="text-gray-500">Intelligent Multi-Agent Demand Prediction System</p>
        </div>
        <div className="flex space-x-3">
          <select 
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white"
          >
            <option value="SENSIO_RED">Sensio Red</option>
            <option value="SENSIO_BLACK">Sensio Black</option>
            <option value="SENSIO_GOLD">Sensio Gold</option>
          </select>
          <select 
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white"
          >
            <option value="UK">UK</option>
            <option value="EU">EU</option>
            <option value="US">US</option>
          </select>
          <Button 
            onClick={onForecast}
            disabled={loading}
            variant="default"
            size="sm"
          >
            <Brain className={`w-4 h-4 mr-2 ${loading ? 'animate-pulse' : ''}`} />
            Generate Forecast
          </Button>
        </div>
      </div>

      {/* AI Agent Status Dashboard */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            AI Agent Status
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">4 agents active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(forecastData.aiAgents).map(([key, agent]) => (
            <Card key={key} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">{agent.name}</h4>
                <Badge className={getAgentStatusColor(agent.status)} size="sm">
                  {agent.status}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Accuracy:</span>
                  <span className={`text-xs font-semibold ${getAccuracyColor(agent.accuracy)}`}>
                    {(agent.accuracy * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Confidence:</span>
                  <span className="text-xs font-semibold">
                    {(agent.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-500">{agent.recommendation}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Forecast Configuration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Forecast Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horizon (days)</label>
            <Input
              type="number"
              value={forecastHorizon}
              onChange={(e) => setForecastHorizon(parseInt(e.target.value))}
              min="7"
              max="365"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confidence Level</label>
            <select
              value={confidenceLevel}
              onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-md bg-white"
            >
              <option value="80">80%</option>
              <option value="90">90%</option>
              <option value="95">95%</option>
              <option value="99">99%</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AI Model</label>
            <select
              value={agentMode}
              onChange={(e) => setAgentMode(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-white"
            >
              <option value="ensemble">Ensemble AI</option>
              <option value="demandPredictor">Demand Predictor</option>
              <option value="riskAssessment">Risk Assessment</option>
              <option value="marketIntelligence">Market Intelligence</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => setShowExplanations(!showExplanations)}
              variant="outline"
              className="w-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showExplanations ? 'Hide' : 'Show'} Explanations
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Forecast Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <LineChart className="w-5 h-5 mr-2" />
            Demand Forecast - {selectedProduct} ({selectedMarket})
          </h3>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-blue-600">
              MAPE: {forecastData.currentForecast.accuracy.mape}%
            </Badge>
            <Badge variant="outline" className="text-green-600">
              R²: {forecastData.currentForecast.accuracy.r2}
            </Badge>
          </div>
        </div>

        <div className="h-80 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData.currentForecast.demand.predicted}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => formatDate(value)}
                formatter={(value, name) => [
                  value.toLocaleString(),
                  name === 'demand' ? 'Predicted' : 
                  name === 'upper' ? 'Upper Bound' : 'Lower Bound'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="upper" 
                stackId="1"
                stroke="none" 
                fill="#dbeafe" 
                fillOpacity={0.3}
              />
              <Area 
                type="monotone" 
                dataKey="lower" 
                stackId="1"
                stroke="none" 
                fill="transparent"
              />
              <Line 
                type="monotone" 
                dataKey="demand" 
                stroke="#2563eb" 
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Predicted</p>
            <p className="text-2xl font-bold text-blue-600">
              {forecastData.currentForecast.demand.totalPredicted.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Trend</p>
            <div className="flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600 mr-1" />
              <span className="text-lg font-semibold text-green-600">
                {forecastData.currentForecast.insights.trendDirection.replace('_', ' ')}
              </span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Seasonality</p>
            <p className="text-lg font-semibold text-purple-600">
              {forecastData.currentForecast.insights.seasonalityStrength}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Volatility</p>
            <p className="text-lg font-semibold text-yellow-600">
              {forecastData.currentForecast.insights.volatilityLevel}
            </p>
          </div>
        </div>
      </Card>

      {/* Scenario Planning */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Layers className="w-5 h-5 mr-2" />
            Scenario Planning
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {forecastData.scenarios.map((scenario, index) => (
            <Card 
              key={index} 
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                scenario.active ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => onScenarioChange && onScenarioChange(scenario)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{scenario.name}</h4>
                <Badge variant={scenario.active ? 'default' : 'outline'}>
                  {(scenario.probability * 100).toFixed(0)}%
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Demand Impact:</span>
                  <span className={`text-xs font-semibold ${
                    scenario.demandAdjustment > 1 ? 'text-green-600' : 
                    scenario.demandAdjustment < 1 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {((scenario.demandAdjustment - 1) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">WC Impact:</span>
                  <span className={`text-xs font-semibold ${
                    scenario.workingCapitalImpact > 0 ? 'text-red-600' : 
                    scenario.workingCapitalImpact < 0 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    £{Math.abs(scenario.workingCapitalImpact).toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Risk Assessment */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Risk Assessment
          </h3>
        </div>

        <div className="space-y-3">
          {forecastData.currentForecast.insights.riskFactors.map((risk, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <Badge className={getRiskColor(risk.impact, risk.probability)} size="sm">
                    {risk.impact} impact
                  </Badge>
                  <span className="font-medium">
                    {risk.factor.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Probability: {(risk.probability * 100).toFixed(1)}%
                </p>
              </div>
              {showExplanations && (
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* AI Explanation Panel */}
      {showExplanations && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            AI Decision Explanation
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900">Model Reasoning</h4>
              <p className="text-sm text-blue-800 mt-1">
                The Ensemble AI model identified {forecastData.currentForecast.insights.seasonalityStrength} seasonality 
                with {forecastData.currentForecast.insights.volatilityLevel} volatility. The forecast incorporates 
                external factors including {forecastData.currentForecast.insights.externalFactors.join(', ')}.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900">Confidence Factors</h4>
              <p className="text-sm text-green-800 mt-1">
                High confidence due to stable historical patterns, consistent lead times, and strong R² correlation 
                of {forecastData.currentForecast.accuracy.r2}. MAPE of {forecastData.currentForecast.accuracy.mape}% 
                indicates reliable prediction accuracy.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AIForecastingInterface;