import {
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Euler, Quaternion, Vector3, Matrix4 } from "three";

// Colors for each face of the Rubik's cube (standard color scheme)
const COLORS = {
  white: "#ffffff",
  yellow: "#ffd500",
  red: "#b71234",
  orange: "#ff5800",
  blue: "#0046ad",
  green: "#009b48",
  black: "#1a1a1a",
};

// Color to letter mapping for state representation
const COLOR_TO_LETTER: Record<string, string> = {
  [COLORS.white]: "W",
  [COLORS.yellow]: "Y",
  [COLORS.red]: "R",
  [COLORS.orange]: "O",
  [COLORS.blue]: "B",
  [COLORS.green]: "G",
  [COLORS.black]: "X",
};

// Get color letter from hex
const getColorLetter = (color: string): string => {
  return COLOR_TO_LETTER[color] || "X";
};

// Standard cube face colors based on position
const getFaceColors = (x: number, y: number, z: number) => {
  const colors = [
    COLORS.black, // Right (+X)
    COLORS.black, // Left (-X)
    COLORS.black, // Top (+Y)
    COLORS.black, // Bottom (-Y)
    COLORS.black, // Front (+Z)
    COLORS.black, // Back (-Z)
  ];

  if (x === 1) colors[0] = COLORS.red;
  if (x === -1) colors[1] = COLORS.orange;
  if (y === 1) colors[2] = COLORS.yellow;
  if (y === -1) colors[3] = COLORS.white;
  if (z === 1) colors[4] = COLORS.green;
  if (z === -1) colors[5] = COLORS.blue;

  return colors;
};

// Cubelet state interface
interface CubeletState {
  id: number;
  position: Vector3;
  quaternion: Quaternion;
  colors: string[];
}

// Rotation axis types
export type Axis = "x" | "y" | "z";

// Face names for easier understanding
export type Face = "R" | "L" | "U" | "D" | "F" | "B";

// Map face to axis and layer
const FACE_MAP: Record<Face, { axis: Axis; layer: number; direction: 1 | -1 }> =
  {
    R: { axis: "x", layer: 1, direction: -1 }, // Right face
    L: { axis: "x", layer: -1, direction: 1 }, // Left face
    U: { axis: "y", layer: 1, direction: -1 }, // Up face
    D: { axis: "y", layer: -1, direction: 1 }, // Down face
    F: { axis: "z", layer: 1, direction: -1 }, // Front face
    B: { axis: "z", layer: -1, direction: 1 }, // Back face
  };

// Rotation animation state
interface RotationState {
  axis: Axis;
  layer: number;
  direction: 1 | -1;
  progress: number;
  cubelets: number[];
}

// Create initial cubelets
const createInitialCubelets = (): CubeletState[] => {
  const cubelets: CubeletState[] = [];
  let id = 0;
  const positions = [-1, 0, 1];

  for (const x of positions) {
    for (const y of positions) {
      for (const z of positions) {
        cubelets.push({
          id: id++,
          position: new Vector3(x, y, z),
          quaternion: new Quaternion(),
          colors: getFaceColors(x, y, z),
        });
      }
    }
  }

  return cubelets;
};

// Get cubelets on a specific layer
const getCubeletsOnLayer = (
  cubelets: CubeletState[],
  axis: Axis,
  layer: number
): number[] => {
  return cubelets
    .filter((c) => Math.round(c.position[axis]) === layer)
    .map((c) => c.id);
};

// Rotate a position around an axis
const rotatePosition = (
  position: Vector3,
  axis: Axis,
  angle: number
): Vector3 => {
  const newPos = position.clone();
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  if (axis === "x") {
    const y = newPos.y * cos - newPos.z * sin;
    const z = newPos.y * sin + newPos.z * cos;
    newPos.y = Math.round(y);
    newPos.z = Math.round(z);
  } else if (axis === "y") {
    const x = newPos.x * cos + newPos.z * sin;
    const z = -newPos.x * sin + newPos.z * cos;
    newPos.x = Math.round(x);
    newPos.z = Math.round(z);
  } else if (axis === "z") {
    const x = newPos.x * cos - newPos.y * sin;
    const y = newPos.x * sin + newPos.y * cos;
    newPos.x = Math.round(x);
    newPos.y = Math.round(y);
  }

  return newPos;
};

// Create rotation quaternion for an axis
const createRotationQuaternion = (axis: Axis, angle: number): Quaternion => {
  const euler = new Euler();
  if (axis === "x") euler.set(angle, 0, 0);
  else if (axis === "y") euler.set(0, angle, 0);
  else euler.set(0, 0, angle);
  return new Quaternion().setFromEuler(euler);
};

interface CubieProps {
  cubelet: CubeletState;
  animationRotation?: { axis: Axis; angle: number } | null;
}

function Cubie({ cubelet, animationRotation }: CubieProps) {
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;

    const displayMatrix = new Matrix4();
    displayMatrix.makeRotationFromQuaternion(cubelet.quaternion);
    displayMatrix.setPosition(cubelet.position);

    if (animationRotation) {
      const animQuat = createRotationQuaternion(
        animationRotation.axis,
        animationRotation.angle
      );
      const rotMatrix = new Matrix4().makeRotationFromQuaternion(animQuat);
      displayMatrix.premultiply(rotMatrix);
    }

    groupRef.current.matrix.copy(displayMatrix);
  });

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
  );
}

// Cube state representation (6 faces, each 3x3 grid)
export interface CubeState {
  U: string[][]; // Up (Top) face
  D: string[][]; // Down (Bottom) face
  F: string[][]; // Front face
  B: string[][]; // Back face
  R: string[][]; // Right face
  L: string[][]; // Left face
}

// Get the color facing outward for a cubelet on a specific face
const getFaceColor = (cubelet: CubeletState, face: Face): string => {
  const pos = cubelet.position;
  const quat = cubelet.quaternion;

  // Face direction vectors in world space
  const faceDirs: Record<Face, Vector3> = {
    U: new Vector3(0, 1, 0), // Up
    D: new Vector3(0, -1, 0), // Down
    F: new Vector3(0, 0, 1), // Front
    B: new Vector3(0, 0, -1), // Back
    R: new Vector3(1, 0, 0), // Right
    L: new Vector3(-1, 0, 0), // Left
  };

  // Local face direction vectors (before rotation)
  // colors[0]=Right(+X), [1]=Left(-X), [2]=Top(+Y), [3]=Bottom(-Y), [4]=Front(+Z), [5]=Back(-Z)
  const localDirs: Vector3[] = [
    new Vector3(1, 0, 0), // Right
    new Vector3(-1, 0, 0), // Left
    new Vector3(0, 1, 0), // Top
    new Vector3(0, -1, 0), // Bottom
    new Vector3(0, 0, 1), // Front
    new Vector3(0, 0, -1), // Back
  ];

  const targetDir = faceDirs[face];

  // Transform target direction to local space
  const invQuat = quat.clone().invert();
  const localTarget = targetDir.clone().applyQuaternion(invQuat);

  // Find which local direction is closest to the target
  let bestMatch = 0;
  let bestDot = localDirs[0].dot(localTarget);

  for (let i = 1; i < 6; i++) {
    const dot = localDirs[i].dot(localTarget);
    if (dot > bestDot) {
      bestDot = dot;
      bestMatch = i;
    }
  }

  return cubelet.colors[bestMatch];
};

// Get cube state from cubelets
const getCubeState = (cubelets: CubeletState[]): CubeState => {
  const state: CubeState = {
    U: [[], [], []],
    D: [[], [], []],
    F: [[], [], []],
    B: [[], [], []],
    R: [[], [], []],
    L: [[], [], []],
  };

  // For each face, get the 9 cubelets on that face
  const faceLayers: Record<Face, { axis: Axis; layer: number }> = {
    U: { axis: "y", layer: 1 },
    D: { axis: "y", layer: -1 },
    F: { axis: "z", layer: 1 },
    B: { axis: "z", layer: -1 },
    R: { axis: "x", layer: 1 },
    L: { axis: "x", layer: -1 },
  };

  for (const [face, { axis, layer }] of Object.entries(faceLayers) as [
    Face,
    { axis: Axis; layer: number }
  ][]) {
    const faceCubelets = cubelets.filter(
      (c) => Math.round(c.position[axis]) === layer
    );

    // Sort cubelets by position to create 3x3 grid
    // For U/D: sort by z then x
    // For F/B: sort by y then x
    // For R/L: sort by y then z
    faceCubelets.sort((a, b) => {
      if (axis === "y") {
        // U/D: sort by z (desc), then x (asc)
        if (Math.round(b.position.z) !== Math.round(a.position.z)) {
          return Math.round(b.position.z) - Math.round(a.position.z);
        }
        return Math.round(a.position.x) - Math.round(b.position.x);
      } else if (axis === "z") {
        // F/B: sort by y (desc), then x (asc)
        if (Math.round(b.position.y) !== Math.round(a.position.y)) {
          return Math.round(b.position.y) - Math.round(a.position.y);
        }
        return Math.round(a.position.x) - Math.round(b.position.x);
      } else {
        // R/L: sort by y (desc), then z (asc for R, desc for L)
        if (Math.round(b.position.y) !== Math.round(a.position.y)) {
          return Math.round(b.position.y) - Math.round(a.position.y);
        }
        return face === "R"
          ? Math.round(a.position.z) - Math.round(b.position.z)
          : Math.round(b.position.z) - Math.round(a.position.z);
      }
    });

    // Fill the 3x3 grid
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const idx = row * 3 + col;
        const cubelet = faceCubelets[idx];
        const color = cubelet ? getFaceColor(cubelet, face) : COLORS.black;
        state[face][row][col] = getColorLetter(color);
      }
    }
  }

  return state;
};

// Exposed methods for external control
export interface RubikCubeHandle {
  rotate: (face: Face, prime?: boolean) => void;
  shuffle: () => void;
  reset: () => void;
  isAnimating: () => boolean;
  getState: () => CubeState;
}

const ROTATION_SPEED = 6; // radians per second

const RubikCube = forwardRef<RubikCubeHandle>(function RubikCube(_, ref) {
  const groupRef = useRef<Group>(null);
  const [cubelets, setCubelets] = useState<CubeletState[]>(
    createInitialCubelets
  );
  const [rotation, setRotation] = useState<RotationState | null>(null);
  const [lastMove, setLastMove] = useState<{
    face: Face;
    prime: boolean;
  } | null>(null);

  // Handle rotation animation
  useFrame((_, delta) => {
    if (!rotation) return;

    const newProgress = rotation.progress + delta * ROTATION_SPEED;
    const targetAngle = (Math.PI / 2) * rotation.direction;

    if (newProgress >= Math.PI / 2) {
      // Animation complete - update cubelet states
      setCubelets((prev) => {
        return prev.map((cubelet) => {
          if (!rotation.cubelets.includes(cubelet.id)) return cubelet;

          // Apply final rotation to position and quaternion
          const newPosition = rotatePosition(
            cubelet.position,
            rotation.axis,
            targetAngle
          );
          const rotQuat = createRotationQuaternion(rotation.axis, targetAngle);
          const newQuaternion = rotQuat.multiply(cubelet.quaternion);

          return {
            ...cubelet,
            position: newPosition,
            quaternion: newQuaternion,
          };
        });
      });
      setRotation(null);
    } else {
      setRotation({ ...rotation, progress: newProgress });
    }
  });

  // Get valid moves that don't undo the previous move
  const getValidMoves = useCallback(
    (lastMove: { face: Face; prime: boolean } | null) => {
      const faces: Face[] = ["R", "L", "U", "D", "F", "B"];
      const allMoves = faces.flatMap((face) => [
        { face, prime: false },
        { face, prime: true },
      ]);

      if (!lastMove) return allMoves;

      // Filter out moves that undo the last move
      return allMoves.filter(
        (move) =>
          !(move.face === lastMove.face && move.prime !== lastMove.prime)
      );
    },
    []
  );

  // Start a rotation
  const startRotation = useCallback(
    (axis: Axis, layer: number, direction: 1 | -1) => {
      if (rotation) return false; // Already rotating
      const cubeletsOnLayer = getCubeletsOnLayer(cubelets, axis, layer);
      setRotation({
        axis,
        layer,
        direction,
        progress: 0,
        cubelets: cubeletsOnLayer,
      });
      return true;
    },
    [cubelets, rotation]
  );

  // Expose methods to parent
  useImperativeHandle(
    ref,
    () => ({
      rotate: (face: Face, prime = false) => {
        const { axis, layer, direction } = FACE_MAP[face];
        const finalDirection = prime ? (-direction as 1 | -1) : direction;
        if (startRotation(axis, layer, finalDirection)) {
          setLastMove({ face, prime });
        }
      },
      shuffle: () => {
        // Get valid moves that don't undo the previous move
        const validMoves = getValidMoves(lastMove);

        // Select a random valid move
        const randomMove =
          validMoves[Math.floor(Math.random() * validMoves.length)];
        const { face, prime } = randomMove;
        const { axis, layer, direction } = FACE_MAP[face];
        const finalDirection = prime ? (-direction as 1 | -1) : direction;

        if (startRotation(axis, layer, finalDirection)) {
          setLastMove({ face, prime });
        }
      },
      reset: () => {
        setRotation(null);
        setCubelets(createInitialCubelets());
        setLastMove(null);
      },
      isAnimating: () => rotation !== null,
      getState: () => getCubeState(cubelets),
    }),
    [rotation, startRotation, cubelets, lastMove, getValidMoves]
  );

  // Calculate animation rotation for each cubelet
  const getAnimationRotation = (cubeletId: number) => {
    if (!rotation || !rotation.cubelets.includes(cubeletId)) return null;
    return {
      axis: rotation.axis,
      angle: rotation.progress * rotation.direction,
    };
  };

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
  );
});

export default RubikCube;
