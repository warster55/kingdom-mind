import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, chatMessages } from '@/lib/db';
import { getAIStream } from '@/lib/ai';
import { mentorTools } from '@/lib/ai/tools/definitions';
import { 
  executeUserStatus, 
  executeUpdateProgress, 
  executeApproveUser, 
  executeClearSanctuary, 
  executeAscendDomain, 
  executePeepTheGates 
} from '@/lib/ai/tools/handlers';
import OpenAI from 'openai';

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, systemPrompt } = await req.json();
    const session = await getServerSession(authOptions);

    if (sessionId !== 0 && !session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const userId = session?.user?.id || 'guest';

    // 1. Save user message if member
    if (sessionId !== 0) {
      await db.insert(chatMessages).values({ sessionId, role: 'user', content: message });
    }

    // 2. Fetch history
    let history: any[] = [];
    if (sessionId !== 0) {
      const dbHistory = await db.query.chatMessages.findMany({
        where: (msgs, { eq }) => eq(msgs.sessionId, sessionId),
        orderBy: (msgs, { asc }) => [asc(msgs.createdAt)],
        limit: 10,
      });
      history = dbHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));
    }

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    // 3. Handle AI Turn (Recursive for Tool Support)
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await processTurn(controller, messages);
        } catch (e) {
          console.error("Turn Error:", e);
        } finally {
          controller.close();
        }
      },
    });

    async function processTurn(controller: ReadableStreamDefaultController, currentMessages: any[]) {
      if (sessionId === 0) {
        const { stream: basicStream } = await getAIStream(message, currentMessages.slice(0, -1));
        for await (const chunk of basicStream) {
          controller.enqueue(encoder.encode(chunk));
        }
        return;
      }

      const response = await xai.chat.completions.create({
        model: process.env.XAI_MODEL || 'grok-4-latest',
        messages: currentMessages,
        tools: mentorTools,
        tool_choice: 'auto',
        stream: true,
      });

      let fullAssistantContent = '';
      const toolCalls: any[] = [];

      for await (const chunk of response) {
        const delta = chunk.choices[0]?.delta;
        
        if (delta?.content) {
          fullAssistantContent += delta.content;
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
        const toolResults = await Promise.all(toolCalls.map(async (tc) => {
          let result;
          const name = tc.function.name;
          const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};

          if (name === 'getUserStatus') result = await executeUserStatus(userId);
          else if (name === 'updateProgress') result = await executeUpdateProgress(userId, args.domain, args.note);
          else if (name === 'approveUser') result = await executeApproveUser(userId, args.email);
          else if (name === 'clearSanctuary') result = await executeClearSanctuary(sessionId);
          else if (name === 'ascendDomain') result = await executeAscendDomain(userId);
          else if (name === 'peepTheGates') result = await executePeepTheGates(userId);
          
          return {
            tool_call_id: tc.id,
            role: 'tool',
            content: JSON.stringify(result?.data || { error: result?.error })
          };
        }));

        const nextMessages = [
          ...currentMessages,
          { role: 'assistant', content: fullAssistantContent || null, tool_calls: toolCalls },
          ...toolResults
        ];

        await processTurn(controller, nextMessages);
      } else if (fullAssistantContent) {
        await db.insert(chatMessages).values({ sessionId, role: 'assistant', content: fullAssistantContent });
      }
    }

    return new Response(stream);

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}