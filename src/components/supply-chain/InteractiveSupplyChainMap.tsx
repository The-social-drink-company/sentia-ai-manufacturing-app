import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPinIcon, 
  TruckIcon, 
  BuildingOfficeIcon,
  HomeModernIcon,
  CubeIcon,
  ZoomInIcon,
  ZoomOutIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';
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

type ViewMode = 'geographic' | 'network' | 'risk' | 'performance';

interface InteractiveSupplyChainMapProps {
  nodes: SupplyChainNode[];
  edges: SupplyChainEdge[];
  viewMode: ViewMode;
  showRiskOverlay: boolean;
  selectedNode: string | null;
  onNodeSelect: (nodeId: string | null) => void;
}

export function InteractiveSupplyChainMap({
  nodes,
  edges,
  viewMode,
  showRiskOverlay,
  selectedNode,
  onNodeSelect
}: InteractiveSupplyChainMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Convert geographic coordinates to SVG coordinates
  const geoToSVG = useCallback((lat: number, lng: number, width: number, height: number) => {
    // Simple equirectangular projection
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
  }, []);

  const getNodeIcon = useCallback((type: string) => {
    switch (type) {
      case 'supplier': return BuildingOfficeIcon;
      case 'manufacturer': return HomeModernIcon;
      case 'distributor': return TruckIcon;
      case 'warehouse': return CubeIcon;
      default: return MapPinIcon;
    }
  }, []);

  const getNodeColor = useCallback((node: SupplyChainNode) => {
    if (viewMode === 'risk') {
      switch (node.riskLevel) {
        case 'low': return '#10B981';
        case 'medium': return '#F59E0B';
        case 'high': return '#F97316';
        case 'critical': return '#EF4444';
        default: return '#6B7280';
      }
    } else if (viewMode === 'performance') {
      const score = node.metrics.reliabilityScore;
      if (score >= 90) return '#10B981';
      if (score >= 80) return '#3B82F6';
      if (score >= 70) return '#F59E0B';
      return '#EF4444';
    } else {
      switch (node.status) {
        case 'operational': return '#10B981';
        case 'warning': return '#F59E0B';
        case 'critical': return '#EF4444';
        case 'offline': return '#6B7280';
        default: return '#6B7280';
      }
    }
  }, [viewMode]);

  const getEdgeColor = useCallback((edge: SupplyChainEdge) => {
    switch (edge.status) {
      case 'active': return '#10B981';
      case 'delayed': return '#F59E0B';
      case 'disrupted': return '#EF4444';
      case 'maintenance': return '#6B7280';
      default: return '#6B7280';
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  }, [panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoom = useCallback((delta: number) => {
    setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)));
  }, []);

  const resetView = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const svgWidth = 800;
  const svgHeight = 500;

  return (
    <div className="space-y-4">
      {/* Map Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            View: {viewMode}
          </Badge>
          <Badge variant="outline">
            Zoom: {Math.round(zoomLevel * 100)}%
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom(0.1)}
          >
            <ZoomInIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom(-0.1)}
          >
            <ZoomOutIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetView}
          >
            <ArrowsPointingOutIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="relative overflow-hidden bg-gray-50 rounded-lg border" style={{ height: '500px' }}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            {/* Gradient for risk overlay */}
            <radialGradient id="riskGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.1" />
            </radialGradient>

            {/* Arrow marker for edges */}
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                      refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
              </marker>
            </defs>
          </defs>

          {/* Background world map outline (simplified) */}
          <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}>
            {/* World map background */}
            <rect width={svgWidth} height={svgHeight} fill="#E5E7EB" opacity="0.3" />
            
            {/* Simplified continent shapes */}
            <g fill="#D1D5DB" opacity="0.5">
              {/* Europe */}
              <rect x={380} y={120} width={80} height={60} rx="5" />
              {/* Asia */}
              <rect x={500} y={100} width={200} height={120} rx="10" />
              {/* North America */}
              <rect x={100} y={80} width={180} height={100} rx="15" />
              {/* South America */}
              <rect x={150} y={220} width={80} height={120} rx="8" />
              {/* Africa */}
              <rect x={350} y={200} width={100} height={150} rx="8" />
              {/* Australia */}
              <rect x={600} y={300} width={80} height={50} rx="5" />
            </g>

            {/* Risk overlay */}
            {showRiskOverlay && (
              <g opacity="0.4">
                {nodes.filter(node => node.riskLevel === 'high' || node.riskLevel === 'critical').map(node => {
                  const pos = geoToSVG(node.location.lat, node.location.lng, svgWidth, svgHeight);
                  return (
                    <circle
                      key={`risk-${node.id}`}
                      cx={pos.x}
                      cy={pos.y}
                      r={node.riskLevel === 'critical' ? 40 : 30}
                      fill="url(#riskGradient)"
                      className="animate-pulse"
                    />
                  );
                })}
              </g>
            )}

            {/* Edges */}
            <g>
              {edges.map(edge => {
                const fromNode = nodes.find(n => n.id === edge.from);
                const toNode = nodes.find(n => n.id === edge.to);
                
                if (!fromNode || !toNode) return null;

                const fromPos = geoToSVG(fromNode.location.lat, fromNode.location.lng, svgWidth, svgHeight);
                const toPos = geoToSVG(toNode.location.lat, toNode.location.lng, svgWidth, svgHeight);

                return (
                  <g key={edge.id}>
                    {/* Connection line */}
                    <line
                      x1={fromPos.x}
                      y1={fromPos.y}
                      x2={toPos.x}
                      y2={toPos.y}
                      stroke={getEdgeColor(edge)}
                      strokeWidth={edge.currentShipments > 0 ? 3 : 2}
                      strokeDasharray={edge.status === 'delayed' ? '5,5' : ''}
                      markerEnd="url(#arrowhead)"
                      opacity={0.7}
                    />
                    
                    {/* Shipment indicators */}
                    {edge.currentShipments > 0 && (
                      <g>
                        {Array.from({ length: Math.min(edge.currentShipments, 3) }).map((_, i) => {
                          const progress = (i + 1) / (Math.min(edge.currentShipments, 3) + 1);
                          const x = fromPos.x + (toPos.x - fromPos.x) * progress;
                          const y = fromPos.y + (toPos.y - fromPos.y) * progress;
                          
                          return (
                            <circle
                              key={`shipment-${edge.id}-${i}`}
                              cx={x}
                              cy={y}
                              r="3"
                              fill="#3B82F6"
                              className="animate-pulse"
                            >
                              <animateTransform
                                attributeName="transform"
                                type="translate"
                                values={`0,0; ${toPos.x - fromPos.x},${toPos.y - fromPos.y}`}
                                dur="10s"
                                repeatCount="indefinite"
                              />
                            </circle>
                          );
                        })}
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Nodes */}
            <g>
              {nodes.map(node => {
                const pos = geoToSVG(node.location.lat, node.location.lng, svgWidth, svgHeight);
                const isSelected = selectedNode === node.id;
                const NodeIcon = getNodeIcon(node.type);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNodeSelect(isSelected ? null : node.id);
                    }}
                  >
                    {/* Selection halo */}
                    {isSelected && (
                      <circle
                        r="20"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    )}

                    {/* Node background */}
                    <circle
                      r="12"
                      fill={getNodeColor(node)}
                      stroke="white"
                      strokeWidth="2"
                      opacity={0.9}
                    />

                    {/* Node icon */}
                    <foreignObject x="-8" y="-8" width="16" height="16">
                      <NodeIcon className="h-4 w-4 text-white" />
                    </foreignObject>

                    {/* Status indicator */}
                    <circle
                      cx="8"
                      cy="-8"
                      r="4"
                      fill={
                        node.status === 'operational' ? '#10B981' :
                        node.status === 'warning' ? '#F59E0B' :
                        node.status === 'critical' ? '#EF4444' : '#6B7280'
                      }
                      stroke="white"
                      strokeWidth="1"
                    />

                    {/* Node label */}
                    <text
                      y="25"
                      textAnchor="middle"
                      className="text-xs font-medium fill-gray-700"
                    >
                      {node.name.length > 20 ? `${node.name.substring(0, 17)}...` : node.name}
                    </text>

                    {/* Performance indicator */}
                    {viewMode === 'performance' && (
                      <text
                        y="38"
                        textAnchor="middle"
                        className="text-xs font-bold"
                        fill={getNodeColor(node)}
                      >
                        {node.metrics.reliabilityScore}%
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </g>
        </svg>

        {/* Legend */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
          <div className="text-sm font-medium text-gray-900">Legend</div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs">Operational</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-xs">Warning</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-xs">Critical</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="text-xs">Offline</span>
            </div>
          </div>
        </div>

        {/* Node type indicators */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
          <div className="text-sm font-medium text-gray-900">Node Types</div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <BuildingOfficeIcon className="h-4 w-4 text-gray-600" />
              <span className="text-xs">Supplier</span>
            </div>
            <div className="flex items-center space-x-2">
              <HomeModernIcon className="h-4 w-4 text-gray-600" />
              <span className="text-xs">Manufacturer</span>
            </div>
            <div className="flex items-center space-x-2">
              <TruckIcon className="h-4 w-4 text-gray-600" />
              <span className="text-xs">Distributor</span>
            </div>
            <div className="flex items-center space-x-2">
              <CubeIcon className="h-4 w-4 text-gray-600" />
              <span className="text-xs">Warehouse</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {nodes.filter(n => n.status === 'operational').length}
              </div>
              <div className="text-sm text-gray-600">Operational Nodes</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {edges.filter(e => e.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Active Routes</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {edges.reduce((sum, e) => sum + e.currentShipments, 0)}
              </div>
              <div className="text-sm text-gray-600">Active Shipments</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {nodes.filter(n => n.riskLevel === 'high' || n.riskLevel === 'critical').length}
              </div>
              <div className="text-sm text-gray-600">High Risk Nodes</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}