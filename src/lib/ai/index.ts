import { getGeminiStream, getOpenAIStream, getOllamaStream, AIStreamResponse } from './providers';

export async function getAIStream(prompt: string, history: any[]): Promise<AIStreamResponse> {
  // Logic to determine which provider to use. 
  // For now, prioritize Gemini as it's reliable and we have the key.
  
  if (process.env.GEMINI_API_KEY) {
    try {
      return await getGeminiStream(prompt, history);
    } catch (e) {
      console.error("Gemini failed, falling back...", e);
    }
  }

  if (process.env.OPENAI_API_KEY) {
    return await getOpenAIStream(prompt, history);
  }

  if (process.env.OLLAMA_BASE_URL) {
    return await getOllamaStream(prompt, history);
  }

  throw new Error("No AI provider configured or available.");
}
