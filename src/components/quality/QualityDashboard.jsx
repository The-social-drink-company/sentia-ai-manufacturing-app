import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import apiService from '../../services/api';
import { useQuery } from '@tanstack/react-query';

const QualityDashboard = () => {
  const { data: qualityData, isLoading } = useQuery({
    queryKey: ['quality'],
    queryFn: () => apiService.getQualityMetrics(),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Quality Control</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Quality Score</p>
            <p className="text-3xl font-bold text-green-600">{qualityData?.score || '98.5'}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Defect Rate</p>
            <p className="text-3xl font-bold text-red-600">{qualityData?.defectRate || '0.8'}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Tests Passed</p>
            <p className="text-3xl font-bold text-blue-600">{qualityData?.testsPassed || '2,341'}/{qualityData?.totalTests || '2,350'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QualityDashboard;