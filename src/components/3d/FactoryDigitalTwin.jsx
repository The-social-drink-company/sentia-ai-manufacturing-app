import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment,
  Float,
  SpotLight,
  useGLTF,
  Text3D,
  Center,
  Sparkles,
  Cloud,
  Stars,
  useTexture,
  MeshReflectorMaterial,
  Box,
  Sphere,
  Cylinder,
  Torus,
  useHelper,
  Html,
  Billboard,
  Trail,
  ContactShadows
} from '@react-three/drei';
// Temporarily disable post-processing effects for build compatibility
// import {
//   EffectComposer,
//   Bloom,
//   ChromaticAberration,
//   DepthOfField,
//   Noise,
//   Vignette
// } from '@react-three/postprocessing';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';

// Production Line Component
function ProductionLine({ position, status, productivity, temperature }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Animate based on productivity
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += productivity * 0.01;
      
      // Pulse effect for active machines
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      meshRef.current.scale.setScalar(scale);
    }
  });

  const { scale } = useSpring({
    scale: hovered ? 1.1 : 1,
    config: { mass: 1, tension: 280, friction: 60 }
  });

  const getStatusColor = () => {
    switch(status) {
      case 'running': return '#00ff00';
      case 'warning': return '#ffaa00';
      case 'error': return '#ff0000';
      default: return '#808080';
    }
  };

  return (
    <group position={position}>
      <animated.mesh
        ref={meshRef}
        scale={scale}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => setShowDetails(!showDetails)}
      >
        <Box args={[2, 3, 4]}>
          <meshStandardMaterial 
            color={getStatusColor()} 
            metalness={0.8} 
            roughness={0.2}
            emissive={getStatusColor()}
            emissiveIntensity={0.2}
          />
        </Box>
        
        {/* Status indicator light */}
        <pointLight 
          color={getStatusColor()} 
          intensity={2} 
          distance={10} 
          position={[0, 2, 0]}
        />
        
        {/* Holographic display */}
        {showDetails && (
          <Html distanceFactor={10} position={[0, 4, 0]}>
            <div className="bg-black/90 text-green-400 p-4 rounded-lg backdrop-blur-lg border border-green-500 min-w-[200px]">
              <h3 className="text-lg font-bold mb-2">Production Line A1</h3>
              <div className="space-y-1 text-sm">
                <p>Status: <span className="text-yellow-400">{status}</span></p>
                <p>Productivity: <span className="text-cyan-400">{(productivity * 100).toFixed(1)}%</span></p>
                <p>Temperature: <span className="text-orange-400">{temperature}°C</span></p>
                <p>Units/Hour: <span className="text-white">1,247</span></p>
              </div>
            </div>
          </Html>
        )}
      </animated.mesh>

      {/* Particle effects for active machinery */}
      {status === 'running' && (
        <Sparkles
          count={50}
          scale={4}
          size={2}
          speed={0.5}
          color={getStatusColor()}
        />
      )}
    </group>
  );
}

// Conveyor Belt with Moving Products
function ConveyorBelt({ start, end }) {
  const productsRef = useRef([]);
  
  useFrame((state) => {
    productsRef.current.forEach((product, i) => {
      if (product) {
        product.position.x += 0.02;
        if (product.position.x > end[0]) {
          product.position.x = start[0];
        }
        product.rotation.y += 0.05;
      }
    });
  });

  return (
    <group>
      {/* Belt */}
      <mesh position={[(start[0] + end[0]) / 2, 0, 0]}>
        <Box args={[end[0] - start[0], 0.1, 1]}>
          <meshStandardMaterial color="#333333" metalness={0.5} roughness={0.5} />
        </Box>
      </mesh>
      
      {/* Products on belt */}
      {[...Array(5)].map((_, i) => (
        <mesh
          key={i}
          ref={el => productsRef.current[i] = el}
          position={[start[0] + i * 3, 0.5, 0]}
        >
          <Box args={[0.5, 0.5, 0.5]}>
            <meshStandardMaterial color="#4a90e2" metalness={0.7} roughness={0.3} />
          </Box>
        </mesh>
      ))}
    </group>
  );
}

// Robot Arm
function RobotArm({ position }) {
  const armRef = useRef();
  const [isWorking, setIsWorking] = useState(true);

  useFrame((state) => {
    if (armRef.current && isWorking) {
      const time = state.clock.elapsedTime;
      armRef.current.rotation.y = Math.sin(time) * 0.5;
      armRef.current.children[0].rotation.x = Math.sin(time * 2) * 0.3;
    }
  });

  return (
    <group ref={armRef} position={position}>
      <Cylinder args={[0.3, 0.3, 2]} position={[0, 1, 0]}>
        <meshStandardMaterial color="#ff6b6b" metalness={0.9} roughness={0.1} />
      </Cylinder>
      <group position={[0, 2, 0]}>
        <Cylinder args={[0.2, 0.2, 1.5]} rotation={[0, 0, Math.PI / 4]}>
          <meshStandardMaterial color="#ff6b6b" metalness={0.9} roughness={0.1} />
        </Cylinder>
      </group>
    </group>
  );
}

// HUD Overlay
function HUD() {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 p-6 pointer-events-none">
      <div className="flex justify-between items-start">
        <div className="bg-black/50 backdrop-blur-lg rounded-lg p-4 border border-cyan-500/50">
          <h2 className="text-cyan-400 text-2xl font-bold mb-2">FACTORY CONTROL</h2>
          <p className="text-green-400 font-mono">{time.toLocaleTimeString()}</p>
          <div className="mt-2 space-y-1">
            <p className="text-white text-sm">Production Rate: <span className="text-yellow-400">94.7%</span></p>
            <p className="text-white text-sm">Active Lines: <span className="text-green-400">12/14</span></p>
            <p className="text-white text-sm">System Health: <span className="text-green-400">OPTIMAL</span></p>
          </div>
        </div>
        
        <div className="bg-black/50 backdrop-blur-lg rounded-lg p-4 border border-orange-500/50">
          <h3 className="text-orange-400 font-bold mb-2">ALERTS</h3>
          <div className="space-y-1 text-sm">
            <p className="text-yellow-300">⚠ Line 7: Maintenance in 2 hours</p>
            <p className="text-green-300">✓ Line 3: Efficiency improved 12%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Factory Digital Twin Component
export default function FactoryDigitalTwin() {
  const [cameraPosition, setCameraPosition] = useState([20, 15, 20]);
  const [selectedLine, setSelectedLine] = useState(null);

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-gray-900 to-black">
      <HUD />
      
      <Canvas shadows dpr={[1, 2]}>
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.2} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <SpotLight
            position={[0, 20, 0]}
            angle={0.3}
            penumbra={1}
            intensity={2}
            castShadow
            color="#00ff00"
          />
          
          {/* Environment */}
          <Environment preset="warehouse" />
          <fog attach="fog" args={['#000000', 10, 100]} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
          
          {/* Factory Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <MeshReflectorMaterial
              blur={[300, 100]}
              resolution={2048}
              mixBlur={1}
              mixStrength={40}
              roughness={1}
              depthScale={1.2}
              minDepthThreshold={0.4}
              maxDepthThreshold={1.4}
              color="#101010"
              metalness={0.5}
            />
          </mesh>
          
          {/* Production Lines */}
          <ProductionLine position={[-8, 1.5, -5]} status="running" productivity={0.95} temperature={72} />
          <ProductionLine position={[0, 1.5, -5]} status="running" productivity={0.88} temperature={68} />
          <ProductionLine position={[8, 1.5, -5]} status="warning" productivity={0.65} temperature={85} />
          <ProductionLine position={[-8, 1.5, 5]} status="running" productivity={0.92} temperature={70} />
          <ProductionLine position={[0, 1.5, 5]} status="error" productivity={0} temperature={95} />
          <ProductionLine position={[8, 1.5, 5]} status="running" productivity={0.97} temperature={71} />
          
          {/* Conveyor Belts */}
          <ConveyorBelt start={[-15, 0.5, 0]} end={[15, 0.5, 0]} />
          
          {/* Robot Arms */}
          <RobotArm position={[-5, 0, 0]} />
          <RobotArm position={[5, 0, 0]} />
          
          {/* Camera Controls */}
          <PerspectiveCamera makeDefault position={cameraPosition} fov={60} />
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={50}
            maxPolarAngle={Math.PI * 0.45}
          />
          
          {/* Post-processing Effects - Temporarily disabled for build compatibility */}
          {/* <EffectComposer>
            <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} />
            <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
            <Noise opacity={0.02} />
            <Vignette eskil={false} offset={0.1} darkness={0.5} />
          </EffectComposer> */}
          
          {/* Contact Shadows */}
          <ContactShadows 
            rotation-x={Math.PI / 2} 
            position={[0, -0.08, 0]} 
            opacity={0.4} 
            width={100} 
            height={100} 
            blur={2} 
            far={50} 
          />
        </Suspense>
      </Canvas>
      
      {/* Control Panel */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="bg-black/70 backdrop-blur-lg rounded-lg p-4 border border-cyan-500/50">
          <div className="flex justify-center space-x-4">
            <button className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors">
              Overview
            </button>
            <button className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
              Production Lines
            </button>
            <button className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
              Quality Control
            </button>
            <button className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
              Maintenance
            </button>
            <button className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors">
              AI Insights
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}