import { useRef } from 'react'
import Scene from './components/Scene'
import { type RubikCubeHandle, type Face } from './components/RubikCube'
import './App.css'

// Button configuration for each face
const FACE_BUTTONS: { face: Face; label: string; color: string }[] = [
  { face: 'R', label: 'R', color: '#b71234' },  // Red
  { face: 'L', label: 'L', color: '#ff5800' },  // Orange
  { face: 'U', label: 'U', color: '#ffd500' },  // Yellow
  { face: 'D', label: 'D', color: '#ffffff' },  // White
  { face: 'F', label: 'F', color: '#009b48' },  // Green
  { face: 'B', label: 'B', color: '#0046ad' },  // Blue
]

function App() {
  const cubeRef = useRef<RubikCubeHandle>(null)

  const handleRotate = (face: Face, prime: boolean) => {
    cubeRef.current?.rotate(face, prime)
  }

  const handleShuffle = () => {
    // Do multiple random moves
    let count = 0
    const doMove = () => {
      if (count >= 20) return
      if (cubeRef.current && !cubeRef.current.isAnimating()) {
        cubeRef.current.shuffle()
        count++
      }
      if (count < 20) {
        requestAnimationFrame(doMove)
      }
    }
    doMove()
  }

  const handleReset = () => {
    cubeRef.current?.reset()
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Rubik's Cube</h1>
        <p className="instructions">
          Click buttons to rotate faces • Drag cube to view • Scroll to zoom
        </p>
      </header>

      <div className="main-content">
        <div className="canvas-container">
          <Scene cubeRef={cubeRef} />
        </div>

        <div className="controls-panel">
          <div className="controls-section">
            <h3>Face Rotations</h3>
            <div className="face-controls">
              {FACE_BUTTONS.map(({ face, label, color }) => (
                <div key={face} className="face-button-group">
                  <button
                    className="face-button"
                    style={{ 
                      '--face-color': color,
                      color: face === 'D' || face === 'U' ? '#1a1a1a' : '#fff'
                    } as React.CSSProperties}
                    onClick={() => handleRotate(face, false)}
                    title={`Rotate ${label} clockwise`}
                  >
                    {label}
                  </button>
                  <button
                    className="face-button prime"
                    style={{ 
                      '--face-color': color,
                      color: face === 'D' || face === 'U' ? '#1a1a1a' : '#fff'
                    } as React.CSSProperties}
                    onClick={() => handleRotate(face, true)}
                    title={`Rotate ${label} counter-clockwise`}
                  >
                    {label}'
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="controls-section">
            <h3>Actions</h3>
            <div className="action-buttons">
              <button className="action-button shuffle" onClick={handleShuffle}>
                🔀 Shuffle
              </button>
              <button className="action-button reset" onClick={handleReset}>
                ↺ Reset
              </button>
            </div>
          </div>

          <div className="controls-section legend">
            <h3>Legend</h3>
            <ul>
              <li><strong>R</strong> - Right face</li>
              <li><strong>L</strong> - Left face</li>
              <li><strong>U</strong> - Up (top) face</li>
              <li><strong>D</strong> - Down (bottom) face</li>
              <li><strong>F</strong> - Front face</li>
              <li><strong>B</strong> - Back face</li>
              <li><strong>'</strong> - Counter-clockwise</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
