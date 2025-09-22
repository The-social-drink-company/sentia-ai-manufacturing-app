import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Users, 
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  Brain,
  Download,
  Upload,
  Settings,
  Bell,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Sample data for demonstrations
const cashFlowData = [
  { month: 'Jan', actual: 45000, projected: 42000, optimized: 48000 },
  { month: 'Feb', actual: 52000, projected: 50000, optimized: 58000 },
  { month: 'Mar', actual: 48000, projected: 46000, optimized: 55000 },
  { month: 'Apr', actual: 61000, projected: 58000, optimized: 68000 },
  { month: 'May', actual: 55000, projected: 52000, optimized: 63000 },
  { month: 'Jun', actual: 67000, projected: 64000, optimized: 75000 },
];

const workingCapitalBreakdown = [
  { name: 'Inventory', value: 45, amount: 180000, color: '#3b82f6' },
  { name: 'Accounts Receivable', value: 35, amount: 140000, color: '#10b981' },
  { name: 'Accounts Payable', value: -25, amount: -100000, color: '#ef4444' },
  { name: 'Cash & Equivalents', value: 45, amount: 180000, color: '#8b5cf6' },
];

const kpiData = [
  { title: 'Cash Conversion Cycle', current: 67, target: 45, improvement: -22, unit: 'days' },
  { title: 'Days Sales Outstanding', current: 42, target: 35, improvement: -7, unit: 'days' },
  { title: 'Days Inventory Outstanding', current: 38, target: 28, improvement: -10, unit: 'days' },
  { title: 'Days Payable Outstanding', current: 13, target: 18, improvement: 5, unit: 'days' },
];

const EnterpriseDashboard = ({ user }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('6months');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold">📊</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Sentia Manufacturing Dashboard</h1>
                <p className="text-gray-300">Enterprise Working Capital Intelligence</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                <Bell className="w-4 h-4 mr-2" />
                Alerts
              </Button>
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold">{user?.firstName?.[0] || 'U'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <motion.div 
        className="max-w-7xl mx-auto px-6 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Key Metrics Cards */}
        <motion.div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 mb-8" variants={itemVariants}>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <Badge variant="secondary" className="bg-green-600/20 text-green-200 border-green-400/30">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +12.5%
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-gray-300 text-sm">90-Day Cash Unlock</p>
                <p className="text-3xl font-bold text-green-400">£83,000</p>
                <p className="text-xs text-gray-400">vs. £74,000 last quarter</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <Badge variant="secondary" className="bg-blue-600/20 text-blue-200 border-blue-400/30">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +18.2%
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-gray-300 text-sm">Annual Improvement</p>
                <p className="text-3xl font-bold text-blue-400">£334,000</p>
                <p className="text-xs text-gray-400">Projected annual benefit</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-400" />
                </div>
                <Badge variant="secondary" className="bg-purple-600/20 text-purple-200 border-purple-400/30">
                  <ArrowDownRight className="w-3 h-3 mr-1" />
                  -46 days
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-gray-300 text-sm">Cash Conversion Cycle</p>
                <p className="text-3xl font-bold text-purple-400">67 → 21</p>
                <p className="text-xs text-gray-400">Days improvement target</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-600/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-orange-400" />
                </div>
                <Badge variant="secondary" className="bg-orange-600/20 text-orange-200 border-orange-400/30">
                  <Zap className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-gray-300 text-sm">Optimization Score</p>
                <p className="text-3xl font-bold text-orange-400">87%</p>
                <p className="text-xs text-gray-400">vs. industry average 64%</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Dashboard Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-sm border-white/20">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white/20">Overview</TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-white/20">Analytics</TabsTrigger>
              <TabsTrigger value="insights" className="data-[state=active]:bg-white/20">AI Insights</TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-white/20">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Cash Flow Projection */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Cash Flow Projection</span>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                          <Filter className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={cashFlowData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
                        <YAxis stroke="rgba(255,255,255,0.7)" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px'
                          }} 
                        />
                        <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} />
                        <Line type="monotone" dataKey="projected" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="optimized" stroke="#8b5cf6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Working Capital Breakdown */}
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                  <CardHeader>
                    <CardTitle>Working Capital Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={workingCapitalBreakdown}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {workingCapitalBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* KPI Performance */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader>
                  <CardTitle>Key Performance Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {kpiData.map((kpi, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">{kpi.title}</h4>
                          <Badge 
                            variant="secondary" 
                            className={`${
                              kpi.improvement < 0 
                                ? 'bg-green-600/20 text-green-200 border-green-400/30' 
                                : 'bg-orange-600/20 text-orange-200 border-orange-400/30'
                            }`}
                          >
                            {kpi.improvement > 0 ? '+' : ''}{kpi.improvement} {kpi.unit}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Current: {kpi.current} {kpi.unit}</span>
                            <span className="text-gray-300">Target: {kpi.target} {kpi.unit}</span>
                          </div>
                          <Progress 
                            value={(kpi.target / kpi.current) * 100} 
                            className="h-2 bg-white/10" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 mt-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardContent className="p-8 text-center">
                  <BarChart3 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
                  <p className="text-gray-300 mb-4">
                    Comprehensive financial analytics and benchmarking tools are being loaded.
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Brain className="w-4 h-4 mr-2" />
                    Initialize Analytics Engine
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6 mt-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardContent className="p-8 text-center">
                  <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">AI-Powered Insights</h3>
                  <p className="text-gray-300 mb-4">
                    Machine learning models are analyzing your data to provide intelligent recommendations.
                  </p>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Insights
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6 mt-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardContent className="p-8 text-center">
                  <Download className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Enterprise Reports</h3>
                  <p className="text-gray-300 mb-4">
                    Generate comprehensive reports for board presentations and stakeholder communications.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Download className="w-4 h-4 mr-2" />
                      Executive Summary
                    </Button>
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default EnterpriseDashboard;
