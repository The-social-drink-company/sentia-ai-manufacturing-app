import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const UnleashedERPWidget = ({ config = {} }) => {
  const { data: unleashedData, isLoading, error } = useQuery({
    queryKey: ['unleashed-erp-data'],
    queryFn: async () => {
      const response = await fetch('/api/unleashed/manufacturing');
      if (!response.ok) throw new Error('Failed to fetch Unleashed ERP data');
      return response.json();
    },
    refetchInterval: 30000,
    staleTime: 25000,
  });

  const [productionMetrics, setProductionMetrics] = useState({
    activeBatches: 0,
    completedToday: 0,
    qualityScore: 0,
    utilizationRate: 0
  });

  const [resourceStatus, setResourceStatus] = useState([]);

  useEffect(() => {
    if (unleashedData) {
      setProductionMetrics({
        activeBatches: unleashedData.production?.activeBatches || 0,
        completedToday: unleashedData.production?.completedToday || 0,
        qualityScore: unleashedData.production?.qualityScore 0.0,
        utilizationRate: unleashedData.production?.utilizationRate 0.0
      });

      setResourceStatus(unleashedData.resources?.status || []);
    }
  }, [unleashedData]);

  if (isLoading) {
    return (
      <Card className="sentia-card h-full">
        <CardHeader className="sentia-card-header">
          <CardTitle className="sentia-widget-title">Unleashed ERP</CardTitle>
        </CardHeader>
        <CardContent className="sentia-card-content">
          <div className="sentia-loading-state">
            <div className="sentia-spinner"></div>
            <p>Loading ERP data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="sentia-card h-full border-red-200">
        <CardHeader className="sentia-card-header">
          <CardTitle className="sentia-widget-title text-red-600">Unleashed ERP</CardTitle>
        </CardHeader>
        <CardContent className="sentia-card-content">
          <div className="sentia-error-state">
            <p className="text-red-500">Error: {error.message}</p>
            <p className="text-sm text-gray-500 mt-2">Check ERP connection</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getUtilizationColor = (rate) => {
    if (rate >= 85) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityColor = (score) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="sentia-card h-full">
      <CardHeader className="sentia-card-header">
        <CardTitle className="sentia-widget-title">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
            Unleashed ERP Manufacturing
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="sentia-card-content">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="sentia-metric-card">
            <div className="sentia-metric-value text-blue-600">{productionMetrics.activeBatches}</div>
            <div className="sentia-metric-label">Active Batches</div>
          </div>
          <div className="sentia-metric-card">
            <div className="sentia-metric-value text-green-600">{productionMetrics.completedToday}</div>
            <div className="sentia-metric-label">Completed Today</div>
          </div>
          <div className="sentia-metric-card">
            <div className={`sentia-metric-value ${getQualityColor(productionMetrics.qualityScore)}`}>
              {productionMetrics.qualityScore.toFixed(1)}%
            </div>
            <div className="sentia-metric-label">Quality Score</div>
          </div>
          <div className="sentia-metric-card">
            <div className={`sentia-metric-value ${getUtilizationColor(productionMetrics.utilizationRate)}`}>
              {productionMetrics.utilizationRate.toFixed(1)}%
            </div>
            <div className="sentia-metric-label">Utilization Rate</div>
          </div>
        </div>

        {resourceStatus.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 text-sm">Resource Status</h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {resourceStatus.map((resource, index) => (
                <div key={resource.id || index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      resource.status === 'active' ? 'bg-green-500' : 
                      resource.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium text-sm">{resource.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{resource.utilization}%</div>
                    <div className="text-xs text-gray-500 capitalize">{resource.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {unleashedData?.productionSchedule && unleashedData.productionSchedule.length > 0 && (
          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <h4 className="font-semibold text-indigo-800 mb-2">Next Production Runs</h4>
            <div className="space-y-1">
              {unleashedData.productionSchedule.slice(0, 2).map((run, index) => (
                <div key={index} className="text-sm text-indigo-700">
                  {run.productName}: {run.quantity} units @ {new Date(run.scheduledTime).toLocaleTimeString()}
                </div>
              ))}
            </div>
          </div>
        )}

        {unleashedData?.qualityAlerts && unleashedData.qualityAlerts.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">Quality Alerts</h4>
            <div className="space-y-1">
              {unleashedData.qualityAlerts.slice(0, 2).map((alert, index) => (
                <div key={index} className="text-sm text-red-700">
                  {alert.batchId}: {alert.issue}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 sentia-data-timestamp">
          Last updated: {unleashedData?.lastUpdated ? new Date(unleashedData.lastUpdated).toLocaleTimeString() : 'Never'}
        </div>
      </CardContent>
    </Card>
  );
};

export default UnleashedERPWidget;