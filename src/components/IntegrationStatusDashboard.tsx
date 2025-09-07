import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardBody, CardHeader, StatusCard } from './ui/Card';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Tooltip } from './ui/Tooltip';
import { integrationValidator, ValidationResult, IntegrationStatus } from '../services/integrations/validation';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export const IntegrationStatusDashboard: React.FC = () => {
  const [isValidating, setIsValidating] = useState(false);
  
  const { data: validationResult, isLoading, error, refetch } = useQuery<ValidationResult>({
    queryKey: ['integration-validation'],
    queryFn: () => integrationValidator.validateAllIntegrations(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
    retry: 2
  });

  const handleManualValidation = async () => {
    setIsValidating(true);
    try {
      await refetch();
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = (status: IntegrationStatus['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'disabled':
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: IntegrationStatus['status']) => {
    switch (status) {
      case 'connected':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'disabled':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getOverallStatusInfo = (overall: ValidationResult['overall']) => {
    switch (overall) {
      case 'healthy':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: <CheckCircleIcon className="h-6 w-6" />,
          message: 'All integrations are functioning normally'
        };
      case 'degraded':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          icon: <ExclamationTriangleIcon className="h-6 w-6" />,
          message: 'Some integrations have issues or warnings'
        };
      case 'critical':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          icon: <XCircleIcon className="h-6 w-6" />,
          message: 'Critical integration failures detected'
        };
    }
  };

  if (isLoading && !validationResult) {
    return (
      <Card>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner text="Validating integrations..." />
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <StatusCard
        title="Integration Validation Failed"
        status="error"
        message={error instanceof Error ? error.message : 'Unknown error occurred'}
        actions={
          <Button onClick={handleManualValidation} size="sm" variant="outline">
            Retry
          </Button>
        }
      />
    );
  }

  if (!validationResult) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">
            <p className="text-gray-500">No validation data available</p>
            <Button onClick={handleManualValidation} className="mt-4">
              Start Validation
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  const overallStatus = getOverallStatusInfo(validationResult.overall);

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Integration Status</h3>
            <Button
              onClick={handleManualValidation}
              disabled={isValidating}
              variant="outline"
              size="sm"
              icon={<ArrowPathIcon className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />}
            >
              {isValidating ? 'Validating...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        
        <CardBody>
          <div className={`flex items-center p-4 rounded-lg ${overallStatus.bgColor}`}>
            <div className={`flex-shrink-0 ${overallStatus.color}`}>
              {overallStatus.icon}
            </div>
            <div className="ml-3 flex-1">
              <h4 className={`text-sm font-medium ${overallStatus.color}`}>
                System Status: {validationResult.overall.charAt(0).toUpperCase() + validationResult.overall.slice(1)}
              </h4>
              <p className="text-sm text-gray-600 mt-1">{overallStatus.message}</p>
            </div>
            <div className="ml-3 text-right">
              <div className="text-xs text-gray-500">
                Last checked: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="text-center">
          <CardBody>
            <div className="text-2xl font-bold text-gray-900">{validationResult.summary.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </CardBody>
        </Card>
        
        <Card className="text-center">
          <CardBody>
            <div className="text-2xl font-bold text-green-600">{validationResult.summary.connected}</div>
            <div className="text-sm text-gray-500">Connected</div>
          </CardBody>
        </Card>
        
        <Card className="text-center">
          <CardBody>
            <div className="text-2xl font-bold text-yellow-600">{validationResult.summary.warnings}</div>
            <div className="text-sm text-gray-500">Warnings</div>
          </CardBody>
        </Card>
        
        <Card className="text-center">
          <CardBody>
            <div className="text-2xl font-bold text-red-600">{validationResult.summary.errors}</div>
            <div className="text-sm text-gray-500">Errors</div>
          </CardBody>
        </Card>
        
        <Card className="text-center">
          <CardBody>
            <div className="text-2xl font-bold text-gray-600">{validationResult.summary.disabled}</div>
            <div className="text-sm text-gray-500">Disabled</div>
          </CardBody>
        </Card>
      </div>

      {/* Individual Integration Status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {validationResult.integrations.map((integration) => (
          <Card
            key={integration.name}
            className={`border-l-4 ${getStatusColor(integration.status)}`}
          >
            <CardBody>
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  {getStatusIcon(integration.status)}
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900 capitalize">
                      {integration.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {integration.message}
                    </p>
                  </div>
                </div>
                
                {integration.responseTime && (
                  <Tooltip content="Response Time">
                    <div className="text-xs text-gray-500">
                      {integration.responseTime}ms
                    </div>
                  </Tooltip>
                )}
              </div>

              {integration.details && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-600 space-y-1">
                    {integration.details.version && (
                      <div>Version: {integration.details.version}</div>
                    )}
                    
                    {integration.details.features && (
                      <div>
                        Features: {integration.details.features.join(', ')}
                      </div>
                    )}
                    
                    {integration.details.limits?.rateLimitRemaining && (
                      <div>
                        Rate limit: {integration.details.limits.rateLimitRemaining} remaining
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-400">
                Last checked: {integration.lastChecked.toLocaleString()}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Detailed Error Information */}
      {validationResult.integrations.some(i => i.status === 'error') && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-red-600">Integration Errors</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {validationResult.integrations
                .filter(i => i.status === 'error')
                .map((integration) => (
                  <div key={integration.name} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <XCircleIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <div className="ml-2">
                        <h4 className="text-sm font-medium text-red-800 capitalize">
                          {integration.name}
                        </h4>
                        <p className="text-sm text-red-700 mt-1">
                          {integration.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};