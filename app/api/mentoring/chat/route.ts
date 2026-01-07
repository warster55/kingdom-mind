import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, chatMessages, users, insights, systemPrompts } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { getAIStream } from '@/lib/ai';
import { processArchitectCommand } from '@/lib/ai/architect';
import { mentorTools } from '@/lib/ai/tools/definitions';
import { 
  executeUserStatus, 
  executeUpdateProgress, 
  executeApproveUser, 
  executeClearSanctuary, 
  executeAscendDomain, 
  executePeepTheGates,
  executeSeekWisdom,
  executeScribeReflection,
  executeSoulSearch,
  executeBroadcast,
  executeSetAtmosphere,
  executeRecallInsight
} from '@/lib/ai/tools/handlers';
import OpenAI from 'openai';

const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, timezone } = await req.json();
    const session = await getServerSession(authOptions);

    if (sessionId !== 0 && !session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const userId = session?.user?.id;
    const userRole = (session?.user as any)?.role;

    // 1. ADMIN INTERCEPT: Check for '#' Sovereignty Command
    if (message.startsWith('#') && userRole === 'admin') {
      const command = message.substring(1);
      const architectResult = await processArchitectCommand(command, userId as string);
      
      return new Response(new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          if (architectResult.success) {
            controller.enqueue(encoder.encode(`Sovereignty acknowledged. **System Updated.**\n\n**Reason:** ${architectResult.explanation}`));
          } else {
            controller.enqueue(encoder.encode(`Sovereignty failed: ${architectResult.error}`));
          }
          controller.close();
        }
      }));
    }

    // 2. Fetch High-Intelligence Context
    let finalSystemPrompt = "You are a helpful mentor.";
    let userHandle = "Seeker";

    if (sessionId !== 0 && userId) {
      const userResult = await db.select().from(users).where(eq(users.id, parseInt(userId))).limit(1);
      const user = userResult[0];

      if (user) {
        userHandle = user.name || "Seeker";
        
        // Pull latest prompt from DB
        const dbPrompt = await db.select().from(systemPrompts)
          .where(eq(systemPrompts.isActive, true))
          .orderBy(desc(systemPrompts.createdAt))
          .limit(1);
        
        const lastInsight = await db.select().from(insights)
          .where(eq(insights.userId, user.id))
          .orderBy(desc(insights.createdAt))
          .limit(1);

        // Build prompt with BLIND PII (No email, no full name unless in 'name' field)
        const basePrompt = dbPrompt[0]?.content || finalSystemPrompt;
        
        const userLocalTime = new Date().toLocaleString("en-US", { 
          timeZone: timezone || user.timezone || 'UTC',
          hour: 'numeric', minute: 'numeric', hour12: true, weekday: 'long'
        });

        finalSystemPrompt = `
${basePrompt}

USER CONTEXT:
- Name: ${userHandle}
- Domain: ${user.currentDomain}
- Time: ${userLocalTime}
${lastInsight[0] ? `- Last Breakthrough: "${lastInsight[0].content}"` : ''}
`.trim();
      }
    }

    // 3. Save user message if member
    if (sessionId !== 0) {
      await db.insert(chatMessages).values({ sessionId, role: 'user', content: message });
    }

    // 4. Fetch history
    const dbHistory = await db.query.chatMessages.findMany({
      where: (msgs, { eq: eqOp }) => eqOp(msgs.sessionId, sessionId),
      orderBy: (msgs, { asc }) => [asc(msgs.createdAt)],
      limit: 15,
    });
    const history = dbHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    const messages: any[] = [
      { role: 'system', content: finalSystemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    // 5. Handle AI Turn
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

          if (name === 'getUserStatus') result = await executeUserStatus(userId as string);
          else if (name === 'updateProgress') result = await executeUpdateProgress(userId as string, args.domain, args.note);
          else if (name === 'approveUser') result = await executeApproveUser(userId as string, args.email);
          else if (name === 'clearSanctuary') result = await executeClearSanctuary(sessionId);
          else if (name === 'ascendDomain') result = await executeAscendDomain(userId as string);
          else if (name === 'peepTheGates') result = await executePeepTheGates(userId as string);
          else if (name === 'seekWisdom') result = await executeSeekWisdom(args.query);
          else if (name === 'scribeReflection') result = await executeScribeReflection(userId as string, sessionId, args.domain, args.summary);
          else if (name === 'soulSearch') result = await executeSoulSearch(userId as string, args.email);
          else if (name === 'broadcast') result = await executeBroadcast(userId as string, args.message);
          else if (name === 'setAtmosphere') result = await executeSetAtmosphere(args.theme, args.tone);
          else if (name === 'recallInsight') result = await executeRecallInsight(userId as string, args.domain);
          
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
