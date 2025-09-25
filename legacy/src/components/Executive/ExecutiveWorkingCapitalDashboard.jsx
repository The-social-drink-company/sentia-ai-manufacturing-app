import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  Brain,
  Users,
  Building2
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';
import { format, addDays, parseISO } from 'date-fns';
import { logDebug, logInfo, logWarn, logError } from '../../utils/logger';


const ExecutiveWorkingCapitalDashboard = () => {
  // Authentication removed
  const user = { name: "User" };
  const isSignedIn = true;
  const isLoaded = true;
  const [activeTab, setActiveTab] = useState('overview');
  const [timeHorizon, setTimeHorizon] = useState('90');
  const [growthRate, setGrowthRate] = useState([15]);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch dashboard data
  useEffect(() => {
    if (isLoaded && user) {
      fetchDashboardData();
    }
  }, [isLoaded, user, timeHorizon, growthRate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all required data in parallel
      const [cashRunway, optimization, benchmarks, fundingReqs] = await Promise.all([
        fetch(`/api/working-capital-intelligence/cash-runway?timeHorizon=${timeHorizon}&includeSeasonality=true&confidenceLevel=moderate`).then(r => r.json()),
        fetch('/api/working-capital-intelligence/optimization?industryBenchmark=true&optimizationGoal=cash_unlock').then(r => r.json()),
        fetch('/api/working-capital-intelligence/industry-benchmarks?region=UK').then(r => r.json()),
        fetch('/api/working-capital-intelligence/funding-requirements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            growthRate: growthRate[0],
            timeframe: 'year',
            fundingType: 'both',
            includeSeasonality: true
          })
        }).then(r => r.json())
      ]);

      setDashboardData({
        cashRunway,
        optimization,
        benchmarks,
        fundingRequirements: fundingReqs
      });
      
    } catch (err) {
      logError('Dashboard data fetch error:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    if (!dashboardData) return null;

    const { cashRunway, optimization, benchmarks, fundingRequirements } = dashboardData;
    
    return {
      cashRunwayDays: cashRunway.summary.cashRunwayDays,
      currentCash: cashRunway.summary.currentCash,
      cashUnlockPotential: optimization.summary.cashUnlockPotential,
      fundingRequired: fundingRequirements.summary.totalFundingRequired,
      riskLevel: cashRunway.summary.riskLevel,
      workingCapitalEfficiency: benchmarks.competitivePosition?.efficiency || 'average',
      implementationTimeframe: optimization.summary.implementationTimeframe
    };
  }, [dashboardData]);

  // Generate board-ready talking points
  const boardTalkingPoints = useMemo(() => {
    if (!dashboardData) return [];

    const { optimization, fundingRequirements } = dashboardData;
    
    return [
      `Potential to unlock Â£${(optimization.summary.cashUnlockPotential / 1000).toFixed(0)}K in working capital within ${optimization.summary.implementationTimeframe} days`,
      `${fundingRequirements.summary.timeframe} funding requirement of Â£${(fundingRequirements.summary.totalFundingRequired / 1000).toFixed(0)}K for ${fundingRequirements.summary.growthRate}% growth`,
      `Working capital efficiency improvement of ${((optimization.summary.cashUnlockPotential / optimization.currentMetrics.workingCapital) * 100).toFixed(1)}% of current working capital`,
      `Cash conversion cycle optimization potential: ${optimization.optimizationOpportunities?.cccImprovement || 'TBD'} days`
    ];
  }, [dashboardData]);

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading executive dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Dashboard Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!keyMetrics) {
    return (
      <Alert className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Data Available</AlertTitle>
        <AlertDescription>Unable to load dashboard metrics. Please check your data connections.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Executive Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Working Capital Intelligence</h1>
            <p className="text-gray-600 mt-1">Executive Financial Decision Support</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={keyMetrics.riskLevel === 'low' ? 'success' : keyMetrics.riskLevel === 'medium' ? 'warning' : 'destructive'}>
              {keyMetrics.riskLevel.toUpperCase()} RISK
            </Badge>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="text-sm font-medium">{format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cash Runway</p>
                  <p className="text-2xl font-bold text-gray-900">{keyMetrics.cashRunwayDays} days</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Current cash: Â£{(keyMetrics.currentCash / 1000).toFixed(0)}K
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cash Unlock Potential</p>
                  <p className="text-2xl font-bold text-green-600">Â£{(keyMetrics.cashUnlockPotential / 1000).toFixed(0)}K</p>
                </div>
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Within {keyMetrics.implementationTimeframe} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Growth Funding</p>
                  <p className="text-2xl font-bold text-purple-600">Â£{(keyMetrics.fundingRequired / 1000).toFixed(0)}K</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                For {growthRate[0]}% growth
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">WC Efficiency</p>
                  <p className="text-2xl font-bold text-orange-600 capitalize">{keyMetrics.workingCapitalEfficiency}</p>
                </div>
                <Target className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                vs Industry benchmark
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cash-runway">Cash Runway</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="board-ready">Board Ready</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cash Flow Forecast Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="h-5 w-5 mr-2" />
                  Cash Flow Forecast
                </CardTitle>
                <CardDescription>
                  {timeHorizon}-day cash position projection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <label className="text-sm font-medium">Time Horizon: {timeHorizon} days</label>
                  <Select value={timeHorizon} onValueChange={setTimeHorizon}>
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="120">120 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={dashboardData?.cashRunway?.forecast || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(parseISO(date), 'MMM dd')}
                    />
                    <YAxis 
                      tickFormatter={(value) => `Â£${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip 
                      formatter={(value) => [`Â£${value.toLocaleString()}`, 'Cash Balance']}
                      labelFormatter={(date) => format(parseISO(date), 'MMM dd, yyyy')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="closingBalance" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Working Capital Optimization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Working Capital Levers
                </CardTitle>
                <CardDescription>
                  Optimization opportunities and impact
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.optimization?.optimizationOpportunities && Object.entries(dashboardData.optimization.optimizationOpportunities).map(([key, opportunity]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="text-sm text-gray-600">{opportunity.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">Â£{(opportunity.impact / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-gray-500">{opportunity.timeframe} days</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                AI-Powered Insights
              </CardTitle>
              <CardDescription>
                Intelligent analysis and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="whitespace-pre-line text-gray-700">
                  {dashboardData?.cashRunway?.insights || 'Generating insights...'}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Runway Tab */}
        <TabsContent value="cash-runway" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Cash Flow Analysis</CardTitle>
                  <CardDescription>
                    Daily cash position with inflows and outflows
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RechartsLineChart data={dashboardData?.cashRunway?.forecast || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => format(parseISO(date), 'MMM dd')}
                      />
                      <YAxis 
                        tickFormatter={(value) => `Â£${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip 
                        formatter={(value, name) => [`Â£${value.toLocaleString()}`, name]}
                        labelFormatter={(date) => format(parseISO(date), 'MMM dd, yyyy')}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="closingBalance" 
                        stroke="#2563eb" 
                        strokeWidth={2}
                        name="Cash Balance"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="inflows" 
                        stroke="#16a34a" 
                        strokeWidth={1}
                        name="Inflows"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="outflows" 
                        stroke="#dc2626" 
                        strokeWidth={1}
                        name="Outflows"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Critical Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Critical Dates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData?.cashRunway?.criticalDates?.map((date, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 bg-yellow-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <div>
                          <p className="font-medium text-sm">{date.description}</p>
                          <p className="text-xs text-gray-600">{format(parseISO(date.date), 'MMM dd, yyyy')}</p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-sm">No critical dates identified</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Risk</span>
                      <Badge variant={keyMetrics.riskLevel === 'low' ? 'success' : keyMetrics.riskLevel === 'medium' ? 'warning' : 'destructive'}>
                        {keyMetrics.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                    
                    {dashboardData?.cashRunway?.riskAssessment?.factors?.map((factor, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded">
                        <p className="text-sm font-medium">{factor.name}</p>
                        <p className="text-xs text-gray-600">{factor.description}</p>
                        <Progress value={factor.impact * 20} className="mt-1" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current vs Optimized Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Working Capital Metrics</CardTitle>
                <CardDescription>Current performance vs optimization targets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Days Sales Outstanding (DSO)', current: dashboardData?.optimization?.currentMetrics?.dso, target: 25, unit: 'days' },
                    { label: 'Days Payable Outstanding (DPO)', current: dashboardData?.optimization?.currentMetrics?.dpo, target: 45, unit: 'days' },
                    { label: 'Inventory Turns', current: dashboardData?.optimization?.currentMetrics?.inventoryTurns, target: 15, unit: 'turns/year' },
                    { label: 'Cash Conversion Cycle', current: dashboardData?.optimization?.currentMetrics?.cashConversionCycle, target: 20, unit: 'days' }
                  ].map((metric, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{metric.label}</span>
                        <span className="text-sm text-gray-600">
                          {metric.current} â†’ {metric.target} {metric.unit}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((metric.target / metric.current) * 100, 100)} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Implementation Roadmap */}
            <Card>
              <CardHeader>
                <CardTitle>Implementation Roadmap</CardTitle>
                <CardDescription>Priority actions and timeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.optimization?.implementationRoadmap?.priorityActions?.map((action, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{action.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-xs">
                            {action.timeframe} days
                          </Badge>
                          <span className="text-xs font-medium text-green-600">
                            Â£{(action.impact / 1000).toFixed(0)}K impact
                          </span>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-sm">Loading implementation roadmap...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Growth Scenario Planning</CardTitle>
              <CardDescription>
                Model different growth rates and their funding requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium">Growth Rate: {growthRate[0]}%</label>
                  <Slider
                    value={growthRate}
                    onValueChange={setGrowthRate}
                    max={100}
                    min={-20}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Working Capital Increase</p>
                        <p className="text-2xl font-bold text-blue-600">
                          Â£{((dashboardData?.fundingRequirements?.workingCapitalRequirements?.increase || 0) / 1000).toFixed(0)}K
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Total Funding Required</p>
                        <p className="text-2xl font-bold text-purple-600">
                          Â£{((dashboardData?.fundingRequirements?.summary?.totalFundingRequired || 0) / 1000).toFixed(0)}K
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Recommended Funding</p>
                        <p className="text-lg font-bold text-green-600 capitalize">
                          {dashboardData?.fundingRequirements?.fundingScenarios?.recommended?.type || 'Mixed'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Funding Scenarios */}
                <div className="space-y-4">
                  <h4 className="font-medium">Funding Options Analysis</h4>
                  {dashboardData?.fundingRequirements?.fundingScenarios?.options?.map((option, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium capitalize">{option.type}</h5>
                        <Badge variant={option.recommended ? 'default' : 'outline'}>
                          {option.recommended ? 'Recommended' : 'Alternative'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-medium">Â£{(option.amount / 1000).toFixed(0)}K</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Cost</p>
                          <p className="font-medium">{option.cost}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Timeline</p>
                          <p className="font-medium">{option.timeline}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Dilution</p>
                          <p className="font-medium">{option.dilution || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-sm">Loading funding scenarios...</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Board Ready Tab */}
        <TabsContent value="board-ready" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Board-Ready Executive Summary
              </CardTitle>
              <CardDescription>
                Key talking points and strategic recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Key Talking Points */}
                <div>
                  <h4 className="font-medium mb-3">Key Talking Points</h4>
                  <div className="space-y-2">
                    {boardTalkingPoints.map((point, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategic Recommendations */}
                <div>
                  <h4 className="font-medium mb-3">Strategic Recommendations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Immediate Actions (0-30 days)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start space-x-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span>Implement automated invoice follow-up system</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span>Negotiate extended payment terms with top 5 suppliers</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span>Review and optimize inventory levels</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Strategic Initiatives (30-90 days)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start space-x-2">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span>Implement supply chain financing program</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span>Establish revolving credit facility for growth</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span>Deploy AI-powered demand forecasting</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="p-6 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-3">Executive Summary</h4>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <p>
                      Our working capital analysis reveals significant opportunities to optimize cash flow and support strategic growth initiatives. 
                      Through targeted improvements in receivables management, payables optimization, and inventory efficiency, we can unlock 
                      Â£{(keyMetrics.cashUnlockPotential / 1000).toFixed(0)}K in working capital within {keyMetrics.implementationTimeframe} days.
                    </p>
                    <p className="mt-3">
                      For our planned {growthRate[0]}% growth trajectory, we require Â£{(keyMetrics.fundingRequired / 1000).toFixed(0)}K in additional funding. 
                      The recommended approach combines working capital optimization with strategic financing to minimize dilution while maintaining 
                      operational flexibility.
                    </p>
                    <p className="mt-3">
                      Implementation of these recommendations will improve our competitive position, enhance financial resilience, and create 
                      sustainable value for stakeholders while supporting our growth objectives.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExecutiveWorkingCapitalDashboard;

