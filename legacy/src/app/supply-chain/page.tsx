'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  GlobeAltIcon,
  TruckIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  CogIcon,
  EyeIcon,
  ArrowPathIcon,
  FunnelIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SupplierReliabilityScoring } from '@/components/supply-chain/SupplierReliabilityScoring';
import { ShipmentTrackingSystem } from '@/components/supply-chain/ShipmentTrackingSystem';
import { LeadTimePredictionEngine } from '@/components/supply-chain/LeadTimePredictionEngine';
import { RiskAssessmentDashboard } from '@/components/supply-chain/RiskAssessmentDashboard';
import { AlternativeSupplierFinder } from '@/components/supply-chain/AlternativeSupplierFinder';
import { InteractiveSupplyChainMap } from '@/components/supply-chain/InteractiveSupplyChainMap';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface SupplyChainNode {
  id: string;
  name: string;
  type: 'supplier' | 'manufacturer' | 'distributor' | 'retailer' | 'warehouse';
  location: {
    lat: number;
    lng: number;
    address: string;
    country: string;
    region: string;
  };
  status: 'operational' | 'warning' | 'critical' | 'offline';
  metrics: {
    reliabilityScore: number;
    capacity: number;
    utilization: number;
    leadTime: number;
    cost: number;
  };
  connections: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: string;
}

interface SupplyChainEdge {
  id: string;
  from: string;
  to: string;
  type: 'road' | 'sea' | 'air' | 'rail';
  distance: number;
  transitTime: number;
  cost: number;
  status: 'active' | 'delayed' | 'disrupted' | 'maintenance';
  currentShipments: number;
  capacity: number;
  riskFactors: string[];
}

interface SupplyChainMetrics {
  totalNodes: number;
  activeConnections: number;
  averageReliability: number;
  totalShipments: number;
  onTimeDelivery: number;
  riskAlerts: number;
  costEfficiency: number;
  networkHealth: number;
}

type ViewMode = 'geographic' | 'network' | 'risk' | 'performance';
type FilterType = 'all' | 'suppliers' | 'manufacturers' | 'distributors' | 'warehouses';

export default function SupplyChainPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'reliability' | 'tracking' | 'predictions' | 'risk' | 'suppliers'>('overview');
  const [viewMode, setViewMode] = useState<ViewMode>('geographic');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showRiskOverlay, setShowRiskOverlay] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch supply chain data
  const { data: supplyChainData, isLoading, refetch } = useQuery({
    queryKey: ['supply-chain-overview'],
    queryFn: async () => {
      const response = await fetch('/api/supply-chain/overview');
      if (!response.ok) throw new Error('Failed to fetch supply chain data');
      return response.json();
    },
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds
  });

  // WebSocket for real-time updates
  useWebSocket('wss://localhost:3001/supply-chain', {
    onMessage: (message) => {
      try {
        const data = JSON.parse(message.data);
        if (data.type === 'supply_chain_update' || data.type === 'shipment_update') {
          refetch();
        }
      } catch (error) {
        console.error('Error parsing supply chain WebSocket message:', error);
      }
    },
  });

  // Mock data for demonstration
  const mockNodes: SupplyChainNode[] = [
    {
      id: 'supplier-asia-1',
      name: 'Pacific Electronics Ltd',
      type: 'supplier',
      location: { lat: 35.6762, lng: 139.6503, address: 'Tokyo, Japan', country: 'Japan', region: 'Asia' },
      status: 'operational',
      metrics: { reliabilityScore: 94, capacity: 10000, utilization: 78, leadTime: 14, cost: 1200 },
      connections: ['manufacturer-uk-1'],
      riskLevel: 'low',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'supplier-eu-1',
      name: 'European Components GmbH',
      type: 'supplier',
      location: { lat: 52.5200, lng: 13.4050, address: 'Berlin, Germany', country: 'Germany', region: 'Europe' },
      status: 'warning',
      metrics: { reliabilityScore: 87, capacity: 8000, utilization: 92, leadTime: 10, cost: 950 },
      connections: ['manufacturer-uk-1'],
      riskLevel: 'medium',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'manufacturer-uk-1',
      name: 'Sentia Manufacturing UK',
      type: 'manufacturer',
      location: { lat: 51.5074, lng: -0.1278, address: 'London, UK', country: 'UK', region: 'Europe' },
      status: 'operational',
      metrics: { reliabilityScore: 96, capacity: 5000, utilization: 85, leadTime: 7, cost: 2100 },
      connections: ['distributor-us-1', 'distributor-eu-1'],
      riskLevel: 'low',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'distributor-us-1',
      name: 'North American Distribution',
      type: 'distributor',
      location: { lat: 40.7128, lng: -74.0060, address: 'New York, USA', country: 'USA', region: 'Americas' },
      status: 'operational',
      metrics: { reliabilityScore: 91, capacity: 15000, utilization: 67, leadTime: 5, cost: 800 },
      connections: ['warehouse-us-west', 'warehouse-us-east'],
      riskLevel: 'low',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'warehouse-us-west',
      name: 'Pacific Coast Warehouse',
      type: 'warehouse',
      location: { lat: 34.0522, lng: -118.2437, address: 'Los Angeles, USA', country: 'USA', region: 'Americas' },
      status: 'critical',
      metrics: { reliabilityScore: 72, capacity: 8000, utilization: 98, leadTime: 2, cost: 400 },
      connections: [],
      riskLevel: 'high',
      lastUpdated: new Date().toISOString()
    }
  ];

  const mockEdges: SupplyChainEdge[] = [
    {
      id: 'edge-1',
      from: 'supplier-asia-1',
      to: 'manufacturer-uk-1',
      type: 'sea',
      distance: 9600,
      transitTime: 21,
      cost: 3200,
      status: 'active',
      currentShipments: 3,
      capacity: 10,
      riskFactors: ['weather', 'port_congestion']
    },
    {
      id: 'edge-2',
      from: 'supplier-eu-1',
      to: 'manufacturer-uk-1',
      type: 'road',
      distance: 950,
      transitTime: 2,
      cost: 450,
      status: 'delayed',
      currentShipments: 2,
      capacity: 5,
      riskFactors: ['border_delays']
    }
  ];

  const mockMetrics: SupplyChainMetrics = {
    totalNodes: mockNodes.length,
    activeConnections: mockEdges.filter(e => e.status === 'active').length,
    averageReliability: 88,
    totalShipments: 247,
    onTimeDelivery: 94.2,
    riskAlerts: 3,
    costEfficiency: 87,
    networkHealth: 91
  };

  const filteredNodes = useMemo(() => {
    if (filterType === 'all') return mockNodes;
    return mockNodes.filter(node => {
      switch (filterType) {
        case 'suppliers': return node.type === 'supplier';
        case 'manufacturers': return node.type === 'manufacturer';
        case 'distributors': return node.type === 'distributor';
        case 'warehouses': return node.type === 'warehouse';
        default: return true;
      }
    });
  }, [filterType]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'offline': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }, []);

  const getRiskColor = useCallback((risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <GlobeAltIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Supply Chain Intelligence Hub
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  End-to-end visibility and control across your global supply network
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* View Mode Selector */}
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geographic">Geographic View</SelectItem>
                  <SelectItem value="network">Network View</SelectItem>
                  <SelectItem value="risk">Risk View</SelectItem>
                  <SelectItem value="performance">Performance View</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Selector */}
              <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Nodes</SelectItem>
                  <SelectItem value="suppliers">Suppliers</SelectItem>
                  <SelectItem value="manufacturers">Manufacturers</SelectItem>
                  <SelectItem value="distributors">Distributors</SelectItem>
                  <SelectItem value="warehouses">Warehouses</SelectItem>
                </SelectContent>
              </Select>

              {/* Controls */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRiskOverlay(!showRiskOverlay)}
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                Risk Overlay
              </Button>

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
        </div>
      </div>

      {/* Key Metrics */}
      <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{mockMetrics.totalNodes}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Nodes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{mockMetrics.activeConnections}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Links</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{mockMetrics.averageReliability}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Reliability</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{mockMetrics.totalShipments}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Shipments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{mockMetrics.onTimeDelivery}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">On-Time Delivery</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{mockMetrics.riskAlerts}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Risk Alerts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{mockMetrics.costEfficiency}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Cost Efficiency</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-600">{mockMetrics.networkHealth}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Network Health</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800">
        <div className="px-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <Squares2X2Icon className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="reliability" className="flex items-center space-x-2">
                <CheckCircleIcon className="h-4 w-4" />
                <span>Reliability</span>
              </TabsTrigger>
              <TabsTrigger value="tracking" className="flex items-center space-x-2">
                <TruckIcon className="h-4 w-4" />
                <span>Tracking</span>
              </TabsTrigger>
              <TabsTrigger value="predictions" className="flex items-center space-x-2">
                <ClockIcon className="h-4 w-4" />
                <span>Predictions</span>
              </TabsTrigger>
              <TabsTrigger value="risk" className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <span>Risk</span>
              </TabsTrigger>
              <TabsTrigger value="suppliers" className="flex items-center space-x-2">
                <ChartBarIcon className="h-4 w-4" />
                <span>Suppliers</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              <div className="p-6 space-y-6">
                {/* Interactive Supply Chain Map */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Interactive Supply Chain Network</CardTitle>
                        <CardDescription>
                          Real-time visualization of your global supply network with risk overlay
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {filteredNodes.length} nodes displayed
                        </Badge>
                        <Badge variant={showRiskOverlay ? "default" : "outline"}>
                          Risk overlay {showRiskOverlay ? 'ON' : 'OFF'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <InteractiveSupplyChainMap
                      nodes={filteredNodes}
                      edges={mockEdges}
                      viewMode={viewMode}
                      showRiskOverlay={showRiskOverlay}
                      selectedNode={selectedNode}
                      onNodeSelect={setSelectedNode}
                    />
                  </CardContent>
                </Card>

                {/* Node Details Panel */}
                {selectedNode && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Node Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const node = mockNodes.find(n => n.id === selectedNode);
                        if (!node) return null;
                        
                        return (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">{node.name}</h3>
                                <Badge className={getStatusColor(node.status)}>
                                  {node.status}
                                </Badge>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Type:</span>
                                  <span className="font-medium">{node.type}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Location:</span>
                                  <span className="font-medium">{node.location.address}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Risk Level:</span>
                                  <span className={cn("font-medium", getRiskColor(node.riskLevel))}>
                                    {node.riskLevel}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h4 className="font-medium">Performance Metrics</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Reliability Score:</span>
                                  <span className="font-medium">{node.metrics.reliabilityScore}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Capacity Utilization:</span>
                                  <span className="font-medium">{node.metrics.utilization}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Lead Time:</span>
                                  <span className="font-medium">{node.metrics.leadTime} days</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Cost Index:</span>
                                  <span className="font-medium">£{node.metrics.cost.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reliability" className="mt-0">
              <div className="p-6">
                <SupplierReliabilityScoring />
              </div>
            </TabsContent>

            <TabsContent value="tracking" className="mt-0">
              <div className="p-6">
                <ShipmentTrackingSystem />
              </div>
            </TabsContent>

            <TabsContent value="predictions" className="mt-0">
              <div className="p-6">
                <LeadTimePredictionEngine />
              </div>
            </TabsContent>

            <TabsContent value="risk" className="mt-0">
              <div className="p-6">
                <RiskAssessmentDashboard />
              </div>
            </TabsContent>

            <TabsContent value="suppliers" className="mt-0">
              <div className="p-6">
                <AlternativeSupplierFinder />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}