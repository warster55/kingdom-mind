'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, chatMessages, users, insights, systemPrompts, userProgress, curriculum, thoughts, mentoringSessions } from '@/lib/db';
import { eq, desc, and, sql } from 'drizzle-orm';
import { buildSanctuaryPrompt } from '@/lib/ai/system-prompt';
import { encrypt, decrypt } from '@/lib/utils/encryption';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeResponse } from '@/lib/ai/filter';
import { xai } from '@/lib/ai/client'; // Import raw X.AI client
import { createStreamableValue } from '@ai-sdk/rsc';

const DOMAINS = ['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy'];

import { processArchitectTurn } from '@/lib/ai/architect';

/**
 * SOVEREIGN CHAT ACTION - Direct X.AI Implementation
 */
export async function sendSanctuaryMessage(sessionId: number, message: string, timezone: string, mode: 'mentor' | 'architect' = 'mentor') {
  const t1 = Date.now();
  console.log(`sendSanctuaryMessage: Starting (${mode.toUpperCase()})...`);
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

  // --- ARCHITECT MODE BRANCH ---
  if (mode === 'architect') {
    if (userRole !== 'architect' && userRole !== 'admin') {
      throw new Error('Sovereign Access Required.');
    }

    const stream = createStreamableValue('');
    
    // We need to wrap the ReadableStream from processArchitectTurn into the AI SDK stream
    (async () => {
      try {
        const underlyingStream = new ReadableStream({
          async start(controller) {
            await processArchitectTurn(message, controller);
            controller.close();
          }
        });

        const reader = underlyingStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          stream.update(new TextDecoder().decode(value));
        }
        stream.done();
      } catch (e) {
        console.error('[Architect Error]:', e);
        stream.error(e);
      }
    })();

    return { output: stream.value };
  }

  // 2. SESSION MANAGEMENT (Standard Mentor Flow)
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
        truth: curriculum.keyTruth,
        verse: curriculum.coreVerse,
        description: curriculum.description
      }).from(userProgress).innerJoin(curriculum, eq(userProgress.curriculumId, curriculum.id)).where(and(eq(userProgress.userId, currentUser.id), eq(userProgress.status, 'active'))).limit(1);

      const currentPillar = activeProgress[0] ? { 
        name: activeProgress[0].pillar, 
        truth: activeProgress[0].truth,
        verse: activeProgress[0].verse || '',
        description: activeProgress[0].description
      } : undefined;
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
      
      const modelId = process.env.XAI_CHAT_MODEL || 'grok-4-1-fast-non-reasoning';
      const completion = await xai.chat.completions.create({
        model: modelId,
        messages: [
          { role: 'system', content: finalSystemPrompt },
          ...historyMessages,
          { role: 'user', content: message }
        ],
        stream: true,
        stream_options: { include_usage: true }, // Ensure usage is sent
      });

      let fullContent = '';
      let usageData = { prompt_tokens: 0, completion_tokens: 0 };

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          stream.update(content);
        }
        if (chunk.usage) {
          usageData = chunk.usage;
        }
      }

      console.log('sendSanctuaryMessage: Direct stream finished.', usageData);
      const cleanContent = sanitizeResponse(fullContent);
      
      // --- BREAKTHROUGH STAR LOGIC ---
      // Parse [RESONANCE: Domain] tags and update DB
      const resonanceRegex = /\[RESONANCE:\s*(\w+)\]/g;
      const resonanceMatches = [...fullContent.matchAll(resonanceRegex)];
      const uniqueResonances = [...new Set(resonanceMatches.map(m => m[1]))]; // De-dupe

      const resonanceLog: string[] = [];

      if (userId && uniqueResonances.length > 0) {
        for (const domain of uniqueResonances) {
          if (DOMAINS.includes(domain)) {
            console.log(`🌟 BREAKTHROUGH DETECTED: ${domain}`);
            resonanceLog.push(domain);
            
            // Explicit updates for safety
            if (domain === 'Identity') {
              await db.update(users).set({ resonanceIdentity: sql`${users.resonanceIdentity} + 1` }).where(eq(users.id, parseInt(userId)));
            } else if (domain === 'Purpose') {
              await db.update(users).set({ resonancePurpose: sql`${users.resonancePurpose} + 1` }).where(eq(users.id, parseInt(userId)));
            } else if (domain === 'Mindset') {
              await db.update(users).set({ resonanceMindset: sql`${users.resonanceMindset} + 1` }).where(eq(users.id, parseInt(userId)));
            } else if (domain === 'Relationships') {
              await db.update(users).set({ resonanceRelationships: sql`${users.resonanceRelationships} + 1` }).where(eq(users.id, parseInt(userId)));
            } else if (domain === 'Vision') {
              await db.update(users).set({ resonanceVision: sql`${users.resonanceVision} + 1` }).where(eq(users.id, parseInt(userId)));
            } else if (domain === 'Action') {
              await db.update(users).set({ resonanceAction: sql`${users.resonanceAction} + 1` }).where(eq(users.id, parseInt(userId)));
            } else if (domain === 'Legacy') {
              await db.update(users).set({ resonanceLegacy: sql`${users.resonanceLegacy} + 1` }).where(eq(users.id, parseInt(userId)));
            }
          }
        }
      }

      // Calculate Cost (Grok 4.1 Fast Pricing)
      // Input: $0.20/1M, Output: $0.50/1M
      const costInput = (usageData.prompt_tokens / 1_000_000) * 0.20;
      const costOutput = (usageData.completion_tokens / 1_000_000) * 0.50;
      const totalCost = costInput + costOutput;

      await db.insert(chatMessages).values({
        sessionId: activeSessionId,
        role: 'assistant',
        content: encrypt(cleanContent),
        telemetry: { processing_time_ms: Date.now() - t1, resonance: resonanceLog },
        costMetadata: {
          model: modelId,
          prompt_tokens: usageData.prompt_tokens,
          completion_tokens: usageData.completion_tokens,
          cost_usd: totalCost
        },
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