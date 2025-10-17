import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DocumentChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

// Progressive testing component for Financial Reports
const ProgressiveFinancialReports = () => {
  console.log('[DEBUG] ProgressiveFinancialReports component rendering...')

  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState([])

  const steps = [
    {
      id: 1,
      name: 'Basic Component Structure',
      description: 'Basic page layout and structure',
      status: 'completed',
    },
    {
      id: 2,
      name: 'Import useFinancialData Hook',
      description: 'Test the custom data hook',
      status: currentStep >= 2 ? 'testing' : 'pending',
    },
    {
      id: 3,
      name: 'Import FinancialKPIStrip',
      description: 'KPI metrics component',
      status: currentStep >= 3 ? 'testing' : 'pending',
    },
    {
      id: 4,
      name: 'Import FinancialCharts',
      description: 'Charts component with Recharts',
      status: currentStep >= 4 ? 'testing' : 'pending',
    },
    {
      id: 5,
      name: 'Import FinancialInsights',
      description: 'AI insights component',
      status: currentStep >= 5 ? 'testing' : 'pending',
    },
    {
      id: 6,
      name: 'Import ProductPerformanceTable',
      description: 'Product performance table',
      status: currentStep >= 6 ? 'testing' : 'pending',
    },
  ]

  const runNextStep = async () => {
    try {
      console.log(`[DEBUG] Running step ${currentStep + 1}...`)

      switch (currentStep + 1) {
        case 2: {
          // Test importing the hook
          const hookModule = await import('@/hooks/useFinancialData')
          console.log('[DEBUG] useFinancialData hook imported successfully:', hookModule)
          break
        }

        case 3: {
          // Test importing KPI Strip
          const kpiModule = await import('@/components/financial/FinancialKPIStrip')
          console.log('[DEBUG] FinancialKPIStrip imported successfully:', kpiModule)
          break
        }

        case 4: {
          // Test importing Charts
          const chartsModule = await import('@/components/financial/FinancialCharts')
          console.log('[DEBUG] FinancialCharts imported successfully:', chartsModule)
          break
        }

        case 5: {
          // Test importing Insights
          const insightsModule = await import('@/components/financial/FinancialInsights')
          console.log('[DEBUG] FinancialInsights imported successfully:', insightsModule)
          break
        }

        case 6: {
          // Test importing Product Table
          const tableModule = await import('@/components/financial/ProductPerformanceTable')
          console.log('[DEBUG] ProductPerformanceTable imported successfully:', tableModule)
          break
        }

        default:
          console.log('[DEBUG] All components imported successfully!')
      }

      setCurrentStep(prev => prev + 1)
    } catch (error) {
      console.error(`[DEBUG] Step ${currentStep + 1} failed:`, error)
      setErrors(prev => [
        ...prev,
        {
          step: currentStep + 1,
          error: error.message,
          stack: error.stack,
        },
      ])
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <DocumentChartBarIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-blue-800">
                Financial Reports - Progressive Testing
              </h1>
              <p className="text-blue-600">
                Testing each component import to identify the failing dependency
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Component Import Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map(step => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg ${
                    step.status === 'completed'
                      ? 'bg-green-50 border border-green-200'
                      : step.status === 'testing'
                        ? 'bg-yellow-50 border border-yellow-200'
                        : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {step.status === 'completed' && (
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    )}
                    {step.status === 'testing' && (
                      <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    )}
                    {step.status === 'pending' && (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h3
                      className={`font-medium ${
                        step.status === 'completed'
                          ? 'text-green-800'
                          : step.status === 'testing'
                            ? 'text-yellow-800'
                            : 'text-gray-600'
                      }`}
                    >
                      Step {step.id}: {step.name}
                    </h3>
                    <p
                      className={`text-sm ${
                        step.status === 'completed'
                          ? 'text-green-600'
                          : step.status === 'testing'
                            ? 'text-yellow-600'
                            : 'text-gray-500'
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {currentStep <= steps.length && (
              <div className="mt-6">
                <button
                  onClick={runNextStep}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Run Next Test (Step {currentStep + 1})
                </button>
              </div>
            )}

            {currentStep > steps.length && (
              <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✅ All component imports tested successfully!
                </p>
                <p className="text-green-600 text-sm mt-1">
                  The issue is likely in component rendering, not imports.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Log */}
        {errors.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5" />
                <span>Import Errors Detected</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {errors.map((errorInfo, index) => (
                  <div key={index} className="p-3 bg-red-100 border border-red-300 rounded">
                    <h4 className="font-medium text-red-800">Step {errorInfo.step} Failed</h4>
                    <p className="text-red-700 text-sm mt-1">{errorInfo.error}</p>
                    <details className="mt-2">
                      <summary className="text-red-600 text-xs cursor-pointer hover:text-red-800">
                        Show Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                        {errorInfo.stack}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Info */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>
                • Current Step: {currentStep} / {steps.length}
              </li>
              <li>• Route: /app/reports</li>
              <li>• Component: ProgressiveFinancialReports</li>
              <li>• Errors Count: {errors.length}</li>
              <li>• Time: {new Date().toLocaleString()}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProgressiveFinancialReports
