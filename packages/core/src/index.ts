/**
 * Core package for Maker
 */

export const core = () => {
  return "core";
};

/**
 * Calls OpenAI API using fetch
 * @param apiKey - OpenAI API key
 * @param prompt - The prompt to send to OpenAI
 * @returns Promise with the API response
 */
export const callOpenAI = async (apiKey: string, prompt: string = "Hello, how are you?") => {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! Status: ${response.status}, ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
};
