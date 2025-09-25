import React, { useState, useEffect, useMemo } from 'react';
import {
  CogIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClockIcon,
  WrenchScrewdriverIcon,
  CalendarIcon,
  BeakerIcon,
  SignalIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { useAI } from '../ai';
import { useRealtime } from '../realtime/RealtimeProvider';
import { useTheme } from '../theming';
import { logDebug, logInfo, logWarn, logError } from '../utils/logger';


export const PredictiveMaintenanceSystem = ({
  className = '',
  equipmentFilter = null,
  maintenanceHorizon = 30, // days
  predictionThreshold = 0.7,
  ...props
}) => {
  const { aiServices, performAIAnalysis, isLoading: aiLoading } = useAI();
  const { 
    dataStreams, 
    subscribe, 
    STREAM_TYPES 
  } = useRealtime();
  const { resolvedTheme } = useTheme();

  const [equipment, setEquipment] = useState([]);
  const [maintenancePredictions, setMaintenancePredictions] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // overview, predictions, schedule, analytics
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Equipment health states
  const HEALTH_STATES = {
    EXCELLENT: { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    GOOD: { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    FAIR: { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
    POOR: { label: 'Poor', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    CRITICAL: { label: 'Critical', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' }
  };

  // Initialize equipment data
  useEffect(() => {
    const initializeEquipment = () => {
      // Sample equipment data with realistic manufacturing equipment
      const equipmentData = [
        {
          id: 'cnc-001',
          name: 'CNC Milling Machine #1',
          type: 'CNC_MACHINE',
          location: 'Production Line A',
          installDate: '2020-03-15',
          lastMaintenance: '2024-08-15',
          operatingHours: 8750,
          healthScore: 0.85,
          vibrationLevel: 2.3,
          temperature: 68.5,
          powerConsumption: 12.4,
          efficiency: 0.92,
          predictedFailureRisk: 0.15
        },
        {
          id: 'conv-001',
          name: 'Conveyor Belt System #1',
          type: 'CONVEYOR',
          location: 'Assembly Line B',
          installDate: '2019-11-20',
          lastMaintenance: '2024-09-01',
          operatingHours: 12200,
          healthScore: 0.78,
          vibrationLevel: 1.8,
          temperature: 45.2,
          powerConsumption: 5.7,
          efficiency: 0.89,
          predictedFailureRisk: 0.35
        },
        {
          id: 'pump-001',
          name: 'Hydraulic Pump #1',
          type: 'PUMP',
          location: 'Utility Room',
          installDate: '2021-01-10',
          lastMaintenance: '2024-08-20',
          operatingHours: 6800,
          healthScore: 0.91,
          vibrationLevel: 1.2,
          temperature: 72.1,
          powerConsumption: 8.9,
          efficiency: 0.95,
          predictedFailureRisk: 0.08
        },
        {
          id: 'press-001',
          name: 'Hydraulic Press #1',
          type: 'PRESS',
          location: 'Production Line C',
          installDate: '2018-07-22',
          lastMaintenance: '2024-07-10',
          operatingHours: 15600,
          healthScore: 0.68,
          vibrationLevel: 3.1,
          temperature: 85.3,
          powerConsumption: 18.2,
          efficiency: 0.82,
          predictedFailureRisk: 0.52
        }
      ];

      setEquipment(equipmentData);
    };

    initializeEquipment();
  }, []);

  // Subscribe to equipment sensor data
  useEffect(() => {
    const unsubscribers = [
      subscribe(STREAM_TYPES.VIBRATION_SENSORS, (data) => {
        updateEquipmentSensorData(data, 'vibrationLevel');
      }),
      subscribe(STREAM_TYPES.TEMPERATURE_SENSORS, (data) => {
        updateEquipmentSensorData(data, 'temperature');
      }),
      subscribe(STREAM_TYPES.EQUIPMENT_STATUS, (data) => {
        updateEquipmentStatus(data);
      })
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [subscribe, STREAM_TYPES]);

  // Update equipment sensor data
  const updateEquipmentSensorData = (data, sensorType) => {
    setEquipment(prev => prev.map(eq => {
      if (data.equipmentId === eq.id) {
        return {
          ...eq,
          [sensorType]: data.value,
          lastUpdate: Date.now()
        };
      }
      return eq;
    }));
  };

  // Update equipment status
  const updateEquipmentStatus = (data) => {
    setEquipment(prev => prev.map(eq => {
      if (data.equipmentId === eq.id) {
        return {
          ...eq,
          ...data,
          lastUpdate: Date.now()
        };
      }
      return eq;
    }));
  };

  // Run AI-powered predictive analysis
  const runPredictiveAnalysis = async () => {
    if (!aiServices.maintenancePrediction) return;

    setIsAnalyzing(true);

    try {
      // Prepare equipment data for AI analysis
      const analysisData = equipment.map(eq => ({
        equipmentId: eq.id,
        type: eq.type,
        operatingHours: eq.operatingHours,
        vibrationLevel: eq.vibrationLevel,
        temperature: eq.temperature,
        powerConsumption: eq.powerConsumption,
        efficiency: eq.efficiency,
        lastMaintenanceDate: eq.lastMaintenance,
        installDate: eq.installDate
      }));

      const predictions = await performAIAnalysis('maintenancePrediction', {
        equipment: analysisData,
        horizon: maintenanceHorizon,
        threshold: predictionThreshold
      });

      setMaintenancePredictions(predictions.predictions || []);
      setAnomalies(predictions.anomalies || []);
      
      // Generate maintenance schedule
      generateMaintenanceSchedule(predictions.predictions || []);

    } catch (error) {
      logError('Predictive analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate maintenance schedule based on predictions
  const generateMaintenanceSchedule = (predictions) => {
    const schedule = predictions
      .filter(pred => pred.failureRisk > predictionThreshold)
      .map(pred => {
        const equipment = getEquipmentById(pred.equipmentId);
        const daysToMaintenance = Math.max(1, Math.floor(pred.timeToFailure * 0.8)); // Schedule before predicted failure
        
        return {
          id: `maint-${pred.equipmentId}-${Date.now()}`,
          equipmentId: pred.equipmentId,
          equipmentName: equipment?.name || 'Unknown Equipment',
          type: pred.recommendedAction || 'Preventive Maintenance',
          scheduledDate: new Date(Date.now() + daysToMaintenance * 24 * 60 * 60 * 1000),
          priority: pred.failureRisk > 0.8 ? 'HIGH' : 'MEDIUM',
          estimatedDuration: pred.estimatedRepairTime || 4,
          description: pred.description || 'Preventive maintenance based on predictive analysis'
        };
      });

    setMaintenanceSchedule(schedule);
  };

  // Get equipment by ID
  const getEquipmentById = (id) => {
    return equipment.find(eq => eq.id === id);
  };

  // Calculate equipment health score
  const calculateHealthScore = (eq) => {
    let score = 1.0;
    
    // Factor in age
    const ageYears = (Date.now() - new Date(eq.installDate).getTime()) / (365 * 24 * 60 * 60 * 1000);
    score -= Math.min(0.3, ageYears * 0.05);
    
    // Factor in operating hours
    const expectedHoursPerYear = 2000; // 8 hours/day * 250 working days
    const expectedHours = ageYears * expectedHoursPerYear;
    const usageRatio = eq.operatingHours / expectedHours;
    score -= Math.min(0.2, Math.max(0, usageRatio - 1) * 0.5);
    
    // Factor in sensor readings
    if (eq.vibrationLevel > 3.0) score -= 0.1;
    if (eq.temperature > 80) score -= 0.1;
    if (eq.efficiency < 0.85) score -= 0.1;
    
    return Math.max(0, Math.min(1, score));
  };

  // Get health state based on score
  const getHealthState = (score) => {
    if (score >= 0.9) return HEALTH_STATES.EXCELLENT;
    if (score >= 0.8) return HEALTH_STATES.GOOD;
    if (score >= 0.7) return HEALTH_STATES.FAIR;
    if (score >= 0.6) return HEALTH_STATES.POOR;
    return HEALTH_STATES.CRITICAL;
  };

  // Filter equipment based on current filter
  const filteredEquipment = useMemo(() => {
    let filtered = equipment;
    
    if (equipmentFilter) {
      filtered = filtered.filter(eq => eq.type === equipmentFilter);
    }
    
    return filtered.map(eq => ({
      ...eq,
      calculatedHealthScore: calculateHealthScore(eq),
      healthState: getHealthState(calculateHealthScore(eq))
    }));
  }, [equipment, equipmentFilter]);

  // Pending maintenance items
  const pendingMaintenance = useMemo(() => {
    return maintenanceSchedule.filter(item => 
      new Date(item.scheduledDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
    ).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
  }, [maintenanceSchedule]);

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
              <CogIcon className="w-6 h-6 mr-3 text-blue-600" />
              <h2 className={`text-xl font-semibold ${textPrimaryClasses}`}>
                Predictive Maintenance System
              </h2>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={runPredictiveAnalysis}
                disabled={isAnalyzing || aiLoading}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors
                  ${isAnalyzing || aiLoading
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                  }
                `}
              >
                {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
              </button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {['overview', 'predictions', 'schedule', 'analytics'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${viewMode === mode
                    ? 'bg-white shadow text-blue-600 dark:bg-gray-800 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
                  }
                `}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Equipment Health Overview */}
          <div className={`lg:col-span-2 ${cardClasses}`}>
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-4 ${textPrimaryClasses}`}>
                Equipment Health Status
              </h3>
              <div className="space-y-4">
                {filteredEquipment.map(eq => (
                  <div
                    key={eq.id}
                    className={`
                      p-4 rounded-lg border cursor-pointer transition-colors
                      ${selectedEquipment?.id === eq.id
                        ? 'ring-2 ring-blue-500 border-blue-300 dark:border-blue-600'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                      }
                      ${resolvedTheme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}
                    `}
                    onClick={() => setSelectedEquipment(eq)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`
                          w-3 h-3 rounded-full
                          ${eq.healthState.color.includes('green') ? 'bg-green-500' :
                            eq.healthState.color.includes('blue') ? 'bg-blue-500' :
                            eq.healthState.color.includes('yellow') ? 'bg-yellow-500' :
                            eq.healthState.color.includes('orange') ? 'bg-orange-500' :
                            'bg-red-500'
                          }
                        `} />
                        <div>
                          <h4 className={`font-medium ${textPrimaryClasses}`}>{eq.name}</h4>
                          <p className={`text-sm ${textMutedClasses}`}>{eq.location}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${eq.healthState.bg} ${eq.healthState.color}
                        `}>
                          {eq.healthState.label}
                        </div>
                        <p className={`text-sm mt-1 ${textMutedClasses}`}>
                          {Math.round(eq.calculatedHealthScore * 100)}% Health
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="text-center">
                        <p className={`text-xs ${textMutedClasses}`}>Vibration</p>
                        <p className={`font-medium ${textSecondaryClasses}`}>{eq.vibrationLevel}mm/s</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-xs ${textMutedClasses}`}>Temp</p>
                        <p className={`font-medium ${textSecondaryClasses}`}>{eq.temperature}Â°C</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-xs ${textMutedClasses}`}>Efficiency</p>
                        <p className={`font-medium ${textSecondaryClasses}`}>{Math.round(eq.efficiency * 100)}%</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-xs ${textMutedClasses}`}>Hours</p>
                        <p className={`font-medium ${textSecondaryClasses}`}>{eq.operatingHours.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pending Maintenance */}
          <div className={cardClasses}>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <CalendarIcon className="w-5 h-5 mr-2 text-orange-600" />
                <h3 className={`text-lg font-semibold ${textPrimaryClasses}`}>
                  Pending Maintenance
                </h3>
              </div>
              
              {pendingMaintenance.length > 0 ? (
                <div className="space-y-3">
                  {pendingMaintenance.slice(0, 5).map(item => (
                    <div key={item.id} className="border-l-4 border-orange-500 pl-3">
                      <h4 className={`font-medium ${textPrimaryClasses}`}>{item.equipmentName}</h4>
                      <p className={`text-sm ${textSecondaryClasses}`}>{item.type}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className={`text-xs ${textMutedClasses}`}>
                          {new Date(item.scheduledDate).toLocaleDateString()}
                        </span>
                        <span className={`
                          text-xs px-2 py-1 rounded
                          ${item.priority === 'HIGH' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                          }
                        `}>
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <WrenchScrewdriverIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className={textSecondaryClasses}>No pending maintenance</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Other view modes would be implemented here */}
      {/* For brevity, showing just the overview mode in this implementation */}
    </div>
  );
};

export default PredictiveMaintenanceSystem;
