import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import Sidebar from './Sidebar';
import EnterpriseDashboard from './EnterpriseDashboard';
import WorkingCapitalCalculator from './WorkingCapitalCalculator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Brain, 
  Target, 
  Database, 
  FileText, 
  Settings, 
  HelpCircle,
  LogOut,
  Zap,
  Download,
  Upload,
  Users,
  Shield
} from 'lucide-react';

const EnhancedEnterpriseDashboard = () => {
  const { user } = useUser();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardOverview user={user} />;
      case 'calculator':
        return <WorkingCapitalCalculator />;
      case 'analytics':
        return <AnalyticsView />;
      case 'forecasting':
        return <ForecastingView />;
      case 'insights':
        return <InsightsView />;
      case 'benchmarking':
        return <BenchmarkingView />;
      case 'data':
        return <DataManagementView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView user={user} />;
      case 'help':
        return <HelpView />;
      default:
        return <DashboardOverview user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
      />
      
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full overflow-y-auto"
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Dashboard Overview Component
const DashboardOverview = ({ user }) => {
  return (
    <div className="p-8 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.firstName}!</h1>
        <p className="text-blue-200">Here's your working capital intelligence overview</p>
      </div>
      
      <EnterpriseDashboard user={user} />
    </div>
  );
};

// Analytics View Component
const AnalyticsView = () => {
  return (
    <div className="p-8 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Financial Analytics</h1>
        <p className="text-blue-200">Advanced financial analysis and performance metrics</p>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-6 h-6 mr-3" />
              Performance Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <TrendingUp className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Advanced Analytics Engine</h3>
            <p className="text-gray-300 mb-4">
              Comprehensive financial performance analysis with industry benchmarking and trend identification.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Zap className="w-4 h-4 mr-2" />
              Initialize Analytics
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-6 h-6 mr-3" />
              Benchmarking Suite
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <Target className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Industry Benchmarks</h3>
            <p className="text-gray-300 mb-4">
              Compare your performance against industry standards and identify optimization opportunities.
            </p>
            <Button className="bg-green-600 hover:bg-green-700">
              <Target className="w-4 h-4 mr-2" />
              View Benchmarks
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Forecasting View Component
const ForecastingView = () => {
  return (
    <div className="p-8 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cash Flow Forecasting</h1>
        <p className="text-blue-200">12-month projections and scenario planning</p>
      </div>
      
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardContent className="p-12 text-center">
          <TrendingUp className="w-20 h-20 text-purple-400 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold mb-4">Advanced Forecasting Engine</h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Generate sophisticated cash flow forecasts using AI-powered algorithms that analyze historical data, 
            seasonal patterns, and market trends to provide accurate 12-month projections.
          </p>
          <div className="flex justify-center space-x-4">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Brain className="w-4 h-4 mr-2" />
              Generate Forecast
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// AI Insights View Component
const InsightsView = () => {
  return (
    <div className="p-8 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI-Powered Insights</h1>
        <p className="text-blue-200">Machine learning recommendations and optimization</p>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardContent className="p-6 text-center">
            <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h4 className="font-semibold mb-2">Predictive Analytics</h4>
            <p className="text-sm text-gray-300">AI-powered predictions for cash flow optimization</p>
            <Badge variant="secondary" className="mt-2 bg-purple-600/20 text-purple-200 border-purple-400/30">
              Beta
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardContent className="p-6 text-center">
            <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h4 className="font-semibold mb-2">Optimization Engine</h4>
            <p className="text-sm text-gray-300">Automated recommendations for working capital improvement</p>
            <Badge variant="secondary" className="mt-2 bg-yellow-600/20 text-yellow-200 border-yellow-400/30">
              AI
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardContent className="p-6 text-center">
            <Target className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h4 className="font-semibold mb-2">Smart Benchmarking</h4>
            <p className="text-sm text-gray-300">Intelligent industry comparisons and insights</p>
            <Badge variant="secondary" className="mt-2 bg-green-600/20 text-green-200 border-green-400/30">
              Pro
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardContent className="p-12 text-center">
          <Brain className="w-20 h-20 text-purple-400 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold mb-4">Enterprise AI Intelligence</h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Our advanced AI engine analyzes your financial data to provide intelligent recommendations, 
            identify optimization opportunities, and predict future performance with industry-leading accuracy.
          </p>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Brain className="w-4 h-4 mr-2" />
            Activate AI Insights
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Benchmarking View Component
const BenchmarkingView = () => {
  return (
    <div className="p-8 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Industry Benchmarking</h1>
        <p className="text-blue-200">Compare your performance against industry standards</p>
      </div>
      
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardContent className="p-12 text-center">
          <Target className="w-20 h-20 text-blue-400 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold mb-4">Comprehensive Benchmarking Suite</h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Compare your working capital metrics against industry peers, identify performance gaps, 
            and discover optimization opportunities with our comprehensive benchmarking platform.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Target className="w-4 h-4 mr-2" />
            Start Benchmarking
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Data Management View Component
const DataManagementView = () => {
  return (
    <div className="p-8 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Data Management</h1>
        <p className="text-blue-200">Import, export, and manage your financial data</p>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-6 h-6 mr-3" />
              Data Import
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <Upload className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Import Financial Data</h3>
            <p className="text-gray-300 mb-4">
              Upload CSV, Excel, or connect to your ERP system for seamless data integration.
            </p>
            <Button className="bg-green-600 hover:bg-green-700">
              <Upload className="w-4 h-4 mr-2" />
              Import Data
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="w-6 h-6 mr-3" />
              Data Export
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <Download className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Export Reports</h3>
            <p className="text-gray-300 mb-4">
              Generate and download comprehensive reports in multiple formats for stakeholders.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Export Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Reports View Component
const ReportsView = () => {
  return (
    <div className="p-8 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Enterprise Reports</h1>
        <p className="text-blue-200">Board-ready presentations and stakeholder communications</p>
      </div>
      
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardContent className="p-12 text-center">
          <FileText className="w-20 h-20 text-green-400 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold mb-4">Professional Report Generation</h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Generate comprehensive, board-ready reports with executive summaries, detailed analytics, 
            and actionable recommendations for stakeholder presentations.
          </p>
          <div className="flex justify-center space-x-4">
            <Button className="bg-green-600 hover:bg-green-700">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Settings View Component
const SettingsView = ({ user }) => {
  return (
    <div className="p-8 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-blue-200">Application preferences and account management</p>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-6 h-6 mr-3" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-300">Name</label>
              <p className="text-white font-medium">{user?.firstName} {user?.lastName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-300">Email</label>
              <p className="text-white font-medium">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
            <div>
              <label className="text-sm text-gray-300">Account Type</label>
              <Badge variant="secondary" className="bg-blue-600/20 text-blue-200 border-blue-400/30">
                Enterprise
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-6 h-6 mr-3" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Two-Factor Authentication</span>
              <Badge variant="secondary" className="bg-green-600/20 text-green-200 border-green-400/30">
                Enabled
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Data Encryption</span>
              <Badge variant="secondary" className="bg-green-600/20 text-green-200 border-green-400/30">
                AES-256
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Compliance</span>
              <Badge variant="secondary" className="bg-blue-600/20 text-blue-200 border-blue-400/30">
                SOC 2 Type II
              </Badge>
            </div>
            <div className="pt-4">
              <SignOutButton>
                <Button variant="outline" className="border-red-400/30 text-red-300 hover:bg-red-600/20">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </SignOutButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Help View Component
const HelpView = () => {
  return (
    <div className="p-8 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Help & Support</h1>
        <p className="text-blue-200">Documentation, tutorials, and enterprise support</p>
      </div>
      
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardContent className="p-12 text-center">
          <HelpCircle className="w-20 h-20 text-blue-400 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold mb-4">Enterprise Support Center</h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Access comprehensive documentation, video tutorials, and 24/7 enterprise support 
            to maximize your working capital intelligence platform.
          </p>
          <div className="flex justify-center space-x-4">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <HelpCircle className="w-4 h-4 mr-2" />
              Browse Documentation
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedEnterpriseDashboard;
