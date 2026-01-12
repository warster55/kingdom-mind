'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, chatMessages, users, insights, systemPrompts, userProgress, curriculum, thoughts, mentoringSessions } from '@/lib/db';
import { eq, desc, and, sql } from 'drizzle-orm';
import { mentorTools } from '@/lib/ai/tools/definitions';
import { toolHandlers } from '@/lib/ai/tools/handlers';
import { buildSanctuaryPrompt } from '@/lib/ai/system-prompt';
import { encrypt, decrypt } from '@/lib/utils/encryption';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeResponse } from '@/lib/ai/filter';
import { xai } from '@/lib/ai/client'; // Import raw X.AI client
import { createStreamableValue } from '@ai-sdk/rsc';

const DOMAINS = ['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy'];

/**
 * SOVEREIGN CHAT ACTION - Direct X.AI Implementation
 */
export async function sendSanctuaryMessage(sessionId: number, message: string, timezone: string, mode: 'mentor' | 'architect' = 'mentor') {
  const t1 = Date.now();
  console.log('sendSanctuaryMessage: Starting (DIRECT X.AI)...');
  const session = await getServerSession(authOptions);

  if (sessionId !== 0 && !session) {
    throw new Error('Unauthorized');
  }

  const userId = session?.user?.id;
  const userRole = (session?.user as any)?.role;

  // 1. RATE LIMITING
  if (userId && userRole !== 'architect' && userRole !== 'admin') {
    const { success } = await rateLimit(userId);
    if (!success) throw new Error('The Sanctuary needs a moment of silence.');
  }

  // 2. SESSION MANAGEMENT
  let activeSessionId = sessionId;
  if (userId && (activeSessionId === 0 || !activeSessionId)) {
    const userIdInt = parseInt(userId);
    const existingSession = await db.select().from(mentoringSessions)
      .where(and(eq(mentoringSessions.userId, userIdInt), eq(mentoringSessions.status, 'active')))
      .orderBy(desc(mentoringSessions.startedAt))
      .limit(1);

    if (existingSession[0]) {
      activeSessionId = existingSession[0].id;
    } else {
      const [newSession] = await db.insert(mentoringSessions).values({
        userId: userIdInt,
        sessionNumber: 1,
        topic: 'General Mentoring',
        status: 'active',
        startedAt: new Date()
      }).returning({ id: mentoringSessions.id });
      activeSessionId = newSession.id;
    }
  }

  // 3. BUILD PROMPT & CONTEXT
  let finalSystemPrompt = "You are a helpful mentor.";
  let currentUser: any = null;

  if (userId) {
    const userResult = await db.select().from(users).where(eq(users.id, parseInt(userId))).limit(1);
    currentUser = userResult[0];

    if (currentUser) {
      const dbPromptResult = await db.select().from(systemPrompts).where(eq(systemPrompts.isActive, true)).orderBy(desc(systemPrompts.createdAt)).limit(1);
      const lastInsightResult = await db.select().from(insights).where(eq(insights.userId, currentUser.id)).orderBy(desc(insights.createdAt)).limit(1);
      
      const activeProgress = await db.select({
        pillar: curriculum.pillarName,
        truth: curriculum.keyTruth
      }).from(userProgress).innerJoin(curriculum, eq(userProgress.curriculumId, curriculum.id)).where(and(eq(userProgress.userId, currentUser.id), eq(userProgress.status, 'active'))).limit(1);

      const currentPillar = activeProgress[0] ? { name: activeProgress[0].pillar, truth: activeProgress[0].truth } : undefined;
      const userLocalTime = new Date().toLocaleString("en-US", { timeZone: timezone || currentUser.timezone || 'UTC', hour: 'numeric', minute: 'numeric', hour12: true, weekday: 'long' });

      const decryptedInsight = lastInsightResult[0]?.content ? decrypt(lastInsightResult[0].content) : undefined;

      finalSystemPrompt = await buildSanctuaryPrompt({
        userName: currentUser.name || "Seeker",
        userId: currentUser.id,
        currentDomain: currentUser.currentDomain,
        progress: Math.round(((DOMAINS.indexOf(currentUser.currentDomain) + 1) / DOMAINS.length) * 100),
        lastInsight: decryptedInsight,
        localTime: userLocalTime,
        hasCompletedOnboarding: currentUser.hasCompletedOnboarding,
        onboardingStage: currentUser.onboardingStage,
        currentPillar
      });
    }
  }

  // 4. LOG USER MESSAGE
  if (activeSessionId) {
    await db.insert(chatMessages).values({ sessionId: activeSessionId, role: 'user', content: encrypt(message), createdAt: new Date() });
  }

  // 5. FETCH HISTORY
  const dbHistory = await db.query.chatMessages.findMany({
    where: (msgs, { eq: eqOp }) => eqOp(msgs.sessionId, activeSessionId),
    orderBy: (msgs, { asc }) => [asc(msgs.createdAt)],
    limit: 15,
  });
  const historyMessages = dbHistory.map(msg => ({ role: (msg.role === 'assistant' ? 'assistant' : 'user') as "assistant" | "user" | "system", content: decrypt(msg.content) }));

  // 6. STREAMING SETUP
  const stream = createStreamableValue('');

  (async () => {
    try {
      console.log('sendSanctuaryMessage: Executing direct X.AI request...');
      
      const completion = await xai.chat.completions.create({
        model: process.env.XAI_MODEL || 'grok-3',
        messages: [
          { role: 'system', content: finalSystemPrompt },
          ...historyMessages,
          { role: 'user', content: message }
        ],
        stream: true,
      });

      let fullContent = '';
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          stream.update(content);
        }
      }

      console.log('sendSanctuaryMessage: Direct stream finished.');
      const cleanContent = sanitizeResponse(fullContent);
      
      await db.insert(chatMessages).values({
        sessionId: activeSessionId,
        role: 'assistant',
        content: encrypt(cleanContent),
        telemetry: { processing_time_ms: Date.now() - t1, resonance: [] },
        createdAt: new Date()
      });

      stream.done();
    } catch (e) {
      console.error("[Direct Stream Error]:", e);
      stream.error(e);
    }
  })();

  return { output: stream.value };
}