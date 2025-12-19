import { useRef } from 'react'
import Scene from './components/Scene'
import { type RubikCubeHandle } from './components/RubikCube'
import './App.css'

function App() {
  const cubeRef = useRef<RubikCubeHandle>(null)

  const handleStart = () => {
    // Shuffle the cube first
    const shuffleCube = () => {
      let count = 0
      const doMove = () => {
        if (count >= 20) return
        if (cubeRef.current && !cubeRef.current.isAnimating()) {
          cubeRef.current.shuffle()
          count++
        }
        if (count < 20) {
          requestAnimationFrame(doMove)
        } else {
          // After shuffling, AI agent will solve it (to be implemented)
          console.log('Cube shuffled, ready for AI solving')
        }
      }
      doMove()
    }
    shuffleCube()
  }

  return (
    <div className="app">
      <div className="canvas-container">
        <Scene cubeRef={cubeRef} />
      </div>
      
      <div className="controls-overlay">
        <button className="start-button" onClick={handleStart}>
          Start
        </button>
      </div>
    </div>
  )
}

export default App
