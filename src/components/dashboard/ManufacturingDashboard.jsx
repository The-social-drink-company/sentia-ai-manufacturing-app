import React, { useState, useEffect } from 'react';
import AdvancedAnalytics from './AdvancedAnalytics';

// Manufacturing KPI Widget
const KPIWidget = ({ title, value, change, changeType, icon, color = "blue" }) => {
  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-green-600';
    if (changeType === 'negative') return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = () => {
    if (changeType === 'positive') return '↗️';
    if (changeType === 'negative') return '↘️';
    return '→';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600`}>
          {icon}
        </div>
      </div>
      {change && (
        <div className="mt-2 flex items-center text-sm">
          <span className={getChangeColor()}>
            {getChangeIcon()} {change}
          </span>
          <span className="text-gray-500 ml-1">from last month</span>
        </div>
      )}
    </div>
  );
};

// Production Status Chart
const ProductionChart = () => {
  const [productionData, setProductionData] = useState([]);

  useEffect(() => {
    // Simulate real-time production data
    const generateData = () => {
      const hours = Array.from({length: 24}, (_, i) => i);
      return hours.map(hour => ({
        hour: `${hour}:00`,
        production: Math.floor(Math.random() * 100) + 50,
        target: 80
      }));
    };

    setProductionData(generateData());
    
    // Update every 5 seconds to simulate real-time
    const interval = setInterval(() => {
      setProductionData(generateData());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Production vs Target (24h)</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {productionData.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{item.hour}</span>
            <div className="flex items-center space-x-2 flex-1 mx-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${item.production >= item.target ? 'bg-green-500' : 'bg-yellow-500'}`}
                  style={{ width: `${Math.min(item.production, 100)}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900">{item.production}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Quality Control Status
const QualityStatus = () => {
  const [qualityData, setQualityData] = useState({
    passed: 847,
    failed: 23,
    pending: 15,
    rate: 97.4
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Control</h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Pass Rate</span>
          <span className="text-xl font-bold text-green-600">{qualityData.rate}%</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Passed</p>
            <p className="text-lg font-bold text-green-700">{qualityData.passed}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600 font-medium">Failed</p>
            <p className="text-lg font-bold text-red-700">{qualityData.failed}</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-600 font-medium">Pending</p>
            <p className="text-lg font-bold text-yellow-700">{qualityData.pending}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Inventory Status
const InventoryStatus = () => {
  const [inventory, setInventory] = useState([
    { name: 'Raw Materials', level: 85, status: 'good', total: 1200 },
    { name: 'Work in Progress', level: 45, status: 'warning', total: 300 },
    { name: 'Finished Goods', level: 92, status: 'good', total: 850 },
    { name: 'Packaging', level: 23, status: 'critical', total: 200 }
  ]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'good': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Levels</h3>
      <div className="space-y-4">
        {inventory.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900">{item.name}</span>
              <span className="text-sm text-gray-600">{item.level}% ({Math.floor(item.total * item.level / 100)} units)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getStatusColor(item.status)}`}
                style={{ width: `${item.level}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Manufacturing Dashboard
const ManufacturingDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [realTimeData, setRealTimeData] = useState({
    totalProduction: 2847,
    efficiency: 94.2,
    activeLines: 8,
    totalLines: 10,
    workersOnShift: 127,
    ordersFulfilled: 89
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        totalProduction: prev.totalProduction + Math.floor(Math.random() * 10),
        efficiency: +(prev.efficiency + (Math.random() - 0.5) * 0.5).toFixed(1),
        activeLines: Math.min(10, Math.max(6, prev.activeLines + Math.floor(Math.random() * 3) - 1)),
        totalLines: 10,
        workersOnShift: Math.min(150, Math.max(120, prev.workersOnShift + Math.floor(Math.random() * 6) - 3)),
        ordersFulfilled: Math.min(100, prev.ordersFulfilled + Math.floor(Math.random() * 2))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manufacturing Dashboard</h1>
          <p className="text-gray-600">Real-time production monitoring and analytics</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live Data</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📈 Advanced Analytics
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📋 Reports
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPIWidget
              title="Total Production"
              value={`${realTimeData.totalProduction.toLocaleString()} units`}
              change="+12.5%"
              changeType="positive"
              icon="🏭"
              color="blue"
            />
            <KPIWidget
              title="Efficiency Rate"
              value={`${realTimeData.efficiency}%`}
              change="+2.1%"
              changeType="positive"
              icon="⚡"
              color="green"
            />
            <KPIWidget
              title="Active Production Lines"
              value={`${realTimeData.activeLines}/${realTimeData.totalLines}`}
              change={realTimeData.activeLines === realTimeData.totalLines ? "All operational" : `${realTimeData.totalLines - realTimeData.activeLines} offline`}
              changeType={realTimeData.activeLines === realTimeData.totalLines ? "positive" : "warning"}
              icon="🔧"
              color="purple"
            />
            <KPIWidget
              title="Workers on Shift"
              value={realTimeData.workersOnShift}
              change="+5 from yesterday"
              changeType="positive"
              icon="👷"
              color="orange"
            />
          </div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProductionChart />
            <QualityStatus />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InventoryStatus />
            
            {/* Recent Alerts */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">Low inventory warning</p>
                    <p className="text-xs text-yellow-600">Packaging materials below 25% threshold</p>
                  </div>
                  <span className="text-xs text-yellow-600">5 min ago</span>
                </div>
                
                <div className="flex items-center p-3 bg-green-50 border-l-4 border-green-400 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">Quality check passed</p>
                    <p className="text-xs text-green-600">Batch #QC-2024-1247 approved for shipment</p>
                  </div>
                  <span className="text-xs text-green-600">12 min ago</span>
                </div>
                
                <div className="flex items-center p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800">Production milestone</p>
                    <p className="text-xs text-blue-600">Daily target achieved at 89% completion</p>
                  </div>
                  <span className="text-xs text-blue-600">1 hr ago</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'analytics' && <AdvancedAnalytics />}

      {activeTab === 'reports' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Manufacturing Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <h4 className="font-medium text-gray-900">Daily Production Report</h4>
              <p className="text-sm text-gray-600 mt-1">Complete production summary for today</p>
              <p className="text-xs text-blue-600 mt-2">Generated 2 hours ago</p>
            </div>
            <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <h4 className="font-medium text-gray-900">Quality Control Report</h4>
              <p className="text-sm text-gray-600 mt-1">Quality metrics and test results</p>
              <p className="text-xs text-blue-600 mt-2">Generated 1 hour ago</p>
            </div>
            <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <h4 className="font-medium text-gray-900">OEE Analysis</h4>
              <p className="text-sm text-gray-600 mt-1">Overall Equipment Effectiveness trends</p>
              <p className="text-xs text-blue-600 mt-2">Generated 30 minutes ago</p>
            </div>
            <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <h4 className="font-medium text-gray-900">Energy Consumption</h4>
              <p className="text-sm text-gray-600 mt-1">Energy usage and cost analysis</p>
              <p className="text-xs text-blue-600 mt-2">Generated 15 minutes ago</p>
            </div>
            <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <h4 className="font-medium text-gray-900">Maintenance Schedule</h4>
              <p className="text-sm text-gray-600 mt-1">Upcoming and completed maintenance</p>
              <p className="text-xs text-blue-600 mt-2">Generated 5 minutes ago</p>
            </div>
            <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
              <h4 className="font-medium text-gray-900">Custom Report</h4>
              <p className="text-sm text-gray-600 mt-1">Create your own custom report</p>
              <p className="text-xs text-green-600 mt-2">+ New Report</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManufacturingDashboard;