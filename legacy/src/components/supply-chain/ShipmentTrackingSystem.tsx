import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Bar
} from 'recharts';
import { 
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  CubeIcon,
  BellIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { useMutation, useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface TrackingEvent {
  id: string;
  timestamp: string;
  location: {
    name: string;
    coordinates: { lat: number; lng: number };
    address: string;
    type: 'origin' | 'transit' | 'hub' | 'destination' | 'warehouse';
  };
  status: 'in_transit' | 'arrived' | 'departed' | 'delivered' | 'exception' | 'customs_clearance';
  description: string;
  carrier?: string;
  estimatedArrival?: string;
}

interface Shipment {
  id: string;
  trackingNumber: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'delayed' | 'exception' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  origin: {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
  };
  destination: {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
  };
  carrier: {
    name: string;
    service: string;
    trackingUrl: string;
  };
  cargo: {
    description: string;
    weight: number;
    dimensions: { length: number; width: number; height: number };
    value: number;
    category: string;
  };
  timeline: {
    created: string;
    shipped: string;
    estimatedDelivery: string;
    actualDelivery?: string;
  };
  currentLocation?: {
    name: string;
    coordinates: { lat: number; lng: number };
    timestamp: string;
  };
  delayProbability: number;
  alternativeRoutes?: Array<{
    id: string;
    description: string;
    estimatedDelivery: string;
    additionalCost: number;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  events: TrackingEvent[];
  documents: Array<{
    type: 'invoice' | 'packing_list' | 'certificate' | 'customs' | 'insurance';
    name: string;
    url: string;
  }>;
  notifications: Array<{
    type: 'delay' | 'delivery' | 'exception' | 'customs';
    message: string;
    timestamp: string;
    acknowledged: boolean;
  }>;
}

interface CarrierPerformance {
  carrierId: string;
  carrierName: string;
  onTimeRate: number;
  averageDelay: number;
  totalShipments: number;
  activeShipments: number;
  costPerShipment: number;
  customerRating: number;
  coverageArea: string[];
}

export function ShipmentTrackingSystem() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_transit' | 'delayed' | 'delivered' | 'exception'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [carrierFilter, setCarrierFilter] = useState<string>('all');
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch shipment data
  const { data: shipments = [], isLoading, refetch } = useQuery({
    queryKey: ['shipments', statusFilter, priorityFilter, carrierFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(carrierFilter !== 'all' && { carrier: carrierFilter }),
      });
      const response = await fetch(`/api/supply-chain/shipments?${params}`);
      if (!response.ok) throw new Error('Failed to fetch shipments');
      return response.json() as Shipment[];
    },
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
  });

  // Fetch carrier performance
  const { data: carrierPerformance = [] } = useQuery({
    queryKey: ['carrier-performance'],
    queryFn: async () => {
      const response = await fetch('/api/supply-chain/carrier-performance');
      if (!response.ok) throw new Error('Failed to fetch carrier performance');
      return response.json() as CarrierPerformance[];
    },
  });

  // Request alternative routes
  const requestAlternativeRoutesMutation = useMutation({
    mutationFn: async (shipmentId: string) => {
      const response = await fetch(`/api/supply-chain/shipments/${shipmentId}/alternative-routes`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to request alternative routes');
      return response.json();
    },
  });

  // Mock data for demonstration
  const mockShipments: Shipment[] = [
    {
      id: 'shipment-1',
      trackingNumber: 'SEN-2024-001234',
      status: 'in_transit',
      priority: 'high',
      origin: {
        name: 'Tokyo Manufacturing',
        address: 'Tokyo, Japan',
        coordinates: { lat: 35.6762, lng: 139.6503 }
      },
      destination: {
        name: 'London Distribution',
        address: 'London, UK',
        coordinates: { lat: 51.5074, lng: -0.1278 }
      },
      carrier: {
        name: 'Global Express',
        service: 'Priority Air',
        trackingUrl: 'https://track.globalexpress.com/SEN-2024-001234'
      },
      cargo: {
        description: 'Electronic Components - Batch A',
        weight: 245.5,
        dimensions: { length: 120, width: 80, height: 60 },
        value: 45000,
        category: 'Electronics'
      },
      timeline: {
        created: '2024-01-15T08:00:00Z',
        shipped: '2024-01-15T14:30:00Z',
        estimatedDelivery: '2024-01-18T10:00:00Z',
      },
      currentLocation: {
        name: 'Frankfurt Hub',
        coordinates: { lat: 50.1109, lng: 8.6821 },
        timestamp: '2024-01-17T06:30:00Z'
      },
      delayProbability: 15,
      alternativeRoutes: [
        {
          id: 'alt-1',
          description: 'Route via Amsterdam Hub',
          estimatedDelivery: '2024-01-18T14:00:00Z',
          additionalCost: 200,
          riskLevel: 'low'
        }
      ],
      events: [
        {
          id: 'event-1',
          timestamp: '2024-01-15T08:00:00Z',
          location: {
            name: 'Tokyo Manufacturing',
            coordinates: { lat: 35.6762, lng: 139.6503 },
            address: 'Tokyo, Japan',
            type: 'origin'
          },
          status: 'departed',
          description: 'Package picked up and departed from origin',
          carrier: 'Global Express'
        },
        {
          id: 'event-2',
          timestamp: '2024-01-16T02:15:00Z',
          location: {
            name: 'Narita Airport',
            coordinates: { lat: 35.7720, lng: 140.3929 },
            address: 'Narita, Japan',
            type: 'hub'
          },
          status: 'in_transit',
          description: 'In transit to international hub',
          carrier: 'Global Express'
        },
        {
          id: 'event-3',
          timestamp: '2024-01-17T06:30:00Z',
          location: {
            name: 'Frankfurt Hub',
            coordinates: { lat: 50.1109, lng: 8.6821 },
            address: 'Frankfurt, Germany',
            type: 'hub'
          },
          status: 'arrived',
          description: 'Arrived at European distribution hub',
          carrier: 'Global Express',
          estimatedArrival: '2024-01-18T10:00:00Z'
        }
      ],
      documents: [
        { type: 'invoice', name: 'Commercial Invoice', url: '/documents/inv-001234.pdf' },
        { type: 'packing_list', name: 'Packing List', url: '/documents/pack-001234.pdf' },
        { type: 'certificate', name: 'Certificate of Origin', url: '/documents/cert-001234.pdf' }
      ],
      notifications: [
        {
          type: 'delay',
          message: 'Potential 2-hour delay due to weather conditions',
          timestamp: '2024-01-17T06:30:00Z',
          acknowledged: false
        }
      ]
    },
    {
      id: 'shipment-2',
      trackingNumber: 'SEN-2024-001235',
      status: 'delivered',
      priority: 'medium',
      origin: {
        name: 'Berlin Supplier',
        address: 'Berlin, Germany',
        coordinates: { lat: 52.5200, lng: 13.4050 }
      },
      destination: {
        name: 'London Manufacturing',
        address: 'London, UK',
        coordinates: { lat: 51.5074, lng: -0.1278 }
      },
      carrier: {
        name: 'Euro Logistics',
        service: 'Ground Express',
        trackingUrl: 'https://track.eurologistics.com/SEN-2024-001235'
      },
      cargo: {
        description: 'Raw Materials - Steel Components',
        weight: 1250,
        dimensions: { length: 200, width: 120, height: 80 },
        value: 15000,
        category: 'Raw Materials'
      },
      timeline: {
        created: '2024-01-12T10:00:00Z',
        shipped: '2024-01-12T16:00:00Z',
        estimatedDelivery: '2024-01-14T12:00:00Z',
        actualDelivery: '2024-01-14T11:30:00Z'
      },
      delayProbability: 5,
      events: [
        {
          id: 'event-4',
          timestamp: '2024-01-12T16:00:00Z',
          location: {
            name: 'Berlin Supplier',
            coordinates: { lat: 52.5200, lng: 13.4050 },
            address: 'Berlin, Germany',
            type: 'origin'
          },
          status: 'departed',
          description: 'Package picked up and departed',
          carrier: 'Euro Logistics'
        },
        {
          id: 'event-5',
          timestamp: '2024-01-14T11:30:00Z',
          location: {
            name: 'London Manufacturing',
            coordinates: { lat: 51.5074, lng: -0.1278 },
            address: 'London, UK',
            type: 'destination'
          },
          status: 'delivered',
          description: 'Package delivered successfully',
          carrier: 'Euro Logistics'
        }
      ],
      documents: [
        { type: 'invoice', name: 'Commercial Invoice', url: '/documents/inv-001235.pdf' },
        { type: 'packing_list', name: 'Packing List', url: '/documents/pack-001235.pdf' }
      ],
      notifications: []
    }
  ];

  const mockCarrierPerformance: CarrierPerformance[] = [
    {
      carrierId: 'global-express',
      carrierName: 'Global Express',
      onTimeRate: 94.2,
      averageDelay: 0.8,
      totalShipments: 1247,
      activeShipments: 156,
      costPerShipment: 285,
      customerRating: 4.7,
      coverageArea: ['Global']
    },
    {
      carrierId: 'euro-logistics',
      carrierName: 'Euro Logistics',
      onTimeRate: 91.5,
      averageDelay: 1.2,
      totalShipments: 892,
      activeShipments: 89,
      costPerShipment: 195,
      customerRating: 4.4,
      coverageArea: ['Europe', 'UK']
    },
    {
      carrierId: 'asia-freight',
      carrierName: 'Asia Freight Services',
      onTimeRate: 87.3,
      averageDelay: 2.1,
      totalShipments: 634,
      activeShipments: 67,
      costPerShipment: 320,
      customerRating: 4.1,
      coverageArea: ['Asia Pacific']
    }
  ];

  const filteredShipments = useMemo(() => {
    let filtered = mockShipments;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(shipment => shipment.status === statusFilter);
    }
    
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(shipment => shipment.priority === priorityFilter);
    }
    
    if (carrierFilter !== 'all') {
      filtered = filtered.filter(shipment => shipment.carrier.name === carrierFilter);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(shipment => 
        shipment.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shipment.cargo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shipment.origin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shipment.destination.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [statusFilter, priorityFilter, carrierFilter, searchQuery]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-50 border-green-200';
      case 'in_transit': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'delayed': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'exception': return 'text-red-600 bg-red-50 border-red-200';
      case 'cancelled': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }, []);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  }, []);

  const calculateProgress = useCallback((shipment: Shipment) => {
    const now = new Date().getTime();
    const shipped = new Date(shipment.timeline.shipped).getTime();
    const estimated = new Date(shipment.timeline.estimatedDelivery).getTime();
    
    if (shipment.status === 'delivered') return 100;
    if (now < shipped) return 0;
    
    const progress = ((now - shipped) / (estimated - shipped)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }, []);

  const requestAlternativeRoutes = useCallback((shipmentId: string) => {
    requestAlternativeRoutesMutation.mutate(shipmentId);
  }, [requestAlternativeRoutesMutation]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shipment Tracking System</h2>
          <p className="text-sm text-gray-600">Real-time shipment visibility with predictive analytics</p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMap(!showMap)}
          >
            <GlobeAltIcon className="h-4 w-4 mr-2" />
            {showMap ? 'Hide Map' : 'Show Map'}
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

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {mockShipments.filter(s => s.status === 'in_transit').length}
              </div>
              <div className="text-sm text-gray-600">In Transit</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {mockShipments.filter(s => s.status === 'delivered').length}
              </div>
              <div className="text-sm text-gray-600">Delivered</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {mockShipments.filter(s => s.status === 'delayed').length}
              </div>
              <div className="text-sm text-gray-600">Delayed</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {mockShipments.filter(s => s.status === 'exception').length}
              </div>
              <div className="text-sm text-gray-600">Exceptions</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {mockShipments.filter(s => s.priority === 'critical' || s.priority === 'high').length}
              </div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(mockShipments.reduce((sum, s) => sum + s.delayProbability, 0) / mockShipments.length)}%
              </div>
              <div className="text-sm text-gray-600">Avg Delay Risk</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border">
        <div className="flex-1">
          <Input
            placeholder="Search by tracking number, description, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="delayed">Delayed</SelectItem>
            <SelectItem value="exception">Exception</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as any)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={carrierFilter} onValueChange={setCarrierFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Carriers</SelectItem>
            {mockCarrierPerformance.map(carrier => (
              <SelectItem key={carrier.carrierId} value={carrier.carrierName}>
                {carrier.carrierName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="shipments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="shipments">Active Shipments</TabsTrigger>
          <TabsTrigger value="tracking">Detailed Tracking</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="carriers">Carrier Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="shipments" className="space-y-4">
          {/* Shipment List */}
          <div className="space-y-4">
            {filteredShipments.map(shipment => (
              <Card key={shipment.id} className="relative">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <TruckIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{shipment.trackingNumber}</h3>
                          <Badge className={getStatusColor(shipment.status)}>
                            {shipment.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={cn('text-xs', getPriorityColor(shipment.priority))}>
                            {shipment.priority} priority
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{shipment.cargo.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{shipment.origin.name} → {shipment.destination.name}</span>
                          <span>•</span>
                          <span>{shipment.carrier.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">
                        ETA: {new Date(shipment.timeline.estimatedDelivery).toLocaleDateString()}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={calculateProgress(shipment)} className="w-24 h-2" />
                        <span className="text-sm font-medium">{Math.round(calculateProgress(shipment))}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Current Status */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPinIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Current Location:</span>
                      <span className="text-sm">
                        {shipment.currentLocation?.name || 'Location updating...'}
                      </span>
                    </div>
                    
                    {shipment.delayProbability > 20 && (
                      <div className="flex items-center space-x-2 text-orange-600">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        <span className="text-sm">
                          {shipment.delayProbability}% delay probability
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notifications */}
                  {shipment.notifications.filter(n => !n.acknowledged).length > 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <BellIcon className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div>
                          {shipment.notifications.filter(n => !n.acknowledged).map((notification, index) => (
                            <div key={index} className="text-sm text-yellow-800">
                              {notification.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedShipment(selectedShipment === shipment.id ? null : shipment.id)}
                      >
                        {selectedShipment === shipment.id ? 'Hide Details' : 'View Details'}
                      </Button>
                      
                      {shipment.alternativeRoutes && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => requestAlternativeRoutes(shipment.id)}
                        >
                          Alternative Routes
                        </Button>
                      )}
                      
                      <Button size="sm" variant="ghost">
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        Contact Carrier
                      </Button>
                    </div>

                    <div className="text-sm text-gray-500">
                      Value: £{shipment.cargo.value.toLocaleString()}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedShipment === shipment.id && (
                    <div className="mt-6 pt-6 border-t space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Tracking Events */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Tracking Events</h4>
                          <div className="space-y-3">
                            {shipment.events.map((event, index) => (
                              <div key={event.id} className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  <div className={cn(
                                    'w-3 h-3 rounded-full',
                                    event.status === 'delivered' ? 'bg-green-500' :
                                    event.status === 'departed' ? 'bg-blue-500' :
                                    event.status === 'arrived' ? 'bg-yellow-500' : 'bg-gray-400'
                                  )} />
                                  {index < shipment.events.length - 1 && (
                                    <div className="w-0.5 h-8 bg-gray-200 ml-1 mt-1" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{event.description}</div>
                                  <div className="text-xs text-gray-500">
                                    {event.location.name} • {new Date(event.timestamp).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Cargo Details */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Cargo Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Weight:</span>
                              <span>{shipment.cargo.weight} kg</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Dimensions:</span>
                              <span>{shipment.cargo.dimensions.length}×{shipment.cargo.dimensions.width}×{shipment.cargo.dimensions.height} cm</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Category:</span>
                              <span>{shipment.cargo.category}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Declared Value:</span>
                              <span>£{shipment.cargo.value.toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Documents */}
                          <h4 className="font-medium text-gray-900 mb-3 mt-6">Documents</h4>
                          <div className="space-y-2">
                            {shipment.documents.map((doc, index) => (
                              <div key={index} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center space-x-2">
                                  <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm">{doc.name}</span>
                                </div>
                                <Button size="sm" variant="ghost">
                                  View
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          {/* Real-time tracking interface would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Real-time Tracking Map</CardTitle>
              <CardDescription>Live shipment locations with route visualization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <GlobeAltIcon className="h-16 w-16 mx-auto mb-4" />
                  <p>Interactive tracking map would be displayed here</p>
                  <p className="text-sm">Integrated with carrier APIs for real-time updates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Shipment Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { month: 'Jan', onTime: 94, delayed: 6, exceptions: 2 },
                      { month: 'Feb', onTime: 92, delayed: 7, exceptions: 1 },
                      { month: 'Mar', onTime: 96, delayed: 4, exceptions: 1 },
                      { month: 'Apr', onTime: 91, delayed: 8, exceptions: 3 },
                      { month: 'May', onTime: 95, delayed: 5, exceptions: 2 },
                      { month: 'Jun', onTime: 93, delayed: 6, exceptions: 1 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="onTime" stroke="#10B981" name="On Time %" />
                      <Line type="monotone" dataKey="delayed" stroke="#F59E0B" name="Delayed %" />
                      <Line type="monotone" dataKey="exceptions" stroke="#EF4444" name="Exceptions %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delay Probability Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { probability: '0-10%', count: 45 },
                      { probability: '10-20%', count: 32 },
                      { probability: '20-30%', count: 18 },
                      { probability: '30-40%', count: 12 },
                      { probability: '40%+', count: 8 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="probability" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="carriers" className="space-y-6">
          {/* Carrier Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {mockCarrierPerformance.map(carrier => (
              <Card key={carrier.carrierId}>
                <CardHeader>
                  <CardTitle className="text-lg">{carrier.carrierName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">On-Time Rate:</span>
                      <div className="font-medium text-green-600">{carrier.onTimeRate}%</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg Delay:</span>
                      <div className="font-medium">{carrier.averageDelay} days</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Active:</span>
                      <div className="font-medium">{carrier.activeShipments}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Total:</span>
                      <div className="font-medium">{carrier.totalShipments}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Cost/Shipment:</span>
                      <div className="font-medium">£{carrier.costPerShipment}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Rating:</span>
                      <div className="font-medium">{carrier.customerRating}/5.0</div>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-600">Coverage:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {carrier.coverageArea.map((area, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}