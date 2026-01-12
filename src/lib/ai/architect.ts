import { db, systemPrompts } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { architectTools } from './tools/architect-definitions';
import { executeArchitectQuery, executeUpdatePrompt, executeSystemHealth } from './tools/architect-handlers';
import { xai } from './client';
import { scrubPII } from '@/lib/utils/privacy';

/**
 * Sovereignty Mode: Architect handles system-level reasoning and manipulation.
 * Hard-coded with the Master Schema for 100% SQL accuracy.
 */
export async function processArchitectTurn(command: string, controller: ReadableStreamDefaultController) {
  const encoder = new TextEncoder();
  
  try {
    const activePrompt = await db.select().from(systemPrompts)
      .where(eq(systemPrompts.isActive, true))
      .orderBy(desc(systemPrompts.createdAt))
      .limit(1);

    const messages: any[] = [
      {
        role: 'system',
        content: `You are the System Architect for Kingdom Mind. 
        
        DATABASE SCHEMA (Master Blueprint):
        - users: id, email, name, role, is_approved, current_domain, resonance_identity... (7 domains)
        - curriculum: id, domain, pillar_name, pillar_order, description, key_truth
        - user_progress: id, user_id, curriculum_id, status (locked/active/completed), level
        - habits: id, user_id, domain, title, streak, is_active
        - insights: id, user_id, session_id, domain, content, importance
        - mentoring_sessions: id, user_id, session_number, topic, status (active/completed)
        - chat_messages: id, user_id, session_id, role (user/assistant), content
        - system_prompts: id, version, content, is_approved
        - greetings: id, type (LOGIN/RETURN_USER/CODE_REQUEST), content, is_active
        
        PRIVACY LAW:
        - NEVER reveal PII (emails, names, private history). 
        - Your output is scrubbed by the Sovereignty Shield, but you must still provide anonymized patterns.
        
        POWERS:
        - queryDatabase: SQL (SELECT only) using the schema above.
        - updateSystemPrompt: Direct brain surgery on the Mentor.
        - getSystemHealth: High-level metrics. 
        
        TONE:
        - Direct, professional, sovereign. Respond with data and action.`
      },
      { role: 'user', content: command }
    ];

    async function runArchitectLoop(currentMessages: any[]) {
      console.log(`[Architect] Processing Turn: ${command.substring(0, 50)}...`);
      
      const modelId = process.env.XAI_ARCHITECT_MODEL || 'grok-4-1-fast-reasoning';
      const response = await xai.chat.completions.create({
        model: modelId,
        messages: currentMessages,
        tools: architectTools,
        tool_choice: 'auto',
        stream: true,
        stream_options: { include_usage: true },
      });

      let fullContent = '';
      let usageData = { prompt_tokens: 0, completion_tokens: 0 };
      const toolCalls: any[] = [];

      for await (const chunk of response) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          fullContent += delta.content;
          controller.enqueue(encoder.encode(scrubPII(delta.content)));
        }
        if (delta?.tool_calls) {
          delta.tool_calls.forEach((tc: any) => {
            if (tc.id) toolCalls.push({ id: tc.id, function: { name: '', arguments: '' } });
            const current = toolCalls[toolCalls.length - 1];
            if (tc.function?.name) current.function.name += tc.function.name;
            if (tc.function?.arguments) current.function.arguments += tc.function.arguments;
          });
        }
        if (chunk.usage) {
          usageData = chunk.usage;
        }
      }

      // Track Architect Cost (Same pricing for Fast Reasoning: $0.20/$0.50)
      if (usageData.prompt_tokens > 0) {
        const cost = (usageData.prompt_tokens * 0.20 / 1e6) + (usageData.completion_tokens * 0.50 / 1e6);
        console.log(`[Architect Cost] $${cost.toFixed(6)} (${usageData.prompt_tokens}in/${usageData.completion_tokens}out)`);
        // Note: Architect doesn't save to chatMessages table directly in this loop, 
        // but we log it. To save it, we'd need a system_logs table.
        // For now, logging to stdout is sufficient for debugging, or we can insert into chatMessages if it's a chat turn.
      }

      if (toolCalls.length > 0) {
        console.log(`[Architect] Executing ${toolCalls.length} tools...`);
        controller.enqueue(encoder.encode('\n\n*Architect is accessing the vault...*\n'));
        
        const toolResults = await Promise.all(toolCalls.map(async (tc) => {
          let result;
          const name = tc.function.name;
          const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};

          console.log(`[Architect Tool] Calling ${name} with args:`, args);

          if (name === 'queryDatabase') result = await executeArchitectQuery(args.sql);
          else if (name === 'updateSystemPrompt') result = await executeUpdatePrompt(args.newPrompt, args.explanation);
          else if (name === 'getSystemHealth') result = await executeSystemHealth();
          
          console.log(`[Architect Tool] ${name} result:`, result?.success ? 'SUCCESS' : 'FAILED');

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
