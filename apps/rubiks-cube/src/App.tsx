import Scene from './components/Scene'
import './App.css'

function App() {
  return (
    <div className="app">
      <h1>Rubik's Cube</h1>
      <p className="instructions">
        Drag to rotate • Scroll to zoom • Right-click to pan
      </p>
      <div className="canvas-container">
        <Scene />
      </div>
    </div>
  )
}

export default App
