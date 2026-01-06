import { NextRequest } from 'next/server';
import { db, chatMessages } from '@/lib/db';
import { getAIStream } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, systemPrompt } = await req.json();

    // 1. Save user message to DB
    await db.insert(chatMessages).values({
      sessionId,
      role: 'user',
      content: message,
    });

    // 2. Fetch history for context
    const history = await db.query.chatMessages.findMany({
      where: (msgs, { eq }) => eq(msgs.sessionId, sessionId),
      orderBy: (msgs, { asc }) => [asc(msgs.createdAt)],
      limit: 10,
    });

    const formattedHistory = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }))
    ];

    // 3. Get AI Stream (or Mock)
    let aiStream;
    if (process.env.NODE_ENV === 'test' || req.headers.get('x-test-mode') === 'true') {
      aiStream = {
        stream: (async function* () {
          yield "This is a ";
          yield "mocked AI ";
          yield "response for ";
          yield "testing purposes.";
        })()
      };
    } else {
      const { stream } = await getAIStream(message, formattedHistory);
      aiStream = { stream };
    }

    // 4. Return as Response
    const responseStream = new ReadableStream({
      async start(controller) {
        let fullAssistantContent = '';
        for await (const chunk of aiStream.stream) {
          fullAssistantContent += chunk;
          controller.enqueue(new TextEncoder().encode(chunk));
        }

        // 5. Save assistant message to DB after stream completion
        await db.insert(chatMessages).values({
          sessionId,
          role: 'assistant',
          content: fullAssistantContent,
        });

        controller.close();
      },
    });

    return new Response(responseStream);

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
