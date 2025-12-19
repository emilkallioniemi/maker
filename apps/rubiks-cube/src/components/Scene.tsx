import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import RubikCube, { type RubikCubeHandle } from './RubikCube'

interface SceneProps {
  cubeRef: React.RefObject<RubikCubeHandle | null>
}

export default function Scene({ cubeRef }: SceneProps) {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[5, 5, 5]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
      <RubikCube ref={cubeRef} />
      <OrbitControls enableDamping dampingFactor={0.05} />
    </Canvas>
  )
}
