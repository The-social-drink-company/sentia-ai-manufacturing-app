import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Package, Users, ShoppingCart,
  Activity, BarChart3, PieChart as PieChartIcon, Calendar, Download,
  RefreshCw, Filter, ChevronUp, ChevronDown, Target, AlertCircle
} from 'lucide-react';

const AnalyticsSimple = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    revenue: { value: 2850000, change: 12.5, target: 3000000 },
    orders: { value: 1847, change: 8.3, target: 2000 },
    customers: { value: 542, change: 15.2, target: 600 },
    averageOrderValue: { value: 1543, change: 3.8, target: 1600 },
    conversionRate: { value: 3.2, change: 0.5, target: 4.0 },
    churnRate: { value: 5.1, change: -0.8, target: 4.0 }
  });

  // Monthly revenue data
  const revenueData = [
    { month: 'Jan', 0, target: 2000000, orders: 1450 },
    { month: 'Feb', 0, target: 2100000, orders: 1520 },
    { month: 'Mar', 0, target: 2200000, orders: 1590 },
    { month: 'Apr', 0, target: 2300000, orders: 1550 },
    { month: 'May', 0, target: 2400000, orders: 1630 },
    { month: 'Jun', 0, target: 2500000, orders: 1710 },
    { month: 'Jul', 0, target: 2600000, orders: 1780 },
    { month: 'Aug', 0, target: 2700000, orders: 1820 },
    { month: 'Sep', 0, target: 2800000, orders: 1847 },
    { month: 'Oct', 0, target: 2900000, orders: 1880 },
    { month: 'Nov', 0, target: 3000000, orders: 1920 },
    { month: 'Dec', 0, target: 3100000, orders: 2000 }
  ];

  // Product performance data
  const productData = [
    { name: 'Sentia Red', sales: 45000, 0, margin: 42 },
    { name: 'Sentia Black', sales: 38000, 0, margin: 38 },
    { name: 'Sentia Ginger', sales: 28000, 0, margin: 40 },
    { name: 'Starter Kits', sales: 15000, 0, margin: 35 },
    { name: 'Accessories', sales: 8000, 0, margin: 55 }
  ];

  // Customer segments
  const customerSegments = [
    { name: 'Retail', value: 35, 0, growth: 12 },
    { name: 'B2B', value: 28, 0, growth: 18 },
    { name: 'Online', value: 22, 0, growth: 25 },
    { name: 'Wholesale', value: 15, 0, growth: 8 }
  ];

  // Conversion funnel data
  const funnelData = [
    { stage: 'Visitors', value: 45000, percentage: 100 },
    { stage: 'Product Views', value: 28000, percentage: 62 },
    { stage: 'Cart Adds', value: 8500, percentage: 19 },
    { stage: 'Checkouts', value: 3200, percentage: 7 },
    { stage: 'Purchases', value: 1450, percentage: 3.2 }
  ];

  // Geographic distribution
  const geographicData = [
    { region: 'UK', sales: 55, 0 },
    { region: 'Europe', sales: 25, 0 },
    { region: 'USA', sales: 15, 0 },
    { region: 'Asia', sales: 5, 0 }
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-GB').format(value);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Update with new data
      setMetrics(prev => ({
        ...prev,
        revenue: { ...prev.revenue, value: prev.revenue.value * 1.01 }
      }));
    }, 1000);
  };

  const MetricCard = ({ title, value, change, icon: Icon, format = 'number', target }) => {
    const isPositive = change > 0;
    const progressPercentage = target ? (value / target) * 100 : 0;
    
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Icon className="h-8 w-8 text-blue-500" />
            <Badge variant={isPositive ? 'success' : 'destructive'} className="text-sm">
              {isPositive ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
              {Math.abs(change)}%
            </Badge>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {format === 'currency' ? formatCurrency(value) : 
             format === 'percent' ? `${value}%` : formatNumber(value)}
          </p>
          {target && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Target</span>
                <span>{format === 'currency' ? formatCurrency(target) : formatNumber(target)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Reports & Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Comprehensive business insights and performance metrics
            </p>
          </div>
          <div className="flex gap-3">
            <select 
              className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-700"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
            <Button onClick={handleRefresh} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Revenue"
          value={metrics.revenue.value}
          change={metrics.revenue.change}
          target={metrics.revenue.target}
          icon={DollarSign}
          format="currency"
        />
        <MetricCard
          title="Total Orders"
          value={metrics.orders.value}
          change={metrics.orders.change}
          target={metrics.orders.target}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Active Customers"
          value={metrics.customers.value}
          change={metrics.customers.change}
          target={metrics.customers.target}
          icon={Users}
        />
        <MetricCard
          title="Avg Order Value"
          value={metrics.averageOrderValue.value}
          change={metrics.averageOrderValue.change}
          target={metrics.averageOrderValue.target}
          icon={Package}
          format="currency"
        />
        <MetricCard
          title="Conversion Rate"
          value={metrics.conversionRate.value}
          change={metrics.conversionRate.change}
          target={metrics.conversionRate.target}
          icon={Target}
          format="percent"
        />
        <MetricCard
          title="Churn Rate"
          value={metrics.churnRate.value}
          change={metrics.churnRate.change}
          target={metrics.churnRate.target}
          icon={AlertCircle}
          format="percent"
        />
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `Â£${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="Revenue" />
                    <Area type="monotone" dataKey="target" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} name="Target" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="orders" stroke="#ffc658" strokeWidth={2} name="Orders" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `Â£${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                    <Bar dataKey="sales" fill="#82ca9d" name="Units Sold" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Margin Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="90%" data={productData}>
                    <RadialBar dataKey="margin" fill="#8884d8" label={{ position: 'insideStart', fill: '#fff' }} />
                    <Legend />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Product</th>
                      <th className="text-right py-2">Units Sold</th>
                      <th className="text-right py-2">Revenue</th>
                      <th className="text-right py-2">Margin %</th>
                      <th className="text-right py-2">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productData.map((product, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{product.name}</td>
                        <td className="text-right">{formatNumber(product.sales)}</td>
                        <td className="text-right">{formatCurrency(product.revenue)}</td>
                        <td className="text-right">{product.margin}%</td>
                        <td className="text-right">
                          <TrendingUp className="h-4 w-4 text-green-500 inline" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={customerSegments}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name} (${entry.value}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {customerSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segment Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={customerSegments} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `Â£${(value / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="revenue" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales by Region</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={geographicData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="sales"
                      label={(entry) => `${entry.region}: ${entry.sales}%`}
                    >
                      {geographicData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-4">
                  {geographicData.map((region, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded`} style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="font-medium">{region.region}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(region.revenue)}</p>
                        <p className="text-sm text-gray-600">{region.sales}% of total</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="stage" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              <div className="mt-6 space-y-2">
                {funnelData.map((stage, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{stage.stage}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">{formatNumber(stage.value)}</span>
                      <Badge variant="secondary">{stage.percentage}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsSimple;
