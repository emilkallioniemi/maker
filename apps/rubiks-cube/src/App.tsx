import { useRef, useState } from "react";
import Scene from "./components/Scene";
import { type RubikCubeHandle } from "./components/RubikCube";
import { getNextCubeMove, type CubeMove } from "@maker/core";
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

        // Auto-hide joke after 5 seconds from when streaming completes
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
          // After shuffling, get the next move from AI
          console.log("Cube shuffled, getting next move from AI...");
          setIsShuffling(false);
          
          // Wait a bit for joke to finish, then show move recommendation
          setTimeout(() => {
            const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
            if (apiKey) {
              setShowMessage(true);
              setIsStreaming(true);
              setAiMessage("");
              
              getNextCubeMove(apiKey)
                .then((move: CubeMove) => {
                  console.log("Next move:", move);
                  setIsStreaming(false);
                  
                  // Format move display
                  const moveNotation = move.prime ? `${move.face}'` : move.face;
                  const moveText = move.explanation 
                    ? `${moveNotation} - ${move.explanation}`
                    : `Executing move: ${moveNotation}`;
                  
                  setAiMessage(moveText);
                  
                  // Wait for cube to finish any current animation, then execute the move
                  const executeMove = () => {
                    if (cubeRef.current && !cubeRef.current.isAnimating()) {
                      cubeRef.current.rotate(move.face, move.prime);
                      console.log(`Executed move: ${moveNotation}`);
                    } else {
                      // Retry after a short delay if cube is still animating
                      setTimeout(executeMove, 100);
                    }
                  };
                  
                  // Small delay to ensure cube is ready
                  setTimeout(executeMove, 200);
                  
                  // Auto-hide after 5 seconds
                  setTimeout(() => {
                    setShowMessage(false);
                    setTimeout(() => {
                      setAiMessage("");
                    }, 500);
                  }, 5000);
                })
                .catch((error) => {
                  console.error("Failed to get next cube move:", error);
                  setIsStreaming(false);
                  setAiMessage("Failed to get next move. Please try again.");
                });
            } else {
              console.warn("VITE_OPENAI_API_KEY not set in environment variables");
            }
          }, 6000); // Wait 6 seconds to let joke finish
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
