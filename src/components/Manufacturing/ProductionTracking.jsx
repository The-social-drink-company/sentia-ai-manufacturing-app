import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import {
  Play, Pause, StopCircle, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, Clock, Settings, RefreshCw,
  BarChart3, Activity, Target, Zap
} from 'lucide-react';

const ProductionTracking = () => {
  const { user } = useUser();
  const [selectedLine, setSelectedLine] = useState('all');
  const [timeRange, setTimeRange] = useState('today');

  // Fetch production data from API
  const { data: productionData, isLoading, refetch } = useQuery({
    queryKey: ['production-data', selectedLine, timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/production/status?line=${selectedLine}&range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${await user?.getToken()}`
        }
      });
      if (!response.ok) {
        return mockProductionData;
      }
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const data = productionData || mockProductionData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Production Tracking</h1>
              <p className="mt-2 text-gray-600">Real-time manufacturing line monitoring and control</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedLine}
                onChange={(e) => setSelectedLine(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Lines</option>
                <option value="line-a">Line A - GABA Red</option>
                <option value="line-b">Line B - GABA Clear</option>
                <option value="line-c">Line C - Packaging</option>
              </select>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <button
                onClick={() => refetch()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Production Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ProductionCard
            title="Overall Efficiency"
            value={`${data.overallEfficiency}%`}
            change={`+${data.efficiencyChange}%`}
            trend="up"
            icon={<Target className="w-6 h-6" />}
            color="blue"
          />
          <ProductionCard
            title="Units Produced"
            value={data.unitsProduced.toLocaleString()}
            change={`+${data.unitsChange}`}
            trend="up"
            icon={<BarChart3 className="w-6 h-6" />}
            color="green"
          />
          <ProductionCard
            title="Quality Rate"
            value={`${data.qualityRate}%`}
            change={`+${data.qualityChange}%`}
            trend="up"
            icon={<CheckCircle className="w-6 h-6" />}
            color="emerald"
          />
          <ProductionCard
            title="Downtime"
            value={`${data.downtimeMinutes}min`}
            change={`-${data.downtimeChange}min`}
            trend="up"
            icon={<Clock className="w-6 h-6" />}
            color="red"
          />
        </div>

        {/* Production Lines Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ProductionLineStatus data={data.lines} />
          <ProductionTrends data={data.trends} />
        </div>

        {/* Real-time Monitoring */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <CurrentBatches batches={data.currentBatches} />
          <QualityAlerts alerts={data.qualityAlerts} />
          <MaintenanceSchedule schedule={data.maintenanceSchedule} />
        </div>
      </div>
    </div>
  );
};

const ProductionCard = ({ title, value, change, trend, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600'
  };

  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  const trendColor = trend === 'up' ? 'text-green-500' : 'text-red-500';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="flex items-center mt-1">
            <TrendIcon className={`w-4 h-4 ${trendColor}`} />
            <span className={`text-sm ml-1 ${trendColor}`}>
              {change}
            </span>
            <span className="text-sm text-gray-500 ml-1">vs yesterday</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductionLineStatus = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Production Lines Status</h3>
      <div className="space-y-4">
        {data.map((line) => (
          <div key={line.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  line.status === 'running' ? 'bg-green-500' :
                  line.status === 'paused' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <h4 className="font-medium text-gray-900">{line.name}</h4>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                  <Play className="w-4 h-4" />
                </button>
                <button className="p-1 text-yellow-600 hover:bg-yellow-50 rounded">
                  <Pause className="w-4 h-4" />
                </button>
                <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                  <StopCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Efficiency</div>
                <div className="font-semibold text-gray-900">{line.efficiency}%</div>
              </div>
              <div>
                <div className="text-gray-500">Output Rate</div>
                <div className="font-semibold text-gray-900">{line.outputRate}/hr</div>
              </div>
              <div>
                <div className="text-gray-500">Target</div>
                <div className="font-semibold text-gray-900">{line.target}/hr</div>
              </div>
            </div>
            
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <span>Progress to Target</span>
                <span>{Math.round((line.outputRate / line.target) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.min((line.outputRate / line.target) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductionTrends = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Production Trends</h3>
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-2" />
          <p>Real-time production chart</p>
          <p className="text-sm">(Chart.js implementation)</p>
        </div>
      </div>
    </div>
  );
};

const CurrentBatches = ({ batches }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Current Batches</h3>
      <div className="space-y-3">
        {batches.map((batch) => (
          <div key={batch.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Batch #{batch.id}</div>
              <div className="text-sm text-gray-500">{batch.product}</div>
            </div>
            <div className="text-right">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                batch.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                batch.status === 'quality-check' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {batch.status.replace('-', ' ').toUpperCase()}
              </div>
              <div className="text-sm text-gray-500 mt-1">{batch.completion}% complete</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const QualityAlerts = ({ alerts }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Quality Alerts</h3>
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div key={index} className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            <div className="flex-1">
              <div className="font-medium text-red-900">{alert.title}</div>
              <div className="text-sm text-red-700 mt-1">{alert.description}</div>
              <div className="text-xs text-red-600 mt-2">{alert.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MaintenanceSchedule = ({ schedule }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-6">Maintenance Schedule</h3>
      <div className="space-y-3">
        {schedule.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <Settings className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <div className="font-medium text-gray-900">{item.equipment}</div>
                <div className="text-sm text-gray-500">{item.type}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                item.priority === 'high' ? 'bg-red-100 text-red-800' :
                item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {item.priority.toUpperCase()}
              </div>
              <div className="text-sm text-gray-500 mt-1">{item.scheduled}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Mock data for development
const mockProductionData = {
  overallEfficiency: 94.2,
  efficiencyChange: 2.3,
  unitsProduced: 18750,
  unitsChange: 1250,
  qualityRate: 98.7,
  qualityChange: 0.5,
  downtimeMinutes: 23,
  downtimeChange: 15,
  lines: [
    {
      id: 'line-a',
      name: 'Line A - GABA Red Production',
      status: 'running',
      efficiency: 96.3,
      outputRate: 2450,
      target: 2500
    },
    {
      id: 'line-b',
      name: 'Line B - GABA Clear Production',
      status: 'running',
      efficiency: 92.1,
      outputRate: 2100,
      target: 2300
    },
    {
      id: 'line-c',
      name: 'Line C - Packaging',
      status: 'paused',
      efficiency: 0,
      outputRate: 0,
      target: 1800
    }
  ],
  currentBatches: [
    { id: '2024-001', product: 'GABA Red 500ml', status: 'processing', completion: 75 },
    { id: '2024-002', product: 'GABA Clear 500ml', status: 'quality-check', completion: 100 },
    { id: '2024-003', product: 'GABA Red 250ml', status: 'completed', completion: 100 }
  ],
  qualityAlerts: [
    {
      title: 'pH Level Warning',
      description: 'Batch 2024-001 pH level is slightly outside optimal range',
      time: '5 minutes ago'
    },
    {
      title: 'Temperature Alert',
      description: 'Line B temperature sensor reporting anomaly',
      time: '12 minutes ago'
    }
  ],
  maintenanceSchedule: [
    {
      equipment: 'Tank Mixer #3',
      type: 'Preventive Maintenance',
      priority: 'high',
      scheduled: 'Tomorrow 2:00 PM'
    },
    {
      equipment: 'Conveyor Belt B2',
      type: 'Belt Replacement',
      priority: 'medium',
      scheduled: 'Friday 10:00 AM'
    }
  ]
};

export default ProductionTracking;