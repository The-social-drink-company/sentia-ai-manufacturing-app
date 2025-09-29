import React, { useState, useEffect } from 'react'
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  LayoutDashboardIcon, LineChartIcon, Package2Icon, FactoryIcon,
  FlaskConicalIcon, BrainIcon, DollarSignIcon, LayersIcon,
  DatabaseIcon, ShieldCheckIcon, MenuIcon, XIcon, BellIcon,
  SearchIcon, SettingsIcon, HelpCircleIcon, TrendingUpIcon,
  BarChart3Icon, PieChartIcon, ActivityIcon, CalendarIcon,
  FilterIcon, RefreshCwIcon, DownloadIcon, ShareIcon
} from 'lucide-react'

// Import the magnificent enterprise components with correct paths
import LandingPage from './LandingPage'
import ExecutiveDashboard from './components/ExecutiveDashboard'
import DemandForecasting from './components/DemandForecasting'
import InventoryManagement from './components/InventoryManagement'
import FinancialReports from './components/FinancialReports'
import DataImport from './components/DataImport'
import AdminPanel from './components/AdminPanel'

// Import the world-class comprehensive components
import WhatIfAnalysisComprehensive from './pages/WhatIfAnalysisComprehensive'
import WorkingCapitalComprehensive from './pages/WorkingCapitalComprehensive'

// Import additional enterprise components
import EnterpriseAIChatbot from './components/EnterpriseAIChatbot'

const queryClient = new QueryClient()

// Production Tracking Component - World-Class Implementation
const ProductionTrackingWorldClass = () => {
  const [productionData, setProductionData] = useState({
    dailyOutput: 2450,
    efficiency: 94.2,
    downtime: 3.8,
    qualityRate: 98.5,
    oee: 91.7,
    targetOutput: 2600,
    actualVsTarget: 94.2
  });

  const [productionLines, setProductionLines] = useState([
    { 
      id: 'LINE_A', 
      name: 'GABA Production Line', 
      status: 'Running', 
      efficiency: 96.2, 
      output: 850, 
      target: 900,
      downtime: 2.1,
      lastMaintenance: '2024-09-25',
      nextMaintenance: '2024-10-15'
    },
    { 
      id: 'LINE_B', 
      name: 'Nootropic Blending Line', 
      status: 'Running', 
      efficiency: 92.8, 
      output: 720, 
      target: 800,
      downtime: 4.2,
      lastMaintenance: '2024-09-20',
      nextMaintenance: '2024-10-10'
    },
    { 
      id: 'LINE_C', 
      name: 'Packaging Line', 
      status: 'Maintenance', 
      efficiency: 0, 
      output: 0, 
      target: 600,
      downtime: 100,
      lastMaintenance: '2024-09-28',
      nextMaintenance: '2024-09-29'
    },
    { 
      id: 'LINE_D', 
      name: 'Quality Control Line', 
      status: 'Running', 
      efficiency: 98.1, 
      output: 880, 
      target: 900,
      downtime: 1.2,
      lastMaintenance: '2024-09-22',
      nextMaintenance: '2024-10-12'
    }
  ]);

  const [realTimeMetrics, setRealTimeMetrics] = useState({
    currentShift: 'Day Shift (06:00-14:00)',
    shiftProgress: 75,
    unitsProducedToday: 18450,
    unitsRemainingToday: 2150,
    averageCycleTime: 45.2,
    targetCycleTime: 42.0,
    energyConsumption: 1250,
    wastePercentage: 2.1
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setRealTimeMetrics(prev => ({
        ...prev,
        unitsProducedToday: prev.unitsProducedToday + Math.floor(Math.random() * 10),
        energyConsumption: 1250 + Math.floor(Math.random() * 100) - 50,
        averageCycleTime: 45.2 + (Math.random() * 2 - 1)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Production Tracking</h1>
          <p className="text-blue-200 mt-2">Real-time manufacturing operations monitoring with AI-powered insights</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all">
            <RefreshCwIcon className="w-4 h-4" />
            <span>Refresh Data</span>
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all">
            <DownloadIcon className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Real-Time KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm font-medium">Daily Output</p>
              <p className="text-3xl font-bold">{productionData.dailyOutput.toLocaleString()}</p>
              <p className="text-blue-200 text-sm">Target: {productionData.targetOutput.toLocaleString()}</p>
              <div className="mt-2">
                <div className="bg-blue-800 rounded-full h-2">
                  <div 
                    className="bg-blue-300 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${productionData.actualVsTarget}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <FactoryIcon className="w-10 h-10 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-sm font-medium">Overall Efficiency</p>
              <p className="text-3xl font-bold">{productionData.efficiency}%</p>
              <p className="text-green-200 text-sm">Target: 95%</p>
              <div className="flex items-center mt-2">
                <TrendingUpIcon className="w-4 h-4 text-green-300 mr-1" />
                <span className="text-green-300 text-sm">+2.1% vs yesterday</span>
              </div>
            </div>
            <TrendingUpIcon className="w-10 h-10 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-200 text-sm font-medium">Downtime</p>
              <p className="text-3xl font-bold">{productionData.downtime}%</p>
              <p className="text-yellow-200 text-sm">Target: <5%</p>
              <div className="flex items-center mt-2">
                <ActivityIcon className="w-4 h-4 text-yellow-300 mr-1" />
                <span className="text-yellow-300 text-sm">Line C in maintenance</span>
              </div>
            </div>
            <ActivityIcon className="w-10 h-10 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm font-medium">OEE Score</p>
              <p className="text-3xl font-bold">{productionData.oee}%</p>
              <p className="text-purple-200 text-sm">World-class: >85%</p>
              <div className="flex items-center mt-2">
                <BarChart3Icon className="w-4 h-4 text-purple-300 mr-1" />
                <span className="text-purple-300 text-sm">Excellent performance</span>
              </div>
            </div>
            <BarChart3Icon className="w-10 h-10 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Current Shift Information */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2" />
          Current Shift Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="text-slate-400 text-sm">Active Shift</p>
            <p className="text-white font-semibold">{realTimeMetrics.currentShift}</p>
            <div className="bg-slate-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${realTimeMetrics.shiftProgress}%` }}
              ></div>
            </div>
            <p className="text-slate-400 text-xs">{realTimeMetrics.shiftProgress}% complete</p>
          </div>
          <div className="space-y-2">
            <p className="text-slate-400 text-sm">Units Produced Today</p>
            <p className="text-white font-semibold text-2xl">{realTimeMetrics.unitsProducedToday.toLocaleString()}</p>
            <p className="text-slate-400 text-sm">{realTimeMetrics.unitsRemainingToday.toLocaleString()} remaining</p>
          </div>
          <div className="space-y-2">
            <p className="text-slate-400 text-sm">Average Cycle Time</p>
            <p className="text-white font-semibold text-2xl">{realTimeMetrics.averageCycleTime.toFixed(1)}s</p>
            <p className="text-slate-400 text-sm">Target: {realTimeMetrics.targetCycleTime}s</p>
          </div>
        </div>
      </div>

      {/* Production Lines Status */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <FactoryIcon className="w-5 h-5 mr-2" />
          Production Lines Status
        </h2>
        <div className="space-y-4">
          {productionLines.map((line, index) => (
            <div key={line.id} className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-4 h-4 rounded-full ${
                    line.status === 'Running' ? 'bg-green-500 animate-pulse' : 
                    line.status === 'Maintenance' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="text-white font-medium">{line.name}</p>
                    <p className="text-slate-400 text-sm">Status: {line.status} • ID: {line.id}</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-white font-semibold">{line.efficiency}%</p>
                      <p className="text-slate-400 text-xs">Efficiency</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-semibold">{line.output}/{line.target}</p>
                      <p className="text-slate-400 text-xs">Output/Target</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-semibold">{line.downtime}%</p>
                      <p className="text-slate-400 text-xs">Downtime</p>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs">Next maintenance: {line.nextMaintenance}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Energy & Resources</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Energy Consumption</span>
              <span className="text-white font-semibold">{realTimeMetrics.energyConsumption} kWh</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Waste Percentage</span>
              <span className="text-white font-semibold">{realTimeMetrics.wastePercentage}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Water Usage</span>
              <span className="text-white font-semibold">2,450 L</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quality Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">First Pass Yield</span>
              <span className="text-white font-semibold">{productionData.qualityRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Defect Rate</span>
              <span className="text-white font-semibold">1.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Rework Rate</span>
              <span className="text-white font-semibold">0.8%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quality Control Component - World-Class Implementation
const QualityControlWorldClass = () => {
  const [qualityMetrics, setQualityMetrics] = useState({
    defectRate: 1.5,
    firstPassYield: 98.5,
    customerComplaints: 0.2,
    returnRate: 0.8,
    certificationStatus: 'ISO 9001:2015',
    auditScore: 96.2,
    corrective_actions: 3,
    preventive_actions: 7
  });

  const [qualityTests, setQualityTests] = useState([
    { 
      id: 'QT001',
      test: 'Chemical Composition Analysis', 
      status: 'Passed', 
      score: 98.2, 
      lastRun: '2 hours ago',
      frequency: 'Every batch',
      nextTest: 'In 4 hours',
      criticality: 'High'
    },
    { 
      id: 'QT002',
      test: 'Microbiological Testing', 
      status: 'Passed', 
      score: 99.1, 
      lastRun: '4 hours ago',
      frequency: 'Daily',
      nextTest: 'Tomorrow 08:00',
      criticality: 'Critical'
    },
    { 
      id: 'QT003',
      test: 'Physical Properties Test', 
      status: 'Passed', 
      score: 97.8, 
      lastRun: '1 hour ago',
      frequency: 'Every 2 hours',
      nextTest: 'In 1 hour',
      criticality: 'Medium'
    },
    { 
      id: 'QT004',
      test: 'Packaging Integrity Check', 
      status: 'In Progress', 
      score: null, 
      lastRun: 'Running now',
      frequency: 'Continuous',
      nextTest: 'Ongoing',
      criticality: 'High'
    },
    { 
      id: 'QT005',
      test: 'Label Accuracy Verification', 
      status: 'Passed', 
      score: 100, 
      lastRun: '30 minutes ago',
      frequency: 'Every batch',
      nextTest: 'In 2 hours',
      criticality: 'Medium'
    }
  ]);

  const [controlCharts, setControlCharts] = useState({
    defectTrend: [
      { date: '2024-09-23', value: 2.1 },
      { date: '2024-09-24', value: 1.8 },
      { date: '2024-09-25', value: 1.6 },
      { date: '2024-09-26', value: 1.4 },
      { date: '2024-09-27', value: 1.5 },
      { date: '2024-09-28', value: 1.3 },
      { date: '2024-09-29', value: 1.5 }
    ]
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Quality Control</h1>
          <p className="text-blue-200 mt-2">Comprehensive quality management with statistical process control</p>
        </div>
        <div className="flex space-x-2">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all">
            <FlaskConicalIcon className="w-4 h-4" />
            <span>Run Tests</span>
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all">
            <DownloadIcon className="w-4 h-4" />
            <span>Quality Report</span>
          </button>
        </div>
      </div>

      {/* Quality KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-sm font-medium">First Pass Yield</p>
              <p className="text-3xl font-bold">{qualityMetrics.firstPassYield}%</p>
              <p className="text-green-200 text-sm">Target: >98%</p>
              <div className="flex items-center mt-2">
                <TrendingUpIcon className="w-4 h-4 text-green-300 mr-1" />
                <span className="text-green-300 text-sm">Above target</span>
              </div>
            </div>
            <FlaskConicalIcon className="w-10 h-10 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-600 to-red-700 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-200 text-sm font-medium">Defect Rate</p>
              <p className="text-3xl font-bold">{qualityMetrics.defectRate}%</p>
              <p className="text-red-200 text-sm">Target: <2%</p>
              <div className="flex items-center mt-2">
                <TrendingUpIcon className="w-4 h-4 text-red-300 mr-1 rotate-180" />
                <span className="text-red-300 text-sm">Improving</span>
              </div>
            </div>
            <ActivityIcon className="w-10 h-10 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm font-medium">Customer Complaints</p>
              <p className="text-3xl font-bold">{qualityMetrics.customerComplaints}%</p>
              <p className="text-blue-200 text-sm">Target: <0.5%</p>
              <div className="flex items-center mt-2">
                <BellIcon className="w-4 h-4 text-blue-300 mr-1" />
                <span className="text-blue-300 text-sm">Excellent</span>
              </div>
            </div>
            <BellIcon className="w-10 h-10 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-sm font-medium">Audit Score</p>
              <p className="text-3xl font-bold">{qualityMetrics.auditScore}%</p>
              <p className="text-indigo-200 text-sm">ISO 9001:2015</p>
              <div className="flex items-center mt-2">
                <ShieldCheckIcon className="w-4 h-4 text-indigo-300 mr-1" />
                <span className="text-indigo-300 text-sm">Certified</span>
              </div>
            </div>
            <ShieldCheckIcon className="w-10 h-10 text-indigo-200" />
          </div>
        </div>
      </div>

      {/* Quality Tests Status */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <FlaskConicalIcon className="w-5 h-5 mr-2" />
          Quality Control Tests
        </h2>
        <div className="space-y-4">
          {qualityTests.map((test, index) => (
            <div key={test.id} className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-4 h-4 rounded-full ${
                    test.status === 'Passed' ? 'bg-green-500' : 
                    test.status === 'In Progress' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-white font-medium">{test.test}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        test.criticality === 'Critical' ? 'bg-red-600 text-red-100' :
                        test.criticality === 'High' ? 'bg-orange-600 text-orange-100' :
                        'bg-blue-600 text-blue-100'
                      }`}>
                        {test.criticality}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm">ID: {test.id} • Frequency: {test.frequency}</p>
                    <p className="text-slate-400 text-sm">Last run: {test.lastRun} • Next: {test.nextTest}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    test.status === 'Passed' ? 'text-green-400' :
                    test.status === 'In Progress' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {test.status}
                  </p>
                  {test.score && (
                    <p className="text-slate-400 text-sm">Score: {test.score}%</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quality Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Corrective Actions</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">Open Actions</span>
              <span className="text-orange-400 font-semibold">{qualityMetrics.corrective_actions}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">Closed This Month</span>
              <span className="text-green-400 font-semibold">12</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">Average Resolution Time</span>
              <span className="text-blue-400 font-semibold">3.2 days</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Preventive Actions</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">Active Initiatives</span>
              <span className="text-blue-400 font-semibold">{qualityMetrics.preventive_actions}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">Completed This Quarter</span>
              <span className="text-green-400 font-semibold">18</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
              <span className="text-slate-300">Risk Reduction</span>
              <span className="text-purple-400 font-semibold">24%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [currentPage, setCurrentPage] = useState('executive-dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const navigationItems = [
    { id: 'executive-dashboard', label: 'Executive Dashboard', icon: LayoutDashboardIcon, number: 1 },
    { id: 'demand-forecasting', label: 'Demand Forecasting', icon: LineChartIcon, number: 2 },
    { id: 'inventory-management', label: 'Inventory Management', icon: Package2Icon, number: 3 },
    { id: 'production-tracking', label: 'Production Tracking', icon: FactoryIcon, number: 4 },
    { id: 'quality-control', label: 'Quality Control', icon: FlaskConicalIcon, number: 5 },
    { id: 'working-capital', label: 'Working Capital', icon: DollarSignIcon, number: 6 },
    { id: 'what-if-analysis', label: 'What-If Analysis', icon: BrainIcon, number: 7 },
    { id: 'financial-reports', label: 'Financial Reports', icon: BarChart3Icon, number: 8 },
    { id: 'data-import', label: 'Data Import', icon: DatabaseIcon, number: 9 },
    { id: 'admin-panel', label: 'Admin Panel', icon: SettingsIcon, number: 10 }
  ]

  const getActiveComponent = () => {
    console.log('Current page:', currentPage); // Debug log
    
    switch (currentPage) {
      case 'executive-dashboard':
        return <ExecutiveDashboard />
      case 'demand-forecasting':
        return <DemandForecasting />
      case 'inventory-management':
        return <InventoryManagement />
      case 'production-tracking':
        return <ProductionTrackingWorldClass />
      case 'quality-control':
        return <QualityControlWorldClass />
      case 'working-capital':
        return <WorkingCapitalComprehensive />
      case 'what-if-analysis':
        return <WhatIfAnalysisComprehensive />
      case 'financial-reports':
        return <FinancialReports />
      case 'data-import':
        return <DataImport />
      case 'admin-panel':
        return <AdminPanel />
      default:
        return <ExecutiveDashboard />
    }
  }

  const handleNavigation = (pageId) => {
    console.log('Navigating to:', pageId); // Debug log
    setCurrentPage(pageId);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <SignedOut>
          <LandingPage />
        </SignedOut>
        
        <SignedIn>
          <div className="flex h-screen">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-80' : 'w-20'} bg-slate-800/90 backdrop-blur-sm border-r border-slate-700 transition-all duration-300 flex flex-col`}>
              {/* Header */}
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">S</span>
                    </div>
                    {sidebarOpen && (
                      <div>
                        <h1 className="text-white font-bold text-lg">Sentia Manufacturing</h1>
                        <p className="text-slate-400 text-sm">Enterprise Dashboard</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {sidebarOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto py-6">
                <div className="space-y-1 px-3">
                  {/* Overview Section */}
                  <div className="mb-6">
                    {sidebarOpen && <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider px-3 mb-3">OVERVIEW</p>}
                    <button
                      onClick={() => handleNavigation('executive-dashboard')}
                      className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                        currentPage === 'executive-dashboard'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg text-white text-sm font-bold">
                        1
                      </div>
                      {sidebarOpen && <span className="font-medium">Executive Dashboard</span>}
                    </button>
                  </div>

                  {/* Planning & Analytics Section */}
                  <div className="mb-6">
                    {sidebarOpen && <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider px-3 mb-3">PLANNING & ANALYTICS</p>}
                    <div className="space-y-1">
                      {navigationItems.slice(1, 5).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleNavigation(item.id)}
                          className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                            currentPage === item.id
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-center w-8 h-8 bg-slate-600 rounded-lg text-white text-sm font-bold">
                            {item.number}
                          </div>
                          {sidebarOpen && <span className="font-medium">{item.label}</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Financial Management Section */}
                  <div className="mb-6">
                    {sidebarOpen && <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider px-3 mb-3">FINANCIAL MANAGEMENT</p>}
                    <div className="space-y-1">
                      {navigationItems.slice(5, 8).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleNavigation(item.id)}
                          className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                            currentPage === item.id
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-center w-8 h-8 bg-slate-600 rounded-lg text-white text-sm font-bold">
                            {item.number}
                          </div>
                          {sidebarOpen && <span className="font-medium">{item.label}</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Operations Section */}
                  <div className="mb-6">
                    {sidebarOpen && <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider px-3 mb-3">OPERATIONS</p>}
                    <div className="space-y-1">
                      {navigationItems.slice(8, 10).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleNavigation(item.id)}
                          className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                            currentPage === item.id
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-center w-8 h-8 bg-slate-600 rounded-lg text-white text-sm font-bold">
                            {item.number}
                          </div>
                          {sidebarOpen && <span className="font-medium">{item.label}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Top Bar */}
              <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-400 font-medium">All Systems Operational</span>
                      <span className="text-slate-400">•</span>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-blue-400 font-medium">Live Data Connected</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-400">Current Page: {currentPage}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button className="text-slate-400 hover:text-white transition-colors">
                      <SearchIcon className="w-5 h-5" />
                    </button>
                    <button className="text-slate-400 hover:text-white transition-colors">
                      <BellIcon className="w-5 h-5" />
                    </button>
                    <UserButton 
                      appearance={{
                        elements: {
                          avatarBox: "w-8 h-8"
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Page Content */}
              <div className="flex-1 overflow-y-auto">
                {getActiveComponent()}
              </div>
            </div>
          </div>

          {/* AI Chatbot */}
          <EnterpriseAIChatbot />
        </SignedIn>
      </div>
    </QueryClientProvider>
  )
}

export default App
