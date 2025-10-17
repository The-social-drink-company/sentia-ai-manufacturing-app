import { useState } from 'react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Alert,
  AlertDescription,
} from '../../../components/ui'

const defaultScenarios = [
  {
    id: 'base',
    name: 'Base Case',
    description: 'Current operational parameters',
    variables: {
      demandGrowth: 0,
      priceIncrease: 0,
      costReduction: 0,
      inventoryDays: 30,
      productionCapacity: 100,
    },
    isActive: true,
    isBaseline: true,
  },
  {
    id: 'optimistic',
    name: 'Optimistic Growth',
    description: '20% demand growth with 5% price increase',
    variables: {
      demandGrowth: 20,
      priceIncrease: 5,
      costReduction: 3,
      inventoryDays: 25,
      productionCapacity: 120,
    },
    isActive: false,
    isBaseline: false,
  },
  {
    id: 'conservative',
    name: 'Conservative',
    description: 'Slow growth with cost focus',
    variables: {
      demandGrowth: 5,
      priceIncrease: 2,
      costReduction: 10,
      inventoryDays: 35,
      productionCapacity: 95,
    },
    isActive: false,
    isBaseline: false,
  },
]

export function ScenarioBuilder({ onScenarioChange }) {
  const [scenarios, setScenarios] = useState(defaultScenarios)
  const [activeScenario, setActiveScenario] = useState('base')
  const [isEditing, setIsEditing] = useState(false)

  const handleVariableChange = (_scenarioId, _variable, value) => {
    setScenarios(prev =>
      prev.map(scenario =>
        scenario.id === scenarioId
          ? { ...scenario, variables: { ...scenario.variables, [variable]: Number(value) } }
          : scenario
      )
    )

    if (onScenarioChange) {
      const updatedScenario = scenarios.find(s => s.id === scenarioId)
      if (updatedScenario) {
        onScenarioChange({
          ...updatedScenario,
          variables: { ...updatedScenario.variables, [variable]: Number(value) },
        })
      }
    }
  }

  const handleScenarioSelect = _scenarioId => {
    setActiveScenario(scenarioId)
    setScenarios(prev =>
      prev.map(scenario => ({
        ...scenario,
        isActive: scenario.id === scenarioId,
      }))
    )

    const selectedScenario = scenarios.find(s => s.id === scenarioId)
    if (selectedScenario && onScenarioChange) {
      onScenarioChange(selectedScenario)
    }
  }

  const currentScenario = scenarios.find(s => s.id === activeScenario)

  return (
    <div className="space-y-6">
      {/* Scenario Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Scenario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scenarios.map(scenario => (
              <button
                key={scenario.id}
                onClick={() => handleScenarioSelect(scenario.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  scenario.isActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{scenario.name}</h3>
                  {scenario.isBaseline && <Badge variant="info">Baseline</Badge>}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{scenario.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Variable Adjustments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Scenario Variables: {currentScenario?.name}</CardTitle>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {isEditing ? 'Save Changes' : 'Edit Variables'}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(currentScenario?.variables || {}).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <span className="text-sm font-semibold">{value}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="150"
                  value={value}
                  onChange={e => handleVariableChange(activeScenario, key, e.target.value)}
                  disabled={!isEditing || currentScenario?.isBaseline}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
            ))}
          </div>

          {currentScenario?.isBaseline && (
            <Alert variant="info" className="mt-4">
              <AlertDescription>
                The baseline scenario represents current operational parameters and cannot be
                edited.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Impact Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Projected Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Revenue Impact</p>
              <p className="text-2xl font-bold text-green-600">
                +{((currentScenario?.variables.demandGrowth || 0) * 1.5).toFixed(1)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Cost Savings</p>
              <p className="text-2xl font-bold text-blue-600">
                ${((currentScenario?.variables.costReduction || 0) * 10000).toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Capacity Utilization</p>
              <p className="text-2xl font-bold text-purple-600">
                {currentScenario?.variables.productionCapacity || 100}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Working Capital Days</p>
              <p className="text-2xl font-bold text-orange-600">
                {currentScenario?.variables.inventoryDays || 30} days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
