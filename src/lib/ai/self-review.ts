/**
 * AI Mentor Self-Review System
 *
 * PII-FREE evaluation of mentor performance after sessions.
 * The AI reviews its own conversations, rating itself on key metrics.
 * CRITICAL: Observations must contain ZERO personal information.
 */

import { db } from '@/lib/db';
import { mentorReviews, chatMessages, mentoringSessions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// Types
export interface ReviewInput {
  sessionId: number;
  messages: { role: string; content: string }[];
  toolCalls: { name: string; domain?: string }[];
  currentDomain: string;
  curriculumStage: number;
}

export interface ReviewOutput {
  curriculumAdherence: number;      // 1-5
  empathyAppropriateness: number;   // 1-5
  breakthroughDetection: number;    // 1-5
  domainAccuracy: number;           // 1-5
  responseStructure: number;        // 1-5
  theologicalSoundness: number;     // 1-5
  overallScore: number;             // 0-100
  observations: string;             // PII-free summary
  toolUsage: Record<string, number>;
}

// Review prompt - emphasizes PII-free requirement
const REVIEW_SYSTEM_PROMPT = `You are reviewing a spiritual mentoring conversation between an AI Mentor and a user.
Your task is to evaluate the AI Mentor's performance objectively.

===== CRITICAL: PII-FREE REQUIREMENT =====
Your observations MUST contain ZERO personal information about the user.
- NO names, locations, jobs, relationships, dates, or identifying details
- NO quotes from the user's personal story
- ONLY describe behavioral patterns: "user was defensive", "mentor was too preachy"
- Focus on MENTOR behavior and technique, not user details
- If you accidentally include PII, the review will be rejected
===========================================

Rate each category from 1-5:

1. CURRICULUM ADHERENCE (1-5)
   - Did the mentor stay on topic for the current curriculum domain?
   - Did responses align with the user's stage in the 21-step curriculum?
   - 5 = Perfect alignment, 1 = Completely off-topic

2. EMPATHY APPROPRIATENESS (1-5)
   - Was the mentor's tone appropriate for the conversation?
   - Did it match the user's emotional state without being patronizing?
   - 5 = Perfect emotional attunement, 1 = Tone-deaf responses

3. BREAKTHROUGH DETECTION (1-5)
   - Were insights and breakthroughs correctly identified?
   - Did the mentor recognize when the user had genuine realizations?
   - 5 = All breakthroughs caught, 1 = Missed obvious insights

4. DOMAIN ACCURACY (1-5)
   - Were the correct life domains (Identity, Purpose, etc.) referenced?
   - Did resonance tags align with conversation content?
   - 5 = Perfect domain classification, 1 = Wrong domains assigned

5. RESPONSE STRUCTURE (1-5)
   - Were responses appropriately brief and focused?
   - Did the mentor ask one question at a time?
   - Did it avoid long monologues or multiple questions?
   - 5 = Perfect structure, 1 = Overwhelming responses

6. THEOLOGICAL SOUNDNESS (1-5)
   - Were responses aligned with Christian principles and the 7 Pillars?
   - Did the mentor avoid unbiblical or harmful advice?
   - 5 = Perfectly sound, 1 = Concerning theology

Provide your response in this exact JSON format:
{
  "curriculumAdherence": <1-5>,
  "empathyAppropriateness": <1-5>,
  "breakthroughDetection": <1-5>,
  "domainAccuracy": <1-5>,
  "responseStructure": <1-5>,
  "theologicalSoundness": <1-5>,
  "observations": "<2-3 sentences, PII-FREE, describing what the mentor could improve>"
}`;

/**
 * Perform a self-review of a mentoring session
 */
export async function reviewSession(input: ReviewInput): Promise<ReviewOutput | null> {
  const { sessionId, messages, toolCalls, currentDomain, curriculumStage } = input;

  // Prepare conversation for review (anonymize if needed)
  const conversationText = messages
    .map(m => `${m.role === 'user' ? 'User' : 'Mentor'}: ${m.content}`)
    .join('\n\n');

  // Count tool usage
  const toolUsage: Record<string, number> = {};
  for (const call of toolCalls) {
    toolUsage[call.name] = (toolUsage[call.name] || 0) + 1;
  }

  const userPrompt = `Review this spiritual mentoring conversation.

Current Domain: ${currentDomain}
Curriculum Stage: ${curriculumStage}/21
Tool Calls Made: ${JSON.stringify(toolUsage)}

=== CONVERSATION (Last ${messages.length} messages) ===
${conversationText}
=== END CONVERSATION ===

Remember: Your observations must be PII-FREE. Focus only on the mentor's technique and behavior patterns.
Provide your review in the JSON format specified.`;

  try {
    // Use a fast model for reviews (not the main mentor model)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://kingdomind.com',
      },
      body: JSON.stringify({
        model: 'google/gemini-flash-1.5', // Fast, cheap model for reviews
        messages: [
          { role: 'system', content: REVIEW_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for consistent ratings
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('[Self-Review] API error:', response.status);
      return null;
    }

    const data = await response.json();
    const reviewText = data.choices?.[0]?.message?.content;

    if (!reviewText) {
      console.error('[Self-Review] No content in response');
      return null;
    }

    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = reviewText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Self-Review] Could not parse JSON from response');
      return null;
    }

    const review = JSON.parse(jsonMatch[0]);

    // Calculate overall score (weighted average)
    const weights = {
      curriculumAdherence: 0.20,
      empathyAppropriateness: 0.20,
      breakthroughDetection: 0.15,
      domainAccuracy: 0.15,
      responseStructure: 0.15,
      theologicalSoundness: 0.15,
    };

    const overallScore = Math.round(
      (review.curriculumAdherence * weights.curriculumAdherence +
       review.empathyAppropriateness * weights.empathyAppropriateness +
       review.breakthroughDetection * weights.breakthroughDetection +
       review.domainAccuracy * weights.domainAccuracy +
       review.responseStructure * weights.responseStructure +
       review.theologicalSoundness * weights.theologicalSoundness) * 20 // Convert 1-5 to 0-100
    );

    // Save to database
    await db.insert(mentorReviews).values({
      sessionId,
      curriculumAdherence: review.curriculumAdherence,
      empathyAppropriateness: review.empathyAppropriateness,
      breakthroughDetection: review.breakthroughDetection,
      domainAccuracy: review.domainAccuracy,
      responseStructure: review.responseStructure,
      theologicalSoundness: review.theologicalSoundness,
      overallScore,
      observations: review.observations,
      toolUsage,
      messageCount: messages.length,
      modelUsed: 'google/gemini-flash-1.5',
    });

    console.log(`[Self-Review] Session ${sessionId} reviewed: ${overallScore}/100`);

    return {
      ...review,
      overallScore,
      toolUsage,
    };
  } catch (error) {
    console.error('[Self-Review] Error:', error);
    return null;
  }
}

/**
 * Get recent session data for review
 */
export async function getSessionForReview(sessionId: number): Promise<ReviewInput | null> {
  try {
    // Get session info
    const session = await db.query.mentoringSessions.findFirst({
      where: eq(mentoringSessions.id, sessionId),
    });

    if (!session) {
      console.error('[Self-Review] Session not found:', sessionId);
      return null;
    }

    // Get last 20 messages
    const messages = await db
      .select({
        role: chatMessages.role,
        content: chatMessages.content,
        telemetry: chatMessages.telemetry,
      })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(20);

    // Reverse to get chronological order
    messages.reverse();

    // Extract tool calls from telemetry
    const toolCalls: { name: string; domain?: string }[] = [];
    for (const msg of messages) {
      if (msg.telemetry && typeof msg.telemetry === 'object') {
        const telemetry = msg.telemetry as { toolCalls?: { name: string; domain?: string }[] };
        if (telemetry.toolCalls) {
          toolCalls.push(...telemetry.toolCalls);
        }
      }
    }

    // Get user's current domain from the session topic or default
    const currentDomain = session.topic || 'Identity';

    return {
      sessionId,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      toolCalls,
      currentDomain,
      curriculumStage: 1, // Would need to look up from user progress
    };
  } catch (error) {
    console.error('[Self-Review] Error getting session:', error);
    return null;
  }
}

/**
 * Check if a session needs review
 * - Session must have at least 5 messages
 * - Session must not already have a review
 */
export async function sessionNeedsReview(sessionId: number): Promise<boolean> {
  try {
    // Check if already reviewed
    const existingReview = await db.query.mentorReviews.findFirst({
      where: eq(mentorReviews.sessionId, sessionId),
    });

    if (existingReview) {
      return false;
    }

    // Check message count
    const messages = await db
      .select({ id: chatMessages.id })
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .limit(5);

    return messages.length >= 5;
  } catch (error) {
    console.error('[Self-Review] Error checking session:', error);
    return false;
  }
}

/**
 * Trigger review for a session (called after session ends or at checkpoints)
 */
export async function triggerSessionReview(sessionId: number): Promise<boolean> {
  console.log(`[Self-Review] Triggered for session ${sessionId}`);

  const needsReview = await sessionNeedsReview(sessionId);
  if (!needsReview) {
    console.log(`[Self-Review] Session ${sessionId} doesn't need review (already reviewed or too few messages)`);
    return false;
  }

  const input = await getSessionForReview(sessionId);
  if (!input) {
    console.log(`[Self-Review] Could not get session ${sessionId} for review`);
    return false;
  }

  const result = await reviewSession(input);
  return result !== null;
}
