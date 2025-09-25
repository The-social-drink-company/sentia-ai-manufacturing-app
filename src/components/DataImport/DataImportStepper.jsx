import React, { useState, useEffect } from 'react';
import { Check, Upload, Eye, Settings, Play, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const DataImportStepper = ({ 
  currentStep = 1, 
  importJobId, 
  onStepChange, 
  importStatus = 'idle' 
}) => {
  const steps = [
    {
      id: 1,
      title: 'Upload',
      description: 'Select and upload your data file',
      icon: Upload,
      status: 'completed'
    },
    {
      id: 2,
      title: 'Preview & Map',
      description: 'Review data and map fields',
      icon: Eye,
      status: currentStep >= 2 ? (currentStep === 2 ? 'active' : 'completed') : 'pending'
    },
    {
      id: 3,
      title: 'Validate',
      description: 'Configure validation rules',
      icon: Settings,
      status: currentStep >= 3 ? (currentStep === 3 ? 'active' : 'completed') : 'pending'
    },
    {
      id: 4,
      title: 'Process',
      description: 'Import and process data',
      icon: Play,
      status: currentStep >= 4 ? (currentStep === 4 ? 'active' : 'completed') : 'pending'
    },
    {
      id: 5,
      title: 'Results',
      description: 'Review import results',
      icon: AlertTriangle,
      status: currentStep >= 5 ? 'completed' : 'pending'
    }
  ];

  const getStepStatus = (step) => {
    if (currentStep > step.id) return 'completed';
    if (currentStep === step.id) return 'active';
    return 'pending';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white border-green-500';
      case 'active':
        return 'bg-blue-500 text-white border-blue-500';
      case 'pending':
        return 'bg-gray-200 text-gray-500 border-gray-200';
      default:
        return 'bg-gray-200 text-gray-500 border-gray-200';
    }
  };

  const getTextColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-700';
      case 'active':
        return 'text-blue-700';
      case 'pending':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Import Progress</span>
          {importJobId && (
            <Badge variant="secondary">
              Job ID: {importJobId}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const status = getStepStatus(step);
            const Icon = step.icon;
            
            return (
              <div key={step.id}>
                <div className="flex items-center space-x-4">
                  {/* Step Number/Icon */}
                  <div 
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${getStatusColor(status)}`}
                  >
                    {status === 'completed' ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  
                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${getTextColor(status)}`}>
                        {step.title}
                      </p>
                      {status === 'active' && (
                        <Badge variant="default" className="ml-2">
                          Current
                        </Badge>
                      )}
                      {status === 'completed' && (
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                          Done
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm ${status === 'pending' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {step.description}
                    </p>
                    
                    {/* Additional status info for active/completed steps */}
                    {status === 'active' && step.id === 4 && importStatus && (
                      <div className="mt-2">
                        <Badge 
                          variant="outline" 
                          className={
                            importStatus === 'processing' 
                              ? 'border-blue-500 text-blue-700 bg-blue-50'
                              : importStatus === 'completed'
                              ? 'border-green-500 text-green-700 bg-green-50'
                              : importStatus === 'failed'
                              ? 'border-red-500 text-red-700 bg-red-50'
                              : 'border-yellow-500 text-yellow-700 bg-yellow-50'
                          }
                        >
                          {importStatus.charAt(0).toUpperCase() + importStatus.slice(1)}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Button */}
                  {onStepChange && (status === 'completed' || status === 'active') && (
                    <Button
                      variant={status === 'active' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onStepChange(step.id)}
                    >
                      {status === 'active' ? 'Continue' : 'Review'}
                    </Button>
                  )}
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="ml-5 mt-2 mb-2">
                    <div 
                      className={`w-0.5 h-6 ${
                        status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Import Status Summary */}
        {importStatus && importStatus !== 'idle' && (
          <>
            <Separator className="my-4" />
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-2">Import Status</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Status:</span>
                <Badge 
                  variant={
                    importStatus === 'completed' ? 'default' :
                    importStatus === 'processing' ? 'secondary' :
                    importStatus === 'failed' ? 'destructive' :
                    'outline'
                  }
                >
                  {importStatus.charAt(0).toUpperCase() + importStatus.slice(1)}
                </Badge>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DataImportStepper;