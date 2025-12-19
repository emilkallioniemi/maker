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
    const systemPrompt = `You are an expert Rubik's Cube solver. Recommend the next move concisely.

Available moves: R, R', L, L', U, U', D, D', F, F', B, B'

Keep responses brief (1-2 sentences max). Format: "Move: [move] - [brief reason]"
Example: "Move: R - Start building the white cross."

When no cube state is provided, suggest a general starting move.`;

    const userMessage = cubeState
      ? `Cube state: ${cubeState}${
          previousMoves && previousMoves.length > 0
            ? `\nPrevious moves: ${previousMoves.join(", ")}`
            : ""
        }\n\nNext move?`
      : "Cube is scrambled. First move?";

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
