import React, { useState, useCallback, useMemo } from 'react';
import {
  AdjustmentsHorizontalIcon,
  PlusIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ShareIcon,
  BookmarkIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  CalculatorIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  color: string;
}

interface Market {
  id: string;
  name: string;
  code: string;
  flagEmoji: string;
  currency: string;
}

interface ScenarioParameter {
  id: string;
  name: string;
  type: 'slider' | 'toggle' | 'input';
  category: 'pricing' | 'marketing' | 'competition' | 'economic' | 'seasonal';
  value: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  impact_factor: number; // How much this parameter affects the forecast
  description: string;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  parameters: ScenarioParameter[];
  financial_impact: {
    revenue_change: number;
    margin_change: number;
    volume_change: number;
    total_impact: number;
  };
  confidence_score: number;
  is_favorite: boolean;
}

interface ScenarioComparison {
  metric: string;
  baseline: number;
  scenario1: number;
  scenario2: number;
  unit: string;
}

interface ScenarioModelingWorkspaceProps {
  products: Product[];
  markets: Market[];
  timeRange: string;
  currentScenario: Scenario | null;
  savedScenarios: Scenario[];
  onScenarioChange: (scenario: Scenario) => void;
  onSaveScenario: (scenario: Scenario) => void;
  onDeleteScenario: (id: string) => void;
}

const DEFAULT_PARAMETERS: Omit<ScenarioParameter, 'id'>[] = [
  {
    name: 'Price Adjustment',
    type: 'slider',
    category: 'pricing',
    value: 0,
    min: -50,
    max: 50,
    step: 1,
    unit: '%',
    impact_factor: 0.8,
    description: 'Adjust product pricing across all markets'
  },
  {
    name: 'Marketing Spend',
    type: 'slider',
    category: 'marketing',
    value: 0,
    min: -75,
    max: 200,
    step: 5,
    unit: '%',
    impact_factor: 0.6,
    description: 'Change marketing budget allocation'
  },
  {
    name: 'Competitor Activity',
    type: 'slider',
    category: 'competition',
    value: 0,
    min: -50,
    max: 50,
    step: 5,
    unit: 'intensity',
    impact_factor: -0.4,
    description: 'Expected competitive pressure level'
  },
  {
    name: 'Economic Growth',
    type: 'slider',
    category: 'economic',
    value: 2.5,
    min: -5,
    max: 10,
    step: 0.1,
    unit: '%',
    impact_factor: 0.3,
    description: 'Regional economic growth rate'
  },
  {
    name: 'Seasonal Boost',
    type: 'toggle',
    category: 'seasonal',
    value: false,
    impact_factor: 0.25,
    description: 'Enable seasonal demand amplification'
  }
];

export function ScenarioModelingWorkspace({
  products,
  markets,
  timeRange,
  currentScenario,
  savedScenarios,
  onScenarioChange,
  onSaveScenario,
  onDeleteScenario
}: ScenarioModelingWorkspaceProps) {
  const [workingScenario, setWorkingScenario] = useState<Scenario>(() => 
    currentScenario || createDefaultScenario()
  );
  const [comparisonScenarios, setComparisonScenarios] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveDialogName, setSaveDialogName] = useState('');
  const [saveDialogDescription, setSaveDialogDescription] = useState('');

  const queryClient = useQueryClient();

  // Create default scenario
  function createDefaultScenario(): Scenario {
    return {
      id: 'working',
      name: 'Working Scenario',
      description: 'Current working scenario',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      parameters: DEFAULT_PARAMETERS.map((param, index) => ({
        ...param,
        id: index.toString()
      })),
      financial_impact: {
        revenue_change: 0,
        margin_change: 0,
        volume_change: 0,
        total_impact: 0
      },
      confidence_score: 0.85,
      is_favorite: false
    };
  }

  // Calculate scenario impact
  const calculateScenarioImpact = useMutation({
    mutationFn: async (scenario: Scenario) => {
      setIsCalculating(true);
      
      const response = await fetch('/api/forecasting/scenario-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: scenario,
          products: products.map(p => p.id),
          markets: markets.map(m => m.id),
          timeRange
        }),
      });
      
      if (!response.ok) throw new Error('Failed to calculate scenario impact');
      return response.json();
    },
    onSuccess: (data) => {
      setWorkingScenario(prev => ({
        ...prev,
        financial_impact: data.financial_impact,
        confidence_score: data.confidence_score,
        updated_at: new Date().toISOString()
      }));
      setIsCalculating(false);
    },
    onError: () => {
      setIsCalculating(false);
    }
  });

  const updateParameter = useCallback((parameterId: string, value: any) => {
    setWorkingScenario(prev => {
      const updated = {
        ...prev,
        parameters: prev.parameters.map(param =>
          param.id === parameterId ? { ...param, value } : param
        ),
        updated_at: new Date().toISOString()
      };
      
      // Auto-calculate impact after parameter change
      calculateScenarioImpact.mutate(updated);
      
      return updated;
    });
  }, [calculateScenarioImpact]);

  const addToComparison = useCallback((scenarioId: string) => {
    setComparisonScenarios(prev => {
      if (prev.includes(scenarioId)) return prev;
      if (prev.length >= 2) return [prev[1], scenarioId];
      return [...prev, scenarioId];
    });
  }, []);

  const removeFromComparison = useCallback((scenarioId: string) => {
    setComparisonScenarios(prev => prev.filter(id => id !== scenarioId));
  }, []);

  const duplicateScenario = useCallback((scenario: Scenario) => {
    const duplicated: Scenario = {
      ...scenario,
      id: `${scenario.id}-copy-${Date.now()}`,
      name: `${scenario.name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_favorite: false
    };
    
    onSaveScenario(duplicated);
    setWorkingScenario(duplicated);
  }, [onSaveScenario]);

  const saveCurrentScenario = useCallback(() => {
    if (!saveDialogName.trim()) return;
    
    const savedScenario: Scenario = {
      ...workingScenario,
      id: `scenario-${Date.now()}`,
      name: saveDialogName.trim(),
      description: saveDialogDescription.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    onSaveScenario(savedScenario);
    setShowSaveDialog(false);
    setSaveDialogName('');
    setSaveDialogDescription('');
  }, [workingScenario, saveDialogName, saveDialogDescription, onSaveScenario]);

  const resetToBaseline = useCallback(() => {
    const baseline = createDefaultScenario();
    setWorkingScenario(baseline);
    calculateScenarioImpact.mutate(baseline);
  }, [calculateScenarioImpact]);

  const comparisonData = useMemo(() => {
    if (comparisonScenarios.length === 0) return [];
    
    const metrics: ScenarioComparison[] = [
      {
        metric: 'Revenue Impact',
        baseline: 0,
        scenario1: comparisonScenarios[0] ? savedScenarios.find(s => s.id === comparisonScenarios[0])?.financial_impact.revenue_change || 0 : 0,
        scenario2: comparisonScenarios[1] ? savedScenarios.find(s => s.id === comparisonScenarios[1])?.financial_impact.revenue_change || 0 : 0,
        unit: '%'
      },
      {
        metric: 'Volume Change',
        baseline: 0,
        scenario1: comparisonScenarios[0] ? savedScenarios.find(s => s.id === comparisonScenarios[0])?.financial_impact.volume_change || 0 : 0,
        scenario2: comparisonScenarios[1] ? savedScenarios.find(s => s.id === comparisonScenarios[1])?.financial_impact.volume_change || 0 : 0,
        unit: '%'
      },
      {
        metric: 'Margin Impact',
        baseline: 0,
        scenario1: comparisonScenarios[0] ? savedScenarios.find(s => s.id === comparisonScenarios[0])?.financial_impact.margin_change || 0 : 0,
        scenario2: comparisonScenarios[1] ? savedScenarios.find(s => s.id === comparisonScenarios[1])?.financial_impact.margin_change || 0 : 0,
        unit: '%'
      }
    ];
    
    return metrics;
  }, [comparisonScenarios, savedScenarios]);

  const getParameterIcon = useCallback((category: string) => {
    switch (category) {
      case 'pricing': return '💰';
      case 'marketing': return '📈';
      case 'competition': return '🏆';
      case 'economic': return '📊';
      case 'seasonal': return '🌱';
      default: return '⚙️';
    }
  }, []);

  const getImpactColor = useCallback((value: number) => {
    if (value > 5) return 'text-green-600 bg-green-50';
    if (value > 0) return 'text-green-600 bg-green-50';
    if (value > -5) return 'text-red-600 bg-red-50';
    return 'text-red-600 bg-red-50';
  }, []);

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <AdjustmentsHorizontalIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Scenario Modeling Workspace</h2>
              <p className="text-sm text-gray-500">
                Interactive what-if analysis with drag-to-adjust parameters
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={resetToBaseline}
              className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset to Baseline
            </button>
            
            <button
              onClick={() => setShowSaveDialog(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <BookmarkIcon className="h-4 w-4" />
              Save Scenario
            </button>
          </div>
        </div>

        {/* Current Scenario Info */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className={cn(
              'text-2xl font-bold',
              getImpactColor(workingScenario.financial_impact.revenue_change)
            )}>
              {workingScenario.financial_impact.revenue_change > 0 ? '+' : ''}
              {workingScenario.financial_impact.revenue_change.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Revenue Impact</div>
          </div>
          
          <div className="text-center">
            <div className={cn(
              'text-2xl font-bold',
              getImpactColor(workingScenario.financial_impact.volume_change)
            )}>
              {workingScenario.financial_impact.volume_change > 0 ? '+' : ''}
              {workingScenario.financial_impact.volume_change.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Volume Change</div>
          </div>
          
          <div className="text-center">
            <div className={cn(
              'text-2xl font-bold',
              getImpactColor(workingScenario.financial_impact.margin_change)
            )}>
              {workingScenario.financial_impact.margin_change > 0 ? '+' : ''}
              {workingScenario.financial_impact.margin_change.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Margin Impact</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {(workingScenario.confidence_score * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Confidence</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parameter Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
            What-If Parameters
            {isCalculating && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-2" />
            )}
          </h3>

          <div className="space-y-6">
            {workingScenario.parameters.map((parameter) => (
              <div key={parameter.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getParameterIcon(parameter.category)}</span>
                    <label className="text-sm font-medium text-gray-700">
                      {parameter.name}
                    </label>
                  </div>
                  <div className="text-right">
                    {parameter.type === 'slider' && (
                      <span className="text-sm font-medium text-gray-900">
                        {typeof parameter.value === 'number' ? parameter.value.toFixed(parameter.step && parameter.step < 1 ? 1 : 0) : parameter.value}
                        {parameter.unit}
                      </span>
                    )}
                    {parameter.type === 'toggle' && (
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        parameter.value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      )}>
                        {parameter.value ? 'On' : 'Off'}
                      </span>
                    )}
                  </div>
                </div>

                {parameter.type === 'slider' && (
                  <div className="px-3">
                    <input
                      type="range"
                      min={parameter.min}
                      max={parameter.max}
                      step={parameter.step}
                      value={parameter.value as number}
                      onChange={(e) => updateParameter(parameter.id, parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${
                          ((parameter.value as number - (parameter.min || 0)) / 
                           ((parameter.max || 100) - (parameter.min || 0))) * 100
                        }%, #E5E7EB ${
                          ((parameter.value as number - (parameter.min || 0)) / 
                           ((parameter.max || 100) - (parameter.min || 0))) * 100
                        }%, #E5E7EB 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{parameter.min}{parameter.unit}</span>
                      <span>{parameter.max}{parameter.unit}</span>
                    </div>
                  </div>
                )}

                {parameter.type === 'toggle' && (
                  <div className="px-3">
                    <button
                      onClick={() => updateParameter(parameter.id, !parameter.value)}
                      className={cn(
                        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2',
                        parameter.value ? 'bg-blue-600' : 'bg-gray-200'
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                          parameter.value ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>
                )}

                <p className="text-xs text-gray-500 px-3">{parameter.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Impact Calculator */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CalculatorIcon className="h-5 w-5" />
            Financial Impact Calculator
          </h3>

          <div className="space-y-4">
            {/* Impact Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Total Revenue Impact</div>
                <div className={cn(
                  'text-xl font-bold',
                  workingScenario.financial_impact.total_impact > 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {workingScenario.financial_impact.total_impact > 0 ? '+' : ''}
                  ${(workingScenario.financial_impact.total_impact / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-gray-500">
                  vs baseline scenario
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Confidence Level</div>
                <div className="text-xl font-bold text-purple-600">
                  {(workingScenario.confidence_score * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">
                  model certainty
                </div>
              </div>
            </div>

            {/* Impact Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Impact Breakdown</h4>
              
              {[
                { label: 'Revenue Change', value: workingScenario.financial_impact.revenue_change, unit: '%' },
                { label: 'Volume Change', value: workingScenario.financial_impact.volume_change, unit: '%' },
                { label: 'Margin Change', value: workingScenario.financial_impact.margin_change, unit: '%' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div 
                        className={cn(
                          'h-2 rounded-full transition-all',
                          item.value > 0 ? 'bg-green-500' : 'bg-red-500'
                        )}
                        style={{ 
                          width: `${Math.min(Math.abs(item.value) * 2, 100)}%`,
                          marginLeft: item.value < 0 ? `${100 - Math.min(Math.abs(item.value) * 2, 100)}%` : '0'
                        }}
                      />
                    </div>
                    <span className={cn(
                      'text-sm font-medium min-w-[3rem] text-right',
                      item.value > 0 ? 'text-green-600' : item.value < 0 ? 'text-red-600' : 'text-gray-600'
                    )}>
                      {item.value > 0 ? '+' : ''}{item.value.toFixed(1)}{item.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Risk Assessment */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Risk Assessment</span>
              </div>
              <p className="text-xs text-amber-700">
                {workingScenario.confidence_score > 0.8 
                  ? "High confidence scenario with low execution risk."
                  : workingScenario.confidence_score > 0.6
                  ? "Moderate confidence. Consider market validation before full implementation."
                  : "Low confidence scenario. High uncertainty in outcomes."
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Scenarios */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Saved Scenarios</h3>
          <div className="text-sm text-gray-500">
            {savedScenarios.length} scenarios saved
          </div>
        </div>

        {savedScenarios.length === 0 ? (
          <div className="text-center py-8">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No saved scenarios</p>
            <p className="text-sm text-gray-500">
              Create and save scenarios to compare different business strategies
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {savedScenarios.map((scenario) => (
              <div key={scenario.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{scenario.name}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2">{scenario.description}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => addToComparison(scenario.id)}
                      className={cn(
                        'p-1 rounded text-xs transition-colors',
                        comparisonScenarios.includes(scenario.id)
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-400 hover:text-gray-600'
                      )}
                      title="Add to comparison"
                    >
                      <ArrowsRightLeftIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => duplicateScenario(scenario)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                      title="Duplicate scenario"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteScenario(scenario.id)}
                      className="p-1 text-red-400 hover:text-red-600 rounded transition-colors"
                      title="Delete scenario"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <span className="text-gray-600">Revenue:</span>
                    <span className={cn(
                      'ml-1 font-medium',
                      scenario.financial_impact.revenue_change > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {scenario.financial_impact.revenue_change > 0 ? '+' : ''}
                      {scenario.financial_impact.revenue_change.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Volume:</span>
                    <span className={cn(
                      'ml-1 font-medium',
                      scenario.financial_impact.volume_change > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {scenario.financial_impact.volume_change > 0 ? '+' : ''}
                      {scenario.financial_impact.volume_change.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setWorkingScenario(scenario)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Load Scenario
                  </button>
                  <div className="text-xs text-gray-500">
                    {format(parseISO(scenario.updated_at), 'MMM d')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scenario Comparison */}
      {comparisonScenarios.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Scenario Comparison</h3>
            <button
              onClick={() => setComparisonScenarios([])}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear Comparison
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Metric</th>
                  <th className="text-center py-2">Baseline</th>
                  {comparisonScenarios.map((scenarioId, index) => {
                    const scenario = savedScenarios.find(s => s.id === scenarioId);
                    return (
                      <th key={scenarioId} className="text-center py-2">
                        <div className="flex items-center justify-center space-x-2">
                          <span>{scenario?.name || `Scenario ${index + 1}`}</span>
                          <button
                            onClick={() => removeFromComparison(scenarioId)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 font-medium text-gray-900">{row.metric}</td>
                    <td className="py-3 text-center text-gray-600">
                      {row.baseline.toFixed(1)}{row.unit}
                    </td>
                    <td className="py-3 text-center">
                      <span className={cn(
                        'font-medium',
                        row.scenario1 > 0 ? 'text-green-600' : row.scenario1 < 0 ? 'text-red-600' : 'text-gray-600'
                      )}>
                        {row.scenario1 > 0 ? '+' : ''}{row.scenario1.toFixed(1)}{row.unit}
                      </span>
                    </td>
                    {comparisonScenarios.length > 1 && (
                      <td className="py-3 text-center">
                        <span className={cn(
                          'font-medium',
                          row.scenario2 > 0 ? 'text-green-600' : row.scenario2 < 0 ? 'text-red-600' : 'text-gray-600'
                        )}>
                          {row.scenario2 > 0 ? '+' : ''}{row.scenario2.toFixed(1)}{row.unit}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowSaveDialog(false)} />
            
            <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <BookmarkIcon className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Save Scenario</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scenario Name
                    </label>
                    <input
                      type="text"
                      value={saveDialogName}
                      onChange={(e) => setSaveDialogName(e.target.value)}
                      placeholder="Enter scenario name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={saveDialogDescription}
                      onChange={(e) => setSaveDialogDescription(e.target.value)}
                      placeholder="Describe this scenario..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveCurrentScenario}
                    disabled={!saveDialogName.trim()}
                    className={cn(
                      'px-4 py-2 text-sm rounded-lg transition-colors',
                      saveDialogName.trim()
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    Save Scenario
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}