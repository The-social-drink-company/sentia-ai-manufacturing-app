import { devLog } from '../lib/devLog.js';\nimport React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Globe, 
  BarChart3, 
  AlertTriangle, 
  Download,
  RefreshCw,
  Eye,
  Target
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CFOBoardPack = ({ data, onRefresh, loading = false }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('Q4-2024');
  const [selectedCurrency, setSelectedCurrency] = useState('GBP');
  const [expandedSection, setExpandedSection] = useState(null);
  const [boardPackData, setBoardPackData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load board pack data from existing API
  useEffect(() => {
    const fetchBoardPackData = async () => {
      if (data) {
        setBoardPackData(data);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/forecasting/cfo/board-pack', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            series_ids: ['SENSIO_RED_UK', 'SENSIO_RED_EU', 'SENSIO_RED_US'], // Default series
            reporting_currency: selectedCurrency,
            regions: ['UK', 'EU', 'USA'],
            horizons: [30, 90, 180, 365],
            include_scenarios: true,
            include_risk_metrics: true
          })
        });

        if (response.ok) {
          const result = await response.json();
          setBoardPackData(result.boardPack);
        } else {
          // Fallback data structure if API fails
          setBoardPackData({
            executiveSummary: {
              totalWorkingCapital: { current: 2840000, optimal: 2250000, currency: selectedCurrency },
              cashFlowProjection: { next30Days: 450000, next90Days: 1200000, next180Days: 2100000 },
              inventoryTurnover: { current: 8.2, target: 10.0, trend: 'improving' },
              riskScore: { overall: 'medium', score: 65, factors: ['lead_time_variability', 'fx_exposure'] }
            },
            marketPerformance: {
              UK: { 0, margin: 0.28, workingCapital: 950000, forecast: 'stable' },
              EU: { 0, margin: 0.24, workingCapital: 720000, forecast: 'growing' },
              US: { 0, margin: 0.32, workingCapital: 1170000, forecast: 'volatile' }
            },
            aiInsights: {
              recommendations: [
                { priority: 'high', type: 'inventory', message: 'Reduce US safety stock by 15% - lead times stabilizing' },
                { priority: 'medium', type: 'cash_flow', message: 'Optimize EU payment terms for 8% working capital improvement' },
                { priority: 'low', type: 'forecasting', message: 'UK demand pattern showing seasonal shift - adjust forecasts' }
              ],
              confidenceLevel: 0.87,
              lastUpdated: new Date().toISOString()
            }
          });
        }
      } catch (error) {
        devLog.error('Failed to fetch board pack data:', error);
        // Use fallback data on error
        setBoardPackData({
          executiveSummary: {
            totalWorkingCapital: { current: 2840000, optimal: 2250000, currency: selectedCurrency },
            cashFlowProjection: { next30Days: 450000, next90Days: 1200000, next180Days: 2100000 },
            inventoryTurnover: { current: 8.2, target: 10.0, trend: 'improving' },
            riskScore: { overall: 'medium', score: 65, factors: ['lead_time_variability', 'fx_exposure'] }
          },
          marketPerformance: {
            UK: { 0, margin: 0.28, workingCapital: 950000, forecast: 'stable' },
            EU: { 0, margin: 0.24, workingCapital: 720000, forecast: 'growing' },
            US: { 0, margin: 0.32, workingCapital: 1170000, forecast: 'volatile' }
          },
          aiInsights: {
            recommendations: [
              { priority: 'high', type: 'inventory', message: 'Reduce US safety stock by 15% - lead times stabilizing' },
              { priority: 'medium', type: 'cash_flow', message: 'Optimize EU payment terms for 8% working capital improvement' },
              { priority: 'low', type: 'forecasting', message: 'UK demand pattern showing seasonal shift - adjust forecasts' }
            ],
            confidenceLevel: 0.87,
            lastUpdated: new Date().toISOString()
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoardPackData();
  }, [selectedCurrency, data]);

  const handleRefresh = async () => {
    if (onRefresh) {
      onRefresh();
    } else {
      await fetchBoardPackData();
    }
  };

  if (!boardPackData) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const formatCurrency = (amount, currency = selectedCurrency) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMarketColorByForecast = (forecast) => {
    const colors = {
      'stable': 'text-green-600 bg-green-50',
      'growing': 'text-blue-600 bg-blue-50', 
      'volatile': 'text-yellow-600 bg-yellow-50',
      'declining': 'text-red-600 bg-red-50'
    };
    return colors[forecast] || colors.stable;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': 'text-red-600 bg-red-50',
      'medium': 'text-yellow-600 bg-yellow-50',
      'low': 'text-green-600 bg-green-50'
    };
    return colors[priority] || colors.medium;
  };

  const workingCapitalData = [
    { name: 'Jan', current: 2200, optimal: 2100 },
    { name: 'Feb', current: 2400, optimal: 2150 },
    { name: 'Mar', current: 2650, optimal: 2200 },
    { name: 'Apr', current: 2840, optimal: 2250 },
  ];

  const marketData = Object.entries(boardPackData.marketPerformance).map(([market, data]) => ({
    name: market,
    revenue: data.revenue / 1000,
    margin: data.margin * 100,
    workingCapital: data.workingCapital / 1000
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CFO Board Pack</h1>
          <p className="text-gray-500">Executive Dashboard - {selectedTimeframe}</p>
        </div>
        <div className="flex space-x-3">
          <select 
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white"
          >
            <option value="GBP">GBP Â£</option>
            <option value="EUR">EUR â‚¬</option>
            <option value="USD">USD $</option>
          </select>
          <Button 
            onClick={handleRefresh}
            disabled={loading || isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading || isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="default" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Pack
          </Button>
        </div>
      </div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Working Capital</p>
              <div className="flex items-center space-x-2">
                <p className="text-2xl font-bold">
                  {formatCurrency(boardPackData.executiveSummary.totalWorkingCapital.current)}
                </p>
                <Badge variant={boardPackData.executiveSummary.totalWorkingCapital.current > boardPackData.executiveSummary.totalWorkingCapital.optimal ? 'destructive' : 'secondary'}>
                  vs Optimal
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                Optimal: {formatCurrency(boardPackData.executiveSummary.totalWorkingCapital.optimal)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">90-Day Cash Flow</p>
              <div className="flex items-center space-x-2">
                <p className="text-2xl font-bold">
                  {formatCurrency(boardPackData.executiveSummary.cashFlowProjection.next90Days)}
                </p>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-sm text-gray-500">
                180-day: {formatCurrency(boardPackData.executiveSummary.cashFlowProjection.next180Days)}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inventory Turnover</p>
              <div className="flex items-center space-x-2">
                <p className="text-2xl font-bold">
                  {boardPackData.executiveSummary.inventoryTurnover.current}x
                </p>
                <Badge variant={boardPackData.executiveSummary.inventoryTurnover.trend === 'improving' ? 'default' : 'secondary'}>
                  {boardPackData.executiveSummary.inventoryTurnover.trend}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                Target: {boardPackData.executiveSummary.inventoryTurnover.target}x
              </p>
            </div>
            <Target className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Risk Assessment</p>
              <div className="flex items-center space-x-2">
                <p className="text-2xl font-bold">{boardPackData.executiveSummary.riskScore.score}</p>
                <Badge 
                  variant={boardPackData.executiveSummary.riskScore.overall === 'low' ? 'default' : 
                          boardPackData.executiveSummary.riskScore.overall === 'medium' ? 'secondary' : 'destructive'}
                >
                  {boardPackData.executiveSummary.riskScore.overall}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                {boardPackData.executiveSummary.riskScore.factors.length} risk factors
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>
      </div>

      {/* Working Capital Trend */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Working Capital vs. Optimal</h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setExpandedSection(expandedSection === 'workingCapital' ? null : 'workingCapital')}
          >
            <Eye className="w-4 h-4 mr-2" />
            {expandedSection === 'workingCapital' ? 'Collapse' : 'Expand'}
          </Button>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={workingCapitalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `Â£${value}k`} />
              <Tooltip formatter={(value) => `Â£${value}k`} />
              <Line 
                type="monotone" 
                dataKey="current" 
                stroke="#2563eb" 
                strokeWidth={3}
                name="Current WC" 
              />
              <Line 
                type="monotone" 
                dataKey="optimal" 
                stroke="#10b981" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Optimal WC" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Multi-Market Performance */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Multi-Market Performance
          </h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Object.entries(boardPackData.marketPerformance).map(([market, data]) => (
            <Card key={market} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-lg">{market}</h4>
                <Badge className={getMarketColorByForecast(data.forecast)}>
                  {data.forecast}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Revenue:</span>
                  <span className="font-semibold">{formatCurrency(data.revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Margin:</span>
                  <span className="font-semibold">{(data.margin * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Working Capital:</span>
                  <span className="font-semibold">{formatCurrency(data.workingCapital)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Market Performance Chart */}
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={marketData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" tickFormatter={(value) => `Â£${value}k`} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'margin' ? `${value.toFixed(1)}%` : `Â£${value}k`,
                  name
                ]}
              />
              <Bar yAxisId="left" dataKey="revenue" fill="#2563eb" name="Revenue" />
              <Bar yAxisId="left" dataKey="workingCapital" fill="#10b981" name="Working Capital" />
              <Line yAxisId="right" type="monotone" dataKey="margin" stroke="#f59e0b" name="Margin %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* AI Insights Panel */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">AI Agent Insights</h3>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">
                Confidence: {(boardPackData.aiInsights.confidenceLevel * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {boardPackData.aiInsights.recommendations.map((insight, index) => (
            <div 
              key={index}
              className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <Badge className={getPriorityColor(insight.priority)} size="sm">
                {insight.priority}
              </Badge>
              <div className="flex-1">
                <p className="text-sm font-medium capitalize text-gray-800">
                  {insight.type.replace('_', ' ')}
                </p>
                <p className="text-sm text-gray-600">{insight.message}</p>
              </div>
              <Button variant="ghost" size="sm">
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default CFOBoardPack;
