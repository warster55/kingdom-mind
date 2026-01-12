import OpenAI from 'openai';

const globalForAi = globalThis as unknown as {
  xai: OpenAI | undefined;
};

export const xai = globalForAi.xai ?? new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

if (process.env.NODE_ENV !== 'production') {
  globalForAi.xai = xai;
}