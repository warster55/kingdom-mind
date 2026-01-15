import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  decryptSanctuary,
  encryptSanctuary,
  validateSanctuary,
  createEmptySanctuary,
  calculateDisplayData,
  type SanctuaryData,
} from '@/lib/storage/sanctuary-crypto';

// System prompt for the mentor
const MENTOR_SYSTEM_PROMPT = `You are a warm, wise spiritual mentor at Kingdom Mind — a sanctuary for personal growth and reflection.

Your role:
- Be warm, approachable, and genuinely curious about them
- Offer meaningful reflections and gentle guidance
- Focus on themes of identity, purpose, mindset, relationships, vision, action, and legacy
- Keep responses concise (2-3 paragraphs max)
- Ask thoughtful questions to help them reflect deeper
- Don't be preachy — be conversational and caring

You have access to their journey context:
{{CONTEXT}}

When you notice a meaningful breakthrough or insight, mark it with [BREAKTHROUGH: domain | brief summary]
The domain should be one of: identity, purpose, mindset, relationships, vision, action, legacy
Keep the summary PII-free (no names, dates, locations).

Example: [BREAKTHROUGH: identity | Recognized that self-worth comes from within, not external validation]`;

// Get AI provider
function getAI() {
  return new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: 'https://api.x.ai/v1',
  });
}

// Build context from sanctuary data
function buildContext(sanctuary: SanctuaryData): string {
  const lines: string[] = [];

  // Journey duration
  const daysSinceStart = Math.floor((Date.now() - sanctuary.progression.journeyStarted) / (1000 * 60 * 60 * 24));
  if (daysSinceStart > 0) {
    lines.push(`This seeker has been on their journey for ${daysSinceStart} days.`);
  } else {
    lines.push('This seeker is just beginning their journey.');
  }

  // Breakthroughs
  if (sanctuary.progression.totalBreakthroughs > 0) {
    lines.push(`They have had ${sanctuary.progression.totalBreakthroughs} breakthrough moments.`);
  }

  // Domain strengths
  const { resonance } = sanctuary.progression;
  const strongDomains = Object.entries(resonance)
    .filter(([, value]) => value >= 5)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([domain]) => domain);

  if (strongDomains.length > 0) {
    lines.push(`Their strongest domains are: ${strongDomains.join(', ')}.`);
  }

  // Recent insights (last 5)
  if (sanctuary.insights.length > 0) {
    const recentInsights = sanctuary.insights.slice(-5);
    lines.push('\nRecent breakthrough insights:');
    for (const insight of recentInsights) {
      lines.push(`- [${insight.domain}] ${insight.summary}`);
    }
  }

  // Preferences
  if (sanctuary.preferences?.prefersStories) {
    lines.push('\nThis seeker responds well to stories and metaphors.');
  }
  if (sanctuary.preferences?.responseLength === 'short') {
    lines.push('They prefer shorter, more concise responses.');
  }

  return lines.join('\n');
}

// Parse breakthrough tags from AI response
function parseBreakthroughs(response: string): Array<{ domain: string; summary: string }> {
  const breakthroughs: Array<{ domain: string; summary: string }> = [];
  const regex = /\[BREAKTHROUGH:\s*(\w+)\s*\|\s*([^\]]+)\]/gi;

  let match;
  while ((match = regex.exec(response)) !== null) {
    const domain = match[1].toLowerCase();
    const summary = match[2].trim();

    // Validate domain
    const validDomains = ['identity', 'purpose', 'mindset', 'relationships', 'vision', 'action', 'legacy'];
    if (validDomains.includes(domain)) {
      breakthroughs.push({ domain, summary });
    }
  }

  return breakthroughs;
}

// Clean breakthrough tags from response
function cleanResponse(response: string): string {
  return response.replace(/\[BREAKTHROUGH:[^\]]+\]/gi, '').trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, blob, chatHistory = [] } = body;

    // Decrypt or create sanctuary
    let sanctuary: SanctuaryData;
    let isNewUser = false;

    if (blob && typeof blob === 'string') {
      try {
        const decrypted = decryptSanctuary(blob);
        const validated = validateSanctuary(decrypted);
        sanctuary = validated || createEmptySanctuary();
      } catch (error) {
        console.error('[Sanctuary] Failed to decrypt blob:', error);
        // Invalid blob - start fresh
        sanctuary = createEmptySanctuary();
        isNewUser = true;
      }
    } else {
      // No blob - new user
      sanctuary = createEmptySanctuary();
      isNewUser = true;
    }

    // If empty message, just validate blob and return display data (no AI call)
    if (!message || message.trim() === '') {
      const updatedBlob = encryptSanctuary(sanctuary);
      const display = calculateDisplayData(sanctuary);
      return NextResponse.json({
        response: null,
        blob: updatedBlob,
        display,
        isNewUser,
        breakthroughCount: 0,
      });
    }

    // Build context
    const context = buildContext(sanctuary);
    const systemPrompt = MENTOR_SYSTEM_PROMPT.replace('{{CONTEXT}}', context);

    // Build messages for AI
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add chat history (last 10 messages)
    const recentHistory = chatHistory.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    // Call AI
    const ai = getAI();
    const completion = await ai.chat.completions.create({
      model: process.env.XAI_MODEL || 'grok-3',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || '';

    // Parse breakthroughs
    const breakthroughs = parseBreakthroughs(aiResponse);

    // Update sanctuary with new breakthroughs
    if (breakthroughs.length > 0) {
      for (const bt of breakthroughs) {
        // Add insight
        sanctuary.insights.push({
          id: crypto.randomUUID(),
          domain: bt.domain,
          summary: bt.summary,
          createdAt: Date.now(),
        });

        // Update resonance
        const domainKey = bt.domain as keyof typeof sanctuary.progression.resonance;
        if (sanctuary.progression.resonance[domainKey] !== undefined) {
          sanctuary.progression.resonance[domainKey] += 1;
        }

        // Update total breakthroughs
        sanctuary.progression.totalBreakthroughs += 1;
      }

      sanctuary.lastUpdated = Date.now();
    }

    // Clean the response
    const cleanedResponse = cleanResponse(aiResponse);

    // Re-encrypt sanctuary
    const updatedBlob = encryptSanctuary(sanctuary);

    // Calculate display data
    const display = calculateDisplayData(sanctuary);

    return NextResponse.json({
      response: cleanedResponse,
      blob: updatedBlob,
      display,
      isNewUser,
      breakthroughCount: breakthroughs.length,
    });
  } catch (error) {
    console.error('[Sanctuary Chat] Error:', error);

    // Return a graceful fallback
    return NextResponse.json({
      response: "I sense there's something on your mind. I'm here to listen whenever you're ready to share.",
      blob: null, // Don't update blob on error
      display: null,
      error: 'An error occurred',
    });
  }
}

// Create a new empty sanctuary (for first-time users)
export async function GET() {
  try {
    const sanctuary = createEmptySanctuary();
    const blob = encryptSanctuary(sanctuary);
    const display = calculateDisplayData(sanctuary);

    return NextResponse.json({
      blob,
      display,
      isNewUser: true,
    });
  } catch (error) {
    console.error('[Sanctuary] Error creating new sanctuary:', error);
    return NextResponse.json({ error: 'Failed to create sanctuary' }, { status: 500 });
  }
}
