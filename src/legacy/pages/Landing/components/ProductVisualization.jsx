import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere, Torus, OrbitControls, Stars, Cloud } from '@react-three/drei';
import * as THREE from 'three';

const ProductVisualization = () => {
  const meshRef = useRef();
  const groupRef = useRef();

  // Animate the main mesh
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#ff0080" />

      {/* Background */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* Main 3D Objects */}
      <group ref={groupRef}>
        {/* Central Cube - representing the factory */}
        <mesh ref={meshRef} position={[0, 0, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial
            color="#4f46e5"
            metalness={0.8}
            roughness={0.2}
            emissive="#4f46e5"
            emissiveIntensity={0.2}
          />
        </mesh>

        {/* Orbiting spheres - representing data points */}
        <Sphere args={[0.3, 32, 32]} position={[3, 0, 0]}>
          <meshStandardMaterial color="#06b6d4" metalness={0.9} roughness={0.1} />
        </Sphere>

        <Sphere args={[0.2, 32, 32]} position={[-3, 1, 0]}>
          <meshStandardMaterial color="#10b981" metalness={0.9} roughness={0.1} />
        </Sphere>

        <Sphere args={[0.25, 32, 32]} position={[0, 2.5, 1]}>
          <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.1} />
        </Sphere>

        {/* Torus - representing workflow */}
        <Torus args={[3, 0.1, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial
            color="#8b5cf6"
            metalness={0.7}
            roughness={0.3}
            emissive="#8b5cf6"
            emissiveIntensity={0.1}
          />
        </Torus>

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => {
          const angle = (i / 20) * Math.PI * 2;
          const radius = 4 + (i % 3) * 0.5;
          const position = [
            Math.cos(angle) * radius,
            (Math.sin(angle * 2) * 2),
            Math.sin(angle) * radius
          ];
          return (
            <Sphere key={i} args={[0.05, 16, 16]} position={position}>
              <meshStandardMaterial
                color={['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][i % 5]}
                emissive={['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][i % 5]}
                emissiveIntensity={0.5}
              />
            </Sphere>
          );
        })}
      </group>

      {/* Grid floor */}
      <gridHelper args={[20, 20, '#4f46e5', '#1e293b']} position={[0, -3, 0]} />

      {/* Camera controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 3}
      />
    </>
  );
};

export default ProductVisualization;