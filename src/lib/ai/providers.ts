import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export interface AIStreamResponse {
  stream: AsyncIterable<string>;
}

export async function getGeminiStream(prompt: string, history: any[]): Promise<AIStreamResponse> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContentStream({
    contents: [
      ...history,
      { role: 'user', parts: [{ text: prompt }] }
    ]
  });

  const stream = (async function* () {
    for await (const chunk of result.stream) {
      const text = chunk.text();
      yield text;
    }
  })();

  return { stream };
}

export async function getOpenAIStream(prompt: string, history: any[]): Promise<AIStreamResponse> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [...history, { role: "user", content: prompt }],
    stream: true,
  });

  const stream = (async function* () {
    for await (const chunk of response) {
      yield chunk.choices[0]?.delta?.content || "";
    }
  })();

  return { stream };
}

export async function getOllamaStream(prompt: string, history: any[]): Promise<AIStreamResponse> {
  const response = await fetch(`${process.env.OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    body: JSON.stringify({
      model: 'llama3',
      messages: [...history, { role: 'user', content: prompt }],
      stream: true,
    }),
  });

  if (!response.body) throw new Error('Ollama stream body is missing');

  const stream = (async function* () {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const json = JSON.parse(decoder.decode(value));
      yield json.message.content;
    }
  })();

  return { stream };
}
