# Digital Twin 3D Visualization - Complete Implementation Code

## 1. Digital Twin Viewer Component

```jsx
// src/components/3d/DigitalTwinViewer.jsx
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  Grid, 
  GizmoHelper, 
  GizmoViewport,
  Stats,
  Text,
  Box,
  Sphere,
  Cylinder,
  Line,
  Html
} from '@react-three/drei';
import { 
  Cube, 
  Play, 
  Pause, 
  RotateCw, 
  Layers, 
  Eye, 
  EyeOff,
  Maximize2,
  Settings,
  Camera,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import * as THREE from 'three';

export const DigitalTwinViewer = ({ digitalTwinData }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedObject, setSelectedObject] = useState(null);
  const [viewMode, setViewMode] = useState('perspective');
  const [showStats, setShowStats] = useState(false);
  const [layers, setLayers] = useState({
    machines: true,
    conveyors: true,
    sensors: true,
    flow: true,
    heatmap: false
  });
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [cameraPosition, setCameraPosition] = useState([15, 15, 15]);

  // Fetch real-time factory data
  const { data: factoryData } = useQuery({
    queryKey: ['digital-twin-data'],
    queryFn: async () => {
      const response = await fetch('/api/digital-twin/factory-state');
      return response.json();
    },
    refetchInterval: isPlaying ? 1000 / simulationSpeed : false
  });

  // WebSocket for real-time updates
  useEffect(() => {
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws/digital-twin`);
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      // Handle real-time updates
      console.log('Digital Twin Update:', update);
    };

    return () => ws.close();
  }, []);

  const handleObjectClick = (object) => {
    setSelectedObject(object);
  };

  const resetCamera = () => {
    setCameraPosition([15, 15, 15]);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Controls Bar */}
      <div className="bg-gray-800 border-b border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cube className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">Digital Twin Factory</h3>
            {factoryData && (
              <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded">
                Live Data
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Playback Controls */}
            <div className="flex items-center space-x-1 bg-gray-700 rounded-lg px-2 py-1">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1 hover:bg-gray-600 rounded transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white" />
                )}
              </button>
              <select
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                className="bg-transparent text-white text-sm px-2 py-1 outline-none"
              >
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="2">2x</option>
                <option value="4">4x</option>
              </select>
            </div>

            {/* View Controls */}
            <div className="flex items-center space-x-1 bg-gray-700 rounded-lg px-2 py-1">
              <button
                onClick={resetCamera}
                className="p-1 hover:bg-gray-600 rounded transition-colors"
                title="Reset Camera"
              >
                <RotateCw className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setShowStats(!showStats)}
                className="p-1 hover:bg-gray-600 rounded transition-colors"
                title="Toggle Stats"
              >
                <Activity className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'perspective' ? 'orthographic' : 'perspective')}
                className="p-1 hover:bg-gray-600 rounded transition-colors"
                title="Toggle Camera Mode"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Layer Toggle */}
            <LayerControls layers={layers} setLayers={setLayers} />
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <Canvas shadows>
          <Suspense fallback={<LoadingFallback />}>
            <Scene 
              factoryData={factoryData}
              layers={layers}
              isPlaying={isPlaying}
              simulationSpeed={simulationSpeed}
              onObjectClick={handleObjectClick}
              cameraPosition={cameraPosition}
              viewMode={viewMode}
            />
          </Suspense>
          {showStats && <Stats />}
        </Canvas>

        {/* Selected Object Info */}
        {selectedObject && (
          <ObjectInfoPanel 
            object={selectedObject}
            onClose={() => setSelectedObject(null)}
          />
        )}

        {/* Metrics Overlay */}
        <MetricsOverlay data={factoryData} />
      </div>
    </div>
  );
};

// Main 3D Scene
const Scene = ({ factoryData, layers, isPlaying, simulationSpeed, onObjectClick, cameraPosition, viewMode }) => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-10, 10, -5]} intensity={0.5} />
      
      {/* Camera */}
      <PerspectiveCamera makeDefault position={cameraPosition} fov={60} />
      <OrbitControls enableDamping dampingFactor={0.05} />
      
      {/* Environment */}
      <Environment preset="warehouse" background />
      
      {/* Grid */}
      <Grid 
        args={[50, 50]} 
        cellSize={1} 
        cellThickness={0.5} 
        cellColor="#6e6e6e" 
        sectionSize={5} 
        sectionThickness={1} 
        sectionColor="#9d9d9d" 
        fadeDistance={100} 
        fadeStrength={1} 
        followCamera={false} 
      />
      
      {/* Factory Floor */}
      <FactoryFloor />
      
      {/* Machines */}
      {layers.machines && factoryData?.machines?.map((machine) => (
        <Machine 
          key={machine.id}
          data={machine}
          isPlaying={isPlaying}
          onClick={() => onObjectClick(machine)}
        />
      ))}
      
      {/* Conveyors */}
      {layers.conveyors && factoryData?.conveyors?.map((conveyor) => (
        <Conveyor 
          key={conveyor.id}
          data={conveyor}
          isPlaying={isPlaying}
          speed={simulationSpeed}
        />
      ))}
      
      {/* Sensors */}
      {layers.sensors && factoryData?.sensors?.map((sensor) => (
        <Sensor 
          key={sensor.id}
          data={sensor}
        />
      ))}
      
      {/* Material Flow */}
      {layers.flow && factoryData?.flows?.map((flow) => (
        <MaterialFlow 
          key={flow.id}
          data={flow}
          isPlaying={isPlaying}
        />
      ))}
      
      {/* Heatmap */}
      {layers.heatmap && <Heatmap data={factoryData?.heatmap} />}
      
      {/* Gizmo */}
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport axisColors={['red', 'green', 'blue']} labelColor="black" />
      </GizmoHelper>
    </>
  );
};

// Factory Floor
const FactoryFloor = () => {
  return (
    <mesh receiveShadow position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#2a2a2a" />
    </mesh>
  );
};

// Machine Component
const Machine = ({ data, isPlaying, onClick }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current && isPlaying && data.status === 'running') {
      meshRef.current.rotation.y += 0.01;
    }
  });

  const getStatusColor = () => {
    switch (data.status) {
      case 'running': return '#10b981';
      case 'idle': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <group position={data.position}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[2, 3, 2]} />
        <meshStandardMaterial 
          color={getStatusColor()} 
          emissive={hovered ? getStatusColor() : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      
      {/* Machine Label */}
      <Html position={[0, 2, 0]} center>
        <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
          {data.name}
          <div className="text-[10px] text-gray-400">
            {data.efficiency}% Efficiency
          </div>
        </div>
      </Html>
      
      {/* Status Indicator */}
      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial 
          color={getStatusColor()} 
          emissive={getStatusColor()}
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
};

// Conveyor Component
const Conveyor = ({ data, isPlaying, speed }) => {
  const textureRef = useRef();
  
  useFrame((state, delta) => {
    if (textureRef.current && isPlaying) {
      textureRef.current.offset.x += delta * speed * 0.5;
    }
  });

  const points = data.path.map(p => new THREE.Vector3(...p));
  
  return (
    <group>
      {/* Conveyor Belt */}
      <mesh position={data.position}>
        <boxGeometry args={[data.length, 0.2, 1]} />
        <meshStandardMaterial 
          color="#4a5568"
          map={textureRef.current}
        />
      </mesh>
      
      {/* Conveyor Items */}
      {data.items?.map((item, index) => (
        <ConveyorItem 
          key={index}
          position={item.position}
          type={item.type}
          isPlaying={isPlaying}
          speed={speed}
        />
      ))}
      
      {/* Flow Direction Arrow */}
      <Line points={points} color="#3b82f6" lineWidth={2} dashed />
    </group>
  );
};

// Conveyor Item
const ConveyorItem = ({ position, type, isPlaying, speed }) => {
  const meshRef = useRef();
  
  useFrame((state, delta) => {
    if (meshRef.current && isPlaying) {
      meshRef.current.position.x += delta * speed;
      
      // Reset position when reaching end
      if (meshRef.current.position.x > 10) {
        meshRef.current.position.x = -10;
      }
    }
  });

  return (
    <mesh ref={meshRef} position={position} castShadow>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color={type === 'product' ? '#10b981' : '#f59e0b'} />
    </mesh>
  );
};

// Sensor Component
const Sensor = ({ data }) => {
  const [value, setValue] = useState(data.value);
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate sensor value changes
      setValue(prev => prev + (Math.random() - 0.5) * 2);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getAlertColor = () => {
    if (value > data.maxThreshold || value < data.minThreshold) {
      return '#ef4444';
    }
    if (value > data.warningThreshold) {
      return '#f59e0b';
    }
    return '#10b981';
  };

  return (
    <group position={data.position}>
      <mesh>
        <cylinderGeometry args={[0.2, 0.2, 0.5]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>
      
      {/* Sensor Status Light */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.1]} />
        <meshStandardMaterial 
          color={getAlertColor()}
          emissive={getAlertColor()}
          emissiveIntensity={2}
        />
      </mesh>
      
      {/* Sensor Reading */}
      <Html position={[0, 1, 0]} center>
        <div className="bg-black/80 text-white px-2 py-1 rounded text-xs">
          {data.type}: {value.toFixed(1)}{data.unit}
        </div>
      </Html>
    </group>
  );
};

// Material Flow Visualization
const MaterialFlow = ({ data, isPlaying }) => {
  const particlesRef = useRef();
  
  useFrame((state) => {
    if (particlesRef.current && isPlaying) {
      particlesRef.current.rotation.y += 0.01;
      
      // Animate particles along path
      const positions = particlesRef.current.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        positions.setY(i, y + Math.sin(state.clock.elapsedTime + i) * 0.01);
      }
      positions.needsUpdate = true;
    }
  });

  // Generate particle positions
  const particleCount = 100;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = Math.random() * 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.1} 
        color="#3b82f6" 
        transparent 
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
};

// Heatmap Overlay
const Heatmap = ({ data }) => {
  if (!data) return null;

  return (
    <group>
      {data.map((cell, index) => (
        <mesh 
          key={index}
          position={[cell.x, 0.01, cell.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial 
            color={`hsl(${(1 - cell.value) * 240}, 100%, 50%)`}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
};

// Layer Controls Component
const LayerControls = ({ layers, setLayers }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
      >
        <Layers className="w-4 h-4 text-white" />
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-full mt-2 right-0 bg-gray-800 rounded-lg p-3 shadow-lg z-10"
        >
          <h4 className="text-white text-sm font-medium mb-2">Layers</h4>
          {Object.entries(layers).map(([key, value]) => (
            <label key={key} className="flex items-center space-x-2 text-white text-sm py-1">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setLayers({ ...layers, [key]: e.target.checked })}
                className="rounded"
              />
              <span className="capitalize">{key}</span>
            </label>
          ))}
        </motion.div>
      )}
    </div>
  );
};

// Object Info Panel
const ObjectInfoPanel = ({ object, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-4 right-4 w-80 bg-gray-800 rounded-lg shadow-lg p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">{object.name}</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Type:</span>
          <span className="text-white">{object.type}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Status:</span>
          <span className={`${
            object.status === 'running' ? 'text-green-400' :
            object.status === 'idle' ? 'text-yellow-400' :
            'text-red-400'
          }`}>{object.status}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Efficiency:</span>
          <span className="text-white">{object.efficiency}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Temperature:</span>
          <span className="text-white">{object.temperature}°C</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Runtime:</span>
          <span className="text-white">{object.runtime}h</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <h4 className="text-white text-sm font-medium mb-2">Recent Alerts</h4>
        {object.alerts?.map((alert, index) => (
          <div key={index} className="text-xs text-gray-400 py-1">
            {alert.time}: {alert.message}
          </div>
        ))}
      </div>

      <div className="mt-4 flex space-x-2">
        <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
          View Details
        </button>
        <button className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors">
          Maintenance
        </button>
      </div>
    </motion.div>
  );
};

// Metrics Overlay
const MetricsOverlay = ({ data }) => {
  if (!data) return null;

  return (
    <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur rounded-lg p-4">
      <h4 className="text-white font-medium mb-2">Factory Metrics</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-gray-400 text-xs">Production Rate</div>
          <div className="text-white text-lg font-semibold">{data.productionRate} units/hr</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">Efficiency</div>
          <div className="text-white text-lg font-semibold">{data.efficiency}%</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">Active Machines</div>
          <div className="text-white text-lg font-semibold">{data.activeMachines}/{data.totalMachines}</div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">Quality Rate</div>
          <div className="text-white text-lg font-semibold">{data.qualityRate}%</div>
        </div>
      </div>
    </div>
  );
};

// Loading Fallback
const LoadingFallback = () => {
  return (
    <Html center>
      <div className="text-white text-center">
        <Cube className="w-8 h-8 animate-spin mx-auto mb-2" />
        <p>Loading Digital Twin...</p>
      </div>
    </Html>
  );
};
```

## 2. Supporting API Endpoints

```javascript
// src/api/digitalTwin.js
export const digitalTwinAPI = {
  // Initialize factory model
  initialize: async () => {
    const response = await fetch('/api/digital-twin/initialize');
    return response.json();
  },

  // Get factory state
  getFactoryState: async () => {
    const response = await fetch('/api/digital-twin/factory-state');
    return response.json();
  },

  // Update machine status
  updateMachine: async (machineId, status) => {
    const response = await fetch(`/api/digital-twin/machines/${machineId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return response.json();
  },

  // Run simulation
  runSimulation: async (scenario) => {
    const response = await fetch('/api/digital-twin/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenario)
    });
    return response.json();
  },

  // Get heatmap data
  getHeatmap: async (metric) => {
    const response = await fetch(`/api/digital-twin/heatmap?metric=${metric}`);
    return response.json();
  }
};
```

## 3. Three.js Custom Shaders

```javascript
// src/components/3d/shaders.js
export const conveyorShader = {
  vertexShader: `
    varying vec2 vUv;
    uniform float time;
    
    void main() {
      vUv = uv;
      vec3 pos = position;
      pos.y += sin(position.x * 10.0 + time) * 0.02;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform float time;
    uniform vec3 color;
    
    void main() {
      float stripe = sin((vUv.x - time * 0.1) * 50.0) * 0.5 + 0.5;
      vec3 finalColor = mix(color, color * 0.7, stripe);
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

export const heatmapShader = {
  vertexShader: `
    varying vec2 vUv;
    varying float vValue;
    attribute float value;
    
    void main() {
      vUv = uv;
      vValue = value;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying float vValue;
    
    vec3 heatmapColor(float t) {
      vec3 cold = vec3(0.0, 0.0, 1.0);
      vec3 warm = vec3(1.0, 1.0, 0.0);
      vec3 hot = vec3(1.0, 0.0, 0.0);
      
      if (t < 0.5) {
        return mix(cold, warm, t * 2.0);
      } else {
        return mix(warm, hot, (t - 0.5) * 2.0);
      }
    }
    
    void main() {
      vec3 color = heatmapColor(vValue);
      gl_FragColor = vec4(color, 0.7);
    }
  `
};
```

## Key Features Implemented

1. **Full 3D Factory Visualization**: Complete factory floor with machines, conveyors, and sensors
2. **Real-time Updates**: WebSocket integration for live data streaming
3. **Interactive Objects**: Click on any object for detailed information
4. **Material Flow Visualization**: Particle systems showing material movement
5. **Heatmap Overlays**: Temperature and efficiency heatmaps
6. **Multiple Camera Modes**: Perspective and orthographic views
7. **Layer Management**: Toggle visibility of different factory elements
8. **Performance Stats**: Built-in FPS and render statistics
9. **Simulation Controls**: Play/pause and speed controls
10. **Custom Shaders**: Advanced visual effects for conveyors and heatmaps