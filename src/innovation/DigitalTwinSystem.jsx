import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  CubeTransparentIcon,
  VideoCameraIcon,
  CpuChipIcon,
  SignalIcon,
  ArrowPathIcon,
  PresentationChartLineIcon,
  CameraIcon,
  GlobeAltIcon,
  RocketLaunchIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useAI } from '../ai';
import { useRealtime } from '../realtime/RealtimeProvider';
import { useTheme } from '../theming';

export const DigitalTwinSystem = ({
  className = '',
  enableAR = true,
  enableVR = false,
  autoSync = true,
  ...props
}) => {
  const { performAIAnalysis, isLoading: aiLoading } = useAI();
  const { 
    dataStreams, 
    subscribe, 
    STREAM_TYPES 
  } = useRealtime();
  const { resolvedTheme } = useTheme();
  
  // Digital twin states
  const [twins, setTwins] = useState([]);
  const [selectedTwin, setSelectedTwin] = useState(null);
  const [simulationData, setSimulationData] = useState({});
  const [arSession, setArSession] = useState(null);
  const [vrSession, setVrSession] = useState(null);
  const [synchronizationStatus, setSynchronizationStatus] = useState('idle');
  const [viewMode, setViewMode] = useState('overview');
  const [is3DLoaded, setIs3DLoaded] = useState(false);
  const canvasRef = useRef(null);

  // Digital twin models
  const DIGITAL_TWIN_MODELS = [
    {
      id: 'dt-production-line-a',
      name: 'Production Line A - Digital Twin',
      type: 'production_line',
      physicalAssetId: 'prod-line-a',
      modelUrl: '/models/production-line-a.gltf',
      realTimeData: true,
      sensors: 45,
      actuators: 12,
      lastSync: Date.now() - 5000,
      accuracy: 98.5,
      status: 'synchronized',
      capabilities: ['simulation', 'prediction', 'optimization', 'ar_overlay']
    },
    {
      id: 'dt-cnc-machine-01',
      name: 'CNC Machine #1 - Digital Twin',
      type: 'cnc_machine',
      physicalAssetId: 'cnc-001',
      modelUrl: '/models/cnc-machine.gltf',
      realTimeData: true,
      sensors: 18,
      actuators: 6,
      lastSync: Date.now() - 3000,
      accuracy: 96.8,
      status: 'synchronized',
      capabilities: ['simulation', 'maintenance_prediction', 'performance_optimization']
    },
    {
      id: 'dt-warehouse-01',
      name: 'Main Warehouse - Digital Twin',
      type: 'warehouse',
      physicalAssetId: 'warehouse-main',
      modelUrl: '/models/warehouse.gltf',
      realTimeData: true,
      sensors: 120,
      actuators: 30,
      lastSync: Date.now() - 8000,
      accuracy: 94.2,
      status: 'updating',
      capabilities: ['inventory_tracking', 'route_optimization', 'space_utilization']
    },
    {
      id: 'dt-assembly-robot-01',
      name: 'Assembly Robot Arm #1 - Digital Twin',
      type: 'robot',
      physicalAssetId: 'robot-001',
      modelUrl: '/models/robot-arm.gltf',
      realTimeData: true,
      sensors: 24,
      actuators: 8,
      lastSync: Date.now() - 2000,
      accuracy: 99.1,
      status: 'synchronized',
      capabilities: ['motion_planning', 'collision_detection', 'path_optimization', 'vr_control']
    }
  ];

  // Simulation scenarios
  const SIMULATION_SCENARIOS = [
    {
      id: 'scenario-01',
      name: 'Peak Production Load',
      description: 'Simulate maximum production capacity',
      type: 'stress_test',
      parameters: {
        productionRate: 150,
        duration: 480,
        shiftPattern: '3-shift'
      }
    },
    {
      id: 'scenario-02',
      name: 'Equipment Failure Impact',
      description: 'Analyze impact of critical equipment failure',
      type: 'failure_analysis',
      parameters: {
        failedEquipment: 'cnc-001',
        downtime: 240,
        alternativeRouting: true
      }
    },
    {
      id: 'scenario-03',
      name: 'Energy Optimization',
      description: 'Optimize energy consumption patterns',
      type: 'optimization',
      parameters: {
        targetReduction: 15,
        constraints: ['quality', 'throughput'],
        timeframe: 'monthly'
      }
    },
    {
      id: 'scenario-04',
      name: 'New Product Introduction',
      description: 'Simulate introduction of new product line',
      type: 'npi',
      parameters: {
        productComplexity: 'high',
        volumeRampUp: 'gradual',
        learningCurve: 0.85
      }
    }
  ];

  // Initialize digital twins
  useEffect(() => {
    setTwins(DIGITAL_TWIN_MODELS);
    if (autoSync) {
      startSynchronization();
    }
  }, [autoSync]);

  // Subscribe to real-time data for twins
  useEffect(() => {
    const unsubscribers = twins.map(twin => {
      return subscribe(STREAM_TYPES.EQUIPMENT_STATUS, (data) => {
        if (data.equipmentId === twin.physicalAssetId) {
          updateTwinData(twin.id, data);
        }
      });
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [twins, subscribe, STREAM_TYPES]);

  // Start synchronization with physical assets
  const startSynchronization = () => {
    setSynchronizationStatus('syncing');
    
    // Simulate continuous synchronization
    const syncInterval = setInterval(() => {
      setTwins(prev => prev.map(twin => ({
        ...twin,
        lastSync: Date.now(),
        accuracy: Math.min(100, twin.accuracy + (Math.random() - 0.5) * 2),
        status: Math.random() > 0.1 ? 'synchronized' : 'updating'
      })));
    }, 5000);

    return () => clearInterval(syncInterval);
  };

  // Update twin data with real-time information
  const updateTwinData = (twinId, data) => {
    setSimulationData(prev => ({
      ...prev,
      [twinId]: {
        ...prev[twinId],
        ...data,
        timestamp: Date.now()
      }
    }));
  };

  // Run simulation scenario
  const runSimulation = async (twinId, scenarioId) => {
    const twin = twins.find(t => t.id === twinId);
    const scenario = SIMULATION_SCENARIOS.find(s => s.id === scenarioId);
    
    if (!twin || !scenario) return;

    try {
      // Simulate AI-powered analysis
      const result = await performAIAnalysis('digitalTwinSimulation', {
        twin: twin,
        scenario: scenario,
        currentData: simulationData[twinId] || {}
      });

      // Update simulation results
      setSimulationData(prev => ({
        ...prev,
        [twinId]: {
          ...prev[twinId],
          simulations: {
            ...prev[twinId]?.simulations,
            [scenarioId]: {
              result,
              timestamp: Date.now(),
              status: 'completed'
            }
          }
        }
      }));

      return result;
    } catch (error) {
      console.error('Simulation failed:', error);
      return null;
    }
  };

  // Initialize AR session
  const initializeAR = async () => {
    if (!enableAR || !navigator.xr) {
      console.warn('AR not supported or disabled');
      return;
    }

    try {
      // Check for AR support
      const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
      
      if (isSupported) {
        // Request AR session
        const session = await navigator.xr.requestSession('immersive-ar', {
          requiredFeatures: ['hit-test', 'dom-overlay'],
          domOverlay: { root: document.body }
        });
        
        setArSession(session);
        
        // Setup AR rendering
        setupARRendering(session);
      }
    } catch (error) {
      console.error('Failed to initialize AR:', error);
    }
  };

  // Setup AR rendering
  const setupARRendering = (session) => {
    // This would include WebXR setup, Three.js integration, etc.
    console.log('AR rendering setup for session:', session);
  };

  // Initialize VR session
  const initializeVR = async () => {
    if (!enableVR || !navigator.xr) {
      console.warn('VR not supported or disabled');
      return;
    }

    try {
      // Check for VR support
      const isSupported = await navigator.xr.isSessionSupported('immersive-vr');
      
      if (isSupported) {
        // Request VR session
        const session = await navigator.xr.requestSession('immersive-vr');
        
        setVrSession(session);
        
        // Setup VR rendering
        setupVRRendering(session);
      }
    } catch (error) {
      console.error('Failed to initialize VR:', error);
    }
  };

  // Setup VR rendering
  const setupVRRendering = (session) => {
    // This would include WebXR setup, Three.js integration, etc.
    console.log('VR rendering setup for session:', session);
  };

  // Calculate twin health score
  const calculateTwinHealth = (twin) => {
    const syncScore = twin.status === 'synchronized' ? 100 : 80;
    const accuracyScore = twin.accuracy;
    const sensorScore = (twin.sensors / 50) * 100; // Normalize to 100
    
    return Math.round((syncScore + accuracyScore + sensorScore) / 3);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'synchronized':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'updating':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
      case 'disconnected':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'maintenance':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const cardClasses = `
    rounded-lg border shadow-sm
    ${resolvedTheme === 'dark'
      ? 'bg-slate-800 border-slate-700'
      : 'bg-white border-gray-200'
    }
  `;

  const textPrimaryClasses = resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const textSecondaryClasses = resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const textMutedClasses = resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`space-y-6 ${className}`} {...props}>
      {/* Header */}
      <div className={cardClasses}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CubeTransparentIcon className="w-6 h-6 mr-3 text-purple-600" />
              <h2 className={`text-xl font-semibold ${textPrimaryClasses}`}>
                Digital Twin & AR/VR Integration
              </h2>
              <span className="ml-3 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full dark:bg-purple-900/30 dark:text-purple-400">
                INNOVATION LAB
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              {enableAR && (
                <button
                  onClick={initializeAR}
                  className={`
                    px-3 py-2 rounded-lg font-medium transition-colors flex items-center
                    ${arSession
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600'
                    }
                  `}
                >
                  <CameraIcon className="w-4 h-4 mr-2" />
                  {arSession ? 'AR Active' : 'Start AR'}
                </button>
              )}
              
              {enableVR && (
                <button
                  onClick={initializeVR}
                  className={`
                    px-3 py-2 rounded-lg font-medium transition-colors flex items-center
                    ${vrSession
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                    }
                  `}
                >
                  <VideoCameraIcon className="w-4 h-4 mr-2" />
                  {vrSession ? 'VR Active' : 'Start VR'}
                </button>
              )}
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {['overview', '3d-view', 'simulations', 'analytics', 'control'].map(view => (
              <button
                key={view}
                onClick={() => setViewMode(view)}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${viewMode === view
                    ? 'bg-white shadow text-purple-600 dark:bg-gray-800 dark:text-purple-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
                  }
                `}
              >
                {view === '3d-view' ? '3D View' : view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {twins.map(twin => (
            <div key={twin.id} className={cardClasses}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${twin.type === 'production_line' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        twin.type === 'cnc_machine' ? 'bg-green-100 dark:bg-green-900/30' :
                        twin.type === 'warehouse' ? 'bg-orange-100 dark:bg-orange-900/30' :
                        'bg-purple-100 dark:bg-purple-900/30'
                      }
                    `}>
                      <CpuChipIcon className={`
                        w-6 h-6
                        ${twin.type === 'production_line' ? 'text-blue-600' :
                          twin.type === 'cnc_machine' ? 'text-green-600' :
                          twin.type === 'warehouse' ? 'text-orange-600' :
                          'text-purple-600'
                        }
                      `} />
                    </div>
                  </div>
                  
                  <div className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${getStatusColor(twin.status)}
                  `}>
                    {twin.status}
                  </div>
                </div>

                <h3 className={`font-semibold mb-2 ${textPrimaryClasses}`}>
                  {twin.name}
                </h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className={textSecondaryClasses}>Health Score</span>
                    <span className={`font-medium ${
                      calculateTwinHealth(twin) >= 90 ? 'text-green-600' :
                      calculateTwinHealth(twin) >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {calculateTwinHealth(twin)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className={textSecondaryClasses}>Accuracy</span>
                    <span className={`font-medium ${textPrimaryClasses}`}>
                      {twin.accuracy.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className={textSecondaryClasses}>Sensors</span>
                    <span className={`font-medium ${textPrimaryClasses}`}>
                      {twin.sensors}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex items-center">
                    <SignalIcon className={`
                      w-4 h-4 mr-1
                      ${twin.realTimeData ? 'text-green-500' : 'text-gray-400'}
                    `} />
                    <span className={`text-xs ${textMutedClasses}`}>
                      {twin.realTimeData ? 'Live' : 'Offline'}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setSelectedTwin(twin)}
                    className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3D View */}
      {viewMode === '3d-view' && (
        <div className={cardClasses}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${textPrimaryClasses}`}>
                3D Digital Twin Visualization
              </h3>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700">
                  <ArrowPathIcon className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700">
                  <CameraIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div 
              ref={canvasRef}
              className={`
                w-full h-96 rounded-lg flex items-center justify-center
                ${resolvedTheme === 'dark' ? 'bg-slate-900' : 'bg-gray-100'}
              `}
            >
              {!is3DLoaded ? (
                <div className="text-center">
                  <CubeTransparentIcon className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                  <p className={`text-lg font-medium ${textPrimaryClasses}`}>
                    3D Visualization
                  </p>
                  <p className={`text-sm ${textSecondaryClasses}`}>
                    Three.js integration would render here
                  </p>
                </div>
              ) : (
                <canvas className="w-full h-full" />
              )}
            </div>

            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">98.5%</div>
                <div className={`text-sm ${textMutedClasses}`}>Model Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">45</div>
                <div className={`text-sm ${textMutedClasses}`}>Active Sensors</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">12</div>
                <div className={`text-sm ${textMutedClasses}`}>Actuators</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">5ms</div>
                <div className={`text-sm ${textMutedClasses}`}>Latency</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulations */}
      {viewMode === 'simulations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={cardClasses}>
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-4 ${textPrimaryClasses}`}>
                Available Scenarios
              </h3>
              
              <div className="space-y-3">
                {SIMULATION_SCENARIOS.map(scenario => (
                  <div key={scenario.id} className={`
                    p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow
                    ${resolvedTheme === 'dark' 
                      ? 'bg-slate-700 border-slate-600 hover:border-purple-500' 
                      : 'bg-gray-50 border-gray-200 hover:border-purple-300'
                    }
                  `}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-medium ${textPrimaryClasses}`}>
                        {scenario.name}
                      </h4>
                      <RocketLaunchIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    
                    <p className={`text-sm mb-3 ${textSecondaryClasses}`}>
                      {scenario.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className={`
                        px-2 py-1 rounded text-xs font-medium
                        ${scenario.type === 'stress_test' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          scenario.type === 'optimization' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          scenario.type === 'failure_analysis' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }
                      `}>
                        {scenario.type.replace('_', ' ').toUpperCase()}
                      </span>
                      
                      <button
                        onClick={() => selectedTwin && runSimulation(selectedTwin.id, scenario.id)}
                        className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
                      >
                        Run Simulation
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={cardClasses}>
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-4 ${textPrimaryClasses}`}>
                Simulation Results
              </h3>
              
              <div className="space-y-4">
                <div className="text-center py-8">
                  <SparklesIcon className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                  <p className={textSecondaryClasses}>
                    Run a simulation to see results
                  </p>
                  <p className={`text-sm ${textMutedClasses}`}>
                    AI-powered analysis and predictions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalTwinSystem;