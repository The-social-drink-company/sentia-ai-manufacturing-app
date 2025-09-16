import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  GlobeAltIcon,
  BoltIcon,
  MapPinIcon,
  ClockIcon,
  ArrowPathIcon,
  ChartBarIcon,
  EyeIcon,
  CogIcon,
  PlayIcon,
  PauseIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useQuery, useMutation } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface RiskFactor {
  id: string;
  name: string;
  category: 'supply_disruption' | 'geopolitical' | 'natural_disaster' | 'financial' | 'operational' | 'cyber';
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-100
  impact: number; // 0-100
  riskScore: number; // probability * impact / 100
  trend: 'increasing' | 'stable' | 'decreasing';
  affectedSuppliers: string[];
  affectedRegions: string[];
  description: string;
  detectedAt: string;
  lastUpdated: string;
  mitigationStrategies: Array<{
    strategy: string;
    effectiveness: number;
    cost: number;
    timeToImplement: number;
    status: 'planned' | 'in_progress' | 'implemented' | 'deferred';
  }>;
  historicalOccurrences: Array<{
    date: string;
    severity: string;
    impact: number;
    duration: number;
  }>;
}

interface SinglePointOfFailure {
  id: string;
  type: 'supplier' | 'route' | 'facility' | 'technology';
  name: string;
  description: string;
  dependencyLevel: 'low' | 'medium' | 'high' | 'critical';
  alternativesAvailable: number;
  impactIfFailed: {
    revenue: number;
    operations: number;
    reputation: number;
    compliance: number;
  };
  mitigationPriority: number;
  recommendation: string;
}

interface DisruptionEvent {
  id: string;
  type: 'supplier_outage' | 'natural_disaster' | 'geopolitical' | 'cyber_attack' | 'quality_issue' | 'logistics_disruption';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'monitoring' | 'resolved' | 'false_alarm';
  startTime: string;
  estimatedDuration: number;
  affectedSuppliers: string[];
  affectedProducts: string[];
  impactAssessment: {
    financialImpact: number;
    operationalImpact: number;
    customerImpact: number;
    timeToRecover: number;
  };
  responseActions: Array<{
    action: string;
    responsible: string;
    status: 'pending' | 'in_progress' | 'completed';
    dueDate: string;
  }>;
  communications: Array<{
    timestamp: string;
    channel: string;
    message: string;
    audience: string[];
  }>;
}

interface GeopoliticalRisk {
  region: string;
  country: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: Array<{
    type: 'trade_war' | 'sanctions' | 'political_instability' | 'currency_volatility' | 'regulatory_changes';
    description: string;
    impact: number;
    likelihood: number;
  }>;
  affectedSuppliers: string[];
  tradingVolume: number;
  strategicImportance: number;
  lastAssessment: string;
}

export function RiskAssessmentDashboard() {
  const [selectedRiskCategory, setSelectedRiskCategory] = useState<'all' | 'supply_disruption' | 'geopolitical' | 'natural_disaster' | 'financial' | 'operational' | 'cyber'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [timeRange, setTimeRange] = useState<'1w' | '1m' | '3m' | '6m'>('1m');
  const [showMitigationStrategies, setShowMitigationStrategies] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch risk data
  const { data: riskFactors = [], isLoading: risksLoading, refetch: refetchRisks } = useQuery({
    queryKey: ['risk-factors', selectedRiskCategory, selectedSeverity, timeRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(selectedRiskCategory !== 'all' && { category: selectedRiskCategory }),
        ...(selectedSeverity !== 'all' && { severity: selectedSeverity }),
        timeRange
      });
      const response = await fetch(`/api/supply-chain/risk-factors?${params}`);
      if (!response.ok) throw new Error('Failed to fetch risk factors');
      return response.json() as RiskFactor[];
    },
    refetchInterval: autoRefresh ? 60000 : false, // Refresh every minute
  });

  // Fetch single points of failure
  const { data: spofs = [] } = useQuery({
    queryKey: ['single-points-failure'],
    queryFn: async () => {
      const response = await fetch('/api/supply-chain/single-points-failure');
      if (!response.ok) throw new Error('Failed to fetch single points of failure');
      return response.json() as SinglePointOfFailure[];
    },
  });

  // Fetch disruption events
  const { data: disruptionEvents = [] } = useQuery({
    queryKey: ['disruption-events'],
    queryFn: async () => {
      const response = await fetch('/api/supply-chain/disruption-events');
      if (!response.ok) throw new Error('Failed to fetch disruption events');
      return response.json() as DisruptionEvent[];
    },
  });

  // Fetch geopolitical risks
  const { data: geopoliticalRisks = [] } = useQuery({
    queryKey: ['geopolitical-risks'],
    queryFn: async () => {
      const response = await fetch('/api/supply-chain/geopolitical-risks');
      if (!response.ok) throw new Error('Failed to fetch geopolitical risks');
      return response.json() as GeopoliticalRisk[];
    },
  });

  // Mock data for demonstration
  const mockRiskFactors: RiskFactor[] = [
    {
      id: 'risk-1',
      name: 'Semiconductor Supply Shortage',
      category: 'supply_disruption',
      severity: 'high',
      probability: 75,
      impact: 85,
      riskScore: 63.75,
      trend: 'increasing',
      affectedSuppliers: ['Pacific Electronics Ltd', 'Asia Tech Components'],
      affectedRegions: ['Asia Pacific'],
      description: 'Global semiconductor shortage affecting component availability',
      detectedAt: '2024-01-10T08:00:00Z',
      lastUpdated: '2024-01-17T14:30:00Z',
      mitigationStrategies: [
        {
          strategy: 'Diversify supplier base across regions',
          effectiveness: 70,
          cost: 25000,
          timeToImplement: 90,
          status: 'in_progress'
        },
        {
          strategy: 'Increase strategic inventory levels',
          effectiveness: 60,
          cost: 15000,
          timeToImplement: 30,
          status: 'implemented'
        }
      ],
      historicalOccurrences: [
        { date: '2021-03-15', severity: 'critical', impact: 90, duration: 180 },
        { date: '2022-08-20', severity: 'high', impact: 75, duration: 120 }
      ]
    },
    {
      id: 'risk-2',
      name: 'Trade Tensions - China/US',
      category: 'geopolitical',
      severity: 'medium',
      probability: 60,
      impact: 70,
      riskScore: 42,
      trend: 'stable',
      affectedSuppliers: ['Pacific Electronics Ltd', 'Shenzhen Manufacturing Co'],
      affectedRegions: ['Asia Pacific', 'North America'],
      description: 'Ongoing trade tensions affecting tariffs and supply chain routes',
      detectedAt: '2024-01-05T10:00:00Z',
      lastUpdated: '2024-01-17T16:00:00Z',
      mitigationStrategies: [
        {
          strategy: 'Establish alternative suppliers in neutral regions',
          effectiveness: 80,
          cost: 50000,
          timeToImplement: 120,
          status: 'planned'
        }
      ],
      historicalOccurrences: [
        { date: '2019-05-10', severity: 'high', impact: 80, duration: 365 },
        { date: '2020-01-15', severity: 'medium', impact: 60, duration: 180 }
      ]
    },
    {
      id: 'risk-3',
      name: 'Port Congestion - Hamburg',
      category: 'operational',
      severity: 'medium',
      probability: 45,
      impact: 50,
      riskScore: 22.5,
      trend: 'decreasing',
      affectedSuppliers: ['European Components GmbH'],
      affectedRegions: ['Europe'],
      description: 'Increased congestion at Hamburg port affecting delivery schedules',
      detectedAt: '2024-01-12T12:00:00Z',
      lastUpdated: '2024-01-17T18:00:00Z',
      mitigationStrategies: [
        {
          strategy: 'Use alternative ports (Rotterdam, Antwerp)',
          effectiveness: 85,
          cost: 5000,
          timeToImplement: 14,
          status: 'implemented'
        }
      ],
      historicalOccurrences: []
    }
  ];

  const mockSPOFs: SinglePointOfFailure[] = [
    {
      id: 'spof-1',
      type: 'supplier',
      name: 'Pacific Electronics Ltd - Critical Components',
      description: 'Single supplier for specialized electronic components with no immediate alternatives',
      dependencyLevel: 'critical',
      alternativesAvailable: 0,
      impactIfFailed: {
        revenue: 85,
        operations: 90,
        reputation: 70,
        compliance: 60
      },
      mitigationPriority: 1,
      recommendation: 'Urgently develop secondary supplier relationships or find alternative components'
    },
    {
      id: 'spof-2',
      type: 'route',
      name: 'Suez Canal Shipping Route',
      description: 'Primary shipping route for 60% of components from Asia to Europe',
      dependencyLevel: 'high',
      alternativesAvailable: 2,
      impactIfFailed: {
        revenue: 60,
        operations: 75,
        reputation: 40,
        compliance: 30
      },
      mitigationPriority: 2,
      recommendation: 'Develop alternative shipping routes and maintain contingency agreements'
    }
  ];

  const mockDisruptionEvents: DisruptionEvent[] = [
    {
      id: 'event-1',
      type: 'natural_disaster',
      title: 'Typhoon Affecting Philippine Manufacturing',
      description: 'Major typhoon impacting manufacturing facilities in the Philippines',
      severity: 'high',
      status: 'active',
      startTime: '2024-01-16T06:00:00Z',
      estimatedDuration: 72,
      affectedSuppliers: ['Asia Manufacturing Co'],
      affectedProducts: ['Electronic Components', 'Cables'],
      impactAssessment: {
        financialImpact: 250000,
        operationalImpact: 80,
        customerImpact: 60,
        timeToRecover: 14
      },
      responseActions: [
        {
          action: 'Activate alternative suppliers',
          responsible: 'Supply Chain Team',
          status: 'in_progress',
          dueDate: '2024-01-17T12:00:00Z'
        },
        {
          action: 'Communicate delays to customers',
          responsible: 'Customer Service',
          status: 'completed',
          dueDate: '2024-01-16T18:00:00Z'
        }
      ],
      communications: [
        {
          timestamp: '2024-01-16T08:00:00Z',
          channel: 'Email',
          message: 'Supply chain disruption alert - Typhoon impact on Philippines operations',
          audience: ['Management', 'Operations']
        }
      ]
    }
  ];

  const mockGeopoliticalRisks: GeopoliticalRisk[] = [
    {
      region: 'Asia Pacific',
      country: 'China',
      riskLevel: 'medium',
      factors: [
        {
          type: 'trade_war',
          description: 'Ongoing trade tensions with major trading partners',
          impact: 70,
          likelihood: 60
        },
        {
          type: 'regulatory_changes',
          description: 'New export control regulations',
          impact: 50,
          likelihood: 40
        }
      ],
      affectedSuppliers: ['Pacific Electronics Ltd', 'Shenzhen Manufacturing Co'],
      tradingVolume: 2400000,
      strategicImportance: 85,
      lastAssessment: '2024-01-15T10:00:00Z'
    }
  ];

  // Calculate risk metrics
  const riskMetrics = useMemo(() => {
    const totalRisks = mockRiskFactors.length;
    const criticalRisks = mockRiskFactors.filter(r => r.severity === 'critical').length;
    const highRisks = mockRiskFactors.filter(r => r.severity === 'high').length;
    const activeDisruptions = mockDisruptionEvents.filter(e => e.status === 'active').length;
    const criticalSPOFs = mockSPOFs.filter(s => s.dependencyLevel === 'critical').length;
    
    const averageRiskScore = totalRisks > 0 ? 
      mockRiskFactors.reduce((sum, r) => sum + r.riskScore, 0) / totalRisks : 0;

    return {
      totalRisks,
      criticalRisks,
      highRisks,
      activeDisruptions,
      criticalSPOFs,
      averageRiskScore
    };
  }, []);

  const filteredRiskFactors = useMemo(() => {
    let filtered = mockRiskFactors;
    
    if (selectedRiskCategory !== 'all') {
      filtered = filtered.filter(r => r.category === selectedRiskCategory);
    }
    
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(r => r.severity === selectedSeverity);
    }
    
    return filtered.sort((a, b) => b.riskScore - a.riskScore);
  }, [selectedRiskCategory, selectedSeverity]);

  const getSeverityColor = useCallback((severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }, []);

  const getTrendIcon = useCallback((trend: string) => {
    switch (trend) {
      case 'increasing':
        return <ArrowPathIcon className="h-4 w-4 text-red-500 rotate-45" />;
      case 'decreasing':
        return <ArrowPathIcon className="h-4 w-4 text-green-500 -rotate-45" />;
      default:
        return <div className="h-4 w-4 bg-yellow-400 rounded-full" />;
    }
  }, []);

  const getRiskScoreColor = useCallback((score: number) => {
    if (score >= 60) return 'text-red-600';
    if (score >= 40) return 'text-orange-600';
    if (score >= 20) return 'text-yellow-600';
    return 'text-green-600';
  }, []);

  // Prepare chart data
  const riskDistributionData = [
    { name: 'Critical', value: mockRiskFactors.filter(r => r.severity === 'critical').length, color: '#EF4444' },
    { name: 'High', value: mockRiskFactors.filter(r => r.severity === 'high').length, color: '#F97316' },
    { name: 'Medium', value: mockRiskFactors.filter(r => r.severity === 'medium').length, color: '#F59E0B' },
    { name: 'Low', value: mockRiskFactors.filter(r => r.severity === 'low').length, color: '#10B981' }
  ];

  const riskTrendData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    riskScore: 35 + Math.sin(i / 5) * 10 + 0 /* REAL DATA REQUIRED */ * 5,
    criticalRisks: Math.floor(0 /* REAL DATA REQUIRED */),
    highRisks: 1 + Math.floor(0 /* REAL DATA REQUIRED */),
    mediumRisks: 2 + Math.floor(0 /* REAL DATA REQUIRED */)
  }));

  if (risksLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
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
          <h2 className="text-2xl font-bold text-gray-900">Risk Assessment Dashboard</h2>
          <p className="text-sm text-gray-600">Real-time supply chain risk monitoring and disruption management</p>
        </div>

        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1w">1 Week</SelectItem>
              <SelectItem value="1m">1 Month</SelectItem>
              <SelectItem value="3m">3 Months</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <ArrowPathIcon className={cn("h-4 w-4 mr-2", autoRefresh && "animate-spin")} />
            Auto Refresh
          </Button>
        </div>
      </div>

      {/* Risk Metrics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{riskMetrics.totalRisks}</div>
              <div className="text-sm text-gray-600">Total Risks</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{riskMetrics.criticalRisks}</div>
              <div className="text-sm text-gray-600">Critical</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{riskMetrics.highRisks}</div>
              <div className="text-sm text-gray-600">High</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{riskMetrics.activeDisruptions}</div>
              <div className="text-sm text-gray-600">Active Events</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{riskMetrics.criticalSPOFs}</div>
              <div className="text-sm text-gray-600">Critical SPOFs</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className={cn("text-2xl font-bold", getRiskScoreColor(riskMetrics.averageRiskScore))}>
                {riskMetrics.averageRiskScore.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Risk Score</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Disruption Events */}
      {mockDisruptionEvents.filter(e => e.status === 'active').length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              <CardTitle className="text-red-900">Active Disruption Events</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockDisruptionEvents.filter(e => e.status === 'active').map(event => (
                <div key={event.id} className="p-4 bg-white border border-red-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-red-900">{event.title}</h4>
                      <p className="text-sm text-red-700 mt-1">{event.description}</p>
                    </div>
                    <Badge className={getSeverityColor(event.severity)}>
                      {event.severity}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-red-600">Financial Impact:</span>
                      <div className="font-medium">£{event.impactAssessment.financialImpact.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-red-600">Duration:</span>
                      <div className="font-medium">{event.estimatedDuration} hours</div>
                    </div>
                    <div>
                      <span className="text-red-600">Recovery Time:</span>
                      <div className="font-medium">{event.impactAssessment.timeToRecover} days</div>
                    </div>
                    <div>
                      <span className="text-red-600">Status:</span>
                      <div className="font-medium capitalize">{event.status}</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-red-200">
                    <div className="text-sm text-red-600 mb-2">Response Actions:</div>
                    <div className="space-y-1">
                      {event.responseActions.map((action, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{action.action}</span>
                          <Badge variant="outline" className="text-xs">
                            {action.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Controls */}
      <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border">
        <Select value={selectedRiskCategory} onValueChange={(value) => setSelectedRiskCategory(value as any)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="supply_disruption">Supply Disruption</SelectItem>
            <SelectItem value="geopolitical">Geopolitical</SelectItem>
            <SelectItem value="natural_disaster">Natural Disaster</SelectItem>
            <SelectItem value="financial">Financial</SelectItem>
            <SelectItem value="operational">Operational</SelectItem>
            <SelectItem value="cyber">Cyber Security</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedSeverity} onValueChange={(value) => setSelectedSeverity(value as any)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => setShowMitigationStrategies(!showMitigationStrategies)}
        >
          {showMitigationStrategies ? 'Hide' : 'Show'} Mitigation
        </Button>
      </div>

      <Tabs defaultValue="risks" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="risks">Risk Factors</TabsTrigger>
          <TabsTrigger value="spof">Single Points of Failure</TabsTrigger>
          <TabsTrigger value="geopolitical">Geopolitical</TabsTrigger>
          <TabsTrigger value="analytics">Risk Analytics</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
        </TabsList>

        <TabsContent value="risks" className="space-y-6">
          {/* Risk Factors List */}
          <div className="space-y-4">
            {filteredRiskFactors.map(risk => (
              <Card key={risk.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{risk.name}</h3>
                          <Badge className={getSeverityColor(risk.severity)}>
                            {risk.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {risk.category.replace('_', ' ')}
                          </Badge>
                          {getTrendIcon(risk.trend)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{risk.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{risk.affectedSuppliers.length} suppliers affected</span>
                          <span>•</span>
                          <span>{risk.affectedRegions.join(', ')}</span>
                          <span>•</span>
                          <span>Updated {new Date(risk.lastUpdated).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={cn("text-2xl font-bold mb-1", getRiskScoreColor(risk.riskScore))}>
                        {risk.riskScore.toFixed(0)}
                      </div>
                      <div className="text-sm text-gray-600">Risk Score</div>
                    </div>
                  </div>

                  {/* Risk Details */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Probability</div>
                      <div className="flex items-center space-x-2">
                        <Progress value={risk.probability} className="flex-1 h-2" />
                        <span className="text-sm font-medium">{risk.probability}%</span>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Impact</div>
                      <div className="flex items-center space-x-2">
                        <Progress value={risk.impact} className="flex-1 h-2" />
                        <span className="text-sm font-medium">{risk.impact}%</span>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Trend</div>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(risk.trend)}
                        <span className="text-sm font-medium capitalize">{risk.trend}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Occurrences</div>
                      <div className="text-sm font-medium">{risk.historicalOccurrences.length} times</div>
                    </div>
                  </div>

                  {/* Mitigation Strategies */}
                  {showMitigationStrategies && risk.mitigationStrategies.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Mitigation Strategies</h4>
                      <div className="space-y-2">
                        {risk.mitigationStrategies.map((strategy, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-blue-900">{strategy.strategy}</div>
                              <div className="text-sm text-blue-700">
                                {strategy.effectiveness}% effective • £{strategy.cost.toLocaleString()} cost • {strategy.timeToImplement} days
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {strategy.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="spof" className="space-y-6">
          {/* Single Points of Failure */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockSPOFs.map(spof => (
              <Card key={spof.id} className="border-yellow-200">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <ShieldExclamationIcon className="h-6 w-6 text-yellow-600" />
                    <CardTitle className="text-lg">{spof.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{spof.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Dependency Level:</span>
                      <div className={cn(
                        'font-medium',
                        spof.dependencyLevel === 'critical' ? 'text-red-600' :
                        spof.dependencyLevel === 'high' ? 'text-orange-600' :
                        spof.dependencyLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      )}>
                        {spof.dependencyLevel.toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Alternatives:</span>
                      <div className="font-medium">{spof.alternativesAvailable}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-2">Impact if Failed:</div>
                    <div className="space-y-2">
                      {Object.entries(spof.impactIfFailed).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{key}:</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={value} className="w-16 h-2" />
                            <span className="text-sm font-medium w-8">{value}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="text-sm text-gray-600 mb-1">Recommendation:</div>
                    <p className="text-sm">{spof.recommendation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="geopolitical" className="space-y-6">
          {/* Geopolitical Risk Assessment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {mockGeopoliticalRisks.map((geoRisk, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{geoRisk.country}</CardTitle>
                    <Badge className={getSeverityColor(geoRisk.riskLevel)}>
                      {geoRisk.riskLevel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Trading Volume:</span>
                      <div className="font-medium">£{(geoRisk.tradingVolume / 1000000).toFixed(1)}M</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Strategic Importance:</span>
                      <div className="font-medium">{geoRisk.strategicImportance}%</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-2">Risk Factors:</div>
                    <div className="space-y-2">
                      {geoRisk.factors.map((factor, factorIndex) => (
                        <div key={factorIndex} className="p-2 bg-gray-50 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium capitalize">
                              {factor.type.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-500">
                              {factor.impact}% impact • {factor.likelihood}% likelihood
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{factor.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Affected Suppliers:</div>
                    <div className="flex flex-wrap gap-1">
                      {geoRisk.affectedSuppliers.map((supplier, supplierIndex) => (
                        <Badge key={supplierIndex} variant="outline" className="text-xs">
                          {supplier}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Last assessed: {new Date(geoRisk.lastAssessment).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Risk Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {riskDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Score Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={riskTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date"
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="riskScore" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        name="Overall Risk Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { category: 'Supply Disruption', count: mockRiskFactors.filter(r => r.category === 'supply_disruption').length },
                      { category: 'Geopolitical', count: mockRiskFactors.filter(r => r.category === 'geopolitical').length },
                      { category: 'Natural Disaster', count: mockRiskFactors.filter(r => r.category === 'natural_disaster').length },
                      { category: 'Financial', count: mockRiskFactors.filter(r => r.category === 'financial').length },
                      { category: 'Operational', count: mockRiskFactors.filter(r => r.category === 'operational').length },
                      { category: 'Cyber', count: mockRiskFactors.filter(r => r.category === 'cyber').length }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="category"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk vs Impact Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ResponsiveContainer>
                      <div className="grid grid-cols-10 grid-rows-10 gap-1 h-full">
                        {Array.from({ length: 100 }, (_, i) => {
                          const x = i % 10;
                          const y = Math.floor(i / 10);
                          const risk = mockRiskFactors.find(r => 
                            Math.floor(r.probability / 10) === x && 
                            Math.floor(r.impact / 10) === (9 - y)
                          );
                          
                          return (
                            <div
                              key={i}
                              className={cn(
                                'aspect-square rounded-sm border',
                                risk ? getSeverityColor(risk.severity).split(' ')[0] + '-500' : 'bg-gray-100',
                                'hover:scale-110 transition-transform cursor-pointer'
                              )}
                              title={risk ? risk.name : ''}
                            />
                          );
                        })}
                      </div>
                    </ResponsiveContainer>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Low Impact</span>
                    <span>High Impact →</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>↑ High Probability</span>
                    <span></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Low Probability</span>
                    <span></span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          {/* Risk Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Scenario Planning</CardTitle>
              <CardDescription>
                What-if analysis for various risk scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <ChartBarIcon className="h-16 w-16 mx-auto mb-4" />
                <p>Scenario modeling and stress testing functionality</p>
                <p className="text-sm">Monte Carlo simulations and impact analysis</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}