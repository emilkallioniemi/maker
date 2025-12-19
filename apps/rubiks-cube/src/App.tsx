import { useRef, useState } from "react";
import Scene from "./components/Scene";
import { type RubikCubeHandle } from "./components/RubikCube";
import "./App.css";

function App() {
  const cubeRef = useRef<RubikCubeHandle>(null);
  const [aiMessage, setAiMessage] = useState<string>("");
  const [showMessage, setShowMessage] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  const handleStart = () => {
    // Show popup immediately with skeleton
    setAiMessage("");
    setIsStreaming(true);
    setShowMessage(true);

    // Make OpenAI generate a snarly joke about solving the cube (runs in background)
    const getSnarlyJoke = async () => {
      try {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
          console.warn(
            "OpenAI API key not found. Set VITE_OPENAI_API_KEY in your .env file."
          );
          setIsStreaming(false);
          setAiMessage("API key not configured");
          return;
        }

        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content:
                    "You are a snarky AI that makes sarcastic jokes about solving Rubik's cubes. Be witty and condescending about how easy it is.",
                },
                {
                  role: "user",
                  content:
                    "Make a snarly joke about how easy it is to solve a Rubik's cube. Keep it short and punchy.",
                },
              ],
              max_tokens: 100,
              temperature: 0.9,
              stream: true,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        if (!reader) {
          throw new Error("No response body");
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const data = JSON.parse(line.slice(6));
                const delta = data.choices[0]?.delta?.content;
                if (delta) {
                  setAiMessage((prev) => prev + delta);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        setIsStreaming(false);

        // Auto-hide after 5 seconds from when streaming completes
        setTimeout(() => {
          setShowMessage(false);
          // Clear message after fade out animation completes
          setTimeout(() => {
            setAiMessage("");
            setIsStreaming(false);
          }, 500); // Match fade out duration
        }, 5000);
      } catch (error) {
        console.error("Failed to get AI joke:", error);
        setIsStreaming(false);
        setAiMessage("Failed to load joke");
      }
    };

    // Start the AI joke request in the background (don't await)
    getSnarlyJoke();

    // Shuffle the cube immediately
    setIsShuffling(true);
    const shuffleCube = () => {
      let count = 0;
      const doMove = () => {
        if (count >= 20) {
          setIsShuffling(false);
          return;
        }
        if (cubeRef.current && !cubeRef.current.isAnimating()) {
          cubeRef.current.shuffle();
          count++;
        }
        if (count < 20) {
          requestAnimationFrame(doMove);
        } else {
          // After shuffling, AI agent will solve it (to be implemented)
          console.log("Cube shuffled, ready for AI solving");
          setIsShuffling(false);
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

      {showMessage && (
        <div className={`ai-popup ${showMessage ? "show" : ""}`}>
          <div className="ai-popup-content">
            <span className="ai-popup-icon">🤖</span>
            {isStreaming && !aiMessage ? (
              <div className="ai-popup-skeleton">
                <div className="skeleton-line"></div>
                <div className="skeleton-line skeleton-line-short"></div>
              </div>
            ) : (
              <span className="ai-popup-text">{aiMessage || "..."}</span>
            )}
          </div>
        </div>
      )}

      <div className="controls-overlay">
        <button
          className="start-button"
          onClick={handleStart}
          disabled={isShuffling}
        >
          Start
        </button>
      </div>
    </div>
  );
}

export default App;
