import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2';
import FactoryDigitalTwin from '../components/3d/FactoryDigitalTwin';

// Real-time Data Stream Component
function DataStream({ title, value, unit, trend, status }) {
  const [currentValue, setCurrentValue] = useState(value);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const fluctuation = (Math.random() - 0.5) * value * 0.1;
      setCurrentValue(prev => Math.max(0, prev + fluctuation));
    }, 1000);
    return () => clearInterval(interval);
  }, [value]);

  const getStatusColor = () => {
    switch(status) {
      case 'optimal': return 'text-green-400 border-green-500';
      case 'warning': return 'text-yellow-400 border-yellow-500';
      case 'critical': return 'text-red-400 border-red-500';
      default: return 'text-cyan-400 border-cyan-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-black/80 backdrop-blur-lg border rounded-lg p-4 ${getStatusColor()}`}
    >
      <h3 className="text-xs uppercase tracking-wider opacity-70 mb-1">{title}</h3>
      <div className="flex items-baseline space-x-1">
        <span className="text-3xl font-bold font-mono">{currentValue.toFixed(1)}</span>
        <span className="text-sm opacity-70">{unit}</span>
        {trend && (
          <span className={`text-sm ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </motion.div>
  );
}

// System Status Panel
function SystemStatusPanel() {
  const systems = [
    { name: 'Production Lines', status: 'operational', health: 94 },
    { name: 'Quality Control', status: 'operational', health: 98 },
    { name: 'Inventory Management', status: 'warning', health: 76 },
    { name: 'Supply Chain', status: 'operational', health: 89 },
    { name: 'AI Analytics', status: 'operational', health: 100 },
    { name: 'Predictive Maintenance', status: 'operational', health: 92 }
  ];

  return (
    <div className="bg-black/80 backdrop-blur-lg border border-cyan-500/50 rounded-lg p-4">
      <h2 className="text-cyan-400 text-lg font-bold mb-4">SYSTEM STATUS</h2>
      <div className="space-y-2">
        {systems.map((system, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">{system.name}</span>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-gray-800 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${system.health}%` }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  className={`h-full ${
                    system.health > 90 ? 'bg-green-500' :
                    system.health > 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                />
              </div>
              <span className={`text-xs font-mono ${
                system.status === 'operational' ? 'text-green-400' :
                system.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {system.health}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Alert Feed
function AlertFeed() {
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'success', message: 'Production Line A exceeded target by 15%', time: '2 min ago' },
    { id: 2, type: 'warning', message: 'Maintenance scheduled for Line 7 in 2 hours', time: '5 min ago' },
    { id: 3, type: 'info', message: 'New AI optimization deployed successfully', time: '12 min ago' },
    { id: 4, type: 'error', message: 'Temperature anomaly detected in Zone 3', time: '15 min ago' }
  ]);

  const getAlertIcon = (type) => {
    switch(type) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
      default: return 'ℹ';
    }
  };

  const getAlertColor = (type) => {
    switch(type) {
      case 'success': return 'text-green-400 border-green-500';
      case 'warning': return 'text-yellow-400 border-yellow-500';
      case 'error': return 'text-red-400 border-red-500';
      default: return 'text-blue-400 border-blue-500';
    }
  };

  return (
    <div className="bg-black/80 backdrop-blur-lg border border-orange-500/50 rounded-lg p-4 h-64 overflow-y-auto">
      <h2 className="text-orange-400 text-lg font-bold mb-4">ALERT FEED</h2>
      <div className="space-y-2">
        <AnimatePresence>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`border-l-2 pl-3 py-2 ${getAlertColor(alert.type)}`}
            >
              <div className="flex items-start space-x-2">
                <span className="text-lg">{getAlertIcon(alert.type)}</span>
                <div className="flex-1">
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs opacity-50 mt-1">{alert.time}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Voice Command Interface
function VoiceCommandInterface() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');

  const startListening = () => {
    setIsListening(true);
    setTranscript('Listening...');
    
    // Simulate voice recognition
    setTimeout(() => {
      setTranscript('Show production metrics for Line A');
      setResponse('Displaying production metrics for Line A. Current efficiency: 94.7%');
      setIsListening(false);
    }, 2000);
  };

  return (
    <div className="bg-black/80 backdrop-blur-lg border border-purple-500/50 rounded-lg p-4">
      <h2 className="text-purple-400 text-lg font-bold mb-4">VOICE COMMAND</h2>
      <button
        onClick={startListening}
        className={`w-full py-3 rounded-lg font-bold transition-all ${
          isListening 
            ? 'bg-red-600 text-white animate-pulse' 
            : 'bg-purple-600 hover:bg-purple-500 text-white'
        }`}
      >
        {isListening ? 'Listening...' : 'Press to Speak'}
      </button>
      {transcript && (
        <div className="mt-4 space-y-2">
          <p className="text-gray-400 text-sm">You said: <span className="text-white">{transcript}</span></p>
          {response && <p className="text-green-400 text-sm">AI: {response}</p>}
        </div>
      )}
    </div>
  );
}

// Performance Metrics Chart
function PerformanceChart() {
  const data = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        label: 'Production Output',
        data: [85, 88, 92, 95, 94, 91, 93],
        borderColor: 'rgb(0, 255, 0)',
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
        tension: 0.4
      },
      {
        label: 'Energy Efficiency',
        data: [78, 80, 82, 85, 83, 81, 82],
        borderColor: 'rgb(0, 191, 255)',
        backgroundColor: 'rgba(0, 191, 255, 0.1)',
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { color: 'white' }
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      }
    },
    scales: {
      y: {
        ticks: { color: 'white' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: 'white' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  return (
    <div className="bg-black/80 backdrop-blur-lg border border-green-500/50 rounded-lg p-4 h-64">
      <h2 className="text-green-400 text-lg font-bold mb-4">PERFORMANCE METRICS</h2>
      <Line data={data} options={options} />
    </div>
  );
}

// Main Mission Control Component
export default function MissionControl() {
  const [activeView, setActiveView] = useState('overview');
  const [missionTime, setMissionTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMissionTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatMissionTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-black via-gray-900 to-black border-b border-cyan-500/30 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              MISSION CONTROL
            </h1>
            <div className="text-green-400 font-mono text-lg">
              OPERATIONAL TIME: {formatMissionTime(missionTime)}
            </div>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={() => setActiveView('overview')}
              className={`px-4 py-2 rounded transition-all ${
                activeView === 'overview' 
                  ? 'bg-cyan-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              OVERVIEW
            </button>
            <button 
              onClick={() => setActiveView('3d')}
              className={`px-4 py-2 rounded transition-all ${
                activeView === '3d' 
                  ? 'bg-cyan-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              3D VIEW
            </button>
            <button 
              onClick={() => setActiveView('analytics')}
              className={`px-4 py-2 rounded transition-all ${
                activeView === 'analytics' 
                  ? 'bg-cyan-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              ANALYTICS
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeView === '3d' ? (
        <FactoryDigitalTwin />
      ) : (
        <div className="p-6">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-6 gap-4 mb-6">
            <DataStream title="Production Rate" value={94.7} unit="%" trend={2.3} status="optimal" />
            <DataStream title="Quality Score" value={98.2} unit="%" trend={0.5} status="optimal" />
            <DataStream title="Energy Usage" value={847} unit="kWh" trend={-3.2} status="optimal" />
            <DataStream title="Active Lines" value={12} unit="units" trend={0} status="optimal" />
            <DataStream title="Temperature" value={72.5} unit="°F" trend={1.2} status="warning" />
            <DataStream title="Efficiency" value={91.3} unit="%" trend={4.1} status="optimal" />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-12 gap-4">
            {/* Left Column */}
            <div className="col-span-3 space-y-4">
              <SystemStatusPanel />
              <VoiceCommandInterface />
            </div>

            {/* Center - 3D View or Charts */}
            <div className="col-span-6">
              {activeView === 'overview' && (
                <div className="bg-black/80 backdrop-blur-lg border border-cyan-500/50 rounded-lg p-4 h-[600px]">
                  <FactoryDigitalTwin />
                </div>
              )}
              {activeView === 'analytics' && (
                <div className="space-y-4">
                  <PerformanceChart />
                  <PerformanceChart />
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="col-span-3 space-y-4">
              <AlertFeed />
              <div className="bg-black/80 backdrop-blur-lg border border-blue-500/50 rounded-lg p-4">
                <h2 className="text-blue-400 text-lg font-bold mb-4">AI PREDICTIONS</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Next Maintenance:</span>
                    <span className="text-yellow-400">Line 7 - 2h 15m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Peak Efficiency:</span>
                    <span className="text-green-400">14:00 - 16:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bottleneck Risk:</span>
                    <span className="text-orange-400">Zone 3 - 18%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Quality Forecast:</span>
                    <span className="text-green-400">99.1% (+0.3%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Control Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-cyan-500/30 p-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <button className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold transition-colors">
              START PRODUCTION
            </button>
            <button className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded font-bold transition-colors">
              OPTIMIZE
            </button>
            <button className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition-colors">
              EMERGENCY STOP
            </button>
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <span className="text-gray-400">CPU: <span className="text-green-400">42%</span></span>
            <span className="text-gray-400">Memory: <span className="text-green-400">3.2GB</span></span>
            <span className="text-gray-400">Network: <span className="text-green-400">152ms</span></span>
            <span className="text-gray-400">AI Status: <span className="text-green-400">ACTIVE</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}