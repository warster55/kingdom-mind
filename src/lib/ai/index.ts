import { getGeminiStream, getOpenAIStream, getXAIStream, getOllamaStream, AIStreamResponse, HistoryMessage } from './providers';

export async function getAIStream(prompt: string, history: HistoryMessage[]): Promise<AIStreamResponse> {
  // Logic to determine which provider to use. 
  // Prioritize X.AI (Grok) as requested.
  
  if (process.env.XAI_API_KEY) {
    try {
      return await getXAIStream(prompt, history);
    } catch (e) {
      console.error("X.AI (Grok) failed, falling back...", e);
    }
  }

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
