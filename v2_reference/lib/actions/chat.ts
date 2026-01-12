'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, chatMessages, users, insights, systemPrompts, userProgress, curriculum, thoughts, mentoringSessions } from '@/lib/db';
import { eq, desc, and, sql } from 'drizzle-orm';
import { processArchitectTurn } from '@/lib/ai/architect';
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
  executeRecallInsight,
  executeSetHabit,
  executeCompleteHabit,
  executeSwitchView,
  executeUpdateUser,
  executeAssessMood,
  executeCheckConsistency,
  executeGenerateParable,
  executeSearchMemory,
  executeGetCurriculumContext,
  executeCompletePillar,
  executeSaveThought,
  executeDeleteAccount,
  executeResetJourney,
  executeGenesisStep1,
  executeGenesisStep2,
  executeGenesisStep3,
  executeGenesisComplete,
  executeIlluminateDomains
} from '@/lib/ai/tools/handlers';
import { buildSanctuaryPrompt } from '@/lib/ai/system-prompt';
import { encrypt, decrypt } from '@/lib/utils/encryption';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeResponse } from '@/lib/ai/filter';
import { streamText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createStreamableValue } from '@ai-sdk/rsc';

const DOMAINS = ['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy'];

/**
 * SOVEREIGN CHAT ACTION
 * This replaces the public API route. It is internal-only.
 * Updated for AI SDK v4 Patterns.
 */
export async function sendSanctuaryMessage(sessionId: number, message: string, timezone: string, mode: 'mentor' | 'architect' = 'mentor') {
  const t1 = Date.now();
  const session = await getServerSession(authOptions);

  if (sessionId !== 0 && !session) {
    throw new Error('Unauthorized');
  }

  const userId = session?.user?.id;
  const userRole = (session?.user as any)?.role;

  // 1. RATE LIMITING
  if (userId && userRole !== 'architect' && userRole !== 'admin') {
    const { success } = await rateLimit(userId);
    if (!success) {
      throw new Error('The Sanctuary needs a moment of silence.');
    }
  }

  // 2. BUILD PROMPT & CONTEXT
  let finalSystemPrompt = "You are a helpful mentor.";
  let currentUser: any = null;

  if (sessionId !== 0 && userId) {
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
        baseInstructions: dbPromptResult[0]?.content,
        currentPillar
      });
    }
  }

  // 3. LOG USER MESSAGE
  if (sessionId !== 0) {
    await db.insert(chatMessages).values({ sessionId, role: 'user', content: encrypt(message), createdAt: new Date() });
  }

  // 4. FETCH HISTORY
  const dbHistory = await db.query.chatMessages.findMany({
    where: (msgs, { eq: eqOp }) => eqOp(msgs.sessionId, sessionId),
    orderBy: (msgs, { asc }) => [asc(msgs.createdAt)],
    limit: 15,
  });
  const history = dbHistory.map(msg => ({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: decrypt(msg.content) }));

  const historyMessages: any[] = history.map(h => ({
    role: h.role,
    content: h.content
  }));

  // 5. STREAMING SETUP (Using createStreamableValue for compatibility with existing UI)
  // We keep the streamable value pattern but ensure it works with v4
  const stream = createStreamableValue('');

  (async () => {
    try {
      const result = await streamText({
        model: openai('gpt-4o'), // Defaulting to gpt-4o for stable v4 testing
        system: finalSystemPrompt,
        messages: [...historyMessages, { role: 'user', content: message }],
        onFinish: async (result) => {
          const t3 = Date.now();
          const cleanContent = sanitizeResponse(result.text);
          const toolResonance: string[] = [];
          
          // Capture tool resonance from tool calls if present
          result.toolCalls?.forEach(tc => {
            if (tc.toolName === 'illuminateDomains') {
              toolResonance.push(...((tc.args as any).domains || []));
            }
          });

          await db.insert(chatMessages).values({
            sessionId,
            role: 'assistant',
            content: encrypt(cleanContent),
            telemetry: { 
              processing_time_ms: t3 - t1, 
              resonance: toolResonance
            },
            createdAt: new Date()
          });
        }
      });

      for await (const textPart of result.textStream) {
        stream.update(textPart);
      }
      stream.done();
    } catch (e) {
      console.error("[Stream Error]:", e);
      stream.error(e);
    }
  })();

  return { output: stream.value };
}