/**
 * Core package for Maker
 */

export const core = () => {
  return "core";
};

/**
 * Gets the next move recommendation for solving a Rubik's Cube
 * @param apiKey - OpenAI API key
 * @param cubeState - Description of the current cube state (optional)
 * @param previousMoves - Array of previous moves made (optional)
 * @returns Promise with text explaining the next move
 */
export const getNextCubeMove = async (
  apiKey: string,
  cubeState?: string,
  previousMoves?: string[]
): Promise<string> => {
  try {
    const systemPrompt = `You are an expert Rubik's Cube solver. Your task is to recommend the next move to solve a Rubik's Cube.

Available moves are:
- R: Rotate Right face clockwise
- R': Rotate Right face counter-clockwise
- L: Rotate Left face clockwise
- L': Rotate Left face counter-clockwise
- U: Rotate Up/Top face clockwise
- U': Rotate Up/Top face counter-clockwise
- D: Rotate Down/Bottom face clockwise
- D': Rotate Down/Bottom face counter-clockwise
- F: Rotate Front face clockwise
- F': Rotate Front face counter-clockwise
- B: Rotate Back face clockwise
- B': Rotate Back face counter-clockwise

When given a cube state, analyze it and recommend the next move. When no specific state is provided, provide general solving advice or recommend a starting move for a scrambled cube. Always provide a specific move (like "R" or "U'") along with an explanation.`;

    const userMessage = cubeState
      ? `The cube has been scrambled. Current cube state: ${cubeState}${
          previousMoves && previousMoves.length > 0
            ? `\nPrevious moves made: ${previousMoves.join(", ")}`
            : ""
        }\n\nWhat should be the next move to start solving it?`
      : "The cube has been scrambled. What should be the first move to start solving it? Provide a specific move recommendation.";

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
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `HTTP error! Status: ${response.status}, ${JSON.stringify(errorData)}`
      );
    }

    const data = (await response.json()) as any;

    // Responses API structure: output[0].content[0].text
    let moveExplanation = "Unable to determine next move.";
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
        moveExplanation = textContent;
      }
    }

    return moveExplanation;
  } catch (error) {
    console.error("Error getting next cube move:", error);
    throw error;
  }
};
