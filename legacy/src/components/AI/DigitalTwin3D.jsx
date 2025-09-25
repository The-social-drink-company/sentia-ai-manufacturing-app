import React, { useState, useEffect, useRef } from 'react';
import {
  CubeTransparentIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  CogIcon,
  BeakerIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

const DigitalTwin3D = ({ digitalTwinData = {}, className = "" }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedView, setSelectedView] = useState('overview');
  const [currentBatch, setCurrentBatch] = useState(null);
  const animationRef = useRef();
  
  // Use digitalTwinData prop
  const _ = digitalTwinData; // Acknowledge prop usage

  // Mock digital twin data
  const [twinState, setTwinState] = useState({
    mixingTanks: [
      { id: 'MX-001', status: 'active', progress: 75, product: 'GABA Red', capacity: 1000, current: 750 },
      { id: 'MX-002', status: 'cleaning', progress: 100, product: null, capacity: 1000, current: 0 },
      { id: 'MX-003', status: 'idle', progress: 0, product: null, capacity: 1200, current: 0 }
    ],
    bottlingLines: [
      { id: 'BL-A', status: 'running', progress: 45, speed: 850, efficiency: 94.2, product: 'GABA Gold' },
      { id: 'BL-B', status: 'maintenance', progress: 0, speed: 0, efficiency: 0, product: null }
    ],
    qualityStations: [
      { id: 'QC-001', status: 'active', samplesPerHour: 24, passRate: 98.5, currentSample: 'GAB-R-2401' },
      { id: 'QC-002', status: 'idle', samplesPerHour: 0, passRate: 100, currentSample: null }
    ],
    warehouse: {
      rawMaterials: { occupancy: 68, capacity: 5000, alerts: 2 },
      finishedGoods: { occupancy: 82, capacity: 8000, alerts: 1 },
      packaging: { occupancy: 45, capacity: 2000, alerts: 0 }
    },
    environmentalSensors: {
      temperature: 21.5,
      humidity: 45,
      airQuality: 'Good',
      pressure: 1013.25
    }
  });

  // Animation loop for real-time updates
  useEffect(() => {
    if (isRunning) {
      const animate = () => {
        setTwinState(prevState => ({
          ...prevState,
          mixingTanks: prevState.mixingTanks.map(tank => ({
            ...tank,
            progress: tank.status === 'active' ? 
              Math.min(100, tank.progress + 0;
        
        if (typeof window !== 'undefined' && window.requestAnimationFrame) {
          animationRef.current = window.requestAnimationFrame(animate);
        }
      };
      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        animationRef.current = window.requestAnimationFrame(animate);
      }
    }

    return () => {
      if (animationRef.current) {
        if (typeof window !== 'undefined' && window.cancelAnimationFrame) {
          window.cancelAnimationFrame(animationRef.current);
        }
      }
    };
  }, [isRunning]);

  const toggleSimulation = () => {
    setIsRunning(!isRunning);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setTwinState(prevState => ({
      ...prevState,
      mixingTanks: prevState.mixingTanks.map(tank => ({
        ...tank,
        progress: 0,
        current: 0,
        status: 'idle'
      })),
      bottlingLines: prevState.bottlingLines.map(line => ({
        ...line,
        progress: 0,
        efficiency: 0,
        status: 'idle'
      }))
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'running': return 'text-green-600 bg-green-100';
      case 'maintenance':
      case 'cleaning': return 'text-yellow-600 bg-yellow-100';
      case 'idle': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Simple 3D-like visualization using CSS transforms
  const FacilityVisualization = () => (
    <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative transform-gpu" style={{ perspective: '1000px' }}>
          
          {/* Mixing Area */}
          <div className="absolute -translate-x-32 -translate-y-16" style={{ transformStyle: 'preserve-3d' }}>
            <div className="text-xs font-semibold text-gray-600 mb-2">Mixing Facility</div>
            {twinState.mixingTanks.map((tank, index) => (
              <div
                key={tank.id}
                className={`w-16 h-20 rounded-lg border-2 mb-2 relative overflow-hidden transition-all duration-500 ${
                  tank.status === 'active' ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'
                }`}
                style={{ 
                  transform: `rotateX(5deg) rotateY(${10 + index * 5}deg)`,
                  marginLeft: `${index * 20}px`
                }}
              >
                <div 
                  className={`absolute bottom-0 w-full transition-all duration-1000 ${
                    tank.status === 'active' ? 'bg-green-400' : 'bg-gray-300'
                  }`}
                  style={{ height: `${tank.progress}%` }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-xs">
                  <BeakerIcon className="h-4 w-4 mb-1" />
                  <span className="font-mono">{tank.id}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottling Area */}
          <div className="absolute translate-x-16 -translate-y-8" style={{ transformStyle: 'preserve-3d' }}>
            <div className="text-xs font-semibold text-gray-600 mb-2">Bottling Lines</div>
            {twinState.bottlingLines.map((line, index) => (
              <div
                key={line.id}
                className={`w-24 h-12 rounded-lg border-2 mb-2 relative overflow-hidden transition-all duration-500 ${
                  line.status === 'running' ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'
                }`}
                style={{ 
                  transform: `rotateX(-5deg) rotateY(${-10 - index * 5}deg)`,
                  marginTop: `${index * 16}px`
                }}
              >
                <div 
                  className={`absolute left-0 h-full transition-all duration-500 ${
                    line.status === 'running' ? 'bg-blue-400' : 'bg-gray-300'
                  }`}
                  style={{ width: `${line.progress}%` }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-xs">
                  <CogIcon className={`h-4 w-4 mb-1 ${line.status === 'running' ? 'animate-spin' : ''}`} />
                  <span className="font-mono">{line.id}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Warehouse Area */}
          <div className="absolute translate-x-48 translate-y-8" style={{ transformStyle: 'preserve-3d' }}>
            <div className="text-xs font-semibold text-gray-600 mb-2">Warehouse</div>
            <div
              className="w-20 h-16 rounded-lg border-2 border-purple-400 bg-purple-50 relative"
              style={{ transform: 'rotateX(10deg) rotateY(-15deg)' }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center text-xs">
                <TruckIcon className="h-4 w-4 mb-1" />
                <span className="font-mono">WH-001</span>
                <span className="text-xs">{twinState.warehouse.finishedGoods.occupancy}%</span>
              </div>
            </div>
          </div>

          {/* Conveyor System (animated line) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
              </marker>
            </defs>
            <path
              d="M 150 200 Q 250 180 350 200"
              stroke="#6366f1"
              strokeWidth="3"
              fill="none"
              markerEnd="url(#arrowhead)"
              strokeDasharray="10,5"
              className={isRunning ? "animate-pulse" : ""}
            />
          </svg>

        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CubeTransparentIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Digital Twin Platform</h3>
              <p className="text-sm text-gray-500">Real-time facility simulation</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleSimulation}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
                isRunning 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isRunning ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
              <span>{isRunning ? 'Pause' : 'Start'} Simulation</span>
            </button>
            <button
              onClick={resetSimulation}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* View Selection */}
        <div className="flex space-x-2">
          {['overview', 'mixing', 'bottling', 'warehouse'].map((view) => (
            <button
              key={view}
              onClick={() => setSelectedView(view)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                selectedView === view
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Visualization */}
      <div className="p-6">
        <FacilityVisualization />
      </div>

      {/* Real-time Metrics */}
      <div className="p-6 border-t border-gray-200">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Live Equipment Status</h4>
        
        {/* Mixing Tanks */}
        <div className="mb-6">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Mixing Tanks</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {twinState.mixingTanks.map((tank) => (
              <div key={tank.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{tank.id}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(tank.status)}`}>
                    {tank.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Progress: {Math.round(tank.progress)}%</div>
                  <div>Volume: {Math.round(tank.current)}L / {tank.capacity}L</div>
                  {tank.product && <div>Product: {tank.product}</div>}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-400 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${tank.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottling Lines */}
        <div className="mb-6">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Bottling Lines</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {twinState.bottlingLines.map((line) => (
              <div key={line.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{line.id}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(line.status)}`}>
                    {line.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Speed: {line.speed} units/hr</div>
                  <div>Efficiency: {line.efficiency.toFixed(1)}%</div>
                  {line.product && <div>Product: {line.product}</div>}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-400 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${line.efficiency}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Environmental Sensors */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Environmental Conditions</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-600">Temperature</p>
              <p className="text-xl font-bold text-blue-900">{twinState.environmentalSensors.temperature.toFixed(1)}Â°C</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-green-600">Humidity</p>
              <p className="text-xl font-bold text-green-900">{Math.round(twinState.environmentalSensors.humidity)}%</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-sm text-purple-600">Air Quality</p>
              <p className="text-xl font-bold text-purple-900">{twinState.environmentalSensors.airQuality}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-sm text-yellow-600">Pressure</p>
              <p className="text-xl font-bold text-yellow-900">{twinState.environmentalSensors.pressure} hPa</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalTwin3D;
