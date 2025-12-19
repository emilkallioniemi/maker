import { useRef } from "react";
import Scene from "./components/Scene";
import { type RubikCubeHandle } from "./components/RubikCube";
import { getNextCubeMove } from "@maker/core";
import "./App.css";

function App() {
  const cubeRef = useRef<RubikCubeHandle>(null);

  const handleStart = () => {
    // Shuffle the cube first
    const shuffleCube = () => {
      let count = 0;
      const doMove = () => {
        if (count >= 20) return;
        if (cubeRef.current && !cubeRef.current.isAnimating()) {
          cubeRef.current.shuffle();
          count++;
        }
        if (count < 20) {
          requestAnimationFrame(doMove);
        } else {
          // After shuffling, get the next move from AI
          console.log("Cube shuffled, getting next move from AI...");
          const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
          if (apiKey) {
            getNextCubeMove(apiKey)
              .then((moveExplanation) => {
                console.log("Next move:", moveExplanation);
              })
              .catch((error) => {
                console.error("Failed to get next cube move:", error);
              });
          } else {
            console.warn("VITE_OPENAI_API_KEY not set in environment variables");
          }
        }
      };
      doMove();
    };
    shuffleCube();
  };

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
  );
}

export default App;
