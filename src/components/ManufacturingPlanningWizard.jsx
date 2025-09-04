import React, { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CalendarIcon,
  ClockIcon,
  CogIcon,
  ChartBarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { cn } from '../lib/utils'

// Wizard Steps Configuration
const WIZARD_STEPS = [
  {
    id: 'demand-analysis',
    title: 'Demand Analysis',
    description: 'Analyze demand patterns and forecasting data',
    icon: ChartBarIcon
  },
  {
    id: 'capacity-planning',
    title: 'Capacity Planning', 
    description: 'Review resource availability and constraints',
    icon: CogIcon
  },
  {
    id: 'schedule-optimization',
    title: 'Schedule Optimization',
    description: 'Optimize production schedule and timing',
    icon: CalendarIcon
  },
  {
    id: 'review-approval',
    title: 'Review & Approval',
    description: 'Review plan and submit for approval',
    icon: CheckCircleIcon
  }
]

// Step Components
const DemandAnalysisStep = ({ data, onUpdate }) => {
  const { data: forecastData, isLoading } = useQuery({
    queryKey: ['demand-forecast', data.timeHorizon],
    queryFn: async () => {
      // Simulate API call for demand forecast data
      await new Promise(resolve => setTimeout(resolve, 1000))
      return {
        products: [
          { 
            id: 'SKU001', 
            name: 'Premium Supplement A', 
            currentDemand: 1200, 
            projectedDemand: 1450, 
            growth: 20.8,
            confidence: 0.87
          },
          { 
            id: 'SKU002', 
            name: 'Premium Supplement B', 
            currentDemand: 800, 
            projectedDemand: 920, 
            growth: 15.0,
            confidence: 0.92
          },
          { 
            id: 'SKU003', 
            name: 'Standard Supplement C', 
            currentDemand: 2100, 
            projectedDemand: 2280, 
            growth: 8.6,
            confidence: 0.94
          }
        ],
        totalDemandIncrease: 12.4,
        riskFactors: ['Seasonal variation', 'Supply chain constraints', 'Market competition']
      }
    },
    enabled: true
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading demand analysis...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-medium text-blue-900">Demand Forecast Summary</h3>
        </div>
        <p className="mt-2 text-sm text-blue-700">
          Overall demand is projected to increase by {forecastData?.totalDemandIncrease}% over the selected time horizon.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <h4 className="text-md font-semibold text-gray-900">Product Demand Analysis</h4>
        {forecastData?.products.map((product) => (
          <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h5 className="font-medium text-gray-900">{product.name}</h5>
                <p className="text-sm text-gray-500">SKU: {product.id}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  {product.projectedDemand} units
                </div>
                <div className={cn(
                  "text-sm font-medium",
                  product.growth > 15 ? "text-green-600" : product.growth > 5 ? "text-blue-600" : "text-gray-600"
                )}>
                  +{product.growth}% growth
                </div>
              </div>
            </div>
            
            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Current:</span>
                <div className="font-medium">{product.currentDemand}</div>
              </div>
              <div>
                <span className="text-gray-500">Projected:</span>
                <div className="font-medium">{product.projectedDemand}</div>
              </div>
              <div>
                <span className="text-gray-500">Confidence:</span>
                <div className="font-medium">{Math.round(product.confidence * 100)}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-3">Planning Parameters</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Horizon
            </label>
            <select 
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={data.timeHorizon || '30'}
              onChange={(e) => onUpdate({ timeHorizon: e.target.value })}
            >
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Safety Stock Level
            </label>
            <select 
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={data.safetyStockLevel || 'medium'}
              onChange={(e) => onUpdate({ safetyStockLevel: e.target.value })}
            >
              <option value="low">Low (5%)</option>
              <option value="medium">Medium (10%)</option>
              <option value="high">High (15%)</option>
            </select>
          </div>
        </div>
      </div>

      {forecastData?.riskFactors && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
            <h4 className="text-md font-medium text-yellow-900">Risk Factors</h4>
          </div>
          <ul className="text-sm text-yellow-800 space-y-1">
            {forecastData.riskFactors.map((risk, index) => (
              <li key={index}>• {risk}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const CapacityPlanningStep = ({ data, onUpdate }) => {
  const { data: capacityData, isLoading } = useQuery({
    queryKey: ['capacity-analysis', data.timeHorizon],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 800))
      return {
        resources: [
          {
            id: 'mixing-line-1',
            name: 'Mixing Line 1',
            type: 'Equipment',
            currentUtilization: 78,
            maxCapacity: 2000,
            availableCapacity: 440,
            status: 'available',
            maintenanceScheduled: false
          },
          {
            id: 'packaging-line-a',
            name: 'Packaging Line A', 
            type: 'Equipment',
            currentUtilization: 92,
            maxCapacity: 1800,
            availableCapacity: 144,
            status: 'constrained',
            maintenanceScheduled: true
          },
          {
            id: 'quality-control',
            name: 'Quality Control Team',
            type: 'Labor',
            currentUtilization: 85,
            maxCapacity: 40,
            availableCapacity: 6,
            status: 'available',
            maintenanceScheduled: false
          }
        ],
        bottlenecks: ['Packaging Line A'],
        recommendations: [
          'Consider additional shift for Packaging Line A',
          'Evaluate temporary capacity from Partner facilities',
          'Reschedule maintenance window for optimal throughput'
        ]
      }
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Analyzing capacity constraints...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <CogIcon className="h-5 w-5 text-green-500 mr-2" />
          <h3 className="text-lg font-medium text-green-900">Capacity Analysis</h3>
        </div>
        <p className="mt-2 text-sm text-green-700">
          Current resource utilization and capacity constraints for production planning.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="text-md font-semibold text-gray-900">Resource Capacity</h4>
        {capacityData?.resources.map((resource) => (
          <div key={resource.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h5 className="font-medium text-gray-900">{resource.name}</h5>
                <p className="text-sm text-gray-500">{resource.type}</p>
              </div>
              <div className={cn(
                "px-2 py-1 rounded text-xs font-medium",
                resource.status === 'available' ? "bg-green-100 text-green-800" :
                resource.status === 'constrained' ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              )}>
                {resource.status}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Utilization</span>
                <span className="font-medium">{resource.currentUtilization}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full",
                    resource.currentUtilization > 90 ? "bg-red-500" :
                    resource.currentUtilization > 80 ? "bg-yellow-500" :
                    "bg-green-500"
                  )}
                  style={{ width: `${resource.currentUtilization}%` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                <div>
                  <span className="text-gray-500">Available Capacity:</span>
                  <div className="font-medium">{resource.availableCapacity} units</div>
                </div>
                <div>
                  <span className="text-gray-500">Max Capacity:</span>
                  <div className="font-medium">{resource.maxCapacity} units</div>
                </div>
              </div>

              {resource.maintenanceScheduled && (
                <div className="flex items-center mt-2 text-yellow-700 text-sm">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  Maintenance scheduled
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {capacityData?.bottlenecks && capacityData.bottlenecks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            <h4 className="text-md font-medium text-red-900">Capacity Bottlenecks</h4>
          </div>
          <ul className="text-sm text-red-800 space-y-1">
            {capacityData.bottlenecks.map((bottleneck, index) => (
              <li key={index}>• {bottleneck}</li>
            ))}
          </ul>
        </div>
      )}

      {capacityData?.recommendations && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
            <h4 className="text-md font-medium text-blue-900">Recommendations</h4>
          </div>
          <ul className="text-sm text-blue-800 space-y-1">
            {capacityData.recommendations.map((rec, index) => (
              <li key={index}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const ScheduleOptimizationStep = ({ data, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center">
          <CalendarIcon className="h-5 w-5 text-purple-500 mr-2" />
          <h3 className="text-lg font-medium text-purple-900">Schedule Optimization</h3>
        </div>
        <p className="mt-2 text-sm text-purple-700">
          Optimize production schedules based on demand forecast and capacity analysis.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center py-12">
          <ArrowPathIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Optimal Schedule</h3>
          <p className="text-gray-600 mb-4">
            Our AI-powered optimization engine is creating the best production schedule for your parameters.
          </p>
          <div className="bg-gray-100 rounded-lg p-4 max-w-md mx-auto">
            <div className="text-sm text-gray-700 space-y-2">
              <div className="flex justify-between">
                <span>Products to schedule:</span>
                <span className="font-medium">3 SKUs</span>
              </div>
              <div className="flex justify-between">
                <span>Time horizon:</span>
                <span className="font-medium">{data.timeHorizon || 30} days</span>
              </div>
              <div className="flex justify-between">
                <span>Available resources:</span>
                <span className="font-medium">5 lines</span>
              </div>
              <div className="flex justify-between">
                <span>Optimization target:</span>
                <span className="font-medium">Minimize cost</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ReviewApprovalStep = ({ data, onSubmit, isSubmitting }) => {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
          <h3 className="text-lg font-medium text-green-900">Plan Review & Approval</h3>
        </div>
        <p className="mt-2 text-sm text-green-700">
          Review your manufacturing plan before submitting for approval.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Plan Summary</h4>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Planning Parameters</h5>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Time Horizon:</dt>
                <dd className="font-medium">{data.timeHorizon || 30} days</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Safety Stock:</dt>
                <dd className="font-medium">{data.safetyStockLevel || 'Medium'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Products:</dt>
                <dd className="font-medium">3 SKUs</dd>
              </div>
            </dl>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Expected Outcomes</h5>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Total Production:</dt>
                <dd className="font-medium">4,650 units</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Resource Utilization:</dt>
                <dd className="font-medium">85%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Estimated Cost:</dt>
                <dd className="font-medium">£127,500</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="border-t pt-4">
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              className="rounded border-gray-300"
              onChange={(e) => onUpdate({ approved: e.target.checked })}
            />
            <span className="text-sm text-gray-700">
              I approve this manufacturing plan and authorize production to begin.
            </span>
          </label>
        </div>

        <div className="mt-6 pt-4 border-t">
          <button
            onClick={() => onSubmit(data)}
            disabled={!data.approved || isSubmitting}
            className={cn(
              "w-full py-3 px-4 rounded-lg font-medium transition-colors",
              data.approved && !isSubmitting
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting Plan...
              </span>
            ) : (
              "Submit Manufacturing Plan"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Main Wizard Component
export const ManufacturingPlanningWizard = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [wizardData, setWizardData] = useState({})
  const queryClient = useQueryClient()

  const submitPlan = useMutation({
    mutationFn: async (planData) => {
      // Simulate API submission
      await new Promise(resolve => setTimeout(resolve, 2000))
      return { success: true, planId: 'MP-' + Date.now() }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-plans'] })
      alert(`Manufacturing plan ${result.planId} submitted successfully!`)
      onClose?.()
    }
  })

  const updateWizardData = useCallback((updates) => {
    setWizardData(prev => ({ ...prev, ...updates }))
  }, [])

  const canProceedToNext = useCallback(() => {
    switch (currentStep) {
      case 0: return wizardData.timeHorizon && wizardData.safetyStockLevel
      case 1: return true // Capacity analysis step
      case 2: return true // Schedule optimization step
      case 3: return wizardData.approved
      default: return false
    }
  }, [currentStep, wizardData])

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <DemandAnalysisStep data={wizardData} onUpdate={updateWizardData} />
      case 1:
        return <CapacityPlanningStep data={wizardData} onUpdate={updateWizardData} />
      case 2:
        return <ScheduleOptimizationStep data={wizardData} onUpdate={updateWizardData} />
      case 3:
        return (
          <ReviewApprovalStep 
            data={wizardData} 
            onUpdate={updateWizardData}
            onSubmit={submitPlan.mutate}
            isSubmitting={submitPlan.isPending}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Manufacturing Planning Wizard</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              ✕
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {WIZARD_STEPS.map((step, index) => {
                const StepIcon = step.icon
                const isActive = index === currentStep
                const isCompleted = index < currentStep
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                      isActive 
                        ? "border-blue-600 bg-blue-600 text-white" 
                        : isCompleted 
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-gray-300 bg-white text-gray-400"
                    )}>
                      {isCompleted ? (
                        <CheckCircleIcon className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <p className={cn(
                        "text-sm font-medium",
                        isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-500"
                      )}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                    {index < WIZARD_STEPS.length - 1 && (
                      <div className={cn(
                        "hidden sm:block w-20 h-0.5 mx-4",
                        index < currentStep ? "bg-green-600" : "bg-gray-300"
                      )} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                currentStep === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 bg-gray-100 hover:bg-gray-200"
              )}
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Previous
            </button>

            {currentStep < WIZARD_STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep(Math.min(WIZARD_STEPS.length - 1, currentStep + 1))}
                disabled={!canProceedToNext()}
                className={cn(
                  "flex items-center px-6 py-2 text-sm font-medium rounded-lg transition-colors",
                  canProceedToNext()
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                )}
              >
                Next
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManufacturingPlanningWizard