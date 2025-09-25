import React, { useState, useEffect } from 'react';
import { useWebVitals, useNetworkStatus, useResourceTiming, useLongTaskMonitoring } from '../hooks/usePerformance';
import { Card, CardBody, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { Tooltip } from './ui/Tooltip';

interface PerformanceMonitorProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible,
  onToggle
}) => {
  const webVitals = useWebVitals();
  const networkStatus = useNetworkStatus();
  const resourceTiming = useResourceTiming();
  const longTaskMonitoring = useLongTaskMonitoring();
  const [fps, setFps] = useState<number>(60);

  // FPS monitoring
  useEffect(() => {
    let frameCount = 0;
    let startTime = performance.now();
    let animationId: number;

    const measureFps = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= startTime + 1000) {
        const currentFps = Math.round((frameCount * 1000) / (currentTime - startTime));
        setFps(currentFps);
        frameCount = 0;
        startTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFps);
    };

    measureFps();
    return () => cancelAnimationFrame(animationId);
  }, []);

  const getVitalStatus = (vital: number | undefined, thresholds: [number, number]): 'good' | 'needs-improvement' | 'poor' => {
    if (vital === undefined) return 'good';
    if (vital <= thresholds[0]) return 'good';
    if (vital <= thresholds[1]) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: 'good' | 'needs-improvement' | 'poor'): string => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Tooltip content="Open Performance Monitor">
          <Button
            onClick={onToggle}
            variant="primary"
            className="rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
            aria-label="Toggle Performance Monitor"
          >
            📊
          </Button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-h-96 overflow-y-auto">
      <Card className="shadow-lg border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Performance Monitor</h3>
            <Button
              onClick={onToggle}
              variant="ghost"
              className="p-1 h-6 w-6"
              aria-label="Close Performance Monitor"
            >
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardBody className="space-y-4 text-xs">
          {/* Web Vitals */}
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Web Vitals</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'LCP', value: webVitals.LCP, thresholds: [2500, 4000], unit: 'ms', label: 'Largest Contentful Paint' },
                { key: 'FID', value: webVitals.FID, thresholds: [100, 300], unit: 'ms', label: 'First Input Delay' },
                { key: 'CLS', value: webVitals.CLS, thresholds: [0.1, 0.25], unit: '', label: 'Cumulative Layout Shift' },
                { key: 'FCP', value: webVitals.FCP, thresholds: [1800, 3000], unit: 'ms', label: 'First Contentful Paint' },
              ].map(({ key, value, thresholds, unit, label }) => {
                const status = getVitalStatus(value, thresholds);
                return (
                  <Tooltip key={key} content={label}>
                    <div className={`p-2 rounded text-center ${getStatusColor(status)}`}>
                      <div className="font-medium">{key}</div>
                      <div>{value !== undefined ? `${Math.round(value)}${unit}` : '—'}</div>
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          {/* System Performance */}
          <div>
            <h4 className="font-medium text-gray-800 mb-2">System Performance</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>FPS:</span>
                <span className={fps >= 50 ? 'text-green-600' : fps >= 30 ? 'text-yellow-600' : 'text-red-600'}>
                  {fps}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>Long Tasks:</span>
                <span className={longTaskMonitoring.totalLongTasks === 0 ? 'text-green-600' : 'text-yellow-600'}>
                  {longTaskMonitoring.totalLongTasks}
                </span>
              </div>
              
              {longTaskMonitoring.averageDuration > 0 && (
                <div className="flex justify-between">
                  <span>Avg Task Duration:</span>
                  <span className="text-yellow-600">
                    {longTaskMonitoring.averageDuration.toFixed(1)}ms
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Network Status */}
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Network</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={networkStatus.isOnline ? 'text-green-600' : 'text-red-600'}>
                  {networkStatus.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>Connection:</span>
                <span className={networkStatus.isSlowConnection ? 'text-yellow-600' : 'text-green-600'}>
                  {networkStatus.effectiveType.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Resource Loading */}
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Resources</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Resources:</span>
                <span>{resourceTiming.totalResources}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Total Size:</span>
                <span>{(resourceTiming.totalSize / 1024).toFixed(1)}KB</span>
              </div>
              
              <div className="flex justify-between">
                <span>Avg Load Time:</span>
                <span className={resourceTiming.averageLoadTime > 1000 ? 'text-yellow-600' : 'text-green-600'}>
                  {resourceTiming.averageLoadTime.toFixed(0)}ms
                </span>
              </div>
              
              {resourceTiming.getSlowResources().length > 0 && (
                <div className="flex justify-between">
                  <span>Slow Resources:</span>
                  <span className="text-red-600">
                    {resourceTiming.getSlowResources().length}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Memory Usage (Chrome only) */}
          {'memory' in performance && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Memory Usage</h4>
              <div className="space-y-2">
                {(() => {
                  const memory = (performance as any).memory;
                  const used = Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100;
                  const total = Math.round(memory.totalJSHeapSize / 1048576 * 100) / 100;
                  const percentage = Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100);
                  
                  return (
                    <>
                      <div className="flex justify-between">
                        <span>Used:</span>
                        <span>{used}MB ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            percentage > 80 ? 'bg-red-500' : percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

// Development-only performance overlay
export const DevPerformanceOverlay: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return <PerformanceMonitor isVisible={isVisible} onToggle={() => setIsVisible(!isVisible)} />;
};