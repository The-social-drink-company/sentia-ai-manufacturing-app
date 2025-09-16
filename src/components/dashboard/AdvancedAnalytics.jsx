import React, { useState, useEffect } from 'react';

// Advanced Performance Metrics Component
const PerformanceMetrics = () => {
  const [metrics, setMetrics] = useState({
    oee: 87.5, // Overall Equipment Effectiveness
    availability: 94.2,
    performance: 91.8,
    quality: 95.1,
    mtbf: 127, // Mean Time Between Failures (hours)
    mttr: 2.3, // Mean Time To Repair (hours)
    downtimeReasons: [
      { reason: 'Preventive Maintenance', hours: 8.5, percentage: 45 },
      { reason: 'Setup/Changeover', hours: 6.2, percentage: 33 },
      { reason: 'Equipment Failure', hours: 2.8, percentage: 15 },
      { reason: 'Material Shortage', hours: 1.3, percentage: 7 }
    ]
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Equipment Effectiveness (OEE)</h3>
      
      {/* OEE Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{metrics.oee}%</div>
          <div className="text-sm text-gray-600">Overall OEE</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{metrics.availability}%</div>
          <div className="text-sm text-gray-600">Availability</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{metrics.performance}%</div>
          <div className="text-sm text-gray-600">Performance</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{metrics.quality}%</div>
          <div className="text-sm text-gray-600">Quality</div>
        </div>
      </div>

      {/* Downtime Analysis */}
      <div className="mb-4">
        <h4 className="text-md font-semibold text-gray-800 mb-2">Downtime Analysis</h4>
        <div className="space-y-2">
          {metrics.downtimeReasons.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{item.reason}</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-600">{item.hours}h</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MTBF/MTTR */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">{metrics.mtbf}h</div>
          <div className="text-sm text-gray-600">MTBF</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-red-600">{metrics.mttr}h</div>
          <div className="text-sm text-gray-600">MTTR</div>
        </div>
      </div>
    </div>
  );
};

// Production Efficiency Trends
const EfficiencyTrends = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [trendsData, setTrendsData] = useState([]);

  useEffect(() => {
    // Simulate trend data generation
    const generateTrends = () => {
      const periods = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 24;
      const trends = [];
      
      for (let i = 0; i < periods; i++) {
        trends.push({
          period: timeRange === 'week' ? `Day ${i + 1}` : 
                  timeRange === 'month' ? `Day ${i + 1}` : `${i}:00`,
          efficiency: Math.floor(0 /* REAL DATA REQUIRED */) + 80,
          throughput: Math.floor(0 /* REAL DATA REQUIRED */) + 150,
          scrap: Math.floor(0 /* REAL DATA REQUIRED */) + 1,
          rework: Math.floor(0 /* REAL DATA REQUIRED */) + 2
        });
      }
      return trends;
    };

    setTrendsData(generateTrends());
  }, [timeRange]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Production Efficiency Trends</h3>
        <select 
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
        >
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {trendsData.map((data, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-sm font-medium text-gray-700">{data.period}</span>
            <div className="flex space-x-4 text-sm">
              <span className="text-green-600">{data.efficiency}% Eff</span>
              <span className="text-blue-600">{data.throughput} TPH</span>
              <span className="text-red-600">{data.scrap}% Scrap</span>
              <span className="text-yellow-600">{data.rework}% Rework</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Energy Consumption Dashboard
const EnergyConsumption = () => {
  const [energyData, setEnergyData] = useState({
    currentUsage: 847.2,
    peakUsage: 1024.5,
    averageUsage: 756.8,
    totalCost: 12847.50,
    carbonFootprint: 284.7,
    breakdown: [
      { equipment: 'Production Lines', usage: 425.2, percentage: 50.2 },
      { equipment: 'HVAC Systems', usage: 186.5, percentage: 22.0 },
      { equipment: 'Lighting', usage: 127.3, percentage: 15.0 },
      { equipment: 'Compressed Air', usage: 108.2, percentage: 12.8 }
    ]
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Energy Consumption</h3>
      
      {/* Energy Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{energyData.currentUsage} kW</div>
          <div className="text-sm text-gray-600">Current Usage</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{energyData.peakUsage} kW</div>
          <div className="text-sm text-gray-600">Peak Today</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{energyData.averageUsage} kW</div>
          <div className="text-sm text-gray-600">Average</div>
        </div>
      </div>

      {/* Energy Breakdown */}
      <div className="mb-4">
        <h4 className="text-md font-semibold text-gray-800 mb-2">Consumption by Equipment</h4>
        <div className="space-y-2">
          {energyData.breakdown.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{item.equipment}</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-600">{item.usage} kW</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost & Environmental Impact */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600">£{energyData.totalCost.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Monthly Cost</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">{energyData.carbonFootprint} kg CO2</div>
          <div className="text-sm text-gray-600">Carbon Footprint</div>
        </div>
      </div>
    </div>
  );
};

// Main Advanced Analytics Component
const AdvancedAnalytics = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceMetrics />
        <EfficiencyTrends />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnergyConsumption />
        
        {/* Predictive Maintenance Alerts */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Predictive Maintenance</h3>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">Conveyor Belt #3</p>
                <p className="text-xs text-yellow-600">Maintenance due in 72 hours</p>
              </div>
              <span className="text-xs text-yellow-600">72h</span>
            </div>
            
            <div className="flex items-center p-3 bg-red-50 border-l-4 border-red-400 rounded">
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Hydraulic Pump #1</p>
                <p className="text-xs text-red-600">Critical - Schedule immediately</p>
              </div>
              <span className="text-xs text-red-600">24h</span>
            </div>
            
            <div className="flex items-center p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">Air Compressor #2</p>
                <p className="text-xs text-blue-600">Maintenance completed</p>
              </div>
              <span className="text-xs text-blue-600">✓</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">8</div>
                <div className="text-xs text-gray-600">On Schedule</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-600">3</div>
                <div className="text-xs text-gray-600">Due Soon</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">1</div>
                <div className="text-xs text-gray-600">Overdue</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;