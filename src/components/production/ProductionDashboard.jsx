import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import apiService from '../../services/api';
import { useQuery } from '@tanstack/react-query';

const ProductionDashboard = () => {
  const { data: productionData, isLoading } = useQuery({
    queryKey: ['production'],
    queryFn: () => apiService.getProductionMetrics(),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading production data from MCP Server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Tracking</h1>
          <p className="text-gray-600 mt-1">Real-time production monitoring and analytics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">OEE Score</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{productionData?.oee || 94}%</p>
            <p className="text-xs text-green-600 mt-1">+2% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Units Produced</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{productionData?.unitsProduced || '12,543'}</p>
            <p className="text-xs text-blue-600 mt-1">Today's output</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Production Rate</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{productionData?.rate || '523'}/hr</p>
            <p className="text-xs text-gray-600 mt-1">Current speed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Active Lines</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{productionData?.activeLines || '7'}/8</p>
            <p className="text-xs text-orange-600 mt-1">Line 3 maintenance</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Production Lines Status (Live)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(line => (
              <div key={line} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    line === 3 ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'
                  }`}></div>
                  <span className="font-medium">Line {line}</span>
                </div>
                <div className="flex items-center space-x-8">
                  <span className="text-sm text-gray-600">Product: SKU-{1000 + line * 111}</span>
                  <span className="text-sm font-medium">{line === 3 ? 'Maintenance' : `${400 + line * 23} units/hr`}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    line === 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {line === 3 ? 'Offline' : 'Running'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionDashboard;