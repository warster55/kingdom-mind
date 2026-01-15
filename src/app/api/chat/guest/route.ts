import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const GUEST_SYSTEM_PROMPT = `You are a warm, wise spiritual mentor at Kingdom Mind — a sanctuary for personal growth and reflection.

You're speaking with a guest who hasn't created an account yet. Be welcoming and helpful, but keep responses relatively brief (2-3 paragraphs max).

Your role:
- Be warm, approachable, and genuinely curious about them
- Offer meaningful reflections and gentle guidance
- Focus on themes of identity, purpose, mindset, relationships, vision, action, and legacy
- Don't be preachy — be conversational and thoughtful
- If they ask about accounts or saving conversations, gently let them know they can create one anytime

Remember: This is their first impression of the sanctuary. Make it meaningful.`;

/**
 * POST /api/chat/guest
 * Handle guest (unauthenticated) chat messages
 * No persistence - messages are not saved
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Use xAI/Grok for guest chat (same as mentor)
    const xai = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    });

    const completion = await xai.chat.completions.create({
      model: process.env.XAI_MODEL || 'grok-3',
      messages: [
        { role: 'system', content: GUEST_SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error('[Guest Chat Error]:', error);

    // Return a graceful fallback
    return NextResponse.json({
      success: true,
      response: "I appreciate you reaching out. There seems to be a moment of stillness in our connection. What's on your mind today?",
    });
  }
}
