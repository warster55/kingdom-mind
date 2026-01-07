import { db, systemPrompts } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { architectTools } from './tools/architect-definitions';
import { executeArchitectQuery, executeUpdatePrompt, executeSystemHealth } from './tools/architect-handlers';
import { xai } from './client';

/**
 * Sovereignty Mode: Architect handles system-level reasoning and manipulation.
 */
export async function processArchitectTurn(command: string, controller: ReadableStreamDefaultController) {
  const encoder = new TextEncoder();
  
  try {
    // 1. Get current active prompt for context
    const activePrompt = await db.select().from(systemPrompts)
      .where(eq(systemPrompts.isActive, true))
      .orderBy(desc(systemPrompts.createdAt))
      .limit(1);

    const messages: any[] = [
      {
        role: 'system',
        content: `You are the System Architect for Kingdom Mind. 
        You have "God-mode" access to the sanctuary's infrastructure.
        Your job is to assist the high-level Admin in managing, auditing, and improving the system.
        
        CURRENT MENTOR PROMPT (v${activePrompt[0]?.version || 1}):
        """
        ${activePrompt[0]?.content || ''}
        """
        
        POWERS:
        - You can query the database using SQL (SELECT only).
        - You can update the Mentor's system prompt based on feedback.
        - You can check system health.
        
        TONE:
        Direct, precise, and acknowledging of the Admin's sovereignty. Respond with action.
        If the Admin says "activate", confirm that Architect Mode is now persistent.
        If the Admin says "exit", tell them you are returning to Mentor Mode.`
      },
      { role: 'user', content: command }
    ];

    async function runArchitectLoop(currentMessages: any[]) {
      const response = await xai.chat.completions.create({
        model: process.env.XAI_MODEL || 'grok-4-latest',
        messages: currentMessages,
        tools: architectTools,
        tool_choice: 'auto',
        stream: true,
      });

      let fullContent = '';
      const toolCalls: any[] = [];

      for await (const chunk of response) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          fullContent += delta.content;
          controller.enqueue(encoder.encode(delta.content));
        }
        if (delta?.tool_calls) {
          delta.tool_calls.forEach((tc: any) => {
            if (tc.id) toolCalls.push({ id: tc.id, function: { name: '', arguments: '' } });
            const current = toolCalls[toolCalls.length - 1];
            if (tc.function?.name) current.function.name += tc.function.name;
            if (tc.function?.arguments) current.function.arguments += tc.function.arguments;
          });
        }
      }

      if (toolCalls.length > 0) {
        controller.enqueue(encoder.encode('\n\n*Architect is working...*\n'));
        
        const toolResults = await Promise.all(toolCalls.map(async (tc) => {
          let result;
          const name = tc.function.name;
          const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};

          if (name === 'queryDatabase') result = await executeArchitectQuery(args.sql);
          else if (name === 'updateSystemPrompt') result = await executeUpdatePrompt(args.newPrompt, args.explanation);
          else if (name === 'getSystemHealth') result = await executeSystemHealth();
          
          return {
            tool_call_id: tc.id,
            role: 'tool',
            content: JSON.stringify(result?.data || { error: result?.error })
          };
        }));

        const nextMessages = [
          ...currentMessages,
          { role: 'assistant', content: fullContent || null, tool_calls: toolCalls },
          ...toolResults
        ];

        await runArchitectLoop(nextMessages);
      }
    }

    await runArchitectLoop(messages);

  } catch (error: any) {
    console.error('[Architect] Loop Error:', error);
    controller.enqueue(encoder.encode(`\n\n**Sovereignty Error:** ${error.message}`));
  }
}
