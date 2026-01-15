import { db, systemPrompts } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { architectTools } from './tools/architect-definitions';
import {
  executeArchitectQuery,
  executeUpdatePrompt,
  executeSystemHealth,
  executeReadFile,
  executeWriteFile,
  executeEditFile,
  executeListFiles,
  executeSearchCode,
  executeRunBash,
  executeProposePlan
} from './tools/architect-handlers';
import { xai } from './client';
import { scrubPII } from '@/lib/utils/privacy';

/**
 * Sovereignty Mode: Architect handles system-level reasoning and manipulation.
 * Hard-coded with the Master Schema for 100% SQL accuracy.
 */
export async function processArchitectTurn(command: string, controller: ReadableStreamDefaultController) {
  const encoder = new TextEncoder();
  
  try {
    // Note: activePrompt could be used for dynamic system prompts in the future
    await db.select().from(systemPrompts)
      .where(eq(systemPrompts.isActive, true))
      .orderBy(desc(systemPrompts.createdAt))
      .limit(1);

    // Type compatible with xAI SDK ChatCompletionMessageParam
    interface ChatMessage {
      role: 'system' | 'user' | 'assistant' | 'tool';
      content: string;
      tool_calls?: ToolCall[];
      tool_call_id?: string;
    }

    interface ToolCall {
      id: string;
      function: {
        name: string;
        arguments: string;
      };
    }

    interface ToolCallDelta {
      id?: string;
      function?: {
        name?: string;
        arguments?: string;
      };
    }

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are the System Architect for Kingdom Mind. You have full CLI power over the codebase.

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

        TOOLS AVAILABLE:

        Database:
        - queryDatabase: SQL (SELECT only) using the schema above.
        - updateSystemPrompt: Direct brain surgery on the Mentor.
        - getSystemHealth: High-level metrics.

        File Operations (CLI Power):
        - readFile: Read file contents (with line numbers). Use startLine/endLine for large files.
        - writeFile: Create or overwrite a file.
        - editFile: Surgical text replacement in a file.

        Code Search:
        - listFiles: List files matching a glob pattern (e.g., "**/*.ts", "src/**/*.tsx").
        - searchCode: Search for text/regex in files using ripgrep.

        System:
        - runBash: Execute shell commands (git, npm, etc). 30-second timeout.

        TONE:
        - Direct, professional, sovereign. Respond with data and action.
        - When making code changes, explain what you're doing and why.`
      },
      { role: 'user', content: command }
    ];

    async function runArchitectLoop(currentMessages: ChatMessage[]) {
      console.log(`[Architect] Processing Turn: ${command.substring(0, 50)}...`);
      
      const modelId = process.env.XAI_ARCHITECT_MODEL || 'grok-4-1-fast-reasoning';
      // Cast to expected xAI SDK type - our ChatMessage is compatible at runtime
      const response = await xai.chat.completions.create({
        model: modelId,
        messages: currentMessages as Parameters<typeof xai.chat.completions.create>[0]['messages'],
        tools: architectTools,
        tool_choice: 'auto',
        stream: true,
        stream_options: { include_usage: true },
      });

      let fullContent = '';
      let usageData = { prompt_tokens: 0, completion_tokens: 0 };
      const toolCalls: ToolCall[] = [];

      for await (const chunk of response) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          fullContent += delta.content;
          controller.enqueue(encoder.encode(scrubPII(delta.content)));
        }
        if (delta?.tool_calls) {
          delta.tool_calls.forEach((tc: ToolCallDelta) => {
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

          // Database tools
          if (name === 'queryDatabase') result = await executeArchitectQuery(args.sql);
          else if (name === 'updateSystemPrompt') result = await executeUpdatePrompt(args.newPrompt, args.explanation);
          else if (name === 'getSystemHealth') result = await executeSystemHealth();
          // File operations
          else if (name === 'readFile') result = await executeReadFile(args.path, args.startLine, args.endLine);
          else if (name === 'writeFile') result = await executeWriteFile(args.path, args.content);
          else if (name === 'editFile') result = await executeEditFile(args.path, args.oldText, args.newText);
          // Code search
          else if (name === 'listFiles') result = await executeListFiles(args.pattern, args.cwd);
          else if (name === 'searchCode') result = await executeSearchCode(args.pattern, args.path, args.filePattern);
          // System
          else if (name === 'runBash') result = await executeRunBash(args.command, args.cwd, args.timeout);
          // Plan approval
          else if (name === 'proposePlan') result = await executeProposePlan(args.title, args.summary, args.steps, args.filesAffected);
          else result = { success: false, error: `Unknown tool: ${name}` };

          console.log(`[Architect Tool] ${name} result:`, result?.success ? 'SUCCESS' : 'FAILED');

          return {
            tool_call_id: tc.id,
            role: 'tool' as const,
            content: JSON.stringify(result?.data || { error: result?.error })
          };
        }));

        const nextMessages: ChatMessage[] = [
          ...currentMessages,
          { role: 'assistant' as const, content: fullContent || '', tool_calls: toolCalls },
          ...toolResults
        ];

        await runArchitectLoop(nextMessages);
      }
    }

    await runArchitectLoop(messages);

  } catch (error: unknown) {
    console.error('[Architect] Loop Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    controller.enqueue(encoder.encode(`\n\n**Sovereignty Error:** ${message}`));
  }
}
