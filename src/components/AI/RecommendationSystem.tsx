import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LightBulbIcon,
  StarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTopRightOnSquareIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { logInfo } from '../../lib/logger';

export interface Recommendation {
  id: string;
  type: 'inventory' | 'supplier' | 'pricing' | 'market_timing' | 'risk_mitigation' | 'cost_optimization';
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  title: string;
  description: string;
  impact: {
    financial: number; // Expected financial impact in currency
    operational: 'low' | 'medium' | 'high';
    timeframe: string; // e.g., "2-4 weeks", "1-3 months"
    riskLevel: 'low' | 'medium' | 'high';
  };
  actionItems: Array<{
    task: string;
    owner: string;
    dueDate: Date;
    status: 'pending' | 'in_progress' | 'completed';
    estimatedHours: number;
  }>;
  rationale: {
    dataPoints: string[];
    methodology: string;
    assumptions: string[];
    limitations: string[];
  };
  metrics: {
    current: Record<string, number>;
    projected: Record<string, number>;
    kpis: Array<{
      name: string;
      current: number;
      target: number;
      unit: string;
      trend: 'improving' | 'stable' | 'declining';
    }>;
  };
  alternatives: Array<{
    option: string;
    pros: string[];
    cons: string[];
    estimatedImpact: number;
  }>;
  implementationPlan: {
    phases: Array<{
      name: string;
      duration: string;
      activities: string[];
      dependencies: string[];
      milestones: string[];
    }>;
    resources: {
      budget: number;
      personnel: string[];
      technology: string[];
    };
    risks: Array<{
      risk: string;
      probability: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high';
      mitigation: string;
    }>;
  };
  createdAt: Date;
  lastUpdated: Date;
  status: 'active' | 'implemented' | 'dismissed' | 'expired';
  feedback?: {
    rating: number;
    comments: string;
    actualImpact?: number;
  };
}

interface RecommendationFilters {
  types: string[];
  priorities: string[];
  status: string[];
  confidenceMin: number;
  impactMin: number;
  timeframe: string[];
}

const mockRecommendations: Recommendation[] = [
  {
    id: 'rec_001',
    type: 'inventory',
    priority: 'high',
    confidence: 0.87,
    title: 'Reduce Safety Stock for Component A-123',
    description: 'Analysis shows 30% excess safety stock for Component A-123 based on improved supplier reliability and demand stability.',
    impact: {
      financial: 45000,
      operational: 'medium',
      timeframe: '2-3 weeks',
      riskLevel: 'low'
    },
    actionItems: [
      {
        task: 'Review current safety stock levels and adjust parameters',
        owner: 'Inventory Manager',
        dueDate: new Date('2024-01-15'),
        status: 'pending',
        estimatedHours: 8
      },
      {
        task: 'Update ERP system with new safety stock levels',
        owner: 'IT Operations',
        dueDate: new Date('2024-01-18'),
        status: 'pending',
        estimatedHours: 4
      },
      {
        task: 'Monitor impact for 30 days and adjust if needed',
        owner: 'Supply Chain Analyst',
        dueDate: new Date('2024-02-17'),
        status: 'pending',
        estimatedHours: 16
      }
    ],
    rationale: {
      dataPoints: [
        'Supplier reliability improved to 98.5% over last 6 months',
        'Demand coefficient of variation decreased to 0.15',
        'Current safety stock covers 45 days vs recommended 32 days'
      ],
      methodology: 'Statistical analysis of demand patterns and supplier performance using 12 months of historical data',
      assumptions: [
        'Supplier performance remains stable',
        'Demand patterns continue current trend',
        'No major supply chain disruptions'
      ],
      limitations: [
        'Analysis based on historical data only',
        'Does not account for seasonal variations beyond current period'
      ]
    },
    metrics: {
      current: {
        safetyStockDays: 45,
        inventoryValue: 150000,
        turnoverRate: 8.2
      },
      projected: {
        safetyStockDays: 32,
        inventoryValue: 105000,
        turnoverRate: 11.8
      },
      kpis: [
        { name: 'Inventory Turnover', current: 8.2, target: 11.8, unit: 'times/year', trend: 'improving' },
        { name: 'Carrying Cost', current: 18000, target: 12600, unit: 'USD/month', trend: 'improving' },
        { name: 'Stock-out Risk', current: 2.1, target: 3.0, unit: '%', trend: 'stable' }
      ]
    },
    alternatives: [
      {
        option: 'Gradual reduction over 8 weeks',
        pros: ['Lower risk', 'Time to monitor impact'],
        cons: ['Slower financial benefit', 'More management overhead'],
        estimatedImpact: 38000
      },
      {
        option: 'Negotiate consignment stock with supplier',
        pros: ['No inventory carrying cost', 'Maintained availability'],
        cons: ['Supplier dependency', 'Potential higher unit costs'],
        estimatedImpact: 52000
      }
    ],
    implementationPlan: {
      phases: [
        {
          name: 'Analysis & Planning',
          duration: '1 week',
          activities: ['Validate calculations', 'Get stakeholder approval', 'Plan system changes'],
          dependencies: [],
          milestones: ['Approval received', 'Implementation plan finalized']
        },
        {
          name: 'System Updates',
          duration: '1 week',
          activities: ['Update ERP parameters', 'Test calculations', 'Train staff'],
          dependencies: ['Analysis & Planning'],
          milestones: ['System updated', 'Staff trained']
        },
        {
          name: 'Monitoring & Adjustment',
          duration: '4 weeks',
          activities: ['Monitor stock levels', 'Track KPIs', 'Adjust if needed'],
          dependencies: ['System Updates'],
          milestones: ['30-day review completed', 'ROI validated']
        }
      ],
      resources: {
        budget: 5000,
        personnel: ['Inventory Manager', 'Supply Chain Analyst', 'IT Operations'],
        technology: ['ERP System', 'Analytics Dashboard']
      },
      risks: [
        {
          risk: 'Stock-out due to demand spike',
          probability: 'low',
          impact: 'medium',
          mitigation: 'Implement early warning system for demand spikes'
        },
        {
          risk: 'Supplier performance degradation',
          probability: 'low',
          impact: 'high',
          mitigation: 'Monthly supplier performance reviews'
        }
      ]
    },
    createdAt: new Date('2024-01-10'),
    lastUpdated: new Date('2024-01-10'),
    status: 'active'
  },
  {
    id: 'rec_002',
    type: 'supplier',
    priority: 'medium',
    confidence: 0.74,
    title: 'Diversify Critical Component Supply Base',
    description: 'Single supplier dependency for Component B-456 poses supply chain risk. Recommend qualifying additional supplier.',
    impact: {
      financial: -15000, // Investment cost
      operational: 'high',
      timeframe: '8-12 weeks',
      riskLevel: 'medium'
    },
    actionItems: [
      {
        task: 'Research potential alternative suppliers',
        owner: 'Procurement Manager',
        dueDate: new Date('2024-01-20'),
        status: 'in_progress',
        estimatedHours: 24
      },
      {
        task: 'Conduct supplier audits and qualification',
        owner: 'Quality Assurance',
        dueDate: new Date('2024-02-15'),
        status: 'pending',
        estimatedHours: 40
      },
      {
        task: 'Negotiate contracts and pricing',
        owner: 'Procurement Manager',
        dueDate: new Date('2024-03-01'),
        status: 'pending',
        estimatedHours: 32
      }
    ],
    rationale: {
      dataPoints: [
        'Component B-456 represents 12% of total COGS',
        'Current supplier has 100% share for this component',
        'Supplier located in single geographic region',
        '3 supply disruptions in past 18 months'
      ],
      methodology: 'Supply chain risk assessment using supplier concentration and disruption history analysis',
      assumptions: [
        'Alternative suppliers exist with comparable quality',
        'Qualification process will be successful',
        'Current supplier remains primary source (70% share)'
      ],
      limitations: [
        'New supplier startup costs not fully quantified',
        'Quality impact during transition period unknown'
      ]
    },
    metrics: {
      current: {
        supplierConcentration: 100,
        riskScore: 85,
        avgDisruptionDays: 12
      },
      projected: {
        supplierConcentration: 70,
        riskScore: 45,
        avgDisruptionDays: 4
      },
      kpis: [
        { name: 'Supply Risk Score', current: 85, target: 45, unit: 'score', trend: 'improving' },
        { name: 'Supplier Concentration', current: 100, target: 70, unit: '%', trend: 'improving' },
        { name: 'Disruption Days', current: 12, target: 4, unit: 'days/year', trend: 'improving' }
      ]
    },
    alternatives: [
      {
        option: 'Emergency inventory buffer',
        pros: ['Quick implementation', 'No supplier qualification needed'],
        cons: ['Higher carrying costs', 'Doesn\'t address root cause'],
        estimatedImpact: -25000
      },
      {
        option: 'Long-term contract with current supplier',
        pros: ['Guaranteed capacity', 'Potential cost savings'],
        cons: ['Still concentrated risk', 'Less flexibility'],
        estimatedImpact: 8000
      }
    ],
    implementationPlan: {
      phases: [
        {
          name: 'Supplier Identification',
          duration: '3 weeks',
          activities: ['Market research', 'RFI process', 'Initial screening'],
          dependencies: [],
          milestones: ['3 qualified candidates identified']
        },
        {
          name: 'Supplier Qualification',
          duration: '6 weeks',
          activities: ['Technical evaluation', 'Quality audit', 'Financial assessment'],
          dependencies: ['Supplier Identification'],
          milestones: ['1 supplier approved for production']
        },
        {
          name: 'Implementation',
          duration: '4 weeks',
          activities: ['Contract negotiation', 'Production trials', 'Go-live'],
          dependencies: ['Supplier Qualification'],
          milestones: ['Secondary supplier operational']
        }
      ],
      resources: {
        budget: 15000,
        personnel: ['Procurement Manager', 'Quality Assurance', 'Supply Chain Analyst'],
        technology: ['Supplier Portal', 'Quality Management System']
      },
      risks: [
        {
          risk: 'New supplier quality issues',
          probability: 'medium',
          impact: 'high',
          mitigation: 'Thorough qualification process and gradual volume ramp'
        },
        {
          risk: 'Higher costs from secondary supplier',
          probability: 'medium',
          impact: 'medium',
          mitigation: 'Negotiate volume commitments for better pricing'
        }
      ]
    },
    createdAt: new Date('2024-01-08'),
    lastUpdated: new Date('2024-01-12'),
    status: 'active'
  }
];

export const RecommendationSystem: React.FC = () => {
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [filters, setFilters] = useState<RecommendationFilters>({
    types: [],
    priorities: [],
    status: ['active'],
    confidenceMin: 0,
    impactMin: 0,
    timeframe: []
  });
  const [sortBy, setSortBy] = useState<'priority' | 'confidence' | 'impact' | 'created'>('priority');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'detailed'>('grid');

  // Mock data query
  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['recommendations', filters, sortBy],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filtered = mockRecommendations.filter(rec => {
        if (filters.types.length && !filters.types.includes(rec.type)) return false;
        if (filters.priorities.length && !filters.priorities.includes(rec.priority)) return false;
        if (filters.status.length && !filters.status.includes(rec.status)) return false;
        if (rec.confidence < filters.confidenceMin / 100) return false;
        if (Math.abs(rec.impact.financial) < filters.impactMin) return false;
        return true;
      });

      // Sort recommendations
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'priority':
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          case 'confidence':
            return b.confidence - a.confidence;
          case 'impact':
            return Math.abs(b.impact.financial) - Math.abs(a.impact.financial);
          case 'created':
            return b.createdAt.getTime() - a.createdAt.getTime();
          default:
            return 0;
        }
      });

      return filtered;
    }
  });

  const getTypeIcon = (type: string) => {
    const icons = {
      inventory: ChartBarIcon,
      supplier: TrendingUpIcon,
      pricing: CurrencyDollarIcon,
      market_timing: ClockIcon,
      risk_mitigation: ExclamationTriangleIcon,
      cost_optimization: TrendingDownIcon
    };
    return icons[type as keyof typeof icons] || LightBulbIcon;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      inventory: 'bg-blue-50 text-blue-700 border-blue-200',
      supplier: 'bg-green-50 text-green-700 border-green-200',
      pricing: 'bg-purple-50 text-purple-700 border-purple-200',
      market_timing: 'bg-orange-50 text-orange-700 border-orange-200',
      risk_mitigation: 'bg-red-50 text-red-700 border-red-200',
      cost_optimization: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const getImpactDirection = (amount: number) => {
    return amount >= 0 ? 'positive' : 'negative';
  };

  const handleImplementAction = (recommendation: Recommendation) => {
    logInfo('Starting recommendation implementation', { 
      recommendationId: recommendation.id,
      type: recommendation.type 
    });
    
    // In a real app, this would trigger implementation workflow
    alert(`Starting implementation of: ${recommendation.title}`);
  };

  const handleDismissRecommendation = (recommendation: Recommendation) => {
    logInfo('Dismissing recommendation', { 
      recommendationId: recommendation.id 
    });
    
    // Update recommendation status
    alert(`Dismissed: ${recommendation.title}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
            <LightBulbIcon className="h-7 w-7 text-indigo-600 mr-3" />
            AI Recommendations
          </h2>
          <p className="text-gray-600">
            Intelligent insights and actionable recommendations for your operations
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="priority">Sort by Priority</option>
            <option value="confidence">Sort by Confidence</option>
            <option value="impact">Sort by Impact</option>
            <option value="created">Sort by Date</option>
          </select>

          <div className="flex rounded-lg border border-gray-300">
            {['list', 'grid', 'detailed'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`px-3 py-2 text-sm font-medium capitalize ${
                  viewMode === mode
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </h3>
          <button
            onClick={() => setFilters({
              types: [],
              priorities: [],
              status: ['active'],
              confidenceMin: 0,
              impactMin: 0,
              timeframe: []
            })}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              multiple
              value={filters.types}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                types: Array.from(e.target.selectedOptions, option => option.value)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              size={3}
            >
              <option value="inventory">Inventory</option>
              <option value="supplier">Supplier</option>
              <option value="pricing">Pricing</option>
              <option value="market_timing">Market Timing</option>
              <option value="risk_mitigation">Risk Mitigation</option>
              <option value="cost_optimization">Cost Optimization</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              multiple
              value={filters.priorities}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                priorities: Array.from(e.target.selectedOptions, option => option.value)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              size={3}
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Confidence: {filters.confidenceMin}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.confidenceMin}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                confidenceMin: parseInt(e.target.value)
              }))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Impact: ${filters.impactMin.toLocaleString()}
            </label>
            <input
              type="range"
              min="0"
              max="100000"
              step="5000"
              value={filters.impactMin}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                impactMin: parseInt(e.target.value)
              }))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Recommendations Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <LightBulbIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Found</h3>
          <p className="text-gray-500">Try adjusting your filters to see more recommendations.</p>
        </div>
      ) : (
        <div className={`grid ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : viewMode === 'list'
            ? 'grid-cols-1'
            : 'grid-cols-1 lg:grid-cols-2'
        } gap-6`}>
          {recommendations.map((recommendation) => {
            const TypeIcon = getTypeIcon(recommendation.type);
            const impactDirection = getImpactDirection(recommendation.impact.financial);
            
            return (
              <div
                key={recommendation.id}
                className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedRecommendation(recommendation)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(recommendation.type)}`}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(recommendation.priority)}`}>
                        {recommendation.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <StarIcon className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                    {Math.round(recommendation.confidence * 100)}%
                  </div>
                </div>

                {/* Title and Description */}
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {recommendation.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {recommendation.description}
                </p>

                {/* Impact Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${
                      impactDirection === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {impactDirection === 'positive' ? '+' : '-'}{formatCurrency(recommendation.impact.financial)}
                    </div>
                    <div className="text-xs text-gray-500">Financial Impact</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {recommendation.impact.timeframe}
                    </div>
                    <div className="text-xs text-gray-500">Timeframe</div>
                  </div>
                </div>

                {/* Action Items Preview */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-500">
                      {recommendation.actionItems.filter(item => item.status === 'completed').length}/
                      {recommendation.actionItems.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ 
                        width: `${(recommendation.actionItems.filter(item => item.status === 'completed').length / recommendation.actionItems.length) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImplementAction(recommendation);
                    }}
                    className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Implement
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRecommendation(recommendation);
                    }}
                    className="px-3 py-2 text-indigo-600 border border-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    Details
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismissRecommendation(recommendation);
                    }}
                    className="px-3 py-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed View Modal */}
      {selectedRecommendation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg ${getTypeColor(selectedRecommendation.type)}`}>
                    {React.createElement(getTypeIcon(selectedRecommendation.type), { className: "h-6 w-6" })}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedRecommendation.title}
                    </h2>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedRecommendation.priority)}`}>
                        {selectedRecommendation.priority.toUpperCase()} PRIORITY
                      </span>
                      <span className="text-sm text-gray-500">
                        Confidence: {Math.round(selectedRecommendation.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecommendation(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{selectedRecommendation.description}</p>
              </div>

              {/* Impact Metrics */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Expected Impact</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className={`text-2xl font-bold ${
                      getImpactDirection(selectedRecommendation.impact.financial) === 'positive' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {getImpactDirection(selectedRecommendation.impact.financial) === 'positive' ? '+' : '-'}
                      {formatCurrency(selectedRecommendation.impact.financial)}
                    </div>
                    <div className="text-sm text-gray-500">Financial Impact</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-gray-900 capitalize">
                      {selectedRecommendation.impact.operational}
                    </div>
                    <div className="text-sm text-gray-500">Operational Impact</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedRecommendation.impact.timeframe}
                    </div>
                    <div className="text-sm text-gray-500">Timeframe</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className={`text-2xl font-bold capitalize ${
                      selectedRecommendation.impact.riskLevel === 'low' ? 'text-green-600' :
                      selectedRecommendation.impact.riskLevel === 'medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {selectedRecommendation.impact.riskLevel}
                    </div>
                    <div className="text-sm text-gray-500">Risk Level</div>
                  </div>
                </div>
              </div>

              {/* KPIs */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Key Performance Indicators</h3>
                <div className="space-y-4">
                  {selectedRecommendation.metrics.kpis.map((kpi, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{kpi.name}</div>
                        <div className="text-sm text-gray-500">
                          Current: {kpi.current.toLocaleString()} {kpi.unit} → 
                          Target: {kpi.target.toLocaleString()} {kpi.unit}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {kpi.trend === 'improving' ? (
                          <TrendingUpIcon className="h-5 w-5 text-green-600" />
                        ) : kpi.trend === 'declining' ? (
                          <TrendingDownIcon className="h-5 w-5 text-red-600" />
                        ) : (
                          <div className="h-5 w-5 bg-gray-400 rounded-full"></div>
                        )}
                        <span className={`text-sm font-medium ${
                          kpi.trend === 'improving' ? 'text-green-600' :
                          kpi.trend === 'declining' ? 'text-red-600' :
                          'text-gray-500'
                        }`}>
                          {kpi.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Items */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Action Items</h3>
                <div className="space-y-3">
                  {selectedRecommendation.actionItems.map((item, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {item.status === 'completed' ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        ) : item.status === 'in_progress' ? (
                          <ClockIcon className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <div className="h-5 w-5 border-2 border-gray-300 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.task}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          Owner: {item.owner} • Due: {item.dueDate.toLocaleDateString()} • 
                          Est. {item.estimatedHours}h
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.status === 'completed' ? 'bg-green-100 text-green-800' :
                        item.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Implementation Plan */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Implementation Plan</h3>
                <div className="space-y-4">
                  {selectedRecommendation.implementationPlan.phases.map((phase, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{phase.name}</h4>
                        <span className="text-sm text-gray-500">{phase.duration}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-700 mb-1">Activities</div>
                          <ul className="list-disc list-inside text-gray-600 space-y-1">
                            {phase.activities.map((activity, i) => (
                              <li key={i}>{activity}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="font-medium text-gray-700 mb-1">Milestones</div>
                          <ul className="list-disc list-inside text-gray-600 space-y-1">
                            {phase.milestones.map((milestone, i) => (
                              <li key={i}>{milestone}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleImplementAction(selectedRecommendation)}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Start Implementation
                </button>
                <button
                  onClick={() => setSelectedRecommendation(null)}
                  className="px-6 py-3 text-gray-700 border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDismissRecommendation(selectedRecommendation)}
                  className="px-6 py-3 text-red-600 border border-red-300 font-medium rounded-lg hover:bg-red-50 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};