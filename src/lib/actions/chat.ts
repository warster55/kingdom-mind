'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { db, chatMessages, users, insights, userProgress, curriculum, mentoringSessions } from '@/lib/db';
import { eq, desc, and } from 'drizzle-orm';
import { buildSanctuaryPrompt } from '@/lib/ai/system-prompt';
import { encrypt, decrypt } from '@/lib/utils/encryption';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeResponse } from '@/lib/ai/filter';
import { xai } from '@/lib/ai/client';
import { createStreamableValue } from '@ai-sdk/rsc';
import { mentorTools, executeTool } from '@/lib/ai/tools/mentor-tools';
import { getAllMentorConfig } from '@/lib/config/mentor-config';
import { triggerSessionReview } from '@/lib/ai/self-review';

const DOMAINS = ['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy'];

/**
 * SOVEREIGN CHAT ACTION - Direct X.AI Implementation
 */
export async function sendSanctuaryMessage(sessionId: number, message: string, timezone: string) {
  const t1 = Date.now();
  console.log('sendSanctuaryMessage: Starting...');
  const session = await getServerSession(authOptions);

  if (sessionId !== 0 && !session) {
    throw new Error('Unauthorized');
  }

  const userId = session?.user?.id;

  // 1. RATE LIMITING
  if (userId) {
    const { success } = await rateLimit(userId);
    if (!success) throw new Error('The Sanctuary needs a moment of silence.');
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

  // 3. BUILD PROMPT & CONTEXT (Database-Driven Configuration)
  let finalSystemPrompt = "You are a helpful mentor.";
  interface UserRecord {
    id: number;
    name: string | null;
    timezone: string | null;
    currentDomain: string;
    resonanceIdentity: number;
    resonancePurpose: number;
    resonanceMindset: number;
    resonanceRelationships: number;
    resonanceVision: number;
    resonanceAction: number;
    resonanceLegacy: number;
    hasCompletedOnboarding: boolean;
    onboardingStage: number;
    createdAt: Date;
  }
  let currentUser: UserRecord | null = null;

  // Fetch all mentor config values at once
  const config = await getAllMentorConfig();

  if (userId) {
    const userResult = await db.select().from(users).where(eq(users.id, parseInt(userId))).limit(1);
    currentUser = userResult[0];

    if (currentUser) {
      // MEMORY SYSTEM v8.0: Fetch PII-free insight memories
      // Content is now guaranteed PII-free (AI strips PII before recording)
      const recentInsights = await db.select({
        domain: insights.domain,
        content: insights.content,
        createdAt: insights.createdAt
      }).from(insights)
        .where(eq(insights.userId, currentUser.id))
        .orderBy(desc(insights.createdAt))
        .limit(config.insight_depth);

      // Decrypt PII-free memories for AI context
      const insightMemories = recentInsights.map(i => ({
        domain: i.domain,
        memory: decrypt(i.content),
        createdAt: i.createdAt
      }));

      // Get current pillar
      const activeProgress = await db.select({
        pillar: curriculum.pillarName,
        truth: curriculum.keyTruth,
        verse: curriculum.coreVerse,
        description: curriculum.description
      }).from(userProgress)
        .innerJoin(curriculum, eq(userProgress.curriculumId, curriculum.id))
        .where(and(eq(userProgress.userId, currentUser.id), eq(userProgress.status, 'active')))
        .limit(1);

      const currentPillar = activeProgress[0] ? {
        name: activeProgress[0].pillar,
        truth: activeProgress[0].truth,
        verse: activeProgress[0].verse || '',
        description: activeProgress[0].description
      } : undefined;

      // PRIVACY: Get completed curriculum COUNT by domain only - no truth content
      const completedCurriculumStats: Record<string, number> = {};
      if (config.include_completed_curriculum) {
        const completed = await db.select({
          domain: curriculum.domain
        }).from(userProgress)
          .innerJoin(curriculum, eq(userProgress.curriculumId, curriculum.id))
          .where(and(eq(userProgress.userId, currentUser.id), eq(userProgress.status, 'completed')));

        // Count completions per domain
        for (const item of completed) {
          completedCurriculumStats[item.domain] = (completedCurriculumStats[item.domain] || 0) + 1;
        }
      }

      // Build resonance scores object (configurable)
      let resonanceScores: Record<string, number> | undefined;
      if (config.include_resonance_scores) {
        resonanceScores = {
          Identity: currentUser.resonanceIdentity,
          Purpose: currentUser.resonancePurpose,
          Mindset: currentUser.resonanceMindset,
          Relationships: currentUser.resonanceRelationships,
          Vision: currentUser.resonanceVision,
          Action: currentUser.resonanceAction,
          Legacy: currentUser.resonanceLegacy,
        };
      }

      const userLocalTime = new Date().toLocaleString("en-US", {
        timeZone: timezone || currentUser.timezone || 'UTC',
        hour: 'numeric', minute: 'numeric', hour12: true, weekday: 'long'
      });

      // Calculate days since first session
      const daysSinceJoined = Math.floor((Date.now() - new Date(currentUser.createdAt).getTime()) / (1000 * 60 * 60 * 24));

      finalSystemPrompt = await buildSanctuaryPrompt({
        userName: currentUser.name || "Seeker",
        userId: currentUser.id,
        currentDomain: currentUser.currentDomain,
        progress: Math.round(((DOMAINS.indexOf(currentUser.currentDomain) + 1) / DOMAINS.length) * 100),
        insightMemories,  // MEMORY v8.0: PII-free memories for context
        localTime: userLocalTime,
        hasCompletedOnboarding: currentUser.hasCompletedOnboarding,
        onboardingStage: currentUser.onboardingStage,
        currentPillar,
        resonanceScores,
        completedCurriculumStats,
        daysSinceJoined,
        onboardingEnabled: config.onboarding_enabled,
      });
    }
  }

  // 4. LOG USER MESSAGE
  if (activeSessionId) {
    await db.insert(chatMessages).values({ sessionId: activeSessionId, role: 'user', content: encrypt(message), createdAt: new Date() });
  }

  // 5. FETCH HISTORY (Configurable Depth)
  const dbHistory = await db.query.chatMessages.findMany({
    where: (msgs, { eq: eqOp }) => eqOp(msgs.sessionId, activeSessionId),
    orderBy: (msgs, { asc }) => [asc(msgs.createdAt)],
    limit: config.chat_history_limit,
  });
  const historyMessages = dbHistory.map(msg => ({ role: (msg.role === 'assistant' ? 'assistant' : 'user') as "assistant" | "user" | "system", content: decrypt(msg.content) }));

  // 6. STREAMING SETUP WITH TOOL CALLING
  const stream = createStreamableValue('');
  interface ClientAction {
    type: string;
    domains?: string[];
    domain?: string;
    insight?: string;
  }
  const clientActionsStream = createStreamableValue<ClientAction[]>([]);

  (async () => {
    try {
      console.log('sendSanctuaryMessage: Executing X.AI request with tools...');

      const modelId = process.env.XAI_CHAT_MODEL || 'grok-4-1-fast-non-reasoning';
      const userIdInt = userId ? parseInt(userId) : 0;

      // First API call with tools
      const completion = await xai.chat.completions.create({
        model: modelId,
        messages: [
          { role: 'system', content: finalSystemPrompt },
          ...historyMessages,
          { role: 'user', content: message }
        ],
        tools: mentorTools,
        tool_choice: 'auto',
        stream: true,
        stream_options: { include_usage: true },
      });

      let fullContent = '';
      let usageData = { prompt_tokens: 0, completion_tokens: 0 };
      const toolCalls: Array<{ id: string; name: string; arguments: string }> = [];
      const clientActions: ClientAction[] = [];
      const resonanceLog: string[] = [];

      // Process the stream
      for await (const chunk of completion) {
        const delta = chunk.choices[0]?.delta;

        // Handle text content
        if (delta?.content) {
          fullContent += delta.content;
          stream.update(delta.content);
        }

        // Handle tool calls
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (tc.index !== undefined) {
              if (!toolCalls[tc.index]) {
                toolCalls[tc.index] = { id: tc.id || '', name: '', arguments: '' };
              }
              if (tc.id) toolCalls[tc.index].id = tc.id;
              if (tc.function?.name) toolCalls[tc.index].name = tc.function.name;
              if (tc.function?.arguments) toolCalls[tc.index].arguments += tc.function.arguments;
            }
          }
        }

        if (chunk.usage) {
          usageData = chunk.usage;
        }
      }

      // Execute tool calls and collect client actions
      for (const tc of toolCalls) {
        if (tc.name) {
          try {
            const args = JSON.parse(tc.arguments || '{}');
            const result = await executeTool(tc.name, args, userIdInt);

            if (result.clientAction) {
              clientActions.push(result.clientAction);

              // Track resonance for telemetry
              if (result.clientAction.type === 'illuminate' && result.clientAction.domains) {
                resonanceLog.push(...result.clientAction.domains);
              }
            }

            console.log(`[Tool] ${tc.name} executed:`, result.result);
          } catch (e) {
            console.error(`[Tool] Error parsing/executing ${tc.name}:`, e);
          }
        }
      }

      // If we got tool calls but no content, we may need a follow-up call
      // This handles the non-reasoning model behavior
      if (toolCalls.length > 0 && !fullContent.trim()) {
        console.log('sendSanctuaryMessage: Got tools but no content, making follow-up call...');

        // Build tool results for the follow-up
        const toolResultMessages = toolCalls.map(tc => ({
          role: 'tool' as const,
          tool_call_id: tc.id,
          content: 'Action completed successfully.'
        }));

        const followUp = await xai.chat.completions.create({
          model: modelId,
          messages: [
            { role: 'system', content: finalSystemPrompt },
            ...historyMessages,
            { role: 'user', content: message },
            {
              role: 'assistant',
              content: null,
              tool_calls: toolCalls.map(tc => ({
                id: tc.id,
                type: 'function' as const,
                function: { name: tc.name, arguments: tc.arguments }
              }))
            },
            ...toolResultMessages
          ],
          stream: true,
          stream_options: { include_usage: true },
        });

        for await (const chunk of followUp) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            stream.update(content);
          }
          if (chunk.usage) {
            usageData.prompt_tokens += chunk.usage.prompt_tokens || 0;
            usageData.completion_tokens += chunk.usage.completion_tokens || 0;
          }
        }
      }

      // Send client actions
      if (clientActions.length > 0) {
        clientActionsStream.update(clientActions);
      }
      clientActionsStream.done();

      console.log('sendSanctuaryMessage: Stream finished.', { usageData, toolCalls: toolCalls.length, clientActions: clientActions.length });
      const cleanContent = sanitizeResponse(fullContent);

      // Calculate Cost (Grok 4.1 Fast Pricing)
      const costInput = (usageData.prompt_tokens / 1_000_000) * 0.20;
      const costOutput = (usageData.completion_tokens / 1_000_000) * 0.50;
      const totalCost = costInput + costOutput;

      await db.insert(chatMessages).values({
        sessionId: activeSessionId,
        role: 'assistant',
        content: encrypt(cleanContent),
        telemetry: { processing_time_ms: Date.now() - t1, resonance: resonanceLog, tool_calls: toolCalls.length },
        costMetadata: {
          model: modelId,
          prompt_tokens: usageData.prompt_tokens,
          completion_tokens: usageData.completion_tokens,
          cost_usd: totalCost
        },
        createdAt: new Date()
      });

      // Self-Review Trigger: Check for review milestone (every 10 messages)
      // Non-blocking background check
      if (activeSessionId) {
        const messageCount = dbHistory.length + 2; // +2 for this user+assistant pair
        if (messageCount % 10 === 0 && messageCount >= 10) {
          console.log(`[Self-Review] Milestone reached (${messageCount} messages), triggering review...`);
          // Fire and forget - don't await to keep response fast
          triggerSessionReview(activeSessionId).catch(err =>
            console.error('[Self-Review] Background trigger failed:', err)
          );
        }
      }

      stream.done();
    } catch (e) {
      console.error("[Stream Error]:", e);
      clientActionsStream.done();
      stream.error(e);
    }
  })();

  return { output: stream.value, clientActions: clientActionsStream.value };
}