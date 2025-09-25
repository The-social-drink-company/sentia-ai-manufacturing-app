/**
 * Executive-Level KPI Dashboard with Drill-Down Analytics
 * Enterprise-grade executive dashboard for C-suite and senior management
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Package,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  RefreshCw,
  Download,
  Share,
  Settings,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell
} from 'recharts';

// Executive KPI Configuration
const EXECUTIVE_KPIS = {
  financial: {
    title: 'Financial Performance',
    icon: DollarSign,
    color: '#10B981',
    metrics: [
      {
        id: 'revenue',
        name: 'Revenue',
        format: 'currency',
        target: 50000000,
        critical: 40000000,
        drillDown: ['monthly', 'product', 'region', 'customer']
      },
      {
        id: 'ebitda',
        name: 'EBITDA',
        format: 'currency',
        target: 12500000,
        critical: 8000000,
        drillDown: ['monthly', 'segment', 'cost_center']
      },
      {
        id: 'cash_flow',
        name: 'Operating Cash Flow',
        format: 'currency',
        target: 8000000,
        critical: 5000000,
        drillDown: ['weekly', 'source', 'forecast']
      },
      {
        id: 'working_capital',
        name: 'Working Capital',
        format: 'currency',
        target: 15000000,
        critical: 10000000,
        drillDown: ['components', 'aging', 'trends']
      }
    ]
  },
  operational: {
    title: 'Operational Excellence',
    icon: BarChart3,
    color: '#3B82F6',
    metrics: [
      {
        id: 'production_efficiency',
        name: 'Production Efficiency',
        format: 'percentage',
        target: 0.95,
        critical: 0.85,
        drillDown: ['line', 'shift', 'product', 'downtime']
      },
      {
        id: 'quality_rate',
        name: 'Quality Rate',
        format: 'percentage',
        target: 0.99,
        critical: 0.95,
        drillDown: ['defect_type', 'line', 'supplier', 'root_cause']
      },
      {
        id: 'inventory_turnover',
        name: 'Inventory Turnover',
        format: 'number',
        target: 8,
        critical: 4,
        drillDown: ['category', 'aging', 'velocity', 'obsolescence']
      },
      {
        id: 'on_time_delivery',
        name: 'On-Time Delivery',
        format: 'percentage',
        target: 0.98,
        critical: 0.92,
        drillDown: ['customer', 'product', 'region', 'delays']
      }
    ]
  },
  strategic: {
    title: 'Strategic Objectives',
    icon: Target,
    color: '#8B5CF6',
    metrics: [
      {
        id: 'market_share',
        name: 'Market Share',
        format: 'percentage',
        target: 0.15,
        critical: 0.12,
        drillDown: ['segment', 'competitor', 'trends', 'opportunities']
      },
      {
        id: 'customer_satisfaction',
        name: 'Customer Satisfaction',
        format: 'score',
        target: 4.5,
        critical: 3.8,
        drillDown: ['segment', 'touchpoint', 'feedback', 'actions']
      },
      {
        id: 'employee_engagement',
        name: 'Employee Engagement',
        format: 'score',
        target: 4.2,
        critical: 3.5,
        drillDown: ['department', 'level', 'drivers', 'initiatives']
      },
      {
        id: 'innovation_index',
        name: 'Innovation Index',
        format: 'score',
        target: 4.0,
        critical: 3.0,
        drillDown: ['projects', 'pipeline', 'investment', 'outcomes']
      }
    ]
  }
};

const CHART_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

export default function ExecutiveKPIDashboard() {
  const [selectedCategory, setSelectedCategory] = useState('financial');
  const [selectedTimeframe, setSelectedTimeframe] = useState('monthly');
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [drillDownLevel, setDrillDownLevel] = useState(0);
  const [isRealTime, setIsRealTime] = useState(true);

  // Fetch executive KPI data
  const { data: kpiData, isLoading, refetch } = useQuery({
    queryKey: ['executive-kpis', selectedCategory, selectedTimeframe],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/executive-kpis?category=${selectedCategory}&timeframe=${selectedTimeframe}`);
      if (!response.ok) throw new Error('Failed to fetch KPI data');
      return response.json();
    },
    refetchInterval: isRealTime ? 60000 : false, // Refresh every minute if real-time
    staleTime: 30000
  });

  // Calculate overall performance score
  const performanceScore = useMemo(() => {
    if (!kpiData?.metrics) return 0;
    
    const scores = Object.values(kpiData.metrics).map(metric => {
      const target = EXECUTIVE_KPIS[selectedCategory]?.metrics.find(m => m.id === metric.id)?.target || 1;
      return Math.min((metric.current / target) * 100, 150); // Cap at 150%
    });
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }, [kpiData, selectedCategory]);

  // Get performance status
  const getPerformanceStatus = (current, target, critical) => {
    const ratio = current / target;
    if (ratio >= 1) return { status: 'excellent', color: '#10B981', icon: CheckCircle };
    if (ratio >= 0.9) return { status: 'good', color: '#3B82F6', icon: TrendingUp };
    if (ratio >= (critical / target)) return { status: 'warning', color: '#F59E0B', icon: Clock };
    return { status: 'critical', color: '#EF4444', icon: AlertTriangle };
  };

  // Format values based on type
  const formatValue = (value, format) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(value);
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'score':
        return value.toFixed(1);
      case 'number':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  // Handle drill-down navigation
  const handleDrillDown = (metric, dimension = null) => {
    setSelectedMetric(metric);
    if (dimension) {
      setDrillDownLevel(prev => prev + 1);
    } else {
      setDrillDownLevel(0);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg font-medium">Loading executive dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time business intelligence for strategic decision making</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <Badge 
            variant={performanceScore >= 100 ? 'default' : performanceScore >= 80 ? 'secondary' : 'destructive'}
            className="px-3 py-1"
          >
            Performance: {performanceScore.toFixed(0)}%
          </Badge>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={isRealTime ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsRealTime(!isRealTime)}
            >
              <Zap className="w-4 h-4 mr-1" />
              Real-time
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
            </Button>
            
            <Button variant="outline" size="sm">
              <Share className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-3">
          {Object.entries(EXECUTIVE_KPIS).map(([key, category]) => {
            const IconComponent = category.icon;
            return (
              <TabsTrigger key={key} value={key} className="flex items-center space-x-2">
                <IconComponent className="w-4 h-4" />
                <span>{category.title}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(EXECUTIVE_KPIS).map(([key, category]) => (
          <TabsContent key={key} value={key} className="space-y-6">
            {/* KPI Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {category.metrics.map((metric) => {
                const currentValue = kpiData?.metrics?.[metric.id]?.current || 0;
                const previousValue = kpiData?.metrics?.[metric.id]?.previous || 0;
                const change = previousValue ? ((currentValue - previousValue) / previousValue) * 100 : 0;
                const status = getPerformanceStatus(currentValue, metric.target, metric.critical);
                const IconComponent = status.icon;
                
                return (
                  <motion.div
                    key={metric.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: category.metrics.indexOf(metric) * 0.1 }}
                  >
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4"
                      style={{ borderLeftColor: status.color }}
                      onClick={() => handleDrillDown(metric)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium text-gray-600">
                            {metric.name}
                          </CardTitle>
                          <IconComponent 
                            className="w-5 h-5" 
                            style={{ color: status.color }}
                          />
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-bold text-gray-900">
                              {formatValue(currentValue, metric.format)}
                            </div>
                            <div className={`flex items-center text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                              {Math.abs(change).toFixed(1)}%
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>vs Target</span>
                              <span>{formatValue(metric.target, metric.format)}</span>
                            </div>
                            <Progress 
                              value={Math.min((currentValue / metric.target) * 100, 100)} 
                              className="h-2"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <Badge variant="outline" className="text-xs">
                              {status.status.toUpperCase()}
                            </Badge>
                            <span className="text-gray-500">
                              Click for details
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Trend Analysis Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Performance Trends</CardTitle>
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedTimeframe}
                      onChange={(e) => setSelectedTimeframe(e.target.value)}
                      className="px-3 py-1 border rounded-md text-sm"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                    <Filter className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpiData?.trends || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {category.metrics.map((metric, index) => (
                        <Line
                          key={metric.id}
                          type="monotone"
                          dataKey={metric.id}
                          stroke={CHART_COLORS[index % CHART_COLORS.length]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Insights and Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Key Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="w-5 h-5 mr-2" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {kpiData?.insights?.slice(0, 3).map((insight, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`p-1 rounded-full ${
                          insight.type === 'positive' ? 'bg-green-100 text-green-600' :
                          insight.type === 'negative' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {insight.type === 'positive' ? <TrendingUp className="w-4 h-4" /> :
                           insight.type === 'negative' ? <TrendingDown className="w-4 h-4" /> :
                           <BarChart3 className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Action Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Recommended Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {kpiData?.recommendations?.slice(0, 4).map((recommendation, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className={`p-1 rounded-full ${
                          recommendation.priority === 'high' ? 'bg-red-100 text-red-600' :
                          recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{recommendation.action}</p>
                          <p className="text-xs text-gray-500">
                            {recommendation.impact} â€¢ {recommendation.timeframe}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Drill-Down Modal */}
      <AnimatePresence>
        {selectedMetric && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedMetric(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedMetric.name} - Detailed Analysis
                  </h2>
                  <Button variant="outline" onClick={() => setSelectedMetric(null)}>
                    Close
                  </Button>
                </div>
                
                {/* Drill-down content would go here */}
                <div className="text-center py-12 text-gray-500">
                  Detailed drill-down analytics for {selectedMetric.name}
                  <br />
                  <small>Integration with detailed analytics engine coming soon</small>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
