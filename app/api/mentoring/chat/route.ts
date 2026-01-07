import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, chatMessages } from '@/lib/db';
import { getAIStream } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, systemPrompt } = await req.json();
    const session = await getServerSession(authOptions);

    // ALLOW sessionId 0 (Gatekeeper) without a session
    if (sessionId !== 0 && !session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const userId = session?.user?.id || 'guest';

    // 1. Save user message to DB (only if member session)
    if (sessionId !== 0) {
      await db.insert(chatMessages).values({
        sessionId,
        role: 'user',
        content: message,
      });
    }

    // 2. Prepare History
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

    const formattedHistory = [
      { role: 'system', content: systemPrompt },
      ...history
    ];

    // 3. Get AI Stream
    let aiStream;
    if (process.env.NODE_ENV === 'test' || req.headers.get('x-test-mode') === 'true') {
      aiStream = {
        stream: (async function* () {
          yield "Welcome to the ";
          yield "threshold of ";
          yield "the sanctuary. ";
          yield "Please share your email.";
        })()
      };
    } else {
      const { stream } = await getAIStream(message, formattedHistory);
      aiStream = { stream };
    }

    // 4. Return Stream
    const responseStream = new ReadableStream({
      async start(controller) {
        let fullAssistantContent = '';
        for await (const chunk of aiStream.stream) {
          fullAssistantContent += chunk;
          controller.enqueue(new TextEncoder().encode(chunk));
        }

        // 5. Save assistant message if member
        if (sessionId !== 0) {
          await db.insert(chatMessages).values({
            sessionId,
            role: 'assistant',
            content: fullAssistantContent,
          });
        }

        controller.close();
      },
    });

    return new Response(responseStream);

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}