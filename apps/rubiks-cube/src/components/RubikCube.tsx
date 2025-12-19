import { useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Euler, Quaternion, Vector3, Matrix4 } from 'three'

// Colors for each face of the Rubik's cube (standard color scheme)
const COLORS = {
  white: '#ffffff',
  yellow: '#ffd500',
  red: '#b71234',
  orange: '#ff5800',
  blue: '#0046ad',
  green: '#009b48',
  black: '#1a1a1a',
}

// Standard cube face colors based on position
const getFaceColors = (x: number, y: number, z: number) => {
  const colors = [
    COLORS.black, // Right (+X)
    COLORS.black, // Left (-X)
    COLORS.black, // Top (+Y)
    COLORS.black, // Bottom (-Y)
    COLORS.black, // Front (+Z)
    COLORS.black, // Back (-Z)
  ]

  if (x === 1) colors[0] = COLORS.red
  if (x === -1) colors[1] = COLORS.orange
  if (y === 1) colors[2] = COLORS.yellow
  if (y === -1) colors[3] = COLORS.white
  if (z === 1) colors[4] = COLORS.green
  if (z === -1) colors[5] = COLORS.blue

  return colors
}

// Cubelet state interface
interface CubeletState {
  id: number
  position: Vector3
  quaternion: Quaternion
  colors: string[]
}

// Rotation axis types
export type Axis = 'x' | 'y' | 'z'

// Face names for easier understanding
export type Face = 'R' | 'L' | 'U' | 'D' | 'F' | 'B'

// Map face to axis and layer
const FACE_MAP: Record<Face, { axis: Axis; layer: number; direction: 1 | -1 }> = {
  R: { axis: 'x', layer: 1, direction: -1 },   // Right face
  L: { axis: 'x', layer: -1, direction: 1 },   // Left face
  U: { axis: 'y', layer: 1, direction: -1 },   // Up face
  D: { axis: 'y', layer: -1, direction: 1 },   // Down face
  F: { axis: 'z', layer: 1, direction: -1 },   // Front face
  B: { axis: 'z', layer: -1, direction: 1 },   // Back face
}

// Rotation animation state
interface RotationState {
  axis: Axis
  layer: number
  direction: 1 | -1
  progress: number
  cubelets: number[]
}

// Create initial cubelets
const createInitialCubelets = (): CubeletState[] => {
  const cubelets: CubeletState[] = []
  let id = 0
  const positions = [-1, 0, 1]

  for (const x of positions) {
    for (const y of positions) {
      for (const z of positions) {
        cubelets.push({
          id: id++,
          position: new Vector3(x, y, z),
          quaternion: new Quaternion(),
          colors: getFaceColors(x, y, z),
        })
      }
    }
  }

  return cubelets
}

// Get cubelets on a specific layer
const getCubeletsOnLayer = (cubelets: CubeletState[], axis: Axis, layer: number): number[] => {
  return cubelets
    .filter((c) => Math.round(c.position[axis]) === layer)
    .map((c) => c.id)
}

// Rotate a position around an axis
const rotatePosition = (position: Vector3, axis: Axis, angle: number): Vector3 => {
  const newPos = position.clone()
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  if (axis === 'x') {
    const y = newPos.y * cos - newPos.z * sin
    const z = newPos.y * sin + newPos.z * cos
    newPos.y = Math.round(y)
    newPos.z = Math.round(z)
  } else if (axis === 'y') {
    const x = newPos.x * cos + newPos.z * sin
    const z = -newPos.x * sin + newPos.z * cos
    newPos.x = Math.round(x)
    newPos.z = Math.round(z)
  } else if (axis === 'z') {
    const x = newPos.x * cos - newPos.y * sin
    const y = newPos.x * sin + newPos.y * cos
    newPos.x = Math.round(x)
    newPos.y = Math.round(y)
  }

  return newPos
}

// Create rotation quaternion for an axis
const createRotationQuaternion = (axis: Axis, angle: number): Quaternion => {
  const euler = new Euler()
  if (axis === 'x') euler.set(angle, 0, 0)
  else if (axis === 'y') euler.set(0, angle, 0)
  else euler.set(0, 0, angle)
  return new Quaternion().setFromEuler(euler)
}

interface CubieProps {
  cubelet: CubeletState
  animationRotation?: { axis: Axis; angle: number } | null
}

function Cubie({ cubelet, animationRotation }: CubieProps) {
  const groupRef = useRef<Group>(null)

  useFrame(() => {
    if (!groupRef.current) return

    const displayMatrix = new Matrix4()
    displayMatrix.makeRotationFromQuaternion(cubelet.quaternion)
    displayMatrix.setPosition(cubelet.position)

    if (animationRotation) {
      const animQuat = createRotationQuaternion(animationRotation.axis, animationRotation.angle)
      const rotMatrix = new Matrix4().makeRotationFromQuaternion(animQuat)
      displayMatrix.premultiply(rotMatrix)
    }

    groupRef.current.matrix.copy(displayMatrix)
  })

  return (
    <group ref={groupRef} matrixAutoUpdate={false}>
      <mesh>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color={cubelet.colors[0]} attach="material-0" />
        <meshStandardMaterial color={cubelet.colors[1]} attach="material-1" />
        <meshStandardMaterial color={cubelet.colors[2]} attach="material-2" />
        <meshStandardMaterial color={cubelet.colors[3]} attach="material-3" />
        <meshStandardMaterial color={cubelet.colors[4]} attach="material-4" />
        <meshStandardMaterial color={cubelet.colors[5]} attach="material-5" />
      </mesh>
    </group>
  )
}

// Exposed methods for external control
export interface RubikCubeHandle {
  rotate: (face: Face, prime?: boolean) => void
  shuffle: () => void
  reset: () => void
  isAnimating: () => boolean
}

const ROTATION_SPEED = 6 // radians per second

const RubikCube = forwardRef<RubikCubeHandle>(function RubikCube(_, ref) {
  const groupRef = useRef<Group>(null)
  const [cubelets, setCubelets] = useState<CubeletState[]>(createInitialCubelets)
  const [rotation, setRotation] = useState<RotationState | null>(null)

  // Handle rotation animation
  useFrame((_, delta) => {
    if (!rotation) return

    const newProgress = rotation.progress + delta * ROTATION_SPEED
    const targetAngle = (Math.PI / 2) * rotation.direction

    if (newProgress >= Math.PI / 2) {
      // Animation complete - update cubelet states
      setCubelets((prev) => {
        return prev.map((cubelet) => {
          if (!rotation.cubelets.includes(cubelet.id)) return cubelet

          // Apply final rotation to position and quaternion
          const newPosition = rotatePosition(cubelet.position, rotation.axis, targetAngle)
          const rotQuat = createRotationQuaternion(rotation.axis, targetAngle)
          const newQuaternion = rotQuat.multiply(cubelet.quaternion)

          return {
            ...cubelet,
            position: newPosition,
            quaternion: newQuaternion,
          }
        })
      })
      setRotation(null)
    } else {
      setRotation({ ...rotation, progress: newProgress })
    }
  })

  // Start a rotation
  const startRotation = useCallback(
    (axis: Axis, layer: number, direction: 1 | -1) => {
      if (rotation) return false // Already rotating
      const cubeletsOnLayer = getCubeletsOnLayer(cubelets, axis, layer)
      setRotation({
        axis,
        layer,
        direction,
        progress: 0,
        cubelets: cubeletsOnLayer,
      })
      return true
    },
    [cubelets, rotation]
  )

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    rotate: (face: Face, prime = false) => {
      const { axis, layer, direction } = FACE_MAP[face]
      const finalDirection = prime ? (-direction as 1 | -1) : direction
      startRotation(axis, layer, finalDirection)
    },
    shuffle: () => {
      // Queue random moves (simplified - just do one at a time)
      const faces: Face[] = ['R', 'L', 'U', 'D', 'F', 'B']
      const randomFace = faces[Math.floor(Math.random() * faces.length)]
      const prime = Math.random() > 0.5
      const { axis, layer, direction } = FACE_MAP[randomFace]
      const finalDirection = prime ? (-direction as 1 | -1) : direction
      startRotation(axis, layer, finalDirection)
    },
    reset: () => {
      setRotation(null)
      setCubelets(createInitialCubelets())
    },
    isAnimating: () => rotation !== null,
  }), [rotation, startRotation])

  // Calculate animation rotation for each cubelet
  const getAnimationRotation = (cubeletId: number) => {
    if (!rotation || !rotation.cubelets.includes(cubeletId)) return null
    return {
      axis: rotation.axis,
      angle: rotation.progress * rotation.direction,
    }
  }

  return (
    <group ref={groupRef}>
      {cubelets.map((cubelet) => (
        <Cubie
          key={cubelet.id}
          cubelet={cubelet}
          animationRotation={getAnimationRotation(cubelet.id)}
        />
      ))}
    </group>
  )
})

export default RubikCube
