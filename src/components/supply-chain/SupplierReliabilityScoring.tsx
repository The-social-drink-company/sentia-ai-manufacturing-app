import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ClockIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  BellIcon,
  CogIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useMutation, useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface SupplierReliabilityScore {
  id: string;
  supplierId: string;
  supplierName: string;
  overallScore: number;
  scoreHistory: Array<{
    date: string;
    score: number;
    factors: {
      deliveryPerformance: number;
      qualityMetrics: number;
      financialStability: number;
      communicationEffectiveness: number;
      riskProfile: number;
    };
  }>;
  currentFactors: {
    deliveryPerformance: {
      score: number;
      onTimeRate: number;
      averageDelay: number;
      trend: 'improving' | 'stable' | 'declining';
    };
    qualityMetrics: {
      score: number;
      defectRate: number;
      returnRate: number;
      certificationStatus: string[];
      trend: 'improving' | 'stable' | 'declining';
    };
    financialStability: {
      score: number;
      creditRating: string;
      paymentTermsCompliance: number;
      businessContinuityRisk: number;
      trend: 'improving' | 'stable' | 'declining';
    };
    communicationEffectiveness: {
      score: number;
      responseTime: number;
      issueResolutionRate: number;
      proactiveUpdates: number;
      trend: 'improving' | 'stable' | 'declining';
    };
    riskProfile: {
      score: number;
      geopoliticalRisk: number;
      supplierConcentration: number;
      alternativeAvailability: number;
      trend: 'improving' | 'stable' | 'declining';
    };
  };
  alerts: Array<{
    id: string;
    type: 'score_drop' | 'threshold_breach' | 'risk_increase' | 'performance_decline';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    createdAt: string;
    acknowledged: boolean;
  }>;
  recommendations: Array<{
    category: string;
    action: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    priority: number;
  }>;
  lastUpdated: string;
}

interface ScoringWeights {
  deliveryPerformance: number;
  qualityMetrics: number;
  financialStability: number;
  communicationEffectiveness: number;
  riskProfile: number;
}

export function SupplierReliabilityScoring() {
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | '1y'>('6m');
  const [filterScore, setFilterScore] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showAlerts, setShowAlerts] = useState(true);
  const [scoringWeights, setScoringWeights] = useState<ScoringWeights>({
    deliveryPerformance: 25,
    qualityMetrics: 25,
    financialStability: 20,
    communicationEffectiveness: 15,
    riskProfile: 15
  });

  // Fetch supplier reliability data
  const { data: supplierScores = [], isLoading } = useQuery({
    queryKey: ['supplier-reliability', timeRange, selectedSupplier],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeRange,
        ...(selectedSupplier !== 'all' && { supplierId: selectedSupplier })
      });
      const response = await fetch(`/api/supply-chain/supplier-reliability?${params}`);
      if (!response.ok) throw new Error('Failed to fetch supplier reliability data');
      return response.json() as SupplierReliabilityScore[];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Update scoring weights
  const updateWeightsMutation = useMutation({
    mutationFn: async (weights: ScoringWeights) => {
      const response = await fetch('/api/supply-chain/scoring-weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weights),
      });
      if (!response.ok) throw new Error('Failed to update scoring weights');
      return response.json();
    },
  });

  // Acknowledge alert
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/supply-chain/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to acknowledge alert');
      return response.json();
    },
  });

  // Mock data for demonstration
  const mockSupplierScores: SupplierReliabilityScore[] = [
    {
      id: 'score-1',
      supplierId: 'supplier-asia-1',
      supplierName: 'Pacific Electronics Ltd',
      overallScore: 94,
      scoreHistory: Array.from({ length: 24 }, (_, i) => ({
        date: new Date(Date.now() - (23 - i) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        score: 90 + Math.random() * 8 + Math.sin(i / 4) * 3,
        factors: {
          deliveryPerformance: 90 + Math.random() * 10,
          qualityMetrics: 92 + Math.random() * 8,
          financialStability: 88 + Math.random() * 12,
          communicationEffectiveness: 85 + Math.random() * 15,
          riskProfile: 80 + Math.random() * 20
        }
      })),
      currentFactors: {
        deliveryPerformance: {
          score: 96,
          onTimeRate: 98.5,
          averageDelay: 0.3,
          trend: 'improving'
        },
        qualityMetrics: {
          score: 94,
          defectRate: 0.12,
          returnRate: 0.08,
          certificationStatus: ['ISO9001', 'ISO14001', 'OHSAS18001'],
          trend: 'stable'
        },
        financialStability: {
          score: 92,
          creditRating: 'AA-',
          paymentTermsCompliance: 99.2,
          businessContinuityRisk: 8,
          trend: 'improving'
        },
        communicationEffectiveness: {
          score: 90,
          responseTime: 2.1,
          issueResolutionRate: 94,
          proactiveUpdates: 87,
          trend: 'stable'
        },
        riskProfile: {
          score: 88,
          geopoliticalRisk: 15,
          supplierConcentration: 12,
          alternativeAvailability: 78,
          trend: 'stable'
        }
      },
      alerts: [],
      recommendations: [
        {
          category: 'Risk Management',
          action: 'Develop secondary supplier in different region',
          impact: 'high',
          effort: 'high',
          priority: 1
        },
        {
          category: 'Communication',
          action: 'Implement automated status updates',
          impact: 'medium',
          effort: 'low',
          priority: 2
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'score-2',
      supplierId: 'supplier-eu-1',
      supplierName: 'European Components GmbH',
      overallScore: 87,
      scoreHistory: Array.from({ length: 24 }, (_, i) => ({
        date: new Date(Date.now() - (23 - i) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        score: 85 + Math.random() * 10 - Math.sin(i / 6) * 4,
        factors: {
          deliveryPerformance: 82 + Math.random() * 16,
          qualityMetrics: 88 + Math.random() * 12,
          financialStability: 90 + Math.random() * 10,
          communicationEffectiveness: 80 + Math.random() * 20,
          riskProfile: 75 + Math.random() * 25
        }
      })),
      currentFactors: {
        deliveryPerformance: {
          score: 85,
          onTimeRate: 92.1,
          averageDelay: 1.2,
          trend: 'declining'
        },
        qualityMetrics: {
          score: 89,
          defectRate: 0.24,
          returnRate: 0.18,
          certificationStatus: ['ISO9001'],
          trend: 'stable'
        },
        financialStability: {
          score: 94,
          creditRating: 'A+',
          paymentTermsCompliance: 98.8,
          businessContinuityRisk: 5,
          trend: 'stable'
        },
        communicationEffectiveness: {
          score: 82,
          responseTime: 4.2,
          issueResolutionRate: 87,
          proactiveUpdates: 72,
          trend: 'declining'
        },
        riskProfile: {
          score: 91,
          geopoliticalRisk: 8,
          supplierConcentration: 18,
          alternativeAvailability: 85,
          trend: 'improving'
        }
      },
      alerts: [
        {
          id: 'alert-1',
          type: 'performance_decline',
          severity: 'medium',
          message: 'Delivery performance has declined 5% over the past month',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          acknowledged: false
        }
      ],
      recommendations: [
        {
          category: 'Performance',
          action: 'Schedule performance review meeting',
          impact: 'medium',
          effort: 'low',
          priority: 1
        },
        {
          category: 'Quality',
          action: 'Implement additional quality certifications',
          impact: 'medium',
          effort: 'medium',
          priority: 3
        }
      ],
      lastUpdated: new Date().toISOString()
    }
  ];

  const filteredSuppliers = useMemo(() => {
    let filtered = mockSupplierScores;
    
    if (filterScore !== 'all') {
      filtered = filtered.filter(supplier => {
        if (filterScore === 'high') return supplier.overallScore >= 90;
        if (filterScore === 'medium') return supplier.overallScore >= 70 && supplier.overallScore < 90;
        if (filterScore === 'low') return supplier.overallScore < 70;
        return true;
      });
    }
    
    return filtered;
  }, [filterScore]);

  const getScoreColor = useCallback((score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }, []);

  const getTrendIcon = useCallback((trend: string) => {
    switch (trend) {
      case 'improving':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  }, []);

  const getSeverityColor = useCallback((severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-200 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-200 text-orange-800';
      case 'medium': return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-200 text-blue-800';
      default: return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  }, []);

  // Prepare radar chart data
  const radarChartData = useMemo(() => {
    if (selectedSupplier === 'all') return [];
    
    const supplier = mockSupplierScores.find(s => s.supplierId === selectedSupplier);
    if (!supplier) return [];
    
    return [
      {
        factor: 'Delivery',
        score: supplier.currentFactors.deliveryPerformance.score,
        fullMark: 100
      },
      {
        factor: 'Quality',
        score: supplier.currentFactors.qualityMetrics.score,
        fullMark: 100
      },
      {
        factor: 'Financial',
        score: supplier.currentFactors.financialStability.score,
        fullMark: 100
      },
      {
        factor: 'Communication',
        score: supplier.currentFactors.communicationEffectiveness.score,
        fullMark: 100
      },
      {
        factor: 'Risk',
        score: supplier.currentFactors.riskProfile.score,
        fullMark: 100
      }
    ];
  }, [selectedSupplier]);

  const updateScoringWeights = useCallback((weights: ScoringWeights) => {
    setScoringWeights(weights);
    updateWeightsMutation.mutate(weights);
  }, [updateWeightsMutation]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Supplier Reliability Scoring</h2>
          <p className="text-sm text-gray-600">Multi-factor reliability assessment with automated alerting</p>
        </div>

        <div className="flex items-center space-x-3">
          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {mockSupplierScores.map(supplier => (
                <SelectItem key={supplier.supplierId} value={supplier.supplierId}>
                  {supplier.supplierName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 Month</SelectItem>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterScore} onValueChange={(value) => setFilterScore(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scores</SelectItem>
              <SelectItem value="high">High (90+)</SelectItem>
              <SelectItem value="medium">Medium (70-89)</SelectItem>
              <SelectItem value="low">Low (<70)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Alerts */}
      {showAlerts && (
        <div className="space-y-2">
          {mockSupplierScores.flatMap(supplier => supplier.alerts.filter(alert => !alert.acknowledged)).map(alert => (
            <div key={alert.id} className={cn('p-4 rounded-lg border', getSeverityColor(alert.severity))}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <BellIcon className="h-5 w-5 mt-0.5" />
                  <div>
                    <div className="font-medium">{alert.message}</div>
                    <div className="text-sm opacity-75 mt-1">
                      {new Date(alert.createdAt).toLocaleDateString()} • {alert.type.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                >
                  Acknowledge
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Supplier Score Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSuppliers.map(supplier => (
              <Card key={supplier.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{supplier.supplierName}</CardTitle>
                    <div className={cn('px-3 py-1 rounded-full text-sm font-medium', getScoreColor(supplier.overallScore))}>
                      {supplier.overallScore.toFixed(0)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Score Breakdown */}
                  <div className="space-y-3">
                    {Object.entries(supplier.currentFactors).map(([key, factor]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          {getTrendIcon(factor.trend)}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress value={factor.score} className="w-16 h-2" />
                          <span className="text-sm font-medium w-8">{factor.score.toFixed(0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Alert Count */}
                  {supplier.alerts.filter(a => !a.acknowledged).length > 0 && (
                    <div className="flex items-center space-x-2 text-orange-600">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <span className="text-sm">
                        {supplier.alerts.filter(a => !a.acknowledged).length} active alerts
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedSupplier(supplier.supplierId)}
                    >
                      View Details
                    </Button>
                    <Badge variant="outline" className="text-xs">
                      Updated {new Date(supplier.lastUpdated).toLocaleDateString()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Score Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
              <CardDescription>Reliability scores across all suppliers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { range: '90-100', count: mockSupplierScores.filter(s => s.overallScore >= 90).length, color: '#10B981' },
                    { range: '80-89', count: mockSupplierScores.filter(s => s.overallScore >= 80 && s.overallScore < 90).length, color: '#3B82F6' },
                    { range: '70-79', count: mockSupplierScores.filter(s => s.overallScore >= 70 && s.overallScore < 80).length, color: '#F59E0B' },
                    { range: '60-69', count: mockSupplierScores.filter(s => s.overallScore >= 60 && s.overallScore < 70).length, color: '#EF4444' },
                    { range: '<60', count: mockSupplierScores.filter(s => s.overallScore < 60).length, color: '#7F1D1D' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          {selectedSupplier !== 'all' && radarChartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Factor Analysis</CardTitle>
                  <CardDescription>
                    Detailed breakdown of reliability factors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarChartData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="factor" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        <Radar
                          name="Score"
                          dataKey="score"
                          stroke="#3B82F6"
                          fill="#3B82F6"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Improvement Recommendations</CardTitle>
                  <CardDescription>
                    Prioritized actions to enhance supplier performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(() => {
                      const supplier = mockSupplierScores.find(s => s.supplierId === selectedSupplier);
                      if (!supplier) return null;
                      
                      return supplier.recommendations
                        .sort((a, b) => a.priority - b.priority)
                        .map((rec, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div className="font-medium">{rec.action}</div>
                              <Badge variant="outline">#{rec.priority}</Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>Category: {rec.category}</span>
                              <span>Impact: {rec.impact}</span>
                              <span>Effort: {rec.effort}</span>
                            </div>
                          </div>
                        ));
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Historical Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Reliability Score Trends</CardTitle>
              <CardDescription>
                Historical performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockSupplierScores.find(s => s.supplierId === selectedSupplier)?.scoreHistory || mockSupplierScores[0].scoreHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis domain={[60, 100]} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Overall Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          {/* Scoring Weights Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Scoring Weights Configuration</CardTitle>
              <CardDescription>
                Adjust the importance of each reliability factor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(scoringWeights).map(([factor, weight]) => (
                <div key={factor} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium capitalize">
                      {factor.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <span className="text-sm font-medium">{weight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={weight}
                    onChange={(e) => {
                      const newWeight = parseInt(e.target.value);
                      const totalOtherWeights = Object.entries(scoringWeights)
                        .filter(([key]) => key !== factor)
                        .reduce((sum, [, value]) => sum + value, 0);
                      
                      if (totalOtherWeights + newWeight <= 100) {
                        updateScoringWeights({
                          ...scoringWeights,
                          [factor]: newWeight
                        });
                      }
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              ))}
              
              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Total Weight:</span>
                  <span className="font-medium">
                    {Object.values(scoringWeights).reduce((sum, weight) => sum + weight, 0)}%
                  </span>
                </div>
              </div>

              <Button onClick={() => updateScoringWeights(scoringWeights)}>
                Update Scoring Configuration
              </Button>
            </CardContent>
          </Card>

          {/* Alert Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
              <CardDescription>
                Configure thresholds for automated alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Score Drop Threshold</label>
                  <Input type="number" defaultValue="5" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Critical Score Level</label>
                  <Input type="number" defaultValue="70" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Delivery Performance Threshold</label>
                  <Input type="number" defaultValue="85" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Quality Score Threshold</label>
                  <Input type="number" defaultValue="80" className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}