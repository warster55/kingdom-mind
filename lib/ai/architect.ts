import { db, systemPrompts } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import OpenAI from 'openai';

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

/**
 * Architect AI handles system-level changes and prompt updates.
 */
export async function processArchitectCommand(command: string, userId: string) {
  try {
    // 1. Get current active prompt
    const activePromptResult = await db.select().from(systemPrompts)
      .where(eq(systemPrompts.isActive, true))
      .orderBy(desc(systemPrompts.createdAt))
      .limit(1);
    
    const currentPrompt = activePromptResult[0]?.content || '';

    // 2. Ask Grok to analyze and update the prompt based on the feedback
    const architectResponse = await xai.chat.completions.create({
      model: process.env.XAI_MODEL || 'grok-4-latest',
      messages: [
        {
          role: 'system',
          content: `You are the System Architect for Kingdom Mind. 
          Your job is to analyze user feedback about the Mentor's behavior and update the system prompt to be more effective.
          
          CURRENT PROMPT:
          """
          ${currentPrompt}
          """
          
          TASK:
          Respond with a JSON object containing:
          1. "newPrompt": The full updated system prompt.
          2. "explanation": Why you made these changes.
          3. "version": Increment the current version (${activePromptResult[0]?.version || 0} + 1).`
        },
        {
          role: 'user',
          content: `USER FEEDBACK: "${command}"`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(architectResponse.choices[0].message.content || '{}');

    // 3. Save new version to database
    if (result.newPrompt) {
      await db.insert(systemPrompts).values({
        version: result.version,
        content: result.newPrompt,
        changeLog: result.explanation,
        isActive: true
      });

      // Optional: Deactivate old prompt if needed, but we currently pull by recency + isActive
      return { success: true, explanation: result.explanation };
    }

    return { success: false, error: 'No changes generated.' };
  } catch (error: any) {
    console.error('[Architect] Command Error:', error);
    return { success: false, error: error.message };
  }
}
