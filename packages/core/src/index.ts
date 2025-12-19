/**
 * Core package for Maker
 */

export const core = () => {
  return "core";
};

/**
 * Move information returned by getNextCubeMove
 */
export interface CubeMove {
  face: "R" | "L" | "U" | "D" | "F" | "B";
  prime: boolean;
  explanation?: string;
}

/**
 * Gets the next move recommendation for solving a Rubik's Cube using function calling
 * @param apiKey - OpenAI API key
 * @param cubeState - Description of the current cube state (optional)
 * @param previousMoves - Array of previous moves made (optional)
 * @returns Promise with move information to execute
 */
export const getNextCubeMove = async (
  apiKey: string,
  cubeState?: string,
  previousMoves?: string[]
): Promise<CubeMove> => {
  try {
    const systemPrompt = `You are an expert Rubik's Cube solver. Analyze the cube state and recommend the next move using the rotate_face function.

When no cube state is provided, suggest a general starting move.`;

    const userMessage = cubeState
      ? `Cube state: ${cubeState}${
          previousMoves && previousMoves.length > 0
            ? `\nPrevious moves: ${previousMoves.join(", ")}`
            : ""
        }\n\nWhat should be the next move?`
      : "Cube is scrambled. What should be the first move?";

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        tools: [
          {
            type: "function",
            name: "rotate_face",
            description:
              "Rotate a face of the Rubik's Cube. Use this to solve the cube step by step.",
            parameters: {
              type: "object",
              properties: {
                face: {
                  type: "string",
                  enum: ["R", "L", "U", "D", "F", "B"],
                  description:
                    "The face to rotate: R (Right), L (Left), U (Up/Top), D (Down/Bottom), F (Front), B (Back)",
                },
                prime: {
                  type: "boolean",
                  description:
                    "If true, rotate counter-clockwise (prime notation). If false, rotate clockwise.",
                },
              },
              required: ["face", "prime"],
            },
          },
        ],
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `HTTP error! Status: ${response.status}, ${JSON.stringify(errorData)}`
      );
    }

    const data = (await response.json()) as any;
    console.log("Responses API full response:", JSON.stringify(data, null, 2));

    // Responses API structure: function calls are directly in output array
    if (data?.output && Array.isArray(data.output) && data.output.length > 0) {
      // Check if function calls are directly in output (not nested in content)
      for (const outputItem of data.output) {
        if (
          outputItem?.type === "function_call" &&
          outputItem?.name === "rotate_face"
        ) {
          try {
            const args = outputItem?.arguments
              ? typeof outputItem.arguments === "string"
                ? JSON.parse(outputItem.arguments)
                : outputItem.arguments
              : null;
            if (args && args.face) {
              return {
                face: args.face,
                prime: args.prime || false,
              };
            }
          } catch (e) {
            console.error("Failed to parse function call arguments:", e);
          }
        }
      }

      // Also check nested in content (for message-type outputs)
      const firstOutput = data.output[0];
      if (firstOutput?.content && Array.isArray(firstOutput.content)) {
        for (const contentItem of firstOutput.content) {
          // Check for tool_call type - Responses API structure
          if (
            contentItem?.type === "tool_call" ||
            contentItem?.type === "function_call"
          ) {
            // Check if name is at top level or nested under function
            const toolName = contentItem?.name || contentItem?.function?.name;
            if (toolName === "rotate_face") {
              try {
                const args = contentItem?.arguments
                  ? typeof contentItem.arguments === "string"
                    ? JSON.parse(contentItem.arguments)
                    : contentItem.arguments
                  : contentItem?.function?.arguments
                  ? typeof contentItem.function.arguments === "string"
                    ? JSON.parse(contentItem.function.arguments)
                    : contentItem.function.arguments
                  : null;
                if (args) {
                  return {
                    face: args.face,
                    prime: args.prime || false,
                  };
                }
              } catch (e) {
                console.error("Failed to parse tool call arguments:", e);
              }
            }
          }
          // Also check for tool_use type (alternative structure)
          if (
            contentItem?.type === "tool_use" &&
            contentItem?.name === "rotate_face"
          ) {
            try {
              const args =
                typeof contentItem.input === "string"
                  ? JSON.parse(contentItem.input)
                  : contentItem.input;
              return {
                face: args.face,
                prime: args.prime || false,
              };
            } catch (e) {
              console.error("Failed to parse tool_use arguments:", e);
            }
          }
        }
      }
    }

    // Fallback: if no tool call, try to parse text response
    if (
      data?.output &&
      Array.isArray(data.output) &&
      data.output.length > 0 &&
      data.output[0]?.content &&
      Array.isArray(data.output[0].content) &&
      data.output[0].content.length > 0
    ) {
      const textContent = data.output[0].content[0]?.text;
      if (textContent) {
        // Try to extract move from text (fallback)
        const moveMatch = textContent.match(/\b([RLUDFB])(')?\b/);
        if (moveMatch) {
          return {
            face: moveMatch[1] as "R" | "L" | "U" | "D" | "F" | "B",
            prime: !!moveMatch[2],
            explanation: textContent,
          };
        }
      }
    }

    throw new Error("Unable to determine next move from API response");
  } catch (error) {
    console.error("Error getting next cube move:", error);
    throw error;
  }
};
