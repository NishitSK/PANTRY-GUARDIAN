"use client"

import { useRef, useMemo, Component, ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, ContactShadows, Float } from '@react-three/drei'
import * as THREE from 'three'

// Error Boundary to gracefully handle 3D crashes
class ErrorBoundary extends Component<{ children: ReactNode, fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("3D Error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

function ProceduralBanana(props: any) {
  const meshRef = useRef<THREE.Group>(null)

  // Create a banana shape using a curved tube
  const geometry = useMemo(() => {
    // Define points for a curved banana shape
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.8, -0.2, 0),
      new THREE.Vector3(-0.4, 0.1, 0),
      new THREE.Vector3(0, 0.2, 0),
      new THREE.Vector3(0.4, 0.1, 0),
      new THREE.Vector3(0.8, -0.2, 0),
    ])
    
    // Tube geometry: path, segments, radius, radialSegments, closed
    return new THREE.TubeGeometry(curve, 64, 0.25, 16, false)
  }, [])

  useFrame((state) => {
    if (meshRef.current) {
        // Rotation based on scroll
        meshRef.current.rotation.y = state.clock.elapsedTime * 0.5 + (window.scrollY * 0.005)
        meshRef.current.rotation.x = window.scrollY * 0.002
    }
  })

  return (
    <group ref={meshRef} {...props}>
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh geometry={geometry}>
                <meshPhysicalMaterial 
                    color="#FFE135" 
                    roughness={0.3} 
                    metalness={0.1} 
                    clearcoat={0.1}
                />
            </mesh>
            {/* Stem (Green tip) */}
            <mesh position={[-0.82, -0.2, 0]} rotation={[0, 0, 0.5]}>
                <cylinderGeometry args={[0.08, 0.12, 0.3, 8]} />
                <meshStandardMaterial color="#4ade80" />
            </mesh>
             {/* Bottom tip (Dark) */}
             <mesh position={[0.82, -0.2, 0]} rotation={[0, 0, -0.5]}>
                <cylinderGeometry args={[0.02, 0.12, 0.15, 8]} />
                <meshStandardMaterial color="#3f3f3f" />
            </mesh>
        </Float>
    </group>
  )
}

export default function Banana3D() {
  return (
    <ErrorBoundary fallback={
        <img 
            src="/banana-3d.png" 
            alt="Floating 3D Banana Fallback" 
            className="w-full h-full object-contain drop-shadow-2xl"
        />
    }>
        <div className="w-full h-full">
        <Canvas style={{ background: 'transparent' }} camera={{ position: [0, 0, 4], fov: 45 }}>
            <ambientLight intensity={0.8} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            
            <ProceduralBanana scale={[3, 3, 3]} rotation={[0.2, 0, 0]} />
            
            <Environment preset="city" />
            <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
        </Canvas>
        </div>
    </ErrorBoundary>
  )
}
