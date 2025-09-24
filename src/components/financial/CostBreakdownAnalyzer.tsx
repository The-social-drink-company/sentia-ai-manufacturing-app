import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  LightBulbIcon,
  ArrowRightIcon,
  ScaleIcon,
  TruckIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, TreemapChart, ComposedChart, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Treemap } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ProductCost {
  productId: string;
  productName: string;
  category: string;
  directCosts: {
    materials: number;
    labor: number;
    components: number;
    total: number;
  };
  indirectCosts: {
    overhead: number;
    utilities: number;
    depreciation: number;
    maintenance: number;
    total: number;
  };
  landedCosts: {
    shipping: number;
    duties: number;
    insurance: number;
    handling: number;
    storage: number;
    total: number;
  };
  hiddenCosts: Array<{
    category: string;
    description: string;
    amount: number;
    frequency: 'one-time' | 'monthly' | 'quarterly' | 'annual';
    visibility: 'high' | 'medium' | 'low';
  }>;
  activityBasedCosts: {
    procurement: number;
    production: number;
    qualityControl: number;
    packaging: number;
    distribution: number;
    customerService: number;
    total: number;
  };
  totalCost: number;
  unitCost: number;
  sellingPrice: number;
  margin: number;
  marginPercentage: number;
  volume: number;
  revenue: number;
}

interface MarketAnalysis {
  market: string;
  region: string;
  products: Array<{
    productId: string;
    productName: string;
    volume: number;
    revenue: number;
    totalCost: number;
    margin: number;
    marginPercentage: number;
  }>;
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  averageMarginPercentage: number;
  marketShare: number;
  competitivePosition: 'leader' | 'challenger' | 'follower' | 'niche';
  growthRate: number;
}

interface CostReductionOpportunity {
  id: string;
  category: string;
  opportunity: string;
  description: string;
  currentCost: number;
  potentialSaving: number;
  savingPercentage: number;
  implementationCost: number;
  netSaving: number;
  timeframe: string;
  effort: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  impact: 'high' | 'medium' | 'low';
  status: 'identified' | 'planned' | 'in_progress' | 'completed';
  affectedProducts: string[];
  dependencies: string[];
  kpis: Array<{
    metric: string;
    currentValue: number;
    targetValue: number;
    improvement: number;
  }>;
}

interface ActivityCostDriver {
  activity: string;
  costDriver: string;
  unitRate: number;
  totalUnits: number;
  totalCost: number;
  allocation: Array<{
    productId: string;
    productName: string;
    units: number;
    allocatedCost: number;
    percentage: number;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280', '#EC4899', '#14B8A6'];

export const CostBreakdownAnalyzer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'landed_costs' | 'hidden_costs' | 'abc_costing' | 'market_analysis' | 'reduction_opportunities'>('overview');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedMarket, setSelectedMarket] = useState<string>('');
  const [costView, setCostView] = useState<'absolute' | 'percentage' | 'per_unit'>('absolute');
  const [showHiddenCosts, setShowHiddenCosts] = useState(false);
  const [analysisLevel, setAnalysisLevel] = useState<'product' | 'category' | 'market'>('product');

  // Fetch cost breakdown data
  const { data: costData, isLoading } = useQuery({
    queryKey: ['cost-breakdown-analysis', selectedProduct, selectedMarket],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const products: ProductCost[] = [
        {
          productId: 'prod_001',
          productName: 'Manufacturing Controller Unit',
          category: 'Industrial Controls',
          directCosts: {
            materials: 145.50,
            labor: 87.25,
            components: 198.75,
            total: 431.50
          },
          indirectCosts: {
            overhead: 65.20,
            utilities: 12.30,
            depreciation: 18.90,
            maintenance: 8.45,
            total: 104.85
          },
          landedCosts: {
            shipping: 18.50,
            duties: 12.25,
            insurance: 4.80,
            handling: 7.20,
            storage: 5.60,
            total: 48.35
          },
          hiddenCosts: [
            {
              category: 'Quality Issues',
              description: 'Rework and defect handling',
              amount: 23.40,
              frequency: 'monthly',
              visibility: 'low'
            },
            {
              category: 'Regulatory Compliance',
              description: 'Certification and testing costs',
              amount: 45.80,
              frequency: 'annual',
              visibility: 'medium'
            },
            {
              category: 'Supplier Management',
              description: 'Vendor audits and relationship management',
              amount: 12.60,
              frequency: 'quarterly',
              visibility: 'low'
            }
          ],
          activityBasedCosts: {
            procurement: 28.50,
            production: 245.80,
            qualityControl: 34.20,
            packaging: 15.60,
            distribution: 22.40,
            customerService: 18.30,
            total: 364.80
          },
          totalCost: 584.70,
          unitCost: 584.70,
          sellingPrice: 850.00,
          margin: 265.30,
          marginPercentage: 31.21,
          volume: 2450,
          revenue: 2082500
        },
        {
          productId: 'prod_002',
          productName: 'Precision Sensor Array',
          category: 'Sensors',
          directCosts: {
            materials: 89.20,
            labor: 45.60,
            components: 156.40,
            total: 291.20
          },
          indirectCosts: {
            overhead: 42.30,
            utilities: 8.90,
            depreciation: 12.50,
            maintenance: 5.70,
            total: 69.40
          },
          landedCosts: {
            shipping: 14.20,
            duties: 8.90,
            insurance: 3.40,
            handling: 5.80,
            storage: 4.20,
            total: 36.50
          },
          hiddenCosts: [
            {
              category: 'Technology Obsolescence',
              description: 'R&D for technology updates',
              amount: 18.70,
              frequency: 'annual',
              visibility: 'medium'
            },
            {
              category: 'Calibration Costs',
              description: 'Precision equipment calibration',
              amount: 15.80,
              frequency: 'quarterly',
              visibility: 'high'
            }
          ],
          activityBasedCosts: {
            procurement: 22.40,
            production: 189.60,
            qualityControl: 45.80,
            packaging: 12.30,
            distribution: 18.70,
            customerService: 14.20,
            total: 303.00
          },
          totalCost: 397.10,
          unitCost: 397.10,
          sellingPrice: 580.00,
          margin: 182.90,
          marginPercentage: 31.53,
          volume: 3200,
          revenue: 1856000
        },
        {
          productId: 'prod_003',
          productName: 'Automated Assembly Module',
          category: 'Automation',
          directCosts: {
            materials: 234.80,
            labor: 156.30,
            components: 445.60,
            total: 836.70
          },
          indirectCosts: {
            overhead: 125.40,
            utilities: 23.60,
            depreciation: 34.20,
            maintenance: 18.90,
            total: 202.10
          },
          landedCosts: {
            shipping: 32.40,
            duties: 24.80,
            insurance: 8.90,
            handling: 14.20,
            storage: 10.60,
            total: 90.90
          },
          hiddenCosts: [
            {
              category: 'Integration Costs',
              description: 'Customer integration support',
              amount: 67.50,
              frequency: 'monthly',
              visibility: 'low'
            },
            {
              category: 'Training Costs',
              description: 'Customer training and documentation',
              amount: 34.20,
              frequency: 'quarterly',
              visibility: 'medium'
            }
          ],
          activityBasedCosts: {
            procurement: 45.80,
            production: 456.20,
            qualityControl: 78.90,
            packaging: 23.40,
            distribution: 34.60,
            customerService: 45.20,
            total: 684.10
          },
          totalCost: 1129.70,
          unitCost: 1129.70,
          sellingPrice: 1650.00,
          margin: 520.30,
          marginPercentage: 31.53,
          volume: 1850,
          revenue: 3052500
        }
      ];

      const markets: MarketAnalysis[] = [
        {
          market: 'North America',
          region: 'Americas',
          products: [
            {
              productId: 'prod_001',
              productName: 'Manufacturing Controller Unit',
              volume: 1200,
              revenue: 1020000,
              totalCost: 701640,
              margin: 318360,
              marginPercentage: 31.21
            },
            {
              productId: 'prod_002',
              productName: 'Precision Sensor Array',
              volume: 1800,
              revenue: 1044000,
              totalCost: 714780,
              margin: 329220,
              marginPercentage: 31.53
            }
          ],
          totalRevenue: 2064000,
          totalCost: 1416420,
          totalMargin: 647580,
          averageMarginPercentage: 31.37,
          marketShare: 18.5,
          competitivePosition: 'challenger',
          growthRate: 12.3
        },
        {
          market: 'Europe',
          region: 'EMEA',
          products: [
            {
              productId: 'prod_001',
              productName: 'Manufacturing Controller Unit',
              volume: 850,
              revenue: 722500,
              totalCost: 496995,
              margin: 225505,
              marginPercentage: 31.21
            },
            {
              productId: 'prod_003',
              productName: 'Automated Assembly Module',
              volume: 1200,
              revenue: 1980000,
              totalCost: 1355640,
              margin: 624360,
              marginPercentage: 31.53
            }
          ],
          totalRevenue: 2702500,
          totalCost: 1852635,
          totalMargin: 849865,
          averageMarginPercentage: 31.44,
          marketShare: 22.1,
          competitivePosition: 'leader',
          growthRate: 8.7
        },
        {
          market: 'Asia Pacific',
          region: 'APAC',
          products: [
            {
              productId: 'prod_002',
              productName: 'Precision Sensor Array',
              volume: 1400,
              revenue: 812000,
              totalCost: 555940,
              margin: 256060,
              marginPercentage: 31.53
            },
            {
              productId: 'prod_003',
              productName: 'Automated Assembly Module',
              volume: 650,
              revenue: 1072500,
              totalCost: 734305,
              margin: 338195,
              marginPercentage: 31.53
            }
          ],
          totalRevenue: 1884500,
          totalCost: 1290245,
          totalMargin: 594255,
          averageMarginPercentage: 31.53,
          marketShare: 14.2,
          competitivePosition: 'follower',
          growthRate: 16.8
        }
      ];

      const costReductionOpportunities: CostReductionOpportunity[] = [
        {
          id: 'opp_001',
          category: 'Materials',
          opportunity: 'Supplier Consolidation',
          description: 'Consolidate suppliers to negotiate better rates and reduce procurement overhead',
          currentCost: 875000,
          potentialSaving: 87500,
          savingPercentage: 10,
          implementationCost: 25000,
          netSaving: 62500,
          timeframe: '6 months',
          effort: 'medium',
          riskLevel: 'low',
          impact: 'high',
          status: 'planned',
          affectedProducts: ['prod_001', 'prod_002', 'prod_003'],
          dependencies: ['Legal approval', 'Quality validation'],
          kpis: [
            { metric: 'Material Cost per Unit', currentValue: 145.5, targetValue: 130.95, improvement: 10 },
            { metric: 'Supplier Count', currentValue: 24, targetValue: 18, improvement: 25 },
            { metric: 'Procurement Overhead', currentValue: 45000, targetValue: 36000, improvement: 20 }
          ]
        },
        {
          id: 'opp_002',
          category: 'Labor',
          opportunity: 'Process Automation',
          description: 'Automate repetitive assembly processes to reduce labor costs',
          currentCost: 650000,
          potentialSaving: 195000,
          savingPercentage: 30,
          implementationCost: 120000,
          netSaving: 75000,
          timeframe: '12 months',
          effort: 'high',
          riskLevel: 'medium',
          impact: 'high',
          status: 'identified',
          affectedProducts: ['prod_001', 'prod_003'],
          dependencies: ['Capital approval', 'Training program', 'Layout redesign'],
          kpis: [
            { metric: 'Labor Hours per Unit', currentValue: 2.8, targetValue: 1.96, improvement: 30 },
            { metric: 'Production Efficiency', currentValue: 75, targetValue: 88, improvement: 17 },
            { metric: 'Quality Score', currentValue: 94, targetValue: 97, improvement: 3 }
          ]
        },
        {
          id: 'opp_003',
          category: 'Overhead',
          opportunity: 'Facility Optimization',
          description: 'Optimize facility layout and reduce overhead allocation',
          currentCost: 420000,
          potentialSaving: 63000,
          savingPercentage: 15,
          implementationCost: 18000,
          netSaving: 45000,
          timeframe: '3 months',
          effort: 'low',
          riskLevel: 'low',
          impact: 'medium',
          status: 'in_progress',
          affectedProducts: ['prod_001', 'prod_002', 'prod_003'],
          dependencies: ['Facility management approval'],
          kpis: [
            { metric: 'Cost per Square Foot', currentValue: 28, targetValue: 23.8, improvement: 15 },
            { metric: 'Space Utilization', currentValue: 68, targetValue: 85, improvement: 25 },
            { metric: 'Overhead Rate', currentValue: 18.5, targetValue: 15.7, improvement: 15 }
          ]
        },
        {
          id: 'opp_004',
          category: 'Logistics',
          opportunity: 'Shipping Optimization',
          description: 'Optimize shipping routes and consolidate shipments',
          currentCost: 180000,
          potentialSaving: 36000,
          savingPercentage: 20,
          implementationCost: 8000,
          netSaving: 28000,
          timeframe: '2 months',
          effort: 'low',
          riskLevel: 'low',
          impact: 'medium',
          status: 'completed',
          affectedProducts: ['prod_001', 'prod_002', 'prod_003'],
          dependencies: ['Logistics partner agreement'],
          kpis: [
            { metric: 'Shipping Cost per Unit', currentValue: 18.5, targetValue: 14.8, improvement: 20 },
            { metric: 'Delivery Time', currentValue: 5.2, targetValue: 4.8, improvement: 8 },
            { metric: 'Shipment Consolidation Rate', currentValue: 45, targetValue: 70, improvement: 56 }
          ]
        }
      ];

      const activityDrivers: ActivityCostDriver[] = [
        {
          activity: 'Procurement',
          costDriver: 'Purchase Orders',
          unitRate: 45.00,
          totalUnits: 2140,
          totalCost: 96300,
          allocation: [
            { productId: 'prod_001', productName: 'Manufacturing Controller Unit', units: 650, allocatedCost: 29250, percentage: 30.4 },
            { productId: 'prod_002', productName: 'Precision Sensor Array', units: 720, allocatedCost: 32400, percentage: 33.6 },
            { productId: 'prod_003', productName: 'Automated Assembly Module', units: 770, allocatedCost: 34650, percentage: 36.0 }
          ]
        },
        {
          activity: 'Quality Control',
          costDriver: 'Inspection Hours',
          unitRate: 85.00,
          totalUnits: 1850,
          totalCost: 157250,
          allocation: [
            { productId: 'prod_001', productName: 'Manufacturing Controller Unit', units: 420, allocatedCost: 35700, percentage: 22.7 },
            { productId: 'prod_002', productName: 'Precision Sensor Array', units: 680, allocatedCost: 57800, percentage: 36.8 },
            { productId: 'prod_003', productName: 'Automated Assembly Module', units: 750, allocatedCost: 63750, percentage: 40.5 }
          ]
        },
        {
          activity: 'Customer Service',
          costDriver: 'Service Requests',
          unitRate: 120.00,
          totalUnits: 650,
          totalCost: 78000,
          allocation: [
            { productId: 'prod_001', productName: 'Manufacturing Controller Unit', units: 180, allocatedCost: 21600, percentage: 27.7 },
            { productId: 'prod_002', productName: 'Precision Sensor Array', units: 220, allocatedCost: 26400, percentage: 33.8 },
            { productId: 'prod_003', productName: 'Automated Assembly Module', units: 250, allocatedCost: 30000, percentage: 38.5 }
          ]
        }
      ];

      return {
        products,
        markets,
        costReductionOpportunities,
        activityDrivers,
        summary: {
          totalRevenue: products.reduce((sum, p) => sum + p.revenue, 0),
          totalCost: products.reduce((sum, p) => sum + p.totalCost * p.volume, 0),
          totalMargin: products.reduce((sum, p) => sum + p.margin * p.volume, 0),
          averageMarginPercentage: products.reduce((sum, p) => sum + p.marginPercentage, 0) / products.length,
          totalVolume: products.reduce((sum, p) => sum + p.volume, 0),
          costReductionPotential: costReductionOpportunities.reduce((sum, o) => sum + o.netSaving, 0)
        }
      };
    }
  });

  const formatCurrency = useCallback((amount: number, compact = false) => {
    if (compact && Math.abs(amount) >= 1000000) {
      return `£${(amount / 1000000).toFixed(1)}M`;
    } else if (compact && Math.abs(amount) >= 1000) {
      return `£${(amount / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  const formatPercentage = useCallback((value: number) => {
    return `${value.toFixed(1)}%`;
  }, []);

  const getMarginColor = useCallback((margin: number) => {
    if (margin >= 30) return 'text-green-600';
    if (margin >= 20) return 'text-blue-600';
    if (margin >= 10) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  const getImpactColor = useCallback((impact: string) => {
    switch (impact) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  }, []);

  const renderCostOverview = () => {
    if (!costData) return null;

    const selectedProductData = costData.products.find(p => p.productId === selectedProduct) || costData.products[0];
    
    // Aggregate cost breakdown across all products
    const aggregatedCosts = costData.products.reduce((acc, product) => {
      acc.directCosts += product.directCosts.total * product.volume;
      acc.indirectCosts += product.indirectCosts.total * product.volume;
      acc.landedCosts += product.landedCosts.total * product.volume;
      acc.hiddenCosts += product.hiddenCosts.reduce((sum, cost) => {
        const annualAmount = cost.frequency === 'monthly' ? cost.amount * 12 :
                           cost.frequency === 'quarterly' ? cost.amount * 4 :
                           cost.frequency === 'annual' ? cost.amount : cost.amount;
        return sum + annualAmount;
      }, 0) * product.volume;
      return acc;
    }, { directCosts: 0, indirectCosts: 0, landedCosts: 0, hiddenCosts: 0 });

    const totalCosts = Object.values(aggregatedCosts).reduce((sum, cost) => sum + cost, 0);

    const costBreakdownData = [
      { name: 'Direct Costs', value: aggregatedCosts.directCosts, percentage: (aggregatedCosts.directCosts / totalCosts) * 100 },
      { name: 'Indirect Costs', value: aggregatedCosts.indirectCosts, percentage: (aggregatedCosts.indirectCosts / totalCosts) * 100 },
      { name: 'Landed Costs', value: aggregatedCosts.landedCosts, percentage: (aggregatedCosts.landedCosts / totalCosts) * 100 },
      { name: 'Hidden Costs', value: aggregatedCosts.hiddenCosts, percentage: (aggregatedCosts.hiddenCosts / totalCosts) * 100 }
    ];

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(costData.summary.totalRevenue, true)}
              </div>
              <div className="text-xs text-gray-600">
                {costData.summary.totalVolume.toLocaleString()} units
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(costData.summary.totalCost, true)}
              </div>
              <div className="text-xs text-gray-600">
                {formatPercentage((costData.summary.totalCost / costData.summary.totalRevenue) * 100)} of revenue
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Margin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", getMarginColor(costData.summary.averageMarginPercentage))}>
                {formatCurrency(costData.summary.totalMargin, true)}
              </div>
              <div className="text-xs text-gray-600">
                {formatPercentage(costData.summary.averageMarginPercentage)} average
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cost Reduction Potential</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(costData.summary.costReductionPotential, true)}
              </div>
              <div className="text-xs text-gray-600">
                Net annual savings
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost Breakdown Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost Structure Breakdown</CardTitle>
              <CardDescription>Aggregated cost categories across all products</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {costBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Cost']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Margin Analysis</CardTitle>
              <CardDescription>Margin comparison across product portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costData.products}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="productName" angle={-45} textAnchor="end" height={80} />
                  <YAxis tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Margin %']} />
                  <Bar dataKey="marginPercentage" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Product Details Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product Cost Analysis</CardTitle>
                <CardDescription>Detailed cost breakdown by product</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Select value={costView} onValueChange={(value) => setCostView(value as any)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="absolute">Absolute</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="per_unit">Per Unit</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHiddenCosts(!showHiddenCosts)}
                >
                  {showHiddenCosts ? <EyeSlashIcon className="h-4 w-4 mr-2" /> : <EyeIcon className="h-4 w-4 mr-2" />}
                  Hidden Costs
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Product</th>
                    <th className="text-right py-3">Direct</th>
                    <th className="text-right py-3">Indirect</th>
                    <th className="text-right py-3">Landed</th>
                    {showHiddenCosts && <th className="text-right py-3">Hidden</th>}
                    <th className="text-right py-3">Total Cost</th>
                    <th className="text-right py-3">Revenue</th>
                    <th className="text-right py-3">Margin</th>
                    <th className="text-right py-3">Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {costData.products.map((product) => {
                    const hiddenCostTotal = product.hiddenCosts.reduce((sum, cost) => {
                      const annualAmount = cost.frequency === 'monthly' ? cost.amount * 12 :
                                         cost.frequency === 'quarterly' ? cost.amount * 4 :
                                         cost.frequency === 'annual' ? cost.amount : cost.amount;
                      return sum + annualAmount;
                    }, 0);

                    return (
                      <tr key={product.productId} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          <div className="font-medium">{product.productName}</div>
                          <div className="text-xs text-gray-600">{product.category}</div>
                        </td>
                        <td className="py-3 text-right">
                          {costView === 'absolute' && formatCurrency(product.directCosts.total * product.volume)}
                          {costView === 'percentage' && formatPercentage((product.directCosts.total / product.totalCost) * 100)}
                          {costView === 'per_unit' && formatCurrency(product.directCosts.total)}
                        </td>
                        <td className="py-3 text-right">
                          {costView === 'absolute' && formatCurrency(product.indirectCosts.total * product.volume)}
                          {costView === 'percentage' && formatPercentage((product.indirectCosts.total / product.totalCost) * 100)}
                          {costView === 'per_unit' && formatCurrency(product.indirectCosts.total)}
                        </td>
                        <td className="py-3 text-right">
                          {costView === 'absolute' && formatCurrency(product.landedCosts.total * product.volume)}
                          {costView === 'percentage' && formatPercentage((product.landedCosts.total / product.totalCost) * 100)}
                          {costView === 'per_unit' && formatCurrency(product.landedCosts.total)}
                        </td>
                        {showHiddenCosts && (
                          <td className="py-3 text-right text-red-600">
                            {costView === 'absolute' && formatCurrency(hiddenCostTotal * product.volume)}
                            {costView === 'percentage' && formatPercentage((hiddenCostTotal / (product.totalCost + hiddenCostTotal)) * 100)}
                            {costView === 'per_unit' && formatCurrency(hiddenCostTotal)}
                          </td>
                        )}
                        <td className="py-3 text-right font-medium">
                          {costView === 'absolute' && formatCurrency(product.totalCost * product.volume)}
                          {costView === 'percentage' && '100.0%'}
                          {costView === 'per_unit' && formatCurrency(product.totalCost)}
                        </td>
                        <td className="py-3 text-right font-medium text-blue-600">
                          {formatCurrency(product.revenue)}
                        </td>
                        <td className="py-3 text-right font-medium text-green-600">
                          {formatCurrency(product.margin * product.volume)}
                        </td>
                        <td className={cn("py-3 text-right font-bold", getMarginColor(product.marginPercentage))}>
                          {formatPercentage(product.marginPercentage)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderLandedCostAnalysis = () => {
    if (!costData) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Landed Cost Breakdown</CardTitle>
            <CardDescription>Comprehensive analysis of all costs to deliver products to customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {costData.products.map((product) => (
                <div key={product.productId} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium">{product.productName}</h4>
                      <div className="text-sm text-gray-600">{product.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {formatCurrency(product.totalCost)}
                      </div>
                      <div className="text-sm text-gray-600">Total Landed Cost</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Direct Costs */}
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(product.directCosts.total)}
                      </div>
                      <div className="text-sm text-gray-600">Direct Costs</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatPercentage((product.directCosts.total / product.totalCost) * 100)}
                      </div>
                    </div>

                    {/* Indirect Costs */}
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(product.indirectCosts.total)}
                      </div>
                      <div className="text-sm text-gray-600">Indirect Costs</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatPercentage((product.indirectCosts.total / product.totalCost) * 100)}
                      </div>
                    </div>

                    {/* Logistics Costs */}
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-lg font-bold text-yellow-600">
                        {formatCurrency(product.landedCosts.total)}
                      </div>
                      <div className="text-sm text-gray-600">Logistics</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatPercentage((product.landedCosts.total / product.totalCost) * 100)}
                      </div>
                    </div>

                    {/* Hidden Costs */}
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-lg font-bold text-red-600">
                        {formatCurrency(product.hiddenCosts.reduce((sum, cost) => sum + cost.amount, 0))}
                      </div>
                      <div className="text-sm text-gray-600">Hidden Costs</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {product.hiddenCosts.length} items
                      </div>
                    </div>

                    {/* Margin */}
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className={cn("text-lg font-bold", getMarginColor(product.marginPercentage))}>
                        {formatCurrency(product.margin)}
                      </div>
                      <div className="text-sm text-gray-600">Margin</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatPercentage(product.marginPercentage)}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                      <h5 className="font-medium text-sm mb-2">Direct Costs</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Materials:</span>
                          <span>{formatCurrency(product.directCosts.materials)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Labor:</span>
                          <span>{formatCurrency(product.directCosts.labor)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Components:</span>
                          <span>{formatCurrency(product.directCosts.components)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-sm mb-2">Indirect Costs</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Overhead:</span>
                          <span>{formatCurrency(product.indirectCosts.overhead)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Utilities:</span>
                          <span>{formatCurrency(product.indirectCosts.utilities)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Depreciation:</span>
                          <span>{formatCurrency(product.indirectCosts.depreciation)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Maintenance:</span>
                          <span>{formatCurrency(product.indirectCosts.maintenance)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-sm mb-2">Logistics Costs</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Shipping:</span>
                          <span>{formatCurrency(product.landedCosts.shipping)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duties:</span>
                          <span>{formatCurrency(product.landedCosts.duties)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Insurance:</span>
                          <span>{formatCurrency(product.landedCosts.insurance)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Handling:</span>
                          <span>{formatCurrency(product.landedCosts.handling)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Storage:</span>
                          <span>{formatCurrency(product.landedCosts.storage)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Landed Cost Comparison</CardTitle>
            <CardDescription>Cost structure comparison across products</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart 
                data={costData.products.map(p => ({
                  name: p.productName.substring(0, 15) + '...',
                  direct: p.directCosts.total,
                  indirect: p.indirectCosts.total,
                  logistics: p.landedCosts.total,
                  margin: p.margin,
                  marginPercent: p.marginPercentage
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value: number, name: string) => [
                  name.includes('Percent') ? `${value}%` : formatCurrency(value), 
                  name
                ]} />
                <Legend />
                <Bar yAxisId="left" dataKey="direct" stackId="costs" fill="#3B82F6" name="Direct Costs" />
                <Bar yAxisId="left" dataKey="indirect" stackId="costs" fill="#10B981" name="Indirect Costs" />
                <Bar yAxisId="left" dataKey="logistics" stackId="costs" fill="#F59E0B" name="Logistics Costs" />
                <Line yAxisId="right" type="monotone" dataKey="marginPercent" stroke="#8B5CF6" strokeWidth={2} name="Margin %" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderHiddenCostAnalysis = () => {
    if (!costData) return null;

    const allHiddenCosts = costData.products.flatMap(product => 
      product.hiddenCosts.map(cost => ({
        ...cost,
        productId: product.productId,
        productName: product.productName,
        annualImpact: cost.frequency === 'monthly' ? cost.amount * 12 :
                      cost.frequency === 'quarterly' ? cost.amount * 4 :
                      cost.frequency === 'annual' ? cost.amount : cost.amount
      }))
    ).sort((a, b) => b.annualImpact - a.annualImpact);

    const hiddenCostsByCategory = allHiddenCosts.reduce((acc, cost) => {
      if (!acc[cost.category]) {
        acc[cost.category] = { total: 0, count: 0, costs: [] };
      }
      acc[cost.category].total += cost.annualImpact;
      acc[cost.category].count += 1;
      acc[cost.category].costs.push(cost);
      return acc;
    }, {} as any);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Hidden Cost Analysis</CardTitle>
            <CardDescription>Identification and quantification of often-overlooked costs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(allHiddenCosts.reduce((sum, cost) => sum + cost.annualImpact, 0), true)}
                </div>
                <div className="text-sm text-gray-600">Total Hidden Costs (Annual)</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {allHiddenCosts.length}
                </div>
                <div className="text-sm text-gray-600">Hidden Cost Items</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatPercentage((allHiddenCosts.reduce((sum, cost) => sum + cost.annualImpact, 0) / costData.summary.totalCost) * 100)}
                </div>
                <div className="text-sm text-gray-600">% of Total Costs</div>
              </div>
            </div>

            <div className="space-y-4">
              {allHiddenCosts.map((cost, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{cost.category}</span>
                      <Badge variant="outline" className="text-xs">
                        {cost.productName.substring(0, 20)}...
                      </Badge>
                      <Badge variant={cost.visibility === 'high' ? 'default' : 
                                    cost.visibility === 'medium' ? 'secondary' : 'destructive'}>
                        {cost.visibility} visibility
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{cost.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Frequency: {cost.frequency.replace('_', ' ')}</span>
                      <span>Per occurrence: {formatCurrency(cost.amount)}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency(cost.annualImpact)}
                    </div>
                    <div className="text-xs text-gray-500">Annual Impact</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Hidden Costs by Category</CardTitle>
              <CardDescription>Aggregate hidden costs by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(hiddenCostsByCategory).map(([category, data]: [string, any]) => ({
                      name: category,
                      value: data.total,
                      count: data.count
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${formatCurrency(value, true)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.keys(hiddenCostsByCategory).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Annual Cost']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hidden Cost Visibility Analysis</CardTitle>
              <CardDescription>Distribution by visibility level</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={['high', 'medium', 'low'].map(visibility => ({
                    visibility,
                    count: allHiddenCosts.filter(cost => cost.visibility === visibility).length,
                    totalCost: allHiddenCosts.filter(cost => cost.visibility === visibility)
                      .reduce((sum, cost) => sum + cost.annualImpact, 0)
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="visibility" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatCurrency(value, true)} />
                  <Tooltip formatter={(value: number, name: string) => [
                    name === 'count' ? value : formatCurrency(value), 
                    name === 'count' ? 'Items' : 'Total Cost'
                  ]} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="#8B5CF6" name="Number of Items" />
                  <Line yAxisId="right" type="monotone" dataKey="totalCost" stroke="#EF4444" strokeWidth={2} name="Total Cost" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderActivityBasedCosting = () => {
    if (!costData) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Activity-Based Costing Analysis</CardTitle>
            <CardDescription>Cost allocation based on activity consumption</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {costData.activityDrivers.map((driver) => (
                <div key={driver.activity} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium">{driver.activity}</h4>
                      <div className="text-sm text-gray-600">Driver: {driver.costDriver}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {formatCurrency(driver.totalCost)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(driver.unitRate)} per unit
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Product</th>
                          <th className="text-right py-2">Units Consumed</th>
                          <th className="text-right py-2">Allocated Cost</th>
                          <th className="text-right py-2">% of Activity</th>
                          <th className="text-right py-2">Cost per Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {driver.allocation.map((allocation) => (
                          <tr key={allocation.productId} className="border-b">
                            <td className="py-2 font-medium">{allocation.productName}</td>
                            <td className="py-2 text-right">{allocation.units.toLocaleString()}</td>
                            <td className="py-2 text-right font-medium">
                              {formatCurrency(allocation.allocatedCost)}
                            </td>
                            <td className="py-2 text-right">
                              {formatPercentage(allocation.percentage)}
                            </td>
                            <td className="py-2 text-right">
                              {formatCurrency(allocation.allocatedCost / allocation.units)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Cost Distribution</CardTitle>
              <CardDescription>Total cost allocation across activities</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costData.activityDrivers.map(driver => ({
                      name: driver.activity,
                      value: driver.totalCost
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${formatCurrency(value, true)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {costData.activityDrivers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Total Cost']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ABC vs Traditional Costing</CardTitle>
              <CardDescription>Product cost comparison between methods</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={costData.products.map(product => ({
                    name: product.productName.substring(0, 15) + '...',
                    traditionalCost: product.directCosts.total + product.indirectCosts.total,
                    abcCost: product.activityBasedCosts.total,
                    difference: product.activityBasedCosts.total - (product.directCosts.total + product.indirectCosts.total)
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                  <Legend />
                  <Bar dataKey="traditionalCost" fill="#8B5CF6" name="Traditional Costing" />
                  <Bar dataKey="abcCost" fill="#10B981" name="ABC Costing" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderMarketAnalysis = () => {
    if (!costData) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Market Profitability Analysis</CardTitle>
            <CardDescription>Margin analysis across different markets and regions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Market</th>
                    <th className="text-right py-3">Revenue</th>
                    <th className="text-right py-3">Total Cost</th>
                    <th className="text-right py-3">Margin</th>
                    <th className="text-right py-3">Margin %</th>
                    <th className="text-right py-3">Market Share</th>
                    <th className="text-right py-3">Growth Rate</th>
                    <th className="text-left py-3">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {costData.markets.map((market) => (
                    <tr key={market.market} className="border-b hover:bg-gray-50">
                      <td className="py-3">
                        <div className="font-medium">{market.market}</div>
                        <div className="text-xs text-gray-600">{market.region}</div>
                      </td>
                      <td className="py-3 text-right font-medium text-blue-600">
                        {formatCurrency(market.totalRevenue, true)}
                      </td>
                      <td className="py-3 text-right font-medium text-red-600">
                        {formatCurrency(market.totalCost, true)}
                      </td>
                      <td className="py-3 text-right font-medium text-green-600">
                        {formatCurrency(market.totalMargin, true)}
                      </td>
                      <td className={cn("py-3 text-right font-bold", getMarginColor(market.averageMarginPercentage))}>
                        {formatPercentage(market.averageMarginPercentage)}
                      </td>
                      <td className="py-3 text-right">
                        {formatPercentage(market.marketShare)}
                      </td>
                      <td className={cn("py-3 text-right font-medium",
                        market.growthRate >= 15 ? 'text-green-600' :
                        market.growthRate >= 10 ? 'text-blue-600' :
                        market.growthRate >= 5 ? 'text-yellow-600' : 'text-red-600'
                      )}>
                        {formatPercentage(market.growthRate)}
                      </td>
                      <td className="py-3">
                        <Badge variant={
                          market.competitivePosition === 'leader' ? 'default' :
                          market.competitivePosition === 'challenger' ? 'secondary' :
                          'outline'
                        }>
                          {market.competitivePosition}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Market</CardTitle>
              <CardDescription>Market contribution to total revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costData.markets.map(market => ({
                      name: market.market,
                      value: market.totalRevenue,
                      share: market.marketShare
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${formatCurrency(value, true)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {costData.markets.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Market Growth vs Share</CardTitle>
              <CardDescription>Strategic market positioning analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart 
                  data={costData.markets.map(market => ({
                    name: market.market,
                    growth: market.growthRate,
                    share: market.marketShare,
                    margin: market.averageMarginPercentage
                  }))}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="share" type="number" name="Market Share" tickFormatter={(value) => `${value}%`} />
                  <YAxis dataKey="growth" type="number" name="Growth Rate" tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value, name) => [
                    `${value}${name === 'growth' || name === 'share' ? '%' : ''}`,
                    name === 'growth' ? 'Growth Rate' : 
                    name === 'share' ? 'Market Share' :
                    name === 'margin' ? 'Margin %' : name
                  ]} />
                  <Scatter dataKey="growth" fill="#3B82F6" />
                  <ReferenceLine x={18} stroke="#666" strokeDasharray="5 5" />
                  <ReferenceLine y={10} stroke="#666" strokeDasharray="5 5" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderCostReductionOpportunities = () => {
    if (!costData) return null;

    const opportunitiesByStatus = costData.costReductionOpportunities.reduce((acc, opp) => {
      if (!acc[opp.status]) acc[opp.status] = [];
      acc[opp.status].push(opp);
      return acc;
    }, {} as any);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Cost Reduction Opportunities</CardTitle>
            <CardDescription>Identified opportunities to reduce costs and improve margins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(costData.summary.costReductionPotential, true)}
                </div>
                <div className="text-sm text-gray-600">Total Net Savings</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {costData.costReductionOpportunities.length}
                </div>
                <div className="text-sm text-gray-600">Opportunities</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {costData.costReductionOpportunities.filter(o => o.status === 'in_progress').length}
                </div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {costData.costReductionOpportunities.filter(o => o.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>

            <div className="space-y-4">
              {costData.costReductionOpportunities
                .sort((a, b) => b.netSaving - a.netSaving)
                .map((opportunity) => (
                <div key={opportunity.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <LightBulbIcon className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{opportunity.opportunity}</span>
                        <Badge variant="outline" className="text-xs">
                          {opportunity.category}
                        </Badge>
                        <Badge variant={
                          opportunity.status === 'completed' ? 'default' :
                          opportunity.status === 'in_progress' ? 'secondary' :
                          opportunity.status === 'planned' ? 'outline' :
                          'destructive'
                        }>
                          {opportunity.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{opportunity.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Timeline: {opportunity.timeframe}</span>
                        <span>Effort: {opportunity.effort}</span>
                        <span>Risk: {opportunity.riskLevel}</span>
                        <span className={cn("font-medium", getImpactColor(opportunity.impact))}>
                          {opportunity.impact} impact
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(opportunity.netSaving, true)}
                      </div>
                      <div className="text-xs text-gray-500">Net Annual Saving</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h5 className="font-medium text-sm mb-2">Financial Impact</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Current Cost:</span>
                          <span>{formatCurrency(opportunity.currentCost, true)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Potential Saving:</span>
                          <span className="text-green-600">{formatCurrency(opportunity.potentialSaving, true)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Implementation Cost:</span>
                          <span className="text-red-600">{formatCurrency(opportunity.implementationCost, true)}</span>
                        </div>
                        <div className="flex justify-between font-medium border-t pt-1">
                          <span>Net Saving:</span>
                          <span className="text-green-600">{formatCurrency(opportunity.netSaving, true)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-sm mb-2">KPI Impact</h5>
                      <div className="space-y-1 text-sm">
                        {opportunity.kpis.slice(0, 3).map((kpi, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="truncate">{kpi.metric}:</span>
                            <span className="text-green-600">+{kpi.improvement}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-sm mb-2">Dependencies</h5>
                      <div className="space-y-1">
                        {opportunity.dependencies.slice(0, 3).map((dep, index) => (
                          <div key={index} className="text-xs text-gray-600 flex items-start space-x-1">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></span>
                            <span>{dep}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Savings by Category</CardTitle>
              <CardDescription>Cost reduction potential by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={Object.entries(
                    costData.costReductionOpportunities.reduce((acc, opp) => {
                      if (!acc[opp.category]) acc[opp.category] = 0;
                      acc[opp.category] += opp.netSaving;
                      return acc;
                    }, {} as any)
                  ).map(([category, saving]) => ({ category, saving }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis tickFormatter={(value) => formatCurrency(value, true)} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Net Saving']} />
                  <Bar dataKey="saving" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Implementation Timeline</CardTitle>
              <CardDescription>Opportunities by implementation timeline</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={['1-3 months', '3-6 months', '6-12 months', '12+ months'].map(timeframe => {
                    const opportunities = costData.costReductionOpportunities.filter(opp => {
                      const months = parseInt(opp.timeframe);
                      if (timeframe === '1-3 months') return months <= 3;
                      if (timeframe === '3-6 months') return months > 3 && months <= 6;
                      if (timeframe === '6-12 months') return months > 6 && months <= 12;
                      return months > 12;
                    });
                    
                    return {
                      timeframe,
                      count: opportunities.length,
                      totalSaving: opportunities.reduce((sum, opp) => sum + opp.netSaving, 0)
                    };
                  })}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timeframe" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatCurrency(value, true)} />
                  <Tooltip formatter={(value: number, name: string) => [
                    name === 'count' ? value : formatCurrency(value),
                    name === 'count' ? 'Opportunities' : 'Total Saving'
                  ]} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="#8B5CF6" name="Count" />
                  <Bar yAxisId="right" dataKey="totalSaving" fill="#10B981" name="Total Saving" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg" />
        <div className="h-64 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cost Breakdown Analyzer</h2>
          <p className="text-gray-600">Comprehensive cost analysis with landed costs, hidden costs, and optimization opportunities</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={analysisLevel} onValueChange={(value) => setAnalysisLevel(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="market">Market</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
            Analyze Costs
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="landed_costs">Landed Costs</TabsTrigger>
          <TabsTrigger value="hidden_costs">Hidden Costs</TabsTrigger>
          <TabsTrigger value="abc_costing">ABC Costing</TabsTrigger>
          <TabsTrigger value="market_analysis">Market Analysis</TabsTrigger>
          <TabsTrigger value="reduction_opportunities">Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderCostOverview()}
        </TabsContent>

        <TabsContent value="landed_costs" className="space-y-6">
          {renderLandedCostAnalysis()}
        </TabsContent>

        <TabsContent value="hidden_costs" className="space-y-6">
          {renderHiddenCostAnalysis()}
        </TabsContent>

        <TabsContent value="abc_costing" className="space-y-6">
          {renderActivityBasedCosting()}
        </TabsContent>

        <TabsContent value="market_analysis" className="space-y-6">
          {renderMarketAnalysis()}
        </TabsContent>

        <TabsContent value="reduction_opportunities" className="space-y-6">
          {renderCostReductionOpportunities()}
        </TabsContent>
      </Tabs>
    </div>
  );
};