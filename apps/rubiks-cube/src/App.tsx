import { useRef, useEffect } from "react";
import Scene from "./components/Scene";
import { type RubikCubeHandle } from "./components/RubikCube";
import { callOpenAI } from "@maker/core";
import "./App.css";

function App() {
  const cubeRef = useRef<RubikCubeHandle>(null);
  const hasCalledOpenAI = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in StrictMode
    if (hasCalledOpenAI.current) return;
    hasCalledOpenAI.current = true;

    // Call OpenAI API on mount
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (apiKey) {
      callOpenAI(apiKey, "Tell me a joke!")
        .then((response: any) => {
          const text = response?.choices?.[0]?.message?.content;
          if (text) {
            console.log(text);
          } else {
            console.log(response);
          }
        })
        .catch((error) => {
          console.error("Failed to call OpenAI:", error);
        });
    } else {
      console.warn("VITE_OPENAI_API_KEY not set in environment variables");
    }
  }, []);

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
          // After shuffling, AI agent will solve it (to be implemented)
          console.log("Cube shuffled, ready for AI solving");
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
