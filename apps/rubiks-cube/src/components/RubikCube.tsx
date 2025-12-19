import { useRef } from 'react'
import { Mesh, Group } from 'three'

// Colors for each face of the Rubik's cube
const COLORS = {
  white: '#ffffff',
  yellow: '#ffff00',
  red: '#ff0000',
  orange: '#ff8800',
  blue: '#0000ff',
  green: '#00ff00',
  black: '#000000',
}

// Face colors for each cubie position
// Format: [right, left, top, bottom, front, back]
const getCubieColors = (x: number, y: number, z: number) => {
  const colors = [COLORS.black, COLORS.black, COLORS.black, COLORS.black, COLORS.black, COLORS.black]
  
  // Right face (x = 1)
  if (x === 1) colors[0] = COLORS.red
  // Left face (x = -1)
  if (x === -1) colors[1] = COLORS.orange
  // Top face (y = 1)
  if (y === 1) colors[2] = COLORS.yellow
  // Bottom face (y = -1)
  if (y === -1) colors[3] = COLORS.white
  // Front face (z = 1)
  if (z === 1) colors[4] = COLORS.green
  // Back face (z = -1)
  if (z === -1) colors[5] = COLORS.blue
  
  return colors
}

interface CubieProps {
  position: [number, number, number]
  colors: string[]
}

function Cubie({ position, colors }: CubieProps) {
  const meshRef = useRef<Mesh>(null)
  
  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.9, 0.9, 0.9]} />
      <meshStandardMaterial color={colors[0]} attach="material-0" /> {/* Right */}
      <meshStandardMaterial color={colors[1]} attach="material-1" /> {/* Left */}
      <meshStandardMaterial color={colors[2]} attach="material-2" /> {/* Top */}
      <meshStandardMaterial color={colors[3]} attach="material-3" /> {/* Bottom */}
      <meshStandardMaterial color={colors[4]} attach="material-4" /> {/* Front */}
      <meshStandardMaterial color={colors[5]} attach="material-5" /> {/* Back */}
    </mesh>
  )
}

export default function RubikCube() {
  const groupRef = useRef<Group>(null)
  
  const cubies = []
  const positions = [-1, 0, 1]
  
  // Generate all 27 cubies (3x3x3)
  for (const x of positions) {
    for (const y of positions) {
      for (const z of positions) {
        const colors = getCubieColors(x, y, z)
        cubies.push({
          position: [x, y, z] as [number, number, number],
          colors,
        })
      }
    }
  }
  
  return (
    <group ref={groupRef}>
      {cubies.map((cubie, index) => (
        <Cubie key={index} position={cubie.position} colors={cubie.colors} />
      ))}
    </group>
  )
}

